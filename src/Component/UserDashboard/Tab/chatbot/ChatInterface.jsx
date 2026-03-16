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
                        
                        return {
                            id: chat.counselorId,
                            name: counselorData.name || 'Unknown Counselor',
                            lastMessage: lastMessage,
                            lastMessageTime: lastMessageTime,
                            time: formatTime(lastMessageTime),
                            fullDateTime: formatFullDateTime(lastMessageTime),
                            unread: chat.unread ? 1 : 0,
                            online: counselorData.online || false,
                            avatar: counselorData.avatar || null,
                            specialization: counselorData.specialization || 'Counselor',
                            chatId: chat.id,
                            user: chat.user || {},
                            startedAt: chat.startedAt,
                            messages: chat.messages || []
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
            // Skip invalid chats
            if (!chat || !chat.counselorId) return;
            
            const counselorId = chat.counselorId;
            const existingChat = counselorMap.get(counselorId);
            
            if (!existingChat) {
                // First chat for this counselor
                counselorMap.set(counselorId, chat);
            } else {
                // Compare by last message time or startedAt to keep the most recent
                const getChatTime = (c) => {
                    // Try to get the most recent time from messages
                    if (c.messages && c.messages.length > 0) {
                        const lastMsgTime = c.messages[c.messages.length - 1]?.time;
                        if (lastMsgTime) return new Date(lastMsgTime).getTime();
                    }
                    // Fall back to lastMessageTime
                    if (c.lastMessageTime) return new Date(c.lastMessageTime).getTime();
                    // Fall back to startedAt
                    if (c.startedAt) return new Date(c.startedAt).getTime();
                    return 0;
                };
                
                const existingTime = getChatTime(existingChat);
                const newTime = getChatTime(chat);
                
                // Keep the chat with more recent activity
                if (newTime > existingTime) {
                    counselorMap.set(counselorId, chat);
                }
            }
        });
        
        return Array.from(counselorMap.values());
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
            
            // For messages within the last minute
            if (diffMins < 1) {
                return 'Just now';
            }
            // For messages within the last hour
            else if (diffHours < 1) {
                return `${diffMins}m ago`;
            }
            // For today
            else if (diffDays === 0) {
                return messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } 
            // Yesterday
            else if (diffDays === 1) {
                return 'Yesterday';
            } 
            // Within the last week
            else if (diffDays < 7) {
                return messageTime.toLocaleDateString([], { weekday: 'short' });
            } 
            // Within the last month
            else if (diffDays < 30) {
                return `${diffDays}d ago`;
            }
            // Older
            else {
                return messageTime.toLocaleDateString([], { month: 'short', day: 'numeric' });
            }
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

    // Get avatar initials
    const getInitials = (name) => {
        if (!name) return '👤';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    // Get random color for avatar based on name
    const getAvatarColor = (name) => {
        if (!name) return '#4f46e5';
        
        const colors = [
            '#4f46e5', // Indigo
            '#0891b2', // Cyan
            '#059669', // Emerald
            '#b45309', // Amber
            '#c2410c', // Orange
            '#7e22ce', // Purple
            '#be123c', // Rose
            '#1e40af', // Blue
            '#0f766e', // Teal
            '#6b21a8'  // Violet
        ];
        
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    };

    // Handle counselor selection
    const handleCounselorSelect = (counselor) => {
        // Don't navigate if context menu is visible (to prevent accidental navigation)
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
                    avatar: counselor.avatar
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

    // Handle long press start (mobile) - FIXED: Don't prevent default
    const handleTouchStart = (e, counselor) => {
        // Don't call preventDefault() here as it blocks click events
        touchMoved.current = false;
        pressedItem.current = counselor;
        
        longPressTimer.current = setTimeout(() => {
            if (pressedItem.current && !touchMoved.current) {
                // Vibrate on long press (if supported)
                if (window.navigator.vibrate) {
                    window.navigator.vibrate(50);
                }
                
                // Get touch position
                const touch = e.touches[0];
                setContextMenu({
                    visible: true,
                    x: touch.pageX,
                    y: touch.pageY,
                    counselor: counselor
                });
            }
        }, 500); // 500ms long press
    };

    // Handle touch end - FIXED: Don't prevent default
    const handleTouchEnd = (e) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        
        // If it was a long press that triggered context menu, don't trigger click
        if (contextMenu.visible) {
            e.preventDefault();
        }
        
        pressedItem.current = null;
        touchMoved.current = false;
    };

    // Handle touch move (cancel long press on scroll) - FIXED: Don't prevent default
    const handleTouchMove = (e) => {
        touchMoved.current = true;
        
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        pressedItem.current = null;
    };

    // Handle touch cancel
    const handleTouchCancel = (e) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        pressedItem.current = null;
        touchMoved.current = false;
    };

    // Handle click for mobile - FIXED: New handler for mobile clicks
    const handleItemClick = (e, counselor) => {
        // Don't trigger if context menu is visible or if it was a long press
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
                // Remove from localStorage
                const savedChats = JSON.parse(localStorage.getItem('activeChats') || '[]');
                const updatedChats = savedChats.filter(chat => chat.counselorId !== counselorToDelete.id
                );
                localStorage.setItem('activeChats', JSON.stringify(updatedChats));
                
                // Update state
                setCounselors(prev => prev.filter(c => c.id !== counselorToDelete.id));
                
                // Vibrate on delete (if supported)
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

    // Handle escape key to close context menu
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
                                title={`Last message: ${counselor.fullDateTime}`}
                            >
                                <div className="counselorListItem">
                                    <div className="counselorAvatarContainer">
                                        {counselor.avatar ? (
                                            <div className="counselorAvatar">
                                                <img 
                                                    src={counselor.avatar} 
                                                    alt={counselor.name}
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.style.display = 'none';
                                                        e.target.parentElement.classList.add('avatar-fallback');
                                                        e.target.parentElement.setAttribute('data-initials', getInitials(counselor.name));
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div 
                                                className="counselorAvatar avatar-fallback"
                                                style={{ backgroundColor: getAvatarColor(counselor.name) }}
                                                data-initials={getInitials(counselor.name)}
                                            >
                                                {getInitials(counselor.name)}
                                            </div>
                                        )}
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
                                        <div className="counselorSpecialization">
                                            {counselor.specialization}
                                        </div>
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
                        <span className="context-menu-counselor-name">
                            {contextMenu.counselor.name}
                        </span>
                        <span className="context-menu-time">
                            {contextMenu.counselor.fullDateTime}
                        </span>
                    </div>
                    <div className="context-menu-items">
                        <button 
                            className="context-menu-item delete"
                            onClick={() => handleDeleteChat(contextMenu.counselor)}
                        >
                            <span className="context-menu-icon">🗑️</span>
                            <span className="context-menu-text">Delete Chat</span>
                        </button>
                        <button 
                            className="context-menu-item"
                            onClick={() => {
                                try {
                                    // Mark as read
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
                            <p>Are you sure you want to delete your chat with <strong>{counselorToDelete.name}</strong>?</p>
                            <p className="delete-warning">
                                This action cannot be undone. All messages will be permanently deleted.
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