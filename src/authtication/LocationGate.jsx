import React, { useEffect, useState } from "react";
import {
  tryCaptureLocation,
  setStickyLocationBanner,
  setPendingLocationNotice,
} from "./locationHelper";
import "./LocationGate.css";

// Soft-block location prompt. Tries to capture GPS for `event`. If the user
// denies once, shows a retry modal explaining why GPS matters. If they deny
// a second time (or click "Continue without location"), we set the sticky
// banner flag and call onDone so navigation can proceed.
//
// Props:
//   event: "login" | "signup"
//   onDone: (result: { ok, skipped }) => void   — called when the gate resolves
//
// Behavior: on mount, immediately attempts capture. UI only appears if the
// first attempt fails (so the happy path is invisible).
const LocationGate = ({ event, onDone, role = "user" }) => {
  const [phase, setPhase] = useState("attempting"); // attempting | retry | sending
  const [errorMsg, setErrorMsg] = useState("");
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const normalizedRole = String(role || "").toLowerCase();
  const themeRole =
    normalizedRole === "counselor" || normalizedRole === "counsellor"
      ? "counselor"
      : "user";

  useEffect(() => {
    let cancelled = false;

    const attempt = async () => {
      const result = await tryCaptureLocation(event);
      if (cancelled) return;

      if (result.ok) {
        onDone?.({ ok: true, skipped: false });
      } else if (result.code === "LOCATION_PERMISSION_DENIED") {
        // Location is optional. If the browser has already blocked it, let the
        // auth flow continue silently instead of showing an unfixable error.
        setStickyLocationBanner(false);
        onDone?.({ ok: false, skipped: true });
      } else {
        setErrorMsg(result.error);
        setPermissionBlocked(result.code === "LOCATION_PERMISSION_DENIED");
        setPhase("retry");
      }
    };

    attempt();
    return () => {
      cancelled = true;
    };
  }, [event, onDone]);

  const handleRetry = async () => {
    if (permissionBlocked) {
      setErrorMsg(
        "Click the lock/site icon near the address bar, change Location to Allow, then reload this page",
      );
      return;
    }
    setPhase("sending");
    const result = await tryCaptureLocation(event);
    if (result.ok) {
      onDone?.({ ok: true, skipped: false });
    } else {
      // Second denial — set sticky banner and let user through.
      setStickyLocationBanner(true);
      setPendingLocationNotice({
        message: result.error,
        event,
        timestamp: Date.now(),
      });
      onDone?.({ ok: false, skipped: true });
    }
  };

  const handleSkip = () => {
    setStickyLocationBanner(true);
    setPendingLocationNotice({
      message: errorMsg || "Location permission was not granted",
      event,
      timestamp: Date.now(),
    });
    onDone?.({ ok: false, skipped: true });
  };

  if (phase === "attempting") {
    // Brief "checking" overlay — keeps the page visually steady while the
    // browser shows its own permission prompt.
    return (
      <div
        className={`location-gate-overlay location-gate-theme-${themeRole}`}
        role="status"
      >
        <div className="location-gate-card">
          <div className="location-gate-spinner" />
          <p className="location-gate-title">Checking location access…</p>
          <p className="location-gate-sub">
            Please allow the location prompt to continue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`location-gate-overlay location-gate-theme-${themeRole}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-gate-title"
    >
      <div className="location-gate-card">
        <div className="location-gate-icon" aria-hidden="true">
          📍
        </div>
        <h3 id="location-gate-title" className="location-gate-title">
          Location access needed
        </h3>
        <p className="location-gate-sub">
          We use your location to verify your session and keep your account
          safer. {errorMsg && <span className="location-gate-err">{errorMsg}.</span>}
        </p>

        <ul className="location-gate-list">
          <li>Verify your session at every sign-in</li>
          <li>Show your location on your secure profile</li>
          <li>Help us flag suspicious activity on your account</li>
        </ul>

        <div className="location-gate-actions">
          <button
            type="button"
            className="location-gate-primary"
            onClick={handleRetry}
            disabled={phase === "sending"}
          >
            {phase === "sending" ? (
              <>
                <span className="location-gate-btn-spinner" /> Asking again…
              </>
            ) : permissionBlocked ? (
              "How to enable"
            ) : (
              "Allow location"
            )}
          </button>
          <button
            type="button"
            className="location-gate-secondary"
            onClick={handleSkip}
            disabled={phase === "sending"}
          >
            Continue without location
          </button>
        </div>

        <p className="location-gate-foot">
          If the browser doesn't ask again, open your browser settings and
          allow location for this site, then click <strong>Allow location</strong>.
        </p>
      </div>
    </div>
  );
};

export default LocationGate;
