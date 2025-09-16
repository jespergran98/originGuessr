// Load and display random artifact when page loads
document.addEventListener('DOMContentLoaded', function() {
    fetch('assets/artifactList.json')
        .then(response => response.json())
        .then(data => {
            const artifacts = data.artifacts;
            
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
            
            // Filter out used artifacts
            const availableArtifacts = artifacts.filter(artifact => 
                !usedArtifacts.includes(artifact.id)
            );
            
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
                
                // Add this artifact to used list and update URL
                usedArtifacts.push(artifact.id);
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

// Function to update URL with used artifacts for next round
function updateURLWithUsedArtifacts(usedArtifacts) {
    // Update the makeGuess button to include used artifacts in navigation
    const makeGuessButton = document.getElementById('makeGuess-button');
    if (makeGuessButton) {
        const originalOnClick = makeGuessButton.onclick;
        makeGuessButton.onclick = function() {
            // Store used artifacts for result page navigation
            window.currentUsedArtifacts = usedArtifacts;
            if (originalOnClick) {
                originalOnClick.call(this);
            }
        };
    }
}