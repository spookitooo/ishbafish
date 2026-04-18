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

// Start
async function start() {
    await initDatabase();
    if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
        app.listen(PORT, () => {
            console.log(`\n🚀 Exchange Money Platform running at http://localhost:${PORT}`);
            console.log(`📋 Admin login: admin@exchange.com / admin123\n`);
        });
    }
}

start().catch(err => {
    console.error('Failed to start server:', err);
    // Don't exit on Vercel as it might kill the function context
    if (!process.env.VERCEL) {
        process.exit(1);
    }
});

module.exports = app;
