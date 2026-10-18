const API_BASE = (() => {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:5000/api`;
})();

const TokenStore = {
    get access() { return localStorage.getItem('accessToken'); },
    get refresh() { return localStorage.getItem('refreshToken'); },
    set(a, r) {
        localStorage.setItem('accessToken', a);
        if (r) localStorage.setItem('refreshToken', r);
    },
    clear() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    }
};

async function apiCall(endpoint, options = {}, retry = true) {
    const token = TokenStore.access;
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

    if (response.status === 401 && retry && TokenStore.refresh) {
        const ok = await tryRefresh();
        if (ok) return apiCall(endpoint, options, false);
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
}

async function tryRefresh() {
    try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: TokenStore.refresh })
        });
        if (!res.ok) { TokenStore.clear(); return false; }
        const d = await res.json();
        TokenStore.set(d.accessToken);
        return true;
    } catch { return false; }
}

const authAPI = {
    register: (d) => apiCall('/auth/register', { method: 'POST', body: JSON.stringify(d) }),
    login: (d) => apiCall('/auth/login', { method: 'POST', body: JSON.stringify(d) }),
    getProfile: () => apiCall('/auth/profile'),
    updateProfile: (d) => apiCall('/auth/profile', { method: 'PUT', body: JSON.stringify(d) }),
    changePassword: (d) => apiCall('/auth/change-password', { method: 'PUT', body: JSON.stringify(d) })
};

const itemsAPI = {
    getAll: (params = '') => apiCall(`/items${params}`),
    getById: (id) => apiCall(`/items/${id}`),
    create: (formData) => fetch(`${API_BASE}/items`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${TokenStore.access}` },
        body: formData
    }).then(r => r.json()),
    update: (id, formData) => fetch(`${API_BASE}/items/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${TokenStore.access}` },
        body: formData
    }).then(r => r.json()),
    delete: (id) => apiCall(`/items/${id}`, { method: 'DELETE' })
};

const claimsAPI = {
    create: (d) => apiCall('/claims', { method: 'POST', body: JSON.stringify(d) }),
    getMyClaims: () => apiCall('/claims/my-claims')
};

const adminAPI = {
    getStats: () => apiCall('/admin/stats'),
    getClaims: () => apiCall('/admin/claims'),
    updateClaim: (id, status) => apiCall(`/admin/claims/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
    getUsers: () => apiCall('/admin/users')
};