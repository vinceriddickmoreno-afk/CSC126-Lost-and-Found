const Claim = require('../models/Claim');
const Item = require('../models/Item');

const createClaim = async (req, res) => {
    try {
        const { itemId, message, contactNumber } = req.body;
        const item = await Item.findById(itemId);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        if (item.userId === req.user.id) return res.status(400).json({ error: 'Cannot claim your own item' });
        const existing = await Claim.findByClaimantId(req.user.id);
        if (existing.some(c => c.itemId === itemId)) return res.status(400).json({ error: 'Already claimed' });
        const claim = await Claim.create({ itemId, claimantId: req.user.id, message, contactNumber });
        await item.update({ status: 'claimed' });
        res.status(201).json(claim);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const getUserClaims = async (req, res) => {
    try {
        const claims = await Claim.findByClaimantId(req.user.id);
        res.json(claims);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { createClaim, getUserClaims };