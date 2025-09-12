// Animation utilities - Shared across all pages
class AnimationUtils {
    
    // Button Animation Methods
    static addButtonHoverEffect(button) {
        if (!button.classList.contains('active')) {
            button.style.transform = 'translateY(-2px) scale(1.02)';
            setTimeout(() => {
                if (!button.matches(':hover')) {
                    button.style.transform = '';
                }
            }, 300);
        }
    }

    static addClickAnimation(button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    }

    static createRipple(event, button) {
        const ripple = button.querySelector('.btn-ripple');
        if (!ripple) return;

        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.transform = 'scale(0)';
        ripple.style.opacity = '1';

        // Trigger ripple animation
        requestAnimationFrame(() => {
            ripple.style.transform = 'scale(4)';
            ripple.style.opacity = '0';
        });
    }

    // Slider Animation Methods
    static addSliderPulse(element) {
        element.style.filter = 'brightness(1.2)';
        element.style.transform = 'scaleY(1.1)';
        
        setTimeout(() => {
            element.style.filter = '';
            element.style.transform = '';
        }, 150);
    }

    static addSliderShake(slider) {
        slider.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            slider.style.animation = '';
        }, 500);
    }

    // Stagger Animation for Elements
    static staggerAnimation(elements, delay = 100, startDelay = 0) {
        elements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                el.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * delay + startDelay);
        });
    }

    // Slide Animation for Slider Containers
    static slideIn(slider) {
        if (!slider) return;
        
        slider.classList.remove('hidden');
        
        // Staggered animation for child elements
        const elements = slider.querySelectorAll('.slider-wrapper, .dual-slider-wrapper, .slider-label-container');
        elements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                el.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 100 + 50);
        });
        
        setTimeout(() => slider.classList.add('visible'), 10);
    }

    static slideOut(slider) {
        if (!slider) return;
        
        const elements = slider.querySelectorAll('.slider-wrapper, .dual-slider-wrapper, .slider-label-container');
        elements.forEach((el, index) => {
            setTimeout(() => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(-20px)';
            }, index * 50);
        });
        
        slider.classList.remove('visible');
        setTimeout(() => {
            slider.classList.add('hidden');
            // Reset transforms
            elements.forEach(el => {
                el.style.opacity = '';
                el.style.transform = '';
                el.style.transition = '';
            });
        }, 300);
    }

    // Scale Animation for Labels
    static scaleLabel(label, newText, callback) {
        label.style.transform = 'scale(0.9)';
        setTimeout(() => {
            if (newText) label.textContent = newText;
            label.style.transform = 'scale(1)';
            if (callback) callback();
        }, 100);
    }

    // Page Load Animations
    static initializePageLoadAnimation() {
        // Add loading completion effect
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 1500);
    }
}

// Add CSS animations via JavaScript
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);