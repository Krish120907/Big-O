// Global application state and utility methods
const API_BASE_URL = (window.__ENV__?.API_BASE_URL || 'http://localhost:8080/api').replace(/\/$/, '');
const RUNNER_URL   = `${API_BASE_URL}/run`;

// Theme system (3 themes: dark, light, earth)
function initTheme() {
    const theme = localStorage.theme || 'dark';
    setTheme(theme);
}

function setTheme(theme) {
    document.documentElement.classList.remove('dark', 'earth', 'ember', 'ocean', 'gold');

    if (theme === 'dark')       document.documentElement.classList.add('dark');
    else if (theme === 'earth') document.documentElement.classList.add('earth');
    // light theme = no class

    localStorage.theme = theme;
}

function toggleTheme() {
    const currentTheme = localStorage.theme || 'dark';
    const themes = ['dark', 'light', 'earth'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
}

// Format date strings helper
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
});
