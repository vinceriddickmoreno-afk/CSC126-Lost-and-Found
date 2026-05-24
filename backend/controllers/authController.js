const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    return jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const register = async (req, res) => {
    try {
        const { name, email, password, profile_pic } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
        if (password.length < 6) return res.status(400).json({ error: 'Password min 6 characters' });
        const user = await User.create({ name, email, password, profile_pic });
        const token = generateToken(user);
        res.status(201).json({ success: true, token, user: user.toJSON() });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findByEmail(email);
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        const valid = await user.validatePassword(password);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
        const token = generateToken(user);
        res.json({ success: true, token, user: user.toJSON() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user.toJSON());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        const updated = await user.updateProfile(req.body);
        res.json(updated.toJSON());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);
        if (!(await user.validatePassword(oldPassword)))
            return res.status(401).json({ error: 'Incorrect old password' });
        if (newPassword.length < 6) return res.status(400).json({ error: 'New password min 6 characters' });
        await user.changePassword(newPassword);
        res.json({ message: 'Password updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { register, login, getProfile, updateProfile, changePassword };
