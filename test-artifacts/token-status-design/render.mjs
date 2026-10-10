// token-design-preview.jsx
import React2 from "react";
import { renderToStaticMarkup } from "react-dom/server";

// src/Component/UserDashboard/Tab/Counselor/TokenStatusPage.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { FaCalendarAlt, FaFileAlt, FaUsers, FaRegClock, FaListUl, FaUserMd, FaPlay, FaInfoCircle, FaChevronRight, FaSyncAlt } from "react-icons/fa";

// preview-mock:../../../../axiosConfig
var axiosConfig_default = {};

// preview-mock:../../../../services/socketService
var socketService_default = {};

// preview-mock:../../../../i18n/LanguageContext
var useUserTranslation = () => ({ t: (key) => ({ your_token_status: "Your Token Status", my_appointments: "My Appointments", your_token: "Your Token", now_serving: "Now Serving", token_page_subtitle: "View your appointment token, current serving token and live waiting status." })[key] || "" });

// src/Component/UserDashboard/Tab/Counselor/tokenTiming.js
var getTokenDisplayTime = (value) => {
  if (value == null || value === "") return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? new Date(Math.round(timestamp / 6e4) * 6e4) : null;
};
var formatQueueStatus = (value) => String(value || "").replace(/[_-]+/g, " ").trim() || "--";
var formatTimer = (seconds) => {
  if (seconds == null || !Number.isFinite(seconds)) return "--";
  const value = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
};
var formatWaitLabel = (seconds) => {
  if (seconds == null || !Number.isFinite(seconds)) return "--";
  const value = Math.max(0, Math.ceil(seconds));
  if (value < 60) return "< 1 min";
  return `${Math.ceil(value / 60)} min`;
};
var getLiveTokenTiming = (current = {}, queue = {}, now = Date.now()) => {
  const snapshot = Date.parse(current.serverTime);
  const doctorStatus = String(current.doctorStatus || "").toLowerCase();
  const tick = doctorStatus === "consulting" && Number.isFinite(snapshot) ? Math.max(0, Math.floor((now - snapshot) / 1e3)) : 0;
  const elapsed = current.elapsedSeconds == null ? null : current.elapsedSeconds + tick;
  const eta = Date.parse(queue.estimatedTurnTime);
  const canShowWaiting = ["consulting", "waiting"].includes(doctorStatus) && !queue.estimateUncertain;
  const waiting = canShowWaiting && !current.isYourTurn && Number.isFinite(eta) ? Math.max(0, Math.ceil((eta - now) / 1e3)) : null;
  return { elapsed, waiting: doctorStatus === "consulting" && waiting === 0 ? null : waiting };
};

