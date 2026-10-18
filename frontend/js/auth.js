document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const data = await authAPI.login({ email: e.target.email.value, password: e.target.password.value });
                TokenStore.set(data.accessToken);
                window.location.href = 'dashboard.html';
            } catch (err) { alert(err.message); }
        });
    }
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const data = await authAPI.register({ name: e.target.name.value, email: e.target.email.value, password: e.target.password.value });
                TokenStore.set(data.accessToken);
                window.location.href = 'dashboard.html';
            } catch (err) { alert(err.message); }
        });
    }
});