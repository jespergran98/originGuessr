// Final Score Logic for Origin Guessr - Handles Play Again and Menu navigation
class FinalScoreLogic {
    constructor() {
        this.gameSettings = null;
        this.initialize();
    }

    initialize() {
        // Load game settings from various sources
        this.loadGameSettings();
        
        // Setup button event listeners
        this.setupButtonListeners();
        
        console.log('Final Score Logic initialized with settings:', this.gameSettings);
    }

    /**
     * Load game settings from URL parameters, sessionStorage, or defaults
     */
    loadGameSettings() {
        this.gameSettings = {
            timerEnabled: false,
            timerSeconds: null,
            timeframeEnabled: false,
            timeframeMinIndex: null,
            timeframeMaxIndex: null
        };

        // Try to load from sessionStorage first (most recent game state)
        const gameState = sessionStorage.getItem('gameState');
        if (gameState) {
            try {
                const state = JSON.parse(gameState);
                if (state.timerSeconds && state.timerSeconds > 0) {
                    this.gameSettings.timerEnabled = true;
                    this.gameSettings.timerSeconds = state.timerSeconds;
                }
                if (state.timeframeMinIndex !== null && state.timeframeMaxIndex !== null) {
                    this.gameSettings.timeframeEnabled = true;
                    this.gameSettings.timeframeMinIndex = state.timeframeMinIndex;
                    this.gameSettings.timeframeMaxIndex = state.timeframeMaxIndex;
                }
                console.log('Loaded settings from sessionStorage');
            } catch (e) {
                console.warn('Error parsing session game state:', e);
            }
        }

        // Fallback: Try to load from URL parameters (if available)
        const urlParams = new URLSearchParams(window.location.search);
        const timerParam = urlParams.get('timerSeconds');
        const minIdxParam = urlParams.get('timeframeMinIndex');
        const maxIdxParam = urlParams.get('timeframeMaxIndex');

        if (timerParam && !this.gameSettings.timerEnabled) {
            this.gameSettings.timerEnabled = true;
            this.gameSettings.timerSeconds = parseInt(timerParam);
            console.log('Loaded timer from URL params');
        }

        if (minIdxParam && maxIdxParam && !this.gameSettings.timeframeEnabled) {
            this.gameSettings.timeframeEnabled = true;
            this.gameSettings.timeframeMinIndex = parseInt(minIdxParam);
            this.gameSettings.timeframeMaxIndex = parseInt(maxIdxParam);
            console.log('Loaded timeframe from URL params');
        }

        // Store settings for future use
        this.storeGameSettings();
    }

    /**
     * Store game settings in sessionStorage for persistence
     */
    storeGameSettings() {
        try {
            sessionStorage.setItem('finalScoreGameSettings', JSON.stringify(this.gameSettings));
        } catch (e) {
            console.warn('Error storing game settings:', e);
        }
    }

