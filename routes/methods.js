const express = require('express');
const { getDatabase } = require('../database/init');

const router = express.Router();

// GET /api/methods
// Public or Authenticated route to get all payment methods
router.get('/', async (req, res) => {
    try {
        const db = await getDatabase();
        const snapshot = await db.collection('payment_methods').get();
        const methods = [];
        snapshot.forEach(doc => methods.push(doc.data()));
        res.json({ methods });
    } catch (err) {
        console.error('Failed to get methods:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
