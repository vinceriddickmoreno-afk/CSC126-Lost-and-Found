async function loadMyClaims() {
    try {
        const claims = await claimsAPI.getMyClaims();
        const tb = document.getElementById('claimsTableBody');
        if (!tb) return;
        if (!claims.length) {
            tb.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted);">No claims yet</td></tr>';
            return;
        }
        tb.innerHTML = claims.map(c => `
            <tr>
                <td>${c.id}</td>
                <td>${c.itemTitle || '-'}</td>
                <td>${c.itemLocation || '-'}</td>
                <td>${c.message || '-'}</td>
                <td><span class="pill pill-${c.status}">${c.status}</span></td>
            </tr>`).join('');
    } catch (err) { console.error(err); }
}

if (document.getElementById('claimsTableBody')) {
    document.addEventListener('DOMContentLoaded', () => {
        requireAuth();
        loadMyClaims();
    });
}