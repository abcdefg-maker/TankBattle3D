// TankBullet.js - 子弹类（模型+飞行+拖尾）
class TankBullet {
    constructor(scene, position, direction, owner) {
        this.scene = scene;
        this.owner = owner; // 'player' 或 'enemy'
        this.speed = 20;
        this.alive = true;
        this.maxDistance = 50;
        this.distanceTraveled = 0;

        this.direction = direction.clone().normalize();

        // 炮弹模型组
        this.group = new THREE.Group();

        // 弹头（锥形）
        const headGeo = new THREE.ConeGeometry(0.07, 0.2, 8);
        const headMat = new THREE.MeshStandardMaterial({
            color: 0x555555, metalness: 0.8, roughness: 0.2
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.rotation.x = -Math.PI / 2;
        head.position.z = -0.25;
        this.group.add(head);

        // 弹体（圆柱）
        const bodyGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.3, 8);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xB87333, metalness: 0.6, roughness: 0.3
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.rotation.x = Math.PI / 2;
        body.position.z = -0.05;
        this.group.add(body);

        // 弹尾（略收窄）
        const tailGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.1, 8);
        const tailMat = new THREE.MeshStandardMaterial({
            color: 0x444444, metalness: 0.7, roughness: 0.3
        });
        const tail = new THREE.Mesh(tailGeo, tailMat);
        tail.rotation.x = Math.PI / 2;
        tail.position.z = 0.15;
        this.group.add(tail);

        this.group.position.copy(position);

        // 朝飞行方向对齐
        const lookTarget = position.clone().add(this.direction);
        this.group.lookAt(lookTarget);

        this.scene.add(this.group);

        // 发光点光源
        this.light = new THREE.PointLight(0xffaa00, 0.4, 3);
        this.light.position.copy(position);
        this.scene.add(this.light);

        // 拖尾粒子系统
        this.trailParticles = [];
        this.trailTimer = 0;
    }

    update(deltaTime) {
        if (!this.alive) return;
        const move = this.direction.clone().multiplyScalar(this.speed * deltaTime);
        this.group.position.add(move);
        this.light.position.copy(this.group.position);
        this.distanceTraveled += this.speed * deltaTime;

        // 轻微自旋（模拟膛线旋转）
        this.group.rotateZ(deltaTime * 15);

        // 生成拖尾粒子
        this.trailTimer += deltaTime;
        if (this.trailTimer > 0.015) {
            this.trailTimer = 0;
            this._spawnTrailParticle();
        }

        // 更新拖尾粒子
        for (let i = this.trailParticles.length - 1; i >= 0; i--) {
            const p = this.trailParticles[i];
            p.life -= deltaTime * 4;
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this.trailParticles.splice(i, 1);
            } else {
                const s = p.life * p.initScale;
                p.mesh.scale.set(s, s, s);
                p.mesh.material.opacity = p.life * 0.6;
                p.mesh.position.y += deltaTime * 0.3;
            }
        }

        if (this.distanceTraveled > this.maxDistance) {
            this.destroy();
        }
    }

    _spawnTrailParticle() {
        if (this.trailParticles.length >= 12) return;

        const size = 0.04 + Math.random() * 0.04;
        const geo = new THREE.SphereGeometry(size, 4, 3);
        const colorLerp = Math.random();
        const r = 1.0 - colorLerp * 0.6;
        const g = 0.6 - colorLerp * 0.3;
        const b = 0.1 - colorLerp * 0.05;
        const mat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(r, g, b),
            transparent: true,
            opacity: 0.6
        });
        const mesh = new THREE.Mesh(geo, mat);
        const tailPos = this.group.position.clone();
        tailPos.x += (Math.random() - 0.5) * 0.05;
        tailPos.z += (Math.random() - 0.5) * 0.05;
        mesh.position.copy(tailPos);
        this.scene.add(mesh);
        this.trailParticles.push({ mesh, life: 1.0, initScale: 1.0 });
    }

    getPosition() {
        return this.group.position.clone();
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
        this.scene.remove(this.light);
        for (const p of this.trailParticles) {
            this.scene.remove(p.mesh);
            p.mesh.geometry.dispose();
            p.mesh.material.dispose();
        }
        this.trailParticles = [];
    }
}

window.TankBullet = TankBullet;
