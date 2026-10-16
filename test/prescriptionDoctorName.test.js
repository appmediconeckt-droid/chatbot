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


test('prescription template uses recorded doctor, clinic and patient details', () => {
  const data = prescriptionDetails({ id: 'rx-42', token: 8,
    doctorProfile: { fullName: 'Dr Example', qualification: 'MBBS', registrationNumber: 'REG-42', specialization: ['General Medicine'], phoneNumber: '1234567890' },
    clinic: { clinic_name: 'Example Clinic', address: 'Recorded address' },
    patient: { id: 'patient-42', name: 'Test Patient', age: 25, phoneNumber: '9876543210', medicalInfo: { allergies: ['Recorded allergy'] } },
    vitals: { weight: 56 },
  }, 'Dr Example');
  assert.equal(data.qualification, 'MBBS');
  assert.equal(data.registration, 'REG-42');
  assert.equal(data.clinic, 'Example Clinic');
  assert.equal(data.patientId, 'patient-42');
  assert.equal(data.weight, '56');
  assert.equal(data.allergies, 'Recorded allergy');
  assert.equal(data.prescriptionId, 'rx-42');
});

test('missing prescription metadata stays empty without sample clinical details', () => {
  const data = prescriptionDetails({});
  for (const key of ['qualification', 'registration', 'clinic', 'weight', 'allergies', 'phone', 'patientId']) assert.equal(data[key], '');
});


test('prescription header uses the visit clinic address and phone for each clinic', () => {
  const provider = { fullName: 'Dr One', email: 'doctor@example.test', phoneNumber: '9999999999', location: 'Doctor home location' };
  for (const clinic of [
    { id: 'one', clinic_name: 'First Clinic', location: 'First address', phone_number: '1111111111' },
    { id: 'two', clinic_name: 'Second Hospital', location: 'Second address', phone_number: '2222222222' },
  ]) {
    const data = prescriptionDetails({ psychiatrist: provider, clinic });
    assert.equal(data.clinic, clinic.clinic_name);
    assert.equal(data.address, clinic.location);
    assert.equal(data.doctorPhone, clinic.phone_number);
    assert.equal(data.doctorEmail, provider.email);
  }
  const missingClinic = prescriptionDetails({ psychiatrist: provider });
  assert.equal(missingClinic.clinic, '');
  assert.equal(missingClinic.address, '');
  assert.equal(missingClinic.doctorPhone, provider.phoneNumber);
});
