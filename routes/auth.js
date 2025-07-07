const express = require('express');
const router = express.Router();
const { register, login, getProfile, verifyEmail, enable2FA, verify2FA } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.post('/2fa/enable', authenticateToken, enable2FA);
router.post('/2fa/verify', authenticateToken, verify2FA);

// Protected routes
router.get('/profile', authenticateToken, getProfile);

module.exports = router; 