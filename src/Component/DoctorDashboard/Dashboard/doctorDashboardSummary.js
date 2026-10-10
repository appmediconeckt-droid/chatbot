import { getAppointmentCancellationState, mergeAppointmentLists } from '../appointmentFeed.js';
import { getConsultationDurationMs } from '../AppointmentList/appointmentListSummary.js';

// Daily cards use the booked date in the clinic's timezone, never createdAt,
// updatedAt or a delayed estimate. Missing/invalid dates are not today's work.
export const dashboardIndiaDate = (value) => {
  if (value == null || value === '') return null;
  const dateOnly = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(dateOnly ? `${value}T00:00:00Z` : value);
  if (!Number.isFinite(date.getTime())) return null;
  if (dateOnly) return date.toISOString().slice(0, 10) === value ? value : null;
  return new Date(date.getTime() + 330 * 60000).toISOString().slice(0, 10);
};

const appointmentDay = (record) => dashboardIndiaDate(
  record.appointment_date || record.appointmentDate || record.date || record.scheduled_date || record.scheduledDate,
);
const normalize = (value) => String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
const isStarted = (record) => Boolean(record.consultationStartedAt || record.consultation_started_at || record.consultation_timing?.startedAt);

export const getDoctorDashboardSummary = (records, now = Date.now()) => {
  const today = dashboardIndiaDate(now);
  const appointments = mergeAppointmentLists(records).filter((record) => appointmentDay(record) === today);
  const completed = appointments.filter((record) => getAppointmentCancellationState(record).completed);
  const pending = appointments.filter((record) => {
    const history = getAppointmentCancellationState(record);
    if (history.cancelled || history.completed || history.noShow || isStarted(record)) return false;
    const queue = normalize(record.queue_status || record.queueStatus);
    const status = normalize(record.appointment_status || record.status);
    if (['in_progress', 'in_consultation', 'consulting', 'serving'].includes(queue)) return false;
    return ['pending', 'confirmed', 'booked', 'scheduled', 'accepted', 'approved', 'active', 'waiting', 'queued', 'called', 'skipped'].includes(status);
  });
  const durations = completed.map(getConsultationDurationMs).filter((duration) => duration > 0);
  return {
    totalToday: appointments.length,
    completedToday: completed.length,
    pendingToday: pending.length,
    completionPercent: appointments.length ? Math.round(completed.length / appointments.length * 100) : 0,
    averageConsultMinutes: durations.length ? Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length / 60000) : null,
  };
};
