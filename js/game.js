// game.js - 游戏核心逻辑
class Game {
    constructor() {
        // Three.js 核心
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = null;

        // 游戏系统
        this.gameMap = null;
        this.bulletManager = null;
        this.collisionSystem = null;
        this.effectsManager = null;
        this.powerupManager = null;
        this.audioManager = null;
        this.uiManager = null;
        this.enemySpawner = null;

        // 游戏状态
        this.state = 'menu';
        this.currentLevel = 0;
        this.score = 0;
        this.kills = 0;
        this.playerLives = 3;

        // 实体
        this.playerTank = null;
        this.enemyTanks = [];
        this.enemyAIs = [];

        // 输入
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        this.raycaster = new THREE.Raycaster();
        this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

        // 相机参数
        this.cameraOffset = new THREE.Vector3(0, 12, 12);
        this.cameraLookOffset = new THREE.Vector3(0, 0, -5);
        this.cameraSmoothing = 4;

        // 玩家出生点
        this.playerSpawnPos = { x: 0, z: 0 };

        // 弹道预测线
        this.trajectoryLine = null;
        this.trajectoryImpact = null;
    }

    init() {
        // 场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 40, 90);

        // 相机
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 150);
        this.camera.position.set(0, 15, 15);

        // 渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);

        // 时钟
        this.clock = new THREE.Clock();

        // 光照
        this.setupLights();

        // 初始化系统
        this.audioManager = new AudioManager();
        this.uiManager = new UIManager();
        this.gameMap = new GameMap(this.scene);
        this.bulletManager = new BulletManager(this.scene);
        this.collisionSystem = new CollisionSystem(this.gameMap);
        this.effectsManager = new EffectsManager(this.scene);
        this.powerupManager = new PowerUpManager(this.scene);
        this.enemySpawner = new EnemySpawner();

