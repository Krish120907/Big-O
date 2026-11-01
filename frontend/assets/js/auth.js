// Authentication Helper Utilities
function parseJwtPayload(token) {
    if (!token || typeof token !== 'string') return null;
    try {
        const parts = token.split('.');
        if (parts.length < 2) return null;
        let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        const jsonStr = decodeURIComponent(
            Array.prototype.map.call(atob(base64), function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join('')
        );
        return JSON.parse(jsonStr);
    } catch (e) {
        try {
            let base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            while (base64.length % 4) base64 += '=';
            return JSON.parse(atob(base64));
        } catch (e2) {
            return null;
        }
    }
}

const Auth = {
    getToken() {
        return localStorage.getItem('token') || sessionStorage.getItem('token');
    },

    setToken(token) {
        if (!token) return;
        localStorage.setItem('token', token);
        sessionStorage.setItem('token', token);
        const user = this.getUserFromToken(token);
        if (user) {
            this.setUser(user);
        }
    },

    setUser(user) {
        if (!user) return;
        try {
            const str = JSON.stringify(user);
            localStorage.setItem('user', str);
            sessionStorage.setItem('user', str);
        } catch (e) {}
    },

    getUserFromToken(token) {
        const payload = parseJwtPayload(token || this.getToken());
        if (!payload) return null;
        return payload.user || payload;
    },

    getUser() {
        try {
            const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && (parsed.id || parsed.username)) return parsed;
            }
        } catch (e) {}

        const token = this.getToken();
        if (!token) return null;
        const user = this.getUserFromToken(token);
        if (user) {
            this.setUser(user);
            return user;
        }
        return null;
    },

    clearToken() {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
    },

    isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;
        const payload = parseJwtPayload(token);
        if (!payload) return false;
        if (payload.exp && payload.exp < (Date.now() / 1000)) {
            this.clearToken();
            return false;
        }
        return true;
    },

    getAuthHeader() {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    },

    checkAuthGuard() {
        if (!this.isAuthenticated()) {
            this.logout();
            return false;
        }
        return true;
    },

    logout() {
        this.clearToken();
        window.location.href = 'landing.html';
    }
};

window.Auth = Auth;

