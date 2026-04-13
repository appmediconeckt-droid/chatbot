import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import {
  CallControls,
  CallingState,
  ParticipantView,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import "./VideoCallModal.css";
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

const getAuthToken = () =>
  localStorage.getItem("token") || localStorage.getItem("accessToken") || "";

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

const StreamVideoBody = ({ onLeave, onControlLeave, localUserId }) => {
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

  const mainParticipant = remoteParticipants[0] || null;

  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      onLeave();
    }
  }, [callingState, onLeave]);

  return (
    <StreamTheme className="stream-theme-root">
      <div className="stream-layout-root">
        <div className="stream-main-stage">
          {mainParticipant ? (
            <>
              <ParticipantView
                className="stream-main-participant"
                participant={mainParticipant}
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

        <div className="stream-controls-dock">
          <CallControls onLeave={onControlLeave} />
        </div>
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
  const isPendingCall = PENDING_STATUSES.has(callStatus);
  const isTerminalCall = TERMINAL_STATUSES.has(callStatus);
  const canJoinCall = !isPendingCall && !isTerminalCall;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    onEndCallRef.current = onEndCall;
  }, [onEndCall]);

  useEffect(() => {
    localUserRef.current = localUser;
  }, [localUser]);

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
      await activeCall.join({ create: true });

      if (isVoiceMode && activeCall.camera?.disable) {
        await activeCall.camera.disable();
      }

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
      reconnectAttemptRef.current = 0;
      reconnectInFlightRef.current = false;
      clearReconnectTimer();
    }
  }, [clearReconnectTimer, initialCallStatus, isOpen]);

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
    const userId = String(localUser?.id || "").trim();
    const userType = resolvedUserType;

    const closeWithStatusMessage = (status) => {
      const normalizedStatus = normalizeCallStatus(status);
      if (normalizedStatus === "rejected") {
        setError("Call was declined by the other participant.");
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
      if (!userId) {
        return;
      }

      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/video/calls/${callId}/details`,
          {
            params: { userId, userType },
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

        await nextCall.join({ create: true });

        if (isVoiceMode && nextCall.camera?.disable) {
          await nextCall.camera.disable();
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
          <div className="stream-modal-actions">
            {!isVoiceMode && (
              <button
                type="button"
                onClick={() => {
                  void handleToggleFullscreen();
                }}
                className="stream-fullscreen-btn"
              >
                {isFullscreen ? "Exit Full Screen" : "Full Screen"}
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
        </div>

        <div className="stream-modal-content">
          {!loading && !error && isPendingCall && (
            <p className="stream-modal-note">Waiting for call acceptance...</p>
          )}
          {loading && <p className="stream-modal-note">Connecting call...</p>}
          {!loading && error && <p className="stream-modal-error">{error}</p>}

          {!loading && !error && client && call && (
            <StreamVideo client={client}>
              <StreamCall call={call}>
                <StreamVideoBody
                  localUserId={localUser?.id}
                  onLeave={handleCallLeft}
                  onControlLeave={() => {
                    void handleEndForEveryone();
                  }}
                />
              </StreamCall>
            </StreamVideo>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;
