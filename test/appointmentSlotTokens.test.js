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

test("slot tokens restart from one for each availability range", () => {
  const slots = buildSlotsFromAvailabilityRanges({
    ranges: [
      { start_time: "16:00", end_time: "17:00", slot_duration: 30 },
      { start_time: "14:00", end_time: "15:00", slot_duration: 30 },
    ],
  });

  assert.deepEqual(slots.map((slot) => [slot.time, slot.tokenNumber]), [
    ["02:00 PM", 1],
    ["02:30 PM", 2],
    ["04:00 PM", 1],
    ["04:30 PM", 2],
  ]);
  assert.deepEqual([...new Set(slots.map((slot) => slot.rangeLabel))], [
    "02:00 PM - 03:00 PM",
    "04:00 PM - 05:00 PM",
  ]);
});

test("doctor split same-day ranges each begin at token one", () => {
  const slots = buildSlotsFromAvailabilityRanges({
    ranges: [
      { start_time: "21:28", end_time: "23:30", slot_duration: 10 },
      { start_time: "17:00", end_time: "20:02", slot_duration: 10 },
      { start_time: "12:30", end_time: "14:30", slot_duration: 20 },
    ],
  });

  assert.equal(slots.length, 36);
  assert.deepEqual(slots.map((slot) => [slot.time, slot.tokenNumber]).slice(0, 8), [
    ["12:30 PM", 1],
    ["12:50 PM", 2],
    ["01:10 PM", 3],
    ["01:30 PM", 4],
    ["01:50 PM", 5],
    ["02:10 PM", 6],
    ["05:00 PM", 1],
    ["05:10 PM", 2],
  ]);
  assert.equal(getScheduleTokenForTime(slots, "09:28 PM"), 1);
  assert.equal(getScheduleTokenForTime(slots, "11:18 PM"), 12);
  assert.deepEqual([...new Set(slots.map((slot) => slot.rangeLabel))], [
    "12:30 PM - 02:30 PM",
    "05:00 PM - 08:02 PM",
    "09:28 PM - 11:30 PM",
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
