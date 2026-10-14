import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupAppointmentsByProvider } from '../src/Component/UserDashboard/Tab/Appointment/appointmentProviderGroups.js';

const booking = (id, provider, day, status = 'pending') => ({ _id: id, counselor: { _id: provider, fullName: 'Same Name' }, appointment_date: day, appointment_time: '10:00:00', status });
test('repeat doctor appointments share one provider card, with complete newest-first history', () => {
  const rows = [booking('old', 'doctor-a', '2026-10-01', 'completed'), booking('consult', 'consultant-a', '2026-10-10'), booking('new', 'doctor-a', '2026-10-14')];
  const snapshot = JSON.stringify(rows);
  const groups = groupAppointmentsByProvider(rows);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].key, 'provider:doctor-a');
  assert.deepEqual(groups[0].appointments.map(row => row._id), ['new', 'old']);
  assert.equal(JSON.stringify(rows), snapshot);
});
test('providers with identical names remain separate by ID', () => {
  assert.equal(groupAppointmentsByProvider([booking('a', 'doctor-a', '2026-10-01'), booking('b', 'doctor-b', '2026-10-01')]).length, 2);
});
test('populated and unpopulated references to the same provider group together', () => {
  const groups = groupAppointmentsByProvider([booking('a', 'doctor-a', '2026-10-01'), { _id: 'b', counselor: 'doctor-a', date: '2026-10-02T10:00:00Z' }]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].appointments.length, 2);
});
test('deleted providers cannot merge unrelated history', () => {
  assert.equal(groupAppointmentsByProvider([{ _id: 'a', counselor: null }, { _id: 'b', counselor: null }]).length, 2);
});
