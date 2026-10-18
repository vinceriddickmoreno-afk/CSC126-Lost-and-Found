const Item = require('../models/Item');

const getAllItems = async (req, res) => {
    try {
        const { search, category, status } = req.query;
        const items = await Item.findAll({ search, category, status });
        res.json({ items, totalPages: 1, currentPage: 1 });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const getItemById = async (req, res) => {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
};

const createItem = async (req, res) => {
    try {
        const { title, description, category, location, status } = req.body;
        if (!title) return res.status(400).json({ error: 'Title required' });
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;
        const item = await Item.create({ title, description, category, location, status, image_url, userId: req.user.id });
        res.status(201).json(item);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const updateItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ error: 'Not found' });
        if (item.userId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
        const updates = { ...req.body };
        if (req.file) updates.image_url = `/uploads/${req.file.filename}`;
        const updated = await item.update(updates);
        res.json(updated);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const deleteItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ error: 'Not found' });
        if (item.userId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
        await item.delete();
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getAllItems, getItemById, createItem, updateItem, deleteItem };