// TankManager.js - 坦克总管理器（对外统一接口）
class TankManager {
    constructor(scene, effectsManager, audioManager, collisionSystem) {
        this.scene = scene;
        this.effectsManager = effectsManager;
        this.audioManager = audioManager;
        this.collisionSystem = collisionSystem;

        // 子系统
        this.weapon = new TankWeapon(scene, effectsManager, audioManager);
        this.tankEffects = new TankEffects(effectsManager);
        this.spawner = new TankSpawner();

        // 实体
        this.playerTank = null;
        this.enemyTanks = [];
        this.enemyAIs = [];

        // 事件回调（由 game.js 设置）
        this.onEnemyKilled = null;  // (enemy, deathPos) => void
        this.onEnemyHit = null;     // (enemy, position) => void
        this.onPlayerKilled = null; // () => void
        this.onPlayerHit = null;    // () => void
    }

    // ====== 玩家坦克 ======

    createPlayerTank(options, spawnPos) {
        this.playerTank = new Tank(this.scene, options);
        this.playerTank.setPosition(spawnPos.x, spawnPos.z);
        return this.playerTank;
    }

    getPlayerTank() {
        return this.playerTank;
    }

    // ====== 敌人管理 ======

    initSpawner(levelData) {
        this.spawner.init(levelData);
    }

    updateEnemies(deltaTime, baseMeshes, spawnPoints) {
        // 生成新敌人
        const aliveCount = this.enemyTanks.filter(e => e.alive).length;
        const spawnResult = this.spawner.update(deltaTime, aliveCount, spawnPoints);
        if (spawnResult) {
            this._spawnEnemy(spawnResult.type, spawnResult.candidates);
        }

        // 更新每个敌人的AI和射击
        const allTanks = this.getAllTanks();
        for (let i = 0; i < this.enemyTanks.length; i++) {
            const enemy = this.enemyTanks[i];
            if (!enemy.alive) continue;

            enemy.update(deltaTime);

            const ai = this.enemyAIs[i];
            if (!ai) continue;

            const action = ai.update(
                enemy,
                this.playerTank,
                baseMeshes,
                this.collisionSystem,
                allTanks,
                deltaTime
            );

            if (action === 'shoot' && enemy.canShoot()) {
                this.weapon.fire(enemy);
            }
        }
    }

    _spawnEnemy(type, candidates) {
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
                this.enemyAIs.push(new TankAI());
                this.spawner.confirmSpawn();
                return;
            }
            enemy.destroy();
        }
    }

    getEnemyTanks() {
        return this.enemyTanks;
    }

    getAliveEnemyCount() {
        return this.enemyTanks.filter(e => e.alive).length;
    }

    getRemainingEnemyCount() {
        return this.getAliveEnemyCount() + this.spawner.getRemainingCount();
    }

    // ====== 射击 ======

    playerShoot() {
        if (!this.playerTank || !this.playerTank.alive) return false;
        const bullet = this.weapon.fire(this.playerTank);
        return bullet !== null;
    }

    // ====== 碰撞处理 ======

    handleBulletCollision(result) {
        if (!result) return;

        switch (result.type) {
            case 'brick':
                this.effectsManager.createBrickHitEffect(result.position);
                this.audioManager.playHit();
                break;
            case 'steel':
                this.effectsManager.createSteelHitEffect(result.position);
                this.audioManager.playHit();
                break;
            case 'base':
                this.effectsManager.createBaseHitEffect(result.position);
                this.audioManager.playExplosion();
                break;
            case 'enemy_hit':
                this.tankEffects.onTankHit(result.target, result.position);
                this.audioManager.playHit();
                if (this.onEnemyHit) this.onEnemyHit(result.target, result.position);
                break;
            case 'enemy_killed':
                this.tankEffects.onTankDestroyed(result.position);
                this.audioManager.playExplosion();
                result.target.destroy();
                if (this.onEnemyKilled) this.onEnemyKilled(result.target, result.position);
                break;
            case 'player_hit':
                this.tankEffects.onTankHit(result.target, result.position);
                this.audioManager.playHit();
                if (this.onPlayerHit) this.onPlayerHit();
                break;
            case 'player_killed':
                this.tankEffects.onTankDestroyed(result.position);
                this.audioManager.playExplosion();
                if (this.onPlayerKilled) this.onPlayerKilled();
                break;
        }
    }

    // ====== 子弹 ======

    getBullets() {
        return this.weapon.getBullets();
    }

    updateBullets(deltaTime) {
        this.weapon.update(deltaTime);

        for (const bullet of this.weapon.getBullets()) {
            if (!bullet.alive) continue;

            const result = this.collisionSystem.checkBulletCollisions(
                bullet, this.playerTank, this.enemyTanks
            );

            if (result) {
                this.handleBulletCollision(result);
            }
        }
    }

    // ====== 全局 ======

    getAllTanks() {
        return [this.playerTank, ...this.enemyTanks].filter(t => t);
    }

    update(deltaTime) {
        if (this.playerTank && this.playerTank.alive) {
            this.playerTank.update(deltaTime);
        }
    }

    clear() {
        if (this.playerTank) {
            this.playerTank.destroy();
            this.playerTank = null;
        }
        this.enemyTanks.forEach(e => e.destroy());
        this.enemyTanks = [];
        this.enemyAIs = [];
        this.weapon.clear();
    }
}

window.TankManager = TankManager;
