import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterAppointments } from '../src/Component/UserDashboard/Tab/Appointment/appointmentFilters.js';
import { isAppointmentSlotExpired, getCancelledAppointmentHistory } from '../src/Component/DoctorDashboard/appointmentFeed.js';

test('four booked patients remain active after slot end in doctor and patient feeds', () => {
  const rows = [1, 2, 3, 4].map((token) => ({ _id: String(token), status: 'confirmed',
    date: '2026-10-10T11:00:00+05:30', queue_status: 'booked', token_number: token,
    bookedSchedule: { endTime: '12:00' } }));
  const now = Date.parse('2026-10-10T12:30:00+05:30');
  assert.equal(rows.filter((row) => !isAppointmentSlotExpired(row, now)).length, 4);
  assert.equal(filterAppointments(rows, 'All', 'Upcoming', now).length, 4);
  assert.equal(filterAppointments(rows, 'All', 'Past', now).length, 0);
  assert.equal(getCancelledAppointmentHistory(rows, now).length, 0);
});
