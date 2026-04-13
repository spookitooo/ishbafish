/* ============================================
   Admin Panel Logic & Methods Manager
   ============================================ */

let currentTab = 'transactions';
let adminFilterStatus = '';
let modalAction = null;
let modalTxId = null;

let localMethodsCache = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAdminAuth()) return;
    renderNav();
    applyLanguage();

    // Make sure we have methods before rendering dependent UI
    await loadGlobalMethods();
    localMethodsCache = globalMethods;
    
    loadAdminStats();
    loadAdminTransactions();
});

// === Stats ===
async function loadAdminStats() {
    try {
        const data = await api('/admin/stats');
        if (!data) return;
        document.getElementById('stat-total').textContent = data.transactions.total || 0;
        document.getElementById('stat-pending').textContent = data.transactions.pending || 0;
        document.getElementById('stat-volume').textContent = formatMoney(data.transactions.total_volume || 0, 'IQD');
        document.getElementById('stat-fees').textContent = formatMoney(data.transactions.total_fees || 0, 'IQD');
        document.getElementById('stat-users').textContent = data.users || 0;
    } catch (err) {
        console.error('Failed to load admin stats:', err);
    }
}

// === Tab Switching ===
function switchTab(btn, tab) {
    currentTab = tab;
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');

    const filterBar = document.getElementById('admin-filter-bar');
    filterBar.style.display = tab === 'transactions' ? 'flex' : 'none';

    if (tab === 'transactions') loadAdminTransactions();
    else if (tab === 'users') loadAdminUsers();
    else if (tab === 'settings') loadAdminSettings();
}

