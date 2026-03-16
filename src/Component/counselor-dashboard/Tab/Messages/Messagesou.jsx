import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Messagesou.css";

/**
 * SMSList Component - Sirf users/patients ki list dikhta hai
 * Click karne par /sms-input route par redirect karega
 */
const SMSList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Users/Patients list data
  const users = [
    { 
      id: 1, 
      name: "Anjali Desai", 
      lastMessage: "When can we schedule next session?", 
      time: "5 min ago",
      unread: 2,
      avatar: "👩",
      status: "online",
      phone: "+91 98765 43210",
      email: "anjali.d@email.com"
    },
    { 
      id: 2, 
      name: "Rohan Mehra", 
      lastMessage: "Thank you for yesterday's session", 
      time: "2 hours ago",
      unread: 0,
      avatar: "👨",
      status: "offline",
      phone: "+91 98765 43211",
      email: "rohan.m@email.com"
    },
    { 
      id: 3, 
      name: "Sunita Reddy", 
      lastMessage: "I have a question about meditation", 
      time: "Yesterday",
      unread: 1,
      avatar: "👩",
      status: "online",
      phone: "+91 98765 43212",
      email: "sunita.r@email.com"
    },
    { 
      id: 4, 
      name: "Amit Kumar", 
      lastMessage: "Can we reschedule?", 
      time: "Yesterday",
      unread: 0,
      avatar: "👨",
      status: "offline",
      phone: "+91 98765 43213",
      email: "amit.k@email.com"
    },
    { 
      id: 5, 
      name: "Priya Patel", 
      lastMessage: "The exercises are helping", 
      time: "2 days ago",
      unread: 0,
      avatar: "👩",
      status: "online",
      phone: "+91 98765 43214",
      email: "priya.p@email.com"
    },
    { 
      id: 6, 
      name: "Vikram Singh", 
      lastMessage: "Need to discuss medication", 
      time: "3 days ago",
      unread: 0,
      avatar: "👨",
      status: "offline",
      phone: "+91 98765 43215",
      email: "vikram.s@email.com"
    },
  ];

  // Filter users based on search
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserClick = (user) => {
    // Navigate to /sms-input with user data in state
    navigate('/sms-input', { 
      state: { selectedUser: user } 
    });
  };

  // Calculate total unread messages
  const totalUnread = users.reduce((acc, user) => acc + user.unread, 0);

  return (
    <div className="smslist-container">
      {/* Header */}
      <div className="smslist-header">
        <div className="smslist-title-section">
          <h2>SMS List</h2>
          <span className="smslist-total">{users.length} contacts</span>
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
          placeholder="Search patients by name..."
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
              className="smslist-user-item"
              onClick={() => handleUserClick(user)}
            >
              {/* Avatar with Status */}
              <div className="smslist-user-avatar">
                <span className="avatar-emoji">{user.avatar}</span>
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
                  <span className="user-phone">{user.phone}</span>
                  <span className={`user-status ${user.status}`}>
                    {user.status === 'online' ? '🟢 Online' : '⚪ Offline'}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="smslist-empty">
            <span className="empty-icon">🔍</span>
            <h4>No users found</h4>
            <p>Try searching with a different name</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SMSList;