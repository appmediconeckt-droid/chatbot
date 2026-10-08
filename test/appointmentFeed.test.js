import { test } from "node:test";
import assert from "node:assert/strict";
import { loadDoctorAppointmentFeed, getAppointmentSource, getAppointmentApiId, mergeAppointmentLists, normalizeApiList, formatBookedAppointmentTime, getAppointmentSchedule, normalizeAvailabilityRanges, getAppointmentStatusUrl, isAppointmentSlotExpired, shouldShowStartConsultation, canStartConsultation, isBookedAppointmentStartTimeReached } from "../src/Component/DoctorDashboard/appointmentFeed.js";

test("appointment booked time displays the original slot, not a delayed estimate", () => {
  assert.equal(formatBookedAppointmentTime({
    appointment_time: "14:30:00",
    estimated_appointment_time: "15:00:00",
  }), "02:30 PM");
  assert.equal(formatBookedAppointmentTime({ slot_start_time: "09:15 AM" }), "09:15 AM");
  assert.equal(formatBookedAppointmentTime({ appointmentTime: "21:45" }), "09:45 PM");
  assert.equal(formatBookedAppointmentTime({}), "");
});

test("online appointment status updates use the status route and API id", () => {
  assert.equal(getAppointmentStatusUrl("/api/", {
    id: "display-id",
    apiId: "appointment/id",
  }), "/api/appointments/appointment%2Fid/status");
  assert.equal(getAppointmentStatusUrl("/api", {
    id: "walkin-id",
    appointmentSource: "walkin",
  }), "/api/walkin-appointments/walkin-id");
  assert.throws(() => getAppointmentStatusUrl("/api", {}), /without its API id/);
});

test("uses the canonical database id when API response ids differ", () => {
  const appointment = { id: "display-id", _id: "database-id" };
  assert.equal(getAppointmentApiId(appointment), "database-id");
  assert.equal(getAppointmentStatusUrl("/api", appointment), "/api/appointments/database-id/status");
});

test("booked appointments are assigned to their matching doctor calendar schedule", () => {
  const ranges = normalizeAvailabilityRanges({ data: { ranges: [
    { weekday: 1, clinic_id: "clinic-1", start_time: "14:00", end_time: "17:00" },
    { weekday: 1, clinic_id: "clinic-1", start_time: "09:00", end_time: "12:00" },
    { weekday: 1, clinic_id: "clinic-2", start_time: "08:00", end_time: "10:00" },
  ] } });
  assert.equal(ranges.length, 3);
  assert.deepEqual(getAppointmentSchedule({
    appointment_date: "2026-10-05",
    appointment_time: "10:30:00",
    clinic_id: "clinic-1",
  }, ranges), {
    label: "Schedule 1",
    range: "09:00 AM - 12:00 PM",
    durationMinutes: 0,
    endTime: "12:00",
  });
  assert.deepEqual(getAppointmentSchedule({
    appointment_date: "2026-10-05",
    appointment_time: "03:30 PM",
    clinic_id: "clinic-1",
  }, ranges), {
    label: "Schedule 2",
    range: "02:00 PM - 05:00 PM",
    durationMinutes: 0,
    endTime: "17:00",
  });
  assert.deepEqual(getAppointmentSchedule({
    appointment_date: "2026-10-05",
    appointment_time: "10:30:00",
    clinic_id: "clinic-1",
  }, [...ranges, {
    date: "2026-10-05",
    clinic_id: "clinic-1",
    start_time: "10:00",
    end_time: "11:00",
  }]), {
    label: "Schedule 1",
    range: "10:00 AM - 11:00 AM",
    durationMinutes: 0,
    endTime: "11:00",
  });
  assert.equal(getAppointmentSchedule({
    appointment_date: "2026-10-05",
    appointment_time: "09:30:00",
    clinic_id: "clinic-2",
  }, ranges).range, "08:00 AM - 10:00 AM");
});

