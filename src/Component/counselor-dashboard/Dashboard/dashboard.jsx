// import React, { useState, useEffect, useRef } from "react";
// import socketService from "../../../services/socketService";
// import "./CounselorDashboard.css";
// import { useNavigate } from "react-router-dom";
// import {
//   FaCalendarAlt,
//   FaVideo,
//   FaComments,
//   FaUsers,
//   FaMoneyBillWave,
//   FaCog,
//   FaUser,
// } from "react-icons/fa";
// import useVibration from "../../../hooks/useVibration";
// import useRingtone from "../../../hooks/useRingtone";
// import axios from "axios";
// import { API_BASE_URL } from "../../../axiosConfig";

// import Dashboard from "../Tab/CounselorDashboard/Dashboardcou";
// import Messagesou from "../Tab/Messages/Messagesou";
// import CounselorProfile from "../Tab/Profile-Con/CounselorProfile";
// import VideoCallModal from "../../UserDashboard/Tab/CallModal/VideoCallModal";
// import IncomingCallModal from "../../common/IncomingCallModal/IncomingCallModal";
// import LocationNoticeToast from "../../common/LocationNoticeToast";
// import AccountSettings from "../../Settings/AccountSettings";

// import { getAuthToken, getCounsellorId } from "./hooks/counsellorAuth";
// import useCounsellorData from "./hooks/useCounsellorData";
// import useAppointments from "./hooks/useAppointments";
// import useCallManagement from "./hooks/useCallManagement";
// import usePendingRequests from "./hooks/usePendingRequests";

// import CounselorSidebar from "./components/CounselorSidebar";
// import {
//   MobileHeader,
//   MobileMenuOverlay,
//   MobileBottomNav,
// } from "./components/MobileNav";
// import { useCounselorTranslation } from "../../../i18n/LanguageContext";
// import AppointmentsTab from "./components/AppointmentsTab";
// import RequestModal from "./components/RequestModal";
// import LogoutModal from "./components/LogoutModal";

// export default function CounselorDashboard() {
//   const { t } = useCounselorTranslation();
//   const [activeTab, setActiveTab] = useState("messages");
//   const [isMobile, setIsMobile] = useState(false);
//   const [showMobileMenu, setShowMobileMenu] = useState(false);
//   const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
//   const socketRef = useRef(null);

//   const navigate = useNavigate();
//   const vibrate = useVibration();
//   const { startRinging, stopRinging } = useRingtone();

//   const { counselorData, loading } = useCounsellorData();

//   const {
//     appointments,
//     setAppointments,
//     selectedDate,
//     setSelectedDate,
//     handleUpdateAppointmentStatus,
//   } = useAppointments(activeTab);

//   const {
//     showIncomingCallModal,
//     isVideoModalOpen,
//     selectedCall,
//     incomingCallData,
//     handleInitiateVideoCall,
//     handleAcceptIncomingCall,
//     handleRejectIncomingCall,
//     handleEndCall,
//     handleCloseVideoModal,
//     handleCloseIncomingModal,
//   } = useCallManagement({ vibrate, startRinging, stopRinging });

//   const handleSessionExpired = () => {
//     localStorage.clear();
//     sessionStorage.clear();
//     setShowLogoutConfirm(false);
//     navigate("/role-selector", {
//       replace: true,
//       state: {
//         reason: "session-expired",
//         message:
//           "You were logged out because your account was used on another device.",
//       },
//     });
//   };

//   const {
//     pendingRequests,
//     loadingRequests,
//     showRequestModal,
//     currentRequest,
//     modalCountdown,
//     handleAcceptRequest,
//     handleRejectRequest,
//   } = usePendingRequests({ vibrate, onSessionExpired: handleSessionExpired });

//   const handleLogout = async () => {
//     try {
//       vibrate([50, 30, 50]);
//       const accessToken = localStorage.getItem("accessToken");
//       const refreshToken = localStorage.getItem("refreshToken");
//       await axios.post(
//         `${API_BASE_URL}/api/auth/logout`,
//         { refreshToken },
//         {
//           withCredentials: true,
//           headers: {
//             ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
//             "Content-Type": "application/json",
//           },
//         },
//       );
//       localStorage.clear();
//       setShowLogoutConfirm(false);
//       navigate("/role-selector");
//     } catch (error) {
//       console.error("Logout Error:", error);
//       localStorage.clear();
//       setShowLogoutConfirm(false);
//       navigate("/role-selector");
//     }
//   };

