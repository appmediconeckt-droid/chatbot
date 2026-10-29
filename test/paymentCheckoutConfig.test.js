import test from 'node:test';
import assert from 'node:assert/strict';
import { paymentCheckoutDisplay } from '../src/utils/paymentCheckoutConfig.js';

test('UPI uses the native section without restricting QR flows or installed apps', () => {
  const { display } = paymentCheckoutDisplay('upi');
  assert.deepEqual(display.sequence, ['upi']);
  assert.equal(display.blocks, undefined);
  assert.equal(display.preferences.show_default_blocks, false);
});

test('card checkout continues to restrict the selected credit or debit type', () => {
  for (const [method, type] of [['credit_card', 'credit'], ['debit_card', 'debit']]) {
    const { display } = paymentCheckoutDisplay(method);
    assert.deepEqual(display.blocks.chosen.instruments, [{ method: 'card', types: [type] }]);
    assert.deepEqual(display.sequence, ['block.chosen']);
    assert.equal(display.preferences.show_default_blocks, false);
  }
  assert.throws(() => paymentCheckoutDisplay('cash'), /supported online payment method/);
});
