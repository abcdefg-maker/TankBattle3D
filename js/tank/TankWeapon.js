// TankWeapon.js - 武器系统（射击+冷却+子弹管理+炮口闪光）
class TankWeapon {
    constructor(scene, effectsManager, audioManager) {
        this.scene = scene;
        this.effectsManager = effectsManager;
        this.audioManager = audioManager;
        this.bullets = [];
    }

    // 射击（内部处理：创建子弹+炮口闪光+后坐力+音效）
    fire(tank) {
        if (!tank.canShoot()) return null;

        tank.resetShootCooldown();
        tank.startRecoil();
        const pos = tank.getBarrelTipPosition();
        const dir = tank.getShootDirection();
        const bullet = new TankBullet(this.scene, pos, dir, tank.type === 'player' ? 'player' : 'enemy');
        this.bullets.push(bullet);
        this.effectsManager.createMuzzleFlash(pos);
        this.audioManager.playShoot();
        return bullet;
    }

    // 子弹更新
    update(deltaTime) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.update(deltaTime);
            if (!b.alive) {
                this.bullets.splice(i, 1);
            }
        }
    }

    // 获取所有活跃子弹
    getBullets() {
        return this.bullets;
    }

    // 移除指定子弹
    removeBullet(bullet) {
        const idx = this.bullets.indexOf(bullet);
        if (idx !== -1) {
            this.bullets.splice(idx, 1);
        }
    }

    // 清理所有子弹
    clear() {
        this.bullets.forEach(b => b.destroy());
        this.bullets = [];
    }
}

window.TankWeapon = TankWeapon;
