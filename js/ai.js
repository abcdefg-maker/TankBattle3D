// ai.js - 敌方AI系统
class EnemyAI {
    constructor() {
        this.state = 'patrol'; // 'patrol', 'chase', 'attack'
        this.directionTimer = 0;
        this.directionInterval = 2 + Math.random() * 2;
        this.currentDirection = Math.random() * Math.PI * 2;
        this.shootTimer = 0;
        this.shootInterval = 1.5 + Math.random() * 1.5;
        this.detectionRange = 15;
        this.attackAngle = 0.5; // ~30度
        this.stuckTimer = 0;
        this.stuckCount = 0;     // 连续卡住次数
        this.lastPosition = new THREE.Vector3();
        this.separationRadius = 4; // 分离检测半径
    }

    update(tank, playerTank, baseMeshes, collisionSystem, allTanks, deltaTime) {
        if (!tank.alive) return null;

        const tankPos = tank.getPosition();
        let playerDist = Infinity;
        let playerAngle = 0;

        if (playerTank && playerTank.alive) {
            const playerPos = playerTank.getPosition();
            playerDist = tankPos.distanceTo(playerPos);
            playerAngle = Math.atan2(-(playerPos.x - tankPos.x), -(playerPos.z - tankPos.z));
        }

        // 计算与友方坦克的分离力
        const separation = this.calcSeparation(tank, allTanks);

        // 状态切换
        if (playerDist < this.detectionRange && playerTank && playerTank.alive) {
            this.state = 'chase';
            const tankFacing = tank.getRotation();
            const angleDiff = Math.abs(this.normalizeAngle(playerAngle - tankFacing));
            if (angleDiff < this.attackAngle) {
                this.state = 'attack';
            }
        } else {
            this.state = 'patrol';
        }

        // 卡住检测
        if (tankPos.distanceTo(this.lastPosition) < 0.05) {
            this.stuckTimer += deltaTime;
            if (this.stuckTimer > 0.3) {
                this.stuckCount++;
                // 根据卡住次数采取不同策略
                if (this.stuckCount <= 2) {
                    // 前几次：尝试垂直方向
                    this.currentDirection += (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2;
                } else if (this.stuckCount <= 4) {
                    // 多次卡住：尝试反向
                    this.currentDirection += Math.PI;
                } else {
                    // 反复卡住：完全随机 + 重置计数
                    this.currentDirection = Math.random() * Math.PI * 2;
                    this.stuckCount = 0;
                }
                this.stuckTimer = 0;
            }
        } else {
            this.stuckTimer = 0;
            this.stuckCount = 0;
        }
        this.lastPosition.copy(tankPos);

        let action = { move: 0, rotate: 0, shoot: false, turretAngle: null };

        switch (this.state) {
            case 'patrol':
                action = this.doPatrol(tank, baseMeshes, deltaTime);
                break;
            case 'chase':
                action = this.doChase(tank, playerAngle, deltaTime);
                break;
            case 'attack':
                action = this.doAttack(tank, playerAngle, playerTank, deltaTime);
                break;
        }

        // 如果有强分离力，覆盖移动方向（防止坦克挤在一起）
        if (separation.strength > 0.5) {
            this.currentDirection = separation.angle;
            const tankAngle = tank.getRotation();
            const angleDiff = this.normalizeAngle(separation.angle - tankAngle);
            action.rotate = Math.abs(angleDiff) > 0.1 ? (angleDiff > 0 ? 1 : -1) : 0;
            action.move = 1;
        }

        // 执行移动
        if (action.rotate !== 0) {
            tank.rotate(action.rotate, deltaTime);
        }

        if (action.move !== 0) {
            const newPos = tank.calcMovePosition(action.move, deltaTime);
            if (collisionSystem.canTankMoveTo(tank, newPos, allTanks)) {
                tank.applyPosition(newPos);
            } else {
                // 碰到障碍物 - 尝试左右滑动
                const angle = tank.getRotation();
                const slx = tankPos.x + Math.cos(angle) * tank.speed * deltaTime;
                const slz = tankPos.z - Math.sin(angle) * tank.speed * deltaTime;
                const srx = tankPos.x - Math.cos(angle) * tank.speed * deltaTime;
                const srz = tankPos.z + Math.sin(angle) * tank.speed * deltaTime;
                const slideLeft = new THREE.Vector3(slx, 0, slz);
                const slideRight = new THREE.Vector3(srx, 0, srz);
                if (collisionSystem.canTankMoveTo(tank, slideLeft, allTanks)) {
                    tank.applyPosition(slideLeft);
                } else if (collisionSystem.canTankMoveTo(tank, slideRight, allTanks)) {
                    tank.applyPosition(slideRight);
                } else {
                    // 都不行，换方向
                    this.currentDirection += Math.PI / 2 + Math.random() * Math.PI;
                    this.directionTimer = 0;
                }
            }
        }

        // 炮塔朝向
        if (action.turretAngle !== null) {
            tank.setTurretRotation(action.turretAngle);
        }

        // 射击
        this.shootTimer -= deltaTime;
        if (action.shoot && this.shootTimer <= 0 && tank.canShoot()) {
            this.shootTimer = this.shootInterval;
            return 'shoot';
        }

        return null;
    }

    // 计算与附近友方坦克的分离方向
    calcSeparation(tank, allTanks) {
        const pos = tank.getPosition();
        let separationX = 0;
        let separationZ = 0;
        let nearbyCount = 0;

        for (const other of allTanks) {
            if (other === tank || !other.alive) continue;
            // 只对其他敌人坦克计算分离（不对玩家）
            if (other.type === 'player') continue;

            const otherPos = other.getPosition();
            const dx = pos.x - otherPos.x;
            const dz = pos.z - otherPos.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < this.separationRadius && dist > 0.01) {
                // 距离越近，排斥力越强
                const force = (this.separationRadius - dist) / this.separationRadius;
                separationX += (dx / dist) * force;
                separationZ += (dz / dist) * force;
                nearbyCount++;
            }
        }

        if (nearbyCount === 0) {
            return { angle: 0, strength: 0 };
        }

        separationX /= nearbyCount;
        separationZ /= nearbyCount;
        const strength = Math.sqrt(separationX * separationX + separationZ * separationZ);
        const angle = Math.atan2(-separationX, -separationZ);

        return { angle, strength };
    }

