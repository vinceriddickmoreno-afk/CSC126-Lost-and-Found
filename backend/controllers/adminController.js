const db = require('../models/db');
const Claim = require('../models/Claim');
const User = require('../models/User');

const getStats = async (req, res) => {
    const [items] = await db.getPool().query('SELECT COUNT(*) as c FROM items');
    const [claims] = await db.getPool().query('SELECT COUNT(*) as c FROM claims');
    const [pending] = await db.getPool().query('SELECT COUNT(*) as c FROM claims WHERE status="pending"');
    res.json({ totalItems: items[0].c, totalClaims: claims[0].c, pendingClaims: pending[0].c });
};

const getAllClaims = async (req, res) => {
    const claims = await Claim.findAll();
    res.json(claims);
};

const updateClaim = async (req, res) => {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ error: 'Not found' });
    await claim.updateStatus(req.body.status);
    res.json(claim);
};

const getAllUsers = async (req, res) => {
    const users = await User.findAll();
    res.json(users);
};

module.exports = { getStats, getAllClaims, updateClaim, getAllUsers };