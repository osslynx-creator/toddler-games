/**
 * Whack-a-Mole Game (Jeu de la Taupe)
 * Endless tapping game with increasing difficulty and numerical scoring
 * Features: Scoring system, level progression, golden mole bonus
 */

const MoleGame = {
    container: null,
    score: 0,
    level: 1,
    molesCaught: 0,
    isPlaying: false,
    activeHole: null,
    moleTimer: null,
    gameLoop: null,
    eventListeners: [],

    // Game configuration
    config: {
        holeCount: 6,
        baseDisplayTime: 2000,     // Starting display time (ms)
        minDisplayTime: 800,       // Minimum display time (ms)
        displayTimeDecrease: 100,  // Time decrease per level (ms)
        spawnInterval: 1000,       // Base spawn interval (ms)
        molesPerLevel: 5,          // Moles needed to level up
        goldenMoleChance: 0.1,
        pointsPerMole: 10,
        pointsPerGoldenMole: 50
    },

    // Mole characters
    characters: ['🐹'],
    goldenCharacter: '👑',

    start(container) {
        this.container = container;
        this.container.innerHTML = '';
        this.resetGame();

        // Create game wrapper with living background
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

        // Create holes grid
        const holesGrid = document.createElement('div');
        holesGrid.className = 'mole-holes-grid';

        // Create holes
        for (let i = 0; i < this.config.holeCount; i++) {
            const hole = this.createHole(i);
            holesGrid.appendChild(hole);
        }

        wrapper.appendChild(holesGrid);
        this.container.appendChild(wrapper);

        // Play start sound
        AudioManager.playPop();

        // Speak game start message
        if (window.VoiceManager) {
            VoiceManager.speak('Attrape les taupes !');
        }

        // Start the game
        this.isPlaying = true;
        this.startGameLoop();
    },

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
    },

    createHole(index) {
        const hole = document.createElement('div');
        hole.className = 'mole-hole';
        hole.dataset.index = index;

        // Hole background
        const holeBg = document.createElement('div');
        holeBg.className = 'hole-background';
        hole.appendChild(holeBg);

        // Mole character (initially hidden)
        const mole = document.createElement('button');
        mole.className = 'mole-character';
        mole.style.display = 'none';

        // Add click/tap handler
        const clickHandler = (e) => this.handleMoleClick(e, mole, index);
        mole.addEventListener('click', clickHandler);
        mole.addEventListener('touchstart', (e) => {
            e.preventDefault();
            clickHandler(e);
        });

        this.eventListeners.push({ element: mole, type: 'click', handler: clickHandler });

        hole.appendChild(mole);

        return hole;
    },

    getCurrentDisplayTime() {
        const decrease = (this.level - 1) * this.config.displayTimeDecrease;
        return Math.max(this.config.minDisplayTime, this.config.baseDisplayTime - decrease);
    },

    startGameLoop() {
        // Spawn first mole after a short delay
        setTimeout(() => {
            this.spawnMole();
        }, 1000);

        // Continue spawning moles
        this.scheduleNextSpawn();
    },

    scheduleNextSpawn() {
        if (!this.isPlaying) return;

        // Calculate spawn interval based on level (faster as levels progress)
        const interval = Math.max(500, this.config.spawnInterval - (this.level - 1) * 50);

        this.gameLoop = setTimeout(() => {
            if (this.isPlaying) {
                this.spawnMole();
                this.scheduleNextSpawn();
            }
        }, interval);
    },

    spawnMole() {
        // Don't spawn if a mole is already active
        if (this.activeHole !== null) return;

        // Select random hole
        const availableHoles = [];
        const holes = this.container.querySelectorAll('.mole-hole');
        holes.forEach((hole, index) => {
            if (!hole.querySelector('.mole-character').style.display ||
                hole.querySelector('.mole-character').style.display === 'none') {
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
        const hole = holes[randomHoleIndex];
        const mole = hole.querySelector('.mole-character');
        mole.textContent = character;
        mole.className = 'mole-character' + (isGolden ? ' golden-mole' : '');
        mole.dataset.isGolden = isGolden;
        mole.style.display = 'flex';
        mole.classList.add('popping-up');

        // Set timer to hide mole (based on current level difficulty)
        const displayTime = this.getCurrentDisplayTime();

        this.moleTimer = setTimeout(() => {
            this.hideMole(mole);
        }, displayTime);
    },

    hideMole(mole) {
        mole.classList.remove('popping-up');
        mole.classList.add('popping-down');

        setTimeout(() => {
            mole.style.display = 'none';
            mole.classList.remove('popping-down');
            mole.classList.remove('golden-mole');
            this.activeHole = null;
        }, 200);
    },

    handleMoleClick(e, mole, holeIndex) {
        if (!mole.style.display || mole.style.display === 'none') return;

        // Prevent double-tapping
        if (mole.classList.contains('caught')) return;

        mole.classList.add('caught');

        const isGolden = mole.dataset.isGolden === 'true';

        // Add points
        const points = isGolden ? this.config.pointsPerGoldenMole : this.config.pointsPerMole;
        this.score += points;
        this.molesCaught++;

        // Update score display
        this.updateScoreDisplay();

        // Check for level up
        if (this.molesCaught % this.config.molesPerLevel === 0) {
            this.levelUp();
        }

        // Play appropriate sound and speak
        if (isGolden) {
            AudioManager.playMagicalChime();
            // Speak golden mole message
            if (window.VoiceManager) {
                VoiceManager.speak('Taupe magique !');
            }
        } else {
            AudioManager.playSuccess();
        }

        // Confetti burst at mole position (double for golden)
        const rect = mole.getBoundingClientRect();
        ConfettiManager.burst(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            isGolden ? 40 : 20
        );

        // Clear the hide timer
        if (this.moleTimer) {
            clearTimeout(this.moleTimer);
        }

        // Hide mole after short delay
        setTimeout(() => {
            this.hideMole(mole);
            mole.classList.remove('caught');
        }, 300);
    },

    levelUp() {
        this.level++;

        // Speak level up message
        if (window.VoiceManager) {
            VoiceManager.speak(`Niveau ${this.level} !`);
        }

        // Show level up animation
        const levelUpMsg = this.container.querySelector('.level-up-message');
        if (levelUpMsg) {
            levelUpMsg.classList.add('show');
            setTimeout(() => {
                levelUpMsg.classList.remove('show');
            }, 2000);
        }

        // Update level display
        this.updateScoreDisplay();

        // Play special sound
        AudioManager.playSuccess();

        // Big confetti celebration
        ConfettiManager.burstCenter();
    },

    updateScoreDisplay() {
        const scoreDisplay = this.container.querySelector('.score-display');
        const levelDisplay = this.container.querySelector('.level-display');

        if (scoreDisplay) {
            scoreDisplay.textContent = `Score: ${this.score}`;
        }
        if (levelDisplay) {
            levelDisplay.textContent = `Level ${this.level}`;
        }
    },

    resetGame() {
        this.score = 0;
        this.level = 1;
        this.molesCaught = 0;
        this.isPlaying = false;
        this.activeHole = null;

        if (this.moleTimer) {
            clearTimeout(this.moleTimer);
            this.moleTimer = null;
        }
        if (this.gameLoop) {
            clearTimeout(this.gameLoop);
            this.gameLoop = null;
        }
    },

    cleanup() {
        this.resetGame();

        this.eventListeners.forEach(({ element, type, handler }) => {
            element.removeEventListener(type, handler);
        });
        this.eventListeners = [];

        this.container.innerHTML = '';
    }
};
