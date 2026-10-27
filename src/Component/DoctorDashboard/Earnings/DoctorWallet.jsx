import React, { useEffect, useState } from 'react';
import api from '../../../axiosConfig.js';
import { subscribeSocketRefresh } from '../../../hooks/useSocketRefresh.js';
import './DoctorWallet.css';

const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value || 0);
export default function DoctorWallet() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [demo, setDemo] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [method, setMethod] = useState('all');
  const [page, setPage] = useState(1);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try { const response = await api.get('/api/payments/wallet'); if (active) { setData(response.data); setError(''); } }
      catch { if (active) setError('Wallet could not be loaded. Please retry.'); }
    };
    void refresh();
    const unsubscribe = subscribeSocketRefresh(refresh, ['wallet:updated', 'appointments:updated'], { initial: false });
    window.addEventListener('focus', refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => { active = false; unsubscribe(); window.removeEventListener('focus', refresh); window.clearInterval(timer); };
  }, [attempt]);
  const wallet = demo ? data?.demo : data;
  const transactions = (wallet?.transactions || []).filter(row =>
    (status === 'all' || row.status === status) && (method === 'all' || row.method === method) &&
    [row.patient, row.appointmentId, row.paymentId, row.clinic].some(value => String(value || '').toLowerCase().includes(search.trim().toLowerCase())));
  const pages = Math.max(1, Math.ceil(transactions.length / 10));
  const currentPage = Math.min(page, pages);
  const visible = transactions.slice((currentPage - 1) * 10, currentPage * 10);
  return <section className="doctor-earnings-wallet" aria-label="Doctor earnings wallet">
    <header className="dew-heading"><span className="dew-icon"><i className="fa-solid fa-wallet" aria-hidden="true" /></span><div><h1>Earnings</h1><p>Your wallet balance and appointment payment transactions</p></div></header>
    <p>Patient payments appear here first. Earnings become available after the appointment is completed. Bank settlement is tracked separately.</p>
    <div className="dew-actions"><button type="button" onClick={() => setAttempt(value => value + 1)}>Refresh</button><label><input type="checkbox" checked={demo} onChange={event => setDemo(event.target.checked)} /> Show demo earnings</label></div>
    {demo && <p role="status">Demo earnings only. No actual money was collected or transferred.</p>}
    {error && <p role="alert">{error}</p>}
    {!data && !error && <p role="status">Loading wallet...</p>}
    {wallet && <><div className="dew-balances">{[['pending', 'Pending earnings'], ['available', 'Available balance'], ['settled', 'Settled to bank'], ['platformFees', 'Platform fees'], ['held', 'Cancellation / refund review']].map(([key, title]) => <div key={key}><span>{title}</span><strong>{money(wallet.summary[key])}</strong></div>)}</div>
    <p>Platform fee is shown for each payment. Canceled payments are held for refund review. Available balance does not mean money has reached your bank.</p>
    <h2>Transaction history</h2>
    <div className="dew-filters">
      <label>Search transactions<input type="search" value={search} placeholder="Patient, appointment, reference or clinic" onChange={event => { setSearch(event.target.value); setPage(1); }} /></label>
      <label>Status<select value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="all">All statuses</option><option value="pending">Pending earnings</option><option value="available">Available balance</option><option value="settled">Settled to bank</option><option value="held">Refund review</option></select></label>
      <label>Payment method<select value={method} onChange={event => { setMethod(event.target.value); setPage(1); }}><option value="all">All methods</option><option value="credit_card">Credit card</option><option value="debit_card">Debit card</option><option value="upi">UPI</option><option value="wallet">Wallet</option></select></label>
    </div>
    <div className="dew-history"><table><caption>Payment transaction history</caption><thead><tr>{['Date', 'Patient', 'Appointment / reference', 'Clinic', 'Method', 'Total', 'Platform fee', 'Your earning', 'Status'].map(title => <th key={title}>{title}</th>)}</tr></thead><tbody>{visible.map(row => <tr key={row.id}><td>{new Date(row.createdAt).toLocaleString('en-IN')}</td><td>{row.patient}</td><td>{row.appointmentId}<br /><small>{row.paymentId}</small></td><td>{row.clinic}</td><td>{row.method.replaceAll('_', ' ')}</td><td>{money(row.gross)}</td><td>{money(row.platformFee)}</td><td>{money(row.net)}</td><td>{({ pending: 'Pending appointment completion', available: 'Available · bank settlement pending', held: 'Held for refund review', settled: 'Bank settlement completed' })[row.status]}</td></tr>)}</tbody></table>{!transactions.length && <p>{wallet.transactions.length ? 'No transactions match your filters.' : 'No payments received yet.'}</p>}</div><div className="dew-pagination"><span>{transactions.length} transactions</span><button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage} of {pages}</span><button type="button" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>Next</button></div></>}
  </section>;
}

