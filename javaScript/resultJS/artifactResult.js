// Process artifact result data and populate the result page
class ArtifactResultHandler {
    constructor() {
        this.artifactData = null;
        this.guessCoordinates = null;
        this.guessYear = null;
        this.scores = null;
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

        console.log('URL Parameters:', {
            artifact: artifactParam ? 'present' : 'missing',
            guessLat,
            guessLng,
            guessYear: guessYearParam
        });

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
                console.error('Invalid artifact data:', this.artifactData);
                this.showError('Invalid artifact data received');
                return;
            }

            // Calculate all scores
            this.calculateScores();
            this.populateResultElements();
            this.initializeMap();
        } catch (error) {
            console.error('Error processing result data:', error);
            this.showError('Error processing guess result: ' + error.message);
        }
    }

    validateArtifactData() {
        const isValid = this.artifactData && 
               this.artifactData.title && 
               this.artifactData.description &&
               typeof this.artifactData.lat === 'number' &&
               typeof this.artifactData.lng === 'number' &&
               typeof this.artifactData.year === 'number';
        
        console.log('Validation result:', isValid);
        if (!isValid) {
            console.log('Artifact data structure:', this.artifactData);
        }
        
        return isValid;
    }

    calculateScores() {
        if (!window.resultCalculation) {
            console.error('ResultCalculation not available');
            // Try to create it if it doesn't exist
            try {
                window.resultCalculation = new ResultCalculation();
            } catch (e) {
                console.error('Could not create ResultCalculation:', e);
                return;
            }
        }

        this.scores = window.resultCalculation.calculateAllScores({
            correctLat: this.artifactData.lat,
            correctLng: this.artifactData.lng,
            guessLat: this.guessCoordinates.lat,
            guessLng: this.guessCoordinates.lng,
            correctYear: this.artifactData.year,
            guessedYear: this.guessYear
        });

        console.log('Calculated scores:', this.scores);
    }

    populateResultElements() {
        if (!this.artifactData) {
            console.error('No artifact data available');
            return;
        }

        console.log('Populating result elements...');
        
        this.populateDescription();
        this.populateYear();
        this.populateYearOff();
        this.populateImage();
        this.populateDistance();
        this.populateAttribution();
        this.populateScores();
        this.populateNextButton();

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
            console.log('Description populated');
        } else {
            console.warn('Description box not found or no description data');
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
            console.log('Year populated:', formattedYear);
        } else {
            console.warn('Year box not found or no year data');
        }
    }

    populateYearOff() {
        const yearOffBox = document.querySelector('.yearOffBox');
        if (yearOffBox && this.artifactData.year !== undefined && this.guessYear !== null) {
            const yearDifference = Math.abs(this.guessYear - this.artifactData.year);
            const formattedDifference = yearDifference.toLocaleString();
            
            yearOffBox.innerHTML = `
                <div class="result-content year-off-content">
                    <div class="year-off-text">You were <span class="year-off-highlight">${formattedDifference}</span> years off</div>
                </div>
            `;
            console.log('Year difference populated:', formattedDifference);
        } else {
            console.warn('Year off box not found or missing data');
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
                         onload="console.log('Image loaded successfully')"
                         onerror="console.error('Image failed to load:', this.src)">
                </div>
            `;
            console.log('Image populated');
        } else {
            console.warn('Image box not found or no image data');
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
                    <div class="distance-text">You were <span class="distance-highlight">${formattedDistance}</span> away from the correct location</div>
                </div>
            `;
            console.log('Distance populated:', formattedDistance);
        } else {
            console.warn('Distance box not found or missing coordinate data');
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
            console.log('Attribution populated');
        } else {
            console.warn('Attribution box not found');
        }
    }

    populateScores() {
        if (!this.scores) {
            console.warn('No scores calculated, skipping score population');
            return;
        }

        console.log('Populating scores with:', this.scores);

        // Populate Year Score Box
        const yearScoreBox = document.querySelector('.yearScoreBox');
        if (yearScoreBox) {
            yearScoreBox.innerHTML = `
                <div class="score-content">
                    <div class="score-label">Year</div>
                    <div class="score-value-container">
                        <span class="score-value">${this.scores.yearScore.toLocaleString()}</span>
                        <span class="score-total">/5000</span>
                    </div>
                </div>
            `;
            console.log('Year score populated:', this.scores.yearScore);
        } else {
            console.warn('Year score box not found');
        }

        // Populate Location Score Box
        const locationScoreBox = document.querySelector('.locationScoreBox');
        if (locationScoreBox) {
            locationScoreBox.innerHTML = `
                <div class="score-content">
                    <div class="score-label">Location</div>
                    <div class="score-value-container">
                        <span class="score-value">${this.scores.locationScore.toLocaleString()}</span>
                        <span class="score-total">/5000</span>
                    </div>
                </div>
            `;
            console.log('Location score populated:', this.scores.locationScore);
        } else {
            console.warn('Location score box not found');
        }

        // Populate Total Score Box
        const totalScoreBox = document.querySelector('.totalScoreBox');
        if (totalScoreBox) {
            totalScoreBox.innerHTML = `
                <div class="score-content">
                    <div class="score-label">Total</div>
                    <div class="score-value-container">
                        <span class="score-value">${this.scores.totalScore.toLocaleString()}</span>
                        <span class="score-total">/10000</span>
                    </div>
                </div>
            `;
            console.log('Total score populated:', this.scores.totalScore);
        } else {
            console.warn('Total score box not found');
        }
    }

    populateNextButton() {
        const nextBox = document.querySelector('.nextBox');
        if (nextBox) {
            // Check if this is the last round
            const urlParams = new URLSearchParams(window.location.search);
            const currentRound = parseInt(urlParams.get('round')) || 1;
            const maxRounds = 5;
            
            const isLastRound = currentRound >= maxRounds;
            const buttonText = isLastRound ? 'Final Score' : 'Next Round';
            const buttonAction = isLastRound ? 'window.roundLogic.goToFinalScore()' : 'window.roundLogic.proceedToNextRound()';
            
            nextBox.innerHTML = `
                <div class="next-round-content">
                    <button class="next-round-button" onclick="${buttonAction}">
                        ${buttonText}
                    </button>
                </div>
            `;
            console.log(`Next button populated: ${buttonText} for round ${currentRound}`);
        } else {
            console.warn('Next box not found');
        }
    }

    initializeMap() {
        // Initialize the map with basic tile layer only
        if (typeof L === 'undefined') {
            console.warn('Leaflet not loaded, skipping map initialization');
            return;
        }

        try {
            const mapElement = document.getElementById('map');
            if (!mapElement) {
                console.warn('Map element not found');
                return;
            }

            const map = L.map('map', {
                zoomControl: true,
                scrollWheelZoom: true,
                doubleClickZoom: true,
                touchZoom: true
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: 'Â© OpenStreetMap contributors'
            }).addTo(map);

            // Set a default view (can be customized as needed)
            map.setView([0, 0], 2);

            console.log('Map initialized successfully');
        } catch (error) {
            console.error('Error initializing map:', error);
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
        const boxes = ['.yearScoreBox', '.yearOffBox', '.imageResultBox', '.distanceOffBox', '.attributeBox', '.locationScoreBox', '.totalScoreBox', '.correctYearBox'];
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