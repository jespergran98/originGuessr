// Main Index Page Script
document.addEventListener('DOMContentLoaded', () => {
    // Initialize particle system
    new ParticleSystem();
    
    // Initialize game settings
    new IndexGameSettings();
    
    // Add loading completion effect
    AnimationUtils.initializePageLoadAnimation();
});