// Marker management for the guess game
class MarkerManager {
    constructor() {
        this.currentMarker = null;
        this.guessCoordinates = null;
        this.makeGuessButton = null;
        this.initializeMarkerPlacement();
        this.initializeButton();
    }

    initializeButton() {
        this.makeGuessButton = document.getElementById('makeGuess-button');
        if (!this.makeGuessButton) {
            setTimeout(() => this.initializeButton(), 100);
            return;
        }
        
        this.makeGuessButton.addEventListener('click', () => {
            if (this.hasMarker()) {
                this.navigateToResult();
            }
        });
    }

    initializeMarkerPlacement() {
        if (typeof map === 'undefined') {
            setTimeout(() => this.initializeMarkerPlacement(), 100);
            return;
        }

        map.on('click', (e) => this.placeMarker(e));
    }

    navigateToResult() {
        // Get artifact from global scope or wait for it
        const artifact = window.currentArtifact;
        
        if (!artifact || !this.guessCoordinates) {
            console.error('Missing artifact or guess data');
            // Still navigate but with error handling on result page
            window.location.href = 'result.html';
            return;
        }

        const params = new URLSearchParams();
        params.append('artifact', encodeURIComponent(JSON.stringify(artifact)));
        params.append('guessLat', this.guessCoordinates.lat.toString());
        params.append('guessLng', this.guessCoordinates.lng.toString());
        
        console.log('Navigating with artifact:', artifact.title);
        window.location.href = `result.html?${params.toString()}`;
    }

    updateButtonState() {
        if (!this.makeGuessButton) return;

        if (this.currentMarker) {
            this.makeGuessButton.classList.add('active');
            this.makeGuessButton.textContent = 'Make Guess';
        } else {
            this.makeGuessButton.classList.remove('active');
            this.makeGuessButton.textContent = 'Guess the Artifact Age & Origin';
        }
    }

    placeMarker(event) {
        const { lat, lng } = event.latlng;

        if (this.currentMarker) {
            map.removeLayer(this.currentMarker);
        }

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
            iconAnchor: [38, 52]
        });

        this.currentMarker = L.marker([lat, lng], { icon: markerIcon }).addTo(map);
        this.guessCoordinates = { lat, lng };

        this.updateButtonState();

        document.dispatchEvent(new CustomEvent('markerPlaced', {
            detail: { coordinates: this.guessCoordinates }
        }));

        console.log('Marker placed at:', lat, lng);
    }

    removeMarker() {
        if (this.currentMarker) {
            map.removeLayer(this.currentMarker);
            this.currentMarker = null;
            this.guessCoordinates = null;
            this.updateButtonState();
        }
    }

    getGuessCoordinates() {
        return this.guessCoordinates;
    }

    hasMarker() {
        return this.currentMarker !== null;
    }
}

let markerManager;
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        markerManager = new MarkerManager();
    }, 500);
});

window.MarkerManager = MarkerManager;