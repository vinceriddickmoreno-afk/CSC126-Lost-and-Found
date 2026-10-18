const express = require('express');
const { register, login, refresh, getProfile, updateProfile, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { loginLimiter, registerLimiter } = require('../middleware/security');
const router = express.Router();

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);   // <-- THIS was missing
router.post('/refresh', refresh);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

module.exports = router;