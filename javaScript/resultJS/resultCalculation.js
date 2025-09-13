// Result calculation system for Origin Guesser
class ResultCalculator {
    constructor() {
        this.timeline = this.generateTimeline();
        this.yearToIndexMap = this.createYearToIndexMap();
    }

    // Generate the same timeline as the slider for consistency
    generateTimeline() {
        let timeline = [];
        
        // Generate timeline with varying increments (same as mapBoxSlider.js)
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

    // Create a mapping from year to timeline index for quick lookups
    createYearToIndexMap() {
        const map = new Map();
        this.timeline.forEach((year, index) => {
            map.set(year, index);
        });
        return map;
    }

    // Calculate location score based on distance in kilometers
    calculateLocationScore(distanceKm) {
        if (distanceKm <= 0.1) { // Within 100 meters
            return 5000;
        } else {
            const decayConstant = 1856;
            const rawScore = 5000 * Math.exp(-(distanceKm - 0.1) / decayConstant);
            const roundedScore = Math.round(rawScore);
            return Math.max(roundedScore, 1); // Minimum score of 1
        }
    }

    // Calculate year score based on timeline increments away
    calculateYearScore(correctYear, guessedYear) {
        // Check if guess is exact or within adjacent increment
        if (correctYear === guessedYear || this.isAdjacentIncrement(correctYear, guessedYear)) {
            return 5000;
        }

        // Get closest timeline positions for both years
        const guessedResult = this.getClosestTimelineYearAndIndex(guessedYear);
        const guessedIndex = guessedResult.closestIndex;
        
        const correctResult = this.getClosestTimelineYearAndIndex(correctYear);
        const correctIndex = correctResult.closestIndex;

        // Calculate increments away
        const incrementsAway = Math.abs(correctIndex - guessedIndex);

        // Apply exponential decay scoring
        const maxDecayScore = 4999;
        const sensitivity = 80;
        let score = maxDecayScore * Math.exp(-incrementsAway / sensitivity);
        
        // Ensure score is non-negative and rounded
        score = Math.max(0, score);
        score = Math.round(score);
        
        return score;
    }

    // Check if the guessed year falls within an adjacent increment range
    isAdjacentIncrement(correctYear, guessedYear) {
        const nearestGuess = this.timeline.reduce((prev, curr) =>
            Math.abs(curr - guessedYear) < Math.abs(prev - guessedYear) ? curr : prev
        );
        
        const idx = this.timeline.indexOf(nearestGuess);
        
        // Calculate the range boundaries
        const prevYear = idx > 0 ? this.timeline[idx - 1] : nearestGuess;
        const nextYear = idx < this.timeline.length - 1 ? this.timeline[idx + 1] : nearestGuess;
        
        const lower = guessedYear - ((nearestGuess - prevYear) / 2);
        const upper = guessedYear + ((nextYear - nearestGuess) / 2);
        
        return correctYear >= lower && correctYear <= upper;
    }

    // Find the closest timeline year and its index for any given year
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

    // Calculate total score from both location and year scores
    calculateTotalScore(locationScore, yearScore) {
        return locationScore + yearScore;
    }

    // Calculate all scores at once for convenience
    calculateAllScores(correctLat, correctLng, correctYear, guessLat, guessLng, guessYear) {
        // Calculate distance using the same method as artifactResult.js
        const distance = this.calculateDistance(correctLat, correctLng, guessLat, guessLng);
        
        // Calculate individual scores
        const locationScore = this.calculateLocationScore(distance);
        const yearScore = this.calculateYearScore(correctYear, guessYear);
        const totalScore = this.calculateTotalScore(locationScore, yearScore);

        return {
            distance: distance,
            locationScore: locationScore,
            yearScore: yearScore,
            totalScore: totalScore,
            formattedDistance: this.formatDistance(distance),
            yearDifference: Math.abs(guessYear - correctYear)
        };
    }

    // Distance calculation using Haversine formula (same as artifactResult.js)
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

    // Helper function to convert degrees to radians
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    // Format distance for display (same as artifactResult.js)
    formatDistance(distanceKm) {
        if (distanceKm < 1) {
            return `${Math.round(distanceKm * 1000)}m`;
        } else if (distanceKm < 100) {
            return `${distanceKm.toFixed(1)} km`;
        } else {
            return `${Math.round(distanceKm)} km`;
        }
    }

    // Format score for display with thousands separators
    formatScore(score) {
        return score.toLocaleString();
    }
}

// Create a global instance for easy access
window.resultCalculator = new ResultCalculator();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResultCalculator;
}