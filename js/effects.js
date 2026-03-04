// effects.js - 特效系统（增强版）
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

    // 烟雾效果
    createSmoke(position, color, count) {
        color = color || 0x222222;
        count = count || 6;

        for (let i = 0; i < count; i++) {
            const size = 0.3 + Math.random() * 0.4;
            const geo = new THREE.SphereGeometry(size, 6, 4);
            const mat = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.5 + Math.random() * 0.2
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(position);
            mesh.position.x += (Math.random() - 0.5) * 0.5;
            mesh.position.y += 0.3 + Math.random() * 0.5;
            mesh.position.z += (Math.random() - 0.5) * 0.5;

            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 1.0,
                0.8 + Math.random() * 1.5,
                (Math.random() - 0.5) * 1.0
            );

            this.scene.add(mesh);
            this.particles.push({
                mesh,
                velocity,
                life: 1.0,
                decay: 0.8 + Math.random() * 0.4,
                isSmoke: true,
                gravity: 0
            });
        }
    }

    // 火花效果（金属火星四溅）
    createSparks(position, count, color) {
        count = count || 20;
        color = color || 0xFFAA00;

        for (let i = 0; i < count; i++) {
            const size = 0.02 + Math.random() * 0.04;
            const geo = new THREE.BoxGeometry(size, size, size * 2);
            const sparkColor = Math.random() < 0.5 ? color : 0xFFFFAA;
            const mat = new THREE.MeshBasicMaterial({
                color: sparkColor
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(position);
            mesh.position.y += 0.5;

            const speed = 6 + Math.random() * 10;
            const angle = Math.random() * Math.PI * 2;
            const pitch = Math.random() * Math.PI * 0.6 - 0.1;
            const velocity = new THREE.Vector3(
                Math.cos(angle) * Math.cos(pitch) * speed,
                Math.sin(pitch) * speed + 2,
                Math.sin(angle) * Math.cos(pitch) * speed
            );

            this.scene.add(mesh);
            this.particles.push({
                mesh,
                velocity,
                life: 1.0,
                decay: 2.0 + Math.random() * 1.5,
                isSpark: true,
                gravity: -15
            });
        }

        // 火花伴随微型闪光
        const sparkLight = new THREE.PointLight(color, 1.5, 5);
        sparkLight.position.copy(position);
        sparkLight.position.y += 0.5;
        this.scene.add(sparkLight);
        this.particles.push({
            mesh: sparkLight,
            velocity: new THREE.Vector3(0, 0, 0),
            life: 1.0,
            decay: 5.0,
            isLight: true,
            gravity: 0
        });
    }

    // 碎屑效果
    createDebris(position, material, count) {
        count = count || 8;

        let debrisColor, debrisSize;
        switch (material) {
            case 'brick':
                debrisColor = [0x8B4513, 0xA0522D, 0xCD853F];
                debrisSize = [0.06, 0.12];
                break;
            case 'metal':
                debrisColor = [0x555555, 0x777777, 0x333333];
                debrisSize = [0.03, 0.08];
                break;
            case 'concrete':
                debrisColor = [0x999999, 0xAAAAAA, 0x777777];
                debrisSize = [0.05, 0.12];
                break;
            default:
                debrisColor = [0x888888];
                debrisSize = [0.05, 0.1];
        }

        for (let i = 0; i < count; i++) {
            const size = debrisSize[0] + Math.random() * (debrisSize[1] - debrisSize[0]);
            const geo = new THREE.BoxGeometry(
                size * (0.5 + Math.random()),
                size * (0.5 + Math.random()),
                size * (0.5 + Math.random())
            );
            const color = debrisColor[Math.floor(Math.random() * debrisColor.length)];
            const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.1 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(position);
            mesh.position.y += 0.3;

            const speed = 4 + Math.random() * 6;
            const angle = Math.random() * Math.PI * 2;
            const velocity = new THREE.Vector3(
                Math.cos(angle) * speed,
                Math.random() * 5 + 2,
                Math.sin(angle) * speed
            );

            this.scene.add(mesh);
            this.particles.push({
                mesh,
                velocity,
                life: 1.0,
                decay: 1.2 + Math.random() * 0.6,
                gravity: -14,
                isDebris: true,
                spinX: (Math.random() - 0.5) * 12,
                spinZ: (Math.random() - 0.5) * 12
            });
        }
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

    // 击中坦克：爆炸 + 黑烟 + 金属火星四溅 + 装甲碎片
    createTankHitEffect(position) {
        this.createExplosion(position, 'medium');
        this.createSmoke(position, 0x222222, 8);
        this.createSparks(position, 20, 0xFFAA00);
        this.createDebris(position, 'metal', 6);
    }

    // 击中砖墙：小爆炸 + 土黄尘雾 + 砖块碎屑
    createBrickHitEffect(position) {
        this.createExplosion(position, 'small');
        this.createSmoke(position, 0x8B7355, 5);
        this.createDebris(position, 'brick', 10);
    }

    // 击中钢墙：金属火花 + 少量烟雾
    createSteelHitEffect(position) {
        this.createSparks(position, 30, 0xFFFFAA);
        this.createSmoke(position, 0xAAAAAA, 3);
    }

    // 击中基地：大爆炸 + 浓烟 + 火星 + 建筑碎片
    createBaseHitEffect(position) {
        this.createExplosion(position, 'large');
        this.createSmoke(position, 0x111111, 12);
        this.createSparks(position, 15, 0xFF6600);
        this.createDebris(position, 'concrete', 8);
    }

    // 坦克击杀：更大的综合效果
    createTankDestroyEffect(position) {
        this.createExplosion(position, 'large');
        this.createSmoke(position, 0x111111, 15);
        this.createSparks(position, 30, 0xFFAA00);
        this.createDebris(position, 'metal', 12);
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
            } else if (p.isSmoke) {
                // 烟雾：向上飘动，逐渐扩大并变透明
                p.mesh.position.add(p.velocity.clone().multiplyScalar(deltaTime));
                p.mesh.material.opacity = p.life * 0.5;
                const s = 1 + (1 - p.life) * 2.5;
                p.mesh.scale.set(s, s, s);
            } else if (p.isSpark) {
                // 火花：高速运动 + 重力
                p.velocity.y += p.gravity * deltaTime;
                p.mesh.position.add(p.velocity.clone().multiplyScalar(deltaTime));
                const s = p.life * 0.8;
                p.mesh.scale.set(s, s, s);
            } else if (p.isDebris) {
                // 碎屑：弹射 + 重力 + 旋转
                p.velocity.y += p.gravity * deltaTime;
                p.mesh.position.add(p.velocity.clone().multiplyScalar(deltaTime));
                p.mesh.rotation.x += p.spinX * deltaTime;
                p.mesh.rotation.z += p.spinZ * deltaTime;
                const s = p.life;
                p.mesh.scale.set(s, s, s);
                // 碎屑落地后停止
                if (p.mesh.position.y < 0.05) {
                    p.mesh.position.y = 0.05;
                    p.velocity.y = 0;
                    p.velocity.x *= 0.5;
                    p.velocity.z *= 0.5;
                }
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
