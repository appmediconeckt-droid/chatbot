import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Link, useParams, useLocation } from 'react-router-dom';
import './ChatBox.css';
import VideoCallModal from '../CallModal/VideoCallModal';
import VoiceCallModal from '../CallModal/VoiceCallModal';
import { 
  FaVideo as FaVideoIcon, 
  FaPhoneAlt, 
  FaPhoneSlash, 
  FaSpinner, 
  FaMicrophone, 
  FaTimes, 
  FaUserCircle 
} from "react-icons/fa";
import { API_BASE_URL } from '../../../../axiosConfig';

// Professional Call Modal Component for Receiving Calls
const IncomingCallModal = ({ isOpen, onClose, callType, callerName, callerImage, callData, onAcceptCall, onRejectCall }) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [acceptError, setAcceptError] = useState(null);

  const handleAccept = async () => {
    if (isAccepting) return;
    
    setIsAccepting(true);
    setAcceptError(null);
    
    if (onAcceptCall && callData) {
      try {
        const result = await onAcceptCall(callData.callId);
        if (result && result.success) {
          onClose();
        } else {
          console.error('Failed to accept call');
          setAcceptError(result?.message || 'Failed to accept call');
        }
      } catch (error) {
        console.error('Error accepting call:', error);
        setAcceptError(error.message || 'Error accepting call');
      } finally {
        setIsAccepting(false);
      }
    } else {
      onClose();
      setIsAccepting(false);
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

  const displayName = callData?.from?.fullName || callData?.from?.displayName || callerName || "Counselor";
  const profilePhoto = callData?.from?.profilePhoto || callerImage;
  
  const formatRequestTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const requestedTime = callData?.requestedAt ? formatRequestTime(callData.requestedAt) : '';

  return (
    <div className="incoming-call-modal-overlay">
      <div className={`incoming-call-modal ${callType === 'video' ? 'video-call-modal' : 'voice-call-modal'}`}>
        <div className="incoming-call-content">
          <div className="incoming-caller-info">
            <div className="incoming-caller-avatar">
              {profilePhoto ? (
                <img src={profilePhoto} alt={displayName} />
              ) : (
                <FaUserCircle />
              )}
            </div>
            <h3 className="incoming-caller-name">{displayName}</h3>
            <p className="incoming-call-type">
              {callType === 'video' ? '📹 Video Call' : '📞 Voice Call'}
            </p>
            {requestedTime && (
              <p className="incoming-call-time">
                Received at {requestedTime}
              </p>
            )}
            <p className="incoming-call-message">
              {callData?.requestMessage || `Incoming ${callType} call...`}
            </p>
            {acceptError && (
              <p className="incoming-call-error" style={{ color: 'red', fontSize: '12px', marginTop: '8px' }}>
                {acceptError}
              </p>
            )}
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
              onClick={handleAccept} 
              disabled={isAccepting}
            >
              {isAccepting ? <FaSpinner className="spinning" /> : <FaPhoneAlt />}
              <span>{isAccepting ? 'Accepting...' : 'Accept'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatBox = () => {
    const { counselorId } = useParams();
    const location = useLocation();
    const { chatId, counselor: initialCounselor, user: initialUser } = location.state || {};

    // State for current chat
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState([]);
    
    // Fixed: Initialize currentCounselor with safe default values
    const [currentCounselor, setCurrentCounselor] = useState(() => {
        if (initialCounselor) {
            return initialCounselor;
        }
        return {
            id: counselorId || '69c679b6e0e8f0800ff08fd1',
            name: 'Dr. Suresh Reddy',
            specialization: 'Clinical Psychologist',
            online: true,
            avatar: null,
            avatarType: 'text',
            profilePhoto: null,
            phoneNumber: '+91 98765 43215'
        };
    });

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
        image: null,
        callId: '',
        roomId: '',
        callType: 'video'
    });

    const [newMessage, setNewMessage] = useState('');
    const [showOptions, setShowOptions] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [chatStatus, setChatStatus] = useState(null);
    
    // Get current user from localStorage
    const getCurrentUser = () => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                return JSON.parse(userData);
            } catch (e) {
                return null;
            }
        }
        return null;
    };

    const currentUser = getCurrentUser();

    // Fixed user data for API
    const defaultInitiatorId = '69c7767218a4fa39b1ee9db9';
    const defaultInitiatorName = 'Arun';
    const defaultReceiverId = counselorId || '69c679b6e0e8f0800ff08fd1';
    const defaultReceiverName = currentCounselor?.name || 'Counselor';

    // Refs for scrolling and container
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const optionsRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const timeoutRef = useRef(null);

    // Function to get profile photo URL
    const getProfilePhotoUrl = (counselor) => {
        if (!counselor) return null;
        if (counselor?.profilePhoto?.url) {
            return counselor.profilePhoto.url;
        }
        if (counselor?.avatar && counselor.avatarType === 'image') {
            return counselor.avatar;
        }
        return null;
    };

    // Function to get initials
    const getInitials = (name) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Scroll to bottom function
    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);

    // Get the chat ID for API calls
    const getChatIdForAPI = () => {
        if (chatId) return chatId;
        if (currentChat?.chatId) return currentChat.chatId;
        return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    // FIXED: Join API with POST method
    const handleAcceptCall = async (callId) => {
        try {
            const token = localStorage.getItem('token');
            const userId = currentUser?.id || currentUser?._id || defaultInitiatorId;

            console.log('Accepting call with ID:', callId);
            console.log('User ID:', userId);

            // POST request to join API with the required body
            const response = await axios.post(
                `${API_BASE_URL}/api/video/calls/${callId}/join`,
                {
                    userId: userId,
                    userType: 'user'
                },
                {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Join call API response:', response.data);

            if (response.data && response.data.success) {
                // Prepare call data for the modal
                const callDataForModal = {
                    id: response.data.callData?.id || callId,
                    callId: callId,
                    roomId: response.data.callData?.roomId || incomingCallData.roomId,
                    name: incomingCallData.name,
                    type: incomingCallData.callType,
                    profilePic: incomingCallData.image,
                    status: 'connected',
                    date: 'Today',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    apiCallData: response.data.callData,
                    isIncoming: true
                };

                // Open the appropriate call modal based on call type
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
            console.error('Error accepting call:', error);
            let errorMessage = 'Failed to accept call. ';
            if (error.response?.data?.message) {
                errorMessage += error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMessage += error.response.data.error;
            } else if (error.message) {
                errorMessage += error.message;
            }
            throw new Error(errorMessage);
        }
    };

    const handleRejectCall = async (callId) => {
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

    const handleEndCall = async (callId) => {
        try {
            const token = localStorage.getItem('token');
            const userId = currentUser?.id || currentUser?._id || defaultInitiatorId;

            await axios.put(`${API_BASE_URL}/api/video/calls/${callId}/end`, {
                userId: userId,
                endedBy: 'user'
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
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
                const userId = currentUser?.id || currentUser?._id || defaultInitiatorId;

                if (!userId || !token || showIncomingModal) {
                    console.log('Skipping poll - missing data:', { userId, hasToken: !!token, showIncomingModal });
                    return;
                }

                console.log('Polling for calls with user ID:', userId);

                const response = await axios.get(`${API_BASE_URL}/api/video/calls/pending/${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!isMounted) return;

                const callsList = response.data.pendingRequests || [];

                if (response.data.success && callsList.length > 0) {
                    const waitingCall = callsList[0];
                    const fromData = waitingCall.from || {};
                    
                    // Extract full name properly
                    const callerFullName = fromData.fullName || fromData.displayName || 'Counselor';
                    
                    setIncomingCallData({
                        callId: waitingCall.callId,
                        roomId: waitingCall.roomId,
                        name: callerFullName,
                        image: fromData.profilePhoto || null,
                        callType: waitingCall.callType || 'video',
                        from: fromData,
                        requestMessage: waitingCall.requestMessage,
                        requestedAt: waitingCall.requestedAt,
                        expiresAt: waitingCall.expiresAt,
                        remainingSeconds: waitingCall.remainingSeconds
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
    }, [showIncomingModal, currentUser]);

    // GET messages from API
    const fetchMessagesFromAPI = async () => {
        try {
            const apiChatId = getChatIdForAPI();
            const token = localStorage.getItem('token');
            
            setIsLoadingMessages(true);
            
            const response = await axios.get(`${API_BASE_URL}/api/chat/chat/${apiChatId}/messages`, {
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
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
                    sender: msg.senderRole === 'user' ? 'user' : 'counselor',
                    senderRole: msg.senderRole,
                    time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    fullTime: msg.createdAt,
                    contentType: msg.contentType,
                    isRead: msg.isRead,
                    status: 'sent'
                }));
                
                setMessages(transformedMessages);
                
                if (currentChat) {
                    setCurrentChat(prev => ({
                        ...prev,
                        messages: transformedMessages,
                        chatStatus: response.data.chatStatus
                    }));
                }
                
                return transformedMessages;
            }
        } catch (error) {
            console.error('Error fetching messages from API:', error);
            loadMessagesFromLocalStorage();
        } finally {
            setIsLoadingMessages(false);
        }
    };

    // Load messages from localStorage (fallback)
    const loadMessagesFromLocalStorage = () => {
        try {
            const savedChats = JSON.parse(localStorage.getItem('activeChats') || '[]');
            const chat = savedChats.find(c => c.id === currentChat?.id || c.chatId === getChatIdForAPI());
            if (chat && chat.messages) {
                setMessages(chat.messages);
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
                    'Authorization': `Bearer ${token}`
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
    const handleSendMessage = async () => {
        if (newMessage.trim() === '' || isSending) return;

        const messageText = newMessage.trim();
        
        const tempUserMessage = {
            id: `temp_${Date.now()}`,
            text: messageText,
            sender: 'user',
            senderRole: 'user',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: new Date().toISOString(),
            status: 'sending',
            isTemporary: true
        };
        
        setMessages(prev => [...prev, tempUserMessage]);
        setNewMessage('');
        setShowEmojiPicker(false);
        setIsSending(true);
        
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        
        try {
            await sendMessageToAPI(messageText);
            setMessages(prev => prev.filter(msg => !msg.isTemporary));
        } catch (err) {
            console.error('Error in message sending flow:', err);
            setMessages(prev => prev.map(msg => 
                msg.id === tempUserMessage.id 
                    ? { ...msg, status: 'error', error: 'Failed to send message' }
                    : msg
            ));
            
            const errorMessage = {
                id: `error_${Date.now()}`,
                text: "⚠️ Failed to send message. Please check your internet connection and try again.",
                sender: 'counselor',
                senderRole: 'counsellor',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isError: true,
                status: 'error'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsSending(false);
        }
    };

    // Initialize video call with API
    const initiateVideoCall = async () => {
        console.log('initiateVideoCall called');
        
        if (!currentCounselor) {
            console.error('Current counselor is undefined');
            setCallError('Counselor information not available');
            return;
        }
        
        setIsInitiatingCall(true);
        setCallError(null);
        
        try {
            const token = localStorage.getItem('token');
            
            // Get user details
            const initiatorId = currentUser?.id || currentUser?._id || defaultInitiatorId;
            const initiatorName = currentUser?.name || currentUser?.fullName || defaultInitiatorName;
            const initiatorType = 'user';
            
            // Get receiver (counselor) details
            const receiverId = currentCounselor.id?.toString() || defaultReceiverId;
            const receiverName = currentCounselor.name || defaultReceiverName;
            const receiverType = 'counsellor';
            
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
                const receiverProfilePhoto = response.data.callData?.receiver?.profilePhoto || 
                                            getProfilePhotoUrl(currentCounselor) || 
                                            currentCounselor?.avatar || 
                                            currentCounselor?.name?.charAt(0) || '👤';
                
                const callData = {
                    id: response.data.callData?.id,
                    callId: response.data.callId,
                    roomId: response.data.roomId,
                    name: response.data.callData?.receiver?.name || receiverName,
                    type: 'video',
                    profilePic: receiverProfilePhoto,
                    phoneNumber: currentCounselor?.phoneNumber,
                    status: response.data.status || 'ringing',
                    date: 'Today',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    apiCallData: response.data.callData,
                    initiator: response.data.callData?.initiator,
                    receiver: response.data.callData?.receiver
                };
                
                console.log('Opening video modal with:', callData);
                setSelectedCall(callData);
                setIsVideoModalOpen(true);
            } else {
                throw new Error(response.data?.message || 'Failed to initiate video call');
            }
        } catch (error) {
            console.error('Error initiating video call:', error);
            
            let errorMessage = 'Failed to initiate video call. ';
            if (error.response?.data?.message) {
                errorMessage += error.response.data.message;
            } else if (error.message) {
                errorMessage += error.message;
            } else {
                errorMessage += 'Please check your connection and try again.';
            }
            
            setCallError(errorMessage);
            
            // Still open modal with fallback data for demo
            console.log('Opening fallback video modal');
            const fallbackCallData = {
                id: Date.now(),
                name: currentCounselor?.name || 'Counselor',
                type: 'video',
                profilePic: getProfilePhotoUrl(currentCounselor) || currentCounselor?.avatar || currentCounselor?.name?.charAt(0) || '👤',
                phoneNumber: currentCounselor?.phoneNumber,
                status: 'ringing',
                date: 'Today',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setSelectedCall(fallbackCallData);
            setIsVideoModalOpen(true);
        } finally {
            setIsInitiatingCall(false);
        }
    };

    // Initialize voice call with API
    const initiateVoiceCall = async () => {
        console.log('initiateVoiceCall called');
        
        if (!currentCounselor) {
            console.error('Current counselor is undefined');
            setCallError('Counselor information not available');
            return;
        }
        
        setIsInitiatingCall(true);
        setCallError(null);
        
        try {
            const token = localStorage.getItem('token');
            
            // Get user details
            const initiatorId = currentUser?.id || currentUser?._id || defaultInitiatorId;
            const initiatorName = currentUser?.name || currentUser?.fullName || defaultInitiatorName;
            const initiatorType = 'user';
            
            // Get receiver (counselor) details
            const receiverId = currentCounselor.id?.toString() || defaultReceiverId;
            const receiverName = currentCounselor.name || defaultReceiverName;
            const receiverType = 'counsellor';
            
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
                const receiverProfilePhoto = response.data.callData?.receiver?.profilePhoto || 
                                            getProfilePhotoUrl(currentCounselor) || 
                                            currentCounselor?.avatar || 
                                            currentCounselor?.name?.charAt(0) || '👤';
                
                const callData = {
                    id: response.data.callData?.id,
                    callId: response.data.callId,
                    roomId: response.data.roomId,
                    name: response.data.callData?.receiver?.name || receiverName,
                    type: 'voice',
                    profilePic: receiverProfilePhoto,
                    phoneNumber: currentCounselor?.phoneNumber,
                    status: response.data.status || 'ringing',
                    date: 'Today',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    apiCallData: response.data.callData,
                    initiator: response.data.callData?.initiator,
                    receiver: response.data.callData?.receiver
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
            
            // Fallback modal
            const fallbackCallData = {
                id: Date.now(),
                name: currentCounselor?.name || 'Counselor',
                type: 'voice',
                profilePic: getProfilePhotoUrl(currentCounselor) || currentCounselor?.avatar || currentCounselor?.name?.charAt(0) || '👤',
                phoneNumber: currentCounselor?.phoneNumber,
                status: 'ringing',
                date: 'Today',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

    // Handle close modal
    const handleCloseModal = () => {
        console.log('Closing call modal');
        setIsVideoModalOpen(false);
        setIsVoiceModalOpen(false);
        setSelectedCall(null);
        setCallError(null);
    };

    // Load chat data and fetch messages
    useEffect(() => {
        const initializeChat = async () => {
            try {
                const savedChats = JSON.parse(localStorage.getItem('activeChats') || '[]');
                
                let chat = savedChats.find(c => c.id === chatId) || 
                          savedChats.find(c => c.counselorId === counselorId);
                
                if (chat) {
                    setCurrentChat(chat);
                    if (chat.counselor) {
                        setCurrentCounselor(chat.counselor);
                    }
                    
                    if (chat.unread) {
                        const updatedChats = savedChats.map(c => {
                            if (c.id === chat.id) {
                                return { ...c, unread: false };
                            }
                            return c;
                        });
                        localStorage.setItem('activeChats', JSON.stringify(updatedChats));
                    }
                } else if (initialCounselor) {
                    const newChat = {
                        id: Date.now(),
                        chatId: chatId || `chat_${Date.now()}`,
                        counselorId: counselorId,
                        counselor: initialCounselor,
                        user: initialUser || { name: 'User', email: 'user@example.com' },
                        messages: [],
                        unread: false,
                        startedAt: new Date().toISOString()
                    };
                    setCurrentChat(newChat);
                    
                    const updatedChats = [...savedChats, newChat];
                    localStorage.setItem('activeChats', JSON.stringify(updatedChats));
                }
                
                await fetchMessagesFromAPI();
                
            } catch (error) {
                console.error('Error loading chat:', error);
            }
        };

        initializeChat();
    }, [counselorId, chatId, initialCounselor, initialUser]);

    // Save messages to localStorage
    useEffect(() => {
        if (currentChat && messages.length > 0) {
            try {
                const savedChats = JSON.parse(localStorage.getItem('activeChats') || '[]');
                const updatedChats = savedChats.map(chat => {
                    if (chat.id === currentChat.id) {
                        return { 
                            ...chat, 
                            messages: messages,
                            lastMessage: messages[messages.length - 1]?.text,
                            lastMessageTime: messages[messages.length - 1]?.time,
                            unread: false,
                            chatStatus: chatStatus
                        };
                    }
                    return chat;
                });
                localStorage.setItem('activeChats', JSON.stringify(updatedChats));
            } catch (error) {
                console.error('Error saving messages:', error);
            }
        }
    }, [messages, currentChat, chatStatus]);

    // Scroll to bottom
    useEffect(() => {
        if (messagesEndRef.current) {
            scrollToBottom();
        }
    }, [messages, scrollToBottom]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (optionsRef.current && !optionsRef.current.contains(event.target)) {
                setShowOptions(false);
            }
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Cleanup timeout
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Auto-refresh messages
    useEffect(() => {
        const interval = setInterval(() => {
            if (currentChat) {
                fetchMessagesFromAPI();
            }
        }, 30000);
        
        return () => clearInterval(interval);
    }, [currentChat]);

    // Handle key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !isSending) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Add emoji
    const addEmoji = (emoji) => {
        setNewMessage(prev => prev + emoji);
        const input = document.getElementById('messageInput');
        if (input) {
            input.focus();
        }
    };

    const emojis = ['😊', '😂', '🥰', '😎', '😢', '😡', '👍', '👋', '❤️', '🎉', '🙏', '💪'];

    const optionsMenuItems = [
        { id: 1, label: 'Refresh Messages', icon: '🔄' },
        { id: 2, label: 'Clear Chat', icon: '🗑️' },
        { id: 3, label: 'Report Issue', icon: '⚠️' },
        { id: 4, label: 'Chat Details', icon: '📋' },
    ];

    // Handle file attachment
    const handleFileAttach = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                const fileMessage = {
                    id: `temp_${Date.now()}`,
                    text: `📎 Attached file: ${file.name}`,
                    sender: 'user',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isFile: true,
                    status: 'sending',
                    isTemporary: true
                };
                setMessages(prev => [...prev, fileMessage]);
                
                setTimeout(() => {
                    setMessages(prev => prev.filter(msg => !msg.isTemporary));
                }, 1000);
            }
        };
        input.click();
    };

    // Handle input change
    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
        setIsTyping(e.target.value.trim() !== '');
    };

    // Render profile avatar
    const renderProfileAvatar = (counselor, size = 'md') => {
        if (!counselor) {
            return <div className={`chat-profile-initials-${size}`}>?</div>;
        }
        
        const profilePhotoUrl = getProfilePhotoUrl(counselor);
        
        if (profilePhotoUrl) {
            return (
                <img 
                    src={profilePhotoUrl} 
                    alt={counselor.name || 'Counselor'}
                    className={`chat-profile-image-${size}`}
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `
                            <div class="chat-profile-initials-${size}">
                                ${getInitials(counselor.name || 'Counselor')}
                            </div>
                        `;
                    }}
                />
            );
        }
        
        return (
            <div className={`chat-profile-initials-${size}`}>
                {getInitials(counselor.name || 'Counselor')}
            </div>
        );
    };

    // Render message status
    const renderMessageStatus = (message) => {
        if (message.sender !== 'user') return null;
        
        switch (message.status) {
            case 'sending':
                return <span className="message-status sending">⌛ Sending...</span>;
            case 'sent':
                return <span className="message-status sent">✓ Sent</span>;
            case 'error':
                return <span className="message-status error">⚠️ Failed</span>;
            default:
                return null;
        }
    };

    // Render chat status banner
    const renderChatStatusBanner = () => {
        if (!chatStatus) return null;
        
        let statusClass = '';
        let statusText = '';
        
        switch (chatStatus) {
            case 'accepted':
                statusClass = 'status-accepted';
                statusText = '✓ Chat session active';
                break;
            case 'pending':
                statusClass = 'status-pending';
                statusText = '⏳ Waiting for counselor to accept...';
                break;
            case 'ended':
                statusClass = 'status-ended';
                statusText = '🔒 Chat session ended';
                break;
            default:
                return null;
        }
        
        return (
            <div className={`chat-status-banner ${statusClass}`}>
                {statusText}
            </div>
        );
    };

    // Safe check for counselor name
    const counselorName = currentCounselor?.name || 'Counselor';
    const counselorOnline = currentCounselor?.online || false;

    return (
        <div className="chatContainerFull">
            <div className="chatBoxMain">
                {/* Chat Header */}
                <header className="chatBoxHeader">
                    <div className="chatBoxHeaderLeft">
                        <Link to="/user-dashboard" className="chatBackBtn" aria-label="Go back">
                            ←
                        </Link>
                        <div className="chatUserDetails">
                            <div className="chatProfilePic" aria-label="Counselor profile picture">
                                {renderProfileAvatar(currentCounselor, 'md')}
                                <span className={`chatActiveDot ${counselorOnline ? 'chatActiveOnline' : 'chatActiveOffline'}`} />
                            </div>
                            <div className="chatProfileInfo">
                                <h2 className="chatProfileName">{counselorName}</h2>
                                <p className="chatProfileStatus">
                                    {isTyping ? (
                                        <span className="chatTypingText" role="status">Typing...</span>
                                    ) : (
                                        <span className="chatStatusText">
                                            {counselorOnline ? 'Online' : 'Offline'}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="chatBoxHeaderRight">
                        <button 
                            className={`chatActionBtn chatVideoBtn ${isInitiatingCall ? 'disabled' : ''}`}
                            onClick={handleVideoCall}
                            disabled={isInitiatingCall}
                            aria-label="Video call"
                        >
                            <span className="chatBtnIcon" aria-hidden="true">
                                {isInitiatingCall ? '⏳' : '📹'}
                            </span>
                            <span className="chatBtnTooltip">Video Call</span>
                        </button>
                        
                        <button 
                            className={`chatActionBtn chatAudioBtn ${isInitiatingCall ? 'disabled' : ''}`}
                            onClick={handleVoiceCall}
                            disabled={isInitiatingCall}
                            aria-label="Voice call"
                        >
                            <span className="chatBtnIcon" aria-hidden="true">
                                {isInitiatingCall ? '⏳' : '📞'}
                            </span>
                            <span className="chatBtnTooltip">Voice Call</span>
                        </button>
                        
                        <div className="chatMoreOptions" ref={optionsRef}>
                            <button 
                                className="chatActionBtn"
                                onClick={() => setShowOptions(!showOptions)}
                                aria-label="More options"
                                aria-expanded={showOptions}
                            >
                                <span className="chatBtnIcon" aria-hidden="true">⋮</span>
                            </button>
                            
                            {showOptions && (
                                <div className="chatDropdownMenu" role="menu">
                                    {optionsMenuItems.map(item => (
                                        <button
                                            key={item.id}
                                            className="chatDropdownItem"
                                            onClick={() => {
                                                setShowOptions(false);
                                                if (item.label === 'Clear Chat') {
                                                    setMessages([]);
                                                } else if (item.label === 'Refresh Messages') {
                                                    fetchMessagesFromAPI();
                                                } else {
                                                    alert(`${item.label} clicked`);
                                                }
                                            }}
                                            role="menuitem"
                                        >
                                            <span className="chatDropdownIcon" aria-hidden="true">{item.icon}</span>
                                            <span className="chatDropdownText">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Chat Status Banner */}
                {renderChatStatusBanner()}

                {/* Call Error Banner */}
                {callError && (
                    <div className="call-error-banner">
                        <span className="error-icon">⚠️</span>
                        <span className="error-text">{callError}</span>
                        <button className="error-close" onClick={() => setCallError(null)}>✕</button>
                    </div>
                )}

                {/* Messages Container */}
                <main className="chatMessagesArea" ref={messagesContainerRef}>
                    {isLoadingMessages && messages.length === 0 ? (
                        <div className="chatLoadingMessages">
                            <div className="loading-spinner"></div>
                            <p>Loading messages...</p>
                        </div>
                    ) : (
                        <>
                            <div className="chatWelcomeCard">
                                <div className="chatWelcomeInner">
                                    <div className="chatWelcomeAvatar" aria-hidden="true">
                                        {renderProfileAvatar(currentCounselor, 'lg')}
                                    </div>
                                    <div className="chatWelcomeMsg">
                                        <h3 className="chatWelcomeTitle">
                                            Welcome to your session with {counselorName}
                                        </h3>
                                        <p className="chatWelcomeDesc">
                                            This is a safe space to share your thoughts and feelings.
                                            Everything discussed here is confidential.
                                        </p>
                                        <time className="chatWelcomeTime">
                                            {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                                        </time>
                                    </div>
                                </div>
                            </div>

                            {messages.map((message, index) => (
                                <article 
                                    key={message.id || index} 
                                    className={`chatMsgBubble ${message.sender === 'user' ? 'chatMsgRight' : 'chatMsgLeft'} ${message.status === 'error' ? 'message-error' : ''}`}
                                >
                                    <div className="chatMsgContent">
                                        <p className="chatMsgText">{message.text}</p>
                                        <div className="chatMsgFooter">
                                            <time className="chatMsgTimestamp">{message.time}</time>
                                            {renderMessageStatus(message)}
                                        </div>
                                    </div>
                                </article>
                            ))}
                            
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </main>

                {/* Emoji Picker */}
                {showEmojiPicker && (
                    <div className="chatEmojiBox" ref={emojiPickerRef} role="dialog" aria-label="Emoji picker">
                        <div className="emojiBoxHeader">
                            <span className="emojiBoxTitle">Emoji</span>
                            <button 
                                className="emojiBoxClose"
                                onClick={() => setShowEmojiPicker(false)}
                                aria-label="Close emoji picker"
                            >
                                ×
                            </button>
                        </div>
                        <div className="emojiBoxGrid">
                            {emojis.map((emoji, index) => (
                                <button
                                    key={index}
                                    className="emojiBoxItem"
                                    onClick={() => addEmoji(emoji)}
                                    aria-label={`Emoji ${emoji}`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Message Input Area */}
                <footer className="chatInputArea">
                    <div className="chatInputGroup">
                        <button 
                            className="chatAttachBtn"
                            onClick={handleFileAttach}
                            disabled={isSending}
                            aria-label="Attach file"
                        >
                            <span className="attachIcon" aria-hidden="true">📎</span>
                        </button>
                        <div className="chatInputWrapper">
                            <input
                                id="messageInput"
                                type="text"
                                value={newMessage}
                                onChange={handleInputChange}
                                onKeyPress={handleKeyPress}
                                placeholder={`Message ${counselorName}...`}
                                className="chatTextInput"
                                autoComplete="off"
                                disabled={isSending}
                                aria-label="Message input"
                            />
                            <button 
                                className="chatEmojiBtn"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                disabled={isSending}
                                aria-label="Open emoji picker"
                                aria-expanded={showEmojiPicker}
                            >
                                <span className="emojiIcon" aria-hidden="true">😊</span>
                            </button>
                        </div>
                        
                        <button 
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || isSending}
                            className="chatSendBtn"
                            aria-label="Send message"
                        >
                            <span className="sendIcon" aria-hidden="true">
                                {isSending ? '⏳' : '➤'}
                            </span>
                        </button>
                    </div>
                </footer>
            </div>

            {/* Call Modals */}
            <VideoCallModal
                isOpen={isVideoModalOpen}
                onClose={handleCloseModal}
                callData={selectedCall}
                currentUser={currentUser}
            />

            <VoiceCallModal
                isOpen={isVoiceModalOpen}
                onClose={handleCloseModal}
                callData={selectedCall}
                currentUser={currentUser}
            />

            {/* Professional Incoming Call Modal */}
            <IncomingCallModal
                isOpen={showIncomingModal}
                onClose={() => setShowIncomingModal(false)}
                callType={incomingCallData.callType}
                callerName={incomingCallData.name}
                callerImage={incomingCallData.image}
                callData={incomingCallData}
                onAcceptCall={handleAcceptCall}
                onRejectCall={handleRejectCall}
                onEnd={handleEndCall}
            />
        </div>
    );
};

export default ChatBox;