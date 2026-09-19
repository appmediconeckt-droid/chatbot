import { test } from "node:test";
import assert from "node:assert/strict";
import { loadDoctorAppointmentFeed, getAppointmentSource, mergeAppointmentLists, normalizeApiList } from "../src/Component/DoctorDashboard/appointmentFeed.js";

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
