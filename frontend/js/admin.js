document.addEventListener('DOMContentLoaded', async () => {
    if (!TokenStore.access) return window.location.href = 'login.html';
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => { e.preventDefault(); TokenStore.clear(); window.location.href = 'login.html'; });

    loadAdminData();
});

async function loadAdminData() {
    try {
        const stats = await adminAPI.getStats();
        document.getElementById('statUsers').textContent = stats.users;
        document.getElementById('statItems').textContent = stats.items;
        document.getElementById('statClaims').textContent = stats.pendingClaims;

        const data = await adminAPI.getClaims();
        const tbody = document.getElementById('claimsTableBody');
        
        if (!data.claims.length) {
            tbody.innerHTML = '<tr><td colspan="5">No claims found.</td></tr>';
            return;
        }

        tbody.innerHTML = data.claims.map(c => `
            <tr>
                <td>${c.itemTitle}</td>
                <td>${c.claimantName}</td>
                <td>${c.contact_number}</td>
                <td><span class="pill pill-${c.status.toLowerCase()}">${c.status}</span></td>
                <td>
                    ${c.status === 'pending' ? `
                        <button class="btn btn-primary btn-sm" onclick="updateStatus(${c.id}, 'approved')">Approve</button>
                        <button class="btn btn-secondary btn-sm" onclick="updateStatus(${c.id}, 'rejected')">Reject</button>
                    ` : 'Action Taken'}
                </td>
            </tr>
        `).join('');
    } catch (err) {
        alert("Error loading admin data: " + err.message);
        console.error(err);
    }
}

async function updateStatus(claimId, status) {
    if (!confirm(`Are you sure you want to mark this claim as ${status}?`)) return;
    try {
        await adminAPI.updateClaim(claimId, status);
        alert(`Claim ${status}!`);
        loadAdminData(); 
    } catch (err) {
        alert(err.message);
    }
}