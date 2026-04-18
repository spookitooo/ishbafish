const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticate, JWT_SECRET, queryOne, queryAll, runSql } = require('../middleware/auth');
const { getDatabase, saveDatabase } = require('../database/init');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { full_name, email, password, language } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const db = await getDatabase();
        const existing = queryOne(db, 'SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
        if (existing) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const password_hash = bcrypt.hashSync(password, 10);
        const result = runSql(db,
            'INSERT INTO users (full_name, email, password_hash, language) VALUES (?, ?, ?, ?)',
            [full_name, email.toLowerCase(), password_hash, language || 'ku']
        );
        saveDatabase();

        const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET, { expiresIn: '7d' });
        const user = queryOne(db, 'SELECT id, full_name, email, role, language, created_at FROM users WHERE id = ?', [result.lastInsertRowid]);

        res.status(201).json({ token, user });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ 
            error: 'Server error', 
            details: err.message 
        });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const db = await getDatabase();
        const user = queryOne(db, 'SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);

        if (!user || !bcrypt.compareSync(password, user.password_hash)) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: user.id, full_name: user.full_name, email: user.email,
                role: user.role, language: user.language, created_at: user.created_at
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
    res.json({ user: req.user });
});

// PUT /api/auth/language
router.put('/language', authenticate, async (req, res) => {
    try {
        const { language } = req.body;
        if (!['ku', 'en', 'ar'].includes(language)) {
            return res.status(400).json({ error: 'Invalid language' });
        }
        const db = await getDatabase();
        runSql(db, 'UPDATE users SET language = ? WHERE id = ?', [language, req.user.id]);
        saveDatabase();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
