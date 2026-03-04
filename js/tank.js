// tank.js - 坦克模型和控制
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

        // 地形引用和独立偏航角（用于地形倾斜）
        this.terrain = options.terrain || null;
        this.yaw = 0;

        // 射击冷却
        this.shootCooldown = options.shootCooldown || 0.5;
        this.shootTimer = 0;

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
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.95, -1.65);
        barrel.castShadow = true;
        this.turretGroup.add(barrel);

        const fumeGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.15, 8);
        const fume = this._mesh(fumeGeo, metalColor);
        fume.rotation.x = Math.PI / 2;
        fume.position.set(0, 0.95, -1.4);
        this.turretGroup.add(fume);

        const muzzleGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.2, 8);
        const muzzle = this._mesh(muzzleGeo, darkMetal);
        muzzle.rotation.x = Math.PI / 2;
        muzzle.position.set(0, 0.95, -2.6);
        this.turretGroup.add(muzzle);

        const muzzleHoleGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.05, 8);
        const muzzleHoleMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const muzzleHole = new THREE.Mesh(muzzleHoleGeo, muzzleHoleMat);
        muzzleHole.rotation.x = Math.PI / 2;
        muzzleHole.position.set(0, 0.95, -2.72);
        this.turretGroup.add(muzzleHole);

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

    // ====== 位置与移动（地形感知）======

    setPosition(x, z) {
        const y = this.terrain ? this.terrain.getHeightAt(x, z) : 0;
        this.group.position.set(x, y, z);
        this._updateTilt();
    }

    getPosition() {
        return this.group.position.clone();
    }

    getRotation() {
        return this.yaw;
    }

    getTurretWorldDirection() {
        const dir = new THREE.Vector3(0, 0, -1);
        dir.applyQuaternion(this.turretGroup.getWorldQuaternion(new THREE.Quaternion()));
        return dir;
    }

    getBarrelTipPosition() {
        const angle = this.yaw + this.turretGroup.rotation.y;
        const tankPos = this.group.position;
        return new THREE.Vector3(
            tankPos.x + Math.sin(angle) * -2.8,
            tankPos.y + 0.95,
            tankPos.z + Math.cos(angle) * -2.8
        );
    }

    getShootDirection() {
        const angle = this.yaw + this.turretGroup.rotation.y;
        return new THREE.Vector3(-Math.sin(angle), 0, -Math.cos(angle));
    }

    calcMovePosition(forward, deltaTime) {
        let currentSpeed = this.speedBoostTimer > 0 ? this.speed * 1.5 : this.speed;

        // 坡度速度修正
        if (this.terrain) {
            const slope = this.terrain.getSlopeInDirection(
                this.group.position.x, this.group.position.z, this.yaw
            );
            const slopeFactor = slope * forward;
            currentSpeed *= Math.max(0.3, Math.min(1.4, 1 - slopeFactor * 0.8));
        }

        const dx = -Math.sin(this.yaw) * forward * currentSpeed * deltaTime;
        const dz = -Math.cos(this.yaw) * forward * currentSpeed * deltaTime;
        const newX = this.group.position.x + dx;
        const newZ = this.group.position.z + dz;
        const newY = this.terrain ? this.terrain.getHeightAt(newX, newZ) : 0;
        return new THREE.Vector3(newX, newY, newZ);
    }

    applyPosition(pos) {
        this.group.position.x = pos.x;
        this.group.position.z = pos.z;
        if (this.terrain) {
            this.group.position.y = this.terrain.getHeightAt(pos.x, pos.z);
        }
        this._updateTilt();
    }

    rotate(direction, deltaTime) {
        this.yaw += direction * this.rotSpeed * deltaTime;
        this._updateTilt();
    }

    // 根据地形法线更新坦克俯仰和横滚
    _updateTilt() {
        if (!this.terrain) {
            this.group.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
            return;
        }
        const normal = this.terrain.getNormalAt(this.group.position.x, this.group.position.z);
        if (normal.y < 0.1) {
            this.group.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
            return;
        }
        const yawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        const tiltQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
        this.group.quaternion.multiplyQuaternions(tiltQuat, yawQuat);
    }

    setTurretRotation(angle) {
        this.turretGroup.rotation.y = angle - this.yaw;
    }

    aimTurretAt(targetPos) {
        const pos = this.group.position;
        const angle = Math.atan2(-(targetPos.x - pos.x), -(targetPos.z - pos.z));
        this.turretGroup.rotation.y = angle - this.yaw;
    }

    canShoot() {
        return this.shootTimer <= 0;
    }

    resetShootCooldown() {
        this.shootTimer = this.shootCooldown;
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
        this.boundingBox.min.set(pos.x - s, pos.y, pos.z - s);
        this.boundingBox.max.set(pos.x + s, pos.y + 2, pos.z + s);
    }

    getBoundingBoxAt(pos) {
        const s = Math.max(this.halfSize.x, this.halfSize.z);
        return new THREE.Box3(
            new THREE.Vector3(pos.x - s, pos.y, pos.z - s),
            new THREE.Vector3(pos.x + s, pos.y + 2, pos.z + s)
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

        // 每帧更新地形跟随
        if (this.terrain) {
            this.group.position.y = this.terrain.getHeightAt(this.group.position.x, this.group.position.z);
            this._updateTilt();
        }

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
