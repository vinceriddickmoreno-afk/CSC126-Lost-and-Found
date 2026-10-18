const db = require('./db');

class Claim {
    constructor(id, itemId, claimantId, message, contactNumber, status, createdAt) {
        this.id = id; this.itemId = itemId; this.claimantId = claimantId;
        this.message = message; this.contactNumber = contactNumber; this.status = status; this.createdAt = createdAt;
    }

    static async create({ itemId, claimantId, message, contactNumber }) {
        const [res] = await db.getPool().query(
            `INSERT INTO claims (item_id, claimant_id, message, contact_number, status) VALUES (?, ?, ?, ?, 'pending')`,
            [itemId, claimantId, message || null, contactNumber || null]
        );
        return this.findById(res.insertId);
    }

    static async findById(id) {
        const [rows] = await db.getPool().query(
            `SELECT c.*, i.title as item_title, i.location as item_location,
                    u.name as claimant_name, u.email as claimant_email
             FROM claims c
             JOIN items i ON c.item_id = i.id
             JOIN users u ON c.claimant_id = u.id
             WHERE c.id = ?`,
            [id]
        );
        if (!rows.length) return null;
        const c = rows[0];
        const claim = new Claim(c.id, c.item_id, c.claimant_id, c.message, c.contact_number, c.status, c.created_at);
        claim.itemTitle = c.item_title;
        claim.itemLocation = c.item_location;
        claim.claimantName = c.claimant_name;
        claim.claimantEmail = c.claimant_email;
        return claim;
    }

    static async findByClaimantId(claimantId) {
        const [rows] = await db.getPool().query(
            `SELECT c.*, i.title as item_title, i.location as item_location
             FROM claims c
             JOIN items i ON c.item_id = i.id
             WHERE c.claimant_id = ?
             ORDER BY c.created_at DESC`,
            [claimantId]
        );
        return rows.map(c => {
            const claim = new Claim(c.id, c.item_id, c.claimant_id, c.message, c.contact_number, c.status, c.created_at);
            claim.itemTitle = c.item_title;
            claim.itemLocation = c.item_location;
            return claim;
        });
    }

    static async findAll() {
        const [rows] = await db.getPool().query(
            `SELECT c.*, i.title as item_title, u.name as claimant_name
             FROM claims c
             JOIN items i ON c.item_id = i.id
             JOIN users u ON c.claimant_id = u.id
             ORDER BY c.created_at DESC`
        );
        return rows.map(c => {
            const claim = new Claim(c.id, c.item_id, c.claimant_id, c.message, c.contact_number, c.status, c.created_at);
            claim.itemTitle = c.item_title;
            claim.claimantName = c.claimant_name;
            return claim;
        });
    }

    async updateStatus(newStatus) {
        await db.getPool().query('UPDATE claims SET status = ? WHERE id = ?', [newStatus, this.id]);
        this.status = newStatus;
        if (newStatus === 'approved') {
            await db.getPool().query('UPDATE items SET status = "returned" WHERE id = ?', [this.itemId]);
        }
        return this;
    }

    toJSON() {
        return {
            id: this.id, itemId: this.itemId, itemTitle: this.itemTitle, itemLocation: this.itemLocation,
            claimantId: this.claimantId, claimantName: this.claimantName, claimantEmail: this.claimantEmail,
            message: this.message, contactNumber: this.contactNumber, status: this.status, createdAt: this.createdAt
        };
    }
}
module.exports = Claim;