//   useEffect(() => {
//     const checkMobile = () => setIsMobile(window.innerWidth <= 768);
//     checkMobile();
//     window.addEventListener("resize", checkMobile);
//     return () => window.removeEventListener("resize", checkMobile);
//   }, []);

//   useEffect(() => {
//     const token = getAuthToken();
//     if (!token) return;
//     const counsellorId = getCounsellorId();
//     if (!counsellorId) return;

//     let mounted = true;

//     const onAppointmentBooked = (appointment) => {
//       if (!mounted) return;
//       setAppointments((prev) => [appointment, ...prev]);
//       vibrate([100, 50, 100]);
//       alert(`New appointment requested for ${new Date(appointment.date).toLocaleString()}`);
//     };

//     const onConnectError = (error) => {
//       console.error("Counselor socket connection error:", error.message);
//     };

//     socketService.connect().then((socket) => {
//       if (!mounted) return;
//       socketRef.current = socket;
//       console.log("Counselor Socket Connected");
//       socket.on("appointmentBooked", onAppointmentBooked);
//       socket.on("connect_error", onConnectError);
//     }).catch((err) => {
//       console.error("[Dashboard] Socket connect failed:", err.message);
//     });

//     return () => {
//       mounted = false;
//       socketService.off("appointmentBooked", onAppointmentBooked);
//       socketService.off("connect_error", onConnectError);
//       socketRef.current = null;
//     };
//   }, []);

//   if (loading) {
//     return (
//       <div className="couns-loading">
//         <div className="couns-loading-spinner"></div>
//       </div>
//     );
//   }

//   const navItems = [
//     { id: "messages", icon: <FaComments />, label: t('messages'), badge: pendingRequests.length },
//     { id: "appointments", icon: <FaCalendarAlt />, label: t('appointments') },
//     { id: "sessions", icon: <FaVideo />, label: t('sessions'), badge: 0 },
//     { id: "patients", icon: <FaUsers />, label: t('patients'), badge: 0 },
//     { id: "earnings", icon: <FaMoneyBillWave />, label: t('earnings'), badge: 0 },
//     { id: "profile", icon: <FaUser />, label: t('profile'), badge: 0 },
//     { id: "settings", icon: <FaCog />, label: t('settings'), badge: 0 },
//   ];

//   const handleTabChange = (tabId) => {
//     vibrate(20);
//     setActiveTab(tabId);
//     setShowMobileMenu(false);
//   };

//   const handleViewAllRequests = () => {
//     setSelectedDate("");
//   };

//   return (
//     <div className="couns-dashboard">
//       <LocationNoticeToast />
//       <IncomingCallModal
//         isOpen={showIncomingCallModal}
//         onClose={handleCloseIncomingModal}
//         callType={incomingCallData?.callType || "video"}
//         callerName={incomingCallData?.name}
//         callerImage={incomingCallData?.image}
//         callData={incomingCallData}
//         onAccept={(callId, data) =>
//           handleAcceptIncomingCall(
//             data || { ...(incomingCallData || {}), callId },
//           )
//         }
//         onReject={handleRejectIncomingCall}
//         fallbackName="User"
//       />

//       <VideoCallModal
//         isOpen={isVideoModalOpen}
//         onClose={handleCloseVideoModal}
//         callData={selectedCall}
//         callMode={selectedCall?.callType || selectedCall?.type || "video"}
//         currentUser={{
//           id: localStorage.getItem("counsellorId"),
//           role: "counsellour",
//         }}
//         onEndCall={handleEndCall}
//       />

//       {!isMobile && (
//         <CounselorSidebar
//           counselorData={counselorData}
//           navItems={navItems}
//           activeTab={activeTab}
//           handleTabChange={handleTabChange}
//           setShowLogoutConfirm={setShowLogoutConfirm}
//         />
//       )}

//       {isMobile && (
//         <MobileHeader
//           showMobileMenu={showMobileMenu}
//           setShowMobileMenu={setShowMobileMenu}
//         />
//       )}

