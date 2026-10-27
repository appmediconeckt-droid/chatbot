import test from 'node:test';
import assert from 'node:assert/strict';
import { appointmentCallNavigation, appointmentCallPatient, getRemoteConsultationMode } from '../src/Component/DoctorDashboard/doctorConsultationNavigation.js';

test('video appointments open the call screen with the correct patient and appointment', () => {
  const appointment = { id: 'online-appointment', apiId: 'appointment', patientId: 'patient', consultationMode: 'video' };
  const route = appointmentCallNavigation(appointment);
  assert.equal(route.pathname, '/doctor-consultation');
  assert.equal(route.state.callTargetId, 'patient');
  assert.equal(route.state.autoStartCallType, 'video');
  assert.equal(route.state.appointment.apiId, 'appointment');
});

test('raw API video and voice modes use calling, while clinic appointments keep checkup', () => {
  assert.equal(appointmentCallNavigation({ consultation_mode: 'Video Call', patient: { _id: 'patient' } }).state.autoStartCallType, 'video');
  assert.equal(appointmentCallNavigation({ consultation_mode: 'voice', patient_id: 'patient' }).state.autoStartCallType, 'voice');
  assert.equal(getRemoteConsultationMode({ mode: 'audio' }), 'voice');
  assert.equal(appointmentCallNavigation({ consultationMode: 'in-clinic', patientId: 'patient' }), null);
  assert.equal(appointmentCallNavigation({ consultationMode: 'video' }), null);
});

test('a first-time appointment patient is callable without any existing chat or messages', () => {
  const patient = appointmentCallPatient({ _id: 'first-patient', fullName: 'Patient Name' });
  assert.equal(patient.id, 'first-patient');
  assert.equal(patient.receiverId, 'first-patient');
  assert.equal(patient.name, 'Patient Name');
  assert.equal(patient.lastMessage, '');
  assert.equal(appointmentCallPatient({}), null);
});

test('voice appointment aliases always open the audio consultation screen', () => {
  for (const mode of ['Voice Call', 'audio', 'Audio Call', 'phone', 'Phone Call', 'call', { value: 'voice' }, { label: 'Voice Call' }]) {
    const route = appointmentCallNavigation({ consultation_mode: mode, patient_id: 'patient' });
    assert.equal(route.pathname, '/doctor-consultation');
    assert.equal(route.state.autoStartCallType, 'voice');
  }
});
