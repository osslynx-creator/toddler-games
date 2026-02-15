/**
 * Color Sorter Game - ES Module
 * Drag colored balls into matching colored buckets
 */

import Game from './Game.js';
import audioManager from '../utils/AudioManager.js';
import voiceManager from '../utils/VoiceManager.js';
import confettiManager from '../utils/ConfettiManager.js';

export default class ColorSorterGame extends Game {
    constructor() {
        super({
            id: 'colorSorter',
            name: 'Color Sorter',
            icon: '🗑️'
        });

        this.score = 0;
        this.balls = [];
        this.buckets = [];
        this.ballSpawnInterval = null;
        this.draggedBall = null;
        this.ballsArea = null;
        this.scoreDisplay = null;

        this.colors = [
            { name: 'red', nameFr: 'Rouge', color: '#FF6B6B', emoji: '🔴' },
            { name: 'blue', nameFr: 'Bleu', color: '#006feeff', emoji: '🔵' },
            { name: 'green', nameFr: 'Vert', color: '#95E1D3', emoji: '🟢' }
        ];
    }

    mount(container) {
        super.mount(container);
        this.container.innerHTML = '';
        this.score = 0;
        this.balls = [];

        const wrapper = document.createElement('div');
        wrapper.className = 'sorter-game-wrapper';

        const scoreDisplay = document.createElement('div');
        scoreDisplay.className = 'sorter-score';
        scoreDisplay.textContent = `Score: ${this.score}`;
        this.scoreDisplay = scoreDisplay;
        wrapper.appendChild(scoreDisplay);

        const instruction = document.createElement('div');
        instruction.className = 'sorter-instruction';
        instruction.textContent = '🗑️ Trie les balles par couleur!';
        wrapper.appendChild(instruction);

        const bucketsArea = document.createElement('div');
        bucketsArea.className = 'sorter-buckets-area';

        this.colors.forEach(colorData => {
            const bucket = document.createElement('div');
            bucket.className = 'sorter-bucket';
            bucket.style.backgroundColor = colorData.color;
            bucket.dataset.color = colorData.name;
            bucket.dataset.colorFr = colorData.nameFr;

            const label = document.createElement('span');
            label.className = 'sorter-bucket-label';
            label.textContent = colorData.nameFr;
            bucket.appendChild(label);

            bucketsArea.appendChild(bucket);
        });

        wrapper.appendChild(bucketsArea);

        const ballsArea = document.createElement('div');
        ballsArea.className = 'sorter-balls-area';
        this.ballsArea = ballsArea;
        wrapper.appendChild(ballsArea);

        this.container.appendChild(wrapper);

        this.buckets = Array.from(bucketsArea.querySelectorAll('.sorter-bucket'));

        this.spawnBall();
        this.ballSpawnInterval = setInterval(() => {
            this.spawnBall();
        }, 2000);

        audioManager.playPop();
        voiceManager.speak('Trie les balles par couleur!');
    }

    spawnBall() {
        if (!this.ballsArea || this.balls.length >= 5) return;

        const colorData = this.colors[Math.floor(Math.random() * this.colors.length)];

        const ball = document.createElement('div');
        ball.className = 'sorter-ball';
        ball.style.backgroundColor = colorData.color;
        ball.textContent = colorData.emoji;
        ball.dataset.color = colorData.name;
        ball.dataset.colorFr = colorData.nameFr;

        const leftPos = 10 + Math.random() * 80;
        ball.style.left = `${leftPos}%`;
        ball.style.top = '20px';

        this.addDragHandlers(ball);

        this.ballsArea.appendChild(ball);
        this.balls.push({
            element: ball,
            popped: false
        });
    }

    addDragHandlers(ball) {
        let startX, startY, initialLeft, initialTop;
        let isDragging = false;
        let pointerId = null;

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

            if (e.target && e.target.setPointerCapture) {
                e.target.setPointerCapture(e.pointerId);
            }

            audioManager.playPop();
        };

        const moveDrag = (e) => {
            if (!isDragging || !this.draggedBall || this.draggedBall !== ball) return;
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
            if (pointerId !== null && e.pointerId !== pointerId) return;

            isDragging = false;
            pointerId = null;

            if (e.target && e.target.releasePointerCapture) {
                try {
                    e.target.releasePointerCapture(e.pointerId);
                } catch (err) { }
            }

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
                this.returnBall(ball);
            }

            this.draggedBall = null;
        };

        const touchStartHandler = (e) => {
            e.preventDefault();
            startDrag(e);
        };

        if (window.PointerEvent) {
            this.addEventListener(ball, 'pointerdown', startDrag);
            this.addEventListener(document, 'pointermove', moveDrag);
            this.addEventListener(document, 'pointerup', endDrag);
            this.addEventListener(document, 'pointercancel', endDrag);
        } else {
            this.addEventListener(ball, 'touchstart', touchStartHandler, { passive: false });
            this.addEventListener(document, 'touchmove', moveDrag, { passive: false });
            this.addEventListener(document, 'touchend', endDrag);
            this.addEventListener(document, 'touchcancel', endDrag);
        }
    }

    handleSuccess(ball, bucket) {
        this.score += 10;
        this.updateScoreDisplay();

        audioManager.playSuccess();
        voiceManager.speak(ball.dataset.colorFr);

        const bucketRect = bucket.getBoundingClientRect();
        confettiManager.burst(
            bucketRect.left + bucketRect.width / 2,
            bucketRect.top + bucketRect.height / 2,
            30
        );

        ball.style.transform = 'scale(0)';
        setTimeout(() => {
            ball.remove();
            const ballIndex = this.balls.findIndex(b => b.element === ball);
            if (ballIndex > -1) {
                this.balls.splice(ballIndex, 1);
            }
        }, 200);
    }

    handleFailure(ball) {
        audioManager.playThud();

        ball.style.animation = 'sorterBallShake 0.5s ease';

        setTimeout(() => {
            ball.style.animation = '';
            this.returnBall(ball);
        }, 500);
    }

    returnBall(ball) {
        ball.style.position = 'absolute';
        ball.style.left = '10%';
        ball.style.top = '20px';
        ball.style.zIndex = '';
        ball.style.transform = 'scale(1)';
    }

    updateScoreDisplay() {
        if (this.scoreDisplay) {
            this.scoreDisplay.textContent = `Score: ${this.score}`;
        }
    }

    cleanup() {
        if (this.ballSpawnInterval) {
            clearInterval(this.ballSpawnInterval);
            this.ballSpawnInterval = null;
        }

        this.draggedBall = null;
        this.balls = [];

        super.cleanup();
    }
}
