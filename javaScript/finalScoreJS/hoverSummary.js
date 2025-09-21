// Hover Summary Tooltip System for Origin Guessr Final Score Page
class HoverSummaryHandler {
    constructor() {
        this.tooltip = null;
        this.currentRound = null;
        this.hideTimeout = null;
        this.showTimeout = null;
        this.isVisible = false;
        this.isDestroyed = false;
        this.hoverDelay = 300;
        this.hideDelay = 150;
        this.roundResultStorage = null;
        this.summaryHandler = null;
        
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

        // Clear any pending hide timeout
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

        // Extract round data
        const roundData = this.extractRoundData(summaryRound);
        if (!roundData) {
            return;
        }

        // Set show timeout
        this.showTimeout = setTimeout(() => {
            if (!this.isDestroyed) {
                this.showTooltip(summaryRound, roundData);
            }
        }, this.hoverDelay);
    }

    handleMouseLeave(event) {
        if (this.isDestroyed) return;
        
        const summaryRound = event.target.closest('.summary-round');
        const tooltip = event.target.closest('.hover-summary-tooltip');
        
        // If leaving a summary round or the tooltip itself
        if (summaryRound || tooltip) {
            // Clear show timeout
            if (this.showTimeout) {
                clearTimeout(this.showTimeout);
                this.showTimeout = null;
            }

            // Don't hide if moving to tooltip
            const relatedTarget = event.relatedTarget;
            if (relatedTarget && 
                (relatedTarget.closest('.hover-summary-tooltip') || 
                 relatedTarget.closest('.summary-round'))) {
                return;
            }

            // Set hide timeout
            this.hideTimeout = setTimeout(() => {
                if (!this.isDestroyed) {
                    this.hideTooltip();
                }
            }, this.hideDelay);
        }
    }

    handleSummaryToggle(event) {
        if (this.isDestroyed) return;
        
        // Hide tooltip when summary panel is toggled off
        if (!event.detail?.isActive) {
            this.hideTooltip();
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
        this.hideTooltip();
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
        
        // Add glass overlay elements
        const glassOverlay = document.createElement('div');
        glassOverlay.className = 'tooltip-glass-overlay';
        this.tooltip.appendChild(glassOverlay);
        
        const glassRadial = document.createElement('div');
        glassRadial.className = 'tooltip-glass-radial';
        this.tooltip.appendChild(glassRadial);
        
        // Add to body but keep hidden
        document.body.appendChild(this.tooltip);
        
        // Setup tooltip mouse events to keep it visible
        this.tooltip.addEventListener('mouseenter', () => {
            if (this.hideTimeout) {
                clearTimeout(this.hideTimeout);
                this.hideTimeout = null;
            }
        });
        
        this.tooltip.addEventListener('mouseleave', (event) => {
            const relatedTarget = event.relatedTarget;
            if (!relatedTarget || !relatedTarget.closest('.summary-round')) {
                this.hideTimeout = setTimeout(() => {
                    if (!this.isDestroyed) {
                        this.hideTooltip();
                    }
                }, this.hideDelay);
            }
        });
        
        console.log('Hover tooltip created');
    }

    showTooltip(summaryRound, roundData) {
        if (this.isDestroyed || !this.tooltip || !summaryRound || !roundData) return;

        // Clear any pending timeouts
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
            this.showTimeout = null;
        }
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
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
                    <span class="hover-tooltip-meta-label">Attribution:</span>
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
        
        // Create a new image to test loading
        const testImg = new Image();
        
        testImg.onload = () => {
            if (this.isDestroyed || !img.parentElement) return;
            
            img.src = imageUrl;
            img.className = 'hover-tooltip-image';
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

    setupExternalLinks() {
        if (this.isDestroyed || !this.tooltip) return;
        
        const linkElements = this.tooltip.querySelectorAll('[data-link]');
        linkElements.forEach(element => {
            const link = element.getAttribute('data-link');
            if (link) {
                element.style.cursor = 'pointer';
                element.addEventListener('click', () => {
                    window.open(link, '_blank', 'noopener,noreferrer');
                });
            }
        });
    }

    positionTooltip(summaryRound) {
        if (this.isDestroyed || !this.tooltip) return;
        
        const targetElement = summaryRound || this.getCurrentSummaryRound();
        if (!targetElement) return;
        
        const targetRect = targetElement.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Reset positioning classes
        this.tooltip.classList.remove('tooltip-left', 'tooltip-above', 'tooltip-below');
        
        // Default positioning: to the right of the target
        let left = targetRect.right + 20;
        let top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        
        // Check if tooltip would go off-screen horizontally
        if (left + tooltipRect.width > viewportWidth - 20) {
            // Position to the left instead
            left = targetRect.left - tooltipRect.width - 20;
            this.tooltip.classList.add('tooltip-left');
            
            // If still off-screen on left, position above or below
            if (left < 20) {
                left = Math.max(20, targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2));
                
                // Check vertical space - prefer positioning above since summary is in bottom-left
                const spaceAbove = targetRect.top - 20;
                const spaceBelow = viewportHeight - targetRect.bottom - 20;
                
                if (spaceAbove >= tooltipRect.height || spaceAbove > spaceBelow) {
                    // Position above
                    top = targetRect.top - tooltipRect.height - 20;
                    this.tooltip.classList.remove('tooltip-left');
                    this.tooltip.classList.add('tooltip-above');
                } else {
                    // Position below
                    top = targetRect.bottom + 20;
                    this.tooltip.classList.remove('tooltip-left');
                    this.tooltip.classList.add('tooltip-below');
                }
            }
        }
        
        // Adjust vertical position if tooltip would go off-screen vertically
        if (!this.tooltip.classList.contains('tooltip-above') && !this.tooltip.classList.contains('tooltip-below')) {
            // For left/right positioning, adjust vertical as needed
            if (top < 20) {
                top = 20;
            } else if (top + tooltipRect.height > viewportHeight - 20) {
                // If summary panel is in bottom-left, prioritize showing above it
                const summaryPanel = document.querySelector('.summary-panel');
                if (summaryPanel) {
                    const summaryRect = summaryPanel.getBoundingClientRect();
                    const preferredTop = summaryRect.top - tooltipRect.height - 20;
                    if (preferredTop >= 20) {
                        top = preferredTop;
                        // Change to above positioning with centered arrow
                        this.tooltip.classList.remove('tooltip-left');
                        this.tooltip.classList.add('tooltip-above');
                        left = Math.max(20, Math.min(viewportWidth - tooltipRect.width - 20, 
                                                   targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2)));
                    } else {
                        top = Math.max(20, viewportHeight - tooltipRect.height - 20);
                    }
                } else {
                    top = Math.max(20, viewportHeight - tooltipRect.height - 20);
                }
            }
        }
        
        // Ensure tooltip doesn't go off-screen horizontally for above/below positioning
        if (this.tooltip.classList.contains('tooltip-above') || this.tooltip.classList.contains('tooltip-below')) {
            if (left < 20) {
                left = 20;
            } else if (left + tooltipRect.width > viewportWidth - 20) {
                left = viewportWidth - tooltipRect.width - 20;
            }
        }
        
        // Apply position
        this.tooltip.style.left = `${Math.max(20, left)}px`;
        this.tooltip.style.top = `${Math.max(20, top)}px`;
        
        // Update arrow position for left/right positioning
        if (!this.tooltip.classList.contains('tooltip-above') && !this.tooltip.classList.contains('tooltip-below')) {
            const arrowOffset = targetRect.top + (targetRect.height / 2) - top;
            const clampedOffset = Math.max(30, Math.min(tooltipRect.height - 30, arrowOffset));
            this.tooltip.style.setProperty('--arrow-offset', `${clampedOffset}px`);
        }
    }

