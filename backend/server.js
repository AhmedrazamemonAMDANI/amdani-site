const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 8080;

const dbDir = path.join(__dirname, "db");
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new sqlite3.Database(path.join(dbDir, "amdani.sqlite"));
const productsSeed = JSON.parse(
  fs.readFileSync(path.join(dbDir, "products.seed.json"), "utf8")
);

app.use(cors());
app.use(express.json());

app.use("/store", express.static(path.join(__dirname, "..", "frontend")));
app.use("/admin", express.static(path.join(__dirname, "..", "admin")));

app.get("/", (req, res) => res.redirect("/store/index.html"));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tracking_id TEXT UNIQUE,
    full_name TEXT,
    phone TEXT,
    email TEXT,
    perfume_id INTEGER,
    perfume_name TEXT,
    city TEXT,
    province TEXT,
    postal_code TEXT,
    quantity INTEGER DEFAULT 1,
    address TEXT,
    payment_method TEXT,
    transaction_id TEXT,
    notes TEXT,
    discount_percent INTEGER DEFAULT 0,
    total_amount INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    name TEXT,
    category TEXT,
    type TEXT,
    old_price INTEGER,
    price INTEGER,
    badge TEXT,
    stock INTEGER,
    lasting TEXT,
    inspired_by TEXT,
    top_notes TEXT,
    heart_notes TEXT,
    base_notes TEXT,
    longevity TEXT,
    projection TEXT,
    best_for TEXT,
    description TEXT,
    reviews_json TEXT
  )`);

  db.get(`SELECT COUNT(*) count FROM products`, [], (err, row) => {
    if (row && row.count === 0) {
      const stmt = db.prepare(`INSERT INTO products (
        id,name,category,type,old_price,price,badge,stock,lasting,inspired_by,top_notes,heart_notes,base_notes,longevity,projection,best_for,description,reviews_json
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);

      for (const p of productsSeed) {
        stmt.run(
          p.id,
          p.name,
          p.category,
          p.type,
          p.old_price,
          p.price,
          p.badge,
          p.stock,
          p.lasting,
          p.inspired_by,
          p.top_notes,
          p.heart_notes,
          p.base_notes,
          p.longevity,
          p.projection,
          p.best_for,
          p.description,
          p.reviews_json
        );
      }

      stmt.finalize();
    }
  });
});

function generateTrackingId() {
  return "AF" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/products", (req, res) => {
  db.all(`SELECT * FROM products ORDER BY id ASC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Failed to fetch products" });
    res.json({ products: rows });
  });
});

app.get("/api/products/:id", (req, res) => {
  db.get(`SELECT * FROM products WHERE id=?`, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: "Failed to fetch product" });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  });
});

app.post("/api/spin", (req, res) => {
  const vals = [5, 6, 7, 8, 9, 10];
  res.json({ discount: vals[Math.floor(Math.random() * vals.length)] });
});

app.post("/api/orders", (req, res) => {
  const o = req.body || {};

  if (!o.full_name || !o.phone || !o.perfume_name || !o.address) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  db.get(`SELECT price FROM products WHERE name=?`, [o.perfume_name], (err, row) => {
    if (err || !row) {
      return res.status(500).json({ error: "Failed to find product" });
    }

    const basePrice = Number(row.price || 0);
    const qty = Number(o.quantity || 1);
    const discount = Number(o.discount_percent || 0);
    const total = Math.round((basePrice * qty) - (basePrice * qty * (discount / 100)));
    const trackingId = generateTrackingId();

    db.run(
      `INSERT INTO orders (
        tracking_id, full_name, phone, email, perfume_id, perfume_name,
        city, province, postal_code, quantity, address, payment_method,
        transaction_id, notes, discount_percent, total_amount, status
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'pending')`,
      [
        trackingId,
        o.full_name,
        o.phone,
        o.email || "",
        o.perfume_id || null,
        o.perfume_name,
        o.city || "",
        o.province || "",
        o.postal_code || "",
        qty,
        o.address,
        o.payment_method || "",
        o.transaction_id || "",
        o.notes || "",
        discount,
        total
      ],
      function(insertErr) {
        if (insertErr) {
          return res.status(500).json({ error: "Failed to save order" });
        }

        res.json({
          success: true,
          order_id: this.lastID,
          tracking_id: trackingId,
          total_amount: total
        });
      }
    );
  });
});

app.get("/api/orders/track/:trackingId", (req, res) => {
  db.get(`SELECT * FROM orders WHERE tracking_id=?`, [req.params.trackingId], (err, row) => {
    if (err) return res.status(500).json({ error: "Failed to fetch order" });
    if (!row) return res.status(404).json({ error: "Order not found" });
    res.json(row);
  });
});

app.get("/api/admin/orders", (req, res) => {
  db.all(`SELECT * FROM orders ORDER BY id DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Failed to fetch orders" });
    res.json({ orders: rows });
  });
});

