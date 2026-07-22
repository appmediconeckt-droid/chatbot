import React, { useEffect, useState } from "react";
import { FaBell, FaCalendarAlt, FaCheck, FaCheckDouble, FaTrash, FaWallet } from "react-icons/fa";
import axiosInstance from "../../../axiosConfig";
import socketService from "../../../services/socketService";
import "./Notifications.css";

const icons = {
  appointment: <FaCalendarAlt />,
  payment: <FaWallet />,
};

const filters = [
  { value: "", label: "All", icon: <FaBell /> },
  { value: "appointment", label: "Appointments", icon: <FaCalendarAlt /> },
  { value: "payment", label: "Payments", icon: <FaWallet /> },
];

const NotificationsPage = ({ role = "user" }) => {
  const isCounselor = role === "counselor" || role === "counsellor";
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [type, setType] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/notifications", {
        params: { page: 1, limit: 100, ...(type ? { type } : {}), ...(unreadOnly ? { unread: true } : {}) },
      });
      setNotifications(response.data?.notifications || []);
      setUnreadCount(Number(response.data?.unreadCount || 0));
    } catch (error) {
      console.error("Notifications page load failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [type, unreadOnly]);

  useEffect(() => {
    let cleanup;
    socketService.on("notification:new", () => void load())
      .then((remove) => { cleanup = remove; })
      .catch((error) => console.error("Notification page socket failed:", error));
    return () => cleanup?.();
  }, [type, unreadOnly]);

  const changed = () => window.dispatchEvent(new Event("notifications:changed"));

  const markRead = async (id) => {
    await axiosInstance.patch(`/api/notifications/${id}/read`);
    setNotifications((items) => items.map((item) => item._id === id ? { ...item, isRead: true } : item));
    setUnreadCount((count) => Math.max(0, count - 1));
    changed();
  };

  const markAll = async () => {
    await axiosInstance.patch("/api/notifications/read-all");
    setNotifications((items) => unreadOnly ? [] : items.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
    changed();
  };

  const remove = async (id) => {
    await axiosInstance.delete(`/api/notifications/${id}`);
    const removed = notifications.find((item) => item._id === id);
    setNotifications((items) => items.filter((item) => item._id !== id));
    if (removed && !removed.isRead) setUnreadCount((count) => Math.max(0, count - 1));
    changed();
  };

  return (
    <div className={`notifications-page ${isCounselor ? "notifications-page--counselor" : ""}`}>
      <header className="notifications-hero">
        <div className="notifications-hero-copy">
          <span className="notifications-hero-icon"><FaBell /></span>
          <div>
            <span className="notifications-eyebrow">{isCounselor ? "Counselor activity centre" : "Activity centre"}</span>
            <h1>Notifications</h1>
            <p>{isCounselor
              ? "Track appointment requests and payment updates."
              : "Stay updated with appointment requests and payments."}</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button type="button" onClick={markAll} className="notifications-primary-action">
            <FaCheckDouble /> Mark all as read
          </button>
        )}
      </header>

      <div className="notifications-summary">
        <div className="notification-summary-card summary-total">
          <span className="summary-icon"><FaBell /></span>
          <span><strong>{notifications.length}</strong><small>Showing now</small></span>
        </div>
        <div className="notification-summary-card summary-unread">
          <span className="summary-icon"><FaBell /></span>
          <span><strong>{unreadCount}</strong><small>Unread updates</small></span>
        </div>
        <div className="notification-summary-card summary-read">
          <span className="summary-icon"><FaCheckDouble /></span>
          <span><strong>{Math.max(0, notifications.length - unreadCount)}</strong><small>Read updates</small></span>
        </div>
      </div>

      <div className="notifications-toolbar">
        <div className="notification-filter-group">
        {filters.map((filter) => (
          <button key={filter.label} type="button" onClick={() => setType(filter.value)} className={`notification-filter ${type === filter.value ? "active" : ""}`}>
            <span>{filter.icon}</span>{filter.label}
          </button>
        ))}
        </div>
        <label className="notifications-unread-toggle">
          <input type="checkbox" checked={unreadOnly} onChange={(event) => setUnreadOnly(event.target.checked)} className="rounded border-slate-300 text-indigo-600" />
          Unread only ({unreadCount})
        </label>
      </div>

      <section className="notifications-panel">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-14 text-center">
            <FaBell className="mx-auto mb-3 text-4xl text-slate-300" />
            <h2 className="font-bold text-slate-700">No notifications found</h2>
            <p className="mt-1 text-sm text-slate-500">New updates will appear here automatically.</p>
          </div>
        ) : notifications.map((notification) => (
          <article key={notification._id} className={`notifications-page-item ${notification.isRead ? "is-read" : "is-unread"}`}>
            <span className={`notifications-page-item-icon type-${notification.type || "system"}`}>
              {icons[notification.type] || <FaBell />}
            </span>
            <div className="notifications-page-item-copy">
              <div className="notifications-page-item-heading">
                <h3>{notification.title}</h3>
                <span className={`notification-type-pill type-${notification.type || "system"}`}>{notification.type}</span>
                {!notification.isRead && <span className="new-notification-pill">New</span>}
              </div>
              <p>{notification.message}</p>
              <time>{new Date(notification.createdAt).toLocaleString("en-IN")}</time>
            </div>
            <div className="notification-item-actions">
              {!notification.isRead && (
                <button type="button" onClick={() => markRead(notification._id)} className="notification-action-read" title="Mark as read" aria-label="Mark notification as read">
                  <FaCheck />
                  <span>Mark as read</span>
                </button>
              )}
              <button type="button" onClick={() => remove(notification._id)} className="notification-action-delete" title="Delete notification"><FaTrash /></button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};

export default NotificationsPage;
