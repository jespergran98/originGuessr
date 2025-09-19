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
        
        console.log('Time up! Processing forced navigation...');
        
        // Handle navigation based on current game state
        setTimeout(() => {
            this.handleTimeUpNavigation();
        }, 1500); // Short delay to show "TIME UP!" message
    }

    handleTimeUpNavigation() {
        // Check if we have a marker placed
        const hasMarker = window.markerManager && window.markerManager.hasMarker();
        
        if (hasMarker) {
            // User has placed a marker - proceed to result page with their guess
            console.log('Timer expired with marker placed - proceeding to result page');
            this.proceedToResultPage();
        } else {
            // No marker placed - proceed to next round or final score with default/no guess
            console.log('Timer expired without marker - proceeding to next round or final score');
            this.proceedWithoutGuess();
        }
    }

    proceedToResultPage() {
        // This mimics the logic from MarkerManager.navigateToResult()
        const artifact = window.currentArtifact;
        
        if (!artifact) {
            console.error('Missing artifact data for time-up navigation');
            // Fallback to proceeding without guess
            this.proceedWithoutGuess();
            return;
        }

        // Get the current marker coordinates
        const guessCoordinates = window.markerManager.getGuessCoordinates();
        
        if (!guessCoordinates) {
            console.error('No guess coordinates available despite marker being placed');
            this.proceedWithoutGuess();
            return;
        }

        // Get the current year from the timeline slider
        let guessYear = 1337; // Default fallback
        if (window.timelineSlider && typeof window.timelineSlider.getCurrentYear === 'function') {
            guessYear = window.timelineSlider.getCurrentYear();
        }

        const params = new URLSearchParams();
        params.append('artifact', encodeURIComponent(JSON.stringify(artifact)));
        params.append('guessLat', guessCoordinates.lat.toString());
        params.append('guessLng', guessCoordinates.lng.toString());
        params.append('guessYear', guessYear.toString());
        
        // Add round information if available
        if (window.roundLogic) {
            const gameStats = window.roundLogic.getGameStats();
            params.append('round', gameStats.currentRound.toString());
            params.append('totalScore', gameStats.totalScore.toString());
            params.append('scores', encodeURIComponent(JSON.stringify(gameStats.roundScores)));
            
            // Add timer parameter to maintain timer setting for next round
            if (gameStats.timerSeconds) {
                params.append('timerSeconds', gameStats.timerSeconds.toString());
            }
        }
        
        console.log('Timer expired - navigating to result page with guess:', {
            artifact: artifact.title,
            coordinates: guessCoordinates,
            year: guessYear
        });
        
        window.location.href = `result.html?${params.toString()}`;
    }

    proceedWithoutGuess() {
        // Check if this is the final round
        if (window.roundLogic) {
            const gameStats = window.roundLogic.getGameStats();
            
            if (gameStats.isLastRound) {
                // Final round - go directly to final score page
                console.log('Timer expired on final round without guess - going to final score');
                this.goDirectToFinalScore();
            } else {
                // Not final round - go to result page with no guess (will score 0)
                console.log('Timer expired without guess - going to result page with no guess');
                this.proceedToResultPageWithoutGuess();
            }
        } else {
            // Fallback - assume it's not the final round
            this.proceedToResultPageWithoutGuess();
        }
    }

    proceedToResultPageWithoutGuess() {
        const artifact = window.currentArtifact;
        
        if (!artifact) {
            console.error('Missing artifact data - cannot proceed to result page');
            return;
        }

        // Use default/invalid coordinates to indicate no guess
        const defaultLat = 0;
        const defaultLng = 0;
        const defaultYear = 1337;

        const params = new URLSearchParams();
        params.append('artifact', encodeURIComponent(JSON.stringify(artifact)));
        params.append('guessLat', defaultLat.toString());
        params.append('guessLng', defaultLng.toString());
        params.append('guessYear', defaultYear.toString());
        params.append('noGuess', 'true'); // Flag to indicate no guess was made
        
        // Add round information if available
        if (window.roundLogic) {
            const gameStats = window.roundLogic.getGameStats();
            params.append('round', gameStats.currentRound.toString());
            params.append('totalScore', gameStats.totalScore.toString());
            params.append('scores', encodeURIComponent(JSON.stringify(gameStats.roundScores)));
            
            // Add timer parameter to maintain timer setting for next round
            if (gameStats.timerSeconds) {
                params.append('timerSeconds', gameStats.timerSeconds.toString());
            }
        }
        
        console.log('Timer expired - navigating to result page without guess');
        window.location.href = `result.html?${params.toString()}`;
    }

    goDirectToFinalScore() {
        // Calculate final score without adding any points for this round
        if (window.roundLogic) {
            const gameStats = window.roundLogic.getGameStats();
            const finalTotalScore = gameStats.totalScore; // No additional points
            const finalRoundScores = [...gameStats.roundScores, 0]; // Add 0 for this round
            
            console.log('Going directly to final score - Timer expired on final round');
            console.log('Final total score:', finalTotalScore);
            console.log('All round scores:', finalRoundScores);
            
            // Clear game artifacts from sessionStorage
            sessionStorage.removeItem('gameArtifacts');
            
            // Create URL parameters for final score page
            const params = new URLSearchParams();
            params.append('totalScore', finalTotalScore.toString());
            params.append('roundScores', encodeURIComponent(JSON.stringify(finalRoundScores)));
            params.append('maxRounds', '5'); // Assuming 5 rounds max
            
            // Navigate to final score page
            window.location.href = `finalScore.html?${params.toString()}`;
        } else {
            console.error('Round logic not available - cannot calculate final score');
            // Fallback navigation
            window.location.href = 'finalScore.html';
        }
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