const db = require('../config/db');

class Item {
  static async create({ user_id, title, description, location, category, status, image_url }) {
    const [result] = await db.getPool().query(
      `INSERT INTO items (user_id, title, description, location, category, status, image_url, date_reported) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [user_id, title, description, location, category, status, image_url]
    );
    return this.findById(result.insertId);
  }

  static async findAll() {
    // Gigamit nako ang "AS userId" para mo-match sa gusto sa frontend
    const [rows] = await db.getPool().query(`
      SELECT i.*, u.name AS userName 
      FROM items i 
      JOIN users u ON i.user_id = u.id 
      ORDER BY i.date_reported DESC
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.getPool().query('SELECT * FROM items WHERE id = ?', [id]);
    return rows[0];
  }
}
module.exports = Item;