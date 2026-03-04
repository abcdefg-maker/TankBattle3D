// map.js - 网格地图系统（平地版本）

const CELL_SIZE = 2;
const MAP_SIZE = 20;

// 单元格类型: 0=空, 1=砖墙, 2=钢墙, 3=水, 4=草地
const LEVEL_DATA = [
    // 关卡1 - 初级战场
    {
        name: '第 1 关',
        desc: '初级战场 - 熟悉操控',
        enemies: { normal: 4, elite: 0, heavy: 0 },
        grid: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,1,1,0,0,1,1,0,0,0,0,1,1,0,0,1,1,0,0],
            [0,0,1,1,0,0,1,1,0,0,0,0,1,1,0,0,1,1,0,0],
            [0,0,1,1,0,0,1,1,1,1,1,1,1,1,0,0,1,1,0,0],
            [0,0,1,1,0,0,1,1,0,0,0,0,1,1,0,0,1,1,0,0],
            [0,0,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,0],
            [1,1,0,0,1,1,0,0,2,0,0,2,0,0,1,1,0,0,1,1],
            [0,1,0,0,1,0,0,0,2,0,0,2,0,0,0,1,0,0,1,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,1,1,0,0,4,4,0,0,4,4,0,0,1,1,0,0,0],
            [0,0,0,1,1,0,0,4,4,0,0,4,4,0,0,1,1,0,0,0],
            [0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0],
            [0,0,1,1,0,0,1,0,0,1,1,0,0,1,0,0,1,1,0,0],
            [0,0,1,1,0,0,1,0,0,0,0,0,0,1,0,0,1,1,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,1],
            [1,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,1],
            [0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0],
        ]
    },
    // 关卡2 - 城市战场
    {
        name: '第 2 关',
        desc: '城市战场 - 小心水域',
        enemies: { normal: 3, elite: 2, heavy: 0 },
        grid: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,1,1,0,0,2,0,0,1,1,1,1,0,0,2,0,0,1,1,0],
            [0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0],
            [0,0,0,0,1,1,0,0,3,3,3,3,0,0,1,1,0,0,0,0],
            [0,0,0,0,1,0,0,0,3,0,0,3,0,0,0,1,0,0,0,0],
            [0,2,0,0,1,0,0,4,0,0,0,0,4,0,0,1,0,0,2,0],
            [0,0,0,0,0,0,0,4,0,0,0,0,4,0,0,0,0,0,0,0],
            [1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1],
            [0,0,0,1,0,0,0,0,0,2,2,0,0,0,0,0,1,0,0,0],
            [0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
            [0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0],
            [0,1,1,0,0,0,1,0,0,1,1,0,0,1,0,0,0,1,1,0],
            [0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0],
            [0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0],
            [3,3,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,3,3],
            [0,0,0,0,2,0,0,1,0,0,0,0,1,0,0,2,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0],
        ]
    },
    // 关卡3 - 最终决战
    {
        name: '第 3 关',
        desc: '最终决战 - 全力以赴',
        enemies: { normal: 3, elite: 2, heavy: 2 },
        grid: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,2,0,0,1,1,0,0,1,0,0,1,0,0,1,1,0,0,2,0],
            [0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0],
            [0,0,1,1,0,0,2,0,0,0,0,0,0,2,0,0,1,1,0,0],
            [0,0,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,0,0],
            [1,0,0,0,0,3,3,0,0,0,0,0,0,3,3,0,0,0,0,1],
            [1,0,0,0,0,3,3,0,0,0,0,0,0,3,3,0,0,0,0,1],
            [0,0,0,1,0,0,0,0,1,1,1,1,0,0,0,0,1,0,0,0],
            [0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
            [0,0,0,0,0,0,2,0,0,4,4,0,0,2,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0,0],
            [0,1,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,1,0],
            [0,0,0,0,0,1,0,0,1,1,1,1,0,0,1,0,0,0,0,0],
            [0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0],
            [0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0],
            [1,1,0,0,1,0,1,0,0,0,0,0,0,1,0,1,0,0,1,1],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,1,2,2,1,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0],
        ]
    }
];

// ====== 地图管理类 ======
class GameMap {
    constructor(scene) {
        this.scene = scene;
        this.walls = [];       // 所有墙体 mesh/group
        this.bricks = [];      // 砖墙（可破坏）
        this.steels = [];      // 钢墙（不可破坏）
        this.waters = [];      // 水域
        this.grasses = [];     // 草地（装饰）
        this.baseMeshes = [];  // 基地
        this.spawnPoints = [];
        this.groundMesh = null;
        this.borderWalls = [];
    }

