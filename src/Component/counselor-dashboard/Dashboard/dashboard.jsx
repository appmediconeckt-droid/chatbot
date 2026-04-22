// CounselorDashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  Dimensions,
  SafeAreaView,
  StatusBar,
  AppState,
  BackHandler,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/FontAwesome5";
import LinearGradient from "react-native-linear-gradient";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";

// Import custom hooks (create these files)
import useVibration from "../../hooks/useVibration";
import useRingtone from "../../hooks/useRingtone";

// Import tab components (create these files)
import Dashboard from "../Tab/CounselorDashboard/Dashboardcou";
import Messagesou from "../Tab/Messages/Messagesou";
import PatientRequests from "../Tab/PatientRequests/PatientRequests";
import CounselorProfile from "../Tab/Profile-Con/CounselorProfile";
import VideoCallModal from "../../UserDashboard/Tab/CallModal/VideoCallModal";
import IncomingCallModal from "../../common/IncomingCallModal/IncomingCallModal";

const { width, height } = Dimensions.get("window");
const API_BASE_URL = "http://your-api-url.com";

export default function CounselorDashboard() {
  const navigation = useNavigation();
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

  const vibrate = useVibration();
  const { startRinging, stopRinging } = useRingtone();
  const [counselorData, setCounselorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appState, setAppState] = useState(AppState.currentState);

  const getAuthToken = async () => {
    const token = await AsyncStorage.getItem("accessToken") || await AsyncStorage.getItem("token");
    return token;
  };

  const handleSessionExpired = async () => {
    await AsyncStorage.clear();
    navigation.replace("RoleSelector", {
      reason: "session-expired",
      message: "You were logged out because your account was used on another device.",
    });
  };

  const getCounsellorId = async () => {
    let byKey = await AsyncStorage.getItem("counsellorId") ||
                await AsyncStorage.getItem("counselorId") ||
                await AsyncStorage.getItem("userId");
    
    if (byKey) return byKey;

    try {
      const userDataRaw = await AsyncStorage.getItem("userData");
      if (userDataRaw) {
        const userData = JSON.parse(userDataRaw);
        if (userData?._id) {
          const resolvedId = String(userData._id);
          await AsyncStorage.setItem("counsellorId", resolvedId);
          await AsyncStorage.setItem("counselorId", resolvedId);
          await AsyncStorage.setItem("userId", resolvedId);
          return resolvedId;
        }
      }
    } catch (error) {
      console.warn("Failed to parse userData", error);
    }

    const token = await getAuthToken();
    if (!token) return "";

    try {
      const payloadBase64 = token.split(".")[1];
      const normalized = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(normalized));
      const resolvedId = payload?.userId || payload?.id || "";
      if (resolvedId) {
        await AsyncStorage.setItem("counsellorId", resolvedId);
        await AsyncStorage.setItem("counselorId", resolvedId);
        await AsyncStorage.setItem("userId", resolvedId);
      }
      return resolvedId;
    } catch (error) {
      console.warn("Failed to decode token", error);
      return "";
    }
  };

  const acceptCall = async (callId) => {
    try {
      const token = await getAuthToken();
      const userId = await getCounsellorId();

      if (!userId) {
        console.error("No counsellorId found");
        return { success: false, error: "No counsellor ID found" };
      }

      const requestBody = {
        acceptorId: userId,
        acceptorType: "counsellor",
      };

      const response = await axios.put(
        `${API_BASE_URL}/api/video/calls/${callId}/accept`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

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
      const token = await getAuthToken();
      const counsellorId = await getCounsellorId();

      const requestBody = {
        userId: counsellorId,
        userType: "counsellor",
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/video/calls/${callId}/join`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

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
      const token = await getAuthToken();
      const counsellorId = await getCounsellorId();

      const requestBody = {
        userId: counsellorId,
        endedBy: "counsellor",
      };

      const response = await axios.put(
        `${API_BASE_URL}/api/video/calls/${callId}/end`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

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
      const token = await getAuthToken();
      const counsellorId = await getCounsellorId();

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
        }
      );

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
      console.log("Call accepted successfully");

      const token = await getAuthToken();
      const counsellorId = await getCounsellorId();

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
          }
        );
        detailedCall = detailsResponse.data?.call || null;
      } catch (detailsError) {
        console.warn("Could not fetch accepted call details:", detailsError);
      }

      const incomingType = String(callData.callType || detailedCall?.type || "video").toLowerCase();
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
        name: remoteParticipant?.displayName || remoteParticipant?.fullName || callData.name,
        isIncoming: true,
        status: result.data?.status || detailedCall?.status || "active",
        type: modalType,
        callType: modalType,
        profilePic: remoteParticipant?.profilePhoto || callData.image || null,
        phoneNumber: remoteParticipant?.phoneNumber || remoteParticipant?.phone || "",
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
      Alert.alert("Error", "Failed to accept call. Please try again.");
      return { success: false, error: result?.error || "Failed to accept call" };
    }
  };

  const handleRejectIncomingCall = async (callId) => {
    console.log("Rejecting call:", callId);
    const resolvedCallId = callId || incomingCallData?.callId || incomingCallData?.id || incomingCallData?._id;
    if (!resolvedCallId) {
      return false;
    }
    return await rejectCall(resolvedCallId);
  };

  const fetchWaitingCalls = async () => {
    try {
      const token = await getAuthToken();
      const counsellorId = await getCounsellorId();

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
        }
      );

      const callsList = response.data.pendingRequests || response.data.waitingCalls || response.data.calls;

      if (response.data && response.data.success && callsList && callsList.length > 0) {
        setWaitingCalls(callsList);

        const currentIncomingId = incomingCallData?.callId;
        const stillWaiting = currentIncomingId
          ? callsList.some((c) => (c.callId || c.id || c._id) === currentIncomingId)
          : false;

        if (showIncomingCallModal && currentIncomingId && !stillWaiting) {
          console.log("Call no longer in pending list, closing modal");
          setShowIncomingCallModal(false);
          setIncomingCallData(null);
          return;
        }

        const waitingCall = callsList.find(
          (call) => !call.status || call.status === "waiting" || call.status === "ringing"
        ) || callsList[0];

        if (waitingCall && !showIncomingCallModal && !isVideoModalOpen) {
          const fromData = waitingCall.from || waitingCall.initiator || {};

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
    let interval;
    if (isPolling && !isVideoModalOpen) {
      fetchWaitingCalls();
      interval = setInterval(() => {
        fetchWaitingCalls();
      }, 5000);
      setPollingInterval(interval);
    } else if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
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
      startRinging();
    } else {
      stopRinging();
    }
  }, [showIncomingCallModal, isVideoModalOpen]);

  useEffect(() => {
    return () => {
      stopRinging();
    };
  }, []);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === "active") {
        fetchWaitingCalls();
        fetchPendingRequests();
      }
      setAppState(nextAppState);
    });
    return () => subscription.remove();
  }, [appState]);

  const fetchPendingRequests = async () => {
    setLoadingRequests(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        handleSessionExpired();
        return null;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/chat/pending-requests`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          timeout: 30000,
        }
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
      if (error.response?.status === 401) {
        handleSessionExpired();
        return null;
      }
      console.error("Error fetching pending requests:", error);
      return null;
    } finally {
      setLoadingRequests(false);
    }
  };

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

  useEffect(() => {
    return () => {
      if (modalTimer) {
        clearInterval(modalTimer);
      }
    };
  }, [modalTimer]);

  const handleAcceptRequest = async () => {
    if (!currentRequest) return;

    vibrate([50, 30, 50]);

    try {
      const token = await getAuthToken();
      const chatId = currentRequest.chatId;

      if (!chatId) {
        console.error("No chatId found in request");
        Alert.alert("Error", "Unable to accept request: missing chat ID");
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
        }
      );

      console.log("Request accepted successfully:", response.data);

      if (modalTimer) {
        clearInterval(modalTimer);
        setModalTimer(null);
      }
      setShowRequestModal(false);
      setCurrentRequest(null);

      Alert.alert("Success", "Request accepted successfully!");
      await fetchPendingRequests();
    } catch (error) {
      console.error("Error accepting request:", error);
      const errorMessage = error.response?.data?.message || error.message;
      Alert.alert("Error", `Failed to accept request: ${errorMessage}`);
    }
  };

  const handleRejectRequest = async () => {
    if (!currentRequest) return;

    vibrate([50]);

    try {
      const token = await getAuthToken();
      const chatId = currentRequest.chatId;

      if (!chatId) {
        console.error("No chatId found in request");
        Alert.alert("Error", "Unable to reject request: missing chat ID");
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
        }
      );

      console.log("Request rejected successfully:", response.data);

      if (modalTimer) {
        clearInterval(modalTimer);
        setModalTimer(null);
      }
      setShowRequestModal(false);
      setCurrentRequest(null);

      await fetchPendingRequests();
      Alert.alert("Info", "Request rejected successfully");
    } catch (error) {
      console.error("Error rejecting request:", error);
      const errorMessage = error.response?.data?.message || error.message;
      Alert.alert("Error", `Failed to reject request: ${errorMessage}`);
    }
  };

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

  const handleEndCall = async (callId) => {
    try {
      const resolvedCallId = callId || selectedCall?.callId || selectedCall?.id || incomingCallData?.callId || incomingCallData?.id;
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

      const accessToken = await AsyncStorage.getItem("accessToken");
      const refreshToken = await AsyncStorage.getItem("refreshToken");

      await axios.post(
        `${API_BASE_URL}/api/auth/logout`,
        { refreshToken },
        {
          headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            "Content-Type": "application/json",
          },
        }
      );

      await AsyncStorage.clear();
      setShowLogoutConfirm(false);
      navigation.replace("RoleSelector");
    } catch (error) {
      console.error("Logout Error:", error);
      await AsyncStorage.clear();
      setShowLogoutConfirm(false);
      navigation.replace("RoleSelector");
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(width <= 768);
    };
    checkMobile();
  }, []);

  useEffect(() => {
    const fetchCounsellor = async () => {
      try {
        const counsellorId = await getCounsellorId();
        const token = await getAuthToken();

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
          }
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
          specialization: Array.isArray(data.specialization) ? data.specialization.join(", ") : data.specialization,
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  const navItems = [
    { id: "messages", icon: "comments", label: "Messages", badge: pendingRequests.length },
    { id: "appointments", icon: "calendar-alt", label: "Appointments", badge: 0 },
    { id: "sessions", icon: "video", label: "Sessions", badge: 0 },
    { id: "patients", icon: "users", label: "Patients", badge: 0 },
    { id: "earnings", icon: "money-bill-wave", label: "Earnings", badge: 0 },
    { id: "profile", icon: "user", label: "Profile", badge: 0 },
    { id: "settings", icon: "cog", label: "Settings", badge: 0 },
  ];

  const handleTabChange = (tabId) => {
    vibrate(20);
    setActiveTab(tabId);
    setShowMobileMenu(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "appointments":
        return (
          <View style={styles.workInProgress}>
            <Text style={styles.workInProgressText}>The remaining work is currently in progress.</Text>
          </View>
        );
      case "sessions":
        return (
          <View style={styles.workInProgress}>
            <Text style={styles.workInProgressText}>The remaining work is currently in progress.</Text>
          </View>
        );
      case "patients":
        return (
          <View style={styles.workInProgress}>
            <Text style={styles.workInProgressText}>The remaining work is currently in progress.</Text>
          </View>
        );
      case "earnings":
        return (
          <View style={styles.workInProgress}>
            <Text style={styles.workInProgressText}>The remaining work is currently in progress.</Text>
          </View>
        );
      case "messages":
        return <Messagesou />;
      case "profile":
        return <CounselorProfile />;
      case "settings":
        return (
          <View style={styles.workInProgress}>
            <Text style={styles.workInProgressText}>The remaining work is currently in progress.</Text>
          </View>
        );
      default:
        return <Messagesou />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f7fa" />

      {/* Incoming Call Modal */}
      <IncomingCallModal
        isOpen={showIncomingCallModal}
        onClose={handleCloseIncomingModal}
        callType={incomingCallData?.callType || "video"}
        callerName={incomingCallData?.name}
        callerImage={incomingCallData?.image}
        callData={incomingCallData}
        onAccept={(callId, data) =>
          handleAcceptIncomingCall(data || { ...(incomingCallData || {}), callId })
        }
        onReject={handleRejectIncomingCall}
        fallbackName="User"
      />

      {/* Video Call Modal */}
      <VideoCallModal
        isOpen={isVideoModalOpen}
        onClose={handleCloseVideoModal}
        callData={selectedCall}
        callMode={selectedCall?.callType || selectedCall?.type || "video"}
        currentUser={{
          id: counselorData?.id,
          role: "counsellor",
        }}
        onEndCall={handleEndCall}
      />

      {/* Request Modal */}
      <Modal
        visible={showRequestModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRequestModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRequestModal(false)}
        >
          <View style={styles.requestModal}>
            <View style={styles.requestModalHeader}>
              <View style={styles.requestHeaderLeft}>
                <View style={styles.requestIcon}>
                  <Icon name="users" size={24} color="#667eea" />
                </View>
                <View>
                  <Text style={styles.requestModalTitle}>New Chat Request</Text>
                  <Text style={styles.requestTimer}>Auto-closes in {modalCountdown}s</Text>
                </View>
              </View>
            </View>

            <View style={styles.requestModalBody}>
              <View style={styles.requestPatientInfo}>
                <Text style={styles.requestPatientName}>
                  {currentRequest?.user?.anonymous || currentRequest?.patientName || "Unknown User"}
                </Text>
                <View style={styles.requestTypeBadge}>
                  <Text style={styles.requestTypeText}>Chat Request</Text>
                </View>
              </View>

              <View style={styles.requestMessage}>
                <Text style={styles.requestMessageText}>
                  {currentRequest?.requestMessage || currentRequest?.message || "Would like to start a conversation with you."}
                </Text>
              </View>

              <View style={styles.requestMeta}>
                <Text style={styles.requestTime}>
                  Requested: {new Date(currentRequest?.requestedAt || currentRequest?.createdAt).toLocaleTimeString()}
                </Text>
              </View>
            </View>

            <View style={styles.requestModalFooter}>
              <TouchableOpacity
                style={[styles.requestButton, styles.rejectButton]}
                onPress={handleRejectRequest}
                disabled={loadingRequests}
              >
                <Icon name="times" size={16} color="#fff" />
                <Text style={styles.requestButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.requestButton, styles.acceptButton]}
                onPress={handleAcceptRequest}
                disabled={loadingRequests}
              >
                <Icon name="check" size={16} color="#fff" />
                <Text style={styles.requestButtonText}>Accept</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.requestProgress}>
              <View style={[styles.requestProgressBar, { width: `${(modalCountdown / 10) * 100}%` }]} />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLogoutConfirm(false)}
        >
          <View style={styles.logoutModal}>
            <Icon name="exclamation-triangle" size={48} color="#e53e3e" style={styles.warningIcon} />
            <Text style={styles.logoutModalTitle}>Confirm Logout</Text>
            <Text style={styles.logoutModalText}>Are you sure you want to logout?</Text>
            <View style={styles.logoutModalActions}>
              <TouchableOpacity
                style={[styles.logoutButton, styles.cancelButton]}
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.logoutButton, styles.confirmButton]}
                onPress={handleLogout}
              >
                <Text style={styles.confirmButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Desktop Sidebar */}
      {!isMobile && (
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <View style={styles.counselorProfile}>
              {counselorData?.profilePhoto ? (
                <Image source={{ uri: counselorData.profilePhoto }} style={styles.profileAvatar} />
              ) : (
                <Icon name="user-circle" size={80} color="#cbd5e0" />
              )}
              <Text style={styles.counselorName}>{counselorData?.name || "Counselor"}</Text>
              <View style={styles.extraInfo}>
                <Text style={styles.extraInfoText}>
                  <Text style={styles.extraInfoLabel}>Specialization:</Text> {counselorData?.specialization || "Not specified"}
                </Text>
                <Text style={styles.extraInfoText}>
                  <Text style={styles.extraInfoLabel}>Email:</Text> {counselorData?.email || "Not specified"}
                </Text>
                <Text style={styles.extraInfoText}>
                  <Text style={styles.extraInfoLabel}>Phone:</Text> {counselorData?.phoneNumber || "Not specified"}
                </Text>
                <Text style={styles.extraInfoText}>
                  <Text style={styles.extraInfoLabel}>Experience:</Text> {counselorData?.experience || "0 years"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.sidebarNav}>
            {navItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.navItem, activeTab === item.id && styles.navItemActive]}
                onPress={() => handleTabChange(item.id)}
              >
                <Icon name={item.icon} size={20} color={activeTab === item.id ? "#667eea" : "#718096"} />
                <Text style={[styles.navLabel, activeTab === item.id && styles.navLabelActive]}>
                  {item.label}
                </Text>
                {item.badge > 0 && (
                  <View style={styles.navBadge}>
                    <Text style={styles.navBadgeText}>{item.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.navItem, styles.logoutNavItem]}
              onPress={() => setShowLogoutConfirm(true)}
            >
              <Icon name="sign-out-alt" size={20} color="#e53e3e" />
              <Text style={[styles.navLabel, styles.logoutNavLabel]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <View style={styles.mobileHeader}>
          <TouchableOpacity
            style={styles.menuToggle}
            onPress={() => setShowMobileMenu(!showMobileMenu)}
          >
            <Icon name={showMobileMenu ? "times" : "bars"} size={24} color="#1a202c" />
          </TouchableOpacity>
          <Text style={styles.mobileHeaderTitle}>Counselor Dashboard</Text>
          <View style={{ width: 40 }} />
        </View>
      )}

      {/* Mobile Menu Overlay */}
      {isMobile && showMobileMenu && (
        <TouchableOpacity
          style={styles.mobileMenuOverlay}
          activeOpacity={1}
          onPress={() => setShowMobileMenu(false)}
        >
          <View style={styles.mobileMenu}>
            <View style={styles.sidebarHeader}>
              <View style={styles.counselorProfile}>
                {counselorData?.profilePhoto ? (
                  <Image source={{ uri: counselorData.profilePhoto }} style={styles.profileAvatarMobile} />
                ) : (
                  <Icon name="user-circle" size={60} color="#cbd5e0" />
                )}
                <Text style={styles.counselorNameMobile}>{counselorData?.name || "Counselor"}</Text>
                <Text style={styles.specializationText}>
                  <Text style={styles.extraInfoLabel}>Specialization:</Text> {counselorData?.specialization || "Not specified"}
                </Text>
                <View style={styles.ratingBadge}>
                  <Icon name="star" size={14} color="#fbbf24" />
                  <Text style={styles.ratingText}>{counselorData?.rating || 0}</Text>
                </View>
                <View style={styles.extraInfoMobile}>
                  <Text style={styles.extraInfoText}>
                    <Text style={styles.extraInfoLabel}>Email:</Text> {counselorData?.email || "Not specified"}
                  </Text>
                  <Text style={styles.extraInfoText}>
                    <Text style={styles.extraInfoLabel}>Phone:</Text> {counselorData?.phoneNumber || "Not specified"}
                  </Text>
                  <Text style={styles.extraInfoText}>
                    <Text style={styles.extraInfoLabel}>Experience:</Text> {counselorData?.experience || "0 years"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.mobileNav}>
              {navItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.mobileNavItem, activeTab === item.id && styles.mobileNavItemActive]}
                  onPress={() => handleTabChange(item.id)}
                >
                  <Icon name={item.icon} size={20} color={activeTab === item.id ? "#667eea" : "#718096"} />
                  <Text style={[styles.mobileNavLabel, activeTab === item.id && styles.mobileNavLabelActive]}>
                    {item.label}
                  </Text>
                  {item.badge > 0 && (
                    <View style={styles.mobileNavBadge}>
                      <Text style={styles.mobileNavBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                  <Icon name="arrow-right" size={16} color="#cbd5e0" style={styles.mobileNavArrow} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.mobileNavItem, styles.mobileLogoutNavItem]}
                onPress={() => {
                  setShowMobileMenu(false);
                  setShowLogoutConfirm(true);
                }}
              >
                <Icon name="sign-out-alt" size={20} color="#e53e3e" />
                <Text style={[styles.mobileNavLabel, styles.mobileLogoutLabel]}>Logout</Text>
                <Icon name="arrow-right" size={16} color="#cbd5e0" style={styles.mobileNavArrow} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Mobile Bottom Navigation */}
      {isMobile && !showMobileMenu && (
        <View style={styles.bottomNav}>
          {navItems.slice(0, 5).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.bottomNavItem, activeTab === item.id && styles.bottomNavItemActive]}
              onPress={() => handleTabChange(item.id)}
            >
              <Icon name={item.icon} size={20} color={activeTab === item.id ? "#667eea" : "#718096"} />
              <Text style={[styles.bottomNavLabel, activeTab === item.id && styles.bottomNavLabelActive]}>
                {item.label}
              </Text>
              {item.badge > 0 && (
                <View style={styles.bottomNavBadge}>
                  <Text style={styles.bottomNavBadgeText}>{item.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Main Content */}
      <View style={[styles.mainContent, isMobile && styles.mainContentMobile]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {renderContent()}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fa",
  },
  sidebar: {
    width: 280,
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  sidebarHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  counselorProfile: {
    alignItems: "center",
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  profileAvatarMobile: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
  },
  counselorName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a202c",
    marginBottom: 12,
    textAlign: "center",
  },
  counselorNameMobile: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a202c",
    marginBottom: 8,
    textAlign: "center",
  },
  extraInfo: {
    width: "100%",
  },
  extraInfoMobile: {
    width: "100%",
    marginTop: 12,
  },
  extraInfoText: {
    fontSize: 12,
    color: "#718096",
    marginBottom: 4,
  },
  extraInfoLabel: {
    fontWeight: "600",
    color: "#4a5568",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#d97706",
    marginLeft: 4,
  },
  specializationText: {
    fontSize: 12,
    color: "#718096",
    textAlign: "center",
    marginBottom: 8,
  },
  sidebarNav: {
    flex: 1,
    paddingVertical: 20,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginVertical: 4,
  },
  navItemActive: {
    backgroundColor: "#ede9fe",
    borderRightWidth: 3,
    borderRightColor: "#667eea",
  },
  navLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#718096",
    marginLeft: 12,
    flex: 1,
  },
  navLabelActive: {
    color: "#667eea",
  },
  navBadge: {
    backgroundColor: "#e53e3e",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  navBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  logoutNavItem: {
    marginTop: "auto",
  },
  logoutNavLabel: {
    color: "#e53e3e",
  },
  mobileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  menuToggle: {
    padding: 8,
  },
  mobileHeaderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a202c",
  },
  mobileMenuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 1000,
  },
  mobileMenu: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width * 0.8,
    height: height,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  mobileNav: {
    flex: 1,
    paddingVertical: 20,
  },
  mobileNavItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  mobileNavItemActive: {
    backgroundColor: "#ede9fe",
  },
  mobileNavLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#718096",
    marginLeft: 12,
    flex: 1,
  },
  mobileNavLabelActive: {
    color: "#667eea",
  },
  mobileNavBadge: {
    backgroundColor: "#e53e3e",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
    marginRight: 8,
  },
  mobileNavBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  mobileNavArrow: {
    marginLeft: 8,
  },
  mobileLogoutNavItem: {
    marginTop: "auto",
  },
  mobileLogoutLabel: {
    color: "#e53e3e",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingVertical: 8,
    paddingBottom: Platform.OS === "ios" ? 20 : 8,
  },
  bottomNavItem: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  bottomNavItemActive: {
    borderTopWidth: 2,
    borderTopColor: "#667eea",
  },
  bottomNavLabel: {
    fontSize: 10,
    color: "#718096",
    marginTop: 4,
  },
  bottomNavLabelActive: {
    color: "#667eea",
  },
  bottomNavBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#e53e3e",
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: "center",
  },
  bottomNavBadgeText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "bold",
  },
  mainContent: {
    flex: 1,
    marginLeft: 280,
  },
  mainContentMobile: {
    marginLeft: 0,
    marginBottom: 60,
  },
  workInProgress: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  workInProgressText: {
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  requestModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: width * 0.9,
    maxWidth: 400,
    overflow: "hidden",
  },
  requestModalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  requestHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  requestIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  requestModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a202c",
  },
  requestTimer: {
    fontSize: 12,
    color: "#718096",
    marginTop: 2,
  },
  requestModalBody: {
    padding: 20,
  },
  requestPatientInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  requestPatientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a202c",
  },
  requestTypeBadge: {
    backgroundColor: "#ede9fe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  requestTypeText: {
    fontSize: 12,
    color: "#667eea",
    fontWeight: "500",
  },
  requestMessage: {
    marginBottom: 16,
  },
  requestMessageText: {
    fontSize: 14,
    color: "#4a5568",
    lineHeight: 20,
  },
  requestMeta: {
    marginBottom: 8,
  },
  requestTime: {
    fontSize: 12,
    color: "#a0aec0",
  },
  requestModalFooter: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    gap: 12,
  },
  requestButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  rejectButton: {
    backgroundColor: "#e53e3e",
  },
  acceptButton: {
    backgroundColor: "#38a169",
  },
  requestButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  requestProgress: {
    height: 4,
    backgroundColor: "#e2e8f0",
  },
  requestProgressBar: {
    height: 4,
    backgroundColor: "#667eea",
  },
  logoutModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: width * 0.85,
    maxWidth: 320,
    alignItems: "center",
  },
  warningIcon: {
    marginBottom: 16,
  },
  logoutModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a202c",
    marginBottom: 8,
  },
  logoutModalText: {
    fontSize: 14,
    color: "#718096",
    textAlign: "center",
    marginBottom: 24,
  },
  logoutModalActions: {
    flexDirection: "row",
    gap: 12,
  },
  logoutButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#e2e8f0",
  },
  confirmButton: {
    backgroundColor: "#e53e3e",
  },
  cancelButtonText: {
    color: "#4a5568",
    fontWeight: "600",
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});