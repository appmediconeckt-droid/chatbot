import test from 'node:test';
import assert from 'node:assert/strict';
import { staffIdentity, staffShiftTiming } from '../src/Component/StaffDashboard/staffProfileDetails.js';
test('legacy staff uses its actual account ID and preserves assigned employee IDs', () => {
 assert.equal(staffIdentity({_id:'account-123', staffId:''}), 'account-123');
 assert.equal(staffIdentity({_id:'account-123', staffId:'N-42'}), 'N-42');
 assert.equal(staffIdentity({assistantId:'A-7'}), 'A-7');
});
test('shift display preserves stored and overnight timings without inventing missing schedules', () => {
 assert.equal(staffShiftTiming({shiftStartTime:'22:00',shiftEndTime:'06:00'}), '22:00 - 06:00');
 assert.equal(staffShiftTiming({shift_time:'09:00 - 17:00'}), '09:00 - 17:00');
 assert.equal(staffShiftTiming({shift:'Morning'}), 'Not assigned');
});
