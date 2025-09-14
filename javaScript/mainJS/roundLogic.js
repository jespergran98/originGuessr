// Round management system for Origin Guessr game
class RoundLogic {
    constructor() {
        this.maxRounds = 5;
        this.currentRound = 1;
        this.totalScore = 0;
        this.roundScores = [];
        this.gameData = {
            rounds: [],
            totalScore: 0,
            currentRound: 1
        };
        
        this.initialize();
    }

    initialize() {
        // Check if we're continuing a game or starting fresh
        this.loadGameState();
        
        // Update UI based on current page
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.updateUI());
        } else {
            this.updateUI();
        }
    }

    /**
     * Load game state from sessionStorage or initialize new game
     */
    loadGameState() {
        const urlParams = new URLSearchParams(window.location.search);
        const roundParam = urlParams.get('round');
        const scoreParam = urlParams.get('totalScore');
        const scoresParam = urlParams.get('scores');

        if (roundParam && scoreParam) {
            // Continue existing game
            this.currentRound = parseInt(roundParam);
            this.totalScore = parseInt(scoreParam);
            
            if (scoresParam) {
                try {
                    this.roundScores = JSON.parse(decodeURIComponent(scoresParam));
                } catch (e) {
                    console.warn('Error parsing round scores:', e);
                    this.roundScores = [];
                }
            }
            
            console.log(`Continuing game - Round ${this.currentRound}, Total Score: ${this.totalScore}`);
        } else {
            // Start new game
            this.startNewGame();
        }
    }

    /**
     * Start a new game session
     */
    startNewGame() {
        this.currentRound = 1;
        this.totalScore = 0;
        this.roundScores = [];
        console.log('Starting new game');
    }

    /**
     * Update UI elements based on current page and game state
     */
    updateUI() {
        const currentPage = this.getCurrentPage();
        
        switch (currentPage) {
            case 'guess':
                this.updateGuessPageUI();
                break;
            case 'result':
                this.updateResultPageUI();
                break;
            default:
                console.log('No UI updates needed for current page');
        }
    }

    /**
     * Determine which page we're currently on
     */
    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('guess.html') || path.endsWith('/guess')) {
            return 'guess';
        } else if (path.includes('result.html') || path.endsWith('/result')) {
            return 'result';
        } else if (path.includes('finalScore.html') || path.endsWith('/finalScore')) {
            return 'finalScore';
        } else if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
            return 'index';
        }
        return 'unknown';
    }

    /**
     * Update guess page UI with current round and total score
     */
    updateGuessPageUI() {
        const roundDisplay = document.querySelector('.stat-item .stat-value');
        const scoreDisplay = document.querySelectorAll('.stat-item .stat-value')[1];

        if (roundDisplay) {
            roundDisplay.textContent = `${this.currentRound}/${this.maxRounds}`;
        }

        if (scoreDisplay) {
            scoreDisplay.textContent = this.totalScore.toLocaleString();
        }

        console.log(`Updated guess page UI - Round ${this.currentRound}/${this.maxRounds}, Score: ${this.totalScore}`);
    }

    /**
     * Update result page UI and next button behavior
     */
    updateResultPageUI() {
        const nextButton = document.querySelector('.next-round-button');
        
        if (nextButton) {
            if (this.currentRound >= this.maxRounds) {
                // Last round - change button to "Final Score"
                nextButton.textContent = 'Final Score';
                nextButton.onclick = () => this.goToFinalScore();
            } else {
                // Regular round - keep "Next Round"
                nextButton.textContent = 'Next Round';
                nextButton.onclick = () => this.proceedToNextRound();
            }
        }

        console.log(`Updated result page UI for round ${this.currentRound}`);
    }

    /**
     * Process the current round's results and move to next round
     */
    proceedToNextRound() {
        // Get the current round's score from the result page
        const currentRoundScore = this.getCurrentRoundScore();
        
        // Add to total and store round data
        this.totalScore += currentRoundScore;
        this.roundScores.push(currentRoundScore);
        
        // Move to next round
        this.currentRound++;
        
        console.log(`Proceeding to round ${this.currentRound} with total score: ${this.totalScore}`);
        
        // Navigate to guess page with updated parameters
        this.navigateToGuessPage();
    }

    /**
     * Extract the current round's total score from the result page
     */
    getCurrentRoundScore() {
        const totalScoreElement = document.querySelector('.totalScoreBox .score-value');
        
        if (totalScoreElement) {
            // Remove commas and parse as integer
            const scoreText = totalScoreElement.textContent.replace(/,/g, '');
            const score = parseInt(scoreText);
            
            if (!isNaN(score)) {
                console.log(`Current round score: ${score}`);
                return score;
            }
        }
        
        console.warn('Could not extract current round score, defaulting to 0');
        return 0;
    }

    /**
     * Navigate to guess page with current game state
     */
    navigateToGuessPage() {
        const params = new URLSearchParams();
        params.append('round', this.currentRound.toString());
        params.append('totalScore', this.totalScore.toString());
        params.append('scores', encodeURIComponent(JSON.stringify(this.roundScores)));
        
        window.location.href = `guess.html?${params.toString()}`;
    }

    /**
     * Handle navigation to finalScore page with complete game data
     */
    goToFinalScore() {
        // First, add the final round's score to our totals
        const finalRoundScore = this.getCurrentRoundScore();
        const finalTotalScore = this.totalScore + finalRoundScore;
        const finalRoundScores = [...this.roundScores, finalRoundScore];
        
        console.log('Game completed!');
        console.log('Final total score:', finalTotalScore);
        console.log('All round scores:', finalRoundScores);
        
        // Create URL parameters for final score page
        const params = new URLSearchParams();
        params.append('totalScore', finalTotalScore.toString());
        params.append('roundScores', encodeURIComponent(JSON.stringify(finalRoundScores)));
        params.append('maxRounds', this.maxRounds.toString());
        
        // Navigate to final score page
        window.location.href = `finalScore.html?${params.toString()}`;
    }

    /**
     * Get current game statistics
     */
    getGameStats() {
        return {
            currentRound: this.currentRound,
            maxRounds: this.maxRounds,
            totalScore: this.totalScore,
            roundScores: this.roundScores,
            isLastRound: this.currentRound >= this.maxRounds
        };
    }

    /**
     * Get final game statistics (used on final score page)
     */
    getFinalGameStats() {
        const urlParams = new URLSearchParams(window.location.search);
        const totalScore = parseInt(urlParams.get('totalScore')) || 0;
        const roundScoresParam = urlParams.get('roundScores');
        const maxRounds = parseInt(urlParams.get('maxRounds')) || this.maxRounds;
        
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

    /**
     * Reset game state (useful for starting over)
     */
    resetGame() {
        this.currentRound = 1;
        this.totalScore = 0;
        this.roundScores = [];
        console.log('Game reset');
    }

    /**
     * Static method to start a new game from any page
     */
    static startNewGameFromAnyPage() {
        // Clear any existing game state and go to round 1
        window.location.href = 'guess.html?round=1&totalScore=0&scores=[]';
    }

    /**
     * Static method to start a new game from index page
     */
    static startNewGameFromIndex() {
        // Clear any existing game state and go to round 1
        window.location.href = 'guess.html?round=1&totalScore=0&scores=[]';
    }
}

// Initialize round logic system
const roundLogic = new RoundLogic();

// Make it globally accessible
window.roundLogic = roundLogic;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoundLogic;
}