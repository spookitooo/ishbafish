const jwt = require('jsonwebtoken');
const { getDatabase } = require('../database/init');

const JWT_SECRET = process.env.JWT_SECRET || 'exchange-money-secret-key-2026';

// Verify JWT and attach user to request
async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const db = await getDatabase();
        
        const userDoc = await db.collection('users').doc(decoded.userId).get();

        if (!userDoc.exists) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = { id: userDoc.id, ...userDoc.data() };
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

// Check if user is admin
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

module.exports = { authenticate, requireAdmin, JWT_SECRET };
