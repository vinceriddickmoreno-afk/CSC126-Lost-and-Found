const express = require('express');
const router = express.Router();
const { createClaim } = require('../controllers/claimController');
const auth = require('../middleware/auth');

router.post('/', auth, createClaim);

module.exports = router;