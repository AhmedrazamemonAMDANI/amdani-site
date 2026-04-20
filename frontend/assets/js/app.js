const API_BASE = 'https://amdani-site.onrender.com';

const IN_FRONTEND_PAGE = window.location.pathname.includes('/frontend/');
const PAGE_PREFIX = IN_FRONTEND_PAGE ? '' : 'frontend/';
const ASSET_PREFIX = IN_FRONTEND_PAGE ? 'assets/' : 'frontend/assets/';

const FALLBACK_PRODUCTS = [
  {id:1,name:'Royal Oud',category:'Luxury Oud',type:'male',old_price:4000,price:2000,badge:'Best Seller',stock:3,lasting:'24 Hours',inspired_by:'Creed Aventus',top_notes:'Pineapple, Bergamot, Black Currant',heart_notes:'Jasmine, Patchouli, Birch',base_notes:'Oakmoss, Musk, Ambergris',longevity:'8–10 Hours',projection:'Strong',best_for:'Daily wear, evenings, signature scent',description:'Royal Oud is crafted for confident wearers who want a bold, luxurious signature.',reviews_json:'[{"name":"Ali","text":"Luxury feel and strong performance."}]'},
  {id:2,name:'Velvet Gold',category:'Soft Luxury',type:'female',old_price:4200,price:2200,badge:'Trending',stock:5,lasting:'12 Hours',inspired_by:'Baccarat Rouge 540',top_notes:'Saffron, Jasmine',heart_notes:'Amberwood, Cedar',base_notes:'Fir Resin, Musk',longevity:'8–10 Hours',projection:'Elegant Strong',best_for:'Events, gifting',description:'Velvet Gold brings a smooth radiant luxury.',reviews_json:'[{"name":"Hina","text":"Soft but premium."}]'},
  {id:3,name:'Golden Mist',category:'Fresh Rich',type:'unisex',old_price:3700,price:1950,badge:'New',stock:5,lasting:'12 Hours',inspired_by:'Nishane Hacivat',top_notes:'Pineapple, Bergamot, Grapefruit',heart_notes:'Jasmine, Patchouli, Cedarwood',base_notes:'Oakmoss, Woody Notes, Musk',longevity:'8–10 Hours',projection:'Fresh Strong',best_for:'Daily wear',description:'Golden Mist is bright, energetic, and luxurious.',reviews_json:'[{"name":"Bilal","text":"Fresh and attention grabbing."}]'},
  {id:4,name:'Oud Al Arab',category:'Middle East Signature',type:'middle-east',old_price:5200,price:2800,badge:'Arabic',stock:4,lasting:'24 Hours',inspired_by:'Middle Eastern Oud Blend',top_notes:'Saffron, Rose, Incense',heart_notes:'Oud, Amber, Patchouli',base_notes:'Musk, Resin, Sandalwood',longevity:'10+ Hours',projection:'Powerful',best_for:'Events, arabic luxury',description:'Deep oriental richness with smoky oud and warm amber depth.',reviews_json:'[{"name":"Fahad","text":"Strong arabic royal feel."}]'},
  {id:5,name:'Crystal Bottle Luxe',category:'Luxury Bottle',type:'bottles',old_price:3000,price:1800,badge:'Bottle',stock:8,lasting:'Display Luxury',inspired_by:'Collector Style',top_notes:'Display Piece',heart_notes:'Luxury Finish',base_notes:'Premium Bottle',longevity:'N/A',projection:'N/A',best_for:'Display, gifting',description:'Premium luxury style bottle option for display and premium presentation.',reviews_json:'[{"name":"Umair","text":"Bottle look bohat premium hai."}]'},
  {id:6,name:'Rose Empress',category:'Floral Luxury',type:'female',old_price:4100,price:2150,badge:'Hot Deal',stock:6,lasting:'12 Hours',inspired_by:'Delina',top_notes:'Rose, Lychee, Rhubarb',heart_notes:'Peony, Vanilla',base_notes:'Cashmeran, Musk',longevity:'7–9 Hours',projection:'Soft Strong',best_for:'Day wear, gifting',description:'Soft floral luxury with elegant feminine sweetness.',reviews_json:'[{"name":"Sana","text":"Beautiful floral luxury feel."}]'}
];

const store = {
  products: [],
  cart: JSON.parse(localStorage.getItem('amdani_cart') || '[]'),
  discount: Number(localStorage.getItem('amdani_discount') || '0')
};

