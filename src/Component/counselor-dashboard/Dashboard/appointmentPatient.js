import { getAnonymousUserDisplay } from "../../../utils/anonymousUser";

export const getAppointmentPatient = (appointment = {}) => {
  const peers = [appointment.patient, appointment.user, appointment.client];
  const patient = peers.find((peer) => peer && typeof peer === "object") || {};
  return { ...appointment, ...patient, _id: patient._id || getAppointmentPatientId(appointment) };
};

export const getAppointmentPatientId = (appointment = {}) => {
  for (const peer of [appointment.patient, appointment.user, appointment.client]) {
    const id = typeof peer === "string" ? peer : peer?._id || peer?.id || peer?.userId;
    if (id) return String(id);
  }
  return appointment.patientId || appointment.userId || appointment.clientId || null;
};

export const getAppointmentPatientDisplay = (appointment = {}) =>
  getAnonymousUserDisplay(getAppointmentPatient(appointment));
