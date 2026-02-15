/**
 * Whack-a-Mole Game - ES Module
 * Tap the moles as they pop up with increasing difficulty and golden mole bonus
 */

import Game from './Game.js';
import audioManager from '../utils/AudioManager.js';
import voiceManager from '../utils/VoiceManager.js';
import confettiManager from '../utils/ConfettiManager.js';

export default class MoleGame extends Game {
    constructor() {
        super({
            id: 'moleGame',
            name: 'Whack-a-Mole',
            icon: '🐹'
        });

        this.score = 0;
        this.level = 1;
        this.molesCaught = 0;
        this.isPlaying = false;
        this.activeHole = null;
        this.moleTimer = null;
        this.gameLoop = null;
        this.holes = [];

        // Game configuration
        this.config = {
            holeCount: 6,
            baseDisplayTime: 2000,
            minDisplayTime: 800,
            displayTimeDecrease: 100,
            spawnInterval: 1000,
            molesPerLevel: 5,
            goldenMoleChance: 0.1,
            pointsPerMole: 10,
            pointsPerGoldenMole: 50
        };

        // Mole characters
        this.characters = ['🐹'];
        this.goldenCharacter = '👑';
    }

    mount(container) {
        super.mount(container);
        this.container.innerHTML = '';
        this.resetGame();

        const wrapper = document.createElement('div');
        wrapper.className = 'mole-game-wrapper';

        // Create living background elements
        this.createLivingBackground(wrapper);

        // Create Score HUD
        const scoreHUD = document.createElement('div');
        scoreHUD.className = 'score-hud';
        scoreHUD.innerHTML = `
            <div class="score-display">Score: ${this.score}</div>
            <div class="level-display">Level ${this.level}</div>
        `;
        wrapper.appendChild(scoreHUD);

        // Create level up message container
        const levelUpMsg = document.createElement('div');
        levelUpMsg.className = 'level-up-message';
        levelUpMsg.textContent = 'Niveau suivant!';
        wrapper.appendChild(levelUpMsg);

        // Create holes grid with correct class name
        const holesGrid = document.createElement('div');
        holesGrid.className = 'mole-holes-grid';

        // Create holes
        for (let i = 0; i < this.config.holeCount; i++) {
            const hole = this.createHole(i);
            holesGrid.appendChild(hole);
            this.holes.push(hole);
        }

        wrapper.appendChild(holesGrid);
        this.container.appendChild(wrapper);

        audioManager.playPop();
        voiceManager.speak('Attrape les taupes !');

        this.isPlaying = true;
        this.startGameLoop();
    }

    createLivingBackground(wrapper) {
        // Add floating clouds
        for (let i = 0; i < 3; i++) {
            const cloud = document.createElement('div');
            cloud.className = 'floating-cloud';
            cloud.style.top = `${10 + i * 25}%`;
            cloud.style.animationDelay = `${i * 7}s`;
            cloud.style.animationDuration = `${20 + i * 5}s`;
            wrapper.appendChild(cloud);
        }

        // Add swaying grass elements at bottom
        const grassContainer = document.createElement('div');
        grassContainer.className = 'grass-container';

        for (let i = 0; i < 8; i++) {
            const grass = document.createElement('div');
            grass.className = 'swaying-grass';
            grass.style.left = `${i * 12 + 5}%`;
            grass.style.animationDelay = `${i * 0.3}s`;
            grassContainer.appendChild(grass);
        }

        wrapper.appendChild(grassContainer);
    }

    createHole(index) {
        const hole = document.createElement('div');
        hole.className = 'mole-hole';
        hole.dataset.index = index;

        // Hole background - required for CSS styling
        const holeBg = document.createElement('div');
        holeBg.className = 'hole-background';
        hole.appendChild(holeBg);

        // Mole character (initially hidden) - using correct class name
        const mole = document.createElement('button');
        mole.className = 'mole-character';
        mole.style.display = 'none';

        const clickHandler = (e) => this.handleMoleClick(e, mole, index);
        this.addEventListener(mole, 'click', clickHandler);
        this.addEventListener(mole, 'touchstart', (e) => {
            e.preventDefault();
            clickHandler(e);
        });

        hole.appendChild(mole);

        return hole;
    }

    getCurrentDisplayTime() {
        const decrease = (this.level - 1) * this.config.displayTimeDecrease;
        return Math.max(this.config.minDisplayTime, this.config.baseDisplayTime - decrease);
    }

    startGameLoop() {
        this.setGameTimeout(() => {
            if (this.isMounted) {
                this.spawnMole();
            }
        }, 1000);

        this.scheduleNextSpawn();
    }

