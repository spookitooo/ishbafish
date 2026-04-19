/* ============================================
   ئاڵوگۆڕی دراو — Exchange Money Platform
   Core Application Logic
   ============================================ */

const API_BASE = '/api';

// === Auth State ===
function getToken() {
    return localStorage.getItem('token');
}

function getUser() {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
}

function setAuth(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

function isLoggedIn() {
    return !!getToken();
}

function isAdmin() {
    const user = getUser();
    return user && user.role === 'admin';
}

// === API Helper ===
async function api(endpoint, options = {}) {
    const token = getToken();
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        ...options,
    };

    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await res.json();

        if (!res.ok) {
            // Don't auto-redirect 401s if we are currently trying to log in
            if (res.status === 401 && !endpoint.includes('/login')) {
                clearAuth();
                window.location.href = '/login';
                return null;
            }
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (err) {
        console.error('API Error:', err);
        throw err;
    }
}

// === Toast Notifications ===
function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</div>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// === Payment Methods State (Pulled Dynamically) ===
let globalMethods = [];

async function loadGlobalMethods() {
    try {
        const data = await api('/methods');
        if (data && data.methods) {
            globalMethods = data.methods;
        }
    } catch(err) {
        console.error("Failed to load global payment methods:", err);
    }
}

// === Navigation ===
function renderNav() {
    const nav = document.getElementById('main-nav');
    if (!nav) return;

    const user = getUser();
    const currentPage = window.location.pathname;

    nav.innerHTML = `
        <div class="nav-content">
            <a href="/exchange" class="nav-logo">
                <div class="nav-logo-icon">
                    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="14" stroke="url(#navGrad)" stroke-width="2.5"/>
                        <path d="M10 16h12M16 10v12" stroke="url(#navGrad)" stroke-width="2" stroke-linecap="round"/>
                        <defs><linearGradient id="navGrad" x1="0" y1="0" x2="32" y2="32"><stop offset="0%" stop-color="#6C63FF"/><stop offset="100%" stop-color="#F857A6"/></linearGradient></defs>
                    </svg>
                </div>
                <span class="nav-title" data-i18n="app_name">${t('app_name')}</span>
            </a>
            <div class="nav-links">
                <a href="/exchange" class="nav-link ${currentPage === '/exchange' ? 'active' : ''}" data-i18n="nav_exchange">${t('nav_exchange')}</a>
                <a href="/history" class="nav-link ${currentPage === '/history' ? 'active' : ''}" data-i18n="nav_history">${t('nav_history')}</a>
                ${user?.role === 'admin' ? `<a href="/admin" class="nav-link ${currentPage === '/admin' ? 'active' : ''}" data-i18n="nav_admin">${t('nav_admin')}</a>` : ''}
            </div>
            <div class="nav-right">
                <div class="lang-switcher">
                    <button class="lang-btn ${getLang() === 'ku' ? 'active' : ''}" data-lang="ku" onclick="setLang('ku'); renderNav();">کوردی</button>
                    <button class="lang-btn ${getLang() === 'en' ? 'active' : ''}" data-lang="en" onclick="setLang('en'); renderNav();">EN</button>
                    <button class="lang-btn ${getLang() === 'ar' ? 'active' : ''}" data-lang="ar" onclick="setLang('ar'); renderNav();">عربی</button>
                </div>
                <div class="nav-user">
                    <div class="nav-user-avatar">${user?.full_name?.charAt(0) || 'U'}</div>
                    <span class="nav-user-name">${user?.full_name || ''}</span>
                    <button class="nav-logout-btn" onclick="handleLogout()" data-i18n="logout">${t('logout')}</button>
                </div>
            </div>
        </div>
    `;
}

function handleLogout() {
    clearAuth();
    window.location.href = '/login';
}

// === Guard Pages ===
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = '/login';
        return false;
    }
    return true;
}

function requireAdminAuth() {
    if (!isLoggedIn() || !isAdmin()) {
        window.location.href = '/login';
        return false;
    }
    return true;
}

// === Format Helpers ===
function formatMoney(amount, currency = 'USD') {
    return Number(amount).toLocaleString('en-US', {
        minimumFractionDigits: currency === 'IQD' ? 0 : 2,
        maximumFractionDigits: currency === 'IQD' ? 0 : 2
    });
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'Z');
    return d.toLocaleDateString(getLang() === 'en' ? 'en-US' : 'ar-IQ', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function getStatusClass(status) {
    const map = { pending: 'status-pending', approved: 'status-approved', rejected: 'status-rejected', completed: 'status-completed' };
    return map[status] || '';
}

function getMethodName(methodId) {
    const m = globalMethods.find(p => p.id === methodId);
    return m ? t(m.name_key) : methodId;
}

function getMethodIcon(methodId) {
    const m = globalMethods.find(p => p.id === methodId);
    return m ? m.icon : '💱';
}

// Image Compression Helper
async function compressImageToWebP(file, maxDimension = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Scale proportionally
                if (width > height) {
                    if (width > maxDimension) {
                        height *= maxDimension / width;
                        width = maxDimension;
                    }
                } else {
                    if (height > maxDimension) {
                        width *= maxDimension / height;
                        height = maxDimension;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Export to WebP specifically to save maximum space
                const dataUrl = canvas.toDataURL('image/webp', quality);
                resolve(dataUrl);
            };
            img.onerror = (e) => reject(e);
        };
        reader.onerror = (e) => reject(e);
    });
}
