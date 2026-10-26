import { useEffect, useState } from 'react';
import api from '../axiosConfig.js';
import { paymentCheckoutDisplay } from './paymentCheckoutConfig.js';

const labels = { credit_card: ['Credit Card', 'fa-credit-card'], debit_card: ['Debit Card', 'fa-credit-card'], upi: ['UPI', 'fa-mobile-screen-button'], cash: ['Cash', 'fa-money-bill-wave'], insurance: ['Insurance', 'fa-shield-heart'] };
export const isOnlinePayment = (method) => ['credit_card', 'debit_card', 'upi'].includes(method);
export function useProviderPaymentOptions(providerId) {
  const [state, setState] = useState({ methods: [], loading: true, error: '', consultationFee: 0, currency: 'INR' });
  useEffect(() => {
    let active = true;
    setState({ methods: [], loading: Boolean(providerId), error: '', consultationFee: 0, currency: 'INR' });
    if (!providerId) return;
    api.get(`/api/payments/providers/${providerId}/methods`).then(({ data }) => {
      if (active) setState({ ...data, loading: false, error: '', methods: (data.methods || []).filter((method) => labels[method]).map((method) => ({ method, id: method, label: labels[method][0], icon: labels[method][1] })) });
    }).catch(() => { if (active) setState({ methods: [], loading: false, error: 'Payment options could not be loaded. Please reopen this booking to try again.' }); });
    return () => { active = false; };
  }, [providerId]);
  return state;
}

let scriptPromise;
export function loadPaymentCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    const timer = window.setTimeout(() => failed(), 20000);
    const failed = () => { clearTimeout(timer); script.remove(); scriptPromise = null; reject(new Error('Payment checkout could not load. Check your connection and retry.')); };
    script.onload = () => { clearTimeout(timer); if (window.Razorpay) resolve(); else failed(); };
    script.onerror = failed;
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export async function payForAppointment(appointmentId, method) {
  await loadPaymentCheckout();
  const { data: order } = await api.post(`/api/payments/appointments/${appointmentId}/order`, { method });
  if (order.paid) return order;
  return new Promise((resolve, reject) => {
    let confirming = false;
    const checkout = new window.Razorpay({
      key: order.key_id, order_id: order.order_id, amount: order.amount, currency: order.currency,
      name: 'Humaeli', description: 'Appointment payment', config: paymentCheckoutDisplay(order.method),
      handler: async (response) => {
        confirming = true;
        try {
          const { data } = await api.post(`/api/payments/appointments/${appointmentId}/verify`, response);
          if (!data.paid) throw new Error('Payment confirmation is pending. Your appointment remains reserved.');
          resolve(data);
        } catch (error) {
          // Recover a lost verification response before offering another attempt.
          try {
            const { data } = await api.post(`/api/payments/appointments/${appointmentId}/reconcile`);
            if (data.paid) { resolve(data); return; }
          } catch { /* Surface the original confirmation error. */ }
          reject(new Error(error.response?.data?.message || error.message || 'Payment confirmation is pending.'));
        }
      },
      modal: { ondismiss: () => { if (!confirming) reject(new Error('Payment was not completed. Your appointment is reserved and unpaid. You can retry payment.')); } },
      theme: { color: '#004ac6' },
    });
    checkout.open();
  });
}
