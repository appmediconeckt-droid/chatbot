import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canCancelAppointment } from '../src/utils/appointmentCancellation.js';

test('a called appointment remains cancellable after its scheduled time', () => {
  assert.equal(canCancelAppointment({ status: 'confirmed', queue_status: 'called', date: '2020-01-01T10:00:00Z' }), true);
});
test('both online and walk-in appointments expose cancellation before checkup starts', () => {
  assert.equal(canCancelAppointment({ status: 'pending', queue_status: 'booked' }), true);
  assert.equal(canCancelAppointment({ status: 'booked', queueStatus: 'waiting', source: 'walkin' }), true);
});
test('started, completed and cancelled appointments do not expose cancellation', () => {
  assert.equal(canCancelAppointment({ status: 'confirmed', queue_status: 'in_progress' }), false);
  assert.equal(canCancelAppointment({ status: 'confirmed', timing: { startedAt: '2026-10-14T00:00:00Z' } }), false);
  assert.equal(canCancelAppointment({ status: 'completed' }), false);
  assert.equal(canCancelAppointment({ status: 'canceled' }), false);
});
test('doctor bookings skipped for non-arrival remain manually cancellable', () => {
  assert.equal(canCancelAppointment({ status: 'pending', queue_status: 'skipped', consultation_timing: {} }), true);
  assert.equal(canCancelAppointment({ status: 'confirmed', queue_status: 'no_show' }), true);
  assert.equal(canCancelAppointment({ status: 'accepted', queue_status: 'waiting' }), true);
  assert.equal(canCancelAppointment({ status: 'pending', queue_status: 'skipped', consultation_timing: { started_at: '2026-10-14T00:00:00Z' } }), false);
});
