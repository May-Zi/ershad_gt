
let startTime = 0;
let elapsed = 0;
let timerRunning = false;
let intervalId = null;

const mapContainer = document.getElementById('map-container');
const mapImage = document.getElementById('map');
const timeDisplay = document.getElementById('current-time');

// Visual points for drawing lines/dots on screen
let points = [];

// Full data points for localStorage + CSV export (time, pixelX, pixelY, normX, normY)
let localPoints = [];

document.getElementById('exportBtn').disabled = true;

/* --- localStorage helpers --- */

function getStorageKey() {
    const src = mapImage.getAttribute('src');
    const mapName = src.split('/').pop();
    return `ershad_${mapName}`;
}

function saveToLocalStorage() {
    localStorage.setItem(getStorageKey(), JSON.stringify(localPoints));
}

function clearLocalStorage() {
    localStorage.removeItem(getStorageKey());
}

/* On page load, check for a saved session */
function loadFromLocalStorage() {
    const stored = localStorage.getItem(getStorageKey());
    if (!stored) return;
    let savedPoints;
    try { savedPoints = JSON.parse(stored); } catch { return; }
    if (!savedPoints || savedPoints.length === 0) return;
    showRestoreBanner(savedPoints);
}

function showRestoreBanner(savedPoints) {
    window._pendingSavedPoints = savedPoints;
    const banner = document.createElement('div');
    banner.id = 'restore-banner';
    banner.innerHTML = `
        <span>${savedPoints.length} unsaved point(s) from a previous session.</span>
        <button onclick="restoreSession()">Restore</button>
        <button onclick="discardSession()">Discard</button>
    `;
    const header = document.querySelector('.map-header');
    header.insertAdjacentElement('afterend', banner);
}

function restoreSession() {
    const savedPoints = window._pendingSavedPoints;
    if (!savedPoints) return;
    localPoints = savedPoints;

    function drawSaved() {
        const rect = mapImage.getBoundingClientRect();
        savedPoints.forEach(p => {
            const relX = p.normX * rect.width;
            const relY = p.normY * rect.height;
            points.push({ x: relX, y: relY });

            const icon = document.createElement('div');
            icon.classList.add('location-icon');
            icon.style.left = `${relX}px`;
            icon.style.top = `${relY}px`;
            mapContainer.appendChild(icon);

            if (points.length >= 2) {
                const prev = points[points.length - 2];
                drawLine(prev.x, prev.y, relX, relY);
            }
        });

        document.getElementById('exportBtn').disabled = false;
        const startBtn = document.getElementById('startBtn');
        startBtn.textContent = 'Reset Mapping';
        startBtn.classList.add('reset-mode');
        startBtn.disabled = false;
    }

    if (mapImage.complete) {
        drawSaved();
    } else {
        mapImage.addEventListener('load', drawSaved, { once: true });
    }

    removeBanner();
}

function discardSession() {
    clearLocalStorage();
    window._pendingSavedPoints = null;
    removeBanner();
}

function removeBanner() {
    const banner = document.getElementById('restore-banner');
    if (banner) banner.remove();
}

/* --- Map selection / upload --- */

function changeMap(filename) {
    window.location.href = '/mapping?map=' + encodeURIComponent(filename);
}

async function uploadMap() {
    const fileInput = document.getElementById('mapFile');
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('map', file);

    const response = await fetch('/upload-map', {
        method: 'POST',
        body: formData
    });

    const result = await response.json();
    if (result.status === 'ok') {
        window.location.href = '/mapping?map=' + encodeURIComponent(result.filename);
    } else {
        alert('Upload failed: ' + (result.error || 'Unknown error'));
    }
}

/* --- Mapping controls --- */

function startMapping() {
    const startBtn = document.getElementById('startBtn');

    if (startBtn.classList.contains('reset-mode')) {
        clearLocalStorage();
        location.reload();
        return;
    }

    startTime = Date.now() - elapsed;
    timerRunning = true;
    startBtn.disabled = true;
    document.getElementById('pauseBtn').disabled = false;

    document.getElementById('mapSelect').disabled = true;
    document.querySelector('.map-selector button').disabled = true;

    intervalId = setInterval(updateTime, 100);
}

function togglePause() {
    if (timerRunning) {
        elapsed = Date.now() - startTime;
        clearInterval(intervalId);
    } else {
        startTime = Date.now() - elapsed;
        intervalId = setInterval(updateTime, 100);
    }
    timerRunning = !timerRunning;
}

function updateTime() {
    const currentTime = ((Date.now() - startTime) / 1000).toFixed(2);
    timeDisplay.textContent = currentTime;
}

/* --- Export: client-side CSV, no page navigation --- */

function exportCSV() {
    if (localPoints.length === 0) return;

    const rows = [['time', 'xAxis', 'yAxis']];
    for (const p of localPoints) {
        rows.push([p.time, p.pixelX, p.pixelY]);
    }
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
    a.download = `${timestamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/* --- Location recording --- */

async function sendLocation(time, x, y) {
    await fetch('/add-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time, x, y })
    });
}

mapContainer.addEventListener('dblclick', function(event) {
    if (!timerRunning) return;

    const rect = mapImage.getBoundingClientRect();
    const normX = (event.clientX - rect.left) / rect.width;
    const normY = (event.clientY - rect.top) / rect.height;

    const timeSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
    const pixelX = Math.round(normX * mapImage.naturalWidth);
    const pixelY = Math.round(normY * mapImage.naturalHeight);

    sendLocation(timeSeconds, pixelX, pixelY);

    // Save full data to localPoints and persist
    localPoints.push({ time: timeSeconds, pixelX, pixelY, normX, normY });
    saveToLocalStorage();

    // Draw dot
    const relX = event.clientX - rect.left;
    const relY = event.clientY - rect.top;

    const icon = document.createElement('div');
    icon.classList.add('location-icon');
    icon.style.left = `${relX}px`;
    icon.style.top = `${relY}px`;
    mapContainer.appendChild(icon);

    points.push({ x: relX, y: relY });

    if (points.length >= 2) {
        const prev = points[points.length - 2];
        drawLine(prev.x, prev.y, relX, relY);
    }

    document.getElementById('exportBtn').disabled = false;

    const startBtn = document.getElementById('startBtn');
    startBtn.textContent = 'Reset Mapping';
    startBtn.classList.add('reset-mode');
    startBtn.disabled = false;
});

function drawLine(x1, y1, x2, y2) {
    const line = document.createElement('div');
    line.classList.add('line');
    const length = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
    line.style.width = `${length}px`;
    line.style.transform = `rotate(${angle}deg)`;
    line.style.left = `${x1}px`;
    line.style.top = `${y1}px`;
    line.style.transformOrigin = '0 0';
    mapContainer.appendChild(line);
}

/* Check for saved session on load */
loadFromLocalStorage();
