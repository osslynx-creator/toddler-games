/**
 * Audio Manager - ES Module
 * Uses Web Audio API for immediate feedback
 * Integrates with Store for mute state
 */

import store from '../store/index.js';

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.isMuted = store.getState().isMuted;

        // Subscribe to mute state changes
        store.subscribe('isMuted', (isMuted) => {
            this.isMuted = isMuted;
        });
    }

    init() {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn('AudioContext not available:', e);
                return;
            }
        }
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(() => {
                // Will auto-resume on next user interaction
            });
        }
    }

    playMagicalChime() {
        if (this.isMuted) return;
        this.init();

        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        const harmonics = [0.5, 0.3, 0.2, 0.15, 0.1];

        notes.forEach((freq, index) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.frequency.value = freq;
            osc.type = 'sine';

            const startTime = this.audioContext.currentTime + (index * 0.08);
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.4 * harmonics[index], startTime + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);

            osc.start(startTime);
            osc.stop(startTime + 0.5);

            const sparkleOsc = this.audioContext.createOscillator();
            const sparkleGain = this.audioContext.createGain();

            sparkleOsc.connect(sparkleGain);
            sparkleGain.connect(this.audioContext.destination);

            sparkleOsc.frequency.value = freq * 2;
            sparkleOsc.type = 'triangle';

            sparkleGain.gain.setValueAtTime(0, startTime);
            sparkleGain.gain.linearRampToValueAtTime(0.1 * harmonics[index], startTime + 0.02);
            sparkleGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

            sparkleOsc.start(startTime);
            sparkleOsc.stop(startTime + 0.3);
        });
    }

    playPop() {
        if (this.isMuted) return;
        this.init();
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.frequency.setValueAtTime(600, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.audioContext.currentTime + 0.1);

        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    playThud() {
        if (this.isMuted) return;
        this.init();
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.15);

        gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.15);
    }

    playSuccess() {
        if (this.isMuted) return;
        this.init();
        const notes = [523.25, 659.25, 783.99, 1046.50];

        notes.forEach((freq, index) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.frequency.value = freq;
            osc.type = 'sine';

            const startTime = this.audioContext.currentTime + (index * 0.1);
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

            osc.start(startTime);
            osc.stop(startTime + 0.3);
        });
    }

    playAnimalSound(type) {
        if (this.isMuted) return;
        this.init();
        const soundMap = {
            dog: () => this.barkSound(),
            cat: () => this.meowSound(),
            cow: () => this.mooSound(),
            duck: () => this.quackSound(),
            sheep: () => this.baaSound(),
            pig: () => this.oinkSound()
        };

        if (soundMap[type]) {
            soundMap[type]();
        }
    }

    barkSound() {
        const t = this.audioContext.currentTime;
        for (let i = 0; i < 2; i++) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, t + i * 0.15);
            osc.frequency.exponentialRampToValueAtTime(200, t + i * 0.15 + 0.1);

            gain.gain.setValueAtTime(0.3, t + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.15 + 0.1);

            osc.start(t + i * 0.15);
            osc.stop(t + i * 0.15 + 0.1);
        }
    }

    meowSound() {
        const t = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.linearRampToValueAtTime(800, t + 0.2);
        osc.frequency.linearRampToValueAtTime(400, t + 0.4);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.linearRampToValueAtTime(0.2, t + 0.2);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.4);

        osc.start(t);
        osc.stop(t + 0.4);
    }

    mooSound() {
        const t = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.linearRampToValueAtTime(150, t + 0.3);
        osc.frequency.linearRampToValueAtTime(180, t + 0.6);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.3);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.8);

        osc.start(t);
        osc.stop(t + 0.8);
    }

    quackSound() {
        const t = this.audioContext.currentTime;
        for (let i = 0; i < 2; i++) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.type = 'square';
            osc.frequency.setValueAtTime(400, t + i * 0.12);
            osc.frequency.exponentialRampToValueAtTime(300, t + i * 0.12 + 0.08);

            gain.gain.setValueAtTime(0.3, t + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.12 + 0.08);

            osc.start(t + i * 0.12);
            osc.stop(t + i * 0.12 + 0.08);
        }
    }

    baaSound() {
        const t = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(350, t);
        osc.frequency.linearRampToValueAtTime(300, t + 0.15);
        osc.frequency.linearRampToValueAtTime(320, t + 0.3);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.linearRampToValueAtTime(0.2, t + 0.15);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.5);

        osc.start(t);
        osc.stop(t + 0.5);
    }

    oinkSound() {
        const t = this.audioContext.currentTime;
        for (let i = 0; i < 3; i++) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(250, t + i * 0.15);
            osc.frequency.exponentialRampToValueAtTime(200, t + i * 0.15 + 0.1);

            gain.gain.setValueAtTime(0.3, t + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.15 + 0.1);

            osc.start(t + i * 0.15);
            osc.stop(t + i * 0.15 + 0.1);
        }
    }
}

export default new AudioManager();
