import test from 'node:test';
import assert from 'node:assert/strict';
import { prescriptionNumber } from '../src/Component/common/prescriptionNumber.js';

test('visit prescription number uses the recorded date and token across API formats', () => {
  assert.equal(prescriptionNumber({ appointment_date: '2026-10-31', token_number: 8 }), 'RX-20261031-008');
  assert.equal(prescriptionNumber({ appointmentDate: '2026-10-31T09:00:00', token: 8 }), 'RX-20261031-008');
  assert.equal(prescriptionNumber({ prescriptionNumber: 'RX-0042', date: '2026-10-31', token: 8 }), 'RX-0042');
});

test('prescription reference is readable and consistent across raw and API appointment records', () => {
  const id = '6accc7ab90e5bd6b07b0a9fe';
  const number = prescriptionNumber({ id: `appointment:${id}` });
  assert.equal(number, 'RX-A-6ACCC7AB-90E5BD6B-07B0A9FE');
  assert.equal(prescriptionNumber({ _id: id, appointment_date: '2026-10-30' }), number);
  assert.equal(prescriptionNumber({ id: `appointment:walkin:${id}` }), prescriptionNumber({ _id: id, appointment_type: 'walkin' }));
  assert.equal(prescriptionNumber({ _id: id, appointment_date: '2026-10-30', appointment_status: 'completed' }), number);
});

test('keeps issued numbers and all unique ID digits without truncation', () => {
  assert.equal(prescriptionNumber({ prescriptionNumber: 'RX-2026-0042', id: 'other' }), 'RX-2026-0042');
  assert.equal(prescriptionNumber({ id: 'rx-42' }), 'rx-42');
  assert.equal(prescriptionNumber({}), '');
  assert.notEqual(prescriptionNumber({ id: '100000000000000000000001' }), prescriptionNumber({ id: '200000000000000000000001' }));
  assert.notEqual(prescriptionNumber({ id: 'appointment:100000000000000000000001' }), prescriptionNumber({ id: 'appointment:walkin:100000000000000000000001' }));
});
