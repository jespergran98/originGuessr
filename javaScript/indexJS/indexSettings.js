class IndexGameSettings {
    constructor() {
        this.buttonManager = new ButtonManager();
        
        // Timer increments in seconds
        this.timerIncrements = [15, 20, 30, 45, 60, 90, 120, 180, 240, 300, 420, 600];
        
        // Historical timeframe increments
        this.timeframeIncrements = [
            "5 Million BC",
            "500,000 BC", 
            "100,000 BC",
            "10,000 BC",
            "1,000 BC",
            "0",
            "500 AD",
            "1000 AD",
            "1250 AD",
            "1500 AD",
            "1750 AD",
            "1900 AD",
            "2025 AD"
        ];
        
        // Corresponding years for timeframe filtering
        this.timeframeYears = [
            -5000000, -500000, -100000, -10000, -1000, 0,
            500, 1000, 1250, 1500, 1750, 1900, 2025
        ];
        
        this.initializeElements();
        this.loadPreviousSettings(); // Load any previous settings from URL
        this.setDefaultStates();
        this.bindEvents();
        // Delay slider initialization to ensure DOM is ready
        requestAnimationFrame(() => {
            this.initializeSliders();
            this.forceSliderUpdate();
        });
        this.initializeAnimations();
        this.createTimeframeTicks();
        this.createTimerTicks();
    }

    initializeElements() {
        this.timerButtons = document.querySelectorAll('[data-timer]');
        this.timeframeButtons = document.querySelectorAll('[data-timeframe]');
        this.timeSlider = document.getElementById('timeSlider');
        this.timeframeSlider = document.getElementById('timeframeSlider');
        this.timeRange = document.getElementById('timeRange');
        this.timeLabel = document.getElementById('timeLabel');
        this.timerFill = document.getElementById('timerFill');
        this.timerGlow = document.getElementById('timerGlow');
        this.timeframeMin = document.getElementById('timeframeMin');
        this.timeframeMax = document.getElementById('timeframeMax');
        this.timeframeLabel = document.getElementById('timeframeLabel');
        this.timeframeFill = document.getElementById('timeframeFill');
        this.timeframeGlow = document.getElementById('timeframeGlow');
        this.playBtn = document.querySelector('.play-btn');
        this.titleLetters = document.querySelectorAll('.title-letter');
    }

    setDefaultStates() {
        this.buttonManager.setDefaultActive(this.timerButtons, '[data-timer="no"]');
        this.buttonManager.setDefaultActive(this.timeframeButtons, '[data-timeframe="unspecified"]');

        // Set timer slider min/max and default values
        if (this.timeRange) {
            const maxIndex = this.timerIncrements.length - 1;
            
            // Set min and max values (0-based index)
            this.timeRange.min = 0;
            this.timeRange.max = maxIndex;
            
            // Set default value to 60 seconds (index 4)
            const defaultIndex = this.timerIncrements.indexOf(60);
            this.timeRange.value = defaultIndex !== -1 ? defaultIndex : 4;
        }

        // Set timeframe slider min/max and default values
        if (this.timeframeMin && this.timeframeMax) {
            const maxIndex = this.timeframeIncrements.length - 1;
            
            // Set min and max values (0-based index)
            this.timeframeMin.min = 0;
            this.timeframeMin.max = maxIndex;
            this.timeframeMax.min = 0;
            this.timeframeMax.max = maxIndex;
            
            // Set default values: min = 0 (5 Million BC), max = last index (2025 AD)
            this.timeframeMin.value = 0;
            this.timeframeMax.value = maxIndex;
        }

        const activeTimer = this.buttonManager.getActiveButton(this.timerButtons);
        if (activeTimer?.dataset.timer === 'yes') {
            AnimationUtils.slideIn(this.timeSlider);
        } else {
            AnimationUtils.slideOut(this.timeSlider);
        }

        const activeTimeframe = this.buttonManager.getActiveButton(this.timeframeButtons);
        if (activeTimeframe?.dataset.timeframe === 'flexible') {
            AnimationUtils.slideIn(this.timeframeSlider);
        } else {
            AnimationUtils.slideOut(this.timeframeSlider);
        }
    }

    createTimerTicks() {
        if (!this.timeSlider) return;
        
        const tickContainer = document.createElement('div');
        tickContainer.className = 'timer-ticks';
        
        const sliderContainer = this.timeSlider.querySelector('.slider-container');
        if (sliderContainer) {
            sliderContainer.appendChild(tickContainer);
            
            this.timerIncrements.forEach((seconds, index) => {
                const percentage = (index / (this.timerIncrements.length - 1)) * 100;
                
                // Create tick mark - make every 3rd tick major
                const tick = document.createElement('div');
                tick.className = `tick-mark ${index % 3 === 0 ? 'major' : ''}`;
                tick.style.left = `${percentage}%`;
                tickContainer.appendChild(tick);
                
                // Create tick label for major ticks and last tick
                if (index % 3 === 0 || index === this.timerIncrements.length - 1) {
                    const label = document.createElement('div');
                    label.className = 'tick-label';
                    
                    // Format label based on seconds
                    if (seconds < 60) {
                        label.textContent = `${seconds}s`;
                    } else {
                        const mins = Math.floor(seconds / 60);
                        const rem = seconds % 60;
                        label.textContent = rem === 0 ? `${mins}m` : `${mins}m${rem}s`;
                    }
                    
                    label.style.left = `${percentage}%`;
                    tickContainer.appendChild(label);
                }
            });
        }
    }

    createTimeframeTicks() {
        if (!this.timeframeSlider) return;
        
        const tickContainer = document.createElement('div');
        tickContainer.className = 'timeframe-ticks';
        
        const sliderContainer = this.timeframeSlider.querySelector('.dual-slider-container');
        if (sliderContainer) {
            sliderContainer.appendChild(tickContainer);
            
            this.timeframeIncrements.forEach((increment, index) => {
                const percentage = (index / (this.timeframeIncrements.length - 1)) * 100;
                
                // Create tick mark
                const tick = document.createElement('div');
                tick.className = `tick-mark ${index % 4 === 0 ? 'major' : ''}`;
                tick.style.left = `${percentage}%`;
                tickContainer.appendChild(tick);
                
                // Create tick label for major ticks only
                if (index % 4 === 0 || index === this.timeframeIncrements.length - 1) {
                    const label = document.createElement('div');
                    label.className = 'tick-label';
                    label.textContent = increment;
                    label.style.left = `${percentage}%`;
                    tickContainer.appendChild(label);
                }
            });
        }
    }

    bindEvents() {
        this.buttonManager.initializeButtonGroup(
            this.timerButtons,
            (button) => this.handleTimerToggle(button),
            'timer'
        );

        this.buttonManager.initializeButtonGroup(
            this.timeframeButtons,
            (button) => this.handleTimeframeToggle(button),
            'timeframe'
        );

        if (this.timeRange) {
            ['input', 'change'].forEach(event =>
                this.timeRange.addEventListener(event, () => this.updateTimerSlider())
            );
        }

        if (this.timeframeMin && this.timeframeMax) {
            ['input', 'change'].forEach(event => {
                this.timeframeMin.addEventListener(event, () => this.updateTimeframeSlider());
                this.timeframeMax.addEventListener(event, () => this.updateTimeframeSlider());
            });
        }

        if (this.playBtn) {
            this.buttonManager.initializeRippleEffect([this.playBtn]);
            this.playBtn.addEventListener('click', () => this.startGame());
        }

        this.titleLetters.forEach((letter, index) => {
            letter.style.setProperty('--i', index);
            letter.addEventListener('mouseenter', () => this.animateLetterHover(letter));
            letter.addEventListener('mouseleave', () => this.resetLetterHover(letter));
        });

        // Add window load event to ensure everything is properly initialized
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.forceSliderUpdate();
            }, 100);
        });
    }

    handleTimerToggle(button) {
        if (button.dataset.timer === 'yes') {
            AnimationUtils.slideIn(this.timeSlider);
            // Update slider visuals when shown
            setTimeout(() => {
                this.updateTimerSlider();
            }, 100);
        } else {
            AnimationUtils.slideOut(this.timeSlider);
        }
    }

    handleTimeframeToggle(button) {
        if (button.dataset.timeframe === 'flexible') {
            AnimationUtils.slideIn(this.timeframeSlider);
            // Update slider visuals when shown
            setTimeout(() => {
                this.updateTimeframeSlider();
            }, 100);
        } else {
            AnimationUtils.slideOut(this.timeframeSlider);
        }
    }

    formatTimeLabel(seconds) {
        if (seconds < 60) return seconds + " seconds";
        let mins = Math.floor(seconds / 60);
        let rem = seconds % 60;
        return (rem === 0) ? (mins + " minute" + (mins > 1 ? "s" : "")) : (mins + " minute" + (mins > 1 ? "s" : "") + " " + rem + " seconds");
    }

    updateTimerSlider() {
        if (!this.timeRange || !this.timerFill || !this.timeLabel) return;

        // Always get the current value from the DOM element
        const currentValue = this.timeRange.value;
        const index = parseInt(currentValue);
        
        // Validate the index is within bounds
        if (index < 0 || index >= this.timerIncrements.length) return;
        
        const seconds = this.timerIncrements[index];
        const maxIndex = this.timerIncrements.length - 1;
        const percentage = (index / maxIndex) * 100;

        // Force immediate update without animation for initialization
        this.timerFill.style.width = `${percentage}%`;
        if (this.timerGlow) {
            this.timerGlow.style.width = `${percentage}%`;
        }
        this.updateLabel(this.timeLabel, this.formatTimeLabel(seconds));

        // Debug logging
        console.log(`Timer slider - Index: ${index}, Seconds: ${seconds}, Percentage: ${percentage}%`);

        // Also trigger a repaint to ensure visual update
        this.timerFill.offsetHeight;
        if (this.timerGlow) {
            this.timerGlow.offsetHeight;
        }
    }

    updateTimeframeSlider() {
        if (!this.timeframeMin || !this.timeframeMax || !this.timeframeFill || !this.timeframeLabel) return;

        // Always get the current values from the DOM elements
        const currentMinValue = this.timeframeMin.value;
        const currentMaxValue = this.timeframeMax.value;
        
        let minIndex = parseInt(currentMinValue);
        let maxIndex = parseInt(currentMaxValue);

        // Validate indices are within bounds
        const maxBoundIndex = this.timeframeIncrements.length - 1;
        minIndex = Math.max(0, Math.min(minIndex, maxBoundIndex));
        maxIndex = Math.max(0, Math.min(maxIndex, maxBoundIndex));

        // Prevent handles from crossing over - constraint enforcement without moving handles
        if (minIndex >= maxIndex) {
            // Don't automatically move handles, just constrain them at their limits
            if (minIndex === maxBoundIndex) {
                // If min handle is at maximum, constrain max handle to stay at maximum
                minIndex = maxBoundIndex - 1;
                this.timeframeMin.value = minIndex;
            } else if (maxIndex === 0) {
                // If max handle is at minimum, constrain min handle to stay at minimum + 1
                maxIndex = 1;
                this.timeframeMax.value = maxIndex;
            } else {
                // For all other cases, maintain minimum 1-increment gap by reverting the problematic move
                // The handle that caused the conflict stays at its previous valid position
                const prevMinIndex = parseInt(this.timeframeMin.getAttribute('data-prev-value') || '0');
                const prevMaxIndex = parseInt(this.timeframeMax.getAttribute('data-prev-value') || maxBoundIndex.toString());
                
                // Check which handle moved into invalid territory and revert it
                if (minIndex !== prevMinIndex && minIndex >= maxIndex) {
                    minIndex = Math.min(prevMinIndex, maxIndex - 1);
                    this.timeframeMin.value = minIndex;
                } else if (maxIndex !== prevMaxIndex && maxIndex <= minIndex) {
                    maxIndex = Math.max(prevMaxIndex, minIndex + 1);
                    this.timeframeMax.value = maxIndex;
                }
            }
        }

        // Store current values for next comparison
        this.timeframeMin.setAttribute('data-prev-value', minIndex.toString());
        this.timeframeMax.setAttribute('data-prev-value', maxIndex.toString());

        const totalIncrements = this.timeframeIncrements.length - 1;
        const minPercent = (minIndex / totalIncrements) * 100;
        const maxPercent = (maxIndex / totalIncrements) * 100;

        // Force immediate update without animation for initialization
        this.timeframeFill.style.left = `${minPercent}%`;
        this.timeframeFill.style.width = `${maxPercent - minPercent}%`;
        if (this.timeframeGlow) {
            this.timeframeGlow.style.left = `${minPercent}%`;
            this.timeframeGlow.style.width = `${maxPercent - minPercent}%`;
        }
        
        const minLabel = this.timeframeIncrements[minIndex];
        const maxLabel = this.timeframeIncrements[maxIndex];
        const labelText = `${minLabel} - ${maxLabel}`;
        this.updateLabel(this.timeframeLabel, labelText);

        // Debug logging
        console.log(`Timeframe slider - MinIndex: ${minIndex}, MaxIndex: ${maxIndex}, MinPercent: ${minPercent}%, MaxPercent: ${maxPercent}%`);

        // Also trigger a repaint to ensure visual update
        this.timeframeFill.offsetHeight;
        if (this.timeframeGlow) {
            this.timeframeGlow.offsetHeight;
        }
    }

    updateLabel(labelElement, newText) {
        if (labelElement?.textContent !== newText) {
            labelElement.textContent = newText;
        }
    }

    initializeSliders() {
        // Wait for DOM to be fully ready
        if (this.timeRange && this.timerFill) {
            this.updateTimerSlider();
        }
        
        if (this.timeframeMin && this.timeframeMax && this.timeframeFill) {
            this.updateTimeframeSlider();
        }
    }

    // Force update of all slider visuals - useful for ensuring sync
    forceSliderUpdate() {
        console.log('Forcing slider updates...');
        
        // Multiple calls with small delays to ensure proper rendering
        setTimeout(() => {
            this.refreshSliderVisuals();
        }, 50);
        
        setTimeout(() => {
            this.refreshSliderVisuals();
        }, 150);
        
        setTimeout(() => {
            this.refreshSliderVisuals();
        }, 300);
        
        // Also add a longer delay for stubborn cases
        setTimeout(() => {
            this.refreshSliderVisuals();
        }, 500);
    }

    initializeAnimations() {
        this.titleLetters.forEach((letter, index) => {
            letter.style.opacity = '0';
            letter.style.transform = 'translateY(30px)';
            setTimeout(() => {
                letter.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                letter.style.opacity = '1';
                letter.style.transform = 'translateY(0)';
            }, index * 50 + 300);
        });

        const cards = document.querySelectorAll('.glass-card');
        AnimationUtils.staggerAnimation(cards, 150, 600);

        if (this.playBtn) {
            this.playBtn.style.opacity = '0';
            this.playBtn.style.transform = 'scale(0.9)';
            setTimeout(() => {
                this.playBtn.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                this.playBtn.style.opacity = '1';
                this.playBtn.style.transform = 'scale(1)';
            }, 400);
        }
    }

    animateLetterHover(letter) {
        letter.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        letter.style.transform = 'translateY(-10px) scale(1.1) rotateZ(5deg)';
        letter.style.filter = 'brightness(1.2)';
    }

    resetLetterHover(letter) {
        letter.style.transform = 'translateY(0) scale(1) rotateZ(0deg)';
        letter.style.filter = 'brightness(1)';
    }

    refreshSliderVisuals() {
        this.updateTimerSlider();
        this.updateTimeframeSlider();
    }

    loadPreviousSettings() {
        // Check if there are URL parameters that might contain previous slider settings
        const urlParams = new URLSearchParams(window.location.search);
        
        // Load timer settings if they exist
        const timerSeconds = urlParams.get('timerSeconds');
        if (timerSeconds && this.timeRange) {
            const seconds = parseInt(timerSeconds);
            const index = this.timerIncrements.indexOf(seconds);
            if (index !== -1) {
                this.timeRange.value = index;
                console.log(`Loaded timer setting: ${seconds} seconds (index ${index})`);
            }
        }
        
        // Load timeframe settings if they exist
        const timeframeMinIndex = urlParams.get('timeframeMinIndex');
        const timeframeMaxIndex = urlParams.get('timeframeMaxIndex');
        
        if (timeframeMinIndex && timeframeMaxIndex && this.timeframeMin && this.timeframeMax) {
            const minIndex = parseInt(timeframeMinIndex);
            const maxIndex = parseInt(timeframeMaxIndex);
            
            if (minIndex >= 0 && minIndex < this.timeframeIncrements.length &&
                maxIndex >= 0 && maxIndex < this.timeframeIncrements.length) {
                this.timeframeMin.value = minIndex;
                this.timeframeMax.value = maxIndex;
                console.log(`Loaded timeframe settings: ${minIndex} to ${maxIndex}`);
            }
        }
    }

    // Utility method to get current timer selection as readable value
    getTimerSelection() {
        if (!this.timeRange) return null;
        
        const index = parseInt(this.timeRange.value);
        const seconds = this.timerIncrements[index];
        
        return {
            seconds: seconds,
            formatted: this.formatTimeLabel(seconds),
            index: index
        };
    }

    // Utility method to get current timeframe selection as readable values
    getTimeframeSelection() {
        if (!this.timeframeMin || !this.timeframeMax) return null;
        
        const minIndex = parseInt(this.timeframeMin.value);
        const maxIndex = parseInt(this.timeframeMax.value);
        
        return {
            min: this.timeframeIncrements[minIndex],
            max: this.timeframeIncrements[maxIndex],
            minIndex: minIndex,
            maxIndex: maxIndex
        };
    }

    // Check if timer is enabled
    isTimerEnabled() {
        const activeTimer = this.buttonManager.getActiveButton(this.timerButtons);
        return activeTimer?.dataset.timer === 'yes';
    }

    startGame() {
        const activeTimeframe = this.buttonManager.getActiveButton(this.timeframeButtons);
        const timerEnabled = this.isTimerEnabled();
        
        let params = new URLSearchParams();
        params.append('round', '1');
        params.append('totalScore', '0');
        params.append('scores', '[]');

        // Add timeframe parameters if flexible timeframe is selected
        if (activeTimeframe && activeTimeframe.dataset.timeframe === 'flexible') {
            const selection = this.getTimeframeSelection();
            if (selection) {
                params.append('timeframeMinIndex', selection.minIndex.toString());
                params.append('timeframeMaxIndex', selection.maxIndex.toString());
            }
        }

        // Add timer parameters if timer is enabled
        if (timerEnabled) {
            const timerSelection = this.getTimerSelection();
            if (timerSelection) {
                params.append('timerSeconds', timerSelection.seconds.toString());
            }
        }

        window.location.href = `guess.html?${params.toString()}`;
    }
}