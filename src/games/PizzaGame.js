/**
 * Pizza Game - ES Module
 * Drag ingredients to replicate the model pizza
 * Features: Level progression, ghost shadows, cooking phase, slicing finale
 */

import Game from './Game.js';
import audioManager from '../utils/AudioManager.js';
import voiceManager from '../utils/VoiceManager.js';
import confettiManager from '../utils/ConfettiManager.js';

export default class PizzaGame extends Game {
    constructor() {
        super({
            id: 'pizzaGame',
            name: 'Pizza Game',
            icon: '🍕'
        });

        this.currentLevel = 1;
        this.maxLevel = 3;
        this.placedIngredients = [];
        this.isCooking = false;
        this.isSlicing = false;
        this.draggedIngredient = null;
        this.dragOffset = { x: 0, y: 0 };
        this.pizzaBaseRect = null;

        // Ingredient definitions with French names
        this.ingredients = {
            tomato: { emoji: '🍅', nameFr: 'tomate', color: '#ff6347' },
            cheese: { emoji: '🧀', nameFr: 'fromage', color: '#ffd700' },
            pepperoni: { emoji: '🥓', nameFr: 'pepperoni', color: '#cc4444' },
            mushroom: { emoji: '🍄', nameFr: 'champignon', color: '#d2b48c' },
            olive: { emoji: '🫒', nameFr: 'olive', color: '#556b2f' },
            pepper: { emoji: '🫑', nameFr: 'poivron', color: '#228b22' },
            onion: { emoji: '🧅', nameFr: 'oignon', color: '#dda0dd' },
            basil: { emoji: '🌿', nameFr: 'basilic', color: '#32cd32' }
        };

        // Level configurations
        this.levelConfig = {
            1: {
                ingredients: ['tomato', 'cheese'],
                positions: [
                    { x: 30, y: 30 },
                    { x: 70, y: 70 }
                ],
                tolerance: 15
            },
            2: {
                ingredients: ['tomato', 'cheese', 'pepperoni'],
                positions: [
                    { x: 25, y: 25 },
                    { x: 75, y: 25 },
                    { x: 50, y: 60 }
                ],
                tolerance: 15
            },
            3: {
                ingredients: ['tomato', 'cheese', 'pepperoni', 'mushroom', 'olive'],
                positions: [
                    { x: 20, y: 20 },
                    { x: 80, y: 20 },
                    { x: 20, y: 80 },
                    { x: 80, y: 80 },
                    { x: 50, y: 50 }
                ],
                tolerance: 12
            }
        };

        // Customer animals
        this.customers = ['🐻', '🐱', '🐶', '🐰', '🦊', '🐼'];
        this.currentCustomer = this.customers[0];
    }

    mount(container) {
        super.mount(container);
        this.container.innerHTML = '';
        this.placedIngredients = [];
        this.isCooking = false;
        this.isSlicing = false;
        this.draggedIngredient = null;
        this.currentCustomer = this.customers[Math.floor(Math.random() * this.customers.length)];

        const wrapper = document.createElement('div');
        wrapper.className = 'pizza-wrapper';

        // Create customer section
        const customerSection = this.createCustomerSection();
        wrapper.appendChild(customerSection);

        // Create model pizza display
        const modelSection = this.createModelSection();
        wrapper.appendChild(modelSection);

        // Create main game area with pizza base
        const gameArea = this.createGameArea();
        wrapper.appendChild(gameArea);

        // Create ingredients tray
        const traySection = this.createIngredientsTray();
        wrapper.appendChild(traySection);

        this.container.appendChild(wrapper);

        // Cache pizza base rect for drag calculations
        this.updatePizzaBaseRect();
        this.addResizeHandler(() => this.updatePizzaBaseRect());

        // Start game
        audioManager.playPop();
        voiceManager.speak('Fais la pizza comme le modèle !');
    }

    createCustomerSection() {
        const section = document.createElement('div');
        section.className = 'pizza-customer-section';

        const customer = document.createElement('div');
        customer.className = 'pizza-customer';
        customer.textContent = this.currentCustomer;

        const speechBubble = document.createElement('div');
        speechBubble.className = 'pizza-speech-bubble';
        speechBubble.textContent = "J'ai faim ! Fais-moi cette pizza !";

        section.appendChild(customer);
        section.appendChild(speechBubble);

        return section;
    }

