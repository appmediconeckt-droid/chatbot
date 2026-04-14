// ChatBox.jsx - Fully Responsive Chat Interface with Proper Scroll Behavior
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { Link, useParams, useLocation } from "react-router-dom";
import "./ChatBox.css";
import VideoCallModal from "../CallModal/VideoCallModal";
import { API_BASE_URL } from "../../../../axiosConfig";
import useRingtone from "../../../../hooks/useRingtone";
import IncomingCallModal from "../../../common/IncomingCallModal/IncomingCallModal";

const ChatBox = () => {
  const { id: counselorId } = useParams();
  const location = useLocation();
  const { chatId, counselor: initialCounselor, user: initialUser } = location.state || {};

  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentCounselor, setCurrentCounselor] = useState(() => {
    if (initialCounselor) return initialCounselor;
    return {
      id: counselorId || null,
      name: "Dr. Suresh Reddy",
      specialization: "Clinical Psychologist",
      online: true,
      avatar: null,
      avatarType: "text",
      profilePhoto: null,
      phoneNumber: "+91 98765 43215",
    };
  });

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [isInitiatingCall, setIsInitiatingCall] = useState(false);
  const [callError, setCallError] = useState(null);
  const [showIncomingModal, setShowIncomingModal] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState({
    name: "",
    image: null,
    callId: "",
    roomId: "",
    callType: "video",
  });
  const { startRinging, stopRinging } = useRingtone();

  const [newMessage, setNewMessage] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [remoteIsTyping, setRemoteIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [chatStatus, setChatStatus] = useState(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const optionsRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const timeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const chatSocketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const isUserScrollingRef = useRef(false);
  const isInitialLoadRef = useRef(true);

  const getCurrentUser = () => {
    const storedUserData = localStorage.getItem("userData") || localStorage.getItem("user");
    if (!storedUserData) return null;
    try {
      return JSON.parse(storedUserData);
    } catch (e) {
      return null;
    }
  };

  const currentUser = getCurrentUser();
  const resolveCurrentUserId = () => currentUser?.id || currentUser?._id || localStorage.getItem("userId") || null;
  const resolveCounselorId = () => currentCounselor?.id?.toString() || currentCounselor?._id?.toString() || counselorId || currentChat?.counselorId?.toString() || null;

  const getProfilePhotoUrl = (counselor) => {
    if (!counselor) return null;
    if (counselor?.profilePhoto?.url) return counselor.profilePhoto.url;
    if (counselor?.avatar && counselor.avatarType === "image") return counselor.avatar;
    return null;
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2);
  };

  const scrollToBottom = useCallback((behavior = "smooth") => {
    if (messagesContainerRef.current && shouldScrollToBottom) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      });
    }
  }, [shouldScrollToBottom]);

  const focusMessageInput = useCallback(() => {
    const input = messageInputRef.current;
    if (!input) return;
    requestAnimationFrame(() => input.focus({ preventScroll: true }));
    setTimeout(() => input.focus({ preventScroll: true }), 50);
  }, []);

  const getChatIdForAPI = () => {
    if (chatId) return chatId;
    if (currentChat?.chatId) return currentChat.chatId;
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleAcceptCall = async (callId) => {
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
      const userId = resolveCurrentUserId();

      if (!userId) {
        throw new Error("User ID missing. Please login again.");
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/video/calls/${resolvedCallId}/accept`,
        {
          acceptorId: userId,
          acceptorType: "user",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.data?.success) {
        throw new Error(response.data?.error || "Failed to accept call");
      }

      let detailedCall = null;
      try {
        const detailsResponse = await axios.get(
          `${API_BASE_URL}/api/video/calls/${resolvedCallId}/details`,
          {
            params: {
              userId,
              userType: "user",
            },
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        detailedCall = detailsResponse.data?.call || null;
      } catch (detailsError) {
        console.warn("Could not fetch accepted call details:", detailsError);
      }
      const incomingType = String(incomingCallData.callType || "video").toLowerCase();
      const modalType = incomingType === "audio" ? "voice" : incomingType;
      const remoteParticipant = detailedCall ? String(detailedCall.initiator?.id) === String(userId) ? detailedCall.receiver : detailedCall.initiator : incomingCallData.from || null;
      const acceptedCallData = {
        id: detailedCall?.id || resolvedCallId,
        callId: resolvedCallId,
        roomId:
          response.data.roomId ||
          detailedCall?.roomId ||
          incomingCallData.roomId,
        name:
          remoteParticipant?.displayName ||
          remoteParticipant?.fullName ||
          incomingCallData.name ||
          "Counselor",
        type: modalType,
        callType: modalType,
        profilePic: remoteParticipant?.profilePhoto || incomingCallData.image || null,
        phoneNumber: remoteParticipant?.phoneNumber || remoteParticipant?.phone || "",
        status: response.data.status || detailedCall?.status || "active",
        apiCallData: detailedCall,
        initiator: detailedCall?.initiator,
        receiver: detailedCall?.receiver,
        currentUserId: userId,
        currentUserType: "user",
        isIncoming: true,
      };
      setSelectedCall(acceptedCallData);
      setIsVideoModalOpen(true);
      setShowIncomingModal(false);
      return response.data;
    } catch (error) {
      console.error("Error accepting call:", error);
      throw error;
    }
  };

  const handleRejectCall = async (callId) => {
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
      const userId = resolveCurrentUserId();

      if (!userId) {
        throw new Error("User ID missing. Please login again.");
      }

      await axios.put(
        `${API_BASE_URL}/api/video/calls/${resolvedCallId}/reject`,
        {
          userId,
          reason: "declined",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return true;
    } catch (error) {
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

  const handleEndCall = async (callId) => {
    try {
      const resolvedCallId =
        callId ||
        selectedCall?.callId ||
        incomingCallData?.callId ||
        selectedCall?.id ||
        incomingCallData?.id ||
        incomingCallData?._id;

      if (!resolvedCallId) {
        return false;
      }

      const token =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      const userId = resolveCurrentUserId();

      if (!userId) {
        throw new Error("User ID missing. Please login again.");
      }

      await axios.put(
        `${API_BASE_URL}/api/video/calls/${resolvedCallId}/end`,
        {
          userId: userId,
          endedBy: "user",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return true;
    } catch (error) {
      console.error("Error ending call:", error);
      return false;
    }
  };

  // Handle scroll events to detect if user is manually scrolling
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    if (isNearBottom) {
      setShouldScrollToBottom(true);
      isUserScrollingRef.current = false;
    } else {
      setShouldScrollToBottom(false);
      isUserScrollingRef.current = true;
    }
  }, []);

  // Scroll to bottom when new messages arrive (only if user hasn't scrolled up)
  useEffect(() => {
    if (messages.length === 0) return;

    if (shouldScrollToBottom) {
      const behavior = isInitialLoadRef.current ? "auto" : "smooth";
      scrollToBottom(behavior);
      if (isInitialLoadRef.current) isInitialLoadRef.current = false;
    } else {
      // Store scroll position to maintain it
      if (messagesContainerRef.current) {
        prevScrollHeightRef.current = messagesContainerRef.current.scrollHeight;
      }
    }
  }, [messages, scrollToBottom, shouldScrollToBottom]);

  // Maintain scroll position when new content is added above (e.g., loading older messages)
  useEffect(() => {
    if (!shouldScrollToBottom && messagesContainerRef.current && prevScrollHeightRef.current > 0) {
      const newScrollHeight = messagesContainerRef.current.scrollHeight;
      const scrollDifference = newScrollHeight - prevScrollHeightRef.current;
      if (scrollDifference > 0) {
        messagesContainerRef.current.scrollTop += scrollDifference;
      }
      prevScrollHeightRef.current = newScrollHeight;
    }
  }, [messages, shouldScrollToBottom]);

  useEffect(() => {
    const fetchIncomingCalls = async () => {
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
        const userId = resolveCurrentUserId();

        if (!userId || !token || isVideoModalOpen) {
          return;
        }

        const response = await axios.get(
          `${API_BASE_URL}/api/video/calls/pending/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

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
            image: null,
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

          // Extract full name properly - priority: fullName > displayName
          const callerFullName =
            fromData.fullName || fromData.displayName || "Counselor";

          const resolvedIncomingCallId =
            waitingCall.callId || waitingCall.id || waitingCall._id;

          setIncomingCallData({
            callId: resolvedIncomingCallId,
            id: waitingCall.id || resolvedIncomingCallId,
            _id: waitingCall._id || resolvedIncomingCallId,
            roomId: waitingCall.roomId,
            name: callerFullName,
            image: fromData.profilePhoto || null,
            callType: waitingCall.callType || "video",
            from: fromData,
            requestMessage: waitingCall.requestMessage,
            requestedAt: waitingCall.requestedAt,
            expiresAt: waitingCall.expiresAt,
            remainingSeconds: waitingCall.remainingSeconds,
          });
          setShowIncomingModal(true);
        } else if (showIncomingModal) {
          setShowIncomingModal(false);
          setIncomingCallData({
            name: "",
            image: null,
            callId: "",
            roomId: "",
            callType: "video",
          });
        }
      } catch (error) {
        console.error("Error polling for calls:", error);
      }
    };
    const interval = setInterval(fetchIncomingCalls, 5000);
    return () => clearInterval(interval);
  }, [
    showIncomingModal,
    currentUser,
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
  // GET messages from API
  const fetchMessagesFromAPI = async () => {
    try {
      const apiChatId = getChatIdForAPI();
      const token = localStorage.getItem("token");
      setIsLoadingMessages(true);
      const response = await axios.get(`${API_BASE_URL}/api/chat/chat/${apiChatId}/messages`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (response.data && response.data.messages) {
        if (response.data.chatStatus) setChatStatus(response.data.chatStatus);
        const transformedMessages = response.data.messages.map((msg, index) => ({
          id: msg.id || index,
          messageId: msg.messageId,
          text: msg.content,
          sender: msg.senderRole === "user" ? "user" : "counselor",
          senderRole: msg.senderRole,
          time: new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          fullTime: msg.createdAt,
          contentType: msg.contentType,
          attachmentUrl: msg.attachmentUrl || null,
          attachmentName: msg.attachmentName || null,
          attachmentMimeType: msg.attachmentMimeType || null,
          attachmentSize: msg.attachmentSize || null,
          isRead: msg.isRead,
          status: "sent",
        }));
        setMessages(transformedMessages);
        if (currentChat) {
          setCurrentChat((prev) => ({ ...prev, messages: transformedMessages, chatStatus: response.data.chatStatus }));
        }
        return transformedMessages;
      }
    } catch (error) {
      console.error("Error fetching messages from API:", error);
      loadMessagesFromLocalStorage();
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const loadMessagesFromLocalStorage = () => {
    try {
      const savedChats = JSON.parse(localStorage.getItem("activeChats") || "[]");
      const chat = savedChats.find((c) => c.id === currentChat?.id || c.chatId === getChatIdForAPI());
      if (chat && chat.messages) setMessages(chat.messages);
    } catch (error) {
      console.error("Error loading messages from localStorage:", error);
    }
  };

  const sendMessageToAPI = async ({ messageContent = "", file = null }) => {
    try {
      const apiChatId = getChatIdForAPI();
      const token = localStorage.getItem("token");
      let response;
      if (file) {
        const formData = new FormData();
        if (messageContent.trim()) formData.append("content", messageContent.trim());
        formData.append("attachment", file);
        response = await axios.post(`${API_BASE_URL}/api/chat/chat/${apiChatId}/message`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        response = await axios.post(`${API_BASE_URL}/api/chat/chat/${apiChatId}/message`, { content: messageContent }, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
      }
      if (response.data && response.data.success) return response.data.message;
      else throw new Error("Invalid API response");
    } catch (error) {
      console.error("Error sending message to API:", error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === "" || isSending) return;
    const messageText = newMessage.trim();
    const tempUserMessage = {
      id: `temp_${Date.now()}`,
      text: messageText,
      sender: "user",
      senderRole: "user",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      createdAt: new Date().toISOString(),
      status: "sending",
      isTemporary: true,
    };
    setMessages((prev) => [...prev, tempUserMessage]);
    setNewMessage("");
    focusMessageInput();
    setShowEmojiPicker(false);
    setIsSending(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    try {
      const sentMsg = await sendMessageToAPI({ messageContent: messageText });
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => !m.isTemporary);
        if (!sentMsg) return withoutTemp;
        const alreadyHas = withoutTemp.some((m) => m.messageId && sentMsg.messageId && m.messageId === sentMsg.messageId);
        if (alreadyHas) return withoutTemp;
        return [...withoutTemp, {
          id: sentMsg.id || sentMsg._id,
          messageId: sentMsg.messageId,
          text: sentMsg.content,
          sender: "user",
          senderRole: "user",
          time: new Date(sentMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          fullTime: sentMsg.createdAt,
          contentType: sentMsg.contentType,
          isRead: sentMsg.isRead,
          status: "sent",
        }];
      });
    } catch (err) {
      console.error("Error in message sending flow:", err);
      setMessages((prev) => prev.map((msg) => msg.id === tempUserMessage.id ? { ...msg, status: "error", error: "Failed to send message" } : msg));
      const errorMessage = {
        id: `error_${Date.now()}`,
        text: "⚠️ Failed to send message. Please check your internet connection and try again.",
        sender: "counselor",
        senderRole: "counsellor",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isError: true,
        status: "error",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
      focusMessageInput();
    }
  };

  const initiateStreamCall = async (requestedCallType = "video") => {
    const normalizedMode = requestedCallType === "audio" || requestedCallType === "voice" ? "voice" : "video";
    if (!currentCounselor) {
      setCallError("Counselor information not available");
      return;
    }
    setIsInitiatingCall(true);
    setCallError(null);
    try {
      const token = localStorage.getItem("token");
      const initiatorId = resolveCurrentUserId();
      const initiatorType = "user";
      const receiverId = resolveCounselorId();
      const receiverName = currentCounselor.name || "Counselor";
      const receiverType = "counsellor";
      if (!initiatorId || !receiverId) throw new Error("Unable to start call. Missing user/counselor ID.");
      const requestBody = { initiatorId, initiatorType, receiverId, receiverType, callType: normalizedMode === "voice" ? "audio" : "video" };
      const response = await axios.post(`${API_BASE_URL}/api/video/calls/initiate`, requestBody, {
        headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
      });
      if (response.data && response.data.success) {
        const receiverProfilePhoto = response.data.callData?.receiver?.profilePhoto || getProfilePhotoUrl(currentCounselor) || currentCounselor?.avatar || currentCounselor?.name?.charAt(0) || "👤";
        const callData = {
          id: response.data.callData?.id,
          callId: response.data.callId,
          roomId: response.data.roomId,
          name: response.data.callData?.receiver?.name || receiverName,
          type: normalizedMode,
          callType: normalizedMode,
          profilePic: receiverProfilePhoto,
          phoneNumber: currentCounselor?.phoneNumber,
          status: response.data.status || "ringing",
          date: "Today",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          apiCallData: response.data.callData,
          initiator: response.data.callData?.initiator,
          receiver: response.data.callData?.receiver,
        };
        setSelectedCall(callData);
        setIsVideoModalOpen(true);
      } else {
        throw new Error(response.data?.message || `Failed to initiate ${normalizedMode} call`);
      }
    } catch (error) {
      console.error(`Error initiating ${normalizedMode} call:`, error);
      let errorMessage = `Failed to initiate ${normalizedMode} call. `;
      const backendMessage = error.response?.data?.message || error.response?.data?.error;
      errorMessage += backendMessage || error.message || "Please check your connection and try again.";
      setCallError(errorMessage);
      setSelectedCall(null);
      setIsVideoModalOpen(false);
    } finally {
      setIsInitiatingCall(false);
    }
  };

  const handleVideoCall = () => initiateStreamCall("video");
  const handleVoiceCall = () => initiateStreamCall("audio");
  const handleCloseModal = () => { setIsVideoModalOpen(false); setSelectedCall(null); setCallError(null); };

  useEffect(() => {
    const initializeChat = async () => {
      try {
        const savedChats = JSON.parse(localStorage.getItem("activeChats") || "[]");
        let chat = savedChats.find((c) => c.id === chatId) || savedChats.find((c) => c.counselorId === counselorId);
        if (chat) {
          setCurrentChat(chat);
          if (chat.counselor) setCurrentCounselor(chat.counselor);
          if (chat.unread) {
            const updatedChats = savedChats.map((c) => { if (c.id === chat.id) return { ...c, unread: false }; return c; });
            localStorage.setItem("activeChats", JSON.stringify(updatedChats));
          }
        } else if (initialCounselor) {
          const newChat = {
            id: Date.now(),
            chatId: chatId || `chat_${Date.now()}`,
            counselorId: counselorId,
            counselor: initialCounselor,
            user: initialUser || { name: "User", email: "user@example.com" },
            messages: [],
            unread: false,
            startedAt: new Date().toISOString(),
          };
          setCurrentChat(newChat);
          const updatedChats = [...savedChats, newChat];
          localStorage.setItem("activeChats", JSON.stringify(updatedChats));
        }
        await fetchMessagesFromAPI();
      } catch (error) {
        console.error("Error loading chat:", error);
      }
    };
    initializeChat();
  }, [counselorId, chatId, initialCounselor, initialUser]);

  useEffect(() => {
    if (currentChat && messages.length > 0) {
      try {
        const savedChats = JSON.parse(localStorage.getItem("activeChats") || "[]");
        const updatedChats = savedChats.map((chat) => {
          if (chat.id === currentChat.id) {
            return { ...chat, messages: messages, lastMessage: messages[messages.length - 1]?.text, lastMessageTime: messages[messages.length - 1]?.time, unread: false, chatStatus: chatStatus };
          }
          return chat;
        });
        localStorage.setItem("activeChats", JSON.stringify(updatedChats));
      } catch (error) {
        console.error("Error saving messages:", error);
      }
    }
  }, [messages, currentChat, chatStatus]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) setShowOptions(false);
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) setShowEmojiPicker(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }; }, []);

  // Set up scroll listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  useEffect(() => {
    const apiChatId = chatId || currentChat?.chatId;
    if (!apiChatId) return;
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
    if (!token) return;
    const socket = io(API_BASE_URL, { auth: { token }, transports: ["websocket", "polling"] });
    chatSocketRef.current = socket;
    socket.on("connect", () => { socket.emit("join-chat", { chatId: apiChatId }); });
    socket.on("new-message", (messageData) => {
      const userId = resolveCurrentUserId();
      if (messageData.senderRole === "user" && String(messageData.senderId) === String(userId)) {
        setMessages((prev) => prev.filter((msg) => !msg.isTemporary));
        return;
      }
      const transformedMessage = {
        id: messageData.id || messageData.messageId || `rt_${Date.now()}`,
        messageId: messageData.messageId,
        text: messageData.content,
        sender: messageData.senderRole === "user" ? "user" : "counselor",
        senderRole: messageData.senderRole,
        time: new Date(messageData.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        fullTime: messageData.createdAt,
        contentType: messageData.contentType,
        isRead: messageData.isRead,
        status: "sent",
      };
      setMessages((prev) => {
        const isDuplicate = prev.some((msg) => msg.messageId && messageData.messageId && msg.messageId === messageData.messageId);
        if (isDuplicate) return prev;
        return [...prev, transformedMessage];
      });
    });

    // Listen for typing indicators from the other participant
    socket.on("user-typing", ({ userRole, isTyping: typing }) => {
      if (userRole !== "user") {
        setRemoteIsTyping(typing);
      }
    });

    // Listen for messages being read
    socket.on("messages-read", () => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.sender === "user" ? { ...msg, isRead: true } : msg,
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
        // setCallError("Call was declined by the other participant.");[]
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
        // setCallError("Call was canceled before acceptance.");-
        setIsVideoModalOpen(false);
        setSelectedCall(null);
        setShowIncomingModal(false);
      }
    });

    // Listen for chat-status-update (e.g. counselor accepted/rejected the chat)
    socket.on("chat-status-update", ({ status, chatId: updatedChatId }) => {
      console.log("✅ Chat status updated via socket:", status);
      setChatStatus(status);
      setCurrentChat((prev) => (prev ? { ...prev, status } : prev));
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
        chatSocketRef.current.off("chat-status-update");
        chatSocketRef.current.disconnect();
        chatSocketRef.current = null;
      }
    };
  }, [chatId, currentChat?.chatId]);

  const handleTypingIndicator = useCallback(() => {
    const apiChatId = chatId || currentChat?.chatId;
    if (!chatSocketRef.current || !apiChatId) return;
    chatSocketRef.current.emit("typing", { chatId: apiChatId, isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (chatSocketRef.current) chatSocketRef.current.emit("typing", { chatId: apiChatId, isTyping: false });
    }, 2000);
  }, [chatId, currentChat?.chatId]);

  useEffect(() => {
    const interval = setInterval(() => { if (currentChat) fetchMessagesFromAPI(); }, 30000);
    return () => clearInterval(interval);
  }, [currentChat]);

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey && !isSending) { e.preventDefault(); handleSendMessage(); focusMessageInput(); } };
  const handleSendButtonClick = (e) => { e.preventDefault(); handleSendMessage(); focusMessageInput(); };
  const addEmoji = (emoji) => { setNewMessage((prev) => prev + emoji); focusMessageInput(); };
  const emojis = ["😊", "😂", "🥰", "😎", "😢", "😡", "👍", "👋", "❤️", "🎉", "🙏", "💪"];
  const optionsMenuItems = [{ id: 1, label: "Refresh Messages", icon: "🔄" }, { id: 2, label: "Clear Chat", icon: "🗑️" }, { id: 3, label: "Report Issue", icon: "⚠️" }, { id: 4, label: "Chat Details", icon: "📋" }];
  const handleFileAttach = () => { if (isSending) return; fileInputRef.current?.click(); };
  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file || isSending) return;
    const tempFileMessage = { id: `temp_file_${Date.now()}`, text: file.name, sender: "user", senderRole: "user", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), contentType: file.type.startsWith("image/") ? "IMAGE" : "FILE", status: "sending", isTemporary: true };
    setMessages((prev) => [...prev, tempFileMessage]);
    setIsSending(true);
    try {
      await sendMessageToAPI({ file });
      setMessages((prev) => prev.filter((msg) => !msg.isTemporary));
    } catch (error) {
      console.error("Error sending file:", error);
      setMessages((prev) => prev.map((msg) => msg.id === tempFileMessage.id ? { ...msg, status: "error", error: "Failed to send file" } : msg));
    } finally {
      setIsSending(false);
      e.target.value = "";
    }
  };
  const handleInputChange = (e) => { setNewMessage(e.target.value); setIsTyping(e.target.value.trim() !== ""); if (e.target.value.trim() !== "") handleTypingIndicator(); };

  const renderProfileAvatar = (counselor, size = "md") => {
    if (!counselor) return <div className={`chat-profile-initials-${size}`}>?</div>;
    const profilePhotoUrl = getProfilePhotoUrl(counselor);
    if (profilePhotoUrl) {
      return <img src={profilePhotoUrl} alt={counselor.name || "Counselor"} className={`chat-profile-image-${size}`} onError={(e) => { e.target.style.display = "none"; e.target.parentElement.innerHTML = `<div class="chat-profile-initials-${size}">${getInitials(counselor.name || "Counselor")}</div>`; }} />;
    }
    return <div className={`chat-profile-initials-${size}`}>{getInitials(counselor.name || "Counselor")}</div>;
  };

  const renderMessageStatus = (message) => {
    if (message.sender !== "user") return null;
    switch (message.status) {
      case "sending": return <span className="message-status sending">⌛ Sending...</span>;
      case "sent": return <span className="message-status sent">✓ Sent</span>;
      case "error": return <span className="message-status error">⚠️ Failed</span>;
      default: return null;
    }
  };

  const renderChatStatusBanner = () => {
    if (!chatStatus) return null;
    let statusClass = "", statusText = "";
    switch (chatStatus) {
      case "pending": statusClass = "status-pending"; statusText = "⏳ Waiting for counselor to accept..."; break;
      case "ended": statusClass = "status-ended"; statusText = "🔒 Chat session ended"; break;
      default: return null;
    }
    return <div className={`chat-status-banner ${statusClass}`}>{statusText}</div>;
  };

  const counselorName = currentCounselor?.name || "Counselor";
  const counselorOnline = currentCounselor?.online || false;

  return (
    <div className="chatContainerFull">
      <div className="chatBoxMain">
        <header className="chatBoxHeader">
          <div className="chatBoxHeaderLeft">
            <Link to="/user-dashboard" className="chatBackBtn" aria-label="Go back">←</Link>
            <div className="chatUserDetails">
              <div className="chatProfilePic" aria-label="Counselor profile picture">
                {renderProfileAvatar(currentCounselor, "md")}
                <span className={`chatActiveDot ${counselorOnline ? "chatActiveOnline" : "chatActiveOffline"}`} />
              </div>
              <div className="chatProfileInfo">
                <h2 className="chatProfileName">{counselorName}</h2>
                <p className="chatProfileStatus">
                  {remoteIsTyping ? <span className="chatTypingText" role="status">Typing...</span> : <span className="chatStatusText">{counselorOnline ? "Online" : "Offline"}</span>}
                </p>
              </div>
            </div>
          </div>
          <div className="chatBoxHeaderRight">
            <button className={`chatActionBtn chatVideoBtn ${isInitiatingCall ? "disabled" : ""}`} onClick={handleVideoCall} disabled={isInitiatingCall} aria-label="Video call">
              <span className="chatBtnIcon" aria-hidden="true">{isInitiatingCall ? "⏳" : "📹"}</span>
              <span className="chatBtnTooltip">Video Call</span>
            </button>
            <button className={`chatActionBtn chatAudioBtn ${isInitiatingCall ? "disabled" : ""}`} onClick={handleVoiceCall} disabled={isInitiatingCall} aria-label="Voice call">
              <span className="chatBtnIcon" aria-hidden="true">{isInitiatingCall ? "⏳" : "📞"}</span>
              <span className="chatBtnTooltip">Voice Call</span>
            </button>
            <div className="chatMoreOptions" ref={optionsRef}>
              <button className="chatActionBtn" onClick={() => setShowOptions(!showOptions)} aria-label="More options" aria-expanded={showOptions}>
                <span className="chatBtnIcon" aria-hidden="true">⋮</span>
              </button>
              {showOptions && (
                <div className="chatDropdownMenu" role="menu">
                  {optionsMenuItems.map((item) => (
                    <button key={item.id} className="chatDropdownItem" onClick={() => { setShowOptions(false); if (item.label === "Clear Chat") setMessages([]); else if (item.label === "Refresh Messages") fetchMessagesFromAPI(); else alert(`${item.label} clicked`); }} role="menuitem">
                      <span className="chatDropdownIcon" aria-hidden="true">{item.icon}</span>
                      <span className="chatDropdownText">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {renderChatStatusBanner()}

        {callError && (
          <div className="call-error-banner">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{callError}</span>
            <button className="error-close" onClick={() => setCallError(null)}>✕</button>
          </div>
        )}

        <main className="chatMessagesArea" ref={messagesContainerRef} onScroll={handleScroll}>
          {isLoadingMessages && messages.length === 0 ? (
            <div className="chatLoadingMessages">
              
              <p>Loading messages...</p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <article key={message.id || index} className={`chatMsgBubble ${message.sender === "user" ? "chatMsgRight" : "chatMsgLeft"} ${message.status === "error" ? "message-error" : ""}`}>
                  <div className="chatMsgContent">
                    {message.contentType === "IMAGE" && message.attachmentUrl ? (
                      <>
                        <img src={message.attachmentUrl} alt={message.attachmentName || "Shared image"} className="chatMsgImage" />
                        <a href={message.attachmentUrl} target="_blank" rel="noreferrer" className="chatMsgAttachmentLink">{message.attachmentName || "Open image"}</a>
                        {message.text && <p className="chatMsgText">{message.text}</p>}
                      </>
                    ) : message.contentType === "FILE" && message.attachmentUrl ? (
                      <>
                        <a href={message.attachmentUrl} target="_blank" rel="noreferrer" className="chatMsgAttachmentLink">{message.attachmentName || message.text || "Open attachment"}</a>
                        {message.text && <p className="chatMsgText">{message.text}</p>}
                      </>
                    ) : (
                      <p className="chatMsgText">{message.text}</p>
                    )}
                    <div className="chatMsgFooter">
                      <time className="chatMsgTimestamp">{message.time}</time>
                      {renderMessageStatus(message)}
                    </div>
                  </div>
                </article>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </main>

        {showEmojiPicker && (
          <div className="chatEmojiBox" ref={emojiPickerRef} role="dialog" aria-label="Emoji picker">
            <div className="emojiBoxHeader">
              <span className="emojiBoxTitle">Emoji</span>
              <button className="emojiBoxClose" onClick={() => setShowEmojiPicker(false)} aria-label="Close emoji picker">×</button>
            </div>
            <div className="emojiBoxGrid">
              {emojis.map((emoji, index) => (
                <button key={index} className="emojiBoxItem" onClick={() => addEmoji(emoji)} aria-label={`Emoji ${emoji}`}>{emoji}</button>
              ))}
            </div>
          </div>
        )}

        <footer className="chatInputArea">
          <div className="chatInputGroup">
            <input ref={fileInputRef} type="file" className="chatHiddenFileInput" onChange={handleFileSelected} style={{ display: "none" }} />
            <button className="chatAttachBtn" onClick={handleFileAttach} disabled={isSending} aria-label="Attach file">
              <span className="attachIcon" aria-hidden="true">📎</span>
            </button>
            <div className="chatInputWrapper">
              <input ref={messageInputRef} id="messageInput" type="text" value={newMessage} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder={`Message ${counselorName}...`} className="chatTextInput" autoComplete="off" enterKeyHint="send" aria-label="Message input" />
              <button className="chatEmojiBtn" onClick={() => setShowEmojiPicker(!showEmojiPicker)} aria-label="Open emoji picker">
                <span className="emojiIcon" aria-hidden="true">😊</span>
              </button>
            </div>
            <button onMouseDown={(e) => e.preventDefault()} onClick={handleSendButtonClick} disabled={!newMessage.trim() || isSending} className="chatSendBtn" aria-label="Send message">
              <span className="sendIcon" aria-hidden="true">{isSending ? "⏳" : "➤"}</span>
            </button>
          </div>
        </footer>
      </div>

      {/* Call Modals */}
      <VideoCallModal
        isOpen={isVideoModalOpen}
        onClose={handleCloseModal}
        callData={selectedCall}
        callMode={selectedCall?.callType || selectedCall?.type || "video"}
        currentUser={currentUser}
        onEndCall={handleEndCall}
      />

      {/* Professional Incoming Call Modal */}
      <IncomingCallModal
        isOpen={showIncomingModal}
        onClose={() => setShowIncomingModal(false)}
        callType={incomingCallData.callType}
        callerName={incomingCallData.name}
        callerImage={incomingCallData.image}
        callData={incomingCallData}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
        fallbackName="Counselor"
      />
    </div>
  );
};

export default ChatBox;