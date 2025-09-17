// Load and display random artifact when page loads
document.addEventListener('DOMContentLoaded', function() {
    fetch('assets/artifactList.json')
        .then(response => response.json())
        .then(data => {
            const artifacts = data.artifacts;
            
            // Define timeframe years for filtering
            const timeframeYears = [
                -5000000, -500000, -100000, -50000, -10000, -5000, -2500, -1000, 0,
                500, 750, 1000, 1250, 1500, 1650, 1800, 1900, 2000, 2025
            ];
            
            // Get used artifacts from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const usedArtifactsParam = urlParams.get('usedArtifacts');
            let usedArtifacts = [];
            
            if (usedArtifactsParam) {
                try {
                    usedArtifacts = JSON.parse(decodeURIComponent(usedArtifactsParam));
                } catch (e) {
                    console.warn('Error parsing used artifacts:', e);
                    usedArtifacts = [];
                }
            }
            
            // Get timeframe parameters for filtering
            const minIndexStr = urlParams.get('timeframeMinIndex');
            const maxIndexStr = urlParams.get('timeframeMaxIndex');
            let availableArtifacts = artifacts.filter(artifact => 
                !usedArtifacts.includes(artifact.title) // Use title as ID for filtering
            );
            
            if (minIndexStr !== null && maxIndexStr !== null) {
                const minIndex = parseInt(minIndexStr);
                const maxIndex = parseInt(maxIndexStr);
                const minYear = timeframeYears[minIndex];
                const maxYear = timeframeYears[maxIndex];
                
                availableArtifacts = availableArtifacts.filter(artifact => 
                    artifact.year >= minYear && artifact.year <= maxYear
                );
                
                console.log(`Filtering artifacts to timeframe: ${minYear} to ${maxYear}`);
            }
            
            if (availableArtifacts.length === 0) {
                console.error('No available artifacts remaining');
                return;
            }
            
            // Function to select and validate artifact
            function selectValidArtifact(attempts = 0) {
                if (attempts >= availableArtifacts.length) {
                    console.error('No valid artifacts found after checking all available options');
                    return;
                }
                
                const randomIndex = Math.floor(Math.random() * availableArtifacts.length);
                const randomArtifact = availableArtifacts[randomIndex];
                
                // Test if image loads successfully
                const img = document.createElement('img');
                
                img.onload = function() {
                    // Image loaded successfully, use this artifact
                    displayArtifact(randomArtifact);
                };
                
                img.onerror = function() {
                    console.warn(`Broken image for artifact: ${randomArtifact.title}, trying another...`);
                    // Remove this artifact from available list and try again
                    availableArtifacts.splice(randomIndex, 1);
                    selectValidArtifact(attempts + 1);
                };
                
                // Start loading the image
                img.src = randomArtifact.image;
            }
            
            function displayArtifact(artifact) {
                // Store artifact globally for easy access
                window.currentArtifact = artifact;
                
                const guessBox = document.querySelector('.guessBox');
                const img = document.createElement('img');
                img.src = artifact.image;
                img.alt = artifact.title;
                
                guessBox.appendChild(img);
                
                // Update attribution box
                updateAttribution(artifact);
                
                // Add this artifact to used list
                if (!usedArtifacts.includes(artifact.title)) {
                    usedArtifacts.push(artifact.title);
                }
                
                // Update URL with used artifacts for next round
                updateURLWithUsedArtifacts(usedArtifacts);
                
                // Dispatch event with artifact data
                document.dispatchEvent(new CustomEvent('artifactLoaded', {
                    detail: { artifact: artifact }
                }));
                
                console.log('Loaded artifact:', artifact.title);
                console.log('Used artifacts so far:', usedArtifacts);
            }
            
            // Start the selection process
            selectValidArtifact();
        })
        .catch(error => {
            console.error('Error loading artifacts:', error);
        });
});

// Function to update makeGuess button behavior
function updateURLWithUsedArtifacts(usedArtifacts) {
    // Update the makeGuess button to save state to sessionStorage before navigation
    const makeGuessButton = document.getElementById('makeGuess-button');
    if (makeGuessButton) {
        const originalOnClick = makeGuessButton.onclick;
        makeGuessButton.onclick = function() {
            // Save current game state to sessionStorage
            const currentParams = new URLSearchParams(window.location.search);
            sessionStorage.setItem('gameState', JSON.stringify({
                currentRound: window.roundLogic.currentRound,
                totalScore: window.roundLogic.totalScore,
                roundScores: window.roundLogic.roundScores,
                usedArtifacts: usedArtifacts,
                timeframeMinIndex: currentParams.get('timeframeMinIndex'),
                timeframeMaxIndex: currentParams.get('timeframeMaxIndex')
            }));
            
            if (originalOnClick) {
                originalOnClick.call(this);
            }
        };
    }
}