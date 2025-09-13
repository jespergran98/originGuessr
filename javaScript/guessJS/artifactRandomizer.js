// Load and display random artifact when page loads
document.addEventListener('DOMContentLoaded', function() {
    fetch('assets/artifactList.json')
        .then(response => response.json())
        .then(data => {
            const artifacts = data.artifacts;
            const randomIndex = Math.floor(Math.random() * artifacts.length);
            const randomArtifact = artifacts[randomIndex];
            
            // Store artifact globally for easy access
            window.currentArtifact = randomArtifact;
            
            const guessBox = document.querySelector('.guessBox');
            const img = document.createElement('img');
            img.src = randomArtifact.image;
            img.alt = randomArtifact.title;
            
            guessBox.appendChild(img);
            
            // Update attribution box
            updateAttribution(randomArtifact);
            
            // Dispatch event with artifact data
            document.dispatchEvent(new CustomEvent('artifactLoaded', {
                detail: { artifact: randomArtifact }
            }));
            
            console.log('Loaded artifact:', randomArtifact.title);
        })
        .catch(error => {
            console.error('Error loading artifacts:', error);
        });
});