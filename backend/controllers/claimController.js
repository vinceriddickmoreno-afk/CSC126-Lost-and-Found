const Claim = require('../models/Claim');
const Item = require('../models/Item');

const createClaim = async (req, res) => {
    try {
        const { itemId, message, contactNumber } = req.body;
        const claimantId = req.user.id;
        const item = await Item.findById(itemId);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        if (item.userId === claimantId) return res.status(400).json({ error: 'Cannot claim your own item' });
        const existing = await Claim.findByClaimantId(claimantId);
        if (existing.some(c => c.itemId === itemId))
            return res.status(400).json({ error: 'Already claimed this item' });
        const claim = await Claim.create({ itemId, claimantId, message, contactNumber });
        await item.update({ status: 'claimed' });
        res.status(201).json(claim);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getUserClaims = async (req, res) => {
    try {
        const claims = await Claim.findByClaimantId(req.user.id);
        res.json(claims);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const updateClaimStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const claim = await Claim.findById(id);
        if (!claim) return res.status(404).json({ error: 'Claim not found' });
        const item = await Item.findById(claim.itemId);
        if (item.userId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
        await claim.updateStatus(status);
        res.json({ message: `Claim ${status}`, claim });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { createClaim, getUserClaims, updateClaimStatus };
