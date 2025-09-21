// Hover Summary Tooltip System for Origin Guessr Final Score Page
class HoverSummaryHandler {
    constructor() {
        this.tooltip = null;
        this.currentRound = null;
        this.showTimeout = null;
        this.isVisible = false;
        this.isDestroyed = false;
        this.hoverDelay = 300;
        this.roundResultStorage = null;
        this.summaryHandler = null;
        this.currentSummaryRound = null;
        
        this.initialize();
    }

    initialize() {
        if (this.isDestroyed) return;
        
        // Wait for dependencies
        this.waitForDependencies(() => {
            this.setupEventListeners();
            this.createTooltip();
            console.log('Hover summary handler initialized');
        });
    }

    waitForDependencies(callback, retries = 0) {
        if (retries > 50) { // 5 seconds max wait
            console.warn('Dependencies not available after maximum retries');
            return;
        }

        if (window.roundResultStorage && window.summaryHandler) {
            this.roundResultStorage = window.roundResultStorage;
            this.summaryHandler = window.summaryHandler;
            callback();
            return;
        }

        setTimeout(() => this.waitForDependencies(callback, retries + 1), 100);
    }

    setupEventListeners() {
        if (this.isDestroyed) return;
        
        // Use event delegation to handle dynamically created summary rounds
        document.addEventListener('mouseenter', this.handleMouseEnter.bind(this), true);
        document.addEventListener('mouseleave', this.handleMouseLeave.bind(this), true);
        document.addEventListener('mousemove', this.handleMouseMove.bind(this), true);
        
        // Handle summary panel visibility changes
        document.addEventListener('summaryToggled', this.handleSummaryToggle.bind(this));
        
        // Handle window resize for tooltip positioning
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Handle scroll events to reposition tooltip
        document.addEventListener('scroll', this.handleScroll.bind(this), true);
        
        console.log('Hover summary event listeners attached');
    }

    handleMouseEnter(event) {
        if (this.isDestroyed) return;
        
        const summaryRound = event.target.closest('.summary-round');
        if (!summaryRound || !this.summaryHandler?.isSummaryActive()) {
            return;
        }

        // Store the current summary round
        this.currentSummaryRound = summaryRound;

        // Extract round data
        const roundData = this.extractRoundData(summaryRound);
        if (!roundData) {
            return;
        }

        // Set show timeout
        this.showTimeout = setTimeout(() => {
            if (!this.isDestroyed && this.currentSummaryRound === summaryRound) {
                this.showTooltip(summaryRound, roundData);
            }
        }, this.hoverDelay);
    }

    handleMouseLeave(event) {
        if (this.isDestroyed) return;
        
        const summaryRound = event.target.closest('.summary-round');
        
        // If leaving a summary round, hide tooltip
        if (summaryRound && summaryRound === this.currentSummaryRound) {
            this.clearCurrentHover();
        }
    }

    handleMouseMove(event) {
        if (this.isDestroyed || !this.isVisible) return;
        
        // Check if mouse is still over the current summary round
        const summaryRound = event.target.closest('.summary-round');
        
        // If we're not over the current summary round anymore, hide tooltip
        if (summaryRound !== this.currentSummaryRound) {
            this.clearCurrentHover();
        }
    }

    clearCurrentHover() {
        // Clear show timeout
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
            this.showTimeout = null;
        }

        // Clear current summary round
        this.currentSummaryRound = null;

