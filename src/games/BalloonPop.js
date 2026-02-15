/**
 * Balloon Pop Game - ES Module
 * Colorful balloons float up from the bottom. Tapping them pops them with sound and confetti.
 */

import Game from './Game.js';
import audioManager from '../utils/AudioManager.js';
import voiceManager from '../utils/VoiceManager.js';
import confettiManager from '../utils/ConfettiManager.js';

export default class BalloonPopGame extends Game {
    constructor() {
        super({
            id: 'balloonPop',
            name: 'Balloon Pop',
            icon: '🎈'
        });

        this.balloons = [];
        this.spawnInterval = null;
        this.balloonContainer = null;

        this.balloonColors = [
            { color: '#FF6B6B', nameFr: 'Rouge' },
            { color: '#0c67c3ff', nameFr: 'Bleu' },
            { color: '#FFE66D', nameFr: 'Jaune' },
            { color: '#26e472ff', nameFr: 'Vert' },
            { color: '#000000ff', nameFr: 'Noir' },
            { color: '#AA96DA', nameFr: 'Violet' },
            { color: '#FCBAD3', nameFr: 'Rose' },
            { color: '#ffffffff', nameFr: 'Blanc' }
        ];
    }

    mount(container) {
        super.mount(container);
        this.container.innerHTML = '';
        this.balloons = [];
        
        // Clear any existing spawn interval before starting new one
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
            this.spawnInterval = null;
        }

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
        this.spawnInterval = this.setGameInterval(() => {
            if (this.isMounted) {
                this.spawnBalloon();
            }
        }, 1500);

        // Play start sound
        audioManager.playPop();

        // Speak welcome message
        voiceManager.speak('Éclate les ballons!');
    }

    spawnBalloon() {
        if (!this.balloonContainer || !this.isMounted) return;

        const balloonData = this.balloonColors[Math.floor(Math.random() * this.balloonColors.length)];

        const balloon = document.createElement('div');
        balloon.className = 'balloon';
        balloon.style.backgroundColor = balloonData.color;

        // Random horizontal position
        const leftPos = 5 + Math.random() * 80;
        balloon.style.left = `${leftPos}%`;
        balloon.style.bottom = '-120px';

        balloon.dataset.colorName = balloonData.nameFr;

        // Add click/touch handler
        const popHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.popBalloon(balloon);
        };

        // Use pointer events
        if (window.PointerEvent) {
            this.addEventListener(balloon, 'pointerdown', popHandler);
        } else {
            this.addEventListener(balloon, 'touchstart', (e) => {
                e.preventDefault();
                popHandler(e);
            }, { passive: false });
            this.addEventListener(balloon, 'click', popHandler);
        }

        this.balloonContainer.appendChild(balloon);
        
        const balloonObj = {
            element: balloon,
            speed: 2 + Math.random() * 5,
            popped: false,
            animationFrame: null
        };
        
        this.balloons.push(balloonObj);
        this.animateBalloon(balloonObj);
    }

    animateBalloon(balloonObj) {
        const animate = () => {
            if (balloonObj.popped || !this.balloonContainer || !this.isMounted) return;

            const currentBottom = parseFloat(balloonObj.element.style.bottom) || -120;
            const newBottom = currentBottom + balloonObj.speed;

            if (newBottom > window.innerHeight + 100) {
                balloonObj.element.remove();
                balloonObj.popped = true;
                return;
            }

            balloonObj.element.style.bottom = `${newBottom}px`;
            balloonObj.animationFrame = this.requestGameAnimationFrame(animate);
        };

        balloonObj.animationFrame = this.requestGameAnimationFrame(animate);
    }

    popBalloon(balloon) {
        if (!this.isMounted) return;
        
        const balloonObj = this.balloons.find(b => b.element === balloon);
        if (!balloonObj || balloonObj.popped) return;

        balloonObj.popped = true;

        if (balloonObj.animationFrame) {
            cancelAnimationFrame(balloonObj.animationFrame);
            balloonObj.animationFrame = null;
        }

        audioManager.playPop();
        voiceManager.speak(balloon.dataset.colorName);

        const rect = balloon.getBoundingClientRect();
        confettiManager.burst(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            25
        );

        balloon.style.transform = 'scale(1.3)';
        balloon.style.opacity = '0';

        this.setGameTimeout(() => {
            if (balloon && balloon.parentNode) {
                balloon.remove();
            }
        }, 200);
    }

    cleanup() {
        // Clear spawn interval
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
            this.spawnInterval = null;
        }

        // Mark all balloons as popped and cancel their animation frames
        this.balloons.forEach(balloon => {
            balloon.popped = true;
            if (balloon.animationFrame) {
                cancelAnimationFrame(balloon.animationFrame);
                balloon.animationFrame = null;
            }
        });

        this.balloons = [];
        this.balloonContainer = null;

        super.cleanup();
    }
}
