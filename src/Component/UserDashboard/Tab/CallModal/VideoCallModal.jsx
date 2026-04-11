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
  SpeakerLayout,
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

const activeVideoSessions = new Map();

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
    session.cleanupPromise = Promise.allSettled([
      Promise.resolve(session.call?.leave?.()),
      Promise.resolve(session.client?.disconnectUser?.()),
    ]).then(() => undefined);
  }

  return session.cleanupPromise;
};

const StreamVideoBody = ({ onLeave, onControlLeave, isVoiceMode }) => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      onLeave();
    }
  }, [callingState, onLeave]);

  return (
    <StreamTheme>
      <div
        className={`stream-call-shell ${isVoiceMode ? "stream-call-shell-voice" : "stream-call-shell-video"}`.trim()}
      >
        <SpeakerLayout />
        <CallControls onLeave={onControlLeave} />
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
  const closeRequestedRef = useRef(false);
  const joinRunRef = useRef(0);
  const modalContainerRef = useRef(null);
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

  const closeModalOnce = useCallback(() => {
    if (closeRequestedRef.current) return;
    closeRequestedRef.current = true;
    onClose();
  }, [onClose]);

  const handleCallLeft = useCallback(() => {
    closeModalOnce();
  }, [closeModalOnce]);

  const handleEndForEveryone = useCallback(async () => {
    const activeCall = callRef.current;

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

    if (callId && onEndCall) {
      try {
        await onEndCall(callId);
      } catch {
        // Ignore API failures so local UI can still close.
      }
    }

    closeModalOnce();
  }, [callId, onEndCall, closeModalOnce, isVoiceMode]);

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
    }
  }, [isOpen, initialCallStatus]);

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
    let currentClient = null;
    let currentCall = null;
    let currentSession = null;
    let sessionKey = "";
    let offCallEnded = null;
    const isAborted = () => disposed || joinRunRef.current !== runId;

    const initCall = async () => {
      if (!callId) {
        setError("Missing call ID.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const tokenPayload = await getStreamToken();
        if (isAborted()) return;

        validateStreamTokenPayload(tokenPayload);

        const user = resolveStreamUserFromToken(localUser, tokenPayload);

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

        sessionKey = `${callId}:${user.id}`;
        const existingSession = activeVideoSessions.get(sessionKey);

        if (existingSession) {
          await cleanupStreamSession(existingSession);
          if (activeVideoSessions.get(sessionKey) === existingSession) {
            activeVideoSessions.delete(sessionKey);
          }
        }

        if (isAborted()) return;

        currentClient = new StreamVideoClient({
          apiKey,
          token: streamToken,
          user,
        });

        currentCall = currentClient.call("default", callId);
        await currentCall.join({ create: true });

        if (isAborted()) {
          await cleanupStreamSession({
            call: currentCall,
            client: currentClient,
            cleanupPromise: null,
          });
          return;
        }

        if (isVoiceMode && currentCall.camera?.disable) {
          await currentCall.camera.disable();
        }

        if (isAborted()) {
          await cleanupStreamSession({
            call: currentCall,
            client: currentClient,
            cleanupPromise: null,
          });
          return;
        }

        currentSession = {
          call: currentCall,
          client: currentClient,
          cleanupPromise: null,
        };
        activeVideoSessions.set(sessionKey, currentSession);

        offCallEnded = currentCall.on("call.ended", () => {
          closeModalOnce();
        });

        if (isAborted()) return;

        callRef.current = currentCall;
        setClient(currentClient);
        setCall(currentCall);
      } catch (err) {
        if (!isAborted()) {
          setError(
            err?.message ||
              `Unable to join ${isVoiceMode ? "voice" : "video"} call.`,
          );
        }
      } finally {
        if (!isAborted()) setLoading(false);
      }
    };

    initCall();

    return () => {
      disposed = true;
      if (joinRunRef.current === runId) {
        joinRunRef.current += 1;
      }

      setCall(null);
      setClient(null);
      callRef.current = null;

      if (offCallEnded) {
        offCallEnded();
      }

      if (currentSession) {
        void cleanupStreamSession(currentSession).finally(() => {
          if (activeVideoSessions.get(sessionKey) === currentSession) {
            activeVideoSessions.delete(sessionKey);
          }
        });
        return;
      }

      if (currentCall || currentClient) {
        void cleanupStreamSession({
          call: currentCall,
          client: currentClient,
          cleanupPromise: null,
        });
      }
    };
  }, [isOpen, canJoinCall, callId, localUser, closeModalOnce, isVoiceMode]);

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
                  isVoiceMode={isVoiceMode}
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