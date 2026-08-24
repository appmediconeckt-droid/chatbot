import React, { useState } from "react";
import { FaBell } from "react-icons/fa";
import { useCounselorTranslation } from "../../../../i18n/LanguageContext";
import "./NotificationBell.css";

export default function NotificationBell({ pendingCount, onClick }) {
  const { t } = useCounselorTranslation();
  const [isRinging, setIsRinging] = useState(false);

  const handleClick = () => {
    setIsRinging(true);
    setTimeout(() => setIsRinging(false), 600);
    onClick();
  };

  return (
    <button
      className={`notification-bell ${isRinging ? "ringing" : ""}`}
      onClick={handleClick}
      title={`${pendingCount} ${t("notification.pendingRequests")}`}
      aria-label={`${pendingCount} ${t("notification.pendingChatRequests")}`}
    >
      <span className="notification-bell-icon"><FaBell /></span>
      {pendingCount > 0 && (
        <span className="notification-badge">{pendingCount > 99 ? "99+" : pendingCount}</span>
      )}
    </button>
  );
}
