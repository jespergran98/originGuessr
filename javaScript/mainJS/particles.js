// Particle System - Shared across all pages
class ParticleSystem {
    constructor(canvasId = 'particleCanvas') {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.warn('Particle canvas not found');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = window.innerWidth < 768 ? 30 : 50;
        this.particlesActive = true;
        this.animationId = null;
        
        this.init();
    }

    init() {
        this.resizeCanvas();
        this.createParticles();
        this.animate();
        
        // Add resize listener
        this.resizeHandler = () => this.resizeCanvas();
        window.addEventListener('resize', this.resizeHandler);
        
        // Store instance globally for visibility change handler
        window.particleSystemInstance = this;
    }

    resizeCanvas() {
        if (!this.canvas) return;
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Recreate particles after resize
        this.createParticles();
    }

    createParticles() {
        this.particles = [];
        
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.1,
                pulse: Math.random() * Math.PI * 2
            });
        }
    }

    animate() {
        if (!this.ctx || !this.particlesActive || !this.canvas) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach((particle, index) => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Wrap around edges
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
            
            // Update pulse
            particle.pulse += 0.02;
            const pulseOpacity = particle.opacity * (0.5 + 0.5 * Math.sin(particle.pulse));
            
            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(153, 238, 153, ${pulseOpacity})`;
            this.ctx.fill();
            
            // Draw connections to nearby particles
            this.particles.slice(index + 1).forEach(otherParticle => {
                const dx = particle.x - otherParticle.x;
                const dy = particle.y - otherParticle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    const connectionOpacity = (1 - distance / 100) * 0.1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(particle.x, particle.y);
                    this.ctx.lineTo(otherParticle.x, otherParticle.y);
                    this.ctx.strokeStyle = `rgba(153, 238, 153, ${connectionOpacity})`;
                    this.ctx.stroke();
                }
            });
        });
        
        if (this.particlesActive) {
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    }

    pause() {
        this.particlesActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    resume() {
        if (!this.particlesActive) {
            this.particlesActive = true;
            this.animate();
        }
    }

    destroy() {
        this.pause();
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }
        this.particles = [];
        this.canvas = null;
        this.ctx = null;
        
        // Clear global reference if it's this instance
        if (window.particleSystemInstance === this) {
            window.particleSystemInstance = null;
        }
    }
}

// Clean up any existing particle system before creating a new one
if (window.particleSystemInstance) {
    window.particleSystemInstance.destroy();
}

// Initialize particle system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure canvas is properly rendered
    setTimeout(() => {
        new ParticleSystem();
    }, 100);
});

// Performance optimization: Pause particles when tab is not visible
document.addEventListener('visibilitychange', () => {
    const particleSystem = window.particleSystemInstance;
    if (particleSystem) {
        if (document.hidden) {
            particleSystem.pause();
        } else {
            particleSystem.resume();
        }
    }
});

// Clean up when page unloads
window.addEventListener('beforeunload', () => {
    if (window.particleSystemInstance) {
        window.particleSystemInstance.destroy();
    }
});