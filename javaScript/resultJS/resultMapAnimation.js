// Simple marker display for result page map
class ResultMapAnimation {
    constructor() {
        this.guessMarker = null;
        this.initialize();
    }

    initialize() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.addGuessMarker());
        } else {
            this.addGuessMarker();
        }
    }

    addGuessMarker() {
        // Wait for map to be available from artifactResult.js
        if (typeof map === 'undefined') {
            setTimeout(() => this.addGuessMarker(), 100);
            return;
        }

        // Get guess coordinates from URL
        const urlParams = new URLSearchParams(window.location.search);
        const guessLat = parseFloat(urlParams.get('guessLat'));
        const guessLng = parseFloat(urlParams.get('guessLng'));

        if (isNaN(guessLat) || isNaN(guessLng)) {
            console.warn('Invalid guess coordinates');
            return;
        }

        // Create marker with same styling as marker.js
        const markerHTML = `
            <div class="custom-marker">
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
            iconAnchor: [16, 48]
        });

        // Add marker to existing map
        this.guessMarker = L.marker([guessLat, guessLng], { icon: markerIcon }).addTo(map);
        
        console.log('Added guess marker at:', guessLat, guessLng);
    }
}

// Initialize when script loads
new ResultMapAnimation();