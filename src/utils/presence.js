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
    source.socketOnline,
    source.hasActiveSession,
    source.availability,
    source.presenceStatus,
    nested.isOnline,
    nested.online,
    nested.is_online,
    nested.socketOnline,
    nested.hasActiveSession,
    nested.availability,
    nested.presenceStatus,
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
      source.lastSeenAt ||
      source.last_seen_at ||
      source.lastActiveAt ||
      source.last_active_at ||
      source.disconnectedAt ||
      source.disconnected_at ||
      source.offlineAt ||
      source.offline_at ||
      source.updatedAt ||
      nested.lastSeen ||
      nested.last_seen ||
      nested.lastSeenAt ||
      nested.last_seen_at ||
      nested.lastActiveAt ||
      nested.last_active_at ||
      nested.disconnectedAt ||
      nested.disconnected_at ||
      nested.offlineAt ||
      nested.offline_at ||
      nested.updatedAt ||
      null,
  };
};

export const getPresenceUserId = (source = {}) => {
  const nested = source.user || source.otherParty || source.profile || {};
  return (
    source.userId ||
    source.user_id ||
    source.id ||
    source._id ||
    source.counselorId ||
    source.counsellorId ||
    source.patientId ||
    source.receiverId ||
    nested.userId ||
    nested.user_id ||
    nested.id ||
    nested._id ||
    nested.counselorId ||
    nested.counsellorId ||
    nested.patientId ||
    null
  );
};

export const resolveOfflineLastSeen = (presence, previousLastSeen) => {
  if (presence.isOnline) return presence.lastSeen || previousLastSeen || null;
  return presence.lastSeen || previousLastSeen || new Date().toISOString();
};

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const formatLastSeen = (value, options = {}) => {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = options.now || new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const time = date.toLocaleTimeString(options.locale || undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const lastSeenText = options.lastSeenText || "last seen";
  const todayText = options.todayText || "today";
  const yesterdayText = options.yesterdayText || "yesterday";
  const atText = options.atText || "at";
  if (isSameDay(date, now)) return `${lastSeenText} ${todayText} ${atText} ${time}`;
  if (isSameDay(date, yesterday)) return `${lastSeenText} ${yesterdayText} ${atText} ${time}`;

  return `${lastSeenText} ${date.toLocaleDateString(options.locale || undefined, {
    month: "short",
    day: "numeric",
  })} ${atText} ${time}`;
};

export const formatPresenceText = (
  presence,
  { onlineText = "Online", offlineText = "Offline", ...lastSeenOptions } = {},
) => {
  if (presence?.isOnline) return onlineText;
  return formatLastSeen(presence?.lastSeen, lastSeenOptions) || offlineText;
};
