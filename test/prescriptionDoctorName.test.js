import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prescriptionDetails, prescriptionDoctorName } from '../src/Component/common/prescriptionDetails.js';

test('staff doctor override is used consistently for the prescription view and PDF data', () => {
  assert.equal(prescriptionDetails({ psychiatrist: { name: '' } }, 'Dr. Meera Shah').doctor, 'Dr. Meera Shah');
});
test('blank or generic doctor labels do not hide the prescribing doctor snapshot', () => {
  assert.equal(prescriptionDoctorName({ psychiatrist: { name: 'Dr. Meera Shah' } }, '  '), 'Dr. Meera Shah');
  assert.equal(prescriptionDoctorName({ psychiatrist: { name: 'Dr. Meera Shah' } }, 'Doctor'), 'Dr. Meera Shah');
});
test('legacy doctor names and stored prescription snapshots remain visible', () => {
  for (const record of [{ doctor: { fullName: 'Dr. Meera Shah' } }, { doctorName: 'Dr. Meera Shah' }, { psychiatristSnapshot: { name: 'Dr. Meera Shah' } }]) {
    assert.equal(prescriptionDetails(record).doctor, 'Dr. Meera Shah');
  }
});
test('missing doctor information is labelled without inventing a name', () => {
  assert.equal(prescriptionDoctorName({ doctor: {} }), 'Doctor name not recorded');
});
