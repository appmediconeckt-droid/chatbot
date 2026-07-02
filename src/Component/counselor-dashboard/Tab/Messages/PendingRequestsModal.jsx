import React, { useState } from "react";
import { FaTimes, FaCheck, FaTrash, FaBell } from "react-icons/fa";
import { getAnonymousUserDisplay } from "../../../../utils/anonymousUser";
import ConfirmActionModal from "./ConfirmActionModal";
import "./PendingRequestsModal.css";

export default function PendingRequestsModal({
  isOpen,
  requests,
  onClose,
  onAccept,
  onReject,
  loading,
}) {
  const [processingId, setProcessingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    action: null,
    request: null,
  });

  if (!isOpen) return null;

  const openConfirmModal = (action, request) => {
    setConfirmModal({
      isOpen: true,
      action,
      request,
    });
  };

  const handleConfirm = async () => {
    const { action, request } = confirmModal;
    setProcessingId(request.id);

    try {
      if (action === "accept") {
        await onAccept(request.id);
      } else {
        await onReject(request.id);
      }
    } finally {
      setProcessingId(null);
      setConfirmModal({ isOpen: false, action: null, request: null });
    }
  };

  const handleCancelConfirm = () => {
    setConfirmModal({ isOpen: false, action: null, request: null });
  };

  return (
    <div className="pending-requests-modal-overlay" onClick={onClose}>
      <div
        className="pending-requests-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pending-requests-modal-header">
          <div className="header-left">
            <FaBell className="header-icon" />
            <div>
              <h2>Pending Requests</h2>
              <p className="pending-request-count">{requests.length} waiting for response</p>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="pending-requests-modal-body">
          {requests.length === 0 ? (
            <div className="pending-requests-empty">
              <span className="empty-icon">✓</span>
              <p>No pending requests</p>
            </div>
          ) : (
            <div className="pending-requests-list">
              {requests.map((request) => {
                const anonymousUser = getAnonymousUserDisplay({
                  ...request.user,
                  userId: request.user?.id,
                });

                return (
                  <div key={request.id} className="pending-request-item">
                    <div className="pending-request-avatar">
                      {anonymousUser.avatarUrl ? (
                        <img
                          src={anonymousUser.avatarUrl}
                          alt={anonymousUser.name}
                        />
                      ) : (
                        <span
                          className="avatar-initials"
                          style={{
                            backgroundColor: getAvatarColor(
                              anonymousUser.name
                            ),
                          }}
                        >
                          {anonymousUser.avatar}
                        </span>
                      )}
                    </div>

                    <div className="pending-request-info">
                      <div className="request-header">
                        <h4>{anonymousUser.name}</h4>
                        <span className="request-time">
                          {formatRequestTime(request.requestedAt)}
                        </span>
                      </div>
                      <p className="pending-request-message">
                        {request.requestMessage}
                      </p>
                    </div>

                    <div className="pending-request-actions">
                      <button
                        className="request-action-btn request-reject-btn"
                        onClick={() => openConfirmModal("reject", request)}
                        disabled={processingId !== null}
                        title="Reject request"
                      >
                        {processingId === request.id ? (
                          <>
                            <span className="spinner"></span>
                            <span>Rejecting...</span>
                          </>
                        ) : (
                          <>
                            <FaTrash />
                            <span>Reject</span>
                          </>
                        )}
                      </button>
                      <button
                        className="request-action-btn request-accept-btn"
                        onClick={() => openConfirmModal("accept", request)}
                        disabled={processingId !== null}
                        title="Accept request"
                      >
                        {processingId === request.id ? (
                          <>
                            <span className="spinner"></span>
                            <span>Accepting...</span>
                          </>
                        ) : (
                          <>
                            <FaCheck />
                            <span>Accept</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmActionModal
        isOpen={confirmModal.isOpen}
        action={confirmModal.action}
        userName={
          confirmModal.request
            ? getAnonymousUserDisplay(confirmModal.request.user).name
            : ""
        }
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
        loading={processingId === confirmModal.request?.id}
      />
    </div>
  );
}

function formatRequestTime(timestamp) {
  const now = new Date();
  const requestTime = new Date(timestamp);
  const diffMs = now - requestTime;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return requestTime.toLocaleDateString();
}

function getAvatarColor(name) {
  const colors = [
    "#4f46e5",
    "#0891b2",
    "#059669",
    "#b45309",
    "#c2410c",
    "#7e22ce",
    "#be123c",
    "#1e40af",
    "#0f766e",
    "#6b21a8",
  ];

  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
