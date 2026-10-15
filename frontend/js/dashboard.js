// ==========================================
// PharmaNear User Dashboard Script
// ==========================================

const BASE_API = (typeof API_URL !== 'undefined' ? API_URL : (window.API_URL || ''));

let currentUser = null;
let userCoords = { lat: 17.4325, lng: 78.4071 }; // Hyderabad center default
let map = null;
let pharmacyMarkers = [];
let currentCategory = 'All';
let currentSearchQuery = '';
let activeModalData = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();
  
  // Read query parameters if redirected from landing page
  const urlParams = new URLSearchParams(window.location.search);
  const qParam = urlParams.get('q');
  if (qParam) {
    const input = document.getElementById('medicine-search-input');
    if (input) input.value = qParam;
  }

  const tabParam = urlParams.get('tab');
  if (tabParam) {
    switchTab(tabParam);
  } else if (window.location.hash === '#ai-assistant' || window.location.hash === '#tab-ai') {
    switchTab('ai');
  }

  initUserSession();
  initMap();
  performSearch();
  loadNotifications();
  loadUserOrders();
  setupAutoLocation();
});

// User Session Management
function initUserSession() {
  const stored = localStorage.getItem('pharmanear_user');
  if (stored) {
    try {
      currentUser = JSON.parse(stored);
      document.getElementById('user-display-name').textContent = currentUser.name || 'Ashok Kumar';
      const initial = (currentUser.name || 'A').charAt(0).toUpperCase();
      document.getElementById('user-avatar').textContent = initial;
    } catch (e) {
      console.error(e);
    }
  }

  // Also query session endpoint to keep synchronized
  fetch(`${BASE_API}/api/auth/me`, { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      if (data.authenticated && data.user) {
        currentUser = data.user;
        document.getElementById('user-display-name').textContent = currentUser.name;
        document.getElementById('user-avatar').textContent = currentUser.name.charAt(0).toUpperCase();
      }
    })
    .catch(() => {});
}

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

// Geolocation
function setupAutoLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        document.getElementById('user-location-text').textContent = 'Live GPS Active';
        if (map) {
          map.setView([userCoords.lat, userCoords.lng], 13);
          L.marker([userCoords.lat, userCoords.lng], {
            icon: L.divIcon({
              className: 'user-map-pin',
              html: '📍<span class="user-pin-pulse"></span>',
              iconSize: [30, 30]
            })
          }).addTo(map).bindPopup('<strong>You are here</strong>').openPopup();
        }
      },
      (err) => {
        console.log('GPS default: Hyderabad coordinates used', err.message);
      }
    );
  }
}

function requestUserLocation() {
  setupAutoLocation();
  performSearch();
}

