import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Link, useParams, useLocation } from 'react-router-dom';
import './ChatBox.css';
import VideoCallModal from '../CallModal/VideoCallModal';
import VoiceCallModal from '../CallModal/VoiceCallModal';
import { API_BASE_URL } from '../../../../axiosConfig';

const ChatBox = () => {
    const { counselorId } = useParams();
    const location = useLocation();
    const { chatId, counselor: initialCounselor, user: initialUser } = location.state || {};

    // State for current chat
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [currentCounselor, setCurrentCounselor] = useState(initialCounselor || {
        id: parseInt(counselorId),
        name: 'Dr. Suresh Reddy',
        specialization: 'Clinical Psychologist',
        online: true,
        avatar: null,
        avatarType: 'text',
        profilePhoto: null,
        phoneNumber: '+91 98765 43215'
    });

    // Call modal states
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
    const [selectedCall, setSelectedCall] = useState(null);
    const [isInitiatingCall, setIsInitiatingCall] = useState(false);
    const [callError, setCallError] = useState(null);

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

    // Refs for scrolling and container
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const optionsRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const timeoutRef = useRef(null);

    // Function to get profile photo URL
    const getProfilePhotoUrl = (counselor) => {
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
            setTimeout(() => {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, []);

    // Get the chat ID for API calls
    const getChatIdForAPI = () => {
        if (chatId) return chatId;
        if (currentChat?.chatId) return currentChat.chatId;
        return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

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
        setIsInitiatingCall(true);
        setCallError(null);
        
        try {
            const token = localStorage.getItem('token');
            const userId = currentUser?.id || currentUser?._id || 'user_123';
            const userName = currentUser?.name || currentUser?.fullName || 'User';
            const counsellorId = currentCounselor.id.toString();
            const counsellorName = currentCounselor.name;
            
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
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('Video call API response:', response.data);
            
            if (response.data && response.data.success) {
                const callData = {
                    id: response.data.callData.id,
                    callId: response.data.callId,
                    roomId: response.data.roomId,
                    name: counsellorName,
                    type: 'video',
                    profilePic: getProfilePhotoUrl(currentCounselor) || currentCounselor.avatar || currentCounselor.name.charAt(0),
                    phoneNumber: currentCounselor.phoneNumber,
                    status: 'connecting',
                    date: 'Today',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    apiCallData: response.data.callData
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
            const fallbackCallData = {
                id: currentCounselor.id,
                name: currentCounselor.name,
                type: 'video',
                profilePic: getProfilePhotoUrl(currentCounselor) || currentCounselor.avatar || currentCounselor.name.charAt(0),
                phoneNumber: currentCounselor.phoneNumber,
                status: 'connecting',
                date: 'Today',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setSelectedCall(fallbackCallData);
            setIsVideoModalOpen(true);
            
            // Show error toast/notification
            alert('Unable to connect to call server. Please check your connection.');
        } finally {
            setIsInitiatingCall(false);
        }
    };

    // Initialize voice call with API
    const initiateVoiceCall = async () => {
        setIsInitiatingCall(true);
        setCallError(null);
        
        try {
            const token = localStorage.getItem('token');
            const userId = currentUser?.id || currentUser?._id || 'user_123';
            const userName = currentUser?.name || currentUser?.fullName || 'User';
            const counsellorId = currentCounselor.id.toString();
            const counsellorName = currentCounselor.name;
            
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
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('Voice call API response:', response.data);
            
            if (response.data && response.data.success) {
                const callData = {
                    id: response.data.callData.id,
                    callId: response.data.callId,
                    roomId: response.data.roomId,
                    name: counsellorName,
                    type: 'voice',
                    profilePic: getProfilePhotoUrl(currentCounselor) || currentCounselor.avatar || currentCounselor.name.charAt(0),
                    phoneNumber: currentCounselor.phoneNumber,
                    status: 'connecting',
                    date: 'Today',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    apiCallData: response.data.callData
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
            const fallbackCallData = {
                id: currentCounselor.id,
                name: currentCounselor.name,
                type: 'voice',
                profilePic: getProfilePhotoUrl(currentCounselor) || currentCounselor.avatar || currentCounselor.name.charAt(0),
                phoneNumber: currentCounselor.phoneNumber,
                status: 'connecting',
                date: 'Today',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setSelectedCall(fallbackCallData);
            setIsVoiceModalOpen(true);
            
            alert('Unable to connect to call server. Please check your connection.');
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

    // Load chat data and fetch messages
    useEffect(() => {
        const initializeChat = async () => {
            try {
                const savedChats = JSON.parse(localStorage.getItem('activeChats') || '[]');
                
                let chat = savedChats.find(c => c.id === chatId) || 
                          savedChats.find(c => c.counselorId === parseInt(counselorId));
                
                if (chat) {
                    setCurrentChat(chat);
                    setCurrentCounselor(chat.counselor);
                    
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
                        counselorId: parseInt(counselorId),
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
        scrollToBottom();
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
        const profilePhotoUrl = getProfilePhotoUrl(counselor);
        
        if (profilePhotoUrl) {
            return (
                <img 
                    src={profilePhotoUrl} 
                    alt={counselor.name}
                    className={`chat-profile-image-${size}`}
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `
                            <div class="chat-profile-initials-${size}">
                                ${getInitials(counselor.name)}
                            </div>
                        `;
                    }}
                />
            );
        }
        
        return (
            <div className={`chat-profile-initials-${size}`}>
                {getInitials(counselor.name)}
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
                                <span className={`chatActiveDot ${currentCounselor.online ? 'chatActiveOnline' : 'chatActiveOffline'}`} />
                            </div>
                            <div className="chatProfileInfo">
                                <h2 className="chatProfileName">{currentCounselor.name}</h2>
                                <p className="chatProfileStatus">
                                    {isTyping ? (
                                        <span className="chatTypingText" role="status">Typing...</span>
                                    ) : (
                                        <span className="chatStatusText">
                                            {currentCounselor.online ? 'Online' : 'Offline'}
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
                                            Welcome to your session with {currentCounselor.name}
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
                                placeholder={`Message ${currentCounselor.name}...`}
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
            />

            <VoiceCallModal
                isOpen={isVoiceModalOpen}
                onClose={handleCloseModal}
                callData={selectedCall}
            />
        </div>
    );
};

export default ChatBox;