let currentPage = 1;
const limit = 12;
let currentEditId = null;

async function loadItems() {
    const search = document.getElementById('searchInput')?.value || '';
    const category = document.getElementById('categoryFilter')?.value || '';
    const status = document.getElementById('statusFilter')?.value || '';
    const params = new URLSearchParams({ page: currentPage, limit, search, category, status });
    try {
        const res = await fetch(`${API_BASE}/items?${params}`);
        const data = await res.json();
        displayItems(data.items);
        setupPagination(data.totalPages, data.currentPage);
    } catch (err) { showToast('Failed to load items', 'error'); }
}

function displayItems(items) {
    const container = document.getElementById('itemsContainer');
    if (!container) return;
    if (!items.length) { container.innerHTML = '<div class="col-span-full text-center py-10">No items found</div>'; return; }
    const user = getCurrentUser();
    container.innerHTML = items.map(item => {
        const imgSrc = item.image_url ? `${API_BASE.replace('/api', '')}${item.image_url}` : 'https://via.placeholder.com/400x240?text=No+Image';
        return `
            <div class="glass rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
                <img src="${imgSrc}" class="w-full h-48 object-cover" alt="item image">
                <div class="p-4">
                    <h3 class="font-bold text-lg">${escapeHtml(item.title)}</h3>
                    <p class="text-gray-600 dark:text-gray-300 text-sm">${escapeHtml(item.description?.substring(0,100))}</p>
                    <div class="mt-3 flex flex-wrap justify-between items-center gap-2">
                        <span class="badge badge-${item.status}">${item.status}</span>
                        <div class="flex gap-2">
                            <button onclick="viewItem(${item.id})" class="text-indigo-600 text-sm">View</button>
                            ${user && item.userId === user.id ? `<button onclick="openEditModal(${item.id})" class="text-yellow-600 text-sm">Edit</button>` : ''}
                            ${user && item.userId === user.id ? `<button onclick="deleteItem(${item.id})" class="text-red-600 text-sm">Delete</button>` : ''}
                            ${item.status !== 'claimed' && item.status !== 'returned' && user && item.userId !== user.id ? `<button onclick="claimItem(${item.id})" class="text-green-600 text-sm">Claim</button>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function setupPagination(totalPages, current) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="px-3 py-1 mx-1 rounded border ${i === current ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}" onclick="goToPage(${i})">${i}</button>`;
    }
    pagination.innerHTML = html;
}
window.goToPage = (page) => { currentPage = page; loadItems(); };

async function viewItem(id) {
    try {
        const res = await fetch(`${API_BASE}/items/${id}`);
        const item = await res.json();
        alert(`Title: ${item.title}\nDescription: ${item.description}\nLocation: ${item.location}\nStatus: ${item.status}\nReported: ${new Date(item.dateReported).toLocaleString()}`);
    } catch (err) { showToast('Error loading item', 'error'); }
}

async function claimItem(id) {
    const msg = prompt('Describe your claim:');
    if (!msg) return;
    const contact = prompt('Contact number:');
    try {
        await fetch(`${API_BASE}/claims`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ itemId: id, message: msg, contactNumber: contact })
        });
        showToast('Claim submitted, item marked as claimed', 'success');
        loadItems();
    } catch (err) { showToast(err.message, 'error'); }
}

async function deleteItem(id) {
    if (!confirm('Delete this item?')) return;
    try {
        await itemsAPI.delete(id);
        showToast('Item deleted', 'success');
        loadItems();
    } catch (err) { showToast(err.message, 'error'); }
}

window.openAddModal = function() {
    currentEditId = null;
    document.getElementById('modalTitle').innerText = 'Report New Item';
    document.getElementById('itemForm').reset();
    document.getElementById('itemModal').classList.remove('hidden');
};

window.openEditModal = async function(id) {
    currentEditId = id;
    document.getElementById('modalTitle').innerText = 'Edit Item';
    try {
        const res = await fetch(`${API_BASE}/items/${id}`);
        const item = await res.json();
        document.getElementById('itemTitle').value = item.title;
        document.getElementById('itemDescription').value = item.description || '';
        document.getElementById('itemCategory').value = item.category || '';
        document.getElementById('itemLocation').value = item.location || '';
        document.getElementById('itemStatus').value = item.status;
        document.getElementById('itemModal').classList.remove('hidden');
    } catch (err) { showToast('Error loading item', 'error'); }
};

window.saveItem = async function() {
    const formData = new FormData();
    formData.append('title', document.getElementById('itemTitle').value);
    formData.append('description', document.getElementById('itemDescription').value);
    formData.append('category', document.getElementById('itemCategory').value);
    formData.append('location', document.getElementById('itemLocation').value);
    formData.append('status', document.getElementById('itemStatus').value);
    const file = document.getElementById('itemImage').files[0];
    if (file) formData.append('image', file);
    try {
        if (currentEditId) {
            await itemsAPI.update(currentEditId, formData);
            showToast('Item updated', 'success');
        } else {
            await itemsAPI.create(formData);
            showToast('Item reported', 'success');
        }
        closeModal();
        loadItems();
    } catch (err) { showToast(err.message, 'error'); }
};

window.closeModal = function() {
    document.getElementById('itemModal').classList.add('hidden');
    currentEditId = null;
};

function exportToCSV() {
    fetch(`${API_BASE}/items?limit=1000`)
        .then(res => res.json())
        .then(data => {
            const headers = ['ID','Title','Description','Category','Location','Status','Date Reported'];
            const rows = data.items.map(i => [i.id, i.title, i.description, i.category, i.location, i.status, i.dateReported]);
            const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'items.csv'; a.click();
            URL.revokeObjectURL(url);
        });
}

function escapeHtml(str) { return str ? String(str).replace(/[&<>]/g, (m) => ({ '&':'&amp;','<':'&lt;','>':'&gt;' }[m])) : ''; }

if (document.getElementById('itemsContainer')) {
    document.addEventListener('DOMContentLoaded', () => {
        requireAuth();
        loadItems();
        document.getElementById('searchBtn')?.addEventListener('click', loadItems);
        document.getElementById('categoryFilter')?.addEventListener('change', loadItems);
        document.getElementById('statusFilter')?.addEventListener('change', loadItems);
    });
}