function saveCart() {
  localStorage.setItem('amdani_cart', JSON.stringify(store.cart));
}

function saveDiscount() {
  localStorage.setItem('amdani_discount', String(store.discount));
}

function qs(id) {
  return document.getElementById(id);
}

function money(v) {
  return `Rs. ${Number(v || 0)}`;
}

function pageUrl(file, query = '') {
  return `${PAGE_PREFIX}${file}${query}`;
}

function imageUrl(file) {
  return `${ASSET_PREFIX}images/${file}`;
}

function normalizeCategory(value) {
  const v = String(value || '').trim().toLowerCase();

  const map = {
    men: 'male',
    male: 'male',
    women: 'female',
    woman: 'female',
    female: 'female',
    ladies: 'female',
    unisex: 'unisex',
    middleeast: 'middle-east',
    'middle-east': 'middle-east',
    arabic: 'middle-east',
    luxury: 'bottles',
    bottle: 'bottles',
    bottles: 'bottles',
    signature: 'all',
    gifts: 'all',
    gift: 'all',
    all: 'all'
  };

  return map[v] || v || 'all';
}

async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/api/products`);
    const data = await res.json();
    if (Array.isArray(data.products) && data.products.length) {
      store.products = data.products;
      return data.products;
    }
  } catch (e) {}
  store.products = FALLBACK_PRODUCTS;
  return FALLBACK_PRODUCTS;
}

function getProduct(id) {
  return store.products.find(p => Number(p.id) === Number(id));
}

function renderHeaderCart() {
  const el = qs('openCartBtn');
  if (!el) return;
  const totalItems = store.cart.reduce((a, b) => a + (b.qty || 1), 0);
  el.textContent = `Cart (${totalItems})`;
}

function addToCart(id, qty = 1) {
  const p = getProduct(id);
  if (!p) return;

  const existing = store.cart.find(i => i.id === p.id);
  if (existing) {
    existing.qty += qty;
  } else {
    store.cart.push({
      id: p.id,
      name: p.name,
      price: p.price,
      qty
    });
  }

  saveCart();
  renderHeaderCart();
  renderCartBox();
  renderCartPage();
}

function updateCartQty(id, delta) {
  const item = store.cart.find(i => i.id === id);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    store.cart = store.cart.filter(i => i.id !== id);
  }

  saveCart();
  renderHeaderCart();
  renderCartBox();
  renderCartPage();
}

function cartTotal() {
  return store.cart.reduce((a, b) => a + (Number(b.price) * Number(b.qty || 1)), 0);
}

function renderCartBox() {
  const box = qs('cartItems');
  const total = qs('cartTotal');
  if (!box || !total) return;

  box.innerHTML = store.cart.length
    ? store.cart.map(i => `
        <div class="status-item">
          <span>${i.name} x ${i.qty || 1}</span>
          <strong style="margin-left:auto">${money(Number(i.price) * (i.qty || 1))}</strong>
        </div>
      `).join('')
    : `<div class="status-item">Cart is empty</div>`;

  total.textContent = money(cartTotal());
}

function setupFloatingCart() {
  renderHeaderCart();
  renderCartBox();

  qs('openCartBtn')?.addEventListener('click', () => {
    qs('cartBox')?.classList.toggle('show');
  });

  qs('closeCartBtn')?.addEventListener('click', () => {
    qs('cartBox')?.classList.remove('show');
  });
}

function normalizePhone(phone) {
  let p = (phone || '').replace(/\D/g, '');
  if (p.startsWith('0')) p = '92' + p.slice(1);
  if (p && !p.startsWith('92')) p = '92' + p;
  return p;
}

function initCursorGlow() {
  const glow = qs('cursorGlow');
  if (!glow) return;

  window.addEventListener('mousemove', e => {
    glow.style.left = `${e.clientX}px`;
    glow.style.top = `${e.clientY}px`;
  });
}

function randomPopup() {
  const popup = qs('popupText');
  const viewers = qs('viewers');
  if (!popup) return;

  const names = [
    'Ahmed from Karachi',
    'Ali from Lahore',
    'Usman from Islamabad',
    'Areeba from Hyderabad',
    'Hina from Multan'
  ];

  const product = store.products[Math.floor(Math.random() * store.products.length)]?.name || 'Royal Oud';
  popup.textContent = `${names[Math.floor(Math.random() * names.length)]} just ordered ${product}`;

  if (viewers) {
    viewers.textContent = `${Math.floor(Math.random() * 9) + 8} people viewing now`;
  }
}

function setupSpin() {
  const btn = qs('spinBtn');
  if (!btn) return;

  const info = qs('spinLockInfo');
  const result = qs('spinResult');

  function lockUI() {
    const saved = Number(localStorage.getItem('amdani_spin_time') || '0');
    if (!saved) {
      if (info) info.textContent = 'You can spin now.';
      btn.disabled = false;
      return;
    }

    const next = saved + 86400000;
    const now = Date.now();

    if (now >= next) {
      if (info) info.textContent = 'You can spin now.';
      btn.disabled = false;
    } else {
      btn.disabled = true;
      const h = Math.floor((next - now) / 3600000);
      const m = Math.floor(((next - now) % 3600000) / 60000);
      if (info) info.textContent = `Next spin available in ${h}h ${m}m`;
    }
  }

  btn.addEventListener('click', async () => {
    const saved = Number(localStorage.getItem('amdani_spin_time') || '0');
    if (saved && Date.now() < saved + 86400000) {
      lockUI();
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/spin`, { method: 'POST' });
      const data = await res.json();
      store.discount = Number(data.discount || 5);
    } catch (e) {
      store.discount = [5, 6, 7, 8, 9, 10][Math.floor(Math.random() * 6)];
    }

    saveDiscount();
    localStorage.setItem('amdani_spin_time', String(Date.now()));

    if (result) {
      result.textContent = `Congratulations! You unlocked ${store.discount}% OFF`;
    }

    renderSummary();
    renderCartPage();
    lockUI();
  });

  lockUI();
}