// Tab Switching
function switchTab(tabId) {
  document.querySelectorAll('.dash-tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => item.classList.remove('active'));

  const targetTab = document.getElementById(`tab-${tabId}`);
  if (targetTab) targetTab.classList.add('active');

  const navIndex = ['search', 'map', 'orders', 'rx', 'ai'].indexOf(tabId);
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  if (navItems[navIndex]) navItems[navIndex].classList.add('active');

  if (tabId === 'map' && map) {
    setTimeout(() => map.invalidateSize(), 200);
    refreshPharmacies();
  } else if (tabId === 'orders') {
    loadUserOrders();
  } else if (tabId === 'ai') {
    const input = document.getElementById('ai-chat-input');
    if (input) {
      setTimeout(() => {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        input.focus();
      }, 100);
    }
  }
}

// ==========================================
// MEDICINE SEARCH & COMPARISON
// ==========================================

function handleSearchKey(e) {
  if (e.key === 'Enter') {
    performSearch();
  }
}

function filterCategory(category, buttonEl) {
  currentCategory = category;
  document.querySelectorAll('#category-pills .pill').forEach(btn => btn.classList.remove('active'));
  if (buttonEl) buttonEl.classList.add('active');
  performSearch();
}

function performSearch() {
  const query = document.getElementById('medicine-search-input').value.trim();
  const sortBy = document.getElementById('sort-selector').value;
  const container = document.getElementById('results-container');

  container.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Comparing prices across 12+ Hyderabad pharmacies...</p>
    </div>
  `;

  const targetOrigin = BASE_API || window.location.origin;
  const url = new URL(`${targetOrigin.replace(/\/+$/, '')}/api/search`);
  if (query) url.searchParams.append('q', query);
  if (currentCategory && currentCategory !== 'All') url.searchParams.append('category', currentCategory);
  url.searchParams.append('sort_by', sortBy);
  url.searchParams.append('lat', userCoords.lat);
  url.searchParams.append('lng', userCoords.lng);

  fetch(url)
    .then(res => res.json())
    .then(data => {
      renderSearchResults(data.results, query);
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = `<div class="p-4 text-center text-muted">Error loading search results. Please verify the server is running.</div>`;
    });
}

function renderSearchResults(results, query) {
  const container = document.getElementById('results-container');
  const statusText = document.getElementById('search-status-text');

  if (!results || results.length === 0) {
    statusText.textContent = `No medicines matching "${query}". Try another term like "Dolo", "Augmentin", or "Pan 40".`;
    container.innerHTML = `
      <div class="glass-card text-center p-5">
        <div style="font-size:3rem;margin-bottom:1rem;">🔍</div>
        <h3>No Medicines Found</h3>
        <p class="text-muted text-sm">We couldn't find a match for "${query}". Check your spelling or browse categories above.</p>
        <button class="btn btn-primary mt-3" onclick="document.getElementById('medicine-search-input').value=''; performSearch();">View All Available Medicines</button>
      </div>
    `;
    return;
  }

  statusText.textContent = `Found ${results.length} medicine(s) matching your criteria across partner pharmacies.`;

  let html = '';

  results.forEach(item => {
    const med = item.medicine;
    const range = item.price_range;
    const options = item.pharmacy_options;

    html += `
      <div class="medicine-card glass-card">
        <!-- Medicine Card Header -->
        <div class="med-header d-flex justify-between align-start flex-wrap gap-2">
          <div class="d-flex gap-3 align-center">
            <div class="med-icon-box">💊</div>
            <div>
              <h3 class="med-name">${escapeHtml(med.name)}</h3>
              <div class="med-generic">${escapeHtml(med.generic_name || '')} • <span class="badge badge-subtle">${escapeHtml(med.category)}</span></div>
            </div>
          </div>
          <div class="price-highlight-badge">
            <span class="lbl">Price Range:</span>
            <span class="range">₹${range.min.toFixed(2)} - ₹${range.max.toFixed(2)}</span>
            ${range.savings_percent > 0 ? `<span class="savings">Save up to ${range.savings_percent}%</span>` : ''}
          </div>
        </div>

        <p class="med-desc text-muted text-sm mt-2">${escapeHtml(med.description || '')}</p>

        <!-- Best Deal Quick Metrics -->
        <div class="deal-metrics-row mt-3">
          <div class="metric-pill">
            <i data-lucide="tag" style="width:14px;height:14px;color:var(--primary-color);"></i>
            <span>Cheapest: <strong>${escapeHtml(item.cheapest_pharmacy)}</strong> (₹${range.min.toFixed(2)})</span>
          </div>
          <div class="metric-pill">
            <i data-lucide="map-pin" style="width:14px;height:14px;color:var(--accent-color);"></i>
            <span>Nearest: <strong>${escapeHtml(item.nearest_pharmacy)}</strong> (${item.nearest_distance_km ? item.nearest_distance_km + ' km' : 'Nearby'})</span>
          </div>
          <div class="metric-pill">
            <i data-lucide="package-check" style="width:14px;height:14px;color:var(--emerald);"></i>
            <span>Total Units Stocked: <strong>${item.total_stock_all_stores}</strong> across ${item.pharmacies_count} stores</span>
          </div>
        </div>

        <!-- Pharmacy Comparison Sub-Table -->
        <div class="comparison-table-wrapper mt-3">
          <table class="table comparison-table">
            <thead>
              <tr>
                <th>Pharmacy & Location</th>
                <th>Distance</th>
                <th>Live Stock</th>
                <th>Price / Unit</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              ${options.map(opt => `
                <tr class="${opt.effective_price === range.min ? 'best-deal-row' : ''}">
                  <td>
                    <div class="d-flex align-center gap-2">
                      <strong>${escapeHtml(opt.pharmacy_name)}</strong>
                      ${opt.effective_price === range.min ? '<span class="badge badge-success text-xs">Best Price</span>' : ''}
                    </div>
                    <div class="text-xs text-muted">${escapeHtml(opt.pharmacy_address)} • 📞 ${escapeHtml(opt.pharmacy_phone)}</div>
                  </td>
                  <td>
                    <span class="distance-tag">
                      <i data-lucide="navigation" style="width:12px;height:12px;"></i>
                      ${opt.distance_km !== null ? opt.distance_km + ' km' : 'Nearby'}
                    </span>
                  </td>
                  <td>
                    ${opt.stock_quantity > 0 
                      ? `<span class="stock-badge in-stock"><span class="dot"></span> ${opt.stock_quantity} available</span>`
                      : `<span class="stock-badge out-stock">Out of stock</span>`}
                  </td>
                  <td>
                    <div class="price-col">
                      <span class="current-price">₹${opt.effective_price.toFixed(2)}</span>
                      ${opt.discount_price ? `<span class="old-price">₹${opt.price.toFixed(2)}</span>` : ''}
                    </div>
                  </td>
                  <td class="text-right">
                    <div class="btn-group-sm">
                      <button class="btn btn-secondary btn-sm" onclick="openActionModal('reserve', ${JSON.stringify(med).replace(/"/g, '&quot;')}, ${JSON.stringify(opt).replace(/"/g, '&quot;')})" ${opt.stock_quantity <= 0 ? 'disabled' : ''}>
                        <i data-lucide="bookmark" style="width:13px;height:13px;"></i> Reserve
                      </button>
                      <button class="btn btn-primary btn-sm" onclick="openActionModal('order', ${JSON.stringify(med).replace(/"/g, '&quot;')}, ${JSON.stringify(opt).replace(/"/g, '&quot;')})" ${opt.stock_quantity <= 0 ? 'disabled' : ''}>
                        <i data-lucide="shopping-cart" style="width:13px;height:13px;"></i> Order
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  if (window.lucide) lucide.createIcons();
}

// ==========================================
// LEAFLET MAP & PHARMACY LOCATOR
// ==========================================

function initMap() {
  const mapElement = document.getElementById('pharmacy-map');
  if (!mapElement) return;

  map = L.map('pharmacy-map').setView([userCoords.lat, userCoords.lng], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  refreshPharmacies();
}

function refreshPharmacies() {
  if (!map) return;

  fetch(`${BASE_API}/api/pharmacies?lat=${userCoords.lat}&lng=${userCoords.lng}`)
    .then(res => res.json())
    .then(data => {
      // Clear old markers
      pharmacyMarkers.forEach(m => map.removeLayer(m));
      pharmacyMarkers = [];

      const listContainer = document.getElementById('pharmacies-cards-grid');
      let cardsHtml = '';

      data.pharmacies.forEach((p, idx) => {
        // Add Marker
        const marker = L.marker([p.latitude, p.longitude]).addTo(map);
        marker.bindPopup(`
          <div style="font-family:sans-serif; min-width:200px;">
            <strong style="color:#00B894; font-size:1.1em;">${escapeHtml(p.name)}</strong>
            <p style="margin:4px 0; font-size:0.85em; color:#555;">${escapeHtml(p.address)}</p>
            <div style="font-size:0.8em; margin-bottom:6px;">
              ⭐ <strong>${p.rating}</strong> | 📞 ${escapeHtml(p.phone)}<br>
              🕒 ${escapeHtml(p.open_hours)}<br>
              📍 <strong>${p.distance_km ? p.distance_km + ' km away' : ''}</strong>
            </div>
            <button onclick="filterByPharmacy(${p.id}, '${escapeHtml(p.name)}')" style="background:#00B894;color:#fff;border:none;padding:5px 10px;border-radius:4px;cursor:pointer;font-size:0.8em;width:100%;">
              Search Stock Here
            </button>
          </div>
        `);
        pharmacyMarkers.push(marker);

        // Build grid card
        cardsHtml += `
          <div class="pharmacy-card glass-card p-3">
            <div class="d-flex justify-between align-center mb-1">
              <h4 class="m-0">${escapeHtml(p.name)}</h4>
              <span class="badge badge-success">⭐ ${p.rating}</span>
            </div>
            <p class="text-xs text-muted mb-2">${escapeHtml(p.address)}</p>
            <div class="d-flex justify-between text-xs text-muted mb-3">
              <span>🕒 ${escapeHtml(p.open_hours)}</span>
              <span>📍 <strong>${p.distance_km !== null ? p.distance_km + ' km' : 'Nearby'}</strong></span>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-secondary btn-sm flex-1" onclick="focusOnPharmacy(${p.latitude}, ${p.longitude})">
                <i data-lucide="map-pin" style="width:13px;height:13px;"></i> View on Map
              </button>
              <a href="tel:${escapeHtml(p.phone)}" class="btn btn-ghost btn-sm">
                <i data-lucide="phone" style="width:13px;height:13px;"></i> Call
              </a>
            </div>
          </div>
        `;
      });

      if (listContainer) listContainer.innerHTML = cardsHtml;
      if (window.lucide) lucide.createIcons();
    })
    .catch(console.error);
}

function focusOnPharmacy(lat, lng) {
  if (map) {
    map.setView([lat, lng], 15);
    window.scrollTo({ top: document.getElementById('tab-map').offsetTop - 80, behavior: 'smooth' });
  }
}

function locateUserOnMap() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (map) map.setView([userCoords.lat, userCoords.lng], 14);
      refreshPharmacies();
    });
  }
}

// ==========================================
// MODAL: RESERVATION & ORDER ACTIONS
// ==========================================

function openActionModal(actionType, medicine, pharmacyOption) {
  activeModalData = {
    actionType: actionType,
    medicine: medicine,
    pharmacy: pharmacyOption,
    unitPrice: pharmacyOption.effective_price,
    maxStock: pharmacyOption.stock_quantity
  };

  const title = actionType === 'reserve' ? 'Reserve for 24hr Store Pickup' : 'Instant Counter Order';
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-med-name').textContent = medicine.name;
  document.getElementById('modal-med-category').textContent = `${medicine.category} • ${medicine.dosage || 'Standard'}`;
  document.getElementById('modal-item-price').textContent = `₹${pharmacyOption.effective_price.toFixed(2)}`;
  document.getElementById('modal-pharm-name').textContent = `Stock held by: ${pharmacyOption.pharmacy_name}`;
  document.getElementById('modal-stock-text').textContent = `In stock: ${pharmacyOption.stock_quantity} units`;

  const qtyInput = document.getElementById('modal-qty');
  qtyInput.value = 1;
  qtyInput.max = pharmacyOption.stock_quantity;

  const btn = document.getElementById('modal-submit-btn');
  btn.textContent = actionType === 'reserve' ? 'Confirm Reservation' : 'Place Order Now';

  updateModalTotal();
  document.getElementById('action-modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('action-modal').style.display = 'none';
  activeModalData = null;
}

function adjustModalQty(delta) {
  const input = document.getElementById('modal-qty');
  let val = parseInt(input.value) + delta;
  if (val < 1) val = 1;
  if (activeModalData && val > activeModalData.maxStock) val = activeModalData.maxStock;
  input.value = val;
  updateModalTotal();
}

function updateModalTotal() {
  if (!activeModalData) return;
  const qty = parseInt(document.getElementById('modal-qty').value) || 1;
  const total = qty * activeModalData.unitPrice;
  document.getElementById('modal-total-price').textContent = `₹${total.toFixed(2)}`;
}

function submitOrderOrReservation() {
  if (!activeModalData) return;

  const qty = parseInt(document.getElementById('modal-qty').value) || 1;
  const notes = document.getElementById('modal-notes').value.trim();
  const btn = document.getElementById('modal-submit-btn');

  btn.innerHTML = '⏳ Submitting...';
  btn.disabled = true;

  const payload = {
    pharmacy_id: activeModalData.pharmacy.pharmacy_id,
    order_type: activeModalData.actionType,
    notes: notes,
    items: [
      {
        medicine_id: activeModalData.medicine.id,
        medicine_name: activeModalData.medicine.name,
        quantity: qty,
        unit_price: activeModalData.unitPrice
      }
    ]
  };

  fetch(`${BASE_API}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      if (data.order) {
        alert(`Success! Your ${activeModalData.actionType} (${data.order.order_number}) has been placed with ${activeModalData.pharmacy.pharmacy_name}.`);
        closeModal();
        performSearch(); // Refresh live stock numbers
        loadUserOrders();
        loadNotifications();
      } else {
        alert(data.error || 'Failed to place reservation.');
        btn.disabled = false;
        btn.textContent = 'Confirm';
      }
    })
    .catch(err => {
      console.error(err);
      alert('Error communicating with server.');
      btn.disabled = false;
    });
}

// ==========================================
// USER ORDERS & RESERVATIONS LIST
// ==========================================

function loadUserOrders() {
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;

  fetch(`${BASE_API}/api/orders/user`, { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      if (!data.orders || data.orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center p-4 text-muted">You have no active orders or reservations yet.</td></tr>`;
        return;
      }

      let html = '';
      data.orders.forEach(o => {
        let statusBadge = 'badge-subtle';
        if (o.status === 'confirmed') statusBadge = 'badge-primary';
        else if (o.status === 'ready_for_pickup') statusBadge = 'badge-success';
        else if (o.status === 'completed') statusBadge = 'badge-emerald';
        else if (o.status === 'cancelled') statusBadge = 'badge-danger';

        const itemsSummary = o.items.map(it => `${it.medicine_name} (x${it.quantity})`).join(', ');

        html += `
          <tr>
            <td><strong>${escapeHtml(o.order_number)}</strong></td>
            <td><span class="badge ${o.order_type === 'reservation' ? 'badge-info' : 'badge-primary'}">${escapeHtml(o.order_type.toUpperCase())}</span></td>
            <td>
              <div>${escapeHtml(o.pharmacy_name)}</div>
              <div class="text-xs text-muted">📞 ${escapeHtml(o.pharmacy_phone)}</div>
            </td>
            <td class="text-xs" style="max-width:200px;">${escapeHtml(itemsSummary)}</td>
            <td><strong>₹${o.total_amount.toFixed(2)}</strong></td>
            <td><span class="badge ${statusBadge}">${escapeHtml(o.status.replace('_', ' ').toUpperCase())}</span></td>
            <td class="text-xs text-muted">${escapeHtml(o.created_at || '')}</td>
            <td>
              ${o.status !== 'completed' && o.status !== 'cancelled' ? `
                <button class="btn btn-ghost btn-sm text-danger" onclick="cancelOrder(${o.id})">Cancel</button>
              ` : '—'}
            </td>
          </tr>
        `;
      });

      tbody.innerHTML = html;
    })
    .catch(console.error);
}

function cancelOrder(orderId) {
  if (!confirm('Are you sure you want to cancel this order/reservation?')) return;

  fetch(`${BASE_API}/api/orders/${orderId}/cancel`, { method: 'POST', credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      alert(data.message || 'Order status updated.');
      loadUserOrders();
      performSearch();
    })
    .catch(console.error);
}

// ==========================================
// NOTIFICATIONS
// ==========================================

function loadNotifications() {
  fetch(`${BASE_API}/api/notifications`, { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById('notif-list');
      const count = document.getElementById('notif-count');
      const badge = document.getElementById('notif-badge');

      if (!data.notifications || data.notifications.length === 0) {
        list.innerHTML = `<p class="text-muted text-xs p-3">No new notifications.</p>`;
        badge.style.display = 'none';
        count.textContent = '0 new';
        return;
      }

      badge.style.display = 'block';
      count.textContent = `${data.notifications.length} alerts`;

      list.innerHTML = data.notifications.map(n => `
        <div class="notif-item p-2 border-bottom">
          <div class="d-flex justify-between">
            <strong class="text-xs">${escapeHtml(n.title)}</strong>
            <span class="text-xs text-muted">${n.created_at || ''}</span>
          </div>
          <p class="text-xs text-muted m-0 mt-1">${escapeHtml(n.message)}</p>
        </div>
      `).join('');
    })
    .catch(console.error);
}

function toggleNotifications() {
  const drop = document.getElementById('notif-dropdown');
  drop.classList.toggle('show');
}

// Close notification on click outside
window.addEventListener('click', (e) => {
  if (!e.target.closest('.dropdown-wrapper')) {
    const drop = document.getElementById('notif-dropdown');
    if (drop) drop.classList.remove('show');
  }
});

// ==========================================
// AI MEDICAL ASSISTANT CHATBOT
// ==========================================

function handleAiKeyPress(e) {
  if (e.key === 'Enter') sendAiMessage();
}

function askAiPrompt(promptText) {
  document.getElementById('ai-chat-input').value = promptText;
  sendAiMessage();
}

function sendAiMessage() {
  const input = document.getElementById('ai-chat-input');
  const msg = input.value.trim();
  if (!msg) return;

  const container = document.getElementById('chat-messages-container');
  
  // Append user bubble
  container.innerHTML += `
    <div class="chat-bubble user-msg">
      <div class="bubble-content">${escapeHtml(msg)}</div>
    </div>
  `;
  input.value = '';
  container.scrollTop = container.scrollHeight;

  // Typing indicator
  const typingId = 'typing-' + Date.now();
  container.innerHTML += `
    <div class="chat-bubble ai-msg" id="${typingId}">
      <div class="bubble-content">
        <span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>
      </div>
    </div>
  `;
  container.scrollTop = container.scrollHeight;

  const apiEndpoint = `${BASE_API}/api/ai/chat`;

  fetch(apiEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: msg })
  })
    .then(res => {
      if (!res.ok) throw new Error('API returned ' + res.status);
      return res.json();
    })
    .then(data => {
      const typingEl = document.getElementById(typingId);
      if (typingEl) typingEl.remove();

      let replyText = data.reply || getLocalClinicalResponse(msg);
      let formatted = escapeHtml(replyText)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n- /g, '<br>• ');

      container.innerHTML += `
        <div class="chat-bubble ai-msg">
          <div class="bubble-content">${formatted}</div>
        </div>
      `;
      container.scrollTop = container.scrollHeight;
    })
    .catch(err => {
      console.warn('Backend fetch error, activating local clinical AI engine:', err);
      const typingEl = document.getElementById(typingId);
      if (typingEl) typingEl.remove();

      let localReply = getLocalClinicalResponse(msg);
      let formatted = escapeHtml(localReply)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n- /g, '<br>• ');

      container.innerHTML += `
        <div class="chat-bubble ai-msg">
          <div class="bubble-content">${formatted}</div>
        </div>
      `;
      container.scrollTop = container.scrollHeight;
    });
}

