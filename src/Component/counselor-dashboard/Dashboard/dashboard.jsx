import React, { useState, useEffect, useRef } from "react";
import socketService from "../../../services/socketService";
import "./CounselorDashboard.css";
import { useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaVideo,
  FaComments,
  FaUsers,
  FaMoneyBillWave,
  FaCog,
  FaUser,
} from "react-icons/fa";
import useVibration from "../../../hooks/useVibration";
import useRingtone from "../../../hooks/useRingtone";
import axios from "axios";
import { API_BASE_URL } from "../../../axiosConfig";

import Dashboard from "../Tab/CounselorDashboard/Dashboardcou";
import Messagesou from "../Tab/Messages/Messagesou";
import CounselorProfile from "../Tab/Profile-Con/CounselorProfile";
import VideoCallModal from "../../UserDashboard/Tab/CallModal/VideoCallModal";
import IncomingCallModal from "../../common/IncomingCallModal/IncomingCallModal";
import LocationNoticeToast from "../../common/LocationNoticeToast";

import { getAuthToken, getCounsellorId } from "./hooks/counsellorAuth";
import useCounsellorData from "./hooks/useCounsellorData";
import useAppointments from "./hooks/useAppointments";
import useCallManagement from "./hooks/useCallManagement";
import usePendingRequests from "./hooks/usePendingRequests";

import CounselorSidebar from "./components/CounselorSidebar";
import {
  MobileHeader,
  MobileMenuOverlay,
  MobileBottomNav,
} from "./components/MobileNav";
import AppointmentsTab from "./components/AppointmentsTab";
import RequestModal from "./components/RequestModal";
import LogoutModal from "./components/LogoutModal";

export default function CounselorDashboard() {
  const [activeTab, setActiveTab] = useState("messages");
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const socketRef = useRef(null);

  const navigate = useNavigate();
  const vibrate = useVibration();
  const { startRinging, stopRinging } = useRingtone();

  const { counselorData, loading } = useCounsellorData();

  const {
    appointments,
    setAppointments,
    selectedDate,
    setSelectedDate,
    handleUpdateAppointmentStatus,
  } = useAppointments(activeTab);

  const {
    showIncomingCallModal,
    isVideoModalOpen,
    selectedCall,
    incomingCallData,
    handleInitiateVideoCall,
    handleAcceptIncomingCall,
    handleRejectIncomingCall,
    handleEndCall,
    handleCloseVideoModal,
    handleCloseIncomingModal,
  } = useCallManagement({ vibrate, startRinging, stopRinging });

  const handleSessionExpired = () => {
    localStorage.clear();
    sessionStorage.clear();
    setShowLogoutConfirm(false);
    navigate("/role-selector", {
      replace: true,
      state: {
        reason: "session-expired",
        message:
          "You were logged out because your account was used on another device.",
      },
    });
  };

  const {
    pendingRequests,
    loadingRequests,
    showRequestModal,
    currentRequest,
    modalCountdown,
    handleAcceptRequest,
    handleRejectRequest,
  } = usePendingRequests({ vibrate, onSessionExpired: handleSessionExpired });

  const handleLogout = async () => {
    try {
      vibrate([50, 30, 50]);
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");
      await axios.post(
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
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    const counsellorId = getCounsellorId();
    if (!counsellorId) return;

    let mounted = true;

    const onAppointmentBooked = (appointment) => {
      if (!mounted) return;
      setAppointments((prev) => [appointment, ...prev]);
      vibrate([100, 50, 100]);
      alert(`New appointment requested for ${new Date(appointment.date).toLocaleString()}`);
    };

    const onConnectError = (error) => {
      console.error("Counselor socket connection error:", error.message);
    };

    socketService.connect().then((socket) => {
      if (!mounted) return;
      socketRef.current = socket;
      console.log("Counselor Socket Connected");
      socket.on("appointmentBooked", onAppointmentBooked);
      socket.on("connect_error", onConnectError);
    }).catch((err) => {
      console.error("[Dashboard] Socket connect failed:", err.message);
    });

    return () => {
      mounted = false;
      socketService.off("appointmentBooked", onAppointmentBooked);
      socketService.off("connect_error", onConnectError);
      socketRef.current = null;
    };
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

  const handleViewAllRequests = () => {
    setSelectedDate("");
  };

  return (
    <div className="couns-dashboard">
      <LocationNoticeToast />
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

      <VideoCallModal
        isOpen={isVideoModalOpen}
        onClose={handleCloseVideoModal}
        callData={selectedCall}
        callMode={selectedCall?.callType || selectedCall?.type || "video"}
        currentUser={{
          id: localStorage.getItem("counsellorId"),
          role: "counsellour",
        }}
        onEndCall={handleEndCall}
      />

      {!isMobile && (
        <CounselorSidebar
          counselorData={counselorData}
          navItems={navItems}
          activeTab={activeTab}
          handleTabChange={handleTabChange}
          setShowLogoutConfirm={setShowLogoutConfirm}
        />
      )}

      {isMobile && (
        <MobileHeader
          showMobileMenu={showMobileMenu}
          setShowMobileMenu={setShowMobileMenu}
        />
      )}

      {isMobile && showMobileMenu && (
        <MobileMenuOverlay
          counselorData={counselorData}
          navItems={navItems}
          activeTab={activeTab}
          handleTabChange={handleTabChange}
          setShowLogoutConfirm={setShowLogoutConfirm}
          setShowMobileMenu={setShowMobileMenu}
        />
      )}

      {isMobile && !showMobileMenu && (
        <MobileBottomNav
          navItems={navItems}
          activeTab={activeTab}
          handleTabChange={handleTabChange}
        />
      )}

      <div className={`couns-main-content ${isMobile ? "mobile" : ""}`}>
        {activeTab === "dashboard" && (
          <div className="couns-tab-content">
            <div className="couns-tab-header">
              <Dashboard />
            </div>
          </div>
        )}

        {activeTab === "appointments" && (
          <AppointmentsTab
            appointments={appointments}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            handleViewAllRequests={handleViewAllRequests}
            handleUpdateAppointmentStatus={handleUpdateAppointmentStatus}
            handleInitiateVideoCall={handleInitiateVideoCall}
          />
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

      <RequestModal
        showRequestModal={showRequestModal}
        currentRequest={currentRequest}
        modalCountdown={modalCountdown}
        loadingRequests={loadingRequests}
        handleAcceptRequest={handleAcceptRequest}
        handleRejectRequest={handleRejectRequest}
      />

      <LogoutModal
        showLogoutConfirm={showLogoutConfirm}
        setShowLogoutConfirm={setShowLogoutConfirm}
        handleLogout={handleLogout}
      />
    </div>
  );
}