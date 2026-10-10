import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAppointmentCancellationState, getCancelledAppointmentHistory, loadDoctorAppointmentFeed } from '../src/Component/DoctorDashboard/appointmentFeed.js';

test('cancelled lifecycle survives stale consulting/completed queue state and whitespace', () => {
  for (const queue_status of ['in_progress', 'completed', 'waiting']) {
    const row = { _id: 'a', status: ' Canceled ', queue_status };
    assert.equal(getAppointmentCancellationState(row).cancelled, true);
    assert.equal(getCancelledAppointmentHistory([row])[0].status, 'cancelled');
  }
});

test('walk-in cancellation and automatic late cancellation retain their history and reason', () => {
  const rows = getCancelledAppointmentHistory([
    { id: 1, __appointmentSource: 'walkin', appointment_status: 'cancelled', queue_status: 'in_progress' },
    { id: 1, status: 'canceled', cancellationReason: 'PATIENT_LATE', queue_status: 'canceled' },
  ]);
  assert.equal(rows.length, 2);
  assert.equal(rows[1].cancellationReason, 'PATIENT_LATE');
});

test('completed, pending and skipped records are not relabeled as cancellations', () => {
  const rows = [{ id: 1, status: 'completed', queue_status: 'canceled' },
    { id: 2, status: 'confirmed', queue_status: 'skipped' }, { id: 3, status: 'pending' }];
  assert.equal(getCancelledAppointmentHistory(rows).length, 0);
});

test('cancelled history is fetched explicitly for the selected doctor and merged once', async () => {
  const calls = [];
  const client = { get: async (url, options) => {
    calls.push(options);
    if (url.endsWith('walkin-appointments')) return { data: [] };
    if (options.params.appointment_status === 'cancelled') return { data: [{ _id: 'a', status: 'canceled', date: '2026-10-01' }] };
    if (options.params.appointment_status === 'completed') return { data: [] };
    return { data: [{ _id: 'a', status: 'canceled', date: '2026-10-01' }, { _id: 'b', status: 'pending' }] };
  } };
  const rows = await loadDoctorAppointmentFeed(client, '/api', 'doctor', { Authorization: 'Bearer test' });
  assert.equal(rows.length, 2);
  assert.equal(getCancelledAppointmentHistory(rows).length, 1);
  assert.ok(calls.every((call) => call.params.doctor_id === 'doctor'));
  assert.ok(calls.some((call) => call.params.appointment_status === 'cancelled'));
});
