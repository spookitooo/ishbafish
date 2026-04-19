/* ============================================
   ئاڵوگۆڕی دراو — Exchange Money Platform
   i18n — Internationalization System
   Supports: Kurdish (ku), English (en), Arabic (ar)
   ============================================ */

const translations = {
    ku: {
        // App
        app_name: 'ئاڵوگۆڕی دراو',
        app_tagline: 'پلاتفۆرمی ئاڵوگۆڕی دراو بە ئاسانی و پشتڕاستی',

        // Auth
        login: 'چوونەژوورەوە',
        register: 'تۆمارکردن',
        logout: 'دەرچوون',
        full_name: 'ناوی تەواو',
        email: 'ئیمەیڵ',
        password: 'وشەی نهێنی',
        confirm_password: 'دووبارەکردنەوەی وشەی نهێنی',
        login_btn: 'بچۆ ژوورەوە',
        register_btn: 'تۆمار بکە',
        no_account: 'هەژمارت نییە؟',
        have_account: 'هەژمارت هەیە؟',
        create_account: 'هەژمار دروست بکە',
        login_here: 'لێرە بچۆ ژوورەوە',
        welcome_back: 'بەخێربێیتەوە',
        create_new_account: 'هەژماری نوێ دروست بکە',
        username: 'ناوی بەکارهێنەر',
        username_or_email: 'ناوی بەکارهێنەر یان ئیمەیڵ',
        username_placeholder: 'بۆ نموونە: ayub_123',
        username_hint: 'تەنها پیت، ژمارە، و _ بەکاربهێنە',

        // Navigation
        nav_exchange: 'ئاڵوگۆڕ',
        nav_history: 'مێژوو',
        nav_admin: 'بەڕێوەبەر',
        nav_settings: 'ڕێکخستنەکان',

        // Exchange
        exchange_title: 'ئاڵوگۆڕی دراو',
        exchange_subtitle: 'داواکاری ئاڵوگۆڕی نوێ دروست بکە',
        send_from: 'ناردن لە',
        receive_to: 'وەرگرتن لە',
        send_method: 'شێوازی ناردن',
        receive_method: 'شێوازی وەرگرتن',
        amount: 'بڕ',
        send_amount: 'بڕی ناردن',
        receive_amount: 'بڕی وەرگرتن',
        enter_amount: 'بڕەکە بنووسە',
        fee: 'کرێ',
        fee_percent: 'ڕێژەی کرێ',
        rate: 'نرخ',
        exchange_rate: 'نرخی ئاڵوگۆڕ',
        you_send: 'تۆ دەنێریت',
        you_receive: 'تۆ وەردەگریت',
        submit_request: 'داواکاری بنێرە',
        select_method: 'شێوازێک هەڵبژێرە',
        select_currency: 'دراوێک هەڵبژێرە',
        preview: 'پێشبینین',
        calculated_result: 'ئەنجامی حیسابکراو',

        // Transaction statuses
        pending: 'چاوەڕوان',
        approved: 'پەسەندکراو',
        rejected: 'ڕەتکراوە',
        completed: 'تەواوبوو',

        // History
        history_title: 'مێژووی مامەڵەکان',
        history_subtitle: 'هەموو مامەڵەکانت لێرە ببینە',
        transaction_id: 'ژمارەی مامەڵە',
        date: 'بەروار',
        status: 'بارودۆخ',
        details: 'وردەکاری',
        no_transactions: 'هیچ مامەڵەیەک نییە',
        filter_all: 'هەمووی',

        // Admin
        admin_title: 'پانێلی بەڕێوەبەر',
        admin_subtitle: 'بەڕێوەبردنی مامەڵەکان و بەکارهێنەران',
        all_transactions: 'هەموو مامەڵەکان',
        all_users: 'هەموو بەکارهێنەران',
        approve: 'پەسەندکردن',
        reject: 'ڕەتکردنەوە',
        complete: 'تەواوکردن',
        admin_note: 'تێبینی بەڕێوەبەر',
        total_transactions: 'کۆی مامەڵەکان',
        total_users: 'کۆی بەکارهێنەران',
        total_volume: 'کۆی قەبارە',
        total_fees: 'کۆی کرێ',
        settings: 'ڕێکخستنەکان',
        save_settings: 'پاشەکەوتکردن',
        dashboard: 'داشبۆرد',

        // Payment Methods
        method_fib: 'FIB - بانکی یەکەمی عێراق',
        method_fastpay: 'FastPay - فاستپەی',
        method_zaincash: 'ZainCash - زەینکاش',
        method_cash: 'کاش - نەقد',
        method_western_union: 'Western Union - وێستەرن یوونیەن',
        method_paypal: 'PayPal - پەیپاڵ',
        method_usdt: 'USDT - تێزەر',

        // Currencies
        currency_usd: 'دۆلاری ئەمریکی',
        currency_iqd: 'دیناری عێراقی',
        currency_eur: 'یۆرۆ',
        currency_gbp: 'پاوەندی بەریتانی',
        currency_try: 'لیرەی تورکی',

        // General
        loading: 'چاوەڕوانبە...',
        error: 'هەڵە',
        success: 'سەرکەوتوو',
        cancel: 'پاشگەزبوونەوە',
        close: 'داخستن',
        save: 'پاشەکەوتکردن',
        delete: 'سڕینەوە',
        search: 'گەڕان',
        language: 'زمان',
        user: 'بەکارهێنەر',
        admin: 'بەڕێوەبەر',
        request_submitted: 'داواکاریەکەت بە سەرکەوتوویی نێردرا!',
        fill_all_fields: 'تکایە هەموو خانەکان پڕ بکەرەوە',
        password_mismatch: 'وشەی نهێنی یەکناگرێتەوە',
        invalid_amount: 'تکایە بڕێکی دروست بنووسە',

        // Wizard Steps
        step_1: 'هەنگاوی ١: بڕەکە هەژمار بکە',
        step_2: 'هەنگاوی ٢: زانیاری وەرگرتن',
        step_3: 'هەنگاوی ٣: پارەدان و بەڵگە',
        send_order: 'ناردنی داواکاری',
        receiver_prompt: 'تکایە زانیاریەکانی وەرگرتن بنووسە.',
        receiver_account: 'هەژماری وەرگر (ژمارەی هەژمار / جزدان)',
        back: 'گەڕانەوە',
        next: 'دواتر',
        upload_proof: 'وێنەی بەڵگەی پارەدان (کاپچەر)',
        tap_to_upload: 'کلیک بکە بۆ وێنە دانان',
        complete_order: 'تەواوکردنی داواکاری',
        pair_error: 'ئەم ئاڵوگۆڕە بەردەست نییە.',
        prompt_enter_details: 'تکایە زانیاریەکانی {name} بنووسە بۆ وەرگرتنی پارەکە.',
        instruction_send: 'تکایە بڕی {amount} IQD لە ڕێگەی {name} بنێرە بۆ:',
        no_instructions: 'هیچ ڕێنماییەک بەردەست نییە.',
    },

    en: {
        app_name: 'Exchange Money',
        app_tagline: 'Simple and trusted money exchange platform',

        login: 'Login',
        register: 'Register',
        logout: 'Logout',
        full_name: 'Full Name',
        email: 'Email',
        password: 'Password',
        confirm_password: 'Confirm Password',
        login_btn: 'Sign In',
        register_btn: 'Create Account',
        no_account: "Don't have an account?",
        have_account: 'Already have an account?',
        create_account: 'Create Account',
        login_here: 'Login here',
        welcome_back: 'Welcome Back',
        create_new_account: 'Create New Account',
        username: 'Username',
        username_or_email: 'Username or Email',
        username_placeholder: 'e.g. ayub_123',
        username_hint: 'Only letters, numbers, and underscores',

        nav_exchange: 'Exchange',
        nav_history: 'History',
        nav_admin: 'Admin',
        nav_settings: 'Settings',

        exchange_title: 'Exchange Money',
        exchange_subtitle: 'Create a new exchange request',
        send_from: 'Send from',
        receive_to: 'Receive to',
        send_method: 'Sending Method',
        receive_method: 'Receiving Method',
        amount: 'Amount',
        send_amount: 'Send Amount',
        receive_amount: 'Receive Amount',
        enter_amount: 'Enter amount',
        fee: 'Fee',
        fee_percent: 'Fee Rate',
        rate: 'Rate',
        exchange_rate: 'Exchange Rate',
        you_send: 'You send',
        you_receive: 'You receive',
        submit_request: 'Submit Request',
        select_method: 'Select a method',
        select_currency: 'Select currency',
        preview: 'Preview',
        calculated_result: 'Calculated Result',

        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
        completed: 'Completed',

        history_title: 'Transaction History',
        history_subtitle: 'View all your transactions here',
        transaction_id: 'Transaction ID',
        date: 'Date',
        status: 'Status',
        details: 'Details',
        no_transactions: 'No transactions yet',
        filter_all: 'All',

        admin_title: 'Admin Panel',
        admin_subtitle: 'Manage transactions and users',
        all_transactions: 'All Transactions',
        all_users: 'All Users',
        approve: 'Approve',
        reject: 'Reject',
        complete: 'Complete',
        admin_note: 'Admin Note',
        total_transactions: 'Total Transactions',
        total_users: 'Total Users',
        total_volume: 'Total Volume',
        total_fees: 'Total Fees',
        settings: 'Settings',
        save_settings: 'Save Settings',
        dashboard: 'Dashboard',

        method_fib: 'FIB - First Iraqi Bank',
        method_fastpay: 'FastPay',
        method_zaincash: 'ZainCash',
        method_cash: 'Cash',
        method_western_union: 'Western Union',
        method_paypal: 'PayPal',
        method_usdt: 'USDT - Tether',

        currency_usd: 'US Dollar',
        currency_iqd: 'Iraqi Dinar',
        currency_eur: 'Euro',
        currency_gbp: 'British Pound',
        currency_try: 'Turkish Lira',

        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        cancel: 'Cancel',
        close: 'Close',
        save: 'Save',
        delete: 'Delete',
        search: 'Search',
        language: 'Language',
        user: 'User',
        admin: 'Admin',
        request_submitted: 'Your request has been submitted successfully!',
        fill_all_fields: 'Please fill in all fields',
        password_mismatch: 'Passwords do not match',
        invalid_amount: 'Please enter a valid amount',

        step_1: 'Step 1: Calculate Amount',
        step_2: 'Step 2: Receiver Info',
        step_3: 'Step 3: Payment & Proof',
        send_order: 'Send Order',
        receiver_prompt: 'Enter your receiving info.',
        receiver_account: 'Receiver Account (Account / Wallet)',
        back: 'Back',
        next: 'Next',
        upload_proof: 'Payment Proof (Screenshot)',
        tap_to_upload: 'Tap to upload picture',
        complete_order: 'Complete Order',
        pair_error: 'This route is not configured.',
        prompt_enter_details: 'Please enter your {name} details where you want to receive the funds.',
        instruction_send: 'Please send {amount} IQD via {name} to:',
        no_instructions: 'No instructions provided.',
    },

    ar: {
        app_name: 'تبادل الأموال',
        app_tagline: 'منصة تبادل أموال بسيطة وموثوقة',

        login: 'تسجيل الدخول',
        register: 'التسجيل',
        logout: 'تسجيل الخروج',
        full_name: 'الاسم الكامل',
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        confirm_password: 'تأكيد كلمة المرور',
        login_btn: 'دخول',
        register_btn: 'إنشاء حساب',
        no_account: 'ليس لديك حساب؟',
        have_account: 'لديك حساب بالفعل؟',
        create_account: 'إنشاء حساب',
        login_here: 'سجل الدخول هنا',
        welcome_back: 'مرحباً بعودتك',
        create_new_account: 'إنشاء حساب جديد',
        username: 'اسم المستخدم',
        username_or_email: 'اسم المستخدم أو البريد الإلكتروني',
        username_placeholder: 'مثال: ayub_123',
        username_hint: 'أحرف وأرقام و _ فقط',

        nav_exchange: 'تبادل',
        nav_history: 'السجل',
        nav_admin: 'الإدارة',
        nav_settings: 'الإعدادات',

        exchange_title: 'تبادل الأموال',
        exchange_subtitle: 'إنشاء طلب تبادل جديد',
        send_from: 'الإرسال من',
        receive_to: 'الاستلام في',
        send_method: 'طريقة الإرسال',
        receive_method: 'طريقة الاستلام',
        amount: 'المبلغ',
        send_amount: 'مبلغ الإرسال',
        receive_amount: 'مبلغ الاستلام',
        enter_amount: 'أدخل المبلغ',
        fee: 'الرسوم',
        fee_percent: 'نسبة الرسوم',
        rate: 'السعر',
        exchange_rate: 'سعر الصرف',
        you_send: 'ترسل',
        you_receive: 'تستلم',
        submit_request: 'إرسال الطلب',
        select_method: 'اختر طريقة',
        select_currency: 'اختر العملة',
        preview: 'معاينة',
        calculated_result: 'النتيجة المحسوبة',

        pending: 'قيد الانتظار',
        approved: 'موافق عليه',
        rejected: 'مرفوض',
        completed: 'مكتمل',

        history_title: 'سجل المعاملات',
        history_subtitle: 'عرض جميع معاملاتك هنا',
        transaction_id: 'رقم المعاملة',
        date: 'التاريخ',
        status: 'الحالة',
        details: 'التفاصيل',
        no_transactions: 'لا توجد معاملات بعد',
        filter_all: 'الكل',

        admin_title: 'لوحة الإدارة',
        admin_subtitle: 'إدارة المعاملات والمستخدمين',
        all_transactions: 'جميع المعاملات',
        all_users: 'جميع المستخدمين',
        approve: 'موافقة',
        reject: 'رفض',
        complete: 'إكمال',
        admin_note: 'ملاحظة المدير',
        total_transactions: 'إجمالي المعاملات',
        total_users: 'إجمالي المستخدمين',
        total_volume: 'إجمالي الحجم',
        total_fees: 'إجمالي الرسوم',
        settings: 'الإعدادات',
        save_settings: 'حفظ الإعدادات',
        dashboard: 'لوحة القيادة',

        method_fib: 'FIB - المصرف العراقي الأول',
        method_fastpay: 'FastPay - فاست باي',
        method_zaincash: 'ZainCash - زين كاش',
        method_cash: 'نقدي',
        method_western_union: 'ويسترن يونيون',
        method_paypal: 'PayPal - باي بال',
        method_usdt: 'USDT - تيثر',

        currency_usd: 'الدولار الأمريكي',
        currency_iqd: 'الدينار العراقي',
        currency_eur: 'اليورو',
        currency_gbp: 'الجنيه الإسترليني',
        currency_try: 'الليرة التركية',

        loading: 'جاري التحميل...',
        error: 'خطأ',
        success: 'نجاح',
        cancel: 'إلغاء',
        close: 'إغلاق',
        save: 'حفظ',
        delete: 'حذف',
        search: 'بحث',
        language: 'اللغة',
        user: 'مستخدم',
        admin: 'مدير',
        request_submitted: 'تم إرسال طلبك بنجاح!',
        fill_all_fields: 'يرجى ملء جميع الحقول',
        password_mismatch: 'كلمات المرور غير متطابقة',
        invalid_amount: 'يرجى إدخال مبلغ صحيح',

        step_1: 'الخطوة 1: حساب المبلغ',
        step_2: 'الخطوة 2: معلومات المستلم',
        step_3: 'الخطوة 3: الدفع والإثبات',
        send_order: 'إرسال الطلب',
        receiver_prompt: 'أدخل معلومات الاستلام الخاصة بك.',
        receiver_account: 'حساب المستلم (رقم الحساب / المحفظة)',
        back: 'رجوع',
        next: 'التالي',
        upload_proof: 'إثبات الدفع (لقطة شاشة)',
        tap_to_upload: 'انقر لرفع الصورة',
        complete_order: 'إكمال الطلب',
        pair_error: 'هذا المسار غير متاح.',
        prompt_enter_details: 'يرجى إدخال تفاصيل {name} الخاصة بك حيث تريد استلام الأموال.',
        instruction_send: 'رجاءً أرسل {amount} IQD عبر {name} إلى:',
        no_instructions: 'لا توجد تعليمات.',
    }
};

// RTL languages
const rtlLanguages = ['ku', 'ar'];

// Get current language
function getLang() {
    return localStorage.getItem('lang') || 'ku';
}

// Set language
function setLang(lang) {
    if (!translations[lang]) return;
    localStorage.setItem('lang', lang);
    applyLanguage();
}

// Translate a key
function t(key) {
    const lang = getLang();
    return translations[lang]?.[key] || translations['en']?.[key] || key;
}

// Apply language to entire page
function applyLanguage() {
    const lang = getLang();
    const isRtl = rtlLanguages.includes(lang);

    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';

    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });

    // Update language selector if exists
    const langBtns = document.querySelectorAll('.lang-btn');
    langBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    applyLanguage();
});
