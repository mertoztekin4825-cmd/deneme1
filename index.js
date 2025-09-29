require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const helmet = require('helmet');
const csurf = require('csurf');
const bcrypt = require('bcrypt');
const multer = require('multer');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const SESSION_SECRET = process.env.SESSION_SECRET || 'super-secret-yesil-market';
const DB_PATH = path.join(__dirname, 'db', 'yesilmarket.sqlite');
const SCHEMA_PATH = path.join(__dirname, 'db', 'schema.sql');
const SEED_PATH = path.join(__dirname, 'db', 'seed.sql');

const needsBootstrap = !fs.existsSync(DB_PATH);
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

if (needsBootstrap) {
  if (fs.existsSync(SCHEMA_PATH)) {
    db.exec(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
  }
  if (fs.existsSync(SEED_PATH)) {
    db.exec(fs.readFileSync(SEED_PATH, 'utf-8'));
  }
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, 'public', 'img')),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.jpg';
      const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '-');
      cb(null, `${base}-${Date.now()}${ext}`);
    }
  }),
  limits: { fileSize: 2 * 1024 * 1024 }
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(helmet());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 1000 * 60 * 60 * 2
  }
}));
app.use(flash());
app.use(csurf());

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.locals.currentUser = req.session.user || null;
  res.locals.flash = {
    success: req.flash('success'),
    error: req.flash('error')
  };
  const cart = req.session.cart || { items: {}, totals: { count: 0, subtotal: 0, tax: 0, total: 0 } };
  res.locals.cartCount = cart.totals.count || 0;
  res.locals.isAdmin = req.session.user && req.session.user.email === 'admin@yesilmarket.com';
  next();
});

const ensureAuth = (req, res, next) => {
  if (!req.session.user) {
    req.flash('error', 'Lütfen giriş yapın.');
    return res.redirect('/login');
  }
  next();
};

const ensureAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.email !== 'admin@yesilmarket.com') {
    req.flash('error', 'Bu alana erişim yetkiniz yok.');
    return res.redirect('/');
  }
  next();
};

const getCart = (req) => {
  if (!req.session.cart) {
    req.session.cart = { items: {}, totals: { count: 0, subtotal: 0, tax: 0, total: 0 } };
  }
  return req.session.cart;
};

const updateCartTotals = (cart) => {
  let count = 0;
  let subtotal = 0;
  for (const item of Object.values(cart.items)) {
    count += item.qty;
    subtotal += item.qty * item.product.price;
  }
  cart.totals = {
    count,
    subtotal,
    tax: subtotal * 0.08,
    total: subtotal * 1.08
  };
};

const formatCurrency = (value) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(value) || 0);

app.locals.formatCurrency = formatCurrency;
app.locals.formatDate = (date) => {
  if (!date) return '';
  const value = typeof date === 'string' ? date.replace(' ', 'T') : date;
  return new Date(value).toLocaleDateString('tr-TR');
};

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
  const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC LIMIT 12').all();
  const bannerAds = db.prepare('SELECT * FROM ads WHERE is_active = 1 AND position = ? ORDER BY created_at DESC').all('banner');
  const sideAds = db.prepare('SELECT * FROM ads WHERE is_active = 1 AND position = ? ORDER BY created_at DESC').all('sidebar');

  res.render('layout', {
    body: 'pages/home',
    title: 'Yeşil Market',
    categories,
    products,
    bannerAds,
    sideAds
  });
});

app.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.redirect('/');
  }
  const term = `%${q.toLowerCase()}%`;
  const results = db.prepare(`
    SELECT products.*
    FROM products
    LEFT JOIN categories ON categories.id = products.category_id
    WHERE LOWER(products.name) LIKE ? OR LOWER(categories.name) LIKE ?
    ORDER BY products.name
  `).all(term, term);
  res.render('layout', {
    body: 'pages/home',
    title: `Arama Sonuçları: ${q}`,
    categories: db.prepare('SELECT * FROM categories ORDER BY name').all(),
    products: results,
    bannerAds: db.prepare('SELECT * FROM ads WHERE is_active = 1 AND position = ? ORDER BY created_at DESC').all('banner'),
    sideAds: db.prepare('SELECT * FROM ads WHERE is_active = 1 AND position = ? ORDER BY created_at DESC').all('sidebar'),
    searchQuery: q
  });
});

app.get('/product/:slug', (req, res, next) => {
  const product = db.prepare('SELECT * FROM products WHERE slug = ?').get(req.params.slug);
  if (!product) {
    return next();
  }
  res.render('layout', {
    body: 'pages/product',
    title: product.name,
    product
  });
});

