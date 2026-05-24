const Item = require('../models/Item');

const getAllItems = async (req, res) => {
    try {
        const { search, category, status, page = 1, limit = 12, dateFrom, dateTo } = req.query;
        const offset = (page - 1) * limit;
        const filters = { search, category, status, dateFrom, dateTo, limit, offset };
        const items = await Item.findAll(filters);
        const [totalRows] = await require('../models/db').getPool().query('SELECT COUNT(*) as count FROM items');
        res.json({ items, totalPages: Math.ceil(totalRows[0].count / limit), currentPage: parseInt(page) });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const getItemById = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.json(item);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const createItem = async (req, res) => {
    try {
        const { title, description, category, location, status, dateReported } = req.body;
        if (!title) return res.status(400).json({ error: 'Title required' });
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;
        const item = await Item.create({ title, description, category, location, dateReported, status, image_url, userId: req.user.id });
        res.status(201).json(item);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const updateItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        if (item.userId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
        const updates = req.body;
        if (req.file) updates.image_url = `/uploads/${req.file.filename}`;
        const updated = await item.update(updates);
        res.json(updated);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const deleteItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        if (item.userId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
        await item.delete();
        res.json({ message: 'Item deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getAllItems, getItemById, createItem, updateItem, deleteItem };
