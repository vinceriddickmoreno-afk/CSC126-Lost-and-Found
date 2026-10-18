const User = require('../models/User');
const jwt = require('jsonwebtoken');

const accessToken = (user) => jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET, { expiresIn: '1h' }
);
const refreshToken = (user) => jwt.sign(
    { id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' }
);

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields required' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }
        if (!/[A-Z]/.test(password)) {
            return res.status(400).json({ error: 'Password needs an uppercase letter' });
        }
        if (!/[a-z]/.test(password)) {
            return res.status(400).json({ error: 'Password needs a lowercase letter' });
        }
        if (!/[0-9]/.test(password)) {
            return res.status(400).json({ error: 'Password needs a number' });
        }

        const user = await User.create({ name, email, password });
        const token = accessToken(user);
        const rt = refreshToken(user);
        res.status(201).json({
            success: true,
            accessToken: token,
            refreshToken: rt,
            user: user.toJSON()
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findByEmail(email);
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });
        const valid = await user.validatePassword(password);
        if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
        res.json({
            success: true,
            accessToken: accessToken(user),
            refreshToken: refreshToken(user),
            user: user.toJSON()
        });
    } catch (err) { res.status(500).json({ error: 'Login failed' }); }
};

const refresh = async (req, res) => {
    try {
        const { refreshToken: rt } = req.body;
        if (!rt) return res.status(401).json({ error: 'Refresh token required' });
        const decoded = jwt.verify(rt, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ error: 'User not found' });
        res.json({ success: true, accessToken: accessToken(user) });
    } catch { res.status(401).json({ error: 'Invalid refresh token' }); }
};

const getProfile = async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.toJSON());
};

const updateProfile = async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const updated = await user.updateProfile(req.body);
    res.json(updated.toJSON());
};

const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!(await user.validatePassword(oldPassword))) return res.status(401).json({ error: 'Wrong current password' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password too short' });
    await user.changePassword(newPassword);
    res.json({ message: 'Password updated' });
};

module.exports = { register, login, refresh, getProfile, updateProfile, changePassword };