app.get('/ads', (req, res) => {
  const bannerAds = db.prepare('SELECT * FROM ads WHERE is_active = 1 ORDER BY created_at DESC').all();
  res.render('layout', {
    body: 'pages/ads',
    title: 'Reklam Alanı',
    bannerAds
  });
});

app.get('/register', (req, res) => {
  res.render('layout', {
    body: 'pages/register', title: 'Üye Ol' });
});

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    req.flash('error', 'Tüm alanlar zorunludur.');
    return res.redirect('/register');
  }
  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      req.flash('error', 'Bu e-posta ile kayıtlı bir hesap zaten var.');
      return res.redirect('/register');
    }
    const hash = await bcrypt.hash(password, 10);
    const result = db.prepare('INSERT INTO users (name, email, hash) VALUES (?, ?, ?)').run(name, email, hash);
    req.session.user = { id: result.lastInsertRowid, name, email };
    req.flash('success', 'Hoş geldiniz!');
    res.redirect('/');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Kayıt sırasında bir hata oluştu.');
    res.redirect('/register');
  }
});

app.get('/login', (req, res) => {
  res.render('layout', {
    body: 'pages/login', title: 'Giriş Yap' });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    req.flash('error', 'Tüm alanlar zorunludur.');
    return res.redirect('/login');
  }
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      req.flash('error', 'Geçersiz e-posta veya şifre.');
      return res.redirect('/login');
    }
    const match = await bcrypt.compare(password, user.hash);
    if (!match) {
      req.flash('error', 'Geçersiz e-posta veya şifre.');
      return res.redirect('/login');
    }
    req.session.user = { id: user.id, name: user.name, email: user.email };
    req.flash('success', 'Tekrar hoş geldiniz!');
    res.redirect('/');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Giriş sırasında bir hata oluştu.');
    res.redirect('/login');
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.get('/cart', (req, res) => {
  const cart = getCart(req);
  updateCartTotals(cart);
  res.render('layout', {
    body: 'pages/cart',
    title: 'Sepetiniz',
    cart
  });
});

app.post('/cart/add', (req, res) => {
  const { product_id, qty } = req.body;
  const quantity = Math.max(1, parseInt(qty, 10) || 1);
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
  if (!product) {
    req.flash('error', 'Ürün bulunamadı.');
    return res.redirect('back');
  }
  const cart = getCart(req);
  if (!cart.items[product.id]) {
    cart.items[product.id] = { product, qty: 0 };
  }
  cart.items[product.id].qty = Math.min(product.stock, cart.items[product.id].qty + quantity);
  updateCartTotals(cart);
  req.flash('success', `${product.name} sepete eklendi.`);
  res.redirect('/cart');
});

app.post('/cart/update', (req, res) => {
  const { product_id, qty } = req.body;
  const quantity = Math.max(1, parseInt(qty, 10) || 1);
  const cart = getCart(req);
  if (cart.items[product_id]) {
    const maxQty = cart.items[product_id].product.stock || quantity;
    cart.items[product_id].qty = Math.min(quantity, maxQty);
  }
  updateCartTotals(cart);
  res.redirect('/cart');
});

app.post('/cart/remove', (req, res) => {
  const { product_id } = req.body;
  const cart = getCart(req);
  delete cart.items[product_id];
  updateCartTotals(cart);
  res.redirect('/cart');
});

app.get('/checkout', ensureAuth, (req, res) => {
  const cart = getCart(req);
  updateCartTotals(cart);
  if (cart.totals.count === 0) {
    req.flash('error', 'Sepetiniz boş.');
    return res.redirect('/cart');
  }
  res.render('layout', {
    body: 'pages/checkout',
    title: 'Ödeme',
    cart
  });
});

