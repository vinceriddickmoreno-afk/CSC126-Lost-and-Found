const db = require('../config/db');

exports.createClaim = async (req, res) => {
  try {
    const { itemId, message, contactNumber } = req.body;
    const userId = req.user.id;

    const [existing] = await db.getPool().query('SELECT * FROM claims WHERE item_id = ? AND claimant_id = ?', [itemId, userId]);
    if (existing.length > 0) return res.status(400).json({ error: 'You already claimed this item' });

    await db.getPool().query(
      'INSERT INTO claims (item_id, claimant_id, message, contact_number) VALUES (?, ?, ?, ?)',
      [itemId, userId, message, contactNumber]
    );

    res.status(201).json({ message: 'Claim submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};