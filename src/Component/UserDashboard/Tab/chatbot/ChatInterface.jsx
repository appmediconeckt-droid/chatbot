import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChatInterface.css';
import { API_BASE_URL } from '../../../../axiosConfig';
import axios from 'axios';

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
    const [error, setError] = useState(null);
    
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

    // Fetch chats from API
    const fetchChats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Get token from localStorage
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('No token found');
                setCounselors([]);
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/chat/chats`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid - just clear token and show empty state
                    localStorage.removeItem('token');
                    setCounselors([]);
                    setLoading(false);
                    return;
                }
                throw new Error(`Failed to fetch chats: ${response.status}`);
            }

            const data = await response.json();
            
            if (data && data.chats && Array.isArray(data.chats)) {
                // Transform API data to counselor list format
                const counselorList = data.chats.map(chat => {
                    const otherParty = chat.otherParty || {};
                    const lastMessage = chat.lastMessage?.content || 'No messages yet';
                    const lastMessageTime = chat.lastMessage?.createdAt || chat.updatedAt || chat.startedAt;
                    
                    // Get the specialization as string
                    let specialization = 'Counselor';
                    if (otherParty.specialization) {
                        if (Array.isArray(otherParty.specialization) && otherParty.specialization.length > 0) {
                            specialization = otherParty.specialization[0];
                        } else if (typeof otherParty.specialization === 'string') {
                            specialization = otherParty.specialization;
                        }
                    }
                    
                    return {
                        id: otherParty.id || chat.chatId,
                        name: otherParty.name || 'Unknown Counselor',
                        lastMessage: lastMessage,
                        lastMessageTime: lastMessageTime,
                        time: formatTime(lastMessageTime),
                        fullDateTime: formatFullDateTime(lastMessageTime),
                        unread: chat.unreadCount || 0,
                        online: otherParty.isActive || false,
                        lastSeen: otherParty.lastSeen || null,
                        avatar: otherParty.avatar || null,
                        avatarType: 'image',
                        specialization: specialization,
                        chatId: chat.chatId,
                        user: {},
                        startedAt: chat.startedAt,
                        acceptedAt: chat.acceptedAt,
                        status: chat.status,
                        isExpired: chat.isExpired,
                        messages: [],
                        messageCount: 0
                    };
                });
                
                // Sort by latest message time (most recent first)
                counselorList.sort((a, b) => {
                    const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
                    const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
                    return timeB - timeA;
                });
                
                setCounselors(counselorList);
                
                // Also save to localStorage for offline access
                try {
                    localStorage.setItem('activeChats', JSON.stringify(data.chats));
                } catch (error) {
                    console.error('Error saving chats to localStorage:', error);
                }
            } else {
                setCounselors([]);
            }
        } catch (error) {
            console.error('Error fetching chats:', error);
            setError(error.message);
            
            // Try to load from localStorage as fallback
            try {
                const savedChats = localStorage.getItem('activeChats');
                if (savedChats) {
                    const chats = JSON.parse(savedChats);
                    if (Array.isArray(chats) && chats.length > 0) {
                        const counselorList = chats.map(chat => {
                            const otherParty = chat.otherParty || {};
                            const lastMessage = chat.lastMessage?.content || 'No messages yet';
                            const lastMessageTime = chat.lastMessage?.createdAt || chat.updatedAt || chat.startedAt;
                            
                            let specialization = 'Counselor';
                            if (otherParty.specialization) {
                                if (Array.isArray(otherParty.specialization) && otherParty.specialization.length > 0) {
                                    specialization = otherParty.specialization[0];
                                } else if (typeof otherParty.specialization === 'string') {
                                    specialization = otherParty.specialization;
                                }
                            }
                            
                            return {
                                id: otherParty.id || chat.chatId,
                                name: otherParty.name || 'Unknown Counselor',
                                lastMessage: lastMessage,
                                lastMessageTime: lastMessageTime,
                                time: formatTime(lastMessageTime),
                                fullDateTime: formatFullDateTime(lastMessageTime),
                                unread: chat.unreadCount || 0,
                                online: otherParty.isActive || false,
                                lastSeen: otherParty.lastSeen || null,
                                avatar: otherParty.avatar || null,
                                avatarType: 'image',
                                specialization: specialization,
                                chatId: chat.chatId,
                                user: {},
                                startedAt: chat.startedAt,
                                acceptedAt: chat.acceptedAt,
                                status: chat.status,
                                isExpired: chat.isExpired,
                                messages: [],
                                messageCount: 0
                            };
                        });
                        
                        counselorList.sort((a, b) => {
                            const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
                            const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
                            return timeB - timeA;
                        });
                        
                        setCounselors(counselorList);
                    }
                }
            } catch (localError) {
                console.error('Error loading chats from localStorage:', localError);
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    // Mark chat as read
    const markChatAsRead = useCallback(async (chatId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await axios.post(`${API_BASE_URL}/api/chat/mark-all-read`, {
                chatId: chatId
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                // Update local state
                setCounselors(prev => prev.map(c => 
                    c.id === chatId ? { ...c, unread: 0 } : c
                ));
            }
        } catch (error) {
            console.error('Error marking chat as read:', error);
        }
    }, []);

    // Delete chat
    const deleteChat = useCallback(async (chatId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return false;

            const response = await fetch(`${API_BASE_URL}/chat/chats/${chatId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Remove from local state
                setCounselors(prev => prev.filter(c => c.id !== chatId));
                
                // Also remove from localStorage
                try {
                    const savedChats = JSON.parse(localStorage.getItem('activeChats') || '[]');
                    const updatedChats = savedChats.filter(chat => chat.chatId !== chatId);
                    localStorage.setItem('activeChats', JSON.stringify(updatedChats));
                } catch (error) {
                    console.error('Error updating localStorage:', error);
                }
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting chat:', error);
            return false;
        }
    }, []);

    // Load active chats from API
    useEffect(() => {
        fetchChats();

        // Set up polling for new messages (every 30 seconds)
        const intervalId = setInterval(() => {
            fetchChats();
        }, 30000);

        // Listen for storage changes (for multiple tabs)
        const handleStorageChange = (e) => {
            if (e.key === 'activeChats') {
                fetchChats();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            clearInterval(intervalId);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [fetchChats]);

    // Handle counselor selection
    const handleCounselorSelect = useCallback(async (counselor) => {
        if (contextMenu.visible) return;
        
        // Mark messages as read
        await markChatAsRead(counselor.id);
        
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
                    profilePhoto: counselor.avatar,
                    avatarType: counselor.avatarType
                },
                user: counselor.user
            } 
        });
    }, [contextMenu.visible, markChatAsRead, navigate]);

    // Handle start new chat
    const handleStartNewChat = useCallback(() => {
        if (setActiveTab) {
            setActiveTab("Live Chat");
        } else {
            navigate('/counselor-directory');
        }
    }, [setActiveTab, navigate]);

    // Handle right click (desktop context menu)
    const handleContextMenu = useCallback((e, counselor) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            visible: true,
            x: e.pageX,
            y: e.pageY,
            counselor: counselor
        });
    }, []);

    // Handle long press start (mobile)
    const handleTouchStart = useCallback((e, counselor) => {
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
    }, []);

    // Handle touch end
    const handleTouchEnd = useCallback((e) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        
        if (contextMenu.visible) {
            e.preventDefault();
        }
        
        pressedItem.current = null;
        touchMoved.current = false;
    }, [contextMenu.visible]);

    // Handle touch move
    const handleTouchMove = useCallback((e) => {
        touchMoved.current = true;
        
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        pressedItem.current = null;
    }, []);

    // Handle touch cancel
    const handleTouchCancel = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        pressedItem.current = null;
        touchMoved.current = false;
    }, []);

    // Handle click for mobile
    const handleItemClick = useCallback((e, counselor) => {
        if (contextMenu.visible || touchMoved.current) {
            return;
        }
        handleCounselorSelect(counselor);
    }, [contextMenu.visible, handleCounselorSelect]);

    // Close context menu
    const closeContextMenu = useCallback(() => {
        setContextMenu({ visible: false, x: 0, y: 0, counselor: null });
    }, []);

    // Handle delete chat
    const handleDeleteChat = useCallback((counselor) => {
        setCounselorToDelete(counselor);
        setShowDeleteConfirm(true);
        closeContextMenu();
    }, [closeContextMenu]);

    // Confirm delete chat
    const confirmDeleteChat = useCallback(async () => {
        if (counselorToDelete) {
            const success = await deleteChat(counselorToDelete.id);
            
            if (success && window.navigator.vibrate) {
                window.navigator.vibrate([50, 30, 50]);
            }
            
            setShowDeleteConfirm(false);
            setCounselorToDelete(null);
        }
    }, [counselorToDelete, deleteChat]);

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
    const renderAvatar = useCallback((counselor, size = 'md') => {
        const profilePhotoUrl = getProfilePhotoUrl(counselor);
        
        if (profilePhotoUrl) {
            return (
                <img 
                    src={profilePhotoUrl} 
                    alt={counselor.name}
                    className={`counselor-avatar-img-${size}`}
                    onError={(e) => {
                        e.target.style.display = 'none';
                        const parent = e.target.parentElement;
                        if (parent) {
                            parent.classList.add('avatar-fallback');
                            parent.setAttribute('data-initials', getInitials(counselor.name));
                            parent.style.backgroundColor = getAvatarColor(counselor.name);
                            parent.innerHTML = getInitials(counselor.name);
                        }
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
    }, []);

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
                    {loading && counselors.length === 0 ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p className="loading-text">Loading your chats...</p>
                        </div>
                    ) : error ? (
                        <div className="error-message">
                            <p>⚠️ {error}</p>
                            <button onClick={fetchChats} className="retry-button">
                                Retry
                            </button>
                        </div>
                    ) : filteredCounselors.length > 0 ? (
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
                                            {counselor.status === 'accepted' && (
                                                <span className="counselorStatusBadge accepted">✓ Accepted</span>
                                            )}
                                            {counselor.isExpired && (
                                                <span className="counselorStatusBadge expired">⌛ Expired</span>
                                            )}
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
                                markChatAsRead(contextMenu.counselor.id);
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
                                ⚠️ This action cannot be undone. All messages will be permanently deleted.
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