app.post('/checkout', ensureAuth, (req, res) => {
  const cart = getCart(req);
  updateCartTotals(cart);
  if (cart.totals.count === 0) {
    req.flash('error', 'Sepetiniz boş.');
    return res.redirect('/cart');
  }
  const { address } = req.body;
  if (!address) {
    req.flash('error', 'Teslimat adresi zorunludur.');
    return res.redirect('/checkout');
  }
  const now = new Date().toISOString();
  const orderStmt = db.prepare('INSERT INTO orders (user_id, total, status, address, created_at) VALUES (?, ?, ?, ?, ?)');
  const orderItemStmt = db.prepare('INSERT INTO order_items (order_id, product_id, qty, price) VALUES (?, ?, ?, ?)');

  const transaction = db.transaction((userId) => {
    const orderResult = orderStmt.run(userId, Number(cart.totals.total.toFixed(2)), 'Hazırlanıyor', address, now);
    const orderId = orderResult.lastInsertRowid;
    for (const item of Object.values(cart.items)) {
      const stockRow = db.prepare('SELECT stock FROM products WHERE id = ?').get(item.product.id);
      if (!stockRow || stockRow.stock < item.qty) {
        throw new Error('STOCK_UNAVAILABLE');
      }
      orderItemStmt.run(orderId, item.product.id, item.qty, item.product.price);
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.qty, item.product.id);
    }
    return orderId;
  });

  try {
    const orderId = transaction(req.session.user.id);
    req.session.cart = { items: {}, totals: { count: 0, subtotal: 0, tax: 0, total: 0 } };
    req.flash('success', `Siparişiniz alındı. Sipariş numarası #${orderId}.`);
    res.redirect('/orders');
  } catch (err) {
    console.error(err);
    const message = err && err.message === 'STOCK_UNAVAILABLE' ? 'Stok yetersiz. Lütfen sepetinizi güncelleyin.' : 'Ödeme sırasında bir sorun oluştu.';
    req.flash('error', message);
    res.redirect('/checkout');
  }
});

app.get('/profile', ensureAuth, (req, res) => {
  const profile = db.prepare('SELECT name, email, created_at FROM users WHERE id = ?').get(req.session.user.id) || req.session.user;
  res.render('layout', {
    body: 'pages/profile',
    title: 'Profilim',
    profile
  });
});

app.get('/orders', ensureAuth, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.session.user.id);
  const itemsStmt = db.prepare('SELECT order_items.*, products.name FROM order_items JOIN products ON products.id = order_items.product_id WHERE order_id = ?');
  const ordersWithItems = orders.map((order) => ({
    ...order,
    items: itemsStmt.all(order.id)
  }));
  res.render('layout', {
    body: 'pages/orders',
    title: 'Siparişlerim',
    orders: ordersWithItems
  });
});

app.get('/admin', ensureAdmin, (req, res) => {
  const stats = {
    productCount: db.prepare('SELECT COUNT(*) AS count FROM products').get().count,
    orderCount: db.prepare('SELECT COUNT(*) AS count FROM orders').get().count,
    adCount: db.prepare('SELECT COUNT(*) AS count FROM ads').get().count
  };
  res.render('layout', {
    body: 'admin/dashboard',
    title: 'Yönetim Paneli',
    stats
  });
});

app.get('/admin/products', ensureAdmin, (req, res) => {
  const products = db.prepare('SELECT products.*, categories.name AS category_name FROM products JOIN categories ON categories.id = products.category_id ORDER BY products.created_at DESC').all();
  const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
  res.render('layout', {
    body: 'admin/products',
    title: 'Ürün Yönetimi',
    products,
    categories
  });
});