    createModelSection() {
        const section = document.createElement('div');
        section.className = 'pizza-model-section';

        const label = document.createElement('div');
        label.className = 'pizza-model-label';
        label.textContent = 'Modèle';

        const modelBox = document.createElement('div');
        modelBox.className = 'pizza-model-box';

        // Create mini pizza base
        const miniBase = document.createElement('div');
        miniBase.className = 'pizza-model-base';

        // Add required ingredients to model
        const config = this.levelConfig[this.currentLevel];
        config.ingredients.forEach((ingKey, index) => {
            const ing = this.ingredients[ingKey];
            const pos = config.positions[index];

            const ingEl = document.createElement('div');
            ingEl.className = 'pizza-model-ingredient';
            ingEl.textContent = ing.emoji;
            ingEl.style.left = `${pos.x}%`;
            ingEl.style.top = `${pos.y}%`;
            ingEl.style.backgroundColor = ing.color;

            miniBase.appendChild(ingEl);
        });

        modelBox.appendChild(miniBase);
        section.appendChild(label);
        section.appendChild(modelBox);

        return section;
    }

    createGameArea() {
        const area = document.createElement('div');
        area.className = 'pizza-game-area';

        // Create pizza base with ghost shadows
        const base = document.createElement('div');
        base.className = 'pizza-base';
        base.id = 'pizzaBase';

        // Add ghost shadows for hints
        const config = this.levelConfig[this.currentLevel];
        config.ingredients.forEach((ingKey, index) => {
            const pos = config.positions[index];

            const ghost = document.createElement('div');
            ghost.className = 'pizza-ghost-shadow';
            ghost.dataset.ingredient = ingKey;
            ghost.dataset.index = index;
            ghost.style.left = `${pos.x}%`;
            ghost.style.top = `${pos.y}%`;

            base.appendChild(ghost);
        });

        // Create cook button (hidden initially)
        const cookButton = document.createElement('button');
        cookButton.className = 'pizza-cook-button hidden';
        cookButton.textContent = '🔥 Cuire !';
        this.addEventListener(cookButton, 'click', () => this.startCooking());

        // Create oven overlay (hidden initially)
        const ovenOverlay = document.createElement('div');
        ovenOverlay.className = 'pizza-oven-overlay hidden';
        ovenOverlay.id = 'ovenOverlay';

        const ovenContent = document.createElement('div');
        ovenContent.className = 'pizza-oven-content';
        ovenContent.innerHTML = `
            <div class="pizza-oven-icon">🔥</div>
            <div class="pizza-oven-text">Cuisson en cours...</div>
            <div class="pizza-steam">💨</div>
        `;
        ovenOverlay.appendChild(ovenContent);

        area.appendChild(base);
        area.appendChild(cookButton);
        area.appendChild(ovenOverlay);

        this.pizzaBase = base;
        this.cookButton = cookButton;
        this.ovenOverlay = ovenOverlay;

        return area;
    }

    createIngredientsTray() {
        const tray = document.createElement('div');
        tray.className = 'pizza-ingredient-tray';

        const label = document.createElement('div');
        label.className = 'pizza-tray-label';
        label.textContent = 'Ingrédients';

        const ingredientsContainer = document.createElement('div');
        ingredientsContainer.className = 'pizza-ingredients-container';

        // Get all available ingredients for current level and beyond
        const allIngredients = Object.keys(this.ingredients);
        const currentIngredients = this.levelConfig[this.currentLevel].ingredients;

        // Add required ingredients first, then some distractors
        const trayIngredients = [...currentIngredients];
        const distractors = allIngredients.filter(ing => !currentIngredients.includes(ing));
        trayIngredients.push(...distractors.slice(0, 2)); // Add 2 distractors

        trayIngredients.forEach(ingKey => {
            const ing = this.ingredients[ingKey];

            const ingEl = document.createElement('div');
            ingEl.className = 'pizza-ingredient';
            ingEl.dataset.ingredient = ingKey;
            ingEl.textContent = ing.emoji;
            ingEl.style.backgroundColor = ing.color;

            // Add drag handlers
            this.addDragHandlers(ingEl);

            ingredientsContainer.appendChild(ingEl);
        });

        tray.appendChild(label);
        tray.appendChild(ingredientsContainer);

        return tray;
    }

