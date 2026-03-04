// map.js - 野战场景地图系统（基于地形的参数化关卡）

const LEVEL_DATA = [
    // 关卡1 - 丘陵草原
    {
        name: '第 1 关',
        desc: '丘陵草原 - 熟悉地形操控',
        enemies: { normal: 4, elite: 0, heavy: 0 },
        terrain: {
            seed: 42,
            octaves: [
                { freq: 0.025, amp: 2.5 },
                { freq: 0.06,  amp: 1.2 },
                { freq: 0.13,  amp: 0.4 }
            ],
            craters: [
                { x: -10, z: -5, radius: 4, depth: 1.5 },
                { x: 12, z: 5, radius: 3, depth: 1.2 }
            ],
            ridges: [],
            flatZones: [
                { x: 0, z: 30, radius: 8, height: 0 },   // 基地区域
                { x: -20, z: -28, radius: 5, height: 0.5 }, // 出生点1
                { x: 0, z: -28, radius: 5, height: 0.5 },   // 出生点2
                { x: 20, z: -28, radius: 5, height: 0.5 },  // 出生点3
                { x: -10, z: 28, radius: 5, height: 0 }     // 玩家出生
            ],
            waterLevel: -1.5
        },
        obstacles: [
            { type: 'rock_large', x: -15, z: 0 },
            { type: 'rock_large', x: 18, z: -10 },
            { type: 'rock_small', x: -5, z: -12 },
            { type: 'rock_small', x: 8, z: 10 },
            { type: 'rock_small', x: -20, z: 15 },
            { type: 'sandbag', x: 5, z: -5, rotation: 0.3 },
            { type: 'sandbag', x: -8, z: 8, rotation: -0.5 },
            { type: 'stump', x: 12, z: 18 },
            { type: 'stump', x: -18, z: -15 },
            { type: 'stump', x: 22, z: -5 }
        ],
        spawnPoints: [
            { x: -20, z: -28 },
            { x: 0, z: -28 },
            { x: 20, z: -28 }
        ],
        playerSpawn: { x: -10, z: 28 },
        basePosition: { x: 0, z: 32 }
    },
    // 关卡2 - 河谷交锋
    {
        name: '第 2 关',
        desc: '河谷交锋 - 争夺制高点',
        enemies: { normal: 3, elite: 2, heavy: 0 },
        terrain: {
            seed: 137,
            octaves: [
                { freq: 0.02, amp: 3.0 },
                { freq: 0.05, amp: 1.5 },
                { freq: 0.11, amp: 0.6 }
            ],
            craters: [
                { x: -8, z: -10, radius: 3.5, depth: 1.5 },
                { x: 10, z: 0, radius: 4, depth: 1.8 },
                { x: -15, z: 10, radius: 3, depth: 1.2 }
            ],
            ridges: [
                { x1: -30, z1: -5, x2: 30, z2: 5, width: 6, height: 2.5 }
            ],
            flatZones: [
                { x: 0, z: 30, radius: 8, height: 0 },
                { x: -22, z: -28, radius: 5, height: 1.0 },
                { x: 0, z: -28, radius: 5, height: 1.0 },
                { x: 22, z: -28, radius: 5, height: 1.0 },
                { x: -10, z: 28, radius: 5, height: 0 }
            ],
            waterLevel: -1.0
        },
        obstacles: [
            { type: 'rock_large', x: -20, z: 5 },
            { type: 'rock_large', x: 22, z: -8 },
            { type: 'rock_large', x: 0, z: -15 },
            { type: 'rock_small', x: -12, z: -20 },
            { type: 'rock_small', x: 15, z: 15 },
            { type: 'rock_small', x: -25, z: -10 },
            { type: 'sandbag', x: -5, z: 12, rotation: 0 },
            { type: 'sandbag', x: 8, z: -8, rotation: 0.8 },
            { type: 'sandbag', x: -15, z: -5, rotation: -0.3 },
            { type: 'ruin', x: 20, z: 20 },
            { type: 'ruin', x: -22, z: -18 },
            { type: 'stump', x: 5, z: 22 },
            { type: 'stump', x: -10, z: -25 }
        ],
        spawnPoints: [
            { x: -22, z: -28 },
            { x: 0, z: -28 },
            { x: 22, z: -28 }
        ],
        playerSpawn: { x: -10, z: 28 },
        basePosition: { x: 0, z: 32 }
    },
    // 关卡3 - 焦土战场
    {
        name: '第 3 关',
        desc: '焦土战场 - 全面战斗',
        enemies: { normal: 3, elite: 2, heavy: 2 },
        terrain: {
            seed: 256,
            octaves: [
                { freq: 0.03, amp: 3.5 },
                { freq: 0.07, amp: 2.0 },
                { freq: 0.15, amp: 0.7 }
            ],
            craters: [
                { x: -5, z: -5, radius: 5, depth: 2.2 },
                { x: 15, z: -15, radius: 4, depth: 1.8 },
                { x: -18, z: 8, radius: 3.5, depth: 1.5 },
                { x: 8, z: 12, radius: 3, depth: 1.3 },
                { x: -12, z: -18, radius: 4, depth: 1.6 },
                { x: 20, z: 5, radius: 3, depth: 1.4 }
            ],
            ridges: [
                { x1: -25, z1: -15, x2: 25, z2: -10, width: 5, height: 3.0 },
                { x1: -15, z1: 10, x2: 15, z2: 15, width: 4, height: 2.0 }
            ],
            flatZones: [
                { x: 0, z: 30, radius: 8, height: 0 },
                { x: -22, z: -28, radius: 5, height: 0.5 },
                { x: 0, z: -30, radius: 5, height: 0.5 },
                { x: 22, z: -28, radius: 5, height: 0.5 },
                { x: -10, z: 28, radius: 5, height: 0 }
            ],
            waterLevel: -1.2
        },
        obstacles: [
            { type: 'rock_large', x: -25, z: 0 },
            { type: 'rock_large', x: 25, z: -5 },
            { type: 'rock_large', x: -8, z: -22 },
            { type: 'rock_large', x: 10, z: 20 },
            { type: 'rock_small', x: 0, z: 0 },
            { type: 'rock_small', x: -15, z: -12 },
            { type: 'rock_small', x: 18, z: 10 },
            { type: 'rock_small', x: -20, z: 18 },
            { type: 'sandbag', x: -3, z: 18, rotation: 0.2 },
            { type: 'sandbag', x: 12, z: -3, rotation: -0.4 },
            { type: 'sandbag', x: -18, z: -8, rotation: 0.6 },
            { type: 'sandbag', x: 5, z: -20, rotation: 0 },
            { type: 'ruin', x: -10, z: 5 },
            { type: 'ruin', x: 15, z: -20 },
            { type: 'ruin', x: -25, z: -20 },
            { type: 'stump', x: 0, z: -10 },
            { type: 'stump', x: -22, z: 12 },
            { type: 'stump', x: 25, z: 15 }
        ],
        spawnPoints: [
            { x: -22, z: -28 },
            { x: 0, z: -30 },
            { x: 22, z: -28 }
        ],
        playerSpawn: { x: -10, z: 28 },
        basePosition: { x: 0, z: 32 }
    }
];

