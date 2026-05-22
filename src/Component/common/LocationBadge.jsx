import React, { useEffect, useState } from "react";
import {
  getCachedLocationSummary,
  formatLocationLabel,
  captureAndSendLocation,
  LOCATION_SUMMARY_EVENT_NAME,
} from "../../authtication/locationHelper";
import "./LocationBadge.css";

// Small pill badge that shows the current cached location (city/state).
// Stays in sync via a "location-summary-updated" CustomEvent fired by the
// helper after every successful capture.
//
// Props:
//   className?  — extra wrapper class for positioning per dashboard
//   showRefresh — if true, clicking the badge re-fetches GPS
const LocationBadge = ({ className = "", showRefresh = true }) => {
  const [summary, setSummary] = useState(() => getCachedLocationSummary());
  const [refreshing, setRefreshing] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      setSummary(e?.detail ?? getCachedLocationSummary());
      // Brief pulse animation when the value changes mid-session.
      setJustUpdated(true);
      const t = setTimeout(() => setJustUpdated(false), 1500);
      return () => clearTimeout(t);
    };
    window.addEventListener(LOCATION_SUMMARY_EVENT_NAME, handler);
    return () =>
      window.removeEventListener(LOCATION_SUMMARY_EVENT_NAME, handler);
  }, []);

  if (!summary) return null;

  const label = formatLocationLabel(summary);
  if (!label) return null;

  const handleRefresh = async () => {
    if (!showRefresh || refreshing) return;
    setRefreshing(true);
    try {
      await captureAndSendLocation("manual");
    } catch (err) {
      console.warn("[LocationBadge] refresh failed:", err.message);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <button
      type="button"
      className={`location-badge ${justUpdated ? "location-badge-pulse" : ""} ${className}`.trim()}
      onClick={handleRefresh}
      disabled={refreshing}
      title={
        showRefresh
          ? "Click to refresh your location"
          : "Your current location"
      }
      aria-label={`Current location: ${label}`}
    >
      <span className="location-badge-icon" aria-hidden="true">📍</span>
      <span className="location-badge-text">{label}</span>
      {refreshing && (
        <span className="location-badge-spinner" aria-hidden="true" />
      )}
    </button>
  );
};

export default LocationBadge;
