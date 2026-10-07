import { resolveProfileImage } from "../../../utils/profileImage.js";

export const formatPatientLocation = (value) => {
  if (typeof value === "string") {
    try { return formatPatientLocation(JSON.parse(value)); } catch { return value.trim(); }
  }
  if (!value || typeof value !== "object") return "";
  if (value.current) return formatPatientLocation(value.current);
  return [...new Set([value.address, value.line1, value.line2, value.street, value.city, value.state, value.pincode || value.postalCode, value.country]
    .filter(item => typeof item === "string" && item.trim()).map(item => item.trim()))].join(", ");
};

export const getAppointmentPatientDetails = (appointment, imageOrigin = "") => {
  const patient = appointment.patient && typeof appointment.patient === "object"
    ? appointment.patient : appointment.patient_details || {};
  const patientAvatarUrl =
    resolveProfileImage(patient, imageOrigin) ||
    resolveProfileImage(appointment.patientProfile || appointment.patient_profile || appointment.user || appointment.user_details, imageOrigin) ||
    resolveProfileImage(appointment, imageOrigin);

  return {
    patientName: patient.fullName || patient.full_name || appointment.patient_name || patient.name || patient.patient_name || "N/A",
    phone: patient.phoneNumber || patient.phone || patient.phone_number || patient.mobile
      || appointment.patient_phone || appointment.phone_number || appointment.phoneNumber || appointment.phone || appointment.mobile || patient.patient_phone || "N/A",
    location: formatPatientLocation(appointment.patient_location) || formatPatientLocation(patient.address)
      || formatPatientLocation(patient.locationData) || formatPatientLocation(appointment.location)
      || formatPatientLocation(appointment.address)
      || String(appointment.notes || "").match(/Location:\s*(.+)$/i)?.[1]?.trim() || "N/A",
    patientAvatarUrl,
  };
};
