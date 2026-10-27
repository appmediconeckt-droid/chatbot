import React, { useState } from 'react';
import { isOnlinePayment } from '../../utils/providerPayments.js';
import './ProviderPaymentChoices.css';
import { CardBrands, UpiAppChoices, upiApps } from './PaymentMethodVisuals.jsx';

export default function ProviderPaymentChoices({ options, value, onChange, disabled = false }) {
  const [upiApp, setUpiApp] = useState('');
  const choices = options.displayMethods || options.methods;
  const cards = choices.filter(method => ['credit_card', 'debit_card'].includes(method.id));
  const groups = [
    ...(cards.length ? [{ id: 'card', label: 'Credit / Debit Card', icon: 'fa-credit-card', methods: cards }] : []),
    ...choices.filter(method => !['credit_card', 'debit_card', 'insurance'].includes(method.id)).map(method => ({ ...method, methods: [method] })),
  ];
  return <div className="abm-pay-card provider-payment-choices">
    <h3>Choose Payment Method</h3>
    {options.mode === "test" && <p role="status">Razorpay test mode: use test payment details in secure checkout. No real money is charged.</p>}
    {options.loading && <p role="status">Loading payment options...</p>}
    {options.error && <p role="alert">{options.error}</p>}
    {!options.loading && !options.error && !options.methods.length && <p role="status">This provider has no payment method available yet.</p>}
    <div className="provider-payment-groups">{groups.map(group => {
      const available = group.methods.filter(method => !method.unavailableReason);
      const selected = available.some(method => method.id === value);
      const reason = available.length ? '' : group.methods[0]?.unavailableReason;
      return <section key={group.id} className={`provider-payment-group ${selected ? 'is-selected' : ''}`}>
        <button className="abm-pay-method" type="button" disabled={disabled || !available.length} aria-pressed={selected} onClick={() => onChange(available.find(method => method.id === value)?.id || available[0].id)}>
          <span className="abm-pay-method-ic"><i className={`fa-solid ${group.icon}`} aria-hidden="true" /></span><span className="abm-pay-method-label">{group.label}{reason && <small className="provider-payment-unavailable">{reason}</small>}</span><span className="abm-pay-method-radio">{selected && <i className="fa-solid fa-check" aria-hidden="true" />}</span>
        </button>
        {group.id === 'card' && <CardBrands />}
        {group.id === 'card' && selected && <div className="provider-payment-expanded">
          {available.length > 1 && <div className="provider-card-types" role="group" aria-label="Card type">{available.map(method => <button key={method.id} type="button" disabled={disabled} aria-pressed={value === method.id} onClick={() => onChange(method.id)}>{method.label}</button>)}</div>}
          <p>{options.mode === 'test' ? 'Continue to Razorpay Checkout and use the official test card details.' : 'Continue with “Enter card details & pay” to enter your card number, expiry and CVV in secure checkout.'}</p>
        </div>}
        {group.id === 'upi' && selected && <div className="provider-payment-expanded"><h4>Choose your UPI app</h4><UpiAppChoices value={upiApp} disabled={disabled} onChange={app => { setUpiApp(app); onChange('upi'); }} />{upiApp && <p>{upiApps.find(([id]) => id === upiApp)?.[1]} selected. {options.mode === 'test' ? 'Use the UPI test options offered by Razorpay Checkout. Test availability depends on your account.' : 'Continue to secure UPI checkout and approve the payment in your app.'}</p>}</div>}
      </section>;
    })}</div>
    {value === 'wallet' && <p>The appointment fee will be deducted from your wallet and recorded in your doctor's earnings wallet.</p>}
    {isOnlinePayment(value) && value !== 'wallet' && options.mode !== "test" && <p>{value === 'upi' ? 'Choose your UPI app, such as Google Pay, PhonePe, Paytm or another supported app, in secure Razorpay checkout.' : 'Enter your card number, expiry and CVV in secure Razorpay checkout when you continue.'}</p>}
  </div>;
}
