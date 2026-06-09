// SMSInput.jsx - Fully Responsive Chat Interface with React Native Profile Logic
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./SMSInput.css";
import { API_BASE_URL } from "../../../../axiosConfig";
import socketService from "../../../../services/socketService";
import { useCounselorTranslation } from "../../../../i18n/LanguageContext";
import VideoCallModal from "../../../UserDashboard/Tab/CallModal/VideoCallModal";
import VoiceCallModal from "../../../UserDashboard/Tab/CallModal/VoiceCallModal";
import useRingtone from "../../../../hooks/useRingtone";
import {
  getAnonymousParticipantId,
  getAnonymousUserAvatar,
  getAnonymousUserDisplay,
} from "../../../../utils/anonymousUser";

const { width: screenWidth } = { width: window.innerWidth };

const AVATAR_COLORS = [
  '#3b82f6', '#8b5cf6', '#DC2626', '#F59E0B',
  '#10B981', '#0369A1', '#06B6D4', '#1E40AF',
];

const getAvatarColor = (name) => {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// Resolves a profilePhoto value (string, Cloudinary object, or user object) to an absolute URL or null
const resolvePhotoUrl = (photo) => {
  if (!photo) return null;
  // If it's a user/otherParty object, try all possible photo field names
  if (typeof photo === 'object' && !photo.secure_url && !photo.url && !photo.public_id) {
    const candidate =
      photo.profilePhoto ||
      photo.avatarUrl ||
      photo.avatar ||
      photo.profilePic ||
      photo.image ||
      photo.picture ||
      null;
    if (!candidate) return null;
    return resolvePhotoUrl(candidate);
  }
  const raw = (typeof photo === 'object')
    ? (photo.secure_url || photo.url || null)
    : photo;
  if (!raw || typeof raw !== 'string') return null;
  if (raw.includes('ui-avatars.com') || raw.includes('dicebear') || raw.includes('gravatar.com')) return null;
  if (raw.startsWith('http')) return raw;
  if (raw.startsWith('/')) return `${API_BASE_URL}${raw}`;
  return null;
};

// Avatar component matching React Native exactly
const UserPhotoAvatar = ({ photo, name, gender, size = 30, style }) => {
  const [failed, setFailed] = useState(false);
  const url = resolvePhotoUrl(photo);
  
  if (url && !failed) {
    return (
      <img
        src={url}
        alt={name || "Avatar"}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          objectFit: 'cover',
          ...style
        }}
        onError={() => setFailed(true)}
      />
    );
  }
  const emoji = gender === 'male' ? '👨' : gender === 'female' ? '👩' : '👤';
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: getAvatarColor(name),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        ...style
      }}
    >
      <span style={{ fontSize: size * 0.5, lineHeight: `${size * 0.6}px` }}>{emoji}</span>
    </div>
  );
};

