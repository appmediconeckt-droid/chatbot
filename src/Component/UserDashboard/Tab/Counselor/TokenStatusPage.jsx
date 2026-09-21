import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axiosInstance from "../../../../axiosConfig";
import socketService from "../../../../services/socketService";
import { useUserTranslation } from "../../../../i18n/LanguageContext";
import "./TokenStatusPage.css";

const TOKEN_STATUS_ENDPOINT = "/api/appointments/my-token-status";
const POLL_INTERVAL_MS = 10000;
const SOCKET_DEBOUNCE_MS = 500;

const formatAppointmentDateTime = (appointment) => {
  if (!appointment) return "";

  const date = appointment.appointmentDate;
  const time = appointment.appointmentTime;

  if (date && time) {
    const value = new Date(`${date}T${time}`);
    if (!Number.isNaN(value.getTime())) {
      return value.toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }

  if (date) {
    const value = new Date(date);
    if (!Number.isNaN(value.getTime())) {
      return value.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
  }

  return "";
};

const formatEstimatedTurnTime = (value) => {
  if (!value) return "--";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getDoctorName = (item) => {
  const doctor = item?.appointment?.doctor;

  return (
    doctor?.fullName ||
    doctor?.name ||
    [doctor?.firstName, doctor?.lastName].filter(Boolean).join(" ") ||
    "Doctor"
  );
};

const getAppointmentId = (item) =>
  item?.appointment?.appointmentId ||
  item?.appointment?._id ||
  item?._id ||
  item?.id;

const TokenStatusPage = () => {
  const { t } = useUserTranslation();

  const [appointments, setAppointments] = useState([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Keep latest `t` in a ref so fetchTokenStatus stays stable
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const inFlightRef = useRef(false);
  const isMountedRef = useRef(true);

  /**
   * GET /api/appointments/my-token-status
   *
   * Expected shape:
   * {
   *   success: true,
   *   appointments: [
   *     { appointment, token, current, queue, emergency }
   *   ]
   * }
   */
  const fetchTokenStatus = useCallback(async ({ silent = false } = {}) => {
    // Block parallel / duplicate calls
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      if (!silent) setIsLoading(true);

      const response = await axiosInstance.get(TOKEN_STATUS_ENDPOINT);
      if (!isMountedRef.current) return;

      const list = Array.isArray(response.data?.appointments)
        ? response.data.appointments
        : [];

      setAppointments(list);
      setError("");

      setSelectedAppointmentId((previousId) => {
        if (!list.length) return null;

        const stillExists = list.some(
          (item) => String(getAppointmentId(item)) === String(previousId),
        );

        return previousId && stillExists
          ? previousId
          : getAppointmentId(list[0]);
      });
    } catch (err) {
      if (!isMountedRef.current) return;

      console.error(
        "Failed to fetch token status:",
        err?.response?.data || err,
      );

      setError(
        err?.response?.data?.message ||
          tRef.current("error_load_token") ||
          "Could not load token status.",
      );

      if (!silent) setAppointments([]);
    } finally {
      inFlightRef.current = false;
      if (!silent && isMountedRef.current) setIsLoading(false);
    }
  }, []); // stable: never changes

  /**
   * Single effect: initial load + polling + socket.
   * Runs once (fetchTokenStatus is stable).
   */
  useEffect(() => {
    isMountedRef.current = true;

    let cancelled = false;
    let socket = null;
    let debounceId = null;

    // 1. Initial load
    void fetchTokenStatus();

    // 2. Polling (only while tab is visible)
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchTokenStatus({ silent: true });
      }
    }, POLL_INTERVAL_MS);

    // 3. Socket (debounced: burst of events = 1 API call)
    const onQueueUpdated = () => {
      window.clearTimeout(debounceId);
      debounceId = window.setTimeout(() => {
        void fetchTokenStatus({ silent: true });
      }, SOCKET_DEBOUNCE_MS);
    };

    socketService
      .connect()
      .then((s) => {
        if (cancelled) return;
        socket = s;
        socket.on("queueUpdated", onQueueUpdated);
      })
      .catch((err) => {
        console.warn(
          "[TokenStatusPage] Socket connection unavailable:",
          err?.message || err,
        );
      });

    return () => {
      cancelled = true;
      isMountedRef.current = false;
      window.clearInterval(intervalId);
      window.clearTimeout(debounceId);
      socket?.off("queueUpdated", onQueueUpdated);
    };
  }, [fetchTokenStatus]);

  const selectedItem = useMemo(
    () =>
      appointments.find(
        (item) =>
          String(getAppointmentId(item)) === String(selectedAppointmentId),
      ) || null,
    [appointments, selectedAppointmentId],
  );

  const appointment = selectedItem?.appointment || {};
  const tokenData = selectedItem?.token || {};
  const currentData = selectedItem?.current || {};
  const queueData = selectedItem?.queue || {};
  const emergencyData = selectedItem?.emergency || {};

  return (
    <div className="token-status-page">
      <div className="token-page-header">
        <h2 className="token-page-title">
          {t("your_token_status") || "Your Token Status"}
        </h2>

        <p className="token-page-subtitle">
          {t("token_page_subtitle") ||
            "View your appointment token, current serving token and live waiting status."}
        </p>
      </div>

      <div className="token-page-body">
        {/* LEFT SIDE - APPOINTMENT LIST */}
        <div className="appointment-picker">
          <h3 className="picker-heading">
            {t("my_appointments") || "My Appointments"}
          </h3>

          {isLoading && (
            <div className="picker-state">{t("loading") || "Loading..."}</div>
          )}

          {!isLoading && error && (
            <div className="picker-state error">
              {error}

              <button
                type="button"
                onClick={() => fetchTokenStatus()}
                style={{
                  display: "block",
                  margin: "12px auto 0",
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && appointments.length === 0 && (
            <div className="picker-state">
              {t("no_appointments") || "You don't have any active appointments."}
            </div>
          )}

          {!isLoading && !error && appointments.length > 0 && (
            <ul className="appointment-list">
              {appointments.map((item) => {
                const id = getAppointmentId(item);
                const isSelected = String(id) === String(selectedAppointmentId);
                const itemAppointment = item?.appointment || {};

                return (
                  <li key={id}>
                    <button
                      type="button"
                      className={`appointment-item ${
                        isSelected ? "selected" : ""
                      }`}
                      onClick={() => setSelectedAppointmentId(id)}
                    >
                      <span className="appointment-doctor">
                        {getDoctorName(item)}
                      </span>

                      <span className="appointment-datetime">
                        {formatAppointmentDateTime(itemAppointment)}
                      </span>

                      <span
                        className={`appointment-status ${
                          itemAppointment.status || ""
                        }`}
                      >
                        {itemAppointment.status || "pending"}
                      </span>

                      {item?.token?.myToken != null && (
                        <span className="appointment-token-number">
                          Token #{item.token.myToken}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* RIGHT SIDE - LIVE TOKEN DETAILS */}
        <div className="token-detail-panel">
          {!isLoading &&
            !error &&
            !selectedItem &&
            appointments.length > 0 && (
              <div className="token-empty-state">
                {t("select_appointment_prompt") ||
                  "Select an appointment to see your token status."}
              </div>
            )}

          {selectedItem && (
            <div className="token-card">
              {/* Emergency */}
              {emergencyData.active && (
                <div className="emergency-banner">
                  {emergencyData.message ||
                    "⚠ Emergency patient is present in the queue. Your waiting time may change."}
                </div>
              )}

              {/* Doctor */}
              <div className="token-doctor-line">
                {getDoctorName(selectedItem)}
              </div>

              <div
                style={{
                  marginBottom: 14,
                  fontSize: 13,
                  opacity: 0.75,
                }}
              >
                {formatAppointmentDateTime(appointment)}
              </div>

              {/* Main token stats */}
              <div className="token-stats-grid">
                <div className="token-stat your-token">
                  <span className="token-stat-label">
                    {t("your_token") || "Your Token"}
                  </span>
                  <span className="token-stat-value">
                    {tokenData.myToken ?? "--"}
                  </span>
                </div>

                <div className="token-stat">
                  <span className="token-stat-label">
                    {t("now_serving") || "Now Serving"}
                  </span>
                  <span className="token-stat-value">
                    {currentData.currentToken ?? "--"}
                  </span>
                </div>

                <div className="token-stat">
                  <span className="token-stat-label">
                    {t("waiting_count") || "Waiting"}
                  </span>
                  <span className="token-stat-value">
                    {queueData.totalWaiting ?? "--"}
                  </span>
                </div>
              </div>

              {/* Additional live queue info */}
              <div className="token-stats-grid" style={{ marginTop: 14 }}>
                <div className="token-stat">
                  <span className="token-stat-label">Patients Ahead</span>
                  <span className="token-stat-value">
                    {queueData.patientsAhead ?? "--"}
                  </span>
                </div>

                <div className="token-stat">
                  <span className="token-stat-label">Queue Position</span>
                  <span className="token-stat-value">
                    {queueData.queuePosition ?? "--"}
                  </span>
                </div>

                <div className="token-stat">
                  <span className="token-stat-label">Estimated Wait</span>
                  <span className="token-stat-value">
                    {queueData.estimatedWaitMinutes != null
                      ? `${queueData.estimatedWaitMinutes} min`
                      : "--"}
                  </span>
                </div>
              </div>

              <div className="token-stats-grid" style={{ marginTop: 14 }}>
                <div className="token-stat">
                  <span className="token-stat-label">Expected Turn</span>
                  <span className="token-stat-value">
                    {formatEstimatedTurnTime(queueData.estimatedTurnTime)}
                  </span>
                </div>

                <div className="token-stat">
                  <span className="token-stat-label">Doctor Status</span>
                  <span className="token-stat-value">
                    {currentData.doctorStatus === "consulting"
                      ? "Consulting"
                      : "Waiting"}
                  </span>
                </div>

                <div className="token-stat">
                  <span className="token-stat-label">Queue Status</span>
                  <span className="token-stat-value">
                    {tokenData.queueStatus || "--"}
                  </span>
                </div>
              </div>

              {/* Emergency details */}
              {emergencyData.active && (
                <div
                  style={{
                    marginTop: 16,
                    padding: 12,
                    borderRadius: 8,
                    background: "rgba(255, 193, 7, 0.12)",
                  }}
                >
                  <div>
                    Emergency waiting:{" "}
                    <strong>{emergencyData.totalEmergencyPatients ?? 0}</strong>
                  </div>

                  <div>
                    Emergency patients ahead of you:{" "}
                    <strong>{emergencyData.emergencyPatientsAhead ?? 0}</strong>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => fetchTokenStatus({ silent: true })}
                style={{
                  marginTop: 16,
                  cursor: "pointer",
                }}
              >
                Refresh Status
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenStatusPage;