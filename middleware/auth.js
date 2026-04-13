const jwt = require('jsonwebtoken');
const { getDatabase } = require('../database/init');

const JWT_SECRET = process.env.JWT_SECRET || 'exchange-money-secret-key-2026';

// Helper to run a query and get one row as object
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

// Helper to run a query and get all rows as objects
function queryAll(db, sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
        const cols = stmt.getColumnNames();
        const vals = stmt.get();
        const row = {};
        cols.forEach((c, i) => { row[c] = vals[i]; });
        results.push(row);
    }
    stmt.free();
    return results;
}

// Helper to run an INSERT/UPDATE and get changes
function runSql(db, sql, params = []) {
    db.run(sql, params);
    // For getting lastInsertRowid
    const idResult = db.exec("SELECT last_insert_rowid() as id");
    const lastId = idResult.length > 0 ? idResult[0].values[0][0] : null;
    return { lastInsertRowid: lastId };
}

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
        const user = queryOne(db, 'SELECT id, full_name, email, role, language, created_at FROM users WHERE id = ?', [decoded.userId]);

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user;
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

module.exports = { authenticate, requireAdmin, JWT_SECRET, queryOne, queryAll, runSql };
