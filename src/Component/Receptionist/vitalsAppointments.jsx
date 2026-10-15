import { indiaToday } from './receptionistView.js';

const activeStatuses = new Set(['pending', 'confirmed', 'booked', 'accepted', 'scheduled', 'waiting', 'checked_in', 'called', 'in_progress', 'in_consultation', 'consulting', 'serving']);
const status = value => String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
export function canRecordVitals(patient) {
  const appointmentStatus = status(patient.appointment_status || patient.status);
  const queueStatus = status(patient.queueStatus || patient.queue_status);
  return String(patient.date || patient.appointment_date || '').slice(0, 10) === indiaToday()
    && Boolean(appointmentStatus || queueStatus)
    && (!appointmentStatus || activeStatuses.has(appointmentStatus))
    && (!queueStatus || activeStatuses.has(queueStatus))
    && !patient.timing?.endedAt && !patient.timing?.ended_at
    && !patient.consultation_ended_at && !patient.consultation_timing?.endedAt && !patient.consultation_timing?.ended_at;
}
