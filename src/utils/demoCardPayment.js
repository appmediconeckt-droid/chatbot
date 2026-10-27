export const DEMO_CARD = { number: '4111111111111111', expiry: '12/30', cvv: '123', name: 'Test Patient' };
export const demoCardPaymentsEnabled = (env = import.meta.env || {}) => env.DEV === true && env.VITE_DEMO_CARD_PAYMENTS === 'true';
export const isCardPayment = method => ['credit_card', 'debit_card'].includes(method);
export const isDemoPaymentMethod = method => isCardPayment(method) || method === 'upi';
export const appointmentPaymentId = value => String((value && typeof value === 'object' ? value._id || value.id || value.appointmentId : value) || '');
const receiptKey = (appointment, storage) => {
  let profile;
  try { profile = JSON.parse(storage?.getItem('userData') || 'null'); } catch { /* Use the separately stored login ID. */ }
  const userId = storage?.getItem('userId') || storage?.getItem('user_id') || profile?._id || profile?.id;
  const appointmentId = appointmentPaymentId(appointment);
  return userId && appointmentId ? `demo-card-receipt:${userId}:${appointmentId}` : null;
};
export function readDemoPayment(appointmentId, { enabled = demoCardPaymentsEnabled(), storage = globalThis.localStorage } = {}) {
  if (!enabled) return null;
  try {
    const key = receiptKey(appointmentId, storage);
    const receipt = key ? JSON.parse(storage.getItem(key) || 'null') : null;
    return receipt?.mode === 'demo' && receipt.appointmentId === appointmentPaymentId(appointmentId) && isDemoPaymentMethod(receipt.method) ? receipt : null;
  } catch { return null; }
}
export function saveDemoPayment(appointmentId, method, { enabled = demoCardPaymentsEnabled(), storage = globalThis.localStorage } = {}) {
  if (!enabled || !isDemoPaymentMethod(method)) throw new Error('Dummy payments are not enabled.');
  const key = receiptKey(appointmentId, storage);
  if (!key) throw new Error('Sign in before completing the dummy payment.');
  const receipt = { mode: 'demo', appointmentId: appointmentPaymentId(appointmentId), method, completedAt: new Date().toISOString() };
  storage.setItem(key, JSON.stringify(receipt));
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('demo-payment-completed', { detail: { appointmentId: receipt.appointmentId } }));
  return receipt;
}
export function validateDemoCard(card) {
  if (String(card.number || '').replace(/\s/g, '') !== DEMO_CARD.number || card.expiry !== DEMO_CARD.expiry || card.cvv !== DEMO_CARD.cvv || !String(card.name || '').trim()) {
    return 'Use only the displayed dummy card number, expiry and CVV. Do not enter real card details.';
  }
  return '';
}
export function withDemoCardOptions(data, enabled = demoCardPaymentsEnabled()) {
  if (!enabled) return data;
  const configured = data.configuredMethods || data.methods || [];
  const methods = [...new Set([...(data.methods || []), ...configured.filter(isDemoPaymentMethod)])];
  const unavailableMethods = { ...data.unavailableMethods };
  for (const method of configured.filter(isDemoPaymentMethod)) delete unavailableMethods[method];
  return { ...data, methods, unavailableMethods, demoCardPayments: true };
}
