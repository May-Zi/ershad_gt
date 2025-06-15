

let startTime = 0;
let elapsed = 0;

/* knowing that when the user visits the page,
one still needs to click to start */
let timerRunning = false;
let intervalId = null;

const mapContainer = document.getElementById('map-container');
const mapImage = document.getElementById('map');
const timeDisplay = document.getElementById('current-time');

/*important not for exxporting csv, but 
to draw the line */
let points = [];

/*make sure that exportation is not allowed if no points*/
document.getElementById('exportBtn').disabled = true;

function startMapping() {
    const startBtn = document.getElementById('startBtn');

    if (startBtn.classList.contains('reset-mode')) {
        location.reload(); return;}

    startTime = Date.now() - elapsed;
    timerRunning = true;
    startBtn.disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    intervalId = setInterval(updateTime, 100);
}

/* handling the fact to allow users to pause*/
function togglePause() {
    if (timerRunning) {elapsed = Date.now() - startTime;
        clearInterval(intervalId);
    } else {
        startTime = Date.now() - elapsed;
        intervalId = setInterval(updateTime, 100);
    } timerRunning = !timerRunning}

function updateTime() {
    const currentTime = ((Date.now() - startTime) / 1000).toFixed(2);
    timeDisplay.textContent = currentTime;}

/* activated when the user clicks in the button export
then, generate the csv and redirect the user */
function exportCSV() {
    window.location.href = '/export';
}

/* very important for passing sending the location to
the API that is inside routes.py */
async function sendLocation(time, x, y) {
    await fetch('/add-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time, x, y })})}

mapContainer.addEventListener('dblclick', function(event) {

    /* simply don't draw if timer is not running */
    if (!timerRunning) return;

    /* if there is no points */
    if (points.length > 0) {
        document.getElementById('exportBtn').disabled = false;
    }

    const rect = mapImage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    
    /* what we send the location to the routes.py api */
    const timeSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
    const naturalWidth = 1946;
    const naturalHeight = 1574;
    const pixelX = Math.round(x * naturalWidth);
    const pixelY = Math.round(y * naturalHeight);
    sendLocation(timeSeconds, pixelX.toFixed(4), pixelY.toFixed(4));
    
    /* when the user clicked on the screen */    
    const relativeX = event.clientX - rect.left;
    const relativeY = event.clientY - rect.top;

    /* moment to create an icon */
    const icon = document.createElement('div');
    icon.classList.add('location-icon');
    icon.style.left = `${relativeX}px`;
    icon.style.top = `${relativeY}px`;
    mapContainer.appendChild(icon);


    points.push({ x: relativeX, y: relativeY });
    
    if (points.length >= 2) {
        const prev = points[points.length - 2];
        const curr = points[points.length - 1];
        drawLine(prev.x, prev.y, curr.x, curr.y);
    }

    const startBtn = document.getElementById('startBtn');
    startBtn.textContent = "Reset Mapping";
    startBtn.classList.add('reset-mode');
    startBtn.disabled = false;
    
});

/* function used to draw the line
this function is called when points has
2 or more points 
*/

function drawLine(x1, y1, x2, y2) {
    /*setting the 'enviornment' */
    const line = document.createElement('div');
    line.classList.add('line');
    /*using pythagorean theorem's ideas */
    const length = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
    /*editing/personalizing the div based on each line*/
    line.style.width = `${length}px`;
    line.style.transform = `rotate(${angle}deg)`;
    line.style.left = `${x1}px`;
    line.style.top = `${y1}px`;
    line.style.transformOrigin = '0 0';
    /*at the end, append to the mapContainer,
    the drawing of the line */
    mapContainer.appendChild(line);
}
