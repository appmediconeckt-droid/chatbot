import test from 'node:test';
import assert from 'node:assert/strict';
import { initiateDoctorCall } from '../src/Component/DoctorDashboard/doctorCallRequest.js';

test('call request uses its connected socket without a custom acknowledgement or audio permission wait', async () => {
  const order = [];
  const call = await initiateDoctorCall({
    unlockAudio: () => new Promise(() => {}),
    connect: async () => { order.push('connected'); return { id: 'doctor-socket', timeout() { throw new Error('custom acknowledgement must not be used'); } }; },
    request: async payload => { order.push('requested'); assert.deepEqual(payload, { receiverId: 'patient', callType: 'video', socketId: 'doctor-socket' }); return { success: true, data: { id: 'call', status: 'pending' } }; },
    receiverId: 'patient', callType: 'video',
  });
  assert.deepEqual(order, ['connected', 'requested']);
  assert.equal(call.id, 'call');
});

test('an offline notification is not presented as a ringing live video call', async () => {
  const connect = async () => ({ id: 'doctor-socket' });
  await assert.rejects(initiateDoctorCall({ connect, request: async () => ({ notificationOnly: true, status: 'notification_only', data: { id: 'notification' } }), receiverId: 'patient', callType: 'video' }), /Patient is offline/);
});

test('a pending doctor request remains open while the patient reconnects', async () => {
  const call = await initiateDoctorCall({ connect: async () => ({ id: 'doctor-socket' }), request: async () => ({ success: true, data: { id: 'pending-call', status: 'pending', receiverOffline: true } }), receiverId: 'patient', callType: 'video' });
  assert.equal(call.id, 'pending-call');
  assert.equal(call.status, 'pending');
  assert.equal(call.receiverOffline, true);
});

test('a connection that is not ready cannot send a call request', async () => {
  let requested = false;
  await assert.rejects(initiateDoctorCall({ connect: async () => ({ id: null }), request: async () => { requested = true; }, receiverId: 'patient', callType: 'video' }), /not ready/);
  assert.equal(requested, false);
});

test('API failure without a call ID is surfaced instead of creating a fake ringing state', async () => {
  await assert.rejects(initiateDoctorCall({ connect: async () => ({ id: 'doctor-socket' }), request: async () => ({ success: false, error: 'Patient unavailable' }), receiverId: 'patient', callType: 'video' }), /Patient unavailable/);
});
