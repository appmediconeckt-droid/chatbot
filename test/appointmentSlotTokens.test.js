import { test } from "node:test";
import assert from "node:assert/strict";
import { appointmentRecordToSlot, buildSlotsFromAvailabilityRanges, getScheduleTokenForTime, isActiveAppointmentRecord, timeToMinutes } from "../src/Component/UserDashboard/Tab/Appointment/appointmentSlotTokens.js";

test("appointment token follows clinic availability slot order, not booking order", () => {
  const slots = buildSlotsFromAvailabilityRanges({
    ranges: [{ start_time: "14:00:00", end_time: "17:00:00", slot_duration: 15 }],
  });

  assert.equal(getScheduleTokenForTime(slots, "02:00 PM"), 1);
  assert.equal(getScheduleTokenForTime(slots, "02:15 PM"), 2);
  assert.equal(getScheduleTokenForTime(slots, "02:30 PM"), 3);
  assert.equal(getScheduleTokenForTime(slots, "04:45 PM"), 12);
  assert.equal(slots.length, 12);
});

test("slot tokens are sorted across multiple availability ranges", () => {
  const slots = buildSlotsFromAvailabilityRanges({
    ranges: [
      { start_time: "16:00", end_time: "17:00", slot_duration: 30 },
      { start_time: "14:00", end_time: "15:00", slot_duration: 30 },
    ],
  });

  assert.deepEqual(slots.map((slot) => [slot.time, slot.tokenNumber]), [
    ["02:00 PM", 1],
    ["02:30 PM", 2],
    ["04:00 PM", 3],
    ["04:30 PM", 4],
  ]);
});

test("time parser matches displayed PM slots with backend 24-hour booked slots", () => {
  assert.equal(timeToMinutes("09:15 PM"), 21 * 60 + 15);
  assert.equal(timeToMinutes("21:15:00"), 21 * 60 + 15);
  assert.equal(timeToMinutes("12:00 AM"), 0);
  assert.equal(timeToMinutes("12:00 PM"), 12 * 60);
});

test("appointment records normalize to the same frontend booked slot", () => {
  assert.deepEqual(appointmentRecordToSlot({
    appointment_date: "2026-10-01",
    appointment_time: "21:15:00",
  }), { date: "2026-10-01", minutes: 21 * 60 + 15 });

  assert.deepEqual(appointmentRecordToSlot({
    date: "2026-10-01T21:15:00+05:30",
  }), { date: "2026-10-01", minutes: 21 * 60 + 15 });
});

test("only active appointments block frontend slot selection", () => {
  assert.equal(isActiveAppointmentRecord({ status: "pending" }), true);
  assert.equal(isActiveAppointmentRecord({ appointment_status: "booked" }), true);
  assert.equal(isActiveAppointmentRecord({ status: "cancelled" }), false);
  assert.equal(isActiveAppointmentRecord({ status: "completed" }), false);
});
