/**
 * Shape Match Game with Levels
 * Drag and drop shapes into their corresponding outlines
 * Progressive difficulty: Level 1 (1 shape) → Level 2 (2 shapes) → Level 3 (3 shapes) → Level 4 (4 shapes)
 */

const ShapeMatchGame = {
    container: null,
    currentLevel: 1,
    maxLevels: 4,
    score: 0,
    draggedElement: null,
    originalPosition: {},
    eventListeners: [],
    matchedCount: 0,
    isTransitioning: false,

    // Define shapes for each level
    levelConfig: {
        1: [
            { emoji: '🔴', type: 'circle', nameFr: 'Le cercle', color: '#ff6b6b' }
        ],
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
            { emoji: '⭐', type: 'star', nameFr: 'L\'étoile', color: '#ffd700' }
        ]
    },

    get shapes() {
        return this.levelConfig[this.currentLevel] || this.levelConfig[1];
    },

    start(container) {
        this.container = container;
        this.container.innerHTML = '';
        this.draggedElement = null;
        this.matchedCount = 0;
        this.isTransitioning = false;

        // Create game wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'shape-game-wrapper';

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

        // Create game area
        const gameArea = document.createElement('div');
        gameArea.className = 'shape-game-container';

        // Create targets area (outlines)
        const targetsArea = document.createElement('div');
        targetsArea.className = 'targets-area';

        // Create shapes area (draggables)
        const shapesArea = document.createElement('div');
        shapesArea.className = 'shapes-area';

        // Shuffle shapes for random placement
        const shuffledShapes = [...this.shapes].sort(() => Math.random() - 0.5);

        // Create targets and shapes
        this.shapes.forEach((shape, index) => {
            // Create target (outline)
            const target = document.createElement('div');
            target.className = 'shape-target';
            target.dataset.shape = shape.type;
            target.innerHTML = `<span class="shape-outline">${shape.emoji}</span>`;
            targetsArea.appendChild(target);
        });

        // Create draggable shapes (shuffled)
        shuffledShapes.forEach((shape, index) => {
            const draggable = document.createElement('div');
            draggable.className = 'draggable-shape';
            draggable.textContent = shape.emoji;
            draggable.dataset.shape = shape.type;

            // Store original position reference
            this.originalPosition[shape.type] = index;

            // Add drag handlers
            this.addDragHandlers(draggable);

            shapesArea.appendChild(draggable);
        });

        gameArea.appendChild(targetsArea);
        gameArea.appendChild(shapesArea);
        wrapper.appendChild(gameArea);

        this.container.appendChild(wrapper);

        // Play start sound
        AudioManager.playPop();
    },

    addDragHandlers(element) {
        // Use pointer events for unified mouse/touch handling
        const pointerDown = (e) => this.handleStart(e, element);
        element.addEventListener('pointerdown', pointerDown);
        this.eventListeners.push({ element, type: 'pointerdown', handler: pointerDown });

        // Fallback touch events for older mobile browsers
        const touchStart = (e) => {
            e.preventDefault();
            this.handleStart(e, element);
        };
        element.addEventListener('touchstart', touchStart, { passive: false });
        this.eventListeners.push({ element, type: 'touchstart', handler: touchStart });
    },

    getClientPos(e) {
        // Handle both pointer events and touch events
        if (e.clientX !== undefined) {
            return { x: e.clientX, y: e.clientY };
        } else if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        }
        return null;
    },

    handleStart(e, element) {
        if (this.isTransitioning) return;
        e.preventDefault();
        e.stopPropagation();

        if (this.draggedElement) return;

        const pos = this.getClientPos(e);
        if (!pos) return;

        this.draggedElement = element;

        // Capture pointer for better tracking
        if (e.target && e.target.setPointerCapture) {
            e.target.setPointerCapture(e.pointerId);
        }

        // Speak shape name in French
        const shapeType = element.dataset.shape;
        const shape = this.shapes.find(s => s.type === shapeType);
        if (shape && window.VoiceManager) {
            VoiceManager.speak(shape.nameFr);
        }

        const rect = element.getBoundingClientRect();
        this.offsetX = pos.x - rect.left;
        this.offsetY = pos.y - rect.top;

        // Store original position
        this.originalX = rect.left;
        this.originalY = rect.top;

        // Make element absolute for dragging
        element.style.position = 'fixed';
        element.style.left = rect.left + 'px';
        element.style.top = rect.top + 'px';
        element.style.zIndex = '1000';
        element.style.width = rect.width + 'px';
        element.style.height = rect.height + 'px';

        // Play pop sound
        AudioManager.playPop();

        // Add move and end handlers using pointer events
        this.moveHandler = (e) => this.handleMove(e);
        this.endHandler = (e) => this.handleEnd(e);
        document.addEventListener('pointermove', this.moveHandler);
        document.addEventListener('pointerup', this.endHandler);
        document.addEventListener('pointercancel', this.endHandler);

        // Fallback touch handlers
        document.addEventListener('touchmove', this.moveHandler, { passive: false });
        document.addEventListener('touchend', this.endHandler);
    },

    handleMove(e) {
        if (!this.draggedElement) return;
        e.preventDefault();

        const pos = this.getClientPos(e);
        if (!pos) return;

        this.draggedElement.style.left = (pos.x - this.offsetX) + 'px';
        this.draggedElement.style.top = (pos.y - this.offsetY) + 'px';
    },

    handleEnd(e) {
        if (!this.draggedElement) return;

        try {
            // Release pointer capture
            if (e.target && e.target.releasePointerCapture && e.pointerId) {
                try {
                    e.target.releasePointerCapture(e.pointerId);
                } catch (err) {
                    // Ignore errors
                }
            }

            // Remove move handlers
            document.removeEventListener('pointermove', this.moveHandler);
            document.removeEventListener('pointerup', this.endHandler);
            document.removeEventListener('pointercancel', this.endHandler);
            document.removeEventListener('touchmove', this.moveHandler);
            document.removeEventListener('touchend', this.endHandler);

            // Check if dropped on correct target
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

                    // Check if center of dragged element is within target
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
        } catch (error) {
            console.error('Error in handleEnd:', error);
        } finally {
            this.draggedElement = null;
        }
    },

    handleSuccess(target, targetRect) {
        try {
            // Mark target as filled
            target.classList.add('filled');

            // Add points (+20 per correct shape)
            this.score += 20;
            this.updateScoreDisplay();

            // Speak positive feedback
            if (window.VoiceManager && typeof VoiceManager.speakPositive === 'function') {
                VoiceManager.speakPositive();
            }

            // Play success sound
            if (window.AudioManager) {
                AudioManager.playSuccess();
            }

            // Position the shape in the target (center it)
            if (this.draggedElement) {
                const draggedRect = this.draggedElement.getBoundingClientRect();
                this.draggedElement.style.left = (targetRect.left + (targetRect.width - draggedRect.width) / 2) + 'px';
                this.draggedElement.style.top = (targetRect.top + (targetRect.height - draggedRect.height) / 2) + 'px';
                this.draggedElement.style.cursor = 'default';

                // Make it not draggable anymore
                this.draggedElement.style.pointerEvents = 'none';
            }

            // Confetti burst
            if (window.ConfettiManager) {
                ConfettiManager.burst(
                    targetRect.left + targetRect.width / 2,
                    targetRect.top + targetRect.height / 2,
                    30
                );
            }

            this.matchedCount++;

            // Check if all shapes matched for this level
            const self = this;
            setTimeout(function () {
                self.checkLevelComplete();
            }, 500);
        } catch (error) {
            console.error('Error in handleSuccess:', error);
        }
    },

    handleFailure() {
        try {
            // Play thud sound
            if (window.AudioManager) {
                AudioManager.playThud();
            }

            if (this.draggedElement) {
                // Animate bounce back
                this.draggedElement.classList.add('bounce-back');

                // Return to original position
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
        } catch (error) {
            console.error('Error in handleFailure:', error);
        }
    },

    checkLevelComplete() {
        try {
            if (this.matchedCount === this.shapes.length) {
                this.isTransitioning = true;

                // Speak level complete message
                if (window.VoiceManager) {
                    VoiceManager.speak('Niveau terminé !');
                }

                // Show level complete message
                const levelCompleteMsg = this.container.querySelector('.level-complete-message');
                if (levelCompleteMsg) {
                    levelCompleteMsg.classList.add('show');
                    levelCompleteMsg.textContent = 'Bravo!';
                }

                // Big celebration
                if (window.AudioManager) {
                    AudioManager.playSuccess();
                }
                if (window.ConfettiManager) {
                    ConfettiManager.burstCenter();
                }

                // Advance level after delay
                const self = this;
                setTimeout(function () {
                    self.advanceLevel();
                }, 2500);
            }
        } catch (error) {
            console.error('Error in checkLevelComplete:', error);
        }
    },

    advanceLevel() {
        try {
            if (this.currentLevel < this.maxLevels) {
                this.currentLevel++;
                // Restart game with new level
                this.start(this.container);
            } else {
                // Completed all levels - show big celebration and restart
                this.showCompletionCelebration();
            }
        } catch (error) {
            console.error('Error in advanceLevel:', error);
        }
    },

    showCompletionCelebration() {
        try {
            // Speak final celebration
            if (window.VoiceManager) {
                VoiceManager.speak(`Tu as terminé tous les niveaux ! Score final : ${this.score} points !`);
            }

            // Create celebration overlay
            if (this.container) {
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
            }

            // Multiple confetti bursts
            if (window.ConfettiManager) {
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        if (window.ConfettiManager) {
                            ConfettiManager.burst(
                                Math.random() * window.innerWidth,
                                Math.random() * window.innerHeight,
                                40
                            );
                        }
                    }, i * 300);
                }
            }

            // Reset to level 1 and restart after celebration
            setTimeout(() => {
                this.currentLevel = 1;
                if (this.container) {
                    this.start(this.container);
                }
            }, 4000);
        } catch (error) {
            console.error('Error in showCompletionCelebration:', error);
        }
    },

    updateScoreDisplay() {
        try {
            if (this.container) {
                const scoreDisplay = this.container.querySelector('.score-display');
                const levelDisplay = this.container.querySelector('.level-display');

                if (scoreDisplay) {
                    scoreDisplay.textContent = `Score: ${this.score}`;
                }
                if (levelDisplay) {
                    levelDisplay.textContent = `Level ${this.currentLevel}`;
                }
            }
        } catch (error) {
            console.error('Error in updateScoreDisplay:', error);
        }
    },

    cleanup() {
        // Remove document-level listeners first (pointer events)
        if (this.moveHandler) {
            document.removeEventListener('pointermove', this.moveHandler);
            document.removeEventListener('touchmove', this.moveHandler);
        }
        if (this.endHandler) {
            document.removeEventListener('pointerup', this.endHandler);
            document.removeEventListener('pointercancel', this.endHandler);
            document.removeEventListener('touchend', this.endHandler);
        }

        // Remove all event listeners from elements
        this.eventListeners.forEach(({ element, type, handler }) => {
            try {
                if (element && element.removeEventListener) {
                    element.removeEventListener(type, handler);
                }
            } catch (e) {
                // Element may already be destroyed, ignore
            }
        });
        this.eventListeners = [];

        // Clear container only if it exists
        if (this.container) {
            this.container.innerHTML = '';
        }

        this.draggedElement = null;
        this.isTransitioning = false;
    }
};
