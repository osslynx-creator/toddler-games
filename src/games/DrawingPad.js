/**
 * Drawing Pad Game - ES Module
 * Simple canvas with color selection for drawing
 */

import Game from './Game.js';
import audioManager from '../utils/AudioManager.js';
import confettiManager from '../utils/ConfettiManager.js';

export default class DrawingPadGame extends Game {
    constructor() {
        super({
            id: 'drawingPad',
            name: 'Drawing Pad',
            icon: '🎨'
        });

        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.currentColor = '#000000';
        this.lineWidth = 15;
        this.isRainbowMode = false;
        this.rainbowHue = 0;
        this.resizeHandler = null;

        this.colors = [
            { color: '#ff0000', label: 'Red' },
            { color: '#00ff00', label: 'Green' },
            { color: '#0000ff', label: 'Blue' },
            { color: '#ffff00', label: 'Yellow' },
            { color: '#ff00ff', label: 'Purple' }
        ];
    }

    mount(container) {
        super.mount(container);
        this.container.innerHTML = '';
        this.isRainbowMode = false;
        this.rainbowHue = 0;

        const wrapper = document.createElement('div');
        wrapper.className = 'drawing-container';

        const canvasWrapper = document.createElement('div');
        canvasWrapper.className = 'canvas-wrapper';

        this.canvas = document.createElement('canvas');
        this.canvas.id = 'drawingCanvas';
        this.canvas.width = 700;
        this.canvas.height = 400;

        // Resize and track the handler for cleanup
        this.resizeCanvas();
        this.resizeHandler = () => this.resizeCanvas();
        this.addResizeHandler(this.resizeHandler);

        this.ctx = this.canvas.getContext('2d');
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.strokeStyle = this.currentColor;

        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.addDrawingHandlers();

        canvasWrapper.appendChild(this.canvas);

        const controlsWrapper = document.createElement('div');
        controlsWrapper.className = 'drawing-controls';

        const palette = document.createElement('div');
        palette.className = 'color-palette';

        this.colors.forEach((colorData, index) => {
            const btn = document.createElement('button');
            btn.className = 'color-btn' + (index === 0 ? ' active' : '');
            btn.style.backgroundColor = colorData.color;
            btn.setAttribute('aria-label', colorData.label);

            const clickHandler = () => this.selectColor(colorData.color, btn);
            this.addEventListener(btn, 'click', clickHandler);

            palette.appendChild(btn);
        });

        const rainbowBtn = document.createElement('button');
        rainbowBtn.className = 'color-btn rainbow-btn';
        rainbowBtn.setAttribute('aria-label', 'Rainbow pencil');
        rainbowBtn.innerHTML = '🌈';

        const rainbowHandler = () => this.toggleRainbowMode(rainbowBtn);
        this.addEventListener(rainbowBtn, 'click', rainbowHandler);

        palette.appendChild(rainbowBtn);

        const cameraBtn = document.createElement('button');
        cameraBtn.className = 'color-btn camera-btn';
        cameraBtn.innerHTML = '📷';
        cameraBtn.setAttribute('aria-label', 'Save drawing');

        const cameraHandler = () => this.saveDrawing();
        this.addEventListener(cameraBtn, 'click', cameraHandler);

        palette.appendChild(cameraBtn);

        const clearBtn = document.createElement('button');
        clearBtn.className = 'clear-btn';
        clearBtn.textContent = '🗑️';
        clearBtn.setAttribute('aria-label', 'Clear drawing');

        const clearHandler = () => this.clearCanvas();
        this.addEventListener(clearBtn, 'click', clearHandler);

        palette.appendChild(clearBtn);

        controlsWrapper.appendChild(palette);

        wrapper.appendChild(canvasWrapper);
        wrapper.appendChild(controlsWrapper);
        this.container.appendChild(wrapper);

        this.selectColor(this.colors[0].color, palette.querySelector('.color-btn'));
    }

    resizeCanvas() {
        if (!this.canvas || !this.isMounted) return;

        const maxWidth = Math.min(window.innerWidth - 80, 800);
        const maxHeight = Math.min(window.innerHeight - 280, 450);

        const scale = Math.min(maxWidth / 700, maxHeight / 400);

        this.canvas.style.width = (700 * scale) + 'px';
        this.canvas.style.height = (400 * scale) + 'px';
    }

    addDrawingHandlers() {
        const mouseDown = (e) => this.startDrawing(e, 'mouse');
        const mouseMove = (e) => this.draw(e, 'mouse');
        const mouseUp = () => this.stopDrawing();
        const mouseLeave = () => this.stopDrawing();

        this.addEventListener(this.canvas, 'mousedown', mouseDown);
        this.addEventListener(this.canvas, 'mousemove', mouseMove);
        this.addEventListener(this.canvas, 'mouseup', mouseUp);
        this.addEventListener(this.canvas, 'mouseleave', mouseLeave);

        const touchStart = (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                this.startDrawing(e.changedTouches[i], 'touch');
            }
        };

        const touchMove = (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                this.draw(e.changedTouches[i], 'touch');
            }
        };

        const touchEnd = (e) => {
            e.preventDefault();
            this.stopDrawing();
        };

        this.addEventListener(this.canvas, 'touchstart', touchStart, { passive: false });
        this.addEventListener(this.canvas, 'touchmove', touchMove, { passive: false });
        this.addEventListener(this.canvas, 'touchend', touchEnd);
        this.addEventListener(this.canvas, 'touchcancel', touchEnd);
    }

    getCoordinates(e, type) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const clientX = type === 'touch' ? e.clientX : e.clientX;
        const clientY = type === 'touch' ? e.clientY : e.clientY;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    startDrawing(e, type) {
        if (!this.isMounted) return;
        
        this.isDrawing = true;
        const coords = this.getCoordinates(e, type);

        this.ctx.beginPath();
        this.ctx.moveTo(coords.x, coords.y);

        audioManager.playPop();
    }

    draw(e, type) {
        if (!this.isDrawing || !this.isMounted) return;

        const coords = this.getCoordinates(e, type);

        if (this.isRainbowMode) {
            this.rainbowHue = (this.rainbowHue + 2) % 360;
            this.ctx.strokeStyle = `hsl(${this.rainbowHue}, 100%, 50%)`;
        }

        this.ctx.lineTo(coords.x, coords.y);
        this.ctx.stroke();
    }

    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.ctx.beginPath();
        }
    }

    selectColor(color, btnElement) {
        if (!this.isMounted) return;
        
        this.isRainbowMode = false;
        this.currentColor = color;
        this.ctx.strokeStyle = color;

        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        btnElement.classList.add('active');

        audioManager.playPop();
    }

    toggleRainbowMode(btnElement) {
        if (!this.isMounted) return;
        
        this.isRainbowMode = !this.isRainbowMode;

        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        if (this.isRainbowMode) {
            btnElement.classList.add('active');
        }

        audioManager.playPop();
    }

    saveDrawing() {
        if (!this.isMounted) return;
        
        const link = document.createElement('a');
        link.download = `masterpiece-${Date.now()}.png`;
        link.href = this.canvas.toDataURL('image/png');

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        audioManager.playSuccess();

        const rect = this.canvas.getBoundingClientRect();
        confettiManager.burst(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            30
        );
    }

    clearCanvas() {
        if (!this.isMounted || !this.ctx) return;
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        audioManager.playPop();

        const rect = this.canvas.getBoundingClientRect();
        confettiManager.burst(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            15
        );
    }

    cleanup() {
        this.stopDrawing();
        this.canvas = null;
        this.ctx = null;
        this.resizeHandler = null;
        super.cleanup();
    }
}
