document.addEventListener('DOMContentLoaded', () => {
    initMap();
    setupForm();
});

let map;
let marker;

function initMap() {
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
        if (fileInput.files.length < 2) {
            alert('Please upload at least 2 photos.');
            return;
        }

        const name = form.querySelector('input[type="text"]').value;
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
            description,
            location: { lat, lng: document.getElementById('longitude').value },
            date: new Date().toLocaleString(),
            status: 'Pending Review',
            image: imageBase64
        };

        // Save to LocalStorage
        const reports = JSON.parse(localStorage.getItem('bmc_reports') || '[]');
        reports.unshift(report);
        localStorage.setItem('bmc_reports', JSON.stringify(reports));

        // Simulate submission
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = 'Submitting...';
        btn.disabled = true;

        setTimeout(() => {
            alert('Report submitted successfully! Check the User Dashboard.');
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

// View Switcher
window.switchView = function (view) {
    const reportSection = document.getElementById('report-section');
    const manageSection = document.getElementById('manage-section');

    if (view === 'report') {
        reportSection.style.display = 'block';
        manageSection.style.display = 'none';
        // Re-invalidate map size because it was hidden
        setTimeout(() => map.invalidateSize(), 100);
    } else {
        reportSection.style.display = 'none';
        manageSection.style.display = 'block';
        loadAdminReports();
    }
};

// Load Reports for Admin
function loadAdminReports() {
    const grid = document.getElementById('admin-reports-grid');
    const reports = JSON.parse(localStorage.getItem('bmc_reports') || '[]');

    if (reports.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No reports found.</p>';
        return;
    }

    grid.innerHTML = reports.map(report => `
        <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 0.5rem; display: flex; gap: 1rem; align-items: center; border: 1px solid var(--glass-border);">
            <img src="${report.image}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 0.25rem;">
            <div style="flex: 1;">
                <h4 style="color: var(--text-primary);">${escapeHtml(report.name)}</h4>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">${escapeHtml(report.description)}</p>
                <div style="margin-top: 0.5rem; font-size: 0.8rem;">
                    <span style="color: var(--accent-secondary);">Status: ${report.status}</span>
                </div>
            </div>
            <div>
                ${report.status === 'Pending Review' ? `
                    <button onclick="updateStatus(${report.id}, 'Resolved')" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.9rem; background: var(--success);">Resolve</button>
                ` : `
                    <button disabled class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.9rem; opacity: 0.5;">Resolved</button>
                `}
            </div>
        </div>
    `).join('');
}

// Update Status
window.updateStatus = function (id, newStatus) {
    const reports = JSON.parse(localStorage.getItem('bmc_reports') || '[]');
    const index = reports.findIndex(r => r.id === id);
    if (index !== -1) {
        reports[index].status = newStatus;
        localStorage.setItem('bmc_reports', JSON.stringify(reports));
        loadAdminReports(); // Refresh list
    }
};

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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
