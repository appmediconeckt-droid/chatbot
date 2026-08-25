import React from "react";
import { FaCheck, FaTimes, FaExclamationCircle } from "react-icons/fa";
import "./ConfirmActionModal.css";
import { useCounselorTranslation } from "../../../../i18n/LanguageContext";

export default function ConfirmActionModal({
  isOpen,
  action,
  userName,
  onConfirm,
  onCancel,
  loading,
}) {
  const { t } = useCounselorTranslation();
  if (!isOpen) return null;

  const isAccept = action === "accept";

  return (
    <div className="confirm-action-overlay" onClick={onCancel}>
      <div
        className="confirm-action-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`confirm-action-icon ${isAccept ? "accept" : "reject"}`}>
          {isAccept ? <FaCheck /> : <FaTimes />}
        </div>

        <h3 className="confirm-action-title">
          {isAccept ? t("accept_request") : t("reject_request")}
        </h3>

        <p className="confirm-action-message">
          {isAccept ? (
            <>
              {t("accept_request_confirmation")} <strong>{userName}</strong>
            </>
          ) : (
            <>
              {t("reject_request_confirmation")} <strong>{userName}</strong>
            </>
          )}
        </p>

        <div className="confirm-action-buttons">
          <button
            className="confirm-cancel-btn"
            onClick={onCancel}
            disabled={loading}
          >
            {t("cancel")}
          </button>
          <button
            className={`confirm-proceed-btn ${
              isAccept ? "accept-btn" : "reject-btn"
            }`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                {isAccept ? t("accepting") : t("rejecting")}
              </>
            ) : (
              <>
                {isAccept ? <FaCheck /> : <FaTimes />}
                {isAccept ? t("accept") : t("reject")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
