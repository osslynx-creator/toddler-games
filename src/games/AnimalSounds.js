/**
 * Animal Sounds Game - ES Module
 * Tap animal cards to hear their sounds and see animations
 */

import Game from './Game.js';
import audioManager from '../utils/AudioManager.js';
import voiceManager from '../utils/VoiceManager.js';
import confettiManager from '../utils/ConfettiManager.js';

export default class AnimalSoundsGame extends Game {
    constructor() {
        super({
            id: 'animalSounds',
            name: 'Animal Sounds',
            icon: '🐶'
        });

        this.animals = [
            { emoji: '🐶', type: 'dog', nameFr: 'Le chien', color: '#FFE4B5' },
            { emoji: '🐱', type: 'cat', nameFr: 'Le chat', color: '#FFB6C1' },
            { emoji: '🐮', type: 'cow', nameFr: 'La vache', color: '#F5DEB3' },
            { emoji: '🦆', type: 'duck', nameFr: 'Le canard', color: '#FFFFE0' },
            { emoji: '🐑', type: 'sheep', nameFr: 'Le mouton', color: '#FFFAF0' },
            { emoji: '🐷', type: 'pig', nameFr: 'Le cochon', color: '#FFC0CB' }
        ];
    }

    mount(container) {
        super.mount(container);
        this.container.innerHTML = '';

        const grid = document.createElement('div');
        grid.className = 'animal-grid';

        this.animals.forEach(animal => {
            const card = document.createElement('div');
            card.className = 'animal-card';
            card.textContent = animal.emoji;
            card.style.backgroundColor = animal.color;

            const clickHandler = (e) => this.handleAnimalClick(e, card, animal);

            this.addEventListener(card, 'click', clickHandler);
            this.addEventListener(card, 'touchstart', (e) => {
                e.preventDefault();
                clickHandler(e);
            });

            grid.appendChild(card);
        });

        this.container.appendChild(grid);
    }

    handleAnimalClick(e, card, animal) {
        if (card.classList.contains('animating')) return;

        voiceManager.speak(animal.nameFr);
        audioManager.playAnimalSound(animal.type);

        card.classList.add('animating');

        const rect = card.getBoundingClientRect();
        confettiManager.burst(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            20
        );

        setTimeout(() => {
            card.classList.remove('animating');
        }, 500);
    }

    cleanup() {
        super.cleanup();
    }
}
