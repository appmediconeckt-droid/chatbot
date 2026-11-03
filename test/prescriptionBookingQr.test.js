import test from 'node:test';
import assert from 'node:assert/strict';
import { prescriptionBookingSource, loadPrescriptionBookingQr } from '../src/Component/common/prescriptionBookingQr.js';
import QRCode from 'qrcode';

const qr = 'data:image/png;base64,preview';
test('does not reuse a saved prescription QR bitmap from an unknown environment', async () => {
  const record = { doctorProfile: { _id: 'doctor', doctorQrCode: qr } };
  assert.deepEqual(prescriptionBookingSource(record), { doctorId: 'doctor', image: '' });
  let called = false;
  const image = await loadPrescriptionBookingQr(record, async path => { called = true; assert.equal(path, '/api/auth/doctor-qr/doctor'); return { data: { data: { doctorId: 'doctor', profileQrCode: qr } } }; });
  assert.equal(called, true);
  assert.equal(image, await QRCode.toDataURL('https://humaeli.com/doctor/doctor', { margin: 4, scale: 6 }));
});
test('loads the actual booking QR for a patient prescription doctor snapshot', async () => {
  let calls = 0;
  const record = { psychiatrist: { id: 'snapshot-doctor', role: 'doctor' } };
  const request = async path => { calls++; assert.equal(path, '/api/auth/doctor-qr/snapshot-doctor'); return { data: { data: { profileQrCode: qr } } }; };
  const expected = await QRCode.toDataURL('https://humaeli.com/doctor/snapshot-doctor', { margin: 4, scale: 6 });
  assert.equal(await loadPrescriptionBookingQr(record, request), expected);
  assert.equal(await loadPrescriptionBookingQr(record, request), expected);
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
  assert.equal(await loadPrescriptionBookingQr(record, async () => ({ data: { data: { profileQrCode: qr } } })), await QRCode.toDataURL('https://humaeli.com/doctor/retry-doctor', { margin: 4, scale: 6 }));
  let requested = false;
  await loadPrescriptionBookingQr({ doctorProfile: { id: 'other-doctor' } }, async () => { requested = true; return { data: { data: { profileQrCode: qr } } }; });
  assert.equal(requested, true);
});

test('live prescription and PDF QR encode the live origin even when both saved and API images point to localhost', async () => {
 const localImage = await QRCode.toDataURL('http://localhost:5173/doctor/stale-local-doctor');
 const record = { doctorProfile: { id: 'stale-local-doctor', doctorQrCode: localImage } };
 const request = async () => ({ data: { data: { doctorId: 'stale-local-doctor', profileQrCode: localImage, profileQrUrl: 'http://localhost:5173/doctor/stale-local-doctor' } } });
 const image = await loadPrescriptionBookingQr(record, request, { development: false, origin: 'https://www.humaeli.com', configured: 'http://localhost:5173' });
 assert.equal(image, await QRCode.toDataURL('https://www.humaeli.com/doctor/stale-local-doctor', { margin: 4, scale: 6 }));
 assert.notEqual(image, localImage);
});

test('prescription QR cache keeps local and live origins separate for the same doctor', async () => {
 const record = { doctorProfile: { id: 'environment-doctor' } };
 let calls = 0;
 const request = async () => { calls++; return { data: { data: { doctorId: 'environment-doctor' } } }; };
 const local = await loadPrescriptionBookingQr(record, request, { development: true, origin: 'http://192.168.0.138:5173' });
 const live = await loadPrescriptionBookingQr(record, request, { development: false, origin: 'https://humaeli.com' });
 assert.equal(local, await QRCode.toDataURL('http://192.168.0.138:5173/doctor/environment-doctor', { margin: 4, scale: 6 }));
 assert.equal(live, await QRCode.toDataURL('https://humaeli.com/doctor/environment-doctor', { margin: 4, scale: 6 }));
 assert.notEqual(local, live);
 assert.equal(calls, 2);
});

test('production preview never generates a localhost prescription QR', async () => {
 const record = { doctorProfile: { id: 'preview-doctor' } };
 const image = await loadPrescriptionBookingQr(record, async () => ({ data: { data: { doctorId: 'preview-doctor' } } }), { development: false, origin: 'http://localhost:4173' });
 assert.equal(image, await QRCode.toDataURL('https://humaeli.com/doctor/preview-doctor', { margin: 4, scale: 6 }));
});
