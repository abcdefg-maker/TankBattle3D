// terrain.js - 地形系统（噪声算法 + 高度图 + 采样）

// ====== Simplex 2D Noise ======
const SimplexNoise = (function() {
    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const G2 = (3 - Math.sqrt(3)) / 6;
    const grad3 = [[1,1],[- 1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];

    function Simplex(seed) {
        this.perm = new Uint8Array(512);
        this.permMod8 = new Uint8Array(512);
        const p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) p[i] = i;
        // Fisher-Yates shuffle with seed
        let s = seed || 0;
        for (let i = 255; i > 0; i--) {
            s = (s * 16807 + 0) % 2147483647;
            const j = s % (i + 1);
            [p[i], p[j]] = [p[j], p[i]];
        }
        for (let i = 0; i < 512; i++) {
            this.perm[i] = p[i & 255];
            this.permMod8[i] = this.perm[i] % 8;
        }
    }

    Simplex.prototype.noise2D = function(xin, yin) {
        let n0, n1, n2;
        const s = (xin + yin) * F2;
        const i = Math.floor(xin + s);
        const j = Math.floor(yin + s);
        const t = (i + j) * G2;
        const X0 = i - t, Y0 = j - t;
        const x0 = xin - X0, y0 = yin - Y0;
        let i1, j1;
        if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
        const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
        const x2 = x0 - 1.0 + 2.0 * G2, y2 = y0 - 1.0 + 2.0 * G2;
        const ii = i & 255, jj = j & 255;

        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 < 0) n0 = 0;
        else { t0 *= t0; const g = grad3[this.permMod8[ii + this.perm[jj]]]; n0 = t0 * t0 * (g[0] * x0 + g[1] * y0); }

        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 < 0) n1 = 0;
        else { t1 *= t1; const g = grad3[this.permMod8[ii + i1 + this.perm[jj + j1]]]; n1 = t1 * t1 * (g[0] * x1 + g[1] * y1); }

        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 < 0) n2 = 0;
        else { t2 *= t2; const g = grad3[this.permMod8[ii + 1 + this.perm[jj + 1]]]; n2 = t2 * t2 * (g[0] * x2 + g[1] * y2); }

        return 70.0 * (n0 + n1 + n2); // [-1, 1]
    };

    return Simplex;
})();

