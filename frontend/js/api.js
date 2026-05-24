const API_BASE = (() => {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:5000/api`;
})();

async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
}

const authAPI = {
    register: (data) => apiCall('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data) => apiCall('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    getProfile: () => apiCall('/auth/profile'),
    updateProfile: (data) => apiCall('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
    changePassword: (data) => apiCall('/auth/change-password', { method: 'PUT', body: JSON.stringify(data) })
};

const itemsAPI = {
    getAll: (params = '') => apiCall(`/items${params}`),
    create: (formData) => {
        return fetch(`${API_BASE}/items`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData
        }).then(res => res.json());
    },
    update: (id, formData) => {
        return fetch(`${API_BASE}/items/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData
        }).then(res => res.json());
    },
    delete: (id) => apiCall(`/items/${id}`, { method: 'DELETE' })
};

const claimsAPI = {
    create: (data) => apiCall('/claims', { method: 'POST', body: JSON.stringify(data) }),
    getMyClaims: () => apiCall('/claims/my-claims'),
    updateStatus: (id, status) => apiCall(`/claims/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
};

const adminAPI = {
    getStats: () => apiCall('/admin/stats'),
    getClaims: () => apiCall('/admin/claims'),
    updateClaim: (id, status) => apiCall(`/admin/claims/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
    getUsers: () => apiCall('/admin/users'),
    deleteUser: (id) => apiCall(`/admin/users/${id}`, { method: 'DELETE' })
};
