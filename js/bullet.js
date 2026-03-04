// bullet.js - 子弹系统
class Bullet {
    constructor(scene, position, direction, owner) {
        this.scene = scene;
        this.owner = owner; // 'player' 或 'enemy'
        this.speed = 20;
        this.alive = true;
        this.maxDistance = 50;
        this.distanceTraveled = 0;

        this.direction = direction.clone().normalize();

        // 子弹模型
        const geo = new THREE.SphereGeometry(0.15, 8, 6);
        const mat = new THREE.MeshStandardMaterial({
            color: 0xffdd00,
            emissive: 0xffaa00,
            emissiveIntensity: 0.8
        });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.copy(position);
        this.mesh.castShadow = false;
        this.scene.add(this.mesh);

        // 发光点光源
        this.light = new THREE.PointLight(0xffaa00, 0.5, 3);
        this.light.position.copy(position);
        this.scene.add(this.light);
    }

    update(deltaTime) {
        if (!this.alive) return;
        const move = this.direction.clone().multiplyScalar(this.speed * deltaTime);
        this.mesh.position.add(move);
        this.light.position.copy(this.mesh.position);
        this.distanceTraveled += this.speed * deltaTime;

        if (this.distanceTraveled > this.maxDistance) {
            this.destroy();
        }
    }

    getPosition() {
        return this.mesh.position.clone();
    }

    destroy() {
        this.alive = false;
        this.scene.remove(this.mesh);
        this.scene.remove(this.light);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
}

class BulletManager {
    constructor(scene) {
        this.scene = scene;
        this.bullets = [];
    }

    shoot(position, direction, owner) {
        const bullet = new Bullet(this.scene, position, direction, owner);
        this.bullets.push(bullet);
        return bullet;
    }

    update(deltaTime) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.update(deltaTime);
            if (!b.alive) {
                this.bullets.splice(i, 1);
            }
        }
    }

    clear() {
        this.bullets.forEach(b => b.destroy());
        this.bullets = [];
    }
}

window.Bullet = Bullet;
window.BulletManager = BulletManager;
