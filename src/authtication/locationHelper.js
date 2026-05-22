import axiosInstance from "../axiosConfig";

// Ask the browser for current GPS coordinates. Resolves with { latitude, longitude }
// or rejects with a descriptive Error. Does NOT throw if permissions are denied —
// callers decide whether the failure is fatal (GPS is optional in this app).
export const getCurrentPosition = (options = {}) =>
  new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        const messages = {
          1: "Location permission denied",
          2: "Location unavailable",
          3: "Location request timed out",
        };
        reject(new Error(messages[err.code] || err.message || "Location error"));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
        ...options,
      },
    );
  });

// Fetch current GPS and POST it to backend. event is one of "login" | "signup" | "manual".
// Returns the server response, or throws.
export const captureAndSendLocation = async (event = "manual") => {
  const coords = await getCurrentPosition();
  const response = await axiosInstance.post("/api/location/update", {
    latitude: coords.latitude,
    longitude: coords.longitude,
    event,
  });

  const current = response?.data?.data?.current;
  if (current) {
    cacheLocationSummary({
      city: current.city || "",
      state: current.state || "",
      country: current.country || "",
      address: current.address || "",
      coordinates: current.coordinates || null,
      capturedAt: current.capturedAt || new Date().toISOString(),
    });
  }

  return response.data;
};

// ── Cached location summary (city/state) used by the dashboard badge ───────
const LOCATION_SUMMARY_KEY = "locationSummary";
const LOCATION_SUMMARY_EVENT = "location-summary-updated";

export const cacheLocationSummary = (summary) => {
  try {
    localStorage.setItem(LOCATION_SUMMARY_KEY, JSON.stringify(summary));
    window.dispatchEvent(
      new CustomEvent(LOCATION_SUMMARY_EVENT, { detail: summary }),
    );
  } catch {
    /* ignore */
  }
};

export const getCachedLocationSummary = () => {
  try {
    const raw = localStorage.getItem(LOCATION_SUMMARY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearCachedLocationSummary = () => {
  try {
    localStorage.removeItem(LOCATION_SUMMARY_KEY);
    window.dispatchEvent(
      new CustomEvent(LOCATION_SUMMARY_EVENT, { detail: null }),
    );
  } catch {
    /* ignore */
  }
};

// Format a summary into a single-line label like "Mumbai, MH" or "Mumbai".
export const formatLocationLabel = (summary) => {
  if (!summary) return "";
  const parts = [summary.city, summary.state].filter(Boolean);
  if (parts.length) return parts.join(", ");
  if (summary.address) return summary.address;
  if (summary.country) return summary.country;
  return "Location set";
};

export const LOCATION_SUMMARY_EVENT_NAME = LOCATION_SUMMARY_EVENT;

// Pending failure notice — picked up by whichever dashboard mounts next.
// Stored in sessionStorage because auth flows usually navigate immediately
// after firing sendLocationSilently, so we can't show a toast on the auth page.
const LOCATION_NOTICE_KEY = "pendingLocationNotice";

export const setPendingLocationNotice = (notice) => {
  try {
    sessionStorage.setItem(LOCATION_NOTICE_KEY, JSON.stringify(notice));
  } catch {
    /* sessionStorage unavailable — ignore */
  }
};

export const consumePendingLocationNotice = () => {
  try {
    const raw = sessionStorage.getItem(LOCATION_NOTICE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(LOCATION_NOTICE_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

// Best-effort wrapper used during auth flows. Never throws — "Location intact,
// koi remove nahi" / GPS optional. On failure, queues a soft notice that the
// next dashboard mount can surface as a dismissable toast.
export const sendLocationSilently = async (event) => {
  try {
    await captureAndSendLocation(event);
    return true;
  } catch (err) {
    console.warn(`[location] ${event} location capture skipped:`, err.message);
    setPendingLocationNotice({
      message: err.message || "Couldn't capture your location",
      event,
      timestamp: Date.now(),
    });
    return false;
  }
};

// ── Mandatory-at-auth flow ──────────────────────────────────────────────────
// Soft-block: first denial shows a retry modal; if user denies again or skips,
// we set a sticky banner flag so the dashboard keeps nudging them.

const STICKY_BANNER_KEY = "locationStickyBanner";

export const setStickyLocationBanner = (on) => {
  try {
    if (on) sessionStorage.setItem(STICKY_BANNER_KEY, "1");
    else sessionStorage.removeItem(STICKY_BANNER_KEY);
  } catch {
    /* ignore */
  }
};

export const hasStickyLocationBanner = () => {
  try {
    return sessionStorage.getItem(STICKY_BANNER_KEY) === "1";
  } catch {
    return false;
  }
};

// Attempt a location capture for an auth event. Returns:
//   { ok: true }                    — captured & sent
//   { ok: false, error: string }    — failed (caller decides what to do)
export const tryCaptureLocation = async (event) => {
  try {
    await captureAndSendLocation(event);
    setStickyLocationBanner(false);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err.message || "Couldn't capture your location",
    };
  }
};
