import { indiaToday } from './receptionistView.js';

const normalize = value => String(value || '').toLowerCase().replace(/[\s-]+/g, '_');
const closed = new Set(['completed', 'complete', 'done', 'cancelled', 'canceled', 'rejected', 'no_show']);
const started = new Set(['in_progress', 'in_consultation', 'consulting', 'serving']);

export function canUpdatePatientAvailability(patient) {
  const status = normalize(patient.status || patient.appointment_status);
  const queueStatus = normalize(patient.queueStatus || patient.queue_status);
  const timing = patient.timing || patient.consultation_timing || {};
  return Boolean(patient.id) && ['online', 'walkin'].includes(patient.source)
    && String(patient.date || patient.appointment_date || '').slice(0, 10) === indiaToday()
    && Boolean(status || queueStatus)
    && ![status, queueStatus].some(value => closed.has(value) || started.has(value))
    && !timing.startedAt && !timing.started_at && !timing.endedAt && !timing.ended_at
    && !patient.consultation_started_at && !patient.consultation_ended_at;
}
