class GameSettings {
    constructor() {
        this.initializeElements();
        this.setDefaultStates();
        this.bindEvents();
        this.initializeSliders();
        this.initializeAnimations();
        this.initializeParticleSystem();
    }

    initializeElements() {
        this.timerButtons = document.querySelectorAll('[data-timer]');
        this.timeframeButtons = document.querySelectorAll('[data-timeframe]');
        this.timeSlider = document.getElementById('timeSlider');
        this.timeframeSlider = document.getElementById('timeframeSlider');
        this.timeRange = document.getElementById('timeRange');
        this.timeLabel = document.getElementById('timeLabel');
        this.timerFill = document.getElementById('timerFill');
        this.timerGlow = document.getElementById('timerGlow');
        this.timeframeMin = document.getElementById('timeframeMin');
        this.timeframeMax = document.getElementById('timeframeMax');
        this.timeframeLabel = document.getElementById('timeframeLabel');
        this.timeframeFill = document.getElementById('timeframeFill');
        this.timeframeGlow = document.getElementById('timeframeGlow');
        this.playBtn = document.querySelector('.play-btn');
        this.titleLetters = document.querySelectorAll('.title-letter');
    }

    setDefaultStates() {
        // Ensure timer buttons have proper default state
        const activeTimerBtn = Array.from(this.timerButtons).find(btn => btn.classList.contains('active'));
        if (!activeTimerBtn) {
            // If no button is active, set "No Timer" as default
            const noTimerBtn = document.querySelector('[data-timer="no"]');
            if (noTimerBtn) {
                noTimerBtn.classList.add('active');
            }
        }

        // Ensure timeframe buttons have proper default state
        const activeTimeframeBtn = Array.from(this.timeframeButtons).find(btn => btn.classList.contains('active'));
        if (!activeTimeframeBtn) {
            // If no button is active, set "Any Period" as default
            const anyPeriodBtn = document.querySelector('[data-timeframe="unspecified"]');
            if (anyPeriodBtn) {
                anyPeriodBtn.classList.add('active');
            }
        }

        // Set initial slider visibility based on active buttons
        const activeTimer = document.querySelector('[data-timer].active');
        if (activeTimer && activeTimer.dataset.timer === 'yes') {
            this.showSlider(this.timeSlider);
        } else {
            this.hideSlider(this.timeSlider);
        }

        const activeTimeframe = document.querySelector('[data-timeframe].active');
        if (activeTimeframe && activeTimeframe.dataset.timeframe === 'flexible') {
            this.showSlider(this.timeframeSlider);
        } else {
            this.hideSlider(this.timeframeSlider);
        }
    }

