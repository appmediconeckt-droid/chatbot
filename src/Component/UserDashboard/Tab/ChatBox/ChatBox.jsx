import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Link, useParams, useLocation } from 'react-router-dom';
import './ChatBox.css';
import VideoCallModal from '../CallModal/VideoCallModal';
import VoiceCallModal from '../CallModal/VoiceCallModal';

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

    const [newMessage, setNewMessage] = useState('');
    const [showOptions, setShowOptions] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [chatStatus, setChatStatus] = useState(null);
    
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
        // Use chatId from location state if available
        if (chatId) return chatId;
        
        // Otherwise use chatId from currentChat
        if (currentChat?.chatId) return currentChat.chatId;
        
        // Create a new chat ID if none exists
        return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    // GET messages from API
    const fetchMessagesFromAPI = async () => {
        try {
            const apiChatId = getChatIdForAPI();
            const apiUrl = `https://td6lmn5q-5000.inc1.devtunnels.ms/api/chat/chat/${apiChatId}/messages`;
            const token = localStorage.getItem('token');
            
            console.log('Fetching messages from API:', apiUrl);
            setIsLoadingMessages(true);
            
            const response = await axios.get(apiUrl, {
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
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
                    sender: msg.senderRole === 'user' ? 'user' : 'counselor',
                    senderRole: msg.senderRole,
                    time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    fullTime: msg.createdAt,
                    contentType: msg.contentType,
                    isRead: msg.isRead,
                    status: 'sent' // Mark as sent since it's from API
                }));
                
                setMessages(transformedMessages);
                
                // Update currentChat with messages
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
            console.error('Error details:', error.response?.data || error.message);
            
            // If error, try to load from localStorage as fallback
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
            const apiUrl = `https://td6lmn5q-5000.inc1.devtunnels.ms/api/chat/chat/${apiChatId}/message`;
            const token = localStorage.getItem('token');
            
            const requestBody = {
                content: messageContent
            };
            
            console.log('Sending message to API:', { url: apiUrl, body: requestBody });
            
            const response = await axios.post(apiUrl, requestBody, {
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
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
    const handleSendMessage = async () => {
        if (newMessage.trim() === '' || isSending) return;

        const messageText = newMessage.trim();
        
        // Create temporary user message object for optimistic UI update
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
        
        // Add temporary user message to UI immediately
        setMessages(prev => [...prev, tempUserMessage]);
        setNewMessage('');
        setShowEmojiPicker(false);
        setIsSending(true);
        
        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        
        try {
            // Send message to API
            await sendMessageToAPI(messageText);
            
            // Remove temporary message and use the fetched messages from API
            setMessages(prev => prev.filter(msg => !msg.isTemporary));
            
        } catch (err) {
            console.error('Error in message sending flow:', err);
            
            // Update temporary message to show error
            setMessages(prev => prev.map(msg => 
                msg.id === tempUserMessage.id 
                    ? { ...msg, status: 'error', error: 'Failed to send message' }
                    : msg
            ));
            
            // Show error message in chat
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

    // Load chat data and fetch messages
    useEffect(() => {
        const initializeChat = async () => {
            try {
                const savedChats = JSON.parse(localStorage.getItem('activeChats') || '[]');
                
                // Try to find chat by chatId or counselorId
                let chat = savedChats.find(c => c.id === chatId) || 
                          savedChats.find(c => c.counselorId === parseInt(counselorId));
                
                if (chat) {
                    setCurrentChat(chat);
                    setCurrentCounselor(chat.counselor);
                    
                    // Mark as read
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
                    // Create a new chat if not found
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
                
                // Fetch messages from API
                await fetchMessagesFromAPI();
                
            } catch (error) {
                console.error('Error loading chat:', error);
            }
        };

        initializeChat();
    }, [counselorId, chatId, initialCounselor, initialUser]);

    // Save messages to localStorage whenever they change (as backup)
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

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Handle click outside for dropdowns
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

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Auto-refresh messages every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (currentChat) {
                fetchMessagesFromAPI();
            }
        }, 30000);
        
        return () => clearInterval(interval);
    }, [currentChat]);

    // Handle key press for sending message
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !isSending) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Add emoji to message
    const addEmoji = (emoji) => {
        setNewMessage(prev => prev + emoji);
        const input = document.getElementById('messageInput');
        if (input) {
            input.focus();
        }
    };

    // Emoji list
    const emojis = ['😊', '😂', '🥰', '😎', '😢', '😡', '👍', '👋', '❤️', '🎉', '🙏', '💪'];

    // Options menu items
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
                
                // TODO: Implement file upload to backend
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

    // Handle video call
    const handleVideoCall = () => {
        const callData = {
            id: currentCounselor.id,
            name: currentCounselor.name,
            type: 'video',
            profilePic: getProfilePhotoUrl(currentCounselor) || currentCounselor.avatar || currentCounselor.name.charAt(0),
            phoneNumber: currentCounselor.phoneNumber,
            status: 'outgoing',
            date: 'Today',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setSelectedCall(callData);
        setIsVideoModalOpen(true);
    };

    // Handle voice call
    const handleVoiceCall = () => {
        const callData = {
            id: currentCounselor.id,
            name: currentCounselor.name,
            type: 'voice',
            profilePic: getProfilePhotoUrl(currentCounselor) || currentCounselor.avatar || currentCounselor.name.charAt(0),
            phoneNumber: currentCounselor.phoneNumber,
            status: 'outgoing',
            date: 'Today',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setSelectedCall(callData);
        setIsVoiceModalOpen(true);
    };

    // Handle close modal
    const handleCloseModal = () => {
        setIsVideoModalOpen(false);
        setIsVoiceModalOpen(false);
        setSelectedCall(null);
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

    // Render message status indicator
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
                            className="chatActionBtn chatVideoBtn"
                            onClick={handleVideoCall}
                            aria-label="Video call"
                        >
                            <span className="chatBtnIcon" aria-hidden="true">📹</span>
                            <span className="chatBtnTooltip">Video Call</span>
                        </button>
                        
                        <button 
                            className="chatActionBtn chatAudioBtn"
                            onClick={handleVoiceCall}
                            aria-label="Voice call"
                        >
                            <span className="chatBtnIcon" aria-hidden="true">📞</span>
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
                            
                            {/* Empty div for scrolling to bottom */}
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