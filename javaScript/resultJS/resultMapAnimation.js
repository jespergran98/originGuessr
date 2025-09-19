class ResultMapAnimation {
    constructor() {
        this.markers = { guess: null, correct: null };
        this.lineOverlay = null;
        this.map = null;
        this.isAnimating = false;
        this.eventListeners = [];
        this.lineCoordinates = null;
        this.isLineAnimationComplete = false;
        this.noGuess = false; // Track if no guess was made
        
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
        this.waitForMap(() => this.startAnimation());
    }

    waitForMap(callback) {
        if (typeof map !== 'undefined' && map) {
            this.map = map;
            callback();
            return;
        }
        setTimeout(() => this.waitForMap(callback), 50);
    }

    async startAnimation() {
        const coords = this.parseCoordinates();
        if (!coords) {
            console.warn('Invalid coordinates for result map animation');
            return;
        }

        this.isAnimating = true;
        
        // Check if no guess was made
        const urlParams = new URLSearchParams(window.location.search);
        this.noGuess = urlParams.get('noGuess') === 'true';

        if (this.noGuess) {
            // No guess was made - show only the correct location
            console.log('No guess made - showing only correct location');
            await this.animateNoGuessScenario(coords.correct);
        } else {
            // Normal animation with guess and correct location
            console.log('Normal animation with guess');
            await this.animateNormalScenario(coords);
        }

        this.isAnimating = false;
    }

    async animateNoGuessScenario(correct) {
        try {
            // Center the map on the correct location
            this.map.setView([correct.lat, correct.lng], 8, { animate: false });
            
            await this.wait(300); // Brief pause
            
            // Show the correct location flag directly
            this.addMarker('correct', correct.lat, correct.lng);
            
            // Zoom in slightly to focus on the correct location
            this.map.flyTo([correct.lat, correct.lng], 10, {
                duration: 1.5,
                easeLinearity: 0.25
            });
            
        } catch (error) {
            console.error('Animation error (no guess):', error);
        }
    }

    async animateNormalScenario(coords) {
        this.lineCoordinates = coords;
        const { guess, correct } = coords;

        try {
            // Calculate optimal view
            const view = this.calculateOptimalView(guess, correct);
            
            // Step 1: Start at guess location with closer zoom
            const initialZoom = Math.min(view.optimalZoom + 2, 16);
            this.map.setView([guess.lat, guess.lng], initialZoom, { animate: false });
            
            // Step 2: Show guess marker immediately with splat
            this.addMarkerWithSplat('guess', guess.lat, guess.lng);
            
            await this.wait(600);
            
            // Step 3: Quick zoom out and pan to optimal view
            this.map.flyTo(view.center, view.optimalZoom, {
                duration: 1.2,
                easeLinearity: 0.2
            });
            
            await this.wait(600);
            
            // Step 4: Draw line quickly
            await this.animateLine(guess, correct);
            
            // Step 5: Show correct location and ensure proper layering
            this.addMarker('correct', correct.lat, correct.lng);
            this.enforceMarkerLayering();
            
        } catch (error) {
            console.error('Animation error (normal):', error);
        }
    }

    parseCoordinates() {
        const params = new URLSearchParams(window.location.search);
        const guessLat = parseFloat(params.get('guessLat'));
        const guessLng = parseFloat(params.get('guessLng'));
        const artifactParam = params.get('artifact');

        if (isNaN(guessLat) || isNaN(guessLng) || !artifactParam) return null;

        try {
            const artifact = JSON.parse(decodeURIComponent(artifactParam));
            const correctLat = parseFloat(artifact.lat);
            const correctLng = parseFloat(artifact.lng);
            
            if (isNaN(correctLat) || isNaN(correctLng)) return null;

            return {
                guess: { lat: guessLat, lng: guessLng },
                correct: { lat: correctLat, lng: correctLng }
            };
        } catch (error) {
            console.error('Failed to parse coordinates:', error);
            return null;
        }
    }

    calculateOptimalView(guess, correct) {
        const bounds = L.latLngBounds([
            [guess.lat, guess.lng],
            [correct.lat, correct.lng]
        ]);

        const paddedBounds = bounds.pad(0.15);
        const center = paddedBounds.getCenter();
        
        let optimalZoom = this.map.getBoundsZoom(paddedBounds, false);
        optimalZoom = Math.max(3, Math.min(16, optimalZoom));
        
        // For very close markers, ensure readable zoom
        const distance = this.getDistance(guess.lat, guess.lng, correct.lat, correct.lng);
        if (distance < 0.1) {
            optimalZoom = Math.max(13, optimalZoom);
        }

        return {
            center: [center.lat, center.lng],
            optimalZoom
        };
    }

    async animateLine(guess, correct) {
        this.createLineOverlay();
        return this.drawAnimatedLine(guess, correct);
    }

    createLineOverlay() {
        this.removeLineOverlay();
        
        const overlay = document.createElement('div');
        overlay.className = 'stippled-line-overlay';
        overlay.innerHTML = '<svg class="line-svg"><path class="stippled-path"></path></svg>';
        
        this.map.getContainer().appendChild(overlay);
        this.lineOverlay = overlay;
    }

    drawAnimatedLine(start, end) {
        return new Promise(resolve => {
            const steps = 30;
            let currentStep = 0;
            this.isLineAnimationComplete = false;
            
            const animate = () => {
                if (currentStep > steps) {
                    this.isLineAnimationComplete = true;
                    this.bindLineUpdates(start, end);
                    resolve();
                    return;
                }
                
                const progress = this.easeOutCubic(currentStep / steps);
                const currentLat = start.lat + (end.lat - start.lat) * progress;
                const currentLng = start.lng + (end.lng - start.lng) * progress;
                
                this.updateLinePath(start, { lat: currentLat, lng: currentLng });
                
                currentStep++;
                requestAnimationFrame(animate);
            };
            
            requestAnimationFrame(animate);
        });
    }

    updateLinePath(start, end) {
        if (!this.lineOverlay) return;
        
        const startPoint = this.map.latLngToContainerPoint([start.lat, start.lng]);
        const endPoint = this.map.latLngToContainerPoint([end.lat, end.lng]);
        
        const path = this.lineOverlay.querySelector('.stippled-path');
        if (path) {
            path.setAttribute('d', `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`);
        }
    }

    bindLineUpdates(start, end) {
        const updateLine = () => {
            if (!this.isLineAnimationComplete) return;
            
            requestAnimationFrame(() => {
                this.updateLinePath(start, end);
            });
        };
        
        const events = ['move', 'zoom', 'zoomstart', 'zoomend', 'viewreset', 'resize'];
        
        events.forEach(event => {
            this.map.on(event, updateLine);
            this.eventListeners.push({ event, handler: updateLine });
        });

        const handleZoomAnimation = () => {
            if (this.map.isZooming && this.map.isZooming()) {
                this.updateLinePath(start, end);
                requestAnimationFrame(handleZoomAnimation);
            }
        };

        const zoomStartHandler = () => {
            requestAnimationFrame(handleZoomAnimation);
        };

        this.map.on('zoomstart', zoomStartHandler);
        this.eventListeners.push({ event: 'zoomstart', handler: zoomStartHandler });
    }

    addMarkerWithSplat(type, lat, lng) {
        const markerConfig = this.getMarkerConfig(type);
        
        const icon = L.divIcon({
            html: markerConfig.html.replace('custom-marker', 'custom-marker marker-splat'),
            className: markerConfig.className,
            iconSize: markerConfig.size,
            iconAnchor: markerConfig.anchor
        });

        this.markers[type] = L.marker([lat, lng], { 
            icon,
            zIndexOffset: markerConfig.zIndex
        }).addTo(this.map);

        setTimeout(() => this.enforceMarkerLayering(), 10);
    }

    addMarker(type, lat, lng) {
        const markerConfig = this.getMarkerConfig(type);
        
        const icon = L.divIcon({
            html: markerConfig.html,
            className: markerConfig.className,
            iconSize: markerConfig.size,
            iconAnchor: markerConfig.anchor
        });

        this.markers[type] = L.marker([lat, lng], { 
            icon,
            zIndexOffset: markerConfig.zIndex
        }).addTo(this.map);

        setTimeout(() => this.enforceMarkerLayering(), 10);
    }

    enforceMarkerLayering() {
        Object.values(this.markers).forEach(marker => {
            if (marker && marker._icon) {
                marker._icon.style.zIndex = marker.options.zIndexOffset || 1000;
                marker.bringToFront && marker.bringToFront();
            }
        });

        if (this.lineOverlay) {
            this.lineOverlay.style.zIndex = '500';
        }
    }

    getMarkerConfig(type) {
        const configs = {
            guess: {
                html: `
                    <div class="custom-marker">
                        <svg viewBox="0 0 32 48" class="marker-svg">
                            <path class="marker-body" d="M16 2C23 2 29 8 29 16C29 24 16 46 16 46C16 46 3 24 3 16C3 8 9 2 16 2Z"/>
                            <circle class="marker-pin" cx="16" cy="16" r="5"/>
                        </svg>
                    </div>
                `,
                className: 'guess-marker-container',
                size: [32, 48],
                anchor: [16, 48],
                zIndex: 1000
            },
            correct: {
                html: `
                    <div class="correct-location-marker flag-entrance">
                        <svg viewBox="0 0 36 48" class="flag-svg">
                            <rect class="flag-pole" x="6" y="8" width="2.5" height="40"/>
                            <path class="flag-fabric" d="M8.5 10 L28 10 L25 16 L28 22 L8.5 22 Z"/>
                            <circle class="flag-pole" cx="7.25" cy="8" r="1.5"/>
                        </svg>
                    </div>
                `,
                className: 'correct-marker-container',
                size: [36, 48],
                anchor: [7.25, 48],
                zIndex: 2000
            }
        };
        
        return configs[type];
    }

    // Utility methods
    getDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);

        const a = Math.sin(dLat / 2) ** 2 + 
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
                  Math.sin(dLng / 2) ** 2;

        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Cleanup methods
    removeLineOverlay() {
        if (this.lineOverlay) {
            this.lineOverlay.remove();
            this.lineOverlay = null;
        }
    }

    cleanup() {
        this.eventListeners.forEach(({ event, handler }) => {
            this.map && this.map.off(event, handler);
        });
        this.eventListeners = [];
        
        Object.values(this.markers).forEach(marker => {
            if (marker && this.map) this.map.removeLayer(marker);
        });
        this.markers = { guess: null, correct: null };
        
        this.removeLineOverlay();
        this.lineCoordinates = null;
        this.isLineAnimationComplete = false;
    }

    restart() {
        if (this.isAnimating) return;
        
        this.cleanup();
        this.startAnimation();
    }
}

// Initialize
const resultMapAnimation = new ResultMapAnimation();

// Export restart function
if (typeof window !== 'undefined') {
    window.restartResultAnimation = () => resultMapAnimation.restart();
}