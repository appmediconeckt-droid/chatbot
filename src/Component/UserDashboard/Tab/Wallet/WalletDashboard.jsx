import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../../axiosConfig';

const WalletDashboard = ({ userData }) => {
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('upi');
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [spendingSummary, setSpendingSummary] = useState({ total: 0, breakdown: [] });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchWalletData();
        // Load Razorpay script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        }
    }, []);

    const fetchWalletData = async () => {
        try {
            const response = await axiosInstance.get('/api/wallet/data');
            setBalance(response.data.balance);
            setTransactions(response.data.transactions);
            setSpendingSummary(response.data.spendingSummary || { total: 0, breakdown: [] });
        } catch (error) {
            console.error('Error fetching wallet data:', error);
        }
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        if (!amount || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        setLoading(true);
        try {
            // 1. Create order on server
            const { data: orderData } = await axiosInstance.post('/api/wallet/create-order', { amount: Number(amount) });

            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: "INR",
                name: "Mediconeckt Wallet",
                description: "Add funds to your healthcare wallet",
                order_id: orderData.order_id,
                handler: async function (response) {
                    // 2. Verify payment on server
                    try {
                        const verifyRes = await axiosInstance.post('/api/wallet/verify-payment', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (verifyRes.data.success) {
                            alert('Payment successful!');
                            setAmount('');
                            fetchWalletData();
                        }
                    } catch (err) {
                        console.error('Verification failed:', err);
                        alert('Payment verification failed. Please contact support.');
                    }
                },
                prefill: {
                    name: userData?.name || "",
                    email: userData?.email || "",
                    contact: userData?.phone || ""
                },
                theme: {
                    color: "#4648d4"
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response) {
                alert('Payment failed: ' + response.error.description);
            });
            rzp1.open();
        } catch (error) {
            console.error('Payment initialization failed:', error);
            alert('Could not initiate payment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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
                <h1 className={`${styles.headlineLg} text-[#0b1c30]`}>Wallet Overview</h1>
                <p className={`${styles.bodyMd} text-[#464554]`}>Manage your healthcare credits and view transaction history.</p>
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
                            Add Funds
                        </button>
                        <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-white/20 transition-all active:scale-95">
                            View Perks
                        </button>
                    </div>
                </div>

                {/* Monthly Spending Summary */}
                <div className="bg-white rounded-[20px] p-6 border border-slate-200 shadow-[0px_4px_15px_rgba(0,0,0,0.03)]">
                    <h3 className={`${styles.headlineSm} text-[#0b1c30] mb-5`}>Spending Summary</h3>
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
                            <p className={`${styles.bodyMd} text-slate-400 text-center py-4`}>No spending recorded this month.</p>
                        )}
                        <div className="pt-4 border-t border-slate-100">
                            <p className={`${styles.labelSm} text-[#464554] mb-0.5`}>Total Spent this month</p>
                            <p className={`${styles.headlineSm} text-[#0b1c30]`}>₹{spendingSummary.total.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle Row: Two Column Section */}
            <div className={`grid grid-cols-1 lg:grid-cols-12 ${styles.gapLg} lg:items-stretch`}>
                {/* Left Column: Add Money */}
                <section className="lg:col-span-5 bg-white rounded-[20px] p-6 border border-slate-200 shadow-[0px_4px_15px_rgba(0,0,0,0.03)] flex flex-col">
                    <h3 className={`${styles.headlineSm} text-[#0b1c30] mb-5`}>Add Money to Wallet</h3>
                    <form className="space-y-5 flex-1 flex flex-col justify-between" onSubmit={handlePayment}>
                        <div>
                            <label className={`${styles.labelMd} text-[#0b1c30] mb-1.5 block`}>Enter Amount</label>
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
                            <label className={`${styles.labelMd} text-[#0b1c30] mb-3 block`}>Payment Method</label>
                            <div className="grid grid-cols-2 gap-2.5">
                                {[
                                    { id: 'visa', label: 'Visa', icon: 'credit_card' },
                                    { id: 'upi', label: 'UPI', icon: 'payments' },
                                    { id: 'bank', label: 'Net Banking', icon: 'account_balance' },
                                    { id: 'mastercard', label: 'Mastercard', icon: 'wallet' }
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
                                                {method.label}
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
                            {loading ? 'Processing...' : 'Confirm and Add Funds'}
                        </button>
                    </form>
                </section>

                {/* Right Column: Transaction History */}
                <section className="lg:col-span-7 bg-white rounded-[20px] border border-slate-200 shadow-[0px_4px_15px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className={`${styles.headlineSm} text-[#0b1c30]`}>Transaction History</h3>
                        <button className={`${styles.labelMd} text-[#4648d4] hover:underline`}>Download Report</button>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className={`px-6 py-3 ${styles.labelSm} text-[#464554]`}>DATE</th>
                                    <th className={`px-4 py-3 ${styles.labelSm} text-[#464554]`}>DESCRIPTION</th>
                                    <th className={`px-4 py-3 ${styles.labelSm} text-[#464554]`}>STATUS</th>
                                    <th className={`px-6 py-3 ${styles.labelSm} text-[#464554] text-right`}>AMOUNT</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {transactions.length > 0 ? (
                                    transactions.map((tx) => (
                                        <tr key={tx._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className={`px-6 py-4 ${styles.labelMd} text-[#464554]`}>{new Date(tx.createdAt).toLocaleDateString()}</td>
                                            <td className="px-4 py-4">
                                                <p className={`${styles.labelMd} text-[#0b1c30] font-[600]`}>{tx.description}</p>
                                                <p className="text-[11px] text-[#464554]">{tx.razorpayPaymentId || 'ID Pending'}</p>
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
                                        <td colSpan="4" className="px-6 py-10 text-center text-[#464554] opacity-50">No transactions found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-slate-50 text-center">
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
                <button className={`bg-[#4648d4] text-white px-6 py-2 rounded-[10px] font-bold text-[13px] hover:brightness-110 transition-all shadow-sm`}>
                    Support Center
                </button>
            </div>
        </div>
    );
};

export default WalletDashboard;