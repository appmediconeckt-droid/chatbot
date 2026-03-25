import React, { useState, useEffect, useRef } from 'react';
import "./UserDashboard.css";
import { useNavigate } from "react-router-dom";
import axiosInstance, { API_BASE_URL } from '../../../axiosConfig';
import {
  FaCommentDots,
  FaUserMd,
  FaWallet,
  FaVideo,
  FaQuestionCircle,
  FaLock,
  FaSignOutAlt,
  FaTrash,
  FaBars,
  FaTimes,
  FaUserCircle,
  FaEnvelope,
  FaPhone,
  FaSave,
  FaEllipsisH,
  FaArrowRight,
  FaCheckCircle,
  FaRobot,
  FaPaperPlane,
  FaCommentMedical,
  FaUser,
  FaCalendarAlt
} from "react-icons/fa";

import ChatInterface from "../Tab/chatbot/ChatInterface";
import WalletDashboard from "../Tab/Wallet/WalletDashboard";
import CallHistory from "../Tab/Callls/CallHistory";
import useVibration from '../../../hooks/useVibration';
import PatientProfile from '../../PatientProfile/PatientProfile';
import BookAppointment from '../Tab/Appointment/BookAppointment';
import LiveChatSupport from '../Tab/Appointment/BookAppointment';
import axios, { Axios } from 'axios';
import CounselorTable from '../Tab/Counselor/CounselorDirectory';