        // 弹道预测线
        const trajGeo = new THREE.BufferGeometry();
        trajGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(100 * 3), 3));
        this.trajectoryLine = new THREE.Line(trajGeo, new THREE.LineDashedMaterial({
            color: 0x00ff88, transparent: true, opacity: 0.6,
            dashSize: 0.8, gapSize: 0.4
        }));
        this.trajectoryLine.visible = false;
        this.trajectoryLine.frustumCulled = false;
        this.scene.add(this.trajectoryLine);

        const impactGeo = new THREE.SphereGeometry(0.25, 8, 6);
        this.trajectoryImpact = new THREE.Mesh(impactGeo, new THREE.MeshBasicMaterial({
            color: 0xff3344, transparent: true, opacity: 0.7
        }));
        this.trajectoryImpact.visible = false;
        this.scene.add(this.trajectoryImpact);

        // 事件监听
        this.setupInputListeners();
        this.setupUIListeners();

        // 窗口resize
        window.addEventListener('resize', () => this.onResize());

        // 显示开始界面
        this.uiManager.showStartScreen();

        // 启动渲染循环
        this.animate();
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(15, 25, 15);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 100;
        dirLight.shadow.camera.left = -45;
        dirLight.shadow.camera.right = 45;
        dirLight.shadow.camera.top = 45;
        dirLight.shadow.camera.bottom = -45;
        this.scene.add(dirLight);

        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x3a5a3a, 0.3);
        this.scene.add(hemiLight);
    }

    setupInputListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Escape') {
                if (this.state === 'playing') {
                    this.pauseGame();
                } else if (this.state === 'paused') {
                    this.resumeGame();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        document.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        document.addEventListener('click', () => {
            this.audioManager.init();
            this.audioManager.resume();
        }, { once: false });
    }

    setupUIListeners() {
        document.getElementById('start-btn').addEventListener('click', () => {
            this.audioManager.init();
            this.audioManager.resume();
            this.startGame();
        });

        document.getElementById('resume-btn').addEventListener('click', () => {
            this.resumeGame();
        });

        document.getElementById('restart-btn-pause').addEventListener('click', () => {
            this.restartGame();
        });

        document.getElementById('restart-btn-over').addEventListener('click', () => {
            this.restartGame();
        });
    }

    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.kills = 0;
        this.playerLives = 3;
        this.currentLevel = 0;
        this.loadLevel(this.currentLevel);
    }

    loadLevel(levelIndex) {
        // 清理
        this.clearEntities();

        // 加载地图（地形 + 障碍物）
        const levelData = this.gameMap.loadLevel(levelIndex);

        // 玩家出生位置（从关卡数据获取）
        this.playerSpawnPos = levelData.playerSpawn;

        // 创建玩家坦克
        this.playerTank = new Tank(this.scene, {
            type: 'player',
            hp: 1,
            speed: 5,
            rotSpeed: 3,
            color: 0x4a7c59,
            shootCooldown: 0.4,
            terrain: this.gameMap.terrain
        });
        this.playerTank.setPosition(this.playerSpawnPos.x, this.playerSpawnPos.z);

        // 初始化敌人生成器
        this.enemySpawner.init(levelData);

        // 更新UI
        this.uiManager.showGameHud();
        this.uiManager.updateScore(this.score);
        this.uiManager.updateLevel(levelIndex + 1);
        this.uiManager.updateLives(this.playerLives);
        this.updateEnemyCount();

        // 显示关卡过渡
        this.uiManager.showLevelScreen(levelData.name, levelData.desc);
        this.state = 'levelTransition';
        setTimeout(() => {
            this.uiManager.hideLevelScreen();
            this.uiManager.showGameHud();
            this.state = 'playing';
        }, 2000);
    }

    clearEntities() {
        if (this.playerTank) {
            this.playerTank.destroy();
            this.playerTank = null;
        }
        this.enemyTanks.forEach(e => e.destroy());
        this.enemyTanks = [];
        this.enemyAIs = [];
        this.bulletManager.clear();
        this.effectsManager.clear();
        this.powerupManager.clear();
    }

    spawnEnemy(type, candidates) {
        let options = {};
        switch (type) {
            case 'normal':
                options = { type: 'normal', hp: 1, speed: 3, rotSpeed: 2, color: 0x888888, shootCooldown: 1.5 };
                break;
            case 'elite':
                options = { type: 'elite', hp: 1, speed: 5, rotSpeed: 3, color: 0xcc3333, shootCooldown: 1.0 };
                break;
            case 'heavy':
                options = { type: 'heavy', hp: 2, speed: 2.5, rotSpeed: 1.5, color: 0x991111, shootCooldown: 2.0 };
                break;
        }
        options.terrain = this.gameMap.terrain;

        const allTanks = [this.playerTank, ...this.enemyTanks].filter(t => t && t.alive);

        for (const position of candidates) {
            const enemy = new Tank(this.scene, options);
            enemy.setPosition(position.x, position.z);

            if (this.collisionSystem.canTankMoveTo(enemy, enemy.getPosition(), allTanks)) {
                this.enemyTanks.push(enemy);
                this.enemyAIs.push(new EnemyAI());
                this.enemySpawner.confirmSpawn();
                return;
            }
            enemy.destroy();
        }
    }

    updateEnemyCount() {
        const alive = this.enemyTanks.filter(e => e.alive).length;
        const remaining = this.enemySpawner.getRemainingCount();
        this.uiManager.updateEnemies(alive + remaining);
    }

    pauseGame() {
        if (this.state !== 'playing') return;
        this.state = 'paused';
        this.uiManager.showPauseScreen();
    }

    resumeGame() {
        if (this.state !== 'paused') return;
        this.state = 'playing';
        this.uiManager.hidePauseScreen();
        this.clock.getDelta();
    }

    restartGame() {
        this.gameMap.clear();
        this.clearEntities();
        this.uiManager.hidePauseScreen();
        this.startGame();
    }

    gameOver(won) {
        this.state = 'gameover';
        if (won) {
            this.audioManager.playLevelComplete();
        } else {
            this.audioManager.playGameOver();
        }
        this.uiManager.showGameOver(won, this.score, this.kills);
    }

    nextLevel() {
        this.currentLevel++;
        if (this.currentLevel >= LEVEL_DATA.length) {
            this.gameOver(true);
        } else {
            this.audioManager.playLevelComplete();
            this.gameMap.clear();
            this.loadLevel(this.currentLevel);
        }
    }

    // ====== 游戏主循环 ======
    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = Math.min(this.clock.getDelta(), 0.05);

        if (this.state === 'playing') {
            this.updatePlayerInput(deltaTime);
            this.updateEnemies(deltaTime);
            this.updateBullets(deltaTime);
            this.updatePowerups(deltaTime);
            this.updateCamera(deltaTime);
            this.checkWinCondition();
        }

        // 非游戏状态隐藏弹道线
        if (this.state !== 'playing') {
            if (this.trajectoryLine) this.trajectoryLine.visible = false;
            if (this.trajectoryImpact) this.trajectoryImpact.visible = false;
        }

        this.effectsManager.update(deltaTime);
        this.renderer.render(this.scene, this.camera);
    }

    updatePlayerInput(deltaTime) {
        if (!this.playerTank || !this.playerTank.alive) {
            if (this.trajectoryLine) this.trajectoryLine.visible = false;
            if (this.trajectoryImpact) this.trajectoryImpact.visible = false;
            return;
        }

        this.playerTank.update(deltaTime);

        const allTanks = [this.playerTank, ...this.enemyTanks];

        // 移动
        let forward = 0;
        if (this.keys['KeyW'] || this.keys['ArrowUp']) forward = 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) forward = -1;

        if (forward !== 0) {
            const newPos = this.playerTank.calcMovePosition(forward, deltaTime);
            if (this.collisionSystem.canTankMoveTo(this.playerTank, newPos, allTanks)) {
                this.playerTank.applyPosition(newPos);
            }
        }

        // 旋转
        let rotDir = 0;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) rotDir = 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) rotDir = -1;
        if (rotDir !== 0) {
            this.playerTank.rotate(rotDir, deltaTime);
        }

        // 鼠标控制炮塔（动态地面高度）
        const tankPos = this.playerTank.getPosition();
        this.groundPlane.constant = -tankPos.y;
        this.raycaster.setFromCamera(new THREE.Vector2(this.mouse.x, this.mouse.y), this.camera);
        const intersectPoint = new THREE.Vector3();
        if (this.raycaster.ray.intersectPlane(this.groundPlane, intersectPoint)) {
            const angle = Math.atan2(-(intersectPoint.x - tankPos.x), -(intersectPoint.z - tankPos.z));
            this.playerTank.setTurretRotation(angle);
        }

        // 更新弹道预测线
        this._updateTrajectory();

        // 射击
        if (this.keys['Space'] && this.playerTank.canShoot()) {
            this.playerTank.resetShootCooldown();
            const pos = this.playerTank.getBarrelTipPosition();
            const dir = this.playerTank.getShootDirection();
            this.bulletManager.shoot(pos, dir, 'player');
            this.effectsManager.createMuzzleFlash(pos);
            this.audioManager.playShoot();
        }
    }

    updateEnemies(deltaTime) {
        const aliveCount = this.enemyTanks.filter(e => e.alive).length;
        const spawnResult = this.enemySpawner.update(deltaTime, aliveCount, this.gameMap.spawnPoints);
        if (spawnResult) {
            this.spawnEnemy(spawnResult.type, spawnResult.candidates);
        }

        const allTanks = [this.playerTank, ...this.enemyTanks];
        for (let i = 0; i < this.enemyTanks.length; i++) {
            const enemy = this.enemyTanks[i];
            if (!enemy.alive) continue;

            enemy.update(deltaTime);

            const ai = this.enemyAIs[i];
            if (!ai) continue;

            const action = ai.update(
                enemy,
                this.playerTank,
                this.gameMap.baseMeshes,
                this.collisionSystem,
                allTanks,
                deltaTime
            );

            if (action === 'shoot' && enemy.canShoot()) {
                enemy.resetShootCooldown();
                const pos = enemy.getBarrelTipPosition();
                const dir = enemy.getShootDirection();
                this.bulletManager.shoot(pos, dir, 'enemy');
                this.effectsManager.createMuzzleFlash(pos);
                this.audioManager.playShoot();
            }
        }

        this.updateEnemyCount();
    }

    updateBullets(deltaTime) {
        this.bulletManager.update(deltaTime);

        for (const bullet of this.bulletManager.bullets) {
            if (!bullet.alive) continue;

            const result = this.collisionSystem.checkBulletCollisions(
                bullet, this.playerTank, this.enemyTanks,
                this.effectsManager, this.audioManager, this
            );

            if (result) {
                switch (result.type) {
                    case 'enemy_killed':
                        this.score += result.enemy.type === 'heavy' ? 200 : result.enemy.type === 'elite' ? 150 : 100;
                        this.kills++;
                        this.uiManager.updateScore(this.score);
                        this.powerupManager.trySpawnAt(result.deathPos);
                        break;
                    case 'enemy_hit':
                        this.effectsManager.createHitFlash(result.enemy);
                        this.score += 10;
                        this.uiManager.updateScore(this.score);
                        break;
                    case 'player_killed':
                        this.onPlayerDeath();
                        break;
                    case 'player_hit':
                        this.effectsManager.createHitFlash(this.playerTank);
                        break;
                    case 'base':
                        this.gameOver(false);
                        break;
                }
            }
        }
    }

    onPlayerDeath() {
        this.playerLives--;
        this.uiManager.updateLives(this.playerLives);

        if (this.playerLives <= 0) {
            this.gameOver(false);
        } else {
            this.playerTank.destroy();
            this.playerTank = new Tank(this.scene, {
                type: 'player',
                hp: 1,
                speed: 5,
                rotSpeed: 3,
                color: 0x4a7c59,
                shootCooldown: 0.4,
                terrain: this.gameMap.terrain
            });
            this.playerTank.setPosition(this.playerSpawnPos.x, this.playerSpawnPos.z);
            this.playerTank.activateShield(2);
        }
    }

    updatePowerups(deltaTime) {
        this.powerupManager.update(deltaTime);

        if (!this.playerTank || !this.playerTank.alive) return;

        const pickup = this.powerupManager.checkPickup(this.playerTank);
        if (pickup) {
            this.audioManager.playPowerup();
            switch (pickup) {
                case 'speed':
                    this.playerTank.activateSpeedBoost(5);
                    this.uiManager.showPowerupText('加速！', '#ffdd00');
                    setTimeout(() => this.uiManager.hidePowerupText(), 5000);
                    break;
                case 'shield':
                    this.playerTank.activateShield(3);
                    this.uiManager.showPowerupText('护盾！', '#4488ff');
                    setTimeout(() => this.uiManager.hidePowerupText(), 3000);
                    break;
                case 'bomb':
                    this.uiManager.showPowerupText('全屏炸弹！', '#ff3333');
                    setTimeout(() => this.uiManager.hidePowerupText(), 2000);
                    this.enemyTanks.forEach(enemy => {
                        if (enemy.alive) {
                            this.effectsManager.createExplosion(enemy.getPosition(), 'medium');
                            this.audioManager.playExplosion();
                            this.score += 100;
                            this.kills++;
                            enemy.destroy();
                        }
                    });
                    this.uiManager.updateScore(this.score);
                    break;
            }
        }
    }

    updateCamera(deltaTime) {
        if (!this.playerTank) return;
        const tankPos = this.playerTank.getPosition();
        const tankRot = this.playerTank.getRotation();

        // 相机目标位置（坦克后上方）
        const camTargetX = tankPos.x + Math.sin(tankRot) * this.cameraOffset.z;
        const camTargetZ = tankPos.z + Math.cos(tankRot) * this.cameraOffset.z;

        // 相机Y：确保在地形之上
        let camTerrainH = 0;
        if (this.gameMap && this.gameMap.terrain) {
            camTerrainH = this.gameMap.terrain.getHeightAt(camTargetX, camTargetZ);
        }
        const camTargetY = Math.max(tankPos.y + this.cameraOffset.y, camTerrainH + 3);

        const targetPos = new THREE.Vector3(camTargetX, camTargetY, camTargetZ);

        // 平滑跟随
        const smooth = 1 - Math.exp(-this.cameraSmoothing * deltaTime);
        this.camera.position.lerp(targetPos, smooth);

        // 相机看向坦克前方
        const lookTarget = new THREE.Vector3(
            tankPos.x + Math.sin(tankRot) * this.cameraLookOffset.z,
            tankPos.y + 1,
            tankPos.z + Math.cos(tankRot) * this.cameraLookOffset.z
        );
        this.camera.lookAt(lookTarget);
    }

    _updateTrajectory() {
        if (!this.playerTank || !this.trajectoryLine) return;

        const startPos = this.playerTank.getBarrelTipPosition();
        const dir = this.playerTank.getShootDirection();
        const terrain = this.gameMap.terrain;
        const bounds = this.gameMap.getMapBounds();
        const obstacles = this.gameMap.getAllObstacles();
        const bases = this.gameMap.baseMeshes;

        const posAttr = this.trajectoryLine.geometry.attributes.position;
        const step = 0.5;
        const maxDist = 50;
        let pointCount = 0;
        let hitSomething = false;

        for (let d = 0; d <= maxDist && pointCount < 100; d += step) {
            const x = startPos.x + dir.x * d;
            const y = startPos.y;
            const z = startPos.z + dir.z * d;

            // 边界
            if (x < bounds.minX || x > bounds.maxX || z < bounds.minZ || z > bounds.maxZ) {
                posAttr.setXYZ(pointCount++, x, y, z);
                hitSomething = true;
                break;
            }

            // 地面碰撞
            const groundH = terrain.getHeightAt(x, z);
            if (y < groundH) {
                posAttr.setXYZ(pointCount++, x, groundH, z);
                hitSomething = true;
                break;
            }

            // 障碍物
            let blocked = false;
            for (const obs of obstacles) {
                const dx = x - obs.position.x, dz = z - obs.position.z;
                const r = obs.userData.radius || 1;
                if (dx * dx + dz * dz < r * r) { blocked = true; break; }
            }
            if (blocked) {
                posAttr.setXYZ(pointCount++, x, y, z);
                hitSomething = true;
                break;
            }

            // 基地
            let hitBase = false;
            for (const base of bases) {
                const dx = x - base.position.x, dz = z - base.position.z;
                if (dx * dx + dz * dz < 3.5 * 3.5) { hitBase = true; break; }
            }
            if (hitBase) {
                posAttr.setXYZ(pointCount++, x, y, z);
                hitSomething = true;
                break;
            }

            posAttr.setXYZ(pointCount++, x, y, z);
        }

        posAttr.needsUpdate = true;
        this.trajectoryLine.geometry.setDrawRange(0, pointCount);
        this.trajectoryLine.geometry.computeBoundingSphere();
        this.trajectoryLine.computeLineDistances();
        this.trajectoryLine.visible = pointCount > 1;

        // 弹着点标记
        if (hitSomething && pointCount > 0) {
            const li = pointCount - 1;
            this.trajectoryImpact.position.set(posAttr.getX(li), posAttr.getY(li), posAttr.getZ(li));
            this.trajectoryImpact.visible = true;
        } else {
            this.trajectoryImpact.visible = false;
        }
    }

    checkWinCondition() {
        const aliveEnemies = this.enemyTanks.filter(e => e.alive).length;
        const remaining = this.enemySpawner.getRemainingCount();
        if (aliveEnemies === 0 && remaining === 0) {
            this.nextLevel();
        }
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

window.Game = Game;
