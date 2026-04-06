import React, { useState, useEffect, useRef } from 'react';
import "./UserDashboard.css";
import { useNavigate } from "react-router-dom";
import axiosInstance, { API_BASE_URL } from '../../../axiosConfig';
import {
  FaCommentDots,
  FaUserMd,
  FaWallet,
  FaVideo,
  FaQuestionCircle,
  FaLock,
  FaSignOutAlt,
  FaTrash,
  FaBars,
  FaTimes,
  FaUserCircle,
  FaEnvelope,
  FaPhone,
  FaSave,
  FaEllipsisH,
  FaArrowRight,
  FaCheckCircle,
  FaRobot,
  FaPaperPlane,
  FaCommentMedical,
  FaUser,
  FaCalendarAlt,
  FaMicrophone,
  FaPhoneAlt,
  FaPhoneSlash,
  FaVideo as FaVideoIcon,
  FaStop,
  FaSpinner
} from "react-icons/fa";

import ChatInterface from "../Tab/chatbot/ChatInterface";
import WalletDashboard from "../Tab/Wallet/WalletDashboard";
import CallHistory from "../Tab/Callls/CallHistory";
import useVibration from '../../../hooks/useVibration';
import PatientProfile from '../../PatientProfile/PatientProfile';
import BookAppointment from '../Tab/Appointment/BookAppointment';
import LiveChatSupport from '../Tab/Appointment/BookAppointment';
import axios from 'axios';
import CounselorTable from '../Tab/Counselor/CounselorDirectory';
import VideoCallModal from '../Tab/CallModal/VideoCallModal';


