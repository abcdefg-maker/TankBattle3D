// TankAI.js - 敌方AI行为控制
class TankAI {
    constructor() {
        this.state = 'patrol'; // 'patrol', 'chase', 'attack'
        this.directionTimer = 0;
        this.directionInterval = 2 + Math.random() * 2;
        this.currentDirection = Math.random() * Math.PI * 2;
        this.shootTimer = 0;
        this.shootInterval = 1.5 + Math.random() * 1.5;
        this.detectionRange = 15;
        this.attackAngle = 0.5;
        this.stuckTimer = 0;
        this.stuckCount = 0;
        this.lastPosition = new THREE.Vector3();
        this.separationRadius = 4;
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
                if (this.stuckCount <= 2) {
                    this.currentDirection += (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2;
                } else if (this.stuckCount <= 4) {
                    this.currentDirection += Math.PI;
                } else {
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

        // 如果有强分离力，覆盖移动方向
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

    calcSeparation(tank, allTanks) {
        const pos = tank.getPosition();
        let separationX = 0;
        let separationZ = 0;
        let nearbyCount = 0;

        for (const other of allTanks) {
            if (other === tank || !other.alive) continue;
            if (other.type === 'player') continue;

            const otherPos = other.getPosition();
            const dx = pos.x - otherPos.x;
            const dz = pos.z - otherPos.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < this.separationRadius && dist > 0.01) {
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
            shoot: Math.abs(angleDiff) < 0.8,
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
            move: 0.5,
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

window.TankAI = TankAI;
