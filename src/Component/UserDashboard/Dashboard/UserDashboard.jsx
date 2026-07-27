import React, { lazy, Suspense, useState, useEffect, useRef } from "react";
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
  FaCog,
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
  FaCommentMedical,
  FaUser,
  FaCalendarAlt,
  FaBell,
  FaShieldAlt,
  FaDownload,
  FaChevronDown,
  FaChevronUp,
  FaRobot,
  FaSearch,
  FaExclamationTriangle,
  FaFileAlt,
  FaUpload,
  FaChevronRight,
} from "react-icons/fa";

import useVibration from "../../../hooks/useVibration";
import useRingtone from "../../../hooks/useRingtone";

import axios from "axios";
import socketService from "../../../services/socketService";
import LocationNoticeToast from "../../common/LocationNoticeToast";
import { useUserTranslation } from "../../../i18n/LanguageContext";
import { LanguageSelector } from "../../common/LanguageSelector";
import AiChatPopup from "./components/AiChatPopup";
import ChatButton from "./components/ChatButton";
import NotificationCenter from "../../common/Notifications/NotificationCenter";

const AccountSettings = lazy(() => import("../../Settings/AccountSettings"));
const CallHistory = lazy(() => import("../Tab/Callls/CallHistory"));
const ChatInterface = lazy(() => import("../Tab/chatbot/ChatInterface"));
const ChatBox = lazy(() => import("../Tab/ChatBox/ChatBox"));
const CounselorRequestChat = lazy(() => import("../Tab/Appointment/BookAppointment"));
const IncomingCallModal = lazy(() => import("../../common/IncomingCallModal/IncomingCallModal"));
const MyAppointments = lazy(() => import("../Tab/Appointment/MyAppointments"));
const PatientProfile = lazy(() => import("../../PatientProfile/PatientProfile"));
const RatingPrompt = lazy(() => import("../../../components/RatingPrompt"));
const VideoCallModal = lazy(() => import("../Tab/CallModal/VideoCallModal"));
const WalletDashboard = lazy(() => import("../Tab/Wallet/WalletDashboard"));
const NotificationsPage = lazy(() => import("../../common/Notifications/NotificationsPage"));

const DashboardPanelLoader = () => (
  <div className="ud-content-section">
    <div className="app-loading">Loading...</div>
  </div>
);

