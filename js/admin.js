document.addEventListener('DOMContentLoaded', () => {
    loadAdminReports();
});

// Load Reports for Admin
function loadAdminReports() {
    const grid = document.getElementById('admin-reports-grid');
    let reports = [];
    try {
        reports = JSON.parse(localStorage.getItem('bmc_reports') || '[]');
    } catch (e) {
        console.error('Error loading reports:', e);
        grid.innerHTML = '<p style="text-align: center; color: var(--danger);">Error loading reports.</p>';
        return;
    }

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

