// TankEffects.js - 坦克专属特效（击中/击杀/闪烁）
class TankEffects {
    constructor(effectsManager) {
        this.effectsManager = effectsManager;
    }

    // 坦克被击中：爆炸+火星+碎片+闪烁
    onTankHit(tank, position) {
        this.effectsManager.createExplosion(position, 'medium');
        this.effectsManager.createSmoke(position, 0x222222, 8);
        this.effectsManager.createSparks(position, 20, 0xFFAA00);
        this.effectsManager.createDebris(position, 'metal', 6);
        this._createHitFlash(tank);
    }

    // 坦克被击杀：大爆炸+浓烟+大量火花
    onTankDestroyed(position) {
        this.effectsManager.createExplosion(position, 'large');
        this.effectsManager.createSmoke(position, 0x111111, 15);
        this.effectsManager.createSparks(position, 30, 0xFFAA00);
        this.effectsManager.createDebris(position, 'metal', 12);
    }

    // 坦克被击中闪烁效果（内部方法）
    _createHitFlash(tank) {
        if (!tank.alive || !tank.group) return;
        tank.group.traverse(child => {
            if (child.isMesh && child.material && !child.material.transparent) {
                child.material.emissive = new THREE.Color(0xff0000);
                child.material.emissiveIntensity = 0.5;
                setTimeout(() => {
                    if (child.material) {
                        child.material.emissive = new THREE.Color(0x000000);
                        child.material.emissiveIntensity = 0;
                    }
                }, 150);
            }
        });
    }
}

window.TankEffects = TankEffects;