    getCurrentSummaryRound() {
        if (!this.currentRound) return null;
        
        // Find the summary round element for the current round
        const summaryRounds = document.querySelectorAll('.summary-round');
        for (const round of summaryRounds) {
            const roundNumberElement = round.querySelector('.summary-round-number');
            if (roundNumberElement) {
                const roundText = roundNumberElement.textContent.trim();
                const roundMatch = roundText.match(/round\s+(\d+)/i);
                if (roundMatch && parseInt(roundMatch[1]) === this.currentRound.roundNumber) {
                    return round;
                }
            }
        }
        
        return null;
    }

    hideTooltip() {
        if (this.isDestroyed || !this.tooltip || !this.isVisible) return;

        // Clear any pending timeouts
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
            this.showTimeout = null;
        }
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

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
        this.hideTooltip();
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
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
        
        // Remove event listeners
        document.removeEventListener('mouseenter', this.handleMouseEnter.bind(this), true);
        document.removeEventListener('mouseleave', this.handleMouseLeave.bind(this), true);
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

    // Handle accessibility
    setupAccessibility() {
        if (this.isDestroyed || !this.tooltip) return;
        
        // Make tooltip focusable for keyboard users
        this.tooltip.setAttribute('tabindex', '0');
        
        // Handle keyboard events
        this.tooltip.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.hideTooltip();
            }
        });
        
        // Announce tooltip to screen readers when shown
        this.tooltip.addEventListener('focus', () => {
            this.tooltip.setAttribute('aria-live', 'polite');
        });
    }

    // Update tooltip position for left-side arrow
    updateArrowPosition() {
        if (this.isDestroyed || !this.tooltip) return;
        
        const isLeftPositioned = this.tooltip.classList.contains('tooltip-left');
        const arrowOffset = this.tooltip.style.getPropertyValue('--arrow-offset') || '50%';
        
        if (isLeftPositioned) {
            // Flip arrow to point right when tooltip is on the left
            this.tooltip.style.setProperty('--arrow-direction', 'right');
        } else {
            // Default arrow points left
            this.tooltip.style.setProperty('--arrow-direction', 'left');
        }
        
        this.tooltip.style.setProperty('--arrow-top', arrowOffset);
    }
}

// Enhanced CSS variables support for dynamic arrow positioning
const hoverSummaryStyleSheet = document.createElement('style');
hoverSummaryStyleSheet.textContent = `
    .hover-summary-tooltip.tooltip-left::before {
        left: auto;
        right: -12px;
        border-width: 12px 0 12px 12px;
        border-color: transparent transparent transparent rgba(43, 124, 43, 0.5);
        top: var(--arrow-top, 50%);
        transform: translateY(-50%);
    }
    
    .hover-summary-tooltip.tooltip-left::after {
        left: auto;
        right: -10px;
        border-width: 10px 0 10px 10px;
        border-color: transparent transparent transparent rgba(4, 8, 3, 0.95);
        top: var(--arrow-top, 50%);
        transform: translateY(-50%);
    }
    
    .hover-summary-tooltip::before {
        top: var(--arrow-top, 50%);
    }
    
    .hover-summary-tooltip::after {
        top: var(--arrow-top, 50%);
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