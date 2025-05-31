/*defining the variables*/
let startTime = Date.now();
const mapContainer = document.getElementById('map-container');
const mapImage = document.getElementById('map');

/*define the function that handles the click on the screen
then, passes the JSON to add-location, which appends to "locations" */
async function sendLocation(time, x, y) {
    await fetch('/add-location', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({time: time, x: x, y: y})});}

/*handling when the user clicks inside the map + drawing the red dot*/
mapContainer.addEventListener('dblclick', function(event) {
    const rect = mapImage.getBoundingClientRect();
    /* e.g., event.ClientX (where the user clicked) - rect.left
       distance from the left edge of the screen to the image / rect.width*/
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const timeSeconds = ((Date.now() - startTime) / 1000).toFixed(2);

    /*drawing the circle*/
    const icon = document.createElement('div');
    icon.classList.add('location-icon');
    icon.style.left = `${x * 100}%`;
    icon.style.top = `${y * 105}%`;
    mapContainer.appendChild(icon);

    /*sending the points to sendLocation that sends to addLocation */
    sendLocation(timeSeconds, x.toFixed(4), y.toFixed(4));
});

/*when the user clicking */
function exportCSV() {
    window.location.href = '/export';
}