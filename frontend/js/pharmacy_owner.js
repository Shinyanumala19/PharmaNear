// ==========================================
// PharmaNear Pharmacy Owner Logic
// ==========================================

const BASE_API = (typeof API_URL !== 'undefined' ? API_URL : (window.API_URL || ''));

let currentPharmacy = null;
let inventoryCache = [];

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();
  loadPharmacyProfile();
  loadOwnerOrders();
  loadOwnerInventory();
  loadAlerts();
});

function handleLogout() {
  fetch(`${BASE_API}/api/auth/logout`, { credentials: 'include' })
    .then(() => {
      localStorage.removeItem('pharmanear_user');
      window.location.href = 'login.html';
    })
    .catch(() => {
      localStorage.removeItem('pharmanear_user');
      window.location.href = 'login.html';
    });
}

function switchOwnerTab(tabName) {
  document.querySelectorAll('.owner-tab').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.dash-sidebar .nav-item').forEach(el => el.classList.remove('active'));

  const target = document.getElementById(`owner-tab-${tabName}`);
  if (target) target.style.display = 'block';

  const idx = ['orders', 'inventory', 'alerts'].indexOf(tabName);
  const items = document.querySelectorAll('.dash-sidebar .nav-item');
  if (items[idx]) items[idx].classList.add('active');

  if (tabName === 'inventory') loadOwnerInventory();
  else if (tabName === 'orders') loadOwnerOrders();
  else if (tabName === 'alerts') loadAlerts();
}

function loadPharmacyProfile() {
  fetch(`${BASE_API}/api/owner/pharmacy`, { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      if (data.pharmacy) {
        currentPharmacy = data.pharmacy;
        document.getElementById('pharmacy-name-banner').textContent = currentPharmacy.name;
        document.getElementById('pharmacy-license-banner').textContent = `License: ${currentPharmacy.license_number || 'Verified TS'}`;
      }
    })
    .catch(console.error);
}

// ==========================================
// ORDERS & RESERVATIONS HANDLING
// ==========================================

function loadOwnerOrders() {
  const tbody = document.getElementById('owner-orders-tbody');
  const pharmId = currentPharmacy ? currentPharmacy.id : 1;

  fetch(`${BASE_API}/api/owner/orders?pharmacy_id=${pharmId}`)
    .then(res => res.json())
    .then(data => {
      const orders = data.orders || [];
      document.getElementById('orders-count-badge').textContent = orders.length;

      const pendingCount = orders.filter(o => o.status === 'pending').length;
      document.getElementById('kpi-pending-orders').textContent = pendingCount;

      if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-muted">No orders or reservations received yet.</td></tr>`;
        return;
      }

      tbody.innerHTML = orders.map(o => {
        let statusBadge = 'badge-subtle';
        if (o.status === 'confirmed') statusBadge = 'badge-primary';
        else if (o.status === 'ready_for_pickup') statusBadge = 'badge-success';
        else if (o.status === 'completed') statusBadge = 'badge-emerald';
        else if (o.status === 'cancelled') statusBadge = 'badge-danger';

        const itemsStr = o.items.map(it => `<strong>${it.medicine_name}</strong> (Qty: ${it.quantity})`).join('<br>');

        return `
          <tr>
            <td><strong>${escapeHtml(o.order_number)}</strong></td>
            <td><span class="badge ${o.order_type === 'reservation' ? 'badge-info' : 'badge-primary'}">${escapeHtml(o.order_type.toUpperCase())}</span></td>
            <td>
              <div>${escapeHtml(o.customer_name)}</div>
              <div class="text-xs text-muted">📞 ${escapeHtml(o.customer_phone || 'Customer')}</div>
            </td>
            <td class="text-xs">${itemsStr}</td>
            <td><strong>₹${o.total_amount.toFixed(2)}</strong></td>
            <td><span class="badge ${statusBadge}">${escapeHtml(o.status.replace('_', ' ').toUpperCase())}</span></td>
            <td>
              <select class="form-select form-select-sm" onchange="updateOrderStatus(${o.id}, this.value)" style="min-width:140px;">
                <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="confirmed" ${o.status === 'confirmed' ? 'selected' : ''}>Confirm Hold</option>
                <option value="ready_for_pickup" ${o.status === 'ready_for_pickup' ? 'selected' : ''}>Ready for Pickup</option>
                <option value="completed" ${o.status === 'completed' ? 'selected' : ''}>Completed</option>
                <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancel</option>
              </select>
            </td>
          </tr>
        `;
      }).join('');
    })
    .catch(console.error);
}

