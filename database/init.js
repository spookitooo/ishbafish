const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let _db = null;

async function getDatabase() {
    if (_db) return _db;

    const certPath = path.join(process.cwd(), 'firebase-service-account.json');
    let credential;

    if (process.env.FIREBASE_PROJECT_ID) {
        credential = admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        });
    } else if (fs.existsSync(certPath)) {
        credential = admin.credential.cert(require(certPath));
    } else {
        throw new Error("No Firebase credentials provided. Provide firebase-service-account.json or env vars.");
    }

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: credential
        });
    }

    _db = admin.firestore();
    return _db;
}

function saveDatabase() {
    // No-op for Firebase, data is synced in real-time
}

async function initDatabase() {
    console.log('Firebase initialized. Checking default data...');
    const db = await getDatabase();
    
    // Check missing payment methods
    const pmCheck = await db.collection('payment_methods').limit(1).get();
    if (pmCheck.empty) {
        await db.collection('payment_methods').doc('fastpay').set({ id: 'fastpay', name_key: 'fastpay', icon: 'zap', instructions: '' });
        await db.collection('payment_methods').doc('qi').set({ id: 'qi', name_key: 'qi', icon: 'credit-card', instructions: '' });
        await db.collection('payment_methods').doc('zaincash').set({ id: 'zaincash', name_key: 'zaincash', icon: 'smartphone', instructions: '' });
    }

    // Check missing fees
    const fsCheck = await db.collection('method_fees').limit(1).get();
    if (fsCheck.empty) {
        await db.collection('method_fees').add({ send_method: 'fastpay', receive_method: 'qi', base_amount: 100000, base_fee: 1000 });
        await db.collection('method_fees').add({ send_method: 'qi', receive_method: 'zaincash', base_amount: 100000, base_fee: 1500 });
    }
}

module.exports = { getDatabase, saveDatabase, initDatabase };
