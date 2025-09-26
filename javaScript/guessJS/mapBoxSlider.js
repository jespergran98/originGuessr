// Timeline slider functionality for the map box
class TimelineSlider {
  constructor() {
    this.timeline = this.generateTimeline();
    this.currentIndex = this.timeline.indexOf(1337); // Start at 1337 AD
    this.isDragging = false;
    this.sliderContainer = null;
    this.sliderHandle = null;
    this.yearDisplay = null;
    this.containerRect = null;
    this.handleWidth = 0;
    
    this.init();
  }

  generateTimeline() {
    let timeline = [];
    
    // Generate timeline with varying increments
    for (let y = -5000000; y <= -3100000; y += 100000) timeline.push(y);
    for (let y = -3000000; y <= -1050000; y += 50000) timeline.push(y);
    for (let y = -1000000; y <= -525000; y += 25000) timeline.push(y);
    for (let y = -500000; y <= -320000; y += 20000) timeline.push(y);
    for (let y = -300000; y <= -110000; y += 10000) timeline.push(y);
    for (let y = -100000; y <= -55000; y += 5000) timeline.push(y);
    for (let y = -50000; y <= -32500; y += 2500) timeline.push(y);
    for (let y = -30000; y <= -11000; y += 1000) timeline.push(y);
    for (let y = -10000; y <= -5500; y += 500) timeline.push(y);
    for (let y = -5000; y <= -3250; y += 250) timeline.push(y);
    for (let y = -3000; y <= -1100; y += 100) timeline.push(y);
    for (let y = -1000; y <= -250; y += 50) timeline.push(y);
    for (let y = -200; y <= 25; y += 25) timeline.push(y);
    for (let y = 0; y <= 480; y += 20) timeline.push(y);
    for (let y = 500; y <= 1015; y += 15) timeline.push(y);
    for (let y = 1030; y <= 1490; y += 10) timeline.push(y);
    for (let y = 1500; y <= 1745; y += 5) timeline.push(y);
    for (let y = 1750; y <= 1898; y += 2) timeline.push(y);
    for (let y = 1900; y <= 2025; y += 1) timeline.push(y);
    
    // Ensure 1337 is included
    if (!timeline.includes(1337)) timeline.push(1337);
    
    // Remove duplicates and sort
    return [...new Set(timeline)].sort((a, b) => a - b);
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupSlider());
    } else {
      this.setupSlider();
    }
  }

  setupSlider() {
    this.sliderContainer = document.querySelector('.slider-container');
    this.sliderHandle = document.querySelector('.slider-handle');
    this.yearDisplay = document.querySelector('.year-display');

    if (!this.sliderContainer || !this.sliderHandle || !this.yearDisplay) {
      console.error('Slider elements not found');
      return;
    }

    // Calculate handle dimensions and container bounds
    this.updateDimensions();

    // Set initial position and year display
    this.updateSliderPosition();
    this.updateYearDisplay();

    // Add event listeners
    this.sliderHandle.addEventListener('mousedown', (e) => this.startDragging(e));
    this.sliderContainer.addEventListener('click', (e) => this.handleContainerClick(e));
    
    document.addEventListener('mousemove', (e) => this.handleDrag(e));
    document.addEventListener('mouseup', () => this.stopDragging());

    // Touch events for mobile
    this.sliderHandle.addEventListener('touchstart', (e) => this.startDragging(e));
    document.addEventListener('touchmove', (e) => this.handleDrag(e));
    document.addEventListener('touchend', () => this.stopDragging());

    // Update dimensions on window resize
    window.addEventListener('resize', () => {
      this.updateDimensions();
      this.updateSliderPosition();
    });
  }

  updateDimensions() {
    this.containerRect = this.sliderContainer.getBoundingClientRect();
    this.handleWidth = this.sliderHandle.getBoundingClientRect().width;
  }

  startDragging(e) {
    this.isDragging = true;
    this.sliderHandle.style.transition = 'none';
    this.updateDimensions(); // Update dimensions when starting drag
    e.preventDefault();
  }

  stopDragging() {
    if (this.isDragging) {
      this.isDragging = false;
      this.sliderHandle.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
    }
  }

  handleDrag(e) {
    if (!this.isDragging) return;

    e.preventDefault();
    
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    
    // Calculate position relative to container
    const relativeX = clientX - this.containerRect.left;
    
    // Calculate the maximum allowed position (container width minus half handle width on each side)
    const maxPosition = this.containerRect.width - (this.handleWidth / 2);
    const minPosition = this.handleWidth / 2;
    
    // Constrain the position within bounds
    const constrainedX = Math.max(minPosition, Math.min(maxPosition, relativeX));
    
    // Convert to percentage (0 to 1)
    const percentage = (constrainedX - minPosition) / (maxPosition - minPosition);
    
    // Convert percentage to timeline index
    const newIndex = Math.round(percentage * (this.timeline.length - 1));
    
    if (newIndex !== this.currentIndex) {
      this.currentIndex = newIndex;
      this.updateSliderPosition();
      this.updateYearDisplay();
    }
  }

  handleContainerClick(e) {
    if (e.target === this.sliderHandle || this.isDragging) return;

    this.updateDimensions();
    
    const relativeX = e.clientX - this.containerRect.left;
    
    // Calculate constraints same as in handleDrag
    const maxPosition = this.containerRect.width - (this.handleWidth / 2);
    const minPosition = this.handleWidth / 2;
    
    const constrainedX = Math.max(minPosition, Math.min(maxPosition, relativeX));
    const percentage = (constrainedX - minPosition) / (maxPosition - minPosition);
    
    this.currentIndex = Math.round(percentage * (this.timeline.length - 1));
    this.updateSliderPosition();
    this.updateYearDisplay();
  }

  updateSliderPosition() {
    if (!this.containerRect) {
      this.updateDimensions();
    }
    
    const percentage = this.currentIndex / (this.timeline.length - 1);
    
    // Calculate the available range for the handle center
    const maxPosition = this.containerRect.width - (this.handleWidth / 2);
    const minPosition = this.handleWidth / 2;
    const availableRange = maxPosition - minPosition;
    
    // Calculate the actual pixel position for the handle center
    const centerPosition = minPosition + (percentage * availableRange);
    
    // Position the handle so its center is at the calculated position
    // We use transform instead of left for better performance
    const translateX = centerPosition - (this.handleWidth / 2);
    this.sliderHandle.style.transform = `translateX(${translateX}px) translateY(-50%)`;
  }

  updateYearDisplay() {
    const year = this.timeline[this.currentIndex];
    let displayText;

    if (year < 0) {
      const absYear = Math.abs(year);
      // Display the exact value for BC years without rounding
      displayText = `${absYear.toLocaleString()} BC`;
    } else {
      displayText = `${year.toLocaleString()} AD`;
    }

    this.yearDisplay.textContent = displayText;
  }

  // Public method to get current year
  getCurrentYear() {
    return this.timeline[this.currentIndex];
  }

  // Public method to set year programmatically
  setYear(year) {
    const index = this.timeline.indexOf(year);
    if (index !== -1) {
      this.currentIndex = index;
      this.updateSliderPosition();
      this.updateYearDisplay();
    }
  }

  // Public method to reset to default (1337)
  reset() {
    this.currentIndex = this.timeline.indexOf(1337);
    this.updateSliderPosition();
    this.updateYearDisplay();
  }
}

// Initialize the slider when the script loads
const timelineSlider = new TimelineSlider();

// Make it globally accessible
window.timelineSlider = timelineSlider;