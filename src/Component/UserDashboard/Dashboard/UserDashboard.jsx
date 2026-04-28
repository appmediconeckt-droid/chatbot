import React, { useState, useEffect, useRef } from "react";
import "./UserDashboard.css";
import { useNavigate } from "react-router-dom";
import axiosInstance, { API_BASE_URL } from "../../../axiosConfig";
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
  FaCalendarAlt,
  FaMicrophone,
  FaVideo as FaVideoIcon,
  FaStop,
} from "react-icons/fa";

import ChatInterface from "../Tab/chatbot/ChatInterface";
import WalletDashboard from "../Tab/Wallet/WalletDashboard";
import CallHistory from "../Tab/Callls/CallHistory";
import useVibration from "../../../hooks/useVibration";
import useRingtone from "../../../hooks/useRingtone";
import PatientProfile from "../../PatientProfile/PatientProfile";

import LiveChatSupport from "../Tab/Appointment/BookAppointment";
import axios from "axios";
import CounselorTable from "../Tab/Counselor/CounselorDirectory";
import VideoCallModal from "../Tab/CallModal/VideoCallModal";
import IncomingCallModal from "../../common/IncomingCallModal/IncomingCallModal";
import CounselorRequestChat from "../Tab/Appointment/BookAppointment";
import MyAppointments from "../Tab/Appointment/MyAppointments";

