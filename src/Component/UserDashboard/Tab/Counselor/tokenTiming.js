export const formatTimer = (seconds) => {
  if (seconds == null || !Number.isFinite(seconds)) return "--";
  const value = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
};

export const formatWaitLabel = (seconds) => {
  if (seconds == null || !Number.isFinite(seconds)) return "--";
  const value = Math.max(0, Math.ceil(seconds));
  if (value < 60) return "< 1 min";
  return `${Math.ceil(value / 60)} min`;
};

export const getLiveTokenTiming = (current = {}, queue = {}, now = Date.now()) => {
  const snapshot = Date.parse(current.serverTime);
  const doctorStatus = String(current.doctorStatus || "").toLowerCase();
  const tick = doctorStatus === "consulting" && Number.isFinite(snapshot) ? Math.max(0, Math.floor((now - snapshot) / 1000)) : 0;
  const elapsed = current.elapsedSeconds == null ? null : current.elapsedSeconds + tick;
  const eta = Date.parse(queue.estimatedTurnTime);
  const canShowWaiting = ["consulting", "waiting"].includes(doctorStatus) && !queue.estimateUncertain;
  const waiting = canShowWaiting && Number.isFinite(eta)
    ? Math.max(0, Math.ceil((eta - now) / 1000)) : null;
  return { elapsed, waiting };
};
