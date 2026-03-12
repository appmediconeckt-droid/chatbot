import React, { useState, useEffect, useRef } from 'react';
import './ChatBox.css';
import { Link } from 'react-router-dom';
import VideoCallModal from '../CallModal/VideoCallModal';
import VoiceCallModal from '../CallModal/VoiceCallModal';


const ChatBox = () => {
    // State for current counselor
    const [currentCounselor, setCurrentCounselor] = useState({
        id: 1,
        name: 'Dr. Suresh Reddy',
        type: 'video', // or 'voice'
        profilePic: '👨‍⚕️',
        phoneNumber: '+91 98765 43215',
        online: true
    });

    // Call modal states
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
    const [selectedCall, setSelectedCall] = useState(null);

    const [messages, setMessages] = useState([
        { id: 1, text: 'Hello! How can I help you today?', sender: 'counselor', time: '10:15 AM' },
        { id: 2, text: 'I\'ve been feeling anxious lately', sender: 'user', time: '10:20 AM' },
        { id: 3, text: 'I understand. Let\'s talk about what triggers this anxiety.', sender: 'counselor', time: '10:25 AM' },
        { id: 4, text: 'Mostly during work presentations', sender: 'user', time: '10:28 AM' },
        { id: 5, text: 'That\'s common. We can work on coping strategies.', sender: 'counselor', time: '10:30 AM' },
        { id: 6, text: 'Can you suggest some techniques?', sender: 'user', time: '10:32 AM' },
        { id: 7, text: 'Yes, deep breathing exercises and mindfulness can help.', sender: 'counselor', time: '10:35 AM' },
        { id: 8, text: 'Thank you, I\'ll try those.', sender: 'user', time: '10:36 AM' },
    ]);

    const [newMessage, setNewMessage] = useState('');
    const [showOptions, setShowOptions] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    
    // Refs for scrolling and container
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const optionsRef = useRef(null);
    const emojiPickerRef = useRef(null);

    // Scroll to bottom when new messages are added
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Handle sending a new message
    const handleSendMessage = () => {
        if (newMessage.trim() === '') return;
        
        const newMsg = {
            id: messages.length + 1,
            text: newMessage,
            sender: 'user',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
        setShowEmojiPicker(false);
        setIsTyping(false);
        
        // Simulate counselor reply after 1 second
        setTimeout(() => {
            const counselorReply = {
                id: messages.length + 2,
                text: 'Thank you for sharing. I\'ll help you work through this.',
                sender: 'counselor',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, counselorReply]);
        }, 1000);
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
        document.getElementById('messageInput').focus();
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
                    id: messages.length + 1,
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
            profilePic: currentCounselor.profilePic,
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
            profilePic: currentCounselor.profilePic,
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
                                {currentCounselor.name.charAt(0)}
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
                                                alert(`${item.label} clicked`);
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
                                {currentCounselor.name.charAt(0)}
                            </div>
                            <div className="chatWelcomeMsg">
                                <h3 className="chatWelcomeTitle">Welcome to your session with {currentCounselor.name}</h3>
                                <p className="chatWelcomeDesc">
                                    This is a safe space to share your thoughts and feelings.
                                    Everything discussed here is confidential.
                                </p>
                                <time className="chatWelcomeTime">Today at 10:00 AM</time>
                            </div>
                        </div>
                    </div>

                    {messages.map(message => (
                        <article 
                            key={message.id} 
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
                                placeholder="Type your message here..."
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