// ====== 地图管理类 ======
class GameMap {
    constructor(scene) {
        this.scene = scene;
        this.terrain = new Terrain(scene);
        this.obstacles = [];    // { mesh/group, type, destructible }
        this.baseMeshes = [];
        this.spawnPoints = [];
        this.miscMeshes = [];
    }

    loadLevel(levelIndex) {
        this.clear();
        const level = LEVEL_DATA[levelIndex];

        // 生成地形
        this.terrain.generate(level.terrain);

        // 放置障碍物
        level.obstacles.forEach(o => this._placeObstacle(o));

        // 放置基地
        this._createBase(level.basePosition.x, level.basePosition.z);

        // 出生点
        this.spawnPoints = level.spawnPoints.map(p => ({ x: p.x, z: p.z }));

        // 边界围栏
        this._buildBorder();

        return level;
    }

    // ====== 障碍物生成 ======
    _placeObstacle(config) {
        const y = this.terrain.getHeightAt(config.x, config.z);
        let obj;
        switch (config.type) {
            case 'rock_large': obj = this._createRockLarge(config.x, y, config.z); break;
            case 'rock_small': obj = this._createRockSmall(config.x, y, config.z); break;
            case 'sandbag':    obj = this._createSandbag(config.x, y, config.z, config.rotation || 0); break;
            case 'ruin':       obj = this._createRuin(config.x, y, config.z); break;
            case 'stump':      obj = this._createStump(config.x, y, config.z); break;
        }
    }

