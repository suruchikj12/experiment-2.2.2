// ─────────────────────────────────────────────────────────────────────────────
// server.js — Entry point
// No MongoDB needed. Users stored in data/users.json
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const authRoutes = require('./routes/authRoutes');
const bankRoutes = require('./routes/bankRoutes');

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Serve frontend static files ───────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'frontend')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/bank', bankRoutes);

// ── API info ──────────────────────────────────────────────────────────────────
app.get('/api', (req, res) => {
  res.json({
    status:  '✅ Banking JWT API is running',
    storage: 'JSON flat-file (data/users.json)',
    routes: {
      auth: [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'POST /api/auth/refresh',
        'POST /api/auth/logout',
        'GET  /api/auth/me          (protected)',
      ],
      bank: [
        'GET  /api/bank/balance          (protected)',
        'POST /api/bank/deposit          (protected)',
        'POST /api/bank/withdraw         (protected)',
        'POST /api/bank/transfer         (protected)',
        'GET  /api/bank/admin/users      (admin only)',
        'GET  /api/bank/admin/stats      (admin only)',
      ],
    },
  });
});

// ── Catch-all: serve frontend for any non-API route ──────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📂 Users stored in: data/users.json`);
  console.log(`🌐 Frontend at:     http://localhost:${PORT}`);
  console.log(`📡 API info at:     http://localhost:${PORT}/api`);
});
