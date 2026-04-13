const express = require('express');
const { authenticate, queryOne, queryAll, runSql } = require('../middleware/auth');
const { getDatabase, saveDatabase } = require('../database/init');

const router = express.Router();
router.use(authenticate);

// POST /api/transactions
router.post('/', async (req, res) => {
    try {
        const { send_method, receive_method, send_amount, receiver_account, proof_image } = req.body;

        if (!send_method || !receive_method || !send_amount || !receiver_account || !proof_image) {
            return res.status(400).json({ error: 'All fields (methods, amount, account, proof) are required' });
        }
        if (send_amount <= 0) {
            return res.status(400).json({ error: 'Amount must be greater than 0' });
        }

        const db = await getDatabase();

        // Get method pair fee logic
        const pairFee = queryOne(db, 'SELECT base_amount, base_fee FROM method_fees WHERE send_method = ? AND receive_method = ?', [send_method, receive_method]);
        
        if (!pairFee) {
            return res.status(400).json({ error: 'Transfer between these methods is not configured by the admin yet' });
        }

        const base_amount = parseFloat(pairFee.base_amount);
        const base_fee = parseFloat(pairFee.base_fee);

        let feeAmount = base_fee; // Default minimum fee
        if (send_amount >= base_amount) {
            feeAmount = (send_amount / base_amount) * base_fee;
        }

        const receiveAmount = send_amount - feeAmount;

        if (receiveAmount <= 0) {
           return res.status(400).json({ error: 'Fee exceeds total sent amount' });
        }

        const result = runSql(db,
            `INSERT INTO transactions (user_id, send_method, receive_method, send_amount, receive_amount, fee_amount, receiver_account, proof_image, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [req.user.id, send_method, receive_method, send_amount, receiveAmount, feeAmount, receiver_account, proof_image]
        );
        saveDatabase();

        const transaction = queryOne(db, 'SELECT * FROM transactions WHERE id = ?', [result.lastInsertRowid]);
        res.status(201).json({ transaction });
    } catch (err) {
        console.error('Create transaction error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/transactions
router.get('/', async (req, res) => {
    try {
        const db = await getDatabase();
        const { status, limit = 20 } = req.query;

        let query = 'SELECT * FROM transactions WHERE user_id = ?';
        const params = [req.user.id];

        if (status && ['pending', 'approved', 'rejected', 'completed'].includes(status)) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC LIMIT ?';
        params.push(parseInt(limit));

        const transactions = queryAll(db, query, params);
        res.json({ transactions, total: transactions.length });
    } catch (err) {
        console.error('Get transactions error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/transactions/stats
router.get('/stats', async (req, res) => {
    try {
        const db = await getDatabase();
        const stats = queryOne(db, `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
            FROM transactions WHERE user_id = ?
        `, [req.user.id]);
        res.json({ stats: stats || { total: 0, pending: 0, completed: 0, rejected: 0 } });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/transactions/fees
router.get('/fees', async (req, res) => {
    try {
        const db = await getDatabase();
        const pairs = queryAll(db, 'SELECT * FROM method_fees', []);
        res.json({ pairs });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/transactions/:id
router.get('/:id', async (req, res) => {
    try {
        const db = await getDatabase();
        const transaction = queryOne(db, 'SELECT * FROM transactions WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
        res.json({ transaction });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
