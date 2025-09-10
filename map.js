let map;

function initMap() {
    map = L.map('map', {
        minZoom: 2,
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
        // Debounce the invalidation
        clearTimeout(window.mapResizeTimeout);
        window.mapResizeTimeout = setTimeout(() => {
            map.invalidateSize();
        }, 100);
    });
    resizeObserver.observe(innerBox);
}

document.addEventListener('DOMContentLoaded', initMap);