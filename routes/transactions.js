const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getDatabase } = require('../database/init');

const router = express.Router();
router.use(authenticate);

// POST /api/transactions
router.post('/', async (req, res) => {
    try {
        const { send_method, receive_method, send_amount, receiver_account, proof_image } = req.body;

        if (!send_method || !receive_method || !send_amount || !receiver_account || !proof_image) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (send_amount <= 0) {
            return res.status(400).json({ error: 'Amount must be greater than 0' });
        }

        const db = await getDatabase();

        // Get method pair fee logic
        const feesSnapshot = await db.collection('method_fees')
            .where('send_method', '==', send_method)
            .where('receive_method', '==', receive_method)
            .limit(1).get();
        
        if (feesSnapshot.empty) {
            return res.status(400).json({ error: 'Transfer between these methods is not configured by the admin yet' });
        }

        const pairFee = feesSnapshot.docs[0].data();
        const base_amount = parseFloat(pairFee.base_amount);
        const base_fee = parseFloat(pairFee.base_fee);

        let feeAmount = base_fee;
        if (send_amount >= base_amount) {
            feeAmount = (send_amount / base_amount) * base_fee;
        }

        const receiveAmount = send_amount - feeAmount;

        if (receiveAmount <= 0) {
           return res.status(400).json({ error: 'Fee exceeds total sent amount' });
        }

        const newTx = {
            user_id: req.user.id,
            send_method,
            receive_method,
            send_amount,
            receive_amount: receiveAmount,
            fee_amount: feeAmount,
            receiver_account,
            proof_image,
            status: 'pending',
            admin_note: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const docRef = await db.collection('transactions').add(newTx);
        
        res.status(201).json({ transaction: { id: docRef.id, ...newTx } });
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

        let query = db.collection('transactions').where('user_id', '==', req.user.id);

        if (status && ['pending', 'approved', 'rejected', 'completed'].includes(status)) {
            query = query.where('status', '==', status);
        }

        const snapshot = await query.get();
        // Since we didn't setup composite indexes yet, we sort in memory (or user will have to setup indexes)
        let transactions = [];
        snapshot.forEach(doc => transactions.push({ id: doc.id, ...doc.data() }));
        
        transactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        transactions = transactions.slice(0, parseInt(limit));

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
        const snapshot = await db.collection('transactions').where('user_id', '==', req.user.id).get();
        
        const stats = { total: 0, pending: 0, completed: 0, rejected: 0 };
        snapshot.forEach(doc => {
            stats.total++;
            const s = doc.data().status;
            if (s === 'pending') stats.pending++;
            else if (s === 'completed') stats.completed++;
            else if (s === 'rejected') stats.rejected++;
        });

        res.json({ stats });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/transactions/fees
router.get('/fees', async (req, res) => {
    try {
        const db = await getDatabase();
        const snapshot = await db.collection('method_fees').get();
        const pairs = [];
        snapshot.forEach(doc => pairs.push({ id: doc.id, ...doc.data() }));
        res.json({ pairs });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/transactions/:id
router.get('/:id', async (req, res) => {
    try {
        const db = await getDatabase();
        const doc = await db.collection('transactions').doc(req.params.id).get();
        
        if (!doc.exists || doc.data().user_id !== req.user.id) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json({ transaction: { id: doc.id, ...doc.data() } });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
