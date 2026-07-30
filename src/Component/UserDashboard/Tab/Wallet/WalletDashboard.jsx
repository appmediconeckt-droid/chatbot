import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../../../axiosConfig';
import { useUserTranslation } from '../../../../i18n/LanguageContext';
import html2pdf from 'html2pdf.js';
import './WalletDashboard.css';

const RAZORPAY_SCRIPT_ID = 'razorpay-checkout-script';
const loadRazorpayScript = () =>
    new Promise((resolve, reject) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const existingScript = document.getElementById(RAZORPAY_SCRIPT_ID);
        if (existingScript) {
            existingScript.addEventListener('load', () => resolve(true), { once: true });
            existingScript.addEventListener('error', () => reject(new Error('Unable to load Razorpay checkout')), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.id = RAZORPAY_SCRIPT_ID;
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error('Unable to load Razorpay checkout'));
        document.body.appendChild(script);
    });

const WalletDashboard = ({ userData }) => {
    const { t, lang } = useUserTranslation();
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('upi');
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [spendingSummary, setSpendingSummary] = useState({ total: 0, breakdown: [] });
    const [loading, setLoading] = useState(false);
    const [downloadLoading, setDownloadLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [statementLoading, setStatementLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historySearch, setHistorySearch] = useState('');
    const [historyFilter, setHistoryFilter] = useState('all');
    const reconciliationAttemptsRef = useRef(new Set());
    const transactionsPerPage = 5;

    useEffect(() => {
        fetchWalletData();
        loadRazorpayScript().catch((error) => {
            console.error('Razorpay script load failed:', error);
        });
        const refreshWallet = () => fetchWalletData();
        window.addEventListener('wallet-balance-updated', refreshWallet);
        return () => window.removeEventListener('wallet-balance-updated', refreshWallet);
    }, []);

    // Reset to first page when language changes
    useEffect(() => {
        setCurrentPage(1);
    }, [lang]);

    const fetchWalletData = async (range = null) => {
        try {
            const selectedFrom = range?.from ?? fromDate;
            const selectedTo = range?.to ?? toDate;
            const params = {};
            if (selectedFrom) params.from = selectedFrom;
            if (selectedTo) params.to = selectedTo;
            const response = await axiosInstance.get('/api/wallet/data', { params });
            setBalance(response.data.balance);
            setTransactions(response.data.transactions);
            setSpendingSummary(response.data.spendingSummary || { total: 0, breakdown: [] });
            setCurrentPage(1);

            // Recover captured payments whose browser callback was interrupted.
            // Each order is attempted once per mounted wallet view; Razorpay
            // webhooks remain the primary automatic recovery mechanism.
            const pendingOrders = (response.data.transactions || []).filter(tx =>
                tx.type === 'credit' &&
                tx.status === 'pending' &&
                tx.razorpayOrderId &&
                !reconciliationAttemptsRef.current.has(tx.razorpayOrderId)
            );
            let didRecoverPayment = false;
            for (const tx of pendingOrders) {
                reconciliationAttemptsRef.current.add(tx.razorpayOrderId);
                try {
                    const recovery = await axiosInstance.post('/api/wallet/reconcile-payment', {
                        orderId: tx.razorpayOrderId,
                        paymentId: tx.razorpayPaymentId || undefined
                    });
                    if (recovery.data?.success) {
                        didRecoverPayment = true;
                        setBalance(recovery.data.balance);
                        window.dispatchEvent(new CustomEvent('wallet-payment-recovered', {
                            detail: { orderId: tx.razorpayOrderId }
                        }));
                    }
                } catch (recoveryError) {
                    if (recoveryError.response?.status !== 409) {
                        console.error('Payment reconciliation failed:', recoveryError);
                    }
                }
            }
            if (didRecoverPayment) {
                const refreshed = await axiosInstance.get('/api/wallet/data', { params });
                setBalance(refreshed.data.balance);
                setTransactions(refreshed.data.transactions);
            }
        } catch (error) {
            console.error('Error fetching wallet data:', error);
        }
    };

    const handleApplyDateFilter = async () => {
        if (fromDate && toDate && fromDate > toDate) {
            alert('From date cannot be after To date.');
            return;
        }
        setStatementLoading(true);
        await fetchWalletData({ from: fromDate, to: toDate });
        setStatementLoading(false);
    };

    const handleThisMonth = async () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const formatLocalDate = (date) => {
            const offset = date.getTimezoneOffset();
            return new Date(date.getTime() - offset * 60000).toISOString().split('T')[0];
        };
        const from = formatLocalDate(firstDay);
        const to = formatLocalDate(now);
        setFromDate(from);
        setToDate(to);
        setStatementLoading(true);
        await fetchWalletData({ from, to });
        setStatementLoading(false);
    };

    const handleClearDateFilter = async () => {
        setFromDate('');
        setToDate('');
        setStatementLoading(true);
        await fetchWalletData({ from: '', to: '' });
        setStatementLoading(false);
    };

    const handleDownloadReport = async () => {
        setDownloadLoading(true);
        try {
            if (transactions.length === 0) {
                alert('No transactions found for the selected date range.');
                return;
            }
            // Generate HTML report
            const totalCredit = transactions.filter(tx => tx.type === 'credit').reduce((acc, tx) => acc + tx.amount, 0);
            const totalDebit = transactions.filter(tx => tx.type === 'debit').reduce((acc, tx) => acc + tx.amount, 0);
            const statementPhone = [
                userData?.phone,
                userData?.phoneNumber,
                userData?.mobile,
                userData?.mobileNumber,
                userData?.contactNumber
            ].find(value => typeof value === 'string' && value.trim());

            const htmlContent = `
                <style>
                    * { box-sizing: border-box; }
                    .wallet-pdf { width: 100%; color: #172033; font-family: Arial, Helvetica, sans-serif; font-size: 10px; background: #fff; }
                    .wallet-pdf h1 { margin: 0 0 8px; color: #4338ca !important; font-size: 25px; letter-spacing: -.4px; }
                    .wallet-pdf h3 { margin: 18px 0 8px !important; color: #172033 !important; font-size: 13px; page-break-after: avoid; break-after: avoid; }
                    .wallet-pdf hr { border: 0 !important; border-top: 2px solid #6366f1 !important; margin: 18px 0 !important; }
                    .wallet-pdf table { width: 100% !important; border-collapse: separate !important; border-spacing: 0 !important; table-layout: fixed; margin-bottom: 16px !important; }
                    .wallet-pdf thead { display: table-header-group !important; }
                    .wallet-pdf tfoot { display: table-footer-group !important; }
                    .wallet-pdf tr { page-break-inside: avoid !important; break-inside: avoid-page !important; }
                    .wallet-pdf th { padding: 9px 7px !important; border: 0 !important; border-right: 1px solid #818cf8 !important; color: #fff !important; background: #4f46e5 !important; font-size: 8px; line-height: 1.25; letter-spacing: .25px; text-transform: uppercase; }
                    .wallet-pdf th:first-child { border-radius: 6px 0 0 0; }
                    .wallet-pdf th:last-child { border-right: 0 !important; border-radius: 0 6px 0 0; }
                    .wallet-pdf td { padding: 9px 7px !important; border: 0 !important; border-right: 1px solid #e2e8f0 !important; border-bottom: 1px solid #e2e8f0 !important; vertical-align: top; line-height: 1.35; overflow-wrap: anywhere; }
                    .wallet-pdf td:first-child { border-left: 1px solid #e2e8f0 !important; }
                    .wallet-pdf tbody tr:nth-child(even) td { background: #f8fafc !important; }
                    .wallet-pdf thead th:nth-child(1) { width: 16%; }
                    .wallet-pdf thead th:nth-child(2) { width: 15%; }
                    .wallet-pdf thead th:nth-child(3) { width: 35%; }
                    .wallet-pdf thead th:nth-child(4) { width: 17%; }
                    .wallet-pdf thead th:nth-child(5) { width: 17%; }
                    .wallet-pdf p { line-height: 1.45; }
                    .pdf-header { padding: 18px 20px; border-radius: 10px; background: #eef2ff; page-break-inside: avoid; break-inside: avoid-page; }
                    .pdf-header p { margin: 0 !important; }
                    .pdf-footer { padding-top: 10px; border-top: 1px solid #e2e8f0; color: #64748b; page-break-inside: avoid; break-inside: avoid-page; }
                </style>
                <div class="wallet-pdf">
                    <div class="pdf-header">
                    <h1 style="text-align: center;">Wallet Statement</h1>
                    <p style="text-align: center; color: #666; margin-bottom: 30px;">
                        Wallet Statement: ${fromDate || 'All records'} to ${toDate || 'Today'}<br>
                        Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
                    </p>
                    </div>

                    <hr style="border: 2px solid #006B2C; margin-bottom: 30px;">

                    <h3 style="color: #0b1c30; margin-top: 20px; margin-bottom: 10px;">📋 ${t('wallet_overview')}</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr style="background: #f8f9ff;">
                            <td style="padding: 10px; border: 1px solid #ddd;">${t('name')}</td>
                            <td style="padding: 10px; border: 1px solid #ddd;">${userData.name || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd;">${t('email_label')}</td>
                            <td style="padding: 10px; border: 1px solid #ddd;">${userData.email || 'N/A'}</td>
                        </tr>
                        ${statementPhone ? `
                            <tr style="background: #f8f9ff;">
                                <td style="padding: 10px; border: 1px solid #ddd;">${t('phone_label')}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${statementPhone.trim()}</td>
                            </tr>
                        ` : ''}
                        <tr style="background: #006B2C; color: white;">
                            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${t('current_balance')}</td>
                            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">₹${balance.toFixed(2)}</td>
                        </tr>
                    </table>

                    <h3 style="color: #0b1c30; margin-top: 20px; margin-bottom: 10px;">📊 ${t('spending_summary')}</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr style="background: #f8f9ff;">
                            <td style="padding: 10px; border: 1px solid #ddd;">${t('add_funds_button')}</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: right; color: #059669; font-weight: bold;">₹${totalCredit.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd;">Debits</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: right; color: #dc2626; font-weight: bold;">₹${totalDebit.toFixed(2)}</td>
                        </tr>
                        <tr style="background: #f0f4ff;">
                            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Net Balance</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: right; color: #006B2C; font-weight: bold;">₹${(totalCredit - totalDebit).toFixed(2)}</td>
                        </tr>
                    </table>

                    <h3 style="color: #0b1c30; margin-top: 20px; margin-bottom: 10px;">💳 ${t('transaction_history')}</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                            <tr style="background: #006B2C; color: white;">
                                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">${t('date')}</th>
                                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">${t('type')}</th>
                                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">${t('description')}</th>
                                <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">${t('status')}</th>
                                <th style="padding: 12px; border: 1px solid #ddd; text-align: right;">${t('amount')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${transactions.map((tx, idx) => `
                                <tr style="background: ${idx % 2 === 0 ? '#f8f9ff' : 'white'};">
                                    <td style="padding: 10px; border: 1px solid #ddd;">${new Date(tx.createdAt).toLocaleDateString()}</td>
                                    <td style="padding: 10px; border: 1px solid #ddd; color: ${tx.type === 'credit' ? '#059669' : '#dc2626'}; font-weight: bold;">
                                        ${tx.type === 'credit' ? t('add_funds_button') : 'Debit'}
                                    </td>
                                    <td style="padding: 10px; border: 1px solid #ddd;">${tx.description || 'Transaction'}</td>
                                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center; color: ${tx.status === 'completed' ? '#059669' : '#f59e0b'}; font-weight: bold;">
                                        ${tx.status === 'completed' ? '✓ Done' : '⏳ Pending'}
                                    </td>
                                    <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: bold;">₹${tx.amount.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <hr style="border: 1px solid #ddd; margin: 30px 0;">
                    <p class="pdf-footer" style="text-align: center; color: #999; font-size: 10px;">
                        This is an automatically generated wallet report. For queries, please contact support.
                    </p>
                    <p style="text-align: center; color: #999; font-size: 12px;">
                        Report ID: ${new Date().getTime()}
                    </p>
                </div>
            `;

            // Use html2pdf to convert to PDF
            const element = document.createElement('div');
            element.innerHTML = htmlContent;
            document.body.appendChild(element);

            const opt = {
                margin: [9, 8, 14, 8],
                filename: `wallet-statement-${fromDate || 'all'}-to-${toDate || new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    letterRendering: true,
                    backgroundColor: '#ffffff'
                },
                jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
                pagebreak: {
                    mode: ['css', 'legacy'],
                    avoid: ['tr', 'h3', '.pdf-header', '.pdf-footer']
                }
            };

            // Generate first, then add a consistent page counter to all pages.
            const worker = html2pdf().set(opt).from(element).toPdf();
            const pdf = await worker.get('pdf');
            const pageCount = pdf.internal.getNumberOfPages();
            for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
                pdf.setPage(pageNumber);
                pdf.setFontSize(8);
                pdf.setTextColor(100, 116, 139);
                pdf.text(`Page ${pageNumber} of ${pageCount}`, 201, 290, { align: 'right' });
            }
            await worker.save();

            // Clean up
            document.body.removeChild(element);

        } catch (error) {
            console.error('Error downloading report:', error);
            alert(t('error_try_again') || 'Failed to download report. Please try again.');
        } finally {
            setDownloadLoading(false);
        }
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        if (!amount || amount <= 0) {
            alert(t('invalid_amount'));
            return;
        }

        setLoading(true);
        try {
            await loadRazorpayScript();
            if (!window.Razorpay) {
                throw new Error('Razorpay checkout is not available');
            }

            // 1. Create order on server
            const { data: orderData } = await axiosInstance.post('/api/wallet/create-order', { amount: Number(amount) });
            if (!orderData?.order_id || !orderData?.key_id || !orderData?.amount) {
                throw new Error('Payment order response is incomplete');
            }

            let processingTimer = null;
            const clearProcessingTimer = () => {
                if (processingTimer) {
                    window.clearTimeout(processingTimer);
                    processingTimer = null;
                }
            };

            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: "INR",
                name: "Mediconeckt Wallet",
                description: t('professional_dashboard'),
                order_id: orderData.order_id,
                handler: async function (response) {
                    clearProcessingTimer();
                    // 2. Verify payment on server
                    try {
                        const verifyRes = await axiosInstance.post('/api/wallet/verify-payment', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (verifyRes.data.success) {
                            alert(t('funds_added'));
                            setAmount('');
                            await fetchWalletData();
                        }
                    } catch (err) {
                        console.error('Verification failed:', err);
                        alert(t('payment_failed_verification'));
                    } finally {
                        setLoading(false);
                    }
                },
                prefill: {
                    name: userData?.name || "",
                    email: userData?.email || "",
                    contact: userData?.phone || ""
                },
                theme: {
                    color: "#4648d4"
                },
                modal: {
                    ondismiss: function () {
                        clearProcessingTimer();
                        setLoading(false);
                    }
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response) {
                clearProcessingTimer();
                console.error('Razorpay payment failed:', response?.error || response);
                alert(t('payment_error_description'));
                setLoading(false);
            });
            rzp1.open();
            processingTimer = window.setTimeout(() => {
                setLoading(false);
                alert('Payment is taking longer than expected. Please click Cancel in Razorpay and try again with Card test mode.');
            }, 120000);
        } catch (error) {
            console.error('Payment initialization failed:', error);
            alert(t('payment_error_description'));
            setLoading(false);
        }
    };

    // Pagination logic
    const indexOfLastTx = currentPage * transactionsPerPage;
    const indexOfFirstTx = indexOfLastTx - transactionsPerPage;
    const currentTransactions = transactions.slice(indexOfFirstTx, indexOfLastTx);
    const totalPages = Math.ceil(transactions.length / transactionsPerPage);

    const totalCredits = transactions
        .filter((tx) => tx.type === 'credit' && tx.status !== 'failed')
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const totalSpent = transactions
        .filter((tx) => tx.type !== 'credit' && tx.status !== 'failed')
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const completedTransactions = transactions.filter((tx) => tx.status === 'completed').length;
    const quickAmounts = [500, 1000, 2000, 5000, 10000];
    const openTransactionHistory = async () => {
        setShowHistory(true);
        setHistoryLoading(true);
        await fetchWalletData({ from: '', to: '' });
        setHistoryLoading(false);
    };
    const visibleHistory = transactions.filter((tx) => {
        const haystack = `${tx.description || ''} ${tx.counselorId?.fullName || ''} ${tx.metadata?.sessionType || ''}`.toLowerCase();
        const matchesSearch = haystack.includes(historySearch.trim().toLowerCase());
        const matchesFilter =
            historyFilter === 'all' ||
            (historyFilter === 'added' && tx.type === 'credit') ||
            (historyFilter === 'doctor' && Boolean(tx.counselorId)) ||
            (historyFilter === 'withdrawals' && tx.type !== 'credit');
        return matchesSearch && matchesFilter;
    });
    const historySpent = transactions
        .filter((tx) => tx.type !== 'credit' && tx.status !== 'failed')
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    if (showHistory) {
        return (
            <div className="wallet-page wallet-history-page">
                <header className="wallet-page__header">
                    <h1>{t("your_wallet")}</h1>
                    <p>{t("wallet_tracking_subtitle")}</p>
                </header>
                <main className="wallet-history-content">
                    <button className="wallet-history-back" type="button" onClick={() => setShowHistory(false)}>
                        <span className="material-symbols-outlined">arrow_back</span>
                        {t("wallet_transaction_history")}
                    </button>

                    <div className="wallet-history-overview">
                        <section className="wallet-history-total">
                            <div>
                                <span>{t("total_spent")}</span>
                                <strong>₹{historySpent.toLocaleString('en-IN')}</strong>
                            </div>
                            <span className="material-symbols-outlined">monitoring</span>
                            <p><span className="material-symbols-outlined">south</span> {t("wallet_transaction_summary")}</p>
                        </section>
                        <section className="wallet-history-tools">
                            <label>
                                <span className="material-symbols-outlined">search</span>
                                <input value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} placeholder={t("search_transactions")} />
                            </label>
                            <div>
                                {[
                                    ['all', t('all')],
                                    ['added', t('added')],
                                    ['doctor', t('doctor')],
                                    ['withdrawals', t('withdrawals')]
                                ].map(([value, label]) => (
                                    <button type="button" key={value} className={historyFilter === value ? 'is-active' : ''} onClick={() => setHistoryFilter(value)}>
                                        {value === 'all' && <span className="material-symbols-outlined">done</span>}
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </section>
                    </div>

                    <section className="wallet-history-list">
                        <h3><i /> {t("transaction_history")}</h3>
                        <div className="wallet-history-table-wrap">
                            <table>
                                <thead><tr><th>{t("transaction_details")}</th><th>{t("date")}</th><th>{t("category")}</th><th>{t("status")}</th><th>{t("amount")}</th></tr></thead>
                                <tbody>
                                    {historyLoading ? (
                                        <tr><td colSpan="5" className="wallet-empty">{t("loading_transaction_history")}</td></tr>
                                    ) : visibleHistory.length ? visibleHistory.map((tx) => {
                                        const isCredit = tx.type === 'credit';
                                        const category = isCredit ? 'Bank' : (tx.metadata?.sessionType || (tx.counselorId ? 'General Checkup' : 'Wallet'));
                                        return (
                                            <tr key={tx._id}>
                                                <td>
                                                    <span className={`wallet-history-icon ${isCredit ? 'is-credit' : ''}`}>
                                                        <span className="material-symbols-outlined">{isCredit ? 'account_balance_wallet' : (tx.counselorId ? 'medical_services' : 'receipt_long')}</span>
                                                    </span>
                                                    <div><strong>{tx.description || (isCredit ? 'Wallet Top-up' : 'Wallet Payment')}</strong><small>{tx.counselorId?.fullName || tx.razorpayPaymentId || 'Transaction'}</small></div>
                                                </td>
                                                <td>{new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                <td>{category}</td>
                                                <td><span className={`wallet-history-status wallet-history-status--${tx.status}`}>{tx.status}</span></td>
                                                <td className={isCredit ? 'is-credit' : ''}>{isCredit ? '+' : '-'}₹{Number(tx.amount || 0).toFixed(2)}</td>
                                            </tr>
                                        );
                                    }) : <tr><td colSpan="5" className="wallet-empty">{t('no_transactions')}</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </main>
            </div>
        );
    }

    return (
        <div className="wallet-page">
            <header className="wallet-page__header">
                <h1>{t("your_wallet")}</h1>
                <p>{t("wallet_tracking_subtitle")}</p>
            </header>

            <main className="wallet-layout">
                <div className="wallet-main">
                    <section className="wallet-balance-card">
                        <div className="wallet-balance-card__top">
                            <span className="wallet-premium-pill">
                                <span className="material-symbols-outlined">account_balance_wallet</span>
                                PREMIUM HEALTH
                            </span>
                            <span className="material-symbols-outlined wallet-card-mark">data_usage</span>
                        </div>
                        <div>
                            <p className="wallet-muted-light">{t("available_balance")}</p>
                            <h2>₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
                            <p className="wallet-card-number">**** &nbsp;**** &nbsp;4242</p>
                        </div>
                        <div className="wallet-balance-actions">
                            <button type="button" onClick={() => document.getElementById('amount-input')?.focus()}>
                                <span className="material-symbols-outlined">add_circle</span>
                                {t('add_funds_button')}
                            </button>
                            <button type="button" className="wallet-history-button" onClick={openTransactionHistory}>
                                <span className="material-symbols-outlined">history</span>
                                {t("view_history")}
                            </button>
                        </div>
                    </section>

                    <section className="wallet-stat-grid">
                        <article><span>CREDITS</span><strong>₹{totalCredits.toLocaleString('en-IN')}</strong></article>
                        <article><span>SPENT</span><strong className="wallet-stat--spent">₹{totalSpent.toLocaleString('en-IN')}</strong></article>
                        <article><span>COMPLETED</span><strong className="wallet-stat--completed">{completedTransactions}</strong></article>
                    </section>

                    <section className="wallet-panel wallet-spending">
                        <h3>{t('spending_summary')}</h3>
                        <div className="wallet-spending__items">
                            {spendingSummary.breakdown.length > 0 ? spendingSummary.breakdown.map((item, index) => (
                                <div className="wallet-spending__item" key={`${item.label}-${index}`}>
                                    <div><span>{item.label}</span><strong>₹{Number(item.amount || 0).toLocaleString('en-IN')}</strong></div>
                                    <div className="wallet-progress"><span style={{ width: `${Math.min(100, item.percentage || 0)}%` }} /></div>
                                </div>
                            )) : <p className="wallet-empty">{t('no_spending_recorded')}</p>}
                        </div>
                        <div className="wallet-spending__total">
                            <span>{t('total_spent_this_month')}</span>
                            <strong>₹{Number(spendingSummary.total || 0).toLocaleString('en-IN')}</strong>
                        </div>
                    </section>
                </div>

                <aside className="wallet-side">
                    <section className="wallet-panel wallet-add-money">
                        <h3>{t('add_money')}</h3>
                        <form onSubmit={handlePayment}>
                            <label className="wallet-amount-box" htmlFor="amount-input">
                                <span>{t("enter_amount")}</span>
                                <div><b>₹</b><input id="amount-input" type="number" min="1" placeholder="1,000" value={amount} onChange={(e) => setAmount(e.target.value)} required /></div>
                            </label>
                            <div className="wallet-quick-amounts">
                                {quickAmounts.map((value) => (
                                    <button type="button" key={value} className={Number(amount) === value ? 'is-active' : ''} onClick={() => setAmount(String(value))}>
                                        ₹{value}
                                    </button>
                                ))}
                                <button type="button" onClick={() => { setAmount(''); document.getElementById('amount-input')?.focus(); }}>{t("custom_amount")}</button>
                            </div>
                            <p className="wallet-field-title">{t('payment_method')}</p>
                            <div className="wallet-payment-methods">
                                {[
                                    { id: 'upi', label: t('upi_qr'), icon: 'UPI' },
                                    { id: 'visa', label: t('credit_debit_card'), icon: 'credit_card' },
                                    { id: 'bank', label: t('net_banking'), icon: 'account_balance' }
                                ].map((method) => (
                                    <label key={method.id} className={paymentMethod === method.id ? 'is-selected' : ''}>
                                        <input type="radio" name="payment" checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)} />
                                        {method.icon === 'UPI' ? <span className="wallet-upi-icon">UPI</span> : <span className="material-symbols-outlined">{method.icon}</span>}
                                        <span>{method.label}</span>
                                        <i />
                                    </label>
                                ))}
                            </div>
                            <button className="wallet-pay-button" type="submit" disabled={loading}>
                                {loading ? t('sending') : `Proceed to Pay${amount ? ` ₹${Number(amount).toLocaleString('en-IN')}` : ''}`}
                            </button>
                            <p className="wallet-secure"><span className="material-symbols-outlined">lock</span> {t("secure_encryption")}</p>
                        </form>
                    </section>

                    <section className="wallet-support">
                        <div><strong>{t("need_payment_help")}</strong><p>{t("support_available_24_7")}</p></div>
                        <button type="button" onClick={() => { window.location.href = 'mailto:support@mediconeckt.com?subject=Wallet%20Support'; }}>{t("support")}</button>
                    </section>
                </aside>
            </main>

        </div>
    );
};

export default WalletDashboard;
