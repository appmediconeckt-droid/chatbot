import React, { useEffect, useState } from "react";
import { FaBell, FaCalendarAlt, FaCheck, FaCommentAlt, FaTrash } from "react-icons/fa";
import axiosInstance from "../../../axiosConfig";
import socketService from "../../../services/socketService";
import { useCounselorTranslation, useUserTranslation, useCounselorApiTranslation, useUserApiTranslation } from "../../../i18n/LanguageContext";
import "./Notifications.css";

const icons = {
  appointment: <FaCalendarAlt />,
  message: <FaCommentAlt />,
  chat: <FaCommentAlt />,
  ai: <i className="fas fa-robot" aria-hidden="true" />,
};

const NotificationsPage = ({ role = "user" }) => {
  const isCounselor = role === "counselor" || role === "counsellor";
  const userTranslation = useUserTranslation();
  const counselorTranslation = useCounselorTranslation();
  const userApiTranslation = useUserApiTranslation();
  const counselorApiTranslation = useCounselorApiTranslation();
  const { t, lang } = isCounselor ? counselorTranslation : userTranslation;
  const { translate } = isCounselor ? counselorApiTranslation : userApiTranslation;
  const filters = [
    { value: "all", label: t("all") },
    { value: "unread", label: t("unread") },
    { value: "appointment", label: t("appointments") },
    { value: "message", label: t("chats") },
  ];
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
      const items = response.data?.notifications || [];
      const localizedItems = lang === "en-US" ? items : await Promise.all(items.map(async (item) => ({
        ...item,
        title: item.title ? await translate(item.title) : item.title,
        message: item.message ? await translate(item.message) : item.message,
      })));
      setNotifications(localizedItems);
      setUnreadCount(Number(response.data?.unreadCount || 0));
    } catch (error) {
      console.error("Notifications page load failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [type, unreadOnly, lang]);

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

  const selectFilter = (value) => {
    if (value === "all") {
      setType("");
      setUnreadOnly(false);
      return;
    }
    if (value === "unread") {
      setType("");
      setUnreadOnly(true);
      return;
    }
    setUnreadOnly(false);
    setType(value);
  };

  const activeFilter = unreadOnly ? "unread" : (type || "all");

  return (
    <div className={`notifications-page ${isCounselor ? "notifications-page--counselor" : ""}`}>
      <header className="notifications-hero">
        <div>
          <h1>{t("notifications")}</h1>
          <p>{t("manage_reminders")}</p>
        </div>
        <button type="button" onClick={markAll} className="notifications-primary-action" disabled={unreadCount === 0}>
          {t("mark_all_read")}
        </button>
      </header>

      <div className="notifications-toolbar">
        <div className="notification-filter-group">
        {filters.map((filter) => (
          <button key={filter.label} type="button" onClick={() => selectFilter(filter.value)} className={`notification-filter ${activeFilter === filter.value ? "active" : ""}`}>
            {filter.label}
          </button>
        ))}
        </div>
      </div>

      <section className="notifications-panel">
        {loading ? (
          <div className="p-12 text-center text-slate-500">{t("loading_notifications")}</div>
        ) : notifications.length === 0 ? (
          <div className="p-14 text-center">
            <FaBell className="mx-auto mb-3 text-4xl text-slate-300" />
            <h2 className="font-bold text-slate-700">{t("no_notifications_found")}</h2>
            <p className="mt-1 text-sm text-slate-500">{t("notification_updates_hint")}</p>
          </div>
        ) : notifications.map((notification) => (
          <article key={notification._id} className={`notifications-page-item ${notification.isRead ? "is-read" : "is-unread"}`}>
            <span className={`notifications-page-item-icon type-${notification.type || "system"}`}>
              {icons[notification.type] || <FaBell />}
            </span>
            <div className="notifications-page-item-copy">
              <div className="notifications-page-item-heading">
                <h3>{notification.title}</h3>
              </div>
              <p>{notification.message}</p>
              {!notification.isRead && (
                <button type="button" onClick={() => markRead(notification._id)} className="notification-inline-action">
                  <FaCheck /> {t("mark_as_read")}
                </button>
              )}
            </div>
            <time className="notifications-page-item-time">{new Date(notification.createdAt).toLocaleString(lang || "en-IN")}</time>
            {!notification.isRead && <span className="notifications-page-unread-dot" aria-label={t("unread")} />}
            <div className="notification-item-actions">
              <button type="button" onClick={() => remove(notification._id)} className="notification-action-delete" title={t("notification.delete")}><FaTrash /></button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};

export default NotificationsPage;
