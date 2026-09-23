import { useCallback, useEffect, useMemo, useState } from "react";
import { useDoctorUser } from "../doctorApi.js";
import axios from "../../../axiosConfig.js";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CheckCheck,
  Clock3,
  ExternalLink,
  Filter,
  Mail,
  MessageSquareText,
  Search,
  UserRound,
} from "lucide-react";
import { API_BASE_URL, getAuthHeaders } from "../doctorApi.js";
import "./NotificationPage.css";

const NOTIFICATION_BASE_URL = `${API_BASE_URL}/notifications`;

const typeConfig = {
  emergency: {
    label: "Critical Alerts",
    icon: AlertTriangle,
    tone: "red",
  },
  appointment: {
    label: "Appointments",
    icon: CalendarDays,
    tone: "blue",
  },
  message: {
    label: "Messages",
    icon: MessageSquareText,
    tone: "orange",
  },
  notification: {
    label: "Unread",
    icon: Mail,
    tone: "blue",
  },
};

const getStoredAuthUser = () => {
  try {
    return JSON.parse(localStorage.getItem("userData") || "null");
  } catch {
    return null;
  }
};

const unwrapApiArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.notifications)) return payload.notifications;
  if (Array.isArray(payload?.data?.notifications)) return payload.data.notifications;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const getDoctorId = (user = {}) => (
  user.doctor_id ||
  user.doctorId ||
  user.id ||
  user._id ||
  user.user_id ||
  user.userId ||
  ""
);

const formatNotificationTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeType = (value = "") => {
  const type = String(value || "notification").toLowerCase();
  if (type.includes("appoint")) return "appointment";
  if (type.includes("message") || type.includes("chat")) return "message";
  if (type.includes("emergency") || type.includes("critical") || type.includes("alert")) return "emergency";
  return "notification";
};

const normalizePriority = (item, type) => {
  const priority = String(item.priority || item.severity || "").toLowerCase();
  if (priority) return priority;
  if (type === "emergency") return "critical";
  if (type === "appointment") return "high";
  if (type === "message") return "normal";
  return "normal";
};

const normalizeNotification = (item, index) => {
  const title = item.title || item.type || item.notification_type || item.subject || "Notification";
  const type = normalizeType(item.type || item.notification_type || title);
  const patient =
    item.patient_name ||
    item.patientName ||
    item.patient?.name ||
    item.patient?.full_name ||
    item.patient?.patient_name ||
    item.sender_name ||
    item.senderName ||
    item.sender?.name ||
    "";
  const appointmentTime =
    item.appointment_time ||
    item.appointmentTime ||
    item.appointment?.appointment_time ||
    item.appointment?.scheduled_at ||
    item.scheduled_at ||
    item.scheduledAt ||
    "";

  return {
    id: item.id || item.notification_id || item._id || index,
    title,
    message: item.message || item.description || item.body || item.content || "No details available.",
    time: formatNotificationTime(item.created_at || item.createdAt || item.time || item.updated_at),
    read: Boolean(item.is_read ?? item.read ?? item.seen ?? false),
    type,
    priority: normalizePriority(item, type),
    patient,
    appointmentTime,
    actions: type === "emergency"
      ? ["Open Case", "Call Patient", "Assign Doctor"]
      : type === "appointment"
        ? ["Accept", "View Details", "Reschedule"]
        : type === "message"
          ? ["Reply", "View Chat"]
          : ["View Details"],
  };
};

