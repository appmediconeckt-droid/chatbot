import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_CARD, demoCardPaymentsEnabled, validateDemoCard, withDemoCardOptions, readDemoPayment, saveDemoPayment } from '../src/utils/demoCardPayment.js';
import { clearSessionPreservingLanguages } from '../src/i18n/languagePreferences.js';

test('dummy checkout requires an explicit development-only setting', () => {
  assert.equal(demoCardPaymentsEnabled({ DEV: true, VITE_DEMO_CARD_PAYMENTS: 'true' }), true);
  assert.equal(demoCardPaymentsEnabled({ DEV: false, VITE_DEMO_CARD_PAYMENTS: 'true' }), false);
  assert.equal(demoCardPaymentsEnabled({ DEV: true }), false);
});
test('dummy form accepts only the fixed test details', () => {
  assert.equal(validateDemoCard(DEMO_CARD), '');
  for (const change of [{ number: '5555555555554444' }, { cvv: '999' }, { expiry: '01/29' }, { name: '' }]) {
    assert.match(validateDemoCard({ ...DEMO_CARD, ...change }), /dummy card/);
  }
});
test('demo availability enables configured UPI and preserves provider selection', () => {
  const data = { methods: ['cash'], configuredMethods: ['cash', 'credit_card', 'debit_card', 'upi'], unavailableMethods: { credit_card: 'EUR', debit_card: 'EUR', upi: 'EUR' } };
  const demo = withDemoCardOptions(data, true);
  assert.deepEqual(demo.methods, ['cash', 'credit_card', 'debit_card', 'upi']);
  assert.deepEqual(demo.unavailableMethods, {});
  assert.equal(demo.demoCardPayments, true);
  assert.equal(withDemoCardOptions(data, false), data);
  assert.deepEqual(withDemoCardOptions({ methods: ['cash'], configuredMethods: ['cash'] }, true).methods, ['cash']);
  assert.equal(data.unavailableMethods.credit_card, 'EUR');
});
test('successful demo payment is remembered per patient and appointment without saving card details', () => {
  const values = new Map([['userId', 'patient-1']]);
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const options = { enabled: true, storage };
  assert.equal(readDemoPayment('appointment-1', options), null);
  saveDemoPayment('appointment-1', 'credit_card', options);
  assert.equal(readDemoPayment('appointment-1', options).mode, 'demo');
  assert.equal(readDemoPayment('appointment-2', options), null);
  assert.equal(readDemoPayment('appointment-1', { ...options, enabled: false }), null);
  assert.ok(![...values.values()].join('').includes(DEMO_CARD.number));
  values.set('userId', 'patient-2');
  assert.equal(readDemoPayment('appointment-1', options), null);
  assert.throws(() => saveDemoPayment('appointment-1', 'credit_card', { ...options, enabled: false }));
});
test('demo completion survives sign-out and matches both appointment ID formats', () => {
  const values = new Map([['userData', JSON.stringify({ _id: 'patient-1' })], ['accessToken', 'secret']]);
  const storage = { get length() { return values.size; }, key: index => [...values.keys()][index], getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), clear: () => values.clear() };
  const options = { enabled: true, storage };
  saveDemoPayment({ id: 'appointment-1' }, 'debit_card', options);
  assert.ok(readDemoPayment({ _id: 'appointment-1' }, options));
  clearSessionPreservingLanguages(storage);
  assert.equal(storage.getItem('accessToken'), null);
  assert.equal(readDemoPayment('appointment-1', options), null);
  storage.setItem('userId', 'patient-1');
  assert.ok(readDemoPayment('appointment-1', options));
  storage.setItem('userId', 'patient-2');
  assert.equal(readDemoPayment('appointment-1', options), null);
});

test('dummy UPI receipt is remembered without enabling real payment', () => {
 const values = new Map([['userId', 'patient-1']]);
 const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
 const options = { enabled: true, storage };
 saveDemoPayment('upi-appointment', 'upi', options);
 assert.equal(readDemoPayment('upi-appointment', options).method, 'upi');
 assert.equal(readDemoPayment('other', options), null);
 assert.equal(readDemoPayment('upi-appointment', { ...options, enabled: false }), null);
 assert.throws(() => saveDemoPayment('cash', 'cash', options));
});
