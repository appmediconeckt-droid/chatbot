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
  FaVolumeMute,
  FaSpinner,
  FaMicrophoneSlash,
  FaPhoneSlash,
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
  const [aiVoiceOpen, setAiVoiceOpen] = React.useState(false);
  const [aiVoiceStatus, setAiVoiceStatus] = React.useState("idle");
  const [aiVoiceTime, setAiVoiceTime] = React.useState(0);
  const [aiVoiceMuted, setAiVoiceMuted] = React.useState(false);
  const [aiVoiceSpeakerOn, setAiVoiceSpeakerOn] = React.useState(true);
  const [aiVoiceError, setAiVoiceError] = React.useState(null);
  const [aiVoiceTranscript, setAiVoiceTranscript] = React.useState([]);
  const recognitionRef = React.useRef(null);
  const aiVoicePcRef = React.useRef(null);
  const aiVoiceMicStreamRef = React.useRef(null);
  const aiVoiceDataChannelRef = React.useRef(null);
  const aiVoiceAudioRef = React.useRef(null);
  const aiVoiceTimerRef = React.useRef(null);

  const stopAiVoiceTimer = () => {
    if (aiVoiceTimerRef.current) {
      clearInterval(aiVoiceTimerRef.current);
      aiVoiceTimerRef.current = null;
    }
  };

  const startAiVoiceTimer = () => {
    stopAiVoiceTimer();
    aiVoiceTimerRef.current = setInterval(() => {
      setAiVoiceTime((prev) => prev + 1);
    }, 1000);
  };

  const cleanupAiVoiceCall = ({ closeModal = false, nextStatus = "ended" } = {}) => {
    stopAiVoiceTimer();
    aiVoiceDataChannelRef.current?.close?.();
    aiVoicePcRef.current?.close?.();
    aiVoiceMicStreamRef.current?.getTracks?.().forEach((track) => track.stop());

    if (aiVoiceAudioRef.current) {
      aiVoiceAudioRef.current.srcObject = null;
      aiVoiceAudioRef.current.muted = false;
    }

    aiVoiceDataChannelRef.current = null;
    aiVoicePcRef.current = null;
    aiVoiceMicStreamRef.current = null;
    setAiVoiceMuted(false);
    setAiVoiceSpeakerOn(true);
    setAiVoiceStatus(nextStatus);

    if (closeModal) {
      setAiVoiceOpen(false);
      setAiVoiceStatus("idle");
      setAiVoiceTime(0);
    }
  };

  React.useEffect(() => {
    return () => cleanupAiVoiceCall({ closeModal: true });
  }, []);

  const formatAiVoiceTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const getAiVoiceStatusText = () => {
    switch (aiVoiceStatus) {
      case "connecting":
        return "Connecting...";
      case "listening":
        return aiVoiceMuted ? "Muted" : "Listening...";
      case "thinking":
        return "Thinking...";
      case "speaking":
        return "AI speaking...";
      case "ended":
        return "Call ended";
      case "error":
        return "Connection failed";
      default:
        return "Ready";
    }
  };

  const appendAiVoiceTranscript = (role, text) => {
    const cleanText = String(text || "").trim();
    if (!cleanText) return;

    setAiVoiceTranscript((prev) => [
      ...prev.slice(-5),
      {
        id: `${role}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        role,
        text: cleanText,
      },
    ]);
  };

  const configureAiVoiceTurnDetection = (dataChannel) => {
    if (!dataChannel || dataChannel.readyState !== "open") return;

    dataChannel.send(
      JSON.stringify({
        type: "session.update",
        session: {
          type: "realtime",
          audio: {
            input: {
              transcription: {
                model: "gpt-4o-mini-transcribe",
              },
              turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 500,
                create_response: true,
                interrupt_response: true,
              },
            },
          },
        },
      })
    );
  };

  const handleAiVoiceRealtimeEvent = (event) => {
    const type = event?.type || "";

    if (type === "input_audio_buffer.speech_started") {
      setAiVoiceStatus("listening");
      return;
    }

    if (type === "input_audio_buffer.speech_stopped") {
      setAiVoiceStatus("thinking");
      return;
    }

    if (type.startsWith("response.audio")) {
      setAiVoiceStatus("speaking");
    }

    if (type === "response.audio_transcript.done") {
      appendAiVoiceTranscript("ai", event.transcript);
    }

    if (type === "conversation.item.input_audio_transcription.completed") {
      appendAiVoiceTranscript("you", event.transcript);
    }

    if (type === "response.done") {
      setAiVoiceStatus("listening");
    }

    if (type === "error") {
      setAiVoiceStatus("error");
      setAiVoiceError(event.error?.message || "AI voice call error");
    }
  };

  const waitForIceGathering = (pc) =>
    new Promise((resolve) => {
      if (pc.iceGatheringState === "complete") {
        resolve();
        return;
      }

      const timeoutId = setTimeout(resolve, 1500);
      const handleIceGatheringStateChange = () => {
        if (pc.iceGatheringState === "complete") {
          clearTimeout(timeoutId);
          pc.removeEventListener("icegatheringstatechange", handleIceGatheringStateChange);
          resolve();
        }
      };

      pc.addEventListener("icegatheringstatechange", handleIceGatheringStateChange);
    });

  const startAiVoiceCall = async () => {
    if (aiVoicePcRef.current) return;

    setAiVoiceOpen(true);
    setAiVoiceStatus("connecting");
    setAiVoiceError(null);
    setAiVoiceTranscript([]);
    setAiVoiceTime(0);
    setAiVoiceMuted(false);
    setAiVoiceSpeakerOn(true);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Your browser does not support microphone access.");
      }

      const pc = new RTCPeerConnection();
      aiVoicePcRef.current = pc;

      const audioEl = aiVoiceAudioRef.current || document.createElement("audio");
      audioEl.autoplay = true;
      audioEl.playsInline = true;
      audioEl.muted = false;

      pc.ontrack = (event) => {
        audioEl.srcObject = event.streams[0];
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === "connected") {
          setAiVoiceStatus("listening");
          startAiVoiceTimer();
        } else if (state === "failed" || state === "disconnected") {
          setAiVoiceStatus("error");
          setAiVoiceError("AI voice connection disconnected.");
        } else if (state === "closed") {
          stopAiVoiceTimer();
        }
      };

      const dataChannel = pc.createDataChannel("oai-events");
      aiVoiceDataChannelRef.current = dataChannel;
      dataChannel.onmessage = (messageEvent) => {
        try {
          handleAiVoiceRealtimeEvent(JSON.parse(messageEvent.data));
        } catch (error) {
          console.warn("Unable to parse AI realtime event:", error);
        }
      };
      dataChannel.onopen = () => {
        configureAiVoiceTurnDetection(dataChannel);
        setAiVoiceStatus("listening");
      };

      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      aiVoiceMicStreamRef.current = micStream;
      micStream.getTracks().forEach((track) => pc.addTrack(track, micStream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await waitForIceGathering(pc);

      const localSdp = pc.localDescription?.sdp || offer.sdp || "";
      if (!localSdp.includes("v=0")) {
        throw new Error("Browser could not create a valid voice-call SDP offer.");
      }

      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/api/ai/realtime/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/sdp",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: localSdp,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "AI voice session could not be started.");
      }

      const answerSdp = await response.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
    } catch (error) {
      console.error("AI voice call error:", error);
      cleanupAiVoiceCall({ nextStatus: "error" });
      setAiVoiceOpen(true);
      setAiVoiceError(error.message || "AI voice call start nahi ho paya.");
    }
  };

  const toggleAiVoiceMute = () => {
    const nextMuted = !aiVoiceMuted;
    aiVoiceMicStreamRef.current?.getAudioTracks?.().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setAiVoiceMuted(nextMuted);
  };

  const toggleAiVoiceSpeaker = () => {
    const nextSpeakerOn = !aiVoiceSpeakerOn;
    if (aiVoiceAudioRef.current) {
      aiVoiceAudioRef.current.muted = !nextSpeakerOn;
    }
    setAiVoiceSpeakerOn(nextSpeakerOn);
  };
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
            <button
              type="button"
              className="ud-chat-icon-btn ud-chat-voice-call-btn"
              onClick={startAiVoiceCall}
              disabled={aiVoiceStatus === "connecting" || (aiVoiceOpen && aiVoiceStatus !== "error")}
              title="AI Voice Call"
              aria-label="Start AI voice call"
            >
              {aiVoiceStatus === "connecting" ? (
                <FaSpinner className="ud-tts-spinner" aria-hidden="true" />
              ) : (
                <FaPhone aria-hidden="true" />
              )}
            </button>
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
        {aiVoiceOpen && (
          <div className="ud-ai-call-overlay" role="dialog" aria-modal="true" aria-label="AI Voice Call">
            <div className="ud-ai-call-modal">
              <audio ref={aiVoiceAudioRef} autoPlay playsInline className="ud-ai-call-audio" />
              <div className="ud-ai-call-avatar" aria-hidden="true">
                {aiVoiceStatus === "connecting" ? (
                  <FaSpinner className="ud-tts-spinner" />
                ) : (
                  <FaRobot />
                )}
              </div>
              <h3>AI Assistant</h3>
              <p className="ud-ai-call-status">{getAiVoiceStatusText()}</p>
              <div className="ud-ai-call-timer">{formatAiVoiceTime(aiVoiceTime)}</div>

              {aiVoiceError && (
                <div className="ud-ai-call-error">{aiVoiceError}</div>
              )}

              {aiVoiceTranscript.length > 0 && (
                <div className="ud-ai-call-transcript">
                  {aiVoiceTranscript.map((item) => (
                    <p key={item.id} className={item.role === "you" ? "is-user" : "is-ai"}>
                      <strong>{item.role === "you" ? "You" : "AI"}:</strong> {item.text}
                    </p>
                  ))}
                </div>
              )}

              <div className="ud-ai-call-controls">
                <button
                  type="button"
                  className={`ud-ai-call-control ${aiVoiceMuted ? "is-active" : ""}`}
                  onClick={toggleAiVoiceMute}
                  disabled={aiVoiceStatus === "connecting" || aiVoiceStatus === "error"}
                  title={aiVoiceMuted ? "Unmute" : "Mute"}
                  aria-label={aiVoiceMuted ? "Unmute microphone" : "Mute microphone"}
                >
                  {aiVoiceMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
                </button>
                <button
                  type="button"
                  className={`ud-ai-call-control ${!aiVoiceSpeakerOn ? "is-active" : ""}`}
                  onClick={toggleAiVoiceSpeaker}
                  disabled={aiVoiceStatus === "connecting" || aiVoiceStatus === "error"}
                  title={aiVoiceSpeakerOn ? "Speaker off" : "Speaker on"}
                  aria-label={aiVoiceSpeakerOn ? "Turn speaker off" : "Turn speaker on"}
                >
                  {aiVoiceSpeakerOn ? <FaVolumeUp /> : <FaVolumeMute />}
                </button>
                <button
                  type="button"
                  className="ud-ai-call-control ud-ai-call-end"
                  onClick={() => cleanupAiVoiceCall({ closeModal: true })}
                  title="End call"
                  aria-label="End AI voice call"
                >
                  <FaPhoneSlash />
                </button>
              </div>
            </div>
          </div>
        )}
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

const AI_CHAT_ENDPOINT = `${API_BASE_URL}/api/ai-chat/send-message`;

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


  const renderHelpSupport = () => (
    <section className="ud-content-section ud-info-page">
      <div className="ud-info-page-header">
        <span className="ud-info-page-icon">
          <FaQuestionCircle />
        </span>
        <div>
          <h2 className="ud-section-title">{t('help_support')}</h2>
          <p>
            Use this support center to jump to the right MediConeckt feature,
            troubleshoot common issues, and understand when to contact urgent
            help outside the app.
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
            <h3>Before you contact support</h3>
          </div>
          <ul>
            {helpChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>

      <div className="ud-issue-grid">
        {commonIssues.map((issue) => (
          <article className="ud-issue-card" key={issue.title}>
            <h3>{issue.title}</h3>
            <p>{issue.text}</p>
          </article>
        ))}
      </div>

      <div className="ud-support-strip">
        <div>
          <h3>Need more help?</h3>
          <p>
            Update account details from Profile/Settings, or email support
            with screenshots, browser name, user email/phone, and the exact
            time the issue happened. For crisis support in India, call
            9152987821 or local emergency services.
          </p>
        </div>
        <div className="ud-support-strip-actions">
          <button type="button" className="ud-privacy-btn" onClick={handleProfileClick}>
            {t('my_profile')}
          </button>
          <button type="button" className="ud-privacy-btn" onClick={handleSettingsClick}>
            {t('settings')}
          </button>
          <button
            type="button"
            className="ud-privacy-btn ud-privacy-btn-secondary"
            onClick={() => {
              window.location.href = "mailto:support@mediconeckt.com?subject=MediConeckt%20Support%20Request";
            }}
          >
            Email support
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
            This privacy center explains how MediConeckt uses your profile,
            chat, appointment, wallet, call, location, and security data inside
            this web dashboard.
          </p>
        </div>
      </div>

      <div className="ud-privacy-highlight-row">
        {privacyHighlights.map((item) => (
          <article className="ud-privacy-highlight" key={item.label}>
            <span>{item.icon}</span>
            <div>
              <p>{item.label}</p>
              <strong>{item.value}</strong>
            </div>
          </article>
        ))}
      </div>

      <div className="ud-privacy-content">
        {privacyDataGroups.map((group) => (
          <article className="ud-privacy-option" key={group.title}>
            <span className="ud-privacy-option-icon">{group.icon}</span>
            <h3>{group.title}</h3>
            <p>{group.text}</p>
          </article>
        ))}
      </div>

      <div className="ud-privacy-content">
        {privacyVisibility.map((item) => (
          <article className="ud-privacy-option ud-privacy-option-soft" key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>

      <div className="ud-privacy-policy-panel">
        <h3>Your privacy checklist</h3>
        <ul>
          {privacyChecklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="ud-privacy-actions">
        <button type="button" className="ud-privacy-btn" onClick={handleProfileClick}>
          Manage profile data
        </button>
        <button type="button" className="ud-privacy-btn" onClick={handleSettingsClick}>
          Security settings
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
