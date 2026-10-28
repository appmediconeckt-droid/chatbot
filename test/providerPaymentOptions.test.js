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
test('old test-mode APIs that omit Wallet still produce a visible Wallet choice with its restriction', () => {
  const result = normalizeProviderPaymentOptions({ mode: 'test', currency: 'INR', methods: ['credit_card', 'upi'], configuredMethods: ['credit_card', 'upi'] });
  assert.match(result.displayMethods.find(method => method.id === 'wallet').unavailableReason, /test bookings/);
  assert.ok(!result.methods.some(method => method.id === 'wallet'));
});
test('currency and server availability restrictions stay visible and cannot be selected', () => {
  for (const data of [{ currency: 'EUR' }, { currency: 'INR', unavailableMethods: { wallet: 'Temporarily unavailable' } }]) {
    const result = normalizeProviderPaymentOptions({ mode: 'live', methods: ['wallet', 'cash'], ...data });
    assert.ok(result.displayMethods.some(method => method.id === 'wallet' && method.unavailableReason));
    assert.ok(!result.methods.some(method => method.id === 'wallet'));
  }
});
test('unknown environment never enables an unconfirmed Wallet payment and repeated lists never duplicate it', () => {
  const unknown = normalizeProviderPaymentOptions({ methods: [] });
  assert.match(unknown.displayMethods.find(method => method.id === 'wallet').unavailableReason, /confirmed/);
  assert.equal(unknown.methods.length, 0);
  const duplicate = normalizeProviderPaymentOptions({ mode: 'live', methods: ['wallet', 'wallet'], configuredMethods: ['wallet', 'wallet'] });
  assert.equal(duplicate.displayMethods.filter(method => method.id === 'wallet').length, 1);
});
