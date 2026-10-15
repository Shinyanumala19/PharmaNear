// ==========================================
// PharmaNear Admin Analytics & Control Script
// ==========================================

const BASE_API = (window.PHARMANEAR_CONFIG && window.PHARMANEAR_CONFIG.API_URL) ? window.PHARMANEAR_CONFIG.API_URL : '';
let categoryChart = null;
let stockChart = null;
let orderChart = null;

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();
  loadStats();
  loadAnalytics();
  loadAdminPharmacies();
  loadAdminUsers();
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

function switchAdminTab(tabName) {
  document.querySelectorAll('.admin-tab').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.dash-sidebar .nav-item').forEach(el => el.classList.remove('active'));

  const target = document.getElementById(`admin-tab-${tabName}`);
  if (target) target.style.display = 'block';

  const idx = ['overview', 'pharmacies', 'users'].indexOf(tabName);
  const items = document.querySelectorAll('.dash-sidebar .nav-item');
  if (items[idx]) items[idx].classList.add('active');

  if (tabName === 'overview') loadAnalytics();
  else if (tabName === 'pharmacies') loadAdminPharmacies();
  else if (tabName === 'users') loadAdminUsers();
}

function loadStats() {
  fetch(`${BASE_API}/api/admin/stats`, { credentials: 'include' })
    .then(res => res.json())
    .then(d => {
      document.getElementById('stat-revenue').textContent = `₹${d.total_revenue.toLocaleString('en-IN')}`;
      document.getElementById('stat-total-pharmacies').textContent = d.total_pharmacies;
      document.getElementById('stat-total-meds').textContent = d.total_medicines;
      document.getElementById('stat-total-users').textContent = d.total_users;
    })
    .catch(console.error);
}

function loadAnalytics() {
  fetch(`${BASE_API}/api/admin/analytics`, { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      renderCategoryChart(data.category_distribution);
      renderStockChart(data.pharmacy_stocks);
      renderOrderTimelineChart(data.order_timeline);
    })
    .catch(console.error);
}

function renderCategoryChart(categories) {
  const ctx = document.getElementById('categoryChart').getContext('2d');
  if (categoryChart) categoryChart.destroy();

  const labels = categories.map(c => c.category);
  const counts = categories.map(c => c.count);

  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: counts,
        backgroundColor: [
          '#00B894', '#00CEFF', '#6C5CE7', '#FD79A8', 
          '#FDCB6E', '#E17055', '#0984E3', '#00CEC9'
        ],
        borderWidth: 2,
        borderColor: '#1E293B'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#E2E8F0', font: { size: 10 } } }
      }
    }
  });
}

function renderStockChart(pharmacies) {
  const ctx = document.getElementById('stockChart').getContext('2d');
  if (stockChart) stockChart.destroy();

  const labels = pharmacies.map(p => p.pharmacy_name.split('-')[0].trim());
  const stocks = pharmacies.map(p => p.total_stock);

  stockChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Stock Quantity',
        data: stocks,
        backgroundColor: 'rgba(0, 184, 148, 0.75)',
        borderColor: '#00B894',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: '#94A3B8', font: { size: 10 } } },
        y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

function renderOrderTimelineChart(timeline) {
  const ctx = document.getElementById('orderChart').getContext('2d');
  if (orderChart) orderChart.destroy();

  orderChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: timeline.map(t => t.date),
      datasets: [{
        label: 'Orders & Holds',
        data: timeline.map(t => t.orders),
        borderColor: '#6C5CE7',
        backgroundColor: 'rgba(108, 92, 231, 0.15)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#00CEFF',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: '#94A3B8' } },
        y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

function loadAdminPharmacies() {
  const tbody = document.getElementById('admin-pharmacies-tbody');

  fetch(`${BASE_API}/api/admin/pharmacies`, { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      const list = data.pharmacies || [];
      tbody.innerHTML = list.map(p => `
        <tr>
          <td>
            <strong>${escapeHtml(p.name)}</strong>
            <div class="text-xs text-muted">License: ${escapeHtml(p.license_number || 'N/A')}</div>
          </td>
          <td>
            <div>${escapeHtml(p.address)}</div>
            <div class="text-xs text-muted">📞 ${escapeHtml(p.phone)}</div>
          </td>
          <td>
            <div>${escapeHtml(p.owner_name)}</div>
            <div class="text-xs text-muted">${escapeHtml(p.owner_email)}</div>
          </td>
          <td><span class="badge badge-primary">${p.inventory_count} SKUs</span></td>
          <td>⭐ ${p.rating}</td>
          <td>
            ${p.is_approved 
              ? `<span class="badge badge-success">Active</span>`
              : `<span class="badge badge-danger">Suspended</span>`}
          </td>
          <td>
            <button class="btn btn-${p.is_approved ? 'ghost text-danger' : 'primary'} btn-sm" onclick="togglePharmacyStatus(${p.id})">
              ${p.is_approved ? 'Suspend' : 'Approve'}
            </button>
          </td>
        </tr>
      `).join('');
    })
    .catch(console.error);
}

function togglePharmacyStatus(pharmId) {
  fetch(`${BASE_API}/api/admin/pharmacies/${pharmId}/toggle`, { method: 'POST', credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      alert(data.message || 'Updated');
      loadAdminPharmacies();
    })
    .catch(console.error);
}

function loadAdminUsers() {
  const tbody = document.getElementById('admin-users-tbody');

  fetch(`${BASE_API}/api/admin/users`, { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      const users = data.users || [];
      tbody.innerHTML = users.map(u => {
        let roleBadge = 'badge-subtle';
        if (u.role === 'admin') roleBadge = 'badge-pink';
        else if (u.role === 'pharmacy_owner') roleBadge = 'badge-purple';
        else roleBadge = 'badge-primary';

        return `
          <tr>
            <td>#${u.id}</td>
            <td><strong>${escapeHtml(u.name)}</strong></td>
            <td>${escapeHtml(u.email)}</td>
            <td>${escapeHtml(u.phone || '—')}</td>
            <td><span class="badge ${roleBadge}">${escapeHtml(u.role.toUpperCase())}</span></td>
            <td class="text-xs text-muted">${u.created_at ? u.created_at.split('T')[0] : '—'}</td>
          </tr>
        `;
      }).join('');
    })
    .catch(console.error);
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
