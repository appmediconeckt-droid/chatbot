import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

import "./CallHistory.css";
import VideoCallModal from "../CallModal/VideoCallModal";
import { API_BASE_URL } from "../../../../axiosConfig";

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
        const readableName =
          call.with || call.withName || call.withDisplayName || "Participant";

        return {
          id: call.id || `${timestamp || "call"}_${index}`,
          callId: call.id,
          roomId: call.roomId,
          name: readableName,
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
          profilePic: "👨‍⚕️",
          missed,
          counterPartyId: call.withId,
          counterPartyType: normalizeRole(call.withType),
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
  }, [currentUserId]);

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
        const receiverData = callData.receiver || {};

        setSelectedCall({
          id: callData.id || response.data.callId,
          callId: response.data.callId,
          roomId: response.data.roomId,
          name:
            receiverData.displayName ||
            receiverData.fullName ||
            callEntry?.name ||
            "Participant",
          type: resolvedCallMode,
          callType: resolvedCallMode,
          profilePic: receiverData.profilePhoto || "👨‍⚕️",
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

  // Open new call modals
  const openNewVideoCall = () => {
    if (!callsData.length) {
      setCallError("No recent contacts found. Start a chat first.");
      return;
    }
    void startCallFromHistory("video", callsData[0]);
  };

  const openNewVoiceCall = () => {
    if (!callsData.length) {
      setCallError("No recent contacts found. Start a chat first.");
      return;
    }
    void startCallFromHistory("voice", callsData[0]);
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
        <div className="call-header">
          <h2 className="call-title">Call History</h2>
          <div className="call-header-actions">
            <button
              className="call-icon-btn"
              onClick={openNewVoiceCall}
              title="New Voice Call"
              aria-label="New Voice Call"
            >
              📞
            </button>
            <button
              className="call-icon-btn"
              onClick={openNewVideoCall}
              title="New Video Call"
              aria-label="New Video Call"
            >
              📹
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="call-search">
          <span className="call-search-icon">🔍</span>
          <input
            type="text"
            className="call-search-input"
            placeholder="Search calls..."
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
            All
          </button>
          <button
            className={`call-filter-btn ${activeFilter === "missed" ? "active" : ""}`}
            onClick={() => setActiveFilter("missed")}
          >
            Missed
          </button>
          <button
            className={`call-filter-btn ${activeFilter === "video" ? "active" : ""}`}
            onClick={() => setActiveFilter("video")}
          >
            Video
          </button>
          <button
            className={`call-filter-btn ${activeFilter === "voice" ? "active" : ""}`}
            onClick={() => setActiveFilter("voice")}
          >
            Voice
          </button>
        </div>

        {callError && <div className="call-error-banner">{callError}</div>}
      </div>

      {/* Scrollable Calls List */}
      <div className="calls-list">
        {isLoadingCalls && (
          <div className="call-no-results">
            <span className="call-no-results-icon">⏳</span>
            <p>Loading call history...</p>
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
                  {/* Profile Picture */}
                  <div className="call-avatar">
                    <span className="call-avatar-emoji">{call.profilePic}</span>
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
                        {call.type === "video" ? "Video Call" : "Voice Call"}
                      </span>
                      {call.duration && (
                        <>
                          <span className="call-dot">•</span>
                          <span className="call-duration">{call.duration}</span>
                        </>
                      )}
                      {call.missed && (
                        <span className="call-missed-tag">Missed</span>
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
            <p>No calls found</p>
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
