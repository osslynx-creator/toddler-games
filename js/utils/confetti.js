/**
 * Confetti Utility - Visual celebration effect
 * Creates colorful particles that burst from a point
 */

const ConfettiManager = {
    canvas: null,
    ctx: null,
    particles: [],
    isAnimating: false,
    
    colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff69b4'],
    
    init() {
        this.canvas = document.getElementById('confettiCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    },
    
    resize() {
        if (this.canvas) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    },
    
    burst(x, y, count = 30) {
        if (!this.canvas) this.init();
        
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15 - 5,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                size: Math.random() * 10 + 5,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10,
                life: 1,
                decay: 0.02 + Math.random() * 0.02
            });
        }
        
        if (!this.isAnimating) {
            this.animate();
        }
    },
    
    burstCenter() {
        this.burst(window.innerWidth / 2, window.innerHeight / 2, 50);
    },
    
    animate() {
        this.isAnimating = true;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.3; // gravity
            p.rotation += p.rotationSpeed;
            p.life -= p.decay;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            this.ctx.restore();
        }
        
        if (this.particles.length > 0) {
            requestAnimationFrame(() => this.animate());
        } else {
            this.isAnimating = false;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => ConfettiManager.init());
