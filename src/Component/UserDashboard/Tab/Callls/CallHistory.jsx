import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

import "./CallHistory.css";
import VideoCallModal from "../CallModal/VideoCallModal";
import { API_BASE_URL } from "../../../../axiosConfig";
import { useUserTranslation } from "../../../../i18n/LanguageContext";
import {
  getAnonymousUserAvatar,
  getAnonymousUserAvatarUrl,
  getAnonymousUserDisplay,
} from "../../../../utils/anonymousUser";

const FALLBACK_AVATAR = "👤";

const normalizeRole = (role) => {
  const normalized = String(role || "")
    .trim()
    .toLowerCase();

  if (normalized === "counselor") {
    return "counsellor";
  }

  return normalized || "user";
};

const normalizeCallType = (value) => {
  const normalized = String(value || "video")
    .trim()
    .toLowerCase();
  if (normalized === "audio" || normalized === "voice") {
    return "voice";
  }
  return "video";
};

const isImageUrl = (value) =>
  typeof value === "string" && /^https?:\/\//i.test(value);

const getFirstText = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
};

const getApiParticipantDisplay = (call, currentUserType) => {
  const role = String(call?.role || "")
    .trim()
    .toLowerCase();
  const currentUserIsReceiver = role === "receiver";
  const currentUserIsCounsellor = normalizeRole(currentUserType) === "counsellor";

  const selfName = currentUserIsReceiver ? call?.receiverName : call?.callerName;
  const otherAnonymousName = currentUserIsReceiver
    ? call?.callerAnonymousName
    : call?.receiverAnonymousName;
  const otherName = currentUserIsReceiver ? call?.callerName : call?.receiverName;

  const otherActualName = getFirstText(otherName, call?.with, selfName);
  const otherAnonymousDisplay = getFirstText(
    otherAnonymousName,
    call?.anonymousName,
    call?.withAnonymousName,
    otherActualName,
  );

  return {
    anonymousName: currentUserIsCounsellor ? otherAnonymousDisplay : "",
    displayName: currentUserIsCounsellor ? otherAnonymousDisplay : otherActualName,
    profilePhoto: getFirstText(
      call?.withProfilePhoto,
      call?.callerProfilePhoto,
      call?.receiverProfilePhoto,
      call?.profilePhoto,
    ),
  };
};

const formatDateLabel = (value) => {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const startOfInput = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.floor((startOfToday - startOfInput) / 86400000);

  if (diffDays === 0) {
    return "Today";
  }

  if (diffDays === 1) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
  });
};

