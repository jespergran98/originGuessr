// Final score display handler for Origin Guessr game
class FinalScoreDisplay {
    constructor() {
        this.gameStats = null;
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

        this.updateScoreDisplay();
        this.attachButtonListeners();
        this.animateScore();
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
        const scoreDivider = document.getElementById('scoreDivider');
        if (scoreDivider && this.gameStats) {
            const maxScore = (this.gameStats.maxRounds * 10000).toLocaleString();
            scoreDivider.textContent = `/${maxScore}`;
        }
        console.log('Score display updated');
    }

    attachButtonListeners() {
        const playAgainBtn = document.getElementById('playAgainBtn');
        const menuBtn = document.getElementById('menuBtn');
        const summaryBtn = document.getElementById('summaryBtn');

        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                console.log('Play Again clicked - functionality to be implemented');
                // Placeholder for future implementation
            });
        }

        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                console.log('Menu clicked - functionality to be implemented');
                // Placeholder for future implementation
            });
        }

        if (summaryBtn) {
            summaryBtn.addEventListener('click', () => {
                console.log('Summary clicked - functionality to be implemented');
                // Placeholder for future implementation
            });
        }

        console.log('Button listeners attached');
    }

    animateScore() {
        const scoreElement = document.getElementById('animatedScore');
        if (!scoreElement || !this.gameStats) {
            console.warn('Cannot animate score - element or stats missing');
            return;
        }

        const finalScore = this.gameStats.totalScore;
        const duration = 2000; // 2 seconds
        const steps = 60;
        const increment = finalScore / steps;
        const stepTime = duration / steps;

        let currentScore = 0;
        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            currentScore = Math.min(Math.round(increment * currentStep), finalScore);
            
            scoreElement.textContent = currentScore.toLocaleString();

            if (currentScore >= finalScore) {
                clearInterval(timer);
                scoreElement.textContent = finalScore.toLocaleString();
                this.addScoreGlow();
                console.log(`Score animation completed: ${finalScore}`);
            }
        }, stepTime);

        console.log(`Starting score animation from 0 to ${finalScore}`);
    }

    addScoreGlow() {
        const scoreElement = document.getElementById('animatedScore');
        if (scoreElement) {
            scoreElement.style.animation = 'scoreGlow 1.5s ease-in-out';
        }
    }

    /**
     * Get performance rating based on total score
     * @returns {string} Performance rating
     */
    getPerformanceRating() {
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
}

// Initialize the final score display
const finalScoreDisplay = new FinalScoreDisplay();

// Make it globally accessible
window.finalScoreDisplay = finalScoreDisplay;