import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import "./Messagesou.css";
import { useCounselorTranslation } from "../../../../i18n/LanguageContext";
import { API_BASE_URL } from "../../../../axiosConfig";
import socketService from "../../../../services/socketService";
import {
  getAnonymousParticipantId,
  getAnonymousUserAvatar,
  getAnonymousUserDisplay,
} from "../../../../utils/anonymousUser";
import {
  formatPresenceText,
  getPresence,
  getPresenceUserId,
  resolveOfflineLastSeen,
} from "../../../../utils/presence";
import NotificationBell from "./NotificationBell";
import PendingRequestsModal from "./PendingRequestsModal";
import { translateMessage } from "../../../../services/messageTranslationService";
import { ChatListSkeleton } from "../../../common/Skeletons/Skeletons";
/**
 * SMSList Component - Fetches and displays users/patients list from API
 * Displays anonymous name and gender-based avatar icons (no photos)
 */
const SMSList = () => {
  const { t, lang } = useCounselorTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [originalUsers, setOriginalUsers] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const navigate = useNavigate();

  const handleSessionExpired = useCallback(() => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/role-selector", {
      replace: true,
      state: {
        reason: "session-expired",
        message: t('session_expired_message') || "You were logged out because your account was used on another device.",
      },
    });
  }, [navigate, t]);

  const getInitials = (name) => {
    if (!name) return "US";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getAvatarColor = (name) => {
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
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";

    const messageTime = new Date(timeString);
    if (Number.isNaN(messageTime.getTime())) return "";

    const now = new Date();
    const diffMs = now - messageTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return t('just_now');
    if (diffHours < 1) return `${diffMins}m ago`;
    if (diffDays === 0) {
      return messageTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (diffDays === 1) return t('yesterday');
    if (diffDays < 7)
      return messageTime.toLocaleDateString([], { weekday: "short" });
    return messageTime.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  };

  const formatFullDateTime = (timeString) => {
    if (!timeString) return "";
    const date = new Date(timeString);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Fetch pending requests
  const fetchPendingRequests = useCallback(async () => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/pending-requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Error fetching pending requests:", err);
    }
  }, []);

  // Fetch chats from API
  const fetchChats = useCallback(async () => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("accessToken");
    if (!token) {
      handleSessionExpired();
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/chat/chats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Transform API data to match component structure
      const transformedUsers = (data.chats || []).map((chat) => {
        const otherParty = chat.otherParty || {};
        const anonymousUser = getAnonymousUserDisplay(otherParty);
        const actualUserId =
          getAnonymousParticipantId({ ...otherParty, userId: chat.userId }) ||
          chat.userId;
        const presence = getPresence(otherParty);
        const safeOtherParty = {
          id: actualUserId,
          _id: actualUserId,
          userId: actualUserId,
          anonymous: anonymousUser.name,
          gender: anonymousUser.gender,
          avatar: anonymousUser.avatar,
          avatarUrl: anonymousUser.avatarUrl,
          isOnline: presence.isOnline,
          online: presence.isOnline,
          lastSeen: presence.lastSeen,
        };

        const lastMessageTime =
          chat.lastMessage?.createdAt || chat.updatedAt || chat.startedAt;
        const chatStatus = String(chat.status || "pending").toLowerCase();
        let specialization = "Patient";
        if (
          Array.isArray(otherParty.specialization) &&
          otherParty.specialization[0]
        ) {
          specialization = otherParty.specialization[0];
        } else if (typeof otherParty.specialization === "string") {
          specialization = otherParty.specialization;
        }

        return {
          id: chat.chatId,
          _id: actualUserId,
          receiverId: actualUserId,
          user: safeOtherParty,
          chatId: chat.chatId,
          name: anonymousUser.name,
          gender: anonymousUser.gender,
          avatar: anonymousUser.avatar,
          avatarUrl: anonymousUser.avatarUrl,
          lastMessage: chat.lastMessage?.content || "No messages",
          time: formatTime(lastMessageTime),
          fullDateTime: formatFullDateTime(lastMessageTime),
          lastActivityAt: lastMessageTime,
          unread: chat.unreadCount || 0,
          status: chatStatus,
          online: presence.isOnline,
          isOnline: presence.isOnline,
          lastSeen: presence.lastSeen,
          phone: "Not available",
          email: "Not available",
          specialization,
          rating: otherParty.rating,
          isExpired: chat.isExpired,
          expiresAt: chat.expiresAt,
          startedAt: chat.startedAt,
          acceptedAt: chat.acceptedAt,
          rejectedAt: chat.rejectedAt,
          cancelledAt: chat.cancelledAt,
        };
      });

      transformedUsers.sort((a, b) => {
        const aTime = a.lastActivityAt
          ? new Date(a.lastActivityAt).getTime()
          : 0;
        const bTime = b.lastActivityAt
          ? new Date(b.lastActivityAt).getTime()
          : 0;
        return bTime - aTime;
      });

      setOriginalUsers(transformedUsers);
      setUsers(transformedUsers);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching chats:", err);
      setError(err.message);
      setLoading(false);
    }
  }, [handleSessionExpired]);

  useEffect(() => {
    fetchChats();
    fetchPendingRequests();

    // Set up polling for pending requests (every 5 seconds)
    const pollInterval = setInterval(() => {
      fetchPendingRequests();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    let mounted = true;

    const onPresenceUpdate = (payload = {}) => {
      if (!mounted) return;
      const presenceUserId = getPresenceUserId(payload);
      const presence = getPresence(payload);
      const applyPresence = (items) =>
        items.map((user) =>
          String(user.receiverId || user._id || user.userId) === String(presenceUserId)
            ? {
                ...user,
                online: presence.isOnline,
                isOnline: presence.isOnline,
                lastSeen: resolveOfflineLastSeen(presence, user.lastSeen),
                user: user.user
                  ? {
                      ...user.user,
                      online: presence.isOnline,
                      isOnline: presence.isOnline,
                      lastSeen: resolveOfflineLastSeen(
                        presence,
                        user.user.lastSeen || user.lastSeen,
                      ),
                    }
                  : user.user,
              }
            : user,
        );

      setUsers(applyPresence);
      setOriginalUsers(applyPresence);
    };

    const onConnectError = (err) => {
      console.error("Messages presence socket error:", err.message);
    };

    socketService.connect().then((socket) => {
      if (!mounted) return;
      socket.on("presence-update", onPresenceUpdate);
      socket.on("connect_error", onConnectError);
    }).catch((err) => {
      console.error("[Messagesou] Socket connect failed:", err.message);
    });

    return () => {
      mounted = false;
      socketService.off("presence-update", onPresenceUpdate);
      socketService.off("connect_error", onConnectError);
    };
  }, []);

  // Translate user messages when language changes
  useEffect(() => {
    if (!lang || lang === 'en' || !originalUsers || originalUsers.length === 0) {
      return;
    }

    const translateUsers = async () => {
      setIsTranslating(true);
      try {
        const translatedUsers = await Promise.all(
          originalUsers.map(async (user) => {
            if (!user.lastMessage) return user;
            try {
              const translatedMessage = await translateMessage(user.lastMessage, lang);
              return { ...user, lastMessage: translatedMessage };
            } catch (error) {
              console.error('Error translating user message:', error);
              return user;
            }
          })
        );
        setUsers(translatedUsers);
      } catch (error) {
        console.error('Error translating users:', error);
        setUsers(originalUsers);
      } finally {
        setIsTranslating(false);
      }
    };

    translateUsers();
  }, [lang, originalUsers]);

  // Filter users based on the displayed (anonymous) name
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.specialization.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleUserClick = (user) => {
    setSelectedChatId(user.chatId);
    navigate("/sms-input", {
      state: {
        selectedUser: user,
        chatId: user.chatId,
        chatData: user,
      },
    });
  };

  const handleAcceptRequest = async (requestId) => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("accessToken");
    if (!token) return;

    setLoadingRequests(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/accept/${requestId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Remove accepted request from pending
        setPendingRequests((prev) =>
          prev.filter((req) => req.id !== requestId)
        );
        // Refresh chats
        fetchChats();
      }
    } catch (err) {
      console.error("Error accepting request:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("accessToken");
    if (!token) return;

    setLoadingRequests(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/reject/${requestId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: "Not available" }),
      });

      if (response.ok) {
        // Remove rejected request from pending
        setPendingRequests((prev) =>
          prev.filter((req) => req.id !== requestId)
        );
      }
    } catch (err) {
      console.error("Error rejecting request:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const totalUnread = users.reduce((acc, user) => acc + user.unread, 0);

  const getStatusBadgeText = (status) => {
    if (status === "accepted") return "Accepted";
    if (status === "pending") return "Pending";
    if (status === "rejected") return "Rejected";
    if (status === "ended") return "Ended";
    return "Active";
  };

  if (loading) {
    return (
      <div className="smslist-container">
        {/* Header (static) */}
        <div className="smslist-header">
          <div className="smslist-title-section">
            <h2>Messages</h2>
            <span className="smslist-total">&nbsp;</span>
          </div>
          <div className="smslist-header-actions">
            <NotificationBell pendingCount={0} onClick={() => {}} />
          </div>
        </div>

        {/* Search Bar (static) */}
        <div className="smslist-search">
          <FaSearch className="search-icon" aria-hidden="true" />
          <input type="text" placeholder={t('search_chats')} disabled />
        </div>

        {/* Conversation rows skeleton — matches smslist-user-item layout */}
        <ChatListSkeleton rows={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="smslist-container">
        <div className="smslist-error">
          <span className="error-icon">⚠️</span>
          <h4>{t('error_load_chats') || 'Error loading chats'}</h4>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="smslist-container">
      {/* Header */}
      <div className="smslist-header">
        <div className="smslist-title-section">
          <h2>Messages</h2>
          <span className="smslist-total">{users.length} conversations</span>
        </div>
        <div className="smslist-header-actions">
          <NotificationBell
            pendingCount={pendingRequests.length}
            onClick={() => setShowPendingModal(true)}
          />
          {totalUnread > 0 && (
            <span className="smslist-unread-badge">{totalUnread} unread</span>
          )}
        </div>
      </div>

      {/* Pending Requests Modal */}
      <PendingRequestsModal
        isOpen={showPendingModal}
        requests={pendingRequests}
        onClose={() => setShowPendingModal(false)}
        onAccept={handleAcceptRequest}
        onReject={handleRejectRequest}
        loading={loadingRequests}
      />

      {/* Search Bar */}
      <div className="smslist-search">
        <FaSearch className="search-icon" aria-hidden="true" />
        <input
          type="text"
          placeholder={t('search_chats')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button className="search-clear" onClick={() => setSearchTerm("")}>
            ✕
          </button>
        )}
      </div>

      {/* Users List */}
      <div className="smslist-users">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className={`smslist-user-item ${
                selectedChatId === user.chatId ? "selected" : ""
              } status-${user.status} ${user.isExpired ? "expired-chat" : ""}`}
              onClick={() => handleUserClick(user)}
            >
              {/* Avatar with status indicator */}
              <div className="smslist-user-avatar">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="avatar-image"
                  />
                ) : (
                  <div
                    className="avatar-initials"
                    style={{ backgroundColor: getAvatarColor(user.name) }}
                  >
                    {user.avatar || getAnonymousUserAvatar(user) || getInitials(user.name)}
                  </div>
                )}
                <span
                  className={`status-dot ${user.online ? "online" : "offline"}`}
                ></span>
              </div>

              {/* User Info */}
              <div className="smslist-user-info">
                <div className="smslist-user-row">
                  <h4>{user.name}</h4>
                  <span className="smslist-time" title={user.fullDateTime}>
                    {user.time}
                  </span>
                </div>

                <div className="smslist-last-message">
                  <p className="message-preview">{user.lastMessage}</p>
                  {user.unread > 0 && (
                    <span className="unread-count">{user.unread}</span>
                  )}
                </div>

                <div className="smslist-user-details">
                  <span className="user-specialization">
                    {user.specialization}
                  </span>
                  <span className={`user-presence ${user.online ? "online" : "offline"}`}>
                    {formatPresenceText(
                      { isOnline: user.online, lastSeen: user.lastSeen },
                      {
                        onlineText: t('online') || "Online",
                        offlineText: t('offline') || "Offline",
                      },
                    )}
                  </span>
                  <span className={`user-status status-${user.status}`}>
                    {getStatusBadgeText(user.status)}
                  </span>
                </div>

                {user.isExpired && (
                  <div className="expired-badge">
                    <span>⚠️ Expired</span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="smslist-empty">
            <span className="empty-icon">🔍</span>
            <h4>{t('no_chats')}</h4>
            <p>Try searching with a different anonymous name</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SMSList;
