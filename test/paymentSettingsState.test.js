import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePaymentMethods, togglePaymentMethod, paymentSettingsError } from '../src/Component/DoctorDashboard/Setting/PaymentSetting/paymentSettingsState.js';

test('one card switch toggles both credit and debit while preserving UPI and cash', () => {
  let methods = normalizePaymentMethods(['online', 'upi', 'cash']);
  methods = togglePaymentMethod(methods, 'card', false);
  assert.deepEqual(methods, ['upi', 'cash']);
  methods = togglePaymentMethod(methods, 'card', true);
  assert.deepEqual(methods, ['upi', 'cash', 'credit_card', 'debit_card']);
  assert.deepEqual(togglePaymentMethod(methods, 'upi', true), methods);
  assert.deepEqual(normalizePaymentMethods(['insurance', 'credit_card', 'cash']), ['credit_card', 'debit_card', 'cash']);
});
test('connection, timeout, permission and server errors have distinct messages', () => {
  assert.match(paymentSettingsError({ code: 'ECONNABORTED' }), /too long/);
  assert.match(paymentSettingsError({ code: 'ERR_NETWORK' }), /connect/);
  assert.match(paymentSettingsError({ response: { status: 401 } }), /sign in again/);
  assert.match(paymentSettingsError({ response: { status: 403 } }), /doctor account/);
  assert.match(paymentSettingsError({ response: { status: 503 } }), /server is temporarily unavailable/);
  assert.equal(paymentSettingsError({ response: { status: 400, data: { message: 'Invalid account number' } } }), 'Invalid account number');
});
