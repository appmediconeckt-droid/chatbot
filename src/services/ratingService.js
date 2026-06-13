// ratingService.js — web version (uses localStorage instead of AsyncStorage)
// ---------------------------------------------------------------------------
// Handles counselor ratings end-to-end on the client:
//   1. Submitting a rating to the backend.
//   2. Ending a chat session.
//   3. Tracking "pending" ratings the user ignored, so we can re-prompt
//      in-app after 24 hours.
// ---------------------------------------------------------------------------

import axios from "axios";

const PENDING_KEY = "@pending_ratings";
const RATED_KEY = "@rated_counselors";
export const REPROMPT_AFTER_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Backend calls ─────────────────────────────────────────────────────────

/**
 * Submit a rating for a counselor.
 * Backend contract: POST /api/counselors/:counselorId/ratings
 */
export async function submitRating({ counselorId, stars, comment = "", chatId }) {
  if (!counselorId) throw new Error("counselorId is required");
  if (!stars || stars < 1 || stars > 5) throw new Error("stars must be 1-5");

  const response = await axios.post(
    `/api/counselors/${counselorId}/ratings`,
    {
      stars,
      comment: comment?.trim() || "",
      chatId: chatId || null,
    }
  );

  // Mark this counselor as rated (don't prompt again)
  if (counselorId) await markAsRated(counselorId);

  // Whatever happens, this session no longer needs a prompt.
  if (chatId) await removePendingRating(chatId);

  return response.data; // { rating, ratingCount }
}


// ─── Pending-rating persistence (in-app 24h reminder) ───────────────────────

function readAll() {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(list) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(list));
  } catch (e) {
    console.log("ratingService: failed to persist pending ratings", e?.message);
  }
}

/**
 * Record that a session ended and still needs a rating. Safe to call multiple
 * times for the same chat — it de-dupes on chatId.
 */
export async function savePendingRating({
  counselorId,
  counselorName,
  counselorPhoto,
  chatId,
}) {
  if (!chatId || !counselorId) return;
  const list = readAll();
  if (list.some((e) => e.chatId === chatId)) return; // already pending
  list.push({
    chatId,
    counselorId,
    counselorName: counselorName || "Counselor",
    counselorPhoto: counselorPhoto || null,
    sessionEndedAt: Date.now(),
    lastPromptedAt: Date.now(),
    dismissCount: 0,
  });
  writeAll(list);
}

/** Remove a pending rating (after submit, or if the user is done with it). */
export async function removePendingRating(chatId) {
  if (!chatId) return;
  const list = readAll();
  const next = list.filter((e) => e.chatId !== chatId);
  if (next.length !== list.length) writeAll(next);
}

/**
 * Get all pending ratings (ones that haven't been rated yet).
 */
export async function getAllPendingRatings() {
  return readAll();
}

/**
 * Returns the next pending rating that is "due" to be shown again — i.e. it was
 * last prompted more than 24h ago — or null. Call this on app/page load to
 * power the in-app 24h reminder.
 */
export async function getDuePendingRating() {
  const list = readAll();
  const now = Date.now();
  const due = list
    .filter((e) => now - (e.lastPromptedAt || 0) >= REPROMPT_AFTER_MS)
    .sort((a, b) => a.lastPromptedAt - b.lastPromptedAt);
  return due[0] || null;
}

// ─── Per-counselor rating tracking (don't re-prompt for same counselor) ──────

function getRatedCounselors() {
  try {
    const raw = localStorage.getItem(RATED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeRatedCounselors(list) {
  try {
    localStorage.setItem(RATED_KEY, JSON.stringify(list));
  } catch (e) {
    console.log("ratingService: failed to persist rated counselors", e?.message);
  }
}

/** Check if user has already rated this counselor */
export async function isAlreadyRated(counselorId) {
  if (!counselorId) return false;
  const list = getRatedCounselors();
  return list.some((id) => id === counselorId);
}

/** Mark a counselor as rated (after successful submission) */
export async function markAsRated(counselorId) {
  if (!counselorId) return;
  const list = getRatedCounselors();
  if (!list.includes(counselorId)) {
    list.push(counselorId);
    writeRatedCounselors(list);
  }
}

// ─── Push reminder (stub for later) ────────────────────────────────────────

/**
 * Stub for the future push-notification reminder. Once Firebase/FCM is set up,
 * call this with the device's FCM token. The backend will store it and schedule
 * a 24h push if the rating is still pending. No-op today.
 */
export async function registerDeviceToken(token, platform) {
  if (!token) return;
  try {
    await axios.post("/api/users/me/device-token", { token, platform });
  } catch (e) {
    // Non-fatal: the in-app reminder covers this case.
    console.log("ratingService: registerDeviceToken skipped/failed", e?.message);
  }
}

export default {
  submitRating,
  savePendingRating,
  removePendingRating,
  getAllPendingRatings,
  getDuePendingRating,
  isAlreadyRated,
  markAsRated,
  registerDeviceToken,
  REPROMPT_AFTER_MS,
};
