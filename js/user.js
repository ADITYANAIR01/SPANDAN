document.addEventListener('DOMContentLoaded', () => {
    loadReports();
});

function loadReports() {
    const grid = document.getElementById('reports-grid');
    const reports = JSON.parse(localStorage.getItem('bmc_reports') || '[]');

    if (reports.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No reports submitted yet.</p>';
        return;
    }

    grid.innerHTML = reports.map(report => `
        <div class="glass-card" style="padding: 0; overflow: hidden; border: 1px solid var(--glass-border);">
            <div style="height: 150px; background: #334155; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                <img src="${report.image}" alt="Report Image" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div style="padding: 1.5rem;">
                <h4 style="margin-bottom: 0.5rem; color: var(--text-primary);">${escapeHtml(report.name)}</h4>
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                    ${escapeHtml(report.description)}
                </p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
                    <span style="font-size: 0.8rem; color: var(--accent-secondary); background: rgba(245, 158, 11, 0.1); padding: 0.25rem 0.5rem; border-radius: 1rem;">${report.status}</span>
                    <span style="font-size: 0.8rem; color: var(--text-secondary);">${report.date.split(',')[0]}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