function setupTimer() {
  const el = qs('timer');
  if (!el) return;

  const target = Date.now() + ((7 * 60 * 60) + (25 * 60)) * 1000;
  const pad = n => String(n).padStart(2, '0');

  setInterval(() => {
    const d = Math.max(0, target - Date.now());
    const h = Math.floor(d / 1000 / 60 / 60);
    const m = Math.floor((d / 1000 / 60) % 60);
    const s = Math.floor((d / 1000) % 60);

    el.innerHTML = `
      <div class="time"><b>${pad(h)}</b><span>Hours</span></div>
      <div class="time"><b>${pad(m)}</b><span>Minutes</span></div>
      <div class="time"><b>${pad(s)}</b><span>Seconds</span></div>
    `;
  }, 1000);
}

function productCard(p) {
  return `
    <div class="glass card shine">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
        <span class="badge">${p.badge || ''}</span>
        <span style="font-size:12px;color:rgba(255,255,255,.4)">${String(p.type).toUpperCase()}</span>
      </div>

      <div class="product-hero" style="margin-top:14px">
        <div class="mini-bottle logo-bottle">
          <img src="${imageUrl('logo.svg')}" alt="Amdani logo">
        </div>
      </div>

      <h4 style="font:500 28px Georgia,serif;margin:16px 0 0">${p.name}</h4>
      <div class="muted">${p.category || ''}</div>

      <div class="images">
        ${['Front View', 'Bottle Angle', 'Gift Box', 'Premium Cap'].map(i => `<div class="imgbox">${i}</div>`).join('')}
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">
        ${String(p.top_notes || '').split(',').slice(0, 3).map(n => `<span class="pill">${n.trim()}</span>`).join('')}
      </div>

      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
        <span class="pill">Lasting: ${p.lasting || '12 Hours'}</span>
        <span class="pill">Projection: ${p.projection || 'Strong'}</span>
      </div>

      <div style="margin-top:16px;display:flex;justify-content:space-between;align-items:end;gap:16px">
        <div>
          <div class="price-old">${money(p.old_price)}</div>
          <div class="price-new">Now ${money(p.price)}</div>
          <div class="muted" style="font-size:13px;margin-top:4px">Only ${p.stock} left</div>
        </div>

        <div style="display:flex;flex-direction:column;gap:10px">
          <a class="btn2" href="${pageUrl('product.html', `?id=${p.id}`)}">View</a>
          <button class="btn2" onclick="addToCart(${p.id})">Add Cart</button>
          <a class="btn" href="${pageUrl('order.html', `?id=${p.id}`)}">Order</a>
        </div>
      </div>
    </div>
  `;
}

