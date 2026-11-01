// Global application state and utility methods
const API_BASE_URL = (window.__ENV__?.API_BASE_URL || 'http://localhost:8080/api').replace(/\/$/, '');
const RUNNER_URL   = `${API_BASE_URL}/run`;

// Theme: Permanent Dark Mode
function initTheme() {
    document.documentElement.classList.add('dark');
    try {
        localStorage.removeItem('theme');
        localStorage.removeItem('currentTheme');
    } catch (e) {}
}

// Format date strings helper
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
});
