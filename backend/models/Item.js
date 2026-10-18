const db = require('./db');

class Item {
    constructor(id, title, description, category, location, dateReported, status, image_url, userId, createdAt) {
        this.id = id; this.title = title; this.description = description;
        this.category = category; this.location = location; this.dateReported = dateReported;
        this.status = status; this.image_url = image_url; this.userId = userId; this.createdAt = createdAt;
    }

    static async create(data) {
        const { title, description, category, location, dateReported, status, image_url, userId } = data;
        const [res] = await db.getPool().query(
            `INSERT INTO items (title, description, category, location, date_reported, status, image_url, user_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description || null, category || null, location || null, dateReported || new Date(), status || 'lost', image_url || null, userId]
        );
        return this.findById(res.insertId);
    }

    static async findById(id) {
        const [rows] = await db.getPool().query(
            `SELECT items.*, users.name as user_name FROM items JOIN users ON items.user_id = users.id WHERE items.id = ?`,
            [id]
        );
        if (!rows.length) return null;
        const i = rows[0];
        return new Item(i.id, i.title, i.description, i.category, i.location, i.date_reported, i.status, i.image_url, i.user_id, i.created_at);
    }

    static async findAll(filters = {}) {
        let sql = `SELECT items.*, users.name as user_name FROM items JOIN users ON items.user_id = users.id WHERE 1=1`;
        const values = [];
        if (filters.search) {
            sql += ` AND (items.title LIKE ? OR items.description LIKE ? OR items.location LIKE ?)`;
            const s = `%${filters.search}%`;
            values.push(s, s, s);
        }
        if (filters.category) { sql += ` AND items.category = ?`; values.push(filters.category); }
        if (filters.status) { sql += ` AND items.status = ?`; values.push(filters.status); }
        sql += ` ORDER BY items.created_at DESC`;
        const [rows] = await db.getPool().query(sql, values);
        return rows.map(i => new Item(i.id, i.title, i.description, i.category, i.location, i.date_reported, i.status, i.image_url, i.user_id, i.created_at));
    }

    async update(updates) {
        const allowed = ['title', 'description', 'category', 'location', 'date_reported', 'status', 'image_url'];
        const fields = [], values = [];
        for (const field of allowed) {
            if (updates[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(updates[field]);
            }
        }
        if (!fields.length) return this;
        values.push(this.id);
        await db.getPool().query(`UPDATE items SET ${fields.join(', ')} WHERE id = ?`, values);
        return Item.findById(this.id);
    }

    async delete() {
        await db.getPool().query('DELETE FROM items WHERE id = ?', [this.id]);
    }

    toJSON() {
        return {
            id: this.id, title: this.title, description: this.description,
            category: this.category, location: this.location, dateReported: this.dateReported,
            status: this.status, image_url: this.image_url, userId: this.userId, createdAt: this.createdAt
        };
    }
}
module.exports = Item;