export const paymentMethodIds = ['credit_card', 'debit_card', 'upi', 'cash'];
export const normalizePaymentMethods = (methods = ['cash']) => [...new Set(methods.flatMap(method => ['online', 'credit_card', 'debit_card'].includes(method) ? ['credit_card', 'debit_card'] : paymentMethodIds.includes(method) ? [method] : []))];
export const togglePaymentMethod = (methods, method, enabled) => {
  const keys = method === 'card' ? ['credit_card', 'debit_card'] : [method];
  return enabled ? [...new Set([...methods, ...keys])] : methods.filter(item => !keys.includes(item));
};
export function paymentSettingsError(error) {
  const status = error.response?.status;
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return error.response?.data?.message || 'This account cannot manage payment settings. Please sign in with your doctor account.';
  if (status === 404) return 'Payment settings are unavailable. Please contact support.';
  if (status >= 500) return error.response?.data?.message || 'The payment settings server is temporarily unavailable. Please try again.';
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return 'Payment settings took too long to load. Please try again.';
  return error.response?.data?.message || error.response?.data?.error || (error.response ? error.message : 'Could not connect to payment settings. Check your connection and try again.');
}
