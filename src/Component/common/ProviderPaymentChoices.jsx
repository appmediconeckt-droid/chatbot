import React from 'react';
import { isOnlinePayment } from '../../utils/providerPayments.js';

export default function ProviderPaymentChoices({ options, value, onChange, disabled = false }) {
  return <div className="abm-pay-card">
    <h3>Choose Payment Method</h3>
    {options.loading && <p role="status">Loading payment options...</p>}
    {options.error && <p role="alert">{options.error}</p>}
    {!options.loading && !options.error && !options.methods.length && <p role="status">This provider has no payment method available yet.</p>}
    <div className="abm-pay-methods">{options.methods.map((method) => <button key={method.id} className={`abm-pay-method ${value === method.id ? 'selected' : ''}`} type="button" disabled={disabled} onClick={() => onChange(method.id)}>
      <span className="abm-pay-method-ic"><i className={`fa-solid ${method.icon}`} /></span><span className="abm-pay-method-label">{method.label}</span><span className="abm-pay-method-radio">{value === method.id && <i className="fa-solid fa-check" />}</span>
    </button>)}</div>
    {isOnlinePayment(value) && <p>{value === 'upi' ? 'Choose your UPI app, such as Google Pay, PhonePe, Paytm or another supported app, in secure Razorpay checkout.' : 'Enter your card number, expiry and CVV in secure Razorpay checkout when you continue.'}</p>}
  </div>;
}
