import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import {
  CallingState,
  OwnCapability,
  ParticipantView,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import "./VideoCallModal.css";
import {
  FaDesktop,
  FaCompress,
  FaExpand,
  FaMicrophone,
  FaMicrophoneSlash,
  FaPhoneSlash,
  FaRegSmile,
  FaVideo,
  FaVideoSlash,
} from "react-icons/fa";
import { API_BASE_URL } from "../../../../axiosConfig";
import {
  getStreamToken,
  resolveStreamApiKey,
  resolveStreamUser,
  resolveStreamUserFromToken,
  validateStreamTokenPayload,
} from "./streamCallClient";

const PENDING_STATUSES = new Set([
  "pending",
  "ringing",
  "waiting",
  "requested",
]);
const JOINABLE_STATUSES = new Set([
  "active",
  "accepted",
  "connected",
  "joined",
  "ongoing",
]);
const TERMINAL_STATUSES = new Set([
  "rejected",
  "cancelled",
  "canceled",
  "missed",
  "ended",
  "completed",
  "expired",
  "failed",
]);

const normalizeCallStatus = (status) =>
  String(status || "")
    .trim()
    .toLowerCase();

const normalizeUiStatus = (status) => {
  const normalized = String(status || "")
    .trim()
    .toLowerCase();

  if (
    normalized === "connecting" ||
    normalized === "ringing" ||
    normalized === "connected"
  ) {
    return normalized;
  }

  return "";
};

const getAuthToken = () =>
  localStorage.getItem("token") || localStorage.getItem("accessToken") || "";

const resolveCalleeName = (callData) =>
  String(
    callData?.name ||
      callData?.receiver?.displayName ||
      callData?.receiver?.fullName ||
      callData?.receiver?.name ||
      callData?.initiator?.displayName ||
      callData?.initiator?.fullName ||
      callData?.initiator?.name ||
      "Participant",
  ).trim();

const buildInitials = (name) => {
  const normalizedName = String(name || "").trim();
  return normalizedName ? normalizedName.charAt(0).toUpperCase() : "?";
};

const formatDuration = (seconds) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const hrs = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  const mm = String(mins).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");

  if (hrs > 0) {
    return `${String(hrs).padStart(2, "0")}:${mm}:${ss}`;
  }

  return `${mm}:${ss}`;
};

const QUICK_REACTIONS = [
  { type: "reaction", emojiCode: ":like:", symbol: "👍", label: "Like" },
  {
    type: "raised-hand",
    emojiCode: ":raise-hand:",
    symbol: "✋",
    label: "Raise Hand",
  },
  {
    type: "reaction",
    emojiCode: ":fireworks:",
    symbol: "🎉",
    label: "Celebrate",
  },
  {
    type: "reaction",
    emojiCode: ":heart:",
    symbol: "❤️",
    label: "Heart",
  },
  {
    type: "reaction",
    emojiCode: ":smile:",
    symbol: "😄",
    label: "Smile",
  },
];

const resolveCurrentUserType = (currentUser, callData) => {
  const explicitType =
    currentUser?.role ||
    callData?.currentUserType ||
    localStorage.getItem("userRole") ||
    "";
  const normalizedType = String(explicitType).trim().toLowerCase();

  if (normalizedType === "counselor" || normalizedType === "counsellor") {
    return "counsellor";
  }

  if (normalizedType === "user") {
    return "user";
  }

  if (
    localStorage.getItem("counsellorId") ||
    localStorage.getItem("counselorId")
  ) {
    return "counsellor";
  }

  return "user";
};

const cleanupStreamSession = (session) => {
  if (!session) return Promise.resolve();

  if (!session.cleanupPromise) {
    session.cleanupPromise = (async () => {
      try {
        await Promise.resolve(session.call?.leave?.());
      } catch {
        // Best effort: continue disconnecting client.
      }

      try {
        await Promise.resolve(session.client?.disconnectUser?.());
      } catch {
        // Ignore disconnect errors during teardown.
      }
    })();
  }

  return session.cleanupPromise;
};

const resolveParticipantName = (participant) =>
  participant?.name ||
  participant?.user?.name ||
  participant?.userId ||
  "Participant";

