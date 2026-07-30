import React, { useEffect, useState } from "react";
import {
  consumePendingLocationNotice,
  hasStickyLocationBanner,
  setStickyLocationBanner,
  captureAndSendLocation,
  LOCATION_PERMISSION_DENIED_CODE,
} from "../../authtication/locationHelper";
import "./LocationNoticeToast.css";

// Three things this surface handles:
//   1. One-shot "couldn't capture" toast (from a silent auth-time failure).
//   2. Sticky banner when the user soft-declined location during auth — the
//      banner persists until they either succeed or close the tab.
//   3. "Try now" inline retry from the banner.
const LocationNoticeToast = () => {
  const [notice, setNotice] = useState(null);
  const [sticky, setSticky] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState("");

  useEffect(() => {
    const pending = consumePendingLocationNotice();
    if (pending) {
      if (
        String(pending.message || "").includes("Location is blocked for this site")
      ) {
        setStickyLocationBanner(false);
        setNotice(null);
        setSticky(false);
        return;
      }
      setNotice(pending);
      // Only auto-hide the transient toast if the banner isn't already sticky.
      if (!hasStickyLocationBanner()) {
        const t = setTimeout(() => setNotice(null), 8000);
        return () => clearTimeout(t);
      }
    }
    setSticky(hasStickyLocationBanner());
  }, []);

  const handleRetry = async () => {
    setRetrying(true);
    setRetryError("");
    try {
      await captureAndSendLocation("manual");
      setStickyLocationBanner(false);
      setSticky(false);
      setNotice(null);
    } catch (err) {
      setRetryError(
        err.code === LOCATION_PERMISSION_DENIED_CODE
          ? "Click the lock/site icon near the address bar, set Location to Allow, then reload the page"
          : err.message || "Couldn't capture your location",
      );
    } finally {
      setRetrying(false);
    }
  };

  const handleDismiss = () => {
    setNotice(null);
    // Don't clear the sticky banner on dismiss of the toast — only success or
    // an explicit close on the banner itself clears it.
  };

  const handleCloseBanner = () => {
    setStickyLocationBanner(false);
    setSticky(false);
  };

  if (!notice && !sticky) return null;

  if (sticky) {
    return (
      <div className="location-banner-sticky" role="status">
        <span className="location-notice-icon" aria-hidden="true">📍</span>
        <div className="location-notice-body">
          <strong>Location is off</strong>
          <span className="location-notice-msg">
            Turn on location to keep your account verified and your session
            secure.
            {retryError && (
              <span className="location-banner-err"> {retryError}.</span>
            )}
          </span>
        </div>
        <button
          type="button"
          className="location-banner-try"
          onClick={handleRetry}
          disabled={retrying}
        >
          {retrying ? "Asking…" : "Try now"}
        </button>
        <button
          type="button"
          className="location-notice-close"
          onClick={handleCloseBanner}
          aria-label="Hide"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div className="location-notice-toast" role="status">
      <span className="location-notice-icon" aria-hidden="true">📍</span>
      <div className="location-notice-body">
        <strong>Location not shared</strong>
        <span className="location-notice-msg">
          {notice.message}. You can enable it anytime from your profile.
        </span>
      </div>
      <button
        type="button"
        className="location-notice-close"
        onClick={handleDismiss}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
};

export default LocationNoticeToast;
