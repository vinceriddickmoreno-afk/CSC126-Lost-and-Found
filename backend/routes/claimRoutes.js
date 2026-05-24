const express = require('express');
const { createClaim, getUserClaims, updateClaimStatus } = require('../controllers/claimController');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.post('/', authenticate, createClaim);
router.get('/my-claims', authenticate, getUserClaims);
router.put('/:id/status', authenticate, updateClaimStatus);

module.exports = router;
