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
  FaRobot,
  FaPaperPlane,
  FaCommentMedical,
  FaUser,
  FaCalendarAlt,
  FaMicrophone,
  FaVideo as FaVideoIcon,
  FaStop,
  FaRedoAlt,
  FaVolumeUp,
  FaSpinner,
} from "react-icons/fa";

import ChatInterface from "../Tab/chatbot/ChatInterface";
import WalletDashboard from "../Tab/Wallet/WalletDashboard";
import CallHistory from "../Tab/Callls/CallHistory";
import useVibration from "../../../hooks/useVibration";
import useRingtone from "../../../hooks/useRingtone";
import PatientProfile from "../../PatientProfile/PatientProfile";

import LiveChatSupport from "../Tab/Appointment/BookAppointment";
import axios from "axios";
import socketService from "../../../services/socketService";
import CounselorTable from "../Tab/Counselor/CounselorDirectory";
import VideoCallModal from "../Tab/CallModal/VideoCallModal";
import IncomingCallModal from "../../common/IncomingCallModal/IncomingCallModal";
import CounselorRequestChat from "../Tab/Appointment/BookAppointment";
import MyAppointments from "../Tab/Appointment/MyAppointments";
import LocationNoticeToast from "../../common/LocationNoticeToast";
import AccountSettings from "../../Settings/AccountSettings";
import { useUserTranslation } from "../../../i18n/LanguageContext";
import { LanguageSelector } from "../../common/LanguageSelector";
import RatingPrompt from "../../../components/RatingPrompt";

const VOICE_LANGUAGES = [
  { label: 'English (India)', code: 'en-IN' },
  { label: 'English (US)',    code: 'en-US' },
  { label: 'Hindi',          code: 'hi-IN' },
  { label: 'Tamil',          code: 'ta-IN' },
  { label: 'Telugu',         code: 'te-IN' },
  { label: 'Kannada',        code: 'kn-IN' },
  { label: 'Malayalam',      code: 'ml-IN' },
  { label: 'Bengali',        code: 'bn-IN' },
  { label: 'Gujarati',       code: 'gu-IN' },
  { label: 'Marathi',        code: 'mr-IN' },
];

