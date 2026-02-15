/**
 * Hungry Animals Game - ES Module
 * Teach children what animals eat through drag-and-drop interaction
 */

import Game from './Game.js';
import audioManager from '../utils/AudioManager.js';
import voiceManager from '../utils/VoiceManager.js';
import confettiManager from '../utils/ConfettiManager.js';

export default class HungryAnimalsGame extends Game {
    constructor() {
        super({
            id: 'hungryAnimals',
            name: 'Hungry Animals',
            icon: '🍽️'
        });

        this.currentLevel = 1;
        this.maxLevels = 3;
        this.score = 0;
        this.draggedFood = null;
        this.animals = [];
        this.foods = [];
        this.matchesCompleted = 0;

        this.animalFoodPairs = [
            { animal: '🐰', animalName: 'Le lapin', animalType: 'rabbit', food: '🥕', foodName: 'la carotte', sound: 'crunch' },
            { animal: '🐶', animalName: 'Le chien', animalType: 'dog', food: '🦴', foodName: "l'os", sound: 'crunch' },
            { animal: '🐵', animalName: 'Le singe', animalType: 'monkey', food: '🍌', foodName: 'la banane', sound: 'munch' },
            { animal: '🐱', animalName: 'Le chat', animalType: 'cat', food: '🐟', foodName: 'le poisson', sound: 'crunch' },
            { animal: '🐼', animalName: 'Le panda', animalType: 'panda', food: '🎋', foodName: 'le bambou', sound: 'munch' },
            { animal: '🦁', animalName: 'Le lion', animalType: 'lion', food: '🥩', foodName: 'la viande', sound: 'crunch' }
        ];
    }

    mount(container) {
        super.mount(container);
        this.container.innerHTML = '';
        this.score = 0;
        this.matchesCompleted = 0;
        this.animals = [];
        this.foods = [];

        const wrapper = document.createElement('div');
        wrapper.className = 'hungry-animals-wrapper';

        const scoreDisplay = document.createElement('div');
        scoreDisplay.className = 'hungry-score';
        scoreDisplay.textContent = `Score: ${this.score}`;
        this.scoreDisplay = scoreDisplay;
        wrapper.appendChild(scoreDisplay);

        const instruction = document.createElement('div');
        instruction.className = 'hungry-instruction';
        instruction.textContent = '🍽️ Nourris les animaux!';
        wrapper.appendChild(instruction);

        const animalsArea = document.createElement('div');
        animalsArea.className = 'hungry-animals-area';
        this.animalsArea = animalsArea;
        wrapper.appendChild(animalsArea);

        const foodArea = document.createElement('div');
        foodArea.className = 'hungry-food-area';
        this.foodArea = foodArea;
        wrapper.appendChild(foodArea);

        const celebrationMsg = document.createElement('div');
        celebrationMsg.className = 'level-complete-message';
        wrapper.appendChild(celebrationMsg);
        this.celebrationMsg = celebrationMsg;

        this.container.appendChild(wrapper);

        this.setupLevel();

        audioManager.playPop();
        voiceManager.speak('Nourris les animaux!');
    }

    setupLevel() {
        this.animalsArea.innerHTML = '';
        this.foodArea.innerHTML = '';
        this.animals = [];
        this.foods = [];
        this.matchesCompleted = 0;

        const numPairs = this.currentLevel;
        const shuffledPairs = [...this.animalFoodPairs].sort(() => Math.random() - 0.5);
        const levelPairs = shuffledPairs.slice(0, numPairs);

        const shuffledFoods = [...levelPairs].sort(() => Math.random() - 0.5);

        levelPairs.forEach((pair) => {
            const animalContainer = document.createElement('div');
            animalContainer.className = 'hungry-animal-container';
            animalContainer.dataset.animalType = pair.animalType;

            const animal = document.createElement('div');
            animal.className = 'hungry-animal';
            animal.textContent = pair.animal;
            animal.dataset.animalType = pair.animalType;
            animal.dataset.foodType = pair.food;

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

        shuffledFoods.forEach((pair) => {
            const food = document.createElement('div');
            food.className = 'hungry-food';
            food.textContent = pair.food;
            food.dataset.foodType = pair.food;
            food.dataset.animalType = pair.animalType;

            this.foodArea.appendChild(food);
            this.foods.push({
                element: food,
                type: pair.food,
                animalType: pair.animalType,
                pair: pair
            });

            this.addDragHandlers(food);
        });
    }

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

            if (e.target && e.target.setPointerCapture) {
                try {
                    e.target.setPointerCapture(e.pointerId);
                } catch (err) { }
            }

            audioManager.playPop();
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

            if (e.target && e.target.releasePointerCapture && e.pointerId) {
                try {
                    e.target.releasePointerCapture(e.pointerId);
                } catch (err) { }
            }

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
                this.returnFood(food);
            }

            this.draggedFood = null;
        };

