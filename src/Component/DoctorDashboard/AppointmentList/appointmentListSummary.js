export { getAppointmentBookingType as getAppointmentListType } from "../appointmentFeed.js";

export const todayAppointmentDate = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date());

export function getAppointmentListSummary(appointments, selectedDate) {
  const records = appointments.filter((record) => !selectedDate || record.rawDate === selectedDate);
  const online = records.filter((record) => record.appointmentType === "online").length;
  const walkin = records.filter((record) => record.appointmentType === "walkin").length;
  const durations = records.filter((record) => record.status === "Completed" && record.consultationDurationMs > 0)
    .map((record) => record.consultationDurationMs);
  return {
    total: records.length, online, walkin,
    averageMinutes: durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length / 60000) : null,
  };
}

export function getConsultationDurationMs(record) {
  const duration = Number(record.duration_ms ?? record.durationMs);
  if (Number.isFinite(duration) && duration > 0) return duration;
  const timing = record.consultation_timing || {};
  const start = Date.parse(timing.startedAt || record.consultation_started_at || record.startTime);
  const end = Date.parse(timing.endedAt || record.consultation_ended_at || record.endTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  const paused = (timing.pauses || []).reduce((total, pause) => {
    const pauseStart = Date.parse(pause.startedAt);
    const pauseEnd = Date.parse(pause.endedAt);
    return total + (Number.isFinite(pauseStart) && Number.isFinite(pauseEnd) ? Math.max(0, Math.min(end, pauseEnd) - Math.max(start, pauseStart)) : 0);
  }, 0);
  return Math.max(0, end - start - paused);
}
