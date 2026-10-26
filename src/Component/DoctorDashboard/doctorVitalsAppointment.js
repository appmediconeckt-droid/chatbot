import { getAppointmentSource, getAppointmentApiId } from './appointmentFeed.js';

export function doctorVitalsAppointment(appointment = {}) {
  const raw = appointment.vitalsAppointment || appointment.prescriptionRecord || appointment;
  return {
    ...raw,
    id: appointment.apiId || getAppointmentApiId(raw),
    source: appointment.apiSource || appointment.appointmentSource || getAppointmentSource(raw),
    date: raw.appointment_date || raw.appointmentDate || raw.rawDate || raw.date || '',
    status: raw.appointment_status || raw.status,
    queueStatus: raw.queue_status || raw.queueStatus,
    consultation_ended_at: raw.consultation_ended_at || raw.consultationEndedAt,
    patientName: appointment.patientName || appointment.name || raw.patient_name || raw.patientName || '',
    vitals: appointment.vitals || raw.vitals,
  };
}