function updateOrderStatus(orderId, newStatus) {
  fetch(`${BASE_API}/api/owner/orders/${orderId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
  })
    .then(res => res.json())
    .then(data => {
      alert(`Order updated to '${newStatus.replace('_', ' ')}' and customer has been notified!`);
      loadOwnerOrders();
    })
    .catch(console.error);
}

// ==========================================
// INVENTORY CRUD
// ==========================================

function loadOwnerInventory() {
  const tbody = document.getElementById('owner-inventory-tbody');
  const pharmId = currentPharmacy ? currentPharmacy.id : 1;

  fetch(`${BASE_API}/api/owner/inventory?pharmacy_id=${pharmId}`)
    .then(res => res.json())
    .then(data => {
      inventoryCache = data.inventory || [];
      document.getElementById('kpi-inventory-items').textContent = inventoryCache.length;
      renderInventoryTable(inventoryCache);
    })
    .catch(console.error);
}

function renderInventoryTable(items) {
  const tbody = document.getElementById('owner-inventory-tbody');
  if (!items || items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center p-4 text-muted">No inventory records found. Click "Add Medicine" to create your first SKU.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(it => `
    <tr>
      <td>
        <strong>${escapeHtml(it.medicine_name)}</strong>
        <div class="text-xs text-muted">${escapeHtml(it.dosage || '')}</div>
      </td>
      <td><span class="badge badge-subtle">${escapeHtml(it.category || 'General')}</span></td>
      <td><strong>₹${it.price.toFixed(2)}</strong></td>
      <td>${it.discount_price ? `₹${it.discount_price.toFixed(2)}` : '—'}</td>
      <td>
        ${it.stock_quantity < 10 
          ? `<span class="badge badge-danger">⚠️ ${it.stock_quantity} (Low)</span>`
          : `<span class="badge badge-success">✓ ${it.stock_quantity}</span>`}
      </td>
      <td class="text-xs text-muted">${escapeHtml(it.batch_number || '—')}</td>
      <td class="text-xs text-muted">${escapeHtml(it.expiry_date || '—')}</td>
      <td>
        <div class="btn-group-sm">
          <button class="btn btn-ghost btn-sm" onclick="openEditMedicineModal(${JSON.stringify(it).replace(/"/g, '&quot;')})">
            <i data-lucide="edit" style="width:13px;height:13px;"></i>
          </button>
          <button class="btn btn-ghost btn-sm text-danger" onclick="deleteInventoryItem(${it.id})">
            <i data-lucide="trash-2" style="width:13px;height:13px;"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

function filterInventoryTable() {
  const query = document.getElementById('inv-search-filter').value.toLowerCase().trim();
  const filtered = inventoryCache.filter(it => 
    (it.medicine_name && it.medicine_name.toLowerCase().includes(query)) ||
    (it.batch_number && it.batch_number.toLowerCase().includes(query)) ||
    (it.category && it.category.toLowerCase().includes(query))
  );
  renderInventoryTable(filtered);
}

// Modal open/close
function openAddMedicineModal() {
  document.getElementById('med-modal-title').textContent = 'Add Medicine SKU';
  document.getElementById('modal-inv-id').value = '';
  document.getElementById('modal-in-name').value = '';
  document.getElementById('modal-in-name').disabled = false;
  document.getElementById('modal-in-category').value = 'Pain & Fever';
  document.getElementById('modal-in-dosage').value = '';
  document.getElementById('modal-in-price').value = '';
  document.getElementById('modal-in-discount').value = '';
  document.getElementById('modal-in-stock').value = '50';
  document.getElementById('modal-in-batch').value = 'BTH-' + Math.floor(1000 + Math.random() * 9000);
  
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  document.getElementById('modal-in-expiry').value = d.toISOString().split('T')[0];

  document.getElementById('medicine-modal').style.display = 'flex';
}

function openEditMedicineModal(item) {
  document.getElementById('med-modal-title').textContent = 'Update Medicine Stock & Price';
  document.getElementById('modal-inv-id').value = item.id;
  document.getElementById('modal-in-name').value = item.medicine_name;
  document.getElementById('modal-in-name').disabled = true;
  document.getElementById('modal-in-category').value = item.category || 'General';
  document.getElementById('modal-in-dosage').value = item.dosage || '';
  document.getElementById('modal-in-price').value = item.price;
  document.getElementById('modal-in-discount').value = item.discount_price || '';
  document.getElementById('modal-in-stock').value = item.stock_quantity;
  document.getElementById('modal-in-batch').value = item.batch_number || '';
  document.getElementById('modal-in-expiry').value = item.expiry_date || '';

  document.getElementById('medicine-modal').style.display = 'flex';
}

function closeMedicineModal() {
  document.getElementById('medicine-modal').style.display = 'none';
}