    _createRockLarge(x, y, z) {
        const group = new THREE.Group();
        const colors = [0x777766, 0x666655, 0x888877];
        // 主体 - 大块不规则岩石
        const mainGeo = new THREE.DodecahedronGeometry(1.8, 1);
        this._deformGeo(mainGeo, 0.4);
        const main = new THREE.Mesh(mainGeo, new THREE.MeshStandardMaterial({ color: colors[0], roughness: 0.9, flatShading: true }));
        main.scale.set(1, 0.7, 1.1);
        main.position.y = 0.8;
        group.add(main);
        // 附石
        const sub1Geo = new THREE.DodecahedronGeometry(1.0, 0);
        this._deformGeo(sub1Geo, 0.3);
        const sub1 = new THREE.Mesh(sub1Geo, new THREE.MeshStandardMaterial({ color: colors[1], roughness: 0.9, flatShading: true }));
        sub1.position.set(1.2, 0.4, 0.5);
        sub1.scale.set(1, 0.6, 0.9);
        group.add(sub1);
        const sub2Geo = new THREE.DodecahedronGeometry(0.7, 0);
        this._deformGeo(sub2Geo, 0.2);
        const sub2 = new THREE.Mesh(sub2Geo, new THREE.MeshStandardMaterial({ color: colors[2], roughness: 0.85, flatShading: true }));
        sub2.position.set(-0.8, 0.3, -0.6);
        group.add(sub2);

        group.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
        group.position.set(x, y, z);
        group.rotation.y = Math.random() * Math.PI * 2;
        group.userData = { type: 'rock', destructible: false, radius: 2.2 };
        this.scene.add(group);
        this.obstacles.push(group);
        return group;
    }

    _createRockSmall(x, y, z) {
        const group = new THREE.Group();
        const geo = new THREE.DodecahedronGeometry(1.0, 1);
        this._deformGeo(geo, 0.25);
        const mat = new THREE.MeshStandardMaterial({ color: 0x807060, roughness: 0.9, flatShading: true });
        const rock = new THREE.Mesh(geo, mat);
        rock.scale.set(1, 0.6, 0.9);
        rock.position.y = 0.4;
        rock.castShadow = true;
        rock.receiveShadow = true;
        group.add(rock);
        group.position.set(x, y, z);
        group.rotation.y = Math.random() * Math.PI * 2;
        group.userData = { type: 'rock', destructible: false, radius: 1.2 };
        this.scene.add(group);
        this.obstacles.push(group);
        return group;
    }