    scheduleNextSpawn() {
        if (!this.isPlaying || !this.isMounted) return;

        const interval = Math.max(500, this.config.spawnInterval - (this.level - 1) * 50);

        this.gameLoop = this.setGameTimeout(() => {
            if (this.isPlaying && this.isMounted) {
                this.spawnMole();
                this.scheduleNextSpawn();
            }
        }, interval);
    }

    spawnMole() {
        if (!this.isMounted) return;

        // Don't spawn if a mole is already active
        if (this.activeHole !== null) return;

        // Select random hole from available holes
        const availableHoles = [];
        this.holes.forEach((hole, index) => {
            const mole = hole.querySelector('.mole-character');
            if (!mole.style.display || mole.style.display === 'none') {
                availableHoles.push(index);
            }
        });

        if (availableHoles.length === 0) return;

        const randomHoleIndex = availableHoles[Math.floor(Math.random() * availableHoles.length)];
        this.activeHole = randomHoleIndex;

        // Determine if this is a golden mole (10% chance)
        const isGolden = Math.random() < this.config.goldenMoleChance;

        // Select character
        const character = isGolden ? this.goldenCharacter :
            this.characters[Math.floor(Math.random() * this.characters.length)];

        // Show mole
        const hole = this.holes[randomHoleIndex];
        const mole = hole.querySelector('.mole-character');
        mole.textContent = character;
        mole.className = 'mole-character' + (isGolden ? ' golden-mole' : '');
        mole.dataset.isGolden = isGolden;
        mole.style.display = 'flex';
        mole.classList.add('popping-up');

        // Set timer to hide mole (based on current level difficulty)
        const displayTime = this.getCurrentDisplayTime();

        this.moleTimer = this.setGameTimeout(() => {
            if (this.isMounted) {
                this.hideMole(mole);
            }
        }, displayTime);
    }

    hideMole(mole) {
        mole.classList.remove('popping-up');
        mole.classList.add('popping-down');

        this.setGameTimeout(() => {
            if (this.isMounted) {
                mole.style.display = 'none';
                mole.classList.remove('popping-down');
                mole.classList.remove('golden-mole');
                this.activeHole = null;
            }
        }, 200);
    }

    handleMoleClick(e, mole, holeIndex) {
        if (!this.isMounted) return;
        if (!mole.style.display || mole.style.display === 'none') return;
        if (mole.classList.contains('caught')) return;

        mole.classList.add('caught');

        const isGolden = mole.dataset.isGolden === 'true';

        // Add points
        const points = isGolden ? this.config.pointsPerGoldenMole : this.config.pointsPerMole;
        this.score += points;
        this.molesCaught++;

        this.updateScoreDisplay();

        // Check for level up
        if (this.molesCaught % this.config.molesPerLevel === 0) {
            this.levelUp();
        }

        // Play appropriate sound and speak
        if (isGolden) {
            audioManager.playMagicalChime();
            voiceManager.speak('Taupe magique !');
        } else {
            audioManager.playSuccess();
        }

        // Confetti burst at mole position (double for golden)
        const rect = mole.getBoundingClientRect();
        confettiManager.burst(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            isGolden ? 40 : 20
        );

        // Clear the hide timer
        if (this.moleTimer) {
            clearTimeout(this.moleTimer);
        }

        // Hide mole after short delay
        this.setGameTimeout(() => {
            if (this.isMounted) {
                this.hideMole(mole);
                mole.classList.remove('caught');
            }
        }, 300);
    }

    levelUp() {
        this.level++;

        voiceManager.speak(`Niveau ${this.level} !`);

        const levelUpMsg = this.container.querySelector('.level-up-message');
        if (levelUpMsg) {
            levelUpMsg.classList.add('show');
            this.setGameTimeout(() => {
                if (this.isMounted) {
                    levelUpMsg.classList.remove('show');
                }
            }, 2000);
        }

        this.updateScoreDisplay();
        audioManager.playSuccess();
        confettiManager.burstCenter();
    }

    updateScoreDisplay() {
        const scoreDisplay = this.container.querySelector('.score-display');
        const levelDisplay = this.container.querySelector('.level-display');

        if (scoreDisplay) {
            scoreDisplay.textContent = `Score: ${this.score}`;
        }
        if (levelDisplay) {
            levelDisplay.textContent = `Level ${this.level}`;
        }
    }

    resetGame() {
        this.score = 0;
        this.level = 1;
        this.molesCaught = 0;
        this.isPlaying = false;
        this.activeHole = null;
        this.holes = [];

        if (this.moleTimer) {
            clearTimeout(this.moleTimer);
            this.moleTimer = null;
        }
        if (this.gameLoop) {
            clearTimeout(this.gameLoop);
            this.gameLoop = null;
        }
    }

    cleanup() {
        this.resetGame();
        super.cleanup();
    }
}
