import React, { useEffect, useRef, useState } from "react";
import { FaBell, FaCalendarAlt, FaCheckDouble, FaPhone, FaWallet } from "react-icons/fa";
import { FaMessage } from "react-icons/fa6";
import axiosInstance from "../../../axiosConfig";
import socketService from "../../../services/socketService";
import "./Notifications.css";

const typeIcon = {
  message: <FaMessage />,
  call: <FaPhone />,
  appointment: <FaCalendarAlt />,
  payment: <FaWallet />,
  system: <FaBell />,
};

const relativeTime = (date) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(date).toLocaleDateString("en-IN");
};

const NotificationCenter = ({ className = "" }) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef(null);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/notifications", {
        params: { page: 1, limit: 30 },
      });
      setNotifications(response.data?.notifications || []);
      setUnreadCount(Number(response.data?.unreadCount || 0));
    } catch (error) {
      console.error("Notifications load failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
    let removeSocketListener;
    const handleNewNotification = (notification) => {
      setNotifications((current) => [
        notification,
        ...current.filter((item) => item._id !== notification._id),
      ].slice(0, 30));
      setUnreadCount((count) => count + 1);
    };
    socketService.on("notification:new", handleNewNotification)
      .then((cleanup) => { removeSocketListener = cleanup; })
      .catch((error) => console.error("Notification socket failed:", error));

    return () => removeSocketListener?.();
  }, []);

  useEffect(() => {
    const refresh = () => void loadNotifications();
    window.addEventListener("notifications:changed", refresh);
    return () => window.removeEventListener("notifications:changed", refresh);
  }, []);

  useEffect(() => {
    const closeOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, []);

  const markRead = async (notification) => {
    if (!notification.isRead) {
      await axiosInstance.patch(`/api/notifications/${notification._id}/read`);
      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id ? { ...item, isRead: true, readAt: new Date() } : item,
        ),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    }
  };

  const markAllRead = async () => {
    await axiosInstance.patch("/api/notifications/read-all");
    setNotifications((current) =>
      current.map((item) => ({ ...item, isRead: true, readAt: item.readAt || new Date() })),
    );
    setUnreadCount(0);
  };

  return (
    <div ref={rootRef} className={`notification-center ${className}`}>
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          if (!open) void loadNotifications();
        }}
        className={`notification-trigger ${open ? "is-open" : ""}`}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="notification-count">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-popover">
          <div className="notification-popover-header">
            <div>
              <h3>Notifications</h3>
              <p>{unreadCount ? `${unreadCount} unread` : "You're all caught up"}</p>
            </div>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead} className="notification-mark-all">
                <FaCheckDouble /> Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading && notifications.length === 0 ? (
              <div className="notification-state">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <span className="notification-empty-icon"><FaBell /></span>
                <strong>No notifications yet</strong>
                <p>Messages, calls, appointments and payments will appear here.</p>
              </div>
            ) : notifications.map((notification) => (
              <button
                type="button"
                key={notification._id}
                onClick={() => markRead(notification)}
                className={`notification-item ${notification.isRead ? "is-read" : "is-unread"}`}
              >
                <span className={`notification-type-icon type-${notification.type || "system"}`}>
                  {typeIcon[notification.type] || <FaBell />}
                </span>
                <span className="notification-copy">
                  <span className="notification-title-row">
                    <strong>{notification.title}</strong>
                    {!notification.isRead && <i className="notification-unread-dot" />}
                  </span>
                  <span className="notification-message">{notification.message}</span>
                  <span className="notification-time">{relativeTime(notification.createdAt)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