// Incoming Call Modal Component (First Modal - Accept/Reject)
const IncomingCallModal = ({ isOpen, onClose, callType, callerName, callerImage, callData, onAccept, onReject }) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  if (!isOpen) return null;

  const getDisplayName = () => {
    if (callData?.from?.fullName) {
      return callData.from.fullName;
    }
    if (callData?.from?.displayName) {
      return callData.from.displayName;
    }
    if (callerName) {
      return callerName;
    }
    return "Counselor";
  };

  const formatRequestTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    if (onAccept) {
      await onAccept(callData);
    }
    setIsAccepting(false);
    onClose();
  };

  const handleReject = async () => {
    setIsRejecting(true);
    if (onReject) {
      await onReject(callData?.callId);
    }
    setIsRejecting(false);
    onClose();
  };

  const requestedTime = callData?.requestedAt ? formatRequestTime(callData.requestedAt) : '';
  const requestMessage = callData?.requestMessage || `Incoming ${callType === 'video' ? 'Video' : 'Voice'} call...`;

  return (
    <div className="incoming-call-modal-overlay">
      <div className="incoming-call-modal">
        <div className="incoming-call-header">
          <div className="incoming-call-avatar">
            {callerImage ? (
              <img src={callerImage} alt={getDisplayName()} />
            ) : (
              <FaUserCircle size={60} />
            )}
          </div>
          <h3 className="incoming-caller-name">{getDisplayName()}</h3>
          <p className="incoming-call-type">
            {callType === 'video' ? '📹 Video Call' : '📞 Voice Call'}
          </p>
          {requestedTime && (
            <p className="incoming-call-time">
              Received at {requestedTime}
            </p>
          )}
          <p className="incoming-call-message">{requestMessage}</p>
          <p className="incoming-call-status">Incoming call...</p>
        </div>

        <div className="incoming-call-actions">
          <button 
            className="incoming-call-btn reject-btn"
            onClick={handleReject}
            disabled={isRejecting}
          >
            {isRejecting ? <FaSpinner className="spinning" /> : <FaPhoneSlash />}
            <span>Decline</span>
          </button>
          <button 
            className="incoming-call-btn accept-btn"
            onClick={handleAccept}
            disabled={isAccepting}
          >
            {isAccepting ? <FaSpinner className="spinning" /> : <FaPhoneAlt />}
            <span>Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ChatPopup Component
const ChatPopup = ({
  messages,
  newMessage,
  setNewMessage,
  sendMessage,
  handleKeyPress,
  isLoading,
  onClose,
  chatBodyRef
}) => (
  <div className="chat-popup-overlay">
    <div className="chat-popup">
      <div className="chat-popup-header">
        <div className="chat-header-info">
          <div className="chat-avatar">
            <FaRobot />
          </div>
          <div>
            <h3>MediConeckt AI Assistant</h3>
            <p className="chat-status">Online • 24/7 Support</p>
          </div>
        </div>
        <button className="chat-close-btn" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="chat-popup-body" ref={chatBodyRef}>
        {messages.map(message => (
          <div key={message.id} className={`chat-message-wrapper ${message.sender}`}>
            {message.sender === 'ai' && (
              <div className="chat-avatar small">
                <FaRobot />
              </div>
            )}
            <div className="chat-bubble">{message.text}</div>
            {message.sender === 'user' && (
              <div className="chat-avatar small">
                <FaUserCircle />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="chat-message-wrapper ai">
            <div className="chat-avatar small">
              <FaRobot />
            </div>
            <div className="chat-bubble">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="chat-popup-footer">
        <input
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          className="chat-input"
        />
        <button
          className="send-btn"
          onClick={sendMessage}
          disabled={isLoading || !newMessage.trim()}
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  </div>
);

// ChatButton Component
const ChatButton = ({ onClick, unreadCount }) => (
  <button className="floating-chat-btn" onClick={onClick}>
    AI
    {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
  </button>
);

export default function UserDashboard() {
  const [active, setActive] = useState("Chat");
  const [chatOpen, setChatOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
<<<<<<< HEAD
  
  // Call Modal States
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState('video');
  const [callerInfo, setCallerInfo] = useState({
    name: '',
    image: null,
    userId: '',
    userName: '',
    callId: '',
    roomId: '',
    waitingDuration: 0,
    onEndCall: null
  });
  
=======

  // Modal States
  const [showIncomingCallModal, setShowIncomingCallModal] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [incomingCallData, setIncomingCallData] = useState(null);

>>>>>>> af556022d319d7fe000beb2bf1228d7606a53815
  const [waitingCalls, setWaitingCalls] = useState([]);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [isPolling, setIsPolling] = useState(true);

  const userId = localStorage.getItem("userId");
  
  const chatBodyRef = useRef(null);
  const navigate = useNavigate();
  const vibrate = useVibration();

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    profilePhoto: ""
  });

  const getProfilePhotoUrl = (userData) => {
    if (userData.profilePhoto) {
      if (typeof userData.profilePhoto === 'object' && userData.profilePhoto.url) {
        return userData.profilePhoto.url;
      }
      if (typeof userData.profilePhoto === 'string') {
        return userData.profilePhoto;
      }
    }
    return '';
  };

  // Accept Call API (PUT)
  const acceptCall = async (callId) => {
    try {
      const token = localStorage.getItem('token');
      const acceptorId = localStorage.getItem('userId');
      
      const requestBody = {
        acceptorId: acceptorId,
        acceptorType: 'user'
      };
      
      console.log('Accepting call with body:', requestBody);
      
      const response = await axios.put(`${API_BASE_URL}/calls/${callId}/accept`, requestBody, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Accept call response:', response.data);
      
      if (response.data && response.data.success) {
        return { success: true, data: response.data };
      }
      return { success: false, data: response.data };
    } catch (error) {
      console.error('Error accepting call:', error);
      return { success: false, error: error.message };
    }
  };

  // Join Call API (POST)
  const joinCall = async (callId) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      const requestBody = {
        userId: userId,
        userType: 'user'
      };

      console.log('Joining call with body:', requestBody);

      const response = await axios.post(`${API_BASE_URL}/api/video/calls/${callId}/join`, requestBody, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Join call response:', response.data);

      if (response.data && response.data.success) {
        return { success: true, data: response.data };
      }
      return { success: false, data: response.data };
    } catch (error) {
      console.error('Error joining call:', error);
      return { success: false, error: error.message };
    }
  };

  // End Call API (PUT)
  const endCall = async (callId) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      const requestBody = {
        userId: userId,
        endedBy: 'user'
      };
      
      console.log('Ending call with body:', requestBody);
      
      const response = await axios.put(`${API_BASE_URL}/api/video/calls/${callId}/end`, requestBody, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('End call response:', response.data);
      
      if (response.data && response.data.success) {
        return { success: true, data: response.data };
      }
      return { success: false };
    } catch (error) {
      console.error('Error ending call:', error);
      return { success: false, error: error.message };
    }
  };

  // Reject Call API
  const rejectCall = async (callId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_BASE_URL}/api/video/calls/reject/${callId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Reject call response:', response.data);
      return { success: response.data?.success || false };
    } catch (error) {
      console.error('Error rejecting call:', error);
      return { success: false, error: error.message };
    }
  };

  // Handle Accept from Incoming Modal
  const handleAcceptIncomingCall = async (callData) => {
    console.log('Accepting call:', callData);
    
    // First, accept the call via API
    const result = await acceptCall(callData.callId);
    
    if (result && result.success) {
      console.log('Call accepted successfully');
      
      // Prepare data for video call modal
      const videoCallData = {
        callId: callData.callId,
        roomId: callData.roomId,
        name: callData.name,
        isIncoming: true,
        status: 'connected',
        callType: callData.callType || 'video',
        from: callData.from,
        initiator: callData.initiator
      };
      
      setSelectedCall(videoCallData);
      setIsVideoModalOpen(true);
    } else {
      console.error('Failed to accept call');
      alert('Failed to accept call. Please try again.');
    }
  };

  // Handle Reject from Incoming Modal
  const handleRejectIncomingCall = async (callId) => {
    console.log('Rejecting call:', callId);
    await rejectCall(callId);
  };

  // Fetch waiting calls from API
  const fetchWaitingCalls = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      if (!userId || !token) {
        console.log('No userId or token found');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/video/calls/pending/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Waiting calls response:', response.data);

      const callsList = response.data.pendingRequests || response.data.waitingCalls || response.data.calls;

      if (response.data && response.data.success && callsList && callsList.length > 0) {
        setWaitingCalls(callsList);

        const waitingCall = callsList.find(call => !call.status || call.status === 'waiting' || call.status === 'ringing') || callsList[0];

        // Show incoming call modal if not already showing
        if (waitingCall && !showIncomingCallModal && !isVideoModalOpen) {
          const fromData = waitingCall.from || waitingCall.initiator || {};
          
          // Determine the display name
          let displayName = 'Counselor';
          if (fromData.fullName) {
            displayName = fromData.fullName;
          } else if (fromData.displayName) {
            displayName = fromData.displayName;
          } else if (fromData.name) {
            displayName = fromData.name;
          }

          // Get profile photo
          const profilePhoto = fromData.profilePhoto || waitingCall.fromProfilePhoto || null;

          setIncomingCallData({
            callId: waitingCall.callId || waitingCall.id || waitingCall._id,
            roomId: waitingCall.roomId,
            name: displayName,
            image: profilePhoto,
            callType: waitingCall.callType || 'video',
            from: fromData,
            initiator: waitingCall.initiator,
            requestMessage: waitingCall.requestMessage || `Incoming ${waitingCall.callType || 'video'} call...`,
            requestedAt: waitingCall.requestedAt || waitingCall.createdAt
          });
          
          setShowIncomingCallModal(true);
          vibrate([200, 100, 200]);
        }
      } else {
        setWaitingCalls([]);
      }
    } catch (error) {
      console.error('Error fetching waiting calls:', error);
    }
  };

  // Start polling for waiting calls
  useEffect(() => {
    if (isPolling && !showIncomingCallModal && !isVideoModalOpen) {
      fetchWaitingCalls();
      
      const interval = setInterval(() => {
        fetchWaitingCalls();
      }, 5000);
      
      setPollingInterval(interval);
      
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    } else if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [isPolling, showIncomingCallModal, isVideoModalOpen]);

  // Stop polling when modals are open
  useEffect(() => {
    if (showIncomingCallModal || isVideoModalOpen) {
      setIsPolling(false);
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    } else {
      setIsPolling(true);
    }
  }, [showIncomingCallModal, isVideoModalOpen]);

  // Handle Join Call (for VideoCallModal)
  const handleJoinCall = async (callId) => {
    try {
      const result = await joinCall(callId);
      if (result && result.success) {
        console.log('Call joined successfully', result);
        return { success: true, data: result.data };
      }
      return { success: false, error: 'Join failed' };
    } catch (error) {
      console.error('Error in join call:', error);
      return { success: false, error: error.message };
    }
  };

  // Handle End Call (for VideoCallModal)
  const handleEndCall = async (callId) => {
    try {
      const result = await endCall(callId);
      console.log('Call ended successfully', result);
      return result;
    } catch (error) {
      console.error('Error in end call:', error);
      return { success: false, error: error.message };
    }
  };

  // Handle close video modal
  const handleCloseVideoModal = () => {
    setIsVideoModalOpen(false);
    setSelectedCall(null);
    // Resume polling after modal closes
    setIsPolling(true);
  };

  // Handle close incoming call modal
  const handleCloseIncomingModal = () => {
    setShowIncomingCallModal(false);
    setIncomingCallData(null);
    // Resume polling after modal closes
    setIsPolling(true);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem('token');

        if (!userId) {
          console.error("No user ID found");
          return;
        }

        const response = await axios.get(
          `${API_BASE_URL}/api/auth/getUser/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          const user = response.data.user;
          const profilePhotoUrl = getProfilePhotoUrl(user);

          setUserData({
            name: user.fullName || "",
            email: user.email || "",
            phone: user.phoneNumber || "",
            profilePhoto: profilePhotoUrl
          });
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUserData();
  }, []);

  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: "Hello! I'm your AI assistant. How can I help you today?", sender: 'ai' },
    { id: 2, text: "I'm feeling anxious today.", sender: 'user' }
  ]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatMessages, isLoading]);

  useEffect(() => {
    if (chatOpen) {
      setUnreadCount(0);
    }
  }, [chatOpen]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      const userMessage = {
        id: Date.now(),
        text: newMessage,
        sender: 'user'
      };
      setChatMessages(prev => [...prev, userMessage]);
      setNewMessage('');
      setIsLoading(true);

      setTimeout(() => {
        const aiResponses = [
          "I understand. Would you like to try some breathing exercises?",
          "Thank you for sharing. How long have you been feeling this way?",
          "I'm here to listen. Would you like me to suggest some coping strategies?",
          "Would you like me to connect you with a mental health professional?"
        ];
        const aiMessage = {
          id: Date.now() + 1,
          text: aiResponses[Math.floor(Math.random() * aiResponses.length)],
          sender: 'ai'
        };
        setChatMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);

        if (!chatOpen) {
          setUnreadCount(prev => prev + 1);
        }
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleMenuItemClick = (id) => {
    vibrate(30);
    setActive(id);
    if (isMobile) {
      setShowMoreModal(false);
      setShowProfileMenu(false);
    }
  };

  const handleProfileClick = () => {
    vibrate(30);
    setActive("profile");
    if (isMobile) {
      setShowProfileMenu(false);
    }
  };

  const handleLogout = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      const response = await axiosInstance.post(
        `${API_BASE_URL}/api/auth/logout`,
        { refreshToken: refreshToken },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("Logout success:", response.data);
      localStorage.clear();
      navigate("/role-selector");

    } catch (error) {
      console.error("Logout error:", error?.response?.data || error.message);
      localStorage.clear();
      navigate("/role-selector");
    }
  };

  const handleLogoutClick = () => {
    vibrate(30);
    setShowLogoutConfirm(true);
  };

  const handleDeleteClick = () => {
    vibrate(40);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    vibrate([100, 50, 100]);
    setShowDeleteConfirm(false);
    setDeleteSuccess(true);
    setTimeout(() => {
      navigate('/role-selector');
    }, 2500);
  };

  const handleMoreModalToggle = () => {
    vibrate(30);
    setShowMoreModal(!showMoreModal);
  };

  const handleCloseModal = () => {
    vibrate(20);
    setShowMoreModal(false);
    setShowProfileMenu(false);
  };

  const handleSupportClick = (type) => {
    vibrate(40);
    alert(`Opening ${type} section`);
  };

  const handlePrivacyAction = (action) => {
    vibrate(30);
    alert(`Opening ${action} settings`);
  };

  const allMenuItems = [
    { id: "Chat", icon: <FaCommentDots />, label: "Chat" },
    { id: "Live Chat", icon: <FaUserMd />, label: "Counselor" },
    { id: "Wallet", icon: <FaWallet />, label: "Wallet" },
    { id: "Video", icon: <FaVideo />, label: "Video Call" },
    { id: "help", icon: <FaQuestionCircle />, label: "Help & Support" },
    { id: "privacy", icon: <FaLock />, label: "Privacy" }
  ];

  const bottomMenuItems = allMenuItems.slice(0, 4);

  return (
    <div className="user-dashboard">
      {/* Incoming Call Modal (First Modal - Accept/Reject) */}
      <IncomingCallModal
        isOpen={showIncomingCallModal}
        onClose={handleCloseIncomingModal}
        callType={incomingCallData?.callType || 'video'}
        callerName={incomingCallData?.name}
        callerImage={incomingCallData?.image}
        callData={incomingCallData}
        onAccept={handleAcceptIncomingCall}
        onReject={handleRejectIncomingCall}
      />

      {/* Video Call Modal (Second Modal - After Accept) */}
      <VideoCallModal
        isOpen={isVideoModalOpen}
        onClose={handleCloseVideoModal}
        callData={selectedCall}
        userRole="user"
        onJoinCall={handleJoinCall}
        onEndCall={handleEndCall}
      />

      {isMobile && (
        <div className="mobile-header">
          <div className="mobile-header-left">
            <h2 className="mobile-logo">MChat</h2>
          </div>
          <div className="mobile-header-right">
            <button 
              className="mobile-profile-btn"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              {userData.profilePhoto ? (
                <img 
                  src={userData.profilePhoto} 
                  alt={userData.name} 
                  className="mobile-user-avatar"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<FaUserCircle class="mobile-user-icon" />';
                  }}
                />
              ) : (
                <FaUserCircle className="mobile-user-icon" />
              )}
            </button>
            
            {showProfileMenu && (
              <div className="profile-dropdown-menu">
                <div className="profile-dropdown-header">
                  {userData.profilePhoto ? (
                    <img 
                      src={userData.profilePhoto} 
                      alt={userData.name} 
                      className="dropdown-avatar"
                    />
                  ) : (
                    <FaUserCircle className="dropdown-avatar-icon" />
                  )}
                  <div className="dropdown-user-info">
                    <h4>{userData.name}</h4>
                    <p>{userData.email}</p>
                  </div>
                </div>
                <div className="profile-dropdown-items">
                  <button className="dropdown-item" onClick={handleProfileClick}>
                    <FaUser className="dropdown-icon" />
                    <span>My Profile</span>
                  </button>
                  <button className="dropdown-item logout-item" onClick={handleLogoutClick}>
                    <FaSignOutAlt className="dropdown-icon" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="dashboard-container">
        {!isMobile && (
          <aside className="user-sidebar">
            <div className="sidebar-content">
              <div className="sidebar-header">
                <div className="profile-section">
                  <div className="profile-image">
                    {userData.profilePhoto ? (
                      <img 
                        src={userData.profilePhoto} 
                        alt={userData.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<FaUserCircle className="default-avatar" />';
                        }}
                      />
                    ) : (
                      <FaUserCircle className="default-avatar" />
                    )}
                  </div>
                  <div className="profile-info">
                    <h3 className="sidebar-title">Name: <span>{userData.name}</span></h3>
                    <p className="sidebar-subtitle">Email: <span>{userData.email}</span></p>
                    <p className="sidebar-subtitle">Phone: <span>{userData.phone}</span></p>
                  </div>
                </div>
              </div>

              <div className="sidebar-menu">
                {allMenuItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleMenuItemClick(item.id)}
                    className={`sidebar-item ${active === item.id ? "active" : ""}`}
                  >
                    <span className="sidebar-icon">{item.icon}</span>
                    <span className="sidebar-text">{item.label}</span>
                  </button>
                ))}
              </div>

              <hr className="sidebar-separator" />

              <div className="sidebar-actions">
                <button className="sidebar-item logout" onClick={handleLogoutClick}>
                  <span className="sidebar-icon"><FaSignOutAlt /></span>
                  <span className="sidebar-text">Logout</span>
                </button>
              </div>
            </div>
          </aside>
        )}

        <div className={`dashboard-content ${isMobile ? 'mobile' : ''}`}>
          <div className="content-scrollable">
            {active === "Chat" && <ChatInterface setActiveTab={setActive} />}
            {active === "Counselor" && <CounselorTable />}
            {active === "Wallet" && <WalletDashboard />}
            {active === "Video" && <CallHistory />}
            {active === "profile" && <PatientProfile />}
            {active === "Live Chat" && <LiveChatSupport />}

            {active === "help" && (
              <div className="content-section">
                <h2 className="section-title">Help & Support</h2>
                <div className="help-content">
                  <div className="support-card" onClick={() => handleSupportClick('FAQ')}>
                    <FaQuestionCircle className="support-icon" />
                    <h3>FAQ</h3>
                    <p>Find answers to frequently asked questions</p>
                  </div>
                  <div className="support-card" onClick={() => handleSupportClick('Contact Support')}>
                    <FaEnvelope className="support-icon" />
                    <h3>Contact Support</h3>
                    <p>Email us at support@example.com</p>
                  </div>
                </div>
              </div>
            )}

            {active === "privacy" && (
              <div className="content-section">
                <h2 className="section-title">Privacy Settings</h2>
                <div className="privacy-content">
                  <div className="privacy-option">
                    <h3>Data Privacy</h3>
                    <p>Control how your data is used and shared</p>
                    <button className="privacy-btn" onClick={() => handlePrivacyAction('Data Privacy')}>
                      Manage Settings
                    </button>
                  </div>
                  <div className="privacy-option">
                    <h3>Session Privacy</h3>
                    <p>Configure privacy settings for your sessions</p>
                    <button className="privacy-btn" onClick={() => handlePrivacyAction('Session Privacy')}>
                      Configure
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {!chatOpen && <ChatButton onClick={() => setChatOpen(true)} unreadCount={unreadCount} />}

      {chatOpen && (
        <ChatPopup
          messages={chatMessages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          sendMessage={sendMessage}
          handleKeyPress={handleKeyPress}
          isLoading={isLoading}
          onClose={() => setChatOpen(false)}
          chatBodyRef={chatBodyRef}
        />
      )}

      {isMobile && (
        <nav className="mobile-bottom-nav">
          {bottomMenuItems.map(item => (
            <button
              key={item.id}
              className={`mobile-nav-btn ${active === item.id ? 'active' : ''}`}
              onClick={() => handleMenuItemClick(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
          <button className="mobile-nav-btn more-btn" onClick={handleMoreModalToggle}>
            <span className="nav-icon"><FaEllipsisH /></span>
            <span className="nav-label">More</span>
          </button>
        </nav>
      )}

      {showMoreModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-container more-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Menu Options</h3>
              <button className="close-modal-btn" onClick={handleCloseModal}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="more-options-list">
                {allMenuItems.map(item => (
                  <button
                    key={item.id}
                    className={`more-option-item ${active === item.id ? 'active' : ''}`}
                    onClick={() => handleMenuItemClick(item.id)}
                  >
                    <span className="more-option-icon">{item.icon}</span>
                    <span className="more-option-text">{item.label}</span>
                    <span className="more-option-arrow"><FaArrowRight /></span>
                  </button>
                ))}
                <div className="more-actions">
                  <button className="more-action-btn logout-btn" onClick={() => {
                    vibrate(30);
                    setShowMoreModal(false);
                    setShowLogoutConfirm(true);
                  }}>
                    <FaSignOutAlt className="action-icon" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Logout</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to logout?</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => {
                vibrate(20);
                setShowLogoutConfirm(false);
              }}>Cancel</button>
              <button className="btn-danger" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Account</h3>
            </div>
            <div className="modal-body">
              <p>This action cannot be undone. All your data will be permanently deleted.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => {
                vibrate(20);
                setShowDeleteConfirm(false);
              }}>Cancel</button>
              <button className="btn-danger" onClick={handleDeleteConfirm}>Delete Account</button>
            </div>
          </div>
        </div>
      )}

      {deleteSuccess && (
        <div className="modal-overlay">
          <div className="modal-container success-modal">
            <div className="modal-header">
              <h3 className="modal-title success">
                <FaCheckCircle className="success-icon" />
                Account Deleted!
              </h3>
            </div>
            <div className="modal-body">
              <p>Your account has been successfully deleted.</p>
              <p>Redirecting...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}