    addDragHandlers(element) {
        const startDrag = (e) => {
            if (this.isCooking || this.isSlicing) return;

            e.preventDefault();
            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

            this.draggedIngredient = {
                element: element.cloneNode(true),
                originalElement: element,
                ingredient: element.dataset.ingredient,
                startX: clientX,
                startY: clientY
            };

            // Style the dragged element
            this.draggedIngredient.element.classList.add('pizza-dragging');
            this.draggedIngredient.element.style.position = 'fixed';
            this.draggedIngredient.element.style.left = `${clientX - 40}px`;
            this.draggedIngredient.element.style.top = `${clientY - 40}px`;
            this.draggedIngredient.element.style.zIndex = '1000';
            this.draggedIngredient.element.style.pointerEvents = 'none';

            document.body.appendChild(this.draggedIngredient.element);

            // Add move and end handlers
            this.addEventListener(document, 'mousemove', handleMove, { passive: false });
            this.addEventListener(document, 'touchmove', handleMove, { passive: false });
            this.addEventListener(document, 'mouseup', handleEnd);
            this.addEventListener(document, 'touchend', handleEnd);
        };

        const handleMove = (e) => {
            if (!this.draggedIngredient) return;
            e.preventDefault();

            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

            this.draggedIngredient.element.style.left = `${clientX - 40}px`;
            this.draggedIngredient.element.style.top = `${clientY - 40}px`;
        };

        const handleEnd = (e) => {
            if (!this.draggedIngredient) return;

            const clientX = e.type.includes('touch') 
                ? e.changedTouches[0].clientX 
                : e.clientX;
            const clientY = e.type.includes('touch') 
                ? e.changedTouches[0].clientY 
                : e.clientY;

            // Check if dropped on pizza base
            this.updatePizzaBaseRect();
            if (this.isOverPizzaBase(clientX, clientY)) {
                this.handleIngredientDrop(clientX, clientY);
            } else {
                // Return to tray animation
                this.returnIngredientToTray();
            }

            // Clean up
            if (this.draggedIngredient.element.parentNode) {
                this.draggedIngredient.element.parentNode.removeChild(this.draggedIngredient.element);
            }
            this.draggedIngredient = null;
        };

        this.addEventListener(element, 'mousedown', startDrag);
        this.addEventListener(element, 'touchstart', startDrag, { passive: false });
    }

    updatePizzaBaseRect() {
        if (this.pizzaBase) {
            this.pizzaBaseRect = this.pizzaBase.getBoundingClientRect();
        }
    }

    isOverPizzaBase(x, y) {
        if (!this.pizzaBaseRect) return false;
        return (
            x >= this.pizzaBaseRect.left &&
            x <= this.pizzaBaseRect.right &&
            y >= this.pizzaBaseRect.top &&
            y <= this.pizzaBaseRect.bottom
        );
    }

    handleIngredientDrop(x, y) {
        const ingredient = this.draggedIngredient.ingredient;
        const config = this.levelConfig[this.currentLevel];

        // Calculate position relative to pizza base (percentage)
        const relX = ((x - this.pizzaBaseRect.left) / this.pizzaBaseRect.width) * 100;
        const relY = ((y - this.pizzaBaseRect.top) / this.pizzaBaseRect.height) * 100;

        // Check if ingredient is required and not already placed
        const requiredIndex = config.ingredients.indexOf(ingredient);
        if (requiredIndex === -1) {
            // Not a required ingredient
            audioManager.playThud();
            voiceManager.speak('Ce n\'est pas pour cette pizza !');
            this.returnIngredientToTray();
            return;
        }

        // Check if already placed
        if (this.placedIngredients.some(p => p.ingredient === ingredient)) {
            audioManager.playThud();
            this.returnIngredientToTray();
            return;
        }

        // Check if position is close enough to target
        const targetPos = config.positions[requiredIndex];
        const distance = Math.sqrt(
            Math.pow(relX - targetPos.x, 2) + 
            Math.pow(relY - targetPos.y, 2)
        );

        if (distance <= config.tolerance) {
            // Correct placement!
            this.placeIngredient(ingredient, targetPos);
        } else {
            // Wrong position
            audioManager.playThud();
            voiceManager.speak('Place-le plus près !');
            this.returnIngredientToTray();
        }
    }

    placeIngredient(ingredient, position) {
        const ing = this.ingredients[ingredient];

        // Create placed ingredient element
        const placedEl = document.createElement('div');
        placedEl.className = 'pizza-placed-ingredient';
        placedEl.textContent = ing.emoji;
        placedEl.style.left = `${position.x}%`;
        placedEl.style.top = `${position.y}%`;
        placedEl.style.backgroundColor = ing.color;

        this.pizzaBase.appendChild(placedEl);

        // Add to placed ingredients
        this.placedIngredients.push({ ingredient, position });

        // Hide corresponding ghost shadow
        const ghost = this.pizzaBase.querySelector(`.pizza-ghost-shadow[data-ingredient="${ingredient}"]`);
        if (ghost) {
            ghost.style.opacity = '0';
        }

        // Success feedback
        audioManager.playSuccess();
        voiceManager.speak(`Miam ! ${ing.nameFr} !`);

        // Confetti burst
        const rect = placedEl.getBoundingClientRect();
        confettiManager.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 15);

