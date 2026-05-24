const express = require('express');
const { authenticate, isAdmin } = require('../middleware/auth');
const { getStats, getAllClaims, updateClaim, getAllUsers, deleteUser } = require('../controllers/adminController');
const router = express.Router();

router.use(authenticate, isAdmin);
router.get('/stats', getStats);
router.get('/claims', getAllClaims);
router.put('/claims/:id', updateClaim);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

module.exports = router;
