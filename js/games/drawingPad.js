/**
 * Drawing Pad Game
 * Simple canvas with color selection for drawing
 * Features: Rainbow pencil, save to PNG, multi-touch support
 */

const DrawingPadGame = {
    container: null,
    canvas: null,
    ctx: null,
    isDrawing: false,
    currentColor: '#000000',
    lineWidth: 15,
    isRainbowMode: false,
    rainbowHue: 0,
    colors: [
        { color: '#ff0000', label: 'Red' },
        { color: '#00ff00', label: 'Green' },
        { color: '#0000ff', label: 'Blue' },
        { color: '#ffff00', label: 'Yellow' },
        { color: '#ff00ff', label: 'Purple' }
    ],
    eventListeners: [],
    
    start(container) {
        this.container = container;
        this.container.innerHTML = '';
        this.isRainbowMode = false;
        this.rainbowHue = 0;
        
        const wrapper = document.createElement('div');
        wrapper.className = 'drawing-container';
        
        // Create canvas wrapper
        const canvasWrapper = document.createElement('div');
        canvasWrapper.className = 'canvas-wrapper';
        
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'drawingCanvas';
        this.canvas.width = 700;
        this.canvas.height = 400;
        
        // Handle responsive sizing
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Get context
        this.ctx = this.canvas.getContext('2d');
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.strokeStyle = this.currentColor;
        
        // Fill white background
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add drawing handlers
        this.addDrawingHandlers();
        
        canvasWrapper.appendChild(this.canvas);
        
        // Create controls wrapper
        const controlsWrapper = document.createElement('div');
        controlsWrapper.className = 'drawing-controls';
        
        // Create color palette
        const palette = document.createElement('div');
        palette.className = 'color-palette';
        
        this.colors.forEach((colorData, index) => {
            const btn = document.createElement('button');
            btn.className = 'color-btn' + (index === 0 ? ' active' : '');
            btn.style.backgroundColor = colorData.color;
            btn.setAttribute('aria-label', colorData.label);
            
            const clickHandler = () => this.selectColor(colorData.color, btn);
            btn.addEventListener('click', clickHandler);
            this.eventListeners.push({ element: btn, type: 'click', handler: clickHandler });
            
            palette.appendChild(btn);
        });
        
        // Add rainbow button
        const rainbowBtn = document.createElement('button');
        rainbowBtn.className = 'color-btn rainbow-btn';
        rainbowBtn.setAttribute('aria-label', 'Rainbow pencil');
        rainbowBtn.innerHTML = '🌈';
        
        const rainbowHandler = () => this.toggleRainbowMode(rainbowBtn);
        rainbowBtn.addEventListener('click', rainbowHandler);
        this.eventListeners.push({ element: rainbowBtn, type: 'click', handler: rainbowHandler });
        
        palette.appendChild(rainbowBtn);
        
        // Add camera/save button
        const cameraBtn = document.createElement('button');
        cameraBtn.className = 'color-btn camera-btn';
        cameraBtn.innerHTML = '📷';
        cameraBtn.setAttribute('aria-label', 'Save drawing');
        
        const cameraHandler = () => this.saveDrawing();
        cameraBtn.addEventListener('click', cameraHandler);
        this.eventListeners.push({ element: cameraBtn, type: 'click', handler: cameraHandler });
        
        palette.appendChild(cameraBtn);
        
        // Add clear button
        const clearBtn = document.createElement('button');
        clearBtn.className = 'clear-btn';
        clearBtn.textContent = '🗑️';
        clearBtn.setAttribute('aria-label', 'Clear drawing');
        
        const clearHandler = () => this.clearCanvas();
        clearBtn.addEventListener('click', clearHandler);
        this.eventListeners.push({ element: clearBtn, type: 'click', handler: clearHandler });
        
        palette.appendChild(clearBtn);
        
        controlsWrapper.appendChild(palette);
        
        wrapper.appendChild(canvasWrapper);
        wrapper.appendChild(controlsWrapper);
        this.container.appendChild(wrapper);
        
        // Start with first color
        this.selectColor(this.colors[0].color, palette.querySelector('.color-btn'));
    },
    
    resizeCanvas() {
        if (!this.canvas) return;
        
        const maxWidth = Math.min(window.innerWidth - 80, 800);
        const maxHeight = Math.min(window.innerHeight - 280, 450);
        
        const scale = Math.min(maxWidth / 700, maxHeight / 400);
        
        this.canvas.style.width = (700 * scale) + 'px';
        this.canvas.style.height = (400 * scale) + 'px';
    },
    
    addDrawingHandlers() {
        // Mouse events
        const mouseDown = (e) => this.startDrawing(e, 'mouse');
        const mouseMove = (e) => this.draw(e, 'mouse');
        const mouseUp = () => this.stopDrawing();
        const mouseLeave = () => this.stopDrawing();
        
        this.canvas.addEventListener('mousedown', mouseDown);
        this.canvas.addEventListener('mousemove', mouseMove);
        this.canvas.addEventListener('mouseup', mouseUp);
        this.canvas.addEventListener('mouseleave', mouseLeave);
        
        this.eventListeners.push(
            { element: this.canvas, type: 'mousedown', handler: mouseDown },
            { element: this.canvas, type: 'mousemove', handler: mouseMove },
            { element: this.canvas, type: 'mouseup', handler: mouseUp },
            { element: this.canvas, type: 'mouseleave', handler: mouseLeave }
        );
        
        // Touch events - multi-touch support
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
        
        this.canvas.addEventListener('touchstart', touchStart, { passive: false });
        this.canvas.addEventListener('touchmove', touchMove, { passive: false });
        this.canvas.addEventListener('touchend', touchEnd);
        this.canvas.addEventListener('touchcancel', touchEnd);
        
        this.eventListeners.push(
            { element: this.canvas, type: 'touchstart', handler: touchStart },
            { element: this.canvas, type: 'touchmove', handler: touchMove },
            { element: this.canvas, type: 'touchend', handler: touchEnd },
            { element: this.canvas, type: 'touchcancel', handler: touchEnd }
        );
    },
    
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
    },
    
    startDrawing(e, type) {
        this.isDrawing = true;
        const coords = this.getCoordinates(e, type);
        
        this.ctx.beginPath();
        this.ctx.moveTo(coords.x, coords.y);
        
        // Play pop sound
        AudioManager.playPop();
    },
    
    draw(e, type) {
        if (!this.isDrawing) return;
        
        const coords = this.getCoordinates(e, type);
        
        // Update rainbow color if in rainbow mode
        if (this.isRainbowMode) {
            this.rainbowHue = (this.rainbowHue + 2) % 360;
            this.ctx.strokeStyle = `hsl(${this.rainbowHue}, 100%, 50%)`;
        }
        
        this.ctx.lineTo(coords.x, coords.y);
        this.ctx.stroke();
    },
    
    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.ctx.beginPath();
        }
    },
    
    selectColor(color, btnElement) {
        this.isRainbowMode = false;
        this.currentColor = color;
        this.ctx.strokeStyle = color;
        
        // Update active state
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        btnElement.classList.add('active');
        
        // Play pop sound
        AudioManager.playPop();
    },
    
    toggleRainbowMode(btnElement) {
        this.isRainbowMode = !this.isRainbowMode;
        
        // Update active state
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (this.isRainbowMode) {
            btnElement.classList.add('active');
        }
        
        // Play pop sound
        AudioManager.playPop();
    },
    
    saveDrawing() {
        // Create a temporary link
        const link = document.createElement('a');
        link.download = `masterpiece-${Date.now()}.png`;
        link.href = this.canvas.toDataURL('image/png');
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Play success sound
        AudioManager.playSuccess();
        
        // Confetti celebration
        const rect = this.canvas.getBoundingClientRect();
        ConfettiManager.burst(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            30
        );
    },
    
    clearCanvas() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Play pop sound
        AudioManager.playPop();
        
        // Small confetti burst
        const rect = this.canvas.getBoundingClientRect();
        ConfettiManager.burst(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            15
        );
    },
    
    cleanup() {
        this.eventListeners.forEach(({ element, type, handler }) => {
            element.removeEventListener(type, handler);
        });
        this.eventListeners = [];
        
        this.container.innerHTML = '';
        this.canvas = null;
        this.ctx = null;
    }
};
