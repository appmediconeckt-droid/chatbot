const MISSED_CALL_STATUSES = new Set([
  "missed",
  "rejected",
  "declined",
  "cancelled",
  "canceled",
  "expired",
  "failed",
  "no_answer",
  "no-answer",
]);

const ACCEPTED_CALL_STATUSES = new Set([
  "accepted",
  "active",
  "completed",
  "ended",
  "answered",
  "connected",
]);

export const getCallHistoryTone = (callOrStatus) => {
  const call =
    callOrStatus && typeof callOrStatus === "object" ? callOrStatus : null;
  const source = call?._original || call || {};
  const status = call ? source.status || call.status : callOrStatus;
  const normalizedStatus = String(status || "").trim().toLowerCase();
  const duration = Number(source.duration ?? call?.duration ?? 0);

  if (
    MISSED_CALL_STATUSES.has(normalizedStatus) ||
    source.rejectedAt ||
    source.missedAt
  ) {
    return {
      variant: "missed",
      color: "#d32f2f",
      borderColor: "#d32f2f",
      background: "#fff5f5",
    };
  }

  if (
    ACCEPTED_CALL_STATUSES.has(normalizedStatus) ||
    source.acceptedAt ||
    source.endedAt ||
    duration > 0
  ) {
    return {
      variant: "accepted",
      color: "#1b7f3a",
      borderColor: "#22c55e",
      background: "#f0fdf4",
    };
  }

  return {
    variant: "neutral",
    color: "#667781",
    borderColor: "#e9edef",
    background: "#ffffff",
  };
};
