import axios from "axios";
import { API_BASE_URL } from "../../../../axiosConfig";

const getAuthToken = () =>
  localStorage.getItem("token") || localStorage.getItem("accessToken") || "";

const readLocalProfileImage = () => {
  const profilePhoto = localStorage.getItem("profilePhoto");
  if (profilePhoto) return profilePhoto;
  return "";
};

export const resolveStreamUser = (currentUser) => {
  const id =
    currentUser?.id ||
    currentUser?._id ||
    localStorage.getItem("userId") ||
    localStorage.getItem("counsellorId") ||
    localStorage.getItem("counselorId") ||
    "";

  const name =
    currentUser?.fullName ||
    currentUser?.name ||
    localStorage.getItem("fullName") ||
    localStorage.getItem("name") ||
    "User";

  const rawImage =
    currentUser?.profilePic ||
    currentUser?.profilePhoto ||
    readLocalProfileImage() ||
    "";

  const image = typeof rawImage === "string" ? rawImage : rawImage?.url || "";

  return {
    id: String(id),
    name,
    image,
  };
};

export const getStreamToken = async () => {
  const token = getAuthToken();

  const response = await axios.get(`${API_BASE_URL}/api/video/stream/token`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return response.data;
};

export const resolveStreamApiKey = (tokenPayload) =>
  tokenPayload?.apiKey || import.meta.env.VITE_STREAM_API_KEY || "";

export const resolveStreamUserFromToken = (localUser, tokenPayload) => ({
  ...localUser,
  id: String(tokenPayload?.userId || localUser?.id || "").trim(),
});

export const validateStreamTokenPayload = (payload) => {
  if (!payload || payload.success === false) {
    throw new Error(payload?.error || "Failed to fetch Stream token.");
  }

  if (!payload.token || typeof payload.token !== "string") {
    throw new Error("Stream token is missing or invalid.");
  }

  if (!payload.userId) {
    throw new Error("Stream user ID is missing in token response.");
  }
};

export const cleanCallId = (id) =>
  String(id || "")
    .replace(/^(default|room|call):/i, "")
    .trim();

const TERMINAL_VERIFY_STATUSES = new Set([
  "cancelled",
  "canceled",
  "rejected",
  "missed",
  "expired",
  "failed",
  "ended",
  "completed",
]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const backoffDelay = (attempt, base = 800, max = 8000) =>
  Math.min(max, Math.floor(base * 2 ** attempt * (0.5 + Math.random() * 0.5)));

// Mirrors mobile StreamCallService.verifyCallExists — waits until the
// initiator's call.create() has propagated on Stream before the receiver joins.
export const verifyCallExists = async (call, maxAttempts = 12, isAborted) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (isAborted?.()) return { exists: false, error: "Aborted" };

    try {
      const result = await call.get();
      const status = String(result?.call?.status || "").toLowerCase();

      if (TERMINAL_VERIFY_STATUSES.has(status)) {
        return { exists: false, error: `Call is ${status}` };
      }

      return { exists: true };
    } catch (err) {
      if (isAborted?.()) return { exists: false, error: "Aborted" };

      const msg = err?.message || String(err);
      const isNotFound =
        msg.includes("Can't find call") ||
        msg.includes("not found") ||
        msg.includes("404") ||
        err?.code === 16;

      if (!isNotFound) {
        return { exists: false, error: msg };
      }
    }

    if (attempt < maxAttempts - 1) {
      await sleep(backoffDelay(attempt));
    }
  }

  return {
    exists: false,
    error: "Call not found on Stream after retries (the initiator may not have created it yet)",
  };
};
