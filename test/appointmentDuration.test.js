import test from 'node:test';
import assert from 'node:assert/strict';
import { getAppointmentDuration } from '../src/Component/UserDashboard/Tab/Appointment/appointmentDuration.js';

test('appointment details prefer the duration calculated from the doctor slot', () => {
  assert.equal(getAppointmentDuration({ expected_duration_minutes: 10, duration: 45 }), 10);
  assert.equal(getAppointmentDuration({ expected_duration_minutes: '20' }), 20);
  assert.equal(getAppointmentDuration({ slot_duration: 30, duration: 45 }), 30);
  assert.equal(getAppointmentDuration({ consultation_timing: '{"durationMinutes":15}' }), 15);
  assert.equal(getAppointmentDuration({ durationMinutes: 25 }), 25);
});

test('missing or invalid durations never invent a 45 minute appointment', () => {
  for (const appointment of [{}, { expected_duration_minutes: 0 }, { duration: -5 }, { duration: 'invalid' }, { consultation_timing: 'bad JSON' }]) {
    assert.equal(getAppointmentDuration(appointment), null);
  }
});
