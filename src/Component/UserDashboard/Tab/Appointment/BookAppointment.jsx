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

  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedCounselorForRequest, setSelectedCounselorForRequest] = useState(null);

  // Get user ID and token from localStorage
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
    const handleCounselorClick = (counselor) => {
  setSelectedCounselorForRequest(counselor);
  setShowUserModal(true);
};

  // Function to fetch user data from API
  const fetchUserData = async () => {
    if (!userId) {
      // If no user ID, generate anonymous name
      const anonymousName = `Anonymous_${Math.floor(Math.random() * 10000)}`;
      setUserAnonymous(anonymousName);
      return;
    }
  

    try {
      setIsLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/auth/getUser/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        const user = response.data.user;
        const anonymousName = user.anonymous || user.fullName || user.name || "";
        setUserAnonymous(anonymousName);
        if (anonymousName) {
          localStorage.setItem("userAnonymousName", anonymousName);
        }
      } else {
        const anonymousName = `Anonymous_${Math.floor(Math.random() * 10000)}`;
        setUserAnonymous(anonymousName);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      const anonymousName = `Anonymous_${Math.floor(Math.random() * 10000)}`;
      setUserAnonymous(anonymousName);
    } finally {
      setIsLoading(false);
    }
  };

  // Load active chats from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem('activeChats');
    if (savedChats) {
      setActiveChats(JSON.parse(savedChats));
    }
  }, []);

  // Save active chats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('activeChats', JSON.stringify(activeChats));
  }, [activeChats]);

  // Function to get counselor profile photo URL
  const getProfilePhotoUrl = (counselor) => {
    if (counselor.profilePhoto && counselor.profilePhoto.url) {
      return counselor.profilePhoto.url;
    }
    return null;
  };

  // Function to get initials for avatar fallback
  const getInitials = (name) => {
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
        const response = await fetch(
          `${API_BASE_URL}/api/auth/counsellors`
        );

        const data = await response.json();

        if (data.success) {
          const formattedCounselors = data.counsellors.map((c, index) => ({
            id: c._id,
            name: c.fullName,
            specialization: c.specialization?.join(" , ") || "General",
            experience: `${c.experience || 0} years`,
            rating: c.rating || 4.5,
            online: c.isActive,
            available: c.isActive,
            avatar: getProfilePhotoUrl(c) || getInitials(c.fullName),
            avatarType: getProfilePhotoUrl(c) ? 'image' : 'text',
            expertise: c.specialization || [],
            responseTime: "< 10 seconds",
            profilePhoto: c.profilePhoto,
            email: c.email,
            phone: c.phoneNumber,
            location: c.location,
            languages: c.languages || [],
            aboutMe: c.aboutMe,
            qualification: c.qualification,
            education: c.education,
            certifications: c.certifications || [],
            consultationMode: c.consultationMode || [],
            totalSessions: c.totalSessions || 0,
            activeClients: c.activeClients || 0
          }));

          setCounselors(formattedCounselors);
        }
      } catch (error) {
        console.error("Error fetching counselors:", error);
      }
    };

    fetchCounselors();
  }, []);

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

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  };

  // Handle Chat Now click
  const handleChatNow = (counselor) => {
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


  

const startChatAPI = async (counselorId, token) => {
  try {
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
      }
    );

    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
  // Send chat request
const sendChatRequest = async (e) => {
  e.preventDefault();

  try {
    setIsLoading(true);

    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");

    const counselorId = selectedCounselorForRequest?.id;

    if (!counselorId) {
      alert("❌ Counselor not selected");
      return;
    }

    const res = await axios.post(
      `${API_BASE_URL}/api/chat/start`,
      {
        counselorId: counselorId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Chat Started:", res.data);

    alert("✅ Chat request sent successfully!");

    // OPTIONAL: redirect to chat page
    // navigate(`/chat/${res.data.chatId}`);

    setShowUserModal(false);

  } catch (error) {
    console.error("❌ Error:", error);

    alert(error?.response?.data?.message || "Failed to send request");
  } finally {
    setIsLoading(false);
  }
};

  // Accept chat request
  const acceptChatRequest = (counselor) => {
    const newChat = {
      id: Date.now(),
      counselorId: counselor.id,
      counselor: counselor,
      user: {
        name: userAnonymous,
        anonymousName: userAnonymous,
        userId: userId || null,
        isAnonymous: !userId || true
      },
      messages: [
        {
          id: Date.now(),
          text: `Hello ${userAnonymous}! I'm ${counselor.name}. How can I help you today?`,
          sender: 'counselor',
          time: new Date().toLocaleTimeString()
        }
      ],
      unread: true,
      startedAt: new Date().toISOString(),
      lastMessage: `Hello ${userAnonymous}! I'm ${counselor.name}. How can I help you today?`,
      lastMessageTime: new Date().toLocaleTimeString()
    };

    setActiveChats(prev => [newChat, ...prev]);

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

  return (
    <div className="counselor-request-unique">
      {/* Notification Panel - Right Side Top */}
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
          <p className="page-subtitle-unique">Click 'Chat Now' to send a request</p>

          {/* Desktop View - Cards Grid */}
          <div className="counselors-grid-unique desktop-view">
            {counselors.map(counselor => (
              <div key={counselor.id} className={`counselor-card-unique ${!counselor.available ? 'unavailable' : ''}`}>
                <div className="counselor-card-header-unique">
                  <div className="counselor-avatar-unique">
                    {counselor.avatarType === 'image' ? (
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
                      <span>{counselor.avatar}</span>
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
                  💼 {counselor.experience} experience
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

          {/* Mobile View - Table/List Style */}
          <div className="counselors-table-unique mobile-view">
            {counselors.map(counselor => (
              <div
                key={counselor.id}
                className="counselor-row-unique"
                onClick={() => handleChatNow(counselor)}
              >
                {/* Avatar */}
                <div className="row-avatar-unique">
                  {counselor.avatarType === 'image' ? (
                    <img 
                      src={counselor.avatar} 
                      alt={counselor.name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `<span>${getInitials(counselor.name)}</span>`;
                      }}
                    />
                  ) : (
                    <span>{counselor.avatar}</span>
                  )}
                </div>

                {/* Info */}
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

                {/* Status + Button */}
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
        </div>

        {/* Active Chats Sidebar */}
        {activeChats.length > 0 && (
          <div className="active-chats-sidebar-unique">
            <h3 className="sidebar-title-unique">Active Chats</h3>
            {activeChats.map(chat => (
              <div
                key={chat.id}
                className={`chat-tab-unique ${chat.unread ? 'unread' : ''}`}
                onClick={() => goToChat(chat)}
              >
                <div className="chat-tab-avatar-container-unique">
                  {chat.counselor.avatarType === 'image' ? (
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
                      {chat.counselor.avatar}
                    </div>
                  )}
                </div>
                <div className="chat-tab-info-unique">
                  <div className="chat-tab-name-unique">{chat.counselor.name}</div>
                  <div className="chat-tab-preview-unique">
                    {chat.lastMessage || chat.messages[chat.messages.length - 1].text.substring(0, 30)}...
                  </div>
                </div>
                {chat.unread && <span className="unread-badge-unique">●</span>}
              </div>
            ))}
          </div>
        )}

        {/* User Info Modal */}
        {showUserModal && (
          <div className="modal-overlay-unique" onClick={() => setShowUserModal(false)}>
            <div className="modal-content-unique" onClick={e => e.stopPropagation()}>
              <div className="modal-header-unique">
                <h2>Start Chat with {selectedCounselorForRequest?.name}</h2>
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
                            {userAnonymous || 'Loading...'}
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
                        {selectedCounselorForRequest.avatarType === 'image' ? (
                          <img
                            src={selectedCounselorForRequest.avatar}
                            alt={selectedCounselorForRequest.name}
                            className="counselor-preview-image-unique"
                          />
                        ) : (
                          <div className="counselor-preview-text-unique">
                            {selectedCounselorForRequest.avatar}
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
                  disabled={isLoading || !userAnonymous}
                >
                  {isLoading ? 'Loading...' : 'Send Chat Request'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        /* Avatar Styles */
        .counselor-avatar-container-unique {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          overflow: hidden;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .counselor-avatar-image-unique {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .counselor-avatar-text-unique {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 600;
          color: white;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .chat-tab-avatar-container-unique {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          overflow: hidden;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .chat-tab-avatar-image-unique {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .chat-tab-avatar-text-unique {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 600;
          color: white;
        }

        .counselor-preview-unique {
          margin-bottom: 20px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .counselor-preview-header-unique {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .counselor-preview-avatar-unique {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          overflow: hidden;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .counselor-preview-image-unique {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .counselor-preview-text-unique {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 600;
          color: white;
        }

        .counselor-preview-info-unique {
          flex: 1;
        }

        .counselor-preview-name-unique {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .counselor-preview-specialization-unique {
          font-size: 14px;
          color: #6b7280;
        }

        .modal-user-info-unique {
          margin-bottom: 20px;
        }
        
        .user-info-card-unique {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: white;
        }
        
        .user-info-icon-unique {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        
        .user-info-details-unique {
          flex: 1;
        }
        
        .user-info-label-unique {
          font-size: 12px;
          opacity: 0.8;
          margin-bottom: 4px;
        }
        
        .user-info-name-unique {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 6px;
          letter-spacing: 0.5px;
        }
        
        .anonymous-name-unique {
          background: rgba(255, 255, 255, 0.2);
          padding: 4px 12px;
          border-radius: 20px;
          display: inline-block;
          font-size: 18px;
        }
        
        .user-info-note-unique {
          font-size: 11px;
          opacity: 0.9;
        }
        
        .loading-text-unique {
          display: inline-block;
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        .privacy-note-unique {
          font-size: 12px;
          color: #666;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #e5e7eb;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @media (max-width: 768px) {
          .counselor-avatar-container-unique {
            width: 60px;
            height: 60px;
          }
          
          .counselor-avatar-text-unique {
            font-size: 24px;
          }
          
          .chat-tab-avatar-container-unique {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
    </div>
  );
};

export default CounselorRequestChat;