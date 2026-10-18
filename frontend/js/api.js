const API_BASE = 'http://localhost:5000/api';
const TokenStore = {
    get access() { return localStorage.getItem('token'); },
    set(token) { localStorage.setItem('token', token); },
    clear() { localStorage.removeItem('token'); }
};
async function apiCall(path, options = {}) {
    const headers = options.headers || {};
    if (TokenStore.access) headers['Authorization'] = `Bearer ${TokenStore.access}`;
    if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}
const authAPI = {
    register: (body) => apiCall('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body) => apiCall('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    profile: () => apiCall('/auth/profile')
};
const itemsAPI = {
    getAll: () => apiCall('/items'),
    create: async (formData) => {
        const res = await fetch(`${API_BASE}/items`, { method: 'POST', headers: { Authorization: `Bearer ${TokenStore.access}` }, body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        return data;
    }
};
const claimsAPI = {
    create: (body) => apiCall('/claims', { method: 'POST', body: JSON.stringify(body) }),
    getMine: () => apiCall('/claims/mine')
};
const adminAPI = {
    getStats: () => apiCall('/admin/stats'),
    getClaims: () => apiCall('/admin/claims'),
    updateClaim: (id, status) => apiCall(`/admin/claims/${id}`, { method: 'PUT', body: JSON.stringify({ status }) })
};