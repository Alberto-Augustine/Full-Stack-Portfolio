const express  = require('express');
const path     = require('path');
const mongoose = require('mongoose');
const fs       = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ========================
//  MONGODB — Vercel-safe connection
//  Reuses existing connection across serverless invocations
// ========================
const MONGO_URI = process.env.MONGO_URI || 'mongodb://Alberto:Alberto2025@ac-wghpbuv-shard-00-00.kzqqte9.mongodb.net:27017,ac-wghpbuv-shard-00-01.kzqqte9.mongodb.net:27017,ac-wghpbuv-shard-00-02.kzqqte9.mongodb.net:27017/?ssl=true&replicaSet=atlas-106090-shard-0&authSource=admin&appName=alberto-portfolio';

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB error:', err.message);
    throw err;
  }
}

// ========================
//  LEAD SCHEMA
// ========================
const leadSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  phone:     { type: String, trim: true, default: 'Not provided' },
  email:     { type: String, required: true, trim: true },
  message:   { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
});

const Lead = mongoose.models.Lead || mongoose.model('Lead', leadSchema);

// ========================
//  MIDDLEWARE
// ========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ========================
//  POST /api/contact — Save lead
// ========================
app.post('/api/contact', async (req, res) => {
  try {
    await connectDB();

    const { name, phone, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address.' });
    }

    const lead = await Lead.create({
      name:    name.trim(),
      phone:   phone?.trim() || 'Not provided',
      email:   email.trim(),
      message: message.trim()
    });

    console.log('\n🔔 NEW LEAD SAVED!');
    console.log('═══════════════════════════════');
    console.log(`👤 Name    : ${lead.name}`);
    console.log(`📱 Phone   : ${lead.phone}`);
    console.log(`📧 Email   : ${lead.email}`);
    console.log(`💬 Message : ${lead.message}`);
    console.log(`🆔 DB ID   : ${lead._id}`);
    console.log('═══════════════════════════════\n');

    res.json({ success: true, message: 'Message sent!', leadId: lead._id });

  } catch (err) {
    console.error('Contact error:', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ========================
//  GET /api/leads — Fetch all leads
// ========================
app.get('/api/leads', async (req, res) => {
  try {
    await connectDB();

    const token = req.headers['x-admin-token'];
    if (token !== 'alberto2025') {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const leads = await Lead.find().sort({ createdAt: 1 }).lean();
    res.json({ success: true, total: leads.length, leads });

  } catch (err) {
    console.error('Leads fetch error:', err.message);
    res.status(500).json({ success: false, message: 'Database error: ' + err.message });
  }
});

// ========================
//  GET /api/health
// ========================
app.get('/api/health', async (req, res) => {
  try {
    await connectDB();
    res.json({ status: 'ok', db: 'connected', message: 'Alberto Portfolio API 🚀' });
  } catch {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

// ========================
//  ADMIN DASHBOARD
// ========================
app.get('/admin', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Alberto — Leads Admin</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400&family=Bodoni+Moda:ital,opsz,wght@1,6..96,600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #04040a; color: #fef2f2; font-family: 'DM Mono', monospace; min-height: 100vh; }
    .login-wrap { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .login-box { background: rgba(26,5,5,0.7); border: 1px solid rgba(153,27,27,0.3); border-radius: 10px; padding: 2.5rem; width: 360px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
    .login-box h1 { font-family: 'Bodoni Moda', serif; font-size: 1.6rem; font-style: italic; margin-bottom: 0.3rem; }
    .login-box p { font-size: 0.7rem; color: rgba(254,242,242,0.45); margin-bottom: 2rem; letter-spacing: 0.08em; }
    input[type=password] { width: 100%; background: rgba(4,4,10,0.6); border: 1px solid rgba(153,27,27,0.3); border-radius: 4px; color: #fef2f2; font-family: 'DM Mono', monospace; font-size: 0.9rem; padding: 0.8rem 1rem; outline: none; margin-bottom: 1rem; transition: border-color 0.3s; }
    input[type=password]:focus { border-color: #ef4444; }
    button { width: 100%; background: linear-gradient(130deg, #991b1b, #dc2626); border: none; color: #fef2f2; font-family: 'DM Mono', monospace; font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase; padding: 0.85rem; border-radius: 3px; cursor: pointer; transition: all 0.3s; }
    button:hover { box-shadow: 0 6px 24px rgba(220,38,38,0.5); transform: translateY(-1px); }
    .error-msg { color: #f87171; font-size: 0.7rem; margin-top: 0.5rem; display: none; }
    .dashboard { display: none; padding: 2.5rem; max-width: 1100px; margin: 0 auto; }
    .dash-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2.5rem; border-bottom: 1px solid rgba(153,27,27,0.2); padding-bottom: 1.5rem; }
    .dash-header h1 { font-family: 'Bodoni Moda', serif; font-size: 1.8rem; font-style: italic; }
    .dash-header h1 span { color: #ef4444; }
    .badge { background: rgba(153,27,27,0.3); border: 1px solid rgba(239,68,68,0.3); color: #f87171; padding: 0.3rem 0.9rem; border-radius: 100px; font-size: 0.68rem; letter-spacing: 0.1em; }
    .logout-btn { background: transparent !important; border: 1px solid rgba(153,27,27,0.3) !important; color: rgba(254,242,242,0.5) !important; font-size: 0.65rem; padding: 0.4rem 1rem; width: auto !important; box-shadow: none !important; transform: none !important; }
    .logout-btn:hover { border-color: #ef4444 !important; color: #ef4444 !important; }
    .empty { text-align: center; padding: 4rem; color: rgba(254,242,242,0.3); font-size: 0.85rem; letter-spacing: 0.1em; }
    .lead-card { background: rgba(16,5,5,0.7); border: 1px solid rgba(153,27,27,0.22); border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; transition: border-color 0.3s; position: relative; }
    .lead-card:hover { border-color: rgba(239,68,68,0.4); }
    .lead-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
    .lead-name { font-family: 'Bodoni Moda', serif; font-size: 1.2rem; font-style: italic; }
    .lead-time { font-size: 0.62rem; color: rgba(254,242,242,0.35); letter-spacing: 0.06em; }
    .lead-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin-bottom: 1rem; }
    .lead-field label { display: block; font-size: 0.58rem; letter-spacing: 0.14em; text-transform: uppercase; color: #991b1b; margin-bottom: 0.2rem; }
    .lead-field span { font-size: 0.82rem; color: rgba(254,242,242,0.8); }
    .lead-message { background: rgba(4,4,10,0.5); border: 1px solid rgba(153,27,27,0.15); border-radius: 4px; padding: 0.8rem; font-size: 0.82rem; color: rgba(254,242,242,0.7); line-height: 1.6; }
    .lead-num { position: absolute; top: 1rem; right: 1rem; font-size: 0.6rem; color: rgba(254,242,242,0.15); }
    .refresh-btn { background: transparent !important; border: 1px solid rgba(153,27,27,0.3) !important; color: #f87171 !important; font-size: 0.65rem; padding: 0.4rem 1rem; width: auto !important; margin-right: 0.5rem; }
  </style>
</head>
<body>
  <div class="login-wrap" id="loginWrap">
    <div class="login-box">
      <h1>Alberto<span style="color:#ef4444">.</span></h1>
      <p>LEADS ADMIN DASHBOARD</p>
      <input type="password" id="passInput" placeholder="Enter admin password" onkeydown="if(event.key==='Enter') doLogin()"/>
      <button onclick="doLogin()">Access Dashboard</button>
      <p class="error-msg" id="loginError">Incorrect password. Try again.</p>
    </div>
  </div>

  <div class="dashboard" id="dashboard">
    <div class="dash-header">
      <div style="display:flex;align-items:center;gap:1rem">
        <h1>Leads <span>Dashboard</span></h1>
        <span class="badge" id="totalBadge">0 leads</span>
      </div>
      <div>
        <button class="refresh-btn" onclick="loadLeads()">Refresh</button>
        <button class="logout-btn" onclick="doLogout()">Logout</button>
      </div>
    </div>
    <div id="leadsContainer"><div class="empty">Loading leads...</div></div>
  </div>

  <script>
    const PASS = 'alberto2025';

    function doLogin() {
      if (document.getElementById('passInput').value === PASS) {
        document.getElementById('loginWrap').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadLeads();
      } else {
        document.getElementById('loginError').style.display = 'block';
      }
    }

    function doLogout() {
      document.getElementById('loginWrap').style.display = 'flex';
      document.getElementById('dashboard').style.display = 'none';
      document.getElementById('passInput').value = '';
    }

    async function loadLeads() {
      document.getElementById('leadsContainer').innerHTML = '<div class="empty">Loading...</div>';
      try {
        const res  = await fetch('/api/leads', { headers: { 'x-admin-token': PASS } });
        const data = await res.json();

        document.getElementById('totalBadge').textContent = data.total + ' lead' + (data.total !== 1 ? 's' : '');

        if (!data.leads || data.leads.length === 0) {
          document.getElementById('leadsContainer').innerHTML = '<div class="empty">No leads yet. Share your portfolio!</div>';
          return;
        }

        const sorted = [...data.leads].reverse();
        document.getElementById('leadsContainer').innerHTML = sorted.map((lead, i) => \`
          <div class="lead-card">
            <span class="lead-num">#\${sorted.length - i}</span>
            <div class="lead-top">
              <span class="lead-name">\${lead.name}</span>
              <span class="lead-time">\${new Date(lead.createdAt).toLocaleString('en-IN')}</span>
            </div>
            <div class="lead-fields">
              <div class="lead-field"><label>Email</label><span>\${lead.email}</span></div>
              <div class="lead-field"><label>Phone</label><span>\${lead.phone}</span></div>
            </div>
            <div class="lead-message">\${lead.message}</div>
          </div>
        \`).join('');
      } catch (err) {
        document.getElementById('leadsContainer').innerHTML = '<div class="empty">Error loading leads: ' + err.message + '</div>';
      }
    }
  </script>
</body>
</html>`);
});

// ========================
//  CATCH ALL — Serve index.html
// ========================
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Site not found.');
  }
});

app.listen(PORT, () => {
  console.log(`\n⚡ Alberto Portfolio Server`);
  console.log(`🌐 Running at  : http://localhost:${PORT}`);
  console.log(`🗄️  Database    : MongoDB Atlas`);
  console.log(`📋 Admin panel : http://localhost:${PORT}/admin\n`);
});

module.exports = app;
