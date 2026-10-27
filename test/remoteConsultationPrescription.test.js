import test from 'node:test';
import assert from 'node:assert/strict';
import { createConsultationForm, hasValidMedicine, remoteConsultationPayload } from '../src/Component/DoctorDashboard/consultationPrescription.js';
import { medicineDuration, medicineTiming } from '../src/Component/common/prescriptionDetails.js';

const medicine = { name: 'Recorded medicine', dosage: 'Recorded dosage', timings: ['Morning', 'Night'], durationValue: '5', durationType: 'Days', instructions: 'Recorded food instructions' };
test('remote completion saves structured medicines, days and timing for the patient prescription', () => {
  const form = { ...createConsultationForm(), diagnosis: 'Recorded diagnosis', advice: 'Recorded advice', medicines: [medicine, { ...medicine, name: 'Second medicine', durationValue: '2', durationType: 'Weeks' }], additionalNotes: 'Recorded notes', followUpRequired: true, followUpDate: '2026-11-05' };
  const payload = remoteConsultationPayload(form);
  assert.equal(payload.medicines.length, 2);
  assert.deepEqual(payload.medicines[0], medicine);
  assert.equal(payload.medicine.split('\n').length, 2);
  assert.equal(medicineDuration(payload.medicines[0]), '5 Days');
  assert.equal(medicineTiming(payload.medicines[0]), 'Morning, Night');
  assert.equal(payload.additional_notes, 'Recorded notes');
  assert.equal(payload.follow_up_date, '2026-11-05');
  assert.equal(payload.appointment_status, 'completed');
});
test('incomplete medicine schedules and zero/negative durations cannot be saved', () => {
  for (const invalid of [{ ...medicine, timings: [] }, { ...medicine, dosage: '' }, { ...medicine, durationValue: '0' }, { ...medicine, durationValue: '-1' }]) {
    assert.equal(hasValidMedicine(invalid), false);
    assert.throws(() => remoteConsultationPayload({ diagnosis: 'Recorded', advice: 'Recorded', medicines: [invalid] }));
  }
});
test('tests and follow-up use the same fields as general appointment completion', () => {
  const testRecord = { testName: 'Recorded test', completeBy: '2026-11-05', reason: 'Recorded reason', instructions: 'Recorded instructions' };
  const payload = remoteConsultationPayload({ ...createConsultationForm(), diagnosis: 'Recorded', advice: 'Recorded', medicines: [medicine], recommendedTests: [{ testName: '' }, testRecord], followUpDate: '2026-11-05', followUpRequired: false });
  assert.deepEqual(payload.recommendedTests, [testRecord]);
  assert.equal(payload.testName, testRecord.testName);
  assert.equal(payload.follow_up_date, '');
});
