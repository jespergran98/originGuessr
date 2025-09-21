// hoverSummary.js - Connects summary panel hover events with map highlighting
class SummaryMapHighlighter {
    constructor() {
        this.isActive = false;
        this.highlightedElements = new Set();
        this.originalStyles = new Map();
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        // Wait for summary panel to be available
        this.waitForSummaryPanel(() => {
            this.bindSummaryHoverEvents();
        });
    }

    waitForSummaryPanel(callback) {
        const summaryPanel = document.querySelector('.summary-panel');
        if (summaryPanel) {
            callback();
            return;
        }
        setTimeout(() => this.waitForSummaryPanel(callback), 100);
    }

    bindSummaryHoverEvents() {
        const summaryPanel = document.querySelector('.summary-panel');
        if (!summaryPanel) return;

        // Use event delegation for better performance
        summaryPanel.addEventListener('mouseenter', (e) => {
            const summaryRound = e.target.closest('.summary-round');
            if (summaryRound) {
                this.handleRoundHover(summaryRound);
            }
        }, true);

        summaryPanel.addEventListener('mouseleave', (e) => {
            const summaryRound = e.target.closest('.summary-round');
            if (summaryRound) {
                this.handleRoundUnhover(summaryRound);
            }
        }, true);

        console.log('Summary hover events bound successfully');
    }

    handleRoundHover(summaryRoundElement) {
        // Extract round number from the element
        const roundNumber = this.extractRoundNumber(summaryRoundElement);
        if (!roundNumber) {
            console.warn('Could not extract round number from summary element');
            return;
        }

        console.log(`Hovering over round ${roundNumber}`);
        this.highlightMapElements(roundNumber);
    }

    handleRoundUnhover(summaryRoundElement) {
        // Extract round number from the element
        const roundNumber = this.extractRoundNumber(summaryRoundElement);
        if (!roundNumber) return;

        console.log(`Un-hovering round ${roundNumber}`);
        this.unhighlightMapElements(roundNumber);
    }

    extractRoundNumber(summaryRoundElement) {
        // Try multiple methods to extract round number
        
        // Method 1: Look for round number in text content
        const roundNumberElement = summaryRoundElement.querySelector('.summary-round-number');
        if (roundNumberElement) {
            const match = roundNumberElement.textContent.match(/round\s*(\d+)/i);
            if (match) return parseInt(match[1]);
        }

        // Method 2: Look for data attribute
        const roundNum = summaryRoundElement.getAttribute('data-round');
        if (roundNum) return parseInt(roundNum);

        // Method 3: Extract from class name
        const classList = summaryRoundElement.classList;
        for (const className of classList) {
            const match = className.match(/round-(\d+)/);
            if (match) return parseInt(match[1]);
        }

        // Method 4: Use index position as fallback
        const allRounds = document.querySelectorAll('.summary-round');
        const index = Array.from(allRounds).indexOf(summaryRoundElement);
        if (index >= 0) return index + 1;

        return null;
    }

