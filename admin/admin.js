const API_BASE = 'https://amdani-site.onrender.com';
const qs = id => document.getElementById(id);
let adminProducts = [];

async function loadStats() {
  try {
    const r = await fetch(`${API_BASE}/api/admin/stats`);
    const d = await r.json();
    qs('statOrders').textContent = d.total_orders ?? 0;
    qs('statPending').textContent = d.pending_orders ?? 0;
    qs('statDelivered').textContent = d.delivered_orders ?? 0;
    qs('statRevenue').textContent = `Rs. ${d.total_revenue ?? 0}`;
  } catch (e) {
    qs('adminMsg').textContent = 'Failed to load stats.';
  }
}

async function loadOrders() {
  try {
    const r = await fetch(`${API_BASE}/api/admin/orders`);
    const d = await r.json();

    qs('ordersBody').innerHTML = (d.orders || []).map(o => `
      <tr>
        <td>${o.id ?? ''}</td>
        <td>${o.tracking_id ?? ''}</td>
        <td>${o.full_name ?? ''}</td>
        <td>${o.phone ?? ''}</td>
        <td>${o.address ?? ''}</td>
        <td>${o.city ?? ''}</td>
        <td>${o.postal_code ?? ''}</td>
        <td>${o.perfume_name ?? ''}</td>
        <td>
          <select onchange="updateStatus(${o.id},this.value)">
            ${['pending','confirmed','shipped','delivered'].map(s => `
              <option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>
            `).join('')}
          </select>
        </td>
        <td>Rs. ${o.total_amount ?? 0}</td>
      </tr>
    `).join('');
  } catch (e) {
    qs('adminMsg').textContent = 'Failed to load orders.';
  }
}

async function loadProducts() {
  try {
    const r = await fetch(`${API_BASE}/api/products`);
    const d = await r.json();
    adminProducts = d.products || [];

    qs('productsBody').innerHTML = adminProducts.map(p => `
      <tr>
        <td>${p.id}</td>
        <td>${p.name}</td>
        <td>${p.type}</td>
        <td>Rs. ${p.price}</td>
        <td>${p.stock}</td>
        <td>${p.lasting || ''}</td>
        <td><button class="btn2" onclick="fillProductById(${p.id})">Edit</button></td>
      </tr>
    `).join('');
  } catch (e) {
    qs('adminMsg').textContent = 'Failed to load products.';
  }
}

async function updateStatus(id, status) {
  try {
    await fetch(`${API_BASE}/api/admin/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    loadStats();
    loadOrders();
    qs('adminMsg').textContent = 'Order status updated.';
  } catch (e) {
    qs('adminMsg').textContent = 'Failed to update order status.';
  }
}
window.updateStatus = updateStatus;

window.fillProductById = function(id) {
  const p = adminProducts.find(x => Number(x.id) === Number(id));
  if (!p) return;

  qs('pId').value = p.id || '';
  qs('pName').value = p.name || '';
  qs('pCategory').value = p.category || '';
  qs('pType').value = p.type || '';
  qs('pPrice').value = p.price || '';
  qs('pOldPrice').value = p.old_price || '';
  qs('pStock').value = p.stock || '';
  qs('pBadge').value = p.badge || '';
  qs('pLasting').value = p.lasting || '';
  qs('pInspired').value = p.inspired_by || '';
  qs('pTop').value = p.top_notes || '';
  qs('pHeart').value = p.heart_notes || '';
  qs('pBase').value = p.base_notes || '';
  qs('pLongevity').value = p.longevity || '';
  qs('pProjection').value = p.projection || '';
  qs('pBestFor').value = p.best_for || '';
  qs('pDesc').value = p.description || '';
};

function payload() {
  return {
    name: qs('pName').value,
    category: qs('pCategory').value,
    type: qs('pType').value,
    price: Number(qs('pPrice').value || 0),
    old_price: Number(qs('pOldPrice').value || 0),
    stock: Number(qs('pStock').value || 0),
    badge: qs('pBadge').value,
    lasting: qs('pLasting').value,
    inspired_by: qs('pInspired').value,
    top_notes: qs('pTop').value,
    heart_notes: qs('pHeart').value,
    base_notes: qs('pBase').value,
    longevity: qs('pLongevity').value,
    projection: qs('pProjection').value,
    best_for: qs('pBestFor').value,
    description: qs('pDesc').value,
    reviews_json: '[]'
  };
}

qs('saveBtn').addEventListener('click', async () => {
  const id = qs('pId').value.trim();
  const method = id ? 'PATCH' : 'POST';
  const url = id
    ? `${API_BASE}/api/admin/products/${id}`
    : `${API_BASE}/api/admin/products`;

  try {
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload())
    });

    const d = await r.json();
    qs('adminMsg').textContent = d.success ? 'Saved successfully' : 'Save failed';
    loadProducts();
  } catch (e) {
    qs('adminMsg').textContent = 'Save failed';
  }
});

qs('deleteBtn').addEventListener('click', async () => {
  const id = qs('pId').value.trim();
  if (!id) return;

  try {
    const r = await fetch(`${API_BASE}/api/admin/products/${id}`, {
      method: 'DELETE'
    });

    const d = await r.json();
    qs('adminMsg').textContent = d.success ? 'Deleted successfully' : 'Delete failed';
    loadProducts();
  } catch (e) {
    qs('adminMsg').textContent = 'Delete failed';
  }
});

qs('refreshBtn').addEventListener('click', () => {
  loadStats();
  loadOrders();
  loadProducts();
  qs('adminMsg').textContent = 'Data refreshed.';
});

qs('searchBtn').addEventListener('click', () => {
  const t = qs('trackSearch').value.trim().toUpperCase();
  if (!t) {
    loadOrders();
    return;
  }

  [...qs('ordersBody').querySelectorAll('tr')].forEach(tr => {
    tr.style.display = tr.innerText.toUpperCase().includes(t) ? '' : 'none';
  });
});

loadStats();
loadOrders();
loadProducts();
