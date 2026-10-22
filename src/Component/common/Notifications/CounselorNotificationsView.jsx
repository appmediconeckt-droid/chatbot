import React from "react";
import { FaBell, FaCalendarAlt, FaCheck, FaCommentDots, FaRegComment, FaPhoneAlt, FaRegCircle, FaThLarge, FaTrash, FaListUl, FaPlus } from "react-icons/fa";
import "./CounselorNotificationsView.css";

const categories = {
  message: { label: "Chat", icon: FaCommentDots, action: "View Chat", actionIcon: FaRegComment },
  chat: { label: "Chat", icon: FaCommentDots, action: "View Chat", actionIcon: FaRegComment },
  request: { label: "Chat", icon: FaCommentDots, action: "View Chat", actionIcon: FaRegComment },
  call: { label: "Call", icon: FaPhoneAlt, action: "Call Now", actionIcon: FaPhoneAlt },
  appointment: { label: "Appointment", icon: FaCalendarAlt, action: "Review Appointment", actionIcon: FaCalendarAlt },
  reminder: { label: "Reminder", icon: FaBell, action: "View Details", actionIcon: FaListUl },
};

function NotificationLeaves() {
  return <svg className="cn-leaves" viewBox="0 0 340 150" fill="none" aria-hidden="true">
    <defs><linearGradient id="cn-leaf" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#b8e6ef" /><stop offset="1" stopColor="#3da2b0" /></linearGradient></defs>
    <circle cx="110" cy="107" r="78" fill="#e0efff" /><circle cx="213" cy="135" r="72" fill="#e9f4ff" />
    <g opacity=".8" stroke="#77b8c7" strokeWidth="1.2">
      <path d="M241 153 Q220 95 218 27 M233 129Q194 110 170 77 M235 127Q266 104 283 79 M222 77Q246 59 246 40" />
      <path d="M218 85C190 67 197 27 210 8C229 16 239 57 218 85Z" fill="url(#cn-leaf)" />
      <path d="M219 106C184 110 166 77 168 57C194 54 217 77 219 106Z" fill="url(#cn-leaf)" />
      <path d="M235 128C239 91 271 73 293 78C290 106 268 129 235 128Z" fill="url(#cn-leaf)" />
      <path d="M227 90C224 65 239 42 257 38C268 59 252 85 227 90Z" fill="url(#cn-leaf)" />
      <path d="M227 145C199 125 176 132 165 145Z" fill="#6dbeb7" />
      <path d="M148 151Q134 119 121 103 M138 136C105 139 90 115 96 98C118 100 137 117 138 136Z M139 138C134 114 148 93 162 95C171 117 158 135 139 138Z" fill="url(#cn-leaf)" />
      <path d="M91 150C66 139 57 119 66 109C84 111 94 134 91 150Z M103 149C93 129 101 113 113 110C128 125 116 143 103 149Z" fill="#c0e7ed" />
    </g>
  </svg>;
}

export default function CounselorNotificationsView({ t, lang, notifications, loading, unreadCount, activeFilter, onFilter, onMarkRead, onMarkAll, onRemove, onOpen }) {
  const filters = [
    ["all", "all", FaThLarge], ["unread", "unread", FaRegCircle],
    ["appointment", "appointments", FaCalendarAlt], ["message", "chats", FaRegComment], ["call", "Calls", FaPhoneAlt],
  ];
  return <div className="counselor-notifications">
    <header className="cn-hero">
      <NotificationLeaves />
      <div className="cn-hero-copy"><h1>{t("notifications")}</h1><p>{t("Manage your reminders, chats, appointments, and updates")}</p></div>
      <button type="button" className="cn-mark-all" disabled={!unreadCount} onClick={onMarkAll}><FaCheck />{t("mark_all_read")}</button>
    </header>
    <nav className="cn-filters" aria-label={t("Notification filters")}>
      {filters.map(([value, label, icon]) => <button type="button" key={value} aria-pressed={activeFilter === value} className={`cn-filter ${activeFilter === value ? "active" : ""}`} onClick={() => onFilter(value)}>{React.createElement(icon)}{t(label)}{value === "unread" && unreadCount > 0 && <span className="cn-unread-badge" />}</button>)}
    </nav>
    <section className="cn-list" aria-busy={loading} aria-label={t("notifications")}>
      {loading ? <div className="cn-empty" role="status">{t("loading_notifications")}</div> : !notifications.length ? <div className="cn-empty"><FaBell /><h2>{t("no_notifications_found")}</h2><p>{t("notification_updates_hint")}</p></div> : notifications.map((item) => {
        const kind = item.displayKind || item.type;
        const category = categories[kind] || { label: item.type || "Update", icon: FaBell, action: "View Details", actionIcon: FaListUl };
        return <article className={`cn-row cn-kind-${kind}`} key={item._id}>
          <div className="cn-type-icon">{React.createElement(category.icon)}{kind === "request" && <span><FaPlus /></span>}</div>
          <div className="cn-copy"><div className="cn-title"><h3>{item.title}</h3><span className="cn-type-pill">{t(category.label)}</span></div><p>{item.message}</p></div>
          <div className="cn-row-meta"><time dateTime={item.createdAt}><span className={`cn-status-dot ${item.isRead ? "read" : ""}`} aria-label={t(item.isRead ? "Read" : "unread")} />{new Date(item.createdAt).toLocaleString(lang || "en-IN")}</time>
            <div className="cn-actions">{!item.isRead && <button type="button" className="cn-read" onClick={() => onMarkRead(item._id)}><FaCheck />{t("mark_as_read")}</button>}
              {onOpen && <button type="button" className="cn-open" onClick={() => onOpen(item)}>{React.createElement(category.actionIcon)}{t(category.action)}</button>}
              <button type="button" className="cn-delete" aria-label={t("notification.delete")} title={t("notification.delete")} onClick={() => onRemove(item._id)}><FaTrash /></button>
            </div>
          </div>
        </article>;
      })}
    </section>
  </div>;
}
