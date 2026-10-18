require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const claimRoutes = require('./routes/claimRoutes');
const adminRoutes = require('./routes/adminRoutes'); // <-- IMPORTED

const app = express();

const allowedOrigins = ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Blocked by CORS policy'));
        }
    }
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many login attempts, please try again after 15 minutes' }
});
app.use('/api/auth/login', loginLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/admin', adminRoutes); // <-- CONNECTED

app.use((err, req, res, next) => {
    console.error("Server Error:", err.message);
    if (err.message === 'Blocked by CORS policy') {
        return res.status(403).json({ error: 'CORS blocked' });
    }
    if (err.name === 'MulterError' || err.message.includes('Only images')) {
        return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(5000, () => console.log('✅ Secure Backend running on port 5000'));