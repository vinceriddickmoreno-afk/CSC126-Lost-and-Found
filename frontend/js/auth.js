function isLoggedIn() { return !!localStorage.getItem('accessToken'); }
function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
}
function requireAuth() { if (!isLoggedIn()) window.location.href = 'login.html'; }

function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

function showToast(msg, type = 'success') {
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

// LOGIN PAGE
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        try {
            const res = await authAPI.login({ email, password });
            TokenStore.set(res.accessToken, res.refreshToken);
            localStorage.setItem('user', JSON.stringify(res.user));
            showToast('Login successful!');
            setTimeout(() => window.location.href = 'dashboard.html', 800);
        } catch (err) { showToast(err.message, 'error'); }
    });
}

// REGISTER PAGE
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirm = document.getElementById('confirmPassword').value;
        if (password !== confirm) return showToast('Passwords do not match', 'error');
        if (password.length < 6) return showToast('Password too short', 'error');
        try {
            const res = await authAPI.register({ name, email, password });
            TokenStore.set(res.accessToken, res.refreshToken);
            localStorage.setItem('user', JSON.stringify(res.user));
            showToast('Account created!');
            setTimeout(() => window.location.href = 'dashboard.html', 800);
        } catch (err) { showToast(err.message, 'error'); }
    });
}