// Final Score Map - Display all round results using roundResultStorage data
class FinalScoreMap {
    constructor() {
        this.map = null;
        this.markers = [];
        this.roundResultStorage = null;
        this.isInitialized = false;
        this.eventListeners = [];
        
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupMap());
        } else {
            this.setupMap();
        }
    }

    setupMap() {
        this.waitForDependencies(() => {
            this.loadGameResults();
            this.displayAllRounds();
        });
    }

    waitForDependencies(callback) {
        // Wait for both map and roundResultStorage to be available
        if (typeof map !== 'undefined' && map && window.roundResultStorage) {
            this.map = map;
            this.roundResultStorage = window.roundResultStorage;
            callback();
            return;
        }
        setTimeout(() => this.waitForDependencies(callback), 100);
    }

    loadGameResults() {
        if (!this.roundResultStorage) {
            console.warn('Round result storage not available');
            return;
        }

        this.gameResults = this.roundResultStorage.getGameResults();
        console.log('Loaded game results for final score map:', this.gameResults);
    }

    displayAllRounds() {
        if (!this.gameResults || !this.gameResults.rounds || this.gameResults.rounds.length === 0) {
            console.warn('No round data available for final score map display');
            this.displayFallbackView();
            return;
        }

        // Clear any existing markers
        this.clearAll();

        // Get valid rounds with complete data
        const validRounds = this.gameResults.rounds.filter(round => this.isValidRoundData(round));
        
        if (validRounds.length === 0) {
            console.warn('No valid round data found');
            this.displayFallbackView();
            return;
        }

        // Calculate optimal view to show all points
        this.setOptimalView(validRounds);

        // Display each round
        validRounds.forEach((roundData, index) => {
            this.displayRound(roundData, roundData.roundNumber || index + 1);
        });

        this.isInitialized = true;
        console.log(`Displayed ${validRounds.length} rounds on final score map`);
    }

    displayRound(roundData, roundNumber) {
        const artifact = roundData.artifact;
        const userGuess = roundData.userGuess;
        
        if (!artifact || !userGuess) {
            console.warn(`Incomplete data for round ${roundNumber}`);
            return;
        }

        // Create stippled line overlay (same as result page)
        this.createStippledLine(
            { lat: userGuess.lat, lng: userGuess.lng },
            { lat: artifact.lat, lng: artifact.lng },
            roundNumber
        );

        // Add user guess marker (same style as result page)
        this.addGuessMarker(userGuess.lat, userGuess.lng, roundNumber);

        // Add correct location marker (same style as result page)
        this.addCorrectLocationMarker(artifact.lat, artifact.lng, roundNumber);
    }

    createStippledLine(start, end, roundNumber) {
        const overlay = document.createElement('div');
        overlay.className = `stippled-line-overlay round-${roundNumber}`;
        overlay.innerHTML = '<svg class="line-svg"><path class="stippled-path"></path></svg>';
        overlay.style.zIndex = '500';
        
        this.map.getContainer().appendChild(overlay);
        this.markers.push(overlay); // Store for cleanup

        // Draw the line
        this.updateLinePath(overlay, start, end);

        // Bind to map events for line updates during zoom/pan (enhanced version)
        this.bindLineUpdates(overlay, start, end);
    }

    bindLineUpdates(overlay, start, end) {
        const updateLine = () => {
            requestAnimationFrame(() => {
                this.updateLinePath(overlay, start, end);
            });
        };
        
        const events = ['move', 'zoom', 'zoomstart', 'zoomend', 'viewreset', 'resize'];
        
        events.forEach(event => {
            this.map.on(event, updateLine);
            this.eventListeners.push({ event, handler: updateLine, overlay });
        });

        const handleZoomAnimation = () => {
            if (this.map.isZooming && this.map.isZooming()) {
                this.updateLinePath(overlay, start, end);
                requestAnimationFrame(handleZoomAnimation);
            }
        };

        const zoomStartHandler = () => {
            requestAnimationFrame(handleZoomAnimation);
        };

        this.map.on('zoomstart', zoomStartHandler);
        this.eventListeners.push({ event: 'zoomstart', handler: zoomStartHandler, overlay });
    }

    updateLinePath(overlay, start, end) {
        if (!overlay || !this.map) return;
        
        const startPoint = this.map.latLngToContainerPoint([start.lat, start.lng]);
        const endPoint = this.map.latLngToContainerPoint([end.lat, end.lng]);
        
        const path = overlay.querySelector('.stippled-path');
        if (path) {
            path.setAttribute('d', `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`);
        }
    }

    addGuessMarker(lat, lng, roundNumber) {
        const icon = L.divIcon({
            html: `
                <div class="custom-marker">
                    <svg viewBox="0 0 32 48" class="marker-svg">
                        <path class="marker-body" d="M16 2C23 2 29 8 29 16C29 24 16 46 16 46C16 46 3 24 3 16C3 8 9 2 16 2Z"/>
                        <circle class="marker-pin" cx="16" cy="16" r="5"/>
                    </svg>
                    <div class="marker-label">${roundNumber}</div>
                </div>
            `,
            className: `guess-marker-container round-${roundNumber}`,
            iconSize: [32, 48],
            iconAnchor: [16, 48]
        });

        const marker = L.marker([lat, lng], { 
            icon,
            zIndexOffset: 1000 + roundNumber
        }).addTo(this.map);

        this.markers.push(marker);
    }

    addCorrectLocationMarker(lat, lng, roundNumber) {
        const icon = L.divIcon({
            html: `
                <div class="correct-location-marker">
                    <svg viewBox="0 0 36 48" class="flag-svg">
                        <rect class="flag-pole" x="6" y="8" width="2.5" height="40"/>
                        <path class="flag-fabric" d="M8.5 10 L28 10 L25 16 L28 22 L8.5 22 Z"/>
                        <circle class="flag-pole" cx="7.25" cy="8" r="1.5"/>
                    </svg>
                    <div class="flag-label">${roundNumber}</div>
                </div>
            `,
            className: `correct-marker-container round-${roundNumber}`,
            iconSize: [36, 48],
            iconAnchor: [7.25, 48]
        });

        const marker = L.marker([lat, lng], { 
            icon,
            zIndexOffset: 2000 + roundNumber
        }).addTo(this.map);

        this.markers.push(marker);
    }

    setOptimalView(validRounds) {
        const coordinates = [];
        
        validRounds.forEach(round => {
            coordinates.push([round.artifact.lat, round.artifact.lng]);
            coordinates.push([round.userGuess.lat, round.userGuess.lng]);
        });

        if (coordinates.length === 0) {
            this.map.setView([20, 0], 2);
            return;
        }

        try {
            // Find the extreme coordinates to create the perfect fit
            const lats = coordinates.map(coord => coord[0]);
            const lngs = coordinates.map(coord => coord[1]);
            
            const northernmost = Math.max(...lats);
            const southernmost = Math.min(...lats);
            const easternmost = Math.max(...lngs);
            const westernmost = Math.min(...lngs);
            
            // Create bounds with the exact extremes
            const bounds = L.latLngBounds(
                [southernmost, westernmost], // southwest corner
                [northernmost, easternmost]  // northeast corner
            );
            
            // Add a tiny margin (2% padding) for perfect fit
            const paddedBounds = bounds.pad(0.02);
            
            // Fit the bounds without zoom restrictions for perfect fit
            this.map.fitBounds(paddedBounds, {
                padding: [15, 15] // Small pixel padding for marker visibility at edges
            });
            
            console.log(`Final score map bounds - N:${northernmost.toFixed(4)}, S:${southernmost.toFixed(4)}, E:${easternmost.toFixed(4)}, W:${westernmost.toFixed(4)}`);
            
        } catch (error) {
            console.warn('Could not set optimal view:', error);
            this.map.setView([20, 0], 2);
        }
    }

    isValidRoundData(round) {
        return round && 
               round.artifact && 
               round.userGuess &&
               typeof round.artifact.lat === 'number' &&
               typeof round.artifact.lng === 'number' &&
               typeof round.userGuess.lat === 'number' &&
               typeof round.userGuess.lng === 'number' &&
               !isNaN(round.artifact.lat) &&
               !isNaN(round.artifact.lng) &&
               !isNaN(round.userGuess.lat) &&
               !isNaN(round.userGuess.lng);
    }

    displayFallbackView() {
        // Set a default world view if no data is available
        this.map.setView([20, 0], 2);
        console.log('Displayed fallback world view');
    }

    clearAll() {
        // Clean up event listeners first
        this.eventListeners.forEach(({ event, handler }) => {
            this.map && this.map.off(event, handler);
        });
        this.eventListeners = [];

        this.markers.forEach(marker => {
            if (marker instanceof L.Marker && this.map) {
                this.map.removeLayer(marker);
            } else if (marker && marker.parentNode) {
                // Remove line overlay element
                marker.parentNode.removeChild(marker);
            }
        });
        this.markers = [];
    }

    // Public methods
    refresh() {
        if (this.isInitialized) {
            this.loadGameResults();
            this.displayAllRounds();
        }
    }

    cleanup() {
        this.clearAll();
        this.isInitialized = false;
        this.roundResultStorage = null;
    }
}

// Initialize the final score map
let finalScoreMap;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        finalScoreMap = new FinalScoreMap();
        window.finalScoreMap = finalScoreMap;
    });
} else {
    finalScoreMap = new FinalScoreMap();
    window.finalScoreMap = finalScoreMap;
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (finalScoreMap) {
        finalScoreMap.cleanup();
    }
});