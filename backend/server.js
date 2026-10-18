require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');

const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const claimRoutes = require('./routes/claimRoutes');
const adminRoutes = require('./routes/adminRoutes');
const db = require('./models/db');

const app = express();
app.disable('x-powered-by');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Security headers
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Body parser
app.use(express.json({ limit: '2mb' }));

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
    origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

// Serve uploaded images
app.use('/uploads', express.static(uploadDir));

// Root route
app.get('/', (req, res) => res.json({ status: 'ok', service: 'Lost and Found API' }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler for unknown routes
app.use((req, res) => res.status(404).json({ error: 'Endpoint not found' }));

// Error handler (MUST BE LAST)
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.message);

    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large (max 3 MB)' });
    }
    if (err.message && err.message.includes('Only JPG')) {
        return res.status(400).json({ error: err.message });
    }
    if (err.message && err.message.includes('CORS')) {
        return res.status(403).json({ error: 'Origin not allowed' });
    }
    if (err.name === 'MulterError') {
        return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: 'Something went wrong' });
});

// Start server
const PORT = process.env.PORT || 5000;
db.getPool().getConnection()
    .then(() => {
        console.log('✅ Database connected');
        console.log(`📡 Listening on port ${PORT}`);
        app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    });