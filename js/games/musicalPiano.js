/**
 * Musical Piano Game
 * A simple 5-key piano deck (C, D, E, F, G)
 * Tapping keys plays synthesized tones with visual feedback
 */

const MusicalPianoGame = {
    container: null,
    eventListeners: [],
    audioContext: null,

    // Piano keys configuration
    keys: [
        { note: 'C', freq: 261.63, color: '#FF6B6B', colorName: 'Rouge' },
        { note: 'D', freq: 293.66, color: '#4ECDC4', colorName: 'Turquoise' },
        { note: 'E', freq: 329.63, color: '#FFE66D', colorName: 'Jaune' },
        { note: 'F', freq: 349.23, color: '#95E1D3', colorName: 'Vert' },
        { note: 'G', freq: 392.00, color: '#AA96DA', colorName: 'Violet' }
    ],

    start(container) {
        this.container = container;
        this.container.innerHTML = '';

        // Initialize audio context for synthesized tones
        this.initAudioContext();

        // Create game wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'piano-game-wrapper';

        // Add instruction
        const instruction = document.createElement('div');
        instruction.className = 'piano-instruction';
        instruction.textContent = '🎹 Joue du piano!';
        wrapper.appendChild(instruction);

        // Create piano container
        const pianoContainer = document.createElement('div');
        pianoContainer.className = 'piano-container';

        // Create piano keys
        this.keys.forEach((key, index) => {
            const keyElement = document.createElement('button');
            keyElement.className = 'piano-key';
            keyElement.style.backgroundColor = key.color;
            keyElement.dataset.note = key.note;
            keyElement.dataset.freq = key.freq;
            keyElement.dataset.colorName = key.colorName;

            // Add note label
            const noteLabel = document.createElement('span');
            noteLabel.className = 'piano-note-label';
            noteLabel.textContent = key.note;
            keyElement.appendChild(noteLabel);

            // Add touch/click handler
            const playHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.playKey(key, keyElement);
            };

            // Use pointer events for better mobile support (with touch fallback)
            if (window.PointerEvent) {
                keyElement.addEventListener('pointerdown', playHandler);
                this.eventListeners.push({
                    element: keyElement,
                    type: 'pointerdown',
                    handler: playHandler
                });
            } else {
                // Fallback for older browsers
                keyElement.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    playHandler(e);
                }, { passive: false });
                keyElement.addEventListener('click', playHandler);
                this.eventListeners.push({
                    element: keyElement,
                    type: 'touchstart',
                    handler: playHandler
                });
                this.eventListeners.push({
                    element: keyElement,
                    type: 'click',
                    handler: playHandler
                });
            }

            pianoContainer.appendChild(keyElement);
        });

        wrapper.appendChild(pianoContainer);
        this.container.appendChild(wrapper);

        // Play welcome sound
        if (window.AudioManager) {
            AudioManager.playPop();
        }

        // Speak welcome message
        if (window.VoiceManager) {
            VoiceManager.speak('Joue du piano!');
        }
    },

    initAudioContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioContext = new AudioContext();
            }
        } catch (e) {
            console.error('Could not create AudioContext:', e);
        }
    },

    playKey(key, keyElement) {
        // Visual feedback
        keyElement.classList.add('piano-key-active');

        setTimeout(() => {
            keyElement.classList.remove('piano-key-active');
        }, 200);

        // Initialize audio context if needed (for mobile)
        if (!this.audioContext) {
            this.initAudioContext();
        }

        // Resume audio context if suspended (required for mobile browsers)
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        // Play synthesized tone
        this.playTone(key.freq);

        // Speak color name
        //if (window.VoiceManager) {
        //   VoiceManager.speak(key.colorName);
        //}

        // Small confetti burst above the key
        const rect = keyElement.getBoundingClientRect();
        if (window.ConfettiManager) {
            ConfettiManager.burst(
                rect.left + rect.width / 2,
                rect.top,
                15
            );
        }
    },

    playTone(frequency) {
        if (!this.audioContext) {
            // Fallback to simple beep if AudioContext not available
            if (window.AudioManager && AudioManager.playPop) {
                AudioManager.playPop();
            }
            return;
        }

        try {
            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            // Envelope for pleasant sound
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);
        } catch (e) {
            console.error('Error playing tone:', e);
            // Fallback
            if (window.AudioManager && AudioManager.playPop) {
                AudioManager.playPop();
            }
        }
    },

    cleanup() {
        // Stop any playing audio
        if (this.audioContext) {
            try {
                this.audioContext.close();
            } catch (e) {
                console.error('Error closing AudioContext:', e);
            }
            this.audioContext = null;
        }

        // Remove event listeners
        this.eventListeners.forEach(({ element, type, handler }) => {
            try {
                if (element && element.removeEventListener) {
                    element.removeEventListener(type, handler);
                }
            } catch (e) {
                // Element may already be destroyed
            }
        });
        this.eventListeners = [];

        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
};
