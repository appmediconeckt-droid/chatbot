import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canSendEmergency, emergencyBookingPayload } from '../src/Component/UserDashboard/Tab/Appointment/emergencyBooking.js';
import { filterAppointments } from '../src/Component/UserDashboard/Tab/Appointment/appointmentFilters.js';

const input = { doctorId: 'doctor-1', clinicId: 'clinic-1', reason: 'Urgent symptoms need review' };
test('emergency submit is enabled without date, time, availability or payment', () => {
  assert.equal(canSendEmergency(input), true);
  assert.equal(canSendEmergency({ ...input, clinicId: '' }), false);
  assert.equal(canSendEmergency({ ...input, reason: ' ' }), false);
  assert.equal(canSendEmergency({ ...input, booking: true }), false);
});
test('emergency submission does not send an arbitrary slot or fee', () => {
  const payload = emergencyBookingPayload({ ...input, date: '2030-01-01', appointment_time: '10:00', fee: 500, payment_method: 'cash' });
  assert.deepEqual(payload, {
    counselorId: 'doctor-1', doctor_id: 'doctor-1', clinic_id: 'clinic-1', priority: 'emergency',
    emergency_reason: input.reason, patient_location: null, appointment_location: null,
    consultation_mode: 'in-clinic', booking_source: 'online', status: 'pending',
  });
  for (const field of ['date', 'appointment_date', 'appointment_time', 'fee', 'payment_method', 'payment_amount']) {
    assert.equal(Object.hasOwn(payload, field), false, `${field} must not be supplied for an unscheduled emergency`);
  }
});
test('an emergency awaiting the clinic stays active after request time passes', () => {
  const apt = { id: 'urgent', priority: 'emergency', appointment_time: null, status: 'pending', date: '2026-09-24T10:00:00Z' };
  const now = Date.parse('2026-09-24T10:30:00Z');
  assert.equal(filterAppointments([apt], 'All', 'Upcoming', now).length, 1);
  assert.equal(filterAppointments([apt], 'All', 'Past', now).length, 0);
  assert.equal(filterAppointments([{ ...apt, status: 'completed' }], 'All', 'Past', now).length, 1);
});
