import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Messagesou.css";

/**
 * SMSList Component - Fetches and displays users/patients list from API
 * Displays anonymous name and gender-based avatar icons (no photos)
 */
const SMSList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Format time difference from createdAt
  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Just now";
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} sec ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return past.toLocaleDateString();
  };

  // Fetch chats from API
  useEffect(() => {
    const fetchChats = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError("No access token found. Please log in.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await fetch('https://td6lmn5q-5000.inc1.devtunnels.ms/api/chat/chats', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transform API data to match component structure
        const transformedUsers = data.chats.map(chat => {
          const otherParty = chat.otherParty;
          const displayName = otherParty.anonymous || otherParty.name || "Anonymous User";
          const gender = otherParty.gender || 'neutral';

          return {
            id: chat.id,
            chatId: chat.chatId,
            name: displayName,
            lastMessage: chat.lastMessage?.content || "No messages yet",
            time: formatTimeAgo(chat.lastMessage?.createdAt || chat.updatedAt),
            unread: chat.unreadCount || 0,
            gender: gender,
            status: chat.status === 'pending' ? 'offline' : 'online',
            phone: otherParty.phone || "Not available",
            email: otherParty.email || "Not available",
            specialization: otherParty.specialization,
            rating: otherParty.rating,
            isExpired: chat.isExpired,
            expiresAt: chat.expiresAt,
            startedAt: chat.startedAt,
            acceptedAt: chat.acceptedAt,
            rejectedAt: chat.rejectedAt,
            cancelledAt: chat.cancelledAt
          };
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
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserClick = (user) => {
    navigate('/sms-input', { 
      state: { 
        selectedUser: user,
        chatId: user.chatId,
        chatData: user
      } 
    });
  };

  const totalUnread = users.reduce((acc, user) => acc + user.unread, 0);

  // Get gender-based avatar icon
  const getAvatarIcon = (gender) => {
    if (gender === 'male') return '👨';
    if (gender === 'female') return '👩';
    return '👤';
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
          <h2>SMS List</h2>
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
          placeholder="Search by anonymous name..."
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
              className={`smslist-user-item ${user.isExpired ? 'expired-chat' : ''}`}
              onClick={() => handleUserClick(user)}
            >
              {/* Avatar with Status - Using gender-based icon instead of photo */}
              <div className="smslist-user-avatar">
                <span className="avatar-icon">
                  {getAvatarIcon(user.gender)}
                </span>
                <span className={`status-dot ${user.status}`}></span>
              </div>

              {/* User Info */}
              <div className="smslist-user-info">
                <div className="smslist-user-row">
                  <h4>{user.name}</h4>
                  <span className="smslist-time">{user.time}</span>
                </div>
                
                <div className="smslist-last-message">
                  <p className="message-preview">{user.lastMessage}</p>
                  {user.unread > 0 && (
                    <span className="unread-count">{user.unread}</span>
                  )}
                </div>

                <div className="smslist-user-details">
                  {user.specialization && user.specialization.length > 0 && (
                    <span className="user-specialization">
                      {user.specialization[0]}
                    </span>
                  )}
                  <span className={`user-status ${user.status}`}>
                    {user.status === 'online' ? '🟢 Active' : '⚪ Inactive'}
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