const ChatPopup = ({
  messages,
  newMessage,
  setNewMessage,
  sendMessage,
  handleKeyPress,
  isLoading,
  onClose,
  chatBodyRef,
  handleCounselorClick,
}) => {
  const renderMessageText = (text) => {
    if (!text) return null;
    const parts = text.split(/(\[.*?\])/g);
    return parts.map((part, index) => {
      if (part.startsWith("[") && part.endsWith("]")) {
        const name = part.substring(1, part.length - 1);
        return (
          <span
            key={index}
            className="ud-chat-mention clickable"
            onClick={() => handleCounselorClick(name)}
            title={`View profile of ${name}`}
          >
            {name}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="ud-chat-popup-overlay">
      <div className="ud-chat-popup">
        <div className="ud-chat-popup-header">
          <div className="ud-chat-header-info">
            <div className="ud-chat-avatar">
              <FaRobot />
            </div>
            <div>
              <h3>MediConeckt AI Assistant</h3>
              <p className="ud-chat-status">Online • 24/7 Support</p>
            </div>
          </div>
          <button className="ud-chat-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="ud-chat-popup-body" ref={chatBodyRef}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`ud-chat-message-wrapper ${message.sender}`}
            >
              {message.sender === "ai" && (
                <div className="ud-chat-avatar ud-small">
                  <FaRobot />
                </div>
              )}
              <div className="ud-chat-bubble">
                {renderMessageText(message.text)}
              </div>
              {message.sender === "user" && (
                <div className="ud-chat-avatar ud-small">
                  <FaUserCircle />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="ud-chat-message-wrapper ai">
              <div className="ud-chat-avatar ud-small">
                <FaRobot />
              </div>
              <div className="ud-chat-bubble">
                <div className="ud-loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="ud-chat-popup-footer">
          <input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="ud-chat-input"
          />
          <button
            className="ud-send-btn"
            onClick={sendMessage}
            disabled={isLoading || !newMessage.trim()}
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
};

// ChatButton Component
const ChatButton = ({ onClick, unreadCount }) => (
  <button className="ud-floating-chat-btn" onClick={onClick}>
    AI
    {unreadCount > 0 && <span className="ud-unread-badge">{unreadCount}</span>}
  </button>
);

export default function UserDashboard() {
  const [active, setActive] = useState("Chat");
  const [chatOpen, setChatOpen] = useState(false);
  const [targetCounselor, setTargetCounselor] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const handleAIContactClick = (name) => {
    setTargetCounselor(name);
    setActive("Counselor");
    setChatOpen(false);
  };
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState("video");
  const [callerInfo, setCallerInfo] = useState({
    name: "",
    image: null,
    userId: "",
    userName: "",
    callId: "",
    roomId: "",
    waitingDuration: 0,
    onEndCall: null,
  });
  const [waitingCalls, setWaitingCalls] = useState([]);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [isPolling, setIsPolling] = useState(true);
  const [showIncomingCallModal, setShowIncomingCallModal] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);

  const userId = localStorage.getItem("userId");
  const chatBodyRef = useRef(null);
  const navigate = useNavigate();
  const vibrate = useVibration();
  const { startRinging, stopRinging } = useRingtone();

  // Ringtone Control
  useEffect(() => {
    if (showCallModal) {
      startRinging();
    } else {
      stopRinging();
    }
  }, [showCallModal, startRinging, stopRinging]);

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    profilePhoto: "",
  });

  const getProfilePhotoUrl = (userData) => {
    if (userData.profilePhoto) {
      if (
        typeof userData.profilePhoto === "object" &&
        userData.profilePhoto.url
      )
        return userData.profilePhoto.url;
      if (typeof userData.profilePhoto === "string")
        return userData.profilePhoto;
    }
    return "";
  };

  const acceptCall = async (callId) => {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      const acceptorId = localStorage.getItem("userId");
      const response = await axios.put(
        `${API_BASE_URL}/api/video/calls/${callId}/accept`,
        { acceptorId, acceptorType: "user" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (response.data && response.data.success) return response.data;
      return null;
    } catch (error) {
      console.error("Error accepting call:", error);
      return null;
    }
  };

  const endCall = async (callId) => {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      const userId = localStorage.getItem("userId");
      const response = await axios.put(
        `${API_BASE_URL}/api/video/calls/${callId}/end`,
        { userId, endedBy: "user" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (response.data && response.data.success) return response.data;
      return null;
    } catch (error) {
      console.error("Error ending call:", error);
      return null;
    }
  };

  const rejectCall = async (callId) => {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      const userId = localStorage.getItem("userId");
      const response = await axios.put(
        `${API_BASE_URL}/api/video/calls/${callId}/reject`,
        { userId, reason: "declined" },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return response.data?.success || false;
    } catch (error) {
      console.error("Error rejecting call:", error);
      return false;
    }
  };

  const fetchWaitingCalls = async () => {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      const userId = localStorage.getItem("userId");
      if (!userId || !token) return;
      const response = await axios.get(
        `${API_BASE_URL}/api/video/calls/pending/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const callsList =
        response.data.pendingRequests ||
        response.data.waitingCalls ||
        response.data.calls;
      if (
        response.data &&
        response.data.success &&
        callsList &&
        callsList.length > 0
      ) {
        setWaitingCalls(callsList);
        const waitingCall =
          callsList.find(
            (call) =>
              !call.status ||
              call.status === "waiting" ||
              call.status === "ringing",
          ) || callsList[0];
        if (waitingCall && !showCallModal) {
          const callTypeValue = waitingCall.callType || "video";
          setCallType(callTypeValue);
          const fromData = waitingCall.from || waitingCall.initiator || {};
          const callerFullName =
            fromData.fullName ||
            fromData.displayName ||
            fromData.name ||
            waitingCall.fromName ||
            "Counselor";

          const currentIncomingId = callerInfo?.callId;
          const stillWaiting = currentIncomingId
            ? callsList.some(
                (c) => (c.callId || c.id || c._id) === currentIncomingId,
              )
            : false;

          if (showCallModal && currentIncomingId && !stillWaiting) {
            console.log("Call no longer in pending list, closing modal");
            setShowCallModal(false);
            setCallerInfo({
              name: "",
              image: null,
              userId: "",
              userName: "",
              callId: "",
              roomId: "",
              waitingDuration: 0,
              onEndCall: null,
            });
            return;
          }

          const profilePhoto =
            fromData.profilePhoto || waitingCall.fromProfilePhoto || null;
          const callId =
            waitingCall.callId || waitingCall.id || waitingCall._id;
          const roomId = waitingCall.roomId;
          setCallerInfo({
            name: callerFullName,
            image: profilePhoto,
            userId: fromData.id || fromData._id || waitingCall.fromId,
            userName: callerFullName,
            callId: callId,
            roomId: roomId,
            waitingDuration:
              waitingCall.waitingDuration || waitingCall.remainingSeconds || 0,
            onEndCall: endCall,
            from: fromData,
            requestMessage:
              waitingCall.requestMessage || `Incoming ${callTypeValue} call...`,
            requestedAt: waitingCall.requestedAt || waitingCall.createdAt,
            callType: callTypeValue,
          });
          setShowCallModal(true);
          if (window.navigator && window.navigator.vibrate)
            window.navigator.vibrate([200, 100, 200]);
        }
      } else {
        setWaitingCalls([]);
        if (showCallModal) {
          console.log("No pending calls remaining, closing incoming modal");
          setShowCallModal(false);
          setCallerInfo({
            name: "",
            image: null,
            userId: "",
            userName: "",
            callId: "",
            roomId: "",
            waitingDuration: 0,
            onEndCall: null,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching waiting calls:", error);
    }
  };

  useEffect(() => {
    if (isPolling && !isVideoModalOpen) {
      fetchWaitingCalls();
      const interval = setInterval(() => fetchWaitingCalls(), 5000);
      setPollingInterval(interval);

      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    } else if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [isPolling, showCallModal, isVideoModalOpen]);

  useEffect(() => {
    if (isVideoModalOpen) {
      setIsPolling(false);
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    } else {
      setIsPolling(true);
    }
  }, [isVideoModalOpen]);

  useEffect(() => {
    if (showCallModal && !isVideoModalOpen) {
      void startRinging();
      return;
    }

    stopRinging();
  }, [showCallModal, isVideoModalOpen, startRinging, stopRinging]);

  useEffect(() => {
    return () => {
      stopRinging();
    };
  }, [stopRinging]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
        if (!userId) return;
        const response = await axios.get(
          `${API_BASE_URL}/api/auth/getUser/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (response.data.success) {
          const user = response.data.user;
          setUserData({
            name: user.fullName || "",
            email: user.email || "",
            phone: user.phoneNumber || "",
            profilePhoto: getProfilePhotoUrl(user),
          });
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUserData();
  }, []);

  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI assistant. How can I help you today?",
      sender: "ai",
    },
  ]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (chatBodyRef.current)
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
  }, [chatMessages, isLoading]);

  useEffect(() => {
    if (chatOpen) setUnreadCount(0);
  }, [chatOpen]);

  const sendMessage = async () => {
    if (newMessage.trim()) {
      const userMessage = { id: Date.now(), text: newMessage, sender: "user" };
      setChatMessages((prev) => [...prev, userMessage]);
      setNewMessage("");
      setIsLoading(true);

      try {
        // Prepare history for the AI (limit to last 10 messages)
        const history = chatMessages.slice(-10).map((msg) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text,
        }));

        const response = await axiosInstance.post(
          `${API_BASE_URL}/api/ai-chat`,
          {
            message: userMessage.text,
            history: history,
          },
        );

        if (response.data && response.data.success) {
          const aiResponse = {
            id: Date.now() + 1,
            text: response.data.data.aiResponse,
            sender: "ai",
          };
          setChatMessages((prev) => [...prev, aiResponse]);
        } else {
          throw new Error("Invalid AI response");
        }
      } catch (error) {
        console.error("AI Chat error:", error);
        const errorMessage = {
          id: Date.now() + 1,
          text: "I'm sorry, I'm having trouble connecting to the medical server. Please try again later.",
          sender: "ai",
        };
        setChatMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        if (!chatOpen) setUnreadCount((prev) => prev + 1);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleMenuItemClick = (id) => {
    vibrate(30);
    setActive(id);
    setTargetCounselor(""); // Reset search when navigating manually
    if (isMobile) {
      setShowMoreModal(false);
      setShowProfileMenu(false);
    }
  };

  const handleProfileClick = () => {
    vibrate(30);
    setActive("profile");
    setTargetCounselor("");
    if (isMobile) {
      setShowProfileMenu(false);
    }
  };

  const handleAcceptCall = async (callId) => {
    try {
      const resolvedCallId =
        callId || callerInfo?.callId || callerInfo?.id || callerInfo?._id;

      if (!resolvedCallId) {
        return null;
      }

      const result = await acceptCall(resolvedCallId);
      if (result) {
        console.log("Call accepted successfully", result);
        console.log("callType:", callType);
        const normalizedCallType =
          callType === "audio" || callType === "voice" ? "voice" : "video";
        setSelectedCall({
          ...callerInfo,
          ...result,
          status: "connected",
          callType: normalizedCallType,
          type: normalizedCallType,
        });
        setIsVideoModalOpen(true);
        return result;
      }
      return null;
    } catch (error) {
      console.error("Error in accept call:", error);
      return null;
    }
  };

  const handleRejectCall = async (callId) => {
    try {
      const resolvedCallId =
        callId || callerInfo?.callId || callerInfo?.id || callerInfo?._id;

      if (!resolvedCallId) {
        return false;
      }

      await rejectCall(resolvedCallId);
      console.log("Call rejected successfully");
      return true;
    } catch (error) {
      console.error("Error in reject call:", error);
      return false;
    }
  };

  const handleEndCall = async (callId) => {
    try {
      const resolvedCallId =
        callId ||
        selectedCall?.callId ||
        selectedCall?.id ||
        callerInfo?.callId ||
        callerInfo?.id;

      if (!resolvedCallId) {
        return false;
      }

      const result = await endCall(resolvedCallId);
      if (!result?.success) {
        console.warn("End call API did not report success", result);
      }
      return !!result?.success;
    } catch (error) {
      console.error("Error in end call:", error);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      const response = await axiosInstance.post(
        `${API_BASE_URL}/api/auth/logout`,
        { refreshToken },
        {
          withCredentials: true,
          headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            "Content-Type": "application/json",
          },
        },
      );

      console.log("Logout success:", response.data);
      localStorage.clear();
      navigate("/role-selector");
    } catch (error) {
      console.error("Logout error:", error?.response?.data || error.message);
      localStorage.clear();
      navigate("/role-selector");
    }
  };

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
      navigate("/role-selector");
    }, 2500);
  };

  const handleMoreModalToggle = () => {
    vibrate(30);
    setShowMoreModal(!showMoreModal);
  };

  const handleCloseModal = () => {
    vibrate(20);
    setShowMoreModal(false);
    setShowProfileMenu(false);
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
    { id: "MyAppointments", icon: <FaCalendarAlt />, label: "My Appointments" },
    { id: "Wallet", icon: <FaWallet />, label: "Wallet" },
    { id: "Video", icon: <FaVideo />, label: "Call History" },
    { id: "help", icon: <FaQuestionCircle />, label: "Help & Support" },
    { id: "privacy", icon: <FaLock />, label: "Privacy" },
  ];

  const bottomMenuItems = allMenuItems.slice(0, 4);

  // Wrapper component with error boundary for CounselorTable
  const SafeCounselorTable = () => {
    try {
      return <CounselorTable />;
    } catch (error) {
      console.error("Error rendering CounselorTable:", error);
      return (
        <div className="ud-error-container">
          <h3>Unable to load counselor directory</h3>
          <p>Please try again later or contact support.</p>
        </div>
      );
    }
  };

  return (
    <div className="user-dashboard">
      <IncomingCallModal
        isOpen={showCallModal}
        onClose={() => {
          setShowCallModal(false);
          setCallerInfo({
            name: "",
            image: null,
            userId: "",
            userName: "",
            callId: "",
            roomId: "",
            waitingDuration: 0,
            onEndCall: null,
          });
        }}
        callType={callType}
        callerName={callerInfo.userName || callerInfo.name}
        callerImage={callerInfo.image}
        callData={callerInfo}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
        fallbackName="Counselor"
      />

      <VideoCallModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        callData={selectedCall}
        callMode={selectedCall?.callType || selectedCall?.type || callType}
        currentUser={{ id: userId, role: "user" }}
        onEndCall={handleEndCall}
      />

      {isMobile && (
        <div className="ud-mobile-header">
          <div className="ud-mobile-header-left">
            <h2 className="ud-mobile-logo">MChat</h2>
          </div>
          <div className="ud-mobile-header-right">
            <button
              className="ud-mobile-profile-btn"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              {userData.profilePhoto ? (
                <img
                  src={userData.profilePhoto}
                  alt={userData.name}
                  className="ud-mobile-user-avatar"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = "none";
                    e.target.parentElement.innerHTML =
                      '<FaUserCircle class="ud-mobile-user-icon" />';
                  }}
                />
              ) : (
                <FaUserCircle className="ud-mobile-user-icon" />
              )}
            </button>
            {showProfileMenu && (
              <div className="ud-profile-dropdown-menu">
                <div className="ud-profile-dropdown-header">
                  {userData.profilePhoto ? (
                    <img
                      src={userData.profilePhoto}
                      alt={userData.name}
                      className="ud-dropdown-avatar"
                    />
                  ) : (
                    <FaUserCircle className="ud-dropdown-avatar-icon" />
                  )}
                  <div className="ud-dropdown-user-info">
                    <h4>{userData.name}</h4>
                    <p>{userData.email}</p>
                  </div>
                </div>
                <div className="ud-profile-dropdown-items">
                  <button
                    className="ud-dropdown-item"
                    onClick={handleProfileClick}
                  >
                    <FaUser className="ud-dropdown-icon" />
                    <span>My Profile</span>
                  </button>
                  <button
                    className="ud-dropdown-item ud-logout-item"
                    onClick={handleLogoutClick}
                  >
                    <FaSignOutAlt className="ud-dropdown-icon" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="ud-dashboard-container">
        {!isMobile && (
          <aside className="ud-user-sidebar">
            <div className="ud-sidebar-content">
              <div className="ud-sidebar-header">
                <div className="ud-profile-section">
                  <div className="ud-profile-image">
                    {userData.profilePhoto ? (
                      <img
                        src={userData.profilePhoto}
                        alt={userData.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = "none";
                          e.target.parentElement.innerHTML =
                            '<FaUserCircle className="ud-default-avatar" />';
                        }}
                      />
                    ) : (
                      <FaUserCircle className="ud-default-avatar" />
                    )}
                  </div>
                  <div className="ud-profile-info">
                    <h3 className="ud-sidebar-title">
                      Name: <span>{userData.name}</span>
                    </h3>
                    <p className="ud-sidebar-subtitle">
                      Email: <span>{userData.email}</span>
                    </p>
                    <p className="ud-sidebar-subtitle">
                      Phone: <span>{userData.phone}</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="ud-sidebar-menu">
                {allMenuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleMenuItemClick(item.id)}
                    className={`ud-sidebar-item ${active === item.id ? "ud-active" : ""}`}
                  >
                    <span className="ud-sidebar-icon">{item.icon}</span>
                    <span className="ud-sidebar-text">{item.label}</span>
                  </button>
                ))}
              </div>
              <hr className="ud-sidebar-separator" />
              <div className="ud-sidebar-actions">
                <button
                  className="ud-sidebar-item ud-logout"
                  onClick={handleLogoutClick}
                >
                  <span className="ud-sidebar-icon">
                    <FaSignOutAlt />
                  </span>
                  <span className="ud-sidebar-text">Logout</span>
                </button>
              </div>
            </div>
          </aside>
        )}

        <div className={`ud-dashboard-content ${isMobile ? "ud-mobile" : ""}`}>
          <div className="ud-content-scrollable">
            {active === "Chat" && <ChatInterface setActiveTab={setActive} />}
            {active === "Counselor" && (
              <CounselorRequestChat initialSearch={targetCounselor} />
            )}
            {active === "Live Chat" && <LiveChatSupport />}
            {active === "MyAppointments" && (
              <MyAppointments setDashboardTab={setActive} />
            )}
            {active === "Wallet" && <WalletDashboard userData={userData} />}
            {active === "Video" && (
              <CallHistory currentUser={{ id: userId, role: "user" }} />
            )}
            {active === "profile" && <PatientProfile />}
            {active === "help" && (
              <div className="ud-work-in-progress">
                The remaining work is currently in progress.
              </div>
            )}
            {active === "privacy" && (
              <div className="ud-work-in-progress">
                The remaining work is currently in progress.
              </div>
            )}
          </div>
        </div>
      </div>

      {!chatOpen && (
        <ChatButton
          onClick={() => setChatOpen(true)}
          unreadCount={unreadCount}
        />
      )}
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
          handleCounselorClick={handleAIContactClick}
        />
      )}

      {isMobile && (
        <nav className="ud-mobile-bottom-nav">
          {bottomMenuItems.map((item) => (
            <button
              key={item.id}
              className={`ud-mobile-nav-btn ${active === item.id ? "ud-active" : ""}`}
              onClick={() => handleMenuItemClick(item.id)}
            >
              <span className="ud-nav-icon">{item.icon}</span>
              <span className="ud-nav-label">{item.label}</span>
            </button>
          ))}
          <button
            className="ud-mobile-nav-btn ud-more-btn"
            onClick={handleMoreModalToggle}
          >
            <span className="ud-nav-icon">
              <FaEllipsisH />
            </span>
            <span className="ud-nav-label">More</span>
          </button>
        </nav>
      )}

      {showMoreModal && (
        <div className="ud-modal-overlay" onClick={handleCloseModal}>
          <div
            className="ud-modal-container ud-more-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ud-modal-header">
              <h3 className="ud-modal-title">Menu Options</h3>
              <button className="ud-close-modal-btn" onClick={handleCloseModal}>
                <FaTimes />
              </button>
            </div>
            <div className="ud-modal-body">
              <div className="ud-more-options-list">
                {allMenuItems.map((item) => (
                  <button
                    key={item.id}
                    className={`ud-more-option-item ${active === item.id ? "ud-active" : ""}`}
                    onClick={() => handleMenuItemClick(item.id)}
                  >
                    <span className="ud-more-option-icon">{item.icon}</span>
                    <span className="ud-more-option-text">{item.label}</span>
                    <span className="ud-more-option-arrow">
                      <FaArrowRight />
                    </span>
                  </button>
                ))}
                <div className="ud-more-actions">
                  <button
                    className="ud-more-action-btn ud-logout-btn"
                    onClick={() => {
                      vibrate(30);
                      setShowMoreModal(false);
                      setShowLogoutConfirm(true);
                    }}
                  >
                    <FaSignOutAlt className="ud-action-icon" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div
          className="ud-modal-overlay"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="ud-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ud-modal-header">
              <h3 className="ud-modal-title">Confirm Logout</h3>
            </div>
            <div className="ud-modal-body">
              <p>Are you sure you want to logout?</p>
            </div>
            <div className="ud-modal-footer">
              <button
                className="ud-btn-secondary"
                onClick={() => {
                  vibrate(20);
                  setShowLogoutConfirm(false);
                }}
              >
                Cancel
              </button>
              <button className="ud-btn-danger" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div
          className="ud-modal-overlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="ud-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ud-modal-header">
              <h3 className="ud-modal-title">Delete Account</h3>
            </div>
            <div className="ud-modal-body">
              <p>
                This action cannot be undone. All your data will be permanently
                deleted.
              </p>
            </div>
            <div className="ud-modal-footer">
              <button
                className="ud-btn-secondary"
                onClick={() => {
                  vibrate(20);
                  setShowDeleteConfirm(false);
                }}
              >
                Cancel
              </button>
              <button className="ud-btn-danger" onClick={handleDeleteConfirm}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteSuccess && (
        <div className="ud-modal-overlay">
          <div className="ud-modal-container ud-success-modal">
            <div className="ud-modal-header">
              <h3 className="ud-modal-title ud-success">
                <FaCheckCircle className="ud-success-icon" />
                Account Deleted!
              </h3>
            </div>
            <div className="ud-modal-body">
              <p>Your account has been successfully deleted.</p>
              <p>Redirecting...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
