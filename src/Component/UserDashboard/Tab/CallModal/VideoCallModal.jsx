import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../../../../axiosConfig";
import { RTC_CONFIGURATION } from "../../../../rtcConfig";
import "./VideoCallModal.css";

const ACTIVE = new Set(["active", "connected"]);
const TERMINAL = new Set([
  "ended",
  "completed",
  "rejected",
  "cancelled",
  "missed",
  "failed",
  "camera_error",
  "no_camera",
]);

const MAX_RECONNECT_ATTEMPTS = 4;
const RECONNECT_BASE_DELAY_MS = 1500;

const normalizeStatus = (status) => {
  if (!status) return "connecting";
  const normalized = String(status).toLowerCase();
  if (normalized === "accepted") return "active";
  if (normalized === "completed") return "ended";
  return normalized;
};

const isConnectedStatus = (status) => ACTIVE.has(normalizeStatus(status));
const isTerminalStatus = (status) => TERMINAL.has(normalizeStatus(status));

const normalizeUserType = (userType) => {
  if (!userType) return "user";
  return userType === "counsellor" ? "counselor" : userType;
};

const VideoCallModal = ({
  isOpen,
  onClose,
  callData,
  currentUser,
  onEndCall,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isCameraSwitched, setIsCameraSwitched] = useState(false);
  const [isCallActive, setIsCallActive] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(70);
  const [callDuration, setCallDuration] = useState(0);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [currentCamera, setCurrentCamera] = useState("");

  const [callerName, setCallerName] = useState("Counselor");
  const [callerProfilePic, setCallerProfilePic] = useState("C");
  const [callerPhoneNumber, setCallerPhoneNumber] = useState("");
  const [callStatus, setCallStatus] = useState("connecting");
  const [callId, setCallId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [callStartTime, setCallStartTime] = useState(null);
  const [apiCallData, setApiCallData] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isRemoteVideoReady, setIsRemoteVideoReady] = useState(false);
  const [webrtcError, setWebrtcError] = useState("");

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const pendingIceRef = useRef([]);
  const startedRef = useRef(false);
  const localUserIdRef = useRef("");
  const remoteUserIdRef = useRef("");
  const hasEverConnectedRef = useRef(false);
  const isManualCloseRef = useRef(false);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const establishConnectionRef = useRef(null);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const resetReconnectState = useCallback(() => {
    clearReconnectTimer();
    reconnectAttemptsRef.current = 0;
    setIsReconnecting(false);
  }, [clearReconnectTimer]);

  const setLocalPreview = useCallback((stream) => {
    if (!localVideoRef.current) return;
    localVideoRef.current.srcObject = stream;
    localVideoRef.current.play().catch(() => {});
  }, []);

  const updateRemoteState = useCallback(() => {
    const videoTracks = remoteStreamRef.current?.getVideoTracks?.() || [];
    const hasLiveVideo = videoTracks.some(
      (track) => track.readyState === "live",
    );
    const hasAnyTrack = videoTracks.length > 0;

    const shouldMarkReady =
      hasLiveVideo ||
      (hasAnyTrack && peerRef.current?.connectionState === "connected");

    setIsRemoteVideoReady(shouldMarkReady);

    if (shouldMarkReady) {
      hasEverConnectedRef.current = true;
      setIsConnecting(false);
      setIsReconnecting(false);
      resetReconnectState();
      setWebrtcError("");
    }
  }, [resetReconnectState]);

  const cleanupRealtime = useCallback(
    ({ emitLeave = true } = {}) => {
      if (peerRef.current) {
        peerRef.current.onicecandidate = null;
        peerRef.current.ontrack = null;
        peerRef.current.onconnectionstatechange = null;
        peerRef.current.onnegotiationneeded = null;
        try {
          peerRef.current.close();
        } catch {}
        peerRef.current = null;
      }

      if (socketRef.current) {
        try {
          if (emitLeave && callId && localUserIdRef.current) {
            socketRef.current.emit("leave-call", {
              callId,
              userId: localUserIdRef.current,
            });
          }
        } catch {}

        [
          "connect",
          "offer",
          "answer",
          "call-offer",
          "call-answer",
          "ice-candidate",
          "user-joined",
          "user-left",
          "user-left-call",
          "call_ended",
          "call-ended",
          "call-status-update",
          "connect_error",
          "disconnect",
        ].forEach((eventName) => socketRef.current.off(eventName));

        socketRef.current.disconnect();
        socketRef.current = null;
      }

      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach((track) => track.stop());
        remoteStreamRef.current = null;
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }

      pendingIceRef.current = [];
      startedRef.current = false;
      setIsRemoteVideoReady(false);
    },
    [callId],
  );

  const replaceOutgoingTracks = useCallback((stream) => {
    if (!peerRef.current || !stream) return;

    const tracksByKind = stream.getTracks().reduce((acc, track) => {
      acc[track.kind] = track;
      return acc;
    }, {});

    const handledKinds = new Set();
    peerRef.current.getSenders().forEach((sender) => {
      const kind = sender.track?.kind;
      if (!kind) return;
      handledKinds.add(kind);
      sender.replaceTrack(tracksByKind[kind] || null).catch(() => {});
    });

    stream.getTracks().forEach((track) => {
      if (!handledKinds.has(track.kind)) {
        peerRef.current.addTrack(track, stream);
      }
    });
  }, []);

  // initializeCamera — does NOT depend on isMuted or isVideoEnabled
  // to prevent re-acquisition when the user toggles mute/video.
  const initializeCameraRef = useRef(null);
  const initializeCamera = useCallback(
    async (useBackCamera = false, selectedDeviceId = "") => {
      try {
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => track.stop());
        }

        const constraints = {
          video: selectedDeviceId
            ? {
                deviceId: { exact: selectedDeviceId },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              }
            : {
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                facingMode: useBackCamera ? "environment" : "user",
              },
          audio: true,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        localStreamRef.current = stream;
        setLocalPreview(stream);
        replaceOutgoingTracks(stream);

        const settings = stream.getVideoTracks()[0]?.getSettings?.() || {};
        if (settings.deviceId) setCurrentCamera(settings.deviceId);
        return stream;
      } catch (error) {
        console.error("Camera access error:", error);
        setCallStatus("camera_error");
        setWebrtcError("Unable to access camera.");
        return null;
      }
    },
    [replaceOutgoingTracks, setLocalPreview],
  );

  // Keep ref in sync for reconnect
  initializeCameraRef.current = initializeCamera;

  const getAvailableCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((device) => device.kind === "videoinput");
      setAvailableCameras(cameras);
      if (cameras[0]) setCurrentCamera(cameras[0].deviceId);
    } catch (error) {
      console.error("Error listing cameras:", error);
    }
  }, []);

  // Reconnect scheduler — mirrors VoiceCallModal logic
  const scheduleReconnect = useCallback(
    (reason = "Network issue") => {
      if (isManualCloseRef.current || !isOpen || !isCallActive) return;
      if (!hasEverConnectedRef.current) return;
      if (
        !callId ||
        !isConnectedStatus(callStatus) ||
        isTerminalStatus(callStatus)
      )
        return;
      if (reconnectTimeoutRef.current) return;

      const nextAttempt = reconnectAttemptsRef.current + 1;
      if (nextAttempt > MAX_RECONNECT_ATTEMPTS) {
        setIsReconnecting(false);
        setWebrtcError("Video call connection lost. Please call again.");
        return;
      }

      reconnectAttemptsRef.current = nextAttempt;
      setIsReconnecting(true);
      setIsConnecting(true);
      setIsRemoteVideoReady(false);
      setWebrtcError(
        `${reason}. Reconnecting... (${nextAttempt}/${MAX_RECONNECT_ATTEMPTS})`,
      );

      const delay = Math.min(RECONNECT_BASE_DELAY_MS * nextAttempt, 7000);

      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;
        cleanupRealtime({ emitLeave: false });
        startedRef.current = false;
        if (typeof establishConnectionRef.current === "function") {
          establishConnectionRef.current();
        }
      }, delay);
    },
    [cleanupRealtime, isCallActive, isOpen, callId, callStatus],
  );

  const establishConnection = useCallback(async () => {
    if (startedRef.current || !callId || !isConnectedStatus(callStatus)) return;

    const localUserId =
      currentUser?.id ||
      currentUser?._id ||
      callData?.currentUserId ||
      localStorage.getItem("userId") ||
      localStorage.getItem("counsellorId") ||
      localStorage.getItem("counselorId");
    if (!localUserId) return;

    const serverCall = apiCallData || callData?.apiCallData || {};
    const initiatorId =
      serverCall?.initiator?.id ||
      callData?.initiator?.id ||
      callData?.initiatorId;
    const receiverId =
      serverCall?.receiver?.id ||
      callData?.receiver?.id ||
      callData?.receiverId;
    if (!initiatorId || !receiverId) return;

    localUserIdRef.current = String(localUserId);
    remoteUserIdRef.current =
      String(initiatorId) === String(localUserId)
        ? String(receiverId)
        : String(initiatorId);

    const localStream =
      localStreamRef.current ||
      (await initializeCameraRef.current(isCameraSwitched));
    if (!localStream) return;

    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      undefined;

    const socket = io(API_BASE_URL, {
      auth: token ? { token } : undefined,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    const peer = new RTCPeerConnection(RTC_CONFIGURATION);
    peerRef.current = peer;
    localStream
      .getTracks()
      .forEach((track) => peer.addTrack(track, localStream));

    const flushIceQueue = async () => {
      if (!peerRef.current?.remoteDescription) return;
      const queue = [...pendingIceRef.current];
      pendingIceRef.current = [];
      for (const candidate of queue) {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {}
      }
    };

    const sendOffer = async () => {
      if (!peerRef.current || peerRef.current.signalingState !== "stable")
        return;
      const offer = await peerRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await peerRef.current.setLocalDescription(offer);
      socket.emit("call-offer", { callId, offer, to: remoteUserIdRef.current });
    };

    peer.onicecandidate = (event) => {
      if (!event.candidate) return;
      socket.emit("ice-candidate", {
        callId,
        candidate: event.candidate,
        userId: localUserIdRef.current,
        to: remoteUserIdRef.current,
      });
    };

    peer.ontrack = async (event) => {
      const [incomingStream] = event.streams;
      if (incomingStream) {
        remoteStreamRef.current = incomingStream;
      } else {
        if (!remoteStreamRef.current)
          remoteStreamRef.current = new MediaStream();
        remoteStreamRef.current.addTrack(event.track);
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
        await remoteVideoRef.current.play().catch(() => {});
      }

      updateRemoteState();
    };

    peer.onconnectionstatechange = () => {
      const state = peer.connectionState;
      if (state === "connected") {
        hasEverConnectedRef.current = true;
        setIsConnecting(false);
        setIsReconnecting(false);
        resetReconnectState();
        setWebrtcError("");
        updateRemoteState();
        if (remoteVideoRef.current && remoteStreamRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
          remoteVideoRef.current.play().catch(() => {});
        }
      }
      if (state === "failed" || state === "disconnected") {
        setWebrtcError("Video connection interrupted.");
        scheduleReconnect("Video connection interrupted");
      }
    };

    socket.on("connect", () => {
      resetReconnectState();
      if (peerRef.current && peerRef.current.connectionState === "connected") {
        setIsConnecting(false);
      }
      socket.emit("join-call", { callId, userId: localUserIdRef.current });
    });

    socket.on("user-joined", async ({ userId }) => {
      if (String(userId) === localUserIdRef.current) return;
      if (peerRef.current?.connectionState === "connected") return;
      await sendOffer();
    });

    const onOffer = async ({ offer, userId, from }) => {
      const senderId = String(userId || from || "");
      if (!offer || senderId === localUserIdRef.current || !peerRef.current)
        return;
      try {
        if (peerRef.current.signalingState !== "stable") {
          await peerRef.current.setLocalDescription({ type: "rollback" });
        }
        await peerRef.current.setRemoteDescription(
          new RTCSessionDescription(offer),
        );
        await flushIceQueue();
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        socket.emit("call-answer", {
          callId,
          answer,
          to: remoteUserIdRef.current,
        });
      } catch {
        setWebrtcError("Failed to process call offer.");
      }
    };

    const onAnswer = async ({ answer, userId, from }) => {
      const senderId = String(userId || from || "");
      if (!answer || senderId === localUserIdRef.current || !peerRef.current)
        return;
      try {
        if (!peerRef.current.currentRemoteDescription) {
          await peerRef.current.setRemoteDescription(
            new RTCSessionDescription(answer),
          );
          await flushIceQueue();
        }
      } catch {
        setWebrtcError("Failed to process call answer.");
      }
    };

    const handleRemoteCallEnded = ({ callId: endedCallId, endedBy } = {}) => {
      if (endedCallId && String(endedCallId) !== String(callId)) return;

      isManualCloseRef.current = true;
      resetReconnectState();
      hasEverConnectedRef.current = false;
      setIsCallActive(false);
      setCallStatus("ended");
      setIsConnecting(false);
      setIsRemoteVideoReady(false);
      setWebrtcError(
        endedBy
          ? `Call ended by ${endedBy}.`
          : "Call ended by other participant.",
      );

      cleanupRealtime();

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      setTimeout(() => onClose(), 500);
    };

    socket.on("call-offer", onOffer);
    socket.on("offer", onOffer);
    socket.on("call-answer", onAnswer);
    socket.on("answer", onAnswer);
    socket.on("call_ended", handleRemoteCallEnded);
    socket.on("call-ended", handleRemoteCallEnded);
    socket.on("call-status-update", ({ callId: updatedCallId, status }) => {
      if (String(updatedCallId) !== String(callId)) return;
      if (normalizeStatus(status) === "ended") {
        handleRemoteCallEnded({ callId: updatedCallId });
      }
    });

    socket.on("ice-candidate", async ({ candidate, userId, from }) => {
      const senderId = String(userId || from || "");
      if (!candidate || senderId === localUserIdRef.current || !peerRef.current)
        return;
      try {
        if (!peerRef.current.remoteDescription) {
          pendingIceRef.current.push(candidate);
          return;
        }
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        pendingIceRef.current.push(candidate);
      }
    });

    socket.on("user-left", ({ userId }) => {
      if (String(userId) !== localUserIdRef.current) {
        setIsRemoteVideoReady(false);
        setWebrtcError("Other participant left.");
      }
    });
    socket.on("user-left-call", ({ userId }) => {
      if (String(userId) !== localUserIdRef.current) {
        setIsRemoteVideoReady(false);
        setWebrtcError("Other participant left.");
      }
    });

    socket.on("connect_error", () => {
      if (hasEverConnectedRef.current) {
        scheduleReconnect("Realtime connection failed");
      } else {
        setWebrtcError("Realtime connection failed.");
      }
    });

    socket.on("disconnect", (reason) => {
      if (!isManualCloseRef.current && hasEverConnectedRef.current) {
        setWebrtcError(
          `Socket disconnected (${reason || "unknown"}). Reconnecting...`,
        );
        scheduleReconnect("Socket disconnected");
      }
    });

    startedRef.current = true;
  }, [
    apiCallData,
    callData,
    callId,
    callStatus,
    cleanupRealtime,
    currentUser,
    isCameraSwitched,
    onClose,
    resetReconnectState,
    scheduleReconnect,
    updateRemoteState,
  ]);

  // Keep ref in sync for reconnect
  useEffect(() => {
    establishConnectionRef.current = establishConnection;
  }, [establishConnection]);

  // Process callData when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const status = normalizeStatus(callData?.status || "connecting");
    setCallerName(callData?.name || "Counselor");
    setCallerProfilePic(callData?.profilePic || "C");
    setCallerPhoneNumber(callData?.phoneNumber || "");
    setCallStatus(status);
    setCallId(callData?.callId || callData?.id || "");
    setRoomId(callData?.roomId || "");
    setApiCallData(callData?.apiCallData || null);
    setCallStartTime(callData?.startTime || new Date());
    setCallDuration(0);
    setIsConnecting(!isConnectedStatus(status) && !isTerminalStatus(status));
    setIsRemoteVideoReady(false);
    setIsReconnecting(false);
    setWebrtcError("");
    startedRef.current = false;
    isManualCloseRef.current = false;
    hasEverConnectedRef.current = false;
    reconnectAttemptsRef.current = 0;
    clearReconnectTimer();
  }, [isOpen, callData, clearReconnectTimer]);

  // Initialize camera when modal opens (once)
  const cameraInitializedRef = useRef(false);
  useEffect(() => {
    if (isOpen && !cameraInitializedRef.current) {
      cameraInitializedRef.current = true;
      initializeCamera(false);
      getAvailableCameras();
    }
    if (!isOpen) {
      cameraInitializedRef.current = false;
    }
  }, [isOpen, getAvailableCameras, initializeCamera]);

  // Establish WebRTC connection
  useEffect(() => {
    if (
      isOpen &&
      isCallActive &&
      isConnectedStatus(callStatus) &&
      !isTerminalStatus(callStatus)
    ) {
      establishConnection();
    }
  }, [isOpen, isCallActive, callStatus, establishConnection]);

  // Sync call status from server
  useEffect(() => {
    if (!isOpen || !callId) return;
    const token =
      localStorage.getItem("token") || localStorage.getItem("accessToken");
    const userId =
      currentUser?.id ||
      currentUser?._id ||
      callData?.currentUserId ||
      localStorage.getItem("userId") ||
      localStorage.getItem("counsellorId") ||
      localStorage.getItem("counselorId");
    const userType = normalizeUserType(
      currentUser?.role ||
        callData?.currentUserType ||
        localStorage.getItem("userRole"),
    );
    if (!token || !userId) return;

    let mounted = true;
    const syncStatus = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/video/calls/${callId}/details`,
          {
            params: { userId, userType },
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!mounted || !response.data?.success || !response.data?.call) return;
        const call = response.data.call;
        const status = normalizeStatus(call.status);
        setCallStatus(status);
        setCallId((prev) => call.id || prev);
        setRoomId((prev) => call.roomId || prev);
        setApiCallData(call);
        setIsConnecting(
          !isConnectedStatus(status) && !isTerminalStatus(status),
        );
      } catch {}
    };

    syncStatus();
    const intervalId = setInterval(syncStatus, 3000);
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [isOpen, callId, currentUser, callData]);

  // Call duration timer
  useEffect(() => {
    if (
      !isOpen ||
      !isCallActive ||
      !callStartTime ||
      !isConnectedStatus(callStatus)
    )
      return;
    const timer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [isOpen, isCallActive, callStartTime, callStatus]);

  // Handle video enable/disable via track.enabled (no re-acquisition)
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = isVideoEnabled;
      });
    }
  }, [isVideoEnabled]);

  // Handle audio mute/unmute via track.enabled (no re-acquisition)
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  // Speaker / volume
  useEffect(() => {
    if (!remoteVideoRef.current) return;
    remoteVideoRef.current.muted = !isSpeakerOn;
    remoteVideoRef.current.volume = Math.max(
      0,
      Math.min(1, Number(volumeLevel) / 100),
    );
  }, [isSpeakerOn, volumeLevel]);

  // Cleanup when modal closes
  useEffect(() => {
    if (isOpen) return;
    isManualCloseRef.current = true;
    resetReconnectState();
    cleanupRealtime();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setIsMuted(false);
    setIsSpeakerOn(true);
    setIsVideoEnabled(true);
    setIsCameraSwitched(false);
    setIsRecording(false);
    setIsCallActive(true);
    setShowSettings(false);
    setIsScreenSharing(false);
    setCallStatus("ended");
    setCallId("");
    setRoomId("");
    setApiCallData(null);
    setIsReconnecting(false);
    setWebrtcError("");
    hasEverConnectedRef.current = false;
  }, [cleanupRealtime, isOpen, resetReconnectState]);

  // Unmount cleanup
  useEffect(
    () => () => {
      isManualCloseRef.current = true;
      clearReconnectTimer();
      cleanupRealtime();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
    },
    [cleanupRealtime, clearReconnectTimer],
  );

  const handleEndCall = async () => {
    isManualCloseRef.current = true;
    resetReconnectState();
    hasEverConnectedRef.current = false;
    setIsCallActive(false);
    setCallStatus("ended");
    cleanupRealtime();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    const endHandler = onEndCall || callData?.onEndCall;
    if (typeof endHandler === "function" && callId) {
      try {
        await endHandler(callId);
      } catch {}
    }

    setTimeout(() => onClose(), 500);
  };

  const switchCamera = async () => {
    const next = !isCameraSwitched;
    setIsCameraSwitched(next);
    await initializeCamera(next);
  };

  const selectCamera = async (deviceId) => {
    setCurrentCamera(deviceId);
    await initializeCamera(isCameraSwitched, deviceId);
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        const screenTrack = screenStream.getVideoTracks()[0];
        const audioTracks = localStreamRef.current
          ? localStreamRef.current.getAudioTracks()
          : [];
        const merged = new MediaStream([screenTrack, ...audioTracks]);
        localStreamRef.current = merged;
        setLocalPreview(merged);
        replaceOutgoingTracks(merged);
        setIsScreenSharing(true);

        screenTrack.onended = () => {
          setIsScreenSharing(false);
          initializeCamera(isCameraSwitched).catch(() => {});
        };
      } catch {}
      return;
    }

    setIsScreenSharing(false);
    await initializeCamera(isCameraSwitched);
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0)
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const getStatusText = () => {
    if (webrtcError) return webrtcError;
    if (isReconnecting) return "Reconnecting video call...";
    if (isConnecting) return "Connecting...";
    if (isConnectedStatus(callStatus) && !isRemoteVideoReady)
      return "Connected. Remote camera is not sending video.";
    if (isConnectedStatus(callStatus)) return "Connected";
    if (callStatus === "ringing" || callStatus === "pending")
      return "Waiting for participant...";
    if (callStatus === "ended") return "Call Ended";
    return callStatus;
  };

  if (!isOpen) return null;

  return (
    <div className={`video-modal-overlay ${isFullScreen ? "fullscreen" : ""}`}>
      <div
        className={`video-modal-container ${isFullScreen ? "fullscreen" : ""}`}
      >
        <div className="video-modal-header">
          <div className="header-left">
            <span className="header-icon">Video</span>
            <div className="call-info">
              <h3>Video Call with {callerName}</h3>
            </div>
          </div>
          <div className="header-right">
            <button
              className="header-btn"
              onClick={() => setIsFullScreen((prev) => !prev)}
            >
              {isFullScreen ? "Exit" : "Full"}
            </button>
            <button className="header-btn close-btn" onClick={onClose}>
              X
            </button>
          </div>
        </div>

        <div className="video-modal-content">
          <div className="video-main-area">
            <div className="remote-video-container">
              <video
                ref={remoteVideoRef}
                className={`remote-video ${isRemoteVideoReady ? "ready" : ""}`}
                autoPlay
                playsInline
              />
              {!isRemoteVideoReady && (
                <div className="remote-video-overlay">
                  <div className="remote-video-placeholder">
                    <span className="remote-avatar">
                      {callerProfilePic?.charAt?.(0) ||
                        callerName?.charAt?.(0) ||
                        "C"}
                    </span>
                    <div className="remote-info">
                      <h2>{callerName}</h2>
                      {roomId && (
                        <p className="room-id">
                          Room: {String(roomId).substring(0, 8)}...
                        </p>
                      )}
                      <p className="call-status">{getStatusText()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div
              className={`local-video-container ${!isVideoEnabled ? "video-off" : ""}`}
            >
              <video
                ref={localVideoRef}
                className="local-video"
                autoPlay
                playsInline
                muted
              />
              <div className="local-video-label">
                You ({isCameraSwitched ? "Back" : "Front"})
              </div>
            </div>

            <div className="call-duration-badge">
              {formatTime(callDuration)}
            </div>

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
                    onChange={(e) => setVolumeLevel(Number(e.target.value))}
                  />
                  <span>{volumeLevel}%</span>
                </div>
                {availableCameras.length > 0 && (
                  <div className="setting-item">
                    <label>Select Camera</label>
                    <select
                      value={currentCamera}
                      onChange={(e) => selectCamera(e.target.value)}
                    >
                      {availableCameras.map((camera) => (
                        <option key={camera.deviceId} value={camera.deviceId}>
                          {camera.label ||
                            `Camera ${camera.deviceId.slice(0, 6)}...`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {callerPhoneNumber && (
                  <div className="setting-item">
                    <label>Phone</label>
                    <p>{callerPhoneNumber}</p>
                  </div>
                )}
                <button
                  className="close-settings"
                  onClick={() => setShowSettings(false)}
                >
                  Close
                </button>
              </div>
            )}

            <div className="video-call-controls">
              <button
                className={`control-btn ${isMuted ? "active" : ""}`}
                onClick={() => setIsMuted((prev) => !prev)}
              >
                <span className="btn-label">{isMuted ? "Unmute" : "Mute"}</span>
              </button>
              <button
                className={`control-btn ${!isVideoEnabled ? "active" : ""}`}
                onClick={() => setIsVideoEnabled((prev) => !prev)}
              >
                <span className="btn-label">
                  {isVideoEnabled ? "Camera Off" : "Camera On"}
                </span>
              </button>
              <button
                className={`control-btn ${isSpeakerOn ? "active" : ""}`}
                onClick={() => setIsSpeakerOn((prev) => !prev)}
              >
                <span className="btn-label">
                  {isSpeakerOn ? "Speaker Off" : "Speaker On"}
                </span>
              </button>
              {availableCameras.length >= 1 && (
                <button
                  className="control-btn"
                  onClick={switchCamera}
                  disabled={availableCameras.length < 2}
                >
                  <span className="btn-label">
                    {isCameraSwitched ? "Front" : "Back"}
                  </span>
                </button>
              )}
              <button className="control-btn" onClick={toggleScreenShare}>
                <span className="btn-label">
                  {isScreenSharing ? "Stop Share" : "Share"}
                </span>
              </button>
              <button
                className={`control-btn ${isRecording ? "recording" : ""}`}
                onClick={() => setIsRecording((prev) => !prev)}
              >
                <span className="btn-label">
                  {isRecording ? "Stop Rec" : "Record"}
                </span>
              </button>
              <button
                className="control-btn"
                onClick={() => setShowSettings((prev) => !prev)}
              >
                <span className="btn-label">Settings</span>
              </button>
              <button className="control-btn end-call" onClick={handleEndCall}>
                <span className="btn-label">End</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;