// src/Component/UserDashboard/Tab/Counselor/TokenStatusPage.jsx
var TokenTicketIcon = () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 48 48", fill: "none", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M7 9h34v9a6 6 0 0 0 0 12v9H7v-9a6 6 0 0 0 0-12V9Z", stroke: "currentColor", strokeWidth: "3.5", strokeLinejoin: "round" }), /* @__PURE__ */ React.createElement("path", { d: "M28 15v1m0 7v1m0 7v1", stroke: "currentColor", strokeWidth: "3.5", strokeLinecap: "round" }));
var TOKEN_STATUS_ENDPOINT = "/api/appointments/my-token-status";
var POLL_INTERVAL_MS = 1e4;
var SOCKET_DEBOUNCE_MS = 500;
var TERMINAL_APPOINTMENT_STATUSES = /* @__PURE__ */ new Set([
  "completed",
  "cancelled",
  "canceled",
  "rejected",
  "reject",
  "no-show",
  "no_show"
]);
var normalizeStatus = (value) => String(value || "").toLowerCase();
var isActiveTokenItem = (item) => {
  const appointment = item?.appointment || {};
  const token = item?.token || {};
  return !TERMINAL_APPOINTMENT_STATUSES.has(normalizeStatus(appointment.status)) && !TERMINAL_APPOINTMENT_STATUSES.has(normalizeStatus(token.queueStatus)) && !appointment.consultationEndedAt && !appointment.consultation_ended_at && !appointment.consultationTiming?.endedAt && !appointment.consultation_timing?.endedAt;
};
var formatAppointmentDateTime = (appointment) => {
  if (!appointment) return "";
  const date = appointment.appointmentDate;
  const time = appointment.appointmentTime;
  if (date && time) {
    const value = /* @__PURE__ */ new Date(`${date}T${time}`);
    if (!Number.isNaN(value.getTime())) {
      return value.toLocaleString(void 0, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
  }
  if (date) {
    const value = new Date(date);
    if (!Number.isNaN(value.getTime())) {
      return value.toLocaleDateString(void 0, {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    }
  }
  return "";
};
var formatEstimatedTurnTime = (value) => {
  const date = getTokenDisplayTime(value);
  if (!date) return "--";
  return date.toLocaleTimeString(void 0, {
    hour: "2-digit",
    minute: "2-digit"
  });
};
var formatDateTimeValue = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString(void 0, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};
var formatMinuteDifference = (minutes) => {
  if (minutes == null || !Number.isFinite(Number(minutes))) return "";
  const value = Math.abs(Math.round(Number(minutes)));
  if (value === 0) return "on time";
  return `${value} min ${Number(minutes) > 0 ? "late" : "early"}`;
};
var getTimingMessage = (appointment = {}, queue = {}, liveTiming = {}) => {
  if (queue.notice) return queue.notice;
  if (queue.estimateUncertain) {
    return "Your number may be called anytime. Please stay near the clinic.";
  }
  const relation = queue.timingRelation || appointment.timingRelation;
  const diff = queue.timingDifferenceMinutes ?? appointment.timingDifferenceMinutes;
  const wait = formatWaitLabel(liveTiming.waiting);
  if (liveTiming.waiting != null) {
    if (relation === "early") return `Your number may come in ${wait}, about ${Math.abs(Math.round(Number(diff) || 0))} min before the appointment time.`;
    if (relation === "late") return `Your number may come in ${wait}, about ${Math.abs(Math.round(Number(diff) || 0))} min after the appointment time.`;
    return `Your number may come in ${wait}.`;
  }
  return "Waiting time updates with the live clinic queue.";
};
var getWaitDisplay = (queue = {}, liveTiming = {}) => queue.estimateUncertain ? queue.patientsAhead === 1 ? "Expected shortly" : "ETA updating" : formatWaitLabel(liveTiming.waiting);
var getDoctorName = (item) => {
  const doctor = item?.appointment?.doctor;
  return doctor?.fullName || doctor?.name || [doctor?.firstName, doctor?.lastName].filter(Boolean).join(" ") || "Doctor";
};
var getAppointmentId = (item) => item?.appointment?.appointmentId || item?.appointment?._id || item?._id || item?.id;
var TokenStatusPage = () => {
  const { t } = useUserTranslation();
  const [appointments, setAppointments] = useState([{ "appointment": { "appointmentId": "online:3", "_id": "3", "source": "online", "appointmentDate": "2026-10-08", "appointmentTime": "18:45:00", "doctor": { "fullName": "mediconeckt" }, "bookedAt": "2026-10-08T12:52:00Z", "status": "pending", "scheduledStartAt": "2026-10-08T12:55:00Z", "actualStartAt": null, "timingLabel": "on time" }, "token": { "myToken": 3, "queueStatus": "booked" }, "current": { "currentToken": null, "doctorStatus": "waiting", "serverTime": "2026-10-08T12:54:30Z" }, "queue": { "totalWaiting": 3, "patientsAhead": 0, "queuePosition": 1, "estimatedTurnTime": "2026-10-08T12:55:00Z", "notice": "Your number may come within 30 minutes. Please stay near the clinic." }, "emergency": {} }, { "appointment": { "appointmentId": "online:2", "_id": "2", "source": "online", "appointmentDate": "2026-10-08", "appointmentTime": "18:35:00", "doctor": { "fullName": "mediconeckt" }, "bookedAt": "2026-10-08T12:52:00Z", "status": "pending", "scheduledStartAt": "2026-10-08T12:55:00Z", "actualStartAt": null, "timingLabel": "on time" }, "token": { "myToken": 2, "queueStatus": "booked" }, "current": { "currentToken": null, "doctorStatus": "waiting", "serverTime": "2026-10-08T12:54:30Z" }, "queue": { "totalWaiting": 3, "patientsAhead": 0, "queuePosition": 1, "estimatedTurnTime": "2026-10-08T12:55:00Z", "notice": "Your number may come within 30 minutes. Please stay near the clinic." }, "emergency": {} }, { "appointment": { "appointmentId": "online:1", "_id": "1", "source": "online", "appointmentDate": "2026-10-08", "appointmentTime": "18:25:00", "doctor": { "fullName": "mediconeckt" }, "bookedAt": "2026-10-08T12:52:00Z", "status": "pending", "scheduledStartAt": "2026-10-08T12:55:00Z", "actualStartAt": null, "timingLabel": "on time" }, "token": { "myToken": 1, "queueStatus": "booked" }, "current": { "currentToken": null, "doctorStatus": "waiting", "serverTime": "2026-10-08T12:54:30Z" }, "queue": { "totalWaiting": 3, "patientsAhead": 0, "queuePosition": 1, "estimatedTurnTime": "2026-10-08T12:55:00Z", "notice": "Your number may come within 30 minutes. Please stay near the clinic." }, "emergency": {} }]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("online:1");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.parse("2026-10-08T12:54:30Z"));
  const [clockOffset, setClockOffset] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1e3);
    return () => window.clearInterval(timer);
  }, []);
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);
  const inFlightRef = useRef(false);
  const isMountedRef = useRef(true);
  const fetchTokenStatus = useCallback(async ({ silent = false } = {}) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      if (!silent) setIsLoading(true);
      const response = await axiosConfig_default.get(TOKEN_STATUS_ENDPOINT);
      if (!isMountedRef.current) return;
      if (response.data?.success === false) {
        throw new Error(response.data?.message || "Unable to load token status");
      }
      const list = Array.isArray(response.data?.appointments) ? response.data.appointments.filter(isActiveTokenItem) : [];
      setAppointments(list);
      const serverTime = Date.parse(list[0]?.current?.serverTime);
      if (Number.isFinite(serverTime)) setClockOffset(serverTime - Date.now());
      setError("");
      setSelectedAppointmentId((previousId) => {
        if (!list.length) return null;
        const stillExists = list.some(
          (item) => String(getAppointmentId(item)) === String(previousId)
        );
        return previousId && stillExists ? previousId : getAppointmentId(list[0]);
      });
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error(
        "Failed to fetch token status:",
        err?.response?.data || err
      );
      if (!silent) {
        setError(
          err?.response?.data?.message || err?.message || tRef.current("error_load_token") || "Could not load token status."
        );
      }
      if (!silent) setAppointments([]);
    } finally {
      inFlightRef.current = false;
      if (!silent && isMountedRef.current) setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    isMountedRef.current = true;
    let cancelled = false;
    let socket = null;
    let debounceId = null;
    void fetchTokenStatus();
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchTokenStatus({ silent: true });
      }
    }, POLL_INTERVAL_MS);
    const onQueueUpdated = () => {
      window.clearTimeout(debounceId);
      debounceId = window.setTimeout(() => {
        void fetchTokenStatus({ silent: true });
      }, SOCKET_DEBOUNCE_MS);
    };
    socketService_default.connect().then((s) => {
      if (cancelled) return;
      socket = s;
      socket.on("queueUpdated", onQueueUpdated);
    }).catch((err) => {
      console.warn(
        "[TokenStatusPage] Socket connection unavailable:",
        err?.message || err
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
    () => appointments.find(
      (item) => String(getAppointmentId(item)) === String(selectedAppointmentId)
    ) || null,
    [appointments, selectedAppointmentId]
  );
  const appointment = selectedItem?.appointment || {};
  const tokenData = selectedItem?.token || {};
  const currentData = selectedItem?.current || {};
  const queueData = selectedItem?.queue || {};
  const emergencyData = selectedItem?.emergency || {};
  const isTerminalAppointment = !isActiveTokenItem(selectedItem);
  const liveTiming = getLiveTokenTiming(currentData, queueData, now + clockOffset);
  const doctorStatusLabel = { consulting: "Consulting", paused: "Paused", break: "On break", waiting: "Not started" }[currentData.doctorStatus] || "Not started";
  const bookedAt = appointment.bookedAt || appointment.createdAt;
  const timingMessage = getTimingMessage(appointment, queueData, liveTiming);
  return /* @__PURE__ */ React.createElement("div", { className: "token-status-page" }, /* @__PURE__ */ React.createElement("div", { className: "token-page-header" }, /* @__PURE__ */ React.createElement("span", { className: "token-header-icon", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(FaCalendarAlt, null), /* @__PURE__ */ React.createElement(FaRegClock, { className: "token-header-clock" })), /* @__PURE__ */ React.createElement("div", { className: "token-header-copy" }, /* @__PURE__ */ React.createElement("h2", { className: "token-page-title" }, t("your_token_status") === "Your Token Status" ? /* @__PURE__ */ React.createElement(React.Fragment, null, "Your ", /* @__PURE__ */ React.createElement("span", null, "Token Status")) : t("your_token_status") || /* @__PURE__ */ React.createElement(React.Fragment, null, "Your ", /* @__PURE__ */ React.createElement("span", null, "Token Status"))), /* @__PURE__ */ React.createElement("p", { className: "token-page-subtitle" }, t("token_page_subtitle") || "View your appointment token, current serving token and live waiting status."))), /* @__PURE__ */ React.createElement("div", { className: "token-page-body" }, /* @__PURE__ */ React.createElement("div", { className: "appointment-picker" }, /* @__PURE__ */ React.createElement("h3", { className: "picker-heading" }, /* @__PURE__ */ React.createElement("span", { className: "picker-heading-icon", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(FaCalendarAlt, null)), t("my_appointments") || "My Appointments"), isLoading && /* @__PURE__ */ React.createElement("div", { className: "picker-state" }, t("loading") || "Loading..."), !isLoading && error && /* @__PURE__ */ React.createElement("div", { className: "picker-state error" }, error, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => fetchTokenStatus(),
      style: {
        display: "block",
        margin: "12px auto 0",
        cursor: "pointer"
      }
    },
    "Retry"
  )), !isLoading && !error && appointments.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "picker-state" }, t("no_appointments") || "You don't have any active appointments."), !isLoading && !error && appointments.length > 0 && /* @__PURE__ */ React.createElement("ul", { className: "appointment-list" }, appointments.map((item) => {
    const id = getAppointmentId(item);
    const isSelected = String(id) === String(selectedAppointmentId);
    const itemAppointment = item?.appointment || {};
    return /* @__PURE__ */ React.createElement("li", { key: id }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: `appointment-item ${isSelected ? "selected" : ""}`,
        "aria-pressed": isSelected,
        onClick: () => setSelectedAppointmentId(id)
      },
      /* @__PURE__ */ React.createElement(FaCalendarAlt, { className: "appointment-item-icon", "aria-hidden": "true" }),
      /* @__PURE__ */ React.createElement(FaChevronRight, { className: "appointment-item-chevron", "aria-hidden": "true" }),
      /* @__PURE__ */ React.createElement("span", { className: "appointment-doctor" }, getDoctorName(item)),
      /* @__PURE__ */ React.createElement("span", { className: "appointment-datetime" }, formatAppointmentDateTime(itemAppointment)),
      /* @__PURE__ */ React.createElement(
        "span",
        {
          className: `appointment-status ${itemAppointment.status || ""}`
        },
        itemAppointment.status || "pending"
      ),
      item?.token?.myToken != null && /* @__PURE__ */ React.createElement("span", { className: "appointment-token-number" }, "Token #", item.token.myToken)
    ));
  }))), /* @__PURE__ */ React.createElement("div", { className: "token-detail-panel" }, !isLoading && !error && !selectedItem && appointments.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "token-empty-state" }, t("select_appointment_prompt") || "Select an appointment to see your token status."), selectedItem && /* @__PURE__ */ React.createElement("div", { className: "token-card" }, emergencyData.active && /* @__PURE__ */ React.createElement("div", { className: "emergency-banner" }, emergencyData.message || "\u26A0 Emergency patient is present in the queue. Your waiting time may change."), /* @__PURE__ */ React.createElement("div", { className: "token-detail-heading" }, /* @__PURE__ */ React.createElement("div", { className: "token-doctor-line" }, getDoctorName(selectedItem)), /* @__PURE__ */ React.createElement("span", { className: `token-status-pill ${appointment.status || "pending"}` }, /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }), formatQueueStatus(appointment.status || "pending"))), /* @__PURE__ */ React.createElement("div", { className: "token-appointment-meta" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement(FaCalendarAlt, { "aria-hidden": "true" }), "Booked: ", formatDateTimeValue(bookedAt)), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement(FaRegClock, { "aria-hidden": "true" }), "Appointment: ", formatAppointmentDateTime(appointment) || "--")), isTerminalAppointment ? /* @__PURE__ */ React.createElement("div", { className: "token-empty-state" }, /* @__PURE__ */ React.createElement("p", null, "Appointment status: ", /* @__PURE__ */ React.createElement("strong", null, appointment.status)), tokenData.myToken != null && /* @__PURE__ */ React.createElement("p", null, "Token #", tokenData.myToken)) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "token-live-timing", role: "status" }, /* @__PURE__ */ React.createElement(FaInfoCircle, { className: "token-notice-icon", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("div", null, currentData.consultationStartedAt ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("strong", null, currentData.isYourTurn ? "Your checkup" : "Current checkup", ": ", formatTimer(liveTiming.elapsed)), /* @__PURE__ */ React.createElement("p", null, currentData.isYourTurn ? "The doctor is checking your appointment." : timingMessage), (currentData.doctorStatus === "paused" || currentData.doctorStatus === "break") && /* @__PURE__ */ React.createElement("p", null, "Timer paused while the doctor is ", currentData.doctorStatus === "break" ? "on break" : "paused", ".")) : /* @__PURE__ */ React.createElement("p", null, timingMessage))), /* @__PURE__ */ React.createElement("div", { className: "token-stats-grid" }, /* @__PURE__ */ React.createElement("div", { className: "token-stat your-token" }, /* @__PURE__ */ React.createElement("span", { className: "token-stat-icon blue", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(TokenTicketIcon, null)), /* @__PURE__ */ React.createElement("span", { className: "token-stat-label" }, t("your_token") || "Your Token"), /* @__PURE__ */ React.createElement("span", { className: "token-stat-value" }, tokenData.myToken ?? "--")), /* @__PURE__ */ React.createElement("div", { className: "token-stat" }, /* @__PURE__ */ React.createElement("span", { className: "token-stat-icon indigo", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(FaUsers, null)), /* @__PURE__ */ React.createElement("span", { className: "token-stat-label" }, t("now_serving") || "Now Serving"), /* @__PURE__ */ React.createElement("span", { className: "token-stat-value" }, currentData.currentToken ?? "--"), /* @__PURE__ */ React.createElement("span", { className: "token-stat-help" }, "Current token")), /* @__PURE__ */ React.createElement("div", { className: "token-stat" }, /* @__PURE__ */ React.createElement("span", { className: "token-stat-icon green", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(FaRegClock, null)), /* @__PURE__ */ React.createElement("span", { className: "token-stat-label" }, "Your number in"), /* @__PURE__ */ React.createElement("span", { className: "token-stat-value" }, currentData.isYourTurn ? "Consultation in progress" : getWaitDisplay(queueData, liveTiming)), /* @__PURE__ */ React.createElement("span", { className: "token-stat-help" }, queueData.estimateUncertain ? "Can be called anytime" : "Approximate"))), /* @__PURE__ */ React.createElement("div", { className: "token-stats-grid", style: { marginTop: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "token-stat" }, /* @__PURE__ */ React.createElement("span", { className: "token-stat-icon pink", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(FaUsers, null)), /* @__PURE__ */ React.createElement("span", { className: "token-stat-label" }, "Patients Ahead"), /* @__PURE__ */ React.createElement("span", { className: "token-stat-value" }, queueData.patientsAhead ?? "--")), /* @__PURE__ */ React.createElement("div", { className: "token-stat" }, /* @__PURE__ */ React.createElement("span", { className: "token-stat-icon purple", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(FaListUl, null)), /* @__PURE__ */ React.createElement("span", { className: "token-stat-label" }, "Queue Position"), /* @__PURE__ */ React.createElement("span", { className: "token-stat-value" }, queueData.queuePosition ?? "--")), /* @__PURE__ */ React.createElement("div", { className: "token-stat" }, /* @__PURE__ */ React.createElement("span", { className: "token-stat-icon orange", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(FaUsers, null)), /* @__PURE__ */ React.createElement("span", { className: "token-stat-label" }, "Total Waiting"), /* @__PURE__ */ React.createElement("span", { className: "token-stat-value" }, queueData.totalWaiting ?? "--"))), /* @__PURE__ */ React.createElement("div", { className: "token-stats-grid", style: { marginTop: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "token-stat" }, /* @__PURE__ */ React.createElement("span", { className: "token-stat-icon blue", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(FaRegClock, null)), /* @__PURE__ */ React.createElement("span", { className: "token-stat-label", title: "Approximate time your consultation will begin, based on the live queue." }, "Estimated Consultation Time"), /* @__PURE__ */ React.createElement("span", { className: "token-stat-value" }, formatEstimatedTurnTime(queueData.estimatedTurnTime))), /* @__PURE__ */ React.createElement("div", { className: "token-stat" }, /* @__PURE__ */ React.createElement("span", { className: "token-stat-icon green", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(FaCalendarAlt, null)), /* @__PURE__ */ React.createElement("span", { className: "token-stat-label" }, "Appointment Timing"), /* @__PURE__ */ React.createElement("span", { className: "token-stat-value token-stat-value-small" }, appointment.timingLabel || queueData.timingLabel || formatMinuteDifference(queueData.timingDifferenceMinutes ?? appointment.timingDifferenceMinutes) || "--")), /* @__PURE__ */ React.createElement("div", { className: "token-stat" }, /* @__PURE__ */ React.createElement("span", { className: "token-stat-icon pink", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(FaUserMd, null)), /* @__PURE__ */ React.createElement("span", { className: "token-stat-label" }, "Doctor Status"), /* @__PURE__ */ React.createElement("span", { className: "token-stat-value" }, doctorStatusLabel))), /* @__PURE__ */ React.createElement("div", { className: "token-stats-grid", style: { marginTop: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "token-stat" }, /* @__PURE__ */ React.createElement("span", { className: "token-stat-icon purple", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(FaFileAlt, null)), /* @__PURE__ */ React.createElement("span", { className: "token-stat-label" }, "Queue Status"), /* @__PURE__ */ React.createElement("span", { className: "token-stat-value" }, formatQueueStatus(tokenData.queueStatus))), /* @__PURE__ */ React.createElement("div", { className: "token-stat" }, /* @__PURE__ */ React.createElement("span", { className: "token-stat-icon blue", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(FaCalendarAlt, null)), /* @__PURE__ */ React.createElement("span", { className: "token-stat-label" }, "Scheduled Time"), /* @__PURE__ */ React.createElement("span", { className: "token-stat-value token-stat-value-small" }, formatEstimatedTurnTime(appointment.scheduledStartAt))), /* @__PURE__ */ React.createElement("div", { className: "token-stat" }, /* @__PURE__ */ React.createElement("span", { className: "token-stat-icon blue", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(FaPlay, null)), /* @__PURE__ */ React.createElement("span", { className: "token-stat-label" }, "Live Start"), /* @__PURE__ */ React.createElement("span", { className: "token-stat-value token-stat-value-small" }, formatEstimatedTurnTime(appointment.actualStartAt)))), emergencyData.active && /* @__PURE__ */ React.createElement(
    "div",
    {
      style: {
        marginTop: 16,
        padding: 12,
        borderRadius: 8,
        background: "rgba(255, 193, 7, 0.12)"
      }
    },
    /* @__PURE__ */ React.createElement("div", null, "Emergency waiting:", " ", /* @__PURE__ */ React.createElement("strong", null, emergencyData.totalEmergencyPatients ?? 0)),
    /* @__PURE__ */ React.createElement("div", null, "Emergency patients ahead of you:", " ", /* @__PURE__ */ React.createElement("strong", null, emergencyData.emergencyPatientsAhead ?? 0))
  )), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => fetchTokenStatus({ silent: true }),
      style: {
        marginTop: 16,
        cursor: "pointer"
      },
      className: "token-refresh-button"
    },
    /* @__PURE__ */ React.createElement(FaSyncAlt, { "aria-hidden": "true" }),
    " Refresh Status"
  )))));
};
var TokenStatusPage_default = TokenStatusPage;

// token-design-preview.jsx
var html = renderToStaticMarkup(React2.createElement(TokenStatusPage_default));
export {
  html
};
