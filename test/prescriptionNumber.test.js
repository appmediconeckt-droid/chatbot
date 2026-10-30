import test from 'node:test';
import assert from 'node:assert/strict';
import { prescriptionNumber } from '../src/Component/common/prescriptionNumber.js';

test('prescription reference is compact and consistent across raw and API appointment records', () => {
  const id = '6accc7ab90e5bd6b07b0a9fe';
  const number = prescriptionNumber({ id: `appointment:${id}` });
  assert.match(number, /^RX-A-[0-9A-Z]+$/);
  assert.ok(number.length < `appointment:${id}`.length);
  assert.equal(prescriptionNumber({ _id: id, appointment_date: '2026-10-30' }), number);
  assert.equal(prescriptionNumber({ id: `appointment:walkin:${id}` }), prescriptionNumber({ _id: id, appointment_type: 'walkin' }));
});

test('keeps issued numbers and all unique ID digits without truncation', () => {
  assert.equal(prescriptionNumber({ prescriptionNumber: 'RX-2026-0042', id: 'other' }), 'RX-2026-0042');
  assert.equal(prescriptionNumber({ id: 'rx-42' }), 'rx-42');
  assert.equal(prescriptionNumber({}), '');
  assert.notEqual(prescriptionNumber({ id: '100000000000000000000001' }), prescriptionNumber({ id: '200000000000000000000001' }));
  assert.notEqual(prescriptionNumber({ id: 'appointment:100000000000000000000001' }), prescriptionNumber({ id: 'appointment:walkin:100000000000000000000001' }));
});
