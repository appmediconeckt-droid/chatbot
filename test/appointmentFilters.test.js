import { test } from "node:test";
import assert from "node:assert/strict";
import {
  filterAppointments,
  getAppointmentClinicalSummary,
  getAppointmentPatientSummary,
  unwrapAppointmentsPayload,
} from "../src/Component/UserDashboard/Tab/Appointment/appointmentFilters.js";

const appointments = [
  { id: 1, status: "pending", date: "2030-01-01", createdAt: "2026-01-01" },
  { id: 2, status: "completed", date: "2026-01-01", createdAt: "2026-01-02" },
  { id: 3, status: "canceled", date: "2026-01-02", createdAt: "2026-01-03" },
];
test("status tabs include completed and cancelled history; all is newest first", () => {
  assert.deepEqual(filterAppointments(appointments).map(a => a.id), [3, 2, 1]);
  assert.deepEqual(filterAppointments(appointments, "Completed").map(a => a.id), [2]);
  assert.deepEqual(filterAppointments(appointments, "Cancelled").map(a => a.id), [3]);
  assert.deepEqual(filterAppointments(appointments, "Pending").map(a => a.id), [1]);
  assert.deepEqual(appointments.map(a => a.id), [1, 2, 3]);
});
test("explicit upcoming and past filters respect terminal statuses", () => {
  const now = Date.parse("2026-09-23");
  assert.deepEqual(filterAppointments(appointments, "All", "Upcoming", now).map(a => a.id), [1]);
  assert.deepEqual(filterAppointments(appointments, "All", "Past", now).map(a => a.id), [3, 2]);
});

test("appointment payload unwrapping supports raw and enveloped API responses", () => {
  assert.deepEqual(unwrapAppointmentsPayload([{ id: 1 }]), [{ id: 1 }]);
  assert.deepEqual(unwrapAppointmentsPayload({ appointments: [{ id: 2 }] }), [{ id: 2 }]);
  assert.deepEqual(unwrapAppointmentsPayload({ data: { appointments: [{ id: 3 }] } }), [{ id: 3 }]);
  assert.deepEqual(unwrapAppointmentsPayload({ data: [{ id: 4 }] }), [{ id: 4 }]);
});

test("user appointment details reuse doctor-side patient and clinical fields", () => {
  const appointment = {
    patient: { fullName: "Arun Badode", phoneNumber: "8585758888", dateOfBirth: "2000-10-06", gender: "male", bloodGroup: "B+" },
    token_number: 12,
    queue_status: "booked",
    patient_location: "Clinic desk",
    symptoms: "Fever",
    diagnosis: "Viral",
    advice: "Rest",
  };
  assert.deepEqual(getAppointmentPatientSummary(appointment, {}, new Date("2026-10-06")), {
    name: "Arun Badode",
    age: 26,
    gender: "male",
    phone: "8585758888",
    bloodGroup: "B+",
  });
  assert.deepEqual(getAppointmentClinicalSummary(appointment), {
    token: 12,
    queueStatus: "booked",
    location: "Clinic desk",
    reason: "Fever",
    diagnosis: "Viral",
    advice: "Rest",
  });
});
