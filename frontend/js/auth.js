function isLoggedIn() { return !!localStorage.getItem('token'); }
function getCurrentUser() { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; }
function requireAuth() { if (!isLoggedIn()) window.location.href = 'login.html'; }
function logout() { localStorage.clear(); window.location.href = 'index.html'; }

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} z-50 shadow-lg`;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            const res = await authAPI.login({ email, password });
            localStorage.setItem('token', res.token);
            localStorage.setItem('user', JSON.stringify(res.user));
            showToast('Login successful!');
            setTimeout(() => window.location.href = 'dashboard.html', 1000);
        } catch (err) { showToast(err.message, 'error'); }
    });
}

if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirm = document.getElementById('confirmPassword').value;
        if (password !== confirm) return showToast('Passwords do not match', 'error');
        if (password.length < 6) return showToast('Password min 6 characters', 'error');
        try {
            const res = await authAPI.register({ name, email, password });
            localStorage.setItem('token', res.token);
            localStorage.setItem('user', JSON.stringify(res.user));
            showToast('Registration successful!');
            setTimeout(() => window.location.href = 'dashboard.html', 1000);
        } catch (err) { showToast(err.message, 'error'); }
    });
}
