import React, { useEffect, useState } from 'react';
import axios from '../../../../axiosConfig.js';
import { ChevronLeft, CreditCard, QrCode, ShieldCheck, Banknote, Landmark } from 'lucide-react';
import './PaymentSettings.css';
import { CardBrands } from '../../../common/PaymentMethodVisuals.jsx';
import { normalizePaymentMethods, togglePaymentMethod, paymentSettingsError } from './paymentSettingsState.js';

const EMPTY_BANK = { accountHolder: '', bankName: '', accountNumber: '', ifscCode: '' };
const METHOD_OPTIONS = [
  ['card', 'Credit / Debit Card', 'Accept credit and debit card payments.', CreditCard],
  ['upi', 'UPI', 'Accept payments through UPI.', QrCode],
  ['cash', 'Cash', 'Patients pay cash at the clinic.', Banknote],
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
  const [availabilityNotice, setAvailabilityNotice] = useState('');
  const cardsEnabled = methods.some(method => ['credit_card', 'debit_card'].includes(method));
  const bankStarted = Object.values(bank).some(value => String(value || '').trim());
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoaded(false); setError('');
    const load = async () => {
      for (let attempt = 0; attempt < 2; attempt++) {
        try { return await axios.get('/api/payments/preferences', { timeout: 30000, signal: controller.signal }); }
        catch (err) {
          if (!active || attempt || (err.response && ![502, 503, 504].includes(err.response.status))) throw err;
        }
      }
    };
    load().then(({ data }) => {
      if (!active) return;
      if (!data?.success || !Array.isArray(data.methods)) throw new Error('Invalid payment settings response');
      setMethods(normalizePaymentMethods(data.methods));
      setAvailabilityNotice([...new Set(Object.entries(data.unavailableMethods || {}).filter(([method]) => method !== 'wallet').map(([, reason]) => reason))].join(' '));
      setBank({ ...EMPTY_BANK, ...data.bankAccount });
      setConfirmAccount(data.bankAccount?.accountNumber || '');
      setUpiId(data.upiId || '');
      setUpiApp(data.upiApp || (data.upiId ? 'other' : '')); setLoaded(true);
    }).catch((err) => {
      if (!active) return;
      setError(err.message === 'Invalid payment settings response' ? 'Payment settings could not be read. Please try again or contact support.' : paymentSettingsError(err));
    });
    return () => { active = false; controller.abort(); };
  }, [loadAttempt]);
  const change = () => { setSaved(false); setError(''); };
  const updateBank = (key, value) => { setBank(previous => ({ ...previous, [key]: value })); change(); };
  const save = async (event) => {
    event.preventDefault();
    if (saving || !loaded) return;
    if (bankStarted && bank.accountNumber !== confirmAccount) { setError('Account numbers do not match.'); return; }
    setSaving(true); setError(''); setSaved(false);
    try {
      const { data } = await axios.put('/api/payments/preferences', { methods, bankAccount: bank, upiId, upiApp }, { timeout: 30000 });
      if (!data?.success || !Array.isArray(data.methods)) throw new Error('Payment settings were not saved. Please try again.');
      const savedMethods = normalizePaymentMethods(data.methods);
      if (savedMethods.length !== methods.length || methods.some(method => !savedMethods.includes(method))) throw new Error('Selected payment methods were not saved. Please try again.');
      setMethods(savedMethods);
      setAvailabilityNotice([...new Set(Object.entries(data.unavailableMethods || {}).filter(([method]) => method !== 'wallet').map(([, reason]) => reason))].join(' '));
      // Cache only enabled methods; receiving bank details stay on the server.
      try {
        const profile = JSON.parse(localStorage.getItem('userData') || '{}');
        const id = profile._id || profile.id || profile.doctor_id || profile.doctorId;
        if (id) localStorage.setItem('doctorPaymentSettings:' + id, JSON.stringify({ creditCard: methods.includes('credit_card'), debitCard: methods.includes('debit_card'), onlinePayment: cardsEnabled, upiBank: methods.includes('upi'), cash: methods.includes('cash') }));
      } catch { /* The server remains authoritative when browser storage is unavailable. */ }
      window.dispatchEvent(new CustomEvent('provider-payment-settings-updated'));
      setSaved(true);
    } catch (err) { setError(err.response || err.code ? paymentSettingsError(err) : err.message); }
    finally { setSaving(false); }
  };
  return <form onSubmit={save} className={`provider-payment-settings pps-theme--${theme}`}>
    <header className="pps-header">
      <button type="button" className="pps-back" aria-label="Back to settings" onClick={() => onBack ? onBack() : window.history.back()}><ChevronLeft aria-hidden="true" /></button>
      <div><h2>Payment Settings</h2><p>How patients pay for appointments</p></div>
      <ShieldCheck className="pps-security" size={19} aria-hidden="true" />
    </header>
    {!loaded && !error && <p role="status" className="pps-notice">Loading payment settings...</p>}
    {loaded && availabilityNotice && <p role="status" className="pps-notice">{availabilityNotice} Your selected methods can still be saved.</p>}
      <section className="pps-method-card pps-payment-option pps-wallet-option is-enabled" aria-labelledby="pps-wallet-title">
        <div className="pps-method-heading">
          <span className="pps-method-icon"><i className="fa-solid fa-wallet" aria-hidden="true" /></span>
          <div className="pps-method-copy"><h3 id="pps-wallet-title">Patient Wallet</h3><p>Always enabled for INR appointments in both test and live mode. Patients pay from their own wallet balance. Card, UPI, cash and receiving bank settings do not control Wallet payments.</p></div>
          <span className="pps-wallet-status">Always enabled</span>
        </div>
      </section>
    <fieldset disabled={!loaded || saving} className="pps-body">
      <div className="pps-section-heading"><h3>Accepted payment methods</h3><p>Select the methods you accept, then save your settings.</p></div>
      {METHOD_OPTIONS.map(option => {
        const [id, label, description, Icon] = option;
        const checked = id === 'card' ? cardsEnabled : methods.includes(id);
        return <section key={id} className={'pps-method-card pps-payment-option ' + (checked ? 'is-enabled' : '')}>
        <div className="pps-method-heading">
          <span className="pps-method-icon pps-card-icon"><Icon aria-hidden="true" /></span>
          <div className="pps-method-copy"><h3>{label}</h3><p>{description}</p></div>
          <PaymentSwitch checked={checked} label={`Accept ${label} payments`} onChange={enabled => { setMethods(previous => togglePaymentMethod(previous, id, enabled)); change(); }} />
        </div>
        {id === 'card' && <CardBrands />}
      </section>; })}
      <details className="pps-method-card" id="pps-bank-details">
          <summary>Receiving bank details</summary>
          <div className="pps-details-heading"><Landmark size={24} aria-hidden="true" /><div><h3 id="pps-bank-title">Receiving bank details</h3><p>Add or update your receiving bank account. Payment methods can be selected and saved without adding bank details.</p></div></div>
          <div className="pps-form-grid pps-bank-fields">
            <label>Account holder name<input required={bankStarted} autoComplete="off" maxLength={100} value={bank.accountHolder} onChange={event => updateBank('accountHolder', event.target.value)} placeholder="Name as on bank account" /></label>
            <label>Bank name<input required={bankStarted} maxLength={100} value={bank.bankName} onChange={event => updateBank('bankName', event.target.value)} placeholder="Enter bank name" /></label>
            <label>Account number<input required={bankStarted} inputMode="numeric" pattern="[0-9]{8,20}" maxLength={20} value={bank.accountNumber} onChange={event => updateBank('accountNumber', event.target.value.replace(/\D/g, ''))} placeholder="Enter account number" /></label>
            <label>Confirm account number<input required={bankStarted} inputMode="numeric" maxLength={20} value={confirmAccount} onChange={event => { setConfirmAccount(event.target.value.replace(/\D/g, '')); change(); }} placeholder="Re-enter account number" /></label>
            <label>IFSC code<input required={bankStarted} pattern="[A-Z]{4}0[A-Z0-9]{6}" maxLength={11} value={bank.ifscCode} onChange={event => updateBank('ifscCode', event.target.value.toUpperCase())} placeholder="ABCD0123456" /></label>
          </div>
        </details>

      <section className="pps-method-card" aria-labelledby="pps-upi-title">
        <div className="pps-details-heading"><QrCode size={24} aria-hidden="true" /><div><h3 id="pps-upi-title">Receiving UPI details</h3><p>Add your UPI ID to complete UPI payment setup.</p></div></div>
        <div className="pps-form-grid pps-bank-fields">
          <label>UPI ID<input value={upiId} maxLength={320} placeholder="yourname@upi" onChange={event => { setUpiId(event.target.value); change(); }} /></label>
        </div>
      </section>
    </fieldset>
    {error && <div role="alert" className="pps-notice pps-error">{error}{!loaded && <button type="button" className="pps-retry" onClick={() => setLoadAttempt(value => value + 1)}>Try again</button>}</div>}
    {saved && <div role="status" className="pps-notice pps-success">Payment settings saved successfully.</div>}
    <footer className="pps-footer"><button type="submit" disabled={!loaded || saving}>{saving ? 'Saving...' : 'Save Payment Settings'}</button></footer>
  </form>;
}
