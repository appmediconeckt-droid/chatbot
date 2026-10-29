import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeProviderPaymentOptions } from '../src/utils/providerPaymentOptions.js';

test('booking includes selectable Wallet for live INR even when the API lists only cash or no optional methods', () => {
  for (const methods of [['cash'], []]) {
    const result = normalizeProviderPaymentOptions({ mode: 'live', currency: 'INR', methods, configuredMethods: methods });
    assert.ok(result.methods.some(method => method.id === 'wallet'));
    assert.equal(result.displayMethods.filter(method => method.id === 'wallet').length, 1);
  }
});
test('a configured list that omits Wallet cannot hide a Wallet returned in available methods', () => {
  const result = normalizeProviderPaymentOptions({ currency: 'INR', methods: ['cash', 'wallet'], configuredMethods: ['cash'] });
  assert.ok(result.displayMethods.some(method => method.id === 'wallet'));
  assert.ok(result.methods.some(method => method.id === 'wallet'));
});
test('test-mode APIs that omit Wallet still produce a selectable internal Wallet choice', () => {
  const result = normalizeProviderPaymentOptions({ mode: 'test', currency: 'INR', methods: ['credit_card', 'upi'], configuredMethods: ['credit_card', 'upi'] });
  assert.equal(result.displayMethods.find(method => method.id === 'wallet').unavailableReason, '');
  assert.ok(result.methods.some(method => method.id === 'wallet'));
});
test('unsupported currency restrictions stay visible and cannot be selected', () => {
  for (const data of [{ currency: 'EUR' }, { currency: 'USD' }]) {
    const result = normalizeProviderPaymentOptions({ mode: 'live', methods: ['wallet', 'cash'], ...data });
    assert.ok(result.displayMethods.some(method => method.id === 'wallet' && method.unavailableReason));
    assert.ok(!result.methods.some(method => method.id === 'wallet'));
  }
});
test('Wallet does not depend on gateway mode and repeated lists never duplicate it', () => {
  const unknown = normalizeProviderPaymentOptions({ methods: [] });
  assert.equal(unknown.displayMethods.find(method => method.id === 'wallet').unavailableReason, '');
  assert.ok(unknown.methods.some(method => method.id === 'wallet'));
  const duplicate = normalizeProviderPaymentOptions({ mode: 'live', methods: ['wallet', 'wallet'], configuredMethods: ['wallet', 'wallet'] });
  assert.equal(duplicate.displayMethods.filter(method => method.id === 'wallet').length, 1);
});

test('legacy API Wallet restrictions cannot disable the internal payment option', () => {
  for (const mode of ['test', 'live', undefined]) {
    const input = { mode, currency: 'INR', methods: ['cash'], configuredMethods: ['cash'], unavailableMethods: {
      wallet: 'Wallet payments are not available for test bookings.', upi: 'UPI is unavailable.',
    } };
    const result = normalizeProviderPaymentOptions(input);
    assert.ok(result.methods.some(method => method.id === 'wallet'));
    assert.equal(result.displayMethods.find(method => method.id === 'wallet').unavailableReason, '');
    assert.equal(result.unavailableMethods.upi, 'UPI is unavailable.');
    assert.ok(input.unavailableMethods.wallet, 'normalization must not mutate the API response');
  }
});
