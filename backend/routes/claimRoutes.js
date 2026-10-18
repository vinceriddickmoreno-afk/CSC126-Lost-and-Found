const express = require('express');
const { createClaim, getUserClaims } = require('../controllers/claimController');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.post('/', authenticate, createClaim);
router.get('/my-claims', authenticate, getUserClaims);

module.exports = router;