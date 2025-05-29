const map = document.getElementById('map');
const container = document.getElementById('map-container');
const exportBtn = document.getElementById('export-btn');

// Get values from data-* attributes
const body = document.body;
const sessionId = body.dataset.sessionId;
const mapId = body.dataset.mapId;
const startTime = parseFloat(body.dataset.startTime);

map.addEventListener('dblclick', function (e) {
    e.preventDefault();

    const rect = map.getBoundingClientRect();
    const xRatio = ((e.clientX - rect.left) / rect.width).toFixed(4);
    const yRatio = ((e.clientY - rect.top) / rect.height).toFixed(4);
    const timestamp = ((Date.now() - (startTime * 1000)) / 1000).toFixed(2);

    // Send to server
    fetch('/add_location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            x: xRatio,
            y: yRatio,
            timestamp: timestamp,
            session_id: sessionId
        })
    });

    // Add visual marker
    const marker = document.createElement('div');
    marker.classList.add('marker');
    const x = e.clientX - container.getBoundingClientRect().left;
    const y = e.clientY - container.getBoundingClientRect().top;
    marker.style.left = `${x}px`;
    marker.style.top = `${y}px`;
    container.appendChild(marker);
});

exportBtn.addEventListener('click', function () {
    const link = document.createElement("a");
    link.href = `/export_csv/${sessionId}/${mapId}`;
    link.download = `map_${mapId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Redirect after short delay
    setTimeout(() => {
        window.location.href = `/mapping/${mapId}/1/?session_id=${sessionId}`;
    }, 1000);
});
