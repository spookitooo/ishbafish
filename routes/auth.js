const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticate, JWT_SECRET } = require('../middleware/auth');
const { getDatabase } = require('../database/init');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { full_name, username, email, password, language } = req.body;

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

        if (username) {
            if (username.length < 3) {
                return res.status(400).json({ error: 'Username must be at least 3 characters' });
            }
            if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
            }
        }

        const db = await getDatabase();
        const emailCheck = await db.collection('users').where('email', '==', email.toLowerCase()).get();
        if (!emailCheck.empty) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        if (username) {
            const usernameCheck = await db.collection('users').where('username', '==', username.toLowerCase()).get();
            if (!usernameCheck.empty) {
                return res.status(409).json({ error: 'Username already taken' });
            }
        }

        const password_hash = bcrypt.hashSync(password, 10);
        let role = 'user';
        if (email.toLowerCase() === 'ayubnawzad199@gmail.com' || email.toLowerCase() === 'admin@exchange.com') {
            role = 'admin';
        }

        const newUser = {
            full_name,
            username: username ? username.toLowerCase() : null,
            email: email.toLowerCase(),
            password_hash,
            role,
            language: language || 'ku',
            created_at: new Date().toISOString()
        };

        const docRef = await db.collection('users').add(newUser);

        const token = jwt.sign({ userId: docRef.id }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ 
            token, 
            user: { id: docRef.id, full_name: newUser.full_name, username: newUser.username, email: newUser.email, role: newUser.role, language: newUser.language, created_at: newUser.created_at } 
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: `Server Error: ${err.message}` });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { login, email, password } = req.body;
        const identifier = (login || email || '').trim().toLowerCase();
        
        if (!identifier || !password) {
            return res.status(400).json({ error: 'Username/email and password are required' });
        }

        const db = await getDatabase();
        const isEmail = identifier.includes('@');
        
        let querySnapshot;
        if (isEmail) {
            querySnapshot = await db.collection('users').where('email', '==', identifier).get();
        } else {
            querySnapshot = await db.collection('users').where('username', '==', identifier).get();
        }

        if (querySnapshot.empty) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const userDoc = querySnapshot.docs[0];
        const user = userDoc.data();

        if (!bcrypt.compareSync(password, user.password_hash)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: userDoc.id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: userDoc.id, full_name: user.full_name, username: user.username, email: user.email,
                role: user.role, language: user.language, created_at: user.created_at
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }

});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
    try {
        const u = req.user;
        res.json({
            user: {
                id: u.id, full_name: u.full_name, username: u.username, email: u.email,
                role: u.role, language: u.language, created_at: u.created_at
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/auth/language
router.put('/language', authenticate, async (req, res) => {
    try {
        const { language } = req.body;
        if (!['ku', 'en', 'ar'].includes(language)) {
            return res.status(400).json({ error: 'Invalid language' });
        }

        const db = await getDatabase();
        await db.collection('users').doc(req.user.id).update({ language });

        res.json({ success: true, language });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
