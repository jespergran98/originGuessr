class GameSettings {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.initializeSliders();
    }

    initializeElements() {
        this.timerButtons = document.querySelectorAll('[data-timer]');
        this.timeframeButtons = document.querySelectorAll('[data-timeframe]');
        this.timeSlider = document.getElementById('timeSlider');
        this.timeframeSlider = document.getElementById('timeframeSlider');
        this.timeRange = document.getElementById('timeRange');
        this.timeLabel = document.getElementById('timeLabel');
        this.timerFill = document.getElementById('timerFill');
        this.timeframeMin = document.getElementById('timeframeMin');
        this.timeframeMax = document.getElementById('timeframeMax');
        this.timeframeLabel = document.getElementById('timeframeLabel');
        this.timeframeFill = document.getElementById('timeframeFill');
    }

    bindEvents() {
        this.timerButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleTimerToggle(e));
        });

        this.timeframeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleTimeframeToggle(e));
        });

        this.timeRange?.addEventListener('input', () => this.updateTimerSlider());
        this.timeframeMin?.addEventListener('input', () => this.updateTimeframeSlider());
        this.timeframeMax?.addEventListener('input', () => this.updateTimeframeSlider());
    }

    handleTimerToggle(e) {
        e.preventDefault();
        const button = e.target;
        
        this.setActiveButton(this.timerButtons, button);
        
        if (button.dataset.timer === 'yes') {
            this.showSlider(this.timeSlider);
        } else {
            this.hideSlider(this.timeSlider);
        }
    }

    handleTimeframeToggle(e) {
        e.preventDefault();
        const button = e.target;
        
        this.setActiveButton(this.timeframeButtons, button);
        
        if (button.dataset.timeframe === 'flexible') {
            this.showSlider(this.timeframeSlider);
        } else {
            this.hideSlider(this.timeframeSlider);
        }
    }

    setActiveButton(buttons, activeButton) {
        buttons.forEach(btn => btn.classList.remove('active'));
        activeButton.classList.add('active');
    }

    showSlider(slider) {
        slider?.classList.remove('hidden');
        setTimeout(() => slider?.classList.add('visible'), 10);
    }

    hideSlider(slider) {
        slider?.classList.remove('visible');
        setTimeout(() => slider?.classList.add('hidden'), 300);
    }

    updateTimerSlider() {
        if (!this.timeRange || !this.timerFill || !this.timeLabel) return;

        const value = parseInt(this.timeRange.value);
        const min = parseInt(this.timeRange.min);
        const max = parseInt(this.timeRange.max);
        const percentage = ((value - min) / (max - min)) * 100;
        
        this.timerFill.style.width = `${percentage}%`;
        this.timeLabel.textContent = `${value} seconds`;
    }

    updateTimeframeSlider() {
        if (!this.timeframeMin || !this.timeframeMax || !this.timeframeFill || !this.timeframeLabel) return;

        let minVal = parseInt(this.timeframeMin.value);
        let maxVal = parseInt(this.timeframeMax.value);

        // Ensure min doesn't exceed max
        if (minVal >= maxVal) {
            minVal = Math.max(1, maxVal - 1);
            this.timeframeMin.value = minVal;
        }

        // Ensure max doesn't go below min
        if (maxVal <= minVal) {
            maxVal = Math.min(100, minVal + 1);
            this.timeframeMax.value = maxVal;
        }

        const minPercent = ((minVal - 1) / 99) * 100;
        const maxPercent = ((maxVal - 1) / 99) * 100;
        
        this.timeframeFill.style.left = `${minPercent}%`;
        this.timeframeFill.style.width = `${maxPercent - minPercent}%`;
        
        this.timeframeLabel.textContent = minVal === maxVal ? 
            `${minVal} years` : 
            `${minVal} - ${maxVal} years`;
    }

    initializeSliders() {
        this.updateTimerSlider();
        this.updateTimeframeSlider();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new GameSettings();
});