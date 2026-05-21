import React, { useMemo, useState } from "react";
import {
  FaPhoneAlt,
  FaPhoneSlash,
  FaSpinner,
  FaUserCircle,
} from "react-icons/fa";
import "./IncomingCallModal.css";

const EMOJI_AVATARS = new Set(["👨", "👩", "👤"]);

const normalizeCallType = (callType) => {
  const value = String(callType || "video").toLowerCase();
  if (value === "audio") return "voice";
  if (value === "voice") return "voice";
  return "video";
};

const formatRequestTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const IncomingCallModal = ({
  isOpen,
  onClose,
  callType,
  callerName,
  callerImage,
  callData,
  onAccept,
  onReject,
  fallbackName = "Caller",
}) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const normalizedCallType = normalizeCallType(
    callData?.callType || callData?.type || callType,
  );

  const displayName = useMemo(() => {
    if (callData?.from?.isAnonymous) {
      return typeof callData.from.isAnonymous === "string"
        ? callData.from.isAnonymous
        : "Anonymous User";
    }

    return (
      callData?.from?.fullName ||
      callData?.from?.displayName ||
      callerName ||
      fallbackName
    );
  }, [callData, callerName, fallbackName]);

  const profilePhoto =
    callData?.from?.profilePhoto || callData?.from?.avatar || callerImage;

  const requestedTime = formatRequestTime(
    callData?.requestedAt || callData?.createdAt,
  );

  const requestMessage =
    callData?.requestMessage || `Incoming ${normalizedCallType} call...`;

  const isActionSuccessful = (result) => {
    if (result === undefined) return true;
    if (result === null) return false;

    if (typeof result === "object") {
      return result.success !== false;
    }

    return Boolean(result);
  };

  const handleAccept = async () => {
    if (isAccepting) return;

    setIsAccepting(true);

    try {
      const result = onAccept
        ? await onAccept(callData?.callId, callData)
        : true;

      if (isActionSuccessful(result)) {
        onClose?.();
      }
    } catch (error) {
      console.error("Error accepting call:", error);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    if (isRejecting) return;

    setIsRejecting(true);

    try {
      const result = onReject
        ? await onReject(callData?.callId, callData)
        : true;

      if (isActionSuccessful(result)) {
        onClose?.();
      }
    } catch (error) {
      console.error("Error rejecting call:", error);
    } finally {
      setIsRejecting(false);
    }
  };

  if (!isOpen) return null;

  const isEmojiAvatar =
    typeof profilePhoto === "string" && EMOJI_AVATARS.has(profilePhoto);

  return (
    <div className="ucm-overlay">
      <div
        className={`ucm-modal ${normalizedCallType === "video" ? "ucm-video" : "ucm-voice"}`}
      >
        <div className="ucm-body">
          <div className="ucm-avatar-wrap">
            <div className="ucm-avatar">
              {isEmojiAvatar ? (
                <div className="ucm-emoji-avatar">{profilePhoto}</div>
              ) : profilePhoto ? (
                <img src={profilePhoto} alt={displayName} />
              ) : (
                <FaUserCircle className="ucm-avatar-icon" />
              )}
            </div>
          </div>

          <h3 className="ucm-name">{displayName}</h3>
          <p className="ucm-type">
            {normalizedCallType === "video" ? "📹 Video Call" : "📞 Voice Call"}
          </p>
          {requestedTime && (
            <p className="ucm-time">Received at {requestedTime}</p>
          )}
          <p className="ucm-message">{requestMessage}</p>

          <div className="ucm-actions">
            <button
              className="ucm-btn ucm-btn--reject"
              onClick={handleReject}
              disabled={isRejecting || isAccepting}
            >
              {isRejecting ? (
                <FaSpinner className="ucm-spinning" />
              ) : (
                <FaPhoneSlash />
              )}
              <span>{isRejecting ? "Rejecting..." : "Decline"}</span>
            </button>

            <button
              className="ucm-btn ucm-btn--accept"
              onClick={handleAccept}
              disabled={isAccepting || isRejecting}
            >
              {isAccepting ? (
                <FaSpinner className="ucm-spinning" />
              ) : (
                <FaPhoneAlt />
              )}
              <span>{isAccepting ? "Accepting..." : "Accept"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