//       {isMobile && showMobileMenu && (
//         <MobileMenuOverlay
//           counselorData={counselorData}
//           navItems={navItems}
//           activeTab={activeTab}
//           handleTabChange={handleTabChange}
//           setShowLogoutConfirm={setShowLogoutConfirm}
//           setShowMobileMenu={setShowMobileMenu}
//         />
//       )}

//       {isMobile && !showMobileMenu && (
//         <MobileBottomNav
//           navItems={navItems}
//           activeTab={activeTab}
//           handleTabChange={handleTabChange}
//         />
//       )}

//       <div className={`couns-main-content ${isMobile ? "mobile" : ""}`}>
//         {activeTab === "dashboard" && (
//           <div className="couns-tab-content">
//             <div className="couns-tab-header">
//               <Dashboard />
//             </div>
//           </div>
//         )}

//         {activeTab === "appointments" && (
//           <AppointmentsTab
//             appointments={appointments}
//             selectedDate={selectedDate}
//             setSelectedDate={setSelectedDate}
//             handleViewAllRequests={handleViewAllRequests}
//             handleUpdateAppointmentStatus={handleUpdateAppointmentStatus}
//             handleInitiateVideoCall={handleInitiateVideoCall}
//           />
//         )}

//         {activeTab === "sessions" && (
//           <div className="couns-tab-content">
//             <div className="couns-work-in-progress">
//               The remaining work is currently in progress.
//             </div>
//           </div>
//         )}

//         {activeTab === "patients" && (
//           <div className="couns-tab-content">
//             <div className="couns-work-in-progress">
//               The remaining work is currently in progress.
//             </div>
//           </div>
//         )}

//         {activeTab === "earnings" && (
//           <div className="couns-tab-content">
//             <div className="couns-work-in-progress">
//               The remaining work is currently in progress.
//             </div>
//           </div>
//         )}

//         {activeTab === "messages" && (
//           <div className="couns-tab-content">
//             <div className="couns-tab-header">
//               <Messagesou />
//             </div>
//           </div>
//         )}

//         {activeTab === "profile" && (
//           <div className="couns-tab-content">
//             <CounselorProfile />
//           </div>
//         )}

//         {activeTab === "settings" && (
//           <div className="couns-tab-content">
//             <AccountSettings
//               role="counsellor"
//               onOpenProfile={() => handleTabChange("profile")}
//             />
//           </div>
//         )}
//       </div>

//       <RequestModal
//         showRequestModal={showRequestModal}
//         currentRequest={currentRequest}
//         modalCountdown={modalCountdown}
//         loadingRequests={loadingRequests}
//         handleAcceptRequest={handleAcceptRequest}
//         handleRejectRequest={handleRejectRequest}
//       />

//       <LogoutModal
//         showLogoutConfirm={showLogoutConfirm}
//         setShowLogoutConfirm={setShowLogoutConfirm}
//         handleLogout={handleLogout}
//       />
//     </div>
//   );
// }


import React, { lazy, Suspense, useState, useEffect, useRef } from "react";
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
  FaBell,
  FaHistory,
} from "react-icons/fa";
import useVibration from "../../../hooks/useVibration";
import useRingtone from "../../../hooks/useRingtone";
import axios from "axios";
import { API_BASE_URL } from "../../../axiosConfig";
import {
  getAnonymousParticipantId,
  getAnonymousUserDisplay,
} from "../../../utils/anonymousUser";

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
import { useCounselorTranslation } from "../../../i18n/LanguageContext";
import LogoutModal from "./components/LogoutModal";
import CounselorSkeleton from "./components/CounselorSkeleton";

const AccountSettings = lazy(() => import("../../Settings/AccountSettings"));
const AppointmentsTab = lazy(() => import("./components/AppointmentsTab"));
const CallHistory = lazy(() => import("../../UserDashboard/Tab/Callls/CallHistory"));
const CounselorProfile = lazy(() => import("../Tab/Profile-Con/CounselorProfile"));
const Dashboard = lazy(() => import("../Tab/CounselorDashboard/Dashboardcou"));
const IncomingCallModal = lazy(() => import("../../common/IncomingCallModal/IncomingCallModal"));
const Messagesou = lazy(() => import("../Tab/Messages/Messagesou"));
const SessionsTab = lazy(() => import("./components/SessionsTab"));
const VideoCallModal = lazy(() => import("../../UserDashboard/Tab/CallModal/VideoCallModal"));
const CounselorEarnings = lazy(() => import("../Tab/Earnings/CounselorEarnings"));
const NotificationsPage = lazy(() => import("../../common/Notifications/NotificationsPage"));

