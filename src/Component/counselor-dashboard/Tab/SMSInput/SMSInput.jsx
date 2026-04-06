import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./SMSInput.css";
import {
  FaVideo as FaVideoIcon,
  FaPhoneAlt,
  FaPhoneSlash,
  FaSpinner,
  FaMicrophone,
  FaTimes,
  FaUserCircle
} from "react-icons/fa";
import { API_BASE_URL } from "../../../../axiosConfig";
import VideoCallModal from "../../../UserDashboard/Tab/CallModal/VideoCallModal";
import VoiceCallModal from "../../../UserDashboard/Tab/CallModal/VoiceCallModal";

// Professional Call Modal Component for Counselor Receiving Calls
const IncomingCallModal = ({ isOpen, onClose, callType, callerName, callerAvatar, callData, onJoinCall, onRejectCall }) => {
  const [isJoining, setIsJoining] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleJoin = async () => {
    if (isJoining) return;
    
    setIsJoining(true);
    
    if (onJoinCall && callData) {
      try {
        const result = await onJoinCall(callData.callId);
        if (result && result.success) {
          // Call join successful - modal will be closed and video modal will open
          onClose();
        } else {
          console.error('Failed to join call');
        }
      } catch (error) {
        console.error('Error joining call:', error);
      } finally {
        setIsJoining(false);
      }
    } else {
      onClose();
      setIsJoining(false);
    }
  };

  const handleReject = async () => {
    if (isRejecting) return;
    
    setIsRejecting(true);
    
    if (onRejectCall && callData) {
      try {
        await onRejectCall(callData.callId);
        onClose();
      } catch (error) {
        console.error('Error rejecting call:', error);
      } finally {
        setIsRejecting(false);
      }
    } else {
      onClose();
      setIsRejecting(false);
    }
  };

  if (!isOpen) return null;

  const displayName = callerName || "Anonymous User";
  const profileImage = callerAvatar;

  return (
    <div className="incoming-call-modal-overlay">
      <div className={`incoming-call-modal ${callType === 'video' ? 'video-call-modal' : 'voice-call-modal'}`}>
        <div className="incoming-call-content">
          <div className="incoming-caller-info">
            <div className="incoming-caller-avatar">
              {profileImage && (profileImage === '👨' || profileImage === '👩' || profileImage === '👤') ? (
                <div className="avatar-emoji-large">{profileImage}</div>
              ) : profileImage ? (
                <img src={profileImage} alt={displayName} />
              ) : (
                <FaUserCircle />
              )}
            </div>
            <h3 className="incoming-caller-name">{displayName}</h3>
            <p className="incoming-call-type">
              {callType === 'video' ? '📹 Video Call' : '📞 Voice Call'}
            </p>
            <p className="incoming-call-message">
              {callData?.requestMessage || `Incoming ${callType} call...`}
            </p>
          </div>

          <div className="incoming-call-controls">
            <button 
              className="incoming-call-btn reject-btn" 
              onClick={handleReject} 
              disabled={isRejecting}
            >
              {isRejecting ? <FaSpinner className="spinning" /> : <FaPhoneSlash />}
              <span>{isRejecting ? 'Rejecting...' : 'Decline'}</span>
            </button>
            
            <button 
              className="incoming-call-btn accept-btn" 
              onClick={handleJoin} 
              disabled={isJoining}
            >
              {isJoining ? <FaSpinner className="spinning" /> : <FaPhoneAlt />}
              <span>{isJoining ? 'Accepting...' : 'Accept'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SMSInput = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Call modal states
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [isInitiatingCall, setIsInitiatingCall] = useState(false);
  const [callError, setCallError] = useState(null);

  // Receiving Call States
  const [showIncomingModal, setShowIncomingModal] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState({
    name: '',
    avatar: '👤',
    callId: '',
    roomId: '',
    callType: 'video'
  });

  // Message states
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [chatStatus, setChatStatus] = useState(null);

  // Get selected user from navigation state
  const selectedUser = location.state?.selectedUser;
  const chatId = location.state?.chatId;

  // Get current counselor from localStorage
  const getCurrentCounselor = () => {
    const counselorData = localStorage.getItem('counselor');
    if (counselorData) {
      try {
        return JSON.parse(counselorData);
      } catch (e) {
        return null;
      }
    }
    const sessionCounselor = sessionStorage.getItem('counselor');
    if (sessionCounselor) {
      try {
        return JSON.parse(sessionCounselor);
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const currentCounselor = getCurrentCounselor();

  // Get IDs from selectedUser or localStorage
  const COUNSELOR_ID = currentCounselor?.id || localStorage.getItem('counselorId') || 'counselor_001';
  const COUNSELOR_NAME = currentCounselor?.name || localStorage.getItem('counselorName') || 'Counselor';
  
  const USER_ID = selectedUser?.id || selectedUser?._id || 'user_001';
  const USER_NAME = selectedUser?.name || 'User';

  // Function to get avatar based on gender (emoji only)
  const getAvatarByGender = (gender) => {
    if (gender === 'male') return '👨';
    if (gender === 'female') return '👩';
    return '👤';
  };

  // Get the chat ID for API calls
  const getChatIdForAPI = () => {
    if (chatId) return chatId;
    if (selectedUser) {
      return `chat_${selectedUser.id || selectedUser.name?.replace(/\s/g, '_') || 'user'}_${Date.now()}`;
    }
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Fetch messages from API
  const fetchMessagesFromAPI = async () => {
    if (!selectedUser) return;

    try {
      const apiChatId = getChatIdForAPI();
      const token = localStorage.getItem('token');

      setIsLoadingMessages(true);
      setError(null);

      const response = await axios.get(`${API_BASE_URL}/api/chat/chat/${apiChatId}/messages`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      console.log('GET API Response:', response.data);

      if (response.data && response.data.messages) {
        if (response.data.chatStatus) {
          setChatStatus(response.data.chatStatus);
        }

        const transformedMessages = response.data.messages.map((msg, index) => ({
          id: msg.id || index,
          messageId: msg.messageId,
          text: msg.content,
          sender: msg.senderRole === 'counsellor' ? 'me' : 'user',
          senderRole: msg.senderRole,
          time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          fullTime: msg.createdAt,
          contentType: msg.contentType,
          isRead: msg.isRead,
          status: 'sent'
        }));

        setMessages(transformedMessages);
        saveMessagesToLocalStorage(transformedMessages);

        return transformedMessages;
      }
    } catch (error) {
      console.error('Error fetching messages from API:', error);
      loadMessagesFromLocalStorage();
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Save messages to localStorage
  const saveMessagesToLocalStorage = (messagesToSave) => {
    try {
      const savedChats = JSON.parse(localStorage.getItem('smsChats') || '[]');
      const chatIdToSave = getChatIdForAPI();
      const existingChatIndex = savedChats.findIndex(chat => chat.chatId === chatIdToSave);

      const chatData = {
        chatId: chatIdToSave,
        userId: selectedUser?.id,
        userName: selectedUser?.name,
        messages: messagesToSave,
        chatStatus: chatStatus,
        lastUpdated: new Date().toISOString()
      };

      if (existingChatIndex >= 0) {
        savedChats[existingChatIndex] = chatData;
      } else {
        savedChats.push(chatData);
      }

      localStorage.setItem('smsChats', JSON.stringify(savedChats));
    } catch (error) {
      console.error('Error saving messages to localStorage:', error);
    }
  };

  // Load messages from localStorage
  const loadMessagesFromLocalStorage = () => {
    try {
      const savedChats = JSON.parse(localStorage.getItem('smsChats') || '[]');
      const chatIdToLoad = getChatIdForAPI();
      const savedChat = savedChats.find(chat => chat.chatId === chatIdToLoad);

      if (savedChat && savedChat.messages) {
        setMessages(savedChat.messages);
        if (savedChat.chatStatus) {
          setChatStatus(savedChat.chatStatus);
        }
      }
    } catch (error) {
      console.error('Error loading messages from localStorage:', error);
    }
  };

  // Send message to API (POST)
  const sendMessageToAPI = async (messageContent) => {
    try {
      const apiChatId = getChatIdForAPI();
      const token = localStorage.getItem('token');

      const requestBody = {
        content: messageContent
      };

      const response = await axios.post(`${API_BASE_URL}/api/chat/chat/${apiChatId}/message`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      console.log('POST API Response:', response.data);

      if (response.data && response.data.success) {
        await fetchMessagesFromAPI();
        return response.data.message;
      } else {
        throw new Error('Invalid API response');
      }
    } catch (error) {
      console.error('Error sending message to API:', error);
      throw error;
    }
  };

  // Handle sending a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedUser || isSending) return;

    const messageText = message.trim();

    const tempMessage = {
      id: `temp_${Date.now()}`,
      text: messageText,
      sender: "me",
      senderRole: "counsellor",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      status: "sending",
      isTemporary: true
    };

    setMessages(prev => [...prev, tempMessage]);
    setMessage("");
    setIsSending(true);
    setError(null);

    try {
      await sendMessageToAPI(messageText);
      setMessages(prev => prev.filter(msg => !msg.isTemporary));
    } catch (err) {
      console.error('Error sending message:', err);

      setMessages(prev => prev.map(msg =>
        msg.id === tempMessage.id
          ? { ...msg, status: "error", error: "Failed to send" }
          : msg
      ));

      setError("Failed to send message. Please try again.");

      setTimeout(() => {
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      }, 3000);
    } finally {
      setIsSending(false);
    }
  };

  // Initialize video call with API (Counselor as initiator)
  const initiateVideoCall = async () => {
    console.log('Counselor: initiateVideoCall called');

    if (!selectedUser) {
      console.error('No user selected');
      setCallError('No user selected for call');
      return;
    }

    setIsInitiatingCall(true);
    setCallError(null);

    try {
      const token = localStorage.getItem('token');

      const initiatorId = COUNSELOR_ID;
      const initiatorName = COUNSELOR_NAME;
      const initiatorType = 'counsellor';

      const receiverId = USER_ID;
      const receiverName = USER_NAME;
      const receiverType = 'user';

      console.log('Call details:', {
        initiatorId,
        initiatorName,
        initiatorType,
        receiverId,
        receiverName,
        receiverType
      });

      const requestBody = {
        initiatorId: initiatorId,
        initiatorType: initiatorType,
        receiverId: receiverId,
        receiverType: receiverType,
        callType: "video"
      };

      const response = await axios.post(`${API_BASE_URL}/api/video/calls/initiate`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      console.log('Video call API response:', response.data);

      if (response.data && response.data.success) {
        const receiverAvatar = getAvatarByGender(selectedUser.gender);

        const callData = {
          id: response.data.callData?.id,
          callId: response.data.callId,
          roomId: response.data.roomId,
          name: response.data.callData?.receiver?.name || receiverName,
          type: 'video',
          profilePic: receiverAvatar,
          phoneNumber: selectedUser.phone || selectedUser.phoneNumber,
          status: response.data.status || 'ringing',
          date: 'Today',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          apiCallData: response.data.callData,
          initiator: response.data.callData?.initiator,
          receiver: response.data.callData?.receiver,
          location: selectedUser.location,
          company: selectedUser.company
        };

        console.log('Opening video modal with avatar:', callData.profilePic);
        setSelectedCall(callData);
        setIsVideoModalOpen(true);
      } else {
        throw new Error(response.data?.message || 'Failed to initiate video call');
      }
    } catch (error) {
      console.error('Error initiating video call:', error);
      console.error('Error details:', error.response?.data || error.message);

      let errorMessage = 'Failed to initiate video call. ';
      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please check your connection and try again.';
      }

      setCallError(errorMessage);

      const receiverAvatar = getAvatarByGender(selectedUser.gender);

      const fallbackCallData = {
        id: Date.now(),
        name: selectedUser.name,
        type: 'video',
        profilePic: receiverAvatar,
        phoneNumber: selectedUser.phone || selectedUser.phoneNumber,
        status: 'ringing',
        date: 'Today',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        location: selectedUser.location,
        company: selectedUser.company
      };
      setSelectedCall(fallbackCallData);
      setIsVideoModalOpen(true);
    } finally {
      setIsInitiatingCall(false);
    }
  };

  // Initialize voice call with API (Counselor as initiator)
  const initiateVoiceCall = async () => {
    console.log('Counselor: initiateVoiceCall called');

    if (!selectedUser) {
      console.error('No user selected');
      setCallError('No user selected for call');
      return;
    }

    setIsInitiatingCall(true);
    setCallError(null);

    try {
      const token = localStorage.getItem('token');

      const initiatorId = COUNSELOR_ID;
      const initiatorName = COUNSELOR_NAME;
      const initiatorType = 'counsellor';

      const receiverId = USER_ID;
      const receiverName = USER_NAME;
      const receiverType = 'user';

      const requestBody = {
        initiatorId: initiatorId,
        initiatorType: initiatorType,
        receiverId: receiverId,
        receiverType: receiverType,
        callType: "voice"
      };

      console.log('Sending voice call request:', requestBody);

      const response = await axios.post(`${API_BASE_URL}/api/video/calls/initiate`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      console.log('Voice call API response:', response.data);

      if (response.data && response.data.success) {
        const receiverAvatar = getAvatarByGender(selectedUser.gender);

        const callData = {
          id: response.data.callData?.id,
          callId: response.data.callId,
          roomId: response.data.roomId,
          name: response.data.callData?.receiver?.name || receiverName,
          type: 'voice',
          profilePic: receiverAvatar,
          phoneNumber: selectedUser.phone || selectedUser.phoneNumber,
          status: response.data.status || 'ringing',
          date: 'Today',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          apiCallData: response.data.callData,
          initiator: response.data.callData?.initiator,
          receiver: response.data.callData?.receiver,
          location: selectedUser.location || "Counseling Center",
          company: selectedUser.company || "Mental Health Support"
        };

        setSelectedCall(callData);
        setIsVoiceModalOpen(true);
      } else {
        throw new Error(response.data?.message || 'Failed to initiate voice call');
      }
    } catch (error) {
      console.error('Error initiating voice call:', error);

      let errorMessage = 'Failed to initiate voice call. ';
      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please check your connection and try again.';
      }

      setCallError(errorMessage);

      const receiverAvatar = getAvatarByGender(selectedUser.gender);

      const fallbackCallData = {
        id: Date.now(),
        name: selectedUser.name,
        type: 'voice',
        profilePic: receiverAvatar,
        phoneNumber: selectedUser.phone || selectedUser.phoneNumber,
        status: 'ringing',
        date: 'Today',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        location: selectedUser.location || "Counseling Center",
        company: selectedUser.company || "Mental Health Support"
      };
      setSelectedCall(fallbackCallData);
      setIsVoiceModalOpen(true);
    } finally {
      setIsInitiatingCall(false);
    }
  };

  // Handle video call
  const handleVideoCall = () => {
    console.log('Video call button clicked');
    initiateVideoCall();
  };

  // Handle voice call
  const handleVoiceCall = () => {
    console.log('Voice call button clicked');
    initiateVoiceCall();
  };

  // Shared Call API actions for Receiving
  const handleJoinIncomingCall = async (callId) => {
    try {
      const token = localStorage.getItem('token');
      const counsellorId = localStorage.getItem('counsellorId') || COUNSELOR_ID;
      
      const response = await axios.post(`${API_BASE_URL}/api/video/calls/${callId}/join`, {
        userId: counsellorId,
        userType: 'counsellor'
      }, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Join call response:', response.data);
      
      if (response.data && response.data.success) {
        // Prepare call data for video modal
        const callDataForModal = {
          id: response.data.callData?.id || callId,
          callId: callId,
          roomId: response.data.callData?.roomId || incomingCallData.roomId,
          name: incomingCallData.name,
          type: incomingCallData.callType,
          profilePic: incomingCallData.avatar,
          status: 'connected',
          date: 'Today',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          apiCallData: response.data.callData,
          isIncoming: true
        };
        
        // Open the appropriate modal based on call type
        if (incomingCallData.callType === 'video') {
          setSelectedCall(callDataForModal);
          setIsVideoModalOpen(true);
        } else {
          setSelectedCall(callDataForModal);
          setIsVoiceModalOpen(true);
        }
        
        return { success: true, data: response.data };
      } else {
        throw new Error(response.data?.message || 'Failed to join call');
      }
    } catch (error) {
      console.error('Error joining call:', error);
      throw error;
    }
  };

  const handleRejectIncomingCall = async (callId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/video/calls/${callId}/reject`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return true;
    } catch (error) {
      console.error('Error rejecting call:', error);
      return false;
    }
  };

  const handleEndIncomingCall = async (callId) => {
    try {
      const token = localStorage.getItem('token');
      const counsellorId = localStorage.getItem('counsellorId') || COUNSELOR_ID;

      await axios.put(`${API_BASE_URL}/api/video/calls/${callId}/end`, {
        userId: counsellorId,
        endedBy: 'counsellor'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return true;
    } catch (error) {
      console.error('Error ending call:', error);
      return false;
    }
  };

  // Poll for waiting calls
  useEffect(() => {
    let isMounted = true;
    let intervalId = null;

    const fetchIncomingCalls = async () => {
      try {
        const token = localStorage.getItem('token');
        const counsellorId = localStorage.getItem('counsellorId') || COUNSELOR_ID;

        if (!counsellorId || !token || showIncomingModal) return;

        const response = await axios.get(`${API_BASE_URL}/api/video/calls/pending/${counsellorId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!isMounted) return;

        const callsList = response.data.pendingRequests || [];

        if (response.data.success && callsList.length > 0) {
          const waitingCall = callsList[0];
          const fromData = waitingCall.from || {};

          // Determine display name - prioritize isAnonymous
          let displayName = 'Anonymous User';
          if (fromData.isAnonymous) {
            displayName = fromData.isAnonymous;
          } else if (fromData.displayName) {
            displayName = fromData.displayName;
          } else if (fromData.fullName) {
            displayName = fromData.fullName;
          } else if (fromData.name) {
            displayName = fromData.name;
          }

          // Determine avatar based on gender (emoji only)
          let avatar = '👤';
          if (fromData.gender === 'female') avatar = '👩';
          else if (fromData.gender === 'male') avatar = '👨';

          setIncomingCallData({
            callId: waitingCall.callId,
            roomId: waitingCall.roomId,
            name: displayName,
            avatar: avatar,
            callType: waitingCall.callType || 'video',
            requestMessage: waitingCall.requestMessage || `Incoming ${waitingCall.callType || 'video'} call...`,
            onEndCall: handleEndIncomingCall
          });
          setShowIncomingModal(true);
        }
      } catch (error) {
        console.error('Error polling for calls:', error);
      }
    };

    intervalId = setInterval(fetchIncomingCalls, 5000);
    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [showIncomingModal, COUNSELOR_ID]);

  // Handle close modal
  const handleCloseModal = () => {
    console.log('Closing call modal');
    setIsVideoModalOpen(false);
    setIsVoiceModalOpen(false);
    setSelectedCall(null);
    setCallError(null);
  };

  const handleBack = () => {
    navigate("/counselor-dashboard", { state: { selectedTab: "messages" } });
  };

  // Get gender-based avatar icon
  const getAvatarIcon = (gender) => {
    if (gender === 'male') return '👨';
    if (gender === 'female') return '👩';
    return '👤';
  };

  // Auto-scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages when component mounts or selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      fetchMessagesFromAPI();
    }
  }, [selectedUser, chatId]);

  // Auto-refresh messages every 30 seconds
  useEffect(() => {
    if (!selectedUser) return;

    const interval = setInterval(() => {
      fetchMessagesFromAPI();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedUser]);

  // Clear call error after 5 seconds
  useEffect(() => {
    if (callError) {
      const timer = setTimeout(() => {
        setCallError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [callError]);

  // Render chat status banner
  const renderChatStatusBanner = () => {
    if (!chatStatus) return null;

    let statusClass = '';
    let statusText = '';

    return (
      <div className={`sms-chat-status-banner ${statusClass}`}>
        {statusText}
      </div>
    );
  };

  // Render message status indicator
  const renderMessageStatus = (message) => {
    if (message.sender !== 'me') return null;

    switch (message.status) {
      case 'sending':
        return <span className="sms-message-status sending">⌛</span>;
      case 'sent':
        return <span className="sms-message-status sent">✓</span>;
      case 'error':
        return <span className="sms-message-status error">⚠️</span>;
      default:
        return null;
    }
  };

  if (!selectedUser) {
    return (
      <div className="smsinput-container no-user">
        <div className="smsinput-empty-state">
          <span className="empty-icon">💬</span>
          <h3>No user selected</h3>
          <p>Please select a user from the list to start messaging</p>
          <button className="back-to-list-btn" onClick={handleBack}>
            ← Back to SMS List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="smsinput-container">
      {/* Header with Back Button and User Info */}
      <div className="smsinput-header">
        <div className="header-left">
          <button className="back-button" onClick={handleBack} title="Back to SMS List">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor" />
            </svg>
          </button>

          <div className="smsinput-user-info">
            <div className="smsinput-user-avatar">
              <span className="avatar-icon">
                {getAvatarIcon(selectedUser.gender)}
              </span>
              <span className={`status-dot ${selectedUser.status || 'online'}`}></span>
            </div>
            <div className="smsinput-user-details">
              <h3>{selectedUser.name}</h3>
              <p className="smsinput-user-phone">{selectedUser.phone}</p>
              <p className="smsinput-user-email">{selectedUser.email}</p>
            </div>
          </div>
        </div>

        {/* Call buttons */}
        <div className="smsinput-call-buttons">
          <button
            className={`call-btn voice ${isInitiatingCall ? 'loading' : ''}`}
            onClick={handleVoiceCall}
            disabled={isInitiatingCall}
            title="Voice call"
          >
            <span className="call-icon">
              {isInitiatingCall ? '⏳' : '📞'}
            </span>
          </button>
          <button
            className={`call-btn video ${isInitiatingCall ? 'loading' : ''}`}
            onClick={handleVideoCall}
            disabled={isInitiatingCall}
            title="Video call"
          >
            <span className="call-icon">
              {isInitiatingCall ? '⏳' : '📹'}
            </span>
          </button>
        </div>
      </div>

      {/* Call Error Banner */}
      {callError && (
        <div className="sms-call-error-banner">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{callError}</span>
          <button className="error-close" onClick={() => setCallError(null)}>✕</button>
        </div>
      )}

      {/* Chat Status Banner */}
      {renderChatStatusBanner()}

      {/* Messages Display Area */}
      <div className="smsinput-messages" ref={messagesContainerRef}>
        {isLoadingMessages && messages.length === 0 ? (
          <div className="sms-loading-messages">
            <div className="sms-loading-spinner"></div>
            <p>Loading messages...</p>
          </div>
        ) : error && messages.length === 0 ? (
          <div className="sms-error-message">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <button onClick={fetchMessagesFromAPI} className="retry-btn">
              Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="sms-empty-messages">
            <span className="empty-messages-icon">💬</span>
            <p>No messages yet</p>
            <p className="empty-messages-subtext">Start a conversation by sending a message</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`smsinput-message ${msg.sender === 'me' ? 'sent' : 'received'}`}
            >
              <div className="message-bubble">
                <p className="message-text">{msg.text}</p>
                <div className="message-footer">
                  <span className="message-time">{msg.time}</span>
                  {renderMessageStatus(msg)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <form className="smsinput-form" onSubmit={handleSendMessage}>
        <div className="smsinput-input-wrapper">
          <button type="button" className="attach-btn" title="Attach file" disabled={isSending}>
            📎
          </button>
          <button type="button" className="emoji-btn" title="Add emoji" disabled={isSending}>
            😊
          </button>
          <input
            type="text"
            className="smsinput-input"
            placeholder={isSending ? "Sending..." : "Type your message..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSending}
          />
          <button
            type="submit"
            className={`send-btn ${message.trim() && !isSending ? 'active' : ''}`}
            disabled={!message.trim() || isSending}
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>

      {/* Call Modals */}
      <VideoCallModal
        isOpen={isVideoModalOpen}
        onClose={handleCloseModal}
        callData={selectedCall}
      />

      <VoiceCallModal
        isOpen={isVoiceModalOpen}
        onClose={handleCloseModal}
        callData={selectedCall}
      />

      {/* Professional Incoming Call Modal */}
      <IncomingCallModal
        isOpen={showIncomingModal}
        onClose={() => setShowIncomingModal(false)}
        callType={incomingCallData.callType}
        callerName={incomingCallData.name}
        callerAvatar={incomingCallData.avatar}
        callData={incomingCallData}
        onJoinCall={handleJoinIncomingCall}
        onRejectCall={handleRejectIncomingCall}
      />
    </div>
  );
};

export default SMSInput;