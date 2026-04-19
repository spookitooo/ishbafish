-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
    language TEXT DEFAULT 'ku' CHECK(language IN ('ku', 'en', 'ar')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Payment Methods Configuration
CREATE TABLE IF NOT EXISTS payment_methods (
    id TEXT PRIMARY KEY,
    name_key TEXT NOT NULL,
    icon TEXT NOT NULL,
    instructions TEXT
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    send_method TEXT NOT NULL,
    receive_method TEXT NOT NULL,
    send_amount REAL NOT NULL,
    receive_amount REAL NOT NULL,
    fee_amount REAL NOT NULL DEFAULT 0,
    receiver_account TEXT NOT NULL,
    proof_image TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'completed')),
    admin_note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (send_method) REFERENCES payment_methods(id),
    FOREIGN KEY (receive_method) REFERENCES payment_methods(id)
);

-- Method Fees configuration table
CREATE TABLE IF NOT EXISTS method_fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    send_method TEXT NOT NULL,
    receive_method TEXT NOT NULL,
    base_amount REAL NOT NULL,
    base_fee REAL NOT NULL,
    UNIQUE(send_method, receive_method)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
