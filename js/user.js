document.addEventListener('DOMContentLoaded', () => {
    try {
        initMap();
    } catch (error) {
        console.error('Map initialization failed:', error);
        const mapEl = document.getElementById('map');
        if (mapEl) {
            mapEl.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-secondary);background:rgba(0,0,0,0.2);">Map could not be loaded. Please check internet connection.</div>';
        }
    }
    setupForm();
    setupLocationSearch();
});

let map;
let marker;

function initMap() {
    if (typeof L === 'undefined') {
        throw new Error('Leaflet not loaded');
    }

    // Coordinates for Mumbai, India
    const mumbaiCoords = [19.0760, 72.8777];

    // Initialize map
    map = L.map('map').setView(mumbaiCoords, 11);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Handle map click
    map.on('click', function (e) {
        const { lat, lng } = e.latlng;

        // Update hidden inputs
        document.getElementById('latitude').value = lat;
        document.getElementById('longitude').value = lng;

        // Update UI status
        const statusEl = document.getElementById('location-status');
        statusEl.textContent = `Selected: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        statusEl.style.color = 'var(--success)';

        // Place or move marker
        if (marker) {
            marker.setLatLng(e.latlng);
        } else {
            marker = L.marker(e.latlng).addTo(map);
        }
    });
}

function setupForm() {
    const form = document.getElementById('reportForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Basic validation
        const lat = document.getElementById('latitude').value;
        if (!lat) {
            alert('Please select a location on the map.');
            return;
        }

        const fileInput = document.getElementById('fileInput');
        if (fileInput.files.length < 1) {
            alert('Please upload at least 1 photo.');
            return;
        }

        const name = document.getElementById('placeNameInput').value;
        const pincode = document.getElementById('pincodeInput').value;
        const description = form.querySelector('textarea').value;

        // Process images to Base64 (taking the first one as main image for now)
        const imageFile = fileInput.files[0];
        let imageBase64 = 'https://via.placeholder.com/150/334155/FFFFFF?text=Report+Image';

        try {
            imageBase64 = await toBase64(imageFile);
        } catch (err) {
            console.error('Error converting image', err);
        }

        // Create Report Object
        const report = {
            id: Date.now(),
            name,
            pincode,
            description,
            location: { lat, lng: document.getElementById('longitude').value },
            date: new Date().toLocaleString(),
            status: 'Pending Review',
            image: imageBase64
        };

        // Save to LocalStorage
        try {
            const reports = JSON.parse(localStorage.getItem('bmc_reports') || '[]');
            reports.unshift(report);
            localStorage.setItem('bmc_reports', JSON.stringify(reports));
        } catch (e) {
            alert('Failed to save report locally. Storage might be full or disabled.');
            console.error(e);
            return;
        }

        // Simulate submission
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = 'Submitting...';
        btn.disabled = true;

        setTimeout(() => {
            alert('Report submitted successfully!');
            form.reset();
            document.getElementById('preview-container').innerHTML = '';
            document.getElementById('location-status').textContent = 'Click on the map to pin a location.';
            document.getElementById('location-status').style.color = 'var(--accent-secondary)';
            if (marker) {
                map.removeLayer(marker);
                marker = null;
            }
            btn.textContent = originalText;
            btn.disabled = false;
        }, 1000);
    });
}

// Helper to convert file to Base64
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// Global function for file input change
window.handleFileSelect = function (event) {
    const files = event.target.files;
    const previewContainer = document.getElementById('preview-container');
    previewContainer.innerHTML = ''; // Clear previous

    if (files.length > 0) {
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.width = '80px';
                img.style.height = '80px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '0.25rem';
                img.style.border = '1px solid var(--glass-border)';
                previewContainer.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    }
};

// --- New Search Logic ---

function setupLocationSearch() {
    const input = document.getElementById('placeNameInput');
    const suggestionsBox = document.getElementById('location-suggestions');

    // Debounce function to limit API calls
    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    input.addEventListener('input', debounce(async (e) => {
        const query = e.target.value;
        if (query.length < 3) {
            suggestionsBox.style.display = 'none';
            return;
        }

        try {
            // Using Nominatim API for geocoding
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`);
            const data = await response.json();

            if (data.length > 0) {
                suggestionsBox.innerHTML = data.map(place => {
                    const pincode = place.address && place.address.postcode ? place.address.postcode : '';
                    return `
                    <div class="suggestion-item" 
                         style="padding: 0.75rem; cursor: pointer; border-bottom: 1px solid var(--glass-border); transition: background 0.2s;"
                         onmouseover="this.style.background='rgba(255,255,255,0.1)'"
                         onmouseout="this.style.background='transparent'"
                         onclick="selectLocation(${place.lat}, ${place.lon}, '${escapeHtml(place.display_name).replace(/'/g, "\\'")}', '${pincode}')">
                        <div style="font-weight: 600; color: var(--text-primary);">${escapeHtml(place.display_name.split(',')[0])}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(place.display_name)}</div>
                    </div>
                `}).join('');
                suggestionsBox.style.display = 'block';
            } else {
                suggestionsBox.style.display = 'none';
            }
        } catch (err) {
            console.error('Search failed', err);
        }
    }, 500));

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !suggestionsBox.contains(e.target)) {
            suggestionsBox.style.display = 'none';
        }
    });
}

window.selectLocation = function(lat, lng, name, pincode) {
    const input = document.getElementById('placeNameInput');
    const pincodeInput = document.getElementById('pincodeInput');
    const suggestionsBox = document.getElementById('location-suggestions');
    
    // Update Input with the full name or just the first part
    input.value = name;
    if (pincode) {
        pincodeInput.value = pincode;
    }
    suggestionsBox.style.display = 'none';

    // Update Map
    const latLng = [lat, lng];
    map.setView(latLng, 16);
    
    if (marker) {
        marker.setLatLng(latLng);
    } else {
        marker = L.marker(latLng).addTo(map);
    }

    // Update Hidden Inputs
    document.getElementById('latitude').value = lat;
    document.getElementById('longitude').value = lng;
    
    // Update Status Text
    const statusEl = document.getElementById('location-status');
    statusEl.textContent = `Selected: ${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`;
    statusEl.style.color = 'var(--success)';
};

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
