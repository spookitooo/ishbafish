const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database/init');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/methods', require('./routes/methods'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/admin', require('./routes/admin'));

// Serve pages
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'pages', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'pages', 'register.html')));
app.get('/exchange', (req, res) => res.sendFile(path.join(__dirname, 'public', 'pages', 'exchange.html')));
app.get('/history', (req, res) => res.sendFile(path.join(__dirname, 'public', 'pages', 'history.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'pages', 'admin.html')));

// Root redirect
app.get('/', (req, res) => res.redirect('/exchange'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', vercel: !!process.env.VERCEL }));

let isDbInitialized = false;
app.use(async (req, res, next) => {
    if (!isDbInitialized) {
        try {
            console.log('🚀 Lazy-initializing database on first request...');
            await initDatabase();
            isDbInitialized = true;
            console.log('✅ Lazy-initialization complete.');
        } catch (err) {
            console.error('❌ Lazy-initialization FAILED:', err);
        }
    }
    next();
});

// Start local server if not on Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    const startLocal = async () => {
        try {
            await initDatabase();
            isDbInitialized = true;
            app.listen(PORT, () => {
                console.log(`\n🚀 Exchange Money Platform running at http://localhost:${PORT}`);
                console.log(`📋 Admin login: admin@exchange.com / admin123\n`);
            });
        } catch (err) {
            console.error('Failed to start local server:', err);
        }
    };
    startLocal();
}

module.exports = app;
