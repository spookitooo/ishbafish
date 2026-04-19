const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getDatabase } = require('../database/init');

const router = express.Router();
router.use(authenticate, requireAdmin);

// GET /api/admin/transactions
router.get('/transactions', async (req, res) => {
    try {
        const db = await getDatabase();
        const { status, limit = 50 } = req.query;

        let query = db.collection('transactions');
        if (status && ['pending', 'approved', 'rejected', 'completed'].includes(status)) {
            query = query.where('status', '==', status);
        }

        const snapshot = await query.get();
        let transactions = [];
        const userIds = new Set();
        
        snapshot.forEach(doc => {
            const data = doc.data();
            transactions.push({ id: doc.id, ...data });
            userIds.add(data.user_id);
        });

        // Fast manual join for users
        const usersMap = {};
        if (userIds.size > 0) {
            // Firestore 'in' has a limit of 30, so for safety we fetch all users or chunk them.
            // For an admin panel with a limit=50, it's safer to fetch users for the returned txs.
            const userRefs = Array.from(userIds).map(id => db.collection('users').doc(id));
            if (userRefs.length > 0) {
                const userDocs = await db.getAll(...userRefs);
                userDocs.forEach(u => {
                    if (u.exists) {
                        usersMap[u.id] = u.data();
                    }
                });
            }
        }

        transactions = transactions.map(t => ({
            ...t,
            user_name: usersMap[t.user_id]?.full_name || 'Unknown',
            user_email: usersMap[t.user_id]?.email || 'Unknown'
        }));

        transactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        transactions = transactions.slice(0, parseInt(limit));

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
        const txRef = db.collection('transactions').doc(req.params.id);
        const txDoc = await txRef.get();
        if (!txDoc.exists) return res.status(404).json({ error: 'Transaction not found' });

        const updateData = {
            status,
            updated_at: new Date().toISOString()
        };
        if (admin_note !== undefined) {
            updateData.admin_note = admin_note;
        }

        await txRef.update(updateData);
        
        const updatedDoc = await txRef.get();
        const tData = updatedDoc.data();
        
        // Manual join
        let user_name = 'Unknown', user_email = 'Unknown';
        const uDoc = await db.collection('users').doc(tData.user_id).get();
        if (uDoc.exists) {
            user_name = uDoc.data().full_name;
            user_email = uDoc.data().email;
        }

        res.json({ transaction: { id: updatedDoc.id, ...tData, user_name, user_email } });
    } catch (err) {
        console.error('Admin update transaction error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
    try {
        const db = await getDatabase();
        
        const usersSnap = await db.collection('users').get();
        const txSnap = await db.collection('transactions').get();
        
        const txCounts = {};
        txSnap.forEach(t => {
            const uid = t.data().user_id;
            txCounts[uid] = (txCounts[uid] || 0) + 1;
        });

        let users = [];
        usersSnap.forEach(u => {
            users.push({
                id: u.id,
                ...u.data(),
                transaction_count: txCounts[u.id] || 0
            });
        });

        users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        res.json({ users });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
    try {
        const db = await getDatabase();
        
        const txSnap = await db.collection('transactions').get();
        const uSnap = await db.collection('users').where('role', '==', 'user').get();

        const txStats = { total: 0, pending: 0, approved: 0, completed: 0, rejected: 0, total_fees: 0, total_volume: 0 };
        
        txSnap.forEach(doc => {
            txStats.total++;
            const t = doc.data();
            if (t.status === 'pending') txStats.pending++;
            else if (t.status === 'approved') txStats.approved++;
            else if (t.status === 'completed') {
                txStats.completed++;
                txStats.total_fees += t.fee_amount || 0;
                txStats.total_volume += t.send_amount || 0;
            }
            else if (t.status === 'rejected') txStats.rejected++;
        });

        res.json({ transactions: txStats, users: uSnap.size });
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
        const snapshot = await db.collection('method_fees').get();
        const pairs = [];
        snapshot.forEach(doc => pairs.push({ id: doc.id, ...doc.data() }));
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
        const existsSnap = await db.collection('method_fees')
            .where('send_method', '==', send_method)
            .where('receive_method', '==', receive_method).get();

        if (!existsSnap.empty) {
            return res.status(409).json({ error: 'A configuration for this pair already exists' });
        }

        const newData = {
            send_method, receive_method, 
            base_amount: parseFloat(base_amount), 
            base_fee: parseFloat(base_fee)
        };
        const docRef = await db.collection('method_fees').add(newData);
        
        res.status(201).json({ pair: { id: docRef.id, ...newData } });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/method-fees/:id', async (req, res) => {
    try {
        const db = await getDatabase();
        await db.collection('method_fees').doc(req.params.id).delete();
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
        const ref = db.collection('payment_methods').doc(id);
        const exists = await ref.get();
        if (exists.exists) {
            return res.status(400).json({ error: 'A method with this ID already exists' });
        }

        await ref.set({ id, name_key, icon, instructions: instructions || '' });
        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/methods/:id', async (req, res) => {
    try {
        const { name_key, icon, instructions } = req.body;
        const db = await getDatabase();
        await db.collection('payment_methods').doc(req.params.id).update({
            name_key, icon, instructions: instructions || ''
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/methods/:id', async (req, res) => {
    try {
        const db = await getDatabase();
        await db.collection('payment_methods').doc(req.params.id).delete();

        // Delete all associated fees
        const feesRef = db.collection('method_fees');
        const sSnap = await feesRef.where('send_method', '==', req.params.id).get();
        const rSnap = await feesRef.where('receive_method', '==', req.params.id).get();
        
        const batch = db.batch();
        sSnap.forEach(d => batch.delete(d.ref));
        rSnap.forEach(d => batch.delete(d.ref));
        await batch.commit();

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
