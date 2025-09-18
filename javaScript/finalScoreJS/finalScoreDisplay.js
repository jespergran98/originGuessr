// Final score display handler for Origin Guessr game - Enhanced with Index Page styling
class FinalScoreDisplay {
    constructor() {
        this.gameStats = null;
        this.titleLetters = null;
        this.initialize();
    }

    initialize() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupFinalScorePage());
        } else {
            this.setupFinalScorePage();
        }
    }

    setupFinalScorePage() {
        // Get final game statistics from round logic
        if (window.roundLogic) {
            this.gameStats = window.roundLogic.getFinalGameStats();
        } else {
            // Fallback: extract data from URL parameters
            this.gameStats = this.extractStatsFromURL();
        }

        console.log('Final game stats:', this.gameStats);

        this.initializeElements();
        this.updateScoreDisplay();
        this.attachButtonListeners();
        this.initializeAnimations();
        this.animateScore();
    }

    initializeElements() {
        this.titleLetters = document.querySelectorAll('.title-letter');
        this.scoreElement = document.getElementById('animatedScore');
        this.scoreDivider = document.getElementById('scoreDivider');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.menuBtn = document.getElementById('menuBtn');
        this.summaryBtn = document.getElementById('summaryBtn');
        this.buttons = [this.playAgainBtn, this.menuBtn, this.summaryBtn].filter(btn => btn);
    }

    extractStatsFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const totalScore = parseInt(urlParams.get('totalScore')) || 0;
        const roundScoresParam = urlParams.get('roundScores');
        const maxRounds = parseInt(urlParams.get('maxRounds')) || 5;
        
        let roundScores = [];
        if (roundScoresParam) {
            try {
                roundScores = JSON.parse(decodeURIComponent(roundScoresParam));
            } catch (e) {
                console.warn('Error parsing final round scores:', e);
                roundScores = [];
            }
        }
        
        return {
            totalScore,
            roundScores,
            maxRounds,
            averageScore: roundScores.length > 0 ? Math.round(totalScore / roundScores.length) : 0,
            bestRound: roundScores.length > 0 ? Math.max(...roundScores) : 0,
            worstRound: roundScores.length > 0 ? Math.min(...roundScores) : 0
        };
    }

    updateScoreDisplay() {
        // Update the score divider with the correct max score
        if (this.scoreDivider && this.gameStats) {
            const maxScore = (this.gameStats.maxRounds * 10000).toLocaleString();
            this.scoreDivider.textContent = `/${maxScore}`;
        }
        console.log('Score display updated');
    }

    attachButtonListeners() {
        // Initialize ripple effects for buttons
        this.initializeRippleEffect(this.buttons);

        if (this.playAgainBtn) {
            this.playAgainBtn.addEventListener('click', (e) => {
                this.createRipple(e, this.playAgainBtn);
                console.log('Play Again clicked - functionality to be implemented');
                // Placeholder for future implementation
            });
        }

        if (this.menuBtn) {
            this.menuBtn.addEventListener('click', (e) => {
                this.createRipple(e, this.menuBtn);
                console.log('Menu clicked - functionality to be implemented');
                // Placeholder for future implementation
            });
        }

        if (this.summaryBtn) {
            this.summaryBtn.addEventListener('click', (e) => {
                this.createRipple(e, this.summaryBtn);
                console.log('Summary clicked - functionality to be implemented');
                // Placeholder for future implementation
            });
        }

        // Add hover effects to title letters
        this.titleLetters.forEach((letter, index) => {
            letter.style.setProperty('--i', index);
            letter.addEventListener('mouseenter', () => this.animateLetterHover(letter));
            letter.addEventListener('mouseleave', () => this.resetLetterHover(letter));
        });

        console.log('Button listeners attached');
    }

    initializeRippleEffect(buttons) {
        buttons.forEach(button => {
            if (!button) return;
            
            button.addEventListener('click', (e) => {
                this.createRipple(e, button);
            });
        });
    }

    createRipple(event, button) {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.className = 'btn-ripple';
        
        button.appendChild(ripple);
        
        // Remove ripple after animation
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }

    initializeAnimations() {
        // Animate title letters entrance
        this.titleLetters.forEach((letter, index) => {
            letter.style.opacity = '0';
            letter.style.transform = 'translateY(30px)';
            setTimeout(() => {
                letter.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                letter.style.opacity = '1';
                letter.style.transform = 'translateY(0)';
            }, index * 50 + 200);
        });

        // Animate glass cards
        const cards = document.querySelectorAll('.glass-card');
        this.staggerAnimation(cards, 150, 400);

        // Animate buttons
        this.buttons.forEach((button, index) => {
            if (!button) return;
            button.style.opacity = '0';
            button.style.transform = 'scale(0.9) translateY(20px)';
            setTimeout(() => {
                button.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                button.style.opacity = '1';
                button.style.transform = 'scale(1) translateY(0)';
            }, index * 100 + 800);
        });
    }

    staggerAnimation(elements, delay, startDelay = 0) {
        elements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px) scale(0.95)';
            setTimeout(() => {
                element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0) scale(1)';
            }, startDelay + (index * delay));
        });
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

    animateScore() {
        if (!this.scoreElement || !this.gameStats) {
            console.warn('Cannot animate score - element or stats missing');
            return;
        }

        const finalScore = this.gameStats.totalScore;
        const duration = 2500; // 2.5 seconds for more dramatic effect
        const steps = 80;
        const increment = finalScore / steps;
        const stepTime = duration / steps;

        let currentScore = 0;
        let currentStep = 0;

        // Add anticipation delay
        setTimeout(() => {
            const timer = setInterval(() => {
                currentStep++;
                
                // Use easing function for more natural animation
                const progress = currentStep / steps;
                const easedProgress = this.easeOutExpo(progress);
                currentScore = Math.round(finalScore * easedProgress);
                
                this.scoreElement.textContent = currentScore.toLocaleString();

                if (currentStep >= steps) {
                    clearInterval(timer);
                    this.scoreElement.textContent = finalScore.toLocaleString();
                    this.addScoreGlow();
                    console.log(`Score animation completed: ${finalScore}`);
                }
            }, stepTime);
        }, 1000); // 1 second delay for dramatic effect

        console.log(`Starting score animation from 0 to ${finalScore}`);
    }

    // Easing function for smooth score animation
    easeOutExpo(t) {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    addScoreGlow() {
        if (this.scoreElement) {
            this.scoreElement.style.animation = 'scoreGlow 1.5s ease-in-out';
            
            // Add extra emphasis for high scores
            const percentage = (this.gameStats.totalScore / (this.gameStats.maxRounds * 10000)) * 100;
            if (percentage >= 80) {
                setTimeout(() => {
                    this.scoreElement.style.animation = 'scoreGlow 1.5s ease-in-out';
                }, 500);
            }
        }
    }

    /**
     * Get performance rating based on total score
     * @returns {string} Performance rating
     */
    getPerformanceRating() {
        if (!this.gameStats) return 'Unknown';
        
        const maxPossibleScore = this.gameStats.maxRounds * 10000;
        const percentage = (this.gameStats.totalScore / maxPossibleScore) * 100;

        if (percentage >= 90) return 'Outstanding';
        if (percentage >= 80) return 'Excellent';
        if (percentage >= 70) return 'Great';
        if (percentage >= 60) return 'Good';
        if (percentage >= 50) return 'Average';
        if (percentage >= 40) return 'Below Average';
        return 'Needs Improvement';
    }

    /**
     * Get game statistics for external use
     * @returns {object} Game statistics
     */
    getGameStats() {
        return this.gameStats;
    }

    /**
     * Initialize particle system if available
     */
    initializeParticles() {
        // Check if particle system is available and initialize
        if (window.ParticleSystem && document.getElementById('particleCanvas')) {
            try {
                this.particleSystem = new window.ParticleSystem('particleCanvas');
                console.log('Particle system initialized');
            } catch (error) {
                console.warn('Could not initialize particle system:', error);
            }
        }
    }

    /**
     * Clean up resources when page is unloaded
     */
    cleanup() {
        if (this.particleSystem && this.particleSystem.cleanup) {
            this.particleSystem.cleanup();
        }
    }
}

// Initialize the final score display
const finalScoreDisplay = new FinalScoreDisplay();

// Make it globally accessible
window.finalScoreDisplay = finalScoreDisplay;

// Initialize particles when available
window.addEventListener('load', () => {
    finalScoreDisplay.initializeParticles();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    finalScoreDisplay.cleanup();
});