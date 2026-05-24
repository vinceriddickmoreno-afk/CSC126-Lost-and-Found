const db = require('../models/db');
const Claim = require('../models/Claim');
const User = require('../models/User');
const Item = require('../models/Item');

const getStats = async (req, res) => {
    try {
        const [totalItems] = await db.getPool().query('SELECT COUNT(*) as count FROM items');
        const [totalClaims] = await db.getPool().query('SELECT COUNT(*) as count FROM claims');
        const [pendingClaims] = await db.getPool().query('SELECT COUNT(*) as count FROM claims WHERE status = "pending"');
        res.json({ totalItems: totalItems[0].count, totalClaims: totalClaims[0].count, pendingClaims: pendingClaims[0].count });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const getAllClaims = async (req, res) => {
    try {
        const { status } = req.query;
        const claims = await Claim.findAll({ status });
        res.json(claims);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const updateClaim = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const claim = await Claim.findById(id);
        if (!claim) return res.status(404).json({ error: 'Claim not found' });
        await claim.updateStatus(status);
        res.json(claim);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        res.json(users);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        await user.delete();
        res.json({ message: 'User deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getStats, getAllClaims, updateClaim, getAllUsers, deleteUser };
