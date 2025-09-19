// Enhanced Particle System - Improved for guessing app
class ParticleSystem {
    constructor(canvasId = 'particleCanvas') {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.warn('Particle canvas not found');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = window.innerWidth < 768 ? 60 : 100;
        this.particlesActive = true;
        this.animationId = null;
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseInfluence = false;
        
        this.init();
    }

    init() {
        this.resizeCanvas();
        this.createParticles();
        this.setupEventListeners();
        this.animate();
        
        // Store instance globally for visibility change handler
        window.particleSystemInstance = this;
    }

    resizeCanvas() {
        if (!this.canvas) return;
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Update particle count based on screen size
        this.particleCount = window.innerWidth < 768 ? 60 : 100;
        this.createParticles();
    }

    createParticles() {
        this.particles = [];
        
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8,
                originalVx: (Math.random() - 0.5) * 0.8,
                originalVy: (Math.random() - 0.5) * 0.8,
                radius: Math.random() * 2.5 + 0.5,
                originalRadius: Math.random() * 2.5 + 0.5,
                opacity: Math.random() * 0.6 + 0.2,
                pulse: Math.random() * Math.PI * 2,
                pulseSpeed: Math.random() * 0.02 + 0.01,
                trail: [],
                trailLength: Math.floor(Math.random() * 8) + 3,
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: Math.random() * 0.05 + 0.02
            });
        }
    }

    setupEventListeners() {
        // Add resize listener
        this.resizeHandler = () => this.resizeCanvas();
        window.addEventListener('resize', this.resizeHandler);
        
        // Mouse interaction
        this.mouseMoveHandler = (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            this.mouseInfluence = true;
        };
        
        this.mouseLeaveHandler = () => {
            this.mouseInfluence = false;
        };
        
        document.addEventListener('mousemove', this.mouseMoveHandler);
        document.addEventListener('mouseleave', this.mouseLeaveHandler);
    }

    animate() {
        if (!this.ctx || !this.particlesActive || !this.canvas) return;

        // Clear canvas completely to maintain transparency
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach((particle, index) => {
            // Store previous position for trail
            particle.trail.push({ x: particle.x, y: particle.y });
            if (particle.trail.length > particle.trailLength) {
                particle.trail.shift();
            }
            
            // Mouse interaction - attraction/repulsion effect
            if (this.mouseInfluence) {
                const mouseDistance = Math.sqrt(
                    Math.pow(particle.x - this.mouseX, 2) + 
                    Math.pow(particle.y - this.mouseY, 2)
                );
                
                if (mouseDistance < 150) {
                    const force = (150 - mouseDistance) / 150;
                    const angle = Math.atan2(particle.y - this.mouseY, particle.x - this.mouseX);
                    
                    // Gentle repulsion
                    particle.vx += Math.cos(angle) * force * 0.3;
                    particle.vy += Math.sin(angle) * force * 0.3;
                    
                    // Scale up nearby particles
                    particle.radius = particle.originalRadius * (1 + force * 0.5);
                } else {
                    // Return to original velocity and size
                    particle.vx = particle.vx * 0.95 + particle.originalVx * 0.05;
                    particle.vy = particle.vy * 0.95 + particle.originalVy * 0.05;
                    particle.radius = particle.radius * 0.95 + particle.originalRadius * 0.05;
                }
            } else {
                // Gradually return to original motion
                particle.vx = particle.vx * 0.98 + particle.originalVx * 0.02;
                particle.vy = particle.vy * 0.98 + particle.originalVy * 0.02;
                particle.radius = particle.radius * 0.98 + particle.originalRadius * 0.02;
            }
            
            // Add subtle gravitational drift
            particle.vy += 0.001;
            
            // Apply velocity with slight randomness
            particle.x += particle.vx + (Math.random() - 0.5) * 0.1;
            particle.y += particle.vy + (Math.random() - 0.5) * 0.1;
            
            // Smooth edge wrapping with fade effect
            const margin = 50;
            if (particle.x < -margin) particle.x = this.canvas.width + margin;
            if (particle.x > this.canvas.width + margin) particle.x = -margin;
            if (particle.y < -margin) particle.y = this.canvas.height + margin;
            if (particle.y > this.canvas.height + margin) particle.y = -margin;
            
            // Update animation properties
            particle.pulse += particle.pulseSpeed;
            particle.twinkle += particle.twinkleSpeed;
            
            // Draw particle trail with higher opacity
            particle.trail.forEach((trailPoint, trailIndex) => {
                const trailOpacity = (trailIndex / particle.trail.length) * particle.opacity * 0.6;
                const trailRadius = particle.radius * (trailIndex / particle.trail.length) * 0.7;
                
                this.ctx.beginPath();
                this.ctx.arc(trailPoint.x, trailPoint.y, trailRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(153, 238, 153, ${trailOpacity})`;
                this.ctx.fill();
            });
            
            // Main particle with enhanced effects
            const pulseOpacity = particle.opacity * (0.7 + 0.3 * Math.sin(particle.pulse));
            const twinkleEffect = 0.8 + 0.2 * Math.sin(particle.twinkle);
            const finalOpacity = pulseOpacity * twinkleEffect;
            
            // Outer glow with higher opacity
            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.radius * 3
            );
            gradient.addColorStop(0, `rgba(153, 238, 153, ${finalOpacity * 0.6})`);
            gradient.addColorStop(0.5, `rgba(153, 238, 153, ${finalOpacity * 0.2})`);
            gradient.addColorStop(1, `rgba(153, 238, 153, 0)`);
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius * 3, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            // Main particle
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(153, 238, 153, ${finalOpacity})`;
            this.ctx.fill();
            
            // Inner bright core
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius * 0.4, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(200, 255, 200, ${finalOpacity * 0.9})`;
            this.ctx.fill();
            
            // Enhanced connections with dynamic opacity
            this.particles.slice(index + 1).forEach(otherParticle => {
                const dx = particle.x - otherParticle.x;
                const dy = particle.y - otherParticle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 120) {
                    const connectionOpacity = (1 - distance / 120) * 0.25;
                    const lineWidth = (1 - distance / 120) * 1.5;
                    
                    // Create gradient line
                    const lineGradient = this.ctx.createLinearGradient(
                        particle.x, particle.y,
                        otherParticle.x, otherParticle.y
                    );
                    lineGradient.addColorStop(0, `rgba(153, 238, 153, ${connectionOpacity})`);
                    lineGradient.addColorStop(0.5, `rgba(153, 238, 153, ${connectionOpacity * 1.2})`);
                    lineGradient.addColorStop(1, `rgba(153, 238, 153, ${connectionOpacity})`);
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(particle.x, particle.y);
                    this.ctx.lineTo(otherParticle.x, otherParticle.y);
                    this.ctx.strokeStyle = lineGradient;
                    this.ctx.lineWidth = lineWidth;
                    this.ctx.stroke();
                    this.ctx.lineWidth = 1; // Reset line width
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
        
        // Remove event listeners
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }
        if (this.mouseMoveHandler) {
            document.removeEventListener('mousemove', this.mouseMoveHandler);
        }
        if (this.mouseLeaveHandler) {
            document.removeEventListener('mouseleave', this.mouseLeaveHandler);
        }
        
        this.particles = [];
        this.canvas = null;
        this.ctx = null;
        
        // Clear global reference if it's this instance
        if (window.particleSystemInstance === this) {
            window.particleSystemInstance = null;
        }
    }

    // Method to trigger excitement effect (for correct guesses)
    celebrate() {
        this.particles.forEach(particle => {
            particle.vx *= 1.5;
            particle.vy *= 1.5;
            particle.pulseSpeed *= 2;
            particle.twinkleSpeed *= 3;
            
            // Reset to normal after 2 seconds
            setTimeout(() => {
                particle.vx = particle.originalVx;
                particle.vy = particle.originalVy;
                particle.pulseSpeed /= 2;
                particle.twinkleSpeed /= 3;
            }, 2000);
        });
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