    highlightMapElements(roundNumber) {
        this.isActive = true;
        
        // Find and highlight all elements for this round
        const elementsToHighlight = [
            // Guess marker
            `.guess-marker-container.round-${roundNumber}`,
            // Correct location marker  
            `.correct-marker-container.round-${roundNumber}`,
            // Stippled line overlay
            `.stippled-line-overlay.round-${roundNumber}`
        ];

        elementsToHighlight.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                this.highlightElement(element, roundNumber);
            });
        });

        // Also try leaflet marker containers
        this.highlightLeafletMarkers(roundNumber);
    }

    highlightLeafletMarkers(roundNumber) {
        // Find leaflet markers by their container classes
        const markerSelectors = [
            `.leaflet-marker-icon.guess-marker-container.round-${roundNumber}`,
            `.leaflet-marker-icon.correct-marker-container.round-${roundNumber}`
        ];

        markerSelectors.forEach(selector => {
            const markers = document.querySelectorAll(selector);
            markers.forEach(marker => {
                this.highlightElement(marker, roundNumber);
            });
        });
    }

    highlightElement(element, roundNumber) {
        if (!element || this.highlightedElements.has(element)) return;

        // Store original styles
        const originalStyles = {
            transform: element.style.transform || '',
            filter: element.style.filter || '',
            zIndex: element.style.zIndex || '',
            opacity: element.style.opacity || ''
        };
        this.originalStyles.set(element, originalStyles);

        // Apply highlight effects based on element type
        this.applyHighlightEffect(element, roundNumber);
        
        this.highlightedElements.add(element);
    }

    applyHighlightEffect(element, roundNumber) {
        const isMarker = element.classList.contains('guess-marker-container') || 
                        element.classList.contains('correct-marker-container') ||
                        element.classList.contains('leaflet-marker-icon');
        
        const isLine = element.classList.contains('stippled-line-overlay');

        if (isMarker) {
            // Enhanced marker highlighting - scale up and add glow while preserving anchor
            element.style.filter = 'drop-shadow(0 0 20px rgba(255, 255, 255, 1)) drop-shadow(0 0 30px rgba(16, 185, 129, 0.8)) drop-shadow(0 0 40px rgba(16, 185, 129, 0.6)) brightness(1.3) saturate(1.4)';
            element.style.zIndex = (parseInt(element.style.zIndex) || 1000) + 10000;
            
            // Scale the marker while maintaining anchor point (bottom center)
            const currentTransform = element.style.transform || '';
            element.style.transform = `${currentTransform} scale(1.3)`;
            
            // Add highlight classes for animations
            element.classList.add('map-highlight-active');
            
            // Enhance colors while keeping original design
            this.enhanceMarkerVisibility(element);
            
        } else if (isLine) {
            // Line highlighting effects - make it stand out
            const linePath = element.querySelector('.stippled-path');
            if (linePath) {
                linePath.style.stroke = '#10b981'; // Bright green for visibility
                linePath.style.strokeWidth = '5';
                linePath.style.strokeOpacity = '1';
                linePath.style.filter = 'drop-shadow(0 0 8px rgba(16, 185, 129, 1)) drop-shadow(0 0 12px rgba(255, 255, 255, 0.8))';
                linePath.style.animation = 'stippled-glow 1.5s ease-in-out infinite alternate';
            }
            
            element.style.zIndex = '1500';
            element.classList.add('line-highlight-active');
        }
    }

    enhanceMarkerVisibility(element) {
        // Find and enhance the SVG elements within the marker for better visibility
        const markerBody = element.querySelector('.marker-body');
        const markerPin = element.querySelector('.marker-pin');
        const flagFabric = element.querySelector('.flag-fabric');
        const flagPole = element.querySelector('.flag-pole');

        if (markerBody) {
            // Store original styles for restoration
            if (!element.dataset.originalBodyFill) {
                element.dataset.originalBodyFill = markerBody.getAttribute('fill') || markerBody.style.fill || '';
                element.dataset.originalBodyStroke = markerBody.getAttribute('stroke') || markerBody.style.stroke || '';
                element.dataset.originalBodyStrokeWidth = markerBody.getAttribute('stroke-width') || markerBody.style.strokeWidth || '';
            }
            
            // Enhance colors instead of making white - keep design but more vibrant
            markerBody.style.fill = '#06d6a0'; // Bright teal-green
            markerBody.style.stroke = '#000000'; // Black outline for contrast
            markerBody.style.strokeWidth = '3';
        }

        if (markerPin) {
            if (!element.dataset.originalPinFill) {
                element.dataset.originalPinFill = markerPin.getAttribute('fill') || markerPin.style.fill || '';
            }
            markerPin.style.fill = '#003d29'; // Dark green for contrast
        }

        if (flagFabric) {
            if (!element.dataset.originalFlagFill) {
                element.dataset.originalFlagFill = flagFabric.getAttribute('fill') || flagFabric.style.fill || '';
                element.dataset.originalFlagStroke = flagFabric.getAttribute('stroke') || flagFabric.style.stroke || '';
                element.dataset.originalFlagStrokeWidth = flagFabric.getAttribute('stroke-width') || flagFabric.style.strokeWidth || '';
            }
            // Enhanced red flag with better contrast
            flagFabric.style.fill = '#ff1744'; // Bright red
            flagFabric.style.stroke = '#000000'; // Black outline
            flagFabric.style.strokeWidth = '2';
        }

        if (flagPole) {
            if (!element.dataset.originalPoleFill) {
                element.dataset.originalPoleFill = flagPole.getAttribute('fill') || flagPole.style.fill || '';
                element.dataset.originalPoleStroke = flagPole.getAttribute('stroke') || flagPole.style.stroke || '';
            }
            flagPole.style.fill = '#3e2723'; // Darker brown
            flagPole.style.stroke = '#000000'; // Black outline for definition
        }
    }

    unhighlightMapElements(roundNumber) {
        // Remove highlights from all elements for this round
        this.highlightedElements.forEach(element => {
            if (element.classList.contains(`round-${roundNumber}`)) {
                this.unhighlightElement(element);
            }
        });

        // Clean up if no elements are highlighted
        if (this.highlightedElements.size === 0) {
            this.isActive = false;
        }
    }

    unhighlightElement(element) {
        if (!element || !this.highlightedElements.has(element)) return;

        // Restore original styles
        const originalStyles = this.originalStyles.get(element);
        if (originalStyles) {
            element.style.transform = originalStyles.transform;
            element.style.filter = originalStyles.filter;
            element.style.zIndex = originalStyles.zIndex;
            element.style.opacity = originalStyles.opacity;
        }

        // Remove highlight classes
        element.classList.remove('map-highlight-active', 'line-highlight-active');

        // Restore marker SVG element styles
        this.restoreMarkerVisibility(element);

        // Restore line styles if it's a line element
        const linePath = element.querySelector('.stippled-path');
        if (linePath) {
            linePath.style.stroke = '#374151';
            linePath.style.strokeWidth = '3';
            linePath.style.strokeOpacity = '0.85';
            linePath.style.filter = 'drop-shadow(0 1px 3px rgba(0,0,0,0.2))';
            linePath.style.animation = '';
        }

        // Clean up
        this.highlightedElements.delete(element);
        this.originalStyles.delete(element);
    }

    restoreMarkerVisibility(element) {
        // Restore original SVG element styles
        const markerBody = element.querySelector('.marker-body');
        const markerPin = element.querySelector('.marker-pin');
        const flagFabric = element.querySelector('.flag-fabric');
        const flagPole = element.querySelector('.flag-pole');

        if (markerBody && element.dataset.originalBodyFill !== undefined) {
            markerBody.style.fill = element.dataset.originalBodyFill;
            markerBody.style.stroke = element.dataset.originalBodyStroke;
            markerBody.style.strokeWidth = element.dataset.originalBodyStrokeWidth;
            
            // Clean up data attributes
            delete element.dataset.originalBodyFill;
            delete element.dataset.originalBodyStroke;
            delete element.dataset.originalBodyStrokeWidth;
        }

        if (markerPin && element.dataset.originalPinFill !== undefined) {
            markerPin.style.fill = element.dataset.originalPinFill;
            delete element.dataset.originalPinFill;
        }

        if (flagFabric && element.dataset.originalFlagFill !== undefined) {
            flagFabric.style.fill = element.dataset.originalFlagFill;
            flagFabric.style.stroke = element.dataset.originalFlagStroke;
            flagFabric.style.strokeWidth = element.dataset.originalFlagStrokeWidth;
            
            delete element.dataset.originalFlagFill;
            delete element.dataset.originalFlagStroke;
            delete element.dataset.originalFlagStrokeWidth;
        }

        if (flagPole && element.dataset.originalPoleFill !== undefined) {
            flagPole.style.fill = element.dataset.originalPoleFill;
            flagPole.style.stroke = element.dataset.originalPoleStroke;
            
            delete element.dataset.originalPoleFill;
            delete element.dataset.originalPoleStroke;
        }
    }

    // Public methods
    clearAllHighlights() {
        this.highlightedElements.forEach(element => {
            this.unhighlightElement(element);
        });
    }

    isHighlightActive() {
        return this.isActive;
    }

    // Cleanup method
    cleanup() {
        this.clearAllHighlights();
        this.isActive = false;
        this.highlightedElements.clear();
        this.originalStyles.clear();
    }
}

