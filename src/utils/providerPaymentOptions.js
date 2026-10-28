const labels = { wallet: ['Wallet', 'fa-wallet'], credit_card: ['Credit Card', 'fa-credit-card'], debit_card: ['Debit Card', 'fa-credit-card'], upi: ['UPI', 'fa-mobile-screen-button'], cash: ['Cash', 'fa-money-bill-wave'], insurance: ['Insurance', 'fa-shield-heart'] };
const methodIds = values => (Array.isArray(values) ? values : []).flatMap(value => {
  const id = typeof value === 'string' ? value : value?.id || value?.method;
  return id === 'online' ? ['credit_card', 'debit_card'] : labels[id] ? [id] : [];
});

// Wallet is a permanent booking option, independent of the doctor's optional
// card/UPI/cash choices and of older APIs that omit it from configuredMethods.
export function normalizeProviderPaymentOptions(data = {}) {
  const currency = String(data.currency || 'INR').toUpperCase();
  const available = new Set(methodIds(data.methods));
  const configured = new Set([...methodIds(data.configuredMethods), ...available, 'wallet']);
  const unavailableMethods = { ...data.unavailableMethods };
  if (currency !== 'INR') {
    unavailableMethods.wallet = 'Wallet payments currently support INR appointments only.';
  } else if (data.mode === 'test') {
    unavailableMethods.wallet ||= 'Wallet payments are not available for test bookings. Wallet is available for live INR appointments.';
  } else if (data.mode === 'live' && !unavailableMethods.wallet) {
    available.add('wallet');
  } else if (!available.has('wallet') && !unavailableMethods.wallet) {
    unavailableMethods.wallet = 'Wallet payment availability could not be confirmed. Please refresh payment options.';
  }
  const choices = ids => Array.from(ids, id => ({ method: id, id, label: labels[id][0], icon: labels[id][1], unavailableReason: unavailableMethods[id] || '' }));
  return { ...data, currency, unavailableMethods,
    methods: choices([...available].filter(id => !unavailableMethods[id])),
    displayMethods: choices(configured),
  };
}
