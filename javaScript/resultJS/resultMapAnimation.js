// Enhanced marker display for result page map with correct location and connecting line
class ResultMapAnimation {
    constructor() {
        this.guessMarker = null;
        this.correctMarker = null;
        this.connectingLine = null;
        this.map = null;
        this.initialize();
    }

    initialize() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupResultMap());
        } else {
            this.setupResultMap();
        }
    }

    setupResultMap() {
        // Wait for map to be available from artifactResult.js or map.js
        this.waitForMap(() => {
            this.addMarkersAndLine();
            this.fitMapToMarkers();
        });
    }

    waitForMap(callback) {
        if (typeof map !== 'undefined' && map) {
            this.map = map;
            callback();
        } else {
            setTimeout(() => this.waitForMap(callback), 100);
        }
    }

    addMarkersAndLine() {
        const coordinates = this.getCoordinates();
        if (!coordinates) {
            console.warn('Could not get coordinates for result map');
            return;
        }

        const { guessLat, guessLng, correctLat, correctLng } = coordinates;

        // Add guess marker (green pin marker)
        this.addGuessMarker(guessLat, guessLng);
        
        // Add correct location marker (red flag)
        this.addCorrectMarker(correctLat, correctLng);
        
        // Add connecting line
        this.addConnectingLine(guessLat, guessLng, correctLat, correctLng);

        console.log('Added markers and line to result map');
    }

    getCoordinates() {
        const urlParams = new URLSearchParams(window.location.search);
        const artifactParam = urlParams.get('artifact');
        const guessLat = parseFloat(urlParams.get('guessLat'));
        const guessLng = parseFloat(urlParams.get('guessLng'));

        if (isNaN(guessLat) || isNaN(guessLng) || !artifactParam) {
            return null;
        }

        let correctLat, correctLng;
        try {
            const artifactData = JSON.parse(decodeURIComponent(artifactParam));
            correctLat = parseFloat(artifactData.lat);
            correctLng = parseFloat(artifactData.lng);
        } catch (error) {
            console.error('Error parsing artifact data:', error);
            return null;
        }

        if (isNaN(correctLat) || isNaN(correctLng)) {
            return null;
        }

        return { guessLat, guessLng, correctLat, correctLng };
    }

    addGuessMarker(lat, lng) {
        const markerHTML = `
            <div class="custom-marker guess-marker">
                <svg viewBox="0 0 32 48" class="marker-svg">
                    <path class="marker-body" d="M16 1C24 1 31 8 31 16C31 24 16 47 16 47C16 47 1 24 1 16C1 8 8 1 16 1Z"/>
                    <circle class="marker-pin" cx="16" cy="12" r="4"/>
                </svg>
                <div class="splat splat-1"><svg viewBox="0 0 32 48"><path d="M16 1C24 1 31 8 31 16C31 24 16 47 16 47C16 47 1 24 1 16C1 8 8 1 16 1Z"/></svg></div>
                <div class="splat splat-2"><svg viewBox="0 0 32 48"><path d="M16 1C24 1 31 8 31 16C31 24 16 47 16 47C16 47 1 24 1 16C1 8 8 1 16 1Z"/></svg></div>
                <div class="splat splat-3"><svg viewBox="0 0 32 48"><path d="M16 1C24 1 31 8 31 16C31 24 16 47 16 47C16 47 1 24 1 16C1 8 8 1 16 1Z"/></svg></div>
                <div class="splat splat-4"><svg viewBox="0 0 32 48"><path d="M16 1C24 1 31 8 31 16C31 24 16 47 16 47C16 47 1 24 1 16C1 8 8 1 16 1Z"/></svg></div>
            </div>
        `;

        const markerIcon = L.divIcon({
            html: markerHTML,
            className: '',
            iconSize: [32, 48],
            iconAnchor: [38, 52]
        });

        this.guessMarker = L.marker([lat, lng], { 
            icon: markerIcon,
            zIndexOffset: 1000
        }).addTo(this.map);
    }

    addCorrectMarker(lat, lng) {
        const flagHTML = `
            <div class="correct-location-marker">
                <svg viewBox="0 0 40 50" class="flag-svg">
                    <!-- Flag pole -->
                    <rect class="flag-pole" x="6" y="5" width="3" height="45"/>
                    
                    <!-- Flag fabric -->
                    <path class="flag-fabric" d="M9 8 L32 8 L28 15 L32 22 L9 22 Z"/>
                    
                    <!-- Flag pole cap -->
                    <circle class="flag-pole" cx="7.5" cy="5" r="2"/>
                </svg>
                <div class="flag-pulse-ring"></div>
                <div class="flag-pulse-ring-delayed"></div>
            </div>
        `;

        const flagIcon = L.divIcon({
            html: flagHTML,
            className: 'correct-marker-container',
            iconSize: [40, 50],
            iconAnchor: [7.5, 50] // Anchor at the base of the flag pole
        });

        this.correctMarker = L.marker([lat, lng], { 
            icon: flagIcon,
            zIndexOffset: 2000
        }).addTo(this.map);
    }

    addConnectingLine(guessLat, guessLng, correctLat, correctLng) {
        // Create stippled line between guess and correct location
        const lineCoordinates = [[guessLat, guessLng], [correctLat, correctLng]];
        
        this.connectingLine = L.polyline(lineCoordinates, {
            color: '#333333',
            weight: 3,
            opacity: 0.8,
            dashArray: '8, 12', // Creates stippled/dashed effect
            className: 'connecting-line'
        }).addTo(this.map);

        // Add subtle glow effect
        const glowLine = L.polyline(lineCoordinates, {
            color: '#333333',
            weight: 8,
            opacity: 0.1,
            className: 'connecting-line-glow'
        }).addTo(this.map);

        // Ensure markers are above the line
        if (this.guessMarker) this.guessMarker.bringToFront();
        if (this.correctMarker) this.correctMarker.bringToFront();
    }

    fitMapToMarkers() {
        if (!this.guessMarker || !this.correctMarker) {
            return;
        }

        const group = new L.featureGroup([this.guessMarker, this.correctMarker]);
        
        // Fit map to show both markers with some padding
        this.map.fitBounds(group.getBounds(), {
            padding: [50, 50],
            maxZoom: 10 // Prevent zooming in too much
        });

        // If markers are very close, ensure minimum zoom level
        setTimeout(() => {
            if (this.map.getZoom() > 15) {
                this.map.setZoom(12);
            }
        }, 100);
    }

    // Calculate distance between two points (for potential future use)
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

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
}

// Initialize when script loads
new ResultMapAnimation();