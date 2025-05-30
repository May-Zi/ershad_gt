let startTime = Date.now();

        const mapContainer = document.getElementById('map-container');
        const mapImage = document.getElementById('map');

        async function sendLocation(time, x, y) {
            await fetch('/add-location', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({time: time, x: x, y: y})
            });
        }

        mapContainer.addEventListener('dblclick', function(event) {
            const rect = mapImage.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width;
            const y = (event.clientY - rect.top) / rect.height;
            const timeSeconds = ((Date.now() - startTime) / 1000).toFixed(2);

            sendLocation(timeSeconds, x.toFixed(4), y.toFixed(4));

            const icon = document.createElement('div');
            icon.classList.add('location-icon');
            icon.style.left = `${x * 100}%`;
            icon.style.top = `${y * 100}%`;
            mapContainer.appendChild(icon);
        });

        function exportCSV() {
            window.location.href = '/export';
        }