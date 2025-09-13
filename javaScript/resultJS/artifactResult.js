// Process artifact result data and populate the result page
class ArtifactResultHandler {
    constructor() {
        this.artifactData = null;
        this.guessCoordinates = null;
        this.guessYear = null;
        this.initialize();
    }

    initialize() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.processResultData());
        } else {
            this.processResultData();
        }
    }

    processResultData() {
        const urlParams = new URLSearchParams(window.location.search);
        const artifactParam = urlParams.get('artifact');
        const guessLat = urlParams.get('guessLat');
        const guessLng = urlParams.get('guessLng');
        const guessYearParam = urlParams.get('guessYear');

        if (!artifactParam || !guessLat || !guessLng || !guessYearParam) {
            console.error('Missing URL parameters');
            this.showError('Missing required data from guess page');
            return;
        }

        try {
            this.artifactData = JSON.parse(decodeURIComponent(artifactParam));
            this.guessCoordinates = {
                lat: parseFloat(guessLat),
                lng: parseFloat(guessLng)
            };
            this.guessYear = parseInt(guessYearParam);

            console.log('Processing result for:', this.artifactData.title);
            console.log('Guess coordinates:', this.guessCoordinates);
            console.log('Guess year:', this.guessYear);

            if (!this.validateArtifactData()) {
                this.showError('Invalid artifact data received');
                return;
            }

            this.populateResultElements();
        } catch (error) {
            console.error('Error processing result data:', error);
            this.showError('Error processing guess result');
        }
    }

    validateArtifactData() {
        return this.artifactData && 
               this.artifactData.title && 
               this.artifactData.description &&
               typeof this.artifactData.lat === 'number' &&
               typeof this.artifactData.lng === 'number' &&
               typeof this.artifactData.year === 'number';
    }

    populateResultElements() {
        if (!this.artifactData) return;

        this.populateDescription();
        this.populateYear();
        this.populateYearOff();
        this.populateImage();
        this.populateDistance();
        this.populateAttribution();

        console.log('Result page populated successfully');
    }

    populateDescription() {
        const descriptionBox = document.querySelector('.descriptionBox');
        if (descriptionBox && this.artifactData.description) {
            descriptionBox.innerHTML = `
                <div class="result-content">
                    <h3 class="artifact-title">${this.escapeHtml(this.artifactData.title)}</h3>
                    <p class="artifact-description">${this.escapeHtml(this.artifactData.description)}</p>
                </div>
            `;
        }
    }

    populateYear() {
        const correctYearBox = document.querySelector('.correctYearBox');
        if (correctYearBox && this.artifactData.year !== undefined) {
            const formattedYear = this.formatYear(this.artifactData.year);
            correctYearBox.innerHTML = `
                <div class="result-content year-content">
                    <div class="year-value">${formattedYear}</div>
                </div>
            `;
        }
    }

    populateYearOff() {
        const yearOffBox = document.querySelector('.yearOffBox');
        if (yearOffBox && this.artifactData.year !== undefined && this.guessYear !== null) {
            const yearDifference = Math.abs(this.guessYear - this.artifactData.year);
            const formattedDifference = yearDifference.toLocaleString();
            
            yearOffBox.innerHTML = `
                <div class="result-content year-off-content">
                    <div class="year-off-text">You were  <span class="year-off-highlight">${formattedDifference}</span>  years off</div>
                </div>
            `;
        }
    }

    populateImage() {
        const imageResultBox = document.querySelector('.imageResultBox');
        if (imageResultBox && this.artifactData.image) {
            imageResultBox.innerHTML = `
                <div class="artifact-image-container">
                    <img src="${this.escapeHtml(this.artifactData.image)}" 
                         alt="${this.escapeHtml(this.artifactData.title)}" 
                         class="artifact-result-image"
                </div>
            `;
        }
    }

    populateDistance() {
        const distanceOffBox = document.querySelector('.distanceOffBox');
        if (distanceOffBox && this.artifactData.lat && this.artifactData.lng && this.guessCoordinates) {
            const distance = this.calculateDistance(
                this.artifactData.lat,
                this.artifactData.lng,
                this.guessCoordinates.lat,
                this.guessCoordinates.lng
            );

            const formattedDistance = this.formatDistance(distance);
            
            distanceOffBox.innerHTML = `
                <div class="result-content distance-content">
                    <div class="distance-text">You were  <span class="distance-highlight">${formattedDistance}</span>  away from the correct location</div>
                </div>
            `;
        }
    }

    populateAttribution() {
        const attributeBox = document.querySelector('.attributeBox');
        if (attributeBox) {
            let attributionText = 'Public Domain';
            
            if (this.artifactData.author && this.artifactData.author !== 'Public Domain') {
                if (this.artifactData.authorLink) {
                    attributionText = `Image by <a href="${this.escapeHtml(this.artifactData.authorLink)}" target="_blank" rel="noopener">${this.escapeHtml(this.artifactData.author)}</a>`;
                } else {
                    attributionText = `Image by ${this.escapeHtml(this.artifactData.author)}`;
                }
                
                if (this.artifactData.license) {
                    attributionText += ` - ${this.escapeHtml(this.artifactData.license)}`;
                }
            }

            attributeBox.innerHTML = `
                <div class="result-content attribution-content">
                    <span class="attribution-text">${attributionText}</span>
                </div>
            `;
        }
    }

    formatYear(year) {
        if (year < 0) {
            return `${Math.abs(year)} BC`;
        } else {
            return `${year} AD`;
        }
    }

    formatDistance(distanceKm) {
        if (distanceKm < 1) {
            return `${Math.round(distanceKm * 1000)}m`;
        } else if (distanceKm < 100) {
            return `${distanceKm.toFixed(1)} km`;
        } else {
            return `${Math.round(distanceKm)} km`;
        }
    }

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

    escapeHtml(text) {
        if (typeof text !== 'string') return text;
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    showError(message = 'Unable to load result data') {
        console.error('Showing error:', message);
        
        const descriptionBox = document.querySelector('.descriptionBox');
        if (descriptionBox) {
            descriptionBox.innerHTML = `
                <div class="result-content error-content">
                    <h3>Error Loading Result</h3>
                    <p>${message}. Please try making another guess.</p>
                </div>
            `;
        }

        // Clear other boxes on error
        const boxes = ['.yearBox', '.yearOffBox', '.imageResultBox', '.distanceOffBox', '.attributeBox'];
        boxes.forEach(selector => {
            const box = document.querySelector(selector);
            if (box) {
                box.innerHTML = `<div class="result-content"><p style="color: var(--light-green); opacity: 0.6; text-align: center;">Data unavailable</p></div>`;
            }
        });
    }
}

// Initialize the result handler
new ArtifactResultHandler();