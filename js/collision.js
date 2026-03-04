// collision.js - 碰撞检测系统（野战地形版）
class CollisionSystem {
    constructor(gameMap) {
        this.gameMap = gameMap;
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

        const terrain = this.gameMap.terrain;

        // 深水区域不可通行
        if (terrain.isDeepWater(newPos.x, newPos.z)) {
            return false;
        }

        // 陡坡不可通行（法线Y分量 < 0.65 ≈ ~50度）
        const normal = terrain.getNormalAt(newPos.x, newPos.z);
        if (normal.y < 0.65) {
            return false;
        }

        // 障碍物碰撞（圆形检测）
        for (const obs of this.gameMap.getAllObstacles()) {
            const oPos = obs.position;
            const oRadius = obs.userData.radius || 1;
            const dx = newPos.x - oPos.x;
            const dz = newPos.z - oPos.z;
            const minDist = oRadius + s;
            if (dx * dx + dz * dz < minDist * minDist) {
                return false;
            }
        }

        // 基地碰撞
        for (const base of this.gameMap.baseMeshes) {
            const bPos = base.position;
            const dx = newPos.x - bPos.x;
            const dz = newPos.z - bPos.z;
            const minDist = 3.5 + s;
            if (dx * dx + dz * dz < minDist * minDist) {
                return false;
            }
        }

        // 坦克间碰撞
        if (allTanks) {
            const tankBox = tank.getBoundingBoxAt(newPos);
            for (const other of allTanks) {
                if (other === tank || !other.alive) continue;
                other.updateBoundingBox();
                if (tankBox.intersectsBox(other.boundingBox)) {
                    return false;
                }
            }
        }

        return true;
    }

    // 检测子弹碰撞
    checkBulletCollisions(bullet, playerTank, enemyTanks, effectsManager, audioManager, game) {
        if (!bullet.alive) return null;
        const bPos = bullet.getPosition();
        const bounds = this.gameMap.getMapBounds();
        const terrain = this.gameMap.terrain;

        // 出界检测
        if (bPos.x < bounds.minX || bPos.x > bounds.maxX ||
            bPos.z < bounds.minZ || bPos.z > bounds.maxZ) {
            bullet.destroy();
            return { type: 'boundary' };
        }

        // 地面碰撞（子弹Y低于地形高度）
        const groundH = terrain.getHeightAt(bPos.x, bPos.z);
        if (bPos.y < groundH) {
            effectsManager.createExplosion(new THREE.Vector3(bPos.x, groundH, bPos.z), 'small');
            audioManager.playHit();
            bullet.destroy();
            return { type: 'ground' };
        }

        // 障碍物碰撞
        const obstacles = this.gameMap.getAllObstacles();
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            const oPos = obs.position;
            const oRadius = obs.userData.radius || 1;
            const dx = bPos.x - oPos.x;
            const dz = bPos.z - oPos.z;
            if (dx * dx + dz * dz < oRadius * oRadius) {
                if (obs.userData.destructible) {
                    obs.userData.hp = (obs.userData.hp || 1) - 1;
                    if (obs.userData.hp <= 0) {
                        effectsManager.createExplosion(oPos.clone(), 'small');
                        this.gameMap.removeObstacle(obs);
                    }
                    audioManager.playHit();
                    bullet.destroy();
                    return { type: 'destructible' };
                } else {
                    audioManager.playHit();
                    bullet.destroy();
                    return { type: 'obstacle' };
                }
            }
        }

        // 基地碰撞
        for (const base of this.gameMap.baseMeshes) {
            const basePos = base.position;
            const dx = bPos.x - basePos.x;
            const dz = bPos.z - basePos.z;
            if (dx * dx + dz * dz < 3.5 * 3.5) {
                effectsManager.createExplosion(basePos.clone(), 'large');
                audioManager.playExplosion();
                bullet.destroy();
                return { type: 'base' };
            }
        }

        // 玩家子弹 → 敌人
        if (bullet.owner === 'player') {
            for (const enemy of enemyTanks) {
                if (!enemy.alive) continue;
                enemy.updateBoundingBox();
                const bulletPoint = new THREE.Vector3(bPos.x, bPos.y, bPos.z);
                if (enemy.boundingBox.containsPoint(bulletPoint)) {
                    const dead = enemy.takeDamage(1);
                    bullet.destroy();
                    if (dead) {
                        const deathPos = enemy.getPosition();
                        effectsManager.createExplosion(deathPos, 'medium');
                        audioManager.playExplosion();
                        enemy.destroy();
                        return { type: 'enemy_killed', enemy, deathPos };
                    } else {
                        audioManager.playHit();
                        return { type: 'enemy_hit', enemy };
                    }
                }
            }
        }

        // 敌人子弹 → 玩家
        if (bullet.owner === 'enemy' && playerTank && playerTank.alive) {
            playerTank.updateBoundingBox();
            const bulletPoint = new THREE.Vector3(bPos.x, bPos.y, bPos.z);
            if (playerTank.boundingBox.containsPoint(bulletPoint)) {
                const dead = playerTank.takeDamage(1);
                bullet.destroy();
                if (dead) {
                    effectsManager.createExplosion(playerTank.getPosition(), 'medium');
                    audioManager.playExplosion();
                    return { type: 'player_killed' };
                } else {
                    audioManager.playHit();
                    return { type: 'player_hit' };
                }
            }
        }

        return null;
    }
}

window.CollisionSystem = CollisionSystem;