// ====== 地形类 ======
class Terrain {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.size = 80;        // 世界单位
        this.segments = 80;    // 网格细分数
        this.heightData = null; // Float32Array，(segments+1)^2
        this.simplex = null;
        this.waterMesh = null;
        this.waterLevel = -0.8;
    }

    generate(config) {
        this.clear();
        this.simplex = new SimplexNoise(config.seed || 42);

        const s = this.segments;
        const vCount = (s + 1) * (s + 1);
        this.heightData = new Float32Array(vCount);

        // 1. 基础噪声地形
        this._generateBaseNoise(config.octaves || [
            { freq: 0.025, amp: 3.0 },
            { freq: 0.06,  amp: 1.5 },
            { freq: 0.12,  amp: 0.5 }
        ]);

        // 2. 叠加弹坑
        if (config.craters) {
            config.craters.forEach(c => this._addCrater(c.x, c.z, c.radius, c.depth));
        }

        // 3. 叠加山脊
        if (config.ridges) {
            config.ridges.forEach(r => this._addRidge(r));
        }

        // 4. 平坦区域（基地、出生点附近）
        if (config.flatZones) {
            config.flatZones.forEach(f => this._flattenZone(f.x, f.z, f.radius, f.height));
        }

        // 5. 构建Three.js网格
        this._buildMesh(config);

        // 6. 水面
        if (config.waterLevel !== undefined) {
            this.waterLevel = config.waterLevel;
            this._buildWater();
        }
    }

    _generateBaseNoise(octaves) {
        const s = this.segments;
        const half = this.size / 2;
        for (let iz = 0; iz <= s; iz++) {
            for (let ix = 0; ix <= s; ix++) {
                const wx = (ix / s) * this.size - half;
                const wz = (iz / s) * this.size - half;
                let h = 0;
                for (const oct of octaves) {
                    h += this.simplex.noise2D(wx * oct.freq, wz * oct.freq) * oct.amp;
                }
                // 边缘衰减（靠近边界降为0）
                const edgeDist = Math.min(
                    ix / s, (s - ix) / s,
                    iz / s, (s - iz) / s
                );
                const edgeFade = Math.min(1, edgeDist * 6);
                this.heightData[iz * (s + 1) + ix] = h * edgeFade;
            }
        }
    }

    _addCrater(cx, cz, radius, depth) {
        const s = this.segments;
        const half = this.size / 2;
        for (let iz = 0; iz <= s; iz++) {
            for (let ix = 0; ix <= s; ix++) {
                const wx = (ix / s) * this.size - half;
                const wz = (iz / s) * this.size - half;
                const dx = wx - cx, dz = wz - cz;
                const dist = Math.sqrt(dx * dx + dz * dz);
                if (dist < radius) {
                    const t = dist / radius;
                    // 弹坑：中心深，边缘隆起
                    const craterShape = -depth * (1 - t * t) + depth * 0.2 * Math.max(0, 1 - Math.abs(t - 0.85) * 8);
                    this.heightData[iz * (s + 1) + ix] += craterShape;
                }
            }
        }
    }

    _addRidge(r) {
        const s = this.segments;
        const half = this.size / 2;
        const dx = r.x2 - r.x1, dz = r.z2 - r.z1;
        const len = Math.sqrt(dx * dx + dz * dz);
        const nx = -dz / len, nz = dx / len; // 法线
        for (let iz = 0; iz <= s; iz++) {
            for (let ix = 0; ix <= s; ix++) {
                const wx = (ix / s) * this.size - half;
                const wz = (iz / s) * this.size - half;
                // 到线段的距离
                const t = Math.max(0, Math.min(1,
                    ((wx - r.x1) * dx + (wz - r.z1) * dz) / (len * len)
                ));
                const px = r.x1 + t * dx, pz = r.z1 + t * dz;
                const dist = Math.sqrt((wx - px) * (wx - px) + (wz - pz) * (wz - pz));
                if (dist < r.width) {
                    const f = 1 - dist / r.width;
                    this.heightData[iz * (s + 1) + ix] += r.height * f * f;
                }
            }
        }
    }

    _flattenZone(fx, fz, radius, targetH) {
        const s = this.segments;
        const half = this.size / 2;
        for (let iz = 0; iz <= s; iz++) {
            for (let ix = 0; ix <= s; ix++) {
                const wx = (ix / s) * this.size - half;
                const wz = (iz / s) * this.size - half;
                const dist = Math.sqrt((wx - fx) * (wx - fx) + (wz - fz) * (wz - fz));
                if (dist < radius) {
                    const t = dist / radius;
                    const blend = t * t * (3 - 2 * t); // smoothstep
                    const idx = iz * (s + 1) + ix;
                    this.heightData[idx] = this.heightData[idx] * blend + targetH * (1 - blend);
                }
            }
        }
    }

    _buildMesh(config) {
        const s = this.segments;
        const geo = new THREE.PlaneGeometry(this.size, this.size, s, s);
        geo.rotateX(-Math.PI / 2);

        const pos = geo.attributes.position;
        const colors = new Float32Array(pos.count * 3);

        for (let i = 0; i < pos.count; i++) {
            const h = this.heightData[i];
            pos.setY(i, h);

            // 顶点着色
            const color = this._heightToColor(h, i, pos);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geo.computeVertexNormals();

        const mat = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.9,
            metalness: 0.0,
            flatShading: false
        });

        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = false;
        this.scene.add(this.mesh);
    }

    _heightToColor(h, i, posAttr) {
        // 计算近似坡度
        const s = this.segments;
        const row = Math.floor(i / (s + 1));
        const col = i % (s + 1);
        let slope = 0;
        if (col > 0 && col < s && row > 0 && row < s) {
            const hL = this.heightData[row * (s + 1) + (col - 1)];
            const hR = this.heightData[row * (s + 1) + (col + 1)];
            const hU = this.heightData[(row - 1) * (s + 1) + col];
            const hD = this.heightData[(row + 1) * (s + 1) + col];
            const cellSize = this.size / s;
            slope = Math.sqrt(
                Math.pow((hR - hL) / (2 * cellSize), 2) +
                Math.pow((hD - hU) / (2 * cellSize), 2)
            );
        }

        let r, g, b;
        if (slope > 0.7) {
            // 陡坡 - 岩石灰
            r = 0.45; g = 0.42; b = 0.38;
        } else if (h < this.waterLevel + 0.3) {
            // 低洼 - 深棕泥地
            r = 0.30; g = 0.25; b = 0.15;
        } else if (h < 0.5) {
            // 平地 - 黄绿色草地
            const t = (h - (this.waterLevel + 0.3)) / (0.5 - (this.waterLevel + 0.3));
            r = 0.30 + t * 0.05; g = 0.38 + t * 0.15; b = 0.15 + t * 0.05;
        } else if (h < 2.5) {
            // 缓坡 - 浅绿
            const t = (h - 0.5) / 2.0;
            r = 0.35 + t * 0.1; g = 0.53 - t * 0.1; b = 0.20;
        } else {
            // 高处 - 灰棕岩石
            r = 0.50; g = 0.45; b = 0.35;
        }

        // 噪声扰动让颜色不那么均匀
        const n = this.simplex.noise2D(col * 0.3, row * 0.3) * 0.05;
        return { r: Math.max(0, Math.min(1, r + n)), g: Math.max(0, Math.min(1, g + n)), b: Math.max(0, Math.min(1, b + n)) };
    }

    _buildWater() {
        const geo = new THREE.PlaneGeometry(this.size * 1.2, this.size * 1.2);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x2266aa,
            transparent: true,
            opacity: 0.55,
            roughness: 0.05,
            metalness: 0.3,
            side: THREE.DoubleSide
        });
        this.waterMesh = new THREE.Mesh(geo, mat);
        this.waterMesh.rotation.x = -Math.PI / 2;
        this.waterMesh.position.y = this.waterLevel;
        this.waterMesh.receiveShadow = true;
        this.scene.add(this.waterMesh);
    }

    // ====== 高度采样（双线性插值）======
    getHeightAt(x, z) {
        const s = this.segments;
        const half = this.size / 2;
        // 世界坐标 → 网格坐标
        const gx = ((x + half) / this.size) * s;
        const gz = ((z + half) / this.size) * s;
        const ix = Math.floor(gx);
        const iz = Math.floor(gz);
        const fx = gx - ix;
        const fz = gz - iz;

        // 边界clamp
        const ix0 = Math.max(0, Math.min(s, ix));
        const ix1 = Math.max(0, Math.min(s, ix + 1));
        const iz0 = Math.max(0, Math.min(s, iz));
        const iz1 = Math.max(0, Math.min(s, iz + 1));

        const stride = s + 1;
        const h00 = this.heightData[iz0 * stride + ix0];
        const h10 = this.heightData[iz0 * stride + ix1];
        const h01 = this.heightData[iz1 * stride + ix0];
        const h11 = this.heightData[iz1 * stride + ix1];

        // 双线性插值
        const h0 = h00 * (1 - fx) + h10 * fx;
        const h1 = h01 * (1 - fx) + h11 * fx;
        return h0 * (1 - fz) + h1 * fz;
    }

    // 获取地面法线
    getNormalAt(x, z) {
        const d = 0.5;
        const hL = this.getHeightAt(x - d, z);
        const hR = this.getHeightAt(x + d, z);
        const hU = this.getHeightAt(x, z - d);
        const hD = this.getHeightAt(x, z + d);
        const normal = new THREE.Vector3(hL - hR, 2 * d, hU - hD);
        normal.normalize();
        return normal;
    }

    // 获取某方向的坡度（正=上坡，负=下坡）
    getSlopeInDirection(x, z, angle) {
        const d = 1.0;
        const dx = -Math.sin(angle) * d;
        const dz = -Math.cos(angle) * d;
        const hHere = this.getHeightAt(x, z);
        const hAhead = this.getHeightAt(x + dx, z + dz);
        return (hAhead - hHere) / d;
    }

    // 是否在水下
    isUnderwater(x, z) {
        return this.getHeightAt(x, z) < this.waterLevel;
    }

    // 是否深水
    isDeepWater(x, z) {
        return this.getHeightAt(x, z) < this.waterLevel - 0.5;
    }

    getSize() { return this.size; }

    clear() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            this.mesh = null;
        }
        if (this.waterMesh) {
            this.scene.remove(this.waterMesh);
            this.waterMesh.geometry.dispose();
            this.waterMesh.material.dispose();
            this.waterMesh = null;
        }
        this.heightData = null;
    }
}

window.Terrain = Terrain;
window.SimplexNoise = SimplexNoise;
