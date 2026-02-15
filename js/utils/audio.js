/**
 * Audio Utility - Uses Web Audio API for immediate feedback
 * No external audio files needed - generates sounds procedurally
 */

const AudioManager = {
    audioContext: null,
    isMuted: false,

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                console.log('AudioContext resumed successfully');
            }).catch(e => console.error('Error resuming AudioContext:', e));
        }
    },

    setMuted(muted) {
        this.isMuted = muted;
    },

    // Magical chime for golden mole
    playMagicalChime() {
        if (this.isMuted) return;
        this.init();

        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // Higher C major arpeggio
        const harmonics = [0.5, 0.3, 0.2, 0.15, 0.1];

        notes.forEach((freq, index) => {
            // Main oscillator
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

            // Add sparkle effect with higher harmonic
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
    },

    // Play a cheerful "pop" sound
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
    },

    // Play a gentle "thud" for mistakes
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
    },

    // Play celebration sound
    playSuccess() {
        if (this.isMuted) return;
        this.init();
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C major arpeggio

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
    },

    // Play animal sounds (synthesized)
    playAnimalSound(type) {
        if (this.isMuted) return;
        this.init();
        switch (type) {
            case 'dog':
                this.barkSound();
                break;
            case 'cat':
                this.meowSound();
                break;
            case 'cow':
                this.mooSound();
                break;
            case 'duck':
                this.quackSound();
                break;
            case 'sheep':
                this.baaSound();
                break;
            case 'pig':
                this.oinkSound();
                break;
        }
    },

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
    },

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
    },

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
    },

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
    },

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
    },

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
};