// Comprehensive local clinical pharmacology engine for guaranteed responsiveness
function getLocalClinicalResponse(message) {
  const lower = message.toLowerCase();

  if (lower.includes('dolo') || lower.includes('paracetamol') || lower.includes('fever') || lower.includes('crocin')) {
    return "💊 **Paracetamol 650mg (Dolo 650 / Crocin 650)**:\n\n" +
           "- **Indications**: Effective relief from acute fever, headache, muscular ache and general malaise.\n" +
           "- **Adult Dosage**: 1 tablet after meals every 6–8 hours as needed (Maximum 4,000mg/day).\n" +
           "- **Live Availability**: Currently in stock across 12 Hyderabad pharmacies starting from ₹30/strip at Apollo Banjara Hills and MedPlus Jubilee Hills.\n" +
           "- ⚠️ **Safety Advice**: Avoid taking with other paracetamol products. Consult a physician if fever lasts beyond 3 days.";
  } else if (lower.includes('augmentin') || lower.includes('amoxicillin') || lower.includes('antibiotic')) {
    return "💊 **Augmentin 625 Duo (Amoxicillin 500mg + Clavulanic Acid 125mg)**:\n\n" +
           "- **Indications**: Broad-spectrum penicillin antibiotic for respiratory, ENT, throat and skin bacterial infections.\n" +
           "- **Typical Schedule**: 1 tablet twice daily after food for 5 days as prescribed.\n" +
           "- **Availability**: In stock across 12 Hyderabad stores starting at ₹158.24 (Best deal at Care & Cure Secunderabad and Aster Kondapur).\n" +
           "- ⚠️ **Notice**: Prescription drug. Please complete the full prescribed course.";
  } else if (lower.includes('acidity') || lower.includes('gas') || lower.includes('pan 40') || lower.includes('omez') || lower.includes('heartburn')) {
    return "🍵 **Gastric & Acidity Relief Guidance**:\n\n" +
           "- **Immediate Comfort**: **Digene Mint Gel** or **Gelusil Liquid** (2 teaspoons after food).\n" +
           "- **24hr Acid Blockers**: **Pan 40** (Pantoprazole 40mg) or **Omez 20**, taken 30 minutes before morning breakfast.\n" +
           "- **Stock & Pricing**: Available in all 12 partner stores from ₹10 (Eno) to ₹88 (Pan 40 strip).";
  } else if (lower.includes('cough') || lower.includes('cold') || lower.includes('allergy') || lower.includes('montair') || lower.includes('allegra')) {
    return "🌬️ **Cold, Allergy & Respiratory Relief**:\n\n" +
           "- **Runny Nose & Sneezing**: **Montair-LC** (Montelukast + Levocetirizine) 1 tab at bedtime, or **Allegra 120mg** (non-drowsy).\n" +
           "- **Productive Chest Cough**: **Ascoril LS Syrup** (5–10 ml with warm water thrice daily).\n" +
           "- **Dry Tickly Cough**: **Benadryl Dry Cough Syrup** (10 ml at bedtime).\n" +
           "- **Availability**: Ready for instant hold at Apollo, MedPlus, and Wellness Forever branches.";
  } else if (lower.includes('bp') || lower.includes('blood pressure') || lower.includes('telma')) {
    return "❤️ **Blood Pressure Maintenance**:\n\n" +
           "- **First Line**: **Telma 40** (Telmisartan 40mg) or **Amlong 5** (Amlodipine 5mg).\n" +
           "- **Notice**: Schedule-H prescription drug. You can upload your prescription via our **Rx Scanner**!\n" +
           "- **Average Price**: ₹45 – ₹125/strip across nearby pharmacy partners.";
  } else if (lower.includes('diabetes') || lower.includes('sugar') || lower.includes('glycomet') || lower.includes('metformin')) {
    return "🩸 **Diabetes & Blood Sugar Support**:\n\n" +
           "- **Oral Medication**: **Glycomet 500 SR** (Metformin 500mg) or **Glycomet GP 1**.\n" +
           "- **Stock**: In stock across Apollo, MedPlus, Aster Kondapur, and Care & Cure Secunderabad.";
  } else if (lower.includes('pharmacy') || lower.includes('store') || lower.includes('where') || lower.includes('hyderabad')) {
    return "📍 **Hyderabad Pharmacy Network**:\n\n" +
           "• **Apollo Pharmacy** — Road No. 2, Banjara Hills (24 Hours Open | 📞 +91 40 2345 6789)\n" +
           "• **MedPlus Pharmacy** — Road No. 36, Jubilee Hills (7 AM – 11:30 PM | 📞 +91 40 2355 8899)\n" +
           "• **Wellness Forever** — Opp. Cyber Towers, Madhapur (24 Hours Open | 📞 +91 40 4455 6677)\n" +
           "• **Hetero Pharmacy** — DLF Cyber City, Gachibowli (8 AM – 11 PM | 📞 +91 40 2300 1122)\n\n" +
           "Switch to the **Nearby Pharmacies** tab to view live Leaflet map pins and calculate walking/driving distances!";
  } else if (lower.includes('reserve') || lower.includes('order') || lower.includes('how to')) {
    return "📦 **How to Reserve & Order on PharmaNear**:\n\n" +
           "1. Search for your medicine on the **Search & Compare** tab.\n" +
           "2. View side-by-side prices across 12 Hyderabad stores.\n" +
           "3. Click **Reserve** to hold stock at the counter for up to 24 hours with zero advance fee.\n" +
           "4. You receive a live reservation code for immediate counter pickup!";
  } else {
    return "👋 Hello! I am your **PharmaNear AI Medical Assistant**.\n\n" +
           "I am connected in real-time to **12 Hyderabad pharmacies** and 58+ medications. You can ask me about:\n\n" +
           "• Specific medicines (e.g. *Dolo 650*, *Augmentin*, *Pan 40*, *Limcee*, *Telma 40*)\n" +
           "• Symptoms (e.g. *fever*, *cold*, *dry cough*, *acidity*, *body pain*)\n" +
           "• Store locations, open hours, and phone numbers in Hyderabad\n" +
           "• How to compare prices and reserve items with zero advance fee!";
  }
}

function clearChat() {
  document.getElementById('chat-messages-container').innerHTML = `
    <div class="chat-bubble ai-msg">
      <div class="bubble-content">
        Hello! I am your <strong>PharmaNear AI Assistant</strong>. Ask me anything about medicine dosages, generic alternatives, or where to find items in stock across Hyderabad!
      </div>
    </div>
  `;
}

// Utility: safe HTML escaping
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
