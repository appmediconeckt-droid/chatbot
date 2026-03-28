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
        
        // IMPORTANT: Use the anonymous field from API response
        // The API returns "anonymous": "Arrru" field
        const anonymousName = user.anonymous || user.fullName || user.name || "";
        
        setUserAnonymous(anonymousName);
        
        // Store anonymous name in localStorage for future use
        if (anonymousName) {
          localStorage.setItem("userAnonymousName", anonymousName);
        }
      } else {
        // If API fails, generate anonymous name
        const anonymousName = `Anonymous_${Math.floor(Math.random() * 10000)}`;
        setUserAnonymous(anonymousName);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Generate anonymous name on error
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

  // Fetch counselors from API
  useEffect(() => {
    const fetchCounselors = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/auth/counsellors`
        );

        const data = await response.json();

        if (data.success) {
          // Map API data to your UI format
          const formattedCounselors = data.counsellors.map((c, index) => ({
            id: c._id,
            name: c.fullName,
            specialization: c.specialization?.join(" , ") || "General",
            experience: `${c.experience || 0} years`,
            rating: 4.5, // static (API me nahi hai)
            online: true,
            available: c.isActive,
            avatar: "👨‍⚕️",
            expertise: c.specialization || [],
            responseTime: "< 5 min",
            profilePhoto: c.profilePhoto,
            email: c.email,
            phone: c.phoneNumber,
            location: c.location,
            languages: c.languages || []
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

    // Auto remove notification after 5 seconds
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

  // Send chat request
  const sendChatRequest = async (e) => {
    e.preventDefault();

    if (!userAnonymous.trim()) {
      addNotification(
        'error',
        'Error',
        'Unable to get your name. Please refresh and try again.',
        null
      );
      return;
    }

    // Add request notification
    addNotification(
      'request',
      'Chat Request Sent',
      `Request sent to ${selectedCounselorForRequest.name}. Waiting for acceptance...`,
      selectedCounselorForRequest.id
    );

    setShowUserModal(false);

    // Simulate counselor accepting request after 3 seconds
    setTimeout(() => {
      acceptChatRequest(selectedCounselorForRequest);
    }, 3000);
  };

  // Accept chat request
  const acceptChatRequest = (counselor) => {
    // Create new chat
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

    // Add acceptance notification
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

          <div className="counselors-grid-unique">
            {counselors.map(counselor => (
              <div
                key={counselor.id}
                className={`counselor-card-unique ${!counselor.available ? 'unavailable' : ''}`}
              >
                <div className="counselor-card-header-unique">
                  <span className="counselor-avatar-unique">{counselor.avatar}</span>
                  <div className="counselor-status-unique">
                    <span className={`status-dot-unique ${counselor.online ? 'online' : 'offline'}`}></span>
                    <span className="status-text-unique">
                      {counselor.available ? 'Available' : 'In Session'}
                    </span>
                  </div>
                </div>

                <h3 className="counselor-name-unique">{counselor.name}</h3>

                <strong>Specialization</strong> <br />
                <p className="counselor-specialization-unique">{counselor.specialization}</p>

                <div className="counselor-rating-unique">
                  <span className="stars-unique">{'⭐'.repeat(Math.floor(counselor.rating))}</span>
                  <span className="rating-number-unique">{counselor.rating}</span>
                </div>

                <p className="counselor-experience-unique">{counselor.experience} experience</p>

                <div className="counselor-expertise-unique">
                  {counselor.languages.map((skill, index) => (
                    <span key={index} className="expertise-tag-unique">{skill}</span>
                  ))}
                </div>

                <p className="counselor-location-unique">{counselor.location}</p>

                <div className="counselor-response-unique">
                  Response Time: {counselor.responseTime}
                </div>

                <button
                  className={`chat-now-btn-unique ${!counselor.available ? 'disabled' : ''}`}
                  onClick={() => handleChatNow(counselor)}
                  disabled={!counselor.available}
                >
                  {counselor.available ? 'Chat Now 💬' : 'Currently Busy'}
                </button>
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
                <span className="chat-tab-avatar-unique">{chat.counselor.avatar}</span>
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

        {/* User Info Modal - Shows Anonymous Name from API */}
        {showUserModal && (
          <div className="modal-overlay-unique" onClick={() => setShowUserModal(false)}>
            <div className="modal-content-unique" onClick={e => e.stopPropagation()}>
              <div className="modal-header-unique">
                <h2>Start Chat with {selectedCounselorForRequest?.name}</h2>
                <button className="modal-close-unique" onClick={() => setShowUserModal(false)}>×</button>
              </div>
              <form onSubmit={sendChatRequest}>
                {/* Hidden input field - populated automatically */}
                <input
                  type="hidden"
                  value={userAnonymous}
                  name="anonymousName"
                />

                {/* Display user info with Anonymous Name from API */}
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

      {/* Add CSS styles for the new elements */}
      <style jsx>{`
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
      `}</style>
    </div>
  );
};

export default CounselorRequestChat;