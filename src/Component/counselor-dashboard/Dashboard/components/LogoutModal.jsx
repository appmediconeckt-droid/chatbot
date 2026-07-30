import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import { useCounselorTranslation } from "../../../../i18n/LanguageContext";

export default function LogoutModal({
  showLogoutConfirm,
  setShowLogoutConfirm,
  handleLogout,
}) {
  const { t } = useCounselorTranslation();
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
          <h3>{t("confirm_logout")}</h3>
          <p>{t("settings.logoutConfirm")}</p>
          <div className="couns-modal-actions">
            <button
              className="couns-cancel-btn"
              onClick={() => setShowLogoutConfirm(false)}
            >
              {t("common.cancel")}
            </button>
            <button className="couns-confirm-btn" onClick={handleLogout}>
              {t("common.logout")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
