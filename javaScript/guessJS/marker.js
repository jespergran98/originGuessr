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
    
    // Add click event listener for the button
    this.makeGuessButton.addEventListener('click', () => {
        if (this.hasMarker()) {
            // Only redirect if a marker has been placed
            window.location.href = 'result.html';
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

        // Updated to only include 4 splat elements.
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
            className: '', // No extra classes needed on the wrapper
            iconSize: [32, 48],
            iconAnchor: [38, 52] // Anchor at the very bottom tip to ensure it's at the click location
        });

        this.currentMarker = L.marker([lat, lng], { icon: markerIcon }).addTo(map);
        this.guessCoordinates = { lat, lng };

        // Update button state after placing marker
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

    calculateDistance(actualLat, actualLng) {
        if (!this.guessCoordinates) return null;

        const R = 6371;
        const dLat = this.toRadians(actualLat - this.guessCoordinates.lat);
        const dLng = this.toRadians(actualLng - this.guessCoordinates.lng);

        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(this.toRadians(this.guessCoordinates.lat)) *
            Math.cos(this.toRadians(actualLat)) *
            Math.sin(dLng / 2) ** 2;

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
}

let markerManager;
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        markerManager = new MarkerManager();
    }, 500);
});

window.MarkerManager = MarkerManager;