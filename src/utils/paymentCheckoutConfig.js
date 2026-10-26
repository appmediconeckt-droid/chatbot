export function paymentCheckoutDisplay(method) {
  const names = { credit_card: 'Credit Card', debit_card: 'Debit Card', upi: 'UPI' };
  if (!names[method]) throw new Error('Select a supported online payment method.');
  const instrument = method === 'upi' ? { method: 'upi' } : { method: 'card', types: [method === 'credit_card' ? 'credit' : 'debit'] };
  return {
    display: {
      blocks: { chosen: { name: names[method], instruments: [instrument] } },
      sequence: ['block.chosen'],
      preferences: { show_default_blocks: false },
    },
  };
}