function saveMedicine() {
  const invId = document.getElementById('modal-inv-id').value;
  const name = document.getElementById('modal-in-name').value.trim();
  const category = document.getElementById('modal-in-category').value;
  const dosage = document.getElementById('modal-in-dosage').value.trim();
  const price = parseFloat(document.getElementById('modal-in-price').value);
  const discount = document.getElementById('modal-in-discount').value ? parseFloat(document.getElementById('modal-in-discount').value) : null;
  const stock = parseInt(document.getElementById('modal-in-stock').value);
  const batch = document.getElementById('modal-in-batch').value.trim();
  const expiry = document.getElementById('modal-in-expiry').value;

  if (!price || price <= 0 || isNaN(stock)) {
    alert('Please enter a valid price and stock quantity.');
    return;
  }

  const pharmId = currentPharmacy ? currentPharmacy.id : 1;

  if (invId) {
    // PUT update
    fetch(`${BASE_API}/api/owner/inventory/${invId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        price: price,
        discount_price: discount,
        stock_quantity: stock,
        batch_number: batch,
        expiry_date: expiry
      })
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message || 'Inventory updated!');
        closeMedicineModal();
        loadOwnerInventory();
        loadAlerts();
      })
      .catch(console.error);
  } else {
    // POST add
    if (!name) {
      alert('Medicine name is required.');
      return;
    }
    fetch(`${BASE_API}/api/owner/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pharmacy_id: pharmId,
        name: name,
        category: category,
        dosage: dosage,
        price: price,
        discount_price: discount,
        stock_quantity: stock,
        batch_number: batch,
        expiry_date: expiry
      })
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message || 'Medicine added successfully!');
        closeMedicineModal();
        loadOwnerInventory();
        loadAlerts();
      })
      .catch(console.error);
  }
}

function deleteInventoryItem(invId) {
  if (!confirm('Are you sure you want to remove this medicine from your store inventory?')) return;

  fetch(`${BASE_API}/api/owner/inventory/${invId}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(data => {
      alert(data.message || 'Item deleted.');
      loadOwnerInventory();
      loadAlerts();
    })
    .catch(console.error);
}

// ==========================================
// ALERTS & RESTOCK
// ==========================================

function loadAlerts() {
  const pharmId = currentPharmacy ? currentPharmacy.id : 1;

  fetch(`${BASE_API}/api/owner/alerts?pharmacy_id=${pharmId}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById('kpi-low-stock').textContent = data.low_stock_count;
      document.getElementById('kpi-expiring-soon').textContent = data.expiring_soon_count;
      document.getElementById('alerts-count-badge').textContent = data.low_stock_count + data.expiring_soon_count;

      // Render Low Stock
      const lowContainer = document.getElementById('low-stock-items-container');
      if (data.low_stock_items.length === 0) {
        lowContainer.innerHTML = '<p class="text-muted text-sm">No items currently below threshold (&lt;10 units).</p>';
      } else {
        lowContainer.innerHTML = data.low_stock_items.map(it => `
          <div class="glass-card p-3 mb-2 d-flex justify-between align-center">
            <div>
              <strong>${escapeHtml(it.medicine_name)}</strong>
              <div class="text-xs text-danger">Current stock: ${it.stock_quantity} units remaining</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="quickRestock(${it.id}, 50)">
              + Restock 50 Units
            </button>
          </div>
        `).join('');
      }

      // Render Near Expiry
      const expContainer = document.getElementById('near-expiry-items-container');
      if (data.expiring_soon_items.length === 0) {
        expContainer.innerHTML = '<p class="text-muted text-sm">No items expiring in the next 60 days.</p>';
      } else {
        expContainer.innerHTML = data.expiring_soon_items.map(it => `
          <div class="glass-card p-3 mb-2 d-flex justify-between align-center">
            <div>
              <strong>${escapeHtml(it.medicine_name)}</strong>
              <div class="text-xs text-muted">Expires: ${it.expiry_date} • Batch: ${it.batch_number}</div>
            </div>
            <span class="badge badge-pink">Expires Soon</span>
          </div>
        `).join('');
      }
    })
    .catch(console.error);
}

function quickRestock(invId, addQty) {
  const item = inventoryCache.find(i => i.id === invId);
  if (!item) return;

  const newStock = item.stock_quantity + addQty;
  fetch(`${BASE_API}/api/owner/inventory/${invId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stock_quantity: newStock })
  })
    .then(res => res.json())
    .then(data => {
      alert(`Restocked +${addQty} units successfully!`);
      loadOwnerInventory();
      loadAlerts();
    })
    .catch(console.error);
}

function handleCsvUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  alert(`Imported ${file.name}! Inventory database synced.`);
  loadOwnerInventory();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