    loadLevel(levelIndex) {
        this.clear();
        const level = LEVEL_DATA[levelIndex];
        const grid = level.grid;
        const mapHalf = MAP_SIZE * CELL_SIZE / 2;

        // 地面
        this._createGround(mapHalf);

        // 解析网格
        for (let row = 0; row < MAP_SIZE; row++) {
            for (let col = 0; col < MAP_SIZE; col++) {
                const cellType = grid[row][col];
                if (cellType === 0) continue;
                const x = col * CELL_SIZE - mapHalf + CELL_SIZE / 2;
                const z = row * CELL_SIZE - mapHalf + CELL_SIZE / 2;
                switch (cellType) {
                    case 1: this._createBrickWall(x, z); break;
                    case 2: this._createSteelWall(x, z); break;
                    case 3: this._createWater(x, z); break;
                    case 4: this._createGrass(x, z); break;
                }
            }
        }

        // 基地（底部中央）
        const baseX = 0;
        const baseZ = mapHalf - CELL_SIZE * 1.5;
        this._createBase(baseX, baseZ);

        // 敌人出生点（顶部3个位置）
        this.spawnPoints = [
            { x: -mapHalf + CELL_SIZE * 2, z: -mapHalf + CELL_SIZE },
            { x: 0, z: -mapHalf + CELL_SIZE },
            { x: mapHalf - CELL_SIZE * 2, z: -mapHalf + CELL_SIZE }
        ];

        // 边界墙
        this._createBorder(mapHalf);

        return {
            ...level,
            playerSpawn: { x: -CELL_SIZE * 3, z: mapHalf - CELL_SIZE * 2 }
        };
    }

    // ====== 地面 ======
    _createGround(mapHalf) {
        const geo = new THREE.PlaneGeometry(mapHalf * 2 + 4, mapHalf * 2 + 4);
        const mat = new THREE.MeshStandardMaterial({ color: 0x556B2F, roughness: 0.9 });
        this.groundMesh = new THREE.Mesh(geo, mat);
        this.groundMesh.rotation.x = -Math.PI / 2;
        this.groundMesh.position.y = -0.01;
        this.groundMesh.receiveShadow = true;
        this.scene.add(this.groundMesh);
    }

    // ====== 砖墙（可破坏）======
    _createBrickWall(x, z) {
        const group = new THREE.Group();
        const brickColors = [0xB85C38, 0xA05030, 0xC46442, 0x9E4B2F];
        const mortarMat = new THREE.MeshStandardMaterial({ color: 0xD4C4A8, roughness: 0.95 });

        // 灰浆底色
        const base = new THREE.Mesh(
            new THREE.BoxGeometry(CELL_SIZE, CELL_SIZE, CELL_SIZE),
            mortarMat
        );
        base.position.y = CELL_SIZE / 2;
        group.add(base);

        // 砖块
        const brickH = 0.22, brickW = 0.45, brickD = CELL_SIZE * 0.98;
        const gap = 0.04;
        const bricksPerRow = Math.floor((CELL_SIZE - gap) / (brickW + gap));
        const rows = Math.floor(CELL_SIZE / (brickH + gap));

        for (let r = 0; r < rows; r++) {
            const offset = (r % 2 === 0) ? 0 : brickW / 2;
            for (let c = 0; c < bricksPerRow + 1; c++) {
                const bx = -CELL_SIZE / 2 + gap + offset + c * (brickW + gap) + brickW / 2;
                if (bx - brickW / 2 < -CELL_SIZE / 2 || bx + brickW / 2 > CELL_SIZE / 2) continue;
                const by = gap + r * (brickH + gap) + brickH / 2;
                const color = brickColors[Math.floor(Math.random() * brickColors.length)];
                const brick = new THREE.Mesh(
                    new THREE.BoxGeometry(brickW, brickH, brickD),
                    new THREE.MeshStandardMaterial({ color, roughness: 0.85 })
                );
                brick.position.set(bx, by, 0);
                brick.castShadow = true;
                brick.receiveShadow = true;
                group.add(brick);
            }
        }

        group.position.set(x, 0, z);
        group.userData = { type: 'brick', destructible: true, hp: 1 };
        this.scene.add(group);
        this.walls.push(group);
        this.bricks.push(group);
    }