        // Hide tooltip
        this.hideTooltip();
    }

    handleSummaryToggle(event) {
        if (this.isDestroyed) return;
        
        // Hide tooltip when summary panel is toggled off
        if (!event.detail?.isActive) {
            this.clearCurrentHover();
        }
    }

    handleResize() {
        if (this.isDestroyed || !this.isVisible) return;
        
        // Reposition tooltip on resize
        this.positionTooltip();
    }

    handleScroll(event) {
        if (this.isDestroyed || !this.isVisible) return;
        
        // Hide tooltip on scroll for better UX
        this.clearCurrentHover();
    }

    extractRoundData(summaryRound) {
        try {
            // Get round number from the summary round element
            const roundNumberElement = summaryRound.querySelector('.summary-round-number');
            if (!roundNumberElement) {
                console.warn('Round number element not found');
                return null;
            }

            const roundText = roundNumberElement.textContent.trim();
            const roundMatch = roundText.match(/round\s+(\d+)/i);
            if (!roundMatch) {
                console.warn('Could not parse round number from:', roundText);
                return null;
            }

            const roundNumber = parseInt(roundMatch[1]);
            if (isNaN(roundNumber)) {
                console.warn('Invalid round number:', roundMatch[1]);
                return null;
            }

            // Get round data from storage
            const roundResult = this.roundResultStorage.getRoundResult(roundNumber);
            if (!roundResult || !roundResult.artifact) {
                console.warn('Round data not found for round:', roundNumber);
                return null;
            }

            return {
                roundNumber,
                ...roundResult
            };
        } catch (error) {
            console.error('Error extracting round data:', error);
            return null;
        }
    }

    createTooltip() {
        if (this.isDestroyed || this.tooltip) return;

        this.tooltip = document.createElement('div');
        this.tooltip.className = 'hover-summary-tooltip';
        this.tooltip.setAttribute('role', 'tooltip');
        this.tooltip.setAttribute('aria-hidden', 'true');
        
        // Completely disable all mouse interactions on the tooltip
        this.tooltip.style.pointerEvents = 'none';
        this.tooltip.style.userSelect = 'none';
        
        // Add glass overlay elements
        const glassOverlay = document.createElement('div');
        glassOverlay.className = 'tooltip-glass-overlay';
        this.tooltip.appendChild(glassOverlay);
        
        const glassRadial = document.createElement('div');
        glassRadial.className = 'tooltip-glass-radial';
        this.tooltip.appendChild(glassRadial);
        
        // Add to body but keep hidden
        document.body.appendChild(this.tooltip);
        
        console.log('Hover tooltip created');
    }

    showTooltip(summaryRound, roundData) {
        if (this.isDestroyed || !this.tooltip || !summaryRound || !roundData) return;

        // Clear any pending timeouts
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
            this.showTimeout = null;
        }

        // Update tooltip content
        this.updateTooltipContent(roundData);
        
        // Position tooltip
        this.positionTooltip(summaryRound);
        
        // Show tooltip
        this.tooltip.classList.add('visible', 'animate-in');
        this.tooltip.setAttribute('aria-hidden', 'false');
        this.isVisible = true;
        this.currentRound = roundData;
        
        console.log(`Showing tooltip for round ${roundData.roundNumber}`);
    }

    updateTooltipContent(roundData) {
        if (this.isDestroyed || !this.tooltip) return;

        const artifact = roundData.artifact;
        
        // Build tooltip HTML
        const tooltipHTML = this.buildTooltipHTML(artifact, roundData.roundNumber);
        this.tooltip.innerHTML = tooltipHTML;
        
        // Re-add glass overlay elements
        const glassOverlay = document.createElement('div');
        glassOverlay.className = 'tooltip-glass-overlay';
        this.tooltip.appendChild(glassOverlay);
        
        const glassRadial = document.createElement('div');
        glassRadial.className = 'tooltip-glass-radial';
        this.tooltip.appendChild(glassRadial);
        
        // Setup image loading
        const img = this.tooltip.querySelector('.hover-tooltip-image');
        if (img && artifact.image) {
            this.setupImageLoading(img, artifact.image);
        }
    }

    buildTooltipHTML(artifact, roundNumber) {
        return `
            <div class="hover-tooltip-header">
                <h4 class="hover-tooltip-title">${this.escapeHtml(artifact.title || 'Unknown Artifact')}</h4>
                <p class="hover-tooltip-round">Round ${roundNumber}</p>
            </div>
            
            <div class="hover-tooltip-image-container">
                ${artifact.image ? 
                    `<img class="hover-tooltip-image hover-tooltip-image-loading" 
                         src="" 
                         alt="${this.escapeHtml(artifact.title || 'Artifact image')}"
                         loading="lazy">` :
                    `<div class="hover-tooltip-image-error">
                        <span>No image available</span>
                     </div>`
                }
            </div>
            
            <div class="hover-tooltip-content">
                <div class="hover-tooltip-description">
                    ${this.escapeHtml(artifact.description || 'No description available.')}
                </div>
                
                <div class="hover-tooltip-year">
                    <div class="hover-tooltip-year-label">Origin Year</div>
                    <div class="hover-tooltip-year-value">${this.formatYear(artifact.year)}</div>
                </div>
                
                <div class="hover-tooltip-coordinates">
                    <div class="hover-tooltip-coord">
                        <div class="hover-tooltip-coord-label">Latitude</div>
                        <div class="hover-tooltip-coord-value">${this.formatCoordinate(artifact.lat, 'lat')}</div>
                    </div>
                    <div class="hover-tooltip-coord">
                        <div class="hover-tooltip-coord-label">Longitude</div>
                        <div class="hover-tooltip-coord-value">${this.formatCoordinate(artifact.lng, 'lng')}</div>
                    </div>
                </div>
                
                ${this.buildAttributionHTML(artifact)}
            </div>
        `;
    }

    buildAttributionHTML(artifact) {
        if (!artifact.author && !artifact.license) {
            return '';
        }

        let attributionHTML = '';
        
        // Use the existing attribution logic from attribution.js if available
        if (typeof updateAttribution === 'function') {
            // Create a temporary element to capture attribution output
            const tempElement = document.createElement('div');
            tempElement.id = 'attribution-text';
            document.body.appendChild(tempElement);
            
            try {
                updateAttribution(artifact);
                attributionHTML = tempElement.innerHTML;
            } catch (error) {
                console.warn('Error using attribution.js:', error);
                attributionHTML = this.buildFallbackAttribution(artifact);
            } finally {
                // Clean up temporary element
                document.body.removeChild(tempElement);
            }
        } else {
            // Fallback if attribution.js is not loaded
            attributionHTML = this.buildFallbackAttribution(artifact);
        }

        if (!attributionHTML) {
            return '';
        }

        return `
            <div class="hover-tooltip-metadata">
                <div class="hover-tooltip-meta-item">
                    <span class="hover-tooltip-meta-label"></span>
                    <span class="hover-tooltip-meta-value">${attributionHTML}</span>
                </div>
            </div>
        `;
    }

    buildFallbackAttribution(artifact) {
        let attributionHTML = '';
        
        // Simple fallback attribution logic
        if (artifact.author) {
            if (artifact.authorLink) {
                attributionHTML += `<a href="${this.escapeHtml(artifact.authorLink)}" target="_blank" rel="noopener">${this.escapeHtml(artifact.author)}</a>`;
            } else {
                attributionHTML += this.escapeHtml(artifact.author);
            }
        }
        
        if (attributionHTML && artifact.license) {
            attributionHTML += ' / ';
        }
        
        if (artifact.license) {
            attributionHTML += this.escapeHtml(artifact.license);
        }
        
        return attributionHTML;
    }

    formatYear(year) {
        if (typeof year !== 'number' || isNaN(year)) {
            return 'Unknown';
        }
        
        if (year < 0) {
            return `${Math.abs(year)} BC`;
        } else if (year > 0) {
            return `${year} AD`;
        } else {
            return '1 BC / 1 AD'; // Year 0 is ambiguous
        }
    }

    setupImageLoading(img, imageUrl) {
        if (!img || !imageUrl) return;

        const container = img.parentElement;
        
        // Show loading state
        img.className = 'hover-tooltip-image hover-tooltip-image-loading';
        
        // Create a new image to test loading and get dimensions
        const testImg = new Image();
        
        testImg.onload = () => {
            if (this.isDestroyed || !img.parentElement) return;
            
            // Set the image source
            img.src = imageUrl;
            img.className = 'hover-tooltip-image';
            
            // Store original dimensions for proper display
            img.setAttribute('data-original-width', testImg.width);
            img.setAttribute('data-original-height', testImg.height);
        };
        
        testImg.onerror = () => {
            if (this.isDestroyed || !img.parentElement) return;
            
            // Replace with error state
            container.innerHTML = `
                <div class="hover-tooltip-image-error">
                    <span>Failed to load image</span>
                </div>
            `;
        };
        
        // Start loading
        testImg.src = imageUrl;
    }

    positionTooltip(summaryRound) {
        if (this.isDestroyed || !this.tooltip) return;
        
        // Simple positioning: to the right of the summary panel, same bottom positioning
        const summaryPanel = document.querySelector('.summary-panel');
        if (!summaryPanel) return;
        
        const summaryRect = summaryPanel.getBoundingClientRect();
        
        // Position to the right of the summary panel with 20px gap
        const left = summaryRect.right + 20;
        
        // Use fixed bottom positioning just like the summary panel: bottom: 20px
        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.bottom = '20px';
        this.tooltip.style.top = 'auto'; // Clear any top positioning
        
        // Remove all positioning classes since we're using fixed positioning
        this.tooltip.classList.remove('tooltip-left', 'tooltip-above', 'tooltip-below');
    }

    hideTooltip() {
        if (this.isDestroyed || !this.tooltip || !this.isVisible) return;

        // Hide tooltip
        this.tooltip.classList.remove('visible', 'animate-in');
        this.tooltip.setAttribute('aria-hidden', 'true');
        this.isVisible = false;
        this.currentRound = null;
        
        console.log('Tooltip hidden');
    }

    escapeHtml(text) {
        if (typeof text !== 'string') {
            return String(text || '');
        }
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatCoordinate(coord, type) {
        if (typeof coord !== 'number' || isNaN(coord)) {
            return 'N/A';
        }
        
        const direction = type === 'lat' ? 
            (coord >= 0 ? 'N' : 'S') : 
            (coord >= 0 ? 'E' : 'W');
        
        return `${Math.abs(coord).toFixed(4)}°${direction}`;
    }

    // Public methods
    isTooltipVisible() {
        return this.isVisible;
    }

    getCurrentRoundData() {
        return this.currentRound;
    }

    forceHide() {
        this.clearCurrentHover();
    }

    // Cleanup and destroy
    destroy() {
        console.log('Destroying hover summary handler...');
        
        this.isDestroyed = true;
        
        // Clear timeouts
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
            this.showTimeout = null;
        }
        
        // Remove event listeners
        document.removeEventListener('mouseenter', this.handleMouseEnter.bind(this), true);
        document.removeEventListener('mouseleave', this.handleMouseLeave.bind(this), true);
        document.removeEventListener('mousemove', this.handleMouseMove.bind(this), true);
        document.removeEventListener('summaryToggled', this.handleSummaryToggle.bind(this));
        window.removeEventListener('resize', this.handleResize.bind(this));
        document.removeEventListener('scroll', this.handleScroll.bind(this), true);
        
        // Remove tooltip from DOM
        if (this.tooltip && this.tooltip.parentNode) {
            try {
                this.tooltip.parentNode.removeChild(this.tooltip);
            } catch (error) {
                console.warn('Error removing tooltip:', error);
            }
        }
        
        // Clear references
        this.tooltip = null;
        this.currentRound = null;
        this.currentSummaryRound = null;
        this.roundResultStorage = null;
        this.summaryHandler = null;
        
        console.log('Hover summary handler destroyed');
    }

    // Refresh tooltip content if currently visible
    refresh() {
        if (this.isVisible && this.currentRound) {
            // Get updated round data
            const updatedRoundData = this.roundResultStorage?.getRoundResult(this.currentRound.roundNumber);
            if (updatedRoundData) {
                this.currentRound = {
                    roundNumber: this.currentRound.roundNumber,
                    ...updatedRoundData
                };
                this.updateTooltipContent(this.currentRound);
            }
        }
    }
}

