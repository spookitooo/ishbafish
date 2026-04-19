const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(process.cwd(), 'database', 'exchange.db');
const SCHEMA_PATH = path.join(process.cwd(), 'database', 'schema.sql');

let _db = null;

// Local query helper (avoids circular dependency with middleware/auth.js)
function queryOne(db, sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    let result = null;
    if (stmt.step()) {
        const cols = stmt.getColumnNames();
        const vals = stmt.get();
        result = {};
        cols.forEach((c, i) => { result[c] = vals[i]; });
    }
    stmt.free();
    return result;
}

async function getDatabase() {
    if (_db) return _db;

    // Explicitly load the WASM binary so sql.js works on Vercel's serverless environment
    const wasmPath = path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
    let sqlConfig = {};
    if (fs.existsSync(wasmPath)) {
        sqlConfig.wasmBinary = fs.readFileSync(wasmPath);
    }
    const SQL = await initSqlJs(sqlConfig);

    // Load existing database or create new
    // On Vercel, the filesystem is read-only.
    if (fs.existsSync(DB_PATH)) {
        try {
            const fileBuffer = fs.readFileSync(DB_PATH);
            _db = new SQL.Database(fileBuffer);
        } catch (err) {
            console.error('Error reading database file:', err);
            _db = new SQL.Database();
        }
    } else {
        _db = new SQL.Database();
    }

    return _db;
}

function saveDatabase() {
    if (!_db) return;
    
    // Vercel filesystem is read-only. Cannot save to DB_PATH.
    if (process.env.VERCEL) {
        console.warn('⚠️ Running on Vercel: Database persistence is disabled (Read-only filesystem).');
        return;
    }

    try {
        const data = _db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(DB_PATH, buffer);
    } catch (err) {
        console.error('Failed to save database:', err);
    }
}

async function initDatabase() {
    console.log('🔄 Initializing database...');
    console.log('📂 CWD:', process.cwd());
    console.log('📂 DB_PATH:', DB_PATH);
    try {
        const db = await getDatabase();
        
        console.log('📖 Reading schema.sql at:', SCHEMA_PATH);
        if (!fs.existsSync(SCHEMA_PATH)) {
            throw new Error(`schema.sql not found at ${SCHEMA_PATH}. Files in folder: ${fs.readdirSync(path.dirname(SCHEMA_PATH)).join(', ')}`);
        }
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
        db.run(schema);
        console.log('✅ Schema applied');

    // Seed default admin account
    const adminCheck = db.exec("SELECT id FROM users WHERE email = 'admin@exchange.com'");
    if (adminCheck.length === 0 || adminCheck[0].values.length === 0) {
        const hash = bcrypt.hashSync('admin123', 10);
        db.run("INSERT INTO users (full_name, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
            ['Admin', 'admin', 'admin@exchange.com', hash, 'admin']);
        console.log('✅ Default admin created: admin@exchange.com / admin123');
    }

    // Ensure ayubnawzad199@gmail.com is always admin
    const ayubCheck = queryOne(db, "SELECT id, role FROM users WHERE email = ?", ['ayubnawzad199@gmail.com']);
    if (ayubCheck && ayubCheck.role !== 'admin') {
        db.run("UPDATE users SET role = 'admin' WHERE email = ?", ['ayubnawzad199@gmail.com']);
        console.log('✅ ayubnawzad199@gmail.com promoted to admin');
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

        if (!process.env.VERCEL) {
            saveDatabase();
        }
        console.log('✅ Database initialized successfully');
    } catch (err) {
        console.error('❌ CRITICAL: Database initialization failed:', err);
        // On Vercel, we want to know why it failed in the logs
        throw err;
    }
}

// Auto-save periodically
if (!process.env.VERCEL) {
    setInterval(() => {
        if (_db) saveDatabase();
    }, 10000);
}

// Save on exit
process.on('exit', () => { if (_db && !process.env.VERCEL) saveDatabase(); });
process.on('SIGINT', () => { if (_db && !process.env.VERCEL) saveDatabase(); process.exit(); });

module.exports = { initDatabase, getDatabase, saveDatabase, DB_PATH };
