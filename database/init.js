const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'exchange.db');

let _db = null;

async function getDatabase() {
    if (_db) return _db;

    const SQL = await initSqlJs();

    // Load existing database or create new
    if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        _db = new SQL.Database(fileBuffer);
    } else {
        _db = new SQL.Database();
    }

    return _db;
}

function saveDatabase() {
    if (!_db) return;
    const data = _db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
}

async function initDatabase() {
    const db = await getDatabase();

    // Read and execute schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    db.run(schema);

    // Seed default admin account
    const adminCheck = db.exec("SELECT id FROM users WHERE email = 'admin@exchange.com'");
    if (adminCheck.length === 0 || adminCheck[0].values.length === 0) {
        const hash = bcrypt.hashSync('admin123', 10);
        db.run("INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            ['Admin', 'admin@exchange.com', hash, 'admin']);
        console.log('✅ Default admin created: admin@exchange.com / admin123');
    }

    // Seed default Payment Methods
    const pmCheck = db.exec("SELECT id FROM payment_methods LIMIT 1");
    if (pmCheck.length === 0 || pmCheck[0].values.length === 0) {
        const methods = [
            ['fib', 'method_fib', '🏦', '07501234567 - First Iraqi Bank'],
            ['fastpay', 'method_fastpay', '⚡', '07501234567 - FastPay Number'],
            ['zaincash', 'method_zaincash', '📱', '07801234567 - ZainCash Wallet'],
            ['cash', 'method_cash', '💵', 'Visit our main office in Erbil to deposit.'],
            ['wu', 'method_wu', '💸', 'Ask for the Western Union receiver name.'],
            ['paypal', 'method_paypal', '🌐', 'payment123@example.com'],
            ['usdt', 'method_usdt', '₿', 'TRC20 Wallet: TYa... example']
        ];
        
        methods.forEach(m => {
            db.run("INSERT INTO payment_methods (id, name_key, icon, instructions) VALUES (?, ?, ?, ?)", m);
        });
        console.log('✅ Default Payment Methods seeded');
    }

    // Seed default method pair fees (Example)
    const methodFeeCheck = db.exec("SELECT id FROM method_fees LIMIT 1");
    if (methodFeeCheck.length === 0 || methodFeeCheck[0].values.length === 0) {
        db.run("INSERT INTO method_fees (send_method, receive_method, base_amount, base_fee) VALUES (?, ?, ?, ?)", ['fib', 'fastpay', 100000, 2000]);
        db.run("INSERT INTO method_fees (send_method, receive_method, base_amount, base_fee) VALUES (?, ?, ?, ?)", ['cash', 'fib', 50000, 1000]);
        console.log('✅ Default method pair fees seeded');
    }

    saveDatabase();
    console.log('✅ Database initialized successfully');
}

// Auto-save periodically
setInterval(() => {
    if (_db) saveDatabase();
}, 10000);

// Save on exit
process.on('exit', () => { if (_db) saveDatabase(); });
process.on('SIGINT', () => { if (_db) saveDatabase(); process.exit(); });

module.exports = { initDatabase, getDatabase, saveDatabase, DB_PATH };
