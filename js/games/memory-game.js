/**
 * Memory Match Game (Jeu de Mémoire)
 * Progressive difficulty memory game with numerical scoring
 * Features: Scoring system, penalty for mismatch, progressive grid sizes
 */

const MemoryGame = {
    container: null,
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    score: 0,
    currentLevel: 1,
    maxLevel: 3,
    isLocked: false,
    eventListeners: [],

    // Card content - simple emojis with French names
    cardPairs: [
        { emoji: '🐶', type: 'dog', nameFr: 'Le chien' },
        { emoji: '🍎', type: 'apple', nameFr: 'La pomme' },
        { emoji: '🐱', type: 'cat', nameFr: 'Le chat' },
        { emoji: '🍌', type: 'banana', nameFr: 'La banane' },
        { emoji: '🐰', type: 'rabbit', nameFr: 'Le lapin' },
        { emoji: '🍊', type: 'orange', nameFr: 'L\'orange' },
        { emoji: '🐻', type: 'bear', nameFr: 'L\'ours' },
        { emoji: '🍇', type: 'grapes', nameFr: 'Les raisins' }
    ],

    // Level configurations
    levelConfig: {
        1: { pairs: 2, cols: 2, rows: 2 },    // 2x2 grid, 4 cards
        2: { pairs: 3, cols: 3, rows: 2 },    // 3x2 grid, 6 cards
        3: { pairs: 4, cols: 4, rows: 2 }     // 4x2 grid, 8 cards
    },

    get config() {
        return this.levelConfig[this.currentLevel] || this.levelConfig[1];
    },

    start(container) {
        this.container = container;
        this.container.innerHTML = '';

        // Create game wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'memory-game-wrapper';

        // Add score HUD
        const scoreHUD = document.createElement('div');
        scoreHUD.className = 'score-hud';
        scoreHUD.innerHTML = `
            <div class="score-display">Score: ${this.score}</div>
            <div class="level-display">Level ${this.currentLevel}</div>
        `;
        wrapper.appendChild(scoreHUD);

        // Create level complete message container
        const levelCompleteMsg = document.createElement('div');
        levelCompleteMsg.className = 'level-complete-message';
        levelCompleteMsg.textContent = 'Niveau suivant!';
        wrapper.appendChild(levelCompleteMsg);

        // Create card grid
        const grid = document.createElement('div');
        grid.className = 'memory-grid';
        grid.style.gridTemplateColumns = `repeat(${this.config.cols}, 1fr)`;

        // Select pairs for current level
        const shuffledPairs = [...this.cardPairs]
            .sort(() => Math.random() - 0.5)
            .slice(0, this.config.pairs);

        // Create pairs
        const gameCards = [];
        shuffledPairs.forEach((pair, index) => {
            // Add two copies of each pair
            gameCards.push({ ...pair, id: index * 2 });
            gameCards.push({ ...pair, id: index * 2 + 1 });
        });

        // Shuffle cards
        this.cards = gameCards.sort(() => Math.random() - 0.5);
        this.matchedPairs = 0;
        this.flippedCards = [];
        this.isLocked = false;

        // Create card elements
        this.cards.forEach((cardData, index) => {
            const card = this.createCard(cardData, index);
            grid.appendChild(card);
        });

        wrapper.appendChild(grid);
        this.container.appendChild(wrapper);

        // Play start sound
        AudioManager.playPop();
    },

    createCard(cardData, index) {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.index = index;
        card.dataset.type = cardData.type;

        // Card inner container for flip animation
        const cardInner = document.createElement('div');
        cardInner.className = 'memory-card-inner';

        // Card front (face down)
        const cardFront = document.createElement('div');
        cardFront.className = 'memory-card-front';
        cardFront.textContent = '❓';

        // Card back (face up - shows emoji)
        const cardBack = document.createElement('div');
        cardBack.className = 'memory-card-back';
        cardBack.textContent = cardData.emoji;

        cardInner.appendChild(cardFront);
        cardInner.appendChild(cardBack);
        card.appendChild(cardInner);

        // Add click handler
        const clickHandler = (e) => this.handleCardClick(e, card, index);
        card.addEventListener('click', clickHandler);
        card.addEventListener('touchstart', (e) => {
            e.preventDefault();
            clickHandler(e);
        });

        this.eventListeners.push({ element: card, type: 'click', handler: clickHandler });

        return card;
    },

    handleCardClick(e, cardElement, index) {
        // Prevent interaction if locked or card already flipped/matched
        if (this.isLocked ||
            cardElement.classList.contains('flipped') ||
            cardElement.classList.contains('matched')) {
            return;
        }

        // Play flip sound
        AudioManager.playPop();

        // Flip the card
        cardElement.classList.add('flipped');
        this.flippedCards.push({ element: cardElement, index, type: this.cards[index].type });

        // Check if two cards are flipped
        if (this.flippedCards.length === 2) {
            this.isLocked = true;
            this.checkForMatch();
        }
    },

    checkForMatch() {
        const [card1, card2] = this.flippedCards;

        if (card1.type === card2.type) {
            // Match found!
            setTimeout(() => {
                this.handleMatch(card1, card2);
            }, 500);
        } else {
            // No match - apply penalty and flip back
            setTimeout(() => {
                this.handleMismatch(card1, card2);
            }, 1000);
        }
    },

    handleMatch(card1, card2) {
        // Mark as matched
        card1.element.classList.add('matched');
        card2.element.classList.add('matched');

        // Add points (+50 for correct match)
        this.score += 50;
        this.updateScoreDisplay();

        // Speak match confirmation
        if (window.VoiceManager) {
            // Find the card pair to get French name
            const pairInfo = this.cardPairs.find(p => p.type === card1.type);
            if (pairInfo) {
                VoiceManager.speak(`${pairInfo.nameFr} ! Une paire !`);
            } else {
                VoiceManager.speak('Une paire !');
            }
        }

        // Play success sound
        AudioManager.playSuccess();

        // Confetti burst
        const rect1 = card1.element.getBoundingClientRect();
        const rect2 = card2.element.getBoundingClientRect();
        ConfettiManager.burst(rect1.left + rect1.width / 2, rect1.top + rect1.height / 2, 20);
        ConfettiManager.burst(rect2.left + rect2.width / 2, rect2.top + rect2.height / 2, 20);

        this.matchedPairs++;
        this.flippedCards = [];
        this.isLocked = false;

        // Check if all pairs matched
        if (this.matchedPairs === this.config.pairs) {
            setTimeout(() => {
                this.handleLevelComplete();
            }, 1000);
        }
    },

    handleMismatch(card1, card2) {
        // Apply gentle penalty (-5 points for mismatch)
        this.score = Math.max(0, this.score - 5);
        this.updateScoreDisplay();

        // Play thud sound
        AudioManager.playThud();

        // Flip cards back
        card1.element.classList.remove('flipped');
        card2.element.classList.remove('flipped');

        this.flippedCards = [];
        this.isLocked = false;
    },

    handleLevelComplete() {
        // Speak level complete message
        if (window.VoiceManager) {
            VoiceManager.speak(`Niveau ${this.currentLevel} terminé !`);
        }

        // Show level complete message
        const levelCompleteMsg = this.container.querySelector('.level-complete-message');
        if (levelCompleteMsg) {
            levelCompleteMsg.innerHTML = `Level ${this.currentLevel} Complete!<br>Score: ${this.score}`;
            levelCompleteMsg.classList.add('show');
        }

        // Big celebration
        AudioManager.playSuccess();
        ConfettiManager.burstCenter();

        // Advance to next level or restart
        setTimeout(() => {
            if (this.currentLevel < this.maxLevel) {
                this.currentLevel++;
                this.start(this.container);
            } else {
                // All levels complete - show final score and restart
                this.showFinalCelebration();
            }
        }, 3000);
    },

    showFinalCelebration() {
        // Speak final celebration in French
        if (window.VoiceManager) {
            VoiceManager.speak(`Tu as gagné ! Score final : ${this.score} points !`);
        }

        // Create celebration overlay
        const overlay = document.createElement('div');
        overlay.className = 'completion-celebration';
        overlay.innerHTML = `
            <div class="celebration-content">
                <div class="celebration-emoji">🎉</div>
                <div class="celebration-text">Tu as gagné !</div>
                <div class="celebration-score">Score final : ${this.score}</div>
            </div>
        `;

        this.container.appendChild(overlay);

        // Multiple confetti bursts
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                ConfettiManager.burst(
                    Math.random() * window.innerWidth,
                    Math.random() * window.innerHeight,
                    40
                );
            }, i * 300);
        }

        // Reset and restart after celebration
        setTimeout(() => {
            this.currentLevel = 1;
            this.score = 0;
            this.start(this.container);
        }, 5000);
    },

    updateScoreDisplay() {
        const scoreDisplay = this.container.querySelector('.score-display');
        const levelDisplay = this.container.querySelector('.level-display');

        if (scoreDisplay) {
            scoreDisplay.textContent = `Score: ${this.score}`;
        }
        if (levelDisplay) {
            levelDisplay.textContent = `Level ${this.currentLevel}`;
        }
    },

    cleanup() {
        this.eventListeners.forEach(({ element, type, handler }) => {
            element.removeEventListener(type, handler);
        });
        this.eventListeners = [];
        this.container.innerHTML = '';
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.isLocked = false;
    }
};
