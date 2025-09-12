// Button Manager - Shared button functionality
class ButtonManager {
    constructor() {
        this.activeButtons = new Map();
    }

    // Set active button in a group
    setActiveButton(buttons, activeButton) {
        buttons.forEach(btn => {
            btn.classList.remove('active');
            // Add smooth transition effect
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = '';
            }, 100);
        });
        
        activeButton.classList.add('active');
        // Add activation animation
        activeButton.style.transform = 'scale(1.05)';
        setTimeout(() => {
            activeButton.style.transform = '';
        }, 200);
    }

    // Initialize button group with events
    initializeButtonGroup(buttons, clickCallback, groupName) {
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Don't toggle if already active
                if (btn.classList.contains('active')) {
                    return;
                }
                
                this.setActiveButton(buttons, btn);
                AnimationUtils.addClickAnimation(btn);
                
                if (clickCallback) {
                    clickCallback(btn, e);
                }
            });
            
            btn.addEventListener('mouseenter', () => {
                AnimationUtils.addButtonHoverEffect(btn);
            });
        });

        // Store button group reference
        if (groupName) {
            this.activeButtons.set(groupName, buttons);
        }
    }

    // Get active button in a group
    getActiveButton(buttons) {
        return Array.from(buttons).find(btn => btn.classList.contains('active'));
    }

    // Set default active button if none is active
    setDefaultActive(buttons, defaultSelector) {
        const activeBtn = this.getActiveButton(buttons);
        if (!activeBtn) {
            const defaultBtn = document.querySelector(defaultSelector);
            if (defaultBtn) {
                defaultBtn.classList.add('active');
            }
        }
    }

    // Initialize ripple effect for buttons
    initializeRippleEffect(buttons) {
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                AnimationUtils.createRipple(e, btn);
            });
        });
    }
}