const ChatPopup = ({
  messages,
  newMessage,
  setNewMessage,
  sendMessage,
  handleKeyPress,
  isLoading,
  onClose,
  onReset,
  chatBodyRef,
  handleCounselorClick,
  sendQuickReply,
  sendChat,
  selectedLang,
}) => {
  const [isRecording, setIsRecording] = React.useState(false);
  const [speakingId, setSpeakingId] = React.useState(null);
  const [ttsLoadingId, setTtsLoadingId] = React.useState(null);
  const [showLangPicker, setShowLangPicker] = React.useState(false);
  const recognitionRef = React.useRef(null);
  const audioRef = React.useRef(null);
  const sendChatRef = React.useRef(sendChat);

  React.useEffect(() => {
    sendChatRef.current = sendChat;
  }, [sendChat]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Try Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = selectedLang || 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      if (transcript) {
        setNewMessage(transcript);
      }
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const speakMessage = async (messageId, text) => {
    // Stop if already speaking this message
    if (speakingId === messageId) {
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
      setSpeakingId(null);
      return;
    }
    // Stop any previous audio
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    setSpeakingId(null);
    setTtsLoadingId(messageId);

    try {
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/ai-chat/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text, lang: selectedLang }),
      });

      if (!response.ok) throw new Error("TTS backend failed");

      const blob = await response.blob();
      if (blob.size === 0) throw new Error("Empty audio response");

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      setSpeakingId(messageId);
      setTtsLoadingId(null);

      await audio.play();
      audio.onended = () => {
        setSpeakingId(null);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setSpeakingId(null);
        URL.revokeObjectURL(url);
      };
    } catch (err) {
      console.warn("[TTS] Backend failed, using browser fallback:", err.message);
      // Browser Web Speech API fallback — auto language + female voice
      if (window.speechSynthesis) {
        const lang = selectedLang || 'en-IN';

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.9;
        utterance.pitch = 1.15;
        utterance.volume = 1;

        const applyVoice = () => {
          const voices = window.speechSynthesis.getVoices();
          // Priority: exact lang + female keyword → exact lang → Indian English female → any female → first available
          const femalePattern = /female|woman|girl|lekha|aditi|veena|heera|zira|samantha|google.*female/i;
          const voice =
            voices.find(v => v.lang === lang && femalePattern.test(v.name)) ||
            voices.find(v => v.lang === lang) ||
            voices.find(v => v.lang.startsWith(lang.split('-')[0]) && femalePattern.test(v.name)) ||
            voices.find(v => v.lang.startsWith(lang.split('-')[0])) ||
            voices.find(v => v.lang === 'en-IN' && femalePattern.test(v.name)) ||
            voices.find(v => v.lang === 'en-IN') ||
            voices.find(v => femalePattern.test(v.name)) ||
            voices[0];
          if (voice) utterance.voice = voice;
        };

        if (window.speechSynthesis.getVoices().length > 0) {
          applyVoice();
        } else {
          window.speechSynthesis.onvoiceschanged = applyVoice;
        }

        utterance.onstart = () => setSpeakingId(messageId);
        utterance.onend = () => setSpeakingId(null);
        utterance.onerror = () => setSpeakingId(null);
        setTtsLoadingId(null);
        window.speechSynthesis.speak(utterance);
      } else {
        setSpeakingId(null);
      }
    } finally {
      setTtsLoadingId(null);
    }
  };

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
            <div className="ud-chat-avatar-wrap">
              <div className="ud-chat-avatar ud-chat-avatar--bounce">
                <FaRobot />
              </div>
              <span className="ud-chat-avatar-dot" />
            </div>
            <div>
              <h3>MediConeckt AI</h3>
              {/* <p className="ud-chat-status">
                <span className="ud-status-dot" />
                Online • Always here
              </p> */}
            </div>
          </div>
          <div className="ud-chat-header-actions">
            {onReset && (
              <button
                type="button"
                className="ud-chat-icon-btn ud-chat-reset-btn"
                onClick={onReset}
                disabled={isLoading}
                title="Start a fresh chat"
                aria-label="Reset chat"
              >
                <FaRedoAlt aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              className="ud-chat-icon-btn ud-chat-close-btn"
              onClick={onClose}
              title="Close chat"
              aria-label="Close chat"
            >
              <FaTimes aria-hidden="true" />
            </button>
          </div>
        </div>
        {/* Curved bottom edge of header */}
        <div className="ud-chat-header-curve" aria-hidden="true">
          <svg viewBox="0 0 320 20" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,0 L320,0 L320,0 Q160,20 0,0 Z" fill="#f9fafb"/>
          </svg>
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
                {message.sender === "ai" && (
                  <div className="ud-chat-bubble-actions">
                    <button
                      type="button"
                      className={`ud-tts-btn ${speakingId === message.id ? "ud-tts-btn--playing" : ""}`}
                      onClick={() => speakMessage(message.id, message.text)}
                      disabled={ttsLoadingId === message.id}
                      title={speakingId === message.id ? "Stop speaking" : "Listen to response"}
                      aria-label={speakingId === message.id ? "Stop" : "Speak"}
                    >
                      {ttsLoadingId === message.id ? (
                        <FaSpinner className="ud-tts-spinner" aria-hidden="true" />
                      ) : (
                        <FaVolumeUp aria-hidden="true" />
                      )}
                    </button>
                  </div>
                )}
                {message.sender === "ai" &&
                  Array.isArray(message.quickReplies) &&
                  message.quickReplies.length > 0 && (
                    <div className="ud-chat-quick-replies">
                      {message.quickReplies.map((qr) => (
                        <button
                          key={qr}
                          type="button"
                          className="ud-chat-quick-reply-btn"
                          disabled={isLoading}
                          onClick={() => sendQuickReply && sendQuickReply(qr)}
                        >
                          {qr}
                        </button>
                      ))}
                    </div>
                  )}
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
          <div className="ud-lang-picker-wrap" hidden>
            <button
              type="button"
              className="ud-lang-btn"
              onClick={() => setShowLangPicker(p => !p)}
              title="Select language"
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 8px', borderRadius: 8, border: '1px solid #e2e8f0',
                background: '#f8fafc', cursor: 'pointer', fontSize: 12,
                color: '#4f46e5', fontWeight: 600, whiteSpace: 'nowrap',
              }}
            >
              🌐 {VOICE_LANGUAGES.find(l => l.code === selectedLang)?.label?.split(' ')[0] || 'EN'}
            </button>
            {showLangPicker && (
              <div style={{
                position: 'absolute', bottom: '110%', left: 0,
                background: '#fff', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
                zIndex: 9999, minWidth: 180, padding: '8px 0', border: '1px solid #e2e8f0',
              }}>
                <div style={{ padding: '6px 14px 4px', fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: 1 }}>
                  SELECT LANGUAGE
                </div>
                {VOICE_LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setShowLangPicker(false);
                      if (lang.code !== selectedLang) onLangChange?.(lang.code);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '8px 14px', background: 'none', border: 'none',
                      cursor: 'pointer', fontSize: 13, color: lang.code === selectedLang ? '#4f46e5' : '#1e293b',
                      fontWeight: lang.code === selectedLang ? 700 : 400,
                    }}
                  >
                    {lang.label}
                    {lang.code === selectedLang && <span style={{ color: '#4f46e5' }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="ud-chat-input-wrap" style={{ flex: 1 }}>
            <input
              type="text"
              placeholder={isRecording ? "Listening…" : "Type a message…"}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="ud-chat-input"
              readOnly={isRecording}
            />
            <button
              type="button"
              className={`ud-mic-btn ${isRecording ? "ud-mic-btn--recording" : ""}`}
              onClick={toggleRecording}
              title={isRecording ? "Click to stop" : "Click to speak"}
              aria-label={isRecording ? "Stop recording" : "Start voice input"}
            >
              {isRecording ? <FaStop aria-hidden="true" /> : <FaMicrophone aria-hidden="true" />}
            </button>
          </div>
          <button
            className="ud-send-btn"
            onClick={sendMessage}
            disabled={isLoading || !newMessage.trim()}
            aria-label="Send message"
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
  <div className="ud-floating-chat-wrap">
    {/* <span className="ud-float-ring ud-float-ring-1" />
    <span className="ud-float-ring ud-float-ring-2" /> */}
    <button className="ud-floating-chat-btn" onClick={onClick} title="Chat with AI Assistant" aria-label="Open AI chat">
      <span className="ud-floating-ai-star" aria-hidden="true">✨</span>
      <span className="ud-floating-ai-label">AI</span>
      {unreadCount > 0 && <span className="ud-unread-badge">{unreadCount}</span>}
    </button>
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

export default function UserDashboard() {
  const { t, lang, setLang } = useUserTranslation();
  const [, setLanguageUpdate] = useState(0);
  const [active, setActive] = useState("Chat");
  const [chatOpen, setChatOpen] = useState(false);
  const [targetCounselor, setTargetCounselor] = useState("");
  const [newMessage, setNewMessage] = useState("");

  // Force re-render when language changes
  useEffect(() => {
    setLanguageUpdate(prev => prev + 1);
  }, [lang]);

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
  }, []);

  // Start empty so the backend's onboarding question (or the user's first
  // turn-based AI reply) is what the user actually sees first. The old
  // hard-coded "Hello! I'm your AI assistant" suppressed the warm onboarding.
  const [chatMessages, setChatMessages] = useState([]);
  const [aiSessionId, setAiSessionId] = useState(null);
  // The AI chat always follows the language selected for the user dashboard.
  // It deliberately has no separate language preference or selector.
  const selectedLang = getAiChatLanguage(lang);

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
        const response = await axiosInstance.post(
          `${API_BASE_URL}/api/ai-chat/send-message`,
          { message: "hi", history: [], language: selectedLang },
        );
        if (response.data?.success) {
          if (response.data.data?.sessionId) {
            setAiSessionId(response.data.data.sessionId);
          }
          setChatMessages([
            {
              id: Date.now(),
              text: response.data.data.aiResponse,
              sender: "ai",
              quickReplies: response.data.data.quickReplies || null,
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
    const userMessage = { id: Date.now(), text: trimmed, sender: "user" };
    setChatMessages((prev) => [
      ...prev.map((m) =>
        m.sender === "ai" && m.quickReplies ? { ...m, quickReplies: null } : m,
      ),
      userMessage,
    ]);
    setIsLoading(true);

    try {
      const history = chatMessages.slice(-10).map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      }));

      const response = await axiosInstance.post(
        `${API_BASE_URL}/api/ai-chat/send-message`,
        {
          message: userMessage.text,
          history: history,
          sessionId: aiSessionId,
          language: selectedLang,
        },
      );

      if (response.data && response.data.success) {
        if (response.data.data?.sessionId) {
          setAiSessionId(response.data.data.sessionId);
        }
        const aiResponse = {
          id: Date.now() + 1,
          text: response.data.data.aiResponse,
          sender: "ai",
          quickReplies: response.data.data.quickReplies || null,
        };
        setChatMessages((prev) => [...prev, aiResponse]);
      } else {
        throw new Error("Invalid AI response");
      }
    } catch (error) {
      console.error("AI Chat error:", error);
      const errorMessage = {
        id: Date.now() + 1,
        text: t('server_connection_error'),
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
    setSelectedLang(newLang);
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
      const response = await axiosInstance.post(
        `${API_BASE_URL}/api/ai-chat/send-message`,
        { message: "hi", history: [], language: newLang },
      );
      if (response.data?.success) {
        if (response.data.data?.sessionId) setAiSessionId(response.data.data.sessionId);
        setChatMessages([{
          id: Date.now(),
          text: response.data.data.aiResponse,
          sender: "ai",
          quickReplies: response.data.data.quickReplies || null,
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
    { id: "help", icon: <FaQuestionCircle />, label: t('help_support') },
    { id: "privacy", icon: <FaLock />, label: t('privacy') },
    { id: "settings", icon: <FaCog />, label: t('settings') },
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
      title: t('chat'),
      text: t('chat_desc') || "Ask health-related questions, continue your chat history, and start again when you want a fresh conversation.",
      action: t('open_chat'),
      onClick: () => handleMenuItemClick("Chat"),
    },
    {
      icon: <FaUserMd />,
      title: t('counselor'),
      text: t('counselor_desc') || "Search counselors, view details, and request chat or appointment support from the counselor section.",
      action: t('view_counselor'),
      onClick: () => handleMenuItemClick("Counselor"),
    },
    {
      icon: <FaCalendarAlt />,
      title: t('appointments'),
      text: t('appointments_desc'),
      action: t('my_appointments'),
      onClick: () => handleMenuItemClick("MyAppointments"),
    },
    {
      icon: <FaVideo />,
      title: t('calls_sessions'),
      text: t('calls_sessions_desc'),
      action: t('call_history'),
      onClick: () => handleMenuItemClick("Video"),
    },
    {
      icon: <FaWallet />,
      title: t('wallet_payments'),
      text: t('wallet_payments_desc'),
      action: t('open_wallet'),
      onClick: () => handleMenuItemClick("Wallet"),
    },
  ];


  const renderHelpSupport = () => (
    <section className="ud-content-section ud-info-page">
      <div className="ud-info-page-header">
        <span className="ud-info-page-icon">
          <FaQuestionCircle />
        </span>
        <div>
          <h2 className="ud-section-title">{t('help_support')}</h2>
          <p>
            {t('help_desc')}
          </p>
        </div>
      </div>

      <div className="ud-help-content">
        {supportOptions.map((item) => (
          <button
            type="button"
            className="ud-support-card"
            key={item.title}
            onClick={item.onClick}
          >
            <span className="ud-support-icon">{item.icon}</span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
            <span className="ud-card-link">{item.action}</span>
          </button>
        ))}
      </div>

      <div className="ud-role-help-grid ud-role-help-grid-single">
        <article className="ud-role-help-card">
          <div className="ud-role-help-title">
            <FaUser />
            <h3>{t('important_help')}</h3>
          </div>
          <ul>
            <li>{t('profile_help')}</li>
            <li>{t('verification_help')}</li>
            <li>{t('appointments_help')}</li>
            <li>{t('calls_help')}</li>
            <li>{t('payments_help')}</li>
            <li>{t('security_help')}</li>
            <li>{t('emergency_help')}</li>
          </ul>
        </article>
      </div>

      <div className="ud-issue-grid">
        <article className="ud-issue-card">
          <h3>{t('profile_not_updating')}</h3>
          <p>{t('profile_not_updating_desc')}</p>
        </article>
        <article className="ud-issue-card">
          <h3>{t('call_not_connecting')}</h3>
          <p>{t('call_not_connecting_desc')}</p>
        </article>
        <article className="ud-issue-card">
          <h3>{t('appointment_not_visible')}</h3>
          <p>{t('appointment_not_visible_desc')}</p>
        </article>
        <article className="ud-issue-card">
          <h3>{t('payment_issue')}</h3>
          <p>{t('payment_issue_desc')}</p>
        </article>
      </div>

      <div className="ud-support-strip">
        <div>
          <h3>{t('need_help')}</h3>
          <p>
            {t('need_help_desc')}
          </p>
        </div>
        <div className="ud-support-strip-actions">
          <button type="button" className="ud-privacy-btn" onClick={handleProfileClick}>
            {t('my_profile')}
          </button>
          <button type="button" className="ud-privacy-btn" onClick={handleSettingsClick}>
            {t('settings')}
          </button>
        </div>
      </div>
    </section>
  );

  const renderPrivacyCenter = () => (
    <section className="ud-content-section ud-info-page">
      <div className="ud-info-page-header">
        <span className="ud-info-page-icon">
          <FaLock />
        </span>
        <div>
          <h2 className="ud-section-title">{t('privacy')}</h2>
          <p>
            {t('privacy_desc')}
          </p>
        </div>
      </div>

      <div className="ud-privacy-highlight-row">
        <article className="ud-privacy-highlight">
          <span><FaCheckCircle /></span>
          <div>
            <p>{t('otp_protected')}</p>
            <strong>{t('email_phone')}</strong>
          </div>
        </article>
        <article className="ud-privacy-highlight">
          <span><FaCog /></span>
          <div>
            <p>{t('manage_from')}</p>
            <strong>{t('profile_settings')}</strong>
          </div>
        </article>
        <article className="ud-privacy-highlight">
          <span><FaLock /></span>
          <div>
            <p>{t('sensitive_areas')}</p>
            <strong>{t('health_chat_calls')}</strong>
          </div>
        </article>
      </div>

      <div className="ud-privacy-content">
        <article className="ud-privacy-option">
          <span className="ud-privacy-option-icon"><FaUser /></span>
          <h3>{t('profile_data')}</h3>
          <p>{t('profile_data_desc')}</p>
        </article>
        <article className="ud-privacy-option">
          <span className="ud-privacy-option-icon"><FaCommentDots /></span>
          <h3>{t('chat_appointment_data')}</h3>
          <p>{t('chat_appointment_data_desc')}</p>
        </article>
        <article className="ud-privacy-option">
          <span className="ud-privacy-option-icon"><FaLock /></span>
          <h3>{t('security_data')}</h3>
          <p>{t('security_data_desc')}</p>
        </article>
        <article className="ud-privacy-option">
          <span className="ud-privacy-option-icon"><FaCog /></span>
          <h3>{t('location_data')}</h3>
          <p>{t('location_data_desc')}</p>
        </article>
      </div>

      <div className="ud-privacy-content">
        <article className="ud-privacy-option ud-privacy-option-soft">
          <h3>{t('visible_to_you')}</h3>
          <p>{t('visible_to_you_desc')}</p>
        </article>
        <article className="ud-privacy-option ud-privacy-option-soft">
          <h3>{t('shared_for_care')}</h3>
          <p>{t('shared_for_care_desc')}</p>
        </article>
        <article className="ud-privacy-option ud-privacy-option-soft">
          <h3>{t('protected_changes')}</h3>
          <p>{t('protected_changes_desc')}</p>
        </article>
      </div>

      <div className="ud-privacy-policy-panel">
        <h3>{t('privacy_checklist')}</h3>
        <ul>
          <li>{t('privacy_checklist_1')}</li>
          <li>{t('privacy_checklist_2')}</li>
          <li>{t('privacy_checklist_3')}</li>
          <li>{t('privacy_checklist_4')}</li>
          <li>{t('privacy_checklist_5')}</li>
          <li>{t('privacy_checklist_6')}</li>
        </ul>
      </div>

      <div className="ud-privacy-actions">
        <button type="button" className="ud-privacy-btn" onClick={handleProfileClick}>
          {t('manage_profile_data')}
        </button>
        <button type="button" className="ud-privacy-btn" onClick={handleSettingsClick}>
          {t('security_settings')}
        </button>
      </div>
    </section>
  );

  return (
    <div className="user-dashboard">
      <LocationNoticeToast />
      <RatingPrompt triggerKey={active} />
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
            {active === "Chat" && <ChatInterface setActiveTab={setActive} />}
            {active === "Live Chat" && (
              <CounselorRequestChat initialSearch={targetCounselor} />
            )}
            {active === "MyAppointments" && <MyAppointments />}
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
