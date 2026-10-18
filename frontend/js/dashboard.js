let currentEditId = null;

async function loadItems() {
    const search = document.getElementById('searchInput')?.value || '';
    const category = document.getElementById('categoryFilter')?.value || '';
    const status = document.getElementById('statusFilter')?.value || '';
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    const q = params.toString() ? `?${params}` : '';
    try {
        const data = await itemsAPI.getAll(q);
        displayItems(data.items || data);
    } catch (err) { showToast('Failed to load: ' + err.message, 'error'); }
}

function displayItems(items) {
    const c = document.getElementById('itemsContainer');
    if (!c) return;
    if (!items || !items.length) {
        c.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem 1rem;color:var(--text-muted);">
            <div style="font-size:3rem;margin-bottom:.5rem;">🔍</div>
            <p>No items found.</p></div>`;
        return;
    }
    const user = getCurrentUser();
    c.innerHTML = items.map(item => {
        const base = API_BASE.replace('/api', '');
        const img = item.image_url ? `${base}${item.image_url}` : '';
        const canEdit = user && item.userId === user.id;
        const canClaim = user && item.status !== 'claimed' && item.status !== 'returned' && item.userId !== user.id;
        return `
            <article class="item-card">
                <div class="item-card-media">
                    ${img ? `<img src="${img}" alt="${esc(item.title)}" loading="lazy" onerror="this.style.display='none'">` :
                        `<div style="width:100%;height:100%;display:grid;place-items:center;color:var(--text-muted);font-size:2.5rem;">📦</div>`}
                    <span class="pill pill-${item.status}">${item.status}</span>
                </div>
                <div class="item-card-body">
                    <h3 class="item-card-title">${esc(item.title)}</h3>
                    <p class="item-card-desc">${esc(item.description || 'No description')}</p>
                    <div style="font-size:.78rem;color:var(--text-muted);display:flex;gap:.75rem;flex-wrap:wrap;">
                        ${item.location ? `<span>📍 ${esc(item.location)}</span>` : ''}
                        ${item.dateReported ? `<span>🕒 ${new Date(item.dateReported).toLocaleDateString()}</span>` : ''}
                    </div>
                    <div class="item-card-actions">
                        <button onclick="viewItem(${item.id})" class="btn btn-ghost btn-sm">View</button>
                        ${canEdit ? `<button onclick="openEditModal(${item.id})" class="btn btn-ghost btn-sm">Edit</button>` : ''}
                        ${canEdit ? `<button onclick="deleteItem(${item.id})" class="btn btn-ghost btn-sm" style="color:#dc2626;">Delete</button>` : ''}
                        ${canClaim ? `<button onclick="claimItem(${item.id})" class="btn btn-gold btn-sm" style="margin-left:auto;">Claim</button>` : ''}
                    </div>
                </div>
            </article>`;
    }).join('');

    if (window.refreshEffects) window.refreshEffects();
}

function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

async function viewItem(id) {
    try {
        const item = await itemsAPI.getById(id);
        alert(`Title: ${item.title}\nDescription: ${item.description || 'N/A'}\nLocation: ${item.location || 'N/A'}\nStatus: ${item.status}\nReported: ${new Date(item.dateReported).toLocaleString()}`);
    } catch (err) { showToast('Error loading item', 'error'); }
}

function openAddModal() {
    currentEditId = null;
    document.getElementById('modalTitle').textContent = 'Report New Item';
    document.getElementById('itemForm').reset();
    document.getElementById('itemModal').classList.add('open');
}

async function openEditModal(id) {
    currentEditId = id;
    document.getElementById('modalTitle').textContent = 'Edit Item';
    const item = await itemsAPI.getById(id);
    document.getElementById('itemTitle').value = item.title;
    document.getElementById('itemDescription').value = item.description || '';
    document.getElementById('itemCategory').value = item.category || 'Other';
    document.getElementById('itemLocation').value = item.location || '';
    document.getElementById('itemStatus').value = item.status;
    document.getElementById('itemModal').classList.add('open');
}

function closeModal() {
    document.getElementById('itemModal').classList.remove('open');
    currentEditId = null;
}

async function saveItem() {
    const fd = new FormData();
    fd.append('title', document.getElementById('itemTitle').value.trim());
    fd.append('description', document.getElementById('itemDescription').value.trim());
    fd.append('category', document.getElementById('itemCategory').value);
    fd.append('location', document.getElementById('itemLocation').value.trim());
    fd.append('status', document.getElementById('itemStatus').value);
    const file = document.getElementById('itemImage').files[0];
    if (file) fd.append('image', file);
    if (!fd.get('title')) return showToast('Title is required', 'error');
    try {
        if (currentEditId) {
            const r = await itemsAPI.update(currentEditId, fd);
            if (r.error) throw new Error(r.error);
            showToast('Item updated');
        } else {
            const r = await itemsAPI.create(fd);
            if (r.error) throw new Error(r.error);
            showToast('Item reported');
        }
        closeModal();
        loadItems();
    } catch (err) { showToast(err.message, 'error'); }
}

async function deleteItem(id) {
    if (!confirm('Delete this item?')) return;
    try {
        await itemsAPI.delete(id);
        showToast('Deleted');
        loadItems();
    } catch (err) { showToast(err.message, 'error'); }
}

async function claimItem(id) {
    const message = prompt('Describe your claim:');
    if (message === null) return;
    const contactNumber = prompt('Your contact number:');
    if (contactNumber === null) return;
    try {
        await claimsAPI.create({ itemId: id, message, contactNumber });
        showToast('Claim submitted!');
        loadItems();
    } catch (err) { showToast(err.message, 'error'); }
}

function exportToCSV() {
    itemsAPI.getAll().then(data => {
        const items = data.items || data;
        const headers = ['ID','Title','Description','Category','Location','Status','Date'];
        const rows = items.map(i => [i.id, i.title, i.description || '', i.category || '', i.location || '', i.status, i.dateReported || '']);
        const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'items.csv';
        a.click();
    });
}

if (document.getElementById('itemsContainer')) {
    document.addEventListener('DOMContentLoaded', () => {
        requireAuth();
        loadItems();
        document.getElementById('searchBtn')?.addEventListener('click', loadItems);
        document.getElementById('statusFilter')?.addEventListener('change', loadItems);
        document.getElementById('categoryFilter')?.addEventListener('change', loadItems);
    });
}