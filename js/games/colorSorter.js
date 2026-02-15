/**
 * Color Sorter Game
 * Drag colored balls into matching colored buckets
 * 3 colored buckets (Red, Blue, Green) and falling colored balls
 * Cheer for correct sort, "boing" for incorrect
 */

const ColorSorterGame = {
    container: null,
    score: 0,
    balls: [],
    buckets: [],
    eventListeners: [],
    ballSpawnInterval: null,
    animationFrame: null,
    draggedBall: null,

    colors: [
        { name: 'red', nameFr: 'Rouge', color: '#FF6B6B', emoji: '🔴' },
        { name: 'blue', nameFr: 'Bleu', color: '#006feeff', emoji: '🔵' },
        { name: 'green', nameFr: 'Vert', color: '#95E1D3', emoji: '🟢' }
    ],

    start(container) {
        this.container = container;
        this.container.innerHTML = '';
        this.score = 0;
        this.balls = [];

        // Create game wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'sorter-game-wrapper';

        // Add score display
        const scoreDisplay = document.createElement('div');
        scoreDisplay.className = 'sorter-score';
        scoreDisplay.textContent = `Score: ${this.score}`;
        this.scoreDisplay = scoreDisplay;
        wrapper.appendChild(scoreDisplay);

        // Add instruction
        const instruction = document.createElement('div');
        instruction.className = 'sorter-instruction';
        instruction.textContent = '🗑️ Trie les balles par couleur!';
        wrapper.appendChild(instruction);

        // Create buckets area
        const bucketsArea = document.createElement('div');
        bucketsArea.className = 'sorter-buckets-area';

        // Create 3 buckets
        this.colors.forEach(colorData => {
            const bucket = document.createElement('div');
            bucket.className = 'sorter-bucket';
            bucket.style.backgroundColor = colorData.color;
            bucket.dataset.color = colorData.name;
            bucket.dataset.colorFr = colorData.nameFr;

            // Add bucket label
            const label = document.createElement('span');
            label.className = 'sorter-bucket-label';
            label.textContent = colorData.nameFr;
            bucket.appendChild(label);

            bucketsArea.appendChild(bucket);
        });

        wrapper.appendChild(bucketsArea);

        // Create balls area (where balls fall)
        const ballsArea = document.createElement('div');
        ballsArea.className = 'sorter-balls-area';
        this.ballsArea = ballsArea;
        wrapper.appendChild(ballsArea);

        this.container.appendChild(wrapper);

        // Store bucket references
        this.buckets = Array.from(bucketsArea.querySelectorAll('.sorter-bucket'));

        // Start spawning balls
        this.spawnBall();
        this.ballSpawnInterval = setInterval(() => {
            this.spawnBall();
        }, 2000);

        // Play start sound
        if (window.AudioManager) {
            AudioManager.playPop();
        }

        // Speak welcome message
        if (window.VoiceManager) {
            VoiceManager.speak('Trie les balles par couleur!');
        }
    },

    spawnBall() {
        if (!this.ballsArea) return;

        // Only allow max 5 balls on screen
        if (this.balls.length >= 5) return;

        const colorData = this.colors[Math.floor(Math.random() * this.colors.length)];

        const ball = document.createElement('div');
        ball.className = 'sorter-ball';
        ball.style.backgroundColor = colorData.color;
        ball.textContent = colorData.emoji;
        ball.dataset.color = colorData.name;
        ball.dataset.colorFr = colorData.nameFr;

        // Random horizontal position
        const leftPos = 10 + Math.random() * 80;
        ball.style.left = `${leftPos}%`;
        ball.style.top = '20px';

        // Add drag handlers
        this.addDragHandlers(ball);

        this.ballsArea.appendChild(ball);
        this.balls.push({
            element: ball,
            popped: false
        });
    },

    addDragHandlers(ball) {
        let startX, startY, initialLeft, initialTop;
        let isDragging = false;
        let pointerId = null;

        const getClientPos = (e) => {
            // Handle both pointer events and touch events
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
            if (this.draggedBall && this.draggedBall !== ball) return;

            const pos = getClientPos(e);
            if (!pos) return;

            isDragging = true;
            this.draggedBall = ball;
            pointerId = e.pointerId;

            startX = pos.x;
            startY = pos.y;

            const rect = ball.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;

            ball.style.position = 'fixed';
            ball.style.left = initialLeft + 'px';
            ball.style.top = initialTop + 'px';
            ball.style.zIndex = '1000';
            ball.style.transform = 'scale(1.2)';

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
            if (!isDragging || !this.draggedBall || this.draggedBall !== ball) return;

            // Only handle events for our pointer
            if (pointerId !== null && e.pointerId !== pointerId) return;

            e.preventDefault();

            const pos = getClientPos(e);
            if (!pos) return;

            const dx = pos.x - startX;
            const dy = pos.y - startY;

            ball.style.left = (initialLeft + dx) + 'px';
            ball.style.top = (initialTop + dy) + 'px';
        };

        const endDrag = (e) => {
            if (!isDragging || !this.draggedBall || this.draggedBall !== ball) return;

            // Only handle events for our pointer
            if (pointerId !== null && e.pointerId !== pointerId) return;

            isDragging = false;
            pointerId = null;

            // Release pointer capture
            if (e.target && e.target.releasePointerCapture) {
                try {
                    e.target.releasePointerCapture(e.pointerId);
                } catch (err) {
                    // Ignore errors
                }
            }

            // Check if dropped on a bucket
            const ballRect = ball.getBoundingClientRect();
            const ballCenter = {
                x: ballRect.left + ballRect.width / 2,
                y: ballRect.top + ballRect.height / 2
            };

            let matched = false;
            let matchedBucket = null;

            this.buckets.forEach(bucket => {
                const bucketRect = bucket.getBoundingClientRect();

                if (
                    ballCenter.x >= bucketRect.left &&
                    ballCenter.x <= bucketRect.right &&
                    ballCenter.y >= bucketRect.top &&
                    ballCenter.y <= bucketRect.bottom
                ) {
                    matchedBucket = bucket;
                    if (bucket.dataset.color === ball.dataset.color) {
                        matched = true;
                    }
                }
            });

            if (matched) {
                this.handleSuccess(ball, matchedBucket);
            } else if (matchedBucket) {
                this.handleFailure(ball);
            } else {
                // Dropped elsewhere, return to original position
                this.returnBall(ball);
            }

            this.draggedBall = null;
        };

        // Store event handler references for cleanup
        const touchStartHandler = (e) => {
            e.preventDefault();
            startDrag(e);
        };

        // Use pointer events for unified mouse/touch handling (with touch fallback)
        if (window.PointerEvent) {
            ball.addEventListener('pointerdown', startDrag);
            document.addEventListener('pointermove', moveDrag);
            document.addEventListener('pointerup', endDrag);
            document.addEventListener('pointercancel', endDrag);

            // Store for cleanup
            this.eventListeners.push(
                { element: ball, type: 'pointerdown', handler: startDrag },
                { element: document, type: 'pointermove', handler: moveDrag },
                { element: document, type: 'pointerup', handler: endDrag },
                { element: document, type: 'pointercancel', handler: endDrag }
            );
        } else {
            // Fallback for older browsers
            ball.addEventListener('touchstart', touchStartHandler, { passive: false });
            document.addEventListener('touchmove', moveDrag, { passive: false });
            document.addEventListener('touchend', endDrag);
            document.addEventListener('touchcancel', endDrag);

            // Store for cleanup
            this.eventListeners.push(
                { element: ball, type: 'touchstart', handler: touchStartHandler },
                { element: document, type: 'touchmove', handler: moveDrag },
                { element: document, type: 'touchend', handler: endDrag },
                { element: document, type: 'touchcancel', handler: endDrag }
            );
        }
    },

    handleSuccess(ball, bucket) {
        // Update score
        this.score += 10;
        this.updateScoreDisplay();

        // Play success sound
        if (window.AudioManager) {
            AudioManager.playSuccess();
        }

        // Speak color name
        if (window.VoiceManager) {
            VoiceManager.speak(ball.dataset.colorFr);
        }

        // Confetti burst
        const bucketRect = bucket.getBoundingClientRect();
        if (window.ConfettiManager) {
            ConfettiManager.burst(
                bucketRect.left + bucketRect.width / 2,
                bucketRect.top + bucketRect.height / 2,
                30
            );
        }

        // Remove ball
        ball.style.transform = 'scale(0)';
        setTimeout(() => {
            ball.remove();
            const ballIndex = this.balls.findIndex(b => b.element === ball);
            if (ballIndex > -1) {
                this.balls.splice(ballIndex, 1);
            }
        }, 200);
    },

    handleFailure(ball) {
        // Play thud/boing sound
        if (window.AudioManager) {
            AudioManager.playThud();
        }

        // Shake animation
        ball.style.animation = 'sorterBallShake 0.5s ease';

        setTimeout(() => {
            ball.style.animation = '';
            this.returnBall(ball);
        }, 500);
    },

    returnBall(ball) {
        // Return to balls area
        ball.style.position = 'absolute';
        ball.style.left = '10%';
        ball.style.top = '20px';
        ball.style.zIndex = '';
        ball.style.transform = 'scale(1)';
    },

    updateScoreDisplay() {
        if (this.scoreDisplay) {
            this.scoreDisplay.textContent = `Score: ${this.score}`;
        }
    },

    cleanup() {
        // Clear spawn interval
        if (this.ballSpawnInterval) {
            clearInterval(this.ballSpawnInterval);
            this.ballSpawnInterval = null;
        }

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

        // Reset dragged state
        this.draggedBall = null;

        // Clear balls array
        this.balls = [];

        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
};
