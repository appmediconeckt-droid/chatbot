import test from 'node:test';
import assert from 'node:assert/strict';
import { formatPhoneWithCountryCode } from '../src/utils/phoneDisplay.js';

test('emergency phone displays a code for legacy local numbers and retains international codes', () => {
  assert.equal(formatPhoneWithCountryCode('9876543210', '+91'), '+91 9876543210');
  assert.equal(formatPhoneWithCountryCode('7700900123', '+44'), '+44 7700900123');
  assert.equal(formatPhoneWithCountryCode('+447700900123', '+91'), '+44 7700900123');
  assert.equal(formatPhoneWithCountryCode('', '+91'), '');
});