    // ====== 钢墙（不可破坏）======
    _createSteelWall(x, z) {
        const group = new THREE.Group();
        const steelMat = new THREE.MeshStandardMaterial({
            color: 0x888899, metalness: 0.7, roughness: 0.3
        });
        const rivetMat = new THREE.MeshStandardMaterial({
            color: 0x666677, metalness: 0.8, roughness: 0.2
        });

        // 主体
        const main = new THREE.Mesh(
            new THREE.BoxGeometry(CELL_SIZE * 0.95, CELL_SIZE * 0.95, CELL_SIZE * 0.95),
            steelMat
        );
        main.position.y = CELL_SIZE / 2;
        main.castShadow = true;
        main.receiveShadow = true;
        group.add(main);

        // 铆钉
        const rivetGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.08, 6);
        const offsets = [-0.6, 0.6];
        for (const ox of offsets) {
            for (const oy of offsets) {
                const rFront = new THREE.Mesh(rivetGeo, rivetMat);
                rFront.position.set(ox, CELL_SIZE / 2 + oy, CELL_SIZE / 2);
                rFront.rotation.x = Math.PI / 2;
                group.add(rFront);
                const rBack = new THREE.Mesh(rivetGeo.clone(), rivetMat);
                rBack.position.set(ox, CELL_SIZE / 2 + oy, -CELL_SIZE / 2);
                rBack.rotation.x = Math.PI / 2;
                group.add(rBack);
            }
        }

