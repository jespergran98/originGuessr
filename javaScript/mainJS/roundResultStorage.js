// Round Result Storage System for Origin Guessr
// Tracks all artifacts played and user guesses across the five rounds
class RoundResultStorage {
    constructor() {
        this.storageKey = 'originGuessrGameResults';
        this.gameResults = this.initializeGameResults();
        this.initialize();
    }

    initialize() {
        // Listen for page load events to determine current page
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.handlePageLoad());
        } else {
            this.handlePageLoad();
        }

        // Listen for custom events from other parts of the application
        this.setupEventListeners();
    }

    /**
     * Initialize or load existing game results structure
     */
    initializeGameResults() {
        const stored = sessionStorage.getItem(this.storageKey);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                console.log('Loaded existing game results:', parsed);
                return parsed;
            } catch (e) {
                console.warn('Error parsing stored game results, starting fresh:', e);
            }
        }

        // Create fresh game results structure
        const freshResults = {
            gameId: this.generateGameId(),
            startTime: new Date().toISOString(),
            rounds: [],
            finalScore: 0,
            completed: false
        };
        
        console.log('Initialized fresh game results:', freshResults);
        return freshResults;
    }

    /**
     * Generate unique game ID
     */
    generateGameId() {
        return 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Handle different page loads and extract relevant data
     */
    handlePageLoad() {
        const currentPage = this.getCurrentPage();
        console.log('Round result storage handling page:', currentPage);

        switch (currentPage) {
            case 'guess':
                this.handleGuessPage();
                break;
            case 'result':
                this.handleResultPage();
                break;
            case 'finalScore':
                this.handleFinalScorePage();
                break;
            case 'index':
                this.handleIndexPage();
                break;
        }
    }

    /**
     * Determine current page based on URL
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
     * Handle guess page - store artifact data when loaded
     */
    handleGuessPage() {
        // Check if this is round 1 (start of new game)
        const urlParams = new URLSearchParams(window.location.search);
        const round = parseInt(urlParams.get('round')) || 1;
        
        if (round === 1) {
            // Reset for new game
            this.gameResults = this.initializeGameResults();
            this.saveGameResults();
        }

        // Wait for artifact to be loaded
        document.addEventListener('artifactLoaded', (event) => {
            this.storeArtifactForCurrentRound(event.detail.artifact, round);
        });
    }

    /**
     * Handle result page - store user guess and calculated scores
     */
    handleResultPage() {
        // Wait for page to fully load and results to be calculated
        setTimeout(() => {
            this.extractAndStoreResultData();
        }, 500);
    }

    /**
     * Handle final score page - mark game as completed
     */
    handleFinalScorePage() {
        const urlParams = new URLSearchParams(window.location.search);
        const finalScore = parseInt(urlParams.get('totalScore')) || 0;
        
        this.gameResults.finalScore = finalScore;
        this.gameResults.completed = true;
        this.gameResults.endTime = new Date().toISOString();
        
        this.saveGameResults();
        console.log('Game completed and results saved:', this.gameResults);
    }

    /**
     * Handle index page - clear previous game data if starting fresh
     */
    handleIndexPage() {
        // Only clear if user is starting a completely new game
        // (This could be enhanced to check user intent)
        console.log('On index page - keeping previous game results for now');
    }

    /**
     * Store artifact data for the current round
     */
    storeArtifactForCurrentRound(artifact, roundNumber) {
        if (!artifact) {
            console.warn('No artifact data provided to store');
            return;
        }

        // Find or create round entry
        let roundEntry = this.gameResults.rounds.find(r => r.roundNumber === roundNumber);
        if (!roundEntry) {
            roundEntry = {
                roundNumber: roundNumber,
                artifact: null,
                userGuess: null,
                scores: null,
                timestamp: new Date().toISOString()
            };
            this.gameResults.rounds.push(roundEntry);
        }

        // Store artifact data in the specified format
        roundEntry.artifact = {
            title: artifact.title || '',
            image: artifact.image || '',
            lat: artifact.lat || 0,
            lng: artifact.lng || 0,
            year: artifact.year || 0,
            description: artifact.description || '',
            author: artifact.author || '',
            authorLink: artifact.authorLink || '',
            license: artifact.license || ''
        };

        this.saveGameResults();
        console.log(`Stored artifact for round ${roundNumber}:`, roundEntry.artifact.title);
    }

    /**
     * Extract result data from the result page and store it
     */
    extractAndStoreResultData() {
        const urlParams = new URLSearchParams(window.location.search);
        const roundNumber = parseInt(urlParams.get('round')) || 1;

        // Find the round entry
        let roundEntry = this.gameResults.rounds.find(r => r.roundNumber === roundNumber);
        if (!roundEntry) {
            console.warn(`No round entry found for round ${roundNumber}`);
            return;
        }

        try {
            // Extract user guess data from URL parameters
            const guessLat = parseFloat(urlParams.get('guessLat'));
            const guessLng = parseFloat(urlParams.get('guessLng'));
            const guessYear = parseInt(urlParams.get('guessYear'));

            if (!isNaN(guessLat) && !isNaN(guessLng) && !isNaN(guessYear)) {
                roundEntry.userGuess = {
                    lat: guessLat,
                    lng: guessLng,
                    year: guessYear
                };
            }

            // Extract calculated scores from DOM
            const yearScoreElement = document.querySelector('.yearScoreBox .score-value');
            const locationScoreElement = document.querySelector('.locationScoreBox .score-value');
            const totalScoreElement = document.querySelector('.totalScoreBox .score-value');

            if (yearScoreElement && locationScoreElement && totalScoreElement) {
                roundEntry.scores = {
                    yearScore: parseInt(yearScoreElement.textContent.replace(/,/g, '')) || 0,
                    locationScore: parseInt(locationScoreElement.textContent.replace(/,/g, '')) || 0,
                    totalScore: parseInt(totalScoreElement.textContent.replace(/,/g, '')) || 0
                };
            }

            // Calculate additional statistics if we have all the data
            if (roundEntry.artifact && roundEntry.userGuess && roundEntry.scores) {
                this.calculateAdditionalStats(roundEntry);
            }

            this.saveGameResults();
            console.log(`Stored result data for round ${roundNumber}:`, {
                userGuess: roundEntry.userGuess,
                scores: roundEntry.scores
            });

        } catch (error) {
            console.error('Error extracting result data:', error);
        }
    }

    /**
     * Calculate additional statistics for the round
     */
    calculateAdditionalStats(roundEntry) {
        if (!roundEntry.artifact || !roundEntry.userGuess) {
            return;
        }

        // Calculate distance error
        const distance = this.calculateDistance(
            roundEntry.artifact.lat,
            roundEntry.artifact.lng,
            roundEntry.userGuess.lat,
            roundEntry.userGuess.lng
        );

        // Calculate year error
        const yearError = Math.abs(roundEntry.artifact.year - roundEntry.userGuess.year);

        // Add to round entry
        roundEntry.statistics = {
            distanceErrorKm: Math.round(distance),
            yearError: yearError,
            distanceErrorFormatted: this.formatDistance(distance),
            yearErrorFormatted: yearError.toLocaleString() + ' years'
        };
    }

    /**
     * Calculate distance between two points using Haversine formula
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Convert degrees to radians
     */
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Format distance for display
     */
    formatDistance(distanceKm) {
        if (distanceKm < 1) {
            return `${Math.round(distanceKm * 1000)}m`;
        } else if (distanceKm < 100) {
            return `${distanceKm.toFixed(1)} km`;
        } else {
            return `${Math.round(distanceKm)} km`;
        }
    }

    /**
     * Setup event listeners for custom events
     */
    setupEventListeners() {
        // Listen for game reset events
        document.addEventListener('gameReset', () => {
            this.resetGameResults();
        });

        // Listen for game completion events
        document.addEventListener('gameCompleted', (event) => {
            if (event.detail && event.detail.finalScore) {
                this.gameResults.finalScore = event.detail.finalScore;
                this.gameResults.completed = true;
                this.gameResults.endTime = new Date().toISOString();
                this.saveGameResults();
            }
        });
    }

    /**
     * Save game results to sessionStorage
     */
    saveGameResults() {
        try {
            sessionStorage.setItem(this.storageKey, JSON.stringify(this.gameResults));
            console.log('Game results saved to session storage');
        } catch (error) {
            console.error('Error saving game results:', error);
        }
    }

    /**
     * Get current game results
     */
    getGameResults() {
        return this.gameResults;
    }

    /**
     * Get results for a specific round
     */
    getRoundResult(roundNumber) {
        return this.gameResults.rounds.find(r => r.roundNumber === roundNumber);
    }

    /**
     * Get all completed rounds
     */
    getCompletedRounds() {
        return this.gameResults.rounds.filter(r => 
            r.artifact && r.userGuess && r.scores
        );
    }

    /**
     * Get game summary statistics
     */
    getGameSummary() {
        const completedRounds = this.getCompletedRounds();
        
        if (completedRounds.length === 0) {
            return null;
        }

        const totalScore = completedRounds.reduce((sum, round) => sum + (round.scores.totalScore || 0), 0);
        const averageScore = Math.round(totalScore / completedRounds.length);
        
        const yearScores = completedRounds.map(r => r.scores.yearScore || 0);
        const locationScores = completedRounds.map(r => r.scores.locationScore || 0);
        const totalScores = completedRounds.map(r => r.scores.totalScore || 0);
        
        return {
            totalRounds: completedRounds.length,
            totalScore: totalScore,
            averageScore: averageScore,
            bestRound: Math.max(...totalScores),
            worstRound: Math.min(...totalScores),
            averageYearScore: Math.round(yearScores.reduce((a, b) => a + b, 0) / yearScores.length),
            averageLocationScore: Math.round(locationScores.reduce((a, b) => a + b, 0) / locationScores.length),
            completed: this.gameResults.completed,
            gameId: this.gameResults.gameId,
            startTime: this.gameResults.startTime,
            endTime: this.gameResults.endTime
        };
    }

    /**
     * Reset game results for a new game
     */
    resetGameResults() {
        this.gameResults = this.initializeGameResults();
        this.saveGameResults();
        console.log('Game results reset for new game');
    }

    /**
     * Export game results as JSON string
     */
    exportGameResults() {
        return JSON.stringify(this.gameResults, null, 2);
    }

    /**
     * Clear all stored game results
     */
    clearStoredResults() {
        sessionStorage.removeItem(this.storageKey);
        console.log('Cleared all stored game results');
    }

    /**
     * Static method to get instance or create new one
     */
    static getInstance() {
        if (!window.roundResultStorage) {
            window.roundResultStorage = new RoundResultStorage();
        }
        return window.roundResultStorage;
    }
}

// Initialize the round result storage system
const roundResultStorage = new RoundResultStorage();

// Make it globally accessible
window.roundResultStorage = roundResultStorage;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoundResultStorage;
}

console.log('Round Result Storage system initialized');