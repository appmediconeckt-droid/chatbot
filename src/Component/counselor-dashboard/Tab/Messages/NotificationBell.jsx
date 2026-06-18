import React, { useState } from "react";
import { FaBell } from "react-icons/fa";
import "./NotificationBell.css";

export default function NotificationBell({ pendingCount, onClick }) {
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
      title={`${pendingCount} pending request${pendingCount !== 1 ? "s" : ""}`}
    >
      <FaBell />
      {pendingCount > 0 && (
        <span className="notification-badge">{pendingCount > 99 ? "99+" : pendingCount}</span>
      )}
    </button>
  );
}