// Initialize the highlighter
let summaryMapHighlighter;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        summaryMapHighlighter = new SummaryMapHighlighter();
        window.summaryMapHighlighter = summaryMapHighlighter;
    });
} else {
    summaryMapHighlighter = new SummaryMapHighlighter();
    window.summaryMapHighlighter = summaryMapHighlighter;
}

// Add dynamic CSS for highlight animations
const highlightStyleSheet = document.createElement('style');
highlightStyleSheet.textContent = `
    /* Enhanced marker highlight animations */
    .map-highlight-active {
        animation: marker-highlight-pulse 1.8s ease-in-out infinite alternate !important;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
        transform-origin: 50% 100% !important; /* Maintain anchor point at bottom center */
    }

    @keyframes marker-highlight-pulse {
        0% { 
            filter: drop-shadow(0 0 15px rgba(16, 185, 129, 0.8)) drop-shadow(0 0 25px rgba(16, 185, 129, 0.6)) brightness(1.3) saturate(1.4);
        }
        100% { 
            filter: drop-shadow(0 0 25px rgba(16, 185, 129, 1)) drop-shadow(0 0 40px rgba(16, 185, 129, 0.8)) drop-shadow(0 0 60px rgba(255, 255, 255, 0.6)) brightness(1.5) saturate(1.6);
        }
    }

    /* Line highlight animations with better colors */
    .line-highlight-active {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }

    @keyframes stippled-glow {
        0% { 
            filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.8));
            stroke-opacity: 1;
        }
        100% { 
            filter: drop-shadow(0 0 15px rgba(16, 185, 129, 1)) drop-shadow(0 0 25px rgba(255, 255, 255, 0.8));
            stroke-opacity: 1;
        }
    }

    /* Enhanced summary round hover state */
    .summary-round:hover {
        cursor: pointer !important;
        background: rgba(4, 8, 3, 0.9) !important;
        border-color: rgba(43, 124, 43, 0.6) !important;
        transform: translateY(-3px) !important;
        box-shadow: 
            0 6px 20px rgba(0, 0, 0, 0.4),
            0 3px 12px rgba(153, 238, 153, 0.2) !important;
    }

    /* Flag highlight animation for more dramatic effect */
    .map-highlight-active .flag-fabric {
        animation: flag-highlight-flutter 1.2s ease-in-out infinite !important;
    }

    @keyframes flag-highlight-flutter {
        0%, 100% { 
            transform: scaleX(1) scaleY(1); 
        }
        25% { 
            transform: scaleX(0.9) scaleY(1.05) skewX(-4deg); 
        }
        75% { 
            transform: scaleX(1.1) scaleY(0.95) skewX(3deg); 
        }
    }

    /* Additional marker highlight for bounce effect */
    .map-highlight-active .custom-marker,
    .map-highlight-active .correct-location-marker {
        animation: marker-highlight-bounce 2s ease-in-out infinite !important;
    }

    @keyframes marker-highlight-bounce {
        0%, 100% { 
            transform: scale(1.3) translateY(0px); 
        }
        50% { 
            transform: scale(1.35) translateY(-3px); 
        }
    }

    /* Reduced motion accessibility */
    @media (prefers-reduced-motion: reduce) {
        .map-highlight-active,
        .line-highlight-active,
        .map-highlight-active .flag-fabric,
        .map-highlight-active .custom-marker,
        .map-highlight-active .correct-location-marker {
            animation: none !important;
            transition: none !important;
        }
        
        /* Still provide some highlighting for accessibility */
        .map-highlight-active {
            filter: drop-shadow(0 0 20px rgba(16, 185, 129, 1)) brightness(1.4) !important;
            transform: scale(1.2) !important;
        }
    }
`;
document.head.appendChild(highlightStyleSheet);

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (summaryMapHighlighter) {
        summaryMapHighlighter.cleanup();
    }
});