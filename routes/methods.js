const express = require('express');
const { queryAll } = require('../middleware/auth');
const { getDatabase } = require('../database/init');

const router = express.Router();

// GET /api/methods
// Public or Authenticated route to get all payment methods
router.get('/', async (req, res) => {
    try {
        const db = await getDatabase();
        const methods = queryAll(db, 'SELECT * FROM payment_methods', []);
        res.json({ methods });
    } catch (err) {
        console.error('Failed to get methods:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
