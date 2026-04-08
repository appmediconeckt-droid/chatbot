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

  // FIXED: Get current counselor with better validation
  const getCurrentCounselor = () => {
    let counselorData = null;

    // Check localStorage
    const storedCounselor = localStorage.getItem('counselor');
    if (storedCounselor) {
      try {
        counselorData = JSON.parse(storedCounselor);
        console.log('Counselor from localStorage:', counselorData);
      } catch (e) {
        console.error('Error parsing counselor from localStorage:', e);
      }
    }

    // Check sessionStorage
    if (!counselorData) {
      const sessionCounselor = sessionStorage.getItem('counselor');
      if (sessionCounselor) {
        try {
          counselorData = JSON.parse(sessionCounselor);
          console.log('Counselor from sessionStorage:', counselorData);
        } catch (e) {
          console.error('Error parsing counselor from sessionStorage:', e);
        }
      }
    }

    // Check user data
    if (!counselorData) {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.role === 'counselor' || user.role === 'counsellor' || user.userType === 'counselor') {
            counselorData = user;
            console.log('Counselor found in user data:', counselorData);
          }
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
    }

    return counselorData;
  };

  // FIXED: Get counselor ID from multiple sources with priority
  const getCounselorId = () => {
    // Priority 1: From currentCounselor object
    const counselor = getCurrentCounselor();
    if (counselor) {
      if (counselor._id) return counselor._id;
      if (counselor.id) return counselor.id;
      if (counselor.counselorId) return counselor.counselorId;
    }

    // Priority 2: From localStorage directly
    const storedId = localStorage.getItem('counselorId');
    if (storedId && storedId !== 'undefined') return storedId;

    // Priority 3: From sessionStorage
    const sessionId = sessionStorage.getItem('counselorId');
    if (sessionId && sessionId !== 'undefined') return sessionId;

    // Priority 4: From user object
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.role === 'counselor' || user.role === 'counsellor') {
          if (user._id) return user._id;
          if (user.id) return user.id;
        }
      } catch (e) { }
    }

    // Priority 5: From token (if needed)
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Try to decode JWT token to get user ID
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload && (payload._id || payload.id || payload.userId)) {
          return payload._id || payload.id || payload.userId;
        }
      } catch (e) {
        console.error('Error decoding token:', e);
      }
    }

    console.error('No valid counselor ID found');
    return null;
  };

  const getCounselorName = () => {
    const counselor = getCurrentCounselor();
    if (counselor) {
      if (counselor.name) return counselor.name;
      if (counselor.fullName) return counselor.fullName;
    }
    const storedName = localStorage.getItem('counselorName');
    if (storedName) return storedName;
    return 'Counselor';
  };

  const COUNSELOR_ID = getCounselorId();
  const COUNSELOR_NAME = getCounselorName();

  // FIXED: Extract user ID properly
  const getSelectedUserId = () => {
    if (!selectedUser) return null;

    // Direct properties
    const directIds = [
      selectedUser.receiverId,
      selectedUser._id,
      selectedUser.id,
      selectedUser.userId,
      selectedUser.user_id,
      selectedUser.uid,
      selectedUser.user?._id,
      selectedUser.user?.id,
      selectedUser.user?.userId,
      selectedUser.user?.user_id,
      selectedUser.otherParty?._id,
      selectedUser.otherParty?.id,
      selectedUser.otherParty?.userId
    ];

    for (const id of directIds) {
      if (id && id !== 'undefined') return id;
    }

    // Try to extract from chatId
    if (chatId && typeof chatId === 'string') {
      const parts = chatId.split('_');
      if (parts.length >= 2 && parts[1] && parts[1].length > 5) {
        return parts[1];
      }
      
      const match = chatId.match(/^([a-f0-9]+)_/i);
      if (match && match[1]) {
        return match[1];
      }
    }

    console.error('No valid user ID found');
    return null;
  };

  const getUserDetails = () => {
    const id = getSelectedUserId();
    return {
      id,
      name: selectedUser?.name || selectedUser?.fullName || selectedUser?.user?.name || selectedUser?.otherParty?.name || 'User',
      gender: selectedUser?.gender || selectedUser?.user?.gender || selectedUser?.otherParty?.gender,
      phone: selectedUser?.phone || selectedUser?.phoneNumber || selectedUser?.user?.phone || selectedUser?.otherParty?.phone,
      email: selectedUser?.email || selectedUser?.user?.email || selectedUser?.otherParty?.email
    };
  };

  const userDetails = getUserDetails();
  const USER_ID = userDetails.id;
  const USER_NAME = userDetails.name;

  console.log('SMSInput - IDs:', { COUNSELOR_ID, USER_ID, COUNSELOR_NAME, USER_NAME });

  // Function to get avatar based on gender
  const getAvatarByGender = (gender) => {
    if (gender === 'male') return '👨';
    if (gender === 'female') return '👩';
    return '👤';
  };

  // Get chat ID for API calls
  const getChatIdForAPI = () => {
    if (chatId) return chatId;
    if (selectedUser && USER_ID && COUNSELOR_ID) {
      return `chat_${USER_ID}_${COUNSELOR_ID}`;
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
        userId: USER_ID,
        userName: USER_NAME,
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

  // Send message to API
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

  // FIXED: Validate counselor exists before initiating call
  const validateCounselorBeforeCall = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/counselors/${COUNSELOR_ID}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Counselor validation response:', response.data);
      return response.data && response.data.success;
    } catch (error) {
      console.error('Counselor validation failed:', error);
      return false;
    }
  };

  // FIXED: Initialize video call with proper validation
  const initiateVideoCall = async () => {
    console.log('Counselor: initiateVideoCall called');
    console.log('Selected User:', selectedUser);

    if (!selectedUser) {
      console.error('No user selected');
      setCallError('No user selected for call');
      return;
    }

    // Get and validate counselor ID
    const counselorId = getCounselorId();
    if (!counselorId) {
      console.error('No counselor ID found');
      setCallError('Please login again to make calls');
      return;
    }

    // Validate counselor exists in backend
    const isValidCounselor = await validateCounselorBeforeCall();
    if (!isValidCounselor) {
      console.error('Counselor not found or invalid');
      setCallError('Counselor account not found. Please contact support.');
      return;
    }

    const userId = getSelectedUserId();
    console.log('Extracted User ID:', userId);
    console.log('Counselor ID:', counselorId);

    if (!userId) {
      console.error('No user ID found');
      setCallError('User information not found. Please select a user again.');
      return;
    }

    setIsInitiatingCall(true);
    setCallError(null);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');

      if (!token) {
        throw new Error('Authentication token not found');
      }

      const requestBody = {
        initiatorId: counselorId,
        initiatorType: 'counsellor',
        receiverId: userId,
        receiverType: 'user',
        callType: "video"
      };

      console.log('Sending call request:', requestBody);

      const response = await axios.post(`${API_BASE_URL}/api/video/calls/initiate`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('API Response:', response.data);

      if (response.data && response.data.success) {
        const callData = {
          id: response.data.callData?.id,
          callId: response.data.callId,
          roomId: response.data.roomId,
          name: selectedUser.name || USER_NAME,
          type: 'video',
          profilePic: getAvatarByGender(selectedUser.gender),
          phoneNumber: selectedUser.phone || selectedUser.phoneNumber,
          status: response.data.status || 'ringing',
          date: 'Today',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          apiCallData: response.data.callData,
          initiator: response.data.callData?.initiator,
          receiver: response.data.callData?.receiver
        };

        setSelectedCall(callData);
        setIsVideoModalOpen(true);
      } else {
        throw new Error(response.data?.message || response.data?.error || 'Failed to initiate video call');
      }
    } catch (error) {
      console.error('Error initiating video call:', error);

      let errorMessage = 'Failed to initiate video call. ';
      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else if (error.message) {
        errorMessage += error.message;
      }

      setCallError(errorMessage);
    } finally {
      setIsInitiatingCall(false);
    }
  };

  // FIXED: Initialize voice call with proper validation
  const initiateVoiceCall = async () => {
    console.log('Counselor: initiateVoiceCall called');

    if (!selectedUser) {
      console.error('No user selected');
      setCallError('No user selected for call');
      return;
    }

    const counselorId = getCounselorId();
    if (!counselorId) {
      console.error('No counselor ID found');
      setCallError('Please login again to make calls');
      return;
    }

    // Validate counselor exists in backend
    const isValidCounselor = await validateCounselorBeforeCall();
    if (!isValidCounselor) {
      console.error('Counselor not found or invalid');
      setCallError('Counselor account not found. Please contact support.');
      return;
    }

    const userId = getSelectedUserId();

    console.log('Extracted User ID for voice call:', userId);

    if (!userId) {
      console.error('No user ID found');
      setCallError('User information not found');
      return;
    }

    setIsInitiatingCall(true);
    setCallError(null);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');

      if (!token) {
        throw new Error('Authentication token not found');
      }

      const requestBody = {
        initiatorId: counselorId,
        initiatorType: 'counsellor',
        receiverId: userId,
        receiverType: 'user',
        callType: "voice"
      };

      console.log('Sending voice call request:', requestBody);

      const response = await axios.post(`${API_BASE_URL}/api/video/calls/initiate`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Voice call API response:', response.data);

      if (response.data && response.data.success) {
        const callData = {
          id: response.data.callData?.id,
          callId: response.data.callId,
          roomId: response.data.roomId,
          name: selectedUser.name || USER_NAME,
          type: 'voice',
          profilePic: getAvatarByGender(selectedUser.gender),
          phoneNumber: selectedUser.phone || selectedUser.phoneNumber,
          status: response.data.status || 'ringing',
          date: 'Today',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          apiCallData: response.data.callData
        };

        setSelectedCall(callData);
        setIsVoiceModalOpen(true);
      } else {
        throw new Error(response.data?.message || response.data?.error || 'Failed to initiate voice call');
      }
    } catch (error) {
      console.error('Error initiating voice call:', error);

      let errorMessage = 'Failed to initiate voice call. ';
      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else if (error.message) {
        errorMessage += error.message;
      }

      setCallError(errorMessage);
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

      if (!COUNSELOR_ID) {
        throw new Error('Counselor ID not found');
      }

      const response = await axios.put(`${API_BASE_URL}/api/video/calls/${callId}/accept`, {
        acceptorId: COUNSELOR_ID,
        acceptorType: 'counsellor'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Join call response:', response.data);

      if (response.data && response.data.success) {
        const callDataForModal = {
          id: response.data.callData?.id || callId,
          callId: callId,
          roomId: response.data.callData?.roomId || incomingCallData.roomId,
          name: incomingCallData.name,
          type: incomingCallData.callType,
          profilePic: incomingCallData.avatar,
          status: response.data.status || 'active',
          date: 'Today',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          apiCallData: response.data.callData,
          isIncoming: true
        };

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
      await axios.put(`${API_BASE_URL}/api/video/calls/${callId}/reject`, {
        userId: COUNSELOR_ID,
        reason: 'declined'
      }, {
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

      await axios.put(`${API_BASE_URL}/api/video/calls/${callId}/end`, {
        userId: COUNSELOR_ID,
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

        if (!COUNSELOR_ID || !token || showIncomingModal) {
          console.log('Skipping poll - missing data:', { COUNSELOR_ID, hasToken: !!token, showIncomingModal });
          return;
        }

        console.log('Polling for calls with counselor ID:', COUNSELOR_ID);

        const response = await axios.get(`${API_BASE_URL}/api/video/calls/pending/${COUNSELOR_ID}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!isMounted) return;

        const callsList = response.data.pendingRequests || [];

        if (response.data.success && callsList.length > 0) {
          const waitingCall = callsList[0];
          const fromData = waitingCall.from || {};

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
    if (selectedUser && COUNSELOR_ID) {
      fetchMessagesFromAPI();
    }
  }, [selectedUser, chatId, COUNSELOR_ID]);

  // Debug user data
  useEffect(() => {
    if (selectedUser) {
      console.log('=== DEBUG: Selected User Data ===');
      console.log('Full selectedUser object:', selectedUser);
      console.log('All keys in selectedUser:', Object.keys(selectedUser));
      console.log('Possible ID fields:', {
        _id: selectedUser._id,
        id: selectedUser.id,
        userId: selectedUser.userId,
        user_id: selectedUser.user_id,
        uid: selectedUser.uid
      });
      console.log('ChatId:', chatId);
      console.log('===============================');
    }
  }, [selectedUser, chatId]);

  // Debug counselor data
  useEffect(() => {
    console.log('=== DEBUG: Counselor Data ===');
    console.log('COUNSELOR_ID:', COUNSELOR_ID);
    console.log('COUNSELOR_NAME:', COUNSELOR_NAME);
    console.log('Current Counselor Object:', getCurrentCounselor());
    console.log('===========================');
  }, []);

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
    return (
      <div className={`sms-chat-status-banner`}>
        {/* Add status content here */}
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
                {getAvatarIcon(userDetails.gender)}
              </span>
              <span className={`status-dot ${selectedUser.status || 'online'}`}></span>
            </div>
            <div className="smsinput-user-details">
              <h3>{USER_NAME}</h3>
              <p className="smsinput-user-phone">{userDetails.phone}</p>
              <p className="smsinput-user-email">{userDetails.email}</p>
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
        onEndCall={handleEndIncomingCall}
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