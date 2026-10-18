let currentItemId = null;

async function loadItems() {
    const search = document.getElementById('searchInput')?.value || '';
    const status = document.getElementById('statusFilter')?.value || '';
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    const query = params.toString() ? `?${params}` : '';
    try {
        const items = await itemsAPI.getAll(query);
        displayItems(items);
    } catch (err) { showMessage('Failed to load items', 'error'); }
}

function displayItems(items) {
    const tbody = document.getElementById('itemsTableBody');
    if (!tbody) return;
    if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="7">No items found</td></tr>';
        return;
    }
    const user = getCurrentUser();
    tbody.innerHTML = items.map(item => `
        <tr>
            <td>${item.id}</td>
            <td>${escapeHtml(item.title)}</td>
            <td>${escapeHtml(item.description || '-')}</td>
            <td>${escapeHtml(item.category || '-')}</td>
            <td>${escapeHtml(item.location || '-')}</td>
            <td><span class="badge badge-${item.status}">${item.status}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewItem(${item.id})">View</button>
                ${user && item.userId === user.id ? `<button class="btn btn-sm btn-warning" onclick="editItem(${item.id})">Edit</button>` : ''}
                ${user && item.userId === user.id ? `<button class="btn btn-sm btn-danger" onclick="deleteItem(${item.id})">Delete</button>` : ''}
                <button class="btn btn-sm btn-success" onclick="claimItem(${item.id})">Claim</button>
            </td>
        </tr>
    `).join('');
}

function viewItem(id) {
    itemsAPI.getAll().then(items => {
        const item = items.find(i => i.id == id);
        if (item) alert(`Title: ${item.title}\nDescription: ${item.description || 'N/A'}\nLocation: ${item.location}\nStatus: ${item.status}`);
    });
}

function openAddItemModal() {
    currentItemId = null;
    document.getElementById('modalTitle').innerText = 'Report New Item';
    document.getElementById('itemForm').reset();
    document.getElementById('itemModal').style.display = 'block';
}

function editItem(id) {
    currentItemId = id;
    document.getElementById('modalTitle').innerText = 'Edit Item';
    itemsAPI.getAll().then(items => {
        const item = items.find(i => i.id == id);
        if (item) {
            document.getElementById('itemTitle').value = item.title;
            document.getElementById('itemDescription').value = item.description || '';
            document.getElementById('itemCategory').value = item.category || '';
            document.getElementById('itemLocation').value = item.location || '';
            document.getElementById('itemStatus').value = item.status;
            document.getElementById('itemModal').style.display = 'block';
        }
    });
}

async function saveItem() {
    const data = {
        title: document.getElementById('itemTitle').value,
        description: document.getElementById('itemDescription').value,
        category: document.getElementById('itemCategory').value,
        location: document.getElementById('itemLocation').value,
        status: document.getElementById('itemStatus').value
    };
    if (!data.title) return showMessage('Title required', 'error');
    try {
        if (currentItemId) {
            await itemsAPI.update(currentItemId, data);
            showMessage('Item updated', 'success');
        } else {
            await itemsAPI.create(data);
            showMessage('Item reported', 'success');
        }
        closeModal();
        loadItems();
    } catch (err) { showMessage(err.message, 'error'); }
}

async function deleteItem(id) {
    if (!confirm('Delete this item?')) return;
    try {
        await itemsAPI.delete(id);
        showMessage('Item deleted', 'success');
        loadItems();
    } catch (err) { showMessage(err.message, 'error'); }
}

async function claimItem(itemId) {
    const message = prompt('Describe your claim:');
    if (message === null) return;
    const contact = prompt('Contact number:');
    if (contact === null) return;
    try {
        await claimsAPI.create({ itemId, message, contactNumber: contact });
        showMessage('Claim submitted', 'success');
    } catch (err) { showMessage(err.message, 'error'); }
}

function closeModal() { document.getElementById('itemModal').style.display = 'none'; }
function escapeHtml(str) { return str ? String(str).replace(/[&<>]/g, function(m) { if (m === '&') return '&amp;'; if (m === '<') return '&lt;'; if (m === '>') return '&gt;'; return m; }) : ''; }

if (document.getElementById('itemsTableBody')) {
    document.addEventListener('DOMContentLoaded', () => {
        requireAuth();
        loadItems();
        document.getElementById('searchBtn')?.addEventListener('click', loadItems);
        document.getElementById('statusFilter')?.addEventListener('change', loadItems);
    });
}