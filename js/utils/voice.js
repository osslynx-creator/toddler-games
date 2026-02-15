/**
 * Voice Manager - Text-to-Speech using Web Speech API
 * Provides French voice synthesis for toddler-friendly interactions
 * FALLBACK: Uses Google Translate TTS if Web Speech API fails
 */

const VoiceManager = {
    synth: null,
    frenchVoice: null,
    isMuted: false,
    isInitialized: false,

    // Cache for audio objects to prevent re-fetching
    audioCache: {},

    /**
     * Helper to log with both console and on-screen debug
     */
    /**
     * Helper to log with both console and on-screen debug
     */
    log(msg, type = 'log') {
        const prefix = '[VoiceManager]';
        const fullMsg = `${prefix} ${msg}`;

        // Console log
        if (type === 'error') {
            console.error(fullMsg);
        } else if (type === 'warn') {
            console.warn(fullMsg);
        } else {
            console.log(fullMsg);
        }
    },

    /**
     * Get TTS URL for fallback
     * Uses Google Translate's unofficial API
     */
    getTTSUrl(text) {
        return `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=fr&q=${encodeURIComponent(text)}`;
    },

    /**
     * Initialize the voice manager
     */
    init() {
        this.log('INIT called');

        if (this.isInitialized) {
            this.log('Already initialized, skipping');
            return;
        }

        // Check if speech synthesis is supported
        if ('speechSynthesis' in window) {
            this.log('window.speechSynthesis IS AVAILABLE');
            this.synth = window.speechSynthesis;
        } else {
            this.log('Web Speech API NOT SUPPORTED. Will use Audio fallback.', 'warn');
        }

        this.isInitialized = true;
        this.loadVoices(); // Try to load anyway

        // Setup listener
        if (this.synth && this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => this.loadVoices();
        }
    },

    /**
     * Load available voices and select French
     */
    loadVoices() {
        if (!this.synth) return;

        try {
            const voices = this.synth.getVoices();
            this.log(`Found ${voices.length} voices total`);

            const frenchVoices = voices.filter(voice =>
                voice.lang && (voice.lang.includes('fr') || voice.lang.includes('FR'))
            );

            if (frenchVoices.length > 0) {
                // Try to find high-quality voices
                const preferredVoices = ['Google français', 'Thomas', 'Audrey', 'Amélie'];
                this.frenchVoice = frenchVoices.find(v => preferredVoices.some(p => v.name.includes(p))) || frenchVoices[0];
                this.log(`Selected French voice: ${this.frenchVoice.name}`);
            } else {
                this.frenchVoice = null;
                this.log('No French voice found. Will use fallback.', 'warn');
            }
        } catch (e) {
            this.log('Error loading voices: ' + e.message);
        }
    },

    /**
     * Set mute state
     */
    setMuted(muted) {
        this.isMuted = muted;
        if (muted) {
            this.stop();
        }
    },

    /**
     * Speak text in French
     */
    speak(text, options = {}) {
        this.log(`SPEAK called: "${text}"`);

        if (this.isMuted) {
            this.log('Muted, ignoring speak');
            return;
        }

        // STRATEGY: Try Native -> Fail -> Fallback

        // 1. Try Native Web Speech
        let nativeAttempted = false;

        if (this.synth && this.frenchVoice) {
            try {
                this.synth.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.voice = this.frenchVoice;
                utterance.lang = 'fr-FR';
                utterance.pitch = options.pitch || 1.1;
                utterance.rate = options.rate || 0.9;

                // If it triggers callback immediately with error, we fallback
                utterance.onerror = (e) => {
                    this.log(`Native Error: ${e.error || 'unknown'}`);
                    // Only fallback if not just canceled
                    if (e.error !== 'canceled' && e.error !== 'interrupted') {
                        this.speakFallback(text);
                    }
                };

                this.synth.speak(utterance);
                nativeAttempted = true;
                this.log('Queued native speech');

                // Watchdog: If onstart doesn't fire in 500ms, assume stuck and fallback
                // (Common issue on some browsers where it just hangs)
                /* 
                setTimeout(() => {
                    if (!this.synth.speaking) {
                        this.log('Watchdog: Speech didn\'t start. Fallback.');
                        this.speakFallback(text);
                    }
                }, 1000); 
                */

            } catch (e) {
                this.log('Native Exception: ' + e.message);
            }
        } else {
            this.log('No native French voice ready. Going straight to fallback.');
        }

        // 2. Fallback if native wasn't attempted (or if we know it fails)
        if (!nativeAttempted) {
            this.speakFallback(text);
        }
    },

    /**
     * Fallback: Play MP3 from Google TTS
     */
    speakFallback(text) {
        this.log(`Using Audio Fallback for: "${text}"`);

        // Check cache
        if (this.audioCache[text]) {
            this.playAudio(this.audioCache[text]);
            return;
        }

        // Create new Audio
        const url = this.getTTSUrl(text);
        const audio = new Audio(url);

        // Add minimal error handling
        audio.onloadeddata = () => {
            this.log('Fallback audio loaded');
            this.audioCache[text] = audio;
            this.playAudio(audio);
        };

        audio.onerror = (e) => {
            this.log('Fallback fetch failed. Active internet?', 'error');
            // Last resort: Beep
            if (window.AudioManager) AudioManager.playPop();
        };

        audio.load();
        this.audioCache[text] = audio;
    },

    playAudio(audio) {
        try {
            audio.currentTime = 0;
            const p = audio.play();
            if (p) p.catch(e => this.log('Play failed: ' + e.message, 'error'));
        } catch (e) {
            this.log('Play exception: ' + e.message, 'error');
        }
    },



    /**
     * Speak positive feedback
     */
    speakPositive() {
        const phrases = [
            "Bravo !",
            "Très bien !",
            "Excellent !",
            "Super !",
            "Génial !",
            "Parfait !"
        ];
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];
        this.speak(phrase);
    },

    /**
     * Stop speaking
     */
    stop() {
        if (this.synth) this.synth.cancel();
        // Also stop any playing audio?
    },

    /**
     * Unlock method
     */
    unlock() {
        this.log('UNLOCK called');

        if (!this.synth) this.init();

        // Unlock Synth
        if (this.synth) {
            const utterance = new SpeechSynthesisUtterance('');
            this.synth.speak(utterance);
        }

        // Pre-fetch greeting to unlock audio context/network
        //this.speakFallback('Français');
    }
};

// Explicitly export to window
window.VoiceManager = VoiceManager;
