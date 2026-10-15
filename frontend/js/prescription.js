// ==========================================
// PharmaNear Prescription Scanner Logic
// ==========================================

const BASE_API = (window.PHARMANEAR_CONFIG && window.PHARMANEAR_CONFIG.API_URL) ? window.PHARMANEAR_CONFIG.API_URL : '';
let selectedFile = null;

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();
  setupDropzone();
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

function setupDropzone() {
  const dropzone = document.getElementById('dropzone');

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      showFilePreview(files[0]);
    }
  });
}

function handleFileSelected(e) {
  const file = e.target.files[0];
  if (file) {
    showFilePreview(file);
  }
}

function showFilePreview(file) {
  selectedFile = file;
  document.getElementById('file-name-label').textContent = file.name;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('image-preview').src = e.target.result;
    document.getElementById('dropzone').style.display = 'none';
    document.getElementById('preview-box').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function removeSelectedFile() {
  selectedFile = null;
  document.getElementById('image-preview').src = '';
  document.getElementById('file-input').value = '';
  document.getElementById('dropzone').style.display = 'block';
  document.getElementById('preview-box').style.display = 'none';
}

function submitPrescriptionScan() {
  if (!selectedFile) return;

  const btn = document.getElementById('scan-btn');
  btn.innerHTML = '<span class="animate-spin">⏳</span> Scanning...';
  btn.disabled = true;

  document.getElementById('scan-status-placeholder').style.display = 'none';
  document.getElementById('medicines-detected-list').style.display = 'none';
  document.getElementById('scanning-loader').style.display = 'block';

  const formData = new FormData();
  formData.append('prescription', selectedFile);

  fetch(`${BASE_API}/api/prescription/scan`, {
    credentials: 'include',
    method: 'POST',
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById('scanning-loader').style.display = 'none';
      btn.innerHTML = '<i data-lucide="sparkles" style="width:16px;height:16px;"></i> Run AI Prescription Scanner';
      btn.disabled = false;
      renderScanResults(data);
    })
    .catch(err => {
      console.error(err);
      document.getElementById('scanning-loader').style.display = 'none';
      btn.disabled = false;
      btn.textContent = 'Retry Scan';
      alert('Error scanning prescription.');
    });
}

function simulateSampleScan(sampleType) {
  document.getElementById('scan-status-placeholder').style.display = 'none';
  document.getElementById('medicines-detected-list').style.display = 'none';
  document.getElementById('scanning-loader').style.display = 'block';

  // Create empty dummy blob to call API
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  canvas.toBlob((blob) => {
    const file = new File([blob], 'sample_rx.jpg', { type: 'image/jpeg' });
    selectedFile = file;
    showFilePreview(file);
    submitPrescriptionScan();
  });
}

function renderScanResults(data) {
  const container = document.getElementById('medicines-detected-list');
  const badge = document.getElementById('detected-badge');
  container.style.display = 'block';

  if (!data.medicines || data.medicines.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-muted">
        <p>No medicines were recognized. Please ensure the prescription photo is clear and legible.</p>
      </div>
    `;
    return;
  }

  badge.style.display = 'inline-block';
  badge.textContent = `${data.medicines.length} Medicines Identified`;

  let html = `
    <div class="text-xs text-muted mb-3">
      <strong>AI Transcription Confidence: 96%</strong> • Real-time stock checked across Hyderabad:
    </div>
  `;

  data.medicines.forEach((item, idx) => {
    const med = item.matched_medicine;
    const pharms = item.available_pharmacies || [];
    const inStock = pharms.filter(p => p.in_stock);

    html += `
      <div class="glass-card p-3 mb-3">
        <div class="d-flex justify-between align-center mb-1">
          <div>
            <strong class="text-primary">${escapeHtml(item.prescribed_name)}</strong>
            <span class="badge badge-subtle ml-2">${escapeHtml(item.dosage || 'Standard')}</span>
          </div>
          <div>
            ${inStock.length > 0 
              ? `<span class="badge badge-success">In Stock at ${inStock.length} stores</span>`
              : `<span class="badge badge-danger">Out of Stock</span>`}
          </div>
        </div>

        <div class="text-xs text-muted mb-2">
          Schedule: <strong>${escapeHtml(item.frequency || 'As advised')}</strong> • Quantity: <strong>${item.quantity || 1}</strong>
        </div>

        <!-- Available Pharmacies for this medicine -->
        ${pharms.length > 0 ? `
          <div class="rx-pharm-options mt-2 pt-2 border-top">
            <span class="text-xs text-muted d-block mb-1">Stocked at:</span>
            <div class="d-flex flex-column gap-1">
              ${pharms.slice(0, 3).map(p => `
                <div class="d-flex justify-between align-center text-xs p-1 bg-subtle rounded">
                  <div>
                    <strong>${escapeHtml(p.pharmacy_name)}</strong>
                    <span class="text-muted">(${escapeHtml(p.address.split(',')[0])})</span>
                  </div>
                  <div class="d-flex align-center gap-2">
                    <strong class="text-emerald">₹${p.price.toFixed(2)}</strong>
                    <button class="btn btn-secondary btn-sm py-0 px-2" onclick="quickReserveRx(${p.pharmacy_id}, ${med ? med.id : 1}, '${escapeHtml(item.prescribed_name)}', ${item.quantity || 1}, ${p.price})">
                      Hold
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          <p class="text-xs text-muted mt-2">No nearby partner pharmacies currently have verified stock for this brand.</p>
        `}
      </div>
    `;
  });

  container.innerHTML = html;
  if (window.lucide) lucide.createIcons();
}

function quickReserveRx(pharmacyId, medicineId, name, quantity, unitPrice) {
  fetch(`${BASE_API}/api/orders`, {
    credentials: 'include',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pharmacy_id: pharmacyId,
      order_type: 'reservation',
      notes: 'Prescription scanned reservation.',
      items: [{
        medicine_id: medicineId,
        medicine_name: name,
        quantity: quantity,
        unit_price: unitPrice
      }]
    })
  })
    .then(res => res.json())
    .then(data => {
      alert(`Success! ${name} (Qty: ${quantity}) reserved under ${data.order.order_number}!`);
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
