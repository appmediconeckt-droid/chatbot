import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";

export default function LogoutModal({
  showLogoutConfirm,
  setShowLogoutConfirm,
  handleLogout,
}) {
  if (!showLogoutConfirm) return null;

  return (
    <div
      className="couns-modal-overlay"
      onClick={() => setShowLogoutConfirm(false)}
    >
      <div
        className="couns-modal-content small"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="couns-logout-modal">
          <FaExclamationTriangle className="couns-warning-icon" />
          <h3>Confirm Logout</h3>
          <p>Are you sure you want to logout?</p>
          <div className="couns-modal-actions">
            <button
              className="couns-cancel-btn"
              onClick={() => setShowLogoutConfirm(false)}
            >
              Cancel
            </button>
            <button className="couns-confirm-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
