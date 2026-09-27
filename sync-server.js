/**
 * سرور ساده همگام‌سازی برای کلینیک دکتر رامین
 * سازگار با نسخه ۵ برنامه
 *
 * نحوه اجرا:
 *   1. Node.js را نصب کنید
 *   2. در پوشه: npm init -y && npm install express cors
 *   3. node sync-server.js
 *   4. آدرس http://localhost:3000/sync را در تنظیمات برنامه وارد کنید
 *
 * برای هاست رایگان:
 *   - Render.com / Railway.app / Fly.io / Glitch
 *   فقط این فایل + package.json را آپلود کنید
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'clinic-data.json');
const SECRET_KEY = process.env.SYNC_KEY || ''; // اختیاری: کلید محیطی

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// بارگذاری داده
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Load error:', e.message);
  }
  return null;
}

// ذخیره داده
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// GET /sync?key=xxx  →  { data: snapshot }
app.get('/sync', (req, res) => {
  const key = req.query.key || '';
  if (SECRET_KEY && key !== SECRET_KEY) {
    return res.status(403).json({ error: 'کلید نامعتبر' });
  }
  const data = loadData();
  if (!data) {
    return res.json({ data: null, message: 'هنوز داده‌ای ذخیره نشده' });
  }
  res.json({ data });
});

// PUT /sync  body: { key: '', data: snapshot }
app.put('/sync', (req, res) => {
  const { key, data } = req.body || {};
  if (SECRET_KEY && key !== SECRET_KEY) {
    return res.status(403).json({ error: 'کلید نامعتبر' });
  }
  if (!data) {
    return res.status(400).json({ error: 'داده ارسال نشده' });
  }
  try {
    saveData(data);
    console.log('Synced at', new Date().toISOString());
    res.json({ ok: true, at: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// سلامت
app.get('/', (req, res) => {
  res.send(`
    <h2>سرور همگام‌سازی کلینیک دکتر رامین</h2>
    <p>وضعیت: فعال ✓</p>
    <p>آدرس همگام‌سازی: <code>${req.protocol}://${req.get('host')}/sync</code></p>
    <p>این آدرس را در تنظیمات برنامه وارد کنید.</p>
  `);
});

app.listen(PORT, () => {
  console.log(`Sync server running on http://localhost:${PORT}`);
  console.log(`Use URL: http://localhost:${PORT}/sync`);
});
