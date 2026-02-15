/**
 * Balloon Pop Game
 * Colorful balloons float up from the bottom. Tapping them pops them with sound and confetti.
 * Continuous play with no game over.
 */

const BalloonPopGame = {
    container: null,
    balloons: [],
    eventListeners: [],
    spawnInterval: null,
    animationFrame: null,

    balloonColors: [
        { color: '#FF6B6B', nameFr: 'Rouge' },
        { color: '#0c67c3ff', nameFr: 'Bleu' },
        { color: '#FFE66D', nameFr: 'Jaune' },
        { color: '#26e472ff', nameFr: 'Vert' },
        { color: '#000000ff', nameFr: 'Noir' },
        { color: '#AA96DA', nameFr: 'Violet' },
        { color: '#FCBAD3', nameFr: 'Rose' },
        { color: '#ffffffff', nameFr: 'Blanc' }
    ],

    start(container) {
        this.container = container;
        this.container.innerHTML = '';
        this.balloons = [];

        // Create game area
        const gameArea = document.createElement('div');
        gameArea.className = 'balloon-game-area';

        // Add instruction
        const instruction = document.createElement('div');
        instruction.className = 'balloon-instruction';
        instruction.textContent = '🎈 Éclate les ballons!';
        gameArea.appendChild(instruction);

        // Create balloon container
        const balloonContainer = document.createElement('div');
        balloonContainer.className = 'balloon-container';
        this.balloonContainer = balloonContainer;
        gameArea.appendChild(balloonContainer);

        this.container.appendChild(gameArea);

        // Start spawning balloons
        this.spawnBalloon();
        this.spawnInterval = setInterval(() => {
            this.spawnBalloon();
        }, 1500);

        // Play start sound
        if (window.AudioManager) {
            AudioManager.playPop();
        }

        // Speak welcome message
        if (window.VoiceManager) {
            VoiceManager.speak('Éclate les ballons!');
        }
    },

    spawnBalloon() {
        if (!this.balloonContainer) return;

        const balloonData = this.balloonColors[Math.floor(Math.random() * this.balloonColors.length)];

        const balloon = document.createElement('div');
        balloon.className = 'balloon';
        balloon.style.backgroundColor = balloonData.color;

        // Random horizontal position (keep within bounds)
        const leftPos = 5 + Math.random() * 80;
        balloon.style.left = `${leftPos}%`;

        // Start from bottom
        balloon.style.bottom = '-120px';

        // Store balloon data
        balloon.dataset.colorName = balloonData.nameFr;

        // Add click/touch handler
        const popHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.popBalloon(balloon);
        };

        // Use pointer events for better mobile support (with touch fallback)
        if (window.PointerEvent) {
            balloon.addEventListener('pointerdown', popHandler);
            this.eventListeners.push({ element: balloon, type: 'pointerdown', handler: popHandler });
        } else {
            // Fallback for older browsers
            balloon.addEventListener('touchstart', (e) => {
                e.preventDefault();
                popHandler(e);
            }, { passive: false });
            balloon.addEventListener('click', popHandler);
            this.eventListeners.push({ element: balloon, type: 'touchstart', handler: popHandler });
            this.eventListeners.push({ element: balloon, type: 'click', handler: popHandler });
        }

        this.balloonContainer.appendChild(balloon);
        this.balloons.push({
            element: balloon,
            speed: 2 + Math.random() * 5,
            popped: false
        });

        // Animate balloon floating up
        this.animateBalloon(this.balloons[this.balloons.length - 1]);
    },

    animateBalloon(balloonObj) {
        const animate = () => {
            if (balloonObj.popped || !this.balloonContainer) return;

            const currentBottom = parseFloat(balloonObj.element.style.bottom) || -120;
            const newBottom = currentBottom + balloonObj.speed;

            if (newBottom > window.innerHeight + 100) {
                // Balloon floated off screen, remove it
                balloonObj.element.remove();
                balloonObj.popped = true;
                return;
            }

            balloonObj.element.style.bottom = `${newBottom}px`;
            balloonObj.animationFrame = requestAnimationFrame(animate);
        };

        balloonObj.animationFrame = requestAnimationFrame(animate);
    },

    popBalloon(balloon) {
        // Find the balloon object
        const balloonObj = this.balloons.find(b => b.element === balloon);
        if (!balloonObj || balloonObj.popped) return;

        balloonObj.popped = true;

        // Cancel animation
        if (balloonObj.animationFrame) {
            cancelAnimationFrame(balloonObj.animationFrame);
        }

        // Play pop sound
        if (window.AudioManager) {
            AudioManager.playPop();
        }

        // Speak color name
        if (window.VoiceManager) {
            VoiceManager.speak(balloon.dataset.colorName);
        }

        // Get balloon position for confetti
        const rect = balloon.getBoundingClientRect();

        // Confetti burst
        if (window.ConfettiManager) {
            ConfettiManager.burst(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2,
                25
            );
        }

        // Pop animation
        balloon.style.transform = 'scale(1.3)';
        balloon.style.opacity = '0';

        setTimeout(() => {
            balloon.remove();
        }, 200);
    },

    cleanup() {
        // Clear spawn interval
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
            this.spawnInterval = null;
        }

        // Cancel all animation frames and remove listeners from balloons
        this.balloons.forEach(balloon => {
            if (balloon.animationFrame) {
                cancelAnimationFrame(balloon.animationFrame);
            }
            // Remove pointer event listeners from balloon elements
            if (balloon.element) {
                balloon.element.removeEventListener('pointerdown', balloon.element._popHandler);
            }
        });

        // Clear event listeners
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

        // Clear balloons array
        this.balloons = [];

        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
};