// === Transactions ===
async function loadAdminTransactions(status = '') {
    try {
        const query = status ? `?status=${status}` : '';
        const data = await api(`/admin/transactions${query}`);
        if (!data) return;

        const container = document.getElementById('admin-content');

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
            <div class="admin-transaction-item" id="tx-${tx.id}" style="animation: fadeSlideUp 0.4s ease-out both;">
                <div style="font-size:0.78rem; color:var(--text-muted); font-weight:700; direction:ltr;">#${tx.id}</div>
                <div>
                    <div style="font-size:0.88rem; font-weight:700;">${tx.user_name}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${tx.user_email}</div>
                    <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">${formatDate(tx.created_at)}</div>
                    
                    <!-- Receiver Info Display -->
                    <div style="margin-top:8px; padding:6px; background:var(--bg-input); border-radius:4px; font-size:0.8rem;">
                        <strong style="color:var(--text-primary);">Receiver:</strong> ${tx.receiver_account}
                    </div>
                </div>
                <div>
                    <div style="font-size:0.82rem; font-weight:700;">${getMethodName(tx.send_method)} → ${getMethodName(tx.receive_method)}</div>
                    <div style="font-size:0.82rem; color:var(--text-secondary); direction:ltr; text-align:right;">
                        ${formatMoney(tx.send_amount, 'IQD')} IQD → ${formatMoney(tx.receive_amount, 'IQD')} IQD
                    </div>
                    <div style="font-size:0.72rem; color:var(--text-muted);">${t('fee')}: ${formatMoney(tx.fee_amount, 'IQD')} IQD</div>
                    
                    <button class="btn btn-secondary btn-sm" style="margin-top:10px; width:100%; border:1px solid var(--accent-primary);" onclick="viewProof('${tx.proof_image}')">View Payment Proof</button>

                    ${tx.admin_note ? `<div style="font-size:0.72rem; color:var(--accent-secondary); margin-top:2px;">📝 ${tx.admin_note}</div>` : ''}
                </div>
                <span class="status-badge ${getStatusClass(tx.status)}">${t(tx.status)}</span>
                <div class="admin-actions">
                    ${tx.status === 'pending' ? `
                        <button class="btn btn-success btn-sm" onclick="openModal(${tx.id}, 'approved')">${t('approve')}</button>
                        <button class="btn btn-danger btn-sm" onclick="openModal(${tx.id}, 'rejected')">${t('reject')}</button>
                    ` : ''}
                    ${tx.status === 'approved' ? `
                        <button class="btn btn-primary btn-sm" onclick="openModal(${tx.id}, 'completed')">${t('complete')}</button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Failed to load admin transactions:', err);
    }
}

function adminFilter(btn, status) {
    adminFilterStatus = status;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadAdminTransactions(status);
}

// === Proof Viewer Modal ===
function viewProof(base64str) {
    document.getElementById('proof-modal-img').src = base64str;
    document.getElementById('proof-modal-overlay').style.display = 'flex';
}
function closeProofModal() {
    document.getElementById('proof-modal-overlay').style.display = 'none';
    document.getElementById('proof-modal-img').src = '';
}


// === Users ===
async function loadAdminUsers() {
    try {
        const data = await api('/admin/users');
        if (!data) return;

        const container = document.getElementById('admin-content');
        container.innerHTML = data.users.map(u => `
            <div class="user-list-item" style="animation: fadeSlideUp 0.4s ease-out both;">
                <div class="user-avatar-small">${u.full_name.charAt(0)}</div>
                <div class="user-info-col">
                    <h4>${u.full_name}</h4>
                    <span>${u.email} · ${t(u.role)} · ${formatDate(u.created_at)}</span>
                </div>
                <div style="font-size:0.85rem; font-weight:700; color:var(--accent-tertiary);">${u.transaction_count} ${t('total_transactions')}</div>
                <span class="status-badge ${u.role === 'admin' ? 'status-approved' : 'status-completed'}">${t(u.role)}</span>
            </div>
        `).join('');
    } catch (err) {
        console.error('Failed to load users:', err);
    }
}

// === Settings Grid (Methods + Pairs) ===
async function loadAdminSettings() {
    try {
        // Reload fresh from DB just in case
        await loadGlobalMethods();
        localMethodsCache = globalMethods;
        
        const data = await api('/admin/method-fees');
        if (!data) return;
        const pairs = data.pairs;

        const container = document.getElementById('admin-content');

        let methodOptions = localMethodsCache.map(m => `<option value="${m.id}">${t(m.name_key) || m.name_key}</option>`).join('');

        let html = `<div class="method-settings-grid">`;

        // LEFT COLUMN: Payment Methods Config
        html += `
        <div>
            <div class="card" style="margin-bottom:20px;">
                <h3 class="card-title">Add/Edit Payment Method</h3>
                <form id="add-method-form" onsubmit="addMethod(event)" style="display:flex; flex-direction:column; gap:10px;">
                    <div style="display:flex; gap:10px;">
                        <input type="text" id="method-id" class="form-input" placeholder="ID (e.g. fib)" required>
                        <input type="text" id="method-icon" class="form-input" placeholder="Icon (e.g. 🏦)" required style="width:100px;">
                    </div>
                    <input type="text" id="method-name" class="form-input" placeholder="Name Key / Title" required>
                    <textarea id="method-instructions" class="form-input" placeholder="Payment Instructions. Tell the user exactly how to send funds to this method." rows="4"></textarea>
                    <button type="submit" class="btn btn-primary">Save Method</button>
                </form>
            </div>

            <div class="card">
                <h3 class="card-title">Available Methods</h3>
                <div style="display:flex; flex-direction:column; gap:8px;">
        `;
        
        if (localMethodsCache.length === 0) {
            html += `<p style="color:var(--text-muted);">No methods found.</p>`;
        } else {
            localMethodsCache.forEach(m => {
                html += `
                    <div style="background:var(--bg-input); padding:10px; border-radius:8px; border:1px solid var(--border-color);">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <div>
                                <strong>${m.icon} ${t(m.name_key) || m.name_key}</strong> <span style="font-size:0.7rem; color:var(--text-secondary);">(${m.id})</span>
                            </div>
                            <button class="btn btn-danger btn-sm" onclick="deleteMethod('${m.id}')">Del</button>
                        </div>
                        <div style="font-size:0.8rem; margin-top:5px; color:var(--text-muted);">${m.instructions || 'No instructions'}</div>
                    </div>
                `;
            });
        }
        html += `</div></div></div>`; // End Left Column


        // RIGHT COLUMN: Method Fee Pairs Map
        html += `
        <div>
            <div class="card" style="margin-bottom:20px;">
                <h3 class="card-title">Add New Pair Fee</h3>
                <form id="add-pair-form" onsubmit="addMethodPair(event)" style="display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end;">
                    <div class="form-group" style="flex:1; margin-bottom:0;">
                        <label class="form-label" style="font-size:0.75rem;">Send Method</label>
                        <select id="new-send-method" class="form-select" required>${methodOptions}</select>
                    </div>
                    <div class="form-group" style="flex:1; margin-bottom:0;">
                        <label class="form-label" style="font-size:0.75rem;">Receive Method</label>
                        <select id="new-receive-method" class="form-select" required>${methodOptions}</select>
                    </div>
                    <div class="form-group" style="flex:1; margin-bottom:0; min-width:100px;">
                        <label class="form-label" style="font-size:0.75rem;">Base Amount</label>
                        <input type="number" id="new-base-amount" class="form-input" min="1" required>
                    </div>
                    <div class="form-group" style="flex:1; margin-bottom:0; min-width:100px;">
                        <label class="form-label" style="font-size:0.75rem;">Base Fee</label>
                        <input type="number" id="new-base-fee" class="form-input" min="0" required>
                    </div>
                    <div style="width:100%; margin-top:5px;">
                        <button type="submit" class="btn btn-primary btn-block">Add Exchange Pair</button>
                    </div>
                </form>
            </div>
            
            <div class="card">
                <h3 class="card-title">Pair Fees Map</h3>
                <div style="display:flex; flex-direction:column; gap:8px;">
        `;
        
        if(pairs.length === 0) {
            html += `<p style="color:var(--text-muted); text-align:center;">No pairs configured</p>`;
        } else {
            pairs.forEach(p => {
                html += `
                    <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:var(--bg-input); border:1px solid var(--border-color); border-radius:var(--radius-sm);">
                        <div>
                            <div style="font-weight:700; font-size:0.95rem;">${getMethodName(p.send_method)} → ${getMethodName(p.receive_method)}</div>
                            <div style="font-size:0.8rem; color:var(--text-secondary);">Base Amount: ${formatMoney(p.base_amount, 'IQD')} | Fee: ${formatMoney(p.base_fee, 'IQD')}</div>
                        </div>
                        <button class="btn btn-danger btn-sm" onclick="deleteMethodPair(${p.id})">Del</button>
                    </div>
                `;
            });
        }
        html += `</div></div></div>`; // End Right Column
        html += `</div>`; // End Grid

        container.innerHTML = html;

    } catch (err) {
        console.error('Failed to load settings:', err);
    }
}

// Admins Manage Methods
async function addMethod(e) {
    e.preventDefault();
    const id = document.getElementById('method-id').value.trim();
    const icon = document.getElementById('method-icon').value.trim();
    const name_key = document.getElementById('method-name').value.trim();
    const instructions = document.getElementById('method-instructions').value;

    try {
        await api('/admin/methods', {
            method: 'POST',
            body: { id, name_key, icon, instructions }
        });
        showToast("Method saved", 'success');
        loadAdminSettings(); 
    } catch(err) {
        showToast(err.message || t('error'), 'error');
    }
}

async function deleteMethod(id) {
    if(!confirm("Delete this Payment Method AND all its paired fee rules?")) return;
    try {
        await api(`/admin/methods/${id}`, { method: 'DELETE' });
        showToast(t('success'), 'success');
        loadAdminSettings();
    } catch(err) {
        showToast(err.message, 'error');
    }
}

// Admins Manage Pairs
async function addMethodPair(e) {
    e.preventDefault();
    const send_method = document.getElementById('new-send-method').value;
    const receive_method = document.getElementById('new-receive-method').value;
    const base_amount = document.getElementById('new-base-amount').value;
    const base_fee = document.getElementById('new-base-fee').value;

    if (send_method === receive_method) {
        showToast("Send and Receive methods must be different", "error");
        return;
    }

    try {
        await api('/admin/method-fees', {
            method: 'POST',
            body: { send_method, receive_method, base_amount, base_fee }
        });
        showToast(t('success'), 'success');
        loadAdminSettings(); 
    } catch(err) {
        showToast(err.message || t('error'), 'error');
    }
}

async function deleteMethodPair(id) {
    if(!confirm("Are you sure?")) return;
    try {
        await api(`/admin/method-fees/${id}`, { method: 'DELETE' });
        showToast(t('success'), 'success');
        loadAdminSettings();
    } catch(err) {
        showToast(err.message, 'error');
    }
}

// === Action Modals ===
function openModal(txId, action) {
    modalTxId = txId;
    modalAction = action;

    const overlay = document.getElementById('modal-overlay');
    overlay.style.display = 'flex';

    const confirmBtn = document.getElementById('modal-confirm-btn');
    if (action === 'approved') {
        confirmBtn.className = 'btn btn-success btn-sm';
        confirmBtn.querySelector('span').textContent = t('approve');
    } else if (action === 'rejected') {
        confirmBtn.className = 'btn btn-danger btn-sm';
        confirmBtn.querySelector('span').textContent = t('reject');
    } else if (action === 'completed') {
        confirmBtn.className = 'btn btn-primary btn-sm';
        confirmBtn.querySelector('span').textContent = t('complete');
    }

    document.getElementById('modal-note').value = '';
}

function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
    modalTxId = null;
    modalAction = null;
}

async function confirmAction() {
    if (!modalTxId || !modalAction) return;
    const note = document.getElementById('modal-note').value;

    try {
        await api(`/admin/transactions/${modalTxId}`, {
            method: 'PATCH',
            body: { status: modalAction, admin_note: note }
        });

        showToast(t('success'), 'success');
        closeModal();
        loadAdminTransactions(adminFilterStatus);
        loadAdminStats();
    } catch (err) {
        showToast(err.message || t('error'), 'error');
    }
}
