// TankSpawner.js - 敌方坦克生成管理
class TankSpawner {
    constructor() {
        this.spawnTimer = 0;
        this.spawnInterval = 3;
        this.maxAlive = 4;
        this.spawnQueue = [];
        this.spawnIndex = 0;
    }

    init(levelData) {
        this.spawnQueue = [];
        const enemies = levelData.enemies;
        for (let i = 0; i < enemies.normal; i++) this.spawnQueue.push('normal');
        for (let i = 0; i < enemies.elite; i++) this.spawnQueue.push('elite');
        for (let i = 0; i < enemies.heavy; i++) this.spawnQueue.push('heavy');
        // 打乱顺序
        for (let i = this.spawnQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.spawnQueue[i], this.spawnQueue[j]] = [this.spawnQueue[j], this.spawnQueue[i]];
        }
        this.spawnTimer = 1;
        this.spawnIndex = 0;
    }

    update(deltaTime, currentAlive, spawnPoints) {
        if (this.spawnQueue.length === 0) return null;
        if (currentAlive >= this.maxAlive) return null;

        this.spawnTimer -= deltaTime;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = this.spawnInterval;
            const type = this.spawnQueue[0];
            const candidates = [];
            for (let i = 0; i < spawnPoints.length; i++) {
                candidates.push(spawnPoints[(this.spawnIndex + i) % spawnPoints.length]);
            }
            this.spawnIndex++;
            return { type, candidates };
        }
        return null;
    }

    confirmSpawn() {
        this.spawnQueue.shift();
    }

    getRemainingCount() {
        return this.spawnQueue.length;
    }
}

window.TankSpawner = TankSpawner;
