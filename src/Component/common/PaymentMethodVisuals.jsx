import React, { useId } from 'react';
import './PaymentMethodVisuals.css';

export const upiApps = [['phonepe', 'PhonePe', 'Pe'], ['google_pay', 'Google Pay', 'G'], ['paytm', 'Paytm', 'Paytm'], ['bhim', 'BHIM', 'BHIM'], ['other', 'Other UPI app', '•••']];

export function CardBrands() {
  return <div className="payment-card-brands" aria-label="Visa, Mastercard and RuPay">
    <span className="payment-brand-visa">VISA</span>
    <span className="payment-brand-mastercard"><i aria-hidden="true" /><b>mastercard</b></span>
    <span className="payment-brand-rupay">RuPay <b aria-hidden="true">▶</b></span>
  </div>;
}

export function UpiAppChoices({ value, onChange, disabled = false }) {
  const groupName = useId();
  return <div className="payment-upi-apps" role="radiogroup" aria-label="Choose your UPI app">
    {upiApps.map(([id, name, mark]) => <label key={id} className={`payment-upi-app ${value === id ? 'is-selected' : ''}`}>
      <span className={`payment-app-mark payment-app-${id}`} aria-hidden="true">{mark}</span>
      <span>{name}</span><input type="radio" name={groupName} value={id} checked={value === id} disabled={disabled} onChange={() => onChange(id)} />
    </label>)}
  </div>;
}