const TabLoading = () => (
  <div className="couns-tab-content">
    <CounselorSkeleton />
  </div>
);


export default function CounselorDashboard() {
  const { t } = useCounselorTranslation();
  const [activeTab, setActiveTab] = useState("messages"); // ✅ Default appointments
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const socketRef = useRef(null);

  const navigate = useNavigate();
  const vibrate = useVibration();
  const { startRinging, stopRinging } = useRingtone();

  const { counselorData, loading } = useCounsellorData();

  // ✅ UseAppointments hook - ab sahi kaam karega
  const {
  appointments,
  setAppointments,
  selectedDate,
  setSelectedDate,
  sessionSelectedDate, // ✅ New
  setSessionSelectedDate, // ✅ New
  sessionAppointments,
  clearDateFilter,
  clearSessionDateFilter, // ✅ New
  handleUpdateAppointmentStatus,
  loading: appointmentsLoading,
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
      socketService.disconnect();
      localStorage.clear();
      setShowLogoutConfirm(false);
      navigate("/role-selector");
    } catch (error) {
      console.error("Logout Error:", error);
      socketService.disconnect();
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
    return <CounselorSkeleton />;
  }

  const navItems = [
    { id: "messages", icon: <FaComments />, label: t('messages'), badge: pendingRequests.length },
    { id: "appointments", icon: <FaCalendarAlt />, label: t('appointments') },
    { id: "sessions", icon: <FaVideo />, label: t('sessions'), badge: 0 },
    { id: "call_history", icon: <FaHistory />, label: t('call_history'), badge: 0 },
    // { id: "patients", icon: <FaUsers />, label: t('patients'), badge: 0 },
    { id: "earnings", icon: <FaMoneyBillWave />, label: t('earnings'), badge: 0 },
    // Profile moved to the sidebar actions group as "My Profile"
    // Notifications moved into Settings
    { id: "settings", icon: <FaCog />, label: t('settings'), badge: 0 },
  ];

  const handleTabChange = (tabId) => {
    vibrate(20);
    setActiveTab(tabId);
    setShowMobileMenu(false);
  };

  const getAppointmentPatientInfo = (appointment) => ({
    ...(appointment || {}),
    ...(appointment?.patient || appointment?.user || appointment?.client || {}),
  });

  const getDirectAppointmentChatId = (appointment) =>
    appointment?.chatId ||
    appointment?.chat_id ||
    appointment?.conversationId ||
    appointment?.conversation_id ||
    appointment?.chat?.chatId ||
    appointment?.chat?._id ||
    appointment?.chat?.id;

  const findAppointmentChat = async (appointment, patientId) => {
    const directChatId = getDirectAppointmentChatId(appointment);
    if (directChatId) {
      return { chatId: directChatId, chat: appointment?.chat || null };
    }

    const token = getAuthToken();
    if (!token || !patientId) return { chatId: null, chat: null };

    try {
      const response = await axios.get(`${API_BASE_URL}/api/chat/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const chats = Array.isArray(response.data?.chats)
        ? response.data.chats
        : [];
      const matchedChat = chats.find((chat) => {
        const otherParty = chat.otherParty || chat.user || chat.patient || {};
        const candidates = [
          chat.userId,
          chat.receiverId,
          otherParty._id,
          otherParty.id,
          otherParty.userId,
          otherParty.user_id,
        ].filter(Boolean);
        return candidates.some((id) => String(id) === String(patientId));
      });

      return {
        chatId: matchedChat?.chatId || matchedChat?.id || matchedChat?._id || null,
        chat: matchedChat || null,
      };
    } catch (error) {
      console.error("Unable to resolve appointment chat:", error);
      return { chatId: null, chat: null };
    }
  };

  const handleOpenAppointmentChat = async (appointment) => {
    const patientInfo = getAppointmentPatientInfo(appointment);
    const patientId = getAnonymousParticipantId(patientInfo);

    if (!patientId) {
      alert("Missing patient information.");
      return;
    }

    const { chatId, chat } = await findAppointmentChat(appointment, patientId);
    if (!chatId) {
      alert("Chat is not available for this appointment yet.");
      return;
    }

    const anonymousPatient = getAnonymousUserDisplay({
      ...patientInfo,
      ...(chat?.otherParty || {}),
    });
    const selectedUser = {
      id: chatId,
      _id: patientId,
      receiverId: patientId,
      userId: patientId,
      chatId,
      name: anonymousPatient.name,
      anonymous: anonymousPatient.name,
      gender: anonymousPatient.gender,
      avatar: anonymousPatient.avatar,
      avatarUrl: anonymousPatient.avatarUrl,
      status: chat?.status || "accepted",
      online: chat?.otherParty?.isOnline || chat?.otherParty?.online,
      isOnline: chat?.otherParty?.isOnline || chat?.otherParty?.online,
      lastSeen: chat?.otherParty?.lastSeen,
      phone: "Not available",
      email: "Not available",
      appointmentId: appointment?._id,
      user: {
        id: patientId,
        _id: patientId,
        userId: patientId,
        anonymous: anonymousPatient.name,
        gender: anonymousPatient.gender,
        avatar: anonymousPatient.avatar,
        avatarUrl: anonymousPatient.avatarUrl,
      },
    };

    navigate("/sms-input", {
      state: {
        selectedUser,
        chatId,
        chatData: selectedUser,
      },
    });
  };

  return (
    <div className="couns-dashboard">
      <LocationNoticeToast />
      <Suspense fallback={null}>
        {showIncomingCallModal && (
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
        )}

        {isVideoModalOpen && (
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
        )}
      </Suspense>

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
        <Suspense fallback={<TabLoading />}>
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
            clearDateFilter={clearDateFilter} // ✅ Pass clear function
            handleUpdateAppointmentStatus={handleUpdateAppointmentStatus}
            handleInitiateVideoCall={handleInitiateVideoCall}
            loading={appointmentsLoading}
          />
        )}

       {activeTab === "sessions" && (
  <SessionsTab
    sessionAppointments={sessionAppointments}
    sessionSelectedDate={sessionSelectedDate}
    setSessionSelectedDate={setSessionSelectedDate}
    clearSessionDateFilter={clearSessionDateFilter}
    handleInitiateVideoCall={handleInitiateVideoCall}
    handleInitiateVoiceCall={(appointment) =>
      handleInitiateVideoCall(appointment, "audio")
    }
    handleOpenAppointmentChat={handleOpenAppointmentChat}
    loading={appointmentsLoading}
  />
)}

        {activeTab === "call_history" && (
          <div className="couns-tab-content couns-call-page">
            <div className="couns-call-page-header">
              <div>
                <span className="stitch-apt-eyebrow">Communication log</span>
                <h2>{t('call_history')}</h2>
                <p>Review voice and video calls, missed sessions and call duration.</p>
              </div>
            </div>
            <CallHistory currentUser={{ id: localStorage.getItem("counsellorId"), role: "counsellor" }} />
          </div>
        )}

        {/* {activeTab === "patients" && (
          <div className="couns-tab-content">
            <div className="couns-work-in-progress">
              The remaining work is currently in progress.
            </div>
          </div>
        )} */}

        {activeTab === "earnings" && (
          <div className="couns-tab-content">
            <CounselorEarnings />
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="couns-tab-content">
            <NotificationsPage role="counsellor" />
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
            <AccountSettings
              role="counsellor"
              onOpenProfile={() => handleTabChange("profile")}
            />
          </div>
        )}
        </Suspense>
      </div>

      {/* Disabled - using notification bell in Messages tab instead */}
      {/* <RequestModal
        showRequestModal={showRequestModal}
        currentRequest={currentRequest}
        modalCountdown={modalCountdown}
        loadingRequests={loadingRequests}
        handleAcceptRequest={handleAcceptRequest}
        handleRejectRequest={handleRejectRequest}
      /> */}

      <LogoutModal
        showLogoutConfirm={showLogoutConfirm}
        setShowLogoutConfirm={setShowLogoutConfirm}
        handleLogout={handleLogout}
      />
    </div>
  );
}
