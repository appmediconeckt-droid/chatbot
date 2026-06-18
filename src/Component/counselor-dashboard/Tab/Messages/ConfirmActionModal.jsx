import React from "react";
import { FaCheck, FaTimes, FaExclamationCircle } from "react-icons/fa";
import "./ConfirmActionModal.css";

export default function ConfirmActionModal({
  isOpen,
  action,
  userName,
  onConfirm,
  onCancel,
  loading,
}) {
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
          {isAccept ? "Accept Request?" : "Reject Request?"}
        </h3>

        <p className="confirm-action-message">
          {isAccept ? (
            <>
              You are about to <strong>accept</strong> the chat request from{" "}
              <strong>{userName}</strong>. The conversation will start
              immediately.
            </>
          ) : (
            <>
              You are about to <strong>reject</strong> the request from{" "}
              <strong>{userName}</strong>. They will be notified.
            </>
          )}
        </p>

        <div className="confirm-action-buttons">
          <button
            className="confirm-cancel-btn"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
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
                {isAccept ? "Accepting..." : "Rejecting..."}
              </>
            ) : (
              <>
                {isAccept ? <FaCheck /> : <FaTimes />}
                {isAccept ? "Yes, Accept" : "Yes, Reject"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
