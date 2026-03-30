import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChatInterface.css';

const ChatInterface = ({ setActiveTab }) => {
    const navigate = useNavigate();
    
    // State for counselors and chats
    const [counselors, setCounselors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [contextMenu, setContextMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        counselor: null
    });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [counselorToDelete, setCounselorToDelete] = useState(null);
    
    // Refs for long press
    const longPressTimer = useRef(null);
    const pressedItem = useRef(null);
    const touchMoved = useRef(false);

    // Function to get profile photo URL
    const getProfilePhotoUrl = (counselor) => {
        if (counselor?.profilePhoto?.url) {
            return counselor.profilePhoto.url;
        }
        if (counselor?.avatar && typeof counselor.avatar === 'string' && counselor.avatar.startsWith('http')) {
            return counselor.avatar;
        }
        return null;
    };

    // Get avatar initials
    const getInitials = (name) => {
        if (!name) return '👤';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    // Get random color for avatar based on name
    const getAvatarColor = (name) => {
        if (!name) return '#4f46e5';
        
        const colors = [
            '#4f46e5', '#0891b2', '#059669', '#b45309', '#c2410c',
            '#7e22ce', '#be123c', '#1e40af', '#0f766e', '#6b21a8',
            '#d97706', '#dc2626', '#16a34a', '#9333ea', '#db2777'
        ];
        
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    };

    // Format time for display (relative time)
    const formatTime = (timeString) => {
        if (!timeString) return '';
        
        try {
            const messageTime = new Date(timeString);
            const now = new Date();
            const diffMs = now - messageTime;
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffMins < 1) return 'Just now';
            if (diffHours < 1) return `${diffMins}m ago`;
            if (diffDays === 0) return messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return messageTime.toLocaleDateString([], { weekday: 'short' });
            if (diffDays < 30) return `${diffDays}d ago`;
            return messageTime.toLocaleDateString([], { month: 'short', day: 'numeric' });
        } catch (error) {
            return timeString;
        }
    };

    // Format full date and time for tooltip
    const formatFullDateTime = (timeString) => {
        if (!timeString) return '';
        try {
            const date = new Date(timeString);
            return date.toLocaleString([], {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (error) {
            return timeString;
        }
    };

    // Format last seen time
    const formatLastSeen = (lastSeen) => {
        if (!lastSeen) return 'Offline';
        
        try {
            const lastSeenTime = new Date(lastSeen);
            const now = new Date();
            const diffMs = now - lastSeenTime;
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffMins < 1) return 'Just now';
            if (diffHours < 1) return `${diffMins} minutes ago`;
            if (diffHours === 1) return '1 hour ago';
            if (diffHours < 24) return `${diffHours} hours ago`;
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return `${diffDays} days ago`;
            return lastSeenTime.toLocaleDateString();
        } catch (error) {
            return 'Recently';
        }
    };

    // Load active chats from localStorage
    useEffect(() => {
        const loadChats = () => {
            try {
                const savedChats = localStorage.getItem('activeChats');
                if (savedChats) {
                    const chats = JSON.parse(savedChats);
                    
                    // Remove duplicates - keep only the most recent chat per counselor
                    const uniqueChats = removeDuplicateChats(chats);
                    
                    // Transform chats to counselor list format
                    const counselorList = uniqueChats.map(chat => {
                        // Get the last message properly
                        const lastMessageObj = chat.messages && chat.messages.length > 0 
                            ? chat.messages[chat.messages.length - 1] 
                            : null;
                        
                        const lastMessage = lastMessageObj?.text || chat.lastMessage || 'No messages yet';
                        const lastMessageTime = lastMessageObj?.time || chat.lastMessageTime || chat.startedAt;
                        
                        // Get counselor data
                        const counselorData = chat.counselor || {};
                        
                        // Calculate message count (number of messages exchanged)
                        const messageCount = chat.messages ? chat.messages.length : 0;
                        
                        return {
                            id: chat.counselorId,
                            name: counselorData.name || 'Unknown Counselor',
                            lastMessage: lastMessage,
                            lastMessageTime: lastMessageTime,
                            time: formatTime(lastMessageTime),
                            fullDateTime: formatFullDateTime(lastMessageTime),
                            unread: chat.unread ? 1 : 0,
                            online: counselorData.online || false,
                            lastSeen: counselorData.lastSeen || counselorData.lastActive || null,
                            avatar: getProfilePhotoUrl(counselorData) || counselorData.avatar || null,
                            avatarType: counselorData.avatarType || 'text',
                            specialization: counselorData.specialization || 'Counselor',
                            chatId: chat.id,
                            user: chat.user || {},
                            startedAt: chat.startedAt,
                            messages: chat.messages || [],
                            messageCount: messageCount,
                            profilePhoto: counselorData.profilePhoto
                        };
                    });
                    
                    // Sort by latest message time (most recent first)
                    counselorList.sort((a, b) => {
                        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
                        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
                        return timeB - timeA;
                    });
                    
                    setCounselors(counselorList);
                    
                    // Save unique chats back to localStorage (clean up duplicates)
                    if (uniqueChats.length !== chats.length) {
                        localStorage.setItem('activeChats', JSON.stringify(uniqueChats));
                    }
                } else {
                    setCounselors([]);
                }
            } catch (error) {
                console.error('Error loading chats:', error);
                setCounselors([]);
            } finally {
                setLoading(false);
            }
        };

        loadChats();

        // Listen for storage changes (for multiple tabs)
        const handleStorageChange = (e) => {
            if (e.key === 'activeChats') {
                loadChats();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Remove duplicate chats - keep only the latest one per counselor
    const removeDuplicateChats = (chats) => {
        if (!Array.isArray(chats) || chats.length === 0) return [];
        
        const counselorMap = new Map();
        
        chats.forEach(chat => {
            if (!chat || !chat.counselorId) return;
            
            const counselorId = chat.counselorId;
            const existingChat = counselorMap.get(counselorId);
            
            if (!existingChat) {
                counselorMap.set(counselorId, chat);
            } else {
                const getChatTime = (c) => {
                    if (c.messages && c.messages.length > 0) {
                        const lastMsgTime = c.messages[c.messages.length - 1]?.time;
                        if (lastMsgTime) return new Date(lastMsgTime).getTime();
                    }
                    if (c.lastMessageTime) return new Date(c.lastMessageTime).getTime();
                    if (c.startedAt) return new Date(c.startedAt).getTime();
                    return 0;
                };
                
                const existingTime = getChatTime(existingChat);
                const newTime = getChatTime(chat);
                
                if (newTime > existingTime) {
                    counselorMap.set(counselorId, chat);
                }
            }
        });
        
        return Array.from(counselorMap.values());
    };

    // Handle counselor selection
    const handleCounselorSelect = (counselor) => {
        if (contextMenu.visible) return;
        
        // Mark messages as read in localStorage
        try {
            const savedChats = JSON.parse(localStorage.getItem('activeChats') || '[]');
            const updatedChats = savedChats.map(chat => {
                if (chat.id === counselor.chatId) {
                    return { ...chat, unread: false };
                }
                return chat;
            });
            localStorage.setItem('activeChats', JSON.stringify(updatedChats));
            
            // Update local state
            setCounselors(prev => prev.map(c => 
                c.id === counselor.id ? { ...c, unread: 0 } : c
            ));
        } catch (error) {
            console.error('Error updating chat read status:', error);
        }
        
        // Navigate to chat box
        navigate(`/chat/${counselor.id}`, { 
            state: { 
                chatId: counselor.chatId,
                counselor: {
                    id: counselor.id,
                    name: counselor.name,
                    specialization: counselor.specialization,
                    online: counselor.online,
                    lastSeen: counselor.lastSeen,
                    avatar: counselor.avatar,
                    profilePhoto: counselor.profilePhoto,
                    avatarType: counselor.avatarType
                },
                user: counselor.user
            } 
        });
    };

    // Handle start new chat
    const handleStartNewChat = () => {
        if (setActiveTab) {
            setActiveTab("Live Chat");
        } else {
            navigate('/counselor-directory');
        }
    };

    // Handle right click (desktop context menu)
    const handleContextMenu = (e, counselor) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            visible: true,
            x: e.pageX,
            y: e.pageY,
            counselor: counselor
        });
    };

    // Handle long press start (mobile)
    const handleTouchStart = (e, counselor) => {
        touchMoved.current = false;
        pressedItem.current = counselor;
        
        longPressTimer.current = setTimeout(() => {
            if (pressedItem.current && !touchMoved.current) {
                if (window.navigator.vibrate) {
                    window.navigator.vibrate(50);
                }
                
                const touch = e.touches[0];
                setContextMenu({
                    visible: true,
                    x: touch.pageX,
                    y: touch.pageY,
                    counselor: counselor
                });
            }
        }, 500);
    };

    // Handle touch end
    const handleTouchEnd = (e) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        
        if (contextMenu.visible) {
            e.preventDefault();
        }
        
        pressedItem.current = null;
        touchMoved.current = false;
    };

    // Handle touch move
    const handleTouchMove = (e) => {
        touchMoved.current = true;
        
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        pressedItem.current = null;
    };

    // Handle touch cancel
    const handleTouchCancel = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        pressedItem.current = null;
        touchMoved.current = false;
    };

    // Handle click for mobile
    const handleItemClick = (e, counselor) => {
        if (contextMenu.visible || touchMoved.current) {
            return;
        }
        handleCounselorSelect(counselor);
    };

    // Close context menu
    const closeContextMenu = useCallback(() => {
        setContextMenu({ visible: false, x: 0, y: 0, counselor: null });
    }, []);

    // Handle delete chat
    const handleDeleteChat = (counselor) => {
        setCounselorToDelete(counselor);
        setShowDeleteConfirm(true);
        closeContextMenu();
    };

    // Confirm delete chat
    const confirmDeleteChat = () => {
        if (counselorToDelete) {
            try {
                const savedChats = JSON.parse(localStorage.getItem('activeChats') || '[]');
                const updatedChats = savedChats.filter(chat => chat.counselorId !== counselorToDelete.id);
                localStorage.setItem('activeChats', JSON.stringify(updatedChats));
                
                setCounselors(prev => prev.filter(c => c.id !== counselorToDelete.id));
                
                if (window.navigator.vibrate) {
                    window.navigator.vibrate([50, 30, 50]);
                }
            } catch (error) {
                console.error('Error deleting chat:', error);
            }
            
            setShowDeleteConfirm(false);
            setCounselorToDelete(null);
        }
    };

    // Handle click outside context menu
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.context-menu')) {
                closeContextMenu();
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [closeContextMenu]);

    // Handle escape key
    useEffect(() => {
        const handleEscKey = (e) => {
            if (e.key === 'Escape') {
                closeContextMenu();
            }
        };

        document.addEventListener('keydown', handleEscKey);
        return () => document.removeEventListener('keydown', handleEscKey);
    }, [closeContextMenu]);

    // Filter counselors based on search term
    const filteredCounselors = counselors.filter(counselor =>
        counselor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        counselor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Render avatar with profile photo support
    const renderAvatar = (counselor, size = 'md') => {
        const profilePhotoUrl = getProfilePhotoUrl(counselor);
        
        if (profilePhotoUrl) {
            return (
                <img 
                    src={profilePhotoUrl} 
                    alt={counselor.name}
                    className={`counselor-avatar-img-${size}`}
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.classList.add('avatar-fallback');
                        e.target.parentElement.setAttribute('data-initials', getInitials(counselor.name));
                        e.target.parentElement.style.backgroundColor = getAvatarColor(counselor.name);
                        e.target.parentElement.innerHTML = getInitials(counselor.name);
                    }}
                />
            );
        }
        
        return (
            <div 
                className={`counselor-avatar-initials-${size}`}
                style={{ backgroundColor: getAvatarColor(counselor.name) }}
            >
                {getInitials(counselor.name)}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="chatAppContainer">
                <div className="loading-spinner">Loading chats...</div>
            </div>
        );
    }

    return (
        <div className="chatAppContainer">
            <div className="counselorSidebar">
                <div className="counselorSidebarHeader">
                    <h2 className="counselorListTitle">My Counselors</h2>
                    <div className="counselorSearchBox">
                        <input
                            type="text"
                            placeholder="Search counselors..."
                            className="counselorSearchInput"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <span className="counselorSearchIcon">🔍</span>
                    </div>
                </div>

                <div className="counselorListContainer">
                    {filteredCounselors.length > 0 ? (
                        filteredCounselors.map(counselor => (
                            <div 
                                key={counselor.id} 
                                className="counselorListItemWrapper"
                                onClick={(e) => handleItemClick(e, counselor)}
                                onContextMenu={(e) => handleContextMenu(e, counselor)}
                                onTouchStart={(e) => handleTouchStart(e, counselor)}
                                onTouchEnd={handleTouchEnd}
                                onTouchMove={handleTouchMove}
                                onTouchCancel={handleTouchCancel}
                            >
                                <div className="counselorListItem">
                                    <div className="counselorAvatarContainer">
                                        <div className="counselorAvatar">
                                            {renderAvatar(counselor, 'md')}
                                        </div>
                                        <div className={`counselorStatus ${counselor.online ? 'counselorStatusOnline' : 'counselorStatusOffline'}`} />
                                    </div>

                                    <div className="counselorInfo">
                                        <div className="counselorNameRow">
                                            <h3 className="counselorName">{counselor.name}</h3>
                                            <span className="counselorTime" title={counselor.fullDateTime}>
                                                {counselor.time}
                                            </span>
                                        </div>
                                        
                                        <div className="counselorLastMessageRow">
                                            <p className="counselorLastMessage">{counselor.lastMessage}</p>
                                            {counselor.unread > 0 && (
                                                <span className="counselorUnreadBadge">{counselor.unread}</span>
                                            )}
                                        </div>
                                        
                                        <div className="counselorMetaInfo">
                                            <span className="counselorSpecialization">{counselor.specialization}</span>
                                            <span className="counselorMessageCount">
                                                💬 {counselor.messageCount} messages
                                            </span>
                                        </div>
                                        
                                        {!counselor.online && counselor.lastSeen && (
                                            <div className="counselorLastSeen">
                                                Last seen: {formatLastSeen(counselor.lastSeen)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-chats-message">
                            {searchTerm ? (
                                <>
                                    <p>No counselors found matching "{searchTerm}"</p>
                                    <button onClick={() => setSearchTerm('')} className="clear-search-link">
                                        Clear search
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p>No active chats yet.</p>
                                    <button onClick={handleStartNewChat} className="start-chat-link">
                                        Start a new chat
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Context Menu */}
            {contextMenu.visible && contextMenu.counselor && (
                <div 
                    className="context-menu"
                    style={{
                        position: 'fixed',
                        top: Math.min(contextMenu.y, window.innerHeight - 200),
                        left: Math.min(contextMenu.x, window.innerWidth - 220),
                        zIndex: 1000
                    }}
                >
                    <div className="context-menu-header">
                        <div className="context-menu-avatar">
                            {renderAvatar(contextMenu.counselor, 'sm')}
                        </div>
                        <div className="context-menu-header-info">
                            <span className="context-menu-counselor-name">
                                {contextMenu.counselor.name}
                            </span>
                            <span className="context-menu-status">
                                {contextMenu.counselor.online ? '🟢 Online' : '⚫ Offline'}
                            </span>
                            <span className="context-menu-time">
                                Last message: {contextMenu.counselor.fullDateTime}
                            </span>
                        </div>
                    </div>
                    <div className="context-menu-items">
                        <button 
                            className="context-menu-item"
                            onClick={() => {
                                // Mark as read
                                try {
                                    const savedChats = JSON.parse(localStorage.getItem('activeChats') || '[]');
                                    const updatedChats = savedChats.map(chat => {
                                        if (chat.counselorId === contextMenu.counselor.id) {
                                            return { ...chat, unread: false };
                                        }
                                        return chat;
                                    });
                                    localStorage.setItem('activeChats', JSON.stringify(updatedChats));
                                    
                                    setCounselors(prev => prev.map(c => 
                                        c.id === contextMenu.counselor.id ? { ...c, unread: 0 } : c
                                    ));
                                } catch (error) {
                                    console.error('Error marking as read:', error);
                                }
                                closeContextMenu();
                            }}
                        >
                            <span className="context-menu-icon">✓</span>
                            <span className="context-menu-text">Mark as Read</span>
                        </button>
                        <button 
                            className="context-menu-item delete"
                            onClick={() => handleDeleteChat(contextMenu.counselor)}
                        >
                            <span className="context-menu-icon">🗑️</span>
                            <span className="context-menu-text">Delete Chat</span>
                        </button>
                        <button 
                            className="context-menu-item"
                            onClick={closeContextMenu}
                        >
                            <span className="context-menu-icon">✕</span>
                            <span className="context-menu-text">Cancel</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && counselorToDelete && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="modal-container" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Delete Chat</h3>
                        </div>
                        <div className="modal-body">
                            <div className="delete-counselor-info">
                                <div className="delete-avatar">
                                    {renderAvatar(counselorToDelete, 'lg')}
                                </div>
                                <div className="delete-info">
                                    <strong>{counselorToDelete.name}</strong>
                                    <span className="delete-specialization">{counselorToDelete.specialization}</span>
                                </div>
                            </div>
                            <p>Are you sure you want to delete this chat?</p>
                            <p className="delete-warning">
                                ⚠️ This action cannot be undone. All {counselorToDelete.messageCount} messages will be permanently deleted.
                            </p>
                            {counselorToDelete.fullDateTime && (
                                <p className="chat-time-info">
                                    Last message: {counselorToDelete.fullDateTime}
                                </p>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn-secondary"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-danger"
                                onClick={confirmDeleteChat}
                            >
                                Delete Chat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatInterface;