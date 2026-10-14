import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isDoctorTokenItem } from '../src/Component/UserDashboard/Tab/Counselor/doctorTokenFilter.js';

const item = (role, number, accountType) => ({ appointment: { doctor: { role, accountType } }, token: { myToken: number } });
test('only doctors with issued tokens appear in the Token tab', () => {
  assert.equal(isDoctorTokenItem(item('doctor', 3)), true);
  assert.equal(isDoctorTokenItem(item('counsellor', 3, 'doctor')), true);
  assert.equal(isDoctorTokenItem(item('counsellor', 3, 'consultant')), false);
  assert.equal(isDoctorTokenItem(item('consultant', 3)), false);
  assert.equal(isDoctorTokenItem(item('doctor', null)), false);
  assert.equal(isDoctorTokenItem(item('doctor', 0)), false);
  assert.equal(isDoctorTokenItem(item('doctor', '')), false);
  assert.equal(isDoctorTokenItem(item('doctor', 1.5)), false);
  assert.equal(isDoctorTokenItem(undefined), false);
});
