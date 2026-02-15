/**
 * Rhythm Game - ES Module
 * Musical drum kit game with free play and follow-the-beat modes
 * Features: Animal drummers, visual pulse, musical particles
 */

import Game from './Game.js';
import audioManager from '../utils/AudioManager.js';
import voiceManager from '../utils/VoiceManager.js';
import confettiManager from '../utils/ConfettiManager.js';

export default class RhythmGame extends Game {
    constructor() {
        super({
            id: 'rhythmGame',
            name: 'Rhythm Game',
            icon: '🥁'
        });

        this.currentMode = 'free'; // 'free' or 'follow'
        this.currentLevel = 1;
        this.maxLevel = 3;
        this.sequence = [];
        this.playerSequence = [];
        this.isPlayingSequence = false;
        this.canPlayerInput = false;
        this.sequenceLength = 3;
        this.particles = [];
        
        // Drum configuration with animals
        this.drums = [
            {
                id: 'kick',
                name: 'Grosse Caisse',
                emoji: '🥁',
                animal: '🦁',
                animalName: 'lion',
                color: '#FF6B6B',
                sound: 'kick',
                key: 'kick'
            },
            {
                id: 'snare',
                name: 'Caisse Claire',
                emoji: '🥁',
                animal: '🐼',
                animalName: 'panda',
                color: '#4ECDC4',
                sound: 'snare',
                key: 'snare'
            },
            {
                id: 'hihat',
                name: 'Charleston',
                emoji: '🎩',
                animal: '🐵',
                animalName: 'singe',
                color: '#FFD93D',
                sound: 'hihat',
                key: 'hihat'
            },
            {
                id: 'cymbal',
                name: 'Cymbale',
                emoji: '🔔',
                animal: '🐘',
                animalName: 'éléphant',
                color: '#A8E6CF',
                sound: 'cymbal',
                key: 'cymbal'
            }
        ];
        
        this.gameMessages = {
            start: 'Tape sur les tambours pour faire de la musique !',
            followStart: 'Écoute le rythme et reproduis-le !',
            correct: ['Super !', 'Génial !', 'Excellent !', 'Parfait !'],
            wrong: 'Presque ! Essaye encore !',
            win: 'Quel rythme ! Tu es un vrai musicien !',
            levelUp: 'Niveau suivant !'
        };
    }

    mount(container) {
        super.mount(container);
        this.container.innerHTML = '';
        this.currentMode = 'free';
        this.sequence = [];
        this.playerSequence = [];
        this.isPlayingSequence = false;
        this.canPlayerInput = true;
        this.particles = [];
        
        const wrapper = document.createElement('div');
        wrapper.className = 'rhythm-wrapper';
        
        // Create header with mode selection
        const header = this.createHeader();
        wrapper.appendChild(header);
        
        // Create drum kit
        const drumKit = this.createDrumKit();
        wrapper.appendChild(drumKit);
        
        // Create mode selector
        const modeSelector = this.createModeSelector();
        wrapper.appendChild(modeSelector);
        
        this.container.appendChild(wrapper);
        
        // Start with welcome message
        audioManager.playPop();
        voiceManager.speak(this.gameMessages.start);
    }
    
    createHeader() {
        const header = document.createElement('div');
        header.className = 'rhythm-header';
        
        const title = document.createElement('div');
        title.className = 'rhythm-title';
        title.innerHTML = `
            <span class="rhythm-icon">🎵</span>
            <span class="rhythm-title-text">Orchestre des Animaux</span>
            <span class="rhythm-icon">🎵</span>
        `;
        
        const levelInfo = document.createElement('div');
        levelInfo.className = 'rhythm-level-info';
        levelInfo.innerHTML = `
            <span class="rhythm-mode">Mode: ${this.currentMode === 'free' ? 'Libre' : 'Rythme'}</span>
            ${this.currentMode === 'follow' ? `<span class="rhythm-level">Niveau ${this.currentLevel}</span>` : ''}
        `;
        
        header.appendChild(title);
        header.appendChild(levelInfo);
        
        return header;
    }
    
    createDrumKit() {
        const kit = document.createElement('div');
        kit.className = 'drum-kit';
        
        this.drums.forEach(drum => {
            const drumEl = this.createDrum(drum);
            kit.appendChild(drumEl);
        });
        
        return kit;
    }
    
