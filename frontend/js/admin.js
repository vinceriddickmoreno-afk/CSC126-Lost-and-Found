async function loadAdminData() {
    const stats = await adminAPI.getStats();
    document.getElementById('totalItems').innerText = stats.totalItems;
    document.getElementById('totalClaims').innerText = stats.totalClaims;
    document.getElementById('pendingClaims').innerText = stats.pendingClaims;
    const claims = await adminAPI.getClaims();
    const tbody = document.getElementById('claimsTableBody');
    tbody.innerHTML = claims.map(c => `
        <tr class="border-b dark:border-gray-700">
            <td class="px-4 py-2">${c.id}</td>
            <td class="px-4 py-2">${escapeHtml(c.itemTitle || '-')}</td>
            <td class="px-4 py-2">${escapeHtml(c.claimantName || '-')}</td>
            <td class="px-4 py-2">${escapeHtml(c.message || '-')}</td>
            <td class="px-4 py-2"><span class="badge badge-${c.status}">${c.status}</span></td>
            <td class="px-4 py-2 space-x-2">
                ${c.status === 'pending' ? `<button onclick="updateClaim(${c.id},'approved')" class="text-green-600">✅ Approve</button>
                <button onclick="updateClaim(${c.id},'rejected')" class="text-red-600">❌ Reject</button>` : ''}
            </td>
        </tr>
    `).join('');
}
async function updateClaim(id, status) {
    await adminAPI.updateClaim(id, status);
    loadAdminData();
}
function escapeHtml(str) { return str ? String(str).replace(/[&<>]/g, (m) => ({ '&':'&amp;','<':'&lt;','>':'&gt;' }[m])) : ''; }
const user = JSON.parse(localStorage.getItem('user') || '{}');
if (user.role !== 'admin') window.location.href = 'index.html';
loadAdminData();
