

let startTime = 0;
let elapsed = 0;

/* knowing that when the user visits the page,
one still needs to click to start */
let timerRunning = false;
let intervalId = null;

const mapContainer = document.getElementById('map-container');
const mapImage = document.getElementById('map');
const timeDisplay = document.getElementById('current-time');

let scale = 1;
let lastTouchEnd = 0;
let startDistance = 0;
const wrapper = document.getElementById('map-wrapper');

// Detect double-tap for zoom in
mapContainer.addEventListener('touchend', function (e) {
    const now = new Date().getTime();
    if (now - lastTouchEnd <= 300) {
        scale = Math.min(scale + 0.5, 3); // max zoom
        wrapper.style.transform = `scale(${scale})`;
    }
    lastTouchEnd = now;
});

// Pinch to zoom
mapContainer.addEventListener('touchmove', function (e) {
    if (e.touches.length === 2) {
        e.preventDefault();
        const dist = getDistance(e.touches[0], e.touches[1]);
        if (startDistance === 0) {
            startDistance = dist;
        } else {
            let newScale = scale * (dist / startDistance);
            newScale = Math.max(1, Math.min(newScale, 3)); // limit scale
            wrapper.style.transform = `scale(${newScale})`;
        }
    }
}, { passive: false });

mapContainer.addEventListener('touchend', function (e) {
    if (e.touches.length < 2) {
        scale = parseFloat(wrapper.style.transform.replace('scale(', '').replace(')', '')) || 1;
        startDistance = 0;
    }
});

function getDistance(touch1, touch2) {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

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
    const rect = mapImage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const timeSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
    const naturalWidth = 1946;
    const naturalHeight = 1574;
    const pixelX = Math.round(x * naturalWidth);
    const pixelY = Math.round(y * naturalHeight);
    const icon = document.createElement('div');
    icon.classList.add('location-icon');
    icon.style.left = `${x * 100}%`;
    icon.style.top = `${y * 105}%`;
    mapContainer.appendChild(icon);
    sendLocation(timeSeconds, pixelX.toFixed(4), pixelY.toFixed(4));
    const relativeX = event.clientX - rect.left;
    const relativeY = event.clientY - rect.top;
    points.push({ x: relativeX, y: relativeY });
    if (points.length > 0) {
        document.getElementById('exportBtn').disabled = false;
    }
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
