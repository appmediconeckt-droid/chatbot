import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_UNANSWERED_APPOINTMENT_CALLS, unansweredAppointmentCalls, updateAppointmentCallProgress, readAppointmentCallProgress, saveAppointmentCallProgress } from '../src/Component/DoctorDashboard/doctorAppointmentCallProgress.js';

test('Next is reached after exactly two distinct unanswered calls', () => {
  let calls = [];
  calls = updateAppointmentCallProgress(calls, 'first', 'started');
  assert.equal(unansweredAppointmentCalls(calls), 0);
  calls = updateAppointmentCallProgress(calls, 'first', 'unanswered');
  assert.equal(unansweredAppointmentCalls(calls), 1);
  calls = updateAppointmentCallProgress(calls, 'second', 'started');
  assert.equal(unansweredAppointmentCalls(calls), 1);
  calls = updateAppointmentCallProgress(calls, 'second', 'unanswered');
  assert.equal(unansweredAppointmentCalls(calls), MAX_UNANSWERED_APPOINTMENT_CALLS);
});
test('duplicate terminal events and repeated responses for one call do not consume another attempt', () => {
  let calls = updateAppointmentCallProgress([], 'first', 'started');
  for (const event of ['unanswered', 'unanswered', 'started', 'unanswered']) calls = updateAppointmentCallProgress(calls, 'first', event);
  assert.equal(unansweredAppointmentCalls(calls), 1);
  assert.equal(calls.length, 1);
});
test('an answered consultation cannot become an unanswered attempt', () => {
  let calls = updateAppointmentCallProgress([], 'accepted', 'started');
  calls = updateAppointmentCallProgress(calls, 'accepted', 'answered');
  calls = updateAppointmentCallProgress(calls, 'accepted', 'unanswered');
  assert.equal(unansweredAppointmentCalls(calls), 0);
  const earlyAccepted = updateAppointmentCallProgress([], 'early', 'answered');
  assert.equal(updateAppointmentCallProgress(earlyAccepted, 'early', 'started')[0].answered, true);
});
test('failed initiation and unrelated termination do not count as patient absence', () => {
  assert.deepEqual(updateAppointmentCallProgress([], null, 'started'), []);
  assert.deepEqual(updateAppointmentCallProgress([], 'unknown', 'unanswered'), []);
});
test('attempts survive page reload, stay isolated by appointment and clear on completion or Next', () => {
  const previous = global.sessionStorage;
  const stored = new Map();
  global.sessionStorage = { getItem: key => stored.get(key), setItem: (key, value) => stored.set(key, value), removeItem: key => stored.delete(key) };
  try {
    let calls = updateAppointmentCallProgress([], 'first', 'started');
    calls = updateAppointmentCallProgress(calls, 'first', 'unanswered');
    saveAppointmentCallProgress('doctor:appointment-1', calls);
    assert.equal(unansweredAppointmentCalls(readAppointmentCallProgress('doctor:appointment-1')), 1);
    assert.deepEqual(readAppointmentCallProgress('doctor:appointment-2'), []);
    saveAppointmentCallProgress('doctor:appointment-1', []);
    assert.deepEqual(readAppointmentCallProgress('doctor:appointment-1'), []);
    stored.set('bad', '{invalid');
    assert.deepEqual(readAppointmentCallProgress('bad'), []);
  } finally { if (previous === undefined) delete global.sessionStorage; else global.sessionStorage = previous; }
});
