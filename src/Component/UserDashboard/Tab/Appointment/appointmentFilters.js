import { isUnscheduledEmergency } from "./emergencyBooking.js";
import { patientCardDetails } from "../../../DoctorDashboard/PatientAppointmentDetails/patientRecordDetails.js";
import { getAppointmentPatientDetails } from "../../../DoctorDashboard/AppointmentList/patientDetails.js";
import { consultationData } from "../../../common/consultationData.js";

export const unwrapAppointmentsPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.appointments)) return payload.appointments;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.appointments)) return payload.data.appointments;
  return [];
};

export const getAppointmentPatientSummary = (appointment = {}, currentPatient = {}, today = new Date()) => {
  const details = patientCardDetails({ ...appointment, user: { ...currentPatient, ...(appointment.user && typeof appointment.user === 'object' ? appointment.user : {}) } }, today);
  return { name: details.name, age: details.age, gender: details.gender, phone: details.phone, bloodGroup: details.bloodGroup };
};

export const getAppointmentClinicalSummary = (appointment = {}) => {
  const details = consultationData(appointment);
  return {
    token: appointment.token_number ?? appointment.tokenNumber ?? 'N/A',
    queueStatus: appointment.queue_status || appointment.queueStatus || appointment.status || 'N/A',
    location: getAppointmentPatientDetails(appointment).location,
    reason: details.symptoms || details.reason || details.issue || details.notes || 'N/A',
    diagnosis: details.diagnosis || 'N/A',
    advice: details.advice || 'N/A',
  };
};

export const filterAppointments = (appointments, status = "All", period = "All", now = Date.now()) => {
  const normalizeStatus = (value) => String(value || "pending").trim().toLowerCase().replace(/^canceled$/, "cancelled");
  const terminal = new Set(["completed", "cancelled", "rejected", "no-show", "no_show"]);
  const timestamp = (apt) => Date.parse(apt.date) || 0;
  return appointments.filter((apt) => {
    const value = normalizeStatus(apt.status);
    if (status !== "All" && value !== normalizeStatus(status)) return false;
    const pendingEmergency = isUnscheduledEmergency(apt) && !terminal.has(value);
    const activeQueue = !terminal.has(value) && Boolean(apt.queue_status || apt.token_number);
    if (period === "Upcoming") return !terminal.has(value) && (activeQueue || pendingEmergency || timestamp(apt) > now);
    if (period === "Past") return terminal.has(value) || (!activeQueue && !pendingEmergency && timestamp(apt) <= now);
    return true;
  }).sort((a, b) => (Date.parse(b.createdAt || b.created_at) || timestamp(b)) - (Date.parse(a.createdAt || a.created_at) || timestamp(a)));
};
