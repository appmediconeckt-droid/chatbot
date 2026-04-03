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

// Voice/Video Call Modal Component
const CallModal = ({ isOpen, onClose, callType, callerName, callerImage, callData, onAccept, onEnd, onAcceptCall, onRejectCall, onJoinCall }) => {
  const [callStatus, setCallStatus] = useState('incoming');
  const [callDuration, setCallDuration] = useState(0);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isOpen && callStatus === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else if (!isOpen || callStatus === 'ended') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isOpen, callStatus]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    setCallStatus('connecting');
    
    if (onAcceptCall && callData) {
      try {
        await onAcceptCall(callData.callId);
        setCallStatus('connected');
        if (onAccept) onAccept();
      } catch (error) {
        console.error('Error accepting call:', error);
        setCallStatus('incoming');
      }
    } else {
      setTimeout(() => {
        setCallStatus('connected');
        if (onAccept) onAccept();
      }, 2000);
    }
    setIsAccepting(false);
  };

  const handleReject = async () => {
    setIsRejecting(true);
    setCallStatus('ended');
    
    if (onRejectCall && callData) {
      try {
        await onRejectCall(callData.callId);
      } catch (error) {
        console.error('Error rejecting call:', error);
      }
    }
    
    setTimeout(() => {
      if (onEnd) onEnd();
      onClose();
    }, 1500);
    setIsRejecting(false);
  };

  const handleJoin = async () => {
    setIsJoining(true);
    
    if (onJoinCall && callData) {
      try {
        const result = await onJoinCall(callData.callId);
        if (result) {
          setCallStatus('connected');
        }
      } catch (error) {
        console.error('Error joining call:', error);
      }
    }
    setIsJoining(false);
  };

  const handleEnd = async () => {
    setCallStatus('ended');
    
    // Call end API if available
    if (callData && callData.onEndCall) {
      await callData.onEndCall(callData.callId);
    }
    
    setTimeout(() => {
      if (onEnd) onEnd();
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="call-modal-overlay">
      <div className={`call-modal ${callType === 'video' ? 'video-call-modal' : 'voice-call-modal'}`}>
        {callType === 'video' && callStatus === 'connected' && (
          <div className="video-background">
            <div className="remote-video-placeholder">
              {callerImage && (callerImage === '👨' || callerImage === '👩' || callerImage === '👤') ? (
                <div className="avatar-emoji-large">{callerImage}</div>
              ) : callerImage ? (
                <img src={callerImage} alt={callerName} />
              ) : (
                <FaUserCircle />
              )}
              <div className="video-loading">
                <FaSpinner className="spinning" />
                <span>Connecting video stream...</span>
              </div>
            </div>
            <div className="local-video-preview">
              <div className="local-video-placeholder">
                <FaUserCircle />
                <span>You</span>
              </div>
            </div>
          </div>
        )}

        <div className="call-modal-content">
          <div className="caller-info">
            <div className="caller-avatar">
              {callerImage && (callerImage === '👨' || callerImage === '👩' || callerImage === '👤') ? (
                <div className="avatar-emoji">{callerImage}</div>
              ) : callerImage ? (
                <img src={callerImage} alt={callerName} />
              ) : (
                <FaUserCircle />
              )}
            </div>
            <h3 className="caller-name">{callerName || "Counselor"}</h3>
            {callData && (
              <>
                <p className="caller-user-id">Call ID: {callData.callId?.substring(0, 8)}...</p>
                <p className="caller-user-id">Room ID: {callData.roomId?.substring(0, 8)}...</p>
              </>
            )}
            <p className="call-status-text">
              {callStatus === 'incoming' && `${callType === 'video' ? 'Video' : 'Voice'} call incoming...`}
              {callStatus === 'connecting' && 'Connecting...'}
              {callStatus === 'connected' && `Call in progress • ${formatDuration(callDuration)}`}
              {callStatus === 'ended' && 'Call ended'}
            </p>
          </div>

          <div className="call-controls">
            {callStatus === 'incoming' && (
              <>
                <button 
                  className="call-btn accept-btn" 
                  onClick={handleAccept}
                  disabled={isAccepting}
                >
                  {isAccepting ? <FaSpinner className="spinning" /> : <FaPhoneAlt />}
                  <span>{isAccepting ? 'Accepting...' : 'Accept'}</span>
                </button>
                <button 
                  className="call-btn join-btn" 
                  onClick={handleJoin}
                  disabled={isJoining}
                >
                  {isJoining ? <FaSpinner className="spinning" /> : <FaVideoIcon />}
                  <span>{isJoining ? 'Joining...' : 'Join Call'}</span>
                </button>
                <button 
                  className="call-btn reject-btn" 
                  onClick={handleReject}
                  disabled={isRejecting}
                >
                  {isRejecting ? <FaSpinner className="spinning" /> : <FaPhoneSlash />}
                  <span>{isRejecting ? 'Rejecting...' : 'Decline'}</span>
                </button>
              </>
            )}

            {callStatus === 'connecting' && (
              <div className="connecting-animation">
                <div className="connecting-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <p>Establishing secure connection...</p>
              </div>
            )}

            {callStatus === 'connected' && (
              <>
                {callType === 'video' && (
                  <>
                    <button className="call-btn icon-btn" onClick={() => {}}>
                      <FaMicrophone />
                      <span>Mute</span>
                    </button>
                    <button className="call-btn icon-btn" onClick={() => {}}>
                      <FaVideoIcon />
                      <span>Camera</span>
                    </button>
                  </>
                )}
                <button className="call-btn end-call-btn" onClick={handleEnd}>
                  <FaPhoneSlash />
                  <span>End Call</span>
                </button>
              </>
            )}

            {callStatus === 'ended' && (
              <button className="call-btn close-btn" onClick={onClose}>
                <FaTimes />
                <span>Close</span>
              </button>
            )}
          </div>
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
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error accepting call:', error);
      return null;
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
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error joining call:', error);
      return false;
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
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error ending call:', error);
      return null;
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
      return response.data?.success || false;
    } catch (error) {
      console.error('Error rejecting call:', error);
      return false;
    }
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
      
      const response = await axios.get(`${API_BASE_URL}/api/video/calls/waiting/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Waiting calls response:', response.data);
      
      if (response.data && response.data.success && response.data.calls && response.data.calls.length > 0) {
        setWaitingCalls(response.data.calls);
        
        const waitingCall = response.data.calls.find(call => call.status === 'waiting' || call.status === 'ringing');
        
        if (waitingCall && !showCallModal) {
          const callTypeValue = waitingCall.callType || 'video';
          setCallType(callTypeValue);
          
          const initiatorAvatar = waitingCall.initiator?.gender === 'female' ? '👩' : 
                                  waitingCall.initiator?.gender === 'male' ? '👨' : '👤';
          
          setCallerInfo({
            name: waitingCall.initiator?.name || 'Counselor',
            image: initiatorAvatar,
            userId: waitingCall.initiator?.id,
            userName: waitingCall.initiator?.name,
            callId: waitingCall.callId || waitingCall.id,
            roomId: waitingCall.roomId,
            waitingDuration: waitingCall.waitingDuration || 0,
            onEndCall: endCall
          });
          
          setShowCallModal(true);
          vibrate([200, 100, 200]);
        }
      } else {
        setWaitingCalls([]);
      }
    } catch (error) {
      console.error('Error fetching waiting calls:', error);
    }
  };

  useEffect(() => {
    if (isPolling && !showCallModal) {
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
  }, [isPolling, showCallModal]);

  useEffect(() => {
    if (showCallModal) {
      setIsPolling(false);
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    } else {
      setIsPolling(true);
    }
  }, [showCallModal]);

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

  const handleAcceptCall = async (callId) => {
    try {
      const result = await acceptCall(callId);
      if (result) {
        console.log('Call accepted successfully', result);
        return result;
      }
      return null;
    } catch (error) {
      console.error('Error in accept call:', error);
      return null;
    }
  };

  const handleJoinCall = async (callId) => {
    try {
      const result = await joinCall(callId);
      console.log('Join call result:', result);
      return result;
    } catch (error) {
      console.error('Error in join call:', error);
      return false;
    }
  };

  const handleRejectCall = async (callId) => {
    try {
      await rejectCall(callId);
      console.log('Call rejected successfully');
    } catch (error) {
      console.error('Error in reject call:', error);
    }
  };

  const handleAcceptCallModal = () => {
    console.log('Call accepted');
  };

  const handleEndCall = () => {
    console.log('Call ended');
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
      <CallModal
        isOpen={showCallModal}
        onClose={() => {
          setShowCallModal(false);
          setCallerInfo({
            name: '',
            image: null,
            userId: '',
            userName: '',
            callId: '',
            roomId: '',
            waitingDuration: 0,
            onEndCall: null
          });
        }}
        callType={callType}
        callerName={callerInfo.userName || callerInfo.name}
        callerImage={callerInfo.image}
        callData={callerInfo}
        onAccept={handleAcceptCallModal}
        onEnd={handleEndCall}
        onAcceptCall={handleAcceptCall}
        onRejectCall={handleRejectCall}
        onJoinCall={handleJoinCall}
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