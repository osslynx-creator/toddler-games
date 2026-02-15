/**
 * Hungry Animals Game
 * Teach children what animals eat through drag-and-drop interaction
 * Progressive difficulty: 1 animal → 2 animals → 3 animals
 */

const HungryAnimalsGame = {
    container: null,
    currentLevel: 1,
    maxLevels: 3,
    score: 0,
    draggedFood: null,
    animals: [],
    foods: [],
    matchesCompleted: 0,
    eventListeners: [],

    // Animal-food pairs
    animalFoodPairs: [
        { animal: '🐰', animalName: 'Le lapin', animalType: 'rabbit', food: '🥕', foodName: 'la carotte', sound: 'crunch' },
        { animal: '🐶', animalName: 'Le chien', animalType: 'dog', food: '🦴', foodName: 'l\'os', sound: 'crunch' },
        { animal: '🐵', animalName: 'Le singe', animalType: 'monkey', food: '🍌', foodName: 'la banane', sound: 'munch' },
        { animal: '🐱', animalName: 'Le chat', animalType: 'cat', food: '🐟', foodName: 'le poisson', sound: 'crunch' },
        { animal: '🐼', animalName: 'Le panda', animalType: 'panda', food: '🎋', foodName: 'le bambou', sound: 'munch' },
        { animal: '🦁', animalName: 'Le lion', animalType: 'lion', food: '🥩', foodName: 'la viande', sound: 'crunch' }
    ],

    start(container) {
        this.container = container;
        this.container.innerHTML = '';
        this.score = 0;
        this.matchesCompleted = 0;
        this.animals = [];
        this.foods = [];

        // Create game wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'hungry-animals-wrapper';

        // Add score display
        const scoreDisplay = document.createElement('div');
        scoreDisplay.className = 'hungry-score';
        scoreDisplay.textContent = `Score: ${this.score}`;
        this.scoreDisplay = scoreDisplay;
        wrapper.appendChild(scoreDisplay);

        // Add instruction
        const instruction = document.createElement('div');
        instruction.className = 'hungry-instruction';
        instruction.textContent = '🍽️ Nourris les animaux!';
        wrapper.appendChild(instruction);

        // Create animals area (top)
        const animalsArea = document.createElement('div');
        animalsArea.className = 'hungry-animals-area';
        this.animalsArea = animalsArea;
        wrapper.appendChild(animalsArea);

        // Create food area (bottom)
        const foodArea = document.createElement('div');
        foodArea.className = 'hungry-food-area';
        this.foodArea = foodArea;
        wrapper.appendChild(foodArea);

        // Create celebration message container
        const celebrationMsg = document.createElement('div');
        celebrationMsg.className = 'level-complete-message';
        wrapper.appendChild(celebrationMsg);
        this.celebrationMsg = celebrationMsg;

        this.container.appendChild(wrapper);

        // Start level
        this.setupLevel();

        // Play start sound
        if (window.AudioManager) {
            AudioManager.playPop();
        }

        // Speak welcome message
        if (window.VoiceManager) {
            VoiceManager.speak('Nourris les animaux!');
        }
    },

    setupLevel() {
        // Clear areas
        this.animalsArea.innerHTML = '';
        this.foodArea.innerHTML = '';
        this.animals = [];
        this.foods = [];
        this.matchesCompleted = 0;

        // Get pairs for current level
        const numPairs = this.currentLevel;
        const shuffledPairs = [...this.animalFoodPairs].sort(() => Math.random() - 0.5);
        const levelPairs = shuffledPairs.slice(0, numPairs);

        // Shuffle foods for random placement
        const shuffledFoods = [...levelPairs].sort(() => Math.random() - 0.5);

        // Create animals (top area)
        levelPairs.forEach((pair, index) => {
            const animalContainer = document.createElement('div');
            animalContainer.className = 'hungry-animal-container';
            animalContainer.dataset.animalType = pair.animalType;

            const animal = document.createElement('div');
            animal.className = 'hungry-animal';
            animal.textContent = pair.animal;
            animal.dataset.animalType = pair.animalType;
            animal.dataset.foodType = pair.food;
            animal.dataset.animalName = pair.animalName;
            animal.dataset.foodName = pair.foodName;

            const label = document.createElement('div');
            label.className = 'hungry-animal-label';
            label.textContent = pair.animalName;

            animalContainer.appendChild(animal);
            animalContainer.appendChild(label);
            this.animalsArea.appendChild(animalContainer);

            this.animals.push({
                element: animalContainer,
                type: pair.animalType,
                food: pair.food,
                pair: pair
            });
        });

        // Create foods (bottom area)
        shuffledFoods.forEach((pair, index) => {
            const food = document.createElement('div');
            food.className = 'hungry-food';
            food.textContent = pair.food;
            food.dataset.foodType = pair.food;
            food.dataset.animalType = pair.animalType;
            food.dataset.foodName = pair.foodName;
            food.dataset.animalName = pair.animalName;

            this.foodArea.appendChild(food);
            this.foods.push({
                element: food,
                type: pair.food,
                animalType: pair.animalType,
                pair: pair
            });

            // Add drag handlers
            this.addDragHandlers(food);
        });
    },

    addDragHandlers(food) {
        let startX, startY, initialLeft, initialTop;
        let isDragging = false;

        const getClientPos = (e) => {
            if (e.clientX !== undefined) {
                return { x: e.clientX, y: e.clientY };
            } else if (e.touches && e.touches.length > 0) {
                return { x: e.touches[0].clientX, y: e.touches[0].clientY };
            } else if (e.changedTouches && e.changedTouches.length > 0) {
                return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
            }
            return null;
        };

        const startDrag = (e) => {
            e.preventDefault();
            if (this.draggedFood) return;

            const pos = getClientPos(e);
            if (!pos) return;

            isDragging = true;
            this.draggedFood = food;

            startX = pos.x;
            startY = pos.y;

            const rect = food.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;

            food.style.position = 'fixed';
            food.style.left = initialLeft + 'px';
            food.style.top = initialTop + 'px';
            food.style.zIndex = '1000';
            food.style.transform = 'scale(1.2)';

            // Capture pointer for better tracking
            if (e.target && e.target.setPointerCapture) {
                e.target.setPointerCapture(e.pointerId);
            }

            // Play pickup sound
            if (window.AudioManager) {
                AudioManager.playPop();
            }
        };

        const moveDrag = (e) => {
            if (!isDragging || !this.draggedFood || this.draggedFood !== food) return;

            const pos = getClientPos(e);
            if (!pos) return;

            const dx = pos.x - startX;
            const dy = pos.y - startY;

            food.style.left = (initialLeft + dx) + 'px';
            food.style.top = (initialTop + dy) + 'px';
        };

        const endDrag = (e) => {
            if (!isDragging || !this.draggedFood || this.draggedFood !== food) return;

            isDragging = false;

            // Release pointer capture
            if (e.target && e.target.releasePointerCapture && e.pointerId) {
                try {
                    e.target.releasePointerCapture(e.pointerId);
                } catch (err) { }
            }

            // Check if dropped on correct animal
            const foodRect = food.getBoundingClientRect();
            const foodCenter = {
                x: foodRect.left + foodRect.width / 2,
                y: foodRect.top + foodRect.height / 2
            };

            let matched = false;
            let matchedAnimal = null;

            this.animals.forEach(animal => {
                if (animal.element.classList.contains('fed')) return;

                const animalRect = animal.element.getBoundingClientRect();

                if (
                    foodCenter.x >= animalRect.left &&
                    foodCenter.x <= animalRect.right &&
                    foodCenter.y >= animalRect.top &&
                    foodCenter.y <= animalRect.bottom
                ) {
                    matchedAnimal = animal;
                    if (animal.type === food.dataset.animalType) {
                        matched = true;
                    }
                }
            });

            if (matched) {
                this.handleSuccess(food, matchedAnimal);
            } else if (matchedAnimal) {
                this.handleFailure(food, matchedAnimal);
            } else {
                // Dropped elsewhere, return to original position
                this.returnFood(food);
            }

            this.draggedFood = null;
        };

        // Store event handler references
        const touchStartHandler = (e) => {
            e.preventDefault();
            startDrag(e);
        };

        // Use pointer events for unified mouse/touch handling
        if (window.PointerEvent) {
            food.addEventListener('pointerdown', startDrag);
            document.addEventListener('pointermove', moveDrag);
            document.addEventListener('pointerup', endDrag);
            document.addEventListener('pointercancel', endDrag);

            this.eventListeners.push(
                { element: food, type: 'pointerdown', handler: startDrag },
                { element: document, type: 'pointermove', handler: moveDrag },
                { element: document, type: 'pointerup', handler: endDrag },
                { element: document, type: 'pointercancel', handler: endDrag }
            );
        } else {
            // Fallback for older browsers
            food.addEventListener('touchstart', touchStartHandler, { passive: false });
            document.addEventListener('touchmove', moveDrag, { passive: false });
            document.addEventListener('touchend', endDrag);
            document.addEventListener('touchcancel', endDrag);

            this.eventListeners.push(
                { element: food, type: 'touchstart', handler: touchStartHandler },
                { element: document, type: 'touchmove', handler: moveDrag },
                { element: document, type: 'touchend', handler: endDrag },
                { element: document, type: 'touchcancel', handler: endDrag }
            );
        }
    },

    handleSuccess(food, animal) {
        // Mark animal as fed
        animal.element.classList.add('fed');

        // Update score
        this.score += 20;
        this.updateScoreDisplay();

        // Play eating sound
        if (window.AudioManager) {
            AudioManager.playSuccess();
        }

        // Speak the sentence
        if (window.VoiceManager) {
            const sentence = `${animal.pair.animalName} mange ${animal.pair.foodName}!`;
            VoiceManager.speak(sentence);
        }

        // Position food on animal
        const animalRect = animal.element.getBoundingClientRect();
        food.style.left = (animalRect.left + (animalRect.width - 80) / 2) + 'px';
        food.style.top = (animalRect.top + 20) + 'px';
        food.style.zIndex = '100';
        food.style.transform = 'scale(0.8)';

        // Animal eating animation
        const animalEmoji = animal.element.querySelector('.hungry-animal');
        animalEmoji.classList.add('eating');

        // Confetti burst
        if (window.ConfettiManager) {
            ConfettiManager.burst(
                animalRect.left + animalRect.width / 2,
                animalRect.top + animalRect.height / 2,
                30
            );
        }

        // Show hearts
        this.showHearts(animal.element);

        // Fade out food after animation
        setTimeout(() => {
            food.style.opacity = '0';
            food.style.transform = 'scale(0)';
            setTimeout(() => {
                food.remove();
            }, 300);
        }, 1500);

        this.matchesCompleted++;

        // Check if level complete
        setTimeout(() => {
            this.checkLevelComplete();
        }, 2000);
    },

    handleFailure(food, animal) {
        // Play boing sound
        if (window.AudioManager) {
            AudioManager.playThud();
        }

        // Animal head shake
        const animalEmoji = animal.element.querySelector('.hungry-animal');
        animalEmoji.classList.add('head-shake');

        // Food bounce back animation
        food.classList.add('bounce-back');

        setTimeout(() => {
            animalEmoji.classList.remove('head-shake');
            food.classList.remove('bounce-back');
            this.returnFood(food);
        }, 600);
    },

    returnFood(food) {
        // Return to food area
        food.style.position = 'absolute';
        food.style.left = '';
        food.style.top = '';
        food.style.zIndex = '';
        food.style.transform = 'scale(1)';
    },

    showHearts(container) {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const heart = document.createElement('div');
                heart.className = 'hungry-heart';
                heart.textContent = '❤️';
                heart.style.left = (20 + Math.random() * 60) + '%';
                heart.style.top = '0%';
                container.appendChild(heart);

                setTimeout(() => {
                    heart.remove();
                }, 1500);
            }, i * 200);
        }
    },

    checkLevelComplete() {
        if (this.matchesCompleted === this.currentLevel) {
            // Level complete
            if (this.currentLevel < this.maxLevels) {
                // Show celebration and advance
                this.celebrationMsg.textContent = 'Level Complete!';
                this.celebrationMsg.classList.add('show');

                if (window.VoiceManager) {
                    VoiceManager.speak('Bravo! Niveau suivant!');
                }

                if (window.ConfettiManager) {
                    ConfettiManager.burstCenter();
                }

                setTimeout(() => {
                    this.celebrationMsg.classList.remove('show');
                    this.currentLevel++;
                    this.setupLevel();
                }, 2500);
            } else {
                // All levels complete
                this.showFinalCelebration();
            }
        }
    },

    showFinalCelebration() {
        // Create celebration overlay
        const overlay = document.createElement('div');
        overlay.className = 'completion-celebration';
        overlay.innerHTML = `
            <div class="celebration-content">
                <div class="celebration-emoji">🏆</div>
                <div class="celebration-text">Tous les animaux sont nourris!</div>
                <div class="celebration-score">Score: ${this.score}</div>
            </div>
        `;

        this.container.appendChild(overlay);

        if (window.VoiceManager) {
            VoiceManager.speak(`Félicitations! Tu as nourri tous les animaux! Score final: ${this.score} points!`);
        }

        // Multiple confetti bursts
        if (window.ConfettiManager) {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    ConfettiManager.burst(
                        Math.random() * window.innerWidth,
                        Math.random() * window.innerHeight,
                        40
                    );
                }, i * 300);
            }
        }

        // Reset to level 1
        setTimeout(() => {
            this.currentLevel = 1;
            this.score = 0;
            this.start(this.container);
        }, 4000);
    },

    updateScoreDisplay() {
        if (this.scoreDisplay) {
            this.scoreDisplay.textContent = `Score: ${this.score}`;
        }
    },

    cleanup() {
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

        // Reset state
        this.draggedFood = null;
        this.animals = [];
        this.foods = [];

        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
};