    createDrum(drum) {
        const drumEl = document.createElement('div');
        drumEl.className = 'drum';
        drumEl.dataset.drumId = drum.id;
        drumEl.style.backgroundColor = drum.color;
        
        // Drum surface
        const drumSurface = document.createElement('div');
        drumSurface.className = 'drum-surface';
        drumSurface.textContent = drum.emoji;
        
        // Animal drummer
        const animal = document.createElement('div');
        animal.className = 'drum-animal';
        animal.textContent = drum.animal;
        
        // Drum label
        const label = document.createElement('div');
        label.className = 'drum-label';
        label.textContent = drum.name;
        
        drumEl.appendChild(animal);
        drumEl.appendChild(drumSurface);
        drumEl.appendChild(label);
        
        // Add interaction handlers
        const handleHit = (e) => {
            if (!this.isMounted) return;
            e.preventDefault();
            
            if (this.currentMode === 'free') {
                this.playDrum(drum);
            } else if (this.currentMode === 'follow' && this.canPlayerInput && !this.isPlayingSequence) {
                this.handleDrumInput(drum);
            }
        };
        
        this.addEventListener(drumEl, 'mousedown', handleHit);
        this.addEventListener(drumEl, 'touchstart', handleHit, { passive: false });
        
        return drumEl;
    }
    
    createModeSelector() {
        const selector = document.createElement('div');
        selector.className = 'rhythm-mode-selector';
        
        const freePlayBtn = document.createElement('button');
        freePlayBtn.className = `rhythm-mode-btn ${this.currentMode === 'free' ? 'active' : ''}`;
        freePlayBtn.innerHTML = '🎵 Libre';
        freePlayBtn.dataset.mode = 'free';
        
        const followBtn = document.createElement('button');
        followBtn.className = `rhythm-mode-btn ${this.currentMode === 'follow' ? 'active' : ''}`;
        followBtn.innerHTML = '🎯 Rythme';
        followBtn.dataset.mode = 'follow';
        
        const handleModeChange = (mode) => {
            if (mode === this.currentMode) return;
            
            this.currentMode = mode;
            this.sequence = [];
            this.playerSequence = [];
            
            // Update button states
            freePlayBtn.classList.toggle('active', mode === 'free');
            followBtn.classList.toggle('active', mode === 'follow');
            
            // Update level info
            const levelInfo = this.container.querySelector('.rhythm-level-info');
            if (levelInfo) {
                levelInfo.innerHTML = `
                    <span class="rhythm-mode">Mode: ${mode === 'free' ? 'Libre' : 'Rythme'}</span>
                    ${mode === 'follow' ? `<span class="rhythm-level">Niveau ${this.currentLevel}</span>` : ''}
                `;
            }
            
            // Start appropriate mode
            if (mode === 'free') {
                voiceManager.speak(this.gameMessages.start);
                this.canPlayerInput = true;
            } else {
                this.startFollowMode();
            }
        };
        
        this.addEventListener(freePlayBtn, 'click', () => handleModeChange('free'));
        this.addEventListener(followBtn, 'click', () => handleModeChange('follow'));
        
        selector.appendChild(freePlayBtn);
        selector.appendChild(followBtn);
        
        return selector;
    }
    
    playDrum(drum, isSequence = false) {
        // Visual feedback
        const drumEl = this.container.querySelector(`[data-drum-id="${drum.id}"]`);
        if (drumEl) {
            drumEl.classList.add('drum-active');
            
            // Animate animal
            const animal = drumEl.querySelector('.drum-animal');
            if (animal) {
                animal.classList.add('drum-animal-playing');
            }
            
            this.setGameTimeout(() => {
                if (drumEl.parentNode) {
                    drumEl.classList.remove('drum-active');
                    if (animal) {
                        animal.classList.remove('drum-animal-playing');
                    }
                }
            }, 200);
        }
        
        // Audio feedback
        this.playDrumSound(drum);
        
        // Musical particles
        if (!isSequence) {
            this.createMusicalParticles(drum);
        }
        
        // Animal voice in free play (occasionally)
        if (!isSequence && Math.random() < 0.3) {
            voiceManager.speak(`${drum.animalName} !`);
        }
    }
    