        this.addEventListener(food, 'pointerdown', startDrag);
        this.addEventListener(document, 'pointermove', moveDrag);
        this.addEventListener(document, 'pointerup', endDrag);
        this.addEventListener(document, 'pointercancel', endDrag);

        const touchStartHandler = (e) => {
            e.preventDefault();
            startDrag(e);
        };
        this.addEventListener(food, 'touchstart', touchStartHandler, { passive: false });
        this.addEventListener(document, 'touchmove', moveDrag, { passive: false });
        this.addEventListener(document, 'touchend', endDrag);
        this.addEventListener(document, 'touchcancel', endDrag);
    }

    handleSuccess(food, animal) {
        animal.element.classList.add('fed');
        this.score += 20;
        this.updateScoreDisplay();

        audioManager.playSuccess();

        const sentence = `${animal.pair.animalName} mange ${animal.pair.foodName}!`;
        voiceManager.speak(sentence);

        const animalRect = animal.element.getBoundingClientRect();
        food.style.left = (animalRect.left + (animalRect.width - 80) / 2) + 'px';
        food.style.top = (animalRect.top + 20) + 'px';
        food.style.zIndex = '100';
        food.style.transform = 'scale(0.8)';

        const animalEmoji = animal.element.querySelector('.hungry-animal');
        animalEmoji.classList.add('eating');

        confettiManager.burst(
            animalRect.left + animalRect.width / 2,
            animalRect.top + animalRect.height / 2,
            30
        );

        this.showHearts(animal.element);

        setTimeout(() => {
            food.style.opacity = '0';
            food.style.transform = 'scale(0)';
            setTimeout(() => {
                food.remove();
            }, 300);
        }, 1500);

        this.matchesCompleted++;

        setTimeout(() => {
            this.checkLevelComplete();
        }, 2000);
    }

    handleFailure(food, animal) {
        audioManager.playThud();

        const animalEmoji = animal.element.querySelector('.hungry-animal');
        animalEmoji.classList.add('head-shake');

        food.classList.add('bounce-back');

        setTimeout(() => {
            animalEmoji.classList.remove('head-shake');
            food.classList.remove('bounce-back');
            this.returnFood(food);
        }, 600);
    }

    returnFood(food) {
        food.style.position = 'absolute';
        food.style.left = '';
        food.style.top = '';
        food.style.zIndex = '';
        food.style.transform = 'scale(1)';
    }

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
    }

    checkLevelComplete() {
        if (this.matchesCompleted === this.currentLevel) {
            if (this.currentLevel < this.maxLevels) {
                this.celebrationMsg.textContent = 'Level Complete!';
                this.celebrationMsg.classList.add('show');

                voiceManager.speak('Bravo! Niveau suivant!');
                confettiManager.burstCenter();

                setTimeout(() => {
                    this.celebrationMsg.classList.remove('show');
                    this.currentLevel++;
                    this.setupLevel();
                }, 2500);
            } else {
                this.showFinalCelebration();
            }
        }
    }

    showFinalCelebration() {
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

        voiceManager.speak(`Félicitations! Tu as nourri tous les animaux! Score final: ${this.score} points!`);

        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                confettiManager.burst(
                    Math.random() * window.innerWidth,
                    Math.random() * window.innerHeight,
                    40
                );
            }, i * 300);
        }

        setTimeout(() => {
            this.currentLevel = 1;
            this.score = 0;
            this.mount(this.container);
        }, 4000);
    }

    updateScoreDisplay() {
        if (this.scoreDisplay) {
            this.scoreDisplay.textContent = `Score: ${this.score}`;
        }
    }

    cleanup() {
        this.draggedFood = null;
        this.animals = [];
        this.foods = [];
        super.cleanup();
    }
}