    _createSandbag(x, y, z, rotation) {
        const group = new THREE.Group();
        const bagGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.9, 6);
        const bagMat = new THREE.MeshStandardMaterial({ color: 0xb5a068, roughness: 0.95 });
        const strapMat = new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: 0.9 });
        // 两排沙袋墙
        for (let row = 0; row < 2; row++) {
            for (let i = 0; i < 4; i++) {
                const bag = new THREE.Mesh(bagGeo, bagMat);
                const offset = (row % 2 === 0) ? 0 : 0.45;
                bag.position.set(offset + i * 0.9 - 1.5, 0.3 + row * 0.45, 0);
                bag.rotation.z = Math.PI / 2;
                bag.rotation.y = (Math.random() - 0.5) * 0.15;
                bag.castShadow = true;
                bag.receiveShadow = true;
                group.add(bag);
                // 绑带
                const strap = new THREE.Mesh(
                    new THREE.BoxGeometry(0.06, 0.5, 0.03), strapMat
                );
                strap.position.copy(bag.position);
                strap.position.y += 0.02;
                group.add(strap);
            }
        }
        group.position.set(x, y, z);
        group.rotation.y = rotation;
        group.userData = { type: 'sandbag', destructible: true, radius: 2.0, hp: 3 };
        this.scene.add(group);
        this.obstacles.push(group);
        return group;
    }

    _createRuin(x, y, z) {
        const group = new THREE.Group();
        const concreteMat = new THREE.MeshStandardMaterial({ color: 0x999988, roughness: 0.9 });
        const brickMat = new THREE.MeshStandardMaterial({ color: 0x8B5A3C, roughness: 0.85 });
        // 残墙1
        const wall1 = new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 0.4), concreteMat);
        wall1.position.set(0, 1.25, 0);
        wall1.castShadow = true; wall1.receiveShadow = true;
        group.add(wall1);
        // 残墙2（垂直）
        const wall2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.8, 3), concreteMat);
        wall2.position.set(-1.8, 0.9, 1.5);
        wall2.castShadow = true; wall2.receiveShadow = true;
        group.add(wall2);
        // 碎砖
        for (let i = 0; i < 6; i++) {
            const s = 0.2 + Math.random() * 0.3;
            const brick = new THREE.Mesh(new THREE.BoxGeometry(s, s * 0.6, s * 0.8), brickMat);
            brick.position.set(
                (Math.random() - 0.5) * 3,
                s * 0.3,
                (Math.random() - 0.5) * 3
            );
            brick.rotation.set(Math.random(), Math.random(), Math.random());
            brick.castShadow = true;
            group.add(brick);
        }
        // 钢筋（细柱）
        const rebarMat = new THREE.MeshStandardMaterial({ color: 0x553322, metalness: 0.5, roughness: 0.6 });
        for (let i = 0; i < 3; i++) {
            const rebar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5 + Math.random(), 4), rebarMat);
            rebar.position.set(-1.5 + i * 1.5, 2.0, (Math.random() - 0.5) * 0.3);
            rebar.rotation.z = (Math.random() - 0.5) * 0.5;
            group.add(rebar);
        }
        group.position.set(x, y, z);
        group.rotation.y = Math.random() * Math.PI * 2;
        group.userData = { type: 'ruin', destructible: false, radius: 2.8 };
        this.scene.add(group);
        this.obstacles.push(group);
        return group;
    }

    _createStump(x, y, z) {
        const group = new THREE.Group();
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x6B4226, roughness: 0.9 });
        const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x4A2E15, roughness: 0.95 });
        // 树桩
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.0, 7), woodMat);
        trunk.position.y = 0.5;
        trunk.castShadow = true;
        group.add(trunk);
        // 枯枝
        for (let i = 0; i < 2; i++) {
            const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.2, 4), darkWoodMat);
            branch.position.set(0, 0.8, 0);
            branch.rotation.z = 0.5 + i * 0.8;
            branch.rotation.y = i * Math.PI * 0.7;
            group.add(branch);
        }
        // 地面根系
        for (let i = 0; i < 3; i++) {
            const root = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.8, 4), darkWoodMat);
            root.position.set(0, 0.1, 0);
            root.rotation.z = Math.PI / 2 - 0.3;
            root.rotation.y = i * Math.PI * 2 / 3;
            group.add(root);
        }
        group.position.set(x, y, z);
        group.userData = { type: 'stump', destructible: false, radius: 0.5 };
        this.scene.add(group);
        this.obstacles.push(group);
        return group;
    }

    // 几何体随机变形
    _deformGeo(geo, amount) {
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * amount);
            pos.setY(i, pos.getY(i) + (Math.random() - 0.5) * amount);
            pos.setZ(i, pos.getZ(i) + (Math.random() - 0.5) * amount);
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();
    }

    // ====== 基地 ======
    _createBase(x, z) {
        const y = this.terrain.getHeightAt(x, z);
        const group = new THREE.Group();
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xDAA520, metalness: 0.4, roughness: 0.4 });
        const darkGoldMat = new THREE.MeshStandardMaterial({ color: 0xB8860B, metalness: 0.3, roughness: 0.5 });
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x888877, roughness: 0.8 });
        const concreteMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.85 });

        // 混凝土基座
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.5, 0.3, 12), concreteMat);
        pad.position.y = 0.15;
        pad.receiveShadow = true;
        group.add(pad);

        // 防护低墙（弧形）
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            if (i === 4) continue; // 留入口
            const wall = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 0.4), concreteMat);
            wall.position.set(Math.cos(angle) * 3, 0.5, Math.sin(angle) * 3);
            wall.rotation.y = -angle + Math.PI / 2;
            wall.castShadow = true;
            wall.receiveShadow = true;
            group.add(wall);
        }

        // 石质台座
        const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.3, 1.3), stoneMat);
        pedestal.position.y = 0.45;
        group.add(pedestal);

        // 鹰身体
        const body = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.0, 6), goldMat);
        body.position.y = 1.1;
        group.add(body);
        // 鹰头
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), goldMat);
        head.position.set(0, 1.7, -0.1);
        group.add(head);
        // 翅膀
        const wingGeo = new THREE.BoxGeometry(0.08, 0.5, 0.7);
        const wingL = new THREE.Mesh(wingGeo, goldMat);
        wingL.position.set(-0.55, 1.2, 0); wingL.rotation.z = 0.4;
        group.add(wingL);
        const wingR = new THREE.Mesh(wingGeo.clone(), goldMat);
        wingR.position.set(0.55, 1.2, 0); wingR.rotation.z = -0.4;
        group.add(wingR);

        // 发光
        const light = new THREE.PointLight(0xffcc44, 0.8, 8);
        light.position.set(0, 1.5, 0);
        group.add(light);

        group.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
        group.position.set(x, y, z);
        group.userData = { type: 'base' };
        this.scene.add(group);
        this.baseMeshes.push(group);
    }

    _buildBorder() {
        const half = this.terrain.getSize() / 2 + 1;
        const postMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 });
        const count = 20;
        this.borderPosts = [];
        for (let side = 0; side < 4; side++) {
            for (let i = 0; i <= count; i++) {
                const t = (i / count) * 2 - 1;
                let px, pz;
                switch (side) {
                    case 0: px = t * half; pz = -half; break;
                    case 1: px = t * half; pz = half; break;
                    case 2: px = -half; pz = t * half; break;
                    case 3: px = half; pz = t * half; break;
                }
                const py = this.terrain.getHeightAt(
                    Math.max(-half + 1, Math.min(half - 1, px)),
                    Math.max(-half + 1, Math.min(half - 1, pz))
                );
                const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2, 5), postMat);
                post.position.set(px, py + 1, pz);
                post.castShadow = true;
                this.scene.add(post);
                this.borderPosts.push(post);
            }
        }
    }

    // ====== 碰撞相关接口（兼容旧系统）======
    getSolidObstacles() {
        return this.obstacles.filter(o => o.userData && !o.userData.destructible);
    }

    getDestructibleObstacles() {
        return this.obstacles.filter(o => o.userData && o.userData.destructible);
    }

    getAllObstacles() {
        return this.obstacles;
    }

    removeObstacle(obj) {
        const idx = this.obstacles.indexOf(obj);
        if (idx > -1) this.obstacles.splice(idx, 1);
        this.scene.remove(obj);
        obj.traverse(child => {
            if (child.isMesh) { child.geometry.dispose(); child.material.dispose(); }
        });
    }

    getMapBounds() {
        const half = this.terrain.getSize() / 2;
        return { minX: -half, maxX: half, minZ: -half, maxZ: half };
    }

    clear() {
        this.terrain.clear();
        this.obstacles.forEach(o => {
            this.scene.remove(o);
            o.traverse(c => { if (c.isMesh) { c.geometry.dispose(); c.material.dispose(); } });
        });
        this.baseMeshes.forEach(g => {
            g.traverse(c => { if (c.isMesh) { c.geometry.dispose(); c.material.dispose(); } });
            this.scene.remove(g);
        });
        if (this.borderPosts) {
            this.borderPosts.forEach(p => { this.scene.remove(p); p.geometry.dispose(); p.material.dispose(); });
        }
        this.miscMeshes.forEach(m => {
            this.scene.remove(m);
            if (m.traverse) m.traverse(c => { if (c.isMesh) { c.geometry.dispose(); c.material.dispose(); } });
        });
        this.obstacles = [];
        this.baseMeshes = [];
        this.spawnPoints = [];
        this.miscMeshes = [];
        this.borderPosts = [];
    }
}

window.GameMap = GameMap;
window.LEVEL_DATA = LEVEL_DATA;