    /**
     * Setup event listeners for Play Again and Menu buttons
     */
    setupButtonListeners() {
        const playAgainBtn = document.getElementById('playAgainBtn');
        const menuBtn = document.getElementById('menuBtn');

        if (playAgainBtn) {
            // Remove existing onclick and add our custom handler
            playAgainBtn.onclick = null;
            playAgainBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handlePlayAgain();
            });
        }

        if (menuBtn) {
            // Remove existing onclick and add our custom handler
            menuBtn.onclick = null;
            menuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleReturnToMenu();
            });
        }
    }

    /**
     * Handle Play Again button - preserves all game settings
     */
    handlePlayAgain() {
        console.log('Play Again clicked with settings:', this.gameSettings);

        // Clear previous game artifacts
        sessionStorage.removeItem('gameArtifacts');

        // Build URL parameters with all game settings preserved
        const params = new URLSearchParams();
        params.append('round', '1');
        params.append('totalScore', '0');
        params.append('scores', '[]');

        // Add timer settings if enabled
        if (this.gameSettings.timerEnabled && this.gameSettings.timerSeconds) {
            params.append('timerSeconds', this.gameSettings.timerSeconds.toString());
            console.log('Adding timer to Play Again:', this.gameSettings.timerSeconds);
        }

        // Add timeframe settings if enabled
        if (this.gameSettings.timeframeEnabled && 
            this.gameSettings.timeframeMinIndex !== null && 
            this.gameSettings.timeframeMaxIndex !== null) {
            params.append('timeframeMinIndex', this.gameSettings.timeframeMinIndex.toString());
            params.append('timeframeMaxIndex', this.gameSettings.timeframeMaxIndex.toString());
            console.log('Adding timeframe to Play Again:', this.gameSettings.timeframeMinIndex, '-', this.gameSettings.timeframeMaxIndex);
        }

        // Navigate to guess page with all settings preserved
        const targetUrl = `guess.html?${params.toString()}`;
        console.log('Play Again navigating to:', targetUrl);
        window.location.href = targetUrl;
    }

    /**
     * Handle Return to Menu button - stores settings for menu to restore
     */
    handleReturnToMenu() {
        console.log('Return to Menu clicked with settings:', this.gameSettings);

        // Store settings in a special key for the menu to read
        try {
            sessionStorage.setItem('menuRestoreSettings', JSON.stringify(this.gameSettings));
            console.log('Stored settings for menu restoration');
        } catch (e) {
            console.warn('Error storing settings for menu restoration:', e);
        }

        // Navigate to index page
        window.location.href = 'index.html';
    }

    /**
     * Static method to restore settings on the index page
     * This should be called by index.html after the IndexGameSettings is initialized
     */
    static restoreMenuSettings() {
        try {
            const settingsJson = sessionStorage.getItem('menuRestoreSettings');
            if (!settingsJson) {
                console.log('No settings to restore on menu');
                return;
            }

            const settings = JSON.parse(settingsJson);
            console.log('Restoring menu settings:', settings);

            // Get the IndexGameSettings instance
            const indexSettings = window.indexGameSettings;
            if (!indexSettings) {
                console.warn('IndexGameSettings not available for restoration');
                return;
            }

            // Restore timer settings
            if (settings.timerEnabled && settings.timerSeconds) {
                FinalScoreLogic.restoreTimerSettings(indexSettings, settings);
            }

            // Restore timeframe settings
            if (settings.timeframeEnabled && 
                settings.timeframeMinIndex !== null && 
                settings.timeframeMaxIndex !== null) {
                FinalScoreLogic.restoreTimeframeSettings(indexSettings, settings);
            }

            // Clear the restore settings after use
            sessionStorage.removeItem('menuRestoreSettings');
            console.log('Menu settings restoration complete');

        } catch (e) {
            console.warn('Error restoring menu settings:', e);
            // Clear corrupted settings
            sessionStorage.removeItem('menuRestoreSettings');
        }
    }

    /**
     * Restore timer settings on the index page
     */
    static restoreTimerSettings(indexSettings, settings) {
        try {
            // Find the timer increment index
            const timerIncrements = indexSettings.timerIncrements;
            const timerIndex = timerIncrements.indexOf(settings.timerSeconds);
            
            if (timerIndex === -1) {
                console.warn('Timer value not found in increments:', settings.timerSeconds);
                return;
            }

            // Set the timer button to "yes"
            const timerButtons = document.querySelectorAll('[data-timer]');
            timerButtons.forEach(btn => btn.classList.remove('active'));
            const timerYesBtn = document.querySelector('[data-timer="yes"]');
            if (timerYesBtn) {
                timerYesBtn.classList.add('active');
            }

            // Set the timer slider value
            const timeRange = document.getElementById('timeRange');
            if (timeRange) {
                timeRange.value = timerIndex;
                indexSettings.updateTimerSlider();
            }

            // Show the timer slider
            const timeSlider = document.getElementById('timeSlider');
            if (timeSlider) {
                timeSlider.classList.remove('hidden');
                // Use a small delay to ensure smooth animation
                setTimeout(() => {
                    timeSlider.style.opacity = '1';
                    timeSlider.style.transform = 'translateY(0)';
                }, 50);
            }

            console.log('Timer settings restored:', settings.timerSeconds, 'seconds');
        } catch (e) {
            console.warn('Error restoring timer settings:', e);
        }
    }

    /**
     * Restore timeframe settings on the index page
     */
    static restoreTimeframeSettings(indexSettings, settings) {
        try {
            // Set the timeframe button to "flexible"
            const timeframeButtons = document.querySelectorAll('[data-timeframe]');
            timeframeButtons.forEach(btn => btn.classList.remove('active'));
            const timeframeFlexibleBtn = document.querySelector('[data-timeframe="flexible"]');
            if (timeframeFlexibleBtn) {
                timeframeFlexibleBtn.classList.add('active');
            }

            // Set the timeframe slider values
            const timeframeMin = document.getElementById('timeframeMin');
            const timeframeMax = document.getElementById('timeframeMax');
            
            if (timeframeMin && timeframeMax) {
                timeframeMin.value = settings.timeframeMinIndex;
                timeframeMax.value = settings.timeframeMaxIndex;
                indexSettings.updateTimeframeSlider();
            }

            // Show the timeframe slider
            const timeframeSlider = document.getElementById('timeframeSlider');
            if (timeframeSlider) {
                timeframeSlider.classList.remove('hidden');
                // Use a small delay to ensure smooth animation
                setTimeout(() => {
                    timeframeSlider.style.opacity = '1';
                    timeframeSlider.style.transform = 'translateY(0)';
                }, 50);
            }

            console.log('Timeframe settings restored:', settings.timeframeMinIndex, '-', settings.timeframeMaxIndex);
        } catch (e) {
            console.warn('Error restoring timeframe settings:', e);
        }
    }

    /**
     * Get current game settings
     */
    getGameSettings() {
        return { ...this.gameSettings };
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.finalScoreLogic = new FinalScoreLogic();
    });
} else {
    window.finalScoreLogic = new FinalScoreLogic();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FinalScoreLogic;
}