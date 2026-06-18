import React from "react";
import { FaTimes, FaCheck } from "react-icons/fa";
import "./PhotoPreviewModal.css";

export default function PhotoPreviewModal({
  isOpen,
  photoSrc,
  onSend,
  onCancel,
  loading,
}) {
  if (!isOpen || !photoSrc) return null;

  return (
    <div className="photo-preview-overlay" onClick={onCancel}>
      <div
        className="photo-preview-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="photo-preview-header">
          <h3>Photo Preview</h3>
          <button className="photo-preview-close" onClick={onCancel}>
            <FaTimes />
          </button>
        </div>

        <div className="photo-preview-content">
          <img src={photoSrc} alt="Preview" className="photo-preview-img" />
        </div>

        <div className="photo-preview-actions">
          <button
            className="photo-btn cancel-btn"
            onClick={onCancel}
            disabled={loading}
          >
            <FaTimes />
            Retake
          </button>
          <button
            className="photo-btn send-btn"
            onClick={onSend}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Sending...
              </>
            ) : (
              <>
                <FaCheck />
                Send Photo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
