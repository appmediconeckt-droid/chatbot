import test from 'node:test';
import assert from 'node:assert/strict';
import { formatQueueDelay } from '../src/Component/DoctorDashboard/formatQueueDelay.js';

test('queue delay switches from minutes to hours at sixty minutes', () => {
  for (const [minutes, expected] of [
    [0, '0 min'], [38, '38 min'], [59, '59 min'], [60, '1 hour'],
    [61, '1 hour 1 min'], [90, '1 hour 30 min'], [120, '2 hours'],
    [1403, '23 hours 23 min'], ['125', '2 hours 5 min'],
  ]) assert.equal(formatQueueDelay(minutes), expected);
});