const StreamVideoBody = ({ onLeave, localUserId, isVoiceMode, calleeName }) => {
  const { useCallCallingState, useParticipants, useLocalParticipant } =
    useCallStateHooks();
  const callingState = useCallCallingState();
  const participants = useParticipants();
  const localParticipantFromHook = useLocalParticipant();
  const normalizedLocalUserId = String(localUserId || "").trim();

  const localParticipant = useMemo(() => {
    if (localParticipantFromHook) {
      return localParticipantFromHook;
    }

    return (
      participants.find((participant) => {
        if (participant?.isLocalParticipant) {
          return true;
        }

        if (!normalizedLocalUserId) {
          return false;
        }

        return (
          String(participant?.userId || "").trim() === normalizedLocalUserId
        );
      }) || null
    );
  }, [localParticipantFromHook, normalizedLocalUserId, participants]);

  const remoteParticipants = useMemo(
    () =>
      participants.filter((participant) => {
        if (!participant) {
          return false;
        }

        if (participant?.isLocalParticipant) {
          return false;
        }

        if (
          localParticipant?.sessionId &&
          participant?.sessionId === localParticipant.sessionId
        ) {
          return false;
        }

        if (
          normalizedLocalUserId &&
          String(participant?.userId || "").trim() === normalizedLocalUserId
        ) {
          return false;
        }

        return true;
      }),
    [localParticipant?.sessionId, normalizedLocalUserId, participants],
  );

  const presenter = useMemo(
    () =>
      participants.find(
        (p) =>
          p.publishedTracks?.includes("screenShareTrack") ||
          p.screenShareStream,
      ),
    [participants],
  );
  const mainParticipant = presenter || remoteParticipants[0] || null;
  const isPresentingMain =
    presenter && mainParticipant?.sessionId === presenter.sessionId;
  const mainParticipantName = mainParticipant
    ? resolveParticipantName(mainParticipant)
    : "";
  const voiceParticipantName =
    mainParticipantName || String(calleeName || "Participant").trim();
  const voiceParticipantInitial = buildInitials(voiceParticipantName);
  const localParticipantName = localParticipant
    ? resolveParticipantName(localParticipant)
    : "You";

  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      onLeave();
    }
  }, [callingState, onLeave]);

  if (isVoiceMode) {
    return (
      <StreamTheme className="stream-theme-root">
        <div className="stream-layout-root stream-layout-root-voice">
          {mainParticipant ? (
            <div className="stream-voice-stage">
              <div className="stream-voice-avatar-wrap">
                <div className="stream-voice-avatar">
                  {voiceParticipantInitial}
                </div>
              </div>
              <div className="stream-voice-name">{voiceParticipantName}</div>
              <div className="stream-voice-note">Voice call in progress</div>
            </div>
          ) : (
            <div className="stream-empty-state">
              Waiting for others to join...
            </div>
          )}

          {localParticipant && (
            <div className="stream-voice-local-pill">
              You • {localParticipantName}
            </div>
          )}

          {mainParticipant && (
            <ParticipantView
              className="stream-hidden-media-probe"
              participant={mainParticipant}
            />
          )}

          {localParticipant && (
            <ParticipantView
              className="stream-hidden-media-probe"
              participant={localParticipant}
              muteAudio={true}
            />
          )}
        </div>
      </StreamTheme>
    );
  }

  return (
    <StreamTheme className="stream-theme-root">
      <div className="stream-layout-root">
        <div className="stream-main-stage">
          {mainParticipant ? (
            <>
              <ParticipantView
                className="stream-main-participant"
                participant={mainParticipant}
                trackType={isPresentingMain ? "screenShareTrack" : "videoTrack"}
              />
              <div className="stream-main-name">
                {resolveParticipantName(mainParticipant)}
              </div>
            </>
          ) : (
            <div className="stream-empty-state">
              Waiting for others to join...
            </div>
          )}
        </div>

        {localParticipant && (
          <div className="stream-self-pip">
            <ParticipantView
              className="stream-self-participant"
              participant={localParticipant}
              muteAudio={true}
            />
          </div>
        )}
      </div>
    </StreamTheme>
  );
};

const resolveCallId = (callData) =>
  String(
    callData?.callId ||
      callData?.id ||
      callData?.roomId ||
      callData?.apiCallData?.id ||
      "",
  ).trim();

const resolveCallMode = (callMode, callData) => {
  const mode = String(
    callMode || callData?.callType || callData?.type || "video",
  )
    .trim()
    .toLowerCase();

  return mode === "audio" || mode === "voice" ? "voice" : "video";
};

