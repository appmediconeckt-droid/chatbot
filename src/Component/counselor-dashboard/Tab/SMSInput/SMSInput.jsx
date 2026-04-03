import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./SMSInput.css";
import VideoCallModal from "../../../UserDashboard/Tab/CallModal/VideoCallModal";
import VoiceCallModal from "../../../UserDashboard/Tab/CallModal/VoiceCallModal";
import { API_BASE_URL } from "../../../../axiosConfig";

/**
 * SMSInput Component - Message input with call buttons
 * Receives selected user from route state
 * Displays gender-based avatar icons (no photos)
 * Fetches messages from API and displays them
 */
const SMSInput = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [callActive, setCallActive] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Call modal states
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [isInitiatingCall, setIsInitiatingCall] = useState(false);
  const [callError, setCallError] = useState(null);
  
  // Message states
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [chatStatus, setChatStatus] = useState(null);
  
  // Get selected user from navigation state
  const selectedUser = location.state?.selectedUser;
  const chatId = location.state?.chatId;

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

  // Get the chat ID for API calls
  const getChatIdForAPI = () => {
    // Use chatId from location state if available
    if (chatId) return chatId;
    
    // Create a new chat ID if none exists (based on user ID or name)
    if (selectedUser) {
      return `chat_${selectedUser.id || selectedUser.name.replace(/\s/g, '_')}_${Date.now()}`;
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
        // Update chat status
        if (response.data.chatStatus) {
          setChatStatus(response.data.chatStatus);
        }
        
        // Transform API messages to UI format
        const transformedMessages = response.data.messages.map((msg, index) => ({
          id: msg.id || index,
          messageId: msg.messageId,
          text: msg.content,
          sender: msg.senderRole === 'user' ? 'user' : 'me',
          senderRole: msg.senderRole,
          time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          fullTime: msg.createdAt,
          contentType: msg.contentType,
          isRead: msg.isRead,
          status: 'sent'
        }));
        
        setMessages(transformedMessages);
        
        // Save to localStorage as backup
        saveMessagesToLocalStorage(transformedMessages);
        
        return transformedMessages;
      } else if (response.data && response.data.messages === undefined && messages.length === 0) {
        // If no messages, set empty array
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages from API:', error);
      console.error('Error details:', error.response?.data || error.message);
      setError('Failed to load messages. Please try again.');
      
      // Load from localStorage as fallback
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
        // After successful POST, fetch all messages again to get updated list
        await fetchMessagesFromAPI();
        return response.data.message;
      } else {
        throw new Error('Invalid API response');
      }
    } catch (error) {
      console.error('Error sending message to API:', error);
      console.error('Error details:', error.response?.data || error.message);
      throw error;
    }
  };

  // Handle sending a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedUser || isSending) return;

    const messageText = message.trim();
    
    // Create temporary message for optimistic UI update
    const tempMessage = {
      id: `temp_${Date.now()}`,
      text: messageText,
      sender: "me",
      senderRole: "user",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      status: "sending",
      isTemporary: true
    };
    
    // Add temporary message to UI
    setMessages(prev => [...prev, tempMessage]);
    setMessage("");
    setIsSending(true);
    setError(null);
    
    try {
      // Send message to API
      await sendMessageToAPI(messageText);
      
      // Remove temporary message (actual messages will be loaded by fetchMessagesFromAPI)
      setMessages(prev => prev.filter(msg => !msg.isTemporary));
      
    } catch (err) {
      console.error('Error sending message:', err);
      
      // Update temporary message to show error
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id 
          ? { ...msg, status: "error", error: "Failed to send" }
          : msg
      ));
      
      setError("Failed to send message. Please try again.");
      
      // Remove error message after 3 seconds
      setTimeout(() => {
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      }, 3000);
    } finally {
      setIsSending(false);
    }
  };

  // Initialize video call with API
  const initiateVideoCall = async () => {
    if (!selectedUser) return;
    
    setIsInitiatingCall(true);
    setCallError(null);
    
    try {
      const token = localStorage.getItem('token');
      const userId = currentUser?.id || currentUser?._id || 'user_123';
      const userName = currentUser?.name || currentUser?.fullName || currentUser?.username || 'User';
      const counsellorId = selectedUser.id ? selectedUser.id.toString() : selectedUser.userId?.toString() || 'counsellor_1';
      const counsellorName = selectedUser.name;
      
      const requestBody = {
        userId: userId,
        userName: userName,
        counsellorId: counsellorId,
        counsellorName: counsellorName,
        callType: "video"
      };
      
      console.log('Initiating video call with:', requestBody);
      
      const response = await axios.post(`${API_BASE_URL}/api/video/initiate`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      console.log('Video call API response:', response.data);
      
      if (response.data && response.data.success) {
        // Get profile display (emoji based on gender)
        const profileDisplay = selectedUser.gender === 'male' ? '👨' : 
                              selectedUser.gender === 'female' ? '👩' : '👤';
        
        const callData = {
          id: response.data.callData.id,
          callId: response.data.callId,
          roomId: response.data.roomId,
          name: counsellorName,
          type: 'video',
          profilePic: profileDisplay,
          phoneNumber: selectedUser.phone || selectedUser.phoneNumber,
          status: 'connecting',
          date: 'Today',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          apiCallData: response.data.callData,
          location: selectedUser.location,
          company: selectedUser.company
        };
        
        setSelectedCall(callData);
        setIsVideoModalOpen(true);
      } else {
        throw new Error(response.data.message || 'Failed to initiate video call');
      }
    } catch (error) {
      console.error('Error initiating video call:', error);
      setCallError(error.response?.data?.message || error.message || 'Failed to initiate video call');
      
      // Fallback: Open modal with default data
      const profileDisplay = selectedUser.gender === 'male' ? '👨' : 
                            selectedUser.gender === 'female' ? '👩' : '👤';
      
      const fallbackCallData = {
        id: selectedUser.id || Date.now(),
        name: selectedUser.name,
        type: 'video',
        profilePic: profileDisplay,
        phoneNumber: selectedUser.phone || selectedUser.phoneNumber,
        status: 'connecting',
        date: 'Today',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        location: selectedUser.location,
        company: selectedUser.company
      };
      setSelectedCall(fallbackCallData);
      setIsVideoModalOpen(true);
      
      // Show error toast/notification
      alert('Unable to connect to call server. Starting local call mode.');
    } finally {
      setIsInitiatingCall(false);
    }
  };

  // Initialize voice call with API
  const initiateVoiceCall = async () => {
    if (!selectedUser) return;
    
    setIsInitiatingCall(true);
    setCallError(null);
    
    try {
      const token = localStorage.getItem('token');
      const userId = currentUser?.id || currentUser?._id || 'user_123';
      const userName = currentUser?.name || currentUser?.fullName || currentUser?.username || 'User';
      const counsellorId = selectedUser.id ? selectedUser.id.toString() : selectedUser.userId?.toString() || 'counsellor_1';
      const counsellorName = selectedUser.name;
      
      const requestBody = {
        userId: userId,
        userName: userName,
        counsellorId: counsellorId,
        counsellorName: counsellorName,
        callType: "voice"
      };
      
      console.log('Initiating voice call with:', requestBody);
      
      const response = await axios.post(`${API_BASE_URL}/api/video/initiate`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      console.log('Voice call API response:', response.data);
      
      if (response.data && response.data.success) {
        // Get profile display (emoji based on gender)
        const profileDisplay = selectedUser.gender === 'male' ? '👨' : 
                              selectedUser.gender === 'female' ? '👩' : '👤';
        
        const callData = {
          id: response.data.callData.id,
          callId: response.data.callId,
          roomId: response.data.roomId,
          name: counsellorName,
          type: 'voice',
          profilePic: profileDisplay,
          phoneNumber: selectedUser.phone || selectedUser.phoneNumber,
          status: 'connecting',
          date: 'Today',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          apiCallData: response.data.callData,
          location: selectedUser.location || "Counseling Center",
          company: selectedUser.company || "Mental Health Support"
        };
        
        setSelectedCall(callData);
        setIsVoiceModalOpen(true);
      } else {
        throw new Error(response.data.message || 'Failed to initiate voice call');
      }
    } catch (error) {
      console.error('Error initiating voice call:', error);
      setCallError(error.response?.data?.message || error.message || 'Failed to initiate voice call');
      
      // Fallback: Open modal with default data
      const profileDisplay = selectedUser.gender === 'male' ? '👨' : 
                            selectedUser.gender === 'female' ? '👩' : '👤';
      
      const fallbackCallData = {
        id: selectedUser.id || Date.now(),
        name: selectedUser.name,
        type: 'voice',
        profilePic: profileDisplay,
        phoneNumber: selectedUser.phone || selectedUser.phoneNumber,
        status: 'connecting',
        date: 'Today',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        location: selectedUser.location || "Counseling Center",
        company: selectedUser.company || "Mental Health Support"
      };
      setSelectedCall(fallbackCallData);
      setIsVoiceModalOpen(true);
      
      // Show error toast/notification
      alert('Unable to connect to call server. Starting local call mode.');
    } finally {
      setIsInitiatingCall(false);
    }
  };

  // Handle video call
  const handleVideoCall = () => {
    initiateVideoCall();
  };

  // Handle voice call
  const handleVoiceCall = () => {
    initiateVoiceCall();
  };

  // Handle close modal
  const handleCloseModal = () => {
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
    
    switch (chatStatus) {
      case 'accepted':
        statusClass = 'status-accepted';
        statusText = '✓ Chat session active';
        break;
      case 'pending':
        statusClass = 'status-pending';
        statusText = '⏳ Waiting for response...';
        break;
      case 'ended':
        statusClass = 'status-ended';
        statusText = '🔒 Chat session ended';
        break;
      default:
        return null;
    }
    
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
              <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/>
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
        {/* Empty div for scrolling reference */}
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
    </div>
  );
};

export default SMSInput;