    bindEvents() {
        this.timerButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleTimerToggle(e));
            btn.addEventListener('mouseenter', () => this.addButtonHoverEffect(btn));
        });

        this.timeframeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleTimeframeToggle(e));
            btn.addEventListener('mouseenter', () => this.addButtonHoverEffect(btn));
        });

        this.timeRange?.addEventListener('input', () => this.updateTimerSlider());
        this.timeframeMin?.addEventListener('input', () => this.updateTimeframeSlider());
        this.timeframeMax?.addEventListener('input', () => this.updateTimeframeSlider());

        // Play button ripple effect
        this.playBtn?.addEventListener('click', (e) => this.createRipple(e, this.playBtn));

        // Title letter hover effects
        this.titleLetters.forEach((letter, index) => {
            letter.style.setProperty('--i', index);
            letter.addEventListener('mouseenter', () => this.animateLetterHover(letter));
            letter.addEventListener('mouseleave', () => this.resetLetterHover(letter));
        });

        // Window resize handler for particle system
        window.addEventListener('resize', () => this.resizeParticleCanvas());
    }

    handleTimerToggle(e) {
        e.preventDefault();
        const button = e.currentTarget;
        
        // Don't toggle if already active
        if (button.classList.contains('active')) {
            return;
        }
        
        this.setActiveButton(this.timerButtons, button);
        
        if (button.dataset.timer === 'yes') {
            this.showSlider(this.timeSlider);
        } else {
            this.hideSlider(this.timeSlider);
        }

        this.addClickAnimation(button);
    }

    handleTimeframeToggle(e) {
        e.preventDefault();
        const button = e.currentTarget;
        
        // Don't toggle if already active
        if (button.classList.contains('active')) {
            return;
        }
        
        this.setActiveButton(this.timeframeButtons, button);
        
        if (button.dataset.timeframe === 'flexible') {
            this.showSlider(this.timeframeSlider);
        } else {
            this.hideSlider(this.timeframeSlider);
        }

        this.addClickAnimation(button);
    }

    setActiveButton(buttons, activeButton) {
        buttons.forEach(btn => {
            btn.classList.remove('active');
            // Add smooth transition effect
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = '';
            }, 100);
        });
        
        activeButton.classList.add('active');
        // Add activation animation
        activeButton.style.transform = 'scale(1.05)';
        setTimeout(() => {
            activeButton.style.transform = '';
        }, 200);
    }

    showSlider(slider) {
        if (!slider) return;
        
        slider.classList.remove('hidden');
        
        // Staggered animation for child elements
        const elements = slider.querySelectorAll('.slider-wrapper, .dual-slider-wrapper, .slider-label-container');
        elements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                el.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 100 + 50);
        });
        
        setTimeout(() => slider.classList.add('visible'), 10);
    }

    hideSlider(slider) {
        if (!slider) return;
        
        const elements = slider.querySelectorAll('.slider-wrapper, .dual-slider-wrapper, .slider-label-container');
        elements.forEach((el, index) => {
            setTimeout(() => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(-20px)';
            }, index * 50);
        });
        
        slider.classList.remove('visible');
        setTimeout(() => {
            slider.classList.add('hidden');
            // Reset transforms
            elements.forEach(el => {
                el.style.opacity = '';
                el.style.transform = '';
                el.style.transition = '';
            });
        }, 300);
    }

    updateTimerSlider() {
        if (!this.timeRange || !this.timerFill || !this.timeLabel) return;

        const value = parseInt(this.timeRange.value);
        const min = parseInt(this.timeRange.min);
        const max = parseInt(this.timeRange.max);
        const percentage = ((value - min) / (max - min)) * 100;
        
        // Smooth animation for fill
        this.timerFill.style.width = `${percentage}%`;
        
        // Update glow effect
        if (this.timerGlow) {
            this.timerGlow.style.width = `${percentage}%`;
        }
        
        // Animate label changes
        this.timeLabel.style.transform = 'scale(0.9)';
        setTimeout(() => {
            this.timeLabel.textContent = `${value} seconds`;
            this.timeLabel.style.transform = 'scale(1)';
        }, 100);
        
        // Add pulse effect on interaction
        this.addSliderPulse(this.timerFill);
    }

    updateTimeframeSlider() {
        if (!this.timeframeMin || !this.timeframeMax || !this.timeframeFill || !this.timeframeLabel) return;

        let minVal = parseInt(this.timeframeMin.value);
        let maxVal = parseInt(this.timeframeMax.value);

        // Ensure min doesn't exceed max with smooth adjustment
        if (minVal >= maxVal) {
            minVal = Math.max(1, maxVal - 1);
            this.timeframeMin.value = minVal;
            this.addSliderShake(this.timeframeMin);
        }

        // Ensure max doesn't go below min with smooth adjustment
        if (maxVal <= minVal) {
            maxVal = Math.min(100, minVal + 1);
            this.timeframeMax.value = maxVal;
            this.addSliderShake(this.timeframeMax);
        }

        const minPercent = ((minVal - 1) / 99) * 100;
        const maxPercent = ((maxVal - 1) / 99) * 100;
        
        // Smooth animation for fill
        this.timeframeFill.style.left = `${minPercent}%`;
        this.timeframeFill.style.width = `${maxPercent - minPercent}%`;
        
        // Update glow effect
        if (this.timeframeGlow) {
            this.timeframeGlow.style.left = `${minPercent}%`;
            this.timeframeGlow.style.width = `${maxPercent - minPercent}%`;
        }
        
        // Animate label changes
        this.timeframeLabel.style.transform = 'scale(0.9)';
        setTimeout(() => {
            this.timeframeLabel.textContent = minVal === maxVal ? 
                `${minVal} years` : 
                `${minVal} - ${maxVal} years`;
            this.timeframeLabel.style.transform = 'scale(1)';
        }, 100);
        
        // Add pulse effect on interaction
        this.addSliderPulse(this.timeframeFill);
    }

    initializeSliders() {
        this.updateTimerSlider();
        this.updateTimeframeSlider();
    }

    // Enhanced Animation Methods
    initializeAnimations() {
        // Staggered title letter animation on load
        this.titleLetters.forEach((letter, index) => {
            letter.style.opacity = '0';
            letter.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                letter.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                letter.style.opacity = '1';
                letter.style.transform = 'translateY(0)';
            }, index * 50 + 300);
        });

        // Animate cards on load
        const cards = document.querySelectorAll('.glass-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 150 + 600);
        });

        // Play button entrance animation
        if (this.playBtn) {
            this.playBtn.style.opacity = '0';
            this.playBtn.style.transform = 'scale(0.9)';
            
            setTimeout(() => {
                this.playBtn.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                this.playBtn.style.opacity = '1';
                this.playBtn.style.transform = 'scale(1)';
            }, 400);
        }
    }

    animateLetterHover(letter) {
        letter.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        letter.style.transform = 'translateY(-10px) scale(1.1) rotateZ(5deg)';
        letter.style.filter = 'brightness(1.2)';
    }

    resetLetterHover(letter) {
        letter.style.transform = 'translateY(0) scale(1) rotateZ(0deg)';
        letter.style.filter = 'brightness(1)';
    }

    addButtonHoverEffect(button) {
        if (!button.classList.contains('active')) {
            button.style.transform = 'translateY(-2px) scale(1.02)';
            setTimeout(() => {
                if (!button.matches(':hover')) {
                    button.style.transform = '';
                }
            }, 300);
        }
    }

    addClickAnimation(button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    }

    createRipple(event, button) {
        const ripple = button.querySelector('.btn-ripple');
        if (!ripple) return;

        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.transform = 'scale(0)';
        ripple.style.opacity = '1';

        // Trigger ripple animation
        requestAnimationFrame(() => {
            ripple.style.transform = 'scale(4)';
            ripple.style.opacity = '0';
        });
    }

    addSliderPulse(element) {
        element.style.filter = 'brightness(1.2)';
        element.style.transform = 'scaleY(1.1)';
        
        setTimeout(() => {
            element.style.filter = '';
            element.style.transform = '';
        }, 150);
    }

    addSliderShake(slider) {
        slider.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            slider.style.animation = '';
        }, 500);
    }

    // Particle System
    initializeParticleSystem() {
        this.canvas = document.getElementById('particleCanvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = window.innerWidth < 768 ? 30 : 50;
        this.particlesActive = true;
        
        this.resizeParticleCanvas();
        this.createParticles();
        this.animateParticles();

        // Store instance globally for visibility change handler
        window.gameSettingsInstance = this;
    }

    resizeParticleCanvas() {
        if (!this.canvas) return;
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
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

    animateParticles() {
        if (!this.ctx || !this.particlesActive) return;

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
            requestAnimationFrame(() => this.animateParticles());
        }
    }
}

// Add CSS animations via JavaScript
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new GameSettings();
    
    // Add loading completion effect
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 1500);
});

// Performance optimization: Pause particles when tab is not visible
document.addEventListener('visibilitychange', () => {
    const gameSettings = window.gameSettingsInstance;
    if (gameSettings && gameSettings.animateParticles) {
        if (document.hidden) {
            gameSettings.particlesActive = false;
        } else {
            gameSettings.particlesActive = true;
            gameSettings.animateParticles();
        }
    }
});