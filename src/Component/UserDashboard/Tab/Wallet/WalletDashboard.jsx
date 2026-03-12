import React, { useState } from 'react';
import './WalletDashboard.css';

const SimpleWallet = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');

  // Wallet Data
  const walletData = {
    balance: 25450.75,
    totalDeposit: 45800,
    totalPayment: 20349.25,
    currency: '₹'
  };

  // Transactions
  const transactions = [
    {
      id: 1,
      type: 'deposit',
      amount: 5000,
      date: '15 Jan 2024',
      to: 'Wallet',
      status: 'success'
    },
    {
      id: 2,
      type: 'payment',
      amount: 1200,
      date: '14 Jan 2024',
      to: 'Dr. Priya Sharma',
      status: 'success'
    },
    {
      id: 3,
      type: 'payment',
      amount: 1500,
      date: '12 Jan 2024',
      to: 'Dr. Rajesh Kumar',
      status: 'success'
    },
    {
      id: 4,
      type: 'deposit',
      amount: 3000,
      date: '10 Jan 2024',
      to: 'Wallet',
      status: 'success'
    },
    {
      id: 5,
      type: 'payment',
      amount: 1000,
      date: '08 Jan 2024',
      to: 'Dr. Sneha Patel',
      status: 'success'
    },
    {
      id: 6,
      type: 'withdraw',
      amount: 2000,
      date: '05 Jan 2024',
      to: 'Bank Account',
      status: 'pending'
    },
    {
      id: 7,
      type: 'deposit',
      amount: 2500,
      date: '03 Jan 2024',
      to: 'Wallet',
      status: 'success'
    }
  ];

  // Payments to Counselors
  const counselorPayments = [
    {
      name: 'Dr. Priya Sharma',
      amount: 4800,
      sessions: 4,
      lastDate: '14 Jan'
    },
    {
      name: 'Dr. Rajesh Kumar',
      amount: 4500,
      sessions: 3,
      lastDate: '12 Jan'
    },
    {
      name: 'Dr. Sneha Patel',
      amount: 3200,
      sessions: 3,
      lastDate: '08 Jan'
    },
    {
      name: 'Dr. Amit Verma',
      amount: 2800,
      sessions: 2,
      lastDate: '06 Jan'
    }
  ];

  const handleSubmit = (e, type) => {
    e.preventDefault();
    alert(`${type} of ${walletData.currency}${amount} successful!`);
    setShowDeposit(false);
    setShowWithdraw(false);
    setAmount('');
  };

  const filteredTransactions = transactions.filter(t => {
    if (activeTab === 'deposits') return t.type === 'deposit';
    if (activeTab === 'payments') return t.type === 'payment';
    if (activeTab === 'withdrawals') return t.type === 'withdraw';
    return true;
  });

  return (
    <div className="wallet-dashboard">
      {/* Header with greeting */}
      <div className="wallet-header">
        <div>
          <h2>My Wallet</h2>
          <p>Manage your money & payments securely</p>
        </div>
        
      </div>

      {/* Balance Card with gradient */}
      <div className="balance-card">
        <div className="balance-top">
          <span className="balance-label">Total Balance</span>
          <span className="balance-amount">{walletData.currency}{walletData.balance.toLocaleString()}</span>
        </div>
        {/* <div className="balance-stats">
          <div className="stat-item">
            <span className="stat-icon">📥</span>
            <div>
              <span className="stat-label">Total Deposits</span>
              <strong className="stat-value">{walletData.currency}{walletData.totalDeposit.toLocaleString()}</strong>
            </div>
          </div>
          <div className="stat-item">
            <span className="stat-icon">📤</span>
            <div>
              <span className="stat-label">Total Payments</span>
              <strong className="stat-value">{walletData.currency}{walletData.totalPayment.toLocaleString()}</strong>
            </div>
          </div> */}
        {/* </div> */}
      </div>

      {/* Action Buttons */}
      <div className="wallet-actions ">
        <button className=" deposit-btn" onClick={() => setShowDeposit(true)}>
          <span className="btn-icon">+</span>
          Add Money
        </button>
        <button className=" withdraw-btn" onClick={() => setShowWithdraw(true)}>
          <span className="btn-icon">↓</span>
          Withdraw
        </button>
        <button className=" transfer-btn">
          <span className="btn-icon">↗</span>
          Transfer
        </button>
      </div>

      {/* Tabs */}
      <div className="wallet-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'deposits' ? 'active' : ''}`}
          onClick={() => setActiveTab('deposits')}
        >
          Deposits
        </button>
        <button 
          className={`tab ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          Payments
        </button>
        <button 
          className={`tab ${activeTab === 'withdrawals' ? 'active' : ''}`}
          onClick={() => setActiveTab('withdrawals')}
        >
          Withdrawals
        </button>
      </div>

      {/* Transactions Section */}
      <div className="transactions-section">
        <div className="section-header">
          <h3>Recent Transactions</h3>
          <button className="view-all-btn">View All</button>
        </div>
        
        <div className="transactions-list">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map(t => (
              <div key={t.id} className="transaction-card">
                <div className="transaction-left">
                  <div className={`transaction-icon ${t.type}`}>
                    {t.type === 'deposit' && '📥'}
                    {t.type === 'payment' && '📤'}
                    {t.type === 'withdraw' && '💳'}
                  </div>
                  <div className="transaction-info">
                    <p className="transaction-title">{t.to}</p>
                    <span className="transaction-date">{t.date}</span>
                  </div>
                </div>
                <div className="transaction-right">
                  <span className={`transaction-amount ${t.type}`}>
                    {t.type === 'deposit' ? '+' : '-'}{walletData.currency}{t.amount.toLocaleString()}
                  </span>
                  <span className={`transaction-badge ${t.status}`}>
                    {t.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No transactions found</p>
            </div>
          )}
        </div>
      </div>

      {/* Counselor Payments - shown only on payments tab */}
      {activeTab === 'payments' && (
        <div className="counselor-section">
          <div className="section-header">
            <h3>Payments to Counselors</h3>
            <span className="section-badge">This month</span>
          </div>
          
          <div className="counselor-list">
            {counselorPayments.map((c, index) => (
              <div key={index} className="counselor-card">
                <div className="counselor-avatar">
                  {c.name.split(' ')[1]?.[0] || c.name[0]}
                </div>
                <div className="counselor-info">
                  <p className="counselor-name">{c.name}</p>
                  <span className="counselor-meta">{c.sessions} sessions • Last: {c.lastDate}</span>
                </div>
                <div className="counselor-amount">
                  <strong>{walletData.currency}{c.amount.toLocaleString()}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDeposit && (
        <div className="modal-overlay" onClick={() => setShowDeposit(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Money to Wallet</h3>
              <button className="close-btn" onClick={() => setShowDeposit(false)}>✕</button>
            </div>
            <form onSubmit={(e) => handleSubmit(e, 'Deposit')}>
              <div className="form-group">
                <label>Enter amount</label>
                <input
                  type="number"
                  placeholder="₹500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="100"
                  required
                />
              </div>
              
              <div className="quick-amounts">
                <button type="button" onClick={() => setAmount('500')}>₹500</button>
                <button type="button" onClick={() => setAmount('1000')}>₹1000</button>
                <button type="button" onClick={() => setAmount('2000')}>₹2000</button>
                <button type="button" onClick={() => setAmount('5000')}>₹5000</button>
              </div>

              <div className="payment-methods">
                <span>Payment methods</span>
                <div className="method-icons">
                  <span>💳</span>
                  <span>🏦</span>
                  <span>📱</span>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowDeposit(false)}>Cancel</button>
                <button type="submit" className="confirm-btn">Add Money</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="modal-overlay" onClick={() => setShowWithdraw(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Withdraw to Bank</h3>
              <button className="close-btn" onClick={() => setShowWithdraw(false)}>✕</button>
            </div>
            <form onSubmit={(e) => handleSubmit(e, 'Withdraw')}>
              <div className="form-group">
                <label>Amount to withdraw</label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  max={walletData.balance}
                  min="100"
                  required
                />
              </div>

              <div className="form-group">
                <label>Select bank account</label>
                <select className="bank-select">
                  <option>HDFC Bank •••• 4582</option>
                  <option>SBI •••• 7890</option>
                </select>
              </div>

              <div className="balance-info">
                <span>Available balance:</span>
                <strong>{walletData.currency}{walletData.balance.toLocaleString()}</strong>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowWithdraw(false)}>Cancel</button>
                <button type="submit" className="confirm-btn withdraw-confirm">Withdraw</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleWallet;