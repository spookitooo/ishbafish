const express = require('express');
const { authenticate, requireAdmin, queryOne, queryAll, runSql } = require('../middleware/auth');
const { getDatabase, saveDatabase } = require('../database/init');

const router = express.Router();
router.use(authenticate, requireAdmin);

// GET /api/admin/transactions
router.get('/transactions', async (req, res) => {
    try {
        const db = await getDatabase();
        const { status, limit = 50 } = req.query;

        let query = `SELECT t.*, u.full_name as user_name, u.email as user_email
            FROM transactions t JOIN users u ON t.user_id = u.id`;
        const params = [];

        if (status && ['pending', 'approved', 'rejected', 'completed'].includes(status)) {
            query += ' WHERE t.status = ?';
            params.push(status);
        }

        query += ' ORDER BY t.created_at DESC LIMIT ?';
        params.push(parseInt(limit));

        const transactions = queryAll(db, query, params);
        res.json({ transactions, total: transactions.length });
    } catch (err) {
        console.error('Admin get transactions error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/admin/transactions/:id
router.patch('/transactions/:id', async (req, res) => {
    try {
        const { status, admin_note } = req.body;
        if (!['pending', 'approved', 'rejected', 'completed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const db = await getDatabase();
        const transaction = queryOne(db, 'SELECT * FROM transactions WHERE id = ?', [req.params.id]);
        if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

        runSql(db,
            'UPDATE transactions SET status = ?, admin_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, admin_note || transaction.admin_note || '', parseInt(req.params.id)]
        );
        saveDatabase();

        const updated = queryOne(db,
            `SELECT t.*, u.full_name as user_name, u.email as user_email
            FROM transactions t JOIN users u ON t.user_id = u.id WHERE t.id = ?`,
            [parseInt(req.params.id)]
        );
        res.json({ transaction: updated });
    } catch (err) {
        console.error('Admin update transaction error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
    try {
        const db = await getDatabase();
        const users = queryAll(db, `
            SELECT u.id, u.full_name, u.email, u.role, u.language, u.created_at,
                COUNT(t.id) as transaction_count
            FROM users u LEFT JOIN transactions t ON u.id = t.user_id
            GROUP BY u.id ORDER BY u.created_at DESC
        `, []);
        res.json({ users });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
    try {
        const db = await getDatabase();
        const txStats = queryOne(db, `
            SELECT COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN fee_amount ELSE 0 END), 0) as total_fees,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN send_amount ELSE 0 END), 0) as total_volume
            FROM transactions
        `, []);

        const userCount = queryOne(db, "SELECT COUNT(*) as total FROM users WHERE role = 'user'", []);
        res.json({ transactions: txStats, users: userCount ? userCount.total : 0 });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});


// ============================================
// CRUD API FOR METHOD FEES pairs
// ============================================

router.get('/method-fees', async (req, res) => {
    try {
        const db = await getDatabase();
        const pairs = queryAll(db, 'SELECT * FROM method_fees ORDER BY id DESC', []);
        res.json({ pairs });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/method-fees', async (req, res) => {
    try {
        const { send_method, receive_method, base_amount, base_fee } = req.body;
        
        if (!send_method || !receive_method || !base_amount || !base_fee) {
            return res.status(400).json({ error: 'Missing required configuration data' });
        }

        const db = await getDatabase();
        const exists = queryOne(db, 'SELECT id FROM method_fees WHERE send_method = ? AND receive_method = ?', [send_method, receive_method]);
        if (exists) {
            return res.status(409).json({ error: 'A configuration for this pair already exists' });
        }

        const result = runSql(db, 
            'INSERT INTO method_fees (send_method, receive_method, base_amount, base_fee) VALUES (?, ?, ?, ?)',
            [send_method, receive_method, parseFloat(base_amount), parseFloat(base_fee)]
        );
        saveDatabase();
        
        const newPair = queryOne(db, 'SELECT * FROM method_fees WHERE id = ?', [result.lastInsertRowid]);
        res.status(201).json({ pair: newPair });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/method-fees/:id', async (req, res) => {
    try {
        const db = await getDatabase();
        runSql(db, 'DELETE FROM method_fees WHERE id = ?', [req.params.id]);
        saveDatabase();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================
// CRUD API FOR PAYMENT METHODS
// ============================================

router.post('/methods', async (req, res) => {
    try {
        const { id, name_key, icon, instructions } = req.body;
        if (!id || !name_key || !icon) {
            return res.status(400).json({ error: 'ID, Name Key, and Icon are required' });
        }
        
        const db = await getDatabase();
        const exists = queryOne(db, 'SELECT id FROM payment_methods WHERE id = ?', [id]);
        if (exists) {
            return res.status(400).json({ error: 'A method with this ID already exists' });
        }

        runSql(db, 'INSERT INTO payment_methods (id, name_key, icon, instructions) VALUES (?, ?, ?, ?)', [id, name_key, icon, instructions || '']);
        saveDatabase();
        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/methods/:id', async (req, res) => {
    try {
        const { name_key, icon, instructions } = req.body;
        const db = await getDatabase();
        runSql(db, 'UPDATE payment_methods SET name_key = ?, icon = ?, instructions = ? WHERE id = ?', [name_key, icon, instructions || '', req.params.id]);
        saveDatabase();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/methods/:id', async (req, res) => {
    try {
        const db = await getDatabase();
        runSql(db, 'DELETE FROM payment_methods WHERE id = ?', [req.params.id]);
        runSql(db, 'DELETE FROM method_fees WHERE send_method = ? OR receive_method = ?', [req.params.id, req.params.id]);
        saveDatabase();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});


module.exports = router;