        // Check if all ingredients placed
        const config = this.levelConfig[this.currentLevel];
        if (this.placedIngredients.length === config.ingredients.length) {
            this.showCookButton();
        }
    }

    returnIngredientToTray() {
        // Bounce animation back to tray
        if (this.draggedIngredient && this.draggedIngredient.originalElement) {
            this.draggedIngredient.originalElement.classList.add('pizza-bounce-back');
            this.setGameTimeout(() => {
                if (this.draggedIngredient && this.draggedIngredient.originalElement) {
                    this.draggedIngredient.originalElement.classList.remove('pizza-bounce-back');
                }
            }, 400);
        }
    }

    showCookButton() {
        this.cookButton.classList.remove('hidden');
        this.cookButton.classList.add('pizza-show-cook');
        voiceManager.speak('Prêt à cuire !');
    }

    startCooking() {
        this.isCooking = true;
        this.cookButton.classList.add('hidden');
        this.ovenOverlay.classList.remove('hidden');

        audioManager.playMagicalChime();
        voiceManager.speak('À table !');

        // Cooking animation (3 seconds)
        this.setGameTimeout(() => {
            if (this.isMounted) {
                this.finishCooking();
            }
        }, 3000);
    }

    finishCooking() {
        this.ovenOverlay.classList.add('hidden');
        this.pizzaBase.classList.add('pizza-cooked');

        // Start slicing phase
        this.setGameTimeout(() => {
            if (this.isMounted) {
                this.startSlicingPhase();
            }
        }, 500);
    }

    startSlicingPhase() {
        this.isSlicing = true;

        // Add slice hint text
        const hint = document.createElement('div');
        hint.className = 'pizza-slice-hint';
        hint.textContent = '👆 Coupe la pizza en traînant ton doigt !';
        this.pizzaBase.appendChild(hint);

        voiceManager.speak('Maintenant, coupe la pizza !');

        // Set up swipe detection
        this.setupSlicingDetection();
    }

    setupSlicingDetection() {
        let isSlicing = false;
        let sliceCount = 0;
        const requiredSlices = 2; // Two cuts to make 4 slices

        const startSlice = (e) => {
            if (!this.isSlicing) return;
            isSlicing = true;

            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

            this.sliceStart = { x: clientX, y: clientY };
        };

        const endSlice = (e) => {
            if (!isSlicing || !this.isSlicing) return;
            isSlicing = false;

            const clientX = e.type.includes('touch') 
                ? e.changedTouches[0].clientX 
                : e.clientX;
            const clientY = e.type.includes('touch') 
                ? e.changedTouches[0].clientY 
                : e.clientY;

            // Check if slice crosses the pizza (minimum distance)
            const distance = Math.sqrt(
                Math.pow(clientX - this.sliceStart.x, 2) +
                Math.pow(clientY - this.sliceStart.y, 2)
            );

            if (distance > 100 && this.isOverPizzaBase(clientX, clientY)) {
                sliceCount++;
                this.showSliceLine(this.sliceStart, { x: clientX, y: clientY });
                audioManager.playPop();

                if (sliceCount >= requiredSlices) {
                    this.completeLevel();
                }
            }
        };

        this.addEventListener(this.pizzaBase, 'mousedown', startSlice);
        this.addEventListener(this.pizzaBase, 'touchstart', startSlice, { passive: true });
        this.addEventListener(document, 'mouseup', endSlice);
        this.addEventListener(document, 'touchend', endSlice);
    }

    showSliceLine(start, end) {
        const line = document.createElement('div');
        line.className = 'pizza-slice-line';

        const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
        const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;

        line.style.width = `${length}px`;
        line.style.left = `${start.x}px`;
        line.style.top = `${start.y}px`;
        line.style.transform = `rotate(${angle}deg)`;

        this.pizzaBase.appendChild(line);

        // Animate the slice
        this.setGameTimeout(() => {
            line.style.opacity = '0.8';
        }, 50);
    }

    completeLevel() {
        this.isSlicing = false;

        // Show celebration
        voiceManager.speak('Délicieux ! Pizza prête !');
        audioManager.playSuccess();
        confettiManager.burstCenter();

        // Show level complete message
        const message = document.createElement('div');
        message.className = 'pizza-complete-message';
        message.innerHTML = `
            <div class="pizza-complete-emoji">🍕</div>
            <div class="pizza-complete-text">Délicieux !</div>
        `;
        this.container.appendChild(message);

        // Advance level or restart
        this.setGameTimeout(() => {
            if (this.isMounted) {
                if (this.currentLevel < this.maxLevel) {
                    this.currentLevel++;
                } else {
                    this.currentLevel = 1;
                }
                this.mount(this.container);
            }
        }, 4000);
    }

    unmount() {
        this.isCooking = false;
        this.isSlicing = false;
        this.placedIngredients = [];
        super.unmount();
    }
}