// ChatPopup Component
const ChatPopup = ({
  messages,
  newMessage,
  setNewMessage,
  sendMessage,
  handleKeyPress,
  isLoading,
  onClose,
  chatBodyRef
}) => (
  <div className="chat-popup-overlay">
    <div className="chat-popup">
      <div className="chat-popup-header">
        <div className="chat-header-info">
          <div className="chat-avatar">
            <FaRobot />
          </div>
          <div>
            <h3>MediConeckt AI Assistant</h3>
            <p className="chat-status">Online • 24/7 Support</p>
          </div>
        </div>
        <button className="chat-close-btn" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="chat-popup-body" ref={chatBodyRef}>
        {messages.map(message => (
          <div key={message.id} className={`chat-message-wrapper ${message.sender}`}>
            {message.sender === 'ai' && (
              <div className="chat-avatar small">
                <FaRobot />
              </div>
            )}
            <div className="chat-bubble">{message.text}</div>
            {message.sender === 'user' && (
              <div className="chat-avatar small">
                <FaUserCircle />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="chat-message-wrapper ai">
            <div className="chat-avatar small">
              <FaRobot />
            </div>
            <div className="chat-bubble">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="chat-popup-footer">
        <input
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          className="chat-input"
        />
        <button
          className="send-btn"
          onClick={sendMessage}
          disabled={isLoading || !newMessage.trim()}
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  </div>
);

// ChatButton Component
const ChatButton = ({ onClick, unreadCount }) => (
  <button className="floating-chat-btn" onClick={onClick}>
    AI
    {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
  </button>
);

export default function UserDashboard() {
  const [active, setActive] = useState("Chat");
  const [chatOpen, setChatOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const userId = localStorage.getItem("userId");

  const chatBodyRef = useRef(null);
  const navigate = useNavigate();
  const vibrate = useVibration();

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: ""
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = localStorage.getItem("userId"); // 👈 id from localhost

        const response = await axios.get(
          `${API_BASE_URL}/getUser/${userId}`
        );

        if (response.data.success) {
          const user = response.data.user;

          setUserData({
            name: user.fullName,
            email: user.email,
            phone: user.phoneNumber
          });
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUserData();
  }, []);

  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: "Hello! I'm your AI assistant. How can I help you today?", sender: 'ai' },
    { id: 2, text: "I'm feeling anxious today.", sender: 'user' }
  ]);

  // Check screen size on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatMessages, isLoading]);

  // Reset unread count when chat is opened
  useEffect(() => {
    if (chatOpen) {
      setUnreadCount(0);
    }
  }, [chatOpen]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      const userMessage = {
        id: Date.now(),
        text: newMessage,
        sender: 'user'
      };
      setChatMessages(prev => [...prev, userMessage]);
      setNewMessage('');
      setIsLoading(true);

      // Simulate AI response
      setTimeout(() => {
        const aiResponses = [
          "I understand. Would you like to try some breathing exercises?",
          "Thank you for sharing. How long have you been feeling this way?",
          "I'm here to listen. Would you like me to suggest some coping strategies?",
          "Would you like me to connect you with a mental health professional?"
        ];
        const aiMessage = {
          id: Date.now() + 1,
          text: aiResponses[Math.floor(Math.random() * aiResponses.length)],
          sender: 'ai'
        };
        setChatMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);

        // Increment unread count if chat is closed
        if (!chatOpen) {
          setUnreadCount(prev => prev + 1);
        }
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleMenuItemClick = (id) => {
    vibrate(30);
    setActive(id);
    if (isMobile) {
      setShowMoreModal(false);
    }
  };

  // FIXED: Correct logout function with proper API call
  const handleLogout = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      // Option 1: If your API expects refreshToken in the body
      const response = await axiosInstance.post(
        `${API_BASE_URL}/logout`,
        { refreshToken: refreshToken }, // Send as object with refreshToken property
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("Logout success:", response.data);

      // Clear local storage after successful logout
      localStorage.clear();

      // Redirect to role selector
      navigate("/role-selector");

    } catch (error) {
      console.error("Logout error:", error?.response?.data || error.message);

      // Even if API fails, clear local storage and redirect
      localStorage.clear();
      navigate("/role-selector");
    }
  };

  // Alternative logout function if your API expects refreshToken as string directly


  const handleLogoutClick = () => {
    vibrate(30);
    setShowLogoutConfirm(true);
  };

  const handleDeleteClick = () => {
    vibrate(40);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    vibrate([100, 50, 100]);
    setShowDeleteConfirm(false);
    setDeleteSuccess(true);
    setTimeout(() => {
      navigate('/role-selector');
    }, 2500);
  };

  const handleMoreModalToggle = () => {
    vibrate(30);
    setShowMoreModal(!showMoreModal);
  };

  const handleCloseModal = () => {
    vibrate(20);
    setShowMoreModal(false);
  };

  const handleSupportClick = (type) => {
    vibrate(40);
    alert(`Opening ${type} section`);
  };

  const handlePrivacyAction = (action) => {
    vibrate(30);
    alert(`Opening ${action} settings`);
  };

  const allMenuItems = [
    { id: "Chat", icon: <FaCommentDots />, label: "Chat" },
    { id: "Live Chat", icon: <FaUserMd />, label: "Counselor" },
    { id: "Wallet", icon: <FaWallet />, label: "Wallet" },
    { id: "Video", icon: <FaVideo />, label: "Video Call" },
    { id: "profile", icon: <FaUser />, label: "Profile" },
    { id: "help", icon: <FaQuestionCircle />, label: "Help & Support" },
    { id: "privacy", icon: <FaLock />, label: "Privacy" }
  ];

  const bottomMenuItems = allMenuItems.slice(0, 4);

  return (
    <div className="user-dashboard">
      {/* Mobile Header */}
      {isMobile && (
        <div className="mobile-header">
          <div className="mobile-header-info">
            <FaUserCircle className="mobile-user-icon" />
            <div className="sidebar-header">
              <h3 className="sidebar-title">Name:-{userData.name}</h3>
              <p className="sidebar-subtitle">{userData.email}</p>
              <p className="sidebar-subtitle">{userData.phone}</p>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-container">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside className="user-sidebar">
            <div className="sidebar-content">
              <div className="sidebar-header">
                <div className="profile-section">

                  {/* Profile Image */}
                  <div className="profile-image">
                    {userData.profilePhoto ? (
                      <img src={userData.profilePhoto} alt="Profile" />
                    ) : (
                      <FaUserCircle className="default-avatar" />
                    )}
                  </div>

                  {/* User Info */}
                  <div className="profile-info">
                    <h3 className="sidebar-title">
                      Name: <span>{userData.name}</span>
                    </h3>

                    <p className="sidebar-subtitle">
                      Email: <span>{userData.email}</span>
                    </p>

                    <p className="sidebar-subtitle">
                      Phone: <span>{userData.phone}</span>
                    </p>
                  </div>

                </div>
              </div>

              <div className="sidebar-menu">
                {allMenuItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleMenuItemClick(item.id)}
                    className={`sidebar-item ${active === item.id ? "active" : ""}`}
                  >
                    <span className="sidebar-icon">{item.icon}</span>
                    <span className="sidebar-text">{item.label}</span>
                  </button>
                ))}
              </div>

              <hr className="sidebar-separator" />

              <div className="sidebar-actions">
                <button
                  className="sidebar-item logout"
                  onClick={handleLogoutClick}
                >
                  <span className="sidebar-icon"><FaSignOutAlt /></span>
                  <span className="sidebar-text">Logout</span>
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <div className={`dashboard-content ${isMobile ? 'mobile' : ''}`}>
          <div className="content-scrollable">
            {active === "Chat" && <ChatInterface setActiveTab={setActive} />}
            {active === "Counselor" && <CounselorTable />}
            {active === "Wallet" && <WalletDashboard />}
            {active === "Video" && <CallHistory />}
            {active === "profile" && <PatientProfile />}
            {active === "Live Chat" && <LiveChatSupport />}

            {active === "help" && (
              <div className="content-section">
                <h2 className="section-title">Help & Support</h2>
                <div className="help-content">
                  <div
                    className="support-card"
                    onClick={() => handleSupportClick('FAQ')}
                  >
                    <FaQuestionCircle className="support-icon" />
                    <h3>FAQ</h3>
                    <p>Find answers to frequently asked questions</p>
                  </div>
                  <div
                    className="support-card"
                    onClick={() => handleSupportClick('Contact Support')}
                  >
                    <FaEnvelope className="support-icon" />
                    <h3>Contact Support</h3>
                    <p>Email us at support@example.com</p>
                  </div>
                </div>
              </div>
            )}

            {active === "privacy" && (
              <div className="content-section">
                <h2 className="section-title">Privacy Settings</h2>
                <div className="privacy-content">
                  <div className="privacy-option">
                    <h3>Data Privacy</h3>
                    <p>Control how your data is used and shared</p>
                    <button
                      className="privacy-btn"
                      onClick={() => handlePrivacyAction('Data Privacy')}
                    >
                      Manage Settings
                    </button>
                  </div>
                  <div className="privacy-option">
                    <h3>Session Privacy</h3>
                    <p>Configure privacy settings for your sessions</p>
                    <button
                      className="privacy-btn"
                      onClick={() => handlePrivacyAction('Session Privacy')}
                    >
                      Configure
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Chat Button */}
      {!chatOpen && (
        <ChatButton
          onClick={() => setChatOpen(true)}
          unreadCount={unreadCount}
        />
      )}

      {/* Chat Popup */}
      {chatOpen && (
        <ChatPopup
          messages={chatMessages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          sendMessage={sendMessage}
          handleKeyPress={handleKeyPress}
          isLoading={isLoading}
          onClose={() => setChatOpen(false)}
          chatBodyRef={chatBodyRef}
        />
      )}

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="mobile-bottom-nav">
          {bottomMenuItems.map(item => (
            <button
              key={item.id}
              className={`mobile-nav-btn ${active === item.id ? 'active' : ''}`}
              onClick={() => handleMenuItemClick(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
          <button
            className="mobile-nav-btn more-btn"
            onClick={handleMoreModalToggle}
          >
            <span className="nav-icon"><FaEllipsisH /></span>
            <span className="nav-label">More</span>
          </button>
        </nav>
      )}

      {/* More Options Modal */}
      {showMoreModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-container more-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Menu Options</h3>
              <button
                className="close-modal-btn"
                onClick={handleCloseModal}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="more-options-list">
                {allMenuItems.map(item => (
                  <button
                    key={item.id}
                    className={`more-option-item ${active === item.id ? 'active' : ''}`}
                    onClick={() => handleMenuItemClick(item.id)}
                  >
                    <span className="more-option-icon">{item.icon}</span>
                    <span className="more-option-text">{item.label}</span>
                    <span className="more-option-arrow">
                      <FaArrowRight />
                    </span>
                  </button>
                ))}

                <div className="more-actions">
                  <button
                    className="more-action-btn logout-btn"
                    onClick={() => {
                      vibrate(30);
                      setShowMoreModal(false);
                      setShowLogoutConfirm(true);
                    }}
                  >
                    <FaSignOutAlt className="action-icon" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutConfirm && (
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Logout</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to logout?</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => {
                  vibrate(20);
                  setShowLogoutConfirm(false);
                }}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Account</h3>
            </div>
            <div className="modal-body">
              <p>This action cannot be undone. All your data will be permanently deleted.</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => {
                  vibrate(20);
                  setShowDeleteConfirm(false);
                }}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleDeleteConfirm}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Success Message */}
      {deleteSuccess && (
        <div className="modal-overlay">
          <div className="modal-container success-modal">
            <div className="modal-header">
              <h3 className="modal-title success">
                <FaCheckCircle className="success-icon" />
                Account Deleted!
              </h3>
            </div>
            <div className="modal-body">
              <p>Your account has been successfully deleted.</p>
              <p>Redirecting...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}