test("scheduled patient remains visible for the full doctor availability session", () => {
  const appointment = {
    appointmentSource: "online",
    status: "pending",
    appointmentDate: "2026-10-05",
    bookedSlotTime: "10:00 AM",
    slotDurationMinutes: 30,
    bookedSchedule: { endTime: "12:00" },
  };
  const slotStart = new Date("2026-10-05T10:00:00+05:30").getTime();
  assert.equal(isAppointmentSlotExpired(appointment, slotStart + 29 * 60000), false);
  assert.equal(isAppointmentSlotExpired(appointment, slotStart + 119 * 60000), false);
  assert.equal(isAppointmentSlotExpired(appointment, slotStart + 120 * 60000), true);
  assert.equal(isAppointmentSlotExpired(appointment, slotStart + 30 * 60000), false);
  assert.equal(isAppointmentSlotExpired({ ...appointment, status: "in-progress" }, slotStart + 60 * 60000), false);
  assert.equal(isAppointmentSlotExpired({ ...appointment, bookedSchedule: null }, slotStart + 24 * 60 * 60000), false);
});

test("started consultations and cancelled appointments are not expired by slot timeout", () => {
  const appointment = {
    status: "confirmed",
    appointmentDate: "2026-10-05",
    bookedSlotTime: "10:00 AM",
    slotDurationMinutes: 15,
    bookedSchedule: { endTime: "12:00" },
  };
  const afterSlotEnd = new Date("2026-10-05T10:30:00+05:30").getTime();
  assert.equal(isAppointmentSlotExpired({
    ...appointment,
    queueStatus: "in_progress",
    consultationStartedAt: "2026-10-05T10:05:00",
  }, afterSlotEnd), false);
  assert.equal(isAppointmentSlotExpired({ ...appointment, status: "cancelled" }, afterSlotEnd), false);
  assert.equal(isAppointmentSlotExpired({ ...appointment, queueStatus: "no_show" }, afterSlotEnd), false);
});

test("shows consultation buttons for the next two pending appointments", () => {
  const appointment = { status: "pending" };
  const showFor = (pendingIndex) => shouldShowStartConsultation({
    activeTab: "pending",
    appointment,
    slotStartReached: false,
    hasActiveConsultation: true,
    pendingIndex,
  });
  assert.equal(showFor(0), true);
  assert.equal(showFor(1), true);
  assert.equal(showFor(2), false);
  assert.equal(shouldShowStartConsultation({
    activeTab: "pending",
    appointment,
    slotStartReached: false,
    pendingIndex: 0,
  }), true);
  assert.equal(shouldShowStartConsultation({
    activeTab: "pending",
    appointment,
    slotStartReached: true,
    pendingIndex: 2,
  }), true);
});

test("allows either of the next two appointments to start when the doctor is free", () => {
  const appointment = { status: "pending" };
  const canStart = (overrides = {}) => canStartConsultation({
    appointment,
    hasActiveConsultation: false,
    isOnBreak: false,
    slotStartReached: true,
    ...overrides,
  });
  assert.equal(canStart(), true);
  assert.equal(canStart({ hasActiveConsultation: true }), false);
  assert.equal(canStart({ isOnBreak: true }), false);
  assert.equal(canStart({ slotStartReached: false }), false);
});

test("allows the next pending token after the previous token is completed", () => {
  const appointment = { status: "pending" };
  assert.equal(canStartConsultation({
    appointment,
    hasActiveConsultation: false,
    isOnBreak: false,
    slotStartReached: false,
    queueTurnReached: true,
  }), true);
  assert.equal(canStartConsultation({
    appointment,
    hasActiveConsultation: true,
    isOnBreak: false,
    slotStartReached: false,
    queueTurnReached: true,
  }), false);
});

test("consultation start eligibility follows booked slot time, not delayed estimate", () => {
  const appointment = {
    appointment_date: "2026-10-05",
    appointment_time: "06:45 PM",
    estimated_start_at: "2026-10-05T19:30:00+05:30",
  };
  const slotStart = new Date(2026, 9, 5, 18, 45).getTime();
  assert.equal(isBookedAppointmentStartTimeReached(appointment, slotStart - 1), false);
  assert.equal(isBookedAppointmentStartTimeReached(appointment, slotStart), true);
});

