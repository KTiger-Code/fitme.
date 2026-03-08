/**
 * API Helper — fetch wrapper with JWT token
 */
const API_BASE = 'http://localhost:5000/api';

function getToken() {
    return localStorage.getItem('fitlife_token');
}

function setToken(token) {
    localStorage.setItem('fitlife_token', token);
}

function removeToken() {
    localStorage.removeItem('fitlife_token');
}

async function api(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
    };

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
        });

        const data = await res.json();

        if (!res.ok) {
            if (res.status === 401) {
                removeToken();
                showPage('page-login');
            }
            throw new Error(data.error || 'เกิดข้อผิดพลาด');
        }

        return data;
    } catch (error) {
        if (error.message === 'Failed to fetch') {
            throw new Error('ไม่สามารถเชื่อมต่อ Server ได้ (กรุณาเปิด Backend)');
        }
        throw error;
    }
}

// Shorthand methods
const API = {
    get: (url) => api(url),
    post: (url, body) => api(url, { method: 'POST', body: JSON.stringify(body) }),
    put: (url, body) => api(url, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (url) => api(url, { method: 'DELETE' })
};
