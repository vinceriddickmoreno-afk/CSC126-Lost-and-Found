const db = require('../config/db');

class User {
  static async findByEmail(email) {
    const [rows] = await db.getPool().query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }
  static async findById(id) {
    const [rows] = await db.getPool().query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  }
  static async create({ name, email, password }) {
    const [result] = await db.getPool().query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
      [name, email, password]
    );
    return this.findById(result.insertId);
  }
}
module.exports = User;