app.patch("/api/admin/orders/:id/status", (req, res) => {
  const { status } = req.body || {};
  const allowed = ["pending", "confirmed", "shipped", "delivered"];

  if (!allowed.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  db.run(`UPDATE orders SET status=? WHERE id=?`, [status, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: "Failed to update status" });
    res.json({ success: true });
  });
});

app.get("/api/admin/stats", (req, res) => {
  db.get(
    `SELECT
      COUNT(*) total_orders,
      SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) pending_orders,
      SUM(CASE WHEN status='delivered' THEN 1 ELSE 0 END) delivered_orders,
      COALESCE(SUM(total_amount),0) total_revenue
     FROM orders`,
    [],
    (err, row) => {
      if (err) return res.status(500).json({ error: "Failed to fetch stats" });
      res.json(row);
    }
  );
});

app.patch("/api/admin/products/:id", (req, res) => {
  const p = req.body || {};

  db.run(
    `UPDATE products SET
      name=COALESCE(?,name),
      category=COALESCE(?,category),
      type=COALESCE(?,type),
      price=COALESCE(?,price),
      old_price=COALESCE(?,old_price),
      stock=COALESCE(?,stock),
      badge=COALESCE(?,badge),
      lasting=COALESCE(?,lasting),
      inspired_by=COALESCE(?,inspired_by),
      top_notes=COALESCE(?,top_notes),
      heart_notes=COALESCE(?,heart_notes),
      base_notes=COALESCE(?,base_notes),
      longevity=COALESCE(?,longevity),
      projection=COALESCE(?,projection),
      best_for=COALESCE(?,best_for),
      description=COALESCE(?,description),
      reviews_json=COALESCE(?,reviews_json)
     WHERE id=?`,
    [
      p.name,
      p.category,
      p.type,
      p.price,
      p.old_price,
      p.stock,
      p.badge,
      p.lasting,
      p.inspired_by,
      p.top_notes,
      p.heart_notes,
      p.base_notes,
      p.longevity,
      p.projection,
      p.best_for,
      p.description,
      p.reviews_json,
      req.params.id
    ],
    function(err) {
      if (err) return res.status(500).json({ error: "Failed to update product" });
      res.json({ success: true });
    }
  );
});

app.post("/api/admin/products", (req, res) => {
  const p = req.body || {};

  db.run(
    `INSERT INTO products (
      name,category,type,old_price,price,badge,stock,lasting,
      inspired_by,top_notes,heart_notes,base_notes,longevity,
      projection,best_for,description,reviews_json
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      p.name || '',
      p.category || '',
      p.type || '',
      p.old_price || 0,
      p.price || 0,
      p.badge || '',
      p.stock || 0,
      p.lasting || '12 Hours',
      p.inspired_by || '',
      p.top_notes || '',
      p.heart_notes || '',
      p.base_notes || '',
      p.longevity || '',
      p.projection || '',
      p.best_for || '',
      p.description || '',
      p.reviews_json || '[]'
    ],
    function(err) {
      if (err) return res.status(500).json({ error: "Failed to add product" });
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.delete("/api/admin/products/:id", (req, res) => {
  db.run(`DELETE FROM products WHERE id=?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: "Failed to delete product" });
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Amdani backend running on http://localhost:${PORT}`);
  console.log(`Store: http://localhost:${PORT}/store/index.html`);
  console.log(`Admin: http://localhost:${PORT}/admin/index.html`);
});
