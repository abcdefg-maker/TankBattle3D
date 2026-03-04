// tank.js - 坦克模型和控制（平地版本）
class Tank {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.type = options.type || 'player';
        this.hp = options.hp || 1;
        this.maxHp = this.hp;
        this.speed = options.speed || 5;
        this.rotSpeed = options.rotSpeed || 3;
        this.color = options.color || 0x4a7c59;
        this.alive = true;
        this.shielded = false;
        this.shieldTimer = 0;
        this.speedBoostTimer = 0;
        this.originalSpeed = this.speed;

        // 射击冷却
        this.shootCooldown = options.shootCooldown || 2.0;
        this.shootTimer = 0;

        // 后坐力系统
        this.isRecoiling = false;
        this.recoilOffset = 0;       // 炮管后缩偏移量
        this.recoilPitch = 0;        // 炮塔仰角偏移
        this.recoilShake = 0;        // 车体震动
        this.recoilPhase = 'idle';   // idle | recoil | recover

        // 创建坦克模型
        this.group = new THREE.Group();
        this.turretGroup = new THREE.Group();
        this.buildModel();
        this.scene.add(this.group);

        // 碰撞盒
        this.boundingBox = new THREE.Box3();
        this.halfSize = { x: 1.0, z: 1.5 };
    }

    buildModel() {
        const mainColor = this.color;
        const darkColor = new THREE.Color(mainColor).multiplyScalar(0.65).getHex();
        const lightColor = new THREE.Color(mainColor).multiplyScalar(1.2).getHex();
        const metalColor = 0x4a4a4a;
        const darkMetal = 0x2a2a2a;
        const trackColor = 0x222222;

        // ====== 底盘 ======
        const chassisGroup = new THREE.Group();

        const hullBottom = this._mesh(new THREE.BoxGeometry(1.8, 0.3, 2.8), mainColor);
        hullBottom.position.set(0, 0.25, 0);
        chassisGroup.add(hullBottom);

        const hullTop = this._mesh(new THREE.BoxGeometry(1.6, 0.25, 2.6), mainColor);
        hullTop.position.set(0, 0.525, 0);
        chassisGroup.add(hullTop);

        const frontArmor = this._mesh(new THREE.BoxGeometry(1.5, 0.35, 0.15), darkColor);
        frontArmor.position.set(0, 0.45, -1.4);
        frontArmor.rotation.x = -0.4;
        chassisGroup.add(frontArmor);

        const rearPlate = this._mesh(new THREE.BoxGeometry(1.5, 0.35, 0.1), darkColor);
        rearPlate.position.set(0, 0.4, 1.35);
        chassisGroup.add(rearPlate);

        const engineDeck = this._mesh(new THREE.BoxGeometry(1.4, 0.06, 0.9), darkColor);
        engineDeck.position.set(0, 0.66, 0.9);
        chassisGroup.add(engineDeck);

        for (let i = 0; i < 4; i++) {
            const grille = this._mesh(new THREE.BoxGeometry(0.8, 0.03, 0.05), darkMetal);
            grille.position.set(0, 0.67, 0.6 + i * 0.18);
            chassisGroup.add(grille);
        }

        const exhaustGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.6, 6);
        const exhaustL = this._mesh(exhaustGeo, darkMetal);
        exhaustL.position.set(-0.65, 0.55, 1.2);
        exhaustL.rotation.x = Math.PI / 2;
        chassisGroup.add(exhaustL);
        const exhaustR = this._mesh(exhaustGeo.clone(), darkMetal);
        exhaustR.position.set(0.65, 0.55, 1.2);
        exhaustR.rotation.x = Math.PI / 2;
        chassisGroup.add(exhaustR);

        const headlightGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.05, 8);
        const headlightMat = new THREE.MeshStandardMaterial({ color: 0xffffcc, emissive: 0x333322, emissiveIntensity: 0.3 });
        const hlL = new THREE.Mesh(headlightGeo, headlightMat);
        hlL.position.set(-0.55, 0.45, -1.42);
        hlL.rotation.x = Math.PI / 2;
        chassisGroup.add(hlL);
        const hlR = new THREE.Mesh(headlightGeo.clone(), headlightMat.clone());
        hlR.position.set(0.55, 0.45, -1.42);
        hlR.rotation.x = Math.PI / 2;
        chassisGroup.add(hlR);

        const towGeo = new THREE.TorusGeometry(0.07, 0.02, 6, 8);
        const towL = this._mesh(towGeo, metalColor);
        towL.position.set(-0.45, 0.25, 1.42);
        chassisGroup.add(towL);
        const towR = this._mesh(towGeo.clone(), metalColor);
        towR.position.set(0.45, 0.25, 1.42);
        chassisGroup.add(towR);

        // ====== 履带系统 ======
        this._buildTrack(chassisGroup, -1.05, trackColor, darkMetal);
        this._buildTrack(chassisGroup, 1.05, trackColor, darkMetal);

        const skirtGeo = new THREE.BoxGeometry(0.04, 0.25, 2.9);
        const skirtMat = new THREE.MeshStandardMaterial({ color: darkColor, roughness: 0.8 });
        const skirtL = new THREE.Mesh(skirtGeo, skirtMat);
        skirtL.position.set(-1.22, 0.5, 0);
        skirtL.castShadow = true;
        chassisGroup.add(skirtL);
        const skirtR = new THREE.Mesh(skirtGeo.clone(), skirtMat.clone());
        skirtR.position.set(1.22, 0.5, 0);
        skirtR.castShadow = true;
        chassisGroup.add(skirtR);

        chassisGroup.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
        this.group.add(chassisGroup);

        // ====== 炮塔 ======
        this._buildTurret(mainColor, darkColor, lightColor, metalColor, darkMetal);
        this.group.add(this.turretGroup);

        // 护盾效果
        const shieldGeo = new THREE.SphereGeometry(2, 16, 12);
        const shieldMat = new THREE.MeshStandardMaterial({
            color: 0x4488ff, transparent: true, opacity: 0, side: THREE.DoubleSide
        });
        this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        this.shieldMesh.position.y = 0.8;
        this.group.add(this.shieldMesh);
    }

    _buildTrack(parent, xOffset, trackColor, metalColor) {
        const trackOuter = this._mesh(new THREE.BoxGeometry(0.35, 0.45, 3.0), trackColor);
        trackOuter.position.set(xOffset, 0.28, 0);
        parent.add(trackOuter);

        const trackInner = this._mesh(new THREE.BoxGeometry(0.15, 0.5, 3.05), 0x1a1a1a);
        trackInner.position.set(xOffset + (xOffset > 0 ? -0.2 : 0.2), 0.28, 0);
        parent.add(trackInner);

        const wheelGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.15, 10);
        for (let i = 0; i < 5; i++) {
            const wheel = this._mesh(wheelGeo.clone(), metalColor);
            wheel.position.set(xOffset, 0.22, -1.1 + i * 0.55);
            wheel.rotation.z = Math.PI / 2;
            parent.add(wheel);
            const hubGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.16, 6);
            const hub = this._mesh(hubGeo, 0x666666);
            hub.position.set(xOffset, 0.22, -1.1 + i * 0.55);
            hub.rotation.z = Math.PI / 2;
            parent.add(hub);
        }

        const driveGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.18, 10);
        const driveFront = this._mesh(driveGeo.clone(), metalColor);
        driveFront.position.set(xOffset, 0.3, -1.42);
        driveFront.rotation.z = Math.PI / 2;
        parent.add(driveFront);
        const driveRear = this._mesh(driveGeo.clone(), metalColor);
        driveRear.position.set(xOffset, 0.3, 1.42);
        driveRear.rotation.z = Math.PI / 2;
        parent.add(driveRear);

        const segGeo = new THREE.BoxGeometry(0.38, 0.04, 0.12);
        const segColor = 0x1a1a1a;
        for (let i = 0; i < 12; i++) {
            const seg = this._mesh(segGeo.clone(), segColor);
            seg.position.set(xOffset, 0.04, -1.3 + i * 0.23);
            parent.add(seg);
            const segTop = this._mesh(segGeo.clone(), segColor);
            segTop.position.set(xOffset, 0.52, -1.3 + i * 0.23);
            parent.add(segTop);
        }
    }

    _buildTurret(mainColor, darkColor, lightColor, metalColor, darkMetal) {
        const turretRing = this._mesh(new THREE.CylinderGeometry(0.7, 0.75, 0.1, 12), darkColor);
        turretRing.position.y = 0.7;
        this.turretGroup.add(turretRing);

        const turretBase = this._mesh(new THREE.CylinderGeometry(0.65, 0.7, 0.35, 8), mainColor);
        turretBase.position.y = 0.92;
        this.turretGroup.add(turretBase);

        const turretTop = this._mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.15, 8), mainColor);
        turretTop.position.y = 1.17;
        this.turretGroup.add(turretTop);

        const turretFront = this._mesh(new THREE.BoxGeometry(0.8, 0.3, 0.2), darkColor);
        turretFront.position.set(0, 0.95, -0.65);
        turretFront.rotation.x = -0.3;
        this.turretGroup.add(turretFront);

        const hatchGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.08, 8);
        const hatch = this._mesh(hatchGeo, darkColor);
        hatch.position.set(0.2, 1.28, 0.15);
        this.turretGroup.add(hatch);

        const handleGeo = new THREE.BoxGeometry(0.16, 0.03, 0.03);
        const handle = this._mesh(handleGeo, metalColor);
        handle.position.set(0.2, 1.33, 0.15);
        this.turretGroup.add(handle);

        const periscopeGeo = new THREE.BoxGeometry(0.08, 0.1, 0.08);
        for (let i = 0; i < 3; i++) {
            const p = this._mesh(periscopeGeo.clone(), 0x224422);
            p.position.set(-0.25 + i * 0.25, 1.29, -0.2);
            this.turretGroup.add(p);
        }

        const sideBoxGeo = new THREE.BoxGeometry(0.12, 0.2, 0.5);
        const sideBoxL = this._mesh(sideBoxGeo, darkColor);
        sideBoxL.position.set(-0.72, 0.92, 0.1);
        this.turretGroup.add(sideBoxL);
        const sideBoxR = this._mesh(sideBoxGeo.clone(), darkColor);
        sideBoxR.position.set(0.72, 0.92, 0.1);
        this.turretGroup.add(sideBoxR);

        const rearBoxGeo = new THREE.BoxGeometry(0.8, 0.25, 0.3);
        const rearBox = this._mesh(rearBoxGeo, darkColor);
        rearBox.position.set(0, 0.88, 0.6);
        this.turretGroup.add(rearBox);

        // 炮管系统
        const mantletGeo = new THREE.BoxGeometry(0.55, 0.3, 0.15);
        const mantlet = this._mesh(mantletGeo, darkColor);
        mantlet.position.set(0, 0.95, -0.75);
        this.turretGroup.add(mantlet);

        const barrelGeo = new THREE.CylinderGeometry(0.07, 0.08, 1.8, 8);
        const barrelMat = new THREE.MeshStandardMaterial({ color: metalColor, metalness: 0.7, roughness: 0.3 });
        this.barrelMesh = new THREE.Mesh(barrelGeo, barrelMat);
        this.barrelMesh.rotation.x = Math.PI / 2;
        this.barrelMesh.position.set(0, 0.95, -1.65);
        this.barrelMesh.castShadow = true;
        this.barrelBaseZ = -1.65; // 记录炮管原始Z位置
        this.turretGroup.add(this.barrelMesh);

        const fumeGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.15, 8);
        this.fumeMesh = this._mesh(fumeGeo, metalColor);
        this.fumeMesh.rotation.x = Math.PI / 2;
        this.fumeMesh.position.set(0, 0.95, -1.4);
        this.fumeBaseZ = -1.4;
        this.turretGroup.add(this.fumeMesh);

        const muzzleGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.2, 8);
        this.muzzleMesh = this._mesh(muzzleGeo, darkMetal);
        this.muzzleMesh.rotation.x = Math.PI / 2;
        this.muzzleMesh.position.set(0, 0.95, -2.6);
        this.muzzleBaseZ = -2.6;
        this.turretGroup.add(this.muzzleMesh);

        const muzzleHoleGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.05, 8);
        const muzzleHoleMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        this.muzzleHoleMesh = new THREE.Mesh(muzzleHoleGeo, muzzleHoleMat);
        this.muzzleHoleMesh.rotation.x = Math.PI / 2;
        this.muzzleHoleMesh.position.set(0, 0.95, -2.72);
        this.muzzleHoleBaseZ = -2.72;
        this.turretGroup.add(this.muzzleHoleMesh);

        if (this.type === 'player') {
            const antennaGeo = new THREE.CylinderGeometry(0.01, 0.015, 1.2, 4);
            const antenna = this._mesh(antennaGeo, darkMetal);
            antenna.position.set(-0.4, 1.85, 0.35);
            antenna.rotation.z = 0.1;
            this.turretGroup.add(antenna);
            const antTip = this._mesh(new THREE.SphereGeometry(0.03, 6, 4), 0xff3333);
            antTip.position.set(-0.42, 2.45, 0.35);
            this.turretGroup.add(antTip);
        }

        if (this.type === 'heavy') {
            const extraArmor = this._mesh(new THREE.BoxGeometry(0.9, 0.35, 0.08), darkColor);
            extraArmor.position.set(0, 0.95, -0.82);
            this.turretGroup.add(extraArmor);
            const extraSkirtGeo = new THREE.BoxGeometry(0.06, 0.3, 1.0);
            const eSkirtL = this._mesh(extraSkirtGeo, darkColor);
            eSkirtL.position.set(-0.78, 0.92, 0);
            this.turretGroup.add(eSkirtL);
            const eSkirtR = this._mesh(extraSkirtGeo.clone(), darkColor);
            eSkirtR.position.set(0.78, 0.92, 0);
            this.turretGroup.add(eSkirtR);
        }

        this.turretGroup.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    }

    _mesh(geo, color) {
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.1 });
        return new THREE.Mesh(geo, mat);
    }

    // ====== 位置与移动 ======

    setPosition(x, z) {
        this.group.position.set(x, 0, z);
    }

    getPosition() {
        return this.group.position.clone();
    }

    getRotation() {
        return this.group.rotation.y;
    }

    getBarrelTipPosition() {
        const angle = this.group.rotation.y + this.turretGroup.rotation.y;
        const tankPos = this.group.position;
        return new THREE.Vector3(
            tankPos.x + Math.sin(angle) * -2.8,
            0.95,
            tankPos.z + Math.cos(angle) * -2.8
        );
    }

    getShootDirection() {
        const angle = this.group.rotation.y + this.turretGroup.rotation.y;
        return new THREE.Vector3(-Math.sin(angle), 0, -Math.cos(angle));
    }

    calcMovePosition(forward, deltaTime) {
        const currentSpeed = this.speedBoostTimer > 0 ? this.speed * 1.5 : this.speed;
        const angle = this.group.rotation.y;
        const dx = -Math.sin(angle) * forward * currentSpeed * deltaTime;
        const dz = -Math.cos(angle) * forward * currentSpeed * deltaTime;
        return new THREE.Vector3(this.group.position.x + dx, 0, this.group.position.z + dz);
    }

    applyPosition(pos) {
        this.group.position.x = pos.x;
        this.group.position.z = pos.z;
    }

    rotate(direction, deltaTime) {
        this.group.rotation.y += direction * this.rotSpeed * deltaTime;
    }

    setTurretRotation(angle) {
        this.turretGroup.rotation.y = angle - this.group.rotation.y;
    }

    aimTurretAt(targetPos) {
        const pos = this.group.position;
        const angle = Math.atan2(-(targetPos.x - pos.x), -(targetPos.z - pos.z));
        this.turretGroup.rotation.y = angle - this.group.rotation.y;
    }

    canShoot() {
        return this.shootTimer <= 0 && !this.isRecoiling;
    }

    resetShootCooldown() {
        this.shootTimer = this.shootCooldown;
    }

    startRecoil() {
        this.isRecoiling = true;
        this.recoilPhase = 'recoil';
        this.recoilOffset = 0;
        this.recoilPitch = 0;
        this.recoilShake = 0.04;
    }

    updateRecoil(deltaTime) {
        if (this.recoilPhase === 'idle') return;

        if (this.recoilPhase === 'recoil') {
            // 快速后缩
            this.recoilOffset += (-0.45 - this.recoilOffset) * Math.min(1, deltaTime * 35);
            this.recoilPitch += (0.06 - this.recoilPitch) * Math.min(1, deltaTime * 35);
            if (this.recoilOffset <= -0.4) {
                this.recoilPhase = 'recover';
            }
        } else if (this.recoilPhase === 'recover') {
            // 缓慢恢复
            this.recoilOffset += (0 - this.recoilOffset) * Math.min(1, deltaTime * 3.5);
            this.recoilPitch += (0 - this.recoilPitch) * Math.min(1, deltaTime * 3.5);
            if (Math.abs(this.recoilOffset) < 0.01) {
                this.recoilOffset = 0;
                this.recoilPitch = 0;
                this.recoilPhase = 'idle';
                this.isRecoiling = false;
            }
        }

        // 车体微震衰减
        if (this.recoilShake > 0) {
            this.recoilShake *= Math.max(0, 1 - deltaTime * 15);
            if (this.recoilShake < 0.001) this.recoilShake = 0;
        }

        // 应用到炮管模型
        const offset = this.recoilOffset;
        if (this.barrelMesh) this.barrelMesh.position.z = this.barrelBaseZ - offset;
        if (this.fumeMesh) this.fumeMesh.position.z = this.fumeBaseZ - offset;
        if (this.muzzleMesh) this.muzzleMesh.position.z = this.muzzleBaseZ - offset;
        if (this.muzzleHoleMesh) this.muzzleHoleMesh.position.z = this.muzzleHoleBaseZ - offset;

        // 炮塔仰角
        if (this.turretGroup) {
            this.turretGroup.rotation.x = this.recoilPitch;
        }

        // 车体微震
        if (this.recoilShake > 0 && this.group) {
            this.group.position.y = (Math.random() - 0.5) * this.recoilShake * 2;
        } else if (this.group) {
            this.group.position.y = 0;
        }
    }

    takeDamage(amount) {
        if (this.shielded) return false;
        this.hp -= amount;
        if (this.hp <= 0) {
            this.alive = false;
            return true;
        }
        return false;
    }

    activateShield(duration) {
        this.shielded = true;
        this.shieldTimer = duration;
        this.shieldMesh.material.opacity = 0.3;
    }

    activateSpeedBoost(duration) {
        this.speedBoostTimer = duration;
    }

    updateBoundingBox() {
        const pos = this.group.position;
        const s = Math.max(this.halfSize.x, this.halfSize.z);
        this.boundingBox.min.set(pos.x - s, 0, pos.z - s);
        this.boundingBox.max.set(pos.x + s, 2, pos.z + s);
    }

    getBoundingBoxAt(pos) {
        const s = Math.max(this.halfSize.x, this.halfSize.z);
        return new THREE.Box3(
            new THREE.Vector3(pos.x - s, 0, pos.z - s),
            new THREE.Vector3(pos.x + s, 2, pos.z + s)
        );
    }

    update(deltaTime) {
        if (this.shootTimer > 0) this.shootTimer -= deltaTime;

        if (this.shieldTimer > 0) {
            this.shieldTimer -= deltaTime;
            this.shieldMesh.material.opacity = 0.2 + Math.sin(Date.now() * 0.01) * 0.15;
            if (this.shieldTimer <= 0) {
                this.shielded = false;
                this.shieldMesh.material.opacity = 0;
            }
        }

        if (this.speedBoostTimer > 0) this.speedBoostTimer -= deltaTime;

        this.updateRecoil(deltaTime);
        this.updateBoundingBox();
    }

    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
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

window.Tank = Tank;
