const db = require('../config/db');

class Claim {
  static async create({ item_id, claimant_id, message, contact_number }) {
    await db.getPool().query(
      'INSERT INTO claims (item_id, claimant_id, message, contact_number) VALUES (?, ?, ?, ?)',
      [item_id, claimant_id, message, contact_number]
    );
  }
}
module.exports = Claim;