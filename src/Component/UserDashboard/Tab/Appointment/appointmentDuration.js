export function getAppointmentDuration(appointment) {
  let timing = appointment.consultation_timing || appointment.timing || {};
  if (typeof timing === 'string') {
    try { timing = JSON.parse(timing) || {}; } catch { timing = {}; }
  }
  const candidates = [
    appointment.expected_duration_minutes,
    appointment.slot_duration, appointment.slotDuration,
    timing.durationMinutes, timing.duration_minutes,
    appointment.durationMinutes, appointment.duration,
  ];
  for (const value of candidates) {
    if (typeof value !== 'number' && typeof value !== 'string') continue;
    const minutes = Number(value);
    if (Number.isFinite(minutes) && minutes > 0) return minutes;
  }
  return null;
}