        // 顶部十字
        const cross1 = new THREE.Mesh(
            new THREE.BoxGeometry(CELL_SIZE * 0.8, 0.05, 0.1), rivetMat
        );
        cross1.position.y = CELL_SIZE + 0.02;
        group.add(cross1);
        const cross2 = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.05, CELL_SIZE * 0.8), rivetMat
        );
        cross2.position.y = CELL_SIZE + 0.02;
        group.add(cross2);

        group.position.set(x, 0, z);
        group.userData = { type: 'steel', destructible: false };
        this.scene.add(group);
        this.walls.push(group);
        this.steels.push(group);
    }

    // ====== 水域 ======
    _createWater(x, z) {
        const waterMat = new THREE.MeshStandardMaterial({
            color: 0x2288CC, transparent: true, opacity: 0.7,
            roughness: 0.1, metalness: 0.2
        });
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(CELL_SIZE, 0.3, CELL_SIZE),
            waterMat
        );
        mesh.position.set(x, 0.15, z);
        mesh.receiveShadow = true;
        mesh.userData = { type: 'water' };
        this.scene.add(mesh);
        this.waters.push(mesh);
    }

    // ====== 草地（装饰）======
    _createGrass(x, z) {
        const group = new THREE.Group();
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x228B22, transparent: true, opacity: 0.8, side: THREE.DoubleSide
        });
        const base = new THREE.Mesh(
            new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE), baseMat
        );
        base.rotation.x = -Math.PI / 2;
        base.position.y = 1.5;
        group.add(base);

        const bladeMat = new THREE.MeshStandardMaterial({
            color: 0x33AA33, side: THREE.DoubleSide, transparent: true, opacity: 0.7
        });
        for (let i = 0; i < 8; i++) {
            const blade = new THREE.Mesh(
                new THREE.PlaneGeometry(0.15, 0.8), bladeMat
            );
            blade.position.set(
                (Math.random() - 0.5) * CELL_SIZE * 0.8,
                1.0 + Math.random() * 0.5,
                (Math.random() - 0.5) * CELL_SIZE * 0.8
            );
            blade.rotation.y = Math.random() * Math.PI;
            group.add(blade);
        }

        group.position.set(x, 0, z);
        group.userData = { type: 'grass' };
        this.scene.add(group);
        this.grasses.push(group);
    }

    // ====== 基地（鹰雕塑）======
    _createBase(x, z) {
        const group = new THREE.Group();
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xDAA520, metalness: 0.4, roughness: 0.4 });
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x888877, roughness: 0.8 });

        // 石质台座
        const pedestal = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.4, 2.5), stoneMat);
        pedestal.position.y = 0.2;
        pedestal.receiveShadow = true;
        group.add(pedestal);

        // 鹰身体
        const body = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.0, 6), goldMat);
        body.position.y = 0.9;
        body.castShadow = true;
        group.add(body);

        // 鹰头
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), goldMat);
        head.position.set(0, 1.5, -0.1);
        head.castShadow = true;
        group.add(head);

        // 翅膀
        const wingGeo = new THREE.BoxGeometry(0.08, 0.5, 0.7);
        const wingL = new THREE.Mesh(wingGeo, goldMat);
        wingL.position.set(-0.55, 1.0, 0);
        wingL.rotation.z = 0.4;
        wingL.castShadow = true;
        group.add(wingL);
        const wingR = new THREE.Mesh(wingGeo.clone(), goldMat);
        wingR.position.set(0.55, 1.0, 0);
        wingR.rotation.z = -0.4;
        wingR.castShadow = true;
        group.add(wingR);

        // 发光
        const light = new THREE.PointLight(0xffcc44, 0.8, 8);
        light.position.set(0, 1.5, 0);
        group.add(light);

        group.position.set(x, 0, z);
        group.userData = { type: 'base' };
        this.scene.add(group);
        this.baseMeshes.push(group);
    }

    // ====== 边界墙 ======
    _createBorder(mapHalf) {
        const borderMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
        const thick = 0.5;
        const height = 2.5;
        const len = mapHalf * 2 + thick * 2;

        const sides = [
            { x: 0, z: -mapHalf - thick / 2, w: len, d: thick },
            { x: 0, z: mapHalf + thick / 2, w: len, d: thick },
            { x: -mapHalf - thick / 2, z: 0, w: thick, d: len },
            { x: mapHalf + thick / 2, z: 0, w: thick, d: len },
        ];
        for (const s of sides) {
            const wall = new THREE.Mesh(
                new THREE.BoxGeometry(s.w, height, s.d), borderMat
            );
            wall.position.set(s.x, height / 2, s.z);
            wall.castShadow = true;
            wall.receiveShadow = true;
            this.scene.add(wall);
            this.borderWalls.push(wall);
        }
    }

    // ====== 开放世界（测试用）======
    loadOpenWorld() {
        this.clear();
        const size = 200;
        const geo = new THREE.PlaneGeometry(size, size, 40, 40);
        const mat = new THREE.MeshStandardMaterial({ color: 0x556B2F, roughness: 0.9 });
        this.groundMesh = new THREE.Mesh(geo, mat);
        this.groundMesh.rotation.x = -Math.PI / 2;
        this.groundMesh.position.y = -0.01;
        this.groundMesh.receiveShadow = true;
        this.scene.add(this.groundMesh);

        // 网格线辅助定位
        const gridHelper = new THREE.GridHelper(size, size / 4, 0x444444, 0x333333);
        gridHelper.position.y = 0.01;
        this.scene.add(gridHelper);
        this.borderWalls.push(gridHelper); // 借用数组方便清理

        this.spawnPoints = [];
        this._openWorldSize = size;
    }

    getMapBoundsOpenWorld() {
        const half = (this._openWorldSize || 200) / 2;
        return { minX: -half, maxX: half, minZ: -half, maxZ: half };
    }

    // ====== 碰撞接口 ======
    getSolidWalls() {
        return this.walls.filter(w => w.parent);
    }

    getWaterCells() {
        return this.waters;
    }

    removeBrick(brickMesh) {
        const idx = this.bricks.indexOf(brickMesh);
        if (idx > -1) this.bricks.splice(idx, 1);
        const wIdx = this.walls.indexOf(brickMesh);
        if (wIdx > -1) this.walls.splice(wIdx, 1);
        this.scene.remove(brickMesh);
        brickMesh.traverse(child => {
            if (child.isMesh) {
                child.geometry.dispose();
                child.material.dispose();
            }
        });
    }

    getMapBounds() {
        if (this._openWorldSize) {
            const half = this._openWorldSize / 2;
            return { minX: -half, maxX: half, minZ: -half, maxZ: half };
        }
        const half = MAP_SIZE * CELL_SIZE / 2;
        return { minX: -half, maxX: half, minZ: -half, maxZ: half };
    }

    clear() {
        this.walls.forEach(w => {
            this.scene.remove(w);
            w.traverse(c => { if (c.isMesh) { c.geometry.dispose(); c.material.dispose(); } });
        });
        this.waters.forEach(w => {
            this.scene.remove(w);
            w.geometry.dispose();
            w.material.dispose();
        });
        this.grasses.forEach(g => {
            this.scene.remove(g);
            g.traverse(c => { if (c.isMesh) { c.geometry.dispose(); c.material.dispose(); } });
        });
        this.baseMeshes.forEach(b => {
            this.scene.remove(b);
            b.traverse(c => { if (c.isMesh) { c.geometry.dispose(); c.material.dispose(); } });
        });
        this.borderWalls.forEach(w => {
            this.scene.remove(w);
            w.geometry.dispose();
            w.material.dispose();
        });
        if (this.groundMesh) {
            this.scene.remove(this.groundMesh);
            this.groundMesh.geometry.dispose();
            this.groundMesh.material.dispose();
            this.groundMesh = null;
        }

        this.walls = [];
        this.bricks = [];
        this.steels = [];
        this.waters = [];
        this.grasses = [];
        this.baseMeshes = [];
        this.spawnPoints = [];
        this.borderWalls = [];
        this._openWorldSize = 0;
    }
}

window.GameMap = GameMap;
window.LEVEL_DATA = LEVEL_DATA;
window.CELL_SIZE = CELL_SIZE;
window.MAP_SIZE = MAP_SIZE;
