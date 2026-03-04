// game.js - 游戏核心逻辑（平地版本）
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
        this.mouseDeltaX = 0; // 鼠标帧间移动量
        this.zoomTurretAngle = 0; // 瞄准镜模式下的炮塔角度
        this.zoomTurretSpeed = 2.5; // 瞄准镜模式下的固定旋转速度（弧度/秒/像素归一化）
        this.raycaster = new THREE.Raycaster();
        this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

        // 相机参数
        this.cameraOffset = new THREE.Vector3(0, 12, 12);
        this.cameraLookOffset = new THREE.Vector3(0, 0, -5);
        this.cameraSmoothing = 4;

        // 放大瞄准系统
        this.isZooming = false;
        this.currentFOV = 60;
        this.normalFOV = 60;
        this.zoomFOV = 30;
        this.zoomMoveSpeedMult = 0.5;

        // 玩家出生点
        this.playerSpawnPos = { x: 0, z: 0 };
    }

    init() {
        // 场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 30, 60);

        // 相机
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
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
        dirLight.shadow.camera.far = 80;
        dirLight.shadow.camera.left = -25;
        dirLight.shadow.camera.right = 25;
        dirLight.shadow.camera.top = 25;
        dirLight.shadow.camera.bottom = -25;
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
            // 记录鼠标水平移动增量（像素归一化到屏幕宽度）
            this.mouseDeltaX += e.movementX / window.innerWidth;
        });

        // 右键放大瞄准
        document.addEventListener('mousedown', (e) => {
            if (e.button === 2) {
                this.isZooming = true;
            }
        });
        document.addEventListener('mouseup', (e) => {
            if (e.button === 2) {
                this.isZooming = false;
            }
        });
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
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

        document.getElementById('openworld-btn').addEventListener('click', () => {
            this.audioManager.init();
            this.audioManager.resume();
            this.startOpenWorld();
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

    startOpenWorld() {
        this.state = 'playing';
        this.score = 0;
        this.kills = 0;
        this.playerLives = 99;
        this.openWorldMode = true;
        this.clearEntities();
        this.gameMap.loadOpenWorld();

        this.playerTank = new Tank(this.scene, {
            type: 'player', hp: 1, speed: 8, rotSpeed: 3,
            color: 0x4a7c59, shootCooldown: 1.8
        });
        this.playerTank.setPosition(0, 0);

        this.uiManager.showGameHud();
        this.uiManager.updateScore(0);
        this.uiManager.updateLevel('OW');
        this.uiManager.updateLives(this.playerLives);
        this.uiManager.updateEnemies(0);
    }

    loadLevel(levelIndex) {
        // 清理
        this.clearEntities();

        // 加载地图
        const levelData = this.gameMap.loadLevel(levelIndex);

        // 玩家出生位置
        this.playerSpawnPos = levelData.playerSpawn;

        // 创建玩家坦克
        this.playerTank = new Tank(this.scene, {
            type: 'player',
            hp: 1,
            speed: 5,
            rotSpeed: 3,
            color: 0x4a7c59,
            shootCooldown: 2.0
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
                options = { type: 'normal', hp: 1, speed: 3, rotSpeed: 2, color: 0x888888, shootCooldown: 2.2 };
                break;
            case 'elite':
                options = { type: 'elite', hp: 1, speed: 5, rotSpeed: 3, color: 0xcc3333, shootCooldown: 1.5 };
                break;
            case 'heavy':
                options = { type: 'heavy', hp: 2, speed: 2.5, rotSpeed: 1.5, color: 0x991111, shootCooldown: 3.0 };
                break;
        }

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
        if (this.openWorldMode) {
            this.openWorldMode = false;
        }
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

            // 放大瞄准 FOV 平滑过渡
            const targetFOV = this.isZooming ? this.zoomFOV : this.normalFOV;
            if (Math.abs(this.currentFOV - targetFOV) > 0.1) {
                this.currentFOV += (targetFOV - this.currentFOV) * Math.min(1, deltaTime * 10);
                this.camera.fov = this.currentFOV;
                this.camera.updateProjectionMatrix();
            }

            // 准星HUD显示/隐藏
            const scopeEl = document.getElementById('scope-overlay');
            if (scopeEl) {
                scopeEl.style.display = this.isZooming ? 'flex' : 'none';
            }
        }

        this.effectsManager.update(deltaTime);
        this.renderer.render(this.scene, this.camera);
    }

    updatePlayerInput(deltaTime) {
        if (!this.playerTank || !this.playerTank.alive) return;

        this.playerTank.update(deltaTime);

        const allTanks = [this.playerTank, ...this.enemyTanks];

        // 放大瞄准时移动减速
        const speedMult = this.isZooming ? this.zoomMoveSpeedMult : 1.0;

        // 移动
        let forward = 0;
        if (this.keys['KeyW'] || this.keys['ArrowUp']) forward = 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) forward = -1;

        if (forward !== 0) {
            const newPos = this.playerTank.calcMovePosition(forward * speedMult, deltaTime);
            if (this.collisionSystem.canTankMoveTo(this.playerTank, newPos, allTanks)) {
                this.playerTank.applyPosition(newPos);
            }
        }

        // 旋转
        let rotDir = 0;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) rotDir = 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) rotDir = -1;
        if (rotDir !== 0) {
            this.playerTank.rotate(rotDir * speedMult, deltaTime);
        }

        // 鼠标控制炮塔
        if (this.isZooming) {
            // 瞄准镜模式：用鼠标移动增量以固定角速度旋转炮塔
            this.zoomTurretAngle -= this.mouseDeltaX * this.zoomTurretSpeed;
            this.playerTank.setTurretRotation(this.zoomTurretAngle);
        } else {
            // 正常模式：raycast 到地面
            this.raycaster.setFromCamera(new THREE.Vector2(this.mouse.x, this.mouse.y), this.camera);
            const intersectPoint = new THREE.Vector3();
            if (this.raycaster.ray.intersectPlane(this.groundPlane, intersectPoint)) {
                const tankPos = this.playerTank.getPosition();
                const angle = Math.atan2(-(intersectPoint.x - tankPos.x), -(intersectPoint.z - tankPos.z));
                this.playerTank.setTurretRotation(angle);
                // 同步记录当前角度，进入瞄准镜时无跳变
                this.zoomTurretAngle = angle;
            }
        }
        this.mouseDeltaX = 0; // 每帧消耗掉增量

        // 射击
        if (this.keys['Space'] && this.playerTank.canShoot()) {
            this.playerTank.resetShootCooldown();
            this.playerTank.startRecoil();
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
                enemy.startRecoil();
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
                shootCooldown: 2.0
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

        // 炮塔世界朝向角度
        const turretAngle = tankRot + this.playerTank.turretGroup.rotation.y;

        if (this.isZooming) {
            // 第一人称炮手瞄准镜视角
            // 相机在炮管后方（炮塔位置），沿炮管方向看出去
            const scopePos = new THREE.Vector3(
                tankPos.x - Math.sin(turretAngle) * 0.5,
                1.35,
                tankPos.z - Math.cos(turretAngle) * 0.5
            );

            // 看向炮管前方远处
            const scopeLook = new THREE.Vector3(
                tankPos.x - Math.sin(turretAngle) * 30,
                1.2,
                tankPos.z - Math.cos(turretAngle) * 30
            );

            const zoomSmooth = 1 - Math.exp(-8 * deltaTime);
            this.camera.position.lerp(scopePos, zoomSmooth);
            this.camera.lookAt(scopeLook);

            // 隐藏玩家坦克模型
            if (this.playerTank.group.visible) {
                this.playerTank.group.visible = false;
            }
        } else {
            // 第三人称俯视视角
            const targetPos = new THREE.Vector3(
                tankPos.x + Math.sin(tankRot) * this.cameraOffset.z,
                this.cameraOffset.y,
                tankPos.z + Math.cos(tankRot) * this.cameraOffset.z
            );

            const smooth = 1 - Math.exp(-this.cameraSmoothing * deltaTime);
            this.camera.position.lerp(targetPos, smooth);

            const lookTarget = new THREE.Vector3(
                tankPos.x + Math.sin(tankRot) * this.cameraLookOffset.z,
                1,
                tankPos.z + Math.cos(tankRot) * this.cameraLookOffset.z
            );
            this.camera.lookAt(lookTarget);

            // 恢复玩家坦克模型可见
            if (!this.playerTank.group.visible) {
                this.playerTank.group.visible = true;
            }
        }
    }

    checkWinCondition() {
        if (this.openWorldMode) return;
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