function renderProductsPage() {
  const grid = qs('productGrid');
  if (!grid) return;

  const params = new URLSearchParams(window.location.search);
  let active = normalizeCategory(params.get('cat') || 'all');

  function draw() {
    let items = store.products;

    if (active !== 'all') {
      items = store.products.filter(p => normalizeCategory(p.type) === active);
    }

    grid.innerHTML = items.length
      ? items.map(productCard).join('')
      : `<div class="glass card empty">No products found in this category.</div>`;
  }

  document.querySelectorAll('.chipbtn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chipbtn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      active = normalizeCategory(btn.dataset.filter);
      draw();
    });
  });

  document.querySelectorAll('.chipbtn').forEach(btn => {
    if (normalizeCategory(btn.dataset.filter) === active) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  draw();
}

function renderSummary() {
  const params = new URLSearchParams(location.search);
  const selected = getProduct(params.get('id')) || store.products[0];
  if (!selected) return;

  if (qs('sumName')) qs('sumName').textContent = selected.name;
  if (qs('sumCat')) qs('sumCat').textContent = selected.category;
  if (qs('sumOld')) qs('sumOld').textContent = money(selected.old_price);
  if (qs('sumCur')) qs('sumCur').textContent = money(selected.price);
  if (qs('sumFinal')) qs('sumFinal').textContent = money(Math.round(selected.price - (selected.price * (store.discount / 100))));
  if (qs('sumLasting')) qs('sumLasting').textContent = selected.lasting || '12 Hours';
}

function renderProductDetail() {
  const root = qs('productDetail');
  if (!root) return;

  const params = new URLSearchParams(location.search);
  const p = getProduct(params.get('id')) || store.products[0];
  if (!p) return;

  const reviews = JSON.parse(p.reviews_json || '[]');

  root.innerHTML = `
    <div class="split">
      <div class="glass card">
        <div class="product-hero">
          <div class="hero-bottle logo-bottle" style="position:relative;right:auto;top:auto;margin:auto">
            <img src="${imageUrl('logo.svg')}" alt="logo">
          </div>
        </div>
      </div>

      <div class="glass card">
        <div class="tag">PRODUCT DETAILS</div>
        <h2 style="font:500 42px Georgia,serif;margin:10px 0 0">${p.name}</h2>
        <div class="muted">Inspired by ${p.inspired_by}</div>

        <div class="status">
          <div class="status-item">
            <strong>Price</strong>
            <span style="margin-left:auto">${money(p.price)}</span>
          </div>
          <div class="status-item">
            <strong>Lasting</strong>
            <span style="margin-left:auto">${p.lasting}</span>
          </div>
        </div>

        <p class="muted">${p.description}</p>

        <div class="hero-actions">
          <button class="btn" onclick="addToCart(${p.id})">Add to Cart</button>
          <a class="btn2" href="${pageUrl('order.html', `?id=${p.id}`)}">Order Now</a>
        </div>
      </div>
    </div>

    <div class="grid2" style="margin-top:20px">
      <div class="glass card"><strong>Top Notes</strong><p class="muted">${p.top_notes}</p></div>
      <div class="glass card"><strong>Heart Notes</strong><p class="muted">${p.heart_notes}</p></div>
      <div class="glass card"><strong>Base Notes</strong><p class="muted">${p.base_notes}</p></div>
      <div class="glass card"><strong>Extra</strong><p class="muted">Longevity: ${p.longevity}<br>Projection: ${p.projection}<br>Best For: ${p.best_for}</p></div>
    </div>

    <div class="glass card" style="margin-top:20px">
      <strong>Customer Reviews</strong>
      ${reviews.map(r => `<div class="review">★★★★★<br><strong>${r.name}</strong><br>${r.text}</div>`).join('')}
    </div>
  `;
}

function renderCartPage() {
  const root = qs('cartPage');
  if (!root) return;

  if (!store.cart.length) {
    root.innerHTML = '<div class="glass card empty">Cart is empty</div>';
    const sum = qs('cartPageTotal');
    if (sum) sum.textContent = money(0);
    return;
  }

  root.innerHTML = store.cart.map(i => `
    <div class="glass card" style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">
        <div>
          <h3 style="margin:0 0 6px">${i.name}</h3>
          <div class="muted">${money(i.price)} each</div>
        </div>

        <div class="qty">
          <button class="btn2" onclick="updateCartQty(${i.id},-1)">-</button>
          <span>${i.qty}</span>
          <button class="btn2" onclick="updateCartQty(${i.id},1)">+</button>
        </div>

        <strong>${money(i.price * i.qty)}</strong>
      </div>
    </div>
  `).join('');

  const sum = qs('cartPageTotal');
  if (sum) sum.textContent = money(cartTotal());
}

function setupOrderPage() {
  const form = qs('submitOrder');
  if (!form) return;

  const select = qs('perfumeSelect');
  if (select) {
    select.innerHTML = store.products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  }

  const params = new URLSearchParams(location.search);
  if (params.get('id') && select) {
    select.value = params.get('id');
  }

  form.addEventListener('click', async () => {
    const perfume = getProduct(select?.value);

    const payload = {
      full_name: qs('name')?.value || '',
      phone: qs('phone')?.value || '',
      email: qs('email')?.value || '',
      perfume_id: Number(select?.value),
      perfume_name: perfume?.name || '',
      city: qs('city')?.value || '',
      province: qs('province')?.value || '',
      postal_code: qs('postal')?.value || '',
      quantity: Number(qs('quantity')?.value || '1'),
      address: qs('address')?.value || '',
      payment_method: qs('payment')?.value || '',
      transaction_id: qs('txn')?.value || '',
      notes: qs('notes')?.value || '',
      discount_percent: store.discount
    };

    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      qs('formStatus').textContent = `Order placed successfully. Tracking ID: ${data.tracking_id}`;
      store.cart = [];
      saveCart();
      renderHeaderCart();
    } catch (e) {
      qs('formStatus').textContent = 'Backend not connected yet. Use WhatsApp button for now.';
    }
  });

  qs('sendWA')?.addEventListener('click', () => {
    const perfume = getProduct(select?.value);

    const payload = {
      full_name: qs('name')?.value || '',
      phone: qs('phone')?.value || '',
      perfume_name: perfume?.name || '',
      quantity: Number(qs('quantity')?.value || '1'),
      city: qs('city')?.value || '',
      province: qs('province')?.value || '',
      address: qs('address')?.value || '',
      payment_method: qs('payment')?.value || ''
    };

    const msg =
      `Thank you for shopping with Amdani Fragrances.%0A%0A` +
      `Your order has been received successfully.%0A` +
      `Please confirm your order.%0A%0A` +
      `Order Details:%0A` +
      `Name: ${encodeURIComponent(payload.full_name)}%0A` +
      `Phone: ${encodeURIComponent(payload.phone)}%0A` +
      `Perfume: ${encodeURIComponent(payload.perfume_name)}%0A` +
      `Quantity: ${payload.quantity}%0A` +
      `City: ${encodeURIComponent(payload.city)}%0A` +
      `Province: ${encodeURIComponent(payload.province)}%0A` +
      `Address: ${encodeURIComponent(payload.address)}%0A` +
      `Payment: ${encodeURIComponent(payload.payment_method)}%0A%0A` +
      `Reply with:%0AYES - Confirm Order%0ANO - Cancel Order`;

    window.open(`https://wa.me/${normalizePhone(payload.phone)}?text=${msg}`, '_blank');
  });
}

