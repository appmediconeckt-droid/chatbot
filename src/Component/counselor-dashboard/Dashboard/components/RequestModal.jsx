import React from "react";
import { FaUsers, FaCheck, FaTimes as FaClose } from "react-icons/fa";

export default function RequestModal({
  showRequestModal,
  currentRequest,
  modalCountdown,
  loadingRequests,
  handleAcceptRequest,
  handleRejectRequest,
}) {
  if (!showRequestModal || !currentRequest) return null;

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
              <h3>New Chat Request</h3>
              <p className="couns-request-timer">
                Auto-closes in {modalCountdown}s
              </p>
            </div>
          </div>
        </div>

        <div className="couns-request-modal-body">
          <div className="couns-request-patient-info">
            <div className="couns-request-patient-name">
              <h4>
                {currentRequest.user?.anonymous ||
                  currentRequest.patientName ||
                  "Unknown User"}
              </h4>
            </div>
            <div className="couns-request-type">
              <span className="couns-request-type-badge">Chat Request</span>
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
              Requested:{" "}
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
            Reject
          </button>
          <button
            className="couns-request-btn couns-request-accept"
            onClick={handleAcceptRequest}
            disabled={loadingRequests}
          >
            <FaCheck />
            Accept
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
