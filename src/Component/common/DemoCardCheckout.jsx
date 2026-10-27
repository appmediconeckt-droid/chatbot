import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DEMO_CARD, validateDemoCard } from '../../utils/demoCardPayment.js';
import './DemoCardCheckout.css';

function DemoCardCheckout({ method, onSuccess, onCancel, onClose }) {
  const isUpi = method === 'upi';
  const dialog = useRef(null);
  const [card, setCard] = useState(DEMO_CARD);
  const [error, setError] = useState('');
  useEffect(() => {
    dialog.current.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);
  return <dialog ref={dialog} className="demo-card-checkout" aria-labelledby="demo-card-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <form onSubmit={event => { event.preventDefault(); const problem = isUpi ? '' : validateDemoCard(card); if (problem) setError(problem); else onSuccess(); }} autoComplete="off">
      <div className="demo-card-heading"><h2 id="demo-card-title">Dummy {isUpi ? 'UPI' : method === 'debit_card' ? 'debit card' : 'credit card'} payment</h2><button type="button" aria-label="Close demo checkout" onClick={onClose}>×</button></div>
      <p className="demo-card-notice">TEST MODE — No money will be charged. A successful simulation will be saved as demo payment completed.</p>
      {isUpi ? <p>Test UPI ID: <strong>demo@humaeli.invalid</strong><br />Click below to simulate a successful UPI payment. No UPI PIN or app approval is needed.</p> : <>
      <p>Test number: <strong>4111 1111 1111 1111</strong><br />Expiry: <strong>12/30</strong> · CVV: <strong>123</strong></p>
      <label>Name on test card<input required value={card.name} maxLength={60} onChange={event => setCard({ ...card, name: event.target.value })} /></label>
      <label>Dummy card number<input required inputMode="numeric" maxLength={19} value={card.number} onChange={event => setCard({ ...card, number: event.target.value })} /></label>
      <div className="demo-card-grid"><label>Expiry<input required placeholder="MM/YY" maxLength={5} value={card.expiry} onChange={event => setCard({ ...card, expiry: event.target.value })} /></label><label>Test CVV<input required type="password" inputMode="numeric" maxLength={3} value={card.cvv} onChange={event => setCard({ ...card, cvv: event.target.value })} /></label></div>
      </>}
      {error && <p role="alert">{error}</p>}
      <div className="demo-card-actions"><button type="button" onClick={() => onCancel('Demo payment was not completed. You can retry.')}>Simulate failure</button><button type="submit">Simulate successful payment</button></div>
    </form>
  </dialog>;
}

export function showDemoCardCheckout(method) {
  return new Promise((resolve, reject) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const finish = (error, cancelled = false) => {
      root.unmount(); host.remove();
      if (cancelled) reject(Object.assign(new Error(), { code: 'PAYMENT_CANCELLED' }));
      else if (error) reject(new Error(error));
      else resolve({ success: true, demo: true, paid: false });
    };
    root.render(<DemoCardCheckout method={method} onSuccess={() => finish()} onCancel={finish} onClose={() => finish(undefined, true)} />);
  });
}
