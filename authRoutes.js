// ─────────────────────────────────────────────────────────────────────────────
// routes/bankRoutes.js
// GET  /api/bank/balance          — check own balance
// POST /api/bank/deposit          — deposit money
// POST /api/bank/withdraw         — withdraw money
// POST /api/bank/transfer         — transfer to another user
// GET  /api/bank/admin/users      — admin: list all users
// GET  /api/bank/admin/stats      — admin: total funds
// ─────────────────────────────────────────────────────────────────────────────

const express                    = require('express');
const router                     = express.Router();
const { protect, authorize }     = require('../middleware/auth');
const { findUserById, updateUser, getAllUsers, findUser } = require('../config/db');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bank/balance
// ─────────────────────────────────────────────────────────────────────────────
router.get('/balance', protect, (req, res) => {
  const user = findUserById(req.user.id);
  res.json({
    name:     user.name,
    balance:  user.accountBalance,
    currency: 'INR',
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/bank/deposit
// Body: { amount }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/deposit', protect, (req, res) => {
  const { amount } = req.body;

  if (!amount || isNaN(amount) || Number(amount) <= 0)
    return res.status(400).json({ message: 'Provide a valid positive amount.' });

  const user       = findUserById(req.user.id);
  const newBalance = user.accountBalance + Number(amount);
  updateUser(user.id, { accountBalance: newBalance });

  res.json({
    message:    `Deposited ₹${amount} successfully ✅`,
    newBalance,
    currency:   'INR',
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/bank/withdraw
// Body: { amount }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/withdraw', protect, (req, res) => {
  const { amount } = req.body;

  if (!amount || isNaN(amount) || Number(amount) <= 0)
    return res.status(400).json({ message: 'Provide a valid positive amount.' });

  const user = findUserById(req.user.id);

  if (user.accountBalance < Number(amount))
    return res.status(400).json({ message: 'Insufficient funds.' });

  const newBalance = user.accountBalance - Number(amount);
  updateUser(user.id, { accountBalance: newBalance });

  res.json({
    message:    `Withdrew ₹${amount} successfully ✅`,
    newBalance,
    currency:   'INR',
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/bank/transfer
// Body: { toEmail, amount }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/transfer', protect, (req, res) => {
  const { toEmail, amount } = req.body;

  if (!toEmail || !amount || Number(amount) <= 0)
    return res.status(400).json({ message: 'Provide a valid toEmail and positive amount.' });

  const sender   = findUserById(req.user.id);
  const receiver = findUser('email', toEmail.toLowerCase());

  if (!receiver)
    return res.status(404).json({ message: 'Recipient account not found.' });

  if (sender.email === toEmail.toLowerCase())
    return res.status(400).json({ message: 'Cannot transfer to yourself.' });

  if (sender.accountBalance < Number(amount))
    return res.status(400).json({ message: 'Insufficient funds.' });

  const senderNewBalance   = sender.accountBalance   - Number(amount);
  const receiverNewBalance = receiver.accountBalance + Number(amount);

  updateUser(sender.id,   { accountBalance: senderNewBalance });
  updateUser(receiver.id, { accountBalance: receiverNewBalance });

  res.json({
    message:    `Transferred ₹${amount} to ${receiver.name} ✅`,
    newBalance: senderNewBalance,
    currency:   'INR',
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bank/admin/users  — admin only
// ─────────────────────────────────────────────────────────────────────────────
router.get('/admin/users', protect, authorize('admin'), (req, res) => {
  const users = getAllUsers().map(({ password, refreshToken, ...u }) => u);
  res.json({ count: users.length, users });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bank/admin/stats  — admin only
// ─────────────────────────────────────────────────────────────────────────────
router.get('/admin/stats', protect, authorize('admin'), (req, res) => {
  const users      = getAllUsers();
  const totalFunds = users.reduce((sum, u) => sum + u.accountBalance, 0);
  res.json({
    totalUsers:       users.length,
    totalFundsInBank: totalFunds,
    currency:         'INR',
  });
});

module.exports = router;
