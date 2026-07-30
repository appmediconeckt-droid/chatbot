import React from "react";
import { FaUsers, FaCheck, FaTimes as FaClose } from "react-icons/fa";
import { getAnonymousUserDisplay } from "../../../../utils/anonymousUser";
import { useCounselorTranslation } from "../../../../i18n/LanguageContext";

export default function RequestModal({
  showRequestModal,
  currentRequest,
  modalCountdown,
  loadingRequests,
  handleAcceptRequest,
  handleRejectRequest,
}) {
  const { t } = useCounselorTranslation();
  if (!showRequestModal || !currentRequest) return null;
  const anonymousUser = getAnonymousUserDisplay({
    ...currentRequest,
    ...(currentRequest.user || currentRequest.patient || currentRequest.from || {}),
  });

  return (
    <div className="couns-request-modal-overlay" onClick={() => {}}>
      <div
        className="couns-request-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="couns-request-modal-header">
          <div className="couns-request-header-left">
            <div className="couns-request-icon">
              <FaUsers />
            </div>
            <div>
              <h3>{t("new_chat_request")}</h3>
              <p className="couns-request-timer">
                {t("auto_closes_in")} {modalCountdown}s
              </p>
            </div>
          </div>
        </div>

        <div className="couns-request-modal-body">
          <div className="couns-request-patient-info">
            <div className="couns-request-patient-main">
              <div className="couns-request-avatar">
                {anonymousUser.avatarUrl ? (
                  <img src={anonymousUser.avatarUrl} alt={anonymousUser.name} />
                ) : (
                  <span>{anonymousUser.avatar}</span>
                )}
              </div>
              <div className="couns-request-patient-name">
                <h4>{anonymousUser.name}</h4>
              </div>
            </div>
            <div className="couns-request-type">
              <span className="couns-request-type-badge">{t("chat_request")}</span>
            </div>
          </div>

          <div className="couns-request-message">
            <p>
              {currentRequest.requestMessage ||
                currentRequest.message ||
                "Would like to start a conversation with you."}
            </p>
          </div>

          <div className="couns-request-meta">
            <span className="couns-request-time">
              {t("requested")}:{" "}
              {new Date(currentRequest.requestedAt).toLocaleTimeString()}
            </span>
          </div>
        </div>

        <div className="couns-request-modal-footer">
          <button
            className="couns-request-btn couns-request-reject"
            onClick={handleRejectRequest}
            disabled={loadingRequests}
          >
            <FaClose />
            {t("reject")}
          </button>
          <button
            className="couns-request-btn couns-request-accept"
            onClick={handleAcceptRequest}
            disabled={loadingRequests}
          >
            <FaCheck />
            {t("accept")}
          </button>
        </div>

        <div className="couns-request-progress">
          <div
            className="couns-request-progress-bar"
            style={{ width: `${(modalCountdown / 10) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