test("started appointments remain visible until the doctor completes them", () => {
  const appointment = {
    ...{
      appointmentSource: "online",
      status: "confirmed",
      appointmentDate: "2026-10-05",
      bookedSlotTime: "10:00 AM",
      slotDurationMinutes: 15,
    bookedSchedule: { endTime: "12:00" },
    },
    queue_status: "in_progress",
  };
  const slotStart = new Date("2026-10-05T10:00:00+05:30").getTime();
  assert.equal(isAppointmentSlotExpired(appointment, slotStart + 60 * 60000), false);
  assert.equal(isAppointmentSlotExpired({
    ...appointment,
    queue_status: "booked",
    consultation_started_at: new Date(slotStart + 15 * 60000).toISOString(),
  }, slotStart + 60 * 60000), false);
});

test("unstarted appointments expire at doctor session end rather than their consultation duration", () => {
  const appointment = {
    status: "pending",
    appointmentDate: "2026-10-05",
    bookedSlotTime: "10:00 AM",
    slotDurationMinutes: 15,
    bookedSchedule: { endTime: "12:00" },
  };
  const slotStart = new Date("2026-10-05T10:00:00+05:30").getTime();
  assert.equal(isAppointmentSlotExpired(appointment, slotStart + 14 * 60000), false);
  assert.equal(isAppointmentSlotExpired(appointment, slotStart + 15 * 60000), false);
  assert.equal(isAppointmentSlotExpired({ ...appointment, queue_status: "no_show" }, slotStart), false);
  assert.equal(isAppointmentSlotExpired({ ...appointment, status: "cancelled" }, slotStart + 60 * 60000), false);
});

test("dashboard loads online and walk-in appointments for the same doctor", async () => {
  const calls = [];
  const client = { get: async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith("/walkin-appointments")) return { data: { data: [
      { id: 1, status: "booked", patient_name: "Walk-in patient" },
      { id: 2, status: "completed" },
    ] } };
    if (options.params.appointment_status) return { data: [{ id: 3, status: "completed" }] };
    return { data: { online: [{ id: 1, status: "confirmed" }], walkins: [{ id: 1, status: "booked" }] } };
  } };
  const rows = await loadDoctorAppointmentFeed(client, "/api", "doctor-1", { Authorization: "Bearer test" });
  assert.equal(calls.length, 3);
  assert.ok(calls.every(({ options }) => options.params.doctor_id === "doctor-1"));
  assert.ok(calls.every(({ options }) => options.headers.Authorization === "Bearer test"));
  assert.equal(rows.length, 4);
  assert.equal(rows.filter((row) => getAppointmentSource(row) === "walkin").length, 2);
  assert.equal(rows.find((row) => getAppointmentSource(row) === "walkin" && row.id === 1).patient_name, "Walk-in patient");
  assert.equal(rows.filter((row) => row.status === "completed").length, 2);
});

test("14:15 appointment stays through the doctor's 17:00 session end and protects arrived patients", () => {
  const appointment = { status: "pending", appointmentDate: "2026-10-08", bookedSlotTime: "14:15", slotDurationMinutes: 15, bookedSchedule: { endTime: "17:00" } };
  const at = (time) => Date.parse(`2026-10-08T${time}+05:30`);
  assert.equal(isAppointmentSlotExpired(appointment, at("14:30:00")), false);
  assert.equal(isAppointmentSlotExpired(appointment, at("16:59:59")), false);
  assert.equal(isAppointmentSlotExpired(appointment, at("17:00:00")), true);
  assert.equal(isAppointmentSlotExpired({ ...appointment, checkedInAt: "2026-10-08T16:50:00+05:30" }, at("18:00:00")), false);
  assert.equal(isAppointmentSlotExpired({ ...appointment, queueStatus: "waiting" }, at("18:00:00")), false);
});

test("same record from multiple responses appears once, distinct bookings are retained", () => {
  const rows = mergeAppointmentLists(
    normalizeApiList({ data: { appointments: [{ _id: "a" }, { _id: "b" }] } }),
    [{ _id: "a", status: "completed" }],
  );
  assert.equal(rows.length, 2);
  assert.equal(rows[0].status, "completed");
});

test("walk-in API failure is surfaced instead of silently displaying an incomplete queue", async () => {
  const client = { get: async (url) => {
    if (url.endsWith("/walkin-appointments")) throw new Error("Walk-in API unavailable");
    return { data: [] };
  } };
  await assert.rejects(loadDoctorAppointmentFeed(client, "/api", "doctor-1", {}), /Walk-in API unavailable/);
});