function setupTrackingPage() {
  qs('trackBtn')?.addEventListener('click', async () => {
    const id = qs('trackInput')?.value.trim();
    if (!id) return;

    const box = qs('trackResult');

    try {
      const res = await fetch(`${API_BASE}/api/orders/track/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error();

      box.innerHTML = `
        <div class="status-item"><strong>Tracking ID:</strong><span style="margin-left:auto">${data.tracking_id}</span></div>
        <div class="status-item"><strong>Name:</strong><span style="margin-left:auto">${data.full_name}</span></div>
        <div class="status-item"><strong>Perfume:</strong><span style="margin-left:auto">${data.perfume_name}</span></div>
        <div class="status-item"><strong>Status:</strong><span style="margin-left:auto">${data.status}</span></div>
      `;
    } catch (e) {
      box.innerHTML = '<div class="status-item">Order not found</div>';
    }
  });
}

async function initStore() {
  await loadProducts();

  renderHeaderCart();
  renderCartBox();
  initCursorGlow();
  setupFloatingCart();
  setupSpin();
  setupTimer();
  randomPopup();
  setInterval(randomPopup, 7000);

  renderProductsPage();
  renderSummary();
  renderProductDetail();
  renderCartPage();
  setupOrderPage();
  setupTrackingPage();
}

document.addEventListener('DOMContentLoaded', initStore);

window.addToCart = addToCart;
window.updateCartQty = updateCartQty;