// Map i18n lang codes to VOICE_LANGUAGES codes
const LANG_TO_VOICE = { en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN', kn: 'kn-IN', ml: 'ml-IN', bn: 'bn-IN', gu: 'gu-IN', mr: 'mr-IN' };

// The dashboard language is stored as a locale (for example, `hi-IN`), while
// the AI chat accepts a speech/API locale. Keep unsupported locales intact so
// every dashboard language can still be sent to the AI API.
const getAiChatLanguage = (language) => {
  const locale = String(language || 'en-IN');
  const baseCode = locale.split('-')[0].toLowerCase();
  return LANG_TO_VOICE[baseCode] || locale;
};

const AI_CHAT_ENDPOINT = `${API_BASE_URL}/api/ai-chat/send-message`;

export default function UserDashboard() {
  const { t, lang, setLang } = useUserTranslation();
  const [, setLanguageUpdate] = useState(0);
  const [active, setActive] = useState("Chat");
  const [openPrivacySection, setOpenPrivacySection] = useState("Chats & Calls");
  const [helpSearch, setHelpSearch] = useState("");
  const [openHelpQuestion, setOpenHelpQuestion] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [targetCounselor, setTargetCounselor] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(null);

  const handleOpenCounselorConversation = (conversation) => {
    setSelectedConversation(conversation);
    setActive("Chat");
  };

  // Force re-render when language changes
  useEffect(() => {
    setLanguageUpdate(prev => prev + 1);
  }, [lang]);

  const handleAIContactClick = (name) => {
    setTargetCounselor(name);
    setActive("Live Chat");
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

  // Log language changes for debugging
  useEffect(() => {
    console.log('📝 Current user language:', lang);
  }, [lang]);

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
        const token =
          localStorage.getItem("token") || localStorage.getItem("accessToken");
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

    const handleProfileUpdated = (event) => {
      if (!event.detail?.role || event.detail.role === "user") {
        fetchUserData();
      }
    };

    window.addEventListener("profile-updated", handleProfileUpdated);
    return () => window.removeEventListener("profile-updated", handleProfileUpdated);
  }, []);

  // Start empty so the backend's onboarding question (or the user's first
  // turn-based AI reply) is what the user actually sees first. The old
  // hard-coded "Hello! I'm your AI assistant" suppressed the warm onboarding.
  const [chatMessages, setChatMessages] = useState([]);
  const [aiSessionId, setAiSessionId] = useState(null);
  // The AI chat always follows the language selected for the user dashboard.
  // It deliberately has no separate language preference or selector.
  const selectedLang = getAiChatLanguage(lang);

  const getAiReplyFromResponse = (responseData) =>
    responseData?.data?.aiResponse ||
    responseData?.reply ||
    responseData?.aiResponse ||
    "";

  const getAiQuickRepliesFromResponse = (responseData) =>
    responseData?.data?.quickReplies || responseData?.quickReplies || null;

  const getAiSessionIdFromResponse = (responseData) =>
    responseData?.data?.sessionId || responseData?.sessionId || null;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load chat history from backend on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        const response = await fetch(`${API_BASE_URL}/api/ai-chat/history`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.history) && data.history.length > 0) {
            const loadedMessages = data.history.map((msg, index) => ({
              id: Date.now() + index,
              text: msg.content,
              sender: msg.role === 'user' ? 'user' : 'ai',
              quickReplies: null,
            }));
            setChatMessages(loadedMessages);
            if (data.sessionId) {
              setAiSessionId(data.sessionId);
            }
          }
        }
      } catch (err) {
        console.warn('[UserDashboard] Failed to load chat history:', err.message);
      }
    };

    loadChatHistory();
  }, []);

  useEffect(() => {
    if (chatBodyRef.current)
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
  }, [chatMessages, isLoading]);

  useEffect(() => {
    if (chatOpen) setUnreadCount(0);
  }, [chatOpen]);

  // Kickoff the chat with a silent "hi" so the backend's onboarding turn
  // fires immediately when the user first opens the chat. We don't render
  // the synthetic "hi" in the bubble list — only the AI's onboarding reply.
  useEffect(() => {
    if (!chatOpen) return;
    if (chatMessages.length > 0) return;
    if (isLoading) return;

    const kickoff = async () => {
      setIsLoading(true);
       try {
        const response = await axiosInstance.post(AI_CHAT_ENDPOINT, {
          message: "hi",
          history: [],
          language: selectedLang,
        });
       if (response.data?.success) {
  const aiReply = getAiReplyFromResponse(response.data);
  const nextSessionId = getAiSessionIdFromResponse(response.data);

  if (nextSessionId) {
    setAiSessionId(nextSessionId);
  }

  setChatMessages([
    {
      id: Date.now(),
      text: aiReply || "Hi! Main aapki kaise madad kar sakta hu?",
      sender: "ai",
      quickReplies: getAiQuickRepliesFromResponse(response.data),
    },
  ]);
}
      }catch (err) {
        console.warn("[AI-CHAT] kickoff failed:", err.message);
        setChatMessages([
          {
            id: Date.now(),
            text: "Hi! I'm here to help. What's on your mind today?",
            sender: "ai",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    void kickoff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatOpen]);

  // Single send pipeline used by both the text input and the mood quick-reply
  // buttons. Strips quickReplies from older AI messages so old buttons don't
  // re-trigger after the user has already responded.
 const sendChat = async (text) => {
  const trimmed = (text || "").trim();
  if (!trimmed) return;

  const userMessage = {
    id: Date.now(),
    text: trimmed,
    sender: "user",
  };

  setChatMessages((prev) => [
    ...prev.map((m) =>
      m.sender === "ai" && m.quickReplies ? { ...m, quickReplies: null } : m
    ),
    userMessage,
  ]);

  setIsLoading(true);

  try {
    const history = chatMessages.slice(-10).map((message) => ({
      role: message.sender === "user" ? "user" : "assistant",
      content: message.text,
    }));

    const response = await axiosInstance.post(
      AI_CHAT_ENDPOINT,
      {
        message: userMessage.text,
        history,
        sessionId: aiSessionId,
        language: selectedLang,
      },
      { timeout: 180000 },
    );

    console.log("AI response:", response.data);

    if (response.data && response.data.success) {
      const aiReply = getAiReplyFromResponse(response.data);

      if (!aiReply) {
        throw new Error("AI reply missing in response");
      }

      const nextSessionId = getAiSessionIdFromResponse(response.data);
      if (nextSessionId) {
        setAiSessionId(nextSessionId);
      }

      const aiResponse = {
        id: Date.now() + 1,
        text: aiReply,
        sender: "ai",
        quickReplies: getAiQuickRepliesFromResponse(response.data),
      };

      setChatMessages((prev) => [...prev, aiResponse]);
    } else {
      throw new Error(response.data?.message || "Invalid AI response");
    }
  } catch (error) {
    console.error("AI Chat error:", error?.response?.data || error.message);

    const errorMessage = {
      id: Date.now() + 1,
      text: "AI reply nahi aa paya. Please try again.",
      sender: "ai",
    };

    setChatMessages((prev) => [...prev, errorMessage]);
  } finally {
    setIsLoading(false);
    if (!chatOpen) setUnreadCount((prev) => prev + 1);
  }
};

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const text = newMessage;
    setNewMessage("");
    await sendChat(text);
  };

  const sendQuickReply = async (text) => {
    if (isLoading) return;
    await sendChat(text);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleLangChange = async (newLang) => {
    if (isLoading) return;
    // sync with the global i18n context (strip -IN/-US suffix → base code)
    setLang(newLang);
    setIsLoading(true);
    try {
      await axiosInstance.delete(`${API_BASE_URL}/api/ai-chat/my-history`);
    } catch (_) {}
    setAiSessionId(null);
    setNewMessage("");
    setChatMessages([]);
    try {
      const response = await axiosInstance.post(AI_CHAT_ENDPOINT, {
        message: "hi",
        history: [],
        language: getAiChatLanguage(newLang),
      });
      if (response.data?.success) {
        const nextSessionId = getAiSessionIdFromResponse(response.data);
        if (nextSessionId) setAiSessionId(nextSessionId);
        setChatMessages([{
          id: Date.now(),
          text: getAiReplyFromResponse(response.data),
          sender: "ai",
          quickReplies: getAiQuickRepliesFromResponse(response.data),
        }]);
      }
    } catch (err) {
      console.warn("[AI-CHAT] lang change kickoff failed:", err.message);
    } finally {
      setIsLoading(false);
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

  const handleSettingsClick = () => {
    vibrate(30);
    setActive("settings");
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
      socketService.disconnect();
      localStorage.clear();
      navigate("/role-selector");
    } catch (error) {
      console.error("Logout error:", error?.response?.data || error.message);
      socketService.disconnect();
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


  const allMenuItems = [
    { id: "Chat", icon: <FaCommentDots />, label: t('chat') },
    { id: "Live Chat", icon: <FaUserMd />, label: t('counselor') },
    { id: "MyAppointments", icon: <FaCalendarAlt />, label: t('appointments') },
    { id: "Wallet", icon: <FaWallet />, label: t('wallet') },
    { id: "Video", icon: <FaVideo />, label: t('call_history') },
    { id: "settings", icon: <FaCog />, label: t('settings') },
    { id: "Notifications", icon: <FaBell />, label: "Notifications" },
    { id: "help", icon: <FaQuestionCircle />, label: t('help_support') },
    { id: "privacy", icon: <FaLock />, label: t('privacy') },
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
          <h3>{t('unable_load_counselor_dir')}</h3>
          <p>{t('please_try_again_contact_support')}</p>
        </div>
      );
    }
  };

  const supportOptions = [
    {
      icon: <FaCommentDots />,
      title: "AI wellness chat",
      text: "Ask mental-wellness questions, use voice input, get quick replies, and continue your recent AI chat from the dashboard.",
      action: "Open AI chat",
      onClick: () => handleMenuItemClick("Chat"),
    },
    {
      icon: <FaUserMd />,
      title: "Counselor support",
      text: "Browse counselors by name, specialization, language, location, rating, and online status before starting care.",
      action: "Find counselor",
      onClick: () => handleMenuItemClick("Live Chat"),
    },
    {
      icon: <FaCalendarAlt />,
      title: "Appointments",
      text: "View requested, confirmed, upcoming, completed, and cancelled counselor appointments in one place.",
      action: "My appointments",
      onClick: () => handleMenuItemClick("MyAppointments"),
    },
    {
      icon: <FaVideo />,
      title: "Calls and sessions",
      text: "Check voice/video session history and reconnect from accepted chats when both sides are available.",
      action: "Call history",
      onClick: () => handleMenuItemClick("Video"),
    },
    {
      icon: <FaWallet />,
      title: "Wallet and payments",
      text: "Add money, review transactions, download wallet reports, and contact support for payment questions.",
      action: "Open wallet",
      onClick: () => handleMenuItemClick("Wallet"),
    },
  ];

  const helpChecklist = [
    "Complete your profile details so counselors can understand the care context you choose to share.",
    "Keep your email and phone verified; protected profile changes ask for OTP confirmation.",
    "Allow location when possible so login verification and location-aware counselor discovery work properly.",
    "For counselor chat, send a request first. The conversation opens fully after the counselor accepts.",
    "Voice and video calls work from an accepted chat/session. Check camera, microphone, browser permissions, and internet quality.",
    "Wallet reports and transaction history are available from the Wallet tab for payment follow-up.",
    "In an emergency or immediate risk situation, contact local emergency services or a crisis helpline right away. This app is not a substitute for emergency care.",
  ];

  const commonIssues = [
    {
      title: "Profile or photo is not updating",
      text: "Refresh the profile page, confirm required fields, and complete OTP verification if you changed email or phone. For location, use Settings > Update location.",
    },
    {
      title: "Counselor chat is not opening",
      text: "Open Counselor Support, choose an available counselor, and wait for the request to be accepted. Existing chats appear in the AI/chat area and counselor chat screens.",
    },
    {
      title: "Call is not connecting",
      text: "Make sure the counselor has accepted your chat/session, both users are online, and browser permissions for microphone/camera are allowed.",
    },
    {
      title: "Appointment is missing",
      text: "Check My Appointments filters for pending, confirmed, upcoming, completed, or cancelled status. A request may still be awaiting counselor confirmation.",
    },
    {
      title: "Wallet or payment issue",
      text: "Open Wallet to review the latest transaction and download a report. Share the date, amount, and transaction status when contacting support.",
    },
    {
      title: "Language or translation looks wrong",
      text: "Use the language selector from the dashboard/settings. Some counselor or medical details may remain in the language entered by the provider.",
    },
  ];

  const privacyHighlights = [
    {
      icon: <FaCheckCircle />,
      label: "OTP protected",
      value: "Email and phone changes",
    },
    {
      icon: <FaUser />,
      label: "Anonymous care identity",
      value: "Shown to counselors where supported",
    },
    {
      icon: <FaLock />,
      label: "Sensitive areas",
      value: "Chats, calls, appointments, profile",
    },
  ];

  const privacyDataGroups = [
    {
      icon: <FaUser />,
      title: "Profile and health details",
      text: "Your name, anonymous display name, age, gender, contact details, photo/avatar, address, emergency contact, basic medical details, and insurance fields are used to maintain your patient profile.",
    },
    {
      icon: <FaCommentDots />,
      title: "AI chat and counselor conversations",
      text: "Messages, quick replies, chat status, attachments, accepted chat sessions, and counselor details are used to provide conversations, continue history, and support rating prompts.",
    },
    {
      icon: <FaCalendarAlt />,
      title: "Appointments and sessions",
      text: "Appointment date, time, reason/notes, status, assigned counselor, call metadata, and session history help users and counselors manage care.",
    },
    {
      icon: <FaWallet />,
      title: "Wallet and transactions",
      text: "Wallet balance, top-ups, transaction records, generated reports, and related support context are used for payment tracking.",
    },
    {
      icon: <FaCog />,
      title: "Location and device context",
      text: "Location can be captured at signup, login, or manual refresh to verify sessions, support account safety, and improve location-aware care features.",
    },
    {
      icon: <FaLock />,
      title: "Security and account access",
      text: "Login tokens, auth provider, password status, OTP verification, role, and account status are used to keep user and counselor areas separated and protected.",
    },
  ];

  const privacyVisibility = [
    {
      title: "Visible to you",
      text: "Your dashboard shows your profile, AI chats, counselor interactions, appointments, wallet, call history, ratings prompts, and location/update controls.",
    },
    {
      title: "Shared for care",
      text: "Counselors receive only the information needed to respond to your request, manage appointments, and conduct chat/call sessions. Your anonymous identity is preferred in counselor-facing views where available.",
    },
    {
      title: "Protected changes",
      text: "Email and phone updates require OTP verification. Password and location controls are handled from Settings/Profile so you can keep account data current.",
    },
  ];

  const privacyChecklist = [
    "Use your anonymous name for counselor interactions when you do not want your real name displayed.",
    "Keep emergency contact and medical profile details accurate if you choose to fill them in.",
    "Review browser permissions for location, camera, and microphone before calls.",
    "Update location manually from Settings/Profile if the login prompt was skipped.",
    "Do not share OTPs, passwords, or sensitive account details inside chat messages.",
    "Use My Profile and Settings to update or review the data stored in your account.",
  ];

  const downloadPrivacyData = () => {
    const storedUser = localStorage.getItem("userData") || localStorage.getItem("user");
    let profile = {};
    try {
      profile = storedUser ? JSON.parse(storedUser) : {};
    } catch {
      profile = {};
    }
    const payload = {
      exportedAt: new Date().toISOString(),
      profile,
      notice:
        "This export contains locally available account data. Contact support for a complete server-side record.",
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "humaeli-privacy-data.json";
    link.click();
    URL.revokeObjectURL(url);
  };


  const renderHelpSupport = () => {
    const faqs = [
      ["How do I book an appointment?", "Open Appointments, choose a counselor and select an available date and time."],
      ["How can I cancel or reschedule?", "Open My Appointments and use the available cancel or reschedule action."],
      ["Is my medical data secure?", "Your sensitive interactions and account data use protected access and encryption."],
      ["How do I report a fraud?", "Email support with the account details and evidence. Never share your OTP or password."],
      ["How do I add funds to my Wallet?", "Open Wallet and select Add Funds to complete a secure transaction."],
    ].filter(([question, answer]) =>
      `${question} ${answer}`.toLowerCase().includes(helpSearch.trim().toLowerCase()),
    );

    return (
      <section className="ud-content-section ud-help-page">
        <header className="ud-help-page-header">
          <h2>Help & Supports</h2>
          <p>Help and support desk for you</p>
        </header>

        <div className="ud-help-page-body">
          <h1>How can we help you?</h1>
          <label className="ud-help-search">
            <FaSearch />
            <input value={helpSearch} onChange={(event) => setHelpSearch(event.target.value)} placeholder="Search help articles, guides, and FAQs..." />
          </label>

          <div className="ud-help-channel-grid">
            {[
              [<FaCommentDots />, "Live Chat", "Chat with our support team", "Usually within 2 mins", () => setChatOpen(true)],
              [<FaPhone />, "Call Support", "Talk directly", "Mon-Sat 9AM–7PM", () => { window.location.href = "tel:+18005550199"; }],
              [<FaEnvelope />, "Email Support", "Send your questions", "Within 24 hours", () => { window.location.href = "mailto:support@humaeli.com"; }],
              [<FaRobot />, "AI Assistant", "Get instant answers", "24/7 Available", () => setChatOpen(true)],
            ].map(([icon, title, text, availability, onClick]) => (
              <button type="button" key={title} onClick={onClick}>
                <span>{icon}</span><strong>{title}</strong><p>{text}</p><small>{availability}</small>
              </button>
            ))}
          </div>

          <div className="ud-help-content-grid">
            <main className="ud-help-left">
              <section className="ud-help-faq">
                <h2>Popular Questions</h2>
                {faqs.length ? faqs.map(([question, answer]) => {
                  const isOpen = openHelpQuestion === question;
                  return (
                    <article key={question}>
                      <button type="button" onClick={() => setOpenHelpQuestion(isOpen ? "" : question)}>
                        <span>{question}</span>{isOpen ? <FaChevronUp /> : <FaChevronDown />}
                      </button>
                      {isOpen && <p>{answer}</p>}
                    </article>
                  );
                }) : <p className="ud-help-no-results">No matching help articles found.</p>}
              </section>

              <section className="ud-help-report">
                <h3>Report a Problem</h3>
                <p>Encountered a bug or technical issue in the app?</p>
                <div>
                  <button type="button" onClick={() => { window.location.href = "mailto:support@humaeli.com?subject=Report%20an%20Issue"; }}>Report Issue</button>
                  <label><FaUpload /> Screenshot<input type="file" accept="image/*" /></label>
                </div>
              </section>
            </main>

            <aside className="ud-help-right">
              <section className="ud-help-emergency">
                <h3><FaExclamationTriangle /> Need Immediate Help?</h3>
                <p>If you are experiencing a medical emergency, please call your local emergency services immediately.</p>
                <button type="button" onClick={() => { window.location.href = "tel:112"; }}>Emergency Contact</button>
                <button type="button" className="outline" onClick={() => { window.location.href = "tel:9152987821"; }}>Crisis Resources</button>
              </section>

              <section className="ud-help-contact">
                <small>CONTACT INFORMATION</small>
                <p><FaEnvelope /><span>support@humaeli.com<small>Email</small></span></p>
                <p><FaPhone /><span>+1 (800) 555–0199<small>Mon–Sat, 9am–7pm EST</small></span></p>
              </section>

              <section className="ud-help-legal">
                <button type="button"><FaFileAlt /> Terms of Service <FaChevronRight /></button>
                <button type="button" onClick={() => setActive("privacy")}><FaShieldAlt /> Privacy Policy <FaChevronRight /></button>
              </section>
            </aside>
          </div>

          <footer className="ud-help-footer">
            <p>Humaeli Version 2.1.4</p><p>Last updated: Oct 24, 2023</p><button type="button" onClick={() => window.location.reload()}>Check for Updates</button>
          </footer>
        </div>
      </section>
    );
  };

  const renderPrivacyCenter = () => {
    const sections = [
      { ...privacyDataGroups[0], title: "Personal Profile" },
      { ...privacyDataGroups[1], title: "Chats & Calls" },
      { ...privacyDataGroups[2], title: "Appointments" },
      { ...privacyDataGroups[3], title: "Wallet & Transactions" },
    ];

    return (
      <section className="ud-content-section ud-privacy-page">
        <header className="ud-privacy-page-header">
          <h2>Privacy Policy</h2>
          <p>Learn how Humaeli collects, uses, and protects your personal information.</p>
        </header>

        <div className="ud-privacy-page-grid">
          <main className="ud-privacy-main">
            <section className="ud-protected-banner">
              <div className="ud-protected-heading">
                <span><FaShieldAlt /></span>
                <div><strong>Protected</strong><p>Your data is secure</p></div>
              </div>
              <div className="ud-protected-points">
                <span>⊙ End-to-end encrypted chats</span>
                <span>⊙ OTP verified account</span>
                <span>⊙ Anonymous consultation</span>
                <span>⊙ Secure wallet transactions</span>
              </div>
            </section>

            <h3 className="ud-privacy-label">DATA COLLECTION</h3>
            <div className="ud-privacy-accordions">
              {sections.map((section) => {
                const isOpen = openPrivacySection === section.title;
                return (
                  <article className={`ud-privacy-accordion ${isOpen ? "is-open" : ""}`} key={section.title}>
                    <button type="button" onClick={() => setOpenPrivacySection(isOpen ? "" : section.title)}>
                      <span className="ud-privacy-accordion-icon">{section.icon}</span>
                      <strong>{section.title}</strong>
                      {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                    {isOpen && (
                      <div className="ud-privacy-accordion-body">
                        <b>Information Collected</b>
                        <p>{section.text}</p>
                        <b>Purpose</b>
                        <p>Provide secure, continuous service history and enable appropriate counselor support.</p>
                        <div className="ud-privacy-encryption-note"><FaLock /> All interactions are encrypted and stored securely.</div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </main>

          <aside className="ud-privacy-side">
            <h3 className="ud-privacy-label">QUICK ACTIONS</h3>
            <div className="ud-privacy-quick-grid">
              <button type="button" onClick={handleProfileClick}><FaUser /><strong>Manage Profile</strong><small>Update details</small></button>
              <button type="button" onClick={handleSettingsClick}><FaLock /><strong>Security Settings</strong><small>Passwords & OTP</small></button>
              <button type="button" onClick={downloadPrivacyData}><FaDownload /><strong>Download Data</strong><small>Get your records</small></button>
              <button type="button" className="danger" onClick={handleSettingsClick}><FaTrash /><strong>Delete Account</strong><small>Permanently remove</small></button>
            </div>

            <h3 className="ud-privacy-label">YOUR PRIVACY CHECKLIST</h3>
            <div className="ud-privacy-checklist">
              {[
                "Never share OTP with anyone",
                "Enable App Lock in settings",
                "Keep emergency contact updated",
                "Review device permissions regularly",
                "Use anonymous mode",
              ].map((item, index) => (
                <div className={index === 4 ? "muted" : ""} key={item}>
                  <FaCheckCircle /> <span>{item}</span>
                </div>
              ))}
            </div>

            <section className="ud-privacy-help-card">
              <h3>Need help with privacy?</h3>
              <p>Our support team is here to answer any questions about your data security.</p>
              <button type="button" onClick={() => { window.location.href = "mailto:support@humaeli.com?subject=Privacy%20Support"; }}>Contact Support</button>
              <button type="button" className="outline" onClick={handleSettingsClick}>Privacy Settings</button>
            </section>
          </aside>
        </div>
      </section>
    );
  };

  return (
    <div className="user-dashboard">
      <LocationNoticeToast />
      <Suspense fallback={null}>
        <RatingPrompt triggerKey={active} />
        {showCallModal && (
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
        )}

        {isVideoModalOpen && (
          <VideoCallModal
            isOpen={isVideoModalOpen}
            onClose={() => setIsVideoModalOpen(false)}
            callData={selectedCall}
            callMode={selectedCall?.callType || selectedCall?.type || callType}
            currentUser={{ id: userId, role: "user" }}
            onEndCall={handleEndCall}
          />
        )}
      </Suspense>

      {isMobile && (
        <div className="ud-mobile-header">
          <div className="ud-mobile-header-left" />
          <div className="ud-mobile-header-right">
            <NotificationCenter />
            <button
              type="button"
              className="ud-mobile-profile-btn"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              aria-label="Open profile menu"
              aria-expanded={showProfileMenu}
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
                    <span>{t('my_profile')}</span>
                  </button>
                  <button
                    className="ud-dropdown-item"
                    onClick={handleSettingsClick}
                  >
                    <FaCog className="ud-dropdown-icon" />
                    <span>{t('settings')}</span>
                  </button>
                  <button
                    className="ud-dropdown-item ud-logout-item"
                    onClick={handleLogoutClick}
                  >
                    <FaSignOutAlt className="ud-dropdown-icon" />
                    <span>{t('logout')}</span>
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
                    <h3 className="ud-sidebar-name" title={userData.name}>
                      {userData.name || t('welcome')}
                    </h3>
                    {userData.email && (
                      <p className="ud-sidebar-meta" title={userData.email}>
                        <FaEnvelope className="ud-sidebar-meta-icon" />
                        <span>{userData.email}</span>
                      </p>
                    )}
                    {userData.phone && (
                      <p className="ud-sidebar-meta" title={userData.phone}>
                        <FaPhone className="ud-sidebar-meta-icon" />
                        <span>{userData.phone}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="ud-sidebar-menu">
                {allMenuItems.map((item) => (
                  <React.Fragment key={item.id}>
                    {item.id === "settings" && <hr className="ud-sidebar-separator" />}
                    <button
                      onClick={() => handleMenuItemClick(item.id)}
                      className={`ud-sidebar-item ${active === item.id ? "ud-active" : ""}`}
                    >
                      <span className="ud-sidebar-icon">{item.icon}</span>
                      <span className="ud-sidebar-text">{item.label}</span>
                    </button>
                  </React.Fragment>
                ))}
              </div>
              <div className="ud-sidebar-actions">
                <LanguageSelector lang={lang} setLang={setLang} t={t} />
                <button
                  className="ud-sidebar-item ud-profile-action"
                  onClick={handleProfileClick}
                >
                  <span className="ud-sidebar-icon">
                    <FaUser />
                  </span>
                  <span className="ud-sidebar-text">{t('my_profile')}</span>
                </button>
                <button
                  className="ud-sidebar-item ud-logout"
                  onClick={handleLogoutClick}
                >
                  <span className="ud-sidebar-icon">
                    <FaSignOutAlt />
                  </span>
                  <span className="ud-sidebar-text">{t('logout')}</span>
                </button>
              </div>
            </div>
          </aside>
        )}

        <div className={`ud-dashboard-content ${isMobile ? "ud-mobile" : ""}`}>
          <div className="ud-content-scrollable">
            <Suspense fallback={<DashboardPanelLoader />}>
              {active === "Chat" && (
                <div className={`ud-chat-workspace ${selectedConversation ? "has-conversation" : ""}`}>
                  <div className="ud-chat-list-pane">
                    <ChatInterface
                      setActiveTab={setActive}
                      onOpenConversation={setSelectedConversation}
                      selectedChatId={selectedConversation?.chatId}
                    />
                  </div>
                  {selectedConversation && (
                    <div className="ud-conversation-pane">
                      <ChatBox
                        key={selectedConversation.chatId || selectedConversation.counselor?.id}
                        embedded
                        conversation={selectedConversation}
                        onClose={() => setSelectedConversation(null)}
                      />
                    </div>
                  )}
                </div>
              )}
              {active === "Live Chat" && (
                <CounselorRequestChat
                  initialSearch={targetCounselor}
                  onOpenConversation={handleOpenCounselorConversation}
                />
              )}
              {active === "MyAppointments" && <MyAppointments />}
              {active === "Notifications" && <NotificationsPage />}
              {active === "Wallet" && <WalletDashboard userData={userData} />}
              {active === "Video" && (
                <CallHistory currentUser={{ id: userId, role: "user" }} />
              )}
              {active === "profile" && <PatientProfile />}
              {active === "settings" && (
                <AccountSettings role="user" onOpenProfile={handleProfileClick} />
              )}
              {active === "help" && <div key={`help-${lang}`}>{renderHelpSupport()}</div>}
              {active === "privacy" && <div key={`privacy-${lang}`}>{renderPrivacyCenter()}</div>}
            </Suspense>
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
        <AiChatPopup
          messages={chatMessages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          sendMessage={sendMessage}
          handleKeyPress={handleKeyPress}
          isLoading={isLoading}
          onClose={() => setChatOpen(false)}
          onReset={async () => {
            if (isLoading) return;
            const ok = window.confirm(
              `${t('start_conversation')} ${t('no_messages')}?`,
            );
            if (!ok) return;
            setIsLoading(true);
            try {
              await axiosInstance.delete(
                `${API_BASE_URL}/api/ai-chat/my-history`,
              );
              setChatMessages([]);
              setAiSessionId(null);
              // The chatOpen useEffect will fire kickoff again because
              // chatMessages is now empty.
            } catch (err) {
              console.warn("[AI-CHAT] reset failed:", err.message);
            } finally {
              setIsLoading(false);
            }
          }}
          chatBodyRef={chatBodyRef}
          handleCounselorClick={handleAIContactClick}
          sendQuickReply={sendQuickReply}
          sendChat={sendChat}
          selectedLang={selectedLang}
          userName={userData?.name}
        />
      )}

      {isMobile && (
        <nav className="ud-mobile-bottom-nav" aria-label="Dashboard navigation">
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
            <span className="ud-nav-label">{t('all')}</span>
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
                  <div style={{ padding: '8px 12px' }}>
                    <LanguageSelector lang={lang} setLang={setLang} t={t} />
                  </div>
                  <button
                    className="ud-more-action-btn ud-logout-btn"
                    onClick={() => {
                      vibrate(30);
                      setShowMoreModal(false);
                      setShowLogoutConfirm(true);
                    }}
                  >
                    <FaSignOutAlt className="ud-action-icon" />
                    <span>{t('logout')}</span>
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
