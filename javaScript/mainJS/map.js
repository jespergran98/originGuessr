let map;

function initMap() {
    // Check if we're on the finalScore page by looking at the page title or URL
    const isFinalScorePage = document.title.includes('Final Score') || 
                            window.location.pathname.includes('finalScore');
    
    // Set minimum zoom based on the page
    const minZoom = isFinalScorePage ? 3 : 2;
    
    map = L.map('map', {
        minZoom: minZoom,
        maxBounds: [
            [-90, -1080],
            [90, 1080]
        ],
        maxBoundsViscosity: 1.0
    }).setView([20, 0], 2);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ'
    }).addTo(map);

    const innerBox = document.getElementById('map').parentElement;
    const resizeObserver = new ResizeObserver(entries => {
        map.invalidateSize();
    });
    resizeObserver.observe(innerBox);
}

document.addEventListener('DOMContentLoaded', initMap);