// collision.js - 碰撞检测系统（纯检测，只返回碰撞结果，不触发特效/音效）
class CollisionSystem {
    constructor(gameMap) {
        this.gameMap = gameMap;
    }

    getWallBox(wallMesh) {
        const pos = wallMesh.position;
        const half = CELL_SIZE / 2;
        return new THREE.Box3(
            new THREE.Vector3(pos.x - half, 0, pos.z - half),
            new THREE.Vector3(pos.x + half, CELL_SIZE, pos.z + half)
        );
    }

    // 检测坦克是否能移动到新位置
    canTankMoveTo(tank, newPos, allTanks) {
        const bounds = this.gameMap.getMapBounds();
        const s = Math.max(tank.halfSize.x, tank.halfSize.z);

        // 地图边界
        if (newPos.x - s < bounds.minX || newPos.x + s > bounds.maxX ||
            newPos.z - s < bounds.minZ || newPos.z + s > bounds.maxZ) {
            return false;
        }

        // 坦克碰撞盒
        const tankBox = new THREE.Box3(
            new THREE.Vector3(newPos.x - s, 0, newPos.z - s),
            new THREE.Vector3(newPos.x + s, 2, newPos.z + s)
        );

        // 墙体碰撞
        for (const wall of this.gameMap.getSolidWalls()) {
            const wallBox = this.getWallBox(wall);
            if (tankBox.intersectsBox(wallBox)) return false;
        }

        // 水域碰撞
        for (const water of this.gameMap.getWaterCells()) {
            const wPos = water.position;
            const wHalf = CELL_SIZE / 2;
            const waterBox = new THREE.Box3(
                new THREE.Vector3(wPos.x - wHalf, 0, wPos.z - wHalf),
                new THREE.Vector3(wPos.x + wHalf, 1, wPos.z + wHalf)
            );
            if (tankBox.intersectsBox(waterBox)) return false;
        }

        // 基地碰撞
        for (const base of this.gameMap.baseMeshes) {
            const bPos = base.position;
            const dx = newPos.x - bPos.x;
            const dz = newPos.z - bPos.z;
            const minDist = 1.8 + s;
            if (dx * dx + dz * dz < minDist * minDist) return false;
        }

        // 坦克间碰撞
        if (allTanks) {
            for (const other of allTanks) {
                if (other === tank || !other.alive) continue;
                other.updateBoundingBox();
                if (tankBox.intersectsBox(other.boundingBox)) return false;
            }
        }

        return true;
    }

    // 检测子弹碰撞 — 纯检测，只返回碰撞信息
    checkBulletCollisions(bullet, playerTank, enemyTanks) {
        if (!bullet.alive) return null;
        const bPos = bullet.getPosition();
        const bounds = this.gameMap.getMapBounds();

        // 出界检测
        if (bPos.x < bounds.minX || bPos.x > bounds.maxX ||
            bPos.z < bounds.minZ || bPos.z > bounds.maxZ) {
            bullet.destroy();
            return { type: 'boundary' };
        }

        const bulletPoint = new THREE.Vector3(bPos.x, bPos.y, bPos.z);

        // 砖墙碰撞（可破坏）
        for (let i = this.gameMap.bricks.length - 1; i >= 0; i--) {
            const brick = this.gameMap.bricks[i];
            const wallBox = this.getWallBox(brick);
            if (wallBox.containsPoint(bulletPoint)) {
                const position = brick.position.clone();
                this.gameMap.removeBrick(brick);
                bullet.destroy();
                return { type: 'brick', position };
            }
        }

        // 钢墙碰撞（不可破坏）
        for (const steel of this.gameMap.steels) {
            const wallBox = this.getWallBox(steel);
            if (wallBox.containsPoint(bulletPoint)) {
                const position = steel.position.clone();
                bullet.destroy();
                return { type: 'steel', position };
            }
        }

        // 基地碰撞
        for (const base of this.gameMap.baseMeshes) {
            const basePos = base.position;
            const dx = bPos.x - basePos.x;
            const dz = bPos.z - basePos.z;
            if (dx * dx + dz * dz < 1.5 * 1.5) {
                const position = basePos.clone();
                bullet.destroy();
                return { type: 'base', position };
            }
        }

        // 玩家子弹 → 敌人
        if (bullet.owner === 'player') {
            for (const enemy of enemyTanks) {
                if (!enemy.alive) continue;
                enemy.updateBoundingBox();
                if (enemy.boundingBox.containsPoint(bulletPoint)) {
                    const dead = enemy.takeDamage(1);
                    const position = enemy.getPosition();
                    bullet.destroy();
                    if (dead) {
                        return { type: 'enemy_killed', position, target: enemy };
                    } else {
                        return { type: 'enemy_hit', position, target: enemy };
                    }
                }
            }
        }

        // 敌人子弹 → 玩家
        if (bullet.owner === 'enemy' && playerTank && playerTank.alive) {
            playerTank.updateBoundingBox();
            if (playerTank.boundingBox.containsPoint(bulletPoint)) {
                const dead = playerTank.takeDamage(1);
                const position = playerTank.getPosition();
                bullet.destroy();
                if (dead) {
                    return { type: 'player_killed', position, target: playerTank };
                } else {
                    return { type: 'player_hit', position, target: playerTank };
                }
            }
        }

        return null;
    }
}

window.CollisionSystem = CollisionSystem;
