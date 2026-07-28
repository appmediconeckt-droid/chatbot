import React from "react";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaPaperPlane,
  FaPhone,
  FaPhoneSlash,
  FaPlus,
  FaRedoAlt,
  FaRobot,
  FaSpinner,
  FaStop,
  FaTimes,
  FaUserCircle,
  FaVolumeMute,
  FaVolumeUp,
  FaWaveSquare,
} from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";
import { API_BASE_URL } from "../../../../axiosConfig";
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

export default function AiChatPopup({
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
  userName,
}) {
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
                <HiSparkles />
              </div>
              <span className="ud-chat-avatar-dot" />
            </div>
            <div>
              <h3>AI Health Assistant</h3>
              <p className="ud-chat-status">
                <span className="ud-status-dot" />
                Online · Secure
              </p>
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
          <section className="ud-ai-welcome-card">
            <p className="ud-ai-welcome-title">Hello {userName?.trim()?.split(/\s+/)[0] || "there"}! 👋</p>
            <p>
              I am Humaeli AI, your personal medical companion. I can help
              you analyze reports, track symptoms, or find the right specialist.
            </p>
            <div className="ud-ai-safety-note">
              <span aria-hidden="true">△</span>
              <p>
                In case of a medical emergency, please call your local emergency
                services immediately. AI advice does not replace professional
                medical diagnosis.
              </p>
            </div>
          </section>

          {messages.length <= 1 && !isLoading && (
            <section className="ud-ai-mood-section">
              <p>How are you feeling today?</p>
              <div className="ud-ai-mood-row">
                {[
                  ["😟", "Low"],
                  ["🙂", "Okay"],
                  ["😊", "Good"],
                  ["✨", "Great"],
                ].map(([emoji, label]) => (
                  <button
                    key={label}
                    type="button"
                    disabled={isLoading}
                    onClick={() => sendQuickReply?.(`I am feeling ${label.toLowerCase()} today`)}
                  >
                    <span>{emoji}</span>{label}
                  </button>
                ))}
              </div>
            </section>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`ud-chat-message-wrapper ${message.sender}`}
            >
              {message.sender === "ai" && (
                <div className="ud-chat-avatar ud-small">
                  <HiSparkles />
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
                <HiSparkles />
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
          <button
            type="button"
            className="ud-chat-add-btn"
            title="More options"
            aria-label="More chat options"
          >
            <FaPlus />
          </button>
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
              placeholder={isRecording ? "Listening…" : "Type your question"}
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
            disabled={isLoading}
            aria-label={newMessage.trim() ? "Send message" : "AI voice input"}
          >
            {newMessage.trim() ? <FaPaperPlane /> : <FaWaveSquare />}
          </button>
        </div>
      </div>
    </div>
  );
}
