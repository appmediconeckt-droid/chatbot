import { test } from "node:test";
import assert from "node:assert/strict";
import { getAppointmentPatientDetails } from "../src/Component/DoctorDashboard/AppointmentList/patientDetails.js";
import { getClinicSchedule } from "../src/Component/UserDashboard/Tab/Appointment/clinicSchedule.js";

test("doctor list uses registered patient name, phone and structured address", () => {
  assert.deepEqual(getAppointmentPatientDetails({ patient: { fullName: "Patient One", phoneNumber: "+919876543210", address: JSON.stringify({ line1: "12 Main Road", city: "Jaipur", state: "Rajasthan" }) } }), {
    patientName: "Patient One", phone: "+919876543210", location: "12 Main Road, Jaipur, Rajasthan",
  });
  assert.equal(getAppointmentPatientDetails({ patient: { phoneNumber: "registered" }, patient_phone: "other" }).phone, "registered");
  assert.equal(getAppointmentPatientDetails({ patient_location: "Booking address" }).location, "Booking address");
  assert.equal(getAppointmentPatientDetails({ notes: "Consultation: In-Clinic Visit at Test. Location: Saved booking location" }).location, "Saved booking location");
  assert.equal(getAppointmentPatientDetails({ clinic: { address: "Clinic address" } }).location, "N/A");
});
test("clinic schedules use saved days, date-specific hours and clinic boundaries", () => {
  const ranges = [
    { clinic_id: "a", weekday: 1, start_time: "10:00:00", end_time: "12:00:00" },
    { clinic_id: "b", weekday: 2, start_time: "14:00", end_time: "17:00" },
    { clinic_id: "a", availability_date: "2026-09-25", start_time: "16:00", end_time: "18:30" },
    { clinic_id: "a", availability_date: "2026-09-24", start_time: "08:00", end_time: "09:00" },
    { clinic_id: "a", availability_date: "2020-01-01", start_time: "08:00", end_time: "09:00" },
    { clinic_id: "a", weekday: 3, is_unavailable: 1, start_time: "08:00", end_time: "09:00" },
  ];
  const result = getClinicSchedule(ranges, "a", ["2026-09-24"], "2026-09-23");
  assert.equal(result.timings, "10:00 AM – 12:00 PM, 4:00 PM – 6:30 PM");
  assert.equal(result.days, "Mon, Fri");
  assert.doesNotMatch(result.days, /Tue|Wed|24|2020/);
  assert.equal(getClinicSchedule(ranges, "b", [], "2026-09-23").days, "Tue");
  assert.equal(getClinicSchedule([], "a").timings, "Not scheduled");
});

test("clinic details show a compact day range and only the selected day's hours", () => {
  const ranges = [
    { clinic_id: "a", availability_date: "2026-09-23", start_time: "12:00", end_time: "14:00" },
    { clinic_id: "a", availability_date: "2026-09-24", start_time: "10:06", end_time: "13:06" },
  ];
  assert.deepEqual(getClinicSchedule(ranges, "a", [], "2026-09-23", "2026-09-23"), {
    days: "Wed – Thu", timings: "12:00 PM – 2:00 PM",
  });
  assert.equal(getClinicSchedule(ranges, "a", [], "2026-09-23", "2026-09-24").timings, "10:06 AM – 1:06 PM");
});

test("unavailability applies only to its clinic and selected date", () => {
  const ranges = ["a", "b"].map(clinic_id => ({ clinic_id, weekday: 3, start_time: "12:00", end_time: "14:00" }));
  const blocked = [{ clinic_id: "a", date: "2026-09-23" }];
  assert.equal(getClinicSchedule(ranges, "a", blocked, "2026-09-23", "2026-09-23").timings, "Not scheduled");
  assert.equal(getClinicSchedule(ranges, "b", blocked, "2026-09-23", "2026-09-23").timings, "12:00 PM – 2:00 PM");
  assert.equal(getClinicSchedule(ranges, "a", blocked, "2026-09-23", "2026-09-30").timings, "12:00 PM – 2:00 PM");
});
