/* ============================================
   Exchange Page App Logic & Multi-Step
   ============================================ */

let methodFeesPairs = [];
let currentStep = 1;

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;
    renderNav();
    applyLanguage();

    await loadGlobalMethods();
    await loadMethodFees();
    populateSelects();
    loadRecentTransactions();

    // Listeners for Step 1 Live calc and dynamic filtering
    document.getElementById('send-amount').addEventListener('input', calculatePreview);
    document.getElementById('send-method').addEventListener('change', () => { filterReceiveMethods(); calculatePreview(); });
    document.getElementById('receive-method').addEventListener('change', calculatePreview);

    // Enter key intercept
    document.getElementById('exchange-form').addEventListener('keydown', e => {
        if(e.key === 'Enter') e.preventDefault(); 
    });

    // Step 2 validation
    document.getElementById('receiver-account').addEventListener('input', checkStep2);
});

async function loadMethodFees() {
    try {
        const data = await api('/transactions/fees');
        if (data && data.pairs) {
            methodFeesPairs = data.pairs;
        }
    } catch (err) {
        console.error('Failed to load method fees:', err);
    }
}

function populateSelects() {
    const sendMethodSelect = document.getElementById('send-method');
    const receiveMethodSelect = document.getElementById('receive-method');

    sendMethodSelect.innerHTML = `<option value="" data-i18n="select_method">${t('select_method')}</option>`;
    receiveMethodSelect.innerHTML = `<option value="" data-i18n="select_method">${t('select_method')}</option>`;

    globalMethods.forEach(m => {
        const opt1 = new Option(`${m.icon}  ${t(m.name_key) || m.name_key}`, m.id);
        const opt2 = new Option(`${m.icon}  ${t(m.name_key) || m.name_key}`, m.id);
        sendMethodSelect.add(opt1);
        receiveMethodSelect.add(opt2);
    });
}

function filterReceiveMethods() {
    const sendMethod = document.getElementById('send-method').value;
    const receiveMethodSelect = document.getElementById('receive-method');
    const currentReceive = receiveMethodSelect.value;

    Array.from(receiveMethodSelect.options).forEach(opt => {
        if (!opt.value) return; // skip placeholder
        if (opt.value === sendMethod) {
            opt.disabled = true;
            if (currentReceive === sendMethod) receiveMethodSelect.value = ''; // Reset if overlapped
        } else {
            opt.disabled = false;
        }
    });
}

function swapMethods() {
    const sendMethod = document.getElementById('send-method');
    const receiveMethod = document.getElementById('receive-method');
    const temp = sendMethod.value;
    
    // reset disables before swap
    Array.from(receiveMethod.options).forEach(opt => opt.disabled = false);
    Array.from(sendMethod.options).forEach(opt => opt.disabled = false);

    sendMethod.value = receiveMethod.value;
    receiveMethod.value = temp;

    filterReceiveMethods();
    calculatePreview();
}

function calculatePreview() {
    const sendAmountStr = document.getElementById('send-amount').value;
    const sendAmount = parseFloat(sendAmountStr);
    const sendMethod = document.getElementById('send-method').value;
    const receiveMethod = document.getElementById('receive-method').value;
    
    const previewBox = document.getElementById('preview-box');
    const errorWarning = document.getElementById('pair-error-warning');
    const btnNextAccount = document.getElementById('btn-next-account');

    errorWarning.style.display = 'none';
    btnNextAccount.disabled = true;

    if (!sendAmount || sendAmount <= 0 || !sendMethod || !receiveMethod || sendMethod === receiveMethod) {
        previewBox.style.display = 'none';
        document.getElementById('receive-amount').value = '';
        return;
    }

    const pair = methodFeesPairs.find(p => p.send_method === sendMethod && p.receive_method === receiveMethod);

    if (!pair) {
        previewBox.style.display = 'none';
        document.getElementById('receive-amount').value = '';
        errorWarning.style.display = 'block'; 
        return;
    }

    let feeAmount = pair.base_fee;
    if (sendAmount >= pair.base_amount) {
        feeAmount = (sendAmount / pair.base_amount) * pair.base_fee;
    }

    const receiveAmount = sendAmount - feeAmount;

    if (receiveAmount <= 0) {
        previewBox.style.display = 'none';
        document.getElementById('receive-amount').value = '';
        return;
    }

    document.getElementById('receive-amount').value = formatMoney(receiveAmount, 'IQD');
    
    previewBox.style.display = 'block';
    document.getElementById('preview-fee').textContent = `${formatMoney(feeAmount, 'IQD')} IQD`;
    document.getElementById('preview-send').textContent = `${formatMoney(sendAmount, 'IQD')} IQD`;
    document.getElementById('preview-receive').textContent = `${formatMoney(receiveAmount, 'IQD')} IQD`;

    btnNextAccount.disabled = false;
}

