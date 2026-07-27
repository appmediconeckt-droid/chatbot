import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../axiosConfig";
import socketService from "../../../../services/socketService";
import { getAuthToken, getCounsellorId } from "./counsellorAuth";
import {
  getAnonymousParticipantId,
  getAnonymousUserDisplay,
} from "../../../../utils/anonymousUser";

export default function useCallManagement({ vibrate, startRinging, stopRinging }) {
  const [showIncomingCallModal, setShowIncomingCallModal] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [waitingCalls, setWaitingCalls] = useState([]);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [isPolling, setIsPolling] = useState(true);

  const handleInitiateVideoCall = async (apt, requestedCallType = "video") => {
    const normalizedCallType =
      requestedCallType === "audio" || requestedCallType === "voice"
        ? "audio"
        : "video";
    const modalCallType = normalizedCallType === "audio" ? "voice" : "video";
    const patientInfo = { ...apt, ...(apt.patient || apt.user || apt.client || {}) };
    const anonymousPatient = getAnonymousUserDisplay(patientInfo);
    const counselorId = getCounsellorId();
    const userId = getAnonymousParticipantId(patientInfo);
    const token = getAuthToken();

    if (!userId) {
      alert("Missing patient information.");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/video/calls/initiate`,
        {
          initiatorId: counselorId,
          initiatorType: "counsellour",
          receiverId: userId,
          receiverType: "user",
          callType: normalizedCallType,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data && response.data.success) {
        setSelectedCall({
          id: response.data.callData?.id,
          callId: response.data.callId,
          roomId: response.data.roomId,
          name: anonymousPatient.name,
          profilePic: anonymousPatient.avatarUrl || anonymousPatient.avatar,
          isIncoming: false,
          callType: modalCallType,
          type: modalCallType,
          currentUserId: counselorId,
          currentUserType: "counsellour",
          apiCallData: response.data.callData,
        });
        setIsVideoModalOpen(true);
      } else {
        alert(response.data?.message || "Failed to initiate call");
      }
    } catch (error) {
      console.error("Call initiation error:", error);
      alert(
        error.response?.data?.message || error.message || "Failed to initiate call",
      );
    }
  };

  const acceptCall = async (callId) => {
    try {
      const token = getAuthToken();
      const userId = getCounsellorId();

      if (!userId) {
        console.error("No counsellorId found in localStorage");
        return { success: false, error: "No counsellour ID found" };
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/video/calls/${callId}/accept`,
        { acceptorId: userId, acceptorType: "counsellour" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log("Accept call response:", response.data);
      if (response.data && response.data.success) {
        return { success: true, data: response.data };
      }
      return { success: false, data: response.data };
    } catch (error) {
      console.error("Error accepting call:", error);
      return { success: false, error: error.message };
    }
  };

  const joinCall = async (callId) => {
    try {
      const token = getAuthToken();
      const counsellorId = getCounsellorId();

      const response = await axios.post(
        `${API_BASE_URL}/api/video/calls/${callId}/join`,
        { userId: counsellorId, userType: "counsellour" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log("Join call response:", response.data);
      if (response.data && response.data.success) {
        return { success: true, data: response.data };
      }
      return { success: false, data: response.data };
    } catch (error) {
      console.error("Error joining call:", error);
      return { success: false, error: error.message };
    }
  };

  const endCall = async (callId) => {
    try {
      const token = getAuthToken();
      const counsellorId = getCounsellorId();

      const response = await axios.put(
        `${API_BASE_URL}/api/video/calls/${callId}/end`,
        { userId: counsellorId, endedBy: "counsellour" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log("End call response:", response.data);
      if (response.data && response.data.success) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Error ending call:", error);
      return null;
    }
  };

  const rejectCall = async (callId) => {
    try {
      const token = getAuthToken();
      const counsellorId = getCounsellorId();

      const response = await axios.put(
        `${API_BASE_URL}/api/video/calls/${callId}/reject`,
        { userId: counsellorId, reason: "declined" },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      console.log("Reject call response:", response.data);
      return response.data?.success || false;
    } catch (error) {
      console.error("Error rejecting call:", error);
      return false;
    }
  };

  const handleAcceptIncomingCall = async (callData) => {
    console.log("Accepting call:", callData);

    const resolvedCallId = callData?.callId || callData?.id || callData?._id || null;
    if (!resolvedCallId) {
      console.error("Cannot accept call: missing callId", callData);
      return { success: false, error: "Missing callId" };
    }

    const result = await acceptCall(resolvedCallId);

    if (result && result.success) {
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      const counsellorId =
        localStorage.getItem("counsellorId") || localStorage.getItem("counselorId");

      let detailedCall = null;
      try {
        const detailsResponse = await axios.get(
          `${API_BASE_URL}/api/video/calls/${resolvedCallId}/details`,
          {
            params: { userId: counsellorId, userType: "counsellour" },
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        detailedCall = detailsResponse.data?.call || null;
      } catch (detailsError) {
        console.warn("Could not fetch accepted call details:", detailsError);
      }

      const incomingType = String(
        callData.callType || detailedCall?.type || "video",
      ).toLowerCase();
      const modalType = incomingType === "audio" ? "voice" : incomingType;

      const remoteParticipant = detailedCall
        ? String(detailedCall.initiator?.id) === String(counsellorId)
          ? detailedCall.receiver
          : detailedCall.initiator
        : callData?.from || null;
      const remoteRole = String(
        remoteParticipant?.role ||
          remoteParticipant?.type ||
          callData?.initiatorType ||
          "",
      ).toLowerCase();
      const isPatientRemote =
        remoteRole === "user" ||
        remoteRole === "patient" ||
        Boolean(remoteParticipant?.anonymous || callData?.patientName);
      const anonymousRemote = getAnonymousUserDisplay({
        ...callData,
        ...(remoteParticipant || {}),
      });

      const acceptedCallData = {
        id: detailedCall?.id || resolvedCallId,
        callId: resolvedCallId,
        roomId: result.data?.roomId || detailedCall?.roomId || callData.roomId,
        name: isPatientRemote
          ? anonymousRemote.name
          : remoteParticipant?.displayName ||
            remoteParticipant?.fullName ||
            callData.name,
        isIncoming: true,
        status: result.data?.status || detailedCall?.status || "active",
        type: modalType,
        callType: modalType,
        profilePic: isPatientRemote
          ? anonymousRemote.avatarUrl || anonymousRemote.avatar
          : remoteParticipant?.profilePhoto || callData.image || null,
        phoneNumber: isPatientRemote
          ? "Not available"
          : remoteParticipant?.phoneNumber || remoteParticipant?.phone || "",
        apiCallData: detailedCall,
        receiver: detailedCall?.receiver,
        currentUserId: counsellorId,
        currentUserType: "counsellour",
        from: callData.from,
        initiator: detailedCall?.initiator || callData.initiator,
      };

      setSelectedCall(acceptedCallData);
      setIsVideoModalOpen(true);
      return { success: true, data: acceptedCallData };
    } else {
      console.error("Failed to accept call");
      alert("Failed to accept call. Please try again.");
      return { success: false, error: result?.error || "Failed to accept call" };
    }
  };

  const handleRejectIncomingCall = async (callId) => {
    console.log("Rejecting call:", callId);
    const resolvedCallId =
      callId ||
      incomingCallData?.callId ||
      incomingCallData?.id ||
      incomingCallData?._id;

    if (!resolvedCallId) return false;
    return await rejectCall(resolvedCallId);
  };

  const fetchWaitingCalls = async () => {
    try {
      const token = getAuthToken();
      const counsellorId = getCounsellorId();

      if (!counsellorId || !token) return;

      const response = await axios.get(
        `${API_BASE_URL}/api/video/calls/pending/${counsellorId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const callsList =
        response.data.pendingRequests ||
        response.data.waitingCalls ||
        response.data.calls;

      if (response.data?.success && callsList?.length > 0) {
        setWaitingCalls(callsList);

        const currentIncomingId = incomingCallData?.callId;
        const stillWaiting = currentIncomingId
          ? callsList.some((c) => (c.callId || c.id || c._id) === currentIncomingId)
          : false;

        if (showIncomingCallModal && currentIncomingId && !stillWaiting) {
          setShowIncomingCallModal(false);
          setIncomingCallData(null);
          return;
        }

        const waitingCall =
          callsList.find(
            (call) =>
              !call.status || call.status === "waiting" || call.status === "ringing",
          ) || callsList[0];

        if (waitingCall && !showIncomingCallModal && !isVideoModalOpen) {
          const fromData = waitingCall.from || waitingCall.initiator || {};
          const anonymousCaller = getAnonymousUserDisplay({
            ...waitingCall,
            ...fromData,
          });

          setIncomingCallData({
            callId: waitingCall.callId || waitingCall.id || waitingCall._id,
            roomId: waitingCall.roomId,
            name: anonymousCaller.name,
            image: anonymousCaller.avatarUrl || anonymousCaller.avatar,
            callType: waitingCall.callType || "video",
            from: fromData,
            initiator: waitingCall.initiator,
          });

          setShowIncomingCallModal(true);
          vibrate([200, 100, 200]);
        }
      } else {
        setWaitingCalls([]);
        if (showIncomingCallModal) {
          setShowIncomingCallModal(false);
          setIncomingCallData(null);
        }
      }
    } catch (error) {
      console.error("Error fetching waiting calls:", error);
    }
  };

  useEffect(() => {
    let removeIncomingListener = null;
    let removeAcceptedListener = null;
    let cancelled = false;

    const handleIncomingCall = (payload = {}) => {
      if (cancelled || isVideoModalOpen) return;

      const fromData =
        payload.from && typeof payload.from === "object" ? payload.from : {};
      const anonymousHandle =
        (typeof payload.from === "string" && payload.from.trim()) ||
        payload.anonymous ||
        fromData.anonymous ||
        fromData.anonymousName ||
        fromData.displayName ||
        "Anonymous User";
      const anonymousCaller = getAnonymousUserDisplay({
        ...payload,
        ...fromData,
        anonymous: anonymousHandle,
      });

      setIncomingCallData({
        callId: payload.callId || payload.id || payload._id,
        roomId: payload.roomId,
        name: anonymousCaller.name,
        image:
          anonymousCaller.avatarUrl ||
          anonymousCaller.avatar,
        callType: payload.callType || payload.type || "video",
        from: {
          ...fromData,
          anonymous: anonymousHandle,
          displayName: anonymousHandle,
        },
        initiator: payload.initiator,
      });
      setShowIncomingCallModal(true);
      vibrate([200, 100, 200]);
    };

    const handleCallAccepted = (payload = {}) => {
      if (cancelled) return;
      setSelectedCall((previous) =>
        previous
          ? {
              ...previous,
              roomId: payload.roomId || previous.roomId,
              status: "active",
            }
          : previous,
      );
      setIsVideoModalOpen(true);
    };

    void socketService
      .on("incoming_call_request", handleIncomingCall)
      .then((cleanup) => {
        if (cancelled) cleanup();
        else removeIncomingListener = cleanup;
      })
      .catch((error) => {
        console.warn("Incoming call socket listener unavailable:", error);
      });

    void socketService
      .on("call_accepted", handleCallAccepted)
      .then((cleanup) => {
        if (cancelled) cleanup();
        else removeAcceptedListener = cleanup;
      })
      .catch((error) => {
        console.warn("Call accepted socket listener unavailable:", error);
      });

    return () => {
      cancelled = true;
      removeIncomingListener?.();
      removeAcceptedListener?.();
    };
  }, [isVideoModalOpen, vibrate]);

  useEffect(() => {
    if (isPolling && !isVideoModalOpen) {
      fetchWaitingCalls();
      // Socket events open the popup immediately. This short poll remains as
      // a fallback for reconnects or temporarily backgrounded browser tabs.
      const interval = setInterval(fetchWaitingCalls, 2000);
      setPollingInterval(interval);
      return () => clearInterval(interval);
    } else if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [isPolling, showIncomingCallModal, isVideoModalOpen]);

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
    if (showIncomingCallModal && !isVideoModalOpen) {
      void startRinging();
      return;
    }
    stopRinging();
  }, [showIncomingCallModal, isVideoModalOpen, startRinging, stopRinging]);

  useEffect(() => {
    return () => stopRinging();
  }, [stopRinging]);

  const handleJoinCall = async (callId) => {
    try {
      const result = await joinCall(callId);
      if (result?.success) return { success: true, data: result.data };
      return { success: false, error: "Join failed" };
    } catch (error) {
      console.error("Error in join call:", error);
      return { success: false, error: error.message };
    }
  };

  const handleEndCall = async (callId) => {
    try {
      const resolvedCallId =
        callId ||
        selectedCall?.callId ||
        selectedCall?.id ||
        incomingCallData?.callId ||
        incomingCallData?.id;

      if (!resolvedCallId) return { success: false, error: "Missing callId" };

      const result = await endCall(resolvedCallId);
      console.log("Call ended successfully");
      return { success: Boolean(result), data: result || null };
    } catch (error) {
      console.error("Error in end call:", error);
      return { success: false, error: error.message };
    }
  };

  const handleCloseVideoModal = () => {
    setIsVideoModalOpen(false);
    setSelectedCall(null);
    setIsPolling(true);
  };

  const handleCloseIncomingModal = () => {
    setShowIncomingCallModal(false);
    setIncomingCallData(null);
    setIsPolling(true);
  };

  return {
    showIncomingCallModal,
    isVideoModalOpen,
    selectedCall,
    incomingCallData,
    waitingCalls,
    handleInitiateVideoCall,
    handleAcceptIncomingCall,
    handleRejectIncomingCall,
    handleJoinCall,
    handleEndCall,
    handleCloseVideoModal,
    handleCloseIncomingModal,
  };
}
