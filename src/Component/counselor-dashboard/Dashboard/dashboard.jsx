import React, { useState, useEffect, useRef } from "react";
import "./CounselorDashboard.css";
import { useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaVideo,
  FaComments,
  FaUserCircle,
  FaStar,
  FaBell,
  FaArrowRight,
  FaExclamationTriangle,
  FaUsers,
  FaMoneyBillWave,
  FaChartPie,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaHome,
  FaCheck,
  FaTimes as FaClose,
  FaMicrophone,
  FaUser,
  FaVideo as FaVideoIcon,
} from "react-icons/fa";
// Custom Hooks
import useVibration from "../../../hooks/useVibration";
import useRingtone from "../../../hooks/useRingtone";
import Dashboard from "../Tab/CounselorDashboard/Dashboardcou";
import Messagesou from "../Tab/Messages/Messagesou";
import PatientRequests from "../Tab/PatientRequests/PatientRequests";
import axios from "axios";
import { API_BASE_URL } from "../../../axiosConfig";
import CounselorProfile from "../Tab/Profile-Con/CounselorProfile";
import VideoCallModal from "../../UserDashboard/Tab/CallModal/VideoCallModal";
import IncomingCallModal from "../../common/IncomingCallModal/IncomingCallModal";

export default function CounselorDashboard() {
  const [activeTab, setActiveTab] = useState("messages");
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [latestRequest, setLatestRequest] = useState(null);

  // Modal States
  const [showIncomingCallModal, setShowIncomingCallModal] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [incomingCallData, setIncomingCallData] = useState(null);

  // Waiting calls polling
  const [waitingCalls, setWaitingCalls] = useState([]);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [isPolling, setIsPolling] = useState(true);

  // Modal state for patient requests
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [modalTimer, setModalTimer] = useState(null);
  const [modalCountdown, setModalCountdown] = useState(10);

  const navigate = useNavigate();
  const vibrate = useVibration();
  const { startRinging, stopRinging } = useRingtone();

  // Accept Call API (POST) for Counselor
  const acceptCall = async (callId) => {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      const userId = localStorage.getItem("counsellorId");

      if (!userId) {
        console.error("No counsellorId found in localStorage");
        return { success: false, error: "No counsellor ID found" };
      }

      const requestBody = {
        acceptorId: userId,
        acceptorType: "counsellor",
      };

      console.log("Accepting call with body:", requestBody);
      console.log(
        "API URL:",
        `${API_BASE_URL}/api/video/calls/${callId}/accept`,
      );

      const response = await axios.put(
        `${API_BASE_URL}/api/video/calls/${callId}/accept`,
        requestBody,
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
      if (error.response) {
        console.error("Error response:", error.response.data);
        console.error("Error status:", error.response.status);
      }
      return { success: false, error: error.message };
    }
  };

  // Join Call API (POST) for Counselor
  const joinCall = async (callId) => {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      const counsellorId = localStorage.getItem("counsellorId");

      const requestBody = {
        userId: counsellorId,
        userType: "counsellor",
      };

      console.log("Joining call with body:", requestBody);

      const response = await axios.post(
        `${API_BASE_URL}/api/video/calls/${callId}/join`,
        requestBody,
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

  // End Call API (PUT) for Counselor
  const endCall = async (callId) => {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      const counsellorId = localStorage.getItem("counsellorId");

      const requestBody = {
        userId: counsellorId,
        endedBy: "counsellor",
      };

      console.log("Ending call with body:", requestBody);

      const response = await axios.put(
        `${API_BASE_URL}/api/video/calls/${callId}/end`,
        requestBody,
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

  // Reject Call API
  const rejectCall = async (callId) => {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      const counsellorId = localStorage.getItem("counsellorId");

      const response = await axios.put(
        `${API_BASE_URL}/api/video/calls/${callId}/reject`,
        {
          userId: counsellorId,
          reason: "declined",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log("Reject call response:", response.data);
      return response.data?.success || false;
    } catch (error) {
      console.error("Error rejecting call:", error);
      return false;
    }
  };

  // Handle Accept from Incoming Modal
  const handleAcceptIncomingCall = async (callData) => {
    console.log("Accepting call:", callData);

    const resolvedCallId =
      callData?.callId || callData?.id || callData?._id || null;

    if (!resolvedCallId) {
      console.error("Cannot accept call: missing callId", callData);
      return { success: false, error: "Missing callId" };
    }

    // First, accept the call via API
    const result = await acceptCall(resolvedCallId);

    if (result && result.success) {
      console.log("Call accepted successfully");

      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      const counsellorId =
        localStorage.getItem("counsellorId") ||
        localStorage.getItem("counselorId");

      let detailedCall = null;
      try {
        const detailsResponse = await axios.get(
          `${API_BASE_URL}/api/video/calls/${resolvedCallId}/details`,
          {
            params: {
              userId: counsellorId,
              userType: "counsellor",
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
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

      const acceptedCallData = {
        id: detailedCall?.id || resolvedCallId,
        callId: resolvedCallId,
        roomId: result.data?.roomId || detailedCall?.roomId || callData.roomId,
        name:
          remoteParticipant?.displayName ||
          remoteParticipant?.fullName ||
          callData.name,
        isIncoming: true,
        status: result.data?.status || detailedCall?.status || "active",
        type: modalType,
        callType: modalType,
        profilePic: remoteParticipant?.profilePhoto || callData.image || null,
        phoneNumber:
          remoteParticipant?.phoneNumber || remoteParticipant?.phone || "",
        apiCallData: detailedCall,
        receiver: detailedCall?.receiver,
        currentUserId: counsellorId,
        currentUserType: "counsellor",
        from: callData.from,
        initiator: detailedCall?.initiator || callData.initiator,
      };

      setSelectedCall(acceptedCallData);
      setIsVideoModalOpen(true);
      return { success: true, data: acceptedCallData };
    } else {
      console.error("Failed to accept call");
      alert("Failed to accept call. Please try again.");
      return {
        success: false,
        error: result?.error || "Failed to accept call",
      };
    }
  };

  // Handle Reject from Incoming Modal
  const handleRejectIncomingCall = async (callId) => {
    console.log("Rejecting call:", callId);
    const resolvedCallId =
      callId ||
      incomingCallData?.callId ||
      incomingCallData?.id ||
      incomingCallData?._id;

    if (!resolvedCallId) {
      return false;
    }
    return await rejectCall(resolvedCallId);
  };

  // Fetch waiting calls from API
  const fetchWaitingCalls = async () => {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      const counsellorId = localStorage.getItem("counsellorId");

      if (!counsellorId || !token) {
        console.log("No counsellorId or token found");
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/video/calls/pending/${counsellorId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log("Waiting calls response:", response.data);

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

        const currentIncomingId = incomingCallData?.callId;
        const stillWaiting = currentIncomingId
          ? callsList.some(
            (c) => (c.callId || c.id || c._id) === currentIncomingId,
          )
          : false;

        if (showIncomingCallModal && currentIncomingId && !stillWaiting) {
          console.log("Call no longer in pending list, closing modal");
          setShowIncomingCallModal(false);
          setIncomingCallData(null);
          return;
        }

        const waitingCall =
          callsList.find(
            (call) =>
              !call.status ||
              call.status === "waiting" ||
              call.status === "ringing",
          ) || callsList[0];

        // Show incoming call modal if not already showing
        if (waitingCall && !showIncomingCallModal && !isVideoModalOpen) {
          const fromData = waitingCall.from || waitingCall.initiator || {};

          // Determine the display name
          let displayName = "Anonymous";
          if (fromData.isAnonymous) {
            displayName = fromData.isAnonymous;
          } else if (fromData.displayName) {
            displayName = fromData.displayName;
          } else if (fromData.fullName) {
            displayName = fromData.fullName;
          } else if (fromData.name) {
            displayName = fromData.name;
          }

          // Determine avatar based on gender
          let initiatorAvatar = "👤";
          if (fromData.gender === "female") initiatorAvatar = "👩";
          else if (fromData.gender === "male") initiatorAvatar = "👨";

          setIncomingCallData({
            callId: waitingCall.callId || waitingCall.id || waitingCall._id,
            roomId: waitingCall.roomId,
            name: displayName,
            image: initiatorAvatar,
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
          console.log("No pending calls remaining, closing incoming modal");
          setShowIncomingCallModal(false);
          setIncomingCallData(null);
        }
      }
    } catch (error) {
      console.error("Error fetching waiting calls:", error);
    }
  };

  // Start polling for waiting calls
  useEffect(() => {
    if (isPolling && !isVideoModalOpen) {
      fetchWaitingCalls();

      const interval = setInterval(() => {
        fetchWaitingCalls();
      }, 5000);

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
  }, [isPolling, showIncomingCallModal, isVideoModalOpen]);

  // Keep polling while incoming modal is open so cancellation is detected.
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
    return () => {
      stopRinging();
    };
  }, [stopRinging]);

  // Function to fetch pending requests using Axios
  const fetchPendingRequests = async () => {
    setLoadingRequests(true);
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${API_BASE_URL}/api/chat/pending-requests`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          // Increase timeout to 30 seconds to avoid premature timeout errors
          timeout: 30000,
        },
      );

      const data = response.data;
      const requests = data.requests || [];

      if (requests.length > 0 && pendingRequests.length !== requests.length) {
        setLatestRequest(requests[0]);
        setShowNotificationPopup(true);

        setTimeout(() => {
          setShowNotificationPopup(false);
        }, 5000);

        showRequestModalWithTimer(requests[0]);
      }

      setPendingRequests(requests);

      if (requests.length > 0) {
        setShowNotesModal(true);
      } else {
        setShowNotesModal(false);
      }

      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.response?.data || error.message);
        console.error("Status:", error.response?.status);
      } else {
        console.error("Error fetching pending requests:", error);
      }
      return null;
    } finally {
      setLoadingRequests(false);
    }
  };

  // Function to show request modal with auto-hide after 10 seconds
  const showRequestModalWithTimer = (requestData) => {
    if (modalTimer) {
      clearInterval(modalTimer);
    }

    setCurrentRequest(requestData);
    setShowRequestModal(true);
    setModalCountdown(10);

    const timer = setInterval(() => {
      setModalCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowRequestModal(false);
          setCurrentRequest(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setModalTimer(timer);
  };

  // Auto-hide modal after 10 seconds (fallback)
  useEffect(() => {
    if (showRequestModal) {
      const timeout = setTimeout(() => {
        setShowRequestModal(false);
        setCurrentRequest(null);
        if (modalTimer) {
          clearInterval(modalTimer);
          setModalTimer(null);
        }
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [showRequestModal]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (modalTimer) {
        clearInterval(modalTimer);
      }
    };
  }, [modalTimer]);

  // Function to handle accept request with automatic page reload
  const handleAcceptRequest = async () => {
    if (!currentRequest) return;

    vibrate([50, 30, 50]);

    try {
      const token = localStorage.getItem("token");
      const chatId = currentRequest.chatId;

      if (!chatId) {
        console.error("No chatId found in request");
        showToastMessage("Unable to accept request: missing chat ID", "error");
        return;
      }

      const response = await axios.patch(
        `${API_BASE_URL}/api/chat/accept/${chatId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log("Request accepted successfully:", response.data);

      if (modalTimer) {
        clearInterval(modalTimer);
        setModalTimer(null);
      }
      setShowRequestModal(false);
      setCurrentRequest(null);

      showToastMessage("Request accepted successfully!", "success");

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Error accepting request:", error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        showToastMessage(`Failed to accept request: ${errorMessage}`, "error");
      } else {
        showToastMessage("Failed to accept request", "error");
      }
    }
  };

  // Function to handle reject request
  const handleRejectRequest = async () => {
    if (!currentRequest) return;

    vibrate([50]);

    try {
      const token = localStorage.getItem("token");
      const chatId = currentRequest.chatId;

      if (!chatId) {
        console.error("No chatId found in request");
        showToastMessage("Unable to reject request: missing chat ID", "error");
        return;
      }

      const response = await axios.patch(
        `${API_BASE_URL}/api/chat/reject/${chatId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log("Request rejected successfully:", response.data);

      if (modalTimer) {
        clearInterval(modalTimer);
        setModalTimer(null);
      }
      setShowRequestModal(false);
      setCurrentRequest(null);

      await fetchPendingRequests();

      showToastMessage("Request rejected successfully", "info");
    } catch (error) {
      console.error("Error rejecting request:", error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        showToastMessage(`Failed to reject request: ${errorMessage}`, "error");
      } else {
        showToastMessage("Failed to reject request", "error");
      }
    }
  };

  // Handle Join Call (for VideoCallModal)
  const handleJoinCall = async (callId) => {
    try {
      const result = await joinCall(callId);
      if (result && result.success) {
        console.log("Call joined successfully", result);
        return { success: true, data: result.data };
      }
      return { success: false, error: "Join failed" };
    } catch (error) {
      console.error("Error in join call:", error);
      return { success: false, error: error.message };
    }
  };

  // Handle End Call (for VideoCallModal)
  const handleEndCall = async (callId) => {
    try {
      const resolvedCallId =
        callId ||
        selectedCall?.callId ||
        selectedCall?.id ||
        incomingCallData?.callId ||
        incomingCallData?.id;

      if (!resolvedCallId) {
        return { success: false, error: "Missing callId" };
      }

      const result = await endCall(resolvedCallId);
      console.log("Call ended successfully");
      return { success: Boolean(result), data: result || null };
    } catch (error) {
      console.error("Error in end call:", error);
      return { success: false, error: error.message };
    }
  };

  // Handle close video modal
  const handleCloseVideoModal = () => {
    setIsVideoModalOpen(false);
    setSelectedCall(null);
    // Resume polling after modal closes
    setIsPolling(true);
  };

  // Handle close incoming call modal
  const handleCloseIncomingModal = () => {
    setShowIncomingCallModal(false);
    setIncomingCallData(null);
    // Resume polling after modal closes
    setIsPolling(true);
  };

  // Toast notification helper
  const showToastMessage = (message, type = "info") => {
    console.log(`${type.toUpperCase()}: ${message}`);
    if (type === "error") {
      alert(`Error: ${message}`);
    } else if (type === "success") {
      alert(`Success: ${message}`);
    } else {
      alert(message);
    }
  };

  // Poll for pending requests every 10 seconds
  useEffect(() => {
    fetchPendingRequests();

    const interval = setInterval(() => {
      fetchPendingRequests();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      vibrate([50, 30, 50]);

      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (!accessToken && !refreshToken) {
        console.warn("No tokens found, clearing storage and redirecting");
        localStorage.clear();
        navigate("/role-selector");
        return;
      }

      if (accessToken) {
        await axios.post(
          `${API_BASE_URL}/api/auth/logout`,
          { refreshToken: refreshToken },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          },
        );
      }

      localStorage.clear();
      setShowLogoutConfirm(false);
      navigate("/role-selector");
    } catch (error) {
      console.error("Logout Error:", error);
      localStorage.clear();
      setShowLogoutConfirm(false);
      navigate("/role-selector");
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const [counselorData, setCounselorData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounsellor = async () => {
      try {
        const counsellorId = localStorage.getItem("counsellorId");
        const token = localStorage.getItem("token");

        if (!counsellorId) {
          console.error("No counsellor ID found");
          setLoading(false);
          return;
        }

        const res = await axios.get(
          `${API_BASE_URL}/api/auth/counsellors/${counsellorId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = res.data.counsellor;

        let profilePhotoUrl = null;
        if (data.profilePhoto) {
          if (typeof data.profilePhoto === "string") {
            profilePhotoUrl = data.profilePhoto;
          } else if (data.profilePhoto.url) {
            profilePhotoUrl = data.profilePhoto.url;
          } else if (data.profilePhoto.publicId) {
            profilePhotoUrl = `https://res.cloudinary.com/dfll8lwos/image/upload/${data.profilePhoto.publicId}`;
          }
        }

        setCounselorData({
          name: data.fullName || data.name,
          specialization: Array.isArray(data.specialization)
            ? data.specialization.join(", ")
            : data.specialization,
          experience: `${data.experience || 0} years`,
          patients: 0,
          rating: data.rating || 4.5,
          email: data.email,
          phoneNumber: data.phoneNumber,
          license: "N/A",
          education: data.qualification || data.education,
          university: "N/A",
          hourlyRate: 0,
          languages: data.languages || [],
          specializations: data.specialization || [],
          aboutMe: data.aboutMe,
          location: data.location,
          consultationMode: data.consultationMode,
          profilePhoto: profilePhotoUrl,
        });
      } catch (error) {
        console.error("Error fetching counsellor:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounsellor();
  }, []);

  if (loading) {
    return (
      <div className="couns-loading">
        <div className="couns-loading-spinner"></div>
      </div>
    );
  }

  const navItems = [
    {
      id: "messages",
      icon: <FaComments />,
      label: "Messages",
      badge: pendingRequests.length,
    },
    { id: "appointments", icon: <FaCalendarAlt />, label: "Appointments" },
    { id: "sessions", icon: <FaVideo />, label: "Sessions", badge: 0 },
    { id: "patients", icon: <FaUsers />, label: "Patients", badge: 0 },
    { id: "earnings", icon: <FaMoneyBillWave />, label: "Earnings", badge: 0 },
    { id: "profile", icon: <FaUser />, label: "Profile", badge: 0 },
    { id: "settings", icon: <FaCog />, label: "Settings", badge: 0 },
  ];

  const handleTabChange = (tabId) => {
    vibrate(20);
    setActiveTab(tabId);
    setShowMobileMenu(false);
  };

  return (
    <div className="couns-dashboard">
      {/* Incoming Call Modal (First Modal - Accept/Reject) */}
      <IncomingCallModal
        isOpen={showIncomingCallModal}
        onClose={handleCloseIncomingModal}
        callType={incomingCallData?.callType || "video"}
        callerName={incomingCallData?.name}
        callerImage={incomingCallData?.image}
        callData={incomingCallData}
        onAccept={(callId, data) =>
          handleAcceptIncomingCall(
            data || { ...(incomingCallData || {}), callId },
          )
        }
        onReject={handleRejectIncomingCall}
        fallbackName="User"
      />

      {/* Video Call Modal (Second Modal - After Accept) */}
      <VideoCallModal
        isOpen={isVideoModalOpen}
        onClose={handleCloseVideoModal}
        callData={selectedCall}
        callMode={selectedCall?.callType || selectedCall?.type || "video"}
        currentUser={{
          id: localStorage.getItem("counsellorId"),
          role: "counsellor",
        }}
        onEndCall={handleEndCall}
      />

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="couns-sidebar">
          <div className="couns-sidebar-header">
            <div className="couns-counselor-profile">
              {counselorData?.profilePhoto ? (
                <img
                  src={counselorData.profilePhoto}
                  alt={counselorData?.name || "Profile"}
                  className="couns-profile-avatar-img"
                  onError={(e) => {
                    console.error(
                      "Image failed to load:",
                      counselorData?.profilePhoto,
                    );
                    e.target.onerror = null;
                    e.target.style.display = "none";
                    const fallbackIcon = e.target.nextElementSibling;
                    if (fallbackIcon) fallbackIcon.style.display = "block";
                  }}
                />
              ) : null}
              {!counselorData?.profilePhoto && (
                <FaUserCircle className="couns-profile-avatar" />
              )}
              <FaUserCircle
                className="couns-profile-avatar-fallback"
                style={{ display: "none" }}
              />

              <h3>{counselorData?.name || "Counselor"}</h3>

              <div className="couns-extra-info">
                <p>
                  <strong>Specialization:</strong>{" "}
                  {counselorData?.specialization || "Not specified"}
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  {counselorData?.email || "Not specified"}
                </p>
                <p>
                  <strong>Phone:</strong>{" "}
                  {counselorData?.phoneNumber || "Not specified"}
                </p>
                <p>
                  <strong>Experience:</strong>{" "}
                  {counselorData?.experience || "0 years"}
                </p>
              </div>
            </div>
          </div>

          <nav className="couns-sidebar-nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`couns-nav-item ${activeTab === item.id ? "active" : ""}`}
                onClick={() => handleTabChange(item.id)}
              >
                <span className="couns-nav-icon">{item.icon}</span>
                <span className="couns-nav-label">{item.label}</span>
                {item.badge > 0 && (
                  <span className="couns-nav-badge">{item.badge}</span>
                )}
              </button>
            ))}

            <button
              className="couns-nav-item logout"
              onClick={() => setShowLogoutConfirm(true)}
            >
              <span className="couns-nav-icon">
                <FaSignOutAlt />
              </span>
              <span className="couns-nav-label">Logout</span>
            </button>
          </nav>
        </aside>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <div className="couns-mobile-header">
          <button
            className="couns-menu-toggle"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <FaTimes /> : <FaBars />}
          </button>


        </div>
      )}

      {/* Mobile Menu Overlay */}
      {isMobile && showMobileMenu && (
        <div className="couns-mobile-menu-overlay">
          <div className="couns-mobile-menu">
            <div className="couns-sidebar-header">
              <div className="couns-counselor-profile">
                {counselorData?.profilePhoto ? (
                  <img
                    src={counselorData.profilePhoto}
                    alt={counselorData?.name || "Profile"}
                    className="couns-profile-avatar-img"
                    onError={(e) => {
                      console.error(
                        "Image failed to load:",
                        counselorData?.profilePhoto,
                      );
                      e.target.onerror = null;
                      e.target.style.display = "none";
                      const fallbackIcon = e.target.nextElementSibling;
                      if (fallbackIcon) fallbackIcon.style.display = "block";
                    }}
                  />
                ) : null}
                {!counselorData?.profilePhoto && (
                  <FaUserCircle className="couns-profile-avatar" />
                )}
                <FaUserCircle
                  className="couns-profile-avatar-fallback"
                  style={{ display: "none" }}
                />

                <h3>{counselorData?.name || "Counselor"}</h3>

                <p>
                  <strong>Specialization:</strong>{" "}
                  {counselorData?.specialization || "Not specified"}
                </p>

                <div className="couns-rating-badge">
                  <FaStar className="couns-star" />
                  <span>{counselorData?.rating || 0}</span>
                </div>

                <div className="couns-extra-info">
                  <p>
                    <strong>Email:</strong>{" "}
                    {counselorData?.email || "Not specified"}
                  </p>
                  <p>
                    <strong>Phone:</strong>{" "}
                    {counselorData?.phoneNumber || "Not specified"}
                  </p>
                  <p>
                    <strong>Experience:</strong>{" "}
                    {counselorData?.experience || "0 years"}
                  </p>
                </div>
              </div>
            </div>

            <nav className="couns-mobile-nav">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className={`couns-mobile-nav-item ${activeTab === item.id ? "active" : ""}`}
                  onClick={() => handleTabChange(item.id)}
                >
                  <span className="couns-mobile-nav-icon">{item.icon}</span>
                  <span className="couns-mobile-nav-label">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="couns-mobile-nav-badge">{item.badge}</span>
                  )}
                  <FaArrowRight className="couns-mobile-nav-arrow" />
                </button>
              ))}

              <button
                className="couns-mobile-nav-item logout"
                onClick={() => {
                  setShowMobileMenu(false);
                  setShowLogoutConfirm(true);
                }}
              >
                <span className="couns-mobile-nav-icon">
                  <FaSignOutAlt />
                </span>
                <span className="couns-mobile-nav-label">Logout</span>
                <FaArrowRight className="couns-mobile-nav-arrow" />
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      {isMobile && !showMobileMenu && (
        <nav className="couns-mobile-bottom-nav">
          {navItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              className={`couns-bottom-nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => handleTabChange(item.id)}
            >
              <span className="couns-bottom-nav-icon">{item.icon}</span>
              <span className="couns-bottom-nav-label">{item.label}</span>
              {item.badge > 0 && (
                <span className="couns-bottom-nav-badge">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>
      )}

      {/* Main Content */}
      <div className={`couns-main-content ${isMobile ? "mobile" : ""}`}>
        {activeTab === "dashboard" && (
          <div className="couns-tab-content">
            <div className="couns-tab-header">
              <Dashboard />
            </div>
          </div>
        )}

        {activeTab === "appointments" && (
          <div className="couns-tab-content">
            <div className="couns-work-in-progress">
              The remaining work is currently in progress.
            </div>
          </div>
        )}

        {activeTab === "sessions" && (
         <div className="couns-tab-content">
            <div className="couns-work-in-progress">
              The remaining work is currently in progress.
            </div>
          </div>
        )}

        {activeTab === "patients" && (
          <div className="couns-tab-content">
            <div className="couns-work-in-progress">
              The remaining work is currently in progress.
            </div>
          </div>
        )}

        {activeTab === "earnings" && (
         <div className="couns-tab-content">
            <div className="couns-work-in-progress">
              The remaining work is currently in progress.
            </div>
          </div>
        )}

        {activeTab === "messages" && (
          <div className="couns-tab-content">
            <div className="couns-tab-header">
              <Messagesou />
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="couns-tab-content">
            <CounselorProfile />
          </div>
        )}

        {activeTab === "settings" && (
         <div className="couns-tab-content">
            <div className="couns-work-in-progress">
              The remaining work is currently in progress.
            </div>
          </div>
        )}
      </div>

      {/* Request Modal */}
      {showRequestModal && currentRequest && (
        <div className="couns-request-modal-overlay" onClick={() => { }}>
          <div
            className="couns-request-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="couns-request-modal-header">
              <div className="couns-request-header-left">
                <div className="couns-request-icon">
                  <FaUsers />
                </div>
                <div>
                  <h3>New Chat Request</h3>
                  <p className="couns-request-timer">
                    Auto-closes in {modalCountdown}s
                  </p>
                </div>
              </div>
            </div>

            <div className="couns-request-modal-body">
              <div className="couns-request-patient-info">
                <div className="couns-request-patient-name">
                  <h4>
                    {currentRequest.user?.anonymous ||
                      currentRequest.patientName ||
                      "Unknown User"}
                  </h4>
                </div>
                <div className="couns-request-type">
                  <span className="couns-request-type-badge">Chat Request</span>
                </div>
              </div>

              <div className="couns-request-message">
                <p>
                  {currentRequest.requestMessage ||
                    currentRequest.message ||
                    "Would like to start a conversation with you."}
                </p>
              </div>

              <div className="couns-request-meta">
                <span className="couns-request-time">
                  Requested:{" "}
                  {new Date(
                    currentRequest.requestedAt || currentRequest.requestedAt,
                  ).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <div className="couns-request-modal-footer">
              <button
                className="couns-request-btn couns-request-reject"
                onClick={handleRejectRequest}
                disabled={loadingRequests}
              >
                <FaClose />
                Reject
              </button>
              <button
                className="couns-request-btn couns-request-accept"
                onClick={handleAcceptRequest}
                disabled={loadingRequests}
              >
                <FaCheck />
                Accept
              </button>
            </div>

            <div className="couns-request-progress">
              <div
                className="couns-request-progress-bar"
                style={{ width: `${(modalCountdown / 10) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          className="couns-modal-overlay"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="couns-modal-content small"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="couns-logout-modal">
              <FaExclamationTriangle className="couns-warning-icon" />
              <h3>Confirm Logout</h3>
              <p>Are you sure you want to logout?</p>
              <div className="couns-modal-actions">
                <button
                  className="couns-cancel-btn"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  Cancel
                </button>
                <button className="couns-confirm-btn" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
