// Load and display random artifact when page loads
document.addEventListener('DOMContentLoaded', function() {
    fetch('assets/artifactList.json')
        .then(response => response.json())
        .then(data => {
            const artifacts = data.artifacts;
            const randomIndex = Math.floor(Math.random() * artifacts.length);
            const randomArtifact = artifacts[randomIndex];
            
            const guessBox = document.querySelector('.guessBox');
            const img = document.createElement('img');
            img.src = randomArtifact.image;
            img.alt = randomArtifact.title;
            
            guessBox.appendChild(img);
        })
        .catch(error => {
            console.error('Error loading artifacts:', error);
        });
});