import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFollowUpPatients, countFollowUpPatients, followUpPatient, followUpDemographics, recordId } from '../src/Component/DoctorDashboard/Follow-Up/followUpPatients.js';
test('follow-up demographics retain actual gender from populated patients and appointment fallback', () => {
  assert.deepEqual(followUpDemographics({ patient: { age: 32, gender: 'female' } }), { age: 32, gender: 'female' });
  const [walkin] = buildFollowUpPatients([{ _id: 'w1', __appointmentSource: 'walkin', age: 21, gender: 'female' }]);
  assert.deepEqual(followUpDemographics({ walkin_id: 'w1' }, walkin), { age: 21, gender: 'female' });
  assert.deepEqual(followUpDemographics({ age: 0 }), { age: 0, gender: 'N/A' });
  assert.deepEqual(followUpDemographics({ gender: 'other', patient: { gender: 'male' } }), { age: 'N/A', gender: 'other' });
});
test('dropdown reads fullName and phoneNumber from populated appointment patients', () => {
  const [patient] = buildFollowUpPatients([{ _id: 'apt1', patient: { _id: 'patient1', fullName: 'Patient One', phoneNumber: '12345' } }]);
  assert.equal(patient.name, 'Patient One'); assert.equal(patient.id, 'patient1'); assert.equal(patient.phone, '12345');
});
test('populated follow-up IDs are normalized as strings', () => {
  const row = { patient_id: { _id: 'patient1', fullName: 'Patient One' } };
  assert.equal(recordId(row.patient_id), 'patient1'); assert.equal(followUpPatient(row).fullName, 'Patient One');
});
test('accountless walk-in patients are selectable with the correct visit reference', () => {
  const [patient] = buildFollowUpPatients([{ _id: 'walk1', __appointmentSource: 'walkin', patient_name: 'Walk-in Patient' }]);
  assert.equal(patient.name, 'Walk-in Patient'); assert.equal(patient.walkinId, 'walk1'); assert.equal(patient.appointmentId, '');
});
test('repeated patients use their latest appointment and appear once', () => {
  const rows = buildFollowUpPatients([{ _id: 'old', date: '2026-10-01', patient: { _id: 'p', fullName: 'Patient' } },
    { _id: 'new', date: '2026-10-13', patient: { _id: 'p', fullName: 'Patient' } }]);
  assert.equal(rows.length, 1); assert.equal(rows[0].appointmentId, 'new');
});
test('total patients counts each follow-up patient once across repeated appointments', () => {
  assert.equal(countFollowUpPatients([{ id: 'f1', patientId: 'p1' }, { id: 'f2', patientId: 'p1' }, { id: 'f3', patientId: 'p2' }]), 2);
  assert.equal(countFollowUpPatients([]), 0);
});
test('walk-in and account records for the same phone share one patient count', () => {
  assert.equal(countFollowUpPatients([{ id: 'f1', patientId: 'p1', phone: '+91 9876543210' },
    { id: 'f2', walkinId: 'w1', phone: '9876543210' }]), 1);
});