export default function NotificationPage() {
  const authUser = useDoctorUser();
  const user = useMemo(() => authUser || getStoredAuthUser() || {}, [authUser]);
  const userId = useMemo(() => getDoctorId(user), [user]);
  const userRole = String(user.role || "doctor").toLowerCase();

  const [notifications, setNotifications] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const unreadCount = notifications.filter((item) => !item.read).length;
  const criticalCount = notifications.filter((item) => item.type === "emergency").length;
  const appointmentCount = notifications.filter((item) => item.type === "appointment").length;
  const messageCount = notifications.filter((item) => item.type === "message").length;

  const visibleNotifications = useMemo(() => {
    const search = query.trim().toLowerCase();
    return notifications.filter((item) => {
      const matchesFilter = activeFilter === "all" || item.type === activeFilter || (activeFilter === "unread" && !item.read);
      const matchesSearch = !search || [item.title, item.message, item.patient].join(" ").toLowerCase().includes(search);
      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, notifications, query]);

  const stats = [
    { label: "Critical Alerts", value: criticalCount, icon: AlertTriangle, tone: "red" },
    { label: "Unread", value: unreadCount, icon: Mail, tone: "blue" },
    { label: "Appointments", value: appointmentCount, icon: CalendarClock, tone: "blue" },
    { label: "Messages", value: messageCount, icon: MessageSquareText, tone: "orange" },
  ];

  const loadNotifications = useCallback(async (signal) => {
    if (!userId) {
      setNotifications([]);
      setError("Doctor id not found. Please login again.");
      setStatus("failed");
      return;
    }

    try {
      setStatus("loading");
      setError("");
      const response = await axios.get(NOTIFICATION_BASE_URL, {
        headers: getAuthHeaders(),
        signal,
      });
      setNotifications(unwrapApiArray(response.data).map(normalizeNotification));
      setStatus("succeeded");
    } catch (err) {
      if (axios.isCancel(err)) return;
      setNotifications([]);
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to load notifications");
      setStatus("failed");
    }
  }, [userId, userRole]);

  useEffect(() => {
    const controller = new AbortController();
    loadNotifications(controller.signal);
    return () => controller.abort();
  }, [loadNotifications]);

  const markAsRead = async (id) => {
    const current = notifications;
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );

    try {
      await axios.patch(`${NOTIFICATION_BASE_URL}/${id}/read`, {}, { headers: getAuthHeaders() });
    } catch (err) {
      setNotifications(current);
      alert(err.response?.data?.message || err.response?.data?.error || "Failed to mark notification as read");
    }
  };

  const markAllAsRead = async () => {
    const current = notifications;
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));

    if (!userId) return;

    try {
      await axios.patch(
        `${NOTIFICATION_BASE_URL}/read-all`,
        {},
        { headers: getAuthHeaders() }
      );
    } catch (err) {
      setNotifications(current);
      alert(err.response?.data?.message || err.response?.data?.error || "Failed to mark all notifications as read");
    }
  };

  return (
    <div className="doctor-notifications-page">
      <div className="doctor-notifications-shell">
        <header className="doctor-notifications-topbar">
          <h1>Notifications</h1>
          <button
            type="button"
            className="doctor-notifications-mark-all"
            onClick={markAllAsRead}
            disabled={!notifications.length || unreadCount === 0}
          >
            <CheckCheck size={16} />
            Mark All as Read
          </button>
        </header>

        <div className="doctor-notifications-content">
          <div className="doctor-notifications-main">
            <section className="doctor-notifications-stats" aria-label="Notification summary">
              {stats.map((item) => {
                const Icon = item.icon;
                return (
                  <div className="doctor-notifications-stat-card" key={item.label}>
                    <span className={`doctor-notifications-icon doctor-notifications-icon-${item.tone}`}>
                      <Icon size={21} />
                    </span>
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </section>

            <div className="doctor-notifications-toolbar">
              <label className="doctor-notifications-search">
                <Search size={17} />
                <input
                  type="search"
                  placeholder="Search notifications..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>

              <div className="doctor-notifications-filters" aria-label="Notification filters">
                {[
                  ["all", "All"],
                  ["unread", "Unread"],
                  ["appointment", "Appointments"],
                  ["message", "Messages"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={activeFilter === value ? "is-active" : ""}
                    onClick={() => setActiveFilter(value)}
                  >
                    {label}
                  </button>
                ))}
                <button type="button" className="doctor-notifications-filter-icon" aria-label="More filters">
                  <Filter size={16} />
                </button>
              </div>
            </div>

            <div className="doctor-notifications-divider" />

            {error && <div className="doctor-notifications-error">{error}</div>}

            <section className="doctor-notifications-today">
              <h2>Today</h2>

              {status === "loading" ? (
                <div className="doctor-notifications-state">Loading notifications...</div>
              ) : visibleNotifications.length === 0 ? (
                <div className="doctor-notifications-state">No notifications found.</div>
              ) : (
                <div className="doctor-notifications-list">
                  {visibleNotifications.map((item) => {
                    const config = typeConfig[item.type] || typeConfig.notification;
                    const Icon = config.icon;
                    return (
                      <article
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        className={`doctor-notifications-card doctor-notifications-${config.tone} ${item.read ? "is-read" : "is-unread"}`}
                        onClick={() => !item.read && markAsRead(item.id)}
                        onKeyDown={(event) => {
                          if ((event.key === "Enter" || event.key === " ") && !item.read) {
                            event.preventDefault();
                            markAsRead(item.id);
                          }
                        }}
                      >
                        <span className={`doctor-notifications-card-icon doctor-notifications-icon-${config.tone}`}>
                          <Icon size={22} />
                        </span>

                        <div className="doctor-notifications-card-body">
                          <div className="doctor-notifications-title-row">
                            <h3>{item.title}</h3>
                            <span className={`doctor-notifications-badge doctor-notifications-badge-${item.priority}`}>
                              {item.priority}
                            </span>
                          </div>

                          <div className="doctor-notifications-meta-line">
                            {item.patient && (
                              <span>
                                <UserRound size={13} />
                                {item.patient}
                              </span>
                            )}
                            {item.appointmentTime && (
                              <span>
                                <Clock3 size={13} />
                                {formatNotificationTime(item.appointmentTime) === item.appointmentTime
                                  ? item.appointmentTime
                                  : item.appointmentTime}
                              </span>
                            )}
                          </div>

                          {item.type === "message" ? (
                            <p className="doctor-notifications-message-box">"{item.message}"</p>
                          ) : (
                            <p>{item.message}</p>
                          )}

                          <div className="doctor-notifications-actions">
                            {item.actions.map((action) => (
                              <button
                                type="button"
                                key={action}
                                className={action === "Open Case" ? "is-danger" : ""}
                                onClick={(event) => event.stopPropagation()}
                              >
                                {action}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="doctor-notifications-time-wrap">
                          <span>{item.time}</span>
                          {!item.read && <i aria-label="Unread notification" />}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <aside className="doctor-notifications-activity">
            <h2>Today's Activity</h2>
            <div className="doctor-notifications-activity-list">
              {[
                ["Critical Alerts", criticalCount, AlertTriangle, "red"],
                ["Appointments", appointmentCount, CalendarDays, "blue"],
                ["Messages", messageCount, MessageSquareText, "orange"],
              ].map(([label, value, Icon, tone]) => (
                <div className="doctor-notifications-activity-item" key={label}>
                  <span className={`doctor-notifications-icon doctor-notifications-icon-${tone}`}>
                    <Icon size={16} />
                  </span>
                  <p>{label}</p>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            <div className="doctor-notifications-quick-links">
              <span>Quick Links</span>
              <a href="#emergency-protocols">
                <ExternalLink size={15} />
                Emergency Protocols
              </a>
              <a href="#on-call-directory">
                <ExternalLink size={15} />
                On-Call Directory
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
