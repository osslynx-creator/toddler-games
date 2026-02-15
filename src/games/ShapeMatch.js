/**
 * Shape Match Game - ES Module
 * Drag and drop shapes into their corresponding outlines with progressive levels
 */

import Game from './Game.js';
import audioManager from '../utils/AudioManager.js';
import voiceManager from '../utils/VoiceManager.js';
import confettiManager from '../utils/ConfettiManager.js';

export default class ShapeMatchGame extends Game {
    constructor() {
        super({
            id: 'shapeMatch',
            name: 'Shape Match',
            icon: '🔺'
        });

        this.currentLevel = 1;
        this.maxLevels = 4;
        this.score = 0;
        this.draggedElement = null;
        this.originalPosition = {};
        this.matchedCount = 0;
        this.isTransitioning = false;
        this.moveHandler = null;
        this.endHandler = null;

        this.levelConfig = {
            1: [{ emoji: '🔴', type: 'circle', nameFr: 'Le cercle', color: '#ff6b6b' }],
            2: [
                { emoji: '🔴', type: 'circle', nameFr: 'Le cercle', color: '#ff6b6b' },
                { emoji: '🟦', type: 'square', nameFr: 'Le carré', color: '#4ecdc4' }
            ],
            3: [
                { emoji: '🔴', type: 'circle', nameFr: 'Le cercle', color: '#ff6b6b' },
                { emoji: '🟦', type: 'square', nameFr: 'Le carré', color: '#4ecdc4' },
                { emoji: '🔺', type: 'triangle', nameFr: 'Le triangle', color: '#ffe66d' }
            ],
            4: [
                { emoji: '🔴', type: 'circle', nameFr: 'Le cercle', color: '#ff6b6b' },
                { emoji: '🟦', type: 'square', nameFr: 'Le carré', color: '#4ecdc4' },
                { emoji: '🔺', type: 'triangle', nameFr: 'Le triangle', color: '#ffe66d' },
                { emoji: '⭐', type: 'star', nameFr: "L'étoile", color: '#ffd700' }
            ]
        };
    }

    get shapes() {
        return this.levelConfig[this.currentLevel] || this.levelConfig[1];
    }

    mount(container) {
        super.mount(container);
        this.container.innerHTML = '';
        this.draggedElement = null;
        this.matchedCount = 0;
        this.isTransitioning = false;

        const wrapper = document.createElement('div');
        wrapper.className = 'shape-game-wrapper';

        const scoreHUD = document.createElement('div');
        scoreHUD.className = 'score-hud';
        scoreHUD.innerHTML = `
      <div class="score-display">Score: ${this.score}</div>
      <div class="level-display">Level ${this.currentLevel}</div>
    `;
        wrapper.appendChild(scoreHUD);

        const levelCompleteMsg = document.createElement('div');
        levelCompleteMsg.className = 'level-complete-message';
        levelCompleteMsg.textContent = 'Niveau suivant!';
        wrapper.appendChild(levelCompleteMsg);

        const gameArea = document.createElement('div');
        gameArea.className = 'shape-game-container';

        const targetsArea = document.createElement('div');
        targetsArea.className = 'targets-area';

        const shapesArea = document.createElement('div');
        shapesArea.className = 'shapes-area';

        const shuffledShapes = [...this.shapes].sort(() => Math.random() - 0.5);

        this.shapes.forEach((shape) => {
            const target = document.createElement('div');
            target.className = 'shape-target';
            target.dataset.shape = shape.type;
            target.innerHTML = `<span class="shape-outline">${shape.emoji}</span>`;
            targetsArea.appendChild(target);
        });

        shuffledShapes.forEach((shape, index) => {
            const draggable = document.createElement('div');
            draggable.className = 'draggable-shape';
            draggable.textContent = shape.emoji;
            draggable.dataset.shape = shape.type;

            this.originalPosition[shape.type] = index;
            this.addDragHandlers(draggable);

            shapesArea.appendChild(draggable);
        });

        gameArea.appendChild(targetsArea);
        gameArea.appendChild(shapesArea);
        wrapper.appendChild(gameArea);

        this.container.appendChild(wrapper);

        audioManager.playPop();
    }

    addDragHandlers(element) {
        const pointerDown = (e) => this.handleStart(e, element);
        this.addEventListener(element, 'pointerdown', pointerDown);

        const touchStart = (e) => {
            e.preventDefault();
            this.handleStart(e, element);
        };
        this.addEventListener(element, 'touchstart', touchStart, { passive: false });
    }

