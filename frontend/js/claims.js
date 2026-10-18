document.addEventListener('DOMContentLoaded', async () => {
    if (!TokenStore.access) return window.location.href = 'login.html';
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => { e.preventDefault(); TokenStore.clear(); window.location.href = 'login.html'; });
    
    const container = document.getElementById('claimsContainer');
    try {
        const data = await claimsAPI.getMine();
        const claims = data.claims || [];
        if (!claims.length) return container.innerHTML = '<p>You have no claims yet.</p>';

        container.innerHTML = claims.map(c => `
            <div class="card glass">
                <h3>${c.itemTitle || 'Item'}</h3>
                <p><strong>Message:</strong> ${c.message}</p>
                <p><strong>Contact:</strong> ${c.contact_number}</p>
                <div style="margin-top: 1rem;"><span class="pill pill-${c.status.toLowerCase()}">${c.status}</span></div>
            </div>`).join('');
    } catch (err) { container.innerHTML = `<p style="color: red;">Error: ${err.message}</p>`; }
});