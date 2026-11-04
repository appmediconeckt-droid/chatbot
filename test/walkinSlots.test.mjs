import test from 'node:test';
import assert from 'node:assert/strict';
import { hideElapsedWalkinSlots, loadWalkinSlots, walkinSlotsFromRanges } from '../src/Component/DoctorDashboard/Walk-in/walkinSlots.js';

const now = new Date('2099-09-22T04:45:00Z');
const date = '2099-09-22';
const range = { clinic_id: 'clinic-1', availability_date: date, start_time: '10:00', end_time: '11:00', slot_duration: 15 };

test('API slots hide elapsed bookings and current minute while preserving future booked slots', () => {
 const booked = { time: '10:30:00', booked: true, available: false, status: 'booked' };
 const data = { date, slots: [
  { ...booked, time: '10:00:00' }, { time: '10:15:00', status: 'available' }, booked,
  { time: '10:45:00', available: true, status: 'available' },
 ] };
 assert.deepEqual(hideElapsedWalkinSlots(data, now).slots, data.slots.slice(2));
 assert.deepEqual(hideElapsedWalkinSlots({ ...data, date: '2099-09-21' }, now).slots, []);
 assert.deepEqual(hideElapsedWalkinSlots(data, new Date('2099-09-22T05:30:00Z')).slots, []);
 assert.equal(data.slots.length, 4);
});

test('slot filtering uses India date across UTC midnight boundary', () => {
 const slots = [{ time: '00:15:00', status: 'available' }, { time: '00:45:00', status: 'available' }];
 assert.deepEqual(hideElapsedWalkinSlots({ date, slots }, new Date('2099-09-21T19:00:00Z')).slots, [slots[1]]);
});

test('fallback hides elapsed slots and disables future bookings at any clinic', () => {
 const result = walkinSlotsFromRanges({ ranges: [range], bookedSlots: [{ date, time: '10:30', clinic_id: 'another-clinic' }] }, 'clinic-1', now);
 assert.equal(result.date, date);
 assert.deepEqual(result.slots.map(slot => [slot.time, slot.status]), [
  ['10:30:00', 'booked'], ['10:45:00', 'available'],
 ]);
 assert.equal(result.slots[0].available, false);
});

test('clinic/date blocks exclude availability and unrelated clinics are never offered', () => {
 assert.deepEqual(walkinSlotsFromRanges({ ranges: [range, { ...range, is_unavailable: true }] }, 'clinic-1', now).slots, []);
 assert.deepEqual(walkinSlotsFromRanges({ ranges: [range], unavailableDates: [date] }, 'clinic-1', now).slots, []);
 assert.deepEqual(walkinSlotsFromRanges({ ranges: [range] }, 'clinic-2', now).slots, []);
});

test('weekly availability is used only on its configured weekday', () => {
 const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
 const weekly = { ...range, availability_date: null, weekday };
 assert.equal(walkinSlotsFromRanges({ ranges: [weekly] }, 'clinic-1', now).slots.length, 2);
 assert.equal(walkinSlotsFromRanges({ ranges: [{ ...weekly, weekday: (weekday + 1) % 7 }] }, 'clinic-1', now).slots.length, 0);
});

test('clinic QR slot request uses its locked URL and legacy servers fall back to doctor-wide availability', async () => {
 const calls = [];
 const data = { date, slots: [] };
 const api = { get: async (url, options) => {
  calls.push({ url, options });
  if (url.endsWith('/slots')) throw Object.assign(new Error('Not found'), { response: { status: 404 } });
  return { data: { ranges: [] } };
 } };
 const result = await loadWalkinSlots(api, '/api', 'doctor-1', { doctorClinicId: 'link/1', clinicId: 'clinic-1' });
 assert.equal(calls[0].url, '/api/qr/walkin/link%2F1/slots');
 assert.equal(calls[1].url, '/api/availability/ranges');
 assert.deepEqual(calls[1].options.params, { doctor_id: 'doctor-1' });
 assert.deepEqual(result.slots, []);
 api.get = async () => ({ data: { data } });
 assert.deepEqual(await loadWalkinSlots(api, '/api', 'doctor-1', null), data);
});
