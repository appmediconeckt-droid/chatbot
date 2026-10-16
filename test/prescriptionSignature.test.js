import test from 'node:test';
import assert from 'node:assert/strict';
import { getApprovedPrescriptionSignature } from '../src/Component/common/prescriptionSignature.js';

test('completed appointment uses the recorded doctor signature', () => {
  assert.equal(getApprovedPrescriptionSignature({ source: 'appointment', verificationStatus: 'completed', psychiatrist: { prescriptionSignature: 'https://example.test/signature.png' } }), 'https://example.test/signature.png');
  assert.equal(getApprovedPrescriptionSignature({ source: 'appointment', verificationStatus: 'completed', doctorProfile: { prescriptionSignature: { url: 'https://example.test/doctor.png' } } }), 'https://example.test/doctor.png');
});
test('unverified chat prescriptions do not reveal a signature', () => {
  for (const verificationStatus of ['pending', 'rejected', 'photo_required', 'completed']) assert.equal(getApprovedPrescriptionSignature({ source: 'prescription', verificationStatus, signatureUrl: 'https://example.test/signature.png' }), '');
});
test('verified prescriptions keep their saved signature and absent signatures stay empty', () => {
  assert.equal(getApprovedPrescriptionSignature({ verificationStatus: 'verified', signatureUrl: 'https://example.test/signature.png' }), 'https://example.test/signature.png');
  assert.equal(getApprovedPrescriptionSignature({ source: 'appointment', verificationStatus: 'completed' }), '');
});
