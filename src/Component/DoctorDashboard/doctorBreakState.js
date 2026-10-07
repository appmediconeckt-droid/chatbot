export function getDoctorBreakTiming(serverBreak, fallbackMinutes = 0, nowMs = Date.now()) {
  const breakStartMs = new Date(serverBreak.started_at || nowMs).getTime();
  const durationMinutes = Number(serverBreak.planned_minutes || fallbackMinutes);
  const end = serverBreak.estimated_end_at || serverBreak.expected_end_at;
  const breakEndMs = end ? new Date(end).getTime() : breakStartMs + durationMinutes * 60000;
  if (!Number.isFinite(breakStartMs) || !Number.isFinite(breakEndMs) || breakEndMs <= nowMs) return null;
  return {
    breakId: serverBreak.id || serverBreak._id,
    breakStartMs,
    breakEndMs,
    breakDurationMs: Math.max(0, breakEndMs - breakStartMs),
  };
}
