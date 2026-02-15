/**
 * Musical Piano Game - ES Module
 * A simple 5-key piano with synthesized tones
 */

import Game from './Game.js';
import audioManager from '../utils/AudioManager.js';
import voiceManager from '../utils/VoiceManager.js';
import confettiManager from '../utils/ConfettiManager.js';

export default class MusicalPianoGame extends Game {
    constructor() {
        super({
            id: 'musicalPiano',
            name: 'Musical Piano',
            icon: '🎹'
        });

        this.audioContext = null;
        this.keys = [
            { note: 'C', freq: 261.63, color: '#FF6B6B', colorName: 'Rouge' },
            { note: 'D', freq: 293.66, color: '#4ECDC4', colorName: 'Turquoise' },
            { note: 'E', freq: 329.63, color: '#FFE66D', colorName: 'Jaune' },
            { note: 'F', freq: 349.23, color: '#95E1D3', colorName: 'Vert' },
            { note: 'G', freq: 392.00, color: '#AA96DA', colorName: 'Violet' }
        ];
        this.activeOscillators = [];
    }

    mount(container) {
        super.mount(container);
        this.container.innerHTML = '';
        
        // Close any existing audio context before creating new one
        if (this.audioContext) {
            this.closeAudioContext(this.audioContext);
            this.audioContext = null;
        }

        this.initAudioContext();

        const wrapper = document.createElement('div');
        wrapper.className = 'piano-game-wrapper';

        const instruction = document.createElement('div');
        instruction.className = 'piano-instruction';
        instruction.textContent = '🎹 Joue du piano!';
        wrapper.appendChild(instruction);

        const pianoContainer = document.createElement('div');
        pianoContainer.className = 'piano-container';

        this.keys.forEach((key) => {
            const keyElement = document.createElement('button');
            keyElement.className = 'piano-key';
            keyElement.style.backgroundColor = key.color;
            keyElement.dataset.note = key.note;
            keyElement.dataset.freq = key.freq;
            keyElement.dataset.colorName = key.colorName;

            const noteLabel = document.createElement('span');
            noteLabel.className = 'piano-note-label';
            noteLabel.textContent = key.note;
            keyElement.appendChild(noteLabel);

            const playHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.playKey(key, keyElement);
            };

            if (window.PointerEvent) {
                this.addEventListener(keyElement, 'pointerdown', playHandler);
            } else {
                this.addEventListener(keyElement, 'touchstart', (e) => {
                    e.preventDefault();
                    playHandler(e);
                }, { passive: false });
                this.addEventListener(keyElement, 'click', playHandler);
            }

            pianoContainer.appendChild(keyElement);
        });

        wrapper.appendChild(pianoContainer);
        this.container.appendChild(wrapper);

        audioManager.playPop();
        voiceManager.speak('Joue du piano!');
    }

    initAudioContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioContext = new AudioContext();
            }
        } catch (e) {
            console.error('Could not create AudioContext:', e);
        }
    }

    playKey(key, keyElement) {
        if (!this.isMounted) return;
        
        keyElement.classList.add('piano-key-active');

        this.setGameTimeout(() => {
            if (this.isMounted) {
                keyElement.classList.remove('piano-key-active');
            }
        }, 200);

        if (!this.audioContext) {
            this.initAudioContext();
        }

        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        this.playTone(key.freq);

        const rect = keyElement.getBoundingClientRect();
        confettiManager.burst(
            rect.left + rect.width / 2,
            rect.top,
            15
        );
    }

    playTone(frequency) {
        if (!this.audioContext || !this.isMounted) {
            audioManager.playPop();
            return;
        }

        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);
            
            // Track oscillator for cleanup
            this.activeOscillators.push(oscillator);
            
            // Remove from tracking after it stops
            oscillator.onended = () => {
                const index = this.activeOscillators.indexOf(oscillator);
                if (index > -1) {
                    this.activeOscillators.splice(index, 1);
                }
            };
        } catch (e) {
            console.error('Error playing tone:', e);
            audioManager.playPop();
        }
    }

    cleanup() {
        // Stop all active oscillators
        this.activeOscillators.forEach(oscillator => {
            try {
                oscillator.stop();
            } catch (e) {
                // Oscillator may already be stopped
            }
        });
        this.activeOscillators = [];

        // Close audio context safely
        if (this.audioContext) {
            this.closeAudioContext(this.audioContext);
            this.audioContext = null;
        }

        super.cleanup();
    }
}
