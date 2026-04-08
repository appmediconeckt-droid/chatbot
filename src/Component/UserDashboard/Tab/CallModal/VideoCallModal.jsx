import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../../../../axiosConfig";
import "./VideoCallModal.css";

const ACTIVE_STATUSES = new Set(["active", "connected"]);
const TERMINAL_STATUSES = new Set([
  "ended",
  "rejected",
  "cancelled",
  "missed",
  "failed",
  "camera_error",
  "no_camera",
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

const VideoCallModal = ({ isOpen, onClose, callData }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isCameraSwitched, setIsCameraSwitched] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallActive, setIsCallActive] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [currentCamera, setCurrentCamera] = useState("");
  const [connectionQuality, setConnectionQuality] = useState("good");
  const [showSettings, setShowSettings] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(70);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const [callerName, setCallerName] = useState("");
  const [callerProfilePic, setCallerProfilePic] = useState("");
  const [callerPhoneNumber, setCallerPhoneNumber] = useState("");
  const [callType, setCallType] = useState("video");
  const [callStatus, setCallStatus] = useState("connecting");
  const [callStartTime, setCallStartTime] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [callId, setCallId] = useState("");
  const [apiCallData, setApiCallData] = useState(null);

  const [isConnecting, setIsConnecting] = useState(true);
  const [isRemoteVideoReady, setIsRemoteVideoReady] = useState(false);
  const [webrtcError, setWebrtcError] = useState("");

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localUserIdRef = useRef("");
  const remoteUserIdRef = useRef("");
  const hasStartedConnectionRef = useRef(false);
  const pendingIceCandidatesRef = useRef([]);

  const defaultCallData = {
    id: "",
    name: "Counselor",
    profilePic: "👤",
    type: "video",
    status: "connecting",
    phoneNumber: "",
  };

  const cleanupRealtimeConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      try {
        peerConnectionRef.current.close();
      } catch (error) {
        console.warn("Peer close failed:", error);
      }
      peerConnectionRef.current = null;
    }

    if (socketRef.current) {
      try {
        if (callId && localUserIdRef.current) {
          socketRef.current.emit("leave-call", {
            callId,
            userId: localUserIdRef.current,
          });
        }
      } catch (error) {
        console.warn("Socket leave-call failed:", error);
      }

      socketRef.current.off("connect");
      socketRef.current.off("offer");
      socketRef.current.off("answer");
      socketRef.current.off("call-offer");
      socketRef.current.off("call-answer");
      socketRef.current.off("ice-candidate");
      socketRef.current.off("user-joined");
      socketRef.current.off("user-left");
      socketRef.current.off("user-left-call");
      socketRef.current.off("connect_error");
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

    setIsRemoteVideoReady(false);
    pendingIceCandidatesRef.current = [];
    hasStartedConnectionRef.current = false;
  }, [callId]);

  // Process call data every time modal opens with new call.
  useEffect(() => {
    if (isOpen && callData) {
      const normalizedStatus = normalizeCallStatus(
        callData.status || "connecting",
      );

      setCallerName(callData.name || defaultCallData.name);
      setCallerProfilePic(callData.profilePic || defaultCallData.profilePic);
      setCallerPhoneNumber(callData.phoneNumber || defaultCallData.phoneNumber);
      setCallType(callData.type || defaultCallData.type);
      setCallStatus(normalizedStatus);
      setRoomId(callData.roomId || "");
      setCallId(callData.callId || callData.id || "");
      setApiCallData(callData.apiCallData || null);
      setCallStartTime(new Date());
      setCallDuration(0);
      setIsConnecting(
        !isConnectedStatus(normalizedStatus) &&
          !isTerminalStatus(normalizedStatus),
      );
      setWebrtcError("");
      hasStartedConnectionRef.current = false;
    } else if (isOpen) {
      const fallbackStatus = normalizeCallStatus(defaultCallData.status);
      setCallerName(defaultCallData.name);
      setCallerProfilePic(defaultCallData.profilePic);
      setCallerPhoneNumber(defaultCallData.phoneNumber);
      setCallType(defaultCallData.type);
      setCallStatus(fallbackStatus);
      setCallStartTime(new Date());
      setCallDuration(0);
      setIsConnecting(
        !isConnectedStatus(fallbackStatus) && !isTerminalStatus(fallbackStatus),
      );
    }
  }, [isOpen, callData]);

  const initializeCamera = useCallback(async (useBackCamera = false) => {
    try {
      const facingMode = useBackCamera ? "environment" : "user";

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode,
        },
        audio: true,
      });

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      mediaStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      if (peerConnectionRef.current) {
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        if (videoTrack) {
          const sender = peerConnectionRef.current
            .getSenders()
            .find((item) => item.track && item.track.kind === "video");
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
        }

        if (audioTrack) {
          const sender = peerConnectionRef.current
            .getSenders()
            .find((item) => item.track && item.track.kind === "audio");
          if (sender) {
            await sender.replaceTrack(audioTrack);
          }
        }
      }

      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack ? videoTrack.getSettings() : {};
      if (settings.deviceId) {
        setCurrentCamera(settings.deviceId);
      }

      setIsCameraInitialized(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCallStatus("camera_error");
    }
  }, []);

  const getAvailableCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((item) => item.kind === "videoinput");
      const normalized = cameras.map((item) => {
        const label = (item.label || "").toLowerCase();
        return {
          ...item,
          isFrontCamera:
            label.includes("front") ||
            label.includes("user") ||
            label.includes("face"),
          isBackCamera:
            label.includes("back") ||
            label.includes("rear") ||
            label.includes("environment"),
        };
      });
      setAvailableCameras(normalized);
      if (!currentCamera && normalized[0]) {
        setCurrentCamera(normalized[0].deviceId);
      }
    } catch (error) {
      console.error("Error getting cameras:", error);
    }
  }, [currentCamera]);

  useEffect(() => {
    if (isOpen && !isCameraInitialized) {
      initializeCamera(false);
      getAvailableCameras();
    }
  }, [isOpen, isCameraInitialized, initializeCamera, getAvailableCameras]);

  useEffect(() => {
    let timer;
    if (
      isOpen &&
      isCallActive &&
      callStartTime &&
      isConnectedStatus(callStatus)
    ) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, isCallActive, callStartTime, callStatus]);

  useEffect(() => {
    if (isOpen && isCallActive) {
      const qualityInterval = setInterval(() => {
        const qualityList = ["good", "medium", "poor"];
        setConnectionQuality(
          qualityList[Math.floor(Math.random() * qualityList.length)],
        );
      }, 10000);
      return () => clearInterval(qualityInterval);
    }
    return undefined;
  }, [isOpen, isCallActive]);

  useEffect(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }

    if (socketRef.current && callId && remoteUserIdRef.current) {
      socketRef.current.emit("call-mute-toggle", {
        callId,
        isMuted,
        to: remoteUserIdRef.current,
      });
    }
  }, [isMuted, callId]);

  useEffect(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = isVideoEnabled;
      });
    }
  }, [isVideoEnabled]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.volume = Math.max(
        0,
        Math.min(1, Number(volumeLevel) / 100),
      );
      remoteVideoRef.current.muted = !isSpeakerOn;
    }
  }, [volumeLevel, isSpeakerOn]);

  useEffect(() => {
    if (!isOpen || !callId) return;

    const token =
      localStorage.getItem("token") || localStorage.getItem("accessToken");
    const localUserId =
      callData?.currentUserId ||
      localStorage.getItem("userId") ||
      localStorage.getItem("counsellorId") ||
      localStorage.getItem("counselorId");
    const localUserType = normalizeUserType(
      callData?.currentUserType ||
        localStorage.getItem("userRole") ||
        (localStorage.getItem("counsellorId") ||
        localStorage.getItem("counselorId")
          ? "counselor"
          : "user"),
    );

    if (!token || !localUserId) return;

    let mounted = true;

    const syncCall = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/video/calls/${callId}/details`,
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

        if (!mounted || !response.data?.success || !response.data?.call) return;

        const serverCall = response.data.call;
        const normalizedStatus = normalizeCallStatus(serverCall.status);
        const isInitiator =
          String(serverCall.initiator?.id) === String(localUserId);
        const other = isInitiator ? serverCall.receiver : serverCall.initiator;

        setCallStatus(normalizedStatus);
        setRoomId(serverCall.roomId || roomId);
        setApiCallData(serverCall);

        if (other) {
          setCallerName(other.displayName || other.fullName || callerName);
          setCallerProfilePic(other.profilePhoto || callerProfilePic);
          setCallerPhoneNumber(
            other.phoneNumber || other.phone || callerPhoneNumber,
          );
        }

        setIsConnecting(
          !isConnectedStatus(normalizedStatus) &&
            !isTerminalStatus(normalizedStatus),
        );
      } catch (error) {
        console.error("Error syncing video call state:", error);
      }
    };

    syncCall();
    const interval = setInterval(syncCall, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [
    isOpen,
    callId,
    callData,
    roomId,
    callerName,
    callerProfilePic,
    callerPhoneNumber,
  ]);

  const establishVideoConnection = useCallback(async () => {
    if (hasStartedConnectionRef.current) return;
    if (
      !callId ||
      !isConnectedStatus(callStatus) ||
      isTerminalStatus(callStatus)
    ) {
      return;
    }

    const localUserId =
      callData?.currentUserId ||
      localStorage.getItem("userId") ||
      localStorage.getItem("counsellorId") ||
      localStorage.getItem("counselorId");

    if (!localUserId) {
      setWebrtcError("Unable to identify current user for this call.");
      return;
    }

    const serverCall = apiCallData || callData?.apiCallData || {};
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

    if (!mediaStreamRef.current) {
      await initializeCamera(isCameraSwitched);
    }

    const localStream = mediaStreamRef.current;
    if (!localStream) {
      setWebrtcError("Camera stream is not available.");
      return;
    }

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
    peerConnectionRef.current = peer;

    const flushPendingIceCandidates = async () => {
      if (
        !peerConnectionRef.current ||
        !peerConnectionRef.current.remoteDescription
      ) {
        return;
      }

      const queuedCandidates = [...pendingIceCandidatesRef.current];
      pendingIceCandidatesRef.current = [];

      for (const candidate of queuedCandidates) {
        try {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(candidate),
          );
        } catch (error) {
          console.warn("Failed to flush ICE candidate:", error);
        }
      }
    };

    localStream.getTracks().forEach((track) => {
      peer.addTrack(track, localStream);
    });

    let offerRetryTimer = null;

    const sendOffer = async () => {
      if (!peerConnectionRef.current) return;
      if (peerConnectionRef.current.signalingState !== "stable") return;

      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: true,
      });
      await peerConnectionRef.current.setLocalDescription(offer);

      socket.emit("call-offer", {
        callId,
        offer,
        to: remoteUserIdRef.current,
      });
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

    peer.ontrack = (event) => {
      const [incomingStream] = event.streams;
      if (incomingStream) {
        remoteStreamRef.current = incomingStream;
      } else {
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }

        const existingTrackIds = new Set(
          remoteStreamRef.current.getTracks().map((track) => track.id),
        );

        if (!existingTrackIds.has(event.track.id)) {
          remoteStreamRef.current.addTrack(event.track);
        }
      }

      if (remoteVideoRef.current) {
        const remoteVideoElement = remoteVideoRef.current;
        remoteVideoElement.srcObject = remoteStreamRef.current;

        // Allow video frames to start rendering even if autoplay with audio
        // would otherwise be blocked by the browser.
        remoteVideoElement.muted = true;

        remoteVideoElement
          .play()
          .then(() => {
            setIsRemoteVideoReady(true);
            setIsConnecting(false);
            setWebrtcError("");
            remoteVideoElement.muted = !isSpeakerOn;
            remoteVideoElement.volume = Math.max(
              0,
              Math.min(1, Number(volumeLevel) / 100),
            );
          })
          .catch((error) => {
            console.warn("Remote autoplay blocked:", error);
            setWebrtcError("Tap on remote video area once to allow playback.");
          });
      }
    };

    peer.onconnectionstatechange = () => {
      const state = peer.connectionState;
      if (state === "connected") {
        setIsConnecting(false);
      }
      if (state === "failed" || state === "disconnected") {
        setWebrtcError("Video connection interrupted.");
      }
    };

    socket.on("connect", async () => {
      socket.emit("join-call", {
        callId,
        userId: localUserIdRef.current,
      });

      if (isLocalInitiator) {
        await sendOffer();

        // Retry while waiting for remote answer to avoid lost initial offer.
        offerRetryTimer = setInterval(async () => {
          if (
            !peerConnectionRef.current ||
            peerConnectionRef.current.connectionState === "connected" ||
            peerConnectionRef.current.currentRemoteDescription
          ) {
            clearInterval(offerRetryTimer);
            offerRetryTimer = null;
            return;
          }
          await sendOffer();
        }, 2000);
      }
    });

    socket.on("user-joined", async ({ userId }) => {
      if (!isLocalInitiator) return;
      if (String(userId) === String(localUserIdRef.current)) return;
      await sendOffer();
    });

    const onIncomingOffer = async ({ offer, userId, from }) => {
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
        await flushPendingIceCandidates();

        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        socket.emit("call-answer", {
          callId,
          answer,
          to: remoteUserIdRef.current,
        });
      } catch (error) {
        console.error("Failed to process offer:", error);
        setWebrtcError("Could not establish video channel.");
      }
    };

    const onIncomingAnswer = async ({ answer, userId, from }) => {
      const senderId = String(userId || from || "");
      if (!answer || senderId === String(localUserIdRef.current)) return;
      if (!peerConnectionRef.current) return;

      try {
        if (!peerConnectionRef.current.currentRemoteDescription) {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(answer),
          );
          await flushPendingIceCandidates();
        }
      } catch (error) {
        console.error("Failed to process answer:", error);
        setWebrtcError("Video answer sync failed.");
      }
    };

    socket.on("call-offer", onIncomingOffer);
    socket.on("offer", onIncomingOffer);
    socket.on("call-answer", onIncomingAnswer);
    socket.on("answer", onIncomingAnswer);

    socket.on("ice-candidate", async ({ candidate, userId, from }) => {
      const senderId = String(userId || from || "");
      if (!candidate || senderId === String(localUserIdRef.current)) return;
      if (!peerConnectionRef.current) return;

      try {
        if (!peerConnectionRef.current.remoteDescription) {
          pendingIceCandidatesRef.current.push(candidate);
          return;
        }

        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate),
        );
      } catch (error) {
        pendingIceCandidatesRef.current.push(candidate);
        console.warn("Failed to add ICE candidate immediately:", error);
      }
    });

    socket.on("user-left", ({ userId }) => {
      if (String(userId) === String(localUserIdRef.current)) return;
      setIsRemoteVideoReady(false);
      setWebrtcError("Other participant left the call.");
    });

    socket.on("user-left-call", ({ userId }) => {
      if (String(userId) === String(localUserIdRef.current)) return;
      setIsRemoteVideoReady(false);
      setWebrtcError("Other participant left the call.");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connect error:", error);
      setWebrtcError("Unable to connect realtime video service.");
    });

    socket.on("disconnect", () => {
      if (offerRetryTimer) {
        clearInterval(offerRetryTimer);
        offerRetryTimer = null;
      }
    });

    hasStartedConnectionRef.current = true;
  }, [
    apiCallData,
    callData,
    callId,
    callStatus,
    initializeCamera,
    isCameraSwitched,
  ]);

  useEffect(() => {
    if (
      isOpen &&
      isCallActive &&
      isConnectedStatus(callStatus) &&
      !isTerminalStatus(callStatus)
    ) {
      establishVideoConnection();
    }
  }, [isOpen, isCallActive, callStatus, callId, establishVideoConnection]);

  useEffect(() => {
    if (!isOpen) {
      setIsMuted(false);
      setIsSpeakerOn(true);
      setIsVideoEnabled(true);
      setIsCameraSwitched(false);
      setCallDuration(0);
      setIsCallActive(true);
      setIsFullScreen(false);
      setIsCameraInitialized(false);
      setIsScreenSharing(false);
      setShowSettings(false);
      setCallStatus("ended");
      setRoomId("");
      setCallId("");
      setApiCallData(null);
      setIsConnecting(true);
      setIsRemoteVideoReady(false);
      setWebrtcError("");

      cleanupRealtimeConnection();

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    }
  }, [isOpen, cleanupRealtimeConnection]);

  useEffect(() => {
    return () => {
      cleanupRealtimeConnection();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [cleanupRealtimeConnection]);

  const switchCamera = async () => {
    const next = !isCameraSwitched;
    setIsCameraSwitched(next);
    await initializeCamera(next);
  };

  const selectCamera = async (deviceId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      mediaStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      if (peerConnectionRef.current) {
        const newVideoTrack = stream.getVideoTracks()[0];
        const videoSender = peerConnectionRef.current
          .getSenders()
          .find((item) => item.track && item.track.kind === "video");
        if (videoSender && newVideoTrack) {
          await videoSender.replaceTrack(newVideoTrack);
        }
      }

      setCurrentCamera(deviceId);
    } catch (error) {
      console.error("Error selecting camera:", error);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        const screenTrack = screenStream.getVideoTracks()[0];

        if (peerConnectionRef.current) {
          const sender = peerConnectionRef.current
            .getSenders()
            .find((item) => item.track && item.track.kind === "video");
          if (sender) {
            await sender.replaceTrack(screenTrack);
          }
        }

        if (mediaStreamRef.current) {
          const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
          const composed = audioTrack
            ? new MediaStream([screenTrack, audioTrack])
            : new MediaStream([screenTrack]);
          mediaStreamRef.current = composed;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = composed;
          }
        }

        setIsScreenSharing(true);

        screenTrack.onended = async () => {
          setIsScreenSharing(false);
          await initializeCamera(isCameraSwitched);
        };
      } catch (error) {
        console.error("Error sharing screen:", error);
      }
    } else {
      setIsScreenSharing(false);
      await initializeCamera(isCameraSwitched);
    }
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setCallStatus("ended");

    cleanupRealtimeConnection();

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    setTimeout(() => {
      onClose();
    }, 500);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const toggleFullScreen = () => {
    if (!isFullScreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
    setIsFullScreen((prev) => !prev);
  };

  const getQualityIcon = () => {
    switch (connectionQuality) {
      case "good":
      case "medium":
      case "poor":
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
    if (webrtcError) return webrtcError;
    if (isConnecting) {
      return callStatus === "pending" || callStatus === "ringing"
        ? "Waiting for other participant to join..."
        : "Connecting...";
    }
    if (isConnectedStatus(callStatus) && !isRemoteVideoReady) {
      return "Connected. Waiting for remote video...";
    }
    switch (callStatus) {
      case "connected":
      case "active":
        return "Connected";
      case "pending":
      case "ringing":
        return "Waiting for acceptance...";
      case "ended":
        return "Call Ended";
      case "camera_error":
        return "Camera Error";
      case "no_camera":
        return "No Camera Access";
      default:
        return callStatus;
    }
  };

  const getProfileDisplay = () => {
    if (
      callerProfilePic &&
      (callerProfilePic.startsWith("http") || callerProfilePic.startsWith("/"))
    ) {
      return null;
    }
    return callerProfilePic || callerName.charAt(0) || "👤";
  };

  const isImageProfilePic = () =>
    Boolean(
      callerProfilePic &&
      (callerProfilePic.startsWith("http") ||
        callerProfilePic.startsWith("/") ||
        callerProfilePic.includes("base64")),
    );

  if (!isOpen) return null;

  return (
    <div className={`video-modal-overlay ${isFullScreen ? "fullscreen" : ""}`}>
      <div
        className={`video-modal-container ${isFullScreen ? "fullscreen" : ""}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="video-modal-header">
          <div className="header-left">
            <span className="header-icon">📹</span>
            <div className="call-info">
              <h3>Video Call with {callerName}</h3>
              <div className={`connection-quality ${getQualityClass()}`}>
                <span className="quality-icon">{getQualityIcon()}</span>
                <span className="quality-text">{connectionQuality}</span>
              </div>
            </div>
          </div>
          <div className="header-right">
            <button
              className="header-btn"
              onClick={toggleFullScreen}
              title="Full screen"
            >
              {isFullScreen ? "🗗️" : "🗖"}
            </button>
            <button
              className="header-btn close-btn"
              onClick={onClose}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="video-modal-content">
          <div className="video-main-area">
            <div className="remote-video-container">
              <video
                ref={remoteVideoRef}
                className="remote-video"
                autoPlay
                playsInline
                poster="/api/placeholder/1280/720"
                onClick={() => {
                  if (remoteVideoRef.current) {
                    remoteVideoRef.current.play().catch(() => {});
                  }
                }}
              />

              {!isRemoteVideoReady && (
                <div className="remote-video-overlay">
                  <div className="remote-video-placeholder">
                    {isImageProfilePic() ? (
                      <img
                        src={callerProfilePic}
                        alt={callerName}
                        className="remote-avatar-image"
                        onError={(event) => {
                          event.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="remote-avatar">
                        {getProfileDisplay()}
                      </span>
                    )}
                    <div className="remote-info">
                      <h2>{callerName}</h2>
                      {roomId && (
                        <p className="room-id">
                          Room: {roomId.substring(0, 8)}...
                        </p>
                      )}
                      <p className="call-status">
                        <span className={`status-${callStatus}`}>
                          {isConnectedStatus(callStatus) && (
                            <span className="pulse-dot"></span>
                          )}
                          {getCallStatusDisplay()}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isCallActive && isConnectedStatus(callStatus) && (
                <div className="call-duration-badge">
                  <span className="duration-icon">⏱️</span>
                  <span className="duration-text">
                    {formatTime(callDuration)}
                  </span>
                </div>
              )}

              {isScreenSharing && (
                <div className="screen-share-indicator">
                  <span className="share-icon">🖥️</span>
                  <span className="share-text">Sharing screen</span>
                </div>
              )}

              <div className="camera-indicator">
                <span className="camera-icon">📷</span>
                <span className="camera-text">
                  {isCameraSwitched ? "Back Camera" : "Front Camera"}
                </span>
              </div>
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
              {!isVideoEnabled && (
                <div className="local-video-off">
                  <span>🚫</span>
                </div>
              )}
              {isMuted && (
                <div className="muted-indicator">
                  <span>🔇</span>
                </div>
              )}
              <div className="local-video-label">
                <span>You ({isCameraSwitched ? "Back" : "Front"})</span>
              </div>
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
                    onChange={(event) => setVolumeLevel(event.target.value)}
                  />
                  <span>{volumeLevel}%</span>
                </div>
                {availableCameras.length > 0 && (
                  <div className="setting-item">
                    <label>Select Camera</label>
                    <select
                      value={currentCamera}
                      onChange={(event) => selectCamera(event.target.value)}
                    >
                      {availableCameras.map((camera) => (
                        <option key={camera.deviceId} value={camera.deviceId}>
                          {camera.label ||
                            `Camera ${camera.deviceId.slice(0, 5)}...`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="setting-item">
                  <label>Call Information</label>
                  <div className="caller-info-display">
                    <p>
                      <strong>Name:</strong> {callerName}
                    </p>
                    {callerPhoneNumber && (
                      <p>
                        <strong>Phone:</strong> {callerPhoneNumber}
                      </p>
                    )}
                    <p>
                      <strong>Call Type:</strong> {callType}
                    </p>
                    <p>
                      <strong>Duration:</strong> {formatTime(callDuration)}
                    </p>
                    {roomId && (
                      <p>
                        <strong>Room ID:</strong> {roomId.substring(0, 8)}...
                      </p>
                    )}
                    {callId && (
                      <p>
                        <strong>Call ID:</strong> {callId.substring(0, 8)}...
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

            <div className="video-call-controls">
              <button
                className={`control-btn ${isMuted ? "active" : ""}`}
                onClick={() => setIsMuted((prev) => !prev)}
                title={isMuted ? "Unmute" : "Mute"}
              >
                <span className="btn-icon">{isMuted ? "🔇" : "🎤"}</span>
                <span className="btn-label">{isMuted ? "Unmute" : "Mute"}</span>
              </button>

              <button
                className={`control-btn ${!isVideoEnabled ? "active" : ""}`}
                onClick={() => setIsVideoEnabled((prev) => !prev)}
                title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
              >
                <span className="btn-icon">{isVideoEnabled ? "📹" : "🚫"}</span>
                <span className="btn-label">
                  {isVideoEnabled ? "Camera off" : "Camera on"}
                </span>
              </button>

              <button
                className={`control-btn ${isSpeakerOn ? "active" : ""}`}
                onClick={() => setIsSpeakerOn((prev) => !prev)}
                title={isSpeakerOn ? "Speaker off" : "Speaker on"}
              >
                <span className="btn-icon">{isSpeakerOn ? "🔊" : "🔈"}</span>
                <span className="btn-label">
                  {isSpeakerOn ? "Speaker off" : "Speaker on"}
                </span>
              </button>

              <button
                className="control-btn"
                onClick={switchCamera}
                title={
                  isCameraSwitched
                    ? "Switch to front camera"
                    : "Switch to back camera"
                }
                disabled={availableCameras.length < 2}
              >
                <span className="btn-icon">🔄</span>
                <span className="btn-label">
                  {isCameraSwitched ? "Front" : "Back"}
                </span>
              </button>

              <button
                className="control-btn"
                onClick={toggleScreenShare}
                title={isScreenSharing ? "Stop sharing" : "Share screen"}
              >
                <span className="btn-icon">
                  {isScreenSharing ? "⏹️" : "🖥️"}
                </span>
                <span className="btn-label">
                  {isScreenSharing ? "Stop share" : "Share"}
                </span>
              </button>

              <button
                className="control-btn"
                onClick={() => setShowSettings((prev) => !prev)}
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

export default VideoCallModal;
