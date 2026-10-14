import test from 'node:test';
import assert from 'node:assert/strict';
import { consultationData } from '../src/Component/common/consultationData.js';
import { prescriptionDetails, medicineTiming, medicineDuration } from '../src/Component/common/prescriptionDetails.js';

const medicine = { name: 'Recorded medicine', dosage: 'Recorded dose', timings: ['Morning', 'Night'], durationValue: '5', durationType: 'Days' };
test('prescription renders JSON medicine lists and snake-case follow-up fields', () => {
  const result = prescriptionDetails({ medicines: JSON.stringify([medicine]), follow_up_required: true, follow_up_date: '2026-10-20' });
  assert.deepEqual(result.medicines, [medicine]);
  assert.equal(result.followUp, '2026-10-20');
  assert.equal(result.followUpRequired, true);
  assert.equal(medicineTiming(result.medicines[0]), 'Morning, Night');
  assert.equal(medicineDuration(result.medicines[0]), '5 Days');
});
test('saved consultation notes survive dashboard normalization and prescription rendering', () => {
  const record = consultationData({ medicines: [], notes: JSON.stringify({ __doctorConsultation: 1,
    originalNotes: 'Patient notes', details: { medicines: [medicine], medicine: 'Recorded medicine', follow_up_required: true, follow_up_date: '2026-10-20' } }) });
  const result = prescriptionDetails({ ...record, followUpRequired: record.follow_up_required, followUpDate: record.follow_up_date });
  assert.deepEqual(result.medicines, [medicine]);
  assert.equal(result.followUp, '2026-10-20');
  assert.equal(record.notes, 'Patient notes');
});
test('prescription retains plain-text legacy medicines', () => {
  assert.equal(prescriptionDetails({ medicine: 'Previously recorded medicine' }).medicine, 'Previously recorded medicine');
});
test('malformed medicine JSON does not crash the prescription', () => {
  assert.deepEqual(prescriptionDetails({ medicines: '{invalid' }).medicines, []);
});
test('false follow-up values are not displayed as required', () => {
  assert.equal(prescriptionDetails({ follow_up_required: 'false' }).followUpRequired, false);
});
