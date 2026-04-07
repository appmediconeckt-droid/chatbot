import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../../../../axiosConfig";
import "./VoiceCallModal.css";

const ACTIVE_STATUSES = new Set(["active", "connected"]);
const TERMINAL_STATUSES = new Set([
  "ended",
  "rejected",
  "cancelled",
  "missed",
  "failed",
  "microphone_error",
]);

const RTC_CONFIGURATION = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const normalizeUserType = (userType) => {
  if (!userType) return "user";
  return userType === "counsellor" ? "counselor" : userType;
};

const normalizeCallStatus = (status) => {
  if (!status) return "pending";
  const normalized = String(status).toLowerCase();
  return normalized === "accepted" ? "active" : normalized;
};

const isConnectedStatus = (status) =>
  ACTIVE_STATUSES.has(normalizeCallStatus(status));
const isTerminalStatus = (status) =>
  TERMINAL_STATUSES.has(normalizeCallStatus(status));

const VoiceCallModal = ({
  isOpen,
  onClose,
  callData,
  currentUser,
  onEndCall,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallActive, setIsCallActive] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState("good");
  const [showSettings, setShowSettings] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(70);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isRemoteAudioReady, setIsRemoteAudioReady] = useState(false);
  const [webrtcError, setWebrtcError] = useState("");

  const [callerInfo, setCallerInfo] = useState({
    name: "",
    id: "",
    email: "",
    phone: "",
    specialization: "",
    profilePic: "",
  });

  const [userInfo, setUserInfo] = useState({
    name: "",
    id: "",
    email: "",
    phone: "",
    role: "",
  });

  const [callMetadata, setCallMetadata] = useState({
    callId: "",
    roomId: "",
    type: "voice",
    status: "connecting",
    startTime: null,
    chatId: "",
    apiCallData: null,
    isFallback: false,
  });

  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const animationFrameRef = useRef(null);

  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localUserIdRef = useRef("");
  const remoteUserIdRef = useRef("");
  const hasStartedConnectionRef = useRef(false);

  const stopVisualizer = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch (error) {
        console.warn("Visualizer source disconnect failed:", error);
      }
      sourceNodeRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  const cleanupRealtimeConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      try {
        peerConnectionRef.current.close();
      } catch (error) {
        console.warn("Peer connection close failed:", error);
      }
      peerConnectionRef.current = null;
    }

    if (socketRef.current) {
      try {
        if (callMetadata.callId && localUserIdRef.current) {
          socketRef.current.emit("leave-call", {
            callId: callMetadata.callId,
            userId: localUserIdRef.current,
          });
        }
      } catch (error) {
        console.warn("Socket leave-call failed:", error);
      }

      socketRef.current.off("connect");
      socketRef.current.off("offer");
      socketRef.current.off("answer");
      socketRef.current.off("ice-candidate");
      socketRef.current.off("user-joined");
      socketRef.current.off("user-left");
      socketRef.current.off("connect_error");
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    setIsRemoteAudioReady(false);
    hasStartedConnectionRef.current = false;
  }, [callMetadata.callId]);

  // Process callData when modal opens
  useEffect(() => {
    if (isOpen && callData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCallerInfo({
        name: callData.counselorName || callData.name || "Counselor",
        id: callData.counselorId || callData.id,
        email: callData.counselorEmail || callData.email,
        phone: callData.counselorPhone || callData.phoneNumber,
        specialization:
          callData.counselorSpecialization || "Mental Health Professional",
        profilePic: callData.profilePic || callData.avatar,
      });

      if (currentUser) {
        setUserInfo({
          name: currentUser.name || currentUser.fullName || "User",
          id: currentUser.id || currentUser._id,
          email: currentUser.email,
          phone: currentUser.phoneNumber || currentUser.phone,
          role: currentUser.role || "user",
        });
      } else if (callData.userName) {
        setUserInfo({
          name: callData.userName,
          id: callData.userId,
          email: callData.userEmail,
          phone: callData.userPhone,
          role: "user",
        });
      }

      const normalizedStatus = normalizeCallStatus(callData.status);

      setCallMetadata({
        callId: callData.callId || `call_${Date.now()}`,
        roomId: callData.roomId || `room_${Date.now()}`,
        type: callData.type || "voice",
        status: normalizedStatus,
        startTime: callData.startTime || new Date().toISOString(),
        chatId: callData.chatId,
        apiCallData: callData.apiCallData || null,
        isFallback: callData.isFallback || false,
      });

      setCallDuration(0);
      setIsConnecting(
        !isConnectedStatus(normalizedStatus) &&
          !isTerminalStatus(normalizedStatus),
      );
      setWebrtcError("");
      hasStartedConnectionRef.current = false;
    }
  }, [isOpen, callData, currentUser]);

  useEffect(() => {
    if (!isOpen) return;

    const normalizedStatus = normalizeCallStatus(callMetadata.status);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsConnecting(
      !isConnectedStatus(normalizedStatus) &&
        !isTerminalStatus(normalizedStatus),
    );
  }, [isOpen, callMetadata.status]);

  useEffect(() => {
    if (!isOpen || !callMetadata.callId) return;

    const token = localStorage.getItem("token");
    const localUserId =
      currentUser?.id ||
      currentUser?._id ||
      callData?.currentUserId ||
      localStorage.getItem("userId") ||
      localStorage.getItem("counsellorId") ||
      localStorage.getItem("counselorId");
    const localUserType = normalizeUserType(
      currentUser?.role ||
        callData?.currentUserType ||
        localStorage.getItem("userRole") ||
        (localStorage.getItem("counsellorId") ||
        localStorage.getItem("counselorId")
          ? "counselor"
          : "user"),
    );

    if (!token || !localUserId) return;

    let isMounted = true;

    const syncCallState = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/video/calls/${callMetadata.callId}/details`,
          {
            params: {
              userId: localUserId,
              userType: localUserType,
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!isMounted || !response.data?.success || !response.data?.call) {
          return;
        }

        const serverCall = response.data.call;
        const normalizedStatus = normalizeCallStatus(serverCall.status);
        const isInitiator =
          String(serverCall.initiator?.id) === String(localUserId);
        const otherParticipant = isInitiator
          ? serverCall.receiver
          : serverCall.initiator;
        const specialization = Array.isArray(otherParticipant?.specialization)
          ? otherParticipant.specialization.join(", ")
          : otherParticipant?.specialization || "";

        setCallMetadata((prev) => ({
          ...prev,
          callId: serverCall.id || prev.callId,
          roomId: serverCall.roomId || prev.roomId,
          type: serverCall.type || prev.type,
          status: normalizedStatus,
          startTime:
            serverCall.startTime || serverCall.acceptedAt || prev.startTime,
          apiCallData: serverCall,
        }));

        if (otherParticipant) {
          setCallerInfo((prev) => ({
            ...prev,
            name:
              otherParticipant.displayName ||
              otherParticipant.fullName ||
              prev.name,
            id: otherParticipant.id || prev.id,
            email: otherParticipant.email || prev.email,
            phone:
              otherParticipant.phoneNumber ||
              otherParticipant.phone ||
              prev.phone,
            specialization: specialization || prev.specialization,
            profilePic: otherParticipant.profilePhoto || prev.profilePic,
          }));
        }
      } catch (error) {
        console.error("Error syncing voice call status:", error);
      }
    };

    syncCallState();
    const interval = setInterval(syncCallState, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, callMetadata.callId, currentUser, callData]);

  // Call duration timer
  useEffect(() => {
    let timer;
    if (
      isOpen &&
      isCallActive &&
      callMetadata.startTime &&
      isConnectedStatus(callMetadata.status)
    ) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, isCallActive, callMetadata.startTime, callMetadata.status]);

  // Simulate connection quality changes
  useEffect(() => {
    if (isOpen && isCallActive) {
      const qualityInterval = setInterval(() => {
        const qualities = ["good", "medium", "poor"];
        const randomQuality =
          qualities[Math.floor(Math.random() * qualities.length)];
        setConnectionQuality(randomQuality);
      }, 10000);
      return () => clearInterval(qualityInterval);
    }
    return undefined;
  }, [isOpen, isCallActive]);

  // Handle audio mute/unmute
  useEffect(() => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !isMuted;
      });
    }

    if (socketRef.current && callMetadata.callId && localUserIdRef.current) {
      socketRef.current.emit("toggle-audio", {
        callId: callMetadata.callId,
        userId: localUserIdRef.current,
        enabled: !isMuted,
      });
    }
  }, [isMuted, callMetadata.callId]);

  useEffect(() => {
    if (!remoteAudioRef.current) return;

    const element = remoteAudioRef.current;
    element.volume = Math.max(0, Math.min(1, Number(volumeLevel) / 100));
    element.muted = !isSpeakerOn;
  }, [volumeLevel, isSpeakerOn]);

  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsMuted(false);
      setIsSpeakerOn(true);
      setCallDuration(0);
      setIsCallActive(true);
      setIsRecording(false);
      setShowSettings(false);
      setIsConnecting(true);
      setCallMetadata((prev) => ({ ...prev, status: "ended" }));
      setWebrtcError("");

      cleanupRealtimeConnection();

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }

      stopVisualizer();
      setAudioLevel(0);
    }
  }, [isOpen, cleanupRealtimeConnection, stopVisualizer]);

  const initializeAudio = useCallback(async () => {
    try {
      if (mediaStreamRef.current) {
        return mediaStreamRef.current;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !isMuted;
      });

      stopVisualizer();

      audioContextRef.current = new (
        window.AudioContext || window.webkitAudioContext
      )();
      sourceNodeRef.current =
        audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      sourceNodeRef.current.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const level = Math.min(100, (average / 255) * 100);
        setAudioLevel(level);
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };

      updateAudioLevel();
      return stream;
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setCallMetadata((prev) => ({ ...prev, status: "microphone_error" }));
      return null;
    }
  }, [isMuted, stopVisualizer]);

  const establishVoiceConnection = useCallback(async () => {
    if (hasStartedConnectionRef.current) return;

    const callId = callMetadata.callId;
    if (
      !callId ||
      !isConnectedStatus(callMetadata.status) ||
      isTerminalStatus(callMetadata.status)
    ) {
      return;
    }

    const localUserId =
      currentUser?.id ||
      currentUser?._id ||
      callData?.currentUserId ||
      userInfo.id ||
      localStorage.getItem("userId") ||
      localStorage.getItem("counsellorId") ||
      localStorage.getItem("counselorId");

    if (!localUserId) {
      setWebrtcError("Unable to identify current user for voice call.");
      return;
    }

    const serverCall = callMetadata.apiCallData || callData?.apiCallData || {};
    const initiatorId =
      serverCall?.initiator?.id ||
      callData?.initiator?.id ||
      callData?.initiatorId;
    const receiverId =
      serverCall?.receiver?.id ||
      callData?.receiver?.id ||
      callData?.receiverId;

    if (!initiatorId || !receiverId) {
      return;
    }

    const isLocalInitiator = String(initiatorId) === String(localUserId);
    const remoteUserId = isLocalInitiator ? receiverId : initiatorId;

    localUserIdRef.current = String(localUserId);
    remoteUserIdRef.current = String(remoteUserId);

    const localStream = await initializeAudio();
    if (!localStream) return;

    const token = localStorage.getItem("token") || undefined;

    const socket = io(API_BASE_URL, {
      auth: token ? { token } : undefined,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    const peer = new RTCPeerConnection(RTC_CONFIGURATION);
    peerConnectionRef.current = peer;

    localStream.getTracks().forEach((track) => {
      peer.addTrack(track, localStream);
    });

    const sendOffer = async () => {
      if (
        !peerConnectionRef.current ||
        peerConnectionRef.current.signalingState !== "stable"
      ) {
        return;
      }

      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveAudio: true,
      });
      await peerConnectionRef.current.setLocalDescription(offer);

      socket.emit("offer", {
        callId,
        offer,
        userId: localUserIdRef.current,
      });
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          callId,
          candidate: event.candidate,
          userId: localUserIdRef.current,
        });
      }
    };

    peer.ontrack = (event) => {
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
      }

      event.streams[0].getTracks().forEach((track) => {
        remoteStreamRef.current.addTrack(track);
      });

      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStreamRef.current;
        remoteAudioRef.current
          .play()
          .then(() => {
            setIsRemoteAudioReady(true);
            setIsConnecting(false);
            setWebrtcError("");
          })
          .catch((error) => {
            console.warn("Remote audio autoplay blocked:", error);
            setWebrtcError("Tap speaker button once to enable audio playback.");
          });
      }
    };

    peer.onconnectionstatechange = () => {
      const state = peer.connectionState;
      if (state === "connected") {
        setIsConnecting(false);
      }

      if (state === "failed" || state === "disconnected") {
        setWebrtcError("Voice connection interrupted.");
      }
    };

    socket.on("connect", async () => {
      socket.emit("join-call", {
        callId,
        userId: localUserIdRef.current,
      });

      if (isLocalInitiator) {
        await sendOffer();
      }
    });

    socket.on("user-joined", async ({ userId }) => {
      if (!isLocalInitiator) return;
      if (String(userId) === String(localUserIdRef.current)) return;
      await sendOffer();
    });

    socket.on("offer", async ({ offer, userId, from }) => {
      const senderId = String(userId || from || "");
      if (!offer || senderId === String(localUserIdRef.current)) return;
      if (!peerConnectionRef.current) return;

      try {
        if (peerConnectionRef.current.signalingState !== "stable") {
          await peerConnectionRef.current.setLocalDescription({
            type: "rollback",
          });
        }

        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(offer),
        );

        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        socket.emit("answer", {
          callId,
          answer,
          userId: localUserIdRef.current,
        });
      } catch (error) {
        console.error("Failed to handle offer:", error);
        setWebrtcError("Could not establish voice channel.");
      }
    });

    socket.on("answer", async ({ answer, userId, from }) => {
      const senderId = String(userId || from || "");
      if (!answer || senderId === String(localUserIdRef.current)) return;
      if (!peerConnectionRef.current) return;

      try {
        if (!peerConnectionRef.current.currentRemoteDescription) {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(answer),
          );
        }
      } catch (error) {
        console.error("Failed to handle answer:", error);
        setWebrtcError("Voice answer sync failed.");
      }
    });

    socket.on("ice-candidate", async ({ candidate, userId, from }) => {
      const senderId = String(userId || from || "");
      if (!candidate || senderId === String(localUserIdRef.current)) return;
      if (!peerConnectionRef.current) return;

      try {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate),
        );
      } catch (error) {
        console.warn("Failed to add ICE candidate:", error);
      }
    });

    socket.on("user-left", ({ userId }) => {
      if (String(userId) === String(localUserIdRef.current)) return;
      setIsRemoteAudioReady(false);
      setWebrtcError("Other participant left the call.");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connect error:", error);
      setWebrtcError("Unable to connect realtime voice service.");
    });

    hasStartedConnectionRef.current = true;
  }, [
    callMetadata.callId,
    callMetadata.status,
    callMetadata.apiCallData,
    callData,
    currentUser,
    userInfo.id,
    initializeAudio,
  ]);

  useEffect(() => {
    if (
      isOpen &&
      isCallActive &&
      isConnectedStatus(callMetadata.status) &&
      !isTerminalStatus(callMetadata.status)
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      establishVoiceConnection();
    }
  }, [
    isOpen,
    isCallActive,
    callMetadata.status,
    callMetadata.callId,
    establishVoiceConnection,
  ]);

  useEffect(() => {
    return () => {
      cleanupRealtimeConnection();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      stopVisualizer();
    };
  }, [cleanupRealtimeConnection, stopVisualizer]);

  const handleEndCall = async () => {
    setIsCallActive(false);
    setCallMetadata((prev) => ({ ...prev, status: "ended" }));

    cleanupRealtimeConnection();

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    stopVisualizer();

    if (onEndCall && callMetadata.callId) {
      try {
        await onEndCall(callMetadata.callId);
      } catch (error) {
        console.error("Error ending voice call:", error);
      }
    }

    setTimeout(() => {
      onClose();
    }, 500);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
      }, 30000);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getQualityIcon = () => {
    switch (connectionQuality) {
      case "good":
        return "📶";
      case "medium":
        return "📶";
      case "poor":
        return "📶";
      default:
        return "📶";
    }
  };

  const getQualityClass = () => {
    switch (connectionQuality) {
      case "good":
        return "quality-good";
      case "medium":
        return "quality-medium";
      case "poor":
        return "quality-poor";
      default:
        return "quality-good";
    }
  };

  const getCallStatusDisplay = () => {
    if (webrtcError) {
      return webrtcError;
    }

    if (isConnecting) {
      return callMetadata.status === "pending" ||
        callMetadata.status === "ringing"
        ? "Waiting for counselor to accept..."
        : "Connecting...";
    }

    if (isConnectedStatus(callMetadata.status) && !isRemoteAudioReady) {
      return "Connected. Waiting for audio...";
    }

    switch (callMetadata.status) {
      case "active":
      case "connected":
        return "Connected";
      case "pending":
      case "ringing":
        return "Waiting for counselor to accept...";
      case "rejected":
        return "Call Declined";
      case "cancelled":
        return "Call Cancelled";
      case "ended":
        return "Call Ended";
      case "microphone_error":
        return "Microphone Error";
      default:
        return callMetadata.status;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="voice-modal-overlay">
      <div
        className="voice-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <audio ref={remoteAudioRef} autoPlay playsInline />

        <div className="voice-modal-header">
          <div className="header-left">
            <span className="header-icon">📞</span>
            <div className="call-info">
              <h3>Voice Call with {callerInfo.name}</h3>
              {callerInfo.specialization && (
                <p className="caller-specialization">
                  {callerInfo.specialization}
                </p>
              )}
              <div className={`connection-quality ${getQualityClass()}`}>
                <span className="quality-icon">{getQualityIcon()}</span>
                <span className="quality-text">{connectionQuality}</span>
              </div>
            </div>
          </div>
          <div className="header-right">
            <button
              className="header-btn close-btn"
              onClick={onClose}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="voice-modal-content">
          <div className="voice-call-container">
            <div className="caller-profile">
              {callerInfo.profilePic &&
              (callerInfo.profilePic.startsWith("http") ||
                callerInfo.profilePic.startsWith("/")) ? (
                <img
                  src={callerInfo.profilePic}
                  alt={callerInfo.name}
                  className="caller-avatar-image"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentElement.innerHTML = `<span class="caller-avatar">${callerInfo.name.charAt(0)}</span>`;
                  }}
                />
              ) : (
                <div className="caller-avatar">
                  {callerInfo.profilePic || callerInfo.name.charAt(0)}
                </div>
              )}
              <h2 className="caller-name">{callerInfo.name}</h2>
              {callerInfo.specialization && (
                <p className="caller-specialization-text">
                  {callerInfo.specialization}
                </p>
              )}
              <p className="call-status">
                <span className={`status-${callMetadata.status}`}>
                  {isConnectedStatus(callMetadata.status) && (
                    <span className="pulse-dot"></span>
                  )}
                  {getCallStatusDisplay()}
                </span>
              </p>
              {isCallActive && isConnectedStatus(callMetadata.status) && (
                <div className="call-duration">
                  <span className="duration-icon">⏱️</span>
                  <span className="duration-text">
                    {formatTime(callDuration)}
                  </span>
                </div>
              )}
              {callMetadata.isFallback && (
                <p className="fallback-warning">⚠️ Using fallback connection</p>
              )}
            </div>

            {!isConnecting && isConnectedStatus(callMetadata.status) && (
              <div className="audio-visualizer">
                <div className="visualizer-bars">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="visualizer-bar"
                      style={{
                        height: `${Math.max(5, Math.min(50, (audioLevel * (i + 1)) / 20))}px`,
                        opacity: isMuted ? 0.3 : 1,
                      }}
                    />
                  ))}
                </div>
                {isMuted && (
                  <div className="muted-badge">
                    <span>🔇 Microphone Muted</span>
                  </div>
                )}
                {isRecording && (
                  <div className="recording-badge">
                    <span className="recording-dot"></span>
                    <span>Recording</span>
                  </div>
                )}
              </div>
            )}

            {showSettings && (
              <div className="settings-panel">
                <h4>Call Settings</h4>
                <div className="setting-item">
                  <label>Volume</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volumeLevel}
                    onChange={(e) => setVolumeLevel(e.target.value)}
                  />
                  <span>{volumeLevel}%</span>
                </div>
                <div className="setting-item">
                  <label>Call Information</label>
                  <div className="caller-info-display">
                    <p>
                      <strong>Counselor:</strong> {callerInfo.name}
                    </p>
                    {callerInfo.specialization && (
                      <p>
                        <strong>Specialization:</strong>{" "}
                        {callerInfo.specialization}
                      </p>
                    )}
                    {callerInfo.email && (
                      <p>
                        <strong>Email:</strong> {callerInfo.email}
                      </p>
                    )}
                    {callerInfo.phone && (
                      <p>
                        <strong>Phone:</strong> {callerInfo.phone}
                      </p>
                    )}

                    <p>
                      <strong>User:</strong> {userInfo.name}
                    </p>
                    {userInfo.email && (
                      <p>
                        <strong>User Email:</strong> {userInfo.email}
                      </p>
                    )}

                    <p>
                      <strong>Call Type:</strong> 📞 Voice Call
                    </p>
                    <p>
                      <strong>Duration:</strong> {formatTime(callDuration)}
                    </p>
                    {callMetadata.roomId && (
                      <p>
                        <strong>Room ID:</strong>{" "}
                        {callMetadata.roomId.substring(0, 8)}...
                      </p>
                    )}
                    {callMetadata.callId && (
                      <p>
                        <strong>Call ID:</strong>{" "}
                        {callMetadata.callId.substring(0, 8)}...
                      </p>
                    )}
                    {callMetadata.chatId && (
                      <p>
                        <strong>Chat ID:</strong>{" "}
                        {callMetadata.chatId.substring(0, 8)}...
                      </p>
                    )}
                  </div>
                </div>
                <button
                  className="close-settings"
                  onClick={() => setShowSettings(false)}
                >
                  Close
                </button>
              </div>
            )}

            <div className="voice-call-controls">
              <button
                className={`control-btn ${isMuted ? "active" : ""}`}
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? "Unmute" : "Mute"}
              >
                <span className="btn-icon">{isMuted ? "🔇" : "🎤"}</span>
                <span className="btn-label">{isMuted ? "Unmute" : "Mute"}</span>
              </button>

              <button
                className={`control-btn ${isSpeakerOn ? "active" : ""}`}
                onClick={() => {
                  setIsSpeakerOn(!isSpeakerOn);
                  if (remoteAudioRef.current && !isSpeakerOn) {
                    remoteAudioRef.current
                      .play()
                      .then(() => setWebrtcError(""))
                      .catch(() => {
                        setWebrtcError("Tap again to enable audio playback.");
                      });
                  }
                }}
                title={isSpeakerOn ? "Speaker off" : "Speaker on"}
              >
                <span className="btn-icon">{isSpeakerOn ? "🔊" : "🔈"}</span>
                <span className="btn-label">
                  {isSpeakerOn ? "Speaker" : "Earpiece"}
                </span>
              </button>

              <button
                className={`control-btn ${isRecording ? "active" : ""}`}
                onClick={toggleRecording}
                title={isRecording ? "Stop recording" : "Record call"}
              >
                <span className="btn-icon">{isRecording ? "⏹️" : "🔴"}</span>
                <span className="btn-label">
                  {isRecording ? "Stop" : "Record"}
                </span>
              </button>

              <button
                className="control-btn"
                onClick={() => setShowSettings(!showSettings)}
                title="Settings"
              >
                <span className="btn-icon">⚙️</span>
                <span className="btn-label">Settings</span>
              </button>

              <button
                className="control-btn end-call"
                onClick={handleEndCall}
                title="End call"
              >
                <span className="btn-icon">📞</span>
                <span className="btn-label">End</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceCallModal;
