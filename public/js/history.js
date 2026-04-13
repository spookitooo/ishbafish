/* ============================================
   History Page Logic
   ============================================ */

let currentFilter = '';

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;
    renderNav();
    applyLanguage();
    loadStats();
    loadTransactions();
});

async function loadStats() {
    try {
        const data = await api('/transactions/stats');
        if (!data) return;
        document.getElementById('stat-total').textContent = data.stats.total || 0;
        document.getElementById('stat-pending').textContent = data.stats.pending || 0;
        document.getElementById('stat-completed').textContent = data.stats.completed || 0;
        document.getElementById('stat-rejected').textContent = data.stats.rejected || 0;
    } catch (err) {
        console.error('Failed to load stats:', err);
    }
}

async function loadTransactions(status = '') {
    try {
        const query = status ? `?status=${status}` : '';
        const data = await api(`/transactions${query}`);
        if (!data) return;

        const container = document.getElementById('transaction-list');

        if (data.transactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <p data-i18n="no_transactions">${t('no_transactions')}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = data.transactions.map(tx => `
            <div class="transaction-item" style="animation: fadeSlideUp 0.4s ease-out both; animation-delay: ${data.transactions.indexOf(tx) * 0.05}s;">
                <div class="transaction-icon">${getMethodIcon(tx.send_method)}</div>
                <div class="transaction-info">
                    <h4>${getMethodName(tx.send_method)} → ${getMethodName(tx.receive_method)}</h4>
                    <span>#${tx.id} · ${formatDate(tx.created_at)}</span>
                </div>
                <div class="transaction-amount">
                    <div class="send">-${formatMoney(tx.send_amount, 'IQD')} IQD</div>
                    <div class="receive">+${formatMoney(tx.receive_amount, 'IQD')} IQD</div>
                </div>
                <span class="status-badge ${getStatusClass(tx.status)}">${t(tx.status)}</span>
            </div>
        `).join('');
    } catch (err) {
        console.error('Failed to load transactions:', err);
    }
}

function filterTransactions(btn, status) {
    currentFilter = status;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadTransactions(status);
}