const VideoCallModal = ({
  isOpen,
  onClose,
  callData,
  currentUser,
  onEndCall,
  callMode,
  status,
}) => {
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [callStatus, setCallStatus] = useState("active");
  const callRef = useRef(null);
  const clientRef = useRef(null);
  const closeRequestedRef = useRef(false);
  const joinRunRef = useRef(0);
  const modalContainerRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const onEndCallRef = useRef(onEndCall);
  const localUserRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectInFlightRef = useRef(false);
  const callUnsubsRef = useRef([]);
  const clientUnsubsRef = useRef([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [connectedAt, setConnectedAt] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isReactionMenuOpen, setIsReactionMenuOpen] = useState(false);
  const micMutedRef = useRef(false);
  const cameraOffRef = useRef(false);
  const reactionsMenuRef = useRef(null);

  const callId = useMemo(() => resolveCallId(callData), [callData]);
  const resolvedCallMode = useMemo(
    () => resolveCallMode(callMode, callData),
    [callMode, callData],
  );
  const isVoiceMode = resolvedCallMode === "voice";
  const currentUserId = currentUser?.id;
  const currentUserDbId = currentUser?._id;
  const currentUserFullName = currentUser?.fullName;
  const currentUserName = currentUser?.name;
  const currentUserProfilePic = currentUser?.profilePic;
  const currentUserProfilePhoto = currentUser?.profilePhoto;
  const currentUserRole = currentUser?.role;
  const currentUserTypeFromCall = callData?.currentUserType;
  const initialCallStatus = useMemo(
    () => normalizeCallStatus(callData?.status) || "active",
    [callData?.status],
  );
  const localUser = useMemo(
    () =>
      resolveStreamUser({
        id: currentUserId,
        _id: currentUserDbId,
        fullName: currentUserFullName,
        name: currentUserName,
        profilePic: currentUserProfilePic,
        profilePhoto: currentUserProfilePhoto,
      }),
    [
      currentUserId,
      currentUserDbId,
      currentUserFullName,
      currentUserName,
      currentUserProfilePic,
      currentUserProfilePhoto,
    ],
  );
  const resolvedUserType = useMemo(
    () =>
      resolveCurrentUserType(
        { role: currentUserRole },
        { currentUserType: currentUserTypeFromCall },
      ),
    [currentUserRole, currentUserTypeFromCall],
  );
  const calleeName = useMemo(() => resolveCalleeName(callData), [callData]);
  const calleeInitials = useMemo(() => buildInitials(calleeName), [calleeName]);
  const isPendingCall = PENDING_STATUSES.has(callStatus);
  const isTerminalCall = TERMINAL_STATUSES.has(callStatus);
  const canJoinCall = !isPendingCall && !isTerminalCall;
  const explicitUiStatus = useMemo(() => normalizeUiStatus(status), [status]);
  const uiStatus = useMemo(() => {
    if (explicitUiStatus) {
      return explicitUiStatus;
    }

    if (canJoinCall && client && call && !loading) {
      return "connected";
    }

    if (isPendingCall) {
      return "ringing";
    }

    return "connecting";
  }, [explicitUiStatus, canJoinCall, client, call, loading, isPendingCall]);
  const showConnectingAnimation =
    (uiStatus === "connecting" || uiStatus === "ringing") && !error;
  const showTopActions = uiStatus === "connected";
  const showConnectedTimer = uiStatus === "connected" && !error;
  const ownCapabilities = call?.state?.ownCapabilities || [];
  const hasOwnCapabilities =
    Array.isArray(ownCapabilities) && ownCapabilities.length > 0;
  const canCreateReactions =
    !hasOwnCapabilities ||
    ownCapabilities.includes(OwnCapability.CREATE_REACTION);
  const canShareScreenCapability =
    !hasOwnCapabilities || ownCapabilities.includes(OwnCapability.SCREENSHARE);
  const isScreenSharingAllowedBySettings =
    call?.state?.settings?.screensharing?.enabled !== false;
  const canShareScreen =
    !isVoiceMode &&
    canShareScreenCapability &&
    isScreenSharingAllowedBySettings;
  const screenShareDisabled =
    !call ||
    !canShareScreen ||
    uiStatus !== "connected" ||
    loading ||
    Boolean(error);
  const reactionsDisabled =
    !call ||
    !canCreateReactions ||
    uiStatus !== "connected" ||
    loading ||
    Boolean(error);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    onEndCallRef.current = onEndCall;
  }, [onEndCall]);

  useEffect(() => {
    localUserRef.current = localUser;
  }, [localUser]);

  useEffect(() => {
    micMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  useEffect(() => {
    cameraOffRef.current = isCameraOff;
  }, [isCameraOff]);

  useEffect(() => {
    if (!isOpen || !call) {
      setIsScreenSharing(false);
      return undefined;
    }

    const syncScreenShareState = () => {
      setIsScreenSharing(Boolean(call.screenShare?.enabled));
    };

    syncScreenShareState();
    const status$ = call?.screenShare?.state?.status$;

    if (!status$?.subscribe) {
      return undefined;
    }

    const subscription = status$.subscribe((nextStatus) => {
      setIsScreenSharing(nextStatus === "enabled");
    });

    return () => {
      subscription?.unsubscribe?.();
    };
  }, [call, isOpen]);

  useEffect(() => {
    if (!isOpen || uiStatus !== "connected") {
      setConnectedAt(null);
      setElapsedSeconds(0);
      return;
    }

    setConnectedAt((prev) => prev || Date.now());
  }, [isOpen, uiStatus]);

  useEffect(() => {
    if (!connectedAt || uiStatus !== "connected") {
      return undefined;
    }

    const updateElapsed = () => {
      const seconds = Math.floor((Date.now() - connectedAt) / 1000);
      setElapsedSeconds(Math.max(0, seconds));
    };

    updateElapsed();
    const intervalId = setInterval(updateElapsed, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [connectedAt, uiStatus]);

  useEffect(() => {
    if (uiStatus !== "connected") {
      setIsReactionMenuOpen(false);
    }
  }, [uiStatus]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const detachCallListeners = useCallback(() => {
    if (!callUnsubsRef.current.length) return;
    for (const off of callUnsubsRef.current) {
      try {
        off?.();
      } catch {
        // Ignore listener cleanup issues.
      }
    }
    callUnsubsRef.current = [];
  }, []);

  const detachClientListeners = useCallback(() => {
    if (!clientUnsubsRef.current.length) return;
    for (const off of clientUnsubsRef.current) {
      try {
        off?.();
      } catch {
        // Ignore listener cleanup issues.
      }
    }
    clientUnsubsRef.current = [];
  }, []);

  const closeModalOnce = useCallback(() => {
    if (closeRequestedRef.current) return;
    closeRequestedRef.current = true;
    clearReconnectTimer();
    onCloseRef.current?.();
  }, [clearReconnectTimer]);

  const handleCallLeft = useCallback(() => {
    closeModalOnce();
  }, [closeModalOnce]);

  const attemptRejoinCall = useCallback(async () => {
    const activeCall = callRef.current;
    if (
      !activeCall ||
      reconnectInFlightRef.current ||
      !canJoinCall ||
      !isOpen
    ) {
      return;
    }

    reconnectInFlightRef.current = true;
    try {
      setLoading(true);
      setError("Connection interrupted. Reconnecting...");
      if (isVoiceMode && activeCall.camera?.disable) {
        await activeCall.camera.disable();
      } else if (!isVoiceMode && activeCall.camera && cameraOffRef.current) {
        await activeCall.camera.disable?.();
      }

      if (activeCall.microphone && micMutedRef.current) {
        await activeCall.microphone.disable?.();
      }

      await activeCall.join({ create: true });

      reconnectAttemptRef.current = 0;
      setError("");
      clearReconnectTimer();
    } catch (err) {
      setError(err?.message || "Reconnection failed. Retrying...");
    } finally {
      reconnectInFlightRef.current = false;
      setLoading(false);
    }
  }, [canJoinCall, clearReconnectTimer, isOpen, isVoiceMode]);

  const scheduleReconnect = useCallback(() => {
    if (!isOpen || !canJoinCall) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    if (reconnectTimeoutRef.current) return;

    const attempt = reconnectAttemptRef.current + 1;
    reconnectAttemptRef.current = attempt;
    const delay = Math.min(10000, 1000 * 2 ** (attempt - 1));

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null;
      void attemptRejoinCall();
    }, delay);
  }, [attemptRejoinCall, canJoinCall, isOpen]);

  const handleEndForEveryone = useCallback(async () => {
    const activeCall = callRef.current;
    const activeClient = clientRef.current;
    clearReconnectTimer();
    setIsReactionMenuOpen(false);
    setIsScreenSharing(false);

    if (activeCall?.endCall) {
      try {
        await activeCall.endCall();
      } catch (err) {
        console.error(
          `Failed to end Stream ${isVoiceMode ? "voice" : "video"} call:`,
          err,
        );
      }
    }

    if (callId && onEndCallRef.current) {
      try {
        await onEndCallRef.current(callId);
      } catch {
        // Ignore API failures so local UI can still close.
      }
    }

    detachCallListeners();
    detachClientListeners();

    if (activeCall || activeClient) {
      await cleanupStreamSession({
        call: activeCall,
        client: activeClient,
        cleanupPromise: null,
      });
    }

    callRef.current = null;
    clientRef.current = null;
    setCall(null);
    setClient(null);
    reconnectAttemptRef.current = 0;

    closeModalOnce();
  }, [
    callId,
    clearReconnectTimer,
    closeModalOnce,
    detachCallListeners,
    detachClientListeners,
    isVoiceMode,
  ]);

  const handleToggleMic = useCallback(async () => {
    const nextMuted = !micMutedRef.current;
    const activeCall = callRef.current;

    try {
      if (activeCall?.microphone) {
        if (nextMuted) {
          await activeCall.microphone.disable?.();
        } else {
          await activeCall.microphone.enable?.();
        }
      }

      micMutedRef.current = nextMuted;
      setIsMicMuted(nextMuted);
    } catch (err) {
      console.error("Failed to toggle microphone:", err);
    }
  }, []);

  const handleToggleCamera = useCallback(async () => {
    if (isVoiceMode) return;

    const nextCameraOff = !cameraOffRef.current;
    const activeCall = callRef.current;

    try {
      if (activeCall?.camera) {
        if (nextCameraOff) {
          await activeCall.camera.disable?.();
        } else {
          await activeCall.camera.enable?.();
        }
      }

      cameraOffRef.current = nextCameraOff;
      setIsCameraOff(nextCameraOff);
    } catch (err) {
      console.error("Failed to toggle camera:", err);
    }
  }, [isVoiceMode]);

  const handleToggleScreenShare = useCallback(async () => {
    if (isVoiceMode) return;

    const activeCall = callRef.current;
    if (!activeCall?.screenShare?.toggle) return;

    try {
      await activeCall.screenShare.toggle();
      setIsScreenSharing(Boolean(activeCall.screenShare.enabled));
    } catch (err) {
      console.error("Failed to toggle screen sharing:", err);
    }
  }, [isVoiceMode]);

  const handleToggleReactionMenu = useCallback(() => {
    if (!callRef.current) return;
    setIsReactionMenuOpen((prev) => !prev);
  }, []);

  const handleSendReaction = useCallback(async (reaction) => {
    const activeCall = callRef.current;
    if (!activeCall?.sendReaction) return;

    try {
      await activeCall.sendReaction({
        type: reaction.type,
        emoji_code: reaction.emojiCode,
      });
    } catch (err) {
      console.error("Failed to send reaction:", err);
    } finally {
      setIsReactionMenuOpen(false);
    }
  }, []);

  const handleToggleFullscreen = useCallback(async () => {
    const container = modalContainerRef.current;
    if (!container || typeof document === "undefined") return;

    try {
      if (document.fullscreenElement === container) {
        await document.exitFullscreen();
        return;
      }

      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }

      await container.requestFullscreen();
    } catch (err) {
      console.error("Failed to toggle fullscreen:", err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      closeRequestedRef.current = false;
      setCallStatus(initialCallStatus);
      setError("");
      setLoading(false);
      setIsMicMuted(false);
      setIsCameraOff(isVoiceMode);
      setIsScreenSharing(false);
      setIsReactionMenuOpen(false);
      micMutedRef.current = false;
      cameraOffRef.current = isVoiceMode;
      setConnectedAt(null);
      setElapsedSeconds(0);
      reconnectAttemptRef.current = 0;
      reconnectInFlightRef.current = false;
      clearReconnectTimer();
    }
  }, [clearReconnectTimer, initialCallStatus, isOpen, isVoiceMode]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const syncFullscreenState = () => {
      const container = modalContainerRef.current;
      setIsFullscreen(
        Boolean(container && document.fullscreenElement === container),
      );
    };

    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
    };
  }, []);

  useEffect(() => {
    if (!isReactionMenuOpen || typeof document === "undefined") {
      return undefined;
    }

    const handlePointerDown = (event) => {
      const menuNode = reactionsMenuRef.current;
      if (!menuNode || menuNode.contains(event.target)) {
        return;
      }

      setIsReactionMenuOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsReactionMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isReactionMenuOpen]);

  useEffect(() => {
    if (isOpen || typeof document === "undefined") return;

    const container = modalContainerRef.current;
    if (container && document.fullscreenElement === container) {
      void document.exitFullscreen().catch(() => undefined);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return undefined;

    const handleOffline = () => {
      setError("Network offline. Waiting for reconnection...");
      clearReconnectTimer();
    };

    const handleOnline = () => {
      setError("Network restored. Reconnecting...");
      reconnectAttemptRef.current = 0;
      clearReconnectTimer();
      scheduleReconnect();
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [clearReconnectTimer, isOpen, scheduleReconnect]);

  useEffect(() => {
    if (!isOpen || !callId || !isPendingCall) return undefined;

    let stopped = false;
    const token = getAuthToken();
    const statusProbeUserId = String(
      localUser?.id ||
        currentUserId ||
        currentUserDbId ||
        callData?.currentUserId ||
        "",
    ).trim();
    const userType = resolvedUserType;

    const closeWithStatusMessage = (status) => {
      const normalizedStatus = normalizeCallStatus(status);
      if (normalizedStatus === "rejected") {
        // setError("Call was declined by the other participant.");
      } else if (
        normalizedStatus === "cancelled" ||
        normalizedStatus === "canceled"
      ) {
        setError("Call was canceled.");
      } else if (normalizedStatus === "expired") {
        setError("Call request expired.");
      } else {
        setError("Call is no longer available.");
      }

      setTimeout(() => {
        if (!stopped) {
          closeModalOnce();
        }
      }, 900);
    };

    const syncCallStatus = async () => {
      try {
        const params = {};
        if (statusProbeUserId) {
          params.userId = statusProbeUserId;
        }
        if (userType) {
          params.userType = userType;
        }

        const response = await axios.get(
          `${API_BASE_URL}/api/video/calls/${callId}/details`,
          {
            params,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );

        if (stopped) return;

        const nextStatus = normalizeCallStatus(response.data?.call?.status);
        if (!nextStatus) return;

        if (TERMINAL_STATUSES.has(nextStatus)) {
          setCallStatus(nextStatus);
          closeWithStatusMessage(nextStatus);
          return;
        }

        if (JOINABLE_STATUSES.has(nextStatus)) {
          setCallStatus(nextStatus);
          setError("");
        }
      } catch (err) {
        if (stopped) return;

        if (err?.response?.status === 404) {
          closeWithStatusMessage("expired");
          return;
        }

        const nextStatus = normalizeCallStatus(
          err?.response?.data?.call?.status,
        );

        if (TERMINAL_STATUSES.has(nextStatus)) {
          setCallStatus(nextStatus);
          closeWithStatusMessage(nextStatus);
        }
      }
    };

    void syncCallStatus();
    const intervalId = setInterval(() => {
      void syncCallStatus();
    }, 1500);

    return () => {
      stopped = true;
      clearInterval(intervalId);
    };
  }, [
    isOpen,
    callId,
    isPendingCall,
    localUser?.id,
    currentUserId,
    currentUserDbId,
    callData?.currentUserId,
    resolvedUserType,
    closeModalOnce,
  ]);

  useEffect(() => {
    if (!isOpen || !canJoinCall) return undefined;

    const runId = ++joinRunRef.current;
    let disposed = false;
    const isAborted = () => disposed || joinRunRef.current !== runId;

    const initCall = async () => {
      if (!callId) {
        setError("Missing call ID.");
        return;
      }

      const existingCall = callRef.current;
      const existingClient = clientRef.current;
      if (existingCall && existingClient && existingCall.id === callId) {
        setClient(existingClient);
        setCall(existingCall);
        setError("");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const tokenPayload = await getStreamToken();
        if (isAborted()) return;

        validateStreamTokenPayload(tokenPayload);

        const user = resolveStreamUserFromToken(
          localUserRef.current || {},
          tokenPayload,
        );

        if (!user.id) {
          throw new Error("Missing current user ID");
        }

        const streamToken = tokenPayload.token;
        const apiKey = resolveStreamApiKey(tokenPayload);

        if (!streamToken) {
          throw new Error("Missing Stream token from backend");
        }

        if (!apiKey) {
          throw new Error("Missing Stream API key. Set VITE_STREAM_API_KEY");
        }

        const tokenProvider = async () => {
          const refreshedPayload = await getStreamToken();
          validateStreamTokenPayload(refreshedPayload);
          return refreshedPayload.token;
        };

        let nextClient = clientRef.current;
        const connectedUserId = String(
          nextClient?.state?.connectedUser?.id || "",
        ).trim();
        const targetUserId = String(user.id || "").trim();

        if (!nextClient || connectedUserId !== targetUserId) {
          if (nextClient) {
            await cleanupStreamSession({
              call: callRef.current,
              client: nextClient,
              cleanupPromise: null,
            });
          }

          nextClient = StreamVideoClient.getOrCreateInstance({
            apiKey,
            user,
            token: streamToken,
            tokenProvider,
          });
        }

        if (isAborted()) {
          await cleanupStreamSession({
            call: callRef.current,
            client: nextClient,
            cleanupPromise: null,
          });
          return;
        }

        const nextCall = nextClient.call("default", callId);

        detachCallListeners();
        callUnsubsRef.current = [
          nextCall.on("call.ended", () => {
            closeModalOnce();
          }),
          nextCall.on("call.session_ended", () => {
            closeModalOnce();
          }),
        ];

        detachClientListeners();
        clientUnsubsRef.current = [
          nextClient.on("connection.changed", (event) => {
            if (event?.online === false) {
              setError("Connection interrupted. Reconnecting...");
              scheduleReconnect();
              return;
            }
            setError("");
          }),
          nextClient.on("network.changed", (event) => {
            if (event?.online === false) {
              setError("Network offline. Waiting for reconnection...");
              clearReconnectTimer();
              return;
            }
            setError("Network restored. Reconnecting...");
            scheduleReconnect();
          }),
          nextClient.on("connection.recovered", () => {
            reconnectAttemptRef.current = 0;
            clearReconnectTimer();
            setError("");
          }),
        ];

        if (isVoiceMode && nextCall.camera?.disable) {
          await nextCall.camera.disable();
        } else if (!isVoiceMode && nextCall.camera && cameraOffRef.current) {
          await nextCall.camera.disable?.();
        }

        if (nextCall.microphone && micMutedRef.current) {
          await nextCall.microphone.disable?.();
        }

        await nextCall.join({ create: true });

        if (!isVoiceMode && nextCall.camera && !cameraOffRef.current) {
          await nextCall.camera.enable?.();
        }

        if (nextCall.microphone && !micMutedRef.current) {
          await nextCall.microphone.enable?.();
        }

        if (isAborted()) {
          await cleanupStreamSession({
            call: nextCall,
            client: nextClient,
            cleanupPromise: null,
          });
          return;
        }

        clientRef.current = nextClient;
        callRef.current = nextCall;
        setClient(nextClient);
        setCall(nextCall);
        reconnectAttemptRef.current = 0;
        clearReconnectTimer();
        setError("");
      } catch (err) {
        if (!isAborted()) {
          setError(
            err?.message ||
              `Unable to join ${isVoiceMode ? "voice" : "video"} call.`,
          );
          scheduleReconnect();
        }
      } finally {
        if (!isAborted()) setLoading(false);
      }
    };

    void initCall();

    return () => {
      disposed = true;
      if (joinRunRef.current === runId) {
        joinRunRef.current += 1;
      }

      clearReconnectTimer();
      detachCallListeners();
      detachClientListeners();

      const currentCall = callRef.current;
      const currentClient = clientRef.current;
      setCall(null);
      setClient(null);
      callRef.current = null;
      clientRef.current = null;
      reconnectAttemptRef.current = 0;
      reconnectInFlightRef.current = false;

      if (currentCall || currentClient) {
        void cleanupStreamSession({
          call: currentCall,
          client: currentClient,
          cleanupPromise: null,
        });
      }
    };
  }, [
    isOpen,
    canJoinCall,
    callId,
    localUser?.id,
    closeModalOnce,
    isVoiceMode,
    clearReconnectTimer,
    detachCallListeners,
    detachClientListeners,
    scheduleReconnect,
  ]);

  if (!isOpen) return null;

  return (
    <div className="stream-modal-overlay" role="dialog" aria-modal="true">
      <div
        ref={modalContainerRef}
        className={`stream-modal-container ${isVoiceMode ? "stream-modal-container-voice" : ""}`.trim()}
      >
        <div className="stream-modal-header">
          <h3>{isVoiceMode ? "Voice Call" : "Video Call"}</h3>
          {showTopActions && (
            <div className="stream-modal-actions">
              {!isVoiceMode && (
                <button
                  type="button"
                  onClick={() => {
                    void handleToggleFullscreen();
                  }}
                  className="stream-fullscreen-btn"
                >
                  {isFullscreen ? (
                    <>
                      <FaCompress aria-hidden="true" />
                      <span>Exit Full Screen</span>
                    </>
                  ) : (
                    <>
                      <FaExpand aria-hidden="true" />
                      <span>Full Screen</span>
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  void handleEndForEveryone();
                }}
                className="stream-close-btn"
              >
                {isPendingCall ? "Cancel" : "End"}
              </button>
            </div>
          )}
        </div>

        <div className="stream-modal-content">
          {showConnectingAnimation && (
            <div className="stream-connecting-state" aria-live="polite">
              <div className="stream-connecting-center">
                <div className="stream-avatar-rings" aria-hidden="true">
                  <div className="stream-pulse-ring stream-pulse-ring-1" />
                  <div className="stream-pulse-ring stream-pulse-ring-2" />
                  <div className="stream-pulse-ring stream-pulse-ring-3" />
                  <div className="stream-avatar-glow">{calleeInitials}</div>
                </div>
                <h1 className="stream-callee-name">{calleeName}</h1>
                <p className="stream-connecting-note">
                  {uiStatus === "ringing" ? "Ringing" : "Connecting call"}
                  <span className="stream-ellipsis" aria-hidden="true">
                    <span>.</span>
                    <span>.</span>
                  </span>
                </p>
              </div>
            </div>
          )}

          {showConnectedTimer && (
            <div className="stream-connected-timer" aria-live="polite">
              Connected • {formatDuration(elapsedSeconds)}
            </div>
          )}

          {!loading && !error && isPendingCall && !showConnectingAnimation && (
            <p className="stream-modal-note">Waiting for call acceptance...</p>
          )}
          {loading && !showConnectingAnimation && (
            <p className="stream-modal-note">Connecting call...</p>
          )}
          {!loading && error && <p className="stream-modal-error">{error}</p>}

          {!loading && !error && client && call && (
            <StreamVideo client={client}>
              <StreamCall call={call}>
                <StreamVideoBody
                  calleeName={calleeName}
                  isVoiceMode={isVoiceMode}
                  localUserId={localUser?.id}
                  onLeave={handleCallLeft}
                />
              </StreamCall>
            </StreamVideo>
          )}

          <div className="stream-bottom-controls-wrap">
            <div
              className="stream-bottom-controls"
              role="toolbar"
              aria-label="Call controls"
            >
              <button
                type="button"
                className={`stream-icon-btn ${isMicMuted ? "stream-icon-btn-muted" : ""}`.trim()}
                onClick={() => {
                  void handleToggleMic();
                }}
                aria-label={
                  isMicMuted ? "Unmute microphone" : "Mute microphone"
                }
                data-tooltip={isMicMuted ? "Unmute" : "Mute"}
              >
                {isMicMuted ? (
                  <FaMicrophoneSlash aria-hidden="true" />
                ) : (
                  <FaMicrophone aria-hidden="true" />
                )}
              </button>

              {!isVoiceMode && (
                <button
                  type="button"
                  className={`stream-icon-btn ${isCameraOff ? "stream-icon-btn-muted" : ""}`.trim()}
                  onClick={() => {
                    void handleToggleCamera();
                  }}
                  aria-label={
                    isCameraOff ? "Turn camera on" : "Turn camera off"
                  }
                  data-tooltip={isCameraOff ? "Camera On" : "Camera Off"}
                >
                  {isCameraOff ? (
                    <FaVideoSlash aria-hidden="true" />
                  ) : (
                    <FaVideo aria-hidden="true" />
                  )}
                </button>
              )}

              {!isVoiceMode && canShareScreen && (
                <button
                  type="button"
                  className={`stream-icon-btn ${isScreenSharing ? "stream-icon-btn-active" : ""}`.trim()}
                  onClick={() => {
                    void handleToggleScreenShare();
                  }}
                  disabled={screenShareDisabled}
                  aria-label={
                    isScreenSharing
                      ? "Stop screen sharing"
                      : "Start screen sharing"
                  }
                  data-tooltip={isScreenSharing ? "Stop Share" : "Share Screen"}
                >
                  <FaDesktop aria-hidden="true" />
                </button>
              )}

              {canCreateReactions && (
                <div
                  className="stream-reactions-control"
                  ref={reactionsMenuRef}
                >
                  <button
                    type="button"
                    className={`stream-icon-btn ${isReactionMenuOpen ? "stream-icon-btn-active" : ""}`.trim()}
                    onClick={handleToggleReactionMenu}
                    disabled={reactionsDisabled}
                    aria-label="Open reactions"
                    aria-haspopup="menu"
                    aria-expanded={isReactionMenuOpen}
                    data-tooltip="Reactions"
                  >
                    <FaRegSmile aria-hidden="true" />
                  </button>

                  {isReactionMenuOpen && (
                    <div className="stream-reactions-menu" role="menu">
                      {QUICK_REACTIONS.map((reaction) => (
                        <button
                          key={reaction.emojiCode}
                          type="button"
                          className="stream-reaction-item"
                          onClick={() => {
                            void handleSendReaction(reaction);
                          }}
                          aria-label={reaction.label}
                          title={reaction.label}
                        >
                          <span aria-hidden="true">{reaction.symbol}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                className="stream-icon-btn stream-icon-btn-danger"
                onClick={() => {
                  void handleEndForEveryone();
                }}
                aria-label="End call"
                data-tooltip="End Call"
              >
                <FaPhoneSlash aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;
