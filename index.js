document.addEventListener('DOMContentLoaded', function() {
    // Timer buttons functionality
    const timerButtons = document.querySelectorAll('.timer-button');
    const timeSlider = document.getElementById('timeSlider');
    const timeRange = document.getElementById('timeRange');
    const timeLabel = document.getElementById('timeLabel');
    const timerFill = document.getElementById('timerFill');

    // Timeframe buttons functionality
    const timeframeButtons = document.querySelectorAll('.timeframe-button');
    const timeframeSlider = document.getElementById('timeframeSlider');
    const timeframeMinRange = document.getElementById('timeframeMinRange');
    const timeframeMaxRange = document.getElementById('timeframeMaxRange');
    const timeframeLabel = document.getElementById('timeframeLabel');
    const timeframeFill = document.getElementById('timeframeFill');

    // Handle timer button clicks
    timerButtons.forEach((button, index) => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            console.log(`Timer button ${index} clicked:`, this.dataset.timer);
            
            timerButtons.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');

            if (this.dataset.timer === 'yes') {
                console.log('Showing time slider');
                timeSlider.classList.remove('hidden');
            } else {
                console.log('Hiding time slider');
                timeSlider.classList.add('hidden');
            }
        });
    });

    // Handle timeframe button clicks
    timeframeButtons.forEach((button, index) => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            console.log(`Timeframe button ${index} clicked:`, this.dataset.timeframe);
            
            timeframeButtons.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');

            if (this.dataset.timeframe === 'flexible') {
                console.log('Showing timeframe slider');
                timeframeSlider.classList.remove('hidden');
            } else {
                console.log('Hiding timeframe slider');
                timeframeSlider.classList.add('hidden');
            }
        });
    });

    // Update timer slider and fill
    function updateTimerSlider() {
        const value = parseInt(timeRange.value);
        const max = parseInt(timeRange.max);
        const min = parseInt(timeRange.min);
        const percentage = ((value - min) / (max - min)) * 100;
        
        timerFill.style.width = percentage + '%';
        timeLabel.textContent = value + ' seconds';
    }

    timeRange.addEventListener('input', updateTimerSlider);
    
    // Initialize timer slider
    updateTimerSlider();

    // Dual range slider functionality for timeframe
    let minVal = 1;
    let maxVal = 100;

    function updateTimeframeSlider() {
        const minPercent = ((minVal - 1) / (100 - 1)) * 100;
        const maxPercent = ((maxVal - 1) / (100 - 1)) * 100;
        
        timeframeFill.style.left = minPercent + '%';
        timeframeFill.style.width = (maxPercent - minPercent) + '%';
        
        if (minVal === maxVal) {
            timeframeLabel.textContent = minVal + ' years';
        } else {
            timeframeLabel.textContent = minVal + ' - ' + maxVal + ' years';
        }
    }

    if (timeframeMinRange && timeframeMaxRange) {
        timeframeMinRange.addEventListener('input', function() {
            const value = parseInt(this.value);
            if (value >= maxVal) {
                minVal = maxVal - 1;
                this.value = minVal;
            } else {
                minVal = value;
            }
            updateTimeframeSlider();
        });

        timeframeMaxRange.addEventListener('input', function() {
            const value = parseInt(this.value);
            if (value <= minVal) {
                maxVal = minVal + 1;
                this.value = maxVal;
            } else {
                maxVal = value;
            }
            updateTimeframeSlider();
        });

        // Initialize timeframe slider
        minVal = parseInt(timeframeMinRange.value);
        maxVal = parseInt(timeframeMaxRange.value);
        updateTimeframeSlider();
    }
});