app.post('/admin/product/create', ensureAdmin, upload.single('image'), (req, res) => {
  const { name, slug, price, unit, stock, category_id, description } = req.body;
  if (!name || !price || !unit || !stock || !category_id) {
    req.flash('error', 'Lütfen zorunlu alanları doldurun.');
    return res.redirect('/admin/products');
  }
  const numericPrice = parseFloat(price);
  const numericStock = parseInt(stock, 10);
  if (Number.isNaN(numericPrice) || numericPrice <= 0 || Number.isNaN(numericStock) || numericStock < 0) {
    req.flash('error', 'Fiyat ve stok değerlerini kontrol edin.');
    return res.redirect('/admin/products');
  }
  const slugValue = slug && slug.trim() ? slug.trim() : name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const now = new Date().toISOString();
  const imagePath = req.file ? `/img/${req.file.filename}` : null;
  try {
    db.prepare('INSERT INTO products (category_id, name, slug, price, unit, stock, image, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(category_id, name, slugValue, numericPrice, unit, numericStock, imagePath, description, now);
    req.flash('success', 'Ürün eklendi.');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Ürün eklenemedi.');
  }
  res.redirect('/admin/products');
});

app.post('/admin/product/update', ensureAdmin, upload.single('image'), (req, res) => {
  const { id, name, slug, price, unit, stock, category_id, description } = req.body;
  if (!id) {
    req.flash('error', 'Ürün bulunamadı.');
    return res.redirect('/admin/products');
  }
  const numericPrice = parseFloat(price);
  const numericStock = parseInt(stock, 10);
  if (Number.isNaN(numericPrice) || numericPrice <= 0 || Number.isNaN(numericStock) || numericStock < 0) {
    req.flash('error', 'Fiyat ve stok değerlerini kontrol edin.');
    return res.redirect('/admin/products');
  }
  const slugValue = slug && slug.trim() ? slug.trim() : name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const imagePath = req.file ? `/img/${req.file.filename}` : null;
  try {
    const query = imagePath
      ? 'UPDATE products SET category_id=?, name=?, slug=?, price=?, unit=?, stock=?, image=?, description=? WHERE id=?'
      : 'UPDATE products SET category_id=?, name=?, slug=?, price=?, unit=?, stock=?, description=? WHERE id=?';
    const params = imagePath
      ? [category_id, name, slugValue, numericPrice, unit, numericStock, imagePath, description, id]
      : [category_id, name, slugValue, numericPrice, unit, numericStock, description, id];
    db.prepare(query).run(...params);
    req.flash('success', 'Ürün güncellendi.');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Ürün güncellenemedi.');
  }
  res.redirect('/admin/products');
});

app.post('/admin/product/delete', ensureAdmin, (req, res) => {
  const { id } = req.body;
  if (!id) {
    req.flash('error', 'Ürün bulunamadı.');
    return res.redirect('/admin/products');
  }
  try {
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    req.flash('success', 'Ürün silindi.');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Ürün silinemedi.');
  }
  res.redirect('/admin/products');
});

app.get('/admin/ads', ensureAdmin, (req, res) => {
  const ads = db.prepare('SELECT * FROM ads ORDER BY created_at DESC').all();
  res.render('layout', {
    body: 'admin/ads',
    title: 'Reklam Yönetimi',
    ads
  });
});

app.post('/admin/ad/create', ensureAdmin, upload.single('image'), (req, res) => {
  const { title, link, position } = req.body;
  if (!title || !position) {
    req.flash('error', 'Başlık ve pozisyon zorunludur.');
    return res.redirect('/admin/ads');
  }
  const imagePath = req.file ? `/img/${req.file.filename}` : null;
  const now = new Date().toISOString();
  try {
    db.prepare('INSERT INTO ads (title, image, link, is_active, position, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(title, imagePath, link, 1, position, now);
    req.flash('success', 'Reklam eklendi.');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Reklam eklenemedi.');
  }
  res.redirect('/admin/ads');
});

app.post('/admin/ad/update', ensureAdmin, upload.single('image'), (req, res) => {
  const { id, title, link, position } = req.body;
  if (!id) {
    req.flash('error', 'Reklam bulunamadı.');
    return res.redirect('/admin/ads');
  }
  const imagePath = req.file ? `/img/${req.file.filename}` : null;
  try {
    const query = imagePath
      ? 'UPDATE ads SET title=?, link=?, position=?, image=? WHERE id=?'
      : 'UPDATE ads SET title=?, link=?, position=? WHERE id=?';
    const params = imagePath
      ? [title, link, position, imagePath, id]
      : [title, link, position, id];
    db.prepare(query).run(...params);
    req.flash('success', 'Reklam güncellendi.');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Reklam güncellenemedi.');
  }
  res.redirect('/admin/ads');
});

app.post('/admin/ad/toggle', ensureAdmin, (req, res) => {
  const { id } = req.body;
  if (!id) {
    req.flash('error', 'Reklam bulunamadı.');
    return res.redirect('/admin/ads');
  }
  try {
    const ad = db.prepare('SELECT is_active FROM ads WHERE id = ?').get(id);
    const newStatus = ad && ad.is_active ? 0 : 1;
    db.prepare('UPDATE ads SET is_active = ? WHERE id = ?').run(newStatus, id);
    req.flash('success', 'Reklam durumu güncellendi.');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Reklam durumu değiştirilemedi.');
  }
  res.redirect('/admin/ads');
});

app.use((req, res) => {
  res.status(404).render('layout', {
    body: 'pages/404', title: 'Sayfa Bulunamadı' });
});

app.use((err, req, res, next) => {
  console.error('Beklenmeyen hata:', err);
  if (err.code === 'EBADCSRFTOKEN') {
    req.flash('error', 'Form güvenlik doğrulaması başarısız oldu.');
    return res.redirect('back');
  }
  res.status(500).render('layout', {
    body: 'pages/500', title: 'Sunucu Hatası' });
});

app.listen(PORT, HOST, () => {
  console.log(`Listening on http://${HOST}:${PORT}`);
});
