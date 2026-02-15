/**
 * Memory Game - ES Module
 * Classic memory card matching game with progressive difficulty
 */

import Game from './Game.js';
import audioManager from '../utils/AudioManager.js';
import voiceManager from '../utils/VoiceManager.js';
import confettiManager from '../utils/ConfettiManager.js';

export default class MemoryGame extends Game {
    constructor() {
        super({
            id: 'memoryGame',
            name: 'Memory Game',
            icon: '🃏'
        });

        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.canFlip = true;
        this.score = 0;
        this.currentLevel = 1;
        this.maxLevel = 3;

        // Card content with French names
        this.cardPairs = [
            { emoji: '🐶', type: 'dog', nameFr: 'Le chien' },
            { emoji: '🍎', type: 'apple', nameFr: 'La pomme' },
            { emoji: '🐱', type: 'cat', nameFr: 'Le chat' },
            { emoji: '🍌', type: 'banana', nameFr: 'La banane' },
            { emoji: '🐰', type: 'rabbit', nameFr: 'Le lapin' },
            { emoji: '🍊', type: 'orange', nameFr: 'L\'orange' },
            { emoji: '🐻', type: 'bear', nameFr: 'L\'ours' },
            { emoji: '🍇', type: 'grapes', nameFr: 'Les raisins' }
        ];

        // Level configurations
        this.levelConfig = {
            1: { pairs: 2, cols: 2, rows: 2 },    // 2x2 grid, 4 cards
            2: { pairs: 3, cols: 3, rows: 2 },    // 3x2 grid, 6 cards
            3: { pairs: 4, cols: 4, rows: 2 }     // 4x2 grid, 8 cards
        };
    }

    get config() {
        return this.levelConfig[this.currentLevel] || this.levelConfig[1];
    }

    mount(container) {
        super.mount(container);
        this.container.innerHTML = '';
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.canFlip = true;

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
            gameCards.push({ ...pair, id: index * 2 });
            gameCards.push({ ...pair, id: index * 2 + 1 });
        });

        // Shuffle cards
        const shuffled = gameCards.sort(() => Math.random() - 0.5);

        shuffled.forEach((cardData, index) => {
            const card = this.createCard(cardData, index);
            grid.appendChild(card);
            this.cards.push(card);
        });

        wrapper.appendChild(grid);
        this.container.appendChild(wrapper);

        audioManager.playPop();
    }

    createCard(cardData, index) {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.index = index;
        card.dataset.type = cardData.type;

        // Card inner container for flip animation
        const cardInner = document.createElement('div');
        cardInner.className = 'memory-card-inner';

        // Card front (face down) - using correct CSS class name
        const cardFront = document.createElement('div');
        cardFront.className = 'memory-card-front';
        cardFront.textContent = '❓';

        // Card back (face up - shows emoji) - using correct CSS class name
        const cardBack = document.createElement('div');
        cardBack.className = 'memory-card-back';
        cardBack.textContent = cardData.emoji;

        cardInner.appendChild(cardFront);
        cardInner.appendChild(cardBack);
        card.appendChild(cardInner);

        const clickHandler = (e) => this.handleCardClick(e, card, index);
        this.addEventListener(card, 'click', clickHandler);
        this.addEventListener(card, 'touchstart', (e) => {
            e.preventDefault();
            clickHandler(e);
        });

        return card;
    }

    handleCardClick(e, cardElement, index) {
        if (!this.isMounted || 
            !this.canFlip || 
            cardElement.classList.contains('flipped') || 
            cardElement.classList.contains('matched')) {
            return;
        }

        cardElement.classList.add('flipped');
        this.flippedCards.push({ 
            element: cardElement, 
            index, 
            type: this.cards[index].dataset.type 
        });
        audioManager.playPop();

        if (this.flippedCards.length === 2) {
            this.canFlip = false;
            this.checkMatch();
        }
    }

    checkMatch() {
        if (!this.isMounted) return;
        
        const [card1, card2] = this.flippedCards;

        if (card1.type === card2.type) {
            // Match found!
            this.setGameTimeout(() => {
                if (this.isMounted) {
                    this.handleMatch(card1, card2);
                }
            }, 500);
        } else {
            // No match - apply penalty and flip back
            this.setGameTimeout(() => {
                if (this.isMounted) {
                    this.handleMismatch(card1, card2);
                }
            }, 1000);
        }
    }

    handleMatch(card1, card2) {
        card1.element.classList.add('matched');
        card2.element.classList.add('matched');
        this.matchedPairs++;

        // Add points (+50 for correct match)
        this.score += 50;
        this.updateScoreDisplay();

        // Speak match confirmation
        const pairInfo = this.cardPairs.find(p => p.type === card1.type);
        if (pairInfo) {
            voiceManager.speak(`${pairInfo.nameFr} ! Une paire !`);
        } else {
            voiceManager.speak('Une paire !');
        }

        audioManager.playSuccess();

        const rect1 = card1.element.getBoundingClientRect();
        const rect2 = card2.element.getBoundingClientRect();
        confettiManager.burst(rect1.left + rect1.width / 2, rect1.top + rect1.height / 2, 20);
        confettiManager.burst(rect2.left + rect2.width / 2, rect2.top + rect2.height / 2, 20);

        this.flippedCards = [];
        this.canFlip = true;

        if (this.matchedPairs === this.config.pairs) {
            this.setGameTimeout(() => {
                if (this.isMounted) {
                    this.handleLevelComplete();
                }
            }, 1000);
        }
    }

    handleMismatch(card1, card2) {
        // Apply gentle penalty (-5 points for mismatch)
        this.score = Math.max(0, this.score - 5);
        this.updateScoreDisplay();

        audioManager.playThud();

        card1.element.classList.remove('flipped');
        card2.element.classList.remove('flipped');

        this.flippedCards = [];
        this.canFlip = true;
    }

    handleLevelComplete() {
        voiceManager.speak(`Niveau ${this.currentLevel} terminé !`);

        const levelCompleteMsg = this.container.querySelector('.level-complete-message');
        if (levelCompleteMsg) {
            levelCompleteMsg.innerHTML = `Level ${this.currentLevel} Complete!<br>Score: ${this.score}`;
            levelCompleteMsg.classList.add('show');
        }

        audioManager.playSuccess();
        confettiManager.burstCenter();

        this.setGameTimeout(() => {
            if (this.isMounted) {
                if (this.currentLevel < this.maxLevel) {
                    this.currentLevel++;
                    this.mount(this.container);
                } else {
                    this.showFinalCelebration();
                }
            }
        }, 3000);
    }

    showFinalCelebration() {
        voiceManager.speak(`Tu as gagné ! Score final : ${this.score} points !`);

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

        for (let i = 0; i < 5; i++) {
            this.setGameTimeout(() => {
                confettiManager.burst(
                    Math.random() * window.innerWidth,
                    Math.random() * window.innerHeight,
                    40
                );
            }, i * 300);
        }

        this.setGameTimeout(() => {
            if (this.isMounted) {
                this.currentLevel = 1;
                this.score = 0;
                this.mount(this.container);
            }
        }, 5000);
    }

    updateScoreDisplay() {
        const scoreDisplay = this.container.querySelector('.score-display');
        const levelDisplay = this.container.querySelector('.level-display');

        if (scoreDisplay) {
            scoreDisplay.textContent = `Score: ${this.score}`;
        }
        if (levelDisplay) {
            levelDisplay.textContent = `Level ${this.currentLevel}`;
        }
    }

    cleanup() {
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.canFlip = true;
        this.currentLevel = 1;
        this.score = 0;
        super.cleanup();
    }
}
