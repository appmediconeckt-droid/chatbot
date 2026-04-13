import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Messagesou.css";
import { API_BASE_URL } from "../../../../axiosConfig";
/**
 * SMSList Component - Fetches and displays users/patients list from API
 * Displays anonymous name and gender-based avatar icons (no photos)
 */
const SMSList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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

    if (diffMins < 1) return "Just now";
    if (diffHours < 1) return `${diffMins}m ago`;
    if (diffDays === 0) {
      return messageTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return messageTime.toLocaleDateString([], { weekday: "short" });
    return messageTime.toLocaleDateString([], { month: "short", day: "numeric" });
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

  // Fetch chats from API
  useEffect(() => {
    const fetchChats = async () => {
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      if (!token) {
        setError("No access token found. Please log in.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/chat/chats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Transform API data to match component structure
        const transformedUsers = (data.chats || []).map((chat) => {
          const otherParty = chat.otherParty || {};
          const displayName = otherParty.anonymous || otherParty.name || "Anonymous User";
          const actualUserId =
            otherParty.id ||
            otherParty._id ||
            otherParty.userId ||
            otherParty.user_id ||
            chat.userId;

          const lastMessageTime = chat.lastMessage?.createdAt || chat.updatedAt || chat.startedAt;
          const chatStatus = String(chat.status || "pending").toLowerCase();
          let specialization = "Patient";
          if (Array.isArray(otherParty.specialization) && otherParty.specialization[0]) {
            specialization = otherParty.specialization[0];
          } else if (typeof otherParty.specialization === "string") {
            specialization = otherParty.specialization;
          }

          return {
            id: chat.chatId,
            _id: actualUserId,
            receiverId: actualUserId,
            user: otherParty,
            chatId: chat.chatId,
            name: displayName,
            lastMessage: chat.lastMessage?.content || "No messages yet",
            time: formatTime(lastMessageTime),
            fullDateTime: formatFullDateTime(lastMessageTime),
            lastActivityAt: lastMessageTime,
            unread: chat.unreadCount || 0,
            status: chatStatus,
            online: chatStatus === "accepted" && !chat.isExpired,
            phone: otherParty.phone || "Not available",
            email: otherParty.email || "Not available",
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
          const aTime = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
          const bTime = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
          return bTime - aTime;
        });
        
        setUsers(transformedUsers);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching chats:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  // Filter users based on the displayed (anonymous) name
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.specialization.toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className="smslist-loading">
          <div className="loading-spinner"></div>
          <p>Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="smslist-container">
        <div className="smslist-error">
          <span className="error-icon">⚠️</span>
          <h4>Error loading chats</h4>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
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
        {totalUnread > 0 && (
          <span className="smslist-unread-badge">{totalUnread} unread</span>
        )}
      </div>

      {/* Search Bar */}
      <div className="smslist-search">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search chats..."
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
                <div
                  className="avatar-initials"
                  style={{ backgroundColor: getAvatarColor(user.name) }}
                >
                  {getInitials(user.name)}
                </div>
                <span className={`status-dot ${user.online ? "online" : "offline"}`}></span>
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
                  <span className="user-specialization">{user.specialization}</span>
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
            <h4>No conversations found</h4>
            <p>Try searching with a different anonymous name</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SMSList;