const db = require('../config/db');

exports.getStats = async (req, res, next) => {
  try {
    const pool = db.getPool();
    const [[users]]   = await pool.query("SELECT COUNT(*) AS c FROM users");
    const [[items]]   = await pool.query("SELECT COUNT(*) AS c FROM items");
    const [[pending]] = await pool.query("SELECT COUNT(*) AS c FROM claims WHERE status = 'pending'");

    res.json({ users: users.c, items: items.c, pendingClaims: pending.c });
  } catch (err) { next(err); }
};

exports.getAllClaims = async (req, res, next) => {
  try {
    const [claims] = await db.getPool().query(`
      SELECT c.*, i.title AS itemTitle, u.name AS claimantName 
      FROM claims c 
      JOIN items i ON c.item_id = i.id 
      JOIN users u ON c.claimant_id = u.id 
      ORDER BY c.created_at DESC
    `);
    res.json({ claims });
  } catch (err) { next(err); }
};

exports.updateClaim = async (req, res, next) => {
  try {
    const { status } = req.body; 
    const claimId = req.params.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await db.getPool().query('UPDATE claims SET status = ? WHERE id = ?', [status, claimId]);

    if (status === 'approved') {
      const [claim] = await db.getPool().query('SELECT item_id FROM claims WHERE id = ?', [claimId]);
      if (claim.length > 0) {
        await db.getPool().query('UPDATE items SET status = "returned" WHERE id = ?', [claim[0].item_id]);
      }
    }

    res.json({ message: `Claim ${status}` });
  } catch (err) { next(err); }
};