    playDrumSound(drum) {
        // Use audioManager with different frequencies to simulate drum sounds
        const frequencies = {
            kick: 80,
            snare: 200,
            hihat: 800,
            cymbal: 400
        };
        
        // Play sound through AudioManager
        if (audioManager.audioContext && audioManager.audioContext.state === 'running') {
            const oscillator = audioManager.audioContext.createOscillator();
            const gainNode = audioManager.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioManager.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequencies[drum.id] || 200, audioManager.audioContext.currentTime);
            
            // Different envelopes for different drums
            if (drum.id === 'kick') {
                oscillator.frequency.exponentialRampToValueAtTime(40, audioManager.audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.8, audioManager.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioManager.audioContext.currentTime + 0.3);
            } else if (drum.id === 'snare') {
                gainNode.gain.setValueAtTime(0.6, audioManager.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioManager.audioContext.currentTime + 0.15);
            } else if (drum.id === 'hihat') {
                oscillator.type = 'square';
                gainNode.gain.setValueAtTime(0.3, audioManager.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioManager.audioContext.currentTime + 0.05);
            } else {
                gainNode.gain.setValueAtTime(0.5, audioManager.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioManager.audioContext.currentTime + 0.5);
            }
            
            oscillator.start(audioManager.audioContext.currentTime);
            oscillator.stop(audioManager.audioContext.currentTime + 0.5);
        }
        