    doPatrol(tank, baseMeshes, deltaTime) {
        this.directionTimer += deltaTime;
        if (this.directionTimer >= this.directionInterval) {
            this.directionTimer = 0;
            this.directionInterval = 2 + Math.random() * 2;

            // 50%概率朝基地方向
            if (baseMeshes.length > 0 && Math.random() < 0.5) {
                const basePos = baseMeshes[0].position;
                const tankPos = tank.getPosition();
                this.currentDirection = Math.atan2(-(basePos.x - tankPos.x), -(basePos.z - tankPos.z));
            } else {
                this.currentDirection = Math.random() * Math.PI * 2;
            }
        }

        const tankAngle = tank.getRotation();
        const angleDiff = this.normalizeAngle(this.currentDirection - tankAngle);
        let rotateDir = 0;
        if (Math.abs(angleDiff) > 0.1) {
            rotateDir = angleDiff > 0 ? 1 : -1;
        }

        // 在巡逻时也会偶尔射击
        const shouldShoot = Math.random() < 0.01;

        return {
            move: 1,
            rotate: rotateDir,
            shoot: shouldShoot,
            turretAngle: this.currentDirection
        };
    }

    doChase(tank, playerAngle, deltaTime) {
        const tankAngle = tank.getRotation();
        const angleDiff = this.normalizeAngle(playerAngle - tankAngle);
        let rotateDir = 0;
        if (Math.abs(angleDiff) > 0.1) {
            rotateDir = angleDiff > 0 ? 1 : -1;
        }

        return {
            move: 1,
            rotate: rotateDir,
            shoot: Math.abs(angleDiff) < 0.8, // 大致朝向就射击
            turretAngle: playerAngle
        };
    }

    doAttack(tank, playerAngle, playerTank, deltaTime) {
        const tankAngle = tank.getRotation();
        const angleDiff = this.normalizeAngle(playerAngle - tankAngle);
        let rotateDir = 0;
        if (Math.abs(angleDiff) > 0.05) {
            rotateDir = angleDiff > 0 ? 1 : -1;
        }

        return {
            move: 0.5, // 慢速靠近
            rotate: rotateDir,
            shoot: true,
            turretAngle: playerAngle
        };
    }

    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        return angle;
    }
}

class EnemySpawner {
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
        this.spawnTimer = 1; // 初始延迟
        this.spawnIndex = 0;
    }

    update(deltaTime, currentAlive, spawnPoints) {
        if (this.spawnQueue.length === 0) return null;
        if (currentAlive >= this.maxAlive) return null;

        this.spawnTimer -= deltaTime;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = this.spawnInterval;
            const type = this.spawnQueue[0]; // 先看，不取出
            // 返回所有出生点候选，让game.js逐一尝试
            const candidates = [];
            for (let i = 0; i < spawnPoints.length; i++) {
                candidates.push(spawnPoints[(this.spawnIndex + i) % spawnPoints.length]);
            }
            this.spawnIndex++;
            return { type, candidates };
        }
        return null;
    }

    // 出生成功后才从队列取出
    confirmSpawn() {
        this.spawnQueue.shift();
    }

    getRemainingCount() {
        return this.spawnQueue.length;
    }
}

window.EnemyAI = EnemyAI;
window.EnemySpawner = EnemySpawner;
