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
            
            // Get URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const usedArtifactsParam = urlParams.get('usedArtifacts');
            const round = parseInt(urlParams.get('round')) || 1;
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
                !usedArtifacts.includes(artifact.title)
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
            
            // Check if there are enough artifacts for a full game
            if (availableArtifacts.length < 5) {
                console.error('Not enough available artifacts for a full game');
                const guessBox = document.querySelector('.guessBox');
                guessBox.innerHTML = ''; // Clear any existing content
                const errorMessage = document.createElement('div');
                errorMessage.textContent = 'The selected timeframe does not contain enough artifacts';
                errorMessage.style.cssText = `
                    color: #fff;
                    font-size: 1.2rem;
                    text-align: center;
                    padding: 20px;
                    background-color: rgba(255, 0, 0, 0.2);
                    border-radius: 8px;
                    margin: 20px;
                `;
                guessBox.appendChild(errorMessage);
                return;
            }
            
            // Check for pre-selected artifacts for the game
            let gameArtifacts = [];
            if (round === 1) {
                // First round: Select 5 unique artifacts and validate images
                // Shuffle and select 5 unique artifacts
                const shuffled = availableArtifacts.sort(() => 0.5 - Math.random());
                const selectedArtifacts = shuffled.slice(0, 5);
                
                // Preload all images in parallel
                Promise.all(selectedArtifacts.map(artifact => 
                    new Promise((resolve, reject) => {
                        const img = new Image();
                        img.onload = () => resolve(artifact);
                        img.onerror = () => reject(new Error(`Failed to load image for ${artifact.title}`));
                        img.src = artifact.image;
                    })
                ))
                .then(validArtifacts => {
                    // Store valid artifacts in sessionStorage
                    gameArtifacts = validArtifacts;
                    sessionStorage.setItem('gameArtifacts', JSON.stringify(gameArtifacts));
                    console.log('Selected and validated new game artifacts:', gameArtifacts.map(a => a.title));
                    displayCurrentArtifact(gameArtifacts, round);
                })
                .catch(error => {
                    console.warn('Some artifacts failed to load:', error);
                    // Remove invalid artifacts and try to select new ones
                    const failedTitles = error.message.match(/Failed to load image for ([^,]+)/g) || [];
                    const failedTitlesClean = failedTitles.map(title => title.replace('Failed to load image for ', ''));
                    const remainingArtifacts = availableArtifacts.filter(a => !failedTitlesClean.includes(a.title));
                    
                    if (remainingArtifacts.length < 5) {
                        console.error('Not enough valid artifacts remaining after validation');
                        const guessBox = document.querySelector('.guessBox');
                        guessBox.innerHTML = ''; // Clear any existing content
                        const errorMessage = document.createElement('div');
                        errorMessage.textContent = 'The selected timeframe does not contain enough artifacts';
                        errorMessage.style.cssText = `
                            color: #fff;
                            font-size: 1.2rem;
                            text-align: center;
                            padding: 20px;
                            background-color: rgba(255, 0, 0, 0.2);
                            border-radius: 8px;
                            margin: 20px;
                        `;
                        guessBox.appendChild(errorMessage);
                        return;
                    }
                    
                    // Select new artifacts to replace invalid ones
                    const newShuffled = remainingArtifacts.sort(() => 0.5 - Math.random());
                    gameArtifacts = newShuffled.slice(0, 5);
                    sessionStorage.setItem('gameArtifacts', JSON.stringify(gameArtifacts));
                    console.log('Selected new game artifacts after validation failure:', gameArtifacts.map(a => a.title));
                    displayCurrentArtifact(gameArtifacts, round);
                });
            } else {
                // Subsequent rounds: Retrieve pre-selected artifacts
                const storedArtifacts = sessionStorage.getItem('gameArtifacts');
                if (storedArtifacts) {
                    try {
                        gameArtifacts = JSON.parse(storedArtifacts);
                        console.log('Retrieved game artifacts:', gameArtifacts.map(a => a.title));
                    } catch (e) {
                        console.warn('Error parsing stored game artifacts:', e);
                        gameArtifacts = [];
                    }
                }
                
                if (gameArtifacts.length === 0) {
                    console.error('No stored game artifacts found, falling back to random selection');
                    if (availableArtifacts.length < 5) {
                        console.error('Not enough available artifacts remaining');
                        const guessBox = document.querySelector('.guessBox');
                        guessBox.innerHTML = ''; // Clear any existing content
                        const errorMessage = document.createElement('div');
                        errorMessage.textContent = 'The selected timeframe does not contain enough artifacts';
                        errorMessage.style.cssText = `
                            color: #fff;
                            font-size: 1.2rem;
                            text-align: center;
                            padding: 20px;
                            background-color: rgba(255, 0, 0, 0.2);
                            border-radius: 8px;
                            margin: 20px;
                        `;
                        guessBox.appendChild(errorMessage);
                        return;
                    }
                    const randomIndex = Math.floor(Math.random() * availableArtifacts.length);
                    gameArtifacts = [availableArtifacts[randomIndex]];
                }
                
                displayCurrentArtifact(gameArtifacts, round);
            }
        })
        .catch(error => {
            console.error('Error loading artifacts:', error);
            const guessBox = document.querySelector('.guessBox');
            guessBox.innerHTML = ''; // Clear any existing content
            const errorMessage = document.createElement('div');
            errorMessage.textContent = 'Error loading artifacts. Please try again.';
            errorMessage.style.cssText = `
                color: #fff;
                font-size: 1.2rem;
                text-align: center;
                padding: 20px;
                background-color: rgba(255, 0, 0, 0.2);
                border-radius: 8px;
                margin: 20px;
            `;
            guessBox.appendChild(errorMessage);
        });
});

