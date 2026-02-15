/**
 * Animal Sounds Game
 * Tap animal cards to hear their sounds and see animations
 */

const AnimalSoundsGame = {
    container: null,
    animals: [
        { emoji: '🐶', type: 'dog', nameFr: 'Le chien', color: '#FFE4B5' },
        { emoji: '🐱', type: 'cat', nameFr: 'Le chat', color: '#FFB6C1' },
        { emoji: '🐮', type: 'cow', nameFr: 'La vache', color: '#F5DEB3' },
        { emoji: '🦆', type: 'duck', nameFr: 'Le canard', color: '#FFFFE0' },
        { emoji: '🐑', type: 'sheep', nameFr: 'Le mouton', color: '#FFFAF0' },
        { emoji: '🐷', type: 'pig', nameFr: 'Le cochon', color: '#FFC0CB' }
    ],
    eventListeners: [],
    
    start(container) {
        this.container = container;
        this.container.innerHTML = '';
        
        // Create game grid
        const grid = document.createElement('div');
        grid.className = 'animal-grid';
        
        this.animals.forEach(animal => {
            const card = document.createElement('div');
            card.className = 'animal-card';
            card.textContent = animal.emoji;
            card.style.backgroundColor = animal.color;
            
            const clickHandler = (e) => this.handleAnimalClick(e, card, animal);
            card.addEventListener('click', clickHandler);
            card.addEventListener('touchstart', (e) => {
                e.preventDefault();
                clickHandler(e);
            });
            
            this.eventListeners.push({ element: card, type: 'click', handler: clickHandler });
            
            grid.appendChild(card);
        });
        
        this.container.appendChild(grid);
    },
    
    handleAnimalClick(e, card, animal) {
        // Prevent multiple rapid clicks
        if (card.classList.contains('animating')) return;

        // Speak animal name in French
        if (window.VoiceManager) {
            VoiceManager.speak(animal.nameFr);
        }

        // Play sound
        AudioManager.playAnimalSound(animal.type);

        // Animate
        card.classList.add('animating');

        // Confetti burst at click position
        const rect = card.getBoundingClientRect();
        ConfettiManager.burst(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            20
        );

        // Remove animation class after completion
        setTimeout(() => {
            card.classList.remove('animating');
        }, 500);
    },
    
    cleanup() {
        this.eventListeners.forEach(({ element, type, handler }) => {
            element.removeEventListener(type, handler);
        });
        this.eventListeners = [];
        this.container.innerHTML = '';
    }
};
