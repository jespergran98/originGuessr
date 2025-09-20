document.addEventListener('DOMContentLoaded', function() {
    fetch('assets/artifactList.json')
        .then(response => response.json())
        .then(data => {
            const artifacts = data.artifacts;
            
            // Define timeframe years for filtering
            const timeframeYears = [
                -5000000, -500000, -100000, -10000, -1000, 0,
                500, 1000, 1250, 1500, 1750, 1900, 2025
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
                // First round: Validate and display first artifact, then validate the rest in background
                const shuffled = availableArtifacts.sort(() => 0.5 - Math.random());
                
                // Validate the first artifact before displaying
                const firstArtifact = shuffled[0];
                const firstImagePromise = new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve(firstArtifact);
                    img.onerror = () => reject(new Error(`Failed to load image for ${firstArtifact.title}`));
                    img.src = firstArtifact.image;
                });
                
                // Display first artifact only after it's validated
                firstImagePromise
                    .then(validFirstArtifact => {
                        console.log('First artifact validated, displaying:', validFirstArtifact.title);
                        displayCurrentArtifact([validFirstArtifact], round);
                    })
                    .catch(error => {
                        console.warn('First artifact failed to load, trying next:', error);
                        // If first artifact fails, try the next one
                        tryNextArtifact(shuffled.slice(1), round);
                    });
                
                const remainingArtifacts = shuffled.slice(1, 4);
                
                // Validate remaining artifacts in parallel (background process)
                const remainingPromises = remainingArtifacts.map(artifact => 
                    new Promise((resolve, reject) => {
                        const img = new Image();
                        img.onload = () => resolve(artifact);
                        img.onerror = () => reject(new Error(`Failed to load image for ${artifact.title}`));
                        img.src = artifact.image;
                    })
                );
                
                // Handle validation of all artifacts (including first one again for consistency)
                Promise.allSettled([firstImagePromise, ...remainingPromises])
                    .then(results => {
                        const validArtifacts = [];
                        const failedArtifacts = [];
                        
                        results.forEach((result, index) => {
                            if (result.status === 'fulfilled') {
                                validArtifacts.push(result.value);
                            } else {
                                const artifactName = index === 0 ? shuffled[0].title : remainingArtifacts[index - 1].title;
                                failedArtifacts.push(artifactName);
                                console.warn(`Failed to validate artifact: ${artifactName}`);
                            }
                        });
                        
                        // If we need to replace failed artifacts
                        if (validArtifacts.length < 5) {
                            const usedTitles = [...validArtifacts.map(a => a.title), ...failedArtifacts];
                            const replacementCandidates = availableArtifacts.filter(a => !usedTitles.includes(a.title));
                            
                            // Try to find valid replacements
                            const neededReplacements = 5 - validArtifacts.length;
                            const replacementPromises = replacementCandidates.slice(0, neededReplacements).map(artifact =>
                                new Promise((resolve, reject) => {
                                    const img = new Image();
                                    img.onload = () => resolve(artifact);
                                    img.onerror = () => reject(new Error(`Failed to load image for ${artifact.title}`));
                                    img.src = artifact.image;
                                })
                            );
                            
                            Promise.allSettled(replacementPromises)
                                .then(replacementResults => {
                                    replacementResults.forEach(result => {
                                        if (result.status === 'fulfilled' && validArtifacts.length < 5) {
                                            validArtifacts.push(result.value);
                                        }
                                    });
                                    
                                    if (validArtifacts.length < 5) {
                                        console.error('Could not find enough valid artifacts after replacements');
                                        // Fallback: use whatever valid artifacts we have, filling with unvalidated ones if needed
                                        while (validArtifacts.length < 5 && replacementCandidates.length > 0) {
                                            const fallback = replacementCandidates.shift();
                                            if (!validArtifacts.some(a => a.title === fallback.title)) {
                                                validArtifacts.push(fallback);
                                            }
                                        }
                                    }
                                    
                                    gameArtifacts = validArtifacts.slice(0, 5);
                                    sessionStorage.setItem('gameArtifacts', JSON.stringify(gameArtifacts));
                                    console.log('Final game artifacts after validation and replacement:', gameArtifacts.map(a => a.title));
                                    
                                    // Note: First artifact display is already handled above, no need to update here
                                });
                        } else {
                            // All artifacts validated successfully
                            gameArtifacts = validArtifacts;
                            sessionStorage.setItem('gameArtifacts', JSON.stringify(gameArtifacts));
                            console.log('All artifacts validated successfully:', gameArtifacts.map(a => a.title));
                        }
                    })
                    .catch(error => {
                        console.error('Unexpected error during artifact validation:', error);
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

// Helper function to try the next artifact if the first one fails
function tryNextArtifact(remainingCandidates, round) {
    if (remainingCandidates.length === 0) {
        console.error('No more artifacts to try');
        const guessBox = document.querySelector('.guessBox');
        guessBox.innerHTML = '';
        const errorMessage = document.createElement('div');
        errorMessage.textContent = 'Unable to load any valid artifacts from the selected timeframe';
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
    
    const nextArtifact = remainingCandidates[0];
    const nextImagePromise = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(nextArtifact);
        img.onerror = () => reject(new Error(`Failed to load image for ${nextArtifact.title}`));
        img.src = nextArtifact.image;
    });
    
    nextImagePromise
        .then(validArtifact => {
            console.log('Next artifact validated, displaying:', validArtifact.title);
            displayCurrentArtifact([validArtifact], round);
        })
        .catch(error => {
            console.warn('Next artifact also failed, trying another:', error);
            tryNextArtifact(remainingCandidates.slice(1), round);
        });
}

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
    
    // Clear existing content before adding new image
    guessBox.innerHTML = '';
    
    // Create image wrapper div
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'image-wrapper';
    // Add padding to allow shadow to show outside the image bounds (large shadow needs lots of space)
    imageWrapper.style.padding = '80px';
    
    // Create image element
    const img = document.createElement('img');
    img.src = currentArtifact.image;
    img.alt = currentArtifact.title;
    
    // Function to apply border radius based on actual rendered image size
    function applyImageBorderRadius() {
        // Get the wrapper's content area (excluding padding)
        const containerRect = imageWrapper.getBoundingClientRect();
        const paddingSize = 80; // Match the padding we added
        const containerWidth = containerRect.width - (paddingSize * 2);
        const containerHeight = containerRect.height - (paddingSize * 2);
        
        // Get image natural dimensions
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;
        
        if (naturalWidth && naturalHeight) {
            // Calculate the rendered size based on object-fit: contain logic
            const containerAspect = containerWidth / containerHeight;
            const imageAspect = naturalWidth / naturalHeight;
            
            let renderedWidth, renderedHeight;
            
            if (imageAspect > containerAspect) {
                // Image is wider than container aspect ratio - fit to width
                renderedWidth = containerWidth;
                renderedHeight = containerWidth / imageAspect;
            } else {
                // Image is taller than container aspect ratio - fit to height
                renderedHeight = containerHeight;
                renderedWidth = containerHeight * imageAspect;
            }
            
            // The image should be centered vertically due to align-items: center
            // Calculate the center position (this matches flexbox align-items: center behavior)
            const topOffset = (containerHeight - renderedHeight) / 2;
            
            // Create a clipping element that matches the actual image size
            const clipElement = document.createElement('div');
            clipElement.style.position = 'absolute';
            clipElement.style.left = paddingSize + 'px'; // Account for padding
            clipElement.style.top = (topOffset + paddingSize) + 'px'; // Account for padding
            clipElement.style.width = renderedWidth + 'px';
            clipElement.style.height = renderedHeight + 'px';
            clipElement.style.borderRadius = '3vh';
            clipElement.style.overflow = 'hidden';
            clipElement.style.pointerEvents = 'none';
            // Add the shadow to the clipping element
            clipElement.style.boxShadow = '0 8px 64px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
            
            // Move the image into the clip element and reset its styles
            img.style.width = renderedWidth + 'px';
            img.style.height = renderedHeight + 'px';
            img.style.objectFit = 'cover';
            img.style.objectPosition = 'center';
            
            clipElement.appendChild(img);
            imageWrapper.appendChild(clipElement);
        }
    }
    
    // Wait for image to load, then apply border radius
    img.onload = applyImageBorderRadius;
    
    // Append image to wrapper first (will be moved by applyImageBorderRadius)
    imageWrapper.appendChild(img);
    guessBox.appendChild(imageWrapper);
    
    // If image is already loaded (cached), apply border radius immediately
    if (img.complete && img.naturalWidth) {
        applyImageBorderRadius();
    }
    
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

// Function to update makeGuess button behavior - FIXED: Now preserves timer settings
function updateURLWithUsedArtifacts(usedArtifacts) {
    const makeGuessButton = document.getElementById('makeGuess-button');
    if (makeGuessButton) {
        const originalOnClick = makeGuessButton.onclick;
        makeGuessButton.onclick = function() {
            // Get current URL parameters to preserve timer settings
            const currentParams = new URLSearchParams(window.location.search);
            
            // Get timer settings from URL or roundLogic
            let timerSeconds = null;
            const urlTimerParam = currentParams.get('timerSeconds');
            if (urlTimerParam) {
                timerSeconds = parseInt(urlTimerParam);
            } else if (window.roundLogic && window.roundLogic.timerSeconds) {
                timerSeconds = window.roundLogic.timerSeconds;
            }
            
            // Save current game state to sessionStorage - FIXED: Now includes timer
            sessionStorage.setItem('gameState', JSON.stringify({
                currentRound: window.roundLogic ? window.roundLogic.currentRound : 1,
                totalScore: window.roundLogic ? window.roundLogic.totalScore : 0,
                roundScores: window.roundLogic ? window.roundLogic.roundScores : [],
                usedArtifacts: usedArtifacts,
                timeframeMinIndex: currentParams.get('timeframeMinIndex'),
                timeframeMaxIndex: currentParams.get('timeframeMaxIndex'),
                timerSeconds: timerSeconds // CRITICAL FIX: Include timer in session storage
            }));
            
            console.log('Saved game state with timer:', timerSeconds);
            
            if (originalOnClick) {
                originalOnClick.call(this);
            }
        };
    }
}