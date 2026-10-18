async function loadAdmin() {
    try {
        const stats = await adminAPI.getStats();
        document.getElementById('totalItems').textContent = stats.totalItems;
        document.getElementById('totalClaims').textContent = stats.totalClaims;
        document.getElementById('pendingClaims').textContent = stats.pendingClaims;
        const claims = await adminAPI.getClaims();
        const tb = document.getElementById('claimsTableBody');
        if (!tb) return;
        tb.innerHTML = claims.length ? claims.map(c => `
            <tr>
                <td>${c.id}</td>
                <td>${c.itemTitle || '-'}</td>
                <td>${c.claimantName || '-'}</td>
                <td>${c.message || '-'}</td>
                <td><span class="pill pill-${c.status}">${c.status}</span></td>
                <td>
                    ${c.status === 'pending' ? `
                        <button class="btn btn-ghost btn-sm" onclick="setClaim(${c.id},'approved')" style="color:#15803d;">Approve</button>
                        <button class="btn btn-ghost btn-sm" onclick="setClaim(${c.id},'rejected')" style="color:#dc2626;">Reject</button>
                    ` : '-'}
                </td>
            </tr>`).join('') : '<tr><td colspan="6" style="text-align:center;padding:2rem;">No claims</td></tr>';
    } catch (err) { console.error(err); }
}

async function setClaim(id, status) {
    try { await adminAPI.updateClaim(id, status); loadAdmin(); }
    catch (err) { alert(err.message); }
}

if (document.getElementById('claimsTableBody') && document.getElementById('totalItems')) {
    document.addEventListener('DOMContentLoaded', () => {
        requireAuth();
        const u = getCurrentUser();
        if (!u || u.role !== 'admin') return window.location.href = 'dashboard.html';
        loadAdmin();
    });
}