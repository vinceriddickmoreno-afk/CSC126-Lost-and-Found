const db = require('./db');
const bcrypt = require('bcryptjs');

class User {
    constructor(id, name, email, password, role, profile_pic, createdAt) {
        this.id = id; this.name = name; this.email = email;
        this.password = password; this.role = role; this.profile_pic = profile_pic; this.createdAt = createdAt;
    }

    static async create({ name, email, password, role = 'user', profile_pic = null }) {
        const existing = await this.findByEmail(email);
        if (existing) throw new Error('Email already registered');
        const hashed = await bcrypt.hash(password, 10);
        const [res] = await db.getPool().query(
            'INSERT INTO users (name, email, password, role, profile_pic) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashed, role, profile_pic]
        );
        return this.findById(res.insertId);
    }

    static async findById(id) {
        const [rows] = await db.getPool().query('SELECT * FROM users WHERE id = ?', [id]);
        if (!rows.length) return null;
        const u = rows[0];
        return new User(u.id, u.name, u.email, u.password, u.role, u.profile_pic, u.created_at);
    }

    static async findByEmail(email) {
        const [rows] = await db.getPool().query('SELECT * FROM users WHERE email = ?', [email]);
        if (!rows.length) return null;
        const u = rows[0];
        return new User(u.id, u.name, u.email, u.password, u.role, u.profile_pic, u.created_at);
    }

    async validatePassword(plain) { return bcrypt.compare(plain, this.password); }

    async updateProfile(updates) {
        const allowed = ['name', 'email', 'profile_pic'];
        const fields = [], values = [];
        for (const field of allowed) {
            if (updates[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(updates[field]);
            }
        }
        if (fields.length === 0) return this;
        values.push(this.id);
        await db.getPool().query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
        return User.findById(this.id);
    }

    async changePassword(newPassword) {
        const hashed = await bcrypt.hash(newPassword, 10);
        await db.getPool().query('UPDATE users SET password = ? WHERE id = ?', [hashed, this.id]);
    }

    async delete() {
        await db.getPool().query('DELETE FROM users WHERE id = ?', [this.id]);
    }

    toJSON() {
        return { id: this.id, name: this.name, email: this.email, role: this.role, profile_pic: this.profile_pic, createdAt: this.createdAt };
    }
}
module.exports = User;