// Enhanced CSS for simplified positioning
const hoverSummaryStyleSheet = document.createElement('style');
hoverSummaryStyleSheet.textContent = `
    /* Ensure tooltip cannot receive any mouse events */
    .hover-summary-tooltip,
    .hover-summary-tooltip * {
        pointer-events: none !important;
        user-select: none !important;
    }
`;
document.head.appendChild(hoverSummaryStyleSheet);

// Singleton pattern
let hoverSummaryInstance = null;

function initializeHoverSummary() {
    if (!hoverSummaryInstance) {
        hoverSummaryInstance = new HoverSummaryHandler();
        window.hoverSummaryHandler = hoverSummaryInstance;
        console.log('Hover summary handler initialized');
    }
    return hoverSummaryInstance;
}

// Initialize the hover summary handler
const hoverSummaryHandler = initializeHoverSummary();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (hoverSummaryInstance) {
        hoverSummaryInstance.destroy();
        hoverSummaryInstance = null;
        window.hoverSummaryHandler = null;
    }
});

// Handle visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden && hoverSummaryInstance) {
        hoverSummaryInstance.forceHide();
    }
});

// Integration with summary handler
document.addEventListener('summaryModeChanged', (event) => {
    if (hoverSummaryInstance) {
        if (!event.detail?.isActive) {
            hoverSummaryInstance.forceHide();
        }
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HoverSummaryHandler, initializeHoverSummary };
}