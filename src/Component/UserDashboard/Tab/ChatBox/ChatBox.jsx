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
        avatar: '👨‍⚕️',
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
    
    // Refs for scrolling and container
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const optionsRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const timeoutRef = useRef(null);

    // Scroll to bottom function
    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            setTimeout(() => {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, []);

    // Load chat data from localStorage
    useEffect(() => {
        const loadChat = () => {
            try {
                const savedChats = JSON.parse(localStorage.getItem('activeChats') || '[]');
                
                // Try to find chat by chatId or counselorId
                let chat = savedChats.find(c => c.id === chatId) || 
                          savedChats.find(c => c.counselorId === parseInt(counselorId));
                
                if (chat) {
                    setCurrentChat(chat);
                    setMessages(chat.messages || []);
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
                        counselorId: parseInt(counselorId),
                        counselor: initialCounselor,
                        user: initialUser || { name: 'User', email: 'user@example.com' },
                        messages: [
                            {
                                id: Date.now(),
                                text: `Hello! I'm ${initialCounselor.name}. How can I help you today?`,
                                sender: 'counselor',
                                time: new Date().toLocaleTimeString()
                            }
                        ],
                        unread: false,
                        startedAt: new Date().toISOString()
                    };
                    setCurrentChat(newChat);
                    setMessages(newChat.messages);
                    
                    const updatedChats = [...savedChats, newChat];
                    localStorage.setItem('activeChats', JSON.stringify(updatedChats));
                }
            } catch (error) {
                console.error('Error loading chat:', error);
            }
        };

        loadChat();
    }, [counselorId, chatId, initialCounselor, initialUser]);

    // Save messages to localStorage whenever they change
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
                            unread: false
                        };
                    }
                    return chat;
                });
                localStorage.setItem('activeChats', JSON.stringify(updatedChats));
            } catch (error) {
                console.error('Error saving messages:', error);
            }
        }
    }, [messages, currentChat]);

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

    // Handle sending a new message
    const sendMessageToAPI = async (message) => {
        try {
            const response = await axios.post(
                'https://sdpd86vs-5000.inc1.devtunnels.ms/api/chat',
                { message },
                { headers: { 'Content-Type': 'application/json' } }
            );
            return response.data;
        } catch (error) {
            console.error('Error calling AI API:', error);
            throw error;
        }
    };

    const handleSendMessage = async () => {
        if (newMessage.trim() === '') return;

        const messageText = newMessage;

        const newMsg = {
            id: Date.now(),
            text: messageText,
            sender: 'user',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
        setShowEmojiPicker(false);
        setIsTyping(true);

        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        try {
            const apiResp = await sendMessageToAPI(messageText);
            const aiText = apiResp?.response || apiResp?.message || apiResp?.text || getCounselorReply(messageText);

            const counselorReply = {
                id: Date.now() + 1,
                text: aiText,
                sender: 'counselor',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, counselorReply]);
        } catch (err) {
            const counselorReply = {
                id: Date.now() + 1,
                text: "I'm having trouble connecting to the assistant. Please try again later.",
                sender: 'counselor',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, counselorReply]);
        } finally {
            setIsTyping(false);
        }
    };

    // Generate counselor reply based on message
    const getCounselorReply = (message) => {
        const replies = [
            "I understand how you feel. Can you tell me more?",
            "That's completely normal. Let's work through this together.",
            "Thank you for sharing that with me.",
            "I'm here to support you. What specific aspect would you like to discuss?",
            "Let's take a moment to explore this further.",
            "Your feelings are valid. How long have you been experiencing this?",
            "I appreciate you opening up about this.",
            "We can work on some coping strategies together."
        ];
        return replies[Math.floor(Math.random() * replies.length)];
    };

    // Handle key press for sending message
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
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
        { id: 1, label: 'Clear Chat', icon: '🗑️' },
        { id: 2, label: 'Report Issue', icon: '⚠️' },
        { id: 3, label: 'Block Counselor', icon: '🚫' },
        { id: 4, label: 'Chat Details', icon: '📋' },
    ];

    // Handle file attachment
    const handleFileAttach = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const newMsg = {
                    id: Date.now(),
                    text: `📎 Attached file: ${file.name}`,
                    sender: 'user',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isFile: true
                };
                setMessages(prev => [...prev, newMsg]);
            }
        };
        input.click();
    };

    // Handle input change for typing indicator
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
            profilePic: currentCounselor.avatar,
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
            profilePic: currentCounselor.avatar,
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
                                {currentCounselor.avatar || currentCounselor.name.charAt(0)}
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

                {/* Messages Container */}
                <main className="chatMessagesArea" ref={messagesContainerRef}>
                    <div className="chatWelcomeCard">
                        <div className="chatWelcomeInner">
                            <div className="chatWelcomeAvatar" aria-hidden="true">
                                {currentCounselor.avatar || currentCounselor.name.charAt(0)}
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
                            className={`chatMsgBubble ${message.sender === 'user' ? 'chatMsgRight' : 'chatMsgLeft'}`}
                        >
                            <div className="chatMsgContent">
                                <p className="chatMsgText">{message.text}</p>
                                <time className="chatMsgTimestamp">{message.time}</time>
                            </div>
                        </article>
                    ))}
                    
                    {/* Empty div for scrolling to bottom */}
                    <div ref={messagesEndRef} />
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
                                aria-label="Message input"
                            />
                            <button 
                                className="chatEmojiBtn"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                aria-label="Open emoji picker"
                                aria-expanded={showEmojiPicker}
                            >
                                <span className="emojiIcon" aria-hidden="true">😊</span>
                            </button>
                        </div>
                        
                        <button 
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                            className="chatSendBtn"
                            aria-label="Send message"
                        >
                            <span className="sendIcon" aria-hidden="true">➤</span>
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