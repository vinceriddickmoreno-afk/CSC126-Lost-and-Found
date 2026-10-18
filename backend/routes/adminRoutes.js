const express = require('express');
const { authenticate, isAdmin } = require('../middleware/auth');
const { getStats, getAllClaims, updateClaim, getAllUsers } = require('../controllers/adminController');
const router = express.Router();

router.use(authenticate, isAdmin);
router.get('/stats', getStats);
router.get('/claims', getAllClaims);
router.put('/claims/:id', updateClaim);
router.get('/users', getAllUsers);

module.exports = router;