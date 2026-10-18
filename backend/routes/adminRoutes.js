const express = require('express');
const router = express.Router();
const { getStats, getAllClaims, updateClaim } = require('../controllers/adminController');
const auth = require('../middleware/auth');

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') next();
    else res.status(403).json({ error: 'Admin access required' });
};

router.use(auth, isAdmin);

router.get('/stats', getStats);
router.get('/claims', getAllClaims);
router.put('/claims/:id', updateClaim);

module.exports = router;