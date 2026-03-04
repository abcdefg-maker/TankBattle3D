// effects.js - 特效系统
class EffectsManager {
    constructor(scene) {
        this.scene = scene;
        this.particles = []; // 活跃的粒子
        this.muzzleFlashes = []; // 炮口闪光
    }

    createExplosion(position, size) {
        const count = size === 'large' ? 40 : size === 'medium' ? 25 : 15;
        const scale = size === 'large' ? 1.5 : size === 'medium' ? 1.0 : 0.6;

        for (let i = 0; i < count; i++) {
            const geo = new THREE.BoxGeometry(0.15 * scale, 0.15 * scale, 0.15 * scale);
            const colorVal = Math.random();
            let color;
            if (colorVal < 0.33) color = 0xff4400;
            else if (colorVal < 0.66) color = 0xff8800;
            else color = 0xffcc00;

            const mat = new THREE.MeshBasicMaterial({ color });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(position);
            mesh.position.y += 0.5;

            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 8 * scale,
                Math.random() * 6 * scale + 2,
                (Math.random() - 0.5) * 8 * scale
            );

            this.scene.add(mesh);
            this.particles.push({
                mesh,
                velocity,
                life: 1.0,
                decay: 1.0 + Math.random() * 0.5,
                gravity: -12
            });
        }

        // 爆炸闪光球
        const flashGeo = new THREE.SphereGeometry(1.5 * scale, 8, 6);
        const flashMat = new THREE.MeshBasicMaterial({
            color: 0xffcc00,
            transparent: true,
            opacity: 0.8
        });
        const flash = new THREE.Mesh(flashGeo, flashMat);
        flash.position.copy(position);
        flash.position.y += 0.5;
        this.scene.add(flash);
        this.particles.push({
            mesh: flash,
            velocity: new THREE.Vector3(0, 0, 0),
            life: 1.0,
            decay: 4.0,
            isFlash: true,
            gravity: 0
        });

        // 爆炸点光源
        const light = new THREE.PointLight(0xff6600, 3, 10);
        light.position.copy(position);
        light.position.y += 1;
        this.scene.add(light);
        this.particles.push({
            mesh: light,
            velocity: new THREE.Vector3(0, 0, 0),
            life: 1.0,
            decay: 3.0,
            isLight: true,
            gravity: 0
        });
    }

    createMuzzleFlash(position) {
        const light = new THREE.PointLight(0xffffff, 2, 5);
        light.position.copy(position);
        this.scene.add(light);
        this.muzzleFlashes.push({ light, timer: 0.08 });
    }

    // 坦克被击中闪烁效果
    createHitFlash(tank) {
        if (!tank.alive || !tank.group) return;
        tank.group.traverse(child => {
            if (child.isMesh && child.material && !child.material.transparent) {
                const originalColor = child.material.color.getHex();
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

    update(deltaTime) {
        // 更新粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= p.decay * deltaTime;

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                if (p.mesh.geometry) p.mesh.geometry.dispose();
                if (p.mesh.material) p.mesh.material.dispose();
                this.particles.splice(i, 1);
                continue;
            }

            if (p.isFlash) {
                p.mesh.material.opacity = p.life * 0.8;
                const s = 1 + (1 - p.life) * 2;
                p.mesh.scale.set(s, s, s);
            } else if (p.isLight) {
                p.mesh.intensity = p.life * 3;
            } else {
                p.velocity.y += p.gravity * deltaTime;
                p.mesh.position.add(p.velocity.clone().multiplyScalar(deltaTime));
                const s = p.life;
                p.mesh.scale.set(s, s, s);
                p.mesh.rotation.x += deltaTime * 5;
                p.mesh.rotation.z += deltaTime * 3;
            }
        }

        // 更新炮口闪光
        for (let i = this.muzzleFlashes.length - 1; i >= 0; i--) {
            const f = this.muzzleFlashes[i];
            f.timer -= deltaTime;
            if (f.timer <= 0) {
                this.scene.remove(f.light);
                this.muzzleFlashes.splice(i, 1);
            }
        }
    }

    clear() {
        this.particles.forEach(p => {
            this.scene.remove(p.mesh);
            if (p.mesh.geometry) p.mesh.geometry.dispose();
            if (p.mesh.material) p.mesh.material.dispose();
        });
        this.muzzleFlashes.forEach(f => this.scene.remove(f.light));
        this.particles = [];
        this.muzzleFlashes = [];
    }
}

window.EffectsManager = EffectsManager;
