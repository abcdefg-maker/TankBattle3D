// audio.js - 音效管理系统（使用Web Audio API生成音效）
class AudioManager {
    constructor() {
        this.enabled = true;
        this.ctx = null;
        this.masterGain = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.ctx.destination);
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API 不可用');
            this.enabled = false;
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // 开火音效
    playShoot() {
        if (!this.enabled || !this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.1);
    }

    // 爆炸音效
    playExplosion() {
        if (!this.enabled || !this.initialized) return;
        const bufferSize = this.ctx.sampleRate * 0.3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gain = this.ctx.createGain();
        source.connect(gain);
        gain.connect(this.masterGain);
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        source.start(this.ctx.currentTime);
    }

    // 击中音效
    playHit() {
        if (!this.enabled || !this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.15);
    }

    // 道具拾取音效
    playPowerup() {
        if (!this.enabled || !this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.15);
        osc.frequency.linearRampToValueAtTime(1200, this.ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.3);
    }

    // 游戏结束音效
    playGameOver() {
        if (!this.enabled || !this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.8);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.8);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.8);
    }

    // 过关音效
    playLevelComplete() {
        if (!this.enabled || !this.initialized) return;
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, this.ctx.currentTime + i * 0.15);
            gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + i * 0.15 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + i * 0.15 + 0.3);
            osc.start(this.ctx.currentTime + i * 0.15);
            osc.stop(this.ctx.currentTime + i * 0.15 + 0.3);
        });
    }
}

window.AudioManager = AudioManager;
