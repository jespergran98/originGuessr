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
                showErrorMessage('The selected timeframe does not contain enough artifacts');
                return;
            }
            
            // Check for pre-selected artifacts for the game
            let gameArtifacts = [];
            if (round === 1) {
                // First round: Find and display first valid artifact ASAP, then validate others in background
                const shuffled = availableArtifacts.sort(() => 0.5 - Math.random());
                
                // Race to find the first valid artifact as quickly as possible
                findFirstValidArtifact(shuffled, 0)
                    .then(validArtifact => {
                        console.log('First artifact validated and displayed:', validArtifact.title);
                        displayCurrentArtifact([validArtifact], round);
                        
                        // Now validate remaining artifacts for the game in the background
                        validateRemainingArtifacts(shuffled, validArtifact);
                    })
                    .catch(error => {
                        console.error('Could not find any valid artifacts:', error);
                        showErrorMessage('Unable to load any valid artifacts from the selected timeframe');
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
                        showErrorMessage('The selected timeframe does not contain enough artifacts');
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
            showErrorMessage('Error loading artifacts. Please try again.');
        });
});

// Optimized function to find first valid artifact quickly
function findFirstValidArtifact(candidates, startIndex) {
    return new Promise((resolve, reject) => {
        if (startIndex >= candidates.length) {
            reject(new Error('No valid artifacts found'));
            return;
        }
        
        const artifact = candidates[startIndex];
        const img = new Image();
        
        // Set up both success and failure handlers
        const cleanup = () => {
            img.onload = null;
            img.onerror = null;
        };
        
        img.onload = () => {
            cleanup();
            resolve(artifact);
        };
        
        img.onerror = () => {
            cleanup();
            console.warn(`Artifact ${artifact.title} failed to load, trying next...`);
            // Immediately try the next artifact
            findFirstValidArtifact(candidates, startIndex + 1)
                .then(resolve)
                .catch(reject);
        };
        
        // Start loading the image
        img.src = artifact.image;
    });
}

// Function to validate remaining artifacts in the background
function validateRemainingArtifacts(allCandidates, firstValidArtifact) {
    // Remove the first valid artifact from candidates and take next 4
    const remainingCandidates = allCandidates.filter(a => a.title !== firstValidArtifact.title).slice(0, 4);
    
    // Validate remaining artifacts in parallel
    const validationPromises = remainingCandidates.map(artifact => 
        new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(artifact);
            img.onerror = () => reject(new Error(`Failed to load image for ${artifact.title}`));
            img.src = artifact.image;
        })
    );
    
    Promise.allSettled(validationPromises)
        .then(results => {
            const validArtifacts = [firstValidArtifact]; // Start with the first one
            const failedArtifacts = [];
            
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    validArtifacts.push(result.value);
                } else {
                    failedArtifacts.push(remainingCandidates[index].title);
                    console.warn(`Failed to validate artifact: ${remainingCandidates[index].title}`);
                }
            });
            
            // If we need more artifacts, find replacements
            if (validArtifacts.length < 5) {
                const usedTitles = [...validArtifacts.map(a => a.title), ...failedArtifacts];
                const replacementCandidates = allCandidates.filter(a => !usedTitles.includes(a.title));
                
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
                        
                        // Use fallback artifacts if still not enough
                        while (validArtifacts.length < 5 && replacementCandidates.length > 0) {
                            const fallback = replacementCandidates.shift();
                            if (!validArtifacts.some(a => a.title === fallback.title)) {
                                validArtifacts.push(fallback);
                            }
                        }
                        
                        const gameArtifacts = validArtifacts.slice(0, 5);
                        sessionStorage.setItem('gameArtifacts', JSON.stringify(gameArtifacts));
                        console.log('Final game artifacts after validation and replacement:', gameArtifacts.map(a => a.title));
                    });
            } else {
                // All artifacts validated successfully
                const gameArtifacts = validArtifacts.slice(0, 5);
                sessionStorage.setItem('gameArtifacts', JSON.stringify(gameArtifacts));
                console.log('All artifacts validated successfully:', gameArtifacts.map(a => a.title));
            }
        })
        .catch(error => {
            console.error('Unexpected error during background artifact validation:', error);
        });
}

// Helper function to show error messages
function showErrorMessage(message) {
    const guessBox = document.querySelector('.guessBox');
    guessBox.innerHTML = '';
    const errorMessage = document.createElement('div');
    errorMessage.textContent = message;
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
}

// Function to display the artifact for the current round
function displayCurrentArtifact(gameArtifacts, round) {
    const currentArtifact = gameArtifacts[round - 1];
    if (!currentArtifact) {
        console.error('No artifact available for round', round);
        showErrorMessage('The selected timeframe does not contain enough artifacts');
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
    if (typeof updateAttribution === 'function') {
        updateAttribution(currentArtifact);
    }
    
    // Update used artifacts
    const gameState = JSON.parse(sessionStorage.getItem('gameState') || '{}');
    const usedArtifacts = gameState.usedArtifacts || [];
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