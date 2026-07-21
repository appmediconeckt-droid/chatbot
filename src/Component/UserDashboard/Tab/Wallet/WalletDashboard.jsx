import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../../axiosConfig';
import { useUserTranslation } from '../../../../i18n/LanguageContext';
import html2pdf from 'html2pdf.js';

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

                    <hr style="border: 2px solid #667eea; margin-bottom: 30px;">

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
                        <tr style="background: #667eea; color: white;">
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
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: right; color: #667eea; font-weight: bold;">₹${(totalCredit - totalDebit).toFixed(2)}</td>
                        </tr>
                    </table>

                    <h3 style="color: #0b1c30; margin-top: 20px; margin-bottom: 10px;">💳 ${t('transaction_history')}</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                            <tr style="background: #667eea; color: white;">
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

    // Mapped custom classes to Tailwind arbitrary values based on the Stitch config (Reduced sizes)
    const styles = {
        headlineLg: "text-[28px] leading-[36px] tracking-[-0.02em] font-[700]",
        headlineMd: "text-[22px] leading-[28px] tracking-[-0.01em] font-[600]",
        headlineSm: "text-[18px] leading-[24px] font-[600]",
        bodyLg: "text-[16px] leading-[24px] font-[400]",
        bodyMd: "text-[14px] leading-[20px] font-[400]",
        labelMd: "text-[13px] leading-[18px] tracking-[0.01em] font-[500]",
        labelSm: "text-[11px] leading-[14px] tracking-[0.05em] font-[600]",
        mbXl: "mb-[24px]",
        gapLg: "gap-[20px]",
        primary: "#4648d4",
        onBackground: "#0b1c30",
        onSurfaceVariant: "#464554",
        primaryContainer: "#6063ee",
    };

    return (
        <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full font-manrope bg-[#f8f9ff] text-[#0b1c30]">
            <header className={styles.mbXl}>
                <h1 className={`${styles.headlineLg} text-[#0b1c30]`}>{t('wallet_overview')}</h1>
                <p className={`${styles.bodyMd} text-[#464554]`}>{t('transaction_history_full')}</p>
            </header>

            {/* Top Row: Balance and Spending Summary */}
            <div className={`grid grid-cols-1 lg:grid-cols-3 ${styles.gapLg} ${styles.mbXl}`}>
                {/* Large Balance Card */}
                <div className="lg:col-span-2 relative overflow-hidden bg-[#6063ee] rounded-[20px] p-6 text-white shadow-[0_8px_30px_rgb(99,102,241,0.15)] min-h-[200px] flex flex-col justify-between">
                    {/* Decorative background elements */}
                    <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-[-20%] left-[-10%] w-[200px] h-[200px] bg-indigo-400/20 rounded-full blur-2xl"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            {/* Chip Icon */}
                            <div className="w-10 h-7 bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 rounded-md shadow-inner flex items-center justify-center">
                                <div className="w-6 h-4 border-[0.5px] border-black/10 rounded-sm flex gap-0.5 px-0.5">
                                    <div className="w-[1px] h-full bg-black/20"></div>
                                    <div className="w-[1px] h-full bg-black/20"></div>
                                    <div className="w-[1px] h-full bg-black/20"></div>
                                </div>
                            </div>
                            <div className="text-right">
                                <h4 className="text-lg font-bold italic tracking-tight leading-none">HealthWallet</h4>
                                <p className="text-[9px] uppercase tracking-[0.2em] opacity-80 font-medium">Platinum Card</p>
                            </div>
                        </div>

                        <div className="mb-2">
                            <p className="text-[11px] uppercase tracking-[0.15em] opacity-80 mb-0.5 font-semibold">Total Balance</p>
                            <h2 className="text-4xl font-bold tracking-tight">₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
                        </div>

                        <div className="flex justify-between items-end">
                            <div className="flex items-center gap-4">
                                <p className="text-lg tracking-[0.2em] font-medium opacity-90">•••• •••• •••• 4242</p>
                                <div className="flex flex-col">
                                    <span className="text-[8px] uppercase opacity-60 font-bold leading-none mb-1">Exp</span>
                                    <span className="text-sm font-medium">12/28</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 flex gap-4 mt-4">
                        <button
                            onClick={() => document.getElementById('amount-input')?.focus()}
                            className="flex items-center gap-2 bg-white text-[#6063ee] px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:bg-slate-50 transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-lg">add_circle</span>
                            {t('add_funds_button')}
                        </button>
                    </div>
                </div>

                {/* Monthly Spending Summary */}
                <div className="bg-white rounded-[20px] p-6 border border-slate-200 shadow-[0px_4px_15px_rgba(0,0,0,0.03)]">
                    <h3 className={`${styles.headlineSm} text-[#0b1c30] mb-5`}>{t('spending_summary')}</h3>
                    <div className="space-y-5">
                        {spendingSummary.breakdown.length > 0 ? (
                            spendingSummary.breakdown.map((item, index) => (
                                <div key={index}>
                                    <div className="flex justify-between mb-1.5">
                                        <span className={`${styles.labelMd} text-[#464554]`}>{item.label}</span>
                                        <span className={`${styles.labelMd} text-[#0b1c30] font-[600]`}>₹{item.amount.toFixed(2)}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className={`${index === 0 ? 'bg-[#4648d4]' : 'bg-[#39b8fd]'} h-full transition-all duration-500`}
                                            style={{ width: `${item.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className={`${styles.bodyMd} text-slate-400 text-center py-4`}>{t('no_spending_recorded')}</p>
                        )}
                        <div className="pt-4 border-t border-slate-100">
                            <p className={`${styles.labelSm} text-[#464554] mb-0.5`}>{t('total_spent_this_month')}</p>
                            <p className={`${styles.headlineSm} text-[#0b1c30]`}>₹{spendingSummary.total.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle Row: Two Column Section */}
            <div className={`grid grid-cols-1 lg:grid-cols-12 ${styles.gapLg} lg:items-stretch`}>
                {/* Left Column: Add Money */}
                <section className="lg:col-span-5 bg-white rounded-[20px] p-6 border border-slate-200 shadow-[0px_4px_15px_rgba(0,0,0,0.03)] flex flex-col">
                    <h3 className={`${styles.headlineSm} text-[#0b1c30] mb-5`}>{t('add_money')}</h3>
                    <form className="space-y-5 flex-1 flex flex-col justify-between" onSubmit={handlePayment}>
                        <div>
                            <label className={`${styles.labelMd} text-[#0b1c30] mb-1.5 block`}>{t('amount')}</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#464554] font-bold">₹</span>
                                <input 
                                    id="amount-input"
                                    className={`w-full pl-8 pr-4 py-2.5 rounded-[10px] border border-slate-200 focus:ring-2 focus:ring-[#4648d4] focus:border-[#4648d4] transition-all ${styles.headlineSm}`}
                                    placeholder="0.00" 
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className={`${styles.labelMd} text-[#0b1c30] mb-3 block`}>{t('payment_method')}</label>
                            <div className="grid grid-cols-2 gap-2.5">
                                {[
                                    { id: 'visa', labelKey: 'visa', icon: 'credit_card' },
                                    { id: 'upi', labelKey: 'upi', icon: 'payments' },
                                    { id: 'bank', labelKey: 'netbanking', icon: 'account_balance' },
                                    { id: 'mastercard', labelKey: 'mastercard', icon: 'wallet' }
                                ].map((method) => (
                                    <label key={method.id} className="cursor-pointer group">
                                        <input
                                            className="hidden peer"
                                            name="payment"
                                            type="radio"
                                            checked={paymentMethod === method.id}
                                            onChange={() => setPaymentMethod(method.id)}
                                        />
                                        <div className="p-3 rounded-[10px] border border-slate-200 peer-checked:border-[#4648d4] peer-checked:bg-indigo-50/30 flex flex-col items-center gap-1.5 transition-all hover:border-indigo-200">
                                            <span className={`material-symbols-outlined text-[20px] transition-colors ${paymentMethod === method.id ? 'text-[#4648d4]' : 'text-slate-400'}`}>
                                                {method.icon}
                                            </span>
                                            <span className={`${styles.labelSm} transition-colors ${paymentMethod === method.id ? 'text-[#4648d4]' : 'text-[#464554]'}`}>
                                                {t(method.labelKey)}
                                            </span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <button
                            disabled={loading}
                            className="w-full bg-[#4648d4] text-white py-3.5 rounded-[10px] font-bold text-[14px] shadow-lg shadow-indigo-100 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            type="submit"
                        >
                            {loading ? t('sending') : t('confirm_add_funds')}
                        </button>
                    </form>
                </section>

                {/* Right Column: Transaction History with Pagination */}
                <section className="lg:col-span-7 bg-white rounded-[20px] border border-slate-200 shadow-[0px_4px_15px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col max-h-[550px]">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                        <div>
                            <h3 className={`${styles.headlineSm} text-[#0b1c30]`}>{t('transaction_history')}</h3>
                            <p className="text-[11px] text-[#64748b]">Select a date range to generate a wallet statement</p>
                        </div>
                        <button
                            onClick={handleDownloadReport}
                            disabled={downloadLoading}
                            className={`${styles.labelMd} ${downloadLoading ? 'opacity-50 cursor-not-allowed' : 'hover:underline'} text-[#4648d4] transition-all`}
                        >
                            {downloadLoading ? `${t('updating')}...` : 'Download Statement'}
                        </button>
                    </div>
                    <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/70">
                        <div className="flex flex-wrap items-end gap-2">
                            <label className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">From date</span>
                                <input
                                    type="date"
                                    value={fromDate}
                                    max={toDate || undefined}
                                    onChange={(event) => setFromDate(event.target.value)}
                                    className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-[#0b1c30] focus:border-[#4648d4] focus:outline-none"
                                />
                            </label>
                            <label className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">To date</span>
                                <input
                                    type="date"
                                    value={toDate}
                                    min={fromDate || undefined}
                                    onChange={(event) => setToDate(event.target.value)}
                                    className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-[#0b1c30] focus:border-[#4648d4] focus:outline-none"
                                />
                            </label>
                            <button
                                type="button"
                                onClick={handleApplyDateFilter}
                                disabled={statementLoading}
                                className="h-9 rounded-lg bg-[#4648d4] px-4 text-xs font-bold text-white disabled:opacity-50"
                            >
                                {statementLoading ? 'Loading...' : 'Apply'}
                            </button>
                            <button
                                type="button"
                                onClick={handleThisMonth}
                                disabled={statementLoading}
                                className="h-9 rounded-lg border border-[#4648d4] bg-white px-3 text-xs font-bold text-[#4648d4] disabled:opacity-50"
                            >
                                This Month
                            </button>
                            {(fromDate || toDate) && (
                                <button
                                    type="button"
                                    onClick={handleClearDateFilter}
                                    disabled={statementLoading}
                                    className="h-9 px-2 text-xs font-semibold text-[#64748b] hover:text-[#0b1c30] disabled:opacity-50"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="overflow-y-auto overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                                <tr>
                                    <th className={`px-6 py-3 ${styles.labelSm} text-[#464554]`}>{t('date')}</th>
                                    <th className={`px-4 py-3 ${styles.labelSm} text-[#464554]`}>{t('description')}</th>
                                    <th className={`px-4 py-3 ${styles.labelSm} text-[#464554]`}>{t('status')}</th>
                                    <th className={`px-6 py-3 ${styles.labelSm} text-[#464554] text-right`}>{t('amount')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {currentTransactions.length > 0 ? (
                                    currentTransactions.map((tx) => (
                                        <tr key={tx._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className={`px-6 py-4 ${styles.labelMd} text-[#464554]`}>{new Date(tx.createdAt).toLocaleDateString()}</td>
                                            <td className="px-4 py-4">
                                                <p className={`${styles.labelMd} text-[#0b1c30] font-[600]`}>{tx.description}</p>
                                                <p className="text-[11px] text-[#464554]">
                                                    {tx.counselorId?.fullName
                                                        ? `${tx.counselorId.fullName}${tx.metadata?.sessionType ? ` • ${tx.metadata.sessionType}` : ''}${tx.metadata?.billedMinutes ? ` • ${tx.metadata.billedMinutes} min` : ''}`
                                                        : (tx.razorpayPaymentId || t('id_pending'))}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`px-2 py-0.5 ${tx.status === 'pending' ? 'bg-indigo-50 text-[#4648d4]' : (tx.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')} text-[9px] font-bold uppercase rounded-md tracking-wider`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 text-right font-[700] ${tx.status === 'failed' ? 'text-slate-300 line-through' : (tx.type === 'credit' ? 'text-emerald-600' : 'text-[#0b1c30]')}`}>
                                                {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-10 text-center text-[#464554] opacity-50">{t('no_transactions')}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-3 py-3 border-t border-slate-100 bg-white">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 rounded-md bg-slate-100 text-slate-700 disabled:opacity-40 text-sm font-medium hover:bg-slate-200 transition-all disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <div className="flex gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                    
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`w-8 h-8 rounded-md text-sm font-medium transition-all ${
                                                currentPage === pageNum
                                                    ? 'bg-[#4648d4] text-white'
                                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                {totalPages > 5 && currentPage < totalPages - 2 && (
                                    <>
                                        <span className="w-8 h-8 flex items-center justify-center text-slate-400">...</span>
                                        <button
                                            onClick={() => setCurrentPage(totalPages)}
                                            className="w-8 h-8 rounded-md text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                                        >
                                            {totalPages}
                                        </button>
                                    </>
                                )}
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 rounded-md bg-slate-100 text-slate-700 disabled:opacity-40 text-sm font-medium hover:bg-slate-200 transition-all disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    )}

                    <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
                        <button className={`group ${styles.labelMd} text-[#4648d4] font-[600] flex items-center justify-center mx-auto transition-all hover:gap-2`}>
                            View All Transactions
                            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                        </button>
                    </div>
                </section>
            </div>
            
            {/* Reduced Support Box */}
            <div className="mt-6 p-4 bg-[#4648d4]/5 rounded-[20px] border border-[#4648d4]/10 flex flex-col md:flex-row items-center justify-between gap-3">
                <div>
                    <p className={`${styles.labelSm} text-[#4648d4] mb-0.5 uppercase tracking-wider`}>Need help with payments?</p>
                    <p className={`${styles.bodyMd} text-[#0b1c30]`}>Our support center is available 24/7 for you.</p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        window.location.href = 'mailto:support@mediconeckt.com?subject=Wallet%20Support&body=Hello%20Mediconeckt%20Support%2C%0A%0AI%20need%20help%20with%20my%20wallet%20or%20payment.%0A';
                    }}
                    className={`bg-[#4648d4] text-white px-6 py-2 rounded-[10px] font-bold text-[13px] hover:brightness-110 transition-all shadow-sm`}
                >
                    Support Center
                </button>
            </div>
        </div>
    );
};

export default WalletDashboard;