const formatCallDuration = (seconds) => {
  const total = Math.max(0, Number(seconds) || 0);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hrs > 0) {
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const getCallDirection = (call) => {
  const role = String(call?.role || "")
    .trim()
    .toLowerCase();
  return role === "receiver" ? "incoming" : "outgoing";
};

const isMissedCall = (call) => {
  const status = String(call?.status || "")
    .trim()
    .toLowerCase();
  return status === "missed" || status === "rejected" || status === "cancelled";
};

const CallHistory = ({ currentUser }) => {
  const { t } = useUserTranslation();
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [activeCallMode, setActiveCallMode] = useState("video");
  const [selectedCall, setSelectedCall] = useState(null);
  const [callsData, setCallsData] = useState([]);
  const [isLoadingCalls, setIsLoadingCalls] = useState(false);
  const [callError, setCallError] = useState("");

  const currentUserId = String(
    currentUser?.id || localStorage.getItem("userId") || "",
  ).trim();
  const currentUserType = normalizeRole(
    currentUser?.role || localStorage.getItem("userRole") || "user",
  );

  const fetchCallHistory = useCallback(async () => {
    if (!currentUserId) {
      setCallsData([]);
      setCallError("Unable to load call history. User not found.");
      return;
    }

    setIsLoadingCalls(true);
    setCallError("");

    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");

      const response = await axios.get(
        `${API_BASE_URL}/api/video/calls/history/${currentUserId}`,
        {
          params: { page: 1, limit: 100 },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );

      const historyItems = Array.isArray(response.data?.history)
        ? response.data.history
        : [];

      const normalizedCalls = historyItems.map((call, index) => {
          const timestamp = call.timestamp || call.createdAt;
          const dateValue = timestamp ? new Date(timestamp) : null;
          const normalizedType = normalizeCallType(call.type);
          const direction = getCallDirection(call);
          const missed = isMissedCall(call);
          const counterPartyType = normalizeRole(call.withType);
          const apiParticipant = getApiParticipantDisplay(call, currentUserType);

          const counterPartySource = {
            ...call,
            ...(typeof call.with === "object" && call.with ? call.with : {}),
            ...(call.otherParty || {}),
            ...(call.counterParty || {}),
            anonymousName: apiParticipant.anonymousName,
            anonymous: apiParticipant.anonymousName,
            displayName: apiParticipant.displayName,
            name: apiParticipant.displayName,
            profilePhoto: apiParticipant.profilePhoto,
            avatarUrl: apiParticipant.profilePhoto,
            user: {
              ...(call.user || {}),
              ...(call.withUser || {}),
            },
            patient: {
              ...(call.patient || {}),
              ...(call.withPatient || {}),
            },
            otherParty: {
              ...(call.otherParty || {}),
              ...(typeof call.with === "object" && call.with ? call.with : {}),
              ...(call.counterParty || {}),
              anonymousName: apiParticipant.anonymousName,
              anonymous: apiParticipant.anonymousName,
              displayName: apiParticipant.displayName,
              name: apiParticipant.displayName,
              profilePhoto: apiParticipant.profilePhoto,
              avatarUrl: apiParticipant.profilePhoto,
            },
          };

          const anonymousUser = getAnonymousUserDisplay(counterPartySource);
          const displayName =
            apiParticipant.displayName ||
            (currentUserType === "counsellor" ? anonymousUser.name : "") ||
            "Anonymous User";
          const anonymousAvatar =
            anonymousUser.avatar || getAnonymousUserAvatar(counterPartySource);
          const anonymousAvatarUrl =
            apiParticipant.profilePhoto ||
            anonymousUser.avatarUrl ||
            getAnonymousUserAvatarUrl(counterPartySource);

          return {
            id: call.id || `${timestamp || "call"}_${index}`,
            callId: call.id,
            roomId: call.roomId,
            name: displayName,
            avatar: anonymousAvatar,
            avatarUrl: anonymousAvatarUrl,
            gender: anonymousUser.gender,
            type: normalizedType,
            status: missed ? "missed" : direction,
            rawStatus: String(call.status || "").toLowerCase(),
            date: formatDateLabel(timestamp),
            time:
              dateValue && !Number.isNaN(dateValue.getTime())
                ? dateValue.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "--:--",
            duration:
              Number(call.duration) > 0
                ? formatCallDuration(call.duration)
                : null,
            profilePic: anonymousAvatarUrl || anonymousAvatar,
            missed,
            counterPartyId: call.withId,
            counterPartyType,
            role: call.role,
            timestamp,
            apiCallData: call,
          };
      });

      setCallsData(normalizedCalls);
    } catch (error) {
      console.error("Error loading call history:", error);
      setCallError(
        error.response?.data?.error ||
          "Failed to load call history. Please try again.",
      );
      setCallsData([]);
    } finally {
      setIsLoadingCalls(false);
    }
  }, [currentUserId, currentUserType]);

  useEffect(() => {
    void fetchCallHistory();
  }, [fetchCallHistory]);

  const startCallFromHistory = useCallback(
    async (callMode, callEntry = null) => {
      const resolvedCallMode = normalizeCallType(callMode);
      const receiverId = String(callEntry?.counterPartyId || "").trim();
      const receiverType = normalizeRole(callEntry?.counterPartyType || "");

      if (!receiverId) {
        setCallError("Select a previous call entry to start a new call.");
        return;
      }

      try {
        setCallError("");
        const token =
          localStorage.getItem("token") || localStorage.getItem("accessToken");

        const response = await axios.post(
          `${API_BASE_URL}/api/video/calls/initiate`,
          {
            initiatorId: currentUserId,
            initiatorType: currentUserType,
            receiverId,
            receiverType: receiverType || "counsellor",
            callType: resolvedCallMode === "voice" ? "audio" : "video",
          },
          {
            headers: token
              ? { Authorization: `Bearer ${token}` }
              : { "Content-Type": "application/json" },
          },
        );

        if (!response.data?.success) {
          throw new Error(response.data?.error || "Failed to start call.");
        }

        const callData = response.data.callData || {};

        // Anonymous display - reuse the anonymous name/avatar from the list entry.
        const anonymousName = callEntry?.name || "Anonymous User";

        const safeAnonymousAvatar = callEntry?.avatar || FALLBACK_AVATAR;

        setSelectedCall({
          id: callData.id || response.data.callId,
          callId: response.data.callId,
          roomId: response.data.roomId,
          name: anonymousName,
          type: resolvedCallMode,
          callType: resolvedCallMode,
          profilePic: callEntry?.avatarUrl || safeAnonymousAvatar,
          status: response.data.status || "ringing",
          apiCallData: callData,
          initiator: callData.initiator,
          receiver: callData.receiver,
        });

        setActiveCallMode(resolvedCallMode);
        setIsVideoModalOpen(true);
      } catch (error) {
        console.error("Error initiating call from history:", error);
        setCallError(
          error.response?.data?.error ||
            error.message ||
            "Unable to start call. Please try again.",
        );
      }
    },
    [currentUserId, currentUserType],
  );

  // Filter calls
  const filteredCalls = useMemo(
    () =>
      callsData
        .filter((call) => {
          if (activeFilter === "all") return true;
          if (activeFilter === "missed") return call.missed;
          if (activeFilter === "video") return call.type === "video";
          if (activeFilter === "voice") return call.type === "voice";
          return true;
        })
        .filter((call) =>
          call.name.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
    [activeFilter, callsData, searchTerm],
  );

  // Group calls by date
  const groupedCalls = useMemo(
    () =>
      filteredCalls.reduce((groups, call) => {
        const date = call.date;
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(call);
        return groups;
      }, {}),
    [filteredCalls],
  );

  // Open appropriate modal based on call type
  const openCallModal = (call) => {
    void startCallFromHistory(call.type, call);
  };

  // Get icon for call type
  const getCallIcon = (type) => {
    if (type === "video") return "📹";
    return "📞";
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "incoming":
        return "⬇️";
      case "outgoing":
        return "⬆️";
      case "missed":
        return "❌";
      default:
        return "⬆️";
    }
  };

  return (
    <div className="call-history-container">
      {/* Fixed Header Section */}
      <div className="call-history-header-fixed">
       

        {/* Search Bar */}
        <div className="call-search">
          <span className="call-search-icon">🔍</span>
          <input
            type="text"
            className="call-search-input"
            placeholder={t('search_calls')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search calls"
          />
          {searchTerm && (
            <button
              className="call-clear-btn"
              onClick={() => setSearchTerm("")}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="call-filters">
          <button
            className={`call-filter-btn ${activeFilter === "all" ? "active" : ""}`}
            onClick={() => setActiveFilter("all")}
          >
            {t('all')}
          </button>
          <button
            className={`call-filter-btn ${activeFilter === "missed" ? "active" : ""}`}
            onClick={() => setActiveFilter("missed")}
          >
            {t('missed')}
          </button>
          <button
            className={`call-filter-btn ${activeFilter === "video" ? "active" : ""}`}
            onClick={() => setActiveFilter("video")}
          >
            {t('video_call')}
          </button>
          <button
            className={`call-filter-btn ${activeFilter === "voice" ? "active" : ""}`}
            onClick={() => setActiveFilter("voice")}
          >
            {t('voice_call')}
          </button>
        </div>

        {callError && <div className="call-error-banner">{callError}</div>}
      </div>

      {/* Scrollable Calls List */}
      <div className="calls-list">
        {isLoadingCalls && (
          <div className="call-no-results">
            <span className="call-no-results-icon">⏳</span>
            <p>{t('loading_calls')}</p>
          </div>
        )}

        {!isLoadingCalls &&
          Object.keys(groupedCalls).map((date) => (
            <div key={date} className="call-date-group">
              <div className="call-date-header">
                <span className="call-date">{date}</span>
              </div>

              {groupedCalls[date].map((call) => (
                <div
                  key={call.id}
                  className={`call-item ${call.missed ? "missed-call" : ""}`}
                  onClick={() => openCallModal(call)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => e.key === "Enter" && openCallModal(call)}
                >
                  {/* Profile Picture - Anonymous Avatar Only */}
                  <div className="call-avatar">
                    {isImageUrl(call.avatarUrl || call.profilePic) ? (
                      <img
                        className="call-avatar-img"
                        src={call.avatarUrl || call.profilePic}
                        alt={call.name}
                      />
                    ) : (
                      <span className="call-avatar-emoji">
                        {call.avatar || call.profilePic || FALLBACK_AVATAR}
                      </span>
                    )}
                  </div>

                  {/* Call Info */}
                  <div className="call-info">
                    <div className="call-name-row">
                      <span className="call-name">{call.name}</span>
                      <span className="call-time">{call.time}</span>
                    </div>

                    <div className="call-details">
                      <span className="call-status-icon">
                        {getStatusIcon(call.status)}
                      </span>
                      <span className="call-type-icon">
                        {getCallIcon(call.type)}
                      </span>
                      <span className="call-type">
                        {call.type === "video" ? t('video_call') : t('voice_call')}
                      </span>
                      {call.duration && (
                        <>
                          <span className="call-dot">•</span>
                          <span className="call-duration">{call.duration}</span>
                        </>
                      )}
                      {call.missed && (
                        <span className="call-missed-tag">{t('missed')}</span>
                      )}
                    </div>
                  </div>

                  {/* Call Action Button */}
                  <button
                    className="call-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCallModal(call);
                    }}
                    aria-label={`Call ${call.name}`}
                  >
                    {call.type === "video" ? "📹" : "📞"}
                  </button>
                </div>
              ))}
            </div>
          ))}

        {/* No Results */}
        {!isLoadingCalls && filteredCalls.length === 0 && (
          <div className="call-no-results">
            <span className="call-no-results-icon">📞</span>
            <p>{t('no_calls')}</p>
            <small>Try changing your search or filter</small>
          </div>
        )}
      </div>

      {/* Modals */}
      <VideoCallModal
        isOpen={isVideoModalOpen}
        onClose={() => {
          setIsVideoModalOpen(false);
          setSelectedCall(null);
          void fetchCallHistory();
        }}
        callData={selectedCall}
        callMode={activeCallMode}
        currentUser={{ id: currentUserId, role: currentUserType }}
      />
    </div>
  );
};

export default CallHistory;
