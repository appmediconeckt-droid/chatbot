import React, { useEffect, useState } from 'react';
import axios from '../../../../axiosConfig.js';
import { ChevronLeft, CreditCard, QrCode, ShieldCheck, Banknote } from 'lucide-react';
import './PaymentSettings.css';

const EMPTY_BANK = { accountHolder: '', bankName: '', accountNumber: '', ifscCode: '' };
const UPI_APPS = [
  { id: 'phonepe', name: 'PhonePe', mark: 'Pe' },
  { id: 'google_pay', name: 'Google Pay', mark: 'G' },
  { id: 'paytm', name: 'Paytm', mark: 'Paytm' },
  { id: 'bhim', name: 'BHIM', mark: 'BHIM' },
  { id: 'other', name: 'Other UPI app', mark: null },
];

function PaymentSwitch({ checked, onChange, label, controls }) {
  return <label className="pps-switch"><input type="checkbox" role="switch" aria-label={label} aria-controls={controls} checked={checked} onChange={event => onChange(event.target.checked)} /><span aria-hidden="true" /></label>;
}


export default function PaymentSettings({ onBack, theme = 'doctor' }) {
  const [methods, setMethods] = useState([]);
  const [bank, setBank] = useState(EMPTY_BANK);
  const [confirmAccount, setConfirmAccount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [upiApp, setUpiApp] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const cardsEnabled = methods.some(method => ['credit_card', 'debit_card'].includes(method));
  useEffect(() => {
    let active = true;
    setLoaded(false); setError('');
    axios.get('/api/payments/preferences', { timeout: 15000 }).then(({ data }) => {
      if (!active) return;
      setMethods(data.methods || ['cash']);
      setBank({ ...EMPTY_BANK, ...data.bankAccount });
      setConfirmAccount(data.bankAccount?.accountNumber || '');
      setUpiId(data.upiId || '');
      setUpiApp(data.upiApp || (data.upiId ? 'other' : '')); setLoaded(true);
    }).catch((err) => {
      if (!active) return;
      setError(err.response?.status === 404
        ? 'Payment settings are not available on this server yet. Start or deploy the updated backend, then try again.'
        : err.response?.status === 401
          ? 'Your session has expired. Please sign in again.'
          : 'Payment settings could not be reached. Check your connection and try again.');
    });
    return () => { active = false; };
  }, [loadAttempt]);
  const change = () => { setSaved(false); setError(''); };
  const updateBank = (key, value) => { setBank(previous => ({ ...previous, [key]: value })); change(); };
  const save = async (event) => {
    event.preventDefault();
    if (saving || !loaded) return;
    if (!methods.length) { setError('Select at least one payment method.'); return; }
    if (cardsEnabled && bank.accountNumber !== confirmAccount) { setError('Account numbers do not match.'); return; }
    if (methods.includes('upi') && !upiApp) { setError('Choose the app your UPI ID is linked to.'); return; }
    setSaving(true); setError(''); setSaved(false);
    try {
      await axios.put('/api/payments/preferences', { methods, bankAccount: bank, upiId, upiApp });
      // Cache only enabled methods; receiving bank details stay on the server.
      try {
        const profile = JSON.parse(localStorage.getItem('userData') || '{}');
        const id = profile._id || profile.id || profile.doctor_id || profile.doctorId;
        if (id) localStorage.setItem('doctorPaymentSettings:' + id, JSON.stringify({ creditCard: methods.includes('credit_card'), debitCard: methods.includes('debit_card'), onlinePayment: cardsEnabled, upiBank: methods.includes('upi'), cash: methods.includes('cash') }));
      } catch { /* The server remains authoritative when browser storage is unavailable. */ }
      window.dispatchEvent(new CustomEvent('provider-payment-settings-updated'));
      setSaved(true);
    } catch (err) { setError(err.response?.data?.message || 'Payment settings could not be saved. Please try again.'); }
    finally { setSaving(false); }
  };
  const toggle = (keys, enabled) => {
    setMethods(previous => enabled ? [...new Set([...previous, ...keys])] : previous.filter(method => !keys.includes(method)));
    change();
  };
  return <form onSubmit={save} className={`provider-payment-settings pps-theme--${theme}`}>
    <header className="pps-header">
      <button type="button" className="pps-back" aria-label="Back to settings" onClick={() => onBack ? onBack() : window.history.back()}><ChevronLeft aria-hidden="true" /></button>
      <div><h2>Payment Settings</h2><p>How patients pay for appointments</p></div>
      <ShieldCheck className="pps-security" size={19} aria-hidden="true" />
    </header>
    {!loaded && !error && <p role="status" className="pps-notice">Loading payment settings...</p>}
    <fieldset disabled={!loaded || saving} className="pps-body">
      <section className={'pps-method-card ' + (cardsEnabled ? 'is-enabled' : '')}>
        <div className="pps-method-heading">
          <span className="pps-method-icon pps-card-icon"><CreditCard aria-hidden="true" /></span>
          <div className="pps-method-copy"><h3>Credit / Debit Card</h3><p>Patients pay by credit or debit card while booking.</p></div>
          <PaymentSwitch checked={cardsEnabled} label="Accept credit and debit cards" controls="pps-bank-details" onChange={enabled => toggle(['credit_card', 'debit_card'], enabled)} />
        </div>
        <div className="pps-card-brands" aria-label="Visa, Mastercard and RuPay">
          <span className="pps-brand pps-visa">VISA</span>
          <span className="pps-brand pps-mastercard"><span className="pps-mastercard-symbol" aria-hidden="true"><i /><i /></span><span>mastercard</span></span>
          <span className="pps-brand pps-rupay">RuPay <span aria-hidden="true"><i /><i /></span></span>
        </div>
        {cardsEnabled && <div className="pps-expanded" id="pps-bank-details">
          <h4>Receiving bank account</h4><p>Choose the account where you want to receive payments.</p>
          <div className="pps-form-grid">
            <label>Account holder name<input required autoComplete="off" maxLength={100} value={bank.accountHolder} onChange={event => updateBank('accountHolder', event.target.value)} placeholder="Name as on bank account" /></label>
            <label>Bank name<input required maxLength={100} value={bank.bankName} onChange={event => updateBank('bankName', event.target.value)} placeholder="Enter bank name" /></label>
            <label>Account number<input required inputMode="numeric" pattern="[0-9]{8,20}" maxLength={20} value={bank.accountNumber} onChange={event => updateBank('accountNumber', event.target.value.replace(/\D/g, ''))} placeholder="Enter account number" /></label>
            <label>Confirm account number<input required inputMode="numeric" maxLength={20} value={confirmAccount} onChange={event => { setConfirmAccount(event.target.value.replace(/\D/g, '')); change(); }} placeholder="Re-enter account number" /></label>
            <label>IFSC code<input required pattern="[A-Z]{4}0[A-Z0-9]{6}" maxLength={11} value={bank.ifscCode} onChange={event => updateBank('ifscCode', event.target.value.toUpperCase())} placeholder="ABCD0123456" /></label>
          </div>
        </div>}
      </section>

      <section className={'pps-method-card ' + (methods.includes('upi') ? 'is-enabled' : '')}>
        <div className="pps-method-heading">
          <span className="pps-method-icon pps-upi-icon"><QrCode aria-hidden="true" /></span>
          <div className="pps-method-copy"><h3>UPI</h3><p>Patients pay to your UPI ID from any UPI app.</p></div>
          <PaymentSwitch checked={methods.includes('upi')} label="Accept UPI payments" controls="pps-upi-details" onChange={enabled => toggle(['upi'], enabled)} />
        </div>
        {methods.includes('upi') && <div className="pps-expanded" id="pps-upi-details">
          <h4>Choose your UPI app</h4><p>The app your UPI ID is linked to.</p>
          <div className="pps-app-list" role="radiogroup" aria-label="Choose your UPI app">
            {UPI_APPS.map(app => <label className={'pps-app-row ' + (upiApp === app.id ? 'is-selected' : '')} key={app.id}>
              <span className={'pps-app-logo pps-app-logo--' + app.id} aria-hidden="true">{app.mark || <span className="pps-other-dots">{Array.from({ length: 9 }, (_, index) => <i key={index} />)}</span>}</span>
              <span className="pps-app-name">{app.name}</span>
              <input type="radio" name="provider-upi-app" value={app.id} checked={upiApp === app.id} onChange={() => { setUpiApp(app.id); change(); }} />
              <span className="pps-radio" aria-hidden="true" />
            </label>)}
          </div>
          {upiApp && <div className="pps-form-grid pps-upi-id"><label>Your UPI ID<input required value={upiId} maxLength={320} placeholder="yourname@upi" onChange={event => { setUpiId(event.target.value); change(); }} /><small>Enter the UPI ID linked to your selected app.</small></label></div>}
        </div>}
      </section>
      <section className={'pps-method-card ' + (methods.includes('cash') ? 'is-enabled' : '')}>
        <div className="pps-method-heading">
          <span className="pps-method-icon pps-cash-icon"><Banknote aria-hidden="true" /></span>
          <div className="pps-method-copy"><h3>Cash Payment</h3><p>Patients pay cash at the clinic when they arrive for their appointment.</p></div>
          <PaymentSwitch checked={methods.includes('cash')} label="Accept cash payments" onChange={enabled => toggle(['cash'], enabled)} />
        </div>
      </section>
    </fieldset>
    {error && <div role="alert" className="pps-notice pps-error">{error}{!loaded && <button type="button" className="pps-retry" onClick={() => setLoadAttempt(value => value + 1)}>Try again</button>}</div>}
    {saved && <div role="status" className="pps-notice pps-success">Payment settings saved successfully.</div>}
    <footer className="pps-footer"><button type="submit" disabled={!loaded || saving}>{saving ? 'Saving...' : 'Save Payment Settings'}</button></footer>
  </form>;
}
