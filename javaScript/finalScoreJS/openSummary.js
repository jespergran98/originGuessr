// Summary mode handler for Origin Guessr final score page
class SummaryHandler {
    constructor() {
        this.isSummaryMode = false;
        this.originalElements = {};
        this.exitButton = null;
        this.animationDuration = 800;
        this.staggerDelay = 50;
        
        this.initialize();
    }

    initialize() {
        // Wait for the final score display to be ready
        this.waitForFinalScoreDisplay(() => {
            this.attachSummaryListener();
        });
    }

    waitForFinalScoreDisplay(callback) {
        if (window.finalScoreDisplay && window.finalScoreDisplay.summaryBtn) {
            callback();
            return;
        }
        setTimeout(() => this.waitForFinalScoreDisplay(callback), 100);
    }

    attachSummaryListener() {
        const summaryBtn = window.finalScoreDisplay.summaryBtn;
        if (summaryBtn) {
            // Remove existing click listeners and add our own
            summaryBtn.onclick = null;
            summaryBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSummaryMode();
            });
        }
    }

    toggleSummaryMode() {
        if (this.isSummaryMode) {
            this.exitSummaryMode();
        } else {
            this.enterSummaryMode();
        }
    }

    enterSummaryMode() {
        if (this.isSummaryMode) return;
        
        console.log('Entering summary mode...');
        this.isSummaryMode = true;
        
        // Store original elements for restoration
        this.storeOriginalElements();
        
        // Animate out all UI elements
        this.animateOutElements();
        
        // Create and show exit button after animation
        setTimeout(() => {
            this.createExitButton();
            this.hideMapOverlay();
        }, this.animationDuration + 200);
    }

    exitSummaryMode() {
        if (!this.isSummaryMode) return;
        
        console.log('Exiting summary mode...');
        this.isSummaryMode = false;
        
        // Remove exit button
        this.removeExitButton();
        
        // Restore map overlay
        this.showMapOverlay();
        
        // Animate in all UI elements
        setTimeout(() => {
            this.animateInElements();
        }, 100);
    }

    storeOriginalElements() {
        // Store references to all UI elements that need to be hidden
        this.originalElements = {
            mainContainer: document.querySelector('.main-container'),
            headerSection: document.querySelector('.header-section'),
            scoreSection: document.querySelector('.score-section'),
            buttonContainer: document.querySelector('.button-container'),
            particleCanvas: document.getElementById('particleCanvas'),
            mapOverlay: document.querySelector('.map-overlay')
        };
    }

    animateOutElements() {
        const elementsToAnimate = [
            this.originalElements.headerSection,
            this.originalElements.scoreSection,
            this.originalElements.buttonContainer,
            this.originalElements.particleCanvas
        ].filter(el => el);

        // Animate each element out with stagger
        elementsToAnimate.forEach((element, index) => {
            setTimeout(() => {
                this.animateElementOut(element);
            }, index * this.staggerDelay);
        });
    }

    animateInElements() {
        const elementsToAnimate = [
            this.originalElements.headerSection,
            this.originalElements.scoreSection,
            this.originalElements.buttonContainer,
            this.originalElements.particleCanvas
        ].filter(el => el);

        // Animate each element in with reverse stagger
        elementsToAnimate.reverse().forEach((element, index) => {
            setTimeout(() => {
                this.animateElementIn(element);
            }, index * this.staggerDelay);
        });
    }

    animateElementOut(element) {
        if (!element) return;
        
        element.style.transition = `all ${this.animationDuration}ms cubic-bezier(0.4, 0, 0.6, 1)`;
        element.style.opacity = '0';
        element.style.transform = 'translateY(-30px) scale(0.95)';
        element.style.pointerEvents = 'none';
    }

    animateElementIn(element) {
        if (!element) return;
        
        element.style.transition = `all ${this.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        element.style.opacity = '1';
        element.style.transform = 'translateY(0) scale(1)';
        element.style.pointerEvents = 'auto';
    }

    createExitButton() {
        // Create the exit button
        this.exitButton = document.createElement('button');
        this.exitButton.className = 'exit-summary-button';
        this.exitButton.innerHTML = `
            <span class="btn-text">Exit Summary</span>
            <svg class="exit-btn-icon" viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
        `;
        
        // Add hover effects
        this.exitButton.addEventListener('mouseenter', () => {
            this.exitButton.style.transform = 'translateY(-3px) scale(1.02)';
        });
        
        this.exitButton.addEventListener('mouseleave', () => {
            this.exitButton.style.transform = 'translateY(0) scale(1)';
        });
        
        // Add click handler with ripple effect
        this.exitButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.createRipple(e);
            setTimeout(() => this.exitSummaryMode(), 150);
        });
        
        // Add to page
        document.body.appendChild(this.exitButton);
        
        // Animate in
        setTimeout(() => {
            this.exitButton.style.opacity = '1';
            this.exitButton.style.transform = 'translateY(0)';
            this.exitButton.style.pointerEvents = 'auto';
        }, 100);
        
        console.log('Exit summary button created');
    }

    removeExitButton() {
        if (this.exitButton) {
            // Animate out
            this.exitButton.style.opacity = '0';
            this.exitButton.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                if (this.exitButton && this.exitButton.parentNode) {
                    this.exitButton.parentNode.removeChild(this.exitButton);
                }
                this.exitButton = null;
            }, 300);
        }
    }

    hideMapOverlay() {
        const mapOverlay = this.originalElements.mapOverlay;
        if (mapOverlay) {
            mapOverlay.style.transition = `opacity ${this.animationDuration}ms ease-out`;
            mapOverlay.style.opacity = '0';
            mapOverlay.style.pointerEvents = 'none';
        }
    }

    showMapOverlay() {
        const mapOverlay = this.originalElements.mapOverlay;
        if (mapOverlay) {
            mapOverlay.style.transition = `opacity ${this.animationDuration}ms ease-in`;
            mapOverlay.style.opacity = '1';
            mapOverlay.style.pointerEvents = 'auto';
        }
    }

    createRipple(event) {
        const button = event.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: radial-gradient(circle, rgba(153, 238, 153, 0.3) 0%, transparent 70%);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        // Add ripple animation if not already defined
        if (!document.getElementById('ripple-styles')) {
            const style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        button.appendChild(ripple);
        
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }

    // Public methods
    getCurrentMode() {
        return this.isSummaryMode ? 'summary' : 'normal';
    }

    isSummaryActive() {
        return this.isSummaryMode;
    }

    // Cleanup method
    cleanup() {
        if (this.exitButton && this.exitButton.parentNode) {
            this.exitButton.parentNode.removeChild(this.exitButton);
        }
        this.exitButton = null;
        this.originalElements = {};
        this.isSummaryMode = false;
    }
}

// Initialize the summary handler
const summaryHandler = new SummaryHandler();

// Make it globally accessible
window.summaryHandler = summaryHandler;

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    summaryHandler.cleanup();
});

console.log('Summary handler initialized');