    getClientPos(e) {
        if (e.clientX !== undefined) {
            return { x: e.clientX, y: e.clientY };
        } else if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        }
        return null;
    }

    handleStart(e, element) {
        if (this.isTransitioning || this.draggedElement) return;
        e.preventDefault();
        e.stopPropagation();

        const pos = this.getClientPos(e);
        if (!pos) return;

        this.draggedElement = element;

        if (e.target && e.target.setPointerCapture) {
            e.target.setPointerCapture(e.pointerId);
        }

        const shapeType = element.dataset.shape;
        const shape = this.shapes.find(s => s.type === shapeType);
        if (shape) {
            voiceManager.speak(shape.nameFr);
        }

        const rect = element.getBoundingClientRect();
        this.offsetX = pos.x - rect.left;
        this.offsetY = pos.y - rect.top;
        this.originalX = rect.left;
        this.originalY = rect.top;

        element.style.position = 'fixed';
        element.style.left = rect.left + 'px';
        element.style.top = rect.top + 'px';
        element.style.zIndex = '1000';
        element.style.width = rect.width + 'px';
        element.style.height = rect.height + 'px';

        audioManager.playPop();

        this.moveHandler = (e) => this.handleMove(e);
        this.endHandler = (e) => this.handleEnd(e);
        document.addEventListener('pointermove', this.moveHandler);
        document.addEventListener('pointerup', this.endHandler);
        document.addEventListener('pointercancel', this.endHandler);
        document.addEventListener('touchmove', this.moveHandler, { passive: false });
        document.addEventListener('touchend', this.endHandler);
    }

    handleMove(e) {
        if (!this.draggedElement) return;
        e.preventDefault();

        const pos = this.getClientPos(e);
        if (!pos) return;

        this.draggedElement.style.left = (pos.x - this.offsetX) + 'px';
        this.draggedElement.style.top = (pos.y - this.offsetY) + 'px';
    }

    handleEnd(e) {
        if (!this.draggedElement) return;

        if (e.target && e.target.releasePointerCapture && e.pointerId) {
            try {
                e.target.releasePointerCapture(e.pointerId);
            } catch (err) { }
        }

        document.removeEventListener('pointermove', this.moveHandler);
        document.removeEventListener('pointerup', this.endHandler);
        document.removeEventListener('pointercancel', this.endHandler);
        document.removeEventListener('touchmove', this.moveHandler);
        document.removeEventListener('touchend', this.endHandler);

        const shapeType = this.draggedElement.dataset.shape;
        const targets = document.querySelectorAll('.shape-target');
        let matched = false;

        const draggedRect = this.draggedElement.getBoundingClientRect();
        const draggedCenter = {
            x: draggedRect.left + draggedRect.width / 2,
            y: draggedRect.top + draggedRect.height / 2
        };

        targets.forEach(target => {
            if (target.dataset.shape === shapeType && !target.classList.contains('filled')) {
                const targetRect = target.getBoundingClientRect();

                if (
                    draggedCenter.x >= targetRect.left &&
                    draggedCenter.x <= targetRect.right &&
                    draggedCenter.y >= targetRect.top &&
                    draggedCenter.y <= targetRect.bottom
                ) {
                    matched = true;
                    this.handleSuccess(target, targetRect);
                }
            }
        });

        if (!matched) {
            this.handleFailure();
        }

        this.draggedElement = null;
    }

    handleSuccess(target, targetRect) {
        target.classList.add('filled');
        this.score += 20;
        this.updateScoreDisplay();

        voiceManager.speakPositive();
        audioManager.playSuccess();

        if (this.draggedElement) {
            const draggedRect = this.draggedElement.getBoundingClientRect();
            this.draggedElement.style.left = (targetRect.left + (targetRect.width - draggedRect.width) / 2) + 'px';
            this.draggedElement.style.top = (targetRect.top + (targetRect.height - draggedRect.height) / 2) + 'px';
            this.draggedElement.style.cursor = 'default';
            this.draggedElement.style.pointerEvents = 'none';
        }

        confettiManager.burst(
            targetRect.left + targetRect.width / 2,
            targetRect.top + targetRect.height / 2,
            30
        );

        this.matchedCount++;

        setTimeout(() => {
            this.checkLevelComplete();
        }, 500);
    }

    handleFailure() {
        audioManager.playThud();

        if (this.draggedElement) {
            this.draggedElement.classList.add('bounce-back');
            this.draggedElement.style.left = this.originalX + 'px';
            this.draggedElement.style.top = this.originalY + 'px';

            setTimeout(() => {
                if (this.draggedElement) {
                    this.draggedElement.classList.remove('bounce-back');
                    this.draggedElement.style.position = '';
                    this.draggedElement.style.left = '';
                    this.draggedElement.style.top = '';
                    this.draggedElement.style.zIndex = '';
                    this.draggedElement.style.width = '';
                    this.draggedElement.style.height = '';
                }
            }, 400);
        }
    }

    checkLevelComplete() {
        if (this.matchedCount === this.shapes.length) {
            this.isTransitioning = true;

            voiceManager.speak('Niveau terminé !');

            const levelCompleteMsg = this.container.querySelector('.level-complete-message');
            if (levelCompleteMsg) {
                levelCompleteMsg.classList.add('show');
                levelCompleteMsg.textContent = 'Bravo!';
            }

            audioManager.playSuccess();
            confettiManager.burstCenter();

            setTimeout(() => {
                this.advanceLevel();
            }, 2500);
        }
    }

    advanceLevel() {
        if (this.currentLevel < this.maxLevels) {
            this.currentLevel++;
            this.mount(this.container);
        } else {
            this.showCompletionCelebration();
        }
    }

    showCompletionCelebration() {
        voiceManager.speak(`Tu as terminé tous les niveaux ! Score final : ${this.score} points !`);

        const overlay = document.createElement('div');
        overlay.className = 'completion-celebration';
        overlay.innerHTML = `
      <div class="celebration-content">
        <div class="celebration-emoji">🏆</div>
        <div class="celebration-text">Tu as terminé tous les niveaux !</div>
        <div class="celebration-score">Score final : ${this.score}</div>
      </div>
    `;

        this.container.appendChild(overlay);

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
            this.mount(this.container);
        }, 4000);
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
        if (this.moveHandler) {
            document.removeEventListener('pointermove', this.moveHandler);
            document.removeEventListener('touchmove', this.moveHandler);
        }
        if (this.endHandler) {
            document.removeEventListener('pointerup', this.endHandler);
            document.removeEventListener('pointercancel', this.endHandler);
            document.removeEventListener('touchend', this.endHandler);
        }

        this.draggedElement = null;
        this.isTransitioning = false;

        super.cleanup();
    }
}
