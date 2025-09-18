// Final Score Map - Display all round results on background map
class FinalScoreMap {
    constructor() {
        this.map = null;
        this.markers = [];
        this.lineOverlays = [];
        this.gameData = null;
        this.isInitialized = false;
        
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
        this.waitForMap(() => {
            this.loadGameData();
            this.displayAllRounds();
        });
    }

    waitForMap(callback) {
        if (typeof map !== 'undefined' && map) {
            this.map = map;
            callback();
            return;
        }
        setTimeout(() => this.waitForMap(callback), 50);
    }

    loadGameData() {
        // Try to get data from roundLogic first
        if (window.roundLogic) {
            const stats = window.roundLogic.getFinalGameStats();
            if (stats && stats.roundData) {
                this.gameData = stats.roundData;
                return;
            }
        }

        // Fallback: try to reconstruct from URL parameters or localStorage
        this.gameData = this.reconstructGameData();
    }

    reconstructGameData() {
        // Try to get data from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const roundScoresParam = urlParams.get('roundScores');
        
        if (roundScoresParam) {
            try {
                const roundScores = JSON.parse(decodeURIComponent(roundScoresParam));
                // This gives us scores but we need coordinate data
                // For now, return null - in a real implementation, 
                // this data should be passed through the game flow
                console.warn('Round coordinate data not available from URL parameters');
                return null;
            } catch (e) {
                console.warn('Error parsing round data from URL:', e);
            }
        }

        // Try localStorage as last resort
        try {
            const storedData = localStorage.getItem('originGuesser_roundData');
            if (storedData) {
                return JSON.parse(storedData);
            }
        } catch (e) {
            console.warn('Error reading round data from localStorage:', e);
        }

        return null;
    }

    displayAllRounds() {
        if (!this.gameData || !Array.isArray(this.gameData)) {
            console.warn('No valid game data available for final score map display');
            this.displayDemoData(); // For demonstration purposes
            return;
        }

        // Clear any existing markers and lines
        this.clearAll();

        // Calculate optimal view to show all points
        const allCoordinates = this.getAllCoordinates();
        if (allCoordinates.length > 0) {
            this.setOptimalView(allCoordinates);
        }

        // Display each round
        this.gameData.forEach((roundData, index) => {
            if (this.isValidRoundData(roundData)) {
                this.displayRound(roundData, index + 1);
            }
        });

        this.isInitialized = true;
    }
    displayRound(roundData, roundNumber) {
        const { guessLat, guessLng, correctLat, correctLng } = roundData;

        // Create stippled line first (so it appears behind markers)
        this.createStippledLine(
            { lat: guessLat, lng: guessLng },
            { lat: correctLat, lng: correctLng },
            roundNumber
        );

        // Add guess marker
        this.addGuessMarker(guessLat, guessLng, roundNumber);

        // Add correct location flag
        this.addCorrectLocationFlag(correctLat, correctLng, roundNumber);
    }

    createStippledLine(start, end, roundNumber) {
        const overlay = document.createElement('div');
        overlay.className = `stippled-line-overlay round-${roundNumber}`;
        overlay.innerHTML = '<svg class="line-svg"><path class="stippled-path"></path></svg>';
        overlay.style.zIndex = '500';
        
        this.map.getContainer().appendChild(overlay);
        this.lineOverlays.push(overlay);

        // Draw the line
        this.updateLinePath(overlay, start, end);

        // Bind to map events for line updates during zoom/pan
        const updateHandler = () => this.updateLinePath(overlay, start, end);
        
        this.map.on('zoom', updateHandler);
        this.map.on('move', updateHandler);
        this.map.on('viewreset', updateHandler);
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

    addCorrectLocationFlag(lat, lng, roundNumber) {
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

    getAllCoordinates() {
        const coordinates = [];
        
        if (this.gameData && Array.isArray(this.gameData)) {
            this.gameData.forEach(round => {
                if (this.isValidRoundData(round)) {
                    coordinates.push([round.guessLat, round.guessLng]);
                    coordinates.push([round.correctLat, round.correctLng]);
                }
            });
        }
        
        return coordinates;
    }

    setOptimalView(coordinates) {
        if (coordinates.length === 0) return;

        try {
            const bounds = L.latLngBounds(coordinates);
            const paddedBounds = bounds.pad(0.1);
            
            // Use fitBounds with reasonable constraints
            this.map.fitBounds(paddedBounds, {
                maxZoom: 8, // Don't zoom in too much for final score overview
                padding: [20, 20]
            });
        } catch (error) {
            console.warn('Could not set optimal view:', error);
            // Fallback to world view
            this.map.setView([20, 0], 2);
        }
    }

    isValidRoundData(roundData) {
        return roundData && 
               typeof roundData.guessLat === 'number' &&
               typeof roundData.guessLng === 'number' &&
               typeof roundData.correctLat === 'number' &&
               typeof roundData.correctLng === 'number' &&
               !isNaN(roundData.guessLat) &&
               !isNaN(roundData.guessLng) &&
               !isNaN(roundData.correctLat) &&
               !isNaN(roundData.correctLng);
    }

    clearAll() {
        // Remove markers
        this.markers.forEach(marker => {
            if (this.map) {
                this.map.removeLayer(marker);
            }
        });
        this.markers = [];

        // Remove line overlays
        this.lineOverlays.forEach(overlay => {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        });
        this.lineOverlays = [];
    }

    // Public method to refresh the display
    refresh() {
        if (this.isInitialized) {
            this.loadGameData();
            this.displayAllRounds();
        }
    }

    // Cleanup method
    cleanup() {
        this.clearAll();
        this.isInitialized = false;
    }
}

// Initialize the final score map
const finalScoreMap = new FinalScoreMap();

// Make it globally accessible
window.finalScoreMap = finalScoreMap;

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    finalScoreMap.cleanup();
});