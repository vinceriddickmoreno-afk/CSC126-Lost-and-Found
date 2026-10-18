function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag]));
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!TokenStore.access) return window.location.href = 'login.html';
    
    let userRole = 'user';
    try { 
        const profile = await authAPI.profile(); 
        userRole = profile.user.role;
    } catch { 
        TokenStore.clear(); 
        return window.location.href = 'login.html'; 
    }

    // Add Admin Panel Link if user is Admin
    if (userRole === 'admin') {
        const navLinks = document.querySelector('.nav-links');
        const adminLink = document.createElement('a');
        adminLink.href = 'admin.html';
        adminLink.textContent = 'Admin Panel';
        adminLink.style.color = 'var(--csu-gold)'; 
        navLinks.insertBefore(adminLink, document.getElementById('logoutBtn'));
    }

    loadItems();

    document.getElementById('logoutBtn')?.addEventListener('click', (e) => { 
        e.preventDefault(); 
        TokenStore.clear(); 
        window.location.href = 'login.html'; 
    });

    document.getElementById('itemForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await itemsAPI.create(new FormData(e.target));
            document.getElementById('reportModal').classList.remove('active');
            e.target.reset(); 
            loadItems();
        } catch (err) { 
            alert(err.message); 
        }
    });

    document.getElementById('viewClaimForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await claimsAPI.create({ 
                itemId: document.getElementById('viewClaimItemId').value, 
                message: e.target.message.value, 
                contactNumber: e.target.contactNumber.value 
            });
            alert('Claim submitted successfully!');
            document.getElementById('viewItemModal').classList.remove('active'); 
            e.target.reset();
        } catch (err) { 
            alert("Error: " + err.message); 
        }
    });
});

async function loadItems() {
    const container = document.getElementById('itemsContainer');
    try {
        const data = await itemsAPI.getAll();
        const items = data.items || [];
        if (!items.length) return container.innerHTML = '<p style="color:white;">No items found.</p>';
        
        container.innerHTML = items.map(item => `
            <div class="card glass" style="cursor: pointer;" onclick="openViewModal(${item.id}, '${escapeHTML(item.title).replace(/'/g, "\\'")}', '${escapeHTML(item.description || '').replace(/'/g, "\\'")}', '${escapeHTML(item.location || 'N/A').replace(/'/g, "\\'")}', '${item.status}', '${item.image_url || ''}')">
                
                ${item.image_url ? `<img src="http://localhost:5000${item.image_url}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;">` : ''}
                
                <h3>${escapeHTML(item.title)}</h3>
                <p style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${escapeHTML(item.description)}</p>
                
                <div style="margin-top: auto; padding-top: 1rem;">
                    <span class="pill pill-${item.status.toLowerCase()}">${item.status}</span>
                </div>
                
                <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;">View Details</button>
            </div>`).join('');
    } catch (err) { 
        container.innerHTML = `<p style="color: red;">Error: ${err.message}</p>`; 
    }
}

function openViewModal(id, title, desc, location, status, imageUrl) {
    document.getElementById('viewItemTitle').textContent = title;
    document.getElementById('viewItemDesc').textContent = desc || 'No description provided.';
    document.getElementById('viewItemLocation').textContent = location;
    document.getElementById('viewClaimItemId').value = id;
    
    const statusBadge = document.getElementById('viewItemStatus');
    statusBadge.textContent = status;
    statusBadge.className = `pill pill-${status.toLowerCase()}`;

    const imgElement = document.getElementById('viewItemImage');
    if (imageUrl) {
        imgElement.src = `http://localhost:5000${imageUrl}`;
        imgElement.style.display = 'block';
    } else {
        imgElement.style.display = 'none';
    }

    const claimSection = document.getElementById('viewClaimSection');
    if (status === 'lost' || status === 'found') {
        claimSection.style.display = 'block';
    } else {
        claimSection.style.display = 'none';
    }

    document.getElementById('viewItemModal').classList.add('active');
}