function initMap() {
    const map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ'
    }).addTo(map);
}
// Initialize the map when the page loads
document.addEventListener('DOMContentLoaded', initMap);