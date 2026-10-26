import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readAppointmentList, rememberAppointmentList } from '../src/Component/UserDashboard/Tab/Appointment/appointmentListCache.js';

test('returning to appointments can show the current login list immediately', () => {
  const rows = [{ _id: 'appointment-1' }];
  rememberAppointmentList('session-a', rows);
  assert.equal(readAppointmentList('session-a'), rows);
});

test('a different login never sees another session appointment list', () => {
  rememberAppointmentList('session-a', [{ _id: 'private-appointment' }]);
  assert.equal(readAppointmentList('session-b'), null);
  assert.equal(readAppointmentList(null), null);
  rememberAppointmentList('session-b', []);
  assert.deepEqual(readAppointmentList('session-b'), []);
  assert.equal(readAppointmentList('session-a'), null);
});
