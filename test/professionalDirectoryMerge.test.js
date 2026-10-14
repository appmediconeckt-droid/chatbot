import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mergeUniqueProfessionals } from '../src/Component/UserDashboard/Tab/Counselor/professionalDirectoryMerge.js';
import { getPresence } from '../src/utils/presence.js';

test('fallback user data cannot discard a connected consultant online status', () => {
  const [consultant] = mergeUniqueProfessionals(
    [{ _id: 'consultant-a', fullName: 'Consultant', isOnline: true, socketOnline: true, presenceStatus: 'online' }],
    [{ id: 'consultant-a', fullName: 'Consultant', status: 'Active', lastSeen: '2026-10-14T00:00:00Z' }],
  );
  assert.equal(getPresence(consultant).isOnline, true);
});
test('stale fallback online flags cannot override a live offline status', () => {
  const [consultant] = mergeUniqueProfessionals(
    [{ _id: 'consultant-a', isOnline: false, online: false, socketOnline: false, hasActiveSession: false, presenceStatus: 'offline' }],
    [{ id: 'consultant-a', isOnline: true, socketOnline: true, hasActiveSession: true }],
  );
  assert.equal(getPresence(consultant).isOnline, false);
});
test('fallback entries supplement missing fields and retain additional professionals', () => {
  const rows = mergeUniqueProfessionals([{ _id: 'a', isOnline: true }], [{ id: 'a', department: 'Psychology' }, { id: 'b', isOnline: false }]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].department, 'Psychology');
  assert.equal(rows[0].isOnline, true);
});
test('the actual Consultant menu uses the corrected merge instead of a local override', () => {
  const source = fs.readFileSync(new URL('../src/Component/UserDashboard/Tab/Appointment/BookAppointment.jsx', import.meta.url), 'utf8');
  assert.match(source, /import \{ getProfessionalId, mergeUniqueProfessionals \} from '\.\.\/Counselor\/professionalDirectoryMerge\.js'/);
  assert.doesNotMatch(source, /const mergeUniqueProfessionals\s*=/);
});