        // Also play pop sound as fallback/enhancement
        audioManager.playPop();
    }
    
    createMusicalParticles(drum) {
        const drumEl = this.container.querySelector(`[data-drum-id="${drum.id}"]`);
        if (!drumEl) return;
        
        const rect = drumEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const notes = ['🎵', '🎶', '🎼', '✨', '⭐'];
        const count = 4 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'music-particle';
            particle.textContent = notes[Math.floor(Math.random() * notes.length)];
            
            // Random starting position near drum center
            const offsetX = (Math.random() - 0.5) * 60;
            const offsetY = (Math.random() - 0.5) * 30;
            
            particle.style.left = `${centerX + offsetX}px`;
            particle.style.top = `${centerY + offsetY}px`;
            particle.style.fontSize = `${20 + Math.random() * 20}px`;
            particle.style.animationDelay = `${i * 0.1}s`;
            
            document.body.appendChild(particle);
            
            // Remove after animation
            this.setGameTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1500);
        }
    }
    
    startFollowMode() {
        this.currentLevel = 1;
        this.sequenceLength = 3;
        this.sequence = [];
        this.playerSequence = [];
        this.canPlayerInput = false;
        
        voiceManager.speak(this.gameMessages.followStart);
        
        this.setGameTimeout(() => {
            if (this.isMounted) {
                this.generateSequence();
                this.playSequence();
            }
        }, 2000);
    }
    
    generateSequence() {
        this.sequence = [];
        for (let i = 0; i < this.sequenceLength; i++) {
            const randomDrum = this.drums[Math.floor(Math.random() * this.drums.length)];
            this.sequence.push(randomDrum);
        }
    }
    
    playSequence() {
        this.isPlayingSequence = true;
        this.canPlayerInput = false;
        this.playerSequence = [];
        
        // Disable all drums during sequence
        const drums = this.container.querySelectorAll('.drum');
        drums.forEach(drum => drum.classList.add('drum-disabled'));
        
        // Play each drum in sequence
        let delay = 500;
        this.sequence.forEach((drum, index) => {
            this.setGameTimeout(() => {
                if (this.isMounted) {
                    // Highlight drum before playing
                    const drumEl = this.container.querySelector(`[data-drum-id="${drum.id}"]`);
                    if (drumEl) {
                        drumEl.classList.add('drum-highlight');
                        
                        this.setGameTimeout(() => {
                            if (drumEl.parentNode) {
                                drumEl.classList.remove('drum-highlight');
                            }
                        }, 300);
                    }
                    
                    this.playDrum(drum, true);
                    
                    // Enable input after sequence
                    if (index === this.sequence.length - 1) {
                        this.setGameTimeout(() => {
                            if (this.isMounted) {
                                this.isPlayingSequence = false;
                                this.canPlayerInput = true;
                                drums.forEach(drum => drum.classList.remove('drum-disabled'));
                                voiceManager.speak('À ton tour !');
                            }
                        }, 500);
                    }
                }
            }, delay);
            
            delay += 800;
        });
    }
    
    handleDrumInput(drum) {
        if (!this.canPlayerInput || this.isPlayingSequence) return;
        
        this.playDrum(drum);
        this.playerSequence.push(drum);
        
        // Check if input matches sequence
        const currentIndex = this.playerSequence.length - 1;
        
        if (this.playerSequence[currentIndex].id !== this.sequence[currentIndex].id) {
            // Wrong drum!
            this.handleWrongInput();
            return;
        }
        
        // Check if sequence is complete
        if (this.playerSequence.length === this.sequence.length) {
            this.handleSequenceComplete();
        }
    }
    
    handleWrongInput() {
        this.canPlayerInput = false;
        voiceManager.speak(this.gameMessages.wrong);
        audioManager.playThud();
        
        // Shake all drums
        const drums = this.container.querySelectorAll('.drum');
        drums.forEach(drum => drum.classList.add('drum-shake'));
        
        this.setGameTimeout(() => {
            if (this.isMounted) {
                drums.forEach(drum => drum.classList.remove('drum-shake'));
                this.playerSequence = [];
                this.canPlayerInput = true;
                voiceManager.speak('Réessaye !');
            }
        }, 1500);
    }
    
    handleSequenceComplete() {
        this.canPlayerInput = false;
        
        // Success!
        const randomMessage = this.gameMessages.correct[Math.floor(Math.random() * this.gameMessages.correct.length)];
        voiceManager.speak(randomMessage);
        audioManager.playSuccess();
        
        // Confetti
        confettiManager.burstCenter();
        
        // Animate all animals
        const animals = this.container.querySelectorAll('.drum-animal');
        animals.forEach(animal => animal.classList.add('drum-animal-celebrate'));
        
        this.setGameTimeout(() => {
            if (this.isMounted) {
                animals.forEach(animal => animal.classList.remove('drum-animal-celebrate'));
                
                // Check for level up
                if (this.currentLevel < this.maxLevel) {
                    this.currentLevel++;
                    this.sequenceLength++;
                    this.updateLevelDisplay();
                    voiceManager.speak(this.gameMessages.levelUp);
                    
                    this.setGameTimeout(() => {
                        if (this.isMounted) {
                            this.generateSequence();
                            this.playSequence();
                        }
                    }, 1500);
                } else {
                    // Game complete!
                    this.handleGameComplete();
                }
            }
        }, 1500);
    }
    
    updateLevelDisplay() {
        const levelInfo = this.container.querySelector('.rhythm-level-info');
        if (levelInfo) {
            levelInfo.innerHTML = `
                <span class="rhythm-mode">Mode: Rythme</span>
                <span class="rhythm-level">Niveau ${this.currentLevel}</span>
            `;
        }
    }
    
    handleGameComplete() {
        voiceManager.speak(this.gameMessages.win);
        audioManager.playMagicalChime();
        
        // Big celebration
        for (let i = 0; i < 5; i++) {
            this.setGameTimeout(() => {
                if (this.isMounted) {
                    confettiManager.burst(
                        Math.random() * window.innerWidth,
                        Math.random() * window.innerHeight,
                        30
                    );
                }
            }, i * 200);
        }
        
        // Create celebration overlay
        const celebration = document.createElement('div');
        celebration.className = 'rhythm-celebration';
        celebration.innerHTML = `
            <div class="rhythm-celebration-animals">🦁🐼🐵🐘</div>
            <div class="rhythm-celebration-text">${this.gameMessages.win}</div>
            <div class="rhythm-celebration-stars">⭐⭐⭐</div>
        `;
        this.container.appendChild(celebration);
        
        // Reset after celebration
        this.setGameTimeout(() => {
            if (this.isMounted) {
                this.currentMode = 'free';
                this.currentLevel = 1;
                this.mount(this.container);
            }
        }, 5000);
    }
    
    unmount() {
        this.isPlayingSequence = false;
        this.canPlayerInput = false;
        this.sequence = [];
        this.playerSequence = [];
        
        // Clean up any remaining particles
        const particles = document.querySelectorAll('.music-particle');
        particles.forEach(p => {
            if (p.parentNode) p.parentNode.removeChild(p);
        });
        
        super.unmount();
    }
}
