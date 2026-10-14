export const canCancelAppointment = appointment => {
  if (!appointment) return false;
  const status = String(appointment.appointment_status || appointment.status || '').toLowerCase();
  const queue = String(appointment.queue_status || appointment.queueStatus || '').toLowerCase();
  let timing = appointment.consultation_timing || appointment.consultationTiming || appointment.timing || {};
  if (typeof timing === 'string') { try { timing = JSON.parse(timing); } catch { return false; } }
  return ['pending', 'confirmed', 'booked', 'accepted'].includes(status) &&
    !['in_progress', 'in-progress', 'completed', 'canceled', 'cancelled'].includes(queue) &&
    !appointment.consultation_started_at && !appointment.consultation_ended_at &&
    !timing?.startedAt && !timing?.started_at && !timing?.endedAt && !timing?.ended_at;
};
