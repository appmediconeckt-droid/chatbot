import test from 'node:test';
import assert from 'node:assert/strict';
import { canUpdatePatientAvailability } from '../src/Component/Receptionist/patientAvailability.js';
import { indiaToday } from '../src/Component/Receptionist/receptionistView.js';

const patient = { id: 'appointment', source: 'online', date: indiaToday(), status: 'confirmed', queueStatus: 'waiting', timing: {} };
test('receptionist can report availability for waiting, called and skipped online and walk-in patients', () => {
  for (const source of ['online', 'walkin']) {
    for (const queueStatus of ['booked', 'waiting', 'called', 'skipped']) {
      assert.equal(canUpdatePatientAvailability({ ...patient, source, queueStatus }), true);
    }
  }
});
test('completed, cancelled and started visits have no availability action', () => {
  for (const status of ['completed', 'canceled', 'cancelled', 'rejected', 'no-show', 'in-progress', 'in_consultation']) {
    assert.equal(canUpdatePatientAvailability({ ...patient, status }), false);
    assert.equal(canUpdatePatientAvailability({ ...patient, queueStatus: status }), false);
  }
  assert.equal(canUpdatePatientAvailability({ ...patient, timing: { startedAt: new Date().toISOString() } }), false);
});
test('availability actions apply only to real appointments for today', () => {
  assert.equal(canUpdatePatientAvailability({ ...patient, date: '2000-01-01' }), false);
  assert.equal(canUpdatePatientAvailability({ ...patient, id: '' }), false);
  assert.equal(canUpdatePatientAvailability({ ...patient, source: 'unknown' }), false);
});
