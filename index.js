document.addEventListener('DOMContentLoaded', function() {
    // Timer buttons functionality
    const timerButtons = document.querySelectorAll('.timer-button');
    const timeSlider = document.getElementById('timeSlider');
    const timeRange = document.getElementById('timeRange');
    const timeLabel = document.getElementById('timeLabel');

    // Timeframe buttons functionality
    const timeframeButtons = document.querySelectorAll('.timeframe-button');
    const timeframeSlider = document.getElementById('timeframeSlider');
    const timeframeRange = document.getElementById('timeframeRange');
    const timeframeLabel = document.getElementById('timeframeLabel');

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

    // Update time slider label
    timeRange.addEventListener('input', function() {
        const value = parseInt(this.value);
        timeLabel.textContent = value + ' seconds';
    });

    // Update timeframe slider label
    timeframeRange.addEventListener('input', function() {
        const value = parseInt(this.value);
        timeframeLabel.textContent = value + ' years';
    });
});