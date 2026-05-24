let interval = null;
async function loadMyClaims() {
    try {
        const claims = await claimsAPI.getMyClaims();
        const tbody = document.getElementById('claimsTableBody');
        if (!tbody) return;
        if (!claims.length) { tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No claims found</td></tr>'; return; }
        tbody.innerHTML = claims.map(c => `
            <tr class="border-b dark:border-gray-700">
                <td class="px-4 py-2">${c.id}</td>
                <td class="px-4 py-2">${escapeHtml(c.itemTitle || '-')}</td>
                <td class="px-4 py-2">${escapeHtml(c.itemLocation || '-')}</td>
                <td class="px-4 py-2">${escapeHtml(c.message || '-')}</td>
                <td class="px-4 py-2"><span class="badge badge-${c.status}">${c.status}</span></td>
            </tr>
        `).join('');
    } catch (err) { console.error(err); }
}
function escapeHtml(str) { return str ? String(str).replace(/[&<>]/g, (m) => ({ '&':'&amp;','<':'&lt;','>':'&gt;' }[m])) : ''; }
if (document.getElementById('claimsTableBody')) {
    document.addEventListener('DOMContentLoaded', () => {
        requireAuth();
        loadMyClaims();
        interval = setInterval(loadMyClaims, 5000);
    });
}
window.addEventListener('beforeunload', () => clearInterval(interval));
