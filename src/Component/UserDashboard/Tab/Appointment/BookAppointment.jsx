import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './BookAppointment.css';

const CounselorRequestChat = () => {
  const navigate = useNavigate();
  
  // State for counselors list
  const [counselors, setCounselors] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [userName, setUserName] = useState('');
  
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedCounselorForRequest, setSelectedCounselorForRequest] = useState(null);

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

  // Mock counselors data
  useEffect(() => {
    const mockCounselors = [
      {
        id: 1,
        name: 'Dr. Sarah Chen',
        specialization: 'Clinical Psychologist',
        experience: '12 years',
        rating: 4.9,
        online: true,
        available: true,
        avatar: '👩‍⚕️',
        expertise: ['Anxiety', 'Depression', 'Stress'],
        responseTime: '< 1 min'
      },
      {
        id: 2,
        name: 'Dr. James Wilson',
        specialization: 'Marriage Counselor',
        experience: '15 years',
        rating: 4.8,
        online: true,
        available: true,
        avatar: '👨‍⚕️',
        expertise: ['Relationships', 'Family', 'Divorce'],
        responseTime: '< 2 min'
      },
      {
        id: 3,
        name: 'Dr. Lisa Anderson',
        specialization: 'Child Psychologist',
        experience: '8 years',
        rating: 4.7,
        online: true,
        available: false,
        avatar: '👩‍⚕️',
        expertise: ['Child Development', 'ADHD', 'Behavioral'],
        responseTime: 'In session'
      },
      {
        id: 4,
        name: 'Dr. Michael Brown',
        specialization: 'Addiction Specialist',
        experience: '20 years',
        rating: 4.9,
        online: true,
        available: true,
        avatar: '👨‍⚕️',
        expertise: ['Addiction', 'Recovery', 'Therapy'],
        responseTime: '< 3 min'
      }
    ];
    setCounselors(mockCounselors);
  }, []);

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
  const sendChatRequest = (e) => {
    e.preventDefault();
    
    if (!userName.trim() ) return;

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
        name: userName, 
        
      },
      messages: [
        {
          id: Date.now(),
          text: `Hello ${userName}! I'm ${counselor.name}. How can I help you today?`,
          sender: 'counselor',
          time: new Date().toLocaleTimeString()
        }
      ],
      unread: true,
      startedAt: new Date().toISOString(),
      lastMessage: `Hello ${userName}! I'm ${counselor.name}. How can I help you today?`,
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

    // Reset form
    setUserName('');
   
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
                <p className="counselor-specialization-unique">{counselor.specialization}</p>

                <div className="counselor-rating-unique">
                  <span className="stars-unique">{'⭐'.repeat(Math.floor(counselor.rating))}</span>
                  <span className="rating-number-unique">{counselor.rating}</span>
                </div>

                <p className="counselor-experience-unique">{counselor.experience} experience</p>

                <div className="counselor-expertise-unique">
                  {counselor.expertise.map((skill, index) => (
                    <span key={index} className="expertise-tag-unique">{skill}</span>
                  ))}
                </div>

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

        {/* User Info Modal */}
        {showUserModal && (
          <div className="modal-overlay-unique" onClick={() => setShowUserModal(false)}>
            <div className="modal-content-unique" onClick={e => e.stopPropagation()}>
              <div className="modal-header-unique">
                <h2>Start Chat with {selectedCounselorForRequest?.name}</h2>
                <button className="modal-close-unique" onClick={() => setShowUserModal(false)}>×</button>
              </div>
              <form onSubmit={sendChatRequest}>
                <div className="modal-form-group-unique">
                  <label>Your Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    autoFocus
                  />
                </div>
                
               
                <div className="modal-info-unique">
                  <p>⏳ Your request will be sent to the counselor</p>
                  <p>✅ You'll be notified when they accept</p>
                  <p>💬 Average response time: {selectedCounselorForRequest?.responseTime}</p>
                </div>
                <button type="submit" className="modal-submit-btn-unique">
                  Send Chat Request
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CounselorRequestChat;