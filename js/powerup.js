// powerup.js - 道具系统
class PowerUp {
    constructor(scene, position, type) {
        this.scene = scene;
        this.type = type; // 'speed', 'shield', 'bomb'
        this.alive = true;
        this.lifetime = 10; // 10秒后消失
        this.timer = 0;

        this.group = new THREE.Group();
        this.buildModel();
        this.baseY = (position.y || 0) + 1.2;
        this.group.position.set(position.x, this.baseY, position.z);
        this.scene.add(this.group);
    }

    buildModel() {
        let geo, mat;

        switch (this.type) {
            case 'speed':
                geo = new THREE.OctahedronGeometry(0.5, 0);
                mat = new THREE.MeshStandardMaterial({
                    color: 0xffdd00,
                    emissive: 0xffaa00,
                    emissiveIntensity: 0.4
                });
                break;
            case 'shield':
                geo = new THREE.TorusGeometry(0.4, 0.15, 8, 12);
                mat = new THREE.MeshStandardMaterial({
                    color: 0x4488ff,
                    emissive: 0x2244aa,
                    emissiveIntensity: 0.4
                });
                break;
            case 'bomb':
                geo = new THREE.IcosahedronGeometry(0.5, 0);
                mat = new THREE.MeshStandardMaterial({
                    color: 0xff3333,
                    emissive: 0xaa0000,
                    emissiveIntensity: 0.4
                });
                break;
        }

        this.mesh = new THREE.Mesh(geo, mat);
        this.group.add(this.mesh);

        // 发光指示
        const light = new THREE.PointLight(mat.color, 0.5, 4);
        light.position.y = 0.5;
        this.group.add(light);
        this.light = light;
    }

    update(deltaTime) {
        if (!this.alive) return;

        this.timer += deltaTime;
        if (this.timer >= this.lifetime) {
            this.destroy();
            return;
        }

        // 旋转和上下浮动
        this.mesh.rotation.y += deltaTime * 2;
        this.mesh.rotation.x += deltaTime * 0.5;
        this.group.position.y = this.baseY + Math.sin(Date.now() * 0.003) * 0.3;

        // 闪烁（最后3秒）
        if (this.timer > this.lifetime - 3) {
            const flash = Math.sin(Date.now() * 0.02) > 0;
            this.mesh.visible = flash;
        }
    }

    getBoundingBox() {
        const pos = this.group.position;
        return new THREE.Box3(
            new THREE.Vector3(pos.x - 0.6, pos.y - 0.6, pos.z - 0.6),
            new THREE.Vector3(pos.x + 0.6, pos.y + 0.6, pos.z + 0.6)
        );
    }

    destroy() {
        this.alive = false;
        this.scene.remove(this.group);
        this.group.traverse(child => {
            if (child.isMesh) {
                child.geometry.dispose();
                child.material.dispose();
            }
        });
    }
}

class PowerUpManager {
    constructor(scene) {
        this.scene = scene;
        this.powerups = [];
        this.dropChance = 0.3; // 30%掉落概率
    }

    trySpawnAt(position) {
        if (Math.random() > this.dropChance) return;

        const types = ['speed', 'shield', 'bomb'];
        const weights = [0.4, 0.35, 0.25]; // 加权随机
        let r = Math.random();
        let type = types[0];
        for (let i = 0; i < weights.length; i++) {
            r -= weights[i];
            if (r <= 0) {
                type = types[i];
                break;
            }
        }

        const powerup = new PowerUp(this.scene, position, type);
        this.powerups.push(powerup);
    }

    update(deltaTime) {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            p.update(deltaTime);
            if (!p.alive) {
                this.powerups.splice(i, 1);
            }
        }
    }

    checkPickup(playerTank) {
        if (!playerTank || !playerTank.alive) return null;
        playerTank.updateBoundingBox();

        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            if (!p.alive) continue;
            const pBox = p.getBoundingBox();
            if (playerTank.boundingBox.intersectsBox(pBox)) {
                const type = p.type;
                p.destroy();
                this.powerups.splice(i, 1);
                return type;
            }
        }
        return null;
    }

    clear() {
        this.powerups.forEach(p => p.destroy());
        this.powerups = [];
    }
}

window.PowerUp = PowerUp;
window.PowerUpManager = PowerUpManager;
