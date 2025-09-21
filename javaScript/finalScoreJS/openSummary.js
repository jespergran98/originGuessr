// Summary mode handler for Origin Guessr final score page
class SummaryHandler {
    constructor() {
        this.isSummaryMode = false;
        this.originalElements = {};
        this.exitButton = null;
        this.summaryPanel = null;
        this.animationDuration = 800;
        this.staggerDelay = 50;
        this.roundResultStorage = null;
        this.isInitializing = false;
        this.loadingRetries = 0;
        this.maxRetries = 30; // 3 seconds max wait
        
        this.initialize();
    }

    initialize() {
        if (this.isInitializing) return;
        this.isInitializing = true;
        
        // Ensure buttons are visible immediately
        this.makeButtonsVisible();
        
        // Wait for the final score display to be ready
        this.waitForFinalScoreDisplay(() => {
            this.attachSummaryListener();
            this.loadDependencies();
            this.isInitializing = false;
        });
    }

    makeButtonsVisible() {
        // Force buttons to be visible immediately on page load
        const makeVisible = () => {
            const buttons = document.querySelectorAll('.final-score-button');
            buttons.forEach(button => {
                button.style.opacity = '1';
                button.style.transform = 'scale(1) translateY(0px)';
                button.style.pointerEvents = 'auto';
            });
        };
        
        // Try immediately and also after DOM is ready
        makeVisible();
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', makeVisible);
        } else {
            setTimeout(makeVisible, 50); // Small delay to ensure elements exist
        }
    }

    waitForFinalScoreDisplay(callback, retries = 0) {
        if (window.finalScoreDisplay && window.finalScoreDisplay.summaryBtn) {
            callback();
            return;
        }
        
        if (retries < this.maxRetries) {
            setTimeout(() => this.waitForFinalScoreDisplay(callback, retries + 1), 100);
        } else {
            console.warn('Final score display not found after maximum retries');
            this.isInitializing = false;
        }
    }

    loadDependencies() {
        // Wait for round result storage to be available
        if (window.roundResultStorage) {
            this.roundResultStorage = window.roundResultStorage;
            console.log('Dependencies loaded successfully');
            return;
        }
        
        if (this.loadingRetries < this.maxRetries) {
            this.loadingRetries++;
            setTimeout(() => this.loadDependencies(), 100);
        } else {
            console.warn('Round result storage not available after maximum retries');
        }
    }

    attachSummaryListener() {
        const summaryBtn = window.finalScoreDisplay?.summaryBtn;
        if (!summaryBtn) {
            console.error('Summary button not found');
            return;
        }

        // Remove existing click listeners and add our own
        summaryBtn.onclick = null;
        summaryBtn.replaceWith(summaryBtn.cloneNode(true));
        
        // Get the fresh button reference
        const newSummaryBtn = document.getElementById('summaryBtn') || 
                            document.querySelector('[id="summaryBtn"]') ||
                            window.finalScoreDisplay.summaryBtn;
        
        if (newSummaryBtn) {
            newSummaryBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleSummaryMode();
            });
            console.log('Summary button listener attached');
        }
    }

    toggleSummaryMode() {
        if (this.isInitializing) {
            console.log('Still initializing, please wait...');
            return;
        }
        
        if (this.isSummaryMode) {
            this.exitSummaryMode();
        } else {
            this.enterSummaryMode();
        }
    }

    enterSummaryMode() {
        if (this.isSummaryMode) return;
        
        console.log('Entering summary mode...');
        this.isSummaryMode = true;
        
        // Store original elements for restoration
        this.storeOriginalElements();
        
        // Animate out all UI elements
        this.animateOutElements();
        
        // Create and show exit button and summary panel after animation
        setTimeout(() => {
            this.createExitButton();
            this.createSummaryPanel();
            this.hideMapOverlay();
        }, this.animationDuration + 200);
    }

    exitSummaryMode() {
        if (!this.isSummaryMode) return;
        
        console.log('Exiting summary mode...');
        this.isSummaryMode = false;
        
        // Remove exit button and summary panel
        this.removeExitButton();
        this.removeSummaryPanel();
        
        // Restore map overlay
        this.showMapOverlay();
        
        // Animate in all UI elements
        setTimeout(() => {
            this.animateInElements();
        }, 100);
    }

    storeOriginalElements() {
        // Store references to all UI elements that need to be hidden
        this.originalElements = {
            mainContainer: document.querySelector('.main-container'),
            headerSection: document.querySelector('.header-section'),
            scoreSection: document.querySelector('.score-section'),
            buttonContainer: document.querySelector('.button-container'),
            particleCanvas: document.getElementById('particleCanvas'),
            mapOverlay: document.querySelector('.map-overlay')
        };
        
        // Filter out null elements
        Object.keys(this.originalElements).forEach(key => {
            if (!this.originalElements[key]) {
                console.warn(`Original element not found: ${key}`);
                delete this.originalElements[key];
            }
        });
    }
    
    animateOutElements() {
        const elementsToAnimate = [
            this.originalElements.headerSection,
            this.originalElements.scoreSection,
            this.originalElements.buttonContainer,
            this.originalElements.particleCanvas
        ].filter(el => el);
    
        if (elementsToAnimate.length === 0) {
            console.warn('No elements found to animate out');
            return;
        }
    
        // Special handling for button container to animate individual buttons
        const buttonContainer = this.originalElements.buttonContainer;
        if (buttonContainer) {
            const buttons = buttonContainer.querySelectorAll('.final-score-button');
            buttons.forEach((button, index) => {
                setTimeout(() => {
                    button.classList.add('animate-out');
                }, index * (this.staggerDelay / 2));
            });
        }
    
        // Animate each element out with stagger
        elementsToAnimate.forEach((element, index) => {
            setTimeout(() => {
                this.animateElementOut(element);
            }, index * this.staggerDelay);
        });
    
        // Remove main container from DOM after animation completes to allow map interaction
        const mainContainer = this.originalElements.mainContainer;
        if (mainContainer) {
            setTimeout(() => {
                // Store the parent and next sibling for restoration
                this.originalElements.mainContainerParent = mainContainer.parentNode;
                this.originalElements.mainContainerNextSibling = mainContainer.nextSibling;
                
                // Remove from DOM to allow map interaction
                mainContainer.remove();
                console.log('Main container removed from DOM - map is now interactable');
            }, this.animationDuration + 100);
        }
    }
    
    animateInElements() {
        // Restore main container to DOM first
        const mainContainer = this.originalElements.mainContainer;
        const mainContainerParent = this.originalElements.mainContainerParent;
        const mainContainerNextSibling = this.originalElements.mainContainerNextSibling;
        
        if (mainContainer && mainContainerParent) {
            // Restore the main container to its original position in DOM
            if (mainContainerNextSibling) {
                mainContainerParent.insertBefore(mainContainer, mainContainerNextSibling);
            } else {
                mainContainerParent.appendChild(mainContainer);
            }
            
            // Clear the stored references
            delete this.originalElements.mainContainerParent;
            delete this.originalElements.mainContainerNextSibling;
            
            console.log('Main container restored to DOM');
        }
    
        const elementsToAnimate = [
            this.originalElements.headerSection,
            this.originalElements.scoreSection,
            this.originalElements.buttonContainer,
            this.originalElements.particleCanvas
        ].filter(el => el);
    
        if (elementsToAnimate.length === 0) {
            console.warn('No elements found to animate in');
            return;
        }
    
        // Special handling for button container to animate individual buttons
        const buttonContainer = this.originalElements.buttonContainer;
        if (buttonContainer) {
            const buttons = buttonContainer.querySelectorAll('.final-score-button');
            buttons.forEach((button, index) => {
                // Remove animate-out class and add animate-in
                button.classList.remove('animate-out');
                setTimeout(() => {
                    button.classList.add('animate-in');
                }, index * (this.staggerDelay / 2));
            });
        }
    
        // Animate each element in with reverse stagger
        elementsToAnimate.reverse().forEach((element, index) => {
            setTimeout(() => {
                this.animateElementIn(element);
            }, index * this.staggerDelay);
        });
    }

    animateElementOut(element) {
        if (!element) return;
        
        element.style.transition = `all ${this.animationDuration}ms cubic-bezier(0.4, 0, 0.6, 1)`;
        element.style.opacity = '0';
        element.style.transform = 'translateY(-30px) scale(0.95)';
        element.style.pointerEvents = 'none';
    }

    animateElementIn(element) {
        if (!element) return;
        
        element.style.transition = `all ${this.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        element.style.opacity = '1';
        element.style.transform = 'translateY(0) scale(1)';
        element.style.pointerEvents = 'auto';
    }

    createExitButton() {
        if (this.exitButton) {
            console.warn('Exit button already exists');
            return;
        }

        // Create the exit button
        this.exitButton = document.createElement('button');
        this.exitButton.className = 'exit-summary-button';
        this.exitButton.setAttribute('aria-label', 'Exit Summary View');
        this.exitButton.innerHTML = `
            <span class="btn-text">Exit Summary</span>
            <svg class="exit-btn-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
        `;
        
        // Add hover effects
        this.exitButton.addEventListener('mouseenter', () => {
            if (this.exitButton) {
                this.exitButton.style.transform = 'translateY(-3px) scale(1.02)';
            }
        });
        
        this.exitButton.addEventListener('mouseleave', () => {
            if (this.exitButton) {
                this.exitButton.style.transform = 'translateY(0) scale(1)';
            }
        });
        
        // Add click handler with ripple effect
        this.exitButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.createRipple(e);
            setTimeout(() => this.exitSummaryMode(), 150);
        });
        
        // Add keyboard support
        this.exitButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.exitButton.click();
            }
        });
        
        // Add to page
        document.body.appendChild(this.exitButton);
        
        // Animate in
        setTimeout(() => {
            if (this.exitButton) {
                this.exitButton.style.opacity = '1';
                this.exitButton.style.transform = 'translateY(0)';
                this.exitButton.style.pointerEvents = 'auto';
                this.exitButton.focus(); // Focus for accessibility
            }
        }, 100);
        
        console.log('Exit summary button created');
    }

    createSummaryPanel() {
        if (this.summaryPanel) {
            console.warn('Summary panel already exists');
            return;
        }

        // Create the summary panel container
        this.summaryPanel = document.createElement('div');
        this.summaryPanel.className = 'summary-panel';
        this.summaryPanel.setAttribute('role', 'dialog');
        this.summaryPanel.setAttribute('aria-label', 'Game Summary');
        
        // Get game results from storage
        const gameResults = this.getGameResults();
        
        // Build the panel content
        const content = this.buildSummaryContent(gameResults);
        this.summaryPanel.innerHTML = content;
        
        // Add to page
        document.body.appendChild(this.summaryPanel);
        
        // Animate in the panel
        setTimeout(() => {
            if (this.summaryPanel) {
                this.summaryPanel.classList.add('visible');
                
                // Animate in individual round cards with stagger
                const roundCards = this.summaryPanel.querySelectorAll('.summary-round');
                roundCards.forEach((card, index) => {
                    setTimeout(() => {
                        if (card) {
                            card.classList.add('animated');
                        }
                    }, index * 100);
                });
            }
        }, 200);
        
        console.log('Summary panel created with game data');
    }

    getGameResults() {
        if (!this.roundResultStorage) {
            console.warn('Round result storage not available');
            return null;
        }

        try {
            const gameResults = this.roundResultStorage.getGameResults();
            console.log('Retrieved game results for summary:', gameResults);
            return gameResults;
        } catch (error) {
            console.error('Error retrieving game results:', error);
            return null;
        }
    }

    buildSummaryContent(gameResults) {
        if (!gameResults || !gameResults.rounds || gameResults.rounds.length === 0) {
            return this.buildEmptyContent('No round data available');
        }

        // Filter valid rounds with complete data
        const validRounds = gameResults.rounds.filter(round => this.isValidRound(round));

        if (validRounds.length === 0) {
            return this.buildEmptyContent('No complete round data available');
        }

        // Calculate total score with validation
        const totalScore = this.calculateTotalScore(gameResults, validRounds);

        // Build header
        const headerHTML = this.buildHeaderHTML(totalScore);

        // Build rounds HTML
        const roundsHTML = this.buildRoundsHTML(validRounds);

        return headerHTML + roundsHTML;
    }

    buildEmptyContent(message) {
        return `
            <div class="summary-header">
                <h3 class="summary-title">Game Summary</h3>
                <div class="summary-total-score">0/50,000</div>
            </div>
            <div class="summary-no-data">
                ${this.escapeHtml(message)}
            </div>
        `;
    }

    buildHeaderHTML(totalScore) {
        return `
            <div class="summary-header">
                <h3 class="summary-title">Game Summary</h3>
                <div class="summary-total-score">${this.formatNumber(totalScore)}/50,000</div>
            </div>
        `;
    }

    buildRoundsHTML(validRounds) {
        const roundsHtml = validRounds
            .map((round, index) => this.buildRoundCard(round, round.roundNumber || index + 1))
            .join('');
        
        return `
            <div class="summary-rounds">
                ${roundsHtml}
            </div>
        `;
    }

    isValidRound(round) {
        return round && 
               round.artifact && 
               round.userGuess && 
               round.scores &&
               typeof round.artifact.lat === 'number' &&
               typeof round.artifact.lng === 'number' &&
               typeof round.userGuess.lat === 'number' &&
               typeof round.userGuess.lng === 'number' &&
               !isNaN(round.artifact.lat) &&
               !isNaN(round.artifact.lng) &&
               !isNaN(round.userGuess.lat) &&
               !isNaN(round.userGuess.lng);
    }

    calculateTotalScore(gameResults, validRounds) {
        if (typeof gameResults.finalScore === 'number' && gameResults.finalScore >= 0) {
            return gameResults.finalScore;
        }
        
        return validRounds.reduce((sum, round) => {
            const roundScore = round.scores.totalScore || 0;
            return sum + (typeof roundScore === 'number' ? roundScore : 0);
        }, 0);
    }

    buildRoundCard(roundData, roundNumber) {
        const artifact = roundData.artifact;
        const userGuess = roundData.userGuess;
        const scores = roundData.scores;
        const stats = roundData.statistics;

        // Calculate distance and year errors with error handling
        const { distanceError, yearError } = this.calculateErrors(artifact, userGuess, stats);
        
        // Get image with fallback and validation
        const imageUrl = this.getValidImageUrl(artifact.image);
        const fallbackSvg = this.getFallbackImageSvg();

        return `
            <div class="summary-round" role="listitem">
                <img class="summary-round-image" 
                     src="${this.escapeHtml(imageUrl)}" 
                     alt="Artifact from round ${roundNumber}"
                     loading="lazy"
                     onerror="this.src='${fallbackSvg}';">
                <div class="summary-round-info">
                    <div class="summary-round-number">Round ${roundNumber}</div>
                    <div class="summary-round-stats">
                        <div class="summary-stat score">
                            <span class="summary-stat-label">Score:</span>
                            <span class="summary-stat-value">${this.formatNumber(scores.totalScore || 0)}</span>
                        </div>
                        <div class="summary-stat distance">
                            <span class="summary-stat-label">Distance away:</span>
                            <span class="summary-stat-value">${this.escapeHtml(distanceError)}</span>
                        </div>
                        <div class="summary-stat year">
                            <span class="summary-stat-label">Years off:</span>
                            <span class="summary-stat-value">${this.escapeHtml(yearError)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    calculateErrors(artifact, userGuess, stats) {
        let distanceError = 'Unknown';
        let yearError = 'Unknown';

        try {
            if (stats && stats.distanceErrorFormatted && stats.yearErrorFormatted) {
                distanceError = stats.distanceErrorFormatted;
                yearError = stats.yearErrorFormatted;
            } else if (artifact && userGuess) {
                // Calculate on the fly with error handling
                const distance = this.calculateDistance(
                    artifact.lat, artifact.lng, userGuess.lat, userGuess.lng
                );
                
                if (!isNaN(distance) && distance >= 0) {
                    distanceError = this.formatDistance(distance);
                }
                
                const yearDiff = Math.abs((artifact.year || 0) - (userGuess.year || 0));
                if (!isNaN(yearDiff)) {
                    yearError = `${yearDiff.toLocaleString()} years`;
                }
            }
        } catch (error) {
            console.error('Error calculating round errors:', error);
        }

        return { distanceError, yearError };
    }

    getValidImageUrl(imageUrl) {
        if (typeof imageUrl === 'string' && imageUrl.trim().length > 0) {
            // Basic URL validation
            try {
                new URL(imageUrl);
                return imageUrl;
            } catch {
                // If URL is invalid, return fallback
                return this.getFallbackImageSvg();
            }
        }
        return this.getFallbackImageSvg();
    }

    getFallbackImageSvg() {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMjAyMDIwIi8+Cjx0ZXh0IHg9IjQwIiB5PSI0NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5RUU5OSIgZm9udC1zaXplPSIxMiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K';
    }

    escapeHtml(text) {
        if (typeof text !== 'string') {
            return String(text || '');
        }
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatNumber(num) {
        if (typeof num !== 'number' || isNaN(num)) {
            return '0';
        }
        return Math.max(0, num).toLocaleString();
    }

    formatDistance(distanceKm) {
        if (typeof distanceKm !== 'number' || isNaN(distanceKm) || distanceKm < 0) {
            return 'Unknown';
        }
        
        if (distanceKm < 1) {
            return `${Math.round(distanceKm * 1000)}m`;
        } else if (distanceKm < 100) {
            return `${distanceKm.toFixed(1)}km`;
        } else {
            return `${Math.round(distanceKm)}km`;
        }
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        try {
            // Validate inputs
            if ([lat1, lng1, lat2, lng2].some(coord => 
                typeof coord !== 'number' || isNaN(coord) || 
                Math.abs(coord) > 180
            )) {
                throw new Error('Invalid coordinates');
            }

            const R = 6371; // Earth's radius in kilometers
            const dLat = this.toRadians(lat2 - lat1);
            const dLng = this.toRadians(lng2 - lng1);

            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                      Math.sin(dLng / 2) * Math.sin(dLng / 2);

            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;
            
            return distance >= 0 ? distance : 0;
        } catch (error) {
            console.error('Error calculating distance:', error);
            return NaN;
        }
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    removeExitButton() {
        if (this.exitButton) {
            // Animate out
            this.exitButton.style.opacity = '0';
            this.exitButton.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                if (this.exitButton && this.exitButton.parentNode) {
                    try {
                        this.exitButton.parentNode.removeChild(this.exitButton);
                    } catch (error) {
                        console.warn('Error removing exit button:', error);
                    }
                }
                this.exitButton = null;
            }, 300);
        }
    }

    removeSummaryPanel() {
        if (this.summaryPanel) {
            // Animate out
            this.summaryPanel.classList.remove('visible');
            
            setTimeout(() => {
                if (this.summaryPanel && this.summaryPanel.parentNode) {
                    try {
                        this.summaryPanel.parentNode.removeChild(this.summaryPanel);
                    } catch (error) {
                        console.warn('Error removing summary panel:', error);
                    }
                }
                this.summaryPanel = null;
            }, 600);
        }
    }

    hideMapOverlay() {
        const mapOverlay = this.originalElements.mapOverlay;
        if (mapOverlay) {
            mapOverlay.style.transition = `opacity ${this.animationDuration}ms ease-out`;
            mapOverlay.style.opacity = '0';
            mapOverlay.style.pointerEvents = 'none';
        }
    }

    showMapOverlay() {
        const mapOverlay = this.originalElements.mapOverlay;
        if (mapOverlay) {
            mapOverlay.style.transition = `opacity ${this.animationDuration}ms ease-in`;
            mapOverlay.style.opacity = '1';
            mapOverlay.style.pointerEvents = 'auto';
        }
    }

    createRipple(event) {
        if (!event || !event.currentTarget) return;
        
        try {
            const button = event.currentTarget;
            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = event.clientX - rect.left - size / 2;
            const y = event.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: radial-gradient(circle, rgba(153, 238, 153, 0.3) 0%, transparent 70%);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;
            
            // Add ripple animation if not already defined
            this.ensureRippleStyles();
            
            button.appendChild(ripple);
            
            setTimeout(() => {
                if (ripple && ripple.parentNode) {
                    try {
                        ripple.parentNode.removeChild(ripple);
                    } catch (error) {
                        console.warn('Error removing ripple:', error);
                    }
                }
            }, 600);
        } catch (error) {
            console.error('Error creating ripple effect:', error);
        }
    }

    ensureRippleStyles() {
        if (!document.getElementById('ripple-styles')) {
            const style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Public methods
    getCurrentMode() {
        return this.isSummaryMode ? 'summary' : 'normal';
    }

    isSummaryActive() {
        return this.isSummaryMode;
    }

    // Refresh summary panel with updated data
    refreshSummaryData() {
        if (this.isSummaryMode && this.summaryPanel) {
            try {
                const gameResults = this.getGameResults();
                const newContent = this.buildSummaryContent(gameResults);
                this.summaryPanel.innerHTML = newContent;
                
                // Re-animate the round cards
                const roundCards = this.summaryPanel.querySelectorAll('.summary-round');
                roundCards.forEach((card, index) => {
                    setTimeout(() => {
                        if (card) {
                            card.classList.add('animated');
                        }
                    }, index * 50);
                });
                
                console.log('Summary data refreshed');
            } catch (error) {
                console.error('Error refreshing summary data:', error);
            }
        }
    }

    // Force exit summary mode (emergency cleanup)
    forceExit() {
        console.log('Force exiting summary mode...');
        this.isSummaryMode = false;
        this.cleanup();
    }

    // Cleanup method
    cleanup() {
        try {
            if (this.exitButton && this.exitButton.parentNode) {
                this.exitButton.parentNode.removeChild(this.exitButton);
            }
            if (this.summaryPanel && this.summaryPanel.parentNode) {
                this.summaryPanel.parentNode.removeChild(this.summaryPanel);
            }
            
            // Clean up animation classes from buttons
            const buttonContainer = document.querySelector('.button-container');
            if (buttonContainer) {
                const buttons = buttonContainer.querySelectorAll('.final-score-button');
                buttons.forEach(button => {
                    button.classList.remove('animate-in', 'animate-out');
                });
            }
        } catch (error) {
            console.warn('Error during cleanup:', error);
        }
        
        this.exitButton = null;
        this.summaryPanel = null;
        this.originalElements = {};
        this.isSummaryMode = false;
        this.roundResultStorage = null;
        this.isInitializing = false;
        this.loadingRetries = 0;
    }
}

// Singleton pattern to prevent multiple instances
let summaryHandlerInstance = null;

function initializeSummaryHandler() {
    if (!summaryHandlerInstance) {
        summaryHandlerInstance = new SummaryHandler();
        window.summaryHandler = summaryHandlerInstance;
        console.log('Summary handler initialized');
    }
    return summaryHandlerInstance;
}

// Initialize the summary handler
const summaryHandler = initializeSummaryHandler();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (summaryHandlerInstance) {
        summaryHandlerInstance.cleanup();
        summaryHandlerInstance = null;
        window.summaryHandler = null;
    }
});

// Handle page visibility changes for better resource management
document.addEventListener('visibilitychange', () => {
    if (document.hidden && summaryHandlerInstance && summaryHandlerInstance.isSummaryActive()) {
        console.log('Page hidden while in summary mode - maintaining state');
    }
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SummaryHandler, initializeSummaryHandler };
}