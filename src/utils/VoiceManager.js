/**
 * Voice Manager - ES Module
 * Text-to-Speech using Web Speech API with Google TTS fallback
 * Integrates with Store for mute state
 */

import store from '../store/index.js';
import audioManager from './AudioManager.js';

class VoiceManager {
    constructor() {
        this.synth = null;
        this.frenchVoice = null;
        this.isMuted = store.getState().isMuted;
        this.isInitialized = false;
        this.audioCache = {};

        // Subscribe to mute state changes
        store.subscribe('isMuted', (isMuted) => {
            this.isMuted = isMuted;
            if (isMuted) {
                this.stop();
            }
        });
    }

    getTTSUrl(text) {
        return `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=fr&q=${encodeURIComponent(text)}`;
    }

    init() {
        if (this.isInitialized) return;

        if ('speechSynthesis' in window) {
            this.synth = window.speechSynthesis;
        }

        this.isInitialized = true;
        this.loadVoices();

        if (this.synth && this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => this.loadVoices();
        }
    }

    loadVoices() {
        if (!this.synth) return;

        try {
            const voices = this.synth.getVoices();
            const frenchVoices = voices.filter(voice =>
                voice.lang && (voice.lang.includes('fr') || voice.lang.includes('FR'))
            );

            if (frenchVoices.length > 0) {
                const preferredVoices = ['Google français', 'Thomas', 'Audrey', 'Amélie'];
                this.frenchVoice = frenchVoices.find(v => preferredVoices.some(p => v.name.includes(p))) || frenchVoices[0];
            } else {
                this.frenchVoice = null;
            }
        } catch (e) {
            console.error('Error loading voices:', e);
        }
    }

    speak(text, options = {}) {
        if (this.isMuted) return;

        let nativeAttempted = false;

        if (this.synth && this.frenchVoice) {
            try {
                this.synth.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.voice = this.frenchVoice;
                utterance.lang = 'fr-FR';
                utterance.pitch = options.pitch || 1.1;
                utterance.rate = options.rate || 0.9;

                utterance.onerror = (e) => {
                    if (e.error !== 'canceled' && e.error !== 'interrupted') {
                        this.speakFallback(text);
                    }
                };

                this.synth.speak(utterance);
                nativeAttempted = true;
            } catch (e) {
                console.error('Native speech error:', e);
            }
        }

        if (!nativeAttempted) {
            this.speakFallback(text);
        }
    }

    speakFallback(text) {
        if (this.audioCache[text]) {
            this.playAudio(this.audioCache[text]);
            return;
        }

        const url = this.getTTSUrl(text);
        const audio = new Audio(url);

        audio.onloadeddata = () => {
            this.audioCache[text] = audio;
            this.playAudio(audio);
        };

        audio.onerror = () => {
            audioManager.playPop();
        };

        audio.load();
        this.audioCache[text] = audio;
    }

    playAudio(audio) {
        try {
            audio.currentTime = 0;
            const p = audio.play();
            if (p) p.catch(e => console.error('Play failed:', e));
        } catch (e) {
            console.error('Play exception:', e);
        }
    }

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
    }

    stop() {
        if (this.synth) this.synth.cancel();
    }

    unlock() {
        if (!this.synth) this.init();

        if (this.synth) {
            const utterance = new SpeechSynthesisUtterance('');
            this.synth.speak(utterance);
        }
    }
}

export default new VoiceManager();
