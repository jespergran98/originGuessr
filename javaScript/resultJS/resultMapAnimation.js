/**
 * Enhanced result map animation with streamlined architecture
 * Handles cinematic reveal of guess vs correct location markers
 */
class ResultMapAnimation {
    constructor() {
        this.markers = { guess: null, correct: null };
        this.lineOverlay = null;
        this.map = null;
        this.isAnimating = false;
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
        this.waitForMap(() => this.startAnimation());
    }

    waitForMap(callback) {
        if (typeof map !== 'undefined' && map) {
            this.map = map;
            callback();
            return;
        }
        setTimeout(() => this.waitForMap(callback), 100);
    }

    async startAnimation() {
        const coords = this.parseCoordinates();
        if (!coords) {
            console.warn('Invalid coordinates for result map animation');
            return;
        }

        this.isAnimating = true;
        const { guess, correct } = coords;

        try {
            // Calculate optimal view that fits both markers perfectly
            const view = this.calculateOptimalView(guess, correct);
            
            // Step 1: Position camera above user's guess with 20% more zoom than optimal
            const initialZoom = view.optimalZoom * 1.2; // 20% more zoomed in
            this.map.setView([guess.lat, guess.lng], initialZoom, { animate: false });
            
            // Step 2: Add guess marker with immediate splat animation
            this.addMarkerWithSplat('guess', guess.lat, guess.lng);
            
            await this.wait(1200); // Let the splat animation play
            
            // Step 3: Zoom out to optimal level and move to center that fits both locations
            this.map.flyTo(view.center, view.optimalZoom, {
                duration: 2.0,
                easeLinearity: 0.1
            });
            
            await this.wait(1000); // Wait for zoom transition to complete
            
            // Step 4: Animate line
            await this.animateLine(guess, correct);
            
            // Step 5: Reveal correct location
            this.addMarker('correct', correct.lat, correct.lng);
            await this.wait(1200);
            
        } catch (error) {
            console.error('Animation error:', error);
        } finally {
            this.isAnimating = false;
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
        // Create bounds that include both markers
        const bounds = L.latLngBounds([
            [guess.lat, guess.lng],
            [correct.lat, correct.lng]
        ]);

        // Add padding around the bounds (20% on each side)
        const paddedBounds = bounds.pad(0.2);
        
        // Get the center of the padded bounds
        const center = paddedBounds.getCenter();
        
        // Calculate the optimal zoom level that fits the padded bounds
        // We'll use a temporary map view calculation
        const mapContainer = this.map.getContainer();
        const mapSize = this.map.getSize();
        
        // Calculate zoom that fits the bounds with padding
        let optimalZoom = this.map.getBoundsZoom(paddedBounds, false);
        
        // Ensure zoom is within reasonable limits
        optimalZoom = Math.max(2, Math.min(18, optimalZoom));
        
        // For very close markers (less than 100m), ensure minimum zoom of 12
        const distance = this.getDistance(guess.lat, guess.lng, correct.lat, correct.lng);
        if (distance < 0.1) { // Less than 100 meters
            optimalZoom = Math.max(12, optimalZoom);
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
        this.injectStyles();
    }

    injectStyles() {
        if (document.getElementById('stippled-line-styles')) return;

        const style = document.createElement('style');
        style.id = 'stippled-line-styles';
        style.textContent = `
            .stippled-line-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 500;
            }
            
            .line-svg {
                width: 100%;
                height: 100%;
            }
            
            .stippled-path {
                fill: none;
                stroke: #333;
                stroke-width: 4;
                stroke-opacity: 0.9;
                stroke-dasharray: 8 12;
                stroke-linecap: round;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
            }

            /* Splat animation styles */
            .marker-splat {
                animation: markerSplat 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
            }

            @keyframes markerSplat {
                0% {
                    transform: scale(0) rotate(0deg);
                    opacity: 0;
                }
                20% {
                    transform: scale(1.3) rotate(-5deg);
                    opacity: 0.8;
                }
                50% {
                    transform: scale(0.9) rotate(2deg);
                    opacity: 1;
                }
                70% {
                    transform: scale(1.1) rotate(-1deg);
                    opacity: 1;
                }
                100% {
                    transform: scale(1) rotate(0deg);
                    opacity: 1;
                }
            }

            .marker-entrance-bounce {
                animation: entranceBounce 0.6s ease-out forwards;
            }

            @keyframes entranceBounce {
                0% {
                    transform: translateY(-20px) scale(0.8);
                    opacity: 0;
                }
                60% {
                    transform: translateY(2px) scale(1.05);
                    opacity: 0.9;
                }
                100% {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }

    drawAnimatedLine(start, end) {
        return new Promise(resolve => {
            const steps = 50;
            let currentStep = 0;
            
            const animate = () => {
                if (currentStep > steps) {
                    this.bindLineUpdates(start, end);
                    resolve();
                    return;
                }
                
                const progress = this.easeInOutCubic(currentStep / steps);
                const currentLat = start.lat + (end.lat - start.lat) * progress;
                const currentLng = start.lng + (end.lng - start.lng) * progress;
                
                this.updateLinePath(start, { lat: currentLat, lng: currentLng });
                
                currentStep++;
                requestAnimationFrame(animate);
            };
            
            // Start line animation immediately
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
        const updateLine = () => this.updateLinePath(start, end);
        
        ['move', 'zoom', 'viewreset'].forEach(event => {
            this.map.on(event, updateLine);
            this.eventListeners.push({ event, handler: updateLine });
        });
    }

    addMarkerWithSplat(type, lat, lng) {
        const markerConfig = this.getMarkerConfig(type);
        
        // Add splat animation class to the HTML
        const htmlWithSplat = markerConfig.html.replace(
            'class="custom-marker guess-marker"',
            'class="custom-marker guess-marker marker-splat"'
        );
        
        const icon = L.divIcon({
            html: htmlWithSplat,
            className: markerConfig.className,
            iconSize: markerConfig.size,
            iconAnchor: markerConfig.anchor
        });

        this.markers[type] = L.marker([lat, lng], { 
            icon,
            zIndexOffset: markerConfig.zIndex
        }).addTo(this.map);

        // Ensure marker stays above line
        setTimeout(() => {
            this.markers[type] && this.markers[type].bringToFront();
        }, 100);
    }

    addMarker(type, lat, lng) {
        const markerConfig = this.getMarkerConfig(type);
        
        // Add entrance animation for correct marker
        let html = markerConfig.html;
        if (type === 'correct') {
            html = html.replace(
                'class="correct-location-marker flag-entrance"',
                'class="correct-location-marker flag-entrance marker-entrance-bounce"'
            );
        }
        
        const icon = L.divIcon({
            html: html,
            className: markerConfig.className,
            iconSize: markerConfig.size,
            iconAnchor: markerConfig.anchor
        });

        this.markers[type] = L.marker([lat, lng], { 
            icon,
            zIndexOffset: markerConfig.zIndex
        }).addTo(this.map);

        // Ensure markers stay above line
        setTimeout(() => {
            Object.values(this.markers).forEach(marker => 
                marker && marker.bringToFront()
            );
        }, 100);
    }

    getMarkerConfig(type) {
        const configs = {
            guess: {
                html: `
                    <div class="custom-marker guess-marker">
                        <svg viewBox="0 0 32 48" class="marker-svg">
                            <path class="marker-body" d="M16 1C24 1 31 8 31 16C31 24 16 47 16 47C16 47 1 24 1 16C1 8 8 1 16 1Z"/>
                            <circle class="marker-pin" cx="16" cy="12" r="4"/>
                        </svg>
                    </div>
                `,
                className: '',
                size: [32, 48],
                anchor: [16, 48],
                zIndex: 1000
            },
            correct: {
                html: `
                    <div class="correct-location-marker flag-entrance">
                        <svg viewBox="0 0 40 50" class="flag-svg">
                            <rect class="flag-pole" x="6" y="5" width="3" height="45"/>
                            <path class="flag-fabric" d="M9 8 L32 8 L28 15 L32 22 L9 22 Z"/>
                            <circle class="flag-pole" cx="7.5" cy="5" r="2"/>
                        </svg>
                        <div class="flag-pulse-ring"></div>
                        <div class="flag-pulse-ring-delayed"></div>
                    </div>
                `,
                className: 'correct-marker-container',
                size: [40, 50],
                anchor: [7.5, 50],
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

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t ** 3 : 1 - Math.pow(-2 * t + 2, 3) / 2;
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
        // Remove event listeners
        this.eventListeners.forEach(({ event, handler }) => {
            this.map.off(event, handler);
        });
        this.eventListeners = [];
        
        // Remove markers
        Object.values(this.markers).forEach(marker => {
            if (marker) this.map.removeLayer(marker);
        });
        this.markers = { guess: null, correct: null };
        
        // Remove overlay
        this.removeLineOverlay();
    }

    restart() {
        if (this.isAnimating) return;
        
        this.cleanup();
        this.startAnimation();
    }
}

// Initialize animation
const resultMapAnimation = new ResultMapAnimation();

// Export restart function globally
if (typeof window !== 'undefined') {
    window.restartResultAnimation = () => resultMapAnimation.restart();
}