// Index Page Game Settings
class IndexGameSettings {
    constructor() {
        this.buttonManager = new ButtonManager();
        this.initializeElements();
        this.setDefaultStates();
        this.bindEvents();
        this.initializeSliders();
        this.initializeAnimations();
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
        // Set default timer button
        this.buttonManager.setDefaultActive(this.timerButtons, '[data-timer="no"]');
        
        // Set default timeframe button
        this.buttonManager.setDefaultActive(this.timeframeButtons, '[data-timeframe="unspecified"]');

        // Set initial slider visibility based on active buttons
        const activeTimer = this.buttonManager.getActiveButton(this.timerButtons);
        if (activeTimer && activeTimer.dataset.timer === 'yes') {
            AnimationUtils.slideIn(this.timeSlider);
        } else {
            AnimationUtils.slideOut(this.timeSlider);
        }

        const activeTimeframe = this.buttonManager.getActiveButton(this.timeframeButtons);
        if (activeTimeframe && activeTimeframe.dataset.timeframe === 'flexible') {
            AnimationUtils.slideIn(this.timeframeSlider);
        } else {
            AnimationUtils.slideOut(this.timeframeSlider);
        }
    }

    bindEvents() {
        // Timer buttons
        this.buttonManager.initializeButtonGroup(
            this.timerButtons, 
            (button) => this.handleTimerToggle(button),
            'timer'
        );

        // Timeframe buttons
        this.buttonManager.initializeButtonGroup(
            this.timeframeButtons, 
            (button) => this.handleTimeframeToggle(button),
            'timeframe'
        );

        // Slider events
        this.timeRange?.addEventListener('input', () => this.updateTimerSlider());
        this.timeframeMin?.addEventListener('input', () => this.updateTimeframeSlider());
        this.timeframeMax?.addEventListener('input', () => this.updateTimeframeSlider());

        // Play button ripple effect
        if (this.playBtn) {
            this.buttonManager.initializeRippleEffect([this.playBtn]);
        }

        // Title letter hover effects
        this.titleLetters.forEach((letter, index) => {
            letter.style.setProperty('--i', index);
            letter.addEventListener('mouseenter', () => this.animateLetterHover(letter));
            letter.addEventListener('mouseleave', () => this.resetLetterHover(letter));
        });
    }

    handleTimerToggle(button) {
        if (button.dataset.timer === 'yes') {
            AnimationUtils.slideIn(this.timeSlider);
        } else {
            AnimationUtils.slideOut(this.timeSlider);
        }
    }

    handleTimeframeToggle(button) {
        if (button.dataset.timeframe === 'flexible') {
            AnimationUtils.slideIn(this.timeframeSlider);
        } else {
            AnimationUtils.slideOut(this.timeframeSlider);
        }
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
        AnimationUtils.scaleLabel(this.timeLabel, `${value} seconds`);
        
        // Add pulse effect on interaction
        AnimationUtils.addSliderPulse(this.timerFill);
    }

    updateTimeframeSlider() {
        if (!this.timeframeMin || !this.timeframeMax || !this.timeframeFill || !this.timeframeLabel) return;

        let minVal = parseInt(this.timeframeMin.value);
        let maxVal = parseInt(this.timeframeMax.value);

        // Ensure min doesn't exceed max with smooth adjustment
        if (minVal >= maxVal) {
            minVal = Math.max(1, maxVal - 1);
            this.timeframeMin.value = minVal;
            AnimationUtils.addSliderShake(this.timeframeMin);
        }

        // Ensure max doesn't go below min with smooth adjustment
        if (maxVal <= minVal) {
            maxVal = Math.min(100, minVal + 1);
            this.timeframeMax.value = maxVal;
            AnimationUtils.addSliderShake(this.timeframeMax);
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
        const labelText = minVal === maxVal ? `${minVal} years` : `${minVal} - ${maxVal} years`;
        AnimationUtils.scaleLabel(this.timeframeLabel, labelText);
        
        // Add pulse effect on interaction
        AnimationUtils.addSliderPulse(this.timeframeFill);
    }

    initializeSliders() {
        this.updateTimerSlider();
        this.updateTimeframeSlider();
    }

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
        AnimationUtils.staggerAnimation(cards, 150, 600);

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
}