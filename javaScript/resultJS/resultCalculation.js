// Score calculation functions for the Origin Guesser game
class ResultCalculation {
    constructor() {
        this.timeline = this.generateTimeline();
    }

    // Generate the same timeline as the slider for consistent scoring
    generateTimeline() {
        let timeline = [];
        
        // Generate timeline with varying increments (same as TimelineSlider)
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

    /**
     * Calculate location score based on distance from correct location
     * @param {number} distance - Distance in kilometers
     * @returns {number} Location score (0-5000)
     */
    computeLocationScore(distance) {
        if (distance <= 0.1) {
            // Within 100 meters - perfect score
            return 5000;
        } else {
            const decayConstant = 1856;
            const rawScore = 5000 * Math.exp(-(distance - 0.1) / decayConstant);
            const roundedScore = Math.round(rawScore);
            return Math.max(roundedScore, 0); // Allow minimum score of 0
        }
    }

    /**
     * Calculate year score based on timeline increments away from correct year
     * @param {number} correctYear - The actual year of the artifact
     * @param {number} guessedYear - The user's guessed year
     * @returns {number} Year score (0-5000)
     */
    calculateYearScore(correctYear, guessedYear) {
        // Check if guess is exactly correct or within adjacent increment
        if (correctYear === guessedYear || this.isAdjacentIncrement(correctYear, guessedYear)) {
            return 5000;
        }

        const guessedResult = this.getClosestTimelineYearAndIndex(guessedYear);
        const guessedIndex = guessedResult.closestIndex;
        
        const correctResult = this.getClosestTimelineYearAndIndex(correctYear);
        const correctIndex = correctResult.closestIndex;

        const incrementsAway = Math.abs(correctIndex - guessedIndex);

        // Score calculation with exponential decay
        const maxDecayScore = 4999;
        const sensitivity = 50;
        let score = maxDecayScore * Math.exp(-incrementsAway / sensitivity);
        
        score = Math.max(0, score);
        score = Math.round(score);
        
        return score;
    }

    /**
     * Check if the guessed year falls within the adjacent increment range of the correct year
     * @param {number} correctYear - The actual year
     * @param {number} guessedYear - The guessed year
     * @returns {boolean} Whether the guess is within adjacent increment
     */
    isAdjacentIncrement(correctYear, guessedYear) {
        const nearestGuess = this.timeline.reduce((prev, curr) => 
            Math.abs(curr - guessedYear) < Math.abs(prev - guessedYear) ? curr : prev
        );
        
        const idx = this.timeline.indexOf(nearestGuess);
        
        const prevYear = this.timeline[idx - 1] !== undefined ? this.timeline[idx - 1] : nearestGuess;
        const nextYear = this.timeline[idx + 1] !== undefined ? this.timeline[idx + 1] : nearestGuess;
        
        const lower = guessedYear - ((nearestGuess - prevYear) / 2);
        const upper = guessedYear + ((nextYear - nearestGuess) / 2);
        
        return correctYear >= lower && correctYear <= upper;
    }

    /**
     * Find the closest timeline year and its index for a given year
     * @param {number} year - The year to find closest match for
     * @returns {object} Object with closestYear and closestIndex
     */
    getClosestTimelineYearAndIndex(year) {
        let closestYear = this.timeline[0];
        let closestIndex = 0;
        let minDiff = Math.abs(this.timeline[0] - year);

        for (let i = 1; i < this.timeline.length; i++) {
            const diff = Math.abs(this.timeline[i] - year);
            if (diff < minDiff) {
                minDiff = diff;
                closestYear = this.timeline[i];
                closestIndex = i;
            }
        }

        return { closestYear, closestIndex };
    }

    /**
     * Calculate total score from location and year scores
     * @param {number} locationScore - Score from location guess (0-5000)
     * @param {number} yearScore - Score from year guess (0-5000)
     * @returns {number} Total score (0-10000)
     */
    calculateTotalScore(locationScore, yearScore) {
        return locationScore + yearScore;
    }

    /**
     * Calculate all scores for a guess
     * @param {object} params - Parameters object
     * @param {number} params.correctLat - Correct latitude
     * @param {number} params.correctLng - Correct longitude
     * @param {number} params.guessLat - Guessed latitude
     * @param {number} params.guessLng - Guessed longitude
     * @param {number} params.correctYear - Correct year
     * @param {number} params.guessedYear - Guessed year
     * @returns {object} Object with all calculated scores and distance
     */
    calculateAllScores({ correctLat, correctLng, guessLat, guessLng, correctYear, guessedYear }) {
        // Calculate distance using Haversine formula
        const distance = this.calculateDistance(correctLat, correctLng, guessLat, guessLng);
        
        // Calculate individual scores
        const locationScore = this.computeLocationScore(distance);
        const yearScore = this.calculateYearScore(correctYear, guessedYear);
        const totalScore = this.calculateTotalScore(locationScore, yearScore);

        return {
            distance,
            locationScore,
            yearScore,
            totalScore
        };
    }

    /**
     * Calculate distance between two points using Haversine formula
     * @param {number} lat1 - First point latitude
     * @param {number} lng1 - First point longitude
     * @param {number} lat2 - Second point latitude
     * @param {number} lng2 - Second point longitude
     * @returns {number} Distance in kilometers
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Convert degrees to radians
     * @param {number} degrees - Degrees value
     * @returns {number} Radians value
     */
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
}

// Create global instance for use throughout the application
window.resultCalculation = new ResultCalculation();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResultCalculation;
}