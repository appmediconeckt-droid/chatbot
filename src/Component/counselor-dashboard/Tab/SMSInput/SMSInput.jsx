// SMSInput.jsx - Fully Responsive Chat Interface with Zero Padding Issues on Mobile
import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import "./SMSInput.css";
import { API_BASE_URL } from "../../../../axiosConfig";
import VideoCallModal from "../../../UserDashboard/Tab/CallModal/VideoCallModal";
import useRingtone from "../../../../hooks/useRingtone";
import IncomingCallModal from "../../../common/IncomingCallModal/IncomingCallModal";

const SMSInput = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const chatSocketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [remoteIsTyping, setRemoteIsTyping] = useState(false);

  // Call modal states
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [isInitiatingCall, setIsInitiatingCall] = useState(false);
  const [callError, setCallError] = useState(null);

  // Receiving Call States
  const [showIncomingModal, setShowIncomingModal] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState({
    name: "",
    avatar: "👤",
    callId: "",
    roomId: "",
    callType: "video",
  });
  const { startRinging, stopRinging } = useRingtone();

  // Message states
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [chatStatus, setChatStatus] = useState(null);

  const handleSessionExpired = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/role-selector", {
      replace: true,
      state: {
        reason: "session-expired",
        message:
          "You were logged out because your account was used on another device.",
      },
    });
  };

  const focusMessageInput = () => {
    const input = messageInputRef.current;
    if (!input) return;
    requestAnimationFrame(() => input.focus({ preventScroll: true }));
    setTimeout(
      () => messageInputRef.current?.focus({ preventScroll: true }),
      50,
    );
  };

  // Get selected user from navigation state
  const selectedUser = location.state?.selectedUser;
  const chatId = location.state?.chatId;

  const getCurrentCounselor = () => {
    let counselorData = null;
    const storedCounselor = localStorage.getItem("counselor");
    if (storedCounselor) {
      try {
        counselorData = JSON.parse(storedCounselor);
      } catch (e) {}
    }
    if (!counselorData) {
      const sessionCounselor = sessionStorage.getItem("counselor");
      if (sessionCounselor) {
        try {
          counselorData = JSON.parse(sessionCounselor);
        } catch (e) {}
      }
    }
    if (!counselorData) {
      const userData =
        localStorage.getItem("user") || localStorage.getItem("userData");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (
            user.role === "counselor" ||
            user.role === "counsellor" ||
            user.userType === "counselor"
          ) {
            counselorData = user;
          }
        } catch (e) {}
      }
    }
    return counselorData;
  };

  const getCounselorId = () => {
    if (currentCounselor) {
      if (currentCounselor._id) return currentCounselor._id;
      if (currentCounselor.id) return currentCounselor.id;
      if (currentCounselor.counselorId) return currentCounselor.counselorId;
    }
    const storedId =
      localStorage.getItem("counselorId") ||
      localStorage.getItem("counsellorId");
    if (storedId) return storedId;
    const sessionId =
      sessionStorage.getItem("counselorId") ||
      sessionStorage.getItem("counsellorId");
    if (sessionId) return sessionId;
    return "69c679b6e0e8f0800ff08fd1";
  };

  const currentCounselor = getCurrentCounselor();
  const COUNSELOR_ID = getCounselorId();
  const COUNSELOR_NAME =
    currentCounselor?.name || currentCounselor?.fullName || "Counselor";

  const getSelectedUserId = () => {
    if (!selectedUser) return null;
    return (
      selectedUser.receiverId ||
      selectedUser._id ||
      selectedUser.id ||
      selectedUser.userId ||
      selectedUser.user_id ||
      selectedUser.user?._id ||
      selectedUser.user?.id ||
      selectedUser.user?.userId ||
      selectedUser.otherParty?._id ||
      selectedUser.otherParty?.id ||
      null
    );
  };

  const getUserDetails = () => {
    const id = getSelectedUserId();
    return {
      id,
      name:
        selectedUser?.name ||
        selectedUser?.fullName ||
        selectedUser?.user?.name ||
        selectedUser?.otherParty?.name ||
        "User",
      gender:
        selectedUser?.gender ||
        selectedUser?.user?.gender ||
        selectedUser?.otherParty?.gender,
      phone:
        selectedUser?.phone ||
        selectedUser?.phoneNumber ||
        selectedUser?.user?.phone ||
        selectedUser?.otherParty?.phone,
      email:
        selectedUser?.email ||
        selectedUser?.user?.email ||
        selectedUser?.otherParty?.email,
    };
  };

  const userDetails = getUserDetails();
  const USER_ID = userDetails.id;
  const USER_NAME = userDetails.name;

  const getAvatarByGender = (gender) => {
    if (gender === "male") return "👨";
    if (gender === "female") return "👩";
    return "👤";
  };

  const getChatIdForAPI = () => {
    if (chatId) return chatId;
    if (selectedUser && USER_ID) return `chat_${USER_ID}_${COUNSELOR_ID}`;
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const fetchMessagesFromAPI = async () => {
    if (!selectedUser) return;
    try {
      const apiChatId = getChatIdForAPI();
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      setIsLoadingMessages(true);
      setError(null);
      const response = await axios.get(
        `${API_BASE_URL}/api/chat/chat/${apiChatId}/messages`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        },
      );
      if (response.data && response.data.messages) {
        if (response.data.chatStatus) setChatStatus(response.data.chatStatus);
        const transformedMessages = response.data.messages.map(
          (msg, index) => ({
            id: msg.id || index,
            messageId: msg.messageId,
            text: msg.content,
            sender: msg.senderRole === "counsellor" ? "me" : "user",
            senderRole: msg.senderRole,
            time: new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            fullTime: msg.createdAt,
            contentType: msg.contentType,
            attachmentUrl: msg.attachmentUrl || null,
            attachmentName: msg.attachmentName || null,
            isRead: msg.isRead,
            status: "sent",
          }),
        );
        setMessages(transformedMessages);
        saveMessagesToLocalStorage(transformedMessages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      if (error?.response?.status === 401) {
        handleSessionExpired();
        return;
      }
      loadMessagesFromLocalStorage();
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const saveMessagesToLocalStorage = (messagesToSave) => {
    try {
      const savedChats = JSON.parse(localStorage.getItem("smsChats") || "[]");
      const chatIdToSave = getChatIdForAPI();
      const existingChatIndex = savedChats.findIndex(
        (chat) => chat.chatId === chatIdToSave,
      );
      const chatData = {
        chatId: chatIdToSave,
        userId: USER_ID,
        userName: USER_NAME,
        messages: messagesToSave,
        chatStatus,
        lastUpdated: new Date().toISOString(),
      };
      if (existingChatIndex >= 0) savedChats[existingChatIndex] = chatData;
      else savedChats.push(chatData);
      localStorage.setItem("smsChats", JSON.stringify(savedChats));
    } catch (error) {}
  };

  const loadMessagesFromLocalStorage = () => {
    try {
      const savedChats = JSON.parse(localStorage.getItem("smsChats") || "[]");
      const chatIdToLoad = getChatIdForAPI();
      const savedChat = savedChats.find((chat) => chat.chatId === chatIdToLoad);
      if (savedChat && savedChat.messages) setMessages(savedChat.messages);
    } catch (error) {}
  };

  const sendMessageToAPI = async ({ messageContent = "", file = null }) => {
    try {
      const apiChatId = getChatIdForAPI();
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      let response;
      if (file) {
        const formData = new FormData();
        if (messageContent.trim())
          formData.append("content", messageContent.trim());
        formData.append("attachment", file);
        response = await axios.post(
          `${API_BASE_URL}/api/chat/chat/${apiChatId}/message`,
          formData,
          {
            headers: { Authorization: token ? `Bearer ${token}` : "" },
          },
        );
      } else {
        response = await axios.post(
          `${API_BASE_URL}/api/chat/chat/${apiChatId}/message`,
          { content: messageContent },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : "",
            },
          },
        );
      }
      if (response.data && response.data.success) return response.data.message;
      else throw new Error("Invalid API response");
    } catch (error) {
      console.error("Error sending message:", error);
      if (error?.response?.status === 401) {
        handleSessionExpired();
      }
      throw error;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedUser || isSending) return;
    const messageText = message.trim();
    const tempMessage = {
      id: `temp_${Date.now()}`,
      text: messageText,
      sender: "me",
      senderRole: "counsellor",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      createdAt: new Date().toISOString(),
      status: "sending",
      isTemporary: true,
    };
    setMessages((prev) => [...prev, tempMessage]);
    setMessage("");
    focusMessageInput();
    setIsSending(true);
    setError(null);
    try {
      const sentMsg = await sendMessageToAPI({ messageContent: messageText });
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => !m.isTemporary);
        if (!sentMsg) return withoutTemp;
        const alreadyHas = withoutTemp.some(
          (m) =>
            m.messageId &&
            sentMsg.messageId &&
            m.messageId === sentMsg.messageId,
        );
        if (alreadyHas) return withoutTemp;
        return [
          ...withoutTemp,
          {
            id: sentMsg.id || sentMsg._id,
            messageId: sentMsg.messageId,
            text: sentMsg.content,
            sender: "me",
            senderRole: "counsellor",
            time: new Date(sentMsg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            fullTime: sentMsg.createdAt,
            contentType: sentMsg.contentType,
            isRead: sentMsg.isRead,
            status: "sent",
          },
        ];
      });
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessage.id ? { ...msg, status: "error" } : msg,
        ),
      );
      setError("Failed to send message");
      setTimeout(
        () =>
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== tempMessage.id),
          ),
        3000,
      );
    } finally {
      setIsSending(false);
      focusMessageInput();
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !isSending) {
      e.preventDefault();
      handleSendMessage(e);
      focusMessageInput();
    }
  };

  useEffect(() => {
    if (!isSending) focusMessageInput();
  }, [isSending]);

  const handleFileAttachClick = () => {
    if (isSending) return;
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file || isSending || !selectedUser) return;
    const tempFileMessage = {
      id: `temp_file_${Date.now()}`,
      text: file.name,
      sender: "me",
      senderRole: "counsellor",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      contentType: file.type.startsWith("image/") ? "IMAGE" : "FILE",
      status: "sending",
      isTemporary: true,
    };
    setMessages((prev) => [...prev, tempFileMessage]);
    setIsSending(true);
    try {
      await sendMessageToAPI({ file });
      setMessages((prev) => prev.filter((msg) => !msg.isTemporary));
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempFileMessage.id ? { ...msg, status: "error" } : msg,
        ),
      );
      setError("Failed to send file");
    } finally {
      setIsSending(false);
      e.target.value = "";
    }
  };

  const initiateStreamCall = async (requestedCallType = "video") => {
    const normalizedMode =
      requestedCallType === "audio" || requestedCallType === "voice"
        ? "voice"
        : "video";
    if (!selectedUser) {
      setCallError("No user selected for call");
      return;
    }
    const counselorId = getCounselorId();
    const userId = getSelectedUserId();
    if (!counselorId || !userId) {
      setCallError("Missing user information");
      return;
    }
    setIsInitiatingCall(true);
    setCallError(null);
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      if (!token) throw new Error("Authentication token not found");
      const requestBody = {
        initiatorId: counselorId,
        initiatorType: "counsellor",
        receiverId: userId,
        receiverType: "user",
        callType: normalizedMode === "voice" ? "audio" : "video",
      };
      const response = await axios.post(
        `${API_BASE_URL}/api/video/calls/initiate`,
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.data && response.data.success) {
        const callData = {
          id: response.data.callData?.id,
          callId: response.data.callId,
          roomId: response.data.roomId,
          name: selectedUser.name || USER_NAME,
          type: normalizedMode,
          callType: normalizedMode,
          profilePic: getAvatarByGender(selectedUser.gender),
          phoneNumber: selectedUser.phone || selectedUser.phoneNumber,
          status: response.data.status || "ringing",
          date: "Today",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          apiCallData: response.data.callData,
        };
        setSelectedCall(callData);
        setIsVideoModalOpen(true);
      } else {
        throw new Error(
          response.data?.message || `Failed to initiate ${normalizedMode} call`,
        );
      }
    } catch (error) {
      console.error("Call initiation error:", error);
      setCallError(
        error.response?.data?.message ||
          error.message ||
          "Failed to initiate call",
      );
    } finally {
      setIsInitiatingCall(false);
    }
  };

  const handleVideoCall = () => initiateStreamCall("video");
  const handleVoiceCall = () => initiateStreamCall("audio");

  const handleJoinIncomingCall = async (callId) => {
    try {
      const resolvedCallId =
        callId ||
        incomingCallData?.callId ||
        incomingCallData?.id ||
        incomingCallData?._id;

      if (!resolvedCallId) {
        throw new Error("Missing callId for incoming call");
      }

      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");

      if (!COUNSELOR_ID) {
        throw new Error("Counselor ID not found");
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/video/calls/${resolvedCallId}/accept`,
        {
          acceptorId: COUNSELOR_ID,
          acceptorType: "counsellor",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log("Join call response:", response.data);

      if (response.data && response.data.success) {
        let detailedCall = null;
        try {
          const detailsResponse = await axios.get(
            `${API_BASE_URL}/api/video/calls/${resolvedCallId}/details`,
            {
              params: {
                userId: COUNSELOR_ID,
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
          incomingCallData.callType || detailedCall?.type || "video",
        ).toLowerCase();
        const modalType = incomingType === "audio" ? "voice" : incomingType;

        const remoteParticipant = detailedCall
          ? String(detailedCall.initiator?.id) === String(COUNSELOR_ID)
            ? detailedCall.receiver
            : detailedCall.initiator
          : null;

        const callDataForModal = {
          id: detailedCall?.id || resolvedCallId,
          callId: resolvedCallId,
          roomId:
            response.data.roomId ||
            detailedCall?.roomId ||
            incomingCallData.roomId,
          name:
            remoteParticipant?.displayName ||
            remoteParticipant?.fullName ||
            incomingCallData.name,
          type: modalType,
          callType: modalType,
          profilePic:
            remoteParticipant?.profilePhoto || incomingCallData.avatar,
          phoneNumber:
            remoteParticipant?.phoneNumber || remoteParticipant?.phone || "",
          status: response.data.status || detailedCall?.status || "active",
          date: "Today",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          apiCallData: detailedCall,
          initiator: detailedCall?.initiator,
          receiver: detailedCall?.receiver,
          currentUserId: COUNSELOR_ID,
          currentUserType: "counsellor",
          isIncoming: true,
        };
        setSelectedCall(callDataForModal);
        setIsVideoModalOpen(true);
        return { success: true };
      }
      throw new Error("Failed to join call");
    } catch (error) {
      console.error("Error joining call:", error);
      throw error;
    }
  };

  const handleRejectIncomingCall = async (callId) => {
    const resolvedCallId =
      callId ||
      incomingCallData?.callId ||
      incomingCallData?.id ||
      incomingCallData?._id;

    try {
      if (!resolvedCallId) {
        return false;
      }

      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      await axios.put(
        `${API_BASE_URL}/api/video/calls/${resolvedCallId}/reject`,
        {
          userId: COUNSELOR_ID,
          reason: "declined",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return true;
    } catch (error) {
      // Fallback for older backend deployments that expose reject under /api/call.
      if (error?.response?.status === 404) {
        try {
          const token =
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken");
          await axios.post(
            `${API_BASE_URL}/api/call/${resolvedCallId}/reject`,
            { reason: "declined" },
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          return true;
        } catch (fallbackError) {
          console.error("Reject fallback failed:", fallbackError);
        }
      }
      console.error("Error rejecting call:", error);
      return false;
    }
  };

  const handleEndIncomingCall = async (callId) => {
    try {
      const resolvedCallId =
        callId ||
        selectedCall?.callId ||
        incomingCallData?.callId ||
        selectedCall?.id ||
        incomingCallData?.id;

      if (!resolvedCallId) {
        return false;
      }

      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");

      await axios.put(
        `${API_BASE_URL}/api/video/calls/${resolvedCallId}/end`,
        {
          userId: COUNSELOR_ID,
          endedBy: "counsellor",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      return true;
    } catch (error) {
      return true;
    }
  };

  useEffect(() => {
    let isMounted = true;
    let intervalId = null;
    const fetchIncomingCalls = async () => {
      try {
        const token =
          localStorage.getItem("token") || localStorage.getItem("accessToken");

        if (!COUNSELOR_ID || !token || isVideoModalOpen) {
          console.log("Skipping poll - missing data:", {
            COUNSELOR_ID,
            hasToken: !!token,
            showIncomingModal,
            isVideoModalOpen,
          });
          return;
        }

        console.log("Polling for calls with counselor ID:", COUNSELOR_ID);

        const response = await axios.get(
          `${API_BASE_URL}/api/video/calls/pending/${COUNSELOR_ID}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!isMounted) return;

        const callsList =
          response.data.pendingRequests ||
          response.data.waitingCalls ||
          response.data.calls ||
          [];

        const currentIncomingId =
          incomingCallData?.callId ||
          incomingCallData?.id ||
          incomingCallData?._id;
        const stillWaiting = currentIncomingId
          ? callsList.some(
              (c) => (c.callId || c.id || c._id) === currentIncomingId,
            )
          : false;

        if (showIncomingModal && currentIncomingId && !stillWaiting) {
          setShowIncomingModal(false);
          setIncomingCallData({
            name: "",
            avatar: "👤",
            callId: "",
            roomId: "",
            callType: "video",
          });
          return;
        }

        if (response.data.success && callsList.length > 0) {
          const waitingCall =
            callsList.find((call) => {
              const normalizedStatus = String(call.status || "").toLowerCase();
              return (
                !normalizedStatus ||
                normalizedStatus === "waiting" ||
                normalizedStatus === "ringing" ||
                normalizedStatus === "pending" ||
                normalizedStatus === "requested"
              );
            }) || callsList[0];

          if (!waitingCall || showIncomingModal) {
            return;
          }

          const fromData = waitingCall.from || {};
          let displayName = "Anonymous User";
          if (fromData.isAnonymous) displayName = fromData.isAnonymous;
          else if (fromData.displayName) displayName = fromData.displayName;
          else if (fromData.fullName) displayName = fromData.fullName;
          else if (fromData.name) displayName = fromData.name;
          let avatar = "👤";
          if (fromData.gender === "female") avatar = "👩";
          else if (fromData.gender === "male") avatar = "👨";
          setIncomingCallData({
            callId: waitingCall.callId || waitingCall.id || waitingCall._id,
            id: waitingCall.id || waitingCall.callId || waitingCall._id || "",
            _id: waitingCall._id || waitingCall.callId || waitingCall.id || "",
            roomId: waitingCall.roomId || waitingCall.callId || waitingCall.id,
            name: displayName,
            avatar: avatar,
            callType: waitingCall.callType || "video",
            requestMessage:
              waitingCall.requestMessage ||
              `Incoming ${waitingCall.callType || "video"} call...`,
          });
          setShowIncomingModal(true);
        } else if (showIncomingModal) {
          setShowIncomingModal(false);
          setIncomingCallData({
            name: "",
            avatar: "👤",
            callId: "",
            roomId: "",
            callType: "video",
          });
        }
      } catch (error) {
        console.error("Error polling for calls:", error);
      }
    };
    intervalId = setInterval(fetchIncomingCalls, 5000);
    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [
    showIncomingModal,
    COUNSELOR_ID,
    isVideoModalOpen,
    incomingCallData?.callId,
  ]);

  useEffect(() => {
    if (showIncomingModal && !isVideoModalOpen) {
      void startRinging();
      return;
    }

    stopRinging();
  }, [showIncomingModal, isVideoModalOpen, startRinging, stopRinging]);

  useEffect(() => {
    return () => {
      stopRinging();
    };
  }, [stopRinging]);

  const handleCloseModal = () => {
    setIsVideoModalOpen(false);
    setSelectedCall(null);
    setCallError(null);
  };
  const handleBack = () =>
    navigate("/counselor-dashboard", { state: { selectedTab: "messages" } });
  const getAvatarIcon = (gender) => {
    if (gender === "male") return "👨";
    if (gender === "female") return "👩";
    return "👤";
  };
  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  useEffect(() => {
    if (selectedUser && COUNSELOR_ID) fetchMessagesFromAPI();
  }, [selectedUser, chatId, COUNSELOR_ID]);
  useEffect(() => {
    if (callError) {
      const timer = setTimeout(() => setCallError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [callError]);

  // Socket connection
  useEffect(() => {
    const apiChatId = chatId;
    if (!apiChatId || !selectedUser) return;
    const token =
      localStorage.getItem("token") || localStorage.getItem("accessToken");
    if (!token) return;
    const socket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    chatSocketRef.current = socket;
    socket.on("connect", () => {
      socket.emit("join-chat", { chatId: apiChatId });
    });
    socket.on("new-message", (messageData) => {
      if (
        messageData.senderRole === "counsellor" &&
        String(messageData.senderId) === String(COUNSELOR_ID)
      ) {
        setMessages((prev) => {
          const withoutTemp = prev.filter((msg) => !msg.isTemporary);
          const alreadyHas = withoutTemp.some(
            (msg) =>
              msg.messageId &&
              messageData.messageId &&
              msg.messageId === messageData.messageId,
          );
          if (alreadyHas) return withoutTemp;
          return [
            ...withoutTemp,
            {
              id: messageData.id || messageData.messageId,
              messageId: messageData.messageId,
              text: messageData.content,
              sender: "me",
              senderRole: "counsellor",
              time: new Date(messageData.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              fullTime: messageData.createdAt,
              contentType: messageData.contentType,
              isRead: messageData.isRead,
              status: "sent",
            },
          ];
        });
        return;
      }
      const transformedMessage = {
        id: messageData.id || messageData.messageId,
        messageId: messageData.messageId,
        text: messageData.content,
        sender: "user",
        senderRole: messageData.senderRole,
        time: new Date(messageData.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        fullTime: messageData.createdAt,
        contentType: messageData.contentType,
        isRead: messageData.isRead,
        status: "sent",
      };
      setMessages((prev) => {
        const isDuplicate = prev.some(
          (msg) =>
            msg.messageId &&
            messageData.messageId &&
            msg.messageId === messageData.messageId,
        );
        if (isDuplicate) return prev;
        return [...prev, transformedMessage];
      });
    });

    socket.on("user-typing", ({ userRole, isTyping: typing }) => {
      if (userRole === "user") {
        setRemoteIsTyping(typing);
      }
    });

    socket.on("messages-read", () => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.sender === "me" ? { ...msg, isRead: true } : msg,
        ),
      );
    });

    // Show caller-facing feedback when the other participant declines.
    socket.on("call_rejected", (payload) => {
      const declinedBy = payload?.by ? ` by ${payload.by}` : "";
      setCallError(`Call was declined${declinedBy}.`);
      setIsVideoModalOpen(false);
      setSelectedCall(null);
      setShowIncomingModal(false);
    });

    socket.on("call-status-update", ({ status }) => {
      const normalizedStatus = String(status || "").toLowerCase();

      if (normalizedStatus === "rejected") {
        // setCallError("Call was declined by the other participant.");
        setIsVideoModalOpen(false);
        setSelectedCall(null);
        setShowIncomingModal(false);
        return;
      }

      if (
        normalizedStatus === "ended" ||
        normalizedStatus === "cancelled" ||
        normalizedStatus === "canceled" ||
        normalizedStatus === "expired"
      ) {
        // setCallError("Call was canceled before acceptance.");
        setIsVideoModalOpen(false);
        setSelectedCall(null);
        setShowIncomingModal(false);
      }
    });

    socket.on("connect_error", (err) => {
      console.error("Chat socket connection error:", err.message);
    });

    return () => {
      if (chatSocketRef.current) {
        chatSocketRef.current.off("new-message");
        chatSocketRef.current.off("user-typing");
        chatSocketRef.current.off("messages-read");
        chatSocketRef.current.off("call_rejected");
        chatSocketRef.current.off("call-status-update");
        chatSocketRef.current.off("connect");
        chatSocketRef.current.off("connect_error");
        chatSocketRef.current.disconnect();
        chatSocketRef.current = null;
      }
    };
  }, [chatId, selectedUser, COUNSELOR_ID]);

  const renderMessageStatus = (message) => {
    if (message.sender !== "me") return null;
    switch (message.status) {
      case "sending":
        return <span className="msg-status sending">⌛</span>;
      case "error":
        return <span className="msg-status error">⚠️</span>;
      default:
        return null;
    }
  };

  if (!selectedUser) {
    return (
      <div className="smsinput-container no-user">
        <div className="smsinput-empty-state">
          <span className="empty-icon">💬</span>
          <h3>No user selected</h3>
          <p>Please select a user from the list to start messaging</p>
          <button className="back-to-list-btn" onClick={handleBack}>
            ← Back to SMS List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="smsinput-container">
      {/* Header */}
      <div className="smsinput-header">
        <div className="header-left">
          <button
            className="back-button"
            onClick={handleBack}
            title="Back to SMS List"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z"
                fill="currentColor"
              />
            </svg>
          </button>
          <div className="smsinput-user-info">
            <div className="smsinput-user-avatar">
              <span className="avatar-icon">
                {getAvatarIcon(userDetails.gender)}
              </span>
              <span
                className={`status-dot ${selectedUser.status || "online"}`}
              ></span>
            </div>
            <div className="smsinput-user-details">
              <h3>{USER_NAME}</h3>
            </div>
          </div>
        </div>
        <div className="smsinput-call-buttons">
          <button
            className={`call-btn voice ${isInitiatingCall ? "loading" : ""}`}
            onClick={handleVoiceCall}
            disabled={isInitiatingCall}
            title="Voice call"
          >
            <span className="call-icon">{isInitiatingCall ? "⏳" : "📞"}</span>
          </button>
          <button
            className={`call-btn video ${isInitiatingCall ? "loading" : ""}`}
            onClick={handleVideoCall}
            disabled={isInitiatingCall}
            title="Video call"
          >
            <span className="call-icon">{isInitiatingCall ? "⏳" : "📹"}</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {callError && (
        <div className="sms-call-error-banner">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{callError}</span>
          <button className="error-close" onClick={() => setCallError(null)}>
            ✕
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div className="smsinput-messages" ref={messagesContainerRef}>
        {isLoadingMessages && messages.length === 0 ? (
          <div className="sms-loading-messages">
            <div className="sms-loading-spinner"></div>
            <p>Loading messages...</p>
          </div>
        ) : error && messages.length === 0 ? (
          <div className="sms-error-message">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <button onClick={fetchMessagesFromAPI} className="retry-btn">
              Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="sms-empty-messages">
            <span className="empty-messages-icon">💬</span>
            <p>No messages yet</p>
            <p className="empty-messages-subtext">
              Start a conversation by sending a message
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`smsinput-message ${msg.sender === "me" ? "sent" : "received"}`}
            >
              <div className="message-bubble">
                {msg.contentType === "IMAGE" && msg.attachmentUrl ? (
                  <>
                    <img
                      src={msg.attachmentUrl}
                      alt={msg.attachmentName || "Shared image"}
                      className="sms-attachment-image"
                    />
                    <a
                      href={msg.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="sms-attachment-link"
                    >
                      {msg.attachmentName || "Open image"}
                    </a>
                    {msg.text && <p className="message-text">{msg.text}</p>}
                  </>
                ) : msg.contentType === "FILE" && msg.attachmentUrl ? (
                  <>
                    <a
                      href={msg.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="sms-attachment-link"
                    >
                      {msg.attachmentName || msg.text || "Open attachment"}
                    </a>
                    {msg.text && <p className="message-text">{msg.text}</p>}
                  </>
                ) : (
                  <p className="message-text">{msg.text}</p>
                )}
                <div className="message-footer">
                  <span className="message-time">{msg.time}</span>
                  {renderMessageStatus(msg)}
                </div>
              </div>
            </div>
          ))
        )}
        {remoteIsTyping && (
          <div className="smsinput-message received">
            <div className="message-bubble typing-bubble">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form className="smsinput-form" onSubmit={handleSendMessage}>
        <div className="smsinput-input-wrapper">
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={handleFileSelected}
          />
          <button
            type="button"
            className="attach-btn"
            title="Attach file"
            disabled={isSending}
            onClick={handleFileAttachClick}
          >
            📎
          </button>
          <input
            type="text"
            ref={messageInputRef}
            className="smsinput-input"
            placeholder={isSending ? "Sending..." : "Type your message..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleInputKeyDown}
            disabled={isSending}
          />
          <button
            type="submit"
            className={`send-btn ${message.trim() && !isSending ? "active" : ""}`}
            disabled={!message.trim() || isSending}
          >
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>

      {/* Call Modals */}
      <VideoCallModal
        isOpen={isVideoModalOpen}
        onClose={handleCloseModal}
        callData={selectedCall}
        callMode={selectedCall?.callType || selectedCall?.type || "video"}
        currentUser={{ id: COUNSELOR_ID, role: "counsellor" }}
        onEndCall={handleEndIncomingCall}
      />

      {/* Professional Incoming Call Modal */}
      <IncomingCallModal
        isOpen={showIncomingModal}
        onClose={() => setShowIncomingModal(false)}
        callType={incomingCallData.callType}
        callerName={incomingCallData.name}
        callerImage={incomingCallData.avatar}
        callData={incomingCallData}
        onAccept={handleJoinIncomingCall}
        onReject={handleRejectIncomingCall}
        fallbackName="Anonymous User"
      />
    </div>
  );
};

export default SMSInput;
