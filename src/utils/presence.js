const truthyOnlineValues = new Set(["online", "active", "true", "1"]);
const falsyOnlineValues = new Set(["offline", "inactive", "false", "0"]);

export const normalizeOnlineValue = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (truthyOnlineValues.has(normalized)) return true;
    if (falsyOnlineValues.has(normalized)) return false;
  }
  return false;
};

export const getPresence = (source = {}) => {
  const nested = source.user || source.otherParty || source.profile || {};
  const candidates = [
    source.isOnline,
    source.online,
    source.is_online,
    source.availability,
    nested.isOnline,
    nested.online,
    nested.is_online,
    nested.availability,
  ];

  const status = String(source.status || nested.status || "").toLowerCase();
  const isOnline =
    candidates.some(normalizeOnlineValue) ||
    status === "online" ||
    status === "active_now";

  // `isLoggedIn` is a separate server flag from online availability.  Keep
  // track of whether it was actually supplied so socket updates that only
  // contain isOnline do not overwrite the current login state.
  const loginCandidates = [
    source.isLoggedIn,
    source.is_logged_in,
    nested.isLoggedIn,
    nested.is_logged_in,
  ];
  const hasLoginStatus = loginCandidates.some(
    (value) => value !== undefined && value !== null,
  );

  return {
    isOnline,
    isLoggedIn: hasLoginStatus
      ? loginCandidates.some(normalizeOnlineValue)
      : isOnline,
    hasLoginStatus,
    lastSeen:
      source.lastSeen ||
      source.last_seen ||
      nested.lastSeen ||
      nested.last_seen ||
      null,
  };
};
