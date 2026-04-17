import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './BookAppointment.css';
import { API_BASE_URL } from '../../../../axiosConfig';
import axios from 'axios';

const CounselorRequestChat = () => {
  const navigate = useNavigate();

  // State for counselors list
  const [counselors, setCounselors] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [userAnonymous, setUserAnonymous] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedCounselorForRequest, setSelectedCounselorForRequest] = useState(null);

  // Get user ID and token from localStorage with error handling
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
  
  const handleCounselorClick = (counselor) => {
    if (!counselor) return;
    setSelectedCounselorForRequest(counselor);
    setShowUserModal(true);
  };

  // Function to fetch user data from API
  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!userId) {
        const anonymousName = `Anonymous_${Math.floor(Math.random() * 10000)}`;
        setUserAnonymous(anonymousName);
        localStorage.setItem("userAnonymousName", anonymousName);
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/auth/getUser/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      if (response.data && response.data.success) {
        const user = response.data.user;
        const anonymousName = user.anonymous || user.fullName || user.name || "";
        setUserAnonymous(anonymousName);
        if (anonymousName) {
          localStorage.setItem("userAnonymousName", anonymousName);
        }
      } else {
        // Fallback to anonymous name
        const anonymousName = `Anonymous_${Math.floor(Math.random() * 10000)}`;
        setUserAnonymous(anonymousName);
        localStorage.setItem("userAnonymousName", anonymousName);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Always provide a fallback anonymous name
      const anonymousName = `Anonymous_${Math.floor(Math.random() * 10000)}`;
      setUserAnonymous(anonymousName);
      localStorage.setItem("userAnonymousName", anonymousName);
      setError("Using anonymous mode. Your privacy is protected.");
    } finally {
      setIsLoading(false);
    }
  };

  // Load active chats from localStorage on mount
  useEffect(() => {
    try {
      const savedChats = localStorage.getItem('activeChats');
      if (savedChats) {
        const parsedChats = JSON.parse(savedChats);
        if (Array.isArray(parsedChats)) {
          setActiveChats(parsedChats);
        }
      }
    } catch (error) {
      console.error("Error loading saved chats:", error);
    }
  }, []);

  // Save active chats to localStorage whenever they change
  useEffect(() => {
    try {
      if (activeChats && activeChats.length > 0) {
        localStorage.setItem('activeChats', JSON.stringify(activeChats));
      }
    } catch (error) {
      console.error("Error saving chats:", error);
    }
  }, [activeChats]);

  // Function to get counselor profile photo URL
  const getProfilePhotoUrl = (counselor) => {
    if (!counselor) return null;
    if (counselor.profilePhoto && counselor.profilePhoto.url) {
      return counselor.profilePhoto.url;
    }
    if (typeof counselor.profilePhoto === 'string' && counselor.profilePhoto) {
      return counselor.profilePhoto;
    }
    return null;
  };

  // Function to get initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Fetch counselors from API
  useEffect(() => {
    const fetchCounselors = async () => {
      try {
        setError(null);
        const response = await fetch(`${API_BASE_URL}/api/auth/counsellors`, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.success && Array.isArray(data.counsellors)) {
          const formattedCounselors = data.counsellors.map((c, index) => ({
            id: c._id || index,
            name: c.fullName || c.name || "Counselor",
            specialization: c.specialization?.join(", ") || c.specialization || "Mental Health Professional",
            experience: `${c.experience || 0} years`,
            rating: c.rating || 4.5,
            online: c.isActive || c.online || false,
            available: c.isActive || c.online || false,
            avatar: getProfilePhotoUrl(c) || getInitials(c.fullName || c.name || "Counselor"),
            avatarType: getProfilePhotoUrl(c) ? 'image' : 'text',
            expertise: c.specialization || [],
            responseTime: c.responseTime || "< 30 seconds",
            profilePhoto: c.profilePhoto,
            email: c.email,
            phone: c.phoneNumber,
            location: c.location || "Online",
            languages: c.languages || ["English"],
            aboutMe: c.aboutMe || "Professional counselor dedicated to your mental wellbeing",
            qualification: c.qualification || "Certified Counselor",
            education: c.education || "Masters in Psychology",
            certifications: c.certifications || [],
            consultationMode: c.consultationMode || ["Chat", "Video"],
            totalSessions: c.totalSessions || 0,
            activeClients: c.activeClients || 0
          }));
          setCounselors(formattedCounselors);
        } else {
          // Set fallback counselors if API returns empty
          setCounselors(getFallbackCounselors());
          setError("Using demo counselors. Connect to internet for full list.");
        }
      } catch (error) {
        console.error("Error fetching counselors:", error);
        // Set fallback counselors for demo/offline mode
        setCounselors(getFallbackCounselors());
        setError("Offline mode. Showing demo counselors.");
      }
    };

    fetchCounselors();
  }, []);

  // Fallback counselors for offline/demo mode
  const getFallbackCounselors = () => {
    return [
      {
        id: 1,
        name: "Dr. Sarah Johnson",
        specialization: "Clinical Psychology",
        experience: "8 years",
        rating: 4.9,
        available: true,
        online: true,
        avatar: "SJ",
        avatarType: "text",
        responseTime: "< 10 seconds",
        location: "New York, USA",
        aboutMe: "Experienced clinical psychologist specializing in anxiety and depression"
      },
      {
        id: 2,
        name: "Michael Chen",
        specialization: "Marriage & Family Therapy",
        experience: "6 years",
        rating: 4.8,
        available: true,
        online: true,
        avatar: "MC",
        avatarType: "text",
        responseTime: "< 15 seconds",
        location: "California, USA"
      },
      {
        id: 3,
        name: "Dr. Emily Brown",
        specialization: "Child Psychology",
        experience: "10 years",
        rating: 4.9,
        available: false,
        online: false,
        avatar: "EB",
        avatarType: "text",
        responseTime: "< 20 seconds",
        location: "Texas, USA"
      },
      {
        id: 4,
        name: "David Wilson",
        specialization: "Addiction Counseling",
        experience: "7 years",
        rating: 4.7,
        available: true,
        online: true,
        avatar: "DW",
        avatarType: "text",
        responseTime: "< 12 seconds",
        location: "Florida, USA"
      }
    ];
  };

  // Fetch user data when modal opens
  useEffect(() => {
    if (showUserModal) {
      fetchUserData();
    }
  }, [showUserModal]);

  // Show notification
  const addNotification = (type, title, message, counselorId = null, chatId = null) => {
    const newNotification = {
      id: Date.now(),
      type,
      title,
      message,
      counselorId,
      chatId,
      timestamp: new Date().toLocaleTimeString(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  };

  // Handle Chat Now click
  const handleChatNow = (counselor) => {
    if (!counselor) return;
    
    if (!counselor.available) {
      addNotification(
        'error',
        'Counselor Unavailable',
        `${counselor.name} is currently not available. Please try later.`,
        counselor.id
      );
      return;
    }

    setSelectedCounselorForRequest(counselor);
    setShowUserModal(true);
  };

  // Send chat request
  const sendChatRequest = async (e) => {
    e.preventDefault();
    
    if (!selectedCounselorForRequest) {
      addNotification('error', 'Error', 'No counselor selected');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      const counselorId = selectedCounselorForRequest?.id;

      if (!counselorId) {
        addNotification('error', 'Error', 'Counselor ID not found');
        return;
      }

      // Try to send actual API request
      const response = await axios.post(
        `${API_BASE_URL}/api/chat/start`,
        {
          counselorId: counselorId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000
        }
      );

      if (response.data && response.data.success) {
        console.log("✅ Chat Started:", response.data);
        addNotification('success', 'Request Sent', `Chat request sent to ${selectedCounselorForRequest.name}`);
        setShowUserModal(false);
        
        // Simulate acceptance after 2 seconds (for demo)
        setTimeout(() => {
          simulateChatAcceptance(selectedCounselorForRequest);
        }, 2000);
      } else {
        throw new Error(response.data?.message || "Failed to send request");
      }

    } catch (error) {
      console.error("❌ Error:", error);
      // Fallback to local chat for demo
      addNotification('info', 'Demo Mode', `Request sent to ${selectedCounselorForRequest.name} (Demo mode)`);
      setShowUserModal(false);
      
      // Simulate acceptance for demo
      setTimeout(() => {
        simulateChatAcceptance(selectedCounselorForRequest);
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate chat acceptance (for demo/offline mode)
  const simulateChatAcceptance = (counselor) => {
    const anonymousName = userAnonymous || localStorage.getItem("userAnonymousName") || "Anonymous User";
    
    const newChat = {
      id: Date.now(),
      counselorId: counselor.id,
      counselor: counselor,
      user: {
        name: anonymousName,
        anonymousName: anonymousName,
        userId: userId || null,
        isAnonymous: !userId || true
      },
      messages: [
        {
          id: Date.now(),
          text: `Hello ${anonymousName}! I'm ${counselor.name}. How can I help you today?`,
          sender: 'counselor',
          time: new Date().toLocaleTimeString()
        }
      ],
      unread: true,
      startedAt: new Date().toISOString(),
      lastMessage: `Hello ${anonymousName}! I'm ${counselor.name}. How can I help you today?`,
      lastMessageTime: new Date().toLocaleTimeString()
    };

    setActiveChats(prev => {
      // Check if chat already exists
      const exists = prev.some(chat => chat.counselorId === counselor.id);
      if (exists) return prev;
      return [newChat, ...prev];
    });

    addNotification(
      'success',
      'Chat Request Accepted',
      `${counselor.name} has accepted your chat request. Click to start chatting.`,
      counselor.id,
      newChat.id
    );
  };

  // Navigate to chat interface
  const goToChat = (chat) => {
    if (!chat) return;
    
    navigate(`/chat/${chat.counselorId}`, {
      state: {
        chatData: chat,
        counselor: chat.counselor,
        user: chat.user
      }
    });
  };

  // Remove notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Clear error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="counselor-request-unique">
      {/* Error Banner */}
      {error && (
        <div className="error-banner-unique">
          <span className="error-icon-unique">ℹ️</span>
          <span className="error-message-unique">{error}</span>
          <button className="error-close-unique" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Notification Panel */}
      <div className="notification-panel-unique">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`notification-item-unique ${notification.type}`}
            onClick={() => {
              if (notification.type === 'success' && notification.chatId) {
                const chat = activeChats.find(c => c.id === notification.chatId);
                if (chat) goToChat(chat);
              }
              removeNotification(notification.id);
            }}
          >
            <div className="notification-icon-unique">
              {notification.type === 'request' && '⏳'}
              {notification.type === 'success' && '✅'}
              {notification.type === 'error' && '❌'}
              {notification.type === 'message' && '💬'}
              {notification.type === 'info' && 'ℹ️'}
            </div>
            <div className="notification-content-unique">
              <div className="notification-title-unique">{notification.title}</div>
              <div className="notification-message-unique">{notification.message}</div>
              <div className="notification-time-unique">{notification.timestamp}</div>
            </div>
            <button
              className="notification-close-unique"
              onClick={(e) => {
                e.stopPropagation();
                removeNotification(notification.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="main-content-unique">
        {/* Counselors Grid */}
        <div className="counselors-section-unique">
          <h1 className="page-title-unique">Online Counselors</h1>
          <p className="page-subtitle-unique">Connect with professional counselors instantly</p>

          {/* Loading State */}
          {isLoading && counselors.length === 0 && (
            <div className="loading-state-unique">
              <div className="spinner-unique"></div>
              <p>Loading counselors...</p>
            </div>
          )}

          {/* Desktop View - Cards Grid */}
          <div className="counselors-grid-unique desktop-view">
            {counselors.map(counselor => (
              <div key={counselor.id} className={`counselor-card-unique ${!counselor.available ? 'unavailable' : ''}`}>
                <div className="counselor-card-header-unique">
                  <div className="counselor-avatar-unique">
                    {counselor.avatarType === 'image' && counselor.avatar ? (
                      <img 
                        src={counselor.avatar} 
                        alt={counselor.name}
                        className="counselor-avatar-image-unique"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `<span>${getInitials(counselor.name)}</span>`;
                        }}
                      />
                    ) : (
                      <span>{counselor.avatar || getInitials(counselor.name)}</span>
                    )}
                  </div>
                  <div className="counselor-status-unique">
                    <span className={`status-dot-unique ${counselor.available ? 'online' : 'offline'}`}></span>
                    <span className="status-text-unique">{counselor.available ? 'Online' : 'Offline'}</span>
                  </div>
                </div>

                <h3 className="counselor-name-unique">{counselor.name}</h3>
                {counselor.location && (
                  <div className="counselor-location-unique">📍 {counselor.location}</div>
                )}
                <div className="counselor-specialization-unique">{counselor.specialization}</div>
                
                <div className="counselor-experience-unique">
                  💼 {counselor.experience}
                </div>
                
                <div className="counselor-rating-unique">
                  <div className="stars-unique">
                    {'★'.repeat(Math.floor(counselor.rating))}{'☆'.repeat(5 - Math.floor(counselor.rating))}
                  </div>
                  <span className="rating-number-unique">{counselor.rating}</span>
                </div>
                
                <div className="counselor-response-unique">
                  ⚡ Avg response: {counselor.responseTime}
                </div>
                
                <button
                  onClick={() => handleChatNow(counselor)}
                  disabled={!counselor.available}
                  className={`chat-now-btn-unique ${!counselor.available ? 'disabled' : ''}`}
                >
                  {counselor.available ? '💬 Chat Now' : '🔴 Unavailable'}
                </button>
              </div>
            ))}
          </div>

          {/* Mobile View - List Style */}
          <div className="counselors-table-unique mobile-view">
            {counselors.map(counselor => (
              <div
                key={counselor.id}
                className="counselor-row-unique"
                onClick={() => handleChatNow(counselor)}
              >
                <div className="row-avatar-unique">
                  {counselor.avatarType === 'image' && counselor.avatar ? (
                    <img 
                      src={counselor.avatar} 
                      alt={counselor.name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `<span>${getInitials(counselor.name)}</span>`;
                      }}
                    />
                  ) : (
                    <span>{counselor.avatar || getInitials(counselor.name)}</span>
                  )}
                </div>

                <div className="row-info-unique">
                  <div className="row-name-unique">{counselor.name}</div>
                  <div className="row-specialization-unique">
                    {counselor.specialization}
                  </div>
                  {counselor.experience && (
                    <div className="row-experience-unique">
                      💼 {counselor.experience}
                    </div>
                  )}
                </div>

                <div className="row-action-unique">
                  <span className={`dot ${counselor.available ? 'online' : 'offline'}`}></span>
                  <button
                    disabled={!counselor.available}
                    className="row-btn-unique"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChatNow(counselor);
                    }}
                  >
                    Chat
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {!isLoading && counselors.length === 0 && (
            <div className="empty-state-unique">
              <div className="empty-icon-unique">👥</div>
              <h3>No Counselors Available</h3>
              <p>Please check back later or contact support.</p>
            </div>
          )}
        </div>

        {/* Active Chats Sidebar */}
        {activeChats.length > 0 && (
          <div className="active-chats-sidebar-unique">
            <h3 className="sidebar-title-unique">Active Chats ({activeChats.length})</h3>
            {activeChats.map(chat => (
              <div
                key={chat.id}
                className={`chat-tab-unique ${chat.unread ? 'unread' : ''}`}
                onClick={() => goToChat(chat)}
              >
                <div className="chat-tab-avatar-container-unique">
                  {chat.counselor?.avatarType === 'image' && chat.counselor.avatar ? (
                    <img
                      src={chat.counselor.avatar}
                      alt={chat.counselor.name}
                      className="chat-tab-avatar-image-unique"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `
                          <div class="chat-tab-avatar-text-unique">
                            ${getInitials(chat.counselor.name)}
                          </div>
                        `;
                      }}
                    />
                  ) : (
                    <div className="chat-tab-avatar-text-unique">
                      {chat.counselor?.avatar || getInitials(chat.counselor?.name || 'Chat')}
                    </div>
                  )}
                </div>
                <div className="chat-tab-info-unique">
                  <div className="chat-tab-name-unique">{chat.counselor?.name || 'Counselor'}</div>
                  <div className="chat-tab-preview-unique">
                    {chat.lastMessage || (chat.messages?.[chat.messages.length - 1]?.text?.substring(0, 30) || 'Click to chat')}
                  </div>
                </div>
                {chat.unread && <span className="unread-badge-unique">●</span>}
              </div>
            ))}
          </div>
        )}

        {/* User Info Modal */}
        {showUserModal && selectedCounselorForRequest && (
          <div className="modal-overlay-unique" onClick={() => setShowUserModal(false)}>
            <div className="modal-content-unique" onClick={e => e.stopPropagation()}>
              <div className="modal-header-unique">
                <h2>Start Chat with {selectedCounselorForRequest.name}</h2>
                <button className="modal-close-unique" onClick={() => setShowUserModal(false)}>×</button>
              </div>
              <form onSubmit={sendChatRequest}>
                <input
                  type="hidden"
                  value={userAnonymous}
                  name="anonymousName"
                />

                <div className="modal-user-info-unique">
                  <div className="user-info-card-unique">
                    <div className="user-info-icon-unique">
                      🔒
                    </div>
                    <div className="user-info-details-unique">
                      <div className="user-info-label-unique">
                        You are chatting anonymously as:
                      </div>
                      <div className="user-info-name-unique">
                        {isLoading ? (
                          <span className="loading-text-unique">Loading your info...</span>
                        ) : (
                          <span className="anonymous-name-unique">
                            {userAnonymous || 'Anonymous User'}
                          </span>
                        )}
                      </div>
                      <div className="user-info-note-unique">
                        This anonymous name will be shown to the counselor
                      </div>
                    </div>
                  </div>
                </div>

                {selectedCounselorForRequest && (
                  <div className="counselor-preview-unique">
                    <div className="counselor-preview-header-unique">
                      <div className="counselor-preview-avatar-unique">
                        {selectedCounselorForRequest.avatarType === 'image' && selectedCounselorForRequest.avatar ? (
                          <img
                            src={selectedCounselorForRequest.avatar}
                            alt={selectedCounselorForRequest.name}
                            className="counselor-preview-image-unique"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = `<div className="counselor-preview-text-unique">${getInitials(selectedCounselorForRequest.name)}</div>`;
                            }}
                          />
                        ) : (
                          <div className="counselor-preview-text-unique">
                            {selectedCounselorForRequest.avatar || getInitials(selectedCounselorForRequest.name)}
                          </div>
                        )}
                      </div>
                      <div className="counselor-preview-info-unique">
                        <div className="counselor-preview-name-unique">
                          {selectedCounselorForRequest.name}
                        </div>
                        <div className="counselor-preview-specialization-unique">
                          {selectedCounselorForRequest.specialization}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="modal-info-unique">
                  <p>⏳ Your request will be sent to the counselor</p>
                  <p>✅ You'll be notified when they accept</p>
                  <p>💬 Average response time: {selectedCounselorForRequest?.responseTime}</p>
                  <p className="privacy-note-unique">
                    🔒 You are chatting anonymously. Your real identity is protected.
                  </p>
                </div>

                <button
                  type="submit"
                  className="modal-submit-btn-unique"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending Request...' : 'Send Chat Request'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* CSS for loading spinner */}
      <style jsx>{`
        .loading-state-unique {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          text-align: center;
        }
        
        .spinner-unique {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .empty-state-unique {
          text-align: center;
          padding: 3rem;
          background: white;
          border-radius: 15px;
          margin: 2rem;
        }
        
        .empty-icon-unique {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        
        .error-banner-unique {
          position: fixed;
          top: 70px;
          left: 50%;
          transform: translateX(-50%);
          background: #ff9800;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 1000;
          animation: slideDown 0.3s ease;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        
        @keyframes slideDown {
          from {
            top: -50px;
            opacity: 0;
          }
          to {
            top: 70px;
            opacity: 1;
          }
        }
        
        .error-icon-unique {
          font-size: 1.2rem;
        }
        
        .error-message-unique {
          flex: 1;
        }
        
        .error-close-unique {
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0 5px;
        }
      `}</style>
    </div>
  );
};

export default CounselorRequestChat;