// === MULTI-STEP LOGIC ===
function goToStep(step) {
    // Navigational Validation
    if (step === 2) {
        // Build Prompt for Step 2
        const recId = document.getElementById('receive-method').value;
        const recObj = globalMethods.find(m => m.id === recId);
        const name = recObj ? (t(recObj.name_key) || recObj.name_key) : recId;
        document.getElementById('receiver-prompt').textContent = t('prompt_enter_details').replace('{name}', name);
        checkStep2();
    }
    if (step === 3) {
        // Build Instructions for Step 3
        if (!document.getElementById('receiver-account').value.trim()) {
            showToast("Please enter receiving account details", "error");
            return;
        }

        const sndId = document.getElementById('send-method').value;
        const sndObj = globalMethods.find(m => m.id === sndId);
        const name = sndObj ? (t(sndObj.name_key) || sndObj.name_key) : sndId;
        const sendAmount = document.getElementById('send-amount').value;

        document.getElementById('instruction-title').textContent = t('instruction_send').replace('{amount}', formatMoney(sendAmount, 'IQD')).replace('{name}', name);
        document.getElementById('instruction-text').innerHTML = sndObj && sndObj.instructions 
            ? sndObj.instructions.replace(/\n/g, '<br>') 
            : t('no_instructions');
        checkStep3();
    }

    document.querySelectorAll('.wizard-step').forEach(el => el.classList.remove('active'));
    document.getElementById(`step-${step}`).classList.add('active');
    currentStep = step;
}

function checkStep2() {
    const val = document.getElementById('receiver-account').value.trim();
    document.getElementById('btn-next-payment').disabled = val.length === 0;
}

function checkStep3() {
    const proofBase64 = document.getElementById('proof-b64').value;
    document.getElementById('btn-complete').disabled = !proofBase64;
}

// === Image compression Handler ===
async function handleProofUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const previewEl = document.getElementById('proof-preview');
        // Visual loading
        previewEl.style.display = 'block';
        previewEl.src = '';
        
        // Compress the image! (Max 1200px width/height, 80% WebP quality)
        const b64 = await compressImageToWebP(file, 1000, 0.7);
        
        document.getElementById('proof-b64').value = b64;
        previewEl.src = b64; // Show compressed result
        
        checkStep3(); // Unlock complete button

    } catch(err) {
        console.error("Compression failed", err);
        showToast("Failed to process image", "error");
    }
}

// === API Submit ===
async function submitTransaction() {
    const btn = document.getElementById('btn-complete');
    
    const send_method = document.getElementById('send-method').value;
    const receive_method = document.getElementById('receive-method').value;
    const send_amount = parseFloat(document.getElementById('send-amount').value);
    const receiver_account = document.getElementById('receiver-account').value.trim();
    const proof_image = document.getElementById('proof-b64').value;

    btn.disabled = true;

    try {
        const data = await api('/transactions', {
            method: 'POST',
            body: { send_method, receive_method, send_amount, receiver_account, proof_image }
        });

        if (data) {
            showToast(t('request_submitted'), 'success');
            
            // Hard Reset entire flow
            document.getElementById('exchange-form').reset();
            document.getElementById('proof-preview').src = '';
            document.getElementById('proof-preview').style.display = 'none';
            document.getElementById('proof-b64').value = '';
            
            goToStep(1);
            filterReceiveMethods();
            calculatePreview();
            
            loadRecentTransactions();
        }
    } catch (err) {
        showToast(err.message || t('error'), 'error');
        btn.disabled = false;
    }
}

async function loadRecentTransactions() {
    try {
        const data = await api('/transactions?limit=5');
        if (!data) return;

        const container = document.getElementById('recent-transactions');

        if (data.transactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">💱</div>
                    <p data-i18n="no_transactions">${t('no_transactions')}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = data.transactions.map(tx => `
            <div class="transaction-item">
                <div class="transaction-icon">${getMethodIcon(tx.send_method)}</div>
                <div class="transaction-info">
                    <h4>${getMethodName(tx.send_method)} → ${getMethodName(tx.receive_method)}</h4>
                    <span>${formatDate(tx.created_at)}</span>
                </div>
                <div class="transaction-amount">
                    <div class="send">${formatMoney(tx.send_amount, 'IQD')} IQD</div>
                    <div class="receive">${formatMoney(tx.receive_amount, 'IQD')} IQD</div>
                </div>
                <span class="status-badge ${getStatusClass(tx.status)}">${t(tx.status)}</span>
            </div>
        `).join('');
    } catch (err) {
        console.error('Failed to load transactions:', err);
    }
}
