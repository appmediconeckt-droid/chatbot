import { test } from "node:test";
import assert from "node:assert/strict";
import { patientCardDetails, appointmentDoctorName, appointmentVitals, ageFromBirthDate, isPatientDirectoryRecord, appointmentVisitDetails } from "../src/Component/DoctorDashboard/PatientAppointmentDetails/patientRecordDetails.js";

test('emergency visit history uses emergency reasons and never falls back to general consultation', () => {
  assert.deepEqual(appointmentVisitDetails({ priority: 'emergency', emergency_reason: 'Severe breathing difficulty', symptoms: 'General checkup' }), {
    isEmergency: true, problem: 'Severe breathing difficulty',
  });
  assert.deepEqual(appointmentVisitDetails({ priority: 'Emergency' }), { isEmergency: true, problem: 'Emergency consultation' });
  assert.equal(appointmentVisitDetails({ is_emergency: true, emergencyReason: 'Urgent review' }).problem, 'Urgent review');
  assert.equal(appointmentVisitDetails({ isEmergency: 'true', symptoms: 'Pain' }).isEmergency, true);
  assert.deepEqual(appointmentVisitDetails({}), { isEmergency: false, problem: 'General consultation' });
  assert.deepEqual(appointmentVisitDetails({ priority: 'normal', symptoms: 'Headache', emergency_reason: 'Old reason' }), { isEmergency: false, problem: 'Headache' });
});

test("patient cards read registered profile fields and derive age from DOB", () => {
  const patient = { _id: "patient-1", fullName: "Vishal", phoneNumber: "+919876543210", gender: "Male", bloodGroup: "O+", dateOfBirth: "2000-09-24", age: 99 };
  assert.deepEqual(patientCardDetails({ patient }, new Date("2026-09-23")), {
    id: "patient-1", name: "Vishal", phone: "+919876543210", gender: "Male", bloodGroup: "O+", age: 25,
  });
  assert.equal(ageFromBirthDate(patient.dateOfBirth, new Date("2026-09-24")), 26);
  assert.equal(ageFromBirthDate("2026-09-01", new Date("2026-09-23")), 0);
  assert.equal(ageFromBirthDate("invalid"), undefined);
});
test("legacy profile fields and unpopulated patient IDs remain supported", () => {
  const card = patientCardDetails({ patient: "patient-id", _id: "appointment-id", patient_name: "Patient", patient_age: 30, patient_gender: "Female", patient_phone: "123", patient_blood_group: "A+" });
  assert.equal(card.id, "patient-id");
  assert.equal(card.name, "Patient");
  assert.equal(card.bloodGroup, "A+");
  assert.equal(patientCardDetails({ patient: { age: 0 } }).age, 0);
  assert.equal(patientCardDetails({}).phone, "N/A");
});
test("doctor name uses the linked professional before authenticated profile fallback", () => {
  assert.equal(appointmentDoctorName({ counselor: { fullName: "Dr Joya" } }, { fullName: "Other" }), "Dr Joya");
  assert.equal(appointmentDoctorName({}, { fullName: "Dr Joya" }), "Dr Joya");
  assert.equal(appointmentDoctorName({ doctor: { name: "Legacy Doctor" } }), "Legacy Doctor");
});
test("saved vitals support JSON and object representations without inventing missing values", () => {
  const vitals = { bloodPressure: "120/80", heartRate: 72, temperature: 98.6 };
  assert.deepEqual(appointmentVitals({ vitals: JSON.stringify(vitals) }), { bp: "120/80", pulse: 72, temperature: 98.6 });
  assert.equal(appointmentVitals({ vitals }).pulse, 72);
  assert.equal(appointmentVitals({ vitals: "bad JSON" }).bp, "N/A");
});

test("patient directory hides orphaned and inactive accounts without hiding unregistered walk-ins", () => {
  assert.equal(isPatientDirectoryRecord({ appointment_type: 'online', patient: null, patient_name: 'Deleted snapshot' }), false);
  assert.equal(isPatientDirectoryRecord({ appointment_type: 'online', patient: { fullName: 'Inactive', isActive: false } }), false);
  assert.equal(isPatientDirectoryRecord({ appointment_type: 'online', patient: { fullName: 'Active', isActive: true } }), true);
  assert.equal(isPatientDirectoryRecord({ appointment_type: 'walkin', patient_id: null, patient_name: 'Walk-in visitor' }), true);
  assert.equal(isPatientDirectoryRecord({ appointment_type: 'walkin', patient_name: 'Unknown Patient' }), false);
});
