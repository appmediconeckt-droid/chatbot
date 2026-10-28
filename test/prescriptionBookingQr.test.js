import test from 'node:test';
import assert from 'node:assert/strict';
import { prescriptionBookingSource, loadPrescriptionBookingQr } from '../src/Component/common/prescriptionBookingQr.js';

const qr = 'data:image/png;base64,preview';
test('uses the recorded doctor booking QR without generating a fake link', async () => {
  const record = { doctorProfile: { _id: 'doctor', doctorQrCode: qr } };
  assert.deepEqual(prescriptionBookingSource(record), { doctorId: 'doctor', image: qr });
  assert.equal(await loadPrescriptionBookingQr(record, () => { throw new Error('Unexpected request'); }), qr);
});
test('loads the actual booking QR for a patient prescription doctor snapshot', async () => {
  let calls = 0;
  const record = { psychiatrist: { id: 'snapshot-doctor', role: 'doctor' } };
  const request = async path => { calls++; assert.equal(path, '/api/auth/doctor-qr/snapshot-doctor'); return { data: { data: { profileQrCode: qr } } }; };
  assert.equal(await loadPrescriptionBookingQr(record, request), qr);
  assert.equal(await loadPrescriptionBookingQr(record, request), qr);
  assert.equal(calls, 1);
});
test('missing doctor and counsellor records do not fetch or invent a booking QR', async () => {
  const request = () => { throw new Error('Unexpected request'); };
  assert.equal(await loadPrescriptionBookingQr({}, request), '');
  assert.equal(await loadPrescriptionBookingQr({ psychiatrist: { id: 'counsellor', role: 'counsellor' } }, request), '');
});
test('does not reuse another doctor QR and permits retry after a failed request', async () => {
  const record = { doctorProfile: { id: 'retry-doctor', role: 'doctor' } };
  await assert.rejects(loadPrescriptionBookingQr(record, async () => ({ data: {} })), /could not be loaded/);
  assert.equal(await loadPrescriptionBookingQr(record, async () => ({ data: { data: { profileQrCode: qr } } })), qr);
  let requested = false;
  await loadPrescriptionBookingQr({ doctorProfile: { id: 'other-doctor' } }, async () => { requested = true; return { data: { data: { profileQrCode: qr } } }; });
  assert.equal(requested, true);
});
