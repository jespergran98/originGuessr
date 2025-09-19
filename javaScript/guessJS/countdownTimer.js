// Countdown Timer for Origin Guessr
class CountdownTimer {
    constructor() {
        this.timerElement = null;
        this.timerContainer = null;
        this.timeRemaining = 0;
        this.totalTime = 0;
        this.intervalId = null;
        this.isActive = false;
        this.isTimerEnabled = false;
        
        this.initialize();
    }

    initialize() {
        // Check if timer is enabled from game settings
        this.checkTimerSettings();
        
        if (this.isTimerEnabled) {
            this.setupTimer();
            this.startTimer();
        }
    }

    checkTimerSettings() {
        // Check URL parameters first
        const urlParams = new URLSearchParams(window.location.search);
        const timerSeconds = urlParams.get('timerSeconds');
        
        if (timerSeconds && parseInt(timerSeconds) > 0) {
            this.totalTime = parseInt(timerSeconds);
            this.timeRemaining = this.totalTime;
            this.isTimerEnabled = true;
            console.log('Timer enabled from URL params:', this.totalTime, 'seconds');
            return;
        }

        // Fallback to sessionStorage
        const gameState = sessionStorage.getItem('gameState');
        if (gameState) {
            try {
                const state = JSON.parse(gameState);
                if (state.timerSeconds && state.timerSeconds > 0) {
                    this.totalTime = state.timerSeconds;
                    this.timeRemaining = this.totalTime;
                    this.isTimerEnabled = true;
                    console.log('Timer enabled from session storage:', this.totalTime, 'seconds');
                    return;
                }
            } catch (e) {
                console.warn('Error parsing timer settings from session:', e);
            }
        }
        
        // If no timer found, ensure it's disabled
        this.isTimerEnabled = false;
        console.log('Timer disabled - no timer settings found');
    }

    setupTimer() {
        // First check if the timer element already exists in the HTML
        this.timerContainer = document.getElementById('countdownTimer');
        
        if (this.timerContainer) {
            // Timer container exists in HTML, make it visible
            this.timerContainer.style.display = 'flex';
            
            // Get the timer value element
            this.timerElement = document.getElementById('timerValue');
            
            // Update initial display
            if (this.timerElement) {
                this.timerElement.textContent = this.formatTime(this.timeRemaining);
            }
            
            // Add initial styling class
            this.timerContainer.classList.remove('normal', 'warning', 'critical', 'time-up');
            this.timerContainer.classList.add('normal');
            
            console.log('Timer setup complete using existing HTML element');
        } else {
            // Fallback: create timer element if it doesn't exist
            this.createTimerElement();
        }
    }

    createTimerElement() {
        // Create timer container
        const timerContainer = document.createElement('div');
        timerContainer.className = 'countdown-timer normal';
        timerContainer.id = 'countdownTimer';
        
        // Create timer label
        const timerLabel = document.createElement('div');
        timerLabel.className = 'timer-label';
        timerLabel.textContent = 'TIME REMAINING';
        
        // Create timer value display
        this.timerElement = document.createElement('div');
        this.timerElement.className = 'timer-value';
        this.timerElement.id = 'timerValue';
        this.timerElement.textContent = this.formatTime(this.timeRemaining);
        
        // Create progress bar
        const timerProgress = document.createElement('div');
        timerProgress.className = 'timer-progress';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'timer-progress-bar';
        progressBar.id = 'timerProgressBar';
        
        timerProgress.appendChild(progressBar);
        
        // Assemble timer
        timerContainer.appendChild(timerLabel);
        timerContainer.appendChild(this.timerElement);
        timerContainer.appendChild(timerProgress);
        
        // Insert into page after header
        const header = document.querySelector('.header-text');
        if (header && header.parentNode) {
            header.parentNode.insertBefore(timerContainer, header.nextSibling);
        } else {
            document.body.appendChild(timerContainer);
        }
        
        this.timerContainer = timerContainer;
        
        console.log('Timer element created and added to page');
    }

    startTimer() {
        if (this.isActive || !this.isTimerEnabled || this.timeRemaining <= 0) return;
        
        this.isActive = true;
        this.intervalId = setInterval(() => {
            this.tick();
        }, 1000);
        
        // Update progress bar initially
        this.updateProgressBar();
        
        console.log('Timer started with', this.timeRemaining, 'seconds remaining');
    }

    tick() {
        if (this.timeRemaining <= 0) {
            this.timeUp();
            return;
        }
        
        this.timeRemaining--;
        this.updateDisplay();
        this.updateTimerStyle();
        this.updateProgressBar();
    }

    updateDisplay() {
        if (this.timerElement) {
            this.timerElement.textContent = this.formatTime(this.timeRemaining);
        }
    }

    updateProgressBar() {
        const progressBar = document.getElementById('timerProgressBar');
        if (progressBar && this.totalTime > 0) {
            const percentRemaining = (this.timeRemaining / this.totalTime) * 100;
            progressBar.style.width = `${Math.max(0, percentRemaining)}%`;
        }
    }

    updateTimerStyle() {
        if (!this.timerContainer || this.totalTime <= 0) return;
        
        const percentRemaining = (this.timeRemaining / this.totalTime) * 100;
        
        // Remove all state classes first
        this.timerContainer.classList.remove('normal', 'warning', 'critical');
        
        // Add appropriate class based on time remaining
        if (percentRemaining <= 10) {
            this.timerContainer.classList.add('critical');
        } else if (percentRemaining <= 25) {
            this.timerContainer.classList.add('warning');
        } else {
            this.timerContainer.classList.add('normal');
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    timeUp() {
        this.stop();
        
        if (this.timerElement) {
            this.timerElement.textContent = 'TIME UP!';
        }
        
        if (this.timerContainer) {
            this.timerContainer.classList.remove('normal', 'warning', 'critical');
            this.timerContainer.classList.add('time-up');
        }
        
        console.log('Time up!');
        
        // Auto-submit the current guess after a short delay
        setTimeout(() => {
            const guessButton = document.getElementById('makeGuess-button');
            if (guessButton && !guessButton.disabled) {
                guessButton.click();
            }
        }, 1500);
    }

    stop() {
        this.isActive = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    pause() {
        if (this.isActive) {
            this.stop();
        }
    }

    resume() {
        if (!this.isActive && this.timeRemaining > 0 && this.isTimerEnabled) {
            this.startTimer();
        }
    }

    reset() {
        this.stop();
        this.timeRemaining = this.totalTime;
        this.updateDisplay();
        this.updateProgressBar();
        
        if (this.timerContainer) {
            this.timerContainer.classList.remove('critical', 'warning', 'time-up');
            this.timerContainer.classList.add('normal');
        }
    }

    destroy() {
        this.stop();
        if (this.timerContainer) {
            this.timerContainer.remove();
        }
    }
}

// Initialize timer when page loads
let countdownTimer = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        countdownTimer = new CountdownTimer();
    });
} else {
    countdownTimer = new CountdownTimer();
}

// Make globally accessible
window.countdownTimer = countdownTimer;