// Incoming Call Modal Component - Serenity Design (matching React Native)
const IncomingCallModal = ({
  isOpen,
  onClose,
  callType,
  callerName,
  callerAvatar,
  callData,
  onJoinCall,
  onRejectCall,
}) => {
  const [isJoining, setIsJoining] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const { stopRinging } = useRingtone();

  const handleJoin = async () => {
    if (isJoining) return;
    setIsJoining(true);
    stopRinging();
    onClose();
    if (onJoinCall && callData) {
      try {
        await onJoinCall(callData.callId);
      } catch (error) {
        console.error("Error joining call:", error);
      } finally {
        setIsJoining(false);
      }
    } else {
      setIsJoining(false);
    }
  };

  const handleReject = async () => {
    if (isRejecting) return;
    setIsRejecting(true);
    stopRinging();
    onClose();
    if (onRejectCall && callData) {
      try {
        await onRejectCall(callData.callId);
      } catch (error) {
        console.error("Error rejecting call:", error);
      } finally {
        setIsRejecting(false);
      }
    } else {
      setIsRejecting(false);
    }
  };

  if (!isOpen) return null;

  const displayName = callerName || "Anonymous User";
  const displayInitial = (displayName?.charAt(0) || "A").toUpperCase();

  return (
    <div className="incoming-call-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15,23,42,0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
    }}>
      <div className={`incoming-call-modal ${callType === "video" ? "video-call-modal" : "voice-call-modal"}`} style={{
        maxWidth: 380,
        width: '88%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
        borderTopWidth: 3,
        borderTopColor: callType === "video" ? '#2563EB' : '#0D9488',
      }}>
        <div className="incoming-call-content" style={{ padding: 24, alignItems: 'center', textAlign: 'center' }}>
          <div className="incoming-caller-info" style={{ alignItems: 'center', marginBottom: 24 }}>
            <div className="incoming-caller-avatar" style={{
              width: 90,
              height: 90,
              borderRadius: 45,
              backgroundColor: getAvatarColor(displayName),
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            }}>
              <span style={{ fontSize: 38, fontWeight: 800, color: '#FFFFFF' }}>{displayInitial}</span>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{displayName}</h3>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 8, fontWeight: 500 }}>
              {callType === "video" ? "📹 Video Call" : "📞 Voice Call"}
            </p>
            <p style={{ fontSize: 12, color: '#2563EB', fontWeight: 500 }}>
              {callData?.requestMessage || `Incoming ${callType} call...`}
            </p>
          </div>

          <div className="incoming-call-controls" style={{ display: 'flex', gap: 12, width: '100%' }}>
            <button
              className="reject-btn"
              onClick={handleReject}
              disabled={isRejecting}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 28,
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {isRejecting ? "..." : "Decline"}
            </button>
            <button
              className="accept-btn"
              onClick={handleJoin}
              disabled={isJoining}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 28,
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {isJoining ? "..." : "Accept"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SMSInput = () => {
  const { t } = useCounselorTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const chatSocketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [remoteIsTyping, setRemoteIsTyping] = useState(false);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const isInitialLoadRef = useRef(true);

  // Call modal states
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [isInitiatingCall, setIsInitiatingCall] = useState(false);
  const [callError, setCallError] = useState(null);

  // Receiving Call States
  const [showIncomingModal, setShowIncomingModal] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState({
    name: "",
    avatar: "👤",
    callId: "",
    roomId: "",
    callType: "video",
  });
  const { startRinging, stopRinging } = useRingtone();

  // Message states
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [chatStatus, setChatStatus] = useState(null);
  const [pendingAttachment, setPendingAttachment] = useState(null);

  const handleSessionExpired = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/role-selector", {
      replace: true,
      state: {
        reason: "session-expired",
        message: "You were logged out because your account was used on another device.",
      },
    });
  };

  const focusMessageInput = () => {
    const input = messageInputRef.current;
    if (!input) return;
    requestAnimationFrame(() => input.focus({ preventScroll: true }));
    setTimeout(() => messageInputRef.current?.focus({ preventScroll: true }), 50);
  };

  // Get selected user from navigation state
  const selectedUser = location.state?.selectedUser;
  const chatId = location.state?.chatId;
  const [remotePresence, setRemotePresence] = useState({
    isOnline: Boolean(selectedUser?.isOnline || selectedUser?.online),
    lastSeen: selectedUser?.lastSeen || null,
  });

  const getCurrentCounselor = () => {
    let counselorData = null;
    const storedCounselor = localStorage.getItem("counselor");
    if (storedCounselor) {
      try {
        counselorData = JSON.parse(storedCounselor);
      } catch (e) {}
    }
    if (!counselorData) {
      const sessionCounselor = sessionStorage.getItem("counselor");
      if (sessionCounselor) {
        try {
          counselorData = JSON.parse(sessionCounselor);
        } catch (e) {}
      }
    }
    if (!counselorData) {
      const userData = localStorage.getItem("user") || localStorage.getItem("userData");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.role === "counselor" || user.role === "counsellor" || user.userType === "counselor") {
            counselorData = user;
          }
        } catch (e) {}
      }
    }
    return counselorData;
  };

  const getCounselorId = () => {
    if (currentCounselor) {
      if (currentCounselor._id) return currentCounselor._id;
      if (currentCounselor.id) return currentCounselor.id;
      if (currentCounselor.counselorId) return currentCounselor.counselorId;
    }
    const storedId = localStorage.getItem("counselorId") || localStorage.getItem("counsellorId");
    if (storedId) return storedId;
    const sessionId = sessionStorage.getItem("counselorId") || sessionStorage.getItem("counsellorId");
    if (sessionId) return sessionId;
    return "69c679b6e0e8f0800ff08fd1";
  };

  const currentCounselor = getCurrentCounselor();
  const COUNSELOR_ID = getCounselorId();
  const COUNSELOR_NAME = currentCounselor?.name || currentCounselor?.fullName || "Counselor";

  const normalizeObjectId = (value) => {
    if (!value) return null;
    if (typeof value === "object") {
      return (
        normalizeObjectId(value._id) ||
        normalizeObjectId(value.id) ||
        normalizeObjectId(value.userId) ||
        normalizeObjectId(value.$oid) ||
        null
      );
    }
    const asString = String(value).trim();
    if (!asString) return null;
    if (/^[a-f\d]{24}$/i.test(asString)) return asString;
    const embeddedMatch = asString.match(/[a-f\d]{24}/i);
    return embeddedMatch ? embeddedMatch[0] : null;
  };

  const getParticipantIdFromChatId = () => {
    const sourceChatId = chatId || selectedUser?.chatId || "";
    const chatIdText = String(sourceChatId || "");
    if (!chatIdText) return null;
    const matchedIds = chatIdText.match(/[a-f\d]{24}/gi) || [];
    if (!matchedIds.length) return null;
    const normalizedCounselorId = normalizeObjectId(COUNSELOR_ID);
    const receiverId = matchedIds.find(
      (id) => !normalizedCounselorId || String(id).toLowerCase() !== String(normalizedCounselorId).toLowerCase()
    );
    return receiverId || null;
  };

  const getSelectedUserId = () => {
    if (!selectedUser) return null;
    return (
      selectedUser?.receiverId ||
      selectedUser?._id ||
      selectedUser?.id ||
      selectedUser?.userId ||
      selectedUser?.user?._id ||
      selectedUser?.user?.id ||
      selectedUser?.patient?._id ||
      selectedUser?.patient?.id ||
      getParticipantIdFromChatId() ||
      getAnonymousParticipantId(selectedUser)
    );
  };

  const getUserDetails = () => {
    const id = getSelectedUserId();
    const anonymousUser = getAnonymousUserDisplay(selectedUser);
    return {
      id,
      name: anonymousUser.name,
      gender: anonymousUser.gender,
      profilePhoto: resolvePhotoUrl(selectedUser),
      avatar: anonymousUser.avatar,
      avatarUrl: anonymousUser.avatarUrl,
    };
  };

  const userDetails = getUserDetails();
  const USER_ID = userDetails.id;
  const USER_NAME = userDetails.name;

  const resolveOnlineStatus = (person) => {
    const explicitOnline = person?.isOnline ?? person?.online;
    if (typeof explicitOnline === 'boolean') return explicitOnline;
    if (typeof explicitOnline === 'string') return ['online', 'true', '1', 'yes'].includes(String(explicitOnline).toLowerCase());
    return false;
  };

  const getAnonymousUserAvatarFn = (gender) => {
    return getAnonymousUserAvatar({ gender });
  };

  const getChatIdForAPI = () => {
    if (chatId) return chatId;
    if (selectedUser && USER_ID && COUNSELOR_ID) {
      return `chat_${USER_ID}_${COUNSELOR_ID}`;
    }
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const fetchMessagesFromAPI = async () => {
    if (!selectedUser) return;
    try {
      const apiChatId = getChatIdForAPI();
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      setIsLoadingMessages(true);
      setError(null);
      const response = await axios.get(
        `${API_BASE_URL}/api/chat/chat/${apiChatId}/messages`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      if (response.data && response.data.messages) {
        if (response.data.chatStatus) setChatStatus(response.data.chatStatus);
        const transformedMessages = response.data.messages.map((msg, index) => ({
          id: msg.id || msg._id || msg.messageId || `fetched_${index}`,
          messageId: msg.messageId,
          text: msg.content,
          sender: msg.senderRole === "counsellor" ? "me" : "user",
          senderRole: msg.senderRole,
          time: new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          fullTime: msg.createdAt,
          contentType: msg.contentType,
          attachmentType: msg.attachmentType || msg.contentType || null,
          attachmentUrl: msg.attachmentUrl || null,
          attachmentName: msg.attachmentName || null,
          isRead: msg.isRead,
          status: "sent",
        }));
        setMessages(transformedMessages);
        saveMessagesToLocalStorage(transformedMessages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      if (error?.response?.status === 401) {
        handleSessionExpired();
        return;
      }
      loadMessagesFromLocalStorage();
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const saveMessagesToLocalStorage = (messagesToSave) => {
    try {
      const savedChats = JSON.parse(localStorage.getItem("smsChats") || "[]");
      const chatIdToSave = getChatIdForAPI();
      const existingChatIndex = savedChats.findIndex((chat) => chat.chatId === chatIdToSave);
      const chatData = {
        chatId: chatIdToSave,
        userId: USER_ID,
        userName: USER_NAME,
        messages: messagesToSave,
        chatStatus,
        lastUpdated: new Date().toISOString(),
      };
      if (existingChatIndex >= 0) savedChats[existingChatIndex] = chatData;
      else savedChats.push(chatData);
      localStorage.setItem("smsChats", JSON.stringify(savedChats));
    } catch (error) {}
  };

  const loadMessagesFromLocalStorage = () => {
    try {
      const savedChats = JSON.parse(localStorage.getItem("smsChats") || "[]");
      const chatIdToLoad = getChatIdForAPI();
      const savedChat = savedChats.find((chat) => chat.chatId === chatIdToLoad);
      if (savedChat && savedChat.messages) setMessages(savedChat.messages);
    } catch (error) {}
  };

  const getAttachmentUrl = (item) => {
    const rawUrl = item?.attachmentUrl || item?.attachment || '';
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    if (/^(https?:|file:|content:|data:)/i.test(rawUrl)) return rawUrl;
    if (rawUrl.startsWith('/')) return `${API_BASE_URL}${rawUrl}`;
    return `${API_BASE_URL}/${rawUrl}`;
  };

  const sendMessageToAPI = async ({ messageContent = "", file = null }) => {
    try {
      const apiChatId = getChatIdForAPI();
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      let response;
      
      if (file) {
        const formData = new FormData();
        if (messageContent.trim()) formData.append("content", messageContent.trim());
        formData.append("attachment", file);
        response = await axios.post(
          `${API_BASE_URL}/api/chat/chat/${apiChatId}/message`,
          formData,
          { headers: { Authorization: token ? `Bearer ${token}` : "" } }
        );
      } else {
        response = await axios.post(
          `${API_BASE_URL}/api/chat/chat/${apiChatId}/message`,
          { content: messageContent },
          { headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" } }
        );
      }
      if (response.data && response.data.success) return response.data.message;
      else throw new Error("Invalid API response");
    } catch (error) {
      console.error("Error sending message:", error);
      if (error?.response?.status === 401) {
        handleSessionExpired();
      }
      throw error;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((message.trim() === "" && !pendingAttachment) || !selectedUser || isSending) return;
    const messageText = message.trim();
    const attachmentToSend = pendingAttachment;
    
    const tempMessage = {
      id: `temp_${Date.now()}`,
      text: messageText || `📎 ${attachmentToSend?.name || "Attachment"}`,
      sender: "me",
      senderRole: "counsellor",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      createdAt: new Date().toISOString(),
      status: "sending",
      isTemporary: true,
      attachmentName: attachmentToSend?.name || null,
      attachmentUrl: attachmentToSend?.uri || null,
      attachmentType: attachmentToSend?.type || null,
    };
    
    setMessages((prev) => [...prev, tempMessage]);
    setMessage("");
    setPendingAttachment(null);
    focusMessageInput();
    setIsSending(true);
    setError(null);
    
    try {
      const sentMsg = await sendMessageToAPI({ messageContent: messageText, file: attachmentToSend });
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => !m.isTemporary);
        if (!sentMsg) return withoutTemp;
        return [
          ...withoutTemp,
          {
            id: sentMsg.id || sentMsg._id,
            messageId: sentMsg.messageId,
            text: sentMsg.content,
            sender: "me",
            senderRole: "counsellor",
            time: new Date(sentMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            fullTime: sentMsg.createdAt,
            contentType: sentMsg.contentType,
            attachmentType: sentMsg.attachmentType || sentMsg.contentType || null,
            attachmentUrl: sentMsg.attachmentUrl || null,
            attachmentName: sentMsg.attachmentName || null,
            isRead: sentMsg.isRead,
            status: "sent",
          },
        ];
      });
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempMessage.id ? { ...msg, status: "error" } : msg))
      );
      setError("Failed to send message");
      setTimeout(() => setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id)), 3000);
    } finally {
      setIsSending(false);
      focusMessageInput();
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !isSending) {
      e.preventDefault();
      handleSendMessage(e);
      focusMessageInput();
    }
  };

  useEffect(() => {
    if (!isSending) focusMessageInput();
  }, [isSending]);

  const handleFileAttachClick = () => {
    if (isSending) return;
    fileInputRef.current?.click();
  };

  const handlePhotoCaptureClick = () => {
    if (isSending) return;
    cameraInputRef.current?.click();
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file || isSending || !selectedUser) return;
    
    setPendingAttachment({
      uri: URL.createObjectURL(file),
      name: file.name,
      type: file.type,
      size: file.size,
    });
    e.target.value = "";
  };

  const initiateVideoCall = async () => {
    if (!selectedUser) {
      setCallError("No user selected for call");
      return;
    }
    if (!COUNSELOR_ID) {
      setCallError("Please login again to make calls");
      return;
    }
    const userId = normalizeObjectId(getSelectedUserId());
    if (!userId) {
      setCallError("Invalid receiver ID format for this user");
      return;
    }
    setIsInitiatingCall(true);
    setCallError(null);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      if (!token) throw new Error("Authentication token not found");
      const authHeader = String(token).startsWith("Bearer ") ? String(token) : `Bearer ${token}`;
      const requestBody = {
        initiatorId: String(COUNSELOR_ID),
        receiverId: String(userId),
        receiverType: "user",
        callType: "video",
      };

      let response;
      try {
        response = await axios.post(
          `${API_BASE_URL}/api/video/calls/initiate`,
          { ...requestBody, initiatorType: "counsellor" },
          { headers: { "Content-Type": "application/json", Authorization: authHeader } }
        );
      } catch (firstError) {
        if (firstError?.response?.status !== 400) throw firstError;
        response = await axios.post(
          `${API_BASE_URL}/api/video/calls/initiate`,
          { ...requestBody, initiatorType: "counselor" },
          { headers: { "Content-Type": "application/json", Authorization: authHeader } }
        );
      }
      if (response.data && response.data.success) {
        const callData = {
          id: response.data.callData?.id,
          callId: response.data.callId || response.data.callData?._id || response.data.callData?.id,
          roomId: response.data.roomId || response.data.callData?.roomId,
          name: USER_NAME,
          type: "video",
          callType: "video",
          profilePic: getAnonymousUserAvatarFn(userDetails.gender),
          phoneNumber: "Not available",
          status: response.data.status || "ringing",
          date: "Today",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          currentUserId: String(COUNSELOR_ID),
          currentUserType: "counsellor",
          initiator: response.data.callData?.initiator,
          receiver: response.data.callData?.receiver,
          apiCallData: response.data.callData,
          isIncoming: false,
        };
        setSelectedCall(callData);
        setIsVideoModalOpen(true);
      } else {
        throw new Error(response.data?.message || "Failed to initiate video call");
      }
    } catch (error) {
      console.error("Error initiating video call:", error?.response?.data || error);
      setCallError(error?.response?.data?.message || error?.response?.data?.error || error.message || "Failed to initiate video call");
    } finally {
      setIsInitiatingCall(false);
    }
  };

  const initiateVoiceCall = async () => {
    if (!selectedUser) {
      setCallError("No user selected for call");
      return;
    }
    if (!COUNSELOR_ID) {
      setCallError("Please login again to make calls");
      return;
    }
    const userId = normalizeObjectId(getSelectedUserId());
    if (!userId) {
      setCallError("Invalid receiver ID format for this user");
      return;
    }
    setIsInitiatingCall(true);
    setCallError(null);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      if (!token) throw new Error("Authentication token not found");
      const authHeader = String(token).startsWith("Bearer ") ? String(token) : `Bearer ${token}`;
      const requestBody = {
        initiatorId: String(COUNSELOR_ID),
        receiverId: String(userId),
        receiverType: "user",
        callType: "audio",
      };

      let response;
      try {
        response = await axios.post(
          `${API_BASE_URL}/api/video/calls/initiate`,
          { ...requestBody, initiatorType: "counsellor" },
          { headers: { "Content-Type": "application/json", Authorization: authHeader } }
        );
      } catch (firstError) {
        if (firstError?.response?.status !== 400) throw firstError;
        response = await axios.post(
          `${API_BASE_URL}/api/video/calls/initiate`,
          { ...requestBody, initiatorType: "counselor" },
          { headers: { "Content-Type": "application/json", Authorization: authHeader } }
        );
      }
      if (response.data && response.data.success) {
        const callData = {
          id: response.data.callData?.id,
          callId: response.data.callId || response.data.callData?._id || response.data.callData?.id,
          roomId: response.data.roomId || response.data.callData?.roomId,
          name: USER_NAME,
          type: "voice",
          callType: "audio",
          profilePic: getAnonymousUserAvatarFn(userDetails.gender),
          phoneNumber: "Not available",
          status: response.data.status || "ringing",
          date: "Today",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          currentUserId: String(COUNSELOR_ID),
          currentUserType: "counsellor",
          initiator: response.data.callData?.initiator,
          receiver: response.data.callData?.receiver,
          apiCallData: response.data.callData,
          isIncoming: false,
        };
        setSelectedCall(callData);
        setIsVoiceModalOpen(true);
      } else {
        throw new Error(response.data?.message || "Failed to initiate voice call");
      }
    } catch (error) {
      console.error("Error initiating voice call:", error?.response?.data || error);
      setCallError(error?.response?.data?.message || error?.response?.data?.error || error.message || "Failed to initiate voice call");
    } finally {
      setIsInitiatingCall(false);
    }
  };

  const handleJoinIncomingCall = async (callId) => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      if (!COUNSELOR_ID) throw new Error("Counselor ID not found");
      const response = await axios.put(
        `${API_BASE_URL}/api/video/calls/${callId}/accept`,
        { acceptorId: COUNSELOR_ID, acceptorType: "counsellor" },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      if (response.data && response.data.success) {
        let detailedCall = null;
        try {
          const detailsResponse = await axios.get(`${API_BASE_URL}/api/video/calls/${callId}/details`, {
            params: { userId: COUNSELOR_ID, userType: "counsellor" },
            headers: { Authorization: `Bearer ${token}` },
          });
          detailedCall = detailsResponse.data?.call || null;
        } catch (detailsError) {
          console.warn("Could not fetch call details:", detailsError);
        }
        const incomingType = String(incomingCallData.callType || detailedCall?.type || "video").toLowerCase();
        const modalType = incomingType === "audio" ? "voice" : incomingType;
        const remoteParticipant = detailedCall
          ? String(detailedCall.initiator?.id) === String(COUNSELOR_ID) ? detailedCall.receiver : detailedCall.initiator
          : null;
        const anonymousName = remoteParticipant?.anonymous || remoteParticipant?.anonName || remoteParticipant?.anonymousName || incomingCallData.name || "Anonymous User";
        const callDataForModal = {
          id: detailedCall?.id || callId,
          callId: callId,
          roomId: response.data.roomId || detailedCall?.roomId || incomingCallData.roomId,
          name: anonymousName,
          type: modalType,
          callType: modalType,
          profilePic: null,
          phoneNumber: remoteParticipant?.phoneNumber || "",
          status: response.data.status || "active",
          date: "Today",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          apiCallData: detailedCall,
          isIncoming: true,
          currentUserType: "counsellor",
        };
        if (modalType === "video") {
          setSelectedCall(callDataForModal);
          setIsVideoModalOpen(true);
        } else {
          setSelectedCall(callDataForModal);
          setIsVoiceModalOpen(true);
        }
        return { success: true, data: response.data };
      }
      throw new Error(response.data?.message || "Failed to join call");
    } catch (error) {
      console.error("Error joining call:", error);
      throw error;
    }
  };

  const handleRejectIncomingCall = async (callId) => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      await axios.put(`${API_BASE_URL}/api/video/calls/${callId}/reject`, {
        userId: COUNSELOR_ID,
        reason: "declined",
      }, { headers: { Authorization: `Bearer ${token}` } });
      return true;
    } catch (error) {
      console.error("Error rejecting call:", error);
      return false;
    }
  };

  const handleEndIncomingCall = async (callId) => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      await axios.put(`${API_BASE_URL}/api/video/calls/${callId}/end`, {
        userId: COUNSELOR_ID,
        endedBy: "counsellor",
      }, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
      return true;
    } catch (error) {
      if (error?.response?.status === 404) return true;
      console.error("Error ending call:", error);
      return false;
    }
  };

  // Poll for incoming calls
  useEffect(() => {
    let isMounted = true;
    let intervalId = null;

    const fetchIncomingCalls = async () => {
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
        if (!COUNSELOR_ID || !token || showIncomingModal || isVideoModalOpen || isVoiceModalOpen) return;
        const response = await axios.get(`${API_BASE_URL}/api/video/calls/pending/${COUNSELOR_ID}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!isMounted) return;
        const callsList = response.data.pendingRequests || [];
        if (response.data.success && callsList.length > 0) {
          const waitingCall = callsList[0];
          const fromData = waitingCall.from || {};
          const displayName = fromData.anonymous || fromData.anonName || fromData.anonymousName || "Anonymous User";
          setIncomingCallData({
            callId: waitingCall.callId,
            roomId: waitingCall.roomId,
            name: displayName,
            avatar: "👤",
            callType: waitingCall.callType || "video",
            requestMessage: waitingCall.requestMessage || `Incoming ${waitingCall.callType || "video"} call...`,
            requestedAt: waitingCall.requestedAt,
          });
          setShowIncomingModal(true);
        }
      } catch (error) {
        const status = error?.response?.status;
        if (status === 401) {
          if (intervalId) clearInterval(intervalId);
          intervalId = null;
          return;
        }
        console.error("Error polling for calls:", error);
      }
    };

    intervalId = setInterval(fetchIncomingCalls, 5000);
    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [showIncomingModal, COUNSELOR_ID, isVideoModalOpen, isVoiceModalOpen]);

  useEffect(() => {
    if (showIncomingModal && !isVideoModalOpen && !isVoiceModalOpen) {
      startRinging(true);
    } else {
      stopRinging();
    }
    return () => stopRinging();
  }, [showIncomingModal, isVideoModalOpen, isVoiceModalOpen, startRinging, stopRinging]);

  const handleCloseModal = () => {
    setIsVideoModalOpen(false);
    setIsVoiceModalOpen(false);
    setSelectedCall(null);
    setCallError(null);
  };
  
  const handleBack = () => navigate("/counselor-dashboard", { state: { selectedTab: "messages" } });

  useEffect(() => {
    if (selectedUser && COUNSELOR_ID) fetchMessagesFromAPI();
  }, [selectedUser, chatId, COUNSELOR_ID]);

  useEffect(() => {
    if (callError) {
      const timer = setTimeout(() => setCallError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [callError]);

  // Socket connection
  useEffect(() => {
    const setupSocket = async () => {
      const apiChatId = getChatIdForAPI();
      if (!apiChatId || !selectedUser || !COUNSELOR_ID) return;
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      if (!token) return;

      const unsubscribers = [];
      try {
        const socket = await socketService.connect();
        chatSocketRef.current = socket;

        const onConnect = () => {
          console.log('Chat socket connected (shared)');
          socket.emit('join-chat', { chatId: apiChatId });
        };

        unsubscribers.push(socketService.on('connect', onConnect));
        unsubscribers.push(socketService.on('disconnect', () => {}));

        unsubscribers.push(socketService.on('presence-update', ({ userId, isOnline, lastSeen }) => {
          const selectedUserId = normalizeObjectId(getSelectedUserId());
          if (!selectedUserId || String(userId) !== String(selectedUserId)) return;
          setRemotePresence({ isOnline: !!isOnline, lastSeen: lastSeen || null });
        }));

        unsubscribers.push(socketService.on('new-message', (messageData) => {
          const incomingId = messageData.id || messageData._id || messageData.messageId;
          const isOwnMessage = messageData.senderRole === 'counsellor' && String(messageData.senderId) === String(COUNSELOR_ID);

          setMessages(prev => {
            const alreadyExists = prev.some(msg => 
              (msg.messageId && messageData.messageId && msg.messageId === messageData.messageId) || 
              (msg.id && incomingId && !String(msg.id).startsWith('temp_') && msg.id === incomingId)
            );
            if (alreadyExists) return prev;
            if (isOwnMessage) {
              const tempIndex = prev.findIndex(msg => msg.isTemporary);
              if (tempIndex !== -1) {
                const next = [...prev];
                next[tempIndex] = {
                  id: incomingId,
                  messageId: messageData.messageId,
                  text: messageData.content,
                  sender: 'me',
                  senderRole: 'counsellor',
                  time: new Date(messageData.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  fullTime: messageData.createdAt,
                  contentType: messageData.contentType,
                  attachmentType: messageData.attachmentType || messageData.contentType || null,
                  attachmentUrl: messageData.attachmentUrl || null,
                  attachmentName: messageData.attachmentName || null,
                  isRead: messageData.isRead,
                  status: 'sent',
                };
                return next;
              }
            }
            return [...prev, {
              id: incomingId,
              messageId: messageData.messageId,
              text: messageData.content,
              sender: isOwnMessage ? 'me' : 'user',
              senderRole: messageData.senderRole,
              time: new Date(messageData.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              fullTime: messageData.createdAt,
              contentType: messageData.contentType,
              attachmentType: messageData.attachmentType || messageData.contentType || null,
              attachmentUrl: messageData.attachmentUrl || null,
              attachmentName: messageData.attachmentName || null,
              isRead: messageData.isRead,
              status: 'sent',
            }];
          });
        }));

        unsubscribers.push(socketService.on('user-typing', ({ userRole, isTyping: typing }) => {
          if (userRole === 'user') setRemoteIsTyping(typing);
        }));

        unsubscribers.push(socketService.on('messages-read', () => {
          setMessages((prev) => prev.map((msg) => (msg.sender === 'me' ? { ...msg, isRead: true } : msg)));
        }));

        unsubscribers.push(socketService.on('connect_error', (error) => {
          console.error('Counselor chat shared socket connect error:', error?.message || error);
        }));

        chatSocketRef.current._unsubscribers = unsubscribers;
      } catch (err) {
        console.error('Failed to setup shared chat socket:', err);
      }
    };

    setupSocket();

    return () => {
      try {
        const unsub = chatSocketRef.current?._unsubscribers || [];
        unsub.forEach(fn => { try { fn(); } catch {} });
      } catch (e) {}
      chatSocketRef.current = null;
    };
  }, [chatId, selectedUser, COUNSELOR_ID, USER_ID]);

  useEffect(() => {
    if (!selectedUser || !COUNSELOR_ID) return;
    const intervalId = setInterval(() => {
      fetchMessagesFromAPI();
    }, 45000);
    return () => clearInterval(intervalId);
  }, [selectedUser, COUNSELOR_ID]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldScrollToBottom(isNearBottom);
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const scrollToBottom = useCallback((behavior = "smooth", force = false) => {
    if (messagesEndRef.current && (shouldScrollToBottom || force)) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  }, [shouldScrollToBottom]);

  useEffect(() => {
    if (messages.length === 0) return;
    if (isInitialLoadRef.current) {
      const timer = setTimeout(() => {
        scrollToBottom("auto", true);
        isInitialLoadRef.current = false;
      }, 50);
      return () => clearTimeout(timer);
    } else if (shouldScrollToBottom) {
      scrollToBottom("smooth");
    }
  }, [messages, scrollToBottom, shouldScrollToBottom]);

  const renderMessageStatus = (message) => {
    if (message.sender !== "me") return null;
    switch (message.status) {
      case "sending":
        return <span className="msg-status sending">⌛</span>;
      case "error":
        return <span className="msg-status error">⚠️</span>;
      default:
        return null;
    }
  };

  const renderMessage = (msg) => {
    const isMe = msg.sender === "me";
    const url = msg.attachmentUrl ? getAttachmentUrl(msg) : null;
    const isImage = url && (msg.attachmentType?.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)/i.test(url));
    
    return (
      <div key={msg.id} className={`smsinput-message ${isMe ? "sent" : "received"}`}>
        {!isMe && (
          <div className="message-avatar" style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: getAvatarColor(USER_NAME),
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>
              {userDetails.avatar || getAnonymousUserAvatarFn(userDetails.gender)}
            </span>
          </div>
        )}
        <div className={`message-bubble ${isMe ? 'message-bubble-me' : 'message-bubble-other'}`}>
          {msg.text && <p className="message-text">{msg.text}</p>}
          {url && isImage && (
            <img src={url} alt={msg.attachmentName || "Attachment"} className="sms-attachment-image" />
          )}
          {url && !isImage && (
            <a href={url} target="_blank" rel="noreferrer" className="sms-attachment-link">
              📎 {msg.attachmentName || 'Attachment'}
            </a>
          )}
          <div className="message-footer">
            <span className="message-time">{msg.time}</span>
            {renderMessageStatus(msg)}
          </div>
        </div>
      </div>
    );
  };

  if (!selectedUser) {
    return (
      <div className="smsinput-container no-user">
        <div className="smsinput-empty-state">
          <span className="empty-icon">💬</span>
          <h3>{t('no_user_selected')}</h3>
          <p>{t('select_user_msg')}</p>
          <button className="back-to-list-btn" onClick={handleBack}>
            ← Back to SMS List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="smsinput-container">
      {/* Header - Matching React Native design */}
      <div className="smsinput-header">
        <div className="header-left">
          <button className="back-button" onClick={handleBack}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor" />
            </svg>
          </button>
          <div className="smsinput-user-info">
            <div className="user-avatar-outer" style={{ position: 'relative', width: 44, height: 44 }}>
              <UserPhotoAvatar
                photo={userDetails.profilePhoto}
                name={USER_NAME}
                gender={userDetails.gender}
                size={40}
                style={{ border: '2px solid #FFFFFF' }}
              />
              <span className={`status-dot ${resolveOnlineStatus(selectedUser) ? "online" : "offline"}`} style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: resolveOnlineStatus(selectedUser) ? "#4caf50" : "#9CA3AF",
                border: '1.5px solid #FFFFFF',
              }}></span>
            </div>
            <div className="smsinput-user-details">
              <h3>{USER_NAME}</h3>
              <span className="profile-status">
                {remoteIsTyping ? (
                  <span className="typing-text">Typing...</span>
                ) : (
                  <span className="status-text">
                    {resolveOnlineStatus(selectedUser) ? t('online') : t('offline')}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
        <div className="smsinput-call-buttons">
          <button
            className={`call-btn voice ${isInitiatingCall ? "loading" : ""}`}
            onClick={initiateVoiceCall}
            disabled={isInitiatingCall}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: 'rgba(255,255,255,0.15)',
              border: 'none',
              cursor: 'pointer',
              opacity: isInitiatingCall ? 0.4 : 1,
            }}
          >
            <span className="call-icon">📞</span>
          </button>
          <button
            className={`call-btn video ${isInitiatingCall ? "loading" : ""}`}
            onClick={initiateVideoCall}
            disabled={isInitiatingCall}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: 'rgba(255,255,255,0.15)',
              border: 'none',
              cursor: 'pointer',
              opacity: isInitiatingCall ? 0.4 : 1,
            }}
          >
            <span className="call-icon">📹</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {callError && (
        <div className="sms-call-error-banner">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{callError}</span>
          <button className="error-close" onClick={() => setCallError(null)}>✕</button>
        </div>
      )}

      {/* Messages Area */}
      <div className="smsinput-messages" ref={messagesContainerRef}>
        {isLoadingMessages && messages.length === 0 ? (
          <div className="sms-loading-messages">
            <div className="sms-loading-spinner"></div>
            <p>{t('loading_messages')}</p>
          </div>
        ) : error && messages.length === 0 ? (
          <div className="sms-error-message">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <button onClick={fetchMessagesFromAPI} className="retry-btn">{t('retry')}</button>
          </div>
        ) : messages.length === 0 ? (
          <div className="sms-empty-messages">
            <span className="empty-messages-icon">💬</span>
            <p>{t('no_messages')}</p>
            <p className="empty-messages-subtext">{t('start_conversation')}</p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        {remoteIsTyping && (
          <div className="smsinput-message received">
            <div className="message-bubble typing-bubble">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form className="smsinput-form" onSubmit={handleSendMessage}>
        <div className="smsinput-input-wrapper">
          <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileSelected} />
          <input ref={cameraInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileSelected} />
          
          {pendingAttachment && (
            <div className="attachment-preview">
              <span>📎 {pendingAttachment.name}</span>
              <button type="button" onClick={() => setPendingAttachment(null)}>✕</button>
            </div>
          )}
          
          <div className="input-group">
            <button type="button" className="attach-btn" disabled={isSending} onClick={handleFileAttachClick}>+</button>
            <input
              type="text"
              ref={messageInputRef}
              className="smsinput-input"
              placeholder={isSending ? t('sending') : t('message')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleInputKeyDown}
              disabled={isSending}
            />
            <button
              type="submit"
              className={`send-btn ${(message.trim() || pendingAttachment) && !isSending ? "active" : ""}`}
              disabled={(!message.trim() && !pendingAttachment) || isSending}
            >
              {t('send')}
            </button>
          </div>
        </div>
      </form>

      {/* Call Modals */}
      <VideoCallModal
        isOpen={isVideoModalOpen}
        onClose={handleCloseModal}
        callData={selectedCall}
        currentUser={{ id: COUNSELOR_ID, role: "counsellor" }}
        onEndCall={handleEndIncomingCall}
      />

      <VoiceCallModal
        isOpen={isVoiceModalOpen}
        onClose={handleCloseModal}
        callData={selectedCall}
        currentUser={{ id: COUNSELOR_ID, role: "counsellor" }}
        onEndCall={handleEndIncomingCall}
      />

      <IncomingCallModal
        isOpen={showIncomingModal}
        onClose={() => setShowIncomingModal(false)}
        callType={incomingCallData.callType}
        callerName={incomingCallData.name}
        callerAvatar={incomingCallData.avatar}
        callData={incomingCallData}
        onJoinCall={handleJoinIncomingCall}
        onRejectCall={handleRejectIncomingCall}
      />
    </div>
  );
};

export default SMSInput;