// Function to display the artifact for the current round
function displayCurrentArtifact(gameArtifacts, round) {
    const currentArtifact = gameArtifacts[round - 1];
    if (!currentArtifact) {
        console.error('No artifact available for round', round);
        const guessBox = document.querySelector('.guessBox');
        guessBox.innerHTML = ''; // Clear any existing content
        const errorMessage = document.createElement('div');
        errorMessage.textContent = 'The selected timeframe does not contain enough artifacts';
        errorMessage.style.cssText = `
            color: #fff;
            font-size: 1.2rem;
            text-align: center;
            padding: 20px;
            background-color: rgba(255, 0, 0, 0.2);
            border-radius: 8px;
            margin: 20px;
        `;
        guessBox.appendChild(errorMessage);
        return;
    }
    
    // Store artifact globally for easy access
    window.currentArtifact = currentArtifact;
    
    const guessBox = document.querySelector('.guessBox');
    const img = document.createElement('img');
    img.src = currentArtifact.image;
    img.alt = currentArtifact.title;
    
    guessBox.appendChild(img);
    
    // Update attribution box (assuming updateAttribution is defined elsewhere)
    updateAttribution(currentArtifact);
    
    // Update used artifacts
    const usedArtifacts = JSON.parse(sessionStorage.getItem('gameState')?.usedArtifacts || '[]');
    if (!usedArtifacts.includes(currentArtifact.title)) {
        usedArtifacts.push(currentArtifact.title);
    }
    
    // Update URL with used artifacts for next round
    updateURLWithUsedArtifacts(usedArtifacts);
    
    // Dispatch event with artifact data
    document.dispatchEvent(new CustomEvent('artifactLoaded', {
        detail: { artifact: currentArtifact }
    }));
    
    console.log('Loaded artifact:', currentArtifact.title);
    console.log('Used artifacts so far:', usedArtifacts);
}

// Function to update makeGuess button behavior
function updateURLWithUsedArtifacts(usedArtifacts) {
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