// // ChatBox.jsx - Fully Responsive Chat Interface with Proper Scroll Behavior
// import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
// import axios from "axios";
// import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
// import { FaArrowLeft, FaPhoneAlt, FaSpinner, FaVideo, FaCamera } from "react-icons/fa";
// import "./ChatBox.css";
// import VideoCallModal from "../CallModal/VideoCallModal";
// import PhotoPreviewModal from "../../../common/PhotoPreviewModal/PhotoPreviewModal";
// import { API_BASE_URL } from "../../../../axiosConfig";
// import socketService from "../../../../services/socketService";
// import useRingtone from "../../../../hooks/useRingtone";
// import IncomingCallModal from "../../../common/IncomingCallModal/IncomingCallModal";
// import { useUserTranslation, useUserApiTranslation } from "../../../../i18n/LanguageContext";
// import RatingModal from "../../../../components/RatingModal";
// import ratingService from "../../../../services/ratingService";
// import {
//   formatPresenceText,
//   getPresence,
//   getPresenceUserId,
//   resolveOfflineLastSeen,
// } from "../../../../utils/presence";
// import TranslatedMessage from "../../../common/TranslatedMessage";
// import ChatCallHistory from "../../../common/ChatCallHistory";

// const ChatBox = () => {
//   const { t, lang } = useUserTranslation();
//   const { translate } = useUserApiTranslation();
//   const { id: counselorId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
//   const { chatId, counselor: initialCounselor, user: initialUser } = location.state || {};

//   const [currentChat, setCurrentChat] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [currentCounselor, setCurrentCounselor] = useState(() => {
//     if (initialCounselor) return initialCounselor;
//     return {
//       id: counselorId || null,
//       name: "Dr. Suresh Reddy",
//       specialization: "Clinical Psychologist",
//       online: false,
//       avatar: null,
//       avatarType: "text",
//       profilePhoto: null,
//       phoneNumber: "+91 98765 43215",
//     };
//   });

//   const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
//   const [selectedCall, setSelectedCall] = useState(null);
//   const [isInitiatingCall, setIsInitiatingCall] = useState(false);
//   const [callError, setCallError] = useState(null);
//   const [showIncomingModal, setShowIncomingModal] = useState(false);
//   const [incomingCallData, setIncomingCallData] = useState({
//     name: "",
//     image: null,
//     callId: "",
//     roomId: "",
//     callType: "video",
//   });
//   const { startRinging, stopRinging } = useRingtone();

//   const [newMessage, setNewMessage] = useState("");
//   const [showOptions, setShowOptions] = useState(false);
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const [isTyping, setIsTyping] = useState(false);
//   const [remoteIsTyping, setRemoteIsTyping] = useState(false);
//   const [isSending, setIsSending] = useState(false);
//   const [deletingMessageId, setDeletingMessageId] = useState(null);
//   const [isLoadingMessages, setIsLoadingMessages] = useState(false);
//   const [chatStatus, setChatStatus] = useState(null);
//   const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
//   const [blockedPopup, setBlockedPopup] = useState({ show: false, reason: "" });
//   const [originalMessages, setOriginalMessages] = useState([]);
//   const [isTranslating, setIsTranslating] = useState(false);


//   const [showCameraPreview, setShowCameraPreview] = useState(false);
// const [cameraStream, setCameraStream] = useState(null);
// const videoRef = useRef(null);

//   // ─── Counselor rating ──────────────────────────────────────────────────────
//   const [showRatingModal, setShowRatingModal] = useState(false);
//   const [ratingSubmitting, setRatingSubmitting] = useState(false);
//   const [ratingTarget, setRatingTarget] = useState(null);
//   const [photoPreview, setPhotoPreview] = useState(null);
//   const [photoSending, setPhotoSending] = useState(false);
//   const ratingPromptedRef = useRef(false);
//   const sessionChatIdRef = useRef(chatId || null);

//   const messagesEndRef = useRef(null);
//   const messagesContainerRef = useRef(null);
//   const optionsRef = useRef(null);
//   const emojiPickerRef = useRef(null);
//   const timeoutRef = useRef(null);
//   const fileInputRef = useRef(null);
//   const cameraInputRef = useRef(null);
//   const messageInputRef = useRef(null);
//   const chatSocketRef = useRef(null);
//   const typingTimeoutRef = useRef(null);
//   const prevScrollHeightRef = useRef(0);
//   const isUserScrollingRef = useRef(false);
//   const isInitialLoadRef = useRef(true);

//   useEffect(() => {
//     const checkMobile = () => setIsMobile(window.innerWidth <= 768);
//     window.addEventListener("resize", checkMobile);
//     return () => window.removeEventListener("resize", checkMobile);
//   }, []);

//   const getCurrentUser = () => {
//     const storedUserData = localStorage.getItem("userData") || localStorage.getItem("user");
//     if (!storedUserData) return null;
//     try {
//       return JSON.parse(storedUserData);
//     } catch (e) {
//       return null;
//     }
//   };

//   const currentUser = getCurrentUser();
//   const resolveCurrentUserId = () => currentUser?.id || currentUser?._id || localStorage.getItem("userId") || null;
//   const resolveCounselorId = () => currentCounselor?.id?.toString() || currentCounselor?._id?.toString() || counselorId || currentChat?.counselorId?.toString() || null;

//   const getProfilePhotoUrl = (counselor) => {
//     if (!counselor) return null;
//     if (counselor?.profilePhoto?.url) return counselor.profilePhoto.url;
//     if (counselor?.avatar && counselor?.avatarType === "image") return counselor.avatar;
//     return null;
//   };

//   const getInitials = (name) => {
//     if (!name) return "?";
//     return name.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2);
//   };

//   const scrollToBottom = useCallback((behavior = "smooth", force = false) => {
//     if (messagesContainerRef.current && (shouldScrollToBottom || force)) {
//       const container = messagesContainerRef.current;
//       requestAnimationFrame(() => {
//         container.scrollTo({
//           top: container.scrollHeight,
//           behavior: behavior,
//         });
//       });
//     }
//   }, [shouldScrollToBottom]);

//   const focusMessageInput = useCallback(() => {
//     const input = messageInputRef.current;
//     if (!input) return;
//     requestAnimationFrame(() => input.focus({ preventScroll: true }));
//     setTimeout(() => input.focus({ preventScroll: true }), 50);
//   }, []);

//   // ─── Rating flow ──────────────────────────────────────────────────────────
//   const triggerRatingPrompt = useCallback(async () => {
//     if (ratingPromptedRef.current) return;
//     const counselorIdResolved = resolveCounselorId();
//     if (!counselorIdResolved) return;
//     ratingPromptedRef.current = true;
//     const target = {
//       counselorId: counselorIdResolved,
//       counselorName: currentCounselor?.name || "Counselor",
//       counselorPhoto: getProfilePhotoUrl(currentCounselor),
//       chatId: getChatIdForAPI(),
//     };
//     setRatingTarget(target);
//     setShowRatingModal(true);
//     await ratingService.savePendingRating(target);
//   }, [currentCounselor]);

//   // Show rating popup when user navigates away from chat
//   const handleBackClick = async () => {
//     const counselorIdResolved = resolveCounselorId();
//     const apiChatId = getChatIdForAPI();

//     // Check if user has already rated THIS COUNSELOR (not just this session)
//     const alreadyRatedCounselor = await ratingService.isAlreadyRated(counselorIdResolved);
//     if (alreadyRatedCounselor || ratingPromptedRef.current) {
//       // Already rated this counselor, just navigate back
//       navigate(-1);
//       return;
//     }

//     // Check if there's a pending rating for this session
//     const allPending = await ratingService.getAllPendingRatings();
//     const hasPendingRating = allPending.some(r => r.chatId === apiChatId);

//     if (hasPendingRating && !ratingPromptedRef.current) {
//       // Still need to rate this session, show popup
//       ratingPromptedRef.current = true;
//       const target = {
//         counselorId: counselorIdResolved,
//         counselorName: currentCounselor?.name || "Counselor",
//         counselorPhoto: getProfilePhotoUrl(currentCounselor),
//         chatId: apiChatId,
//       };
//       setRatingTarget(target);
//       setShowRatingModal(true);
//       return; // Don't navigate away yet
//     }

//     // No pending rating, navigate back
//     navigate(-1);
//   };

//   // In-app 24h re-prompt on mount
//   useEffect(() => {
//     let cancelled = false;
//     (async () => {
//       const due = await ratingService.getDuePendingRating();
//       if (!cancelled && due && !ratingPromptedRef.current) {
//         ratingPromptedRef.current = true;
//         setRatingTarget(due);
//         setShowRatingModal(true);
//       }
//     })();
//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   // Save current chat to pending on mount so back button knows it needs rating
//   useEffect(() => {
//     const counselorIdResolved = resolveCounselorId();
//     const apiChatId = getChatIdForAPI();
//     if (counselorIdResolved && apiChatId) {
//       ratingService.savePendingRating({
//         counselorId: counselorIdResolved,
//         counselorName: currentCounselor?.name || "Counselor",
//         counselorPhoto: getProfilePhotoUrl(currentCounselor),
//         chatId: apiChatId,
//       });
//     }
//   }, []);

//   const handleSubmitRating = async ({ stars, comment }) => {
//     if (!ratingTarget) return;
//     setRatingSubmitting(true);
//     try {
//       await ratingService.submitRating({
//         counselorId: ratingTarget.counselorId,
//         stars,
//         comment,
//         chatId: ratingTarget.chatId,
//       });
//       setShowRatingModal(false);
//       alert("Thank you! Your rating helps others find the right counselor.");
//     } catch (e) {
//       console.log("submitRating failed:", e?.message);
//       alert("Couldn't submit. Please try again in a moment.");
//     } finally {
//       setRatingSubmitting(false);
//     }
//   };

//   const handleDismissRating = () => {
//     setShowRatingModal(false);
//     // Reset the ref so popup will show again on next visit (until they submit)
//     ratingPromptedRef.current = false;
//     navigate(-1);
//   };

//   const getChatIdForAPI = () => {
//     if (chatId) return chatId;
//     if (currentChat?.chatId) return currentChat.chatId;
//     if (!sessionChatIdRef.current) {
//       const stableUserId = getCurrentUser()?.id || "user";
//       const stableCounselorId = counselorId || "counselor";
//       sessionChatIdRef.current = `chat_${stableUserId}_${stableCounselorId}`.replace(/\s+/g, "_");
//     }
//     return sessionChatIdRef.current;
//   };

//   const handleAcceptCall = async (callId) => {
//     try {
//       const resolvedCallId =
//         callId ||
//         incomingCallData?.callId ||
//         incomingCallData?.id ||
//         incomingCallData?._id;

//       if (!resolvedCallId) {
//         throw new Error("Missing callId for incoming call");
//       }

//       const token =
//         localStorage.getItem("token") || localStorage.getItem("accessToken");
//       const userId = resolveCurrentUserId();

//       if (!userId) {
//         throw new Error("User ID missing. Please login again.");
//       }

//       const response = await axios.put(
//         `${API_BASE_URL}/api/video/calls/${resolvedCallId}/accept`,
//         {
//           acceptorId: userId,
//           acceptorType: "user",
//         },
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         },
//       );

//       if (!response.data?.success) {
//         throw new Error(response.data?.error || "Failed to accept call");
//       }

//       let detailedCall = null;
//       try {
//         const detailsResponse = await axios.get(
//           `${API_BASE_URL}/api/video/calls/${resolvedCallId}/details`,
//           {
//             params: {
//               userId,
//               userType: "user",
//             },
//             headers: { Authorization: `Bearer ${token}` },
//           },
//         );

//         detailedCall = detailsResponse.data?.call || null;
//       } catch (detailsError) {
//         console.warn("Could not fetch accepted call details:", detailsError);
//       }
//       const incomingType = String(incomingCallData.callType || "video").toLowerCase();
//       const modalType = incomingType === "audio" ? "voice" : incomingType;
//       const remoteParticipant = detailedCall ? String(detailedCall.initiator?.id) === String(userId) ? detailedCall.receiver : detailedCall.initiator : incomingCallData.from || null;
//       const acceptedCallData = {
//         id: detailedCall?.id || resolvedCallId,
//         callId: resolvedCallId,
//         roomId:
//           response.data.roomId ||
//           detailedCall?.roomId ||
//           incomingCallData.roomId,
//         name:
//           remoteParticipant?.displayName ||
//           remoteParticipant?.fullName ||
//           incomingCallData.name ||
//           "Counselor",
//         type: modalType,
//         callType: modalType,
//         profilePic: remoteParticipant?.profilePhoto || incomingCallData.image || null,
//         phoneNumber: remoteParticipant?.phoneNumber || remoteParticipant?.phone || "",
//         status: response.data.status || detailedCall?.status || "active",
//         apiCallData: detailedCall,
//         initiator: detailedCall?.initiator,
//         receiver: detailedCall?.receiver,
//         currentUserId: userId,
//         currentUserType: "user",
//         isIncoming: true,
//       };
//       setSelectedCall(acceptedCallData);
//       setIsVideoModalOpen(true);
//       setShowIncomingModal(false);
//       return response.data;
//     } catch (error) {
//       console.error("Error accepting call:", error);
//       throw error;
//     }
//   };

//   const handleRejectCall = async (callId) => {
//     const resolvedCallId =
//       callId ||
//       incomingCallData?.callId ||
//       incomingCallData?.id ||
//       incomingCallData?._id;

//     try {
//       if (!resolvedCallId) {
//         return false;
//       }

//       const token =
//         localStorage.getItem("token") || localStorage.getItem("accessToken");
//       const userId = resolveCurrentUserId();

//       if (!userId) {
//         throw new Error("User ID missing. Please login again.");
//       }

//       await axios.put(
//         `${API_BASE_URL}/api/video/calls/${resolvedCallId}/reject`,
//         {
//           userId,
//           reason: "declined",
//         },
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         },
//       );
//       return true;
//     } catch (error) {
//       if (error?.response?.status === 404) {
//         try {
//           const token =
//             localStorage.getItem("token") ||
//             localStorage.getItem("accessToken");
//           await axios.post(
//             `${API_BASE_URL}/api/call/${resolvedCallId}/reject`,
//             { reason: "declined" },
//             {
//               headers: { Authorization: `Bearer ${token}` },
//             },
//           );
//           return true;
//         } catch (fallbackError) {
//           console.error("Reject fallback failed:", fallbackError);
//         }
//       }
//       console.error("Error rejecting call:", error);
//       return false;
//     }
//   };

// // ─── Translation Functions ──────────────────────────────────────────────
// const translateMessage = useCallback(async (text, targetLang) => {
//   return text;
// }, []);

// // Translate messages when language changes
// useEffect(() => {
//   if (!lang || lang === 'en') {
//     setIsTranslating(false);
//     setMessages(originalMessages);
//     return;
//   }

//   if (!originalMessages || originalMessages.length === 0) {
//     setIsTranslating(false);
//     return;
//   }

//   console.log('🌐 Starting translation to language:', lang, 'Messages count:', originalMessages.length);

//   const translateMessages = async () => {
//     setIsTranslating(true);
//     try {
//       console.log('📝 Translating', originalMessages.length, 'messages...');

//       const translatedMsgs = await Promise.all(
//         originalMessages.map(async (msg) => {
//           // Skip user messages and empty messages
//           if (!msg.text || msg.sender === 'user') {
//             return msg;
//           }

//           try {
//             console.log('  → Translating:', msg.text.slice(0, 40) + '...');
//             const translatedText = await translateMessage(msg.text, lang);

//             if (translatedText && translatedText !== msg.text) {
//               console.log('    ✓ Result:', translatedText.slice(0, 40) + '...');
//               return { ...msg, text: translatedText };
//             }
//             return msg;
//           } catch (error) {
//             console.error('Error translating individual message:', error);
//             return msg;
//           }
//         })
//       );

//       console.log('✅ Translation complete! Updating UI with', translatedMsgs.length, 'messages');
//       setMessages(translatedMsgs);
//     } catch (error) {
//       console.error('❌ Error translating messages:', error);
//       setMessages(originalMessages);
//     } finally {
//       setIsTranslating(false);
//     }
//   };

//   translateMessages();
// }, [lang, originalMessages, translateMessage]);



//   const handleEndCall = async (callId) => {
//     try {
//       const resolvedCallId =
//         callId ||
//         selectedCall?.callId ||
//         incomingCallData?.callId ||
//         selectedCall?.id ||
//         incomingCallData?.id ||
//         incomingCallData?._id;

//       if (!resolvedCallId) {
//         return false;
//       }

//       const token =
//         localStorage.getItem("token") || localStorage.getItem("accessToken");
//       const userId = resolveCurrentUserId();

//       if (!userId) {
//         throw new Error("User ID missing. Please login again.");
//       }

//       await axios.put(
//         `${API_BASE_URL}/api/video/calls/${resolvedCallId}/end`,
//         {
//           userId: userId,
//           endedBy: "user",
//         },
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         },
//       );
//       return true;
//     } catch (error) {
//       console.error("Error ending call:", error);
//       return false;
//     }
//   };

//   // Handle scroll events to detect if user is manually scrolling
//   const handleScroll = useCallback(() => {
//     if (!messagesContainerRef.current) return;
    
//     const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
//     const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
//     if (isNearBottom) {
//       setShouldScrollToBottom(true);
//       isUserScrollingRef.current = false;
//     } else {
//       setShouldScrollToBottom(false);
//       isUserScrollingRef.current = true;
//     }
//   }, []);

//   // Scroll to bottom when new messages arrive
//   useEffect(() => {
//     if (messages.length === 0) return;
    
//     if (isInitialLoadRef.current) {
//       // Force an immediate scroll
//       scrollToBottom("auto", true);
      
//       const timer = setTimeout(() => {
//         scrollToBottom("auto", true);
//         isInitialLoadRef.current = false;
//       }, 50);
//       return () => clearTimeout(timer);
//     } else if (shouldScrollToBottom) {
//       scrollToBottom("smooth");
//     } else {
//       if (messagesContainerRef.current) {
//         prevScrollHeightRef.current = messagesContainerRef.current.scrollHeight;
//       }
//     }
//   }, [messages, scrollToBottom, shouldScrollToBottom]);

//   // Maintain scroll position when new content is added above (e.g., loading older messages)
//   useEffect(() => {
//     if (!shouldScrollToBottom && messagesContainerRef.current && prevScrollHeightRef.current > 0) {
//       const newScrollHeight = messagesContainerRef.current.scrollHeight;
//       const scrollDifference = newScrollHeight - prevScrollHeightRef.current;
//       if (scrollDifference > 0) {
//         messagesContainerRef.current.scrollTop += scrollDifference;
//       }
//       prevScrollHeightRef.current = newScrollHeight;
//     }
//   }, [messages, shouldScrollToBottom]);

//   useEffect(() => {
//     const fetchIncomingCalls = async () => {
//       try {
//         const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
//         const userId = resolveCurrentUserId();

//         if (!userId || !token || isVideoModalOpen) {
//           return;
//         }

//         const response = await axios.get(
//           `${API_BASE_URL}/api/video/calls/pending/${userId}`,
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           },
//         );

//         const callsList =
//           response.data.pendingRequests ||
//           response.data.waitingCalls ||
//           response.data.calls ||
//           [];

//         const currentIncomingId =
//           incomingCallData?.callId ||
//           incomingCallData?.id ||
//           incomingCallData?._id;
//         const stillWaiting = currentIncomingId
//           ? callsList.some(
//               (c) => (c.callId || c.id || c._id) === currentIncomingId,
//             )
//           : false;

//         if (showIncomingModal && currentIncomingId && !stillWaiting) {
//           setShowIncomingModal(false);
//           setIncomingCallData({
//             name: "",
//             image: null,
//             callId: "",
//             roomId: "",
//             callType: "video",
//           });
//           return;
//         }

//         if (response.data.success && callsList.length > 0) {
//           const waitingCall =
//             callsList.find((call) => {
//               const normalizedStatus = String(call.status || "").toLowerCase();
//               return (
//                 !normalizedStatus ||
//                 normalizedStatus === "waiting" ||
//                 normalizedStatus === "ringing" ||
//                 normalizedStatus === "pending" ||
//                 normalizedStatus === "requested"
//               );
//             }) || callsList[0];

//           if (!waitingCall || showIncomingModal) {
//             return;
//           }

//           const fromData = waitingCall.from || {};

//           // Extract full name properly - priority: fullName > displayName
//           const callerFullName =
//             fromData.fullName || fromData.displayName || "Counselor";

//           const resolvedIncomingCallId =
//             waitingCall.callId || waitingCall.id || waitingCall._id;

//           setIncomingCallData({
//             callId: resolvedIncomingCallId,
//             id: waitingCall.id || resolvedIncomingCallId,
//             _id: waitingCall._id || resolvedIncomingCallId,
//             roomId: waitingCall.roomId,
//             name: callerFullName,
//             image: fromData.profilePhoto || null,
//             callType: waitingCall.callType || "video",
//             from: fromData,
//             requestMessage: waitingCall.requestMessage,
//             requestedAt: waitingCall.requestedAt,
//             expiresAt: waitingCall.expiresAt,
//             remainingSeconds: waitingCall.remainingSeconds,
//           });
//           setShowIncomingModal(true);
//         } else if (showIncomingModal) {
//           setShowIncomingModal(false);
//           setIncomingCallData({
//             name: "",
//             image: null,
//             callId: "",
//             roomId: "",
//             callType: "video",
//           });
//         }
//       } catch (error) {
//         console.error("Error polling for calls:", error);
//       }
//     };
//     const interval = setInterval(fetchIncomingCalls, 5000);
//     return () => clearInterval(interval);
//   }, [
//     showIncomingModal,
//     currentUser,
//     isVideoModalOpen,
//     incomingCallData?.callId,
//   ]);

//   useEffect(() => {
//     if (showIncomingModal && !isVideoModalOpen) {
//       void startRinging();
//       return;
//     }

//     stopRinging();
//   }, [showIncomingModal, isVideoModalOpen, startRinging, stopRinging]);

//   useEffect(() => {
//     return () => {
//       stopRinging();
//     };
//   }, [stopRinging]);
//   // GET messages from API
//   const fetchMessagesFromAPI = async () => {
//     try {
//       const apiChatId = getChatIdForAPI();
//       const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
//       setIsLoadingMessages(true);
//       const response = await axios.get(`${API_BASE_URL}/api/chat/chat/${apiChatId}/messages`, {
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//       });
//       if (response.data && response.data.messages) {
//         if (response.data.chatStatus) setChatStatus(response.data.chatStatus);
//         const transformedMessages = response.data.messages.map((msg, index) => ({
//           id: msg.id || index,
//           messageId: msg.messageId,
//           text: msg.content,
//           sender: msg.senderRole === "user" ? "user" : "counselor",
//           senderRole: msg.senderRole,
//           time: new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
//           fullTime: msg.createdAt,
//           contentType: msg.contentType,
//           attachmentUrl: msg.attachmentUrl || null,
//           attachmentName: msg.attachmentName || null,
//           attachmentMimeType: msg.attachmentMimeType || null,
//           attachmentSize: msg.attachmentSize || null,
//           isRead: msg.isRead,
//           status: "sent",
//         }));
//         setOriginalMessages(transformedMessages);
//         setMessages(transformedMessages);
//         if (currentChat) {
//           setCurrentChat((prev) => ({ ...prev, messages: transformedMessages, chatStatus: response.data.chatStatus }));
//         }
//         return transformedMessages;
//       }
//     } catch (error) {
//       console.error("Error fetching messages from API:", error);
//       loadMessagesFromLocalStorage();
//     } finally {
//       setIsLoadingMessages(false);
//     }
//   };

//   const loadMessagesFromLocalStorage = () => {
//     try {
//       const savedChats = JSON.parse(localStorage.getItem("activeChats") || "[]");
//       const chat = savedChats.find((c) => c.id === currentChat?.id || c.chatId === getChatIdForAPI());
//       if (chat && chat.messages) setMessages(chat.messages);
//     } catch (error) {
//       console.error("Error loading messages from localStorage:", error);
//     }
//   };

//   const sendMessageToAPI = async ({ messageContent = "", file = null }) => {
//     try {
//       const apiChatId = getChatIdForAPI();
//       const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
//       let response;
//       if (file) {
//         const formData = new FormData();
//         if (messageContent.trim()) formData.append("content", messageContent.trim());
//         formData.append("attachment", file);
//         response = await axios.post(`${API_BASE_URL}/api/chat/chat/${apiChatId}/message`, formData, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//       } else {
//         response = await axios.post(`${API_BASE_URL}/api/chat/chat/${apiChatId}/message`, { content: messageContent }, {
//           headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         });
//       }
//       if (response.data && response.data.success) return response.data.message;
//       else throw new Error("Invalid API response");
//     } catch (error) {
//       console.error("Error sending message to API:", error);
//       throw error;
//     }
//   };

//   const handleSendMessage = async () => {
//     if (newMessage.trim() === "" || isSending) return;
//     const messageText = newMessage.trim();
//     const tempUserMessage = {
//       id: `temp_${Date.now()}`,
//       text: messageText,
//       sender: "user",
//       senderRole: "user",
//       time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
//       createdAt: new Date().toISOString(),
//       status: "sending",
//       isTemporary: true,
//     };
//     setOriginalMessages((prev) => [...prev, tempUserMessage]);
//     setMessages((prev) => [...prev, tempUserMessage]);
//     setNewMessage("");
//     focusMessageInput();
//     setShowEmojiPicker(false);
//     setIsSending(true);
//     if (timeoutRef.current) clearTimeout(timeoutRef.current);
//     try {
//       const sentMsg = await sendMessageToAPI({ messageContent: messageText });
//       setOriginalMessages((prev) => {
//         const withoutTemp = prev.filter((m) => !m.isTemporary);
//         if (!sentMsg) return withoutTemp;
//         const alreadyHas = withoutTemp.some((m) => m.messageId && sentMsg.messageId && m.messageId === sentMsg.messageId);
//         if (alreadyHas) return withoutTemp;
//         return [...withoutTemp, {
//           id: sentMsg.id || sentMsg._id,
//           messageId: sentMsg.messageId,
//           text: sentMsg.content,
//           sender: "user",
//           senderRole: "user",
//           time: new Date(sentMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
//           fullTime: sentMsg.createdAt,
//           contentType: sentMsg.contentType,
//           isRead: sentMsg.isRead,
//           status: "sent",
//         }];
//       });

//       setMessages((prev) => {
//         const withoutTemp = prev.filter((m) => !m.isTemporary);
//         if (!sentMsg) return withoutTemp;
//         const alreadyHas = withoutTemp.some((m) => m.messageId && sentMsg.messageId && m.messageId === sentMsg.messageId);
//         if (alreadyHas) return withoutTemp;
//         return [...withoutTemp, {
//           id: sentMsg.id || sentMsg._id,
//           messageId: sentMsg.messageId,
//           text: sentMsg.content,
//           sender: "user",
//           senderRole: "user",
//           time: new Date(sentMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
//           fullTime: sentMsg.createdAt,
//           contentType: sentMsg.contentType,
//           isRead: sentMsg.isRead,
//           status: "sent",
//         }];
//       });
//     } catch (err) {
//       console.error("Error in message sending flow:", err);
//       const status = err?.response?.status;
//       const serverError = err?.response?.data?.error || err?.response?.data?.message || "";
//       const isBlocked = status === 403 && /restricted|blocked|unavailable/i.test(serverError);

//       setMessages((prev) => prev.filter((msg) => msg.id !== tempUserMessage.id));

//       if (isBlocked) {
//         setBlockedPopup({ show: true, reason: serverError });
//       } else {
//         const errorMessage = {
//           id: `error_${Date.now()}`,
//           text: "⚠️ Failed to send message. Please check your internet connection and try again.",
//           sender: "counselor",
//           senderRole: "counsellor",
//           time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
//           isError: true,
//           status: "error",
//         };
//         setOriginalMessages((prev) => [...prev, errorMessage]);
//         setMessages((prev) => [...prev, errorMessage]);
//       }
//     } finally {
//       setIsSending(false);
//       focusMessageInput();
//     }
//   };

//   const initiateStreamCall = async (requestedCallType = "video") => {
//     const normalizedMode = requestedCallType === "audio" || requestedCallType === "voice" ? "voice" : "video";
//     if (!currentCounselor) {
//       setCallError("Counselor information not available");
//       return;
//     }
//     setIsInitiatingCall(true);
//     setCallError(null);
//     try {
//       const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
//       const initiatorId = resolveCurrentUserId();
//       const initiatorType = "user";
//       const receiverId = resolveCounselorId();
//       const receiverName = currentCounselor.name || "Counselor";
//       const receiverType = "counsellor";
//       if (!initiatorId || !receiverId) throw new Error("Unable to start call. Missing user/counselor ID.");
//       const requestBody = { initiatorId, initiatorType, receiverId, receiverType, callType: normalizedMode === "voice" ? "audio" : "video" };
//       const response = await axios.post(`${API_BASE_URL}/api/video/calls/initiate`, requestBody, {
//         headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
//       });
//       if (response.data && response.data.success) {
//         const receiverProfilePhoto = response.data.callData?.receiver?.profilePhoto || getProfilePhotoUrl(currentCounselor) || currentCounselor?.avatar || currentCounselor?.name?.charAt(0) || "👤";
//         const callData = {
//           id: response.data.callData?.id,
//           callId: response.data.callId,
//           roomId: response.data.roomId,
//           name: response.data.callData?.receiver?.name || receiverName,
//           type: normalizedMode,
//           callType: normalizedMode,
//           profilePic: receiverProfilePhoto,
//           phoneNumber: currentCounselor?.phoneNumber,
//           status: response.data.status || "ringing",
//           date: "Today",
//           time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
//           apiCallData: response.data.callData,
//           initiator: response.data.callData?.initiator,
//           receiver: response.data.callData?.receiver,
//         };
//         setSelectedCall(callData);
//         setIsVideoModalOpen(true);
//       } else {
//         throw new Error(response.data?.message || `Failed to initiate ${normalizedMode} call`);
//       }
//     } catch (error) {
//       console.error(`Error initiating ${normalizedMode} call:`, error);
//       let errorMessage = `Failed to initiate ${normalizedMode} call. `;
//       const backendMessage = error.response?.data?.message || error.response?.data?.error;
//       errorMessage += backendMessage || error.message || "Please check your connection and try again.";
//       setCallError(errorMessage);
//       setSelectedCall(null);
//       setIsVideoModalOpen(false);
//     } finally {
//       setIsInitiatingCall(false);
//     }
//   };

//   const handleVideoCall = () => initiateStreamCall("video");
//   const handleVoiceCall = () => initiateStreamCall("audio");
//   const handleCloseModal = () => { setIsVideoModalOpen(false); setSelectedCall(null); setCallError(null); };

//   // Handle menu item clicks
//   const handleMenuItemClick = async (item) => {
//     switch (item.id) {
//       case 1: // Refresh Messages
//         fetchMessagesFromAPI();
//         break;
//       case 2: // Clear Chat
//         handleClearChat();
//         break;
//       case 3: // Report Issue
//         alert(t('feature_coming_soon') || 'Feature coming soon');
//         break;
//       case 4: // Chat Details
//         alert(t('feature_coming_soon') || 'Feature coming soon');
//         break;
//       default:
//         alert(`${item.label} clicked`);
//     }
//   };

//   // Clear all messages in the chat
//   const handleClearChat = async () => {
//     const confirmed = window.confirm(
//       t('confirm_clear_chat') || 'Are you sure? This will delete all messages in this chat. You can start a new conversation after.'
//     );
//     if (!confirmed) return;

//     try {
//       setIsSending(true);
//       const chatIdToUse = currentChat?._id || currentChat?.id || chatId;

//       if (!chatIdToUse) {
//         alert(t('error_chat_id_not_found') || 'Error: Chat ID not found');
//         return;
//       }

//       const token = localStorage.getItem('token') || localStorage.getItem('accessToken');

//       // Call backend API to clear chat
//       const response = await axios.delete(
//         `${API_BASE_URL}/api/chat/clear/${chatIdToUse}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           },
//         }
//       );

//       console.log('✅ Chat cleared successfully:', response.data);

//       // Clear messages in UI
//       setMessages([]);
//       setNewMessage('');

//       // Reset chat status to allow new messages
//       setChatStatus(null);

//       // Update localStorage - reset chat to active state
//       const savedChats = JSON.parse(localStorage.getItem('activeChats') || '[]');
//       const updatedChats = savedChats.map((c) => {
//         if (c.id === currentChat?.id || c.id === chatId) {
//           return {
//             ...c,
//             messages: [],
//             unread: 0,
//             status: 'active', // ✅ Reset to active so new messages work
//             lastMessage: null,
//             lastMessageAt: null
//           };
//         }
//         return c;
//       });
//       localStorage.setItem('activeChats', JSON.stringify(updatedChats));

//       // Update currentChat state
//       setCurrentChat(prev => prev ? {
//         ...prev,
//         messages: [],
//         status: 'active',
//         lastMessage: null,
//         lastMessageAt: null
//       } : null);

//       alert(t('chat_cleared_restart') || 'Chat cleared! You can now start a new conversation.');
//     } catch (error) {
//       console.error('❌ Error clearing chat:', error);
//       const errorMsg = error.response?.data?.error || error.message || 'Failed to clear chat';
//       alert(t('error_clear_chat') || `Error: ${errorMsg}`);
//     } finally {
//       setIsSending(false);
//       setShowOptions(false);
//     }
//   };

//   const handleDeleteMessage = async (message) => {
//     const messageId = message?.id || message?._id || message?.messageId;
//     if (!messageId || String(messageId).startsWith("temp_")) return;
//     if (!window.confirm("Delete this message and its attachment?")) return;

//     try {
//       setDeletingMessageId(String(messageId));
//       const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
//       await axios.delete(`${API_BASE_URL}/api/chat/message/${encodeURIComponent(messageId)}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const matchesDeletedMessage = (item) =>
//         [item.id, item._id, item.messageId].map(String).includes(String(messageId));
//       setMessages((current) => current.filter((item) => !matchesDeletedMessage(item)));
//       setOriginalMessages((current) => current.filter((item) => !matchesDeletedMessage(item)));
//     } catch (error) {
//       console.error("Error deleting chat message:", error);
//       alert(error.response?.data?.error || error.response?.data?.message || "Failed to delete message");
//     } finally {
//       setDeletingMessageId(null);
//     }
//   };

//   useEffect(() => {
//     const initializeChat = async () => {
//       try {
//         const savedChats = JSON.parse(localStorage.getItem("activeChats") || "[]");
//         const stateCounselorId = initialCounselor?.id || initialCounselor?._id;
//         let chat =
//           savedChats.find((c) => c.chatId === chatId || c.id === chatId) ||
//           savedChats.find((c) => c.counselorId === (counselorId || stateCounselorId));
//         if (chat) {
//           setCurrentChat(chat);
//           if (chat.counselor) setCurrentCounselor(chat.counselor);
//           if (chat.unread) {
//             const updatedChats = savedChats.map((c) => { if (c.id === chat.id) return { ...c, unread: false }; return c; });
//             localStorage.setItem("activeChats", JSON.stringify(updatedChats));
//           }
//         } else if (initialCounselor) {
//           const newChat = {
//             id: Date.now(),
//             chatId: chatId || `chat_${Date.now()}`,
//             counselorId: counselorId || stateCounselorId,
//             counselor: initialCounselor,
//             user: initialUser || { name: "User", email: "user@example.com" },
//             messages: [],
//             unread: false,
//             startedAt: new Date().toISOString(),
//           };
//           setCurrentChat(newChat);
//           const updatedChats = [...savedChats, newChat];
//           localStorage.setItem("activeChats", JSON.stringify(updatedChats));
//         }
//         await fetchMessagesFromAPI();
//       } catch (error) {
//         console.error("Error loading chat:", error);
//       }
//     };
//     initializeChat();
//   }, [counselorId, chatId, initialCounselor, initialUser]);

//   useEffect(() => {
//     if (currentChat && messages.length > 0) {
//       try {
//         const savedChats = JSON.parse(localStorage.getItem("activeChats") || "[]");
//         const updatedChats = savedChats.map((chat) => {
//           if (chat.id === currentChat.id) {
//             return { ...chat, messages: messages, lastMessage: messages[messages.length - 1]?.text, lastMessageTime: messages[messages.length - 1]?.time, unread: false, chatStatus: chatStatus };
//           }
//           return chat;
//         });
//         localStorage.setItem("activeChats", JSON.stringify(updatedChats));
//       } catch (error) {
//         console.error("Error saving messages:", error);
//       }
//     }
//   }, [messages, currentChat, chatStatus]);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (optionsRef.current && !optionsRef.current.contains(event.target)) setShowOptions(false);
//       if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) setShowEmojiPicker(false);
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   useEffect(() => { return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }; }, []);

//   // Set up scroll listener
//   useEffect(() => {
//     const container = messagesContainerRef.current;
//     if (container) {
//       container.addEventListener("scroll", handleScroll);
//       return () => container.removeEventListener("scroll", handleScroll);
//     }
//   }, [handleScroll]);

//   useEffect(() => {
//     const apiChatId = chatId || currentChat?.chatId;
//     if (!apiChatId) return;

//     let mounted = true;

//     const onNewMessage = (messageData) => {
//       if (!mounted) return;
//       const userId = resolveCurrentUserId();
//       if (messageData.senderRole === "user" && String(messageData.senderId) === String(userId)) {
//         setMessages((prev) => prev.filter((msg) => !msg.isTemporary));
//         return;
//       }
//       const transformedMessage = {
//         id: messageData.id || messageData.messageId || `rt_${Date.now()}`,
//         messageId: messageData.messageId,
//         text: messageData.content,
//         sender: messageData.senderRole === "user" ? "user" : "counselor",
//         senderRole: messageData.senderRole,
//         time: new Date(messageData.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
//         fullTime: messageData.createdAt,
//         contentType: messageData.contentType,
//         isRead: messageData.isRead,
//         status: "sent",
//       };
//       setOriginalMessages((prev) => {
//         const isDuplicate = prev.some((msg) => msg.messageId && messageData.messageId && msg.messageId === messageData.messageId);
//         if (isDuplicate) return prev;
//         return [...prev, transformedMessage];
//       });

//       setMessages((prev) => {
//         const isDuplicate = prev.some((msg) => msg.messageId && messageData.messageId && msg.messageId === messageData.messageId);
//         if (isDuplicate) return prev;
//         return [...prev, transformedMessage];
//       });
//     };

//     const onTyping = ({ userRole, isTyping: typing }) => {
//       if (!mounted) return;
//       if (userRole !== "user") setRemoteIsTyping(typing);
//     };

//     const onMessagesRead = () => {
//       if (!mounted) return;
//       setMessages((prev) => prev.map((msg) => msg.sender === "user" ? { ...msg, isRead: true } : msg));
//     };

//     const onCallRejected = (payload) => {
//       if (!mounted) return;
//       const declinedBy = payload?.by ? ` by ${payload.by}` : "";
//       setCallError(`Call was declined${declinedBy}.`);
//       setIsVideoModalOpen(false);
//       setSelectedCall(null);
//       setShowIncomingModal(false);
//     };

//     const onCallStatusUpdate = ({ status }) => {
//       if (!mounted) return;
//       const normalizedStatus = String(status || "").toLowerCase();
//       if (normalizedStatus === "rejected" || normalizedStatus === "ended" || normalizedStatus === "cancelled" || normalizedStatus === "canceled" || normalizedStatus === "expired") {
//         setIsVideoModalOpen(false);
//         setSelectedCall(null);
//         setShowIncomingModal(false);
//       }
//     };

//     const onChatStatusUpdate = ({ status }) => {
//       if (!mounted) return;
//       setChatStatus(status);
//       setCurrentChat((prev) => (prev ? { ...prev, status } : prev));
//     };

//     // Real-time presence updates for the counsellor we're chatting with.
//     const onPresenceUpdate = (payload = {}) => {
//       const counselorId = resolveCounselorId();
//       const presenceUserId = getPresenceUserId(payload);
//       const presence = getPresence(payload);
//       if (String(presenceUserId) === String(counselorId)) {
//         console.log(`[Chat Presence] Counselor ${presenceUserId} is now ${presence.isOnline ? 'ONLINE' : 'OFFLINE'}`);
//         setCurrentCounselor((prev) =>
//           prev
//             ? {
//                 ...prev,
//                 online: presence.isOnline,
//                 isOnline: presence.isOnline,
//                 lastSeen: resolveOfflineLastSeen(presence, prev.lastSeen),
//               }
//             : prev,
//         );
//       }
//     };

//     const onConnectError = (err) => {
//       console.error("Chat socket connection error:", err.message);
//     };

//     socketService.connect().then((socket) => {
//       if (!mounted) return;
//       chatSocketRef.current = socket;
//       socket.emit("join-chat", { chatId: apiChatId });
//       socket.on("new-message", onNewMessage);
//       socket.on("user-typing", onTyping);
//       socket.on("messages-read", onMessagesRead);
//       socket.on("call_rejected", onCallRejected);
//       socket.on("call-status-update", onCallStatusUpdate);
//       socket.on("chat-status-update", onChatStatusUpdate);
//       socket.on("presence-update", onPresenceUpdate);
//       socket.on("connect_error", onConnectError);
//     }).catch((err) => {
//       console.error("[ChatBox] Socket connect failed:", err.message);
//     });

//     return () => {
//       mounted = false;
//       const socket = chatSocketRef.current;
//       if (socket) {
//         socket.off("new-message", onNewMessage);
//         socket.off("user-typing", onTyping);
//         socket.off("messages-read", onMessagesRead);
//         socket.off("call_rejected", onCallRejected);
//         socket.off("call-status-update", onCallStatusUpdate);
//         socket.off("chat-status-update", onChatStatusUpdate);
//         socket.off("presence-update", onPresenceUpdate);
//         socket.off("connect_error", onConnectError);
//       }
//       chatSocketRef.current = null;
//     };
//   }, [chatId, currentChat?.chatId]);

//   const handleTypingIndicator = useCallback(() => {
//     const apiChatId = chatId || currentChat?.chatId;
//     if (!chatSocketRef.current || !apiChatId) return;
//     chatSocketRef.current.emit("typing", { chatId: apiChatId, isTyping: true });
//     if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
//     typingTimeoutRef.current = setTimeout(() => {
//       if (chatSocketRef.current) chatSocketRef.current.emit("typing", { chatId: apiChatId, isTyping: false });
//     }, 2000);
//   }, [chatId, currentChat?.chatId]);

//   useEffect(() => {
//     const interval = setInterval(() => { if (currentChat) fetchMessagesFromAPI(); }, 30000);
//     return () => clearInterval(interval);
//   }, [currentChat]);

//   // Translate messages when language changes
//   useEffect(() => {
//     if (!lang || lang === 'en') {
//       setIsTranslating(false);
//       setMessages(originalMessages);
//       return;
//     }

//     if (!originalMessages || originalMessages.length === 0) {
//       setIsTranslating(false);
//       return;
//     }

//     console.log('🌐 Starting translation to language:', lang, 'Messages count:', originalMessages.length);

//     const translateMessages = async () => {
//       setIsTranslating(true);
//       try {
//         console.log('📝 Translating', originalMessages.length, 'messages...');

//         const translatedMsgs = await Promise.all(
//           originalMessages.map(async (msg) => {
//             // Skip user messages and empty messages
//             if (!msg.text || msg.sender === 'user') {
//               return msg;
//             }

//             try {
//               console.log('  → Translating:', msg.text.slice(0, 40) + '...');
//               const translatedText = await translateMessage(msg.text, lang);

//               if (translatedText && translatedText !== msg.text) {
//                 console.log('    ✓ Result:', translatedText.slice(0, 40) + '...');
//                 return { ...msg, text: translatedText };
//               }
//               return msg;
//             } catch (error) {
//               console.error('Error translating individual message:', error);
//               return msg;
//             }
//           })
//         );

//         console.log('✅ Translation complete! Updating UI with', translatedMsgs.length, 'messages');
//         setMessages(translatedMsgs);
//       } catch (error) {
//         console.error('❌ Error translating messages:', error);
//         setMessages(originalMessages);
//       } finally {
//         setIsTranslating(false);
//       }
//     };

//     translateMessages();
//   }, [lang, originalMessages]);

//   const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey && !isSending) { e.preventDefault(); handleSendMessage(); focusMessageInput(); } };
//   const handleSendButtonClick = (e) => { e.preventDefault(); handleSendMessage(); focusMessageInput(); };
//   const addEmoji = (emoji) => { setNewMessage((prev) => prev + emoji); focusMessageInput(); };
//   const emojis = ["😊", "😂", "🥰", "😎", "😢", "😡", "👍", "👋", "❤️", "🎉", "🙏", "💪"];
//   const optionsMenuItems = useMemo(() => [
//     { id: 1, label: t('refresh_messages'), icon: "🔄" },
//     { id: 2, label: t('clear_chat'), icon: "🗑️" },
//     { id: 3, label: t('report_issue'), icon: "⚠️" },
//     { id: 4, label: t('chat_details'), icon: "📋" }
//   ], [lang]);
//   const handleFileAttach = () => { if (isSending) return; fileInputRef.current?.click(); };

//   // const handleCameraClick = () => {
//   //   if (isSending) return;
//   //   cameraInputRef.current?.click();
//   // };

//  // ─── Camera Functions ──────────────────────────────────────────────────────
// const handleCameraClick = () => {
//   if (isSending) return;
  
//   const hasCamera = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
  
//   if (!hasCamera) {
//     alert('Camera is not supported on this device. Please use the attachment option to share images.');
//     return;
//   }
  
//   const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  
//   if (isMobile) {
//     // On mobile, use the file input with capture
//     cameraInputRef.current?.click();
//   } else {
//     // On desktop, use getUserMedia API for camera access
//     openDesktopCamera();
//   }
// };

// const openDesktopCamera = async () => {
//   try {
//     const stream = await navigator.mediaDevices.getUserMedia({ 
//       video: { 
//         facingMode: 'user',
//         width: { ideal: 1280 },
//         height: { ideal: 720 }
//       } 
//     });
    
//     setCameraStream(stream);
//     setShowCameraPreview(true);
    
//     // ✅ IMPORTANT: Set video source after state update
//     setTimeout(() => {
//       if (videoRef.current) {
//         videoRef.current.srcObject = stream;
//         videoRef.current.play().catch(err => console.error('Video play error:', err));
//       }
//     }, 100);
    
//   } catch (error) {
//     console.error('Error accessing camera:', error);
//     if (error.name === 'NotAllowedError') {
//       alert('Camera access was denied. Please allow camera access in your browser settings.');
//     } else if (error.name === 'NotFoundError') {
//       alert('No camera found on this device. Please use the attachment option.');
//     } else {
//       alert('Failed to access camera. Please use the attachment option instead.');
//     }
//   }
// };

// const capturePhoto = () => {
//   const video = videoRef.current;
//   if (!video) {
//     alert('Camera not ready. Please try again.');
//     return;
//   }
  
//   // ✅ Check if video has valid dimensions
//   if (video.videoWidth === 0 || video.videoHeight === 0) {
//     alert('Camera not ready. Please wait a moment and try again.');
//     return;
//   }
  
//   const canvas = document.createElement('canvas');
//   canvas.width = video.videoWidth || 1280;
//   canvas.height = video.videoHeight || 720;
  
//   const context = canvas.getContext('2d');
//   context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
//   // ✅ Show preview instead of directly sending
//   const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
//   setPhotoPreview(imageDataUrl);
  
//   // ✅ Close camera preview
//   closeCamera();
// };

// const closeCamera = () => {
//   if (cameraStream) {
//     cameraStream.getTracks().forEach(track => track.stop());
//     setCameraStream(null);
//   }
//   setShowCameraPreview(false);
// };

// // ✅ Updated renderCameraPreview with better video handling
// const renderCameraPreview = () => {
//   if (!showCameraPreview) return null;
  
//   return (
//     <div className="camera-preview-overlay" onClick={closeCamera}>
//       <div className="camera-preview-content" onClick={(e) => e.stopPropagation()}>
//         <div className="camera-video-wrapper">
//           <video 
//             ref={videoRef} 
//             autoPlay 
//             playsInline
//             muted
//             className="camera-preview-video"
//           />
//           <div className="camera-guide-frame">
//             <div className="camera-guide-corners">
//               <span className="corner tl"></span>
//               <span className="corner tr"></span>
//               <span className="corner bl"></span>
//               <span className="corner br"></span>
//             </div>
//           </div>
//         </div>
//         <div className="camera-preview-actions">
//           <button 
//             className="camera-capture-btn"
//             onClick={capturePhoto}
//             disabled={photoSending}
//           >
//             {photoSending ? '⏳ Sending...' : '📸 Capture'}
//           </button>
//           <button 
//             className="camera-close-btn"
//             onClick={closeCamera}
//           >
//             ✕ Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // ✅ Updated handleSendPhoto - sends photo after preview
// const handleSendPhoto = async () => {
//   if (!photoPreview) return;
//   setPhotoSending(true);
//   try {
//     const base64Data = photoPreview.split(",")[1];
//     const binaryString = atob(base64Data);
//     const bytes = new Uint8Array(binaryString.length);
//     for (let i = 0; i < binaryString.length; i++) {
//       bytes[i] = binaryString.charCodeAt(i);
//     }
//     const blob = new Blob([bytes], { type: "image/jpeg" });
//     const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
//     await sendMessageToAPI({ file });
//     setPhotoPreview(null);
//     // ✅ Show success message
//     // Optional: Show toast notification
//   } catch (error) {
//     console.error('Error sending photo:', error);
//     alert('Failed to send photo. Please try again.');
//   } finally {
//     setPhotoSending(false);
//   }
// };

// const handleFileSelected = async (e) => {
//   const file = e.target.files?.[0];
//   if (!file || isSending) return;

//   // For camera capture on mobile
//   if (e.target === cameraInputRef.current) {
//     const reader = new FileReader();
//     reader.onload = (event) => {
//       setPhotoPreview(event.target?.result);
//     };
//     reader.readAsDataURL(file);
//     e.target.value = ""; // Reset input
//     return;
//   }

//   // For regular file attachment
//   const tempFileMessage = {
//     id: `temp_file_${Date.now()}`,
//     text: file.name,
//     sender: "user",
//     senderRole: "user",
//     time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
//     contentType: file.type.startsWith("image/") ? "IMAGE" : "FILE",
//     status: "sending",
//     isTemporary: true
//   };
  
//   setMessages((prev) => [...prev, tempFileMessage]);
//   setIsSending(true);
  
//   try {
//     await sendMessageToAPI({ file });
//     setMessages((prev) => prev.filter((msg) => !msg.isTemporary));
//   } catch (error) {
//     console.error("Error sending file:", error);
//     setMessages((prev) => prev.map((msg) => 
//       msg.id === tempFileMessage.id 
//         ? { ...msg, status: "error", error: "Failed to send file" } 
//         : msg
//     ));
//   } finally {
//     setIsSending(false);
//     e.target.value = "";
//   }
// };



 
  
//   // const handleFileSelected = async (e) => {
//   //   const file = e.target.files?.[0];
//   //   if (!file || isSending) return;

//   //   if (e.target === cameraInputRef.current) {
//   //     const reader = new FileReader();
//   //     reader.onload = (event) => {
//   //       setPhotoPreview(event.target?.result);
//   //     };
//   //     reader.readAsDataURL(file);
//   //   } else {
//   //     const tempFileMessage = { id: `temp_file_${Date.now()}`, text: file.name, sender: "user", senderRole: "user", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), contentType: file.type.startsWith("image/") ? "IMAGE" : "FILE", status: "sending", isTemporary: true };
//   //     setMessages((prev) => [...prev, tempFileMessage]);
//   //     setIsSending(true);
//   //     try {
//   //       await sendMessageToAPI({ file });
//   //       setMessages((prev) => prev.filter((msg) => !msg.isTemporary));
//   //     } catch (error) {
//   //       console.error("Error sending file:", error);
//   //       setMessages((prev) => prev.map((msg) => msg.id === tempFileMessage.id ? { ...msg, status: "error", error: "Failed to send file" } : msg));
//   //     } finally {
//   //       setIsSending(false);
//   //       e.target.value = "";
//   //     }
//   //   }
//   //   e.target.value = "";
//   // };
//   const handleInputChange = (e) => { setNewMessage(e.target.value); setIsTyping(e.target.value.trim() !== ""); if (e.target.value.trim() !== "") handleTypingIndicator(); };

 


//   const renderProfileAvatar = (counselor, size = "md") => {
//     if (!counselor) return <div className={`chat-profile-initials-${size}`}>?</div>;
//     const profilePhotoUrl = getProfilePhotoUrl(counselor);
//     if (profilePhotoUrl) {
//       return <img src={profilePhotoUrl} alt={counselor.name || "Counselor"} className={`chat-profile-image-${size}`} onError={(e) => { e.target.style.display = "none"; e.target.parentElement.innerHTML = `<div class="chat-profile-initials-${size}">${getInitials(counselor.name || "Counselor")}</div>`; }} />;
//     }
//     return <div className={`chat-profile-initials-${size}`}>{getInitials(counselor.name || "Counselor")}</div>;
//   };

// // ✅ UPDATED renderMessageStatus - Delete icon ADD karo
// const renderMessageStatus = (message) => {
//   if (message.sender !== "user") return null;
  
//   // Status badge
//   let statusBadge = null;
//   switch (message.status) {
//     case "sending": 
//       statusBadge = <span className="message-status sending">⌛ Sending...</span>;
//       break;
//     case "sent": 
//       statusBadge = <span className="message-status sent">✓ Sent</span>;
//       break;
//     case "error": 
//       statusBadge = <span className="message-status error">⚠️ Failed</span>;
//       break;
//     default: 
//       statusBadge = null;
//   }

//   // ✅ DELETE ICON - Sirf user messages ke liye, jo send ho chuke hain
//   const showDeleteIcon = message.sender === "user" && 
//                         !message.isTemporary && 
//                         message.status !== "error" &&
//                         message.status !== "sending";

//   return (
//     <div className="message-status-container">
//       {statusBadge}
//       {showDeleteIcon && (
//         <button
//           type="button"
//           className="message-delete-btn"
//           onClick={() => handleDeleteMessage(message)} // ✅ Existing function call
//           disabled={String(deletingMessageId) === String(message.id || message._id || message.messageId)}
//           aria-label="Delete message"
//           title="Delete message"
//         >
//           {String(deletingMessageId) === String(message.id || message._id || message.messageId) ? (
//             <span className="delete-loading">⌛</span>
//           ) : (
//             <span className="delete-icon">🗑️</span>
//           )}
//         </button>
//       )}
//     </div>
//   );
// };

//   const renderChatStatusBanner = () => {
//     if (!chatStatus) return null;
//     let statusClass = "", statusText = "";
//     switch (chatStatus) {
//       case "pending": statusClass = "status-pending"; statusText = "⏳ Waiting for counselor to accept..."; break;
//       case "ended": statusClass = "status-ended"; statusText = "🔒 Chat session ended"; break;
//       default: return null;
//     }
//     return <div className={`chat-status-banner ${statusClass}`}>{statusText}</div>;
//   };

//   const counselorName = currentCounselor?.name || "Counselor";
//   const counselorPresence = getPresence(currentCounselor);
//   const counselorOnline = counselorPresence.isOnline;
//   const counselorPresenceText = formatPresenceText(counselorPresence, {
//     onlineText: t('online') || "Online",
//     offlineText: t('offline') || "Offline",
//   });

//   const getMessageDayKey = (message) => {
//     const timestamp = message?.fullTime || message?.createdAt || message?.timestamp;
//     const date = new Date(timestamp);
//     return Number.isNaN(date.getTime()) ? null : date.toDateString();
//   };

//   const formatMessageDay = (message) => {
//     const timestamp = message?.fullTime || message?.createdAt || message?.timestamp;
//     const date = new Date(timestamp);
//     if (Number.isNaN(date.getTime())) return null;

//     const today = new Date();
//     const yesterday = new Date(today);
//     yesterday.setDate(today.getDate() - 1);
//     if (date.toDateString() === today.toDateString()) return "Today";
//     if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
//     return date.toLocaleDateString([], {
//       weekday: "long",
//       day: "numeric",
//       month: "long",
//       year: "numeric",
//     });
//   };

//   return (
//     <div className="chatContainerFull">
//       <div className="chatBoxMain">
//         <header className="chatBoxHeader">
//           <div className="chatBoxHeaderLeft">
//             <button onClick={handleBackClick} className={isMobile ? "chatMobileHeaderBack" : "chatDesktopHeaderBack"} aria-label="Go back" title="Go back">
//               <FaArrowLeft />
//             </button>
//             <div className="chatUserDetails">
//               <div className="chatProfilePic" aria-label="Counselor profile picture">
//                 {renderProfileAvatar(currentCounselor, "md")}
//                 <span className={`chatActiveDot ${counselorOnline ? "chatActiveOnline" : "chatActiveOffline"}`} />
//               </div>
//               <div className="chatProfileInfo">
//                 <h2 className="chatProfileName">{counselorName}</h2>
//                 <p className="chatProfileStatus">
//                   {remoteIsTyping ? <span className="chatTypingText" role="status">{t('typing')}</span> : <span className="chatStatusText">{counselorPresenceText}</span>}
//                 </p>
//               </div>
//             </div>
//           </div>
//           <div className="chatBoxHeaderRight">
//             <button className={`chatActionBtn chatVideoBtn ${isInitiatingCall ? "disabled" : ""}`} onClick={handleVideoCall} disabled={isInitiatingCall} aria-label="Video call">
//               <span className="chatBtnIcon" aria-hidden="true">{isInitiatingCall ? <FaSpinner className="spinning" /> : <FaVideo />}</span>
//               <span className="chatBtnTooltip">{t('video_call_tooltip')}</span>
//             </button>
//             <button className={`chatActionBtn chatAudioBtn ${isInitiatingCall ? "disabled" : ""}`} onClick={handleVoiceCall} disabled={isInitiatingCall} aria-label="Voice call">
//               <span className="chatBtnIcon" aria-hidden="true">{isInitiatingCall ? <FaSpinner className="spinning" /> : <FaPhoneAlt />}</span>
//               <span className="chatBtnTooltip">{t('voice_call_tooltip')}</span>
//             </button>
//             <div className="chatMoreOptions" ref={optionsRef}>
//               <button className="chatActionBtn" onClick={() => setShowOptions(!showOptions)} aria-label="More options" aria-expanded={showOptions}>
//                 <span className="chatBtnIcon" aria-hidden="true">⋮</span>
//               </button>
//               {showOptions && (
//                 <div className="chatDropdownMenu" role="menu">
//                   {optionsMenuItems.map((item) => (
//                     <button key={item.id} className="chatDropdownItem" onClick={() => { setShowOptions(false); handleMenuItemClick(item); }} role="menuitem">
//                       <span className="chatDropdownIcon" aria-hidden="true">{item.icon}</span>
//                       <span className="chatDropdownText">{item.label}</span>
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         </header>

//         {renderChatStatusBanner()}

//         {callError && (
//           <div className="call-error-banner">
//             <span className="error-icon">⚠️</span>
//             <span className="error-text">{callError}</span>
//             <button className="error-close" onClick={() => setCallError(null)}>✕</button>
//           </div>
//         )}

//         <main className="chatMessagesArea" ref={messagesContainerRef} onScroll={handleScroll}>
//           {isLoadingMessages && messages.length === 0 ? (
//             <div className="chatLoadingMessages">
              
//               <p>{t('loading_messages')}</p>
//             </div>
//           ) : (
//             <>
//               {messages.map((message, index) => (
//                 <React.Fragment key={message.id || index}>
//                   {getMessageDayKey(message) !== getMessageDayKey(messages[index - 1]) && formatMessageDay(message) && (
//                     <div className="chatDateSeparator">{formatMessageDay(message)}</div>
//                   )}
//                 <article className={`chatMsgBubble ${message.sender === "user" ? "chatMsgRight" : "chatMsgLeft"} ${message.status === "error" ? "message-error" : ""}`}>
//                   <div className="chatMsgContent">
//                     {message.contentType === "IMAGE" && message.attachmentUrl ? (
//                       <>
//                         <img src={message.attachmentUrl} alt={message.attachmentName || "Shared image"} className="chatMsgImage" />
//                         <a href={message.attachmentUrl} target="_blank" rel="noreferrer" className="chatMsgAttachmentLink">{message.attachmentName || "Open image"}</a>
//                         {message.text && <TranslatedMessage text={message.text} translate={translate} lang={lang} />}
//                       </>
//                     ) : message.contentType === "FILE" && message.attachmentUrl ? (
//                       <>
//                         <a href={message.attachmentUrl} target="_blank" rel="noreferrer" className="chatMsgAttachmentLink">{message.attachmentName || message.text || "Open attachment"}</a>
//                         {message.text && <TranslatedMessage text={message.text} translate={translate} lang={lang} />}
//                       </>
//                     ) : (
//                       <TranslatedMessage text={message.text} translate={translate} lang={lang}  />
//                     )}
//                     <div className="chatMsgFooter">
//                       <time className="chatMsgTimestamp">{message.time}</time>
//                       {renderMessageStatus(message)}
//                       {(message.contentType === "IMAGE" || message.contentType === "FILE") && (
//                         <button
//                           type="button"
//                           className="chatMsgDeleteBtn"
//                           onClick={() => handleDeleteMessage(message)}
//                           disabled={String(deletingMessageId) === String(message.id || message._id || message.messageId)}
//                           aria-label="Delete attachment"
//                           title="Delete attachment"
//                         >
//                           {String(deletingMessageId) === String(message.id || message._id || message.messageId) ? "Deleting..." : "Delete"}
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 </article>
//                 </React.Fragment>
//               ))}
//               <ChatCallHistory
//                 userId={resolveCurrentUserId()}
//                 peerId={resolveCounselorId()}
//               />
//               <div ref={messagesEndRef} />
//             </>
//           )}
//         </main>

//         {showEmojiPicker && (
//           <div className="chatEmojiBox" ref={emojiPickerRef} role="dialog" aria-label="Emoji picker">
//             <div className="emojiBoxHeader">
//               <span className="emojiBoxTitle">Emoji</span>
//               <button className="emojiBoxClose" onClick={() => setShowEmojiPicker(false)} aria-label="Close emoji picker">×</button>
//             </div>
//             <div className="emojiBoxGrid">
//               {emojis.map((emoji, index) => (
//                 <button key={index} className="emojiBoxItem" onClick={() => addEmoji(emoji)} aria-label={`Emoji ${emoji}`}>{emoji}</button>
//               ))}
//             </div>
//           </div>
//         )}

//       <footer className="chatInputArea">
//   <div className="chatInputGroup">
//     {/* Hidden file inputs */}
//     <input 
//       ref={fileInputRef} 
//       type="file" 
//       className="chatHiddenFileInput" 
//       onChange={handleFileSelected} 
//       style={{ display: "none" }} 
//     />
//     <input
//       ref={cameraInputRef}
//       type="file"
//       accept="image/*"
//       capture="user"
//       className="chatHiddenFileInput"
//       onChange={handleFileSelected}
//       style={{ display: "none" }}
//     />
    
//     {/* Attachment Button */}
//     <button 
//       className="chatAttachBtn" 
//       onClick={handleFileAttach} 
//       disabled={isSending} 
//       aria-label="Attach file"
//     >
//       <span className="attachIcon" aria-hidden="true">📎</span>
//     </button>
    
//     {/* Camera Button */}
//     <button 
//       className="chatCameraBtn" 
//       onClick={handleCameraClick} 
//       disabled={isSending} 
//       aria-label="Take photo"
//     >
//       <FaCamera className="camera-icon" />
//     </button>
    
//     {/* ✅ Only ONE input wrapper */}
//     <div className="chatInputWrapper">
//       <input 
//         ref={messageInputRef} 
//         id="messageInput" 
//         type="text" 
//         value={newMessage} 
//         onChange={handleInputChange} 
//         onKeyDown={handleKeyDown} 
//         placeholder={`Message ${counselorName}...`} 
//         className="chatTextInput" 
//         autoComplete="off" 
//         enterKeyHint="send" 
//         aria-label="Message input" 
//       />
//       <button 
//         className="chatEmojiBtn" 
//         onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
//         aria-label="Open emoji picker"
//       >
//         <span className="emojiIcon" aria-hidden="true">😊</span>
//       </button>
//     </div>
    
//     {/* Send Button */}
//     <button 
//       onMouseDown={(e) => e.preventDefault()} 
//       onClick={handleSendButtonClick} 
//       disabled={!newMessage.trim() || isSending} 
//       className="chatSendBtn" 
//       aria-label="Send message"
//     >
//       <span className="sendIcon" aria-hidden="true">
//         {isSending ? "⏳" : "➤"}
//       </span>
//     </button>
//   </div>
// </footer>
//       </div>

// {renderCameraPreview()}

//       {/* Photo Preview Modal */}
//        <PhotoPreviewModal
//       isOpen={!!photoPreview}
//       photoSrc={photoPreview}
//       onSend={handleSendPhoto}
//       onCancel={() => setPhotoPreview(null)}
//       loading={photoSending}
//     />

//       {/* Call Modals */}
//       <VideoCallModal
//         isOpen={isVideoModalOpen}
//         onClose={handleCloseModal}
//         callData={selectedCall}
//         callMode={selectedCall?.callType || selectedCall?.type || "video"}
//         currentUser={currentUser}
//         onEndCall={handleEndCall}
//       />

//       {/* Rate-your-counselor popup, shown after a session ends */}
//       <RatingModal
//         visible={showRatingModal}
//         counselorName={ratingTarget?.counselorName || currentCounselor?.name}
//         counselorPhoto={ratingTarget?.counselorPhoto || getProfilePhotoUrl(currentCounselor)}
//         submitting={ratingSubmitting}
//         onSubmit={handleSubmitRating}
//         onDismiss={handleDismissRating}
//       />

//       {/* Professional Incoming Call Modal */}
//       <IncomingCallModal
//         isOpen={showIncomingModal}
//         onClose={() => setShowIncomingModal(false)}
//         callType={incomingCallData.callType}
//         callerName={incomingCallData.name}
//         callerImage={incomingCallData.image}
//         callData={incomingCallData}
//         onAccept={handleAcceptCall}
//         onReject={handleRejectCall}
//         fallbackName="Counselor"
//       />

//       {blockedPopup.show && (
//         <div
//           onClick={() => setBlockedPopup({ show: false, reason: "" })}
//           style={{
//             position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
//             display: "flex", alignItems: "center", justifyContent: "center",
//             zIndex: 9999, padding: 16,
//           }}
//         >
//           <div
//             onClick={(e) => e.stopPropagation()}
//             style={{
//               background: "#fff", borderRadius: 12, maxWidth: 380, width: "100%",
//               padding: "24px 22px", boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
//               textAlign: "center",
//             }}
//           >
//             <div style={{ fontSize: 42, marginBottom: 8 }}>🚫</div>
//             <h3 style={{ margin: "0 0 8px", color: "#c0392b", fontSize: 18 }}>
//               Chat Unavailable
//             </h3>
//             <p style={{ margin: "0 0 16px", color: "#444", fontSize: 14, lineHeight: 1.5 }}>
//               This counselor has been blocked by admin. You cannot send messages right now.
//             </p>
//             {blockedPopup.reason && (
//               <p style={{ margin: "0 0 16px", color: "#888", fontSize: 12, fontStyle: "italic" }}>
//                 {blockedPopup.reason}
//               </p>
//             )}
//             <button
//               onClick={() => setBlockedPopup({ show: false, reason: "" })}
//               style={{
//                 background: "#c0392b", color: "#fff", border: "none",
//                 padding: "10px 24px", borderRadius: 8, cursor: "pointer",
//                 fontSize: 14, fontWeight: 600,
//               }}
//             >
//               OK
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ChatBox;


// ChatBox.jsx - Fully Responsive Chat Interface with Merged Call History



// import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
// import axios from "axios";
// import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
// import { FaArrowLeft, FaPhoneAlt, FaSpinner, FaVideo, FaCamera } from "react-icons/fa";
// import "./ChatBox.css";
// import VideoCallModal from "../CallModal/VideoCallModal";
// import PhotoPreviewModal from "../../../common/PhotoPreviewModal/PhotoPreviewModal";
// import { API_BASE_URL } from "../../../../axiosConfig";
// import socketService from "../../../../services/socketService";
// import useRingtone from "../../../../hooks/useRingtone";
// import IncomingCallModal from "../../../common/IncomingCallModal/IncomingCallModal";
// import { useUserTranslation, useUserApiTranslation } from "../../../../i18n/LanguageContext";
// import RatingModal from "../../../../components/RatingModal";
// import ratingService from "../../../../services/ratingService";
// import {
//   formatPresenceText,
//   getPresence,
//   getPresenceUserId,
//   resolveOfflineLastSeen,
// } from "../../../../utils/presence";
// import TranslatedMessage from "../../../common/TranslatedMessage";

// const ChatBox = () => {
//   const { t, lang } = useUserTranslation();
//   const { translate } = useUserApiTranslation();
//   const { id: counselorId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
//   const { chatId, counselor: initialCounselor, user: initialUser } = location.state || {};

//   const [currentChat, setCurrentChat] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [callHistory, setCallHistory] = useState([]);
//   const [currentCounselor, setCurrentCounselor] = useState(() => {
//     if (initialCounselor) return initialCounselor;
//     return {
//       id: counselorId || null,
//       name: "Dr. Suresh Reddy",
//       specialization: "Clinical Psychologist",
//       online: false,
//       avatar: null,
//       avatarType: "text",
//       profilePhoto: null,
//       phoneNumber: "+91 98765 43215",
//     };
//   });

//   const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
//   const [selectedCall, setSelectedCall] = useState(null);
//   const [isInitiatingCall, setIsInitiatingCall] = useState(false);
//   const [callError, setCallError] = useState(null);
//   const [showIncomingModal, setShowIncomingModal] = useState(false);
//   const [incomingCallData, setIncomingCallData] = useState({
//     name: "",
//     image: null,
//     callId: "",
//     roomId: "",
//     callType: "video",
//   });
//   const { startRinging, stopRinging } = useRingtone();

//   const [newMessage, setNewMessage] = useState("");
//   const [showOptions, setShowOptions] = useState(false);
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const [isTyping, setIsTyping] = useState(false);
//   const [remoteIsTyping, setRemoteIsTyping] = useState(false);
//   const [isSending, setIsSending] = useState(false);
//   const [deletingMessageId, setDeletingMessageId] = useState(null);
//   const [isLoadingMessages, setIsLoadingMessages] = useState(false);
//   const [chatStatus, setChatStatus] = useState(null);
//   const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
//   const [blockedPopup, setBlockedPopup] = useState({ show: false, reason: "" });
//   const [originalMessages, setOriginalMessages] = useState([]);
//   const [isTranslating, setIsTranslating] = useState(false);

//   const [showCameraPreview, setShowCameraPreview] = useState(false);
//   const [cameraStream, setCameraStream] = useState(null);
//   const videoRef = useRef(null);

//   // ─── Counselor rating ──────────────────────────────────────────────────────
//   const [showRatingModal, setShowRatingModal] = useState(false);
//   const [ratingSubmitting, setRatingSubmitting] = useState(false);
//   const [ratingTarget, setRatingTarget] = useState(null);
//   const [photoPreview, setPhotoPreview] = useState(null);
//   const [photoSending, setPhotoSending] = useState(false);
//   const ratingPromptedRef = useRef(false);
//   const sessionChatIdRef = useRef(chatId || null);

//   const messagesEndRef = useRef(null);
//   const messagesContainerRef = useRef(null);
//   const optionsRef = useRef(null);
//   const emojiPickerRef = useRef(null);
//   const timeoutRef = useRef(null);
//   const fileInputRef = useRef(null);
//   const cameraInputRef = useRef(null);
//   const messageInputRef = useRef(null);
//   const chatSocketRef = useRef(null);
//   const typingTimeoutRef = useRef(null);
//   const prevScrollHeightRef = useRef(0);
//   const isUserScrollingRef = useRef(false);
//   const isInitialLoadRef = useRef(true);

//   useEffect(() => {
//     const checkMobile = () => setIsMobile(window.innerWidth <= 768);
//     window.addEventListener("resize", checkMobile);
//     return () => window.removeEventListener("resize", checkMobile);
//   }, []);

//   const getCurrentUser = () => {
//     const storedUserData = localStorage.getItem("userData") || localStorage.getItem("user");
//     if (!storedUserData) return null;
//     try {
//       return JSON.parse(storedUserData);
//     } catch (e) {
//       return null;
//     }
//   };

//   const currentUser = getCurrentUser();
//   const resolveCurrentUserId = () => currentUser?.id || currentUser?._id || localStorage.getItem("userId") || null;
//   const resolveCounselorId = () => currentCounselor?.id?.toString() || currentCounselor?._id?.toString() || counselorId || currentChat?.counselorId?.toString() || null;

//   const getProfilePhotoUrl = (counselor) => {
//     if (!counselor) return null;
//     if (counselor?.profilePhoto?.url) return counselor.profilePhoto.url;
//     if (counselor?.avatar && counselor?.avatarType === "image") return counselor.avatar;
//     return null;
//   };

//   const getInitials = (name) => {
//     if (!name) return "?";
//     return name.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2);
//   };

//   const scrollToBottom = useCallback((behavior = "smooth", force = false) => {
//     if (messagesContainerRef.current && (shouldScrollToBottom || force)) {
//       const container = messagesContainerRef.current;
//       requestAnimationFrame(() => {
//         container.scrollTo({
//           top: container.scrollHeight,
//           behavior: behavior,
//         });
//       });
//     }
//   }, [shouldScrollToBottom]);

//   const focusMessageInput = useCallback(() => {
//     const input = messageInputRef.current;
//     if (!input) return;
//     requestAnimationFrame(() => input.focus({ preventScroll: true }));
//     setTimeout(() => input.focus({ preventScroll: true }), 50);
//   }, []);

//   // ─── Merge Messages and Call History ──────────────────────────────────
//   const getMergedTimeline = useCallback(() => {
//     const allItems = [...messages, ...callHistory];
    
//     // Sort by time (oldest first for display)
//     return allItems.sort((a, b) => {
//       const timeA = a.fullTime || a.createdAt || a.timestamp || a.time;
//       const timeB = b.fullTime || b.createdAt || b.timestamp || b.time;
//       return new Date(timeA) - new Date(timeB);
//     });
//   }, [messages, callHistory]);

//   const getMessageDayKey = (item) => {
//     const timestamp = item?.fullTime || item?.createdAt || item?.timestamp;
//     const date = new Date(timestamp);
//     return Number.isNaN(date.getTime()) ? null : date.toDateString();
//   };

//   const formatMessageDay = (item) => {
//     const timestamp = item?.fullTime || item?.createdAt || item?.timestamp;
//     const date = new Date(timestamp);
//     if (Number.isNaN(date.getTime())) return null;
//     const today = new Date();
//     const yesterday = new Date(today);
//     yesterday.setDate(today.getDate() - 1);
//     if (date.toDateString() === today.toDateString()) return "Today";
//     if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
//     return date.toLocaleDateString([], {
//       weekday: "long",
//       day: "numeric",
//       month: "long",
//       year: "numeric",
//     });
//   };

//   // ─── Rating flow ──────────────────────────────────────────────────────────
//   const triggerRatingPrompt = useCallback(async () => {
//     if (ratingPromptedRef.current) return;
//     const counselorIdResolved = resolveCounselorId();
//     if (!counselorIdResolved) return;
//     ratingPromptedRef.current = true;
//     const target = {
//       counselorId: counselorIdResolved,
//       counselorName: currentCounselor?.name || "Counselor",
//       counselorPhoto: getProfilePhotoUrl(currentCounselor),
//       chatId: getChatIdForAPI(),
//     };
//     setRatingTarget(target);
//     setShowRatingModal(true);
//     await ratingService.savePendingRating(target);
//   }, [currentCounselor]);

//   const handleBackClick = async () => {
//     const counselorIdResolved = resolveCounselorId();
//     const apiChatId = getChatIdForAPI();

//     const alreadyRatedCounselor = await ratingService.isAlreadyRated(counselorIdResolved);
//     if (alreadyRatedCounselor || ratingPromptedRef.current) {
//       navigate(-1);
//       return;
//     }

//     const allPending = await ratingService.getAllPendingRatings();
//     const hasPendingRating = allPending.some(r => r.chatId === apiChatId);

//     if (hasPendingRating && !ratingPromptedRef.current) {
//       ratingPromptedRef.current = true;
//       const target = {
//         counselorId: counselorIdResolved,
//         counselorName: currentCounselor?.name || "Counselor",
//         counselorPhoto: getProfilePhotoUrl(currentCounselor),
//         chatId: apiChatId,
//       };
//       setRatingTarget(target);
//       setShowRatingModal(true);
//       return;
//     }

//     navigate(-1);
//   };

//   useEffect(() => {
//     let cancelled = false;
//     (async () => {
//       const due = await ratingService.getDuePendingRating();
//       if (!cancelled && due && !ratingPromptedRef.current) {
//         ratingPromptedRef.current = true;
//         setRatingTarget(due);
//         setShowRatingModal(true);
//       }
//     })();
//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   useEffect(() => {
//     const counselorIdResolved = resolveCounselorId();
//     const apiChatId = getChatIdForAPI();
//     if (counselorIdResolved && apiChatId) {
//       ratingService.savePendingRating({
//         counselorId: counselorIdResolved,
//         counselorName: currentCounselor?.name || "Counselor",
//         counselorPhoto: getProfilePhotoUrl(currentCounselor),
//         chatId: apiChatId,
//       });
//     }
//   }, []);

//   const handleSubmitRating = async ({ stars, comment }) => {
//     if (!ratingTarget) return;
//     setRatingSubmitting(true);
//     try {
//       await ratingService.submitRating({
//         counselorId: ratingTarget.counselorId,
//         stars,
//         comment,
//         chatId: ratingTarget.chatId,
//       });
//       setShowRatingModal(false);
//       alert("Thank you! Your rating helps others find the right counselor.");
//     } catch (e) {
//       console.log("submitRating failed:", e?.message);
//       alert("Couldn't submit. Please try again in a moment.");
//     } finally {
//       setRatingSubmitting(false);
//     }
//   };

//   const handleDismissRating = () => {
//     setShowRatingModal(false);
//     ratingPromptedRef.current = false;
//     navigate(-1);
//   };

//   const getChatIdForAPI = () => {
//     if (chatId) return chatId;
//     if (currentChat?.chatId) return currentChat.chatId;
//     if (!sessionChatIdRef.current) {
//       const stableUserId = getCurrentUser()?.id || "user";
//       const stableCounselorId = counselorId || "counselor";
//       sessionChatIdRef.current = `chat_${stableUserId}_${stableCounselorId}`.replace(/\s+/g, "_");
//     }
//     return sessionChatIdRef.current;
//   };

//   // ─── Fetch Call History (using ChatCallHistory component logic) ──────
//   const fetchCallHistory = useCallback(async () => {
//     try {
//       const userId = resolveCurrentUserId();
//       const peerId = resolveCounselorId();

//       if (!userId || !peerId) {
//         setCallHistory([]);
//         return;
//       }

//       const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
//       const response = await axios.get(
//         `${API_BASE_URL}/api/video/calls/history/${userId}`,
//         {
//           params: { page: 1, limit: 100 },
//           headers: token ? { Authorization: `Bearer ${token}` } : {},
//         }
//       );

//       // Use the same logic as ChatCallHistory component
//       const matchingCalls = (response.data?.history || [])
//         .filter((call) => String(call.withId) === String(peerId))
//         .slice(0, 10);

//       if (matchingCalls.length > 0) {
//         const formattedCalls = matchingCalls.map((call) => {
//           const timestamp = new Date(call.timestamp);
//           const isVideo = String(call.type).toLowerCase() === "video";
//           const isOutgoing = call.role === "initiator";
          
//           return {
//             id: call.id || `${call.timestamp}-${call.type}`,
//             callId: call.id || call.callId,
//             type: isVideo ? "video" : "voice",
//             direction: isOutgoing ? "outgoing" : "incoming",
//             status: call.status || "completed",
//             time: !isNaN(timestamp.getTime()) 
//               ? timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
//               : "",
//             fullTime: call.timestamp || new Date().toISOString(),
//             timestamp: call.timestamp || new Date().toISOString(),
//             duration: call.duration || 0,
//             isCall: true,
//             role: call.role,
//             withId: call.withId,
//             _original: call,
//           };
//         });
//         setCallHistory(formattedCalls);
//       } else {
//         setCallHistory([]);
//       }
//     } catch (error) {
//       console.warn("Unable to load chat call history:", error.message);
//       setCallHistory([]);
//     }
//   }, []);

//   const handleAcceptCall = async (callId) => {
//     try {
//       const resolvedCallId =
//         callId ||
//         incomingCallData?.callId ||
//         incomingCallData?.id ||
//         incomingCallData?._id;

//       if (!resolvedCallId) {
//         throw new Error("Missing callId for incoming call");
//       }

//       const token =
//         localStorage.getItem("token") || localStorage.getItem("accessToken");
//       const userId = resolveCurrentUserId();

//       if (!userId) {
//         throw new Error("User ID missing. Please login again.");
//       }

//       const response = await axios.put(
//         `${API_BASE_URL}/api/video/calls/${resolvedCallId}/accept`,
//         {
//           acceptorId: userId,
//           acceptorType: "user",
//         },
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         },
//       );

//       if (!response.data?.success) {
//         throw new Error(response.data?.error || "Failed to accept call");
//       }

//       let detailedCall = null;
//       try {
//         const detailsResponse = await axios.get(
//           `${API_BASE_URL}/api/video/calls/${resolvedCallId}/details`,
//           {
//             params: {
//               userId,
//               userType: "user",
//             },
//             headers: { Authorization: `Bearer ${token}` },
//           },
//         );

//         detailedCall = detailsResponse.data?.call || null;
//       } catch (detailsError) {
//         console.warn("Could not fetch accepted call details:", detailsError);
//       }
//       const incomingType = String(incomingCallData.callType || "video").toLowerCase();
//       const modalType = incomingType === "audio" ? "voice" : incomingType;
//       const remoteParticipant = detailedCall ? String(detailedCall.initiator?.id) === String(userId) ? detailedCall.receiver : detailedCall.initiator : incomingCallData.from || null;
//       const acceptedCallData = {
//         id: detailedCall?.id || resolvedCallId,
//         callId: resolvedCallId,
//         roomId:
//           response.data.roomId ||
//           detailedCall?.roomId ||
//           incomingCallData.roomId,
//         name:
//           remoteParticipant?.displayName ||
//           remoteParticipant?.fullName ||
//           incomingCallData.name ||
//           "Counselor",
//         type: modalType,
//         callType: modalType,
//         profilePic: remoteParticipant?.profilePhoto || incomingCallData.image || null,
//         phoneNumber: remoteParticipant?.phoneNumber || remoteParticipant?.phone || "",
//         status: response.data.status || detailedCall?.status || "active",
//         apiCallData: detailedCall,
//         initiator: detailedCall?.initiator,
//         receiver: detailedCall?.receiver,
//         currentUserId: userId,
//         currentUserType: "user",
//         isIncoming: true,
//       };
//       setSelectedCall(acceptedCallData);
//       setIsVideoModalOpen(true);
//       setShowIncomingModal(false);
      
//       // Refresh call history after accepting
//       await fetchCallHistory();
      
//       return response.data;
//     } catch (error) {
//       console.error("Error accepting call:", error);
//       throw error;
//     }
//   };

//   const handleRejectCall = async (callId) => {
//     const resolvedCallId =
//       callId ||
//       incomingCallData?.callId ||
//       incomingCallData?.id ||
//       incomingCallData?._id;

//     try {
//       if (!resolvedCallId) {
//         return false;
//       }

//       const token =
//         localStorage.getItem("token") || localStorage.getItem("accessToken");
//       const userId = resolveCurrentUserId();

//       if (!userId) {
//         throw new Error("User ID missing. Please login again.");
//       }

//       await axios.put(
//         `${API_BASE_URL}/api/video/calls/${resolvedCallId}/reject`,
//         {
//           userId,
//           reason: "declined",
//         },
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         },
//       );
      
//       // Refresh call history after rejecting
//       await fetchCallHistory();
      
//       return true;
//     } catch (error) {
//       if (error?.response?.status === 404) {
//         try {
//           const token =
//             localStorage.getItem("token") ||
//             localStorage.getItem("accessToken");
//           await axios.post(
//             `${API_BASE_URL}/api/call/${resolvedCallId}/reject`,
//             { reason: "declined" },
//             {
//               headers: { Authorization: `Bearer ${token}` },
//             },
//           );
//           await fetchCallHistory();
//           return true;
//         } catch (fallbackError) {
//           console.error("Reject fallback failed:", fallbackError);
//         }
//       }
//       console.error("Error rejecting call:", error);
//       return false;
//     }
//   };

//   // ─── Translation Functions ──────────────────────────────────────────────
//   const translateMessage = useCallback(async (text, targetLang) => {
//     return text;
//   }, []);

//   // Translate messages when language changes
//   useEffect(() => {
//     if (!lang || lang === 'en') {
//       setIsTranslating(false);
//       setMessages(originalMessages);
//       return;
//     }

//     if (!originalMessages || originalMessages.length === 0) {
//       setIsTranslating(false);
//       return;
//     }

//     const translateMessages = async () => {
//       setIsTranslating(true);
//       try {
//         const translatedMsgs = await Promise.all(
//           originalMessages.map(async (msg) => {
//             if (!msg.text || msg.sender === 'user' || msg.isCall) {
//               return msg;
//             }

//             try {
//               const translatedText = await translateMessage(msg.text, lang);
//               if (translatedText && translatedText !== msg.text) {
//                 return { ...msg, text: translatedText };
//               }
//               return msg;
//             } catch (error) {
//               console.error('Error translating individual message:', error);
//               return msg;
//             }
//           })
//         );

//         setMessages(translatedMsgs);
//       } catch (error) {
//         console.error('❌ Error translating messages:', error);
//         setMessages(originalMessages);
//       } finally {
//         setIsTranslating(false);
//       }
//     };

//     translateMessages();
//   }, [lang, originalMessages]);

//   const handleEndCall = async (callId) => {
//     try {
//       const resolvedCallId =
//         callId ||
//         selectedCall?.callId ||
//         incomingCallData?.callId ||
//         selectedCall?.id ||
//         incomingCallData?.id ||
//         incomingCallData?._id;

//       if (!resolvedCallId) {
//         return false;
//       }

//       const token =
//         localStorage.getItem("token") || localStorage.getItem("accessToken");
//       const userId = resolveCurrentUserId();

//       if (!userId) {
//         throw new Error("User ID missing. Please login again.");
//       }

//       await axios.put(
//         `${API_BASE_URL}/api/video/calls/${resolvedCallId}/end`,
//         {
//           userId: userId,
//           endedBy: "user",
//         },
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         },
//       );
      
//       // Refresh call history after ending
//       await fetchCallHistory();
      
//       return true;
//     } catch (error) {
//       console.error("Error ending call:", error);
//       return false;
//     }
//   };

//   // Handle scroll events to detect if user is manually scrolling
//   const handleScroll = useCallback(() => {
//     if (!messagesContainerRef.current) return;
    
//     const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
//     const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
//     if (isNearBottom) {
//       setShouldScrollToBottom(true);
//       isUserScrollingRef.current = false;
//     } else {
//       setShouldScrollToBottom(false);
//       isUserScrollingRef.current = true;
//     }
//   }, []);

//   // Scroll to bottom when new messages arrive
//   useEffect(() => {
//     const mergedItems = getMergedTimeline();
//     if (mergedItems.length === 0) return;
    
//     if (isInitialLoadRef.current) {
//       scrollToBottom("auto", true);
      
//       const timer = setTimeout(() => {
//         scrollToBottom("auto", true);
//         isInitialLoadRef.current = false;
//       }, 50);
//       return () => clearTimeout(timer);
//     } else if (shouldScrollToBottom) {
//       scrollToBottom("smooth");
//     } else {
//       if (messagesContainerRef.current) {
//         prevScrollHeightRef.current = messagesContainerRef.current.scrollHeight;
//       }
//     }
//   }, [messages, callHistory, scrollToBottom, shouldScrollToBottom, getMergedTimeline]);

//   // Maintain scroll position when new content is added above
//   useEffect(() => {
//     if (!shouldScrollToBottom && messagesContainerRef.current && prevScrollHeightRef.current > 0) {
//       const newScrollHeight = messagesContainerRef.current.scrollHeight;
//       const scrollDifference = newScrollHeight - prevScrollHeightRef.current;
//       if (scrollDifference > 0) {
//         messagesContainerRef.current.scrollTop += scrollDifference;
//       }
//       prevScrollHeightRef.current = newScrollHeight;
//     }
//   }, [messages, callHistory, shouldScrollToBottom]);

//   // ─── Incoming Calls Polling ────────────────────────────────────────────
//   useEffect(() => {
//     const fetchIncomingCalls = async () => {
//       try {
//         const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
//         const userId = resolveCurrentUserId();

//         if (!userId || !token || isVideoModalOpen) {
//           return;
//         }

//         const response = await axios.get(
//           `${API_BASE_URL}/api/video/calls/pending/${userId}`,
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           },
//         );

//         const callsList =
//           response.data.pendingRequests ||
//           response.data.waitingCalls ||
//           response.data.calls ||
//           [];

//         const currentIncomingId =
//           incomingCallData?.callId ||
//           incomingCallData?.id ||
//           incomingCallData?._id;
//         const stillWaiting = currentIncomingId
//           ? callsList.some(
//               (c) => (c.callId || c.id || c._id) === currentIncomingId,
//             )
//           : false;

//         if (showIncomingModal && currentIncomingId && !stillWaiting) {
//           setShowIncomingModal(false);
//           setIncomingCallData({
//             name: "",
//             image: null,
//             callId: "",
//             roomId: "",
//             callType: "video",
//           });
//           return;
//         }

//         if (response.data.success && callsList.length > 0) {
//           const waitingCall =
//             callsList.find((call) => {
//               const normalizedStatus = String(call.status || "").toLowerCase();
//               return (
//                 !normalizedStatus ||
//                 normalizedStatus === "waiting" ||
//                 normalizedStatus === "ringing" ||
//                 normalizedStatus === "pending" ||
//                 normalizedStatus === "requested"
//               );
//             }) || callsList[0];

//           if (!waitingCall || showIncomingModal) {
//             return;
//           }

//           const fromData = waitingCall.from || {};

//           const callerFullName =
//             fromData.fullName || fromData.displayName || "Counselor";

//           const resolvedIncomingCallId =
//             waitingCall.callId || waitingCall.id || waitingCall._id;

//           setIncomingCallData({
//             callId: resolvedIncomingCallId,
//             id: waitingCall.id || resolvedIncomingCallId,
//             _id: waitingCall._id || resolvedIncomingCallId,
//             roomId: waitingCall.roomId,
//             name: callerFullName,
//             image: fromData.profilePhoto || null,
//             callType: waitingCall.callType || "video",
//             from: fromData,
//             requestMessage: waitingCall.requestMessage,
//             requestedAt: waitingCall.requestedAt,
//             expiresAt: waitingCall.expiresAt,
//             remainingSeconds: waitingCall.remainingSeconds,
//           });
//           setShowIncomingModal(true);
//         } else if (showIncomingModal) {
//           setShowIncomingModal(false);
//           setIncomingCallData({
//             name: "",
//             image: null,
//             callId: "",
//             roomId: "",
//             callType: "video",
//           });
//         }
//       } catch (error) {
//         console.error("Error polling for calls:", error);
//       }
//     };
//     const interval = setInterval(fetchIncomingCalls, 5000);
//     return () => clearInterval(interval);
//   }, [
//     showIncomingModal,
//     currentUser,
//     isVideoModalOpen,
//     incomingCallData?.callId,
//   ]);

//   useEffect(() => {
//     if (showIncomingModal && !isVideoModalOpen) {
//       void startRinging();
//       return;
//     }

//     stopRinging();
//   }, [showIncomingModal, isVideoModalOpen, startRinging, stopRinging]);

//   useEffect(() => {
//     return () => {
//       stopRinging();
//     };
//   }, [stopRinging]);

//   // ─── GET messages from API ──────────────────────────────────────────────
//   const fetchMessagesFromAPI = async () => {
//     try {
//       const apiChatId = getChatIdForAPI();
//       const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
//       setIsLoadingMessages(true);
      
//       const response = await axios.get(`${API_BASE_URL}/api/chat/chat/${apiChatId}/messages`, {
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//       });
      
//       if (response.data && response.data.messages) {
//         if (response.data.chatStatus) setChatStatus(response.data.chatStatus);
//         const transformedMessages = response.data.messages.map((msg, index) => ({
//           id: msg.id || index,
//           messageId: msg.messageId,
//           text: msg.content,
//           sender: msg.senderRole === "user" ? "user" : "counselor",
//           senderRole: msg.senderRole,
//           time: new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
//           fullTime: msg.createdAt,
//           contentType: msg.contentType,
//           attachmentUrl: msg.attachmentUrl || null,
//           attachmentName: msg.attachmentName || null,
//           attachmentMimeType: msg.attachmentMimeType || null,
//           attachmentSize: msg.attachmentSize || null,
//           isRead: msg.isRead,
//           status: "sent",
//           isCall: false,
//         }));
//         setOriginalMessages(transformedMessages);
//         setMessages(transformedMessages);
//         if (currentChat) {
//           setCurrentChat((prev) => ({ ...prev, messages: transformedMessages, chatStatus: response.data.chatStatus }));
//         }
//       }
      
//       // Fetch call history after messages
//       await fetchCallHistory();
      
//     } catch (error) {
//       console.error("Error fetching messages from API:", error);
//       loadMessagesFromLocalStorage();
//       // Try to fetch call history separately
//       await fetchCallHistory();
//     } finally {
//       setIsLoadingMessages(false);
//     }
//   };

//   const loadMessagesFromLocalStorage = () => {
//     try {
//       const savedChats = JSON.parse(localStorage.getItem("activeChats") || "[]");
//       const chat = savedChats.find((c) => c.id === currentChat?.id || c.chatId === getChatIdForAPI());
//       if (chat && chat.messages) setMessages(chat.messages);
//     } catch (error) {
//       console.error("Error loading messages from localStorage:", error);
//     }
//   };

//   const sendMessageToAPI = async ({ messageContent = "", file = null }) => {
//     try {
//       const apiChatId = getChatIdForAPI();
//       const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
//       let response;
//       if (file) {
//         const formData = new FormData();
//         if (messageContent.trim()) formData.append("content", messageContent.trim());
//         formData.append("attachment", file);
//         response = await axios.post(`${API_BASE_URL}/api/chat/chat/${apiChatId}/message`, formData, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//       } else {
//         response = await axios.post(`${API_BASE_URL}/api/chat/chat/${apiChatId}/message`, { content: messageContent }, {
//           headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//         });
//       }
//       if (response.data && response.data.success) return response.data.message;
//       else throw new Error("Invalid API response");
//     } catch (error) {
//       console.error("Error sending message to API:", error);
//       throw error;
//     }
//   };

//   const handleSendMessage = async () => {
//     if (newMessage.trim() === "" || isSending) return;
//     const messageText = newMessage.trim();
//     const tempUserMessage = {
//       id: `temp_${Date.now()}`,
//       text: messageText,
//       sender: "user",
//       senderRole: "user",
//       time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
//       fullTime: new Date().toISOString(),
//       status: "sending",
//       isTemporary: true,
//       isCall: false,
//     };
//     setOriginalMessages((prev) => [...prev, tempUserMessage]);
//     setMessages((prev) => [...prev, tempUserMessage]);
//     setNewMessage("");
//     focusMessageInput();
//     setShowEmojiPicker(false);
//     setIsSending(true);
//     if (timeoutRef.current) clearTimeout(timeoutRef.current);
//     try {
//       const sentMsg = await sendMessageToAPI({ messageContent: messageText });
//       setOriginalMessages((prev) => {
//         const withoutTemp = prev.filter((m) => !m.isTemporary);
//         if (!sentMsg) return withoutTemp;
//         const alreadyHas = withoutTemp.some((m) => m.messageId && sentMsg.messageId && m.messageId === sentMsg.messageId);
//         if (alreadyHas) return withoutTemp;
//         return [...withoutTemp, {
//           id: sentMsg.id || sentMsg._id,
//           messageId: sentMsg.messageId,
//           text: sentMsg.content,
//           sender: "user",
//           senderRole: "user",
//           time: new Date(sentMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
//           fullTime: sentMsg.createdAt,
//           contentType: sentMsg.contentType,
//           isRead: sentMsg.isRead,
//           status: "sent",
//           isCall: false,
//         }];
//       });

//       setMessages((prev) => {
//         const withoutTemp = prev.filter((m) => !m.isTemporary);
//         if (!sentMsg) return withoutTemp;
//         const alreadyHas = withoutTemp.some((m) => m.messageId && sentMsg.messageId && m.messageId === sentMsg.messageId);
//         if (alreadyHas) return withoutTemp;
//         return [...withoutTemp, {
//           id: sentMsg.id || sentMsg._id,
//           messageId: sentMsg.messageId,
//           text: sentMsg.content,
//           sender: "user",
//           senderRole: "user",
//           time: new Date(sentMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
//           fullTime: sentMsg.createdAt,
//           contentType: sentMsg.contentType,
//           isRead: sentMsg.isRead,
//           status: "sent",
//           isCall: false,
//         }];
//       });
//     } catch (err) {
//       console.error("Error in message sending flow:", err);
//       const status = err?.response?.status;
//       const serverError = err?.response?.data?.error || err?.response?.data?.message || "";
//       const isBlocked = status === 403 && /restricted|blocked|unavailable/i.test(serverError);

//       setMessages((prev) => prev.filter((msg) => msg.id !== tempUserMessage.id));

//       if (isBlocked) {
//         setBlockedPopup({ show: true, reason: serverError });
//       } else {
//         const errorMessage = {
//           id: `error_${Date.now()}`,
//           text: "⚠️ Failed to send message. Please check your internet connection and try again.",
//           sender: "counselor",
//           senderRole: "counsellor",
//           time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
//           fullTime: new Date().toISOString(),
//           isError: true,
//           status: "error",
//           isCall: false,
//         };
//         setOriginalMessages((prev) => [...prev, errorMessage]);
//         setMessages((prev) => [...prev, errorMessage]);
//       }
//     } finally {
//       setIsSending(false);
//       focusMessageInput();
//     }
//   };

//   const initiateStreamCall = async (requestedCallType = "video") => {
//     const normalizedMode = requestedCallType === "audio" || requestedCallType === "voice" ? "voice" : "video";
//     if (!currentCounselor) {
//       setCallError("Counselor information not available");
//       return;
//     }
//     setIsInitiatingCall(true);
//     setCallError(null);
//     try {
//       const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
//       const initiatorId = resolveCurrentUserId();
//       const initiatorType = "user";
//       const receiverId = resolveCounselorId();
//       const receiverName = currentCounselor.name || "Counselor";
//       const receiverType = "counsellor";
//       if (!initiatorId || !receiverId) throw new Error("Unable to start call. Missing user/counselor ID.");
//       const requestBody = { initiatorId, initiatorType, receiverId, receiverType, callType: normalizedMode === "voice" ? "audio" : "video" };
//       const response = await axios.post(`${API_BASE_URL}/api/video/calls/initiate`, requestBody, {
//         headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
//       });
//       if (response.data && response.data.success) {
//         const receiverProfilePhoto = response.data.callData?.receiver?.profilePhoto || getProfilePhotoUrl(currentCounselor) || currentCounselor?.avatar || currentCounselor?.name?.charAt(0) || "👤";
//         const callData = {
//           id: response.data.callData?.id,
//           callId: response.data.callId,
//           roomId: response.data.roomId,
//           name: response.data.callData?.receiver?.name || receiverName,
//           type: normalizedMode,
//           callType: normalizedMode,
//           profilePic: receiverProfilePhoto,
//           phoneNumber: currentCounselor?.phoneNumber,
//           status: response.data.status || "ringing",
//           date: "Today",
//           time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
//           apiCallData: response.data.callData,
//           initiator: response.data.callData?.initiator,
//           receiver: response.data.callData?.receiver,
//         };
//         setSelectedCall(callData);
//         setIsVideoModalOpen(true);
        
//         // Refresh call history after initiating
//         setTimeout(() => fetchCallHistory(), 2000);
//       } else {
//         throw new Error(response.data?.message || `Failed to initiate ${normalizedMode} call`);
//       }
//     } catch (error) {
//       console.error(`Error initiating ${normalizedMode} call:`, error);
//       let errorMessage = `Failed to initiate ${normalizedMode} call. `;
//       const backendMessage = error.response?.data?.message || error.response?.data?.error;
//       errorMessage += backendMessage || error.message || "Please check your connection and try again.";
//       setCallError(errorMessage);
//       setSelectedCall(null);
//       setIsVideoModalOpen(false);
//     } finally {
//       setIsInitiatingCall(false);
//     }
//   };

//   const handleVideoCall = () => initiateStreamCall("video");
//   const handleVoiceCall = () => initiateStreamCall("audio");
//   const handleCloseModal = () => { setIsVideoModalOpen(false); setSelectedCall(null); setCallError(null); };

//   // Handle menu item clicks
//   const handleMenuItemClick = async (item) => {
//     switch (item.id) {
//       case 1: // Refresh Messages
//         fetchMessagesFromAPI();
//         break;
//       case 2: // Clear Chat
//         handleClearChat();
//         break;
//       case 3: // Report Issue
//         alert(t('feature_coming_soon') || 'Feature coming soon');
//         break;
//       case 4: // Chat Details
//         alert(t('feature_coming_soon') || 'Feature coming soon');
//         break;
//       default:
//         alert(`${item.label} clicked`);
//     }
//   };

//   // Clear all messages in the chat
//   const handleClearChat = async () => {
//     const confirmed = window.confirm(
//       t('confirm_clear_chat') || 'Are you sure? This will delete all messages in this chat. You can start a new conversation after.'
//     );
//     if (!confirmed) return;

//     try {
//       setIsSending(true);
//       const chatIdToUse = currentChat?._id || currentChat?.id || chatId;

//       if (!chatIdToUse) {
//         alert(t('error_chat_id_not_found') || 'Error: Chat ID not found');
//         return;
//       }

//       const token = localStorage.getItem('token') || localStorage.getItem('accessToken');

//       const response = await axios.delete(
//         `${API_BASE_URL}/api/chat/clear/${chatIdToUse}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           },
//         }
//       );

//       console.log('✅ Chat cleared successfully:', response.data);

//       setMessages([]);
//       setCallHistory([]);
//       setNewMessage('');
//       setChatStatus(null);

//       const savedChats = JSON.parse(localStorage.getItem('activeChats') || '[]');
//       const updatedChats = savedChats.map((c) => {
//         if (c.id === currentChat?.id || c.id === chatId) {
//           return {
//             ...c,
//             messages: [],
//             unread: 0,
//             status: 'active',
//             lastMessage: null,
//             lastMessageAt: null
//           };
//         }
//         return c;
//       });
//       localStorage.setItem('activeChats', JSON.stringify(updatedChats));

//       setCurrentChat(prev => prev ? {
//         ...prev,
//         messages: [],
//         status: 'active',
//         lastMessage: null,
//         lastMessageAt: null
//       } : null);

//       alert(t('chat_cleared_restart') || 'Chat cleared! You can now start a new conversation.');
//     } catch (error) {
//       console.error('❌ Error clearing chat:', error);
//       const errorMsg = error.response?.data?.error || error.message || 'Failed to clear chat';
//       alert(t('error_clear_chat') || `Error: ${errorMsg}`);
//     } finally {
//       setIsSending(false);
//       setShowOptions(false);
//     }
//   };

//   const handleDeleteMessage = async (message) => {
//     const messageId = message?.id || message?._id || message?.messageId;
//     if (!messageId || String(messageId).startsWith("temp_")) return;
//     if (!window.confirm("Delete this message and its attachment?")) return;

//     try {
//       setDeletingMessageId(String(messageId));
//       const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
//       await axios.delete(`${API_BASE_URL}/api/chat/message/${encodeURIComponent(messageId)}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const matchesDeletedMessage = (item) =>
//         [item.id, item._id, item.messageId].map(String).includes(String(messageId));
//       setMessages((current) => current.filter((item) => !matchesDeletedMessage(item)));
//       setOriginalMessages((current) => current.filter((item) => !matchesDeletedMessage(item)));
//     } catch (error) {
//       console.error("Error deleting chat message:", error);
//       alert(error.response?.data?.error || error.response?.data?.message || "Failed to delete message");
//     } finally {
//       setDeletingMessageId(null);
//     }
//   };

//   // ─── Initialize Chat ──────────────────────────────────────────────────
//   useEffect(() => {
//     const initializeChat = async () => {
//       try {
//         const savedChats = JSON.parse(localStorage.getItem("activeChats") || "[]");
//         const stateCounselorId = initialCounselor?.id || initialCounselor?._id;
//         let chat =
//           savedChats.find((c) => c.chatId === chatId || c.id === chatId) ||
//           savedChats.find((c) => c.counselorId === (counselorId || stateCounselorId));
//         if (chat) {
//           setCurrentChat(chat);
//           if (chat.counselor) setCurrentCounselor(chat.counselor);
//           if (chat.unread) {
//             const updatedChats = savedChats.map((c) => { if (c.id === chat.id) return { ...c, unread: false }; return c; });
//             localStorage.setItem("activeChats", JSON.stringify(updatedChats));
//           }
//         } else if (initialCounselor) {
//           const newChat = {
//             id: Date.now(),
//             chatId: chatId || `chat_${Date.now()}`,
//             counselorId: counselorId || stateCounselorId,
//             counselor: initialCounselor,
//             user: initialUser || { name: "User", email: "user@example.com" },
//             messages: [],
//             unread: false,
//             startedAt: new Date().toISOString(),
//           };
//           setCurrentChat(newChat);
//           const updatedChats = [...savedChats, newChat];
//           localStorage.setItem("activeChats", JSON.stringify(updatedChats));
//         }
//         await fetchMessagesFromAPI();
//       } catch (error) {
//         console.error("Error loading chat:", error);
//       }
//     };
//     initializeChat();
//   }, [counselorId, chatId, initialCounselor, initialUser]);

//   useEffect(() => {
//     if (currentChat && messages.length > 0) {
//       try {
//         const savedChats = JSON.parse(localStorage.getItem("activeChats") || "[]");
//         const updatedChats = savedChats.map((chat) => {
//           if (chat.id === currentChat.id) {
//             return { ...chat, messages: messages, lastMessage: messages[messages.length - 1]?.text, lastMessageTime: messages[messages.length - 1]?.time, unread: false, chatStatus: chatStatus };
//           }
//           return chat;
//         });
//         localStorage.setItem("activeChats", JSON.stringify(updatedChats));
//       } catch (error) {
//         console.error("Error saving messages:", error);
//       }
//     }
//   }, [messages, currentChat, chatStatus]);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (optionsRef.current && !optionsRef.current.contains(event.target)) setShowOptions(false);
//       if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) setShowEmojiPicker(false);
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   useEffect(() => { return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }; }, []);

//   // Set up scroll listener
//   useEffect(() => {
//     const container = messagesContainerRef.current;
//     if (container) {
//       container.addEventListener("scroll", handleScroll);
//       return () => container.removeEventListener("scroll", handleScroll);
//     }
//   }, [handleScroll]);

//   // ─── Socket Connection ──────────────────────────────────────────────────
//   useEffect(() => {
//     const apiChatId = chatId || currentChat?.chatId;
//     if (!apiChatId) return;

//     let mounted = true;

//     const onNewMessage = (messageData) => {
//       if (!mounted) return;
//       const userId = resolveCurrentUserId();
//       if (messageData.senderRole === "user" && String(messageData.senderId) === String(userId)) {
//         setMessages((prev) => prev.filter((msg) => !msg.isTemporary));
//         return;
//       }
//       const transformedMessage = {
//         id: messageData.id || messageData.messageId || `rt_${Date.now()}`,
//         messageId: messageData.messageId,
//         text: messageData.content,
//         sender: messageData.senderRole === "user" ? "user" : "counselor",
//         senderRole: messageData.senderRole,
//         time: new Date(messageData.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
//         fullTime: messageData.createdAt,
//         contentType: messageData.contentType,
//         isRead: messageData.isRead,
//         status: "sent",
//         isCall: false,
//       };
//       setOriginalMessages((prev) => {
//         const isDuplicate = prev.some((msg) => msg.messageId && messageData.messageId && msg.messageId === messageData.messageId);
//         if (isDuplicate) return prev;
//         return [...prev, transformedMessage];
//       });

//       setMessages((prev) => {
//         const isDuplicate = prev.some((msg) => msg.messageId && messageData.messageId && msg.messageId === messageData.messageId);
//         if (isDuplicate) return prev;
//         return [...prev, transformedMessage];
//       });
//     };

//     const onTyping = ({ userRole, isTyping: typing }) => {
//       if (!mounted) return;
//       if (userRole !== "user") setRemoteIsTyping(typing);
//     };

//     const onMessagesRead = () => {
//       if (!mounted) return;
//       setMessages((prev) => prev.map((msg) => msg.sender === "user" ? { ...msg, isRead: true } : msg));
//     };

//     const onCallRejected = (payload) => {
//       if (!mounted) return;
//       const declinedBy = payload?.by ? ` by ${payload.by}` : "";
//       setCallError(`Call was declined${declinedBy}.`);
//       setIsVideoModalOpen(false);
//       setSelectedCall(null);
//       setShowIncomingModal(false);
//       fetchCallHistory();
//     };

//     const onCallStatusUpdate = ({ status }) => {
//       if (!mounted) return;
//       const normalizedStatus = String(status || "").toLowerCase();
//       if (normalizedStatus === "rejected" || normalizedStatus === "ended" || normalizedStatus === "cancelled" || normalizedStatus === "canceled" || normalizedStatus === "expired") {
//         setIsVideoModalOpen(false);
//         setSelectedCall(null);
//         setShowIncomingModal(false);
//         fetchCallHistory();
//       }
//     };

//     const onChatStatusUpdate = ({ status }) => {
//       if (!mounted) return;
//       setChatStatus(status);
//       setCurrentChat((prev) => (prev ? { ...prev, status } : prev));
//     };

//     const onPresenceUpdate = (payload = {}) => {
//       const counselorId = resolveCounselorId();
//       const presenceUserId = getPresenceUserId(payload);
//       const presence = getPresence(payload);
//       if (String(presenceUserId) === String(counselorId)) {
//         console.log(`[Chat Presence] Counselor ${presenceUserId} is now ${presence.isOnline ? 'ONLINE' : 'OFFLINE'}`);
//         setCurrentCounselor((prev) =>
//           prev
//             ? {
//                 ...prev,
//                 online: presence.isOnline,
//                 isOnline: presence.isOnline,
//                 lastSeen: resolveOfflineLastSeen(presence, prev.lastSeen),
//               }
//             : prev,
//         );
//       }
//     };

//     const onConnectError = (err) => {
//       console.error("Chat socket connection error:", err.message);
//     };

//     socketService.connect().then((socket) => {
//       if (!mounted) return;
//       chatSocketRef.current = socket;
//       socket.emit("join-chat", { chatId: apiChatId });
//       socket.on("new-message", onNewMessage);
//       socket.on("user-typing", onTyping);
//       socket.on("messages-read", onMessagesRead);
//       socket.on("call_rejected", onCallRejected);
//       socket.on("call-status-update", onCallStatusUpdate);
//       socket.on("chat-status-update", onChatStatusUpdate);
//       socket.on("presence-update", onPresenceUpdate);
//       socket.on("connect_error", onConnectError);
//     }).catch((err) => {
//       console.error("[ChatBox] Socket connect failed:", err.message);
//     });

//     return () => {
//       mounted = false;
//       const socket = chatSocketRef.current;
//       if (socket) {
//         socket.off("new-message", onNewMessage);
//         socket.off("user-typing", onTyping);
//         socket.off("messages-read", onMessagesRead);
//         socket.off("call_rejected", onCallRejected);
//         socket.off("call-status-update", onCallStatusUpdate);
//         socket.off("chat-status-update", onChatStatusUpdate);
//         socket.off("presence-update", onPresenceUpdate);
//         socket.off("connect_error", onConnectError);
//       }
//       chatSocketRef.current = null;
//     };
//   }, [chatId, currentChat?.chatId]);

//   const handleTypingIndicator = useCallback(() => {
//     const apiChatId = chatId || currentChat?.chatId;
//     if (!chatSocketRef.current || !apiChatId) return;
//     chatSocketRef.current.emit("typing", { chatId: apiChatId, isTyping: true });
//     if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
//     typingTimeoutRef.current = setTimeout(() => {
//       if (chatSocketRef.current) chatSocketRef.current.emit("typing", { chatId: apiChatId, isTyping: false });
//     }, 2000);
//   }, [chatId, currentChat?.chatId]);

//   useEffect(() => {
//     const interval = setInterval(() => { if (currentChat) fetchMessagesFromAPI(); }, 30000);
//     return () => clearInterval(interval);
//   }, [currentChat]);

//   // ─── Render Call Item (WhatsApp-style) ──────────────────────────────────
//   const renderCallItem = (call) => {
//     const isOutgoing = call.direction === "outgoing";
//     const callIcon = call.type === "video" ? "📹" : "📞";
    
//     // WhatsApp-style status text and icon
//     let statusText = "";
//     let statusIcon = "";
//     let statusColor = "#667781";
    
//     if (call.status === "completed" || call.status === "active") {
//       if (isOutgoing) {
//         statusText = "Call ended";
//         statusIcon = "📞";
//         statusColor = "#667781";
//       } else {
//         statusText = "Call ended";
//         statusIcon = "📞";
//         statusColor = "#667781";
//       }
//     } else if (call.status === "missed") {
//       if (isOutgoing) {
//         statusText = "Cancelled";
//         statusIcon = "📞";
//         statusColor = "#667781";
//       } else {
//         statusText = "Missed";
//         statusIcon = "❌";
//         statusColor = "#d32f2f";
//       }
//     } else if (call.status === "rejected") {
//       if (isOutgoing) {
//         statusText = "Cancelled";
//         statusIcon = "📞";
//         statusColor = "#667781";
//       } else {
//         statusText = "Declined";
//         statusIcon = "📞";
//         statusColor = "#667781";
//       }
//     } else if (call.status === "cancelled" || call.status === "canceled") {
//       statusText = "Cancelled";
//       statusIcon = "📞";
//       statusColor = "#667781";
//     } else if (call.status === "ringing" || call.status === "waiting" || call.status === "pending" || call.status === "requested") {
//       statusText = "Calling...";
//       statusIcon = "⏳";
//       statusColor = "#f57c00";
//     } else {
//       statusText = call.status || "Call";
//       statusIcon = "📞";
//       statusColor = "#667781";
//     }

//     // Duration text
//     let durationText = "";
//     if (call.duration && call.duration > 0) {
//       const mins = Math.floor(call.duration / 60);
//       const secs = call.duration % 60;
//       if (mins > 0) {
//         durationText = ` (${mins}m ${secs}s)`;
//       } else {
//         durationText = ` (${secs}s)`;
//       }
//     }

//     return (
//       <article className={`chatMsgBubble ${isOutgoing ? "chatMsgRight" : "chatMsgLeft"}`}>
//         <div className="chatMsgContent call-item" style={{
//           background: isOutgoing ? "#d9fdd3" : "#ffffff",
//           border: `1px solid ${isOutgoing ? "#25d366" : "#e9edef"}`,
//           borderRadius: "8px",
//           padding: "8px 12px",
//           maxWidth: "300px",
//         }}>
//           <div className="call-item-content" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//             <span style={{ fontSize: "16px" }}>{callIcon}</span>
//             <div className="call-info" style={{ flex: 1 }}>
//               <div style={{ fontWeight: "500", fontSize: "14px", color: "#111b21" }}>
//                 {isOutgoing ? "Outgoing" : "Incoming"} {call.type} call
//               </div>
//               <div style={{ 
//                 display: "flex", 
//                 alignItems: "center", 
//                 gap: "4px",
//                 fontSize: "12px",
//                 color: statusColor
//               }}>
//                 <span>{statusIcon}</span>
//                 <span>{statusText}</span>
//                 {durationText && <span>{durationText}</span>}
//               </div>
//             </div>
//             <span className="chatMsgTimestamp" style={{ 
//               fontSize: "11px", 
//               color: "#667781",
//               alignSelf: "flex-end"
//             }}>
//               {call.time}
//             </span>
//           </div>
//         </div>
//       </article>
//     );
//   };

//   const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey && !isSending) { e.preventDefault(); handleSendMessage(); focusMessageInput(); } };
//   const handleSendButtonClick = (e) => { e.preventDefault(); handleSendMessage(); focusMessageInput(); };
//   const addEmoji = (emoji) => { setNewMessage((prev) => prev + emoji); focusMessageInput(); };
//   const emojis = ["😊", "😂", "🥰", "😎", "😢", "😡", "👍", "👋", "❤️", "🎉", "🙏", "💪"];
//   const optionsMenuItems = useMemo(() => [
//     { id: 1, label: t('refresh_messages'), icon: "🔄" },
//     { id: 2, label: t('clear_chat'), icon: "🗑️" },
//     { id: 3, label: t('report_issue'), icon: "⚠️" },
//     { id: 4, label: t('chat_details'), icon: "📋" }
//   ], [lang]);
//   const handleFileAttach = () => { if (isSending) return; fileInputRef.current?.click(); };

//   // ─── Camera Functions ──────────────────────────────────────────────────────
//   const handleCameraClick = () => {
//     if (isSending) return;
    
//     const hasCamera = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    
//     if (!hasCamera) {
//       alert('Camera is not supported on this device. Please use the attachment option to share images.');
//       return;
//     }
    
//     const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    
//     if (isMobile) {
//       cameraInputRef.current?.click();
//     } else {
//       openDesktopCamera();
//     }
//   };

//   const openDesktopCamera = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ 
//         video: { 
//           facingMode: 'user',
//           width: { ideal: 1280 },
//           height: { ideal: 720 }
//         } 
//       });
      
//       setCameraStream(stream);
//       setShowCameraPreview(true);
      
//       setTimeout(() => {
//         if (videoRef.current) {
//           videoRef.current.srcObject = stream;
//           videoRef.current.play().catch(err => console.error('Video play error:', err));
//         }
//       }, 100);
      
//     } catch (error) {
//       console.error('Error accessing camera:', error);
//       if (error.name === 'NotAllowedError') {
//         alert('Camera access was denied. Please allow camera access in your browser settings.');
//       } else if (error.name === 'NotFoundError') {
//         alert('No camera found on this device. Please use the attachment option.');
//       } else {
//         alert('Failed to access camera. Please use the attachment option instead.');
//       }
//     }
//   };

//   const capturePhoto = () => {
//     const video = videoRef.current;
//     if (!video) {
//       alert('Camera not ready. Please try again.');
//       return;
//     }
    
//     if (video.videoWidth === 0 || video.videoHeight === 0) {
//       alert('Camera not ready. Please wait a moment and try again.');
//       return;
//     }
    
//     const canvas = document.createElement('canvas');
//     canvas.width = video.videoWidth || 1280;
//     canvas.height = video.videoHeight || 720;
    
//     const context = canvas.getContext('2d');
//     context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
//     const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
//     setPhotoPreview(imageDataUrl);
    
//     closeCamera();
//   };

//   const closeCamera = () => {
//     if (cameraStream) {
//       cameraStream.getTracks().forEach(track => track.stop());
//       setCameraStream(null);
//     }
//     setShowCameraPreview(false);
//   };

//   const renderCameraPreview = () => {
//     if (!showCameraPreview) return null;
    
//     return (
//       <div className="camera-preview-overlay" onClick={closeCamera}>
//         <div className="camera-preview-content" onClick={(e) => e.stopPropagation()}>
//           <div className="camera-video-wrapper">
//             <video 
//               ref={videoRef} 
//               autoPlay 
//               playsInline
//               muted
//               className="camera-preview-video"
//             />
//             <div className="camera-guide-frame">
//               <div className="camera-guide-corners">
//                 <span className="corner tl"></span>
//                 <span className="corner tr"></span>
//                 <span className="corner bl"></span>
//                 <span className="corner br"></span>
//               </div>
//             </div>
//           </div>
//           <div className="camera-preview-actions">
//             <button 
//               className="camera-capture-btn"
//               onClick={capturePhoto}
//               disabled={photoSending}
//             >
//               {photoSending ? '⏳ Sending...' : '📸 Capture'}
//             </button>
//             <button 
//               className="camera-close-btn"
//               onClick={closeCamera}
//             >
//               ✕ Close
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const handleSendPhoto = async () => {
//     if (!photoPreview) return;
//     setPhotoSending(true);
//     try {
//       const base64Data = photoPreview.split(",")[1];
//       const binaryString = atob(base64Data);
//       const bytes = new Uint8Array(binaryString.length);
//       for (let i = 0; i < binaryString.length; i++) {
//         bytes[i] = binaryString.charCodeAt(i);
//       }
//       const blob = new Blob([bytes], { type: "image/jpeg" });
//       const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
//       await sendMessageToAPI({ file });
//       setPhotoPreview(null);
//     } catch (error) {
//       console.error('Error sending photo:', error);
//       alert('Failed to send photo. Please try again.');
//     } finally {
//       setPhotoSending(false);
//     }
//   };

//   const handleFileSelected = async (e) => {
//     const file = e.target.files?.[0];
//     if (!file || isSending) return;

//     if (e.target === cameraInputRef.current) {
//       const reader = new FileReader();
//       reader.onload = (event) => {
//         setPhotoPreview(event.target?.result);
//       };
//       reader.readAsDataURL(file);
//       e.target.value = "";
//       return;
//     }

//     const tempFileMessage = {
//       id: `temp_file_${Date.now()}`,
//       text: file.name,
//       sender: "user",
//       senderRole: "user",
//       time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
//       fullTime: new Date().toISOString(),
//       contentType: file.type.startsWith("image/") ? "IMAGE" : "FILE",
//       attachmentUrl: URL.createObjectURL(file),
//       attachmentName: file.name,
//       attachmentMimeType: file.type,
//       status: "sending",
//       isTemporary: true,
//       isCall: false,
//     };
    
//     setMessages((prev) => [...prev, tempFileMessage]);
//     setIsSending(true);
    
//     try {
//       await sendMessageToAPI({ file });
//       setMessages((prev) => prev.filter((msg) => !msg.isTemporary));
//       await fetchMessagesFromAPI();
//     } catch (error) {
//       console.error("Error sending file:", error);
//       setMessages((prev) => prev.map((msg) => 
//         msg.id === tempFileMessage.id 
//           ? { ...msg, status: "error", error: "Failed to send file" } 
//           : msg
//       ));
//     } finally {
//       setIsSending(false);
//       e.target.value = "";
//     }
//   };

//   const handleInputChange = (e) => { setNewMessage(e.target.value); setIsTyping(e.target.value.trim() !== ""); if (e.target.value.trim() !== "") handleTypingIndicator(); };

//   const renderProfileAvatar = (counselor, size = "md") => {
//     if (!counselor) return <div className={`chat-profile-initials-${size}`}>?</div>;
//     const profilePhotoUrl = getProfilePhotoUrl(counselor);
//     if (profilePhotoUrl) {
//       return <img src={profilePhotoUrl} alt={counselor.name || "Counselor"} className={`chat-profile-image-${size}`} onError={(e) => { e.target.style.display = "none"; e.target.parentElement.innerHTML = `<div class="chat-profile-initials-${size}">${getInitials(counselor.name || "Counselor")}</div>`; }} />;
//     }
//     return <div className={`chat-profile-initials-${size}`}>{getInitials(counselor.name || "Counselor")}</div>;
//   };

//   const renderMessageStatus = (message) => {
//     if (message.sender !== "user") return null;
    
//     let statusBadge = null;
//     switch (message.status) {
//       case "sending": 
//         statusBadge = <span className="message-status sending">⌛ Sending...</span>;
//         break;
//       case "sent": 
//         statusBadge = <span className="message-status sent">✓ Sent</span>;
//         break;
//       case "error": 
//         statusBadge = <span className="message-status error">⚠️ Failed</span>;
//         break;
//       default: 
//         statusBadge = null;
//     }

//     const showDeleteIcon = message.sender === "user" && 
//                           !message.isTemporary && 
//                           message.status !== "error" &&
//                           message.status !== "sending";

//     return (
//       <div className="message-status-container">
//         {statusBadge}
//         {showDeleteIcon && (
//           <button
//             type="button"
//             className="message-delete-btn"
//             onClick={() => handleDeleteMessage(message)}
//             disabled={String(deletingMessageId) === String(message.id || message._id || message.messageId)}
//             aria-label="Delete message"
//             title="Delete message"
//           >
//             {String(deletingMessageId) === String(message.id || message._id || message.messageId) ? (
//               <span className="delete-loading">⌛</span>
//             ) : (
//               <span className="delete-icon">🗑️</span>
//             )}
//           </button>
//         )}
//       </div>
//     );
//   };

//   const renderChatStatusBanner = () => {
//     if (!chatStatus) return null;
//     let statusClass = "", statusText = "";
//     switch (chatStatus) {
//       case "pending": statusClass = "status-pending"; statusText = "⏳ Waiting for counselor to accept..."; break;
//       case "ended": statusClass = "status-ended"; statusText = "🔒 Chat session ended"; break;
//       default: return null;
//     }
//     return <div className={`chat-status-banner ${statusClass}`}>{statusText}</div>;
//   };

//   const counselorName = currentCounselor?.name || "Counselor";
//   const counselorPresence = getPresence(currentCounselor);
//   const counselorOnline = counselorPresence.isOnline;
//   const counselorPresenceText = formatPresenceText(counselorPresence, {
//     onlineText: t('online') || "Online",
//     offlineText: t('offline') || "Offline",
//   });

//   // ─── Render ──────────────────────────────────────────────────────────
//   const mergedTimeline = getMergedTimeline();

//   return (
//     <div className="chatContainerFull">
//       <div className="chatBoxMain">
//         <header className="chatBoxHeader">
//           <div className="chatBoxHeaderLeft">
//             <button onClick={handleBackClick} className={isMobile ? "chatMobileHeaderBack" : "chatDesktopHeaderBack"} aria-label="Go back" title="Go back">
//               <FaArrowLeft />
//             </button>
//             <div className="chatUserDetails">
//               <div className="chatProfilePic" aria-label="Counselor profile picture">
//                 {renderProfileAvatar(currentCounselor, "md")}
//                 <span className={`chatActiveDot ${counselorOnline ? "chatActiveOnline" : "chatActiveOffline"}`} />
//               </div>
//               <div className="chatProfileInfo">
//                 <h2 className="chatProfileName">{counselorName}</h2>
//                 <p className="chatProfileStatus">
//                   {remoteIsTyping ? <span className="chatTypingText" role="status">{t('typing')}</span> : <span className="chatStatusText">{counselorPresenceText}</span>}
//                 </p>
//               </div>
//             </div>
//           </div>
//           <div className="chatBoxHeaderRight">
//             <button className={`chatActionBtn chatVideoBtn ${isInitiatingCall ? "disabled" : ""}`} onClick={handleVideoCall} disabled={isInitiatingCall} aria-label="Video call">
//               <span className="chatBtnIcon" aria-hidden="true">{isInitiatingCall ? <FaSpinner className="spinning" /> : <FaVideo />}</span>
//               <span className="chatBtnTooltip">{t('video_call_tooltip')}</span>
//             </button>
//             <button className={`chatActionBtn chatAudioBtn ${isInitiatingCall ? "disabled" : ""}`} onClick={handleVoiceCall} disabled={isInitiatingCall} aria-label="Voice call">
//               <span className="chatBtnIcon" aria-hidden="true">{isInitiatingCall ? <FaSpinner className="spinning" /> : <FaPhoneAlt />}</span>
//               <span className="chatBtnTooltip">{t('voice_call_tooltip')}</span>
//             </button>
//             <div className="chatMoreOptions" ref={optionsRef}>
//               <button className="chatActionBtn" onClick={() => setShowOptions(!showOptions)} aria-label="More options" aria-expanded={showOptions}>
//                 <span className="chatBtnIcon" aria-hidden="true">⋮</span>
//               </button>
//               {showOptions && (
//                 <div className="chatDropdownMenu" role="menu">
//                   {optionsMenuItems.map((item) => (
//                     <button key={item.id} className="chatDropdownItem" onClick={() => { setShowOptions(false); handleMenuItemClick(item); }} role="menuitem">
//                       <span className="chatDropdownIcon" aria-hidden="true">{item.icon}</span>
//                       <span className="chatDropdownText">{item.label}</span>
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         </header>

//         {renderChatStatusBanner()}

//         {callError && (
//           <div className="call-error-banner">
//             <span className="error-icon">⚠️</span>
//             <span className="error-text">{callError}</span>
//             <button className="error-close" onClick={() => setCallError(null)}>✕</button>
//           </div>
//         )}

//         <main className="chatMessagesArea" ref={messagesContainerRef} onScroll={handleScroll}>
//           {isLoadingMessages && mergedTimeline.length === 0 ? (
//             <div className="chatLoadingMessages">
//               <p>{t('loading_messages')}</p>
//             </div>
//           ) : mergedTimeline.length === 0 ? (
//             <div className="chatEmptyState">
//               <p>No messages or calls yet. Start a conversation!</p>
//             </div>
//           ) : (
//             <>
//               {mergedTimeline.map((item, index) => (
//                 <React.Fragment key={item.id || `item_${index}`}>
//                   {getMessageDayKey(item) !== getMessageDayKey(mergedTimeline[index - 1]) && formatMessageDay(item) && (
//                     <div className="chatDateSeparator">{formatMessageDay(item)}</div>
//                   )}
                  
//                   {item.isCall ? (
//                     renderCallItem(item)
//                   ) : (
//                     <article className={`chatMsgBubble ${item.sender === "user" ? "chatMsgRight" : "chatMsgLeft"} ${item.status === "error" ? "message-error" : ""}`}>
//                       <div className="chatMsgContent">
//                         {(item.contentType === "IMAGE" || item.attachmentMimeType?.startsWith("image/")) && item.attachmentUrl ? (
//                           <>
//                             <img src={item.attachmentUrl} alt={item.attachmentName || "Shared image"} className="chatMsgImage" />
//                             <a href={item.attachmentUrl} target="_blank" rel="noreferrer" className="chatMsgAttachmentLink">{item.attachmentName || "Open image"}</a>
//                             {item.text && <TranslatedMessage text={item.text} translate={translate} lang={lang} />}
//                           </>
//                         ) : item.contentType === "FILE" && item.attachmentUrl ? (
//                           <>
//                             <a href={item.attachmentUrl} target="_blank" rel="noreferrer" className="chatMsgAttachmentLink">{item.attachmentName || item.text || "Open attachment"}</a>
//                             {item.text && <TranslatedMessage text={item.text} translate={translate} lang={lang} />}
//                           </>
//                         ) : (
//                           <TranslatedMessage text={item.text} translate={translate} lang={lang} />
//                         )}
//                         <div className="chatMsgFooter">
//                           <time className="chatMsgTimestamp">{item.time}</time>
//                           {renderMessageStatus(item)}
//                           {(item.contentType === "IMAGE" || item.contentType === "FILE") && (
//                             <button
//                               type="button"
//                               className="chatMsgDeleteBtn"
//                               onClick={() => handleDeleteMessage(item)}
//                               disabled={String(deletingMessageId) === String(item.id || item._id || item.messageId)}
//                               aria-label="Delete attachment"
//                               title="Delete attachment"
//                             >
//                               {String(deletingMessageId) === String(item.id || item._id || item.messageId) ? "Deleting..." : "Delete"}
//                             </button>
//                           )}
//                         </div>
//                       </div>
//                     </article>
//                   )}
//                 </React.Fragment>
//               ))}
//               <div ref={messagesEndRef} />
//             </>
//           )}
//         </main>

//         {showEmojiPicker && (
//           <div className="chatEmojiBox" ref={emojiPickerRef} role="dialog" aria-label="Emoji picker">
//             <div className="emojiBoxHeader">
//               <span className="emojiBoxTitle">Emoji</span>
//               <button className="emojiBoxClose" onClick={() => setShowEmojiPicker(false)} aria-label="Close emoji picker">×</button>
//             </div>
//             <div className="emojiBoxGrid">
//               {emojis.map((emoji, index) => (
//                 <button key={index} className="emojiBoxItem" onClick={() => addEmoji(emoji)} aria-label={`Emoji ${emoji}`}>{emoji}</button>
//               ))}
//             </div>
//           </div>
//         )}

//         <footer className="chatInputArea">
//           <div className="chatInputGroup">
//             <input 
//               ref={fileInputRef} 
//               type="file" 
//               className="chatHiddenFileInput" 
//               onChange={handleFileSelected} 
//               style={{ display: "none" }} 
//             />
//             <input
//               ref={cameraInputRef}
//               type="file"
//               accept="image/*"
//               capture="user"
//               className="chatHiddenFileInput"
//               onChange={handleFileSelected}
//               style={{ display: "none" }}
//             />
            
//             <button 
//               className="chatAttachBtn" 
//               onClick={handleFileAttach} 
//               disabled={isSending} 
//               aria-label="Attach file"
//             >
//               <span className="attachIcon" aria-hidden="true">📎</span>
//             </button>
            
//             <button 
//               className="chatCameraBtn" 
//               onClick={handleCameraClick} 
//               disabled={isSending} 
//               aria-label="Take photo"
//             >
//               <FaCamera className="camera-icon" />
//             </button>
            
//             <div className="chatInputWrapper">
//               <input 
//                 ref={messageInputRef} 
//                 id="messageInput" 
//                 type="text" 
//                 value={newMessage} 
//                 onChange={handleInputChange} 
//                 onKeyDown={handleKeyDown} 
//                 placeholder={`Message ${counselorName}...`} 
//                 className="chatTextInput" 
//                 autoComplete="off" 
//                 enterKeyHint="send" 
//                 aria-label="Message input" 
//               />
//               <button 
//                 className="chatEmojiBtn" 
//                 onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
//                 aria-label="Open emoji picker"
//               >
//                 <span className="emojiIcon" aria-hidden="true">😊</span>
//               </button>
//             </div>
            
//             <button 
//               onMouseDown={(e) => e.preventDefault()} 
//               onClick={handleSendButtonClick} 
//               disabled={!newMessage.trim() || isSending} 
//               className="chatSendBtn" 
//               aria-label="Send message"
//             >
//               <span className="sendIcon" aria-hidden="true">
//                 {isSending ? "⏳" : "➤"}
//               </span>
//             </button>
//           </div>
//         </footer>
//       </div>

//       {renderCameraPreview()}

//       <PhotoPreviewModal
//         isOpen={!!photoPreview}
//         photoSrc={photoPreview}
//         onSend={handleSendPhoto}
//         onCancel={() => setPhotoPreview(null)}
//         loading={photoSending}
//       />

//       <VideoCallModal
//         isOpen={isVideoModalOpen}
//         onClose={handleCloseModal}
//         callData={selectedCall}
//         callMode={selectedCall?.callType || selectedCall?.type || "video"}
//         currentUser={currentUser}
//         onEndCall={handleEndCall}
//       />

//       <RatingModal
//         visible={showRatingModal}
//         counselorName={ratingTarget?.counselorName || currentCounselor?.name}
//         counselorPhoto={ratingTarget?.counselorPhoto || getProfilePhotoUrl(currentCounselor)}
//         submitting={ratingSubmitting}
//         onSubmit={handleSubmitRating}
//         onDismiss={handleDismissRating}
//       />

//       <IncomingCallModal
//         isOpen={showIncomingModal}
//         onClose={() => setShowIncomingModal(false)}
//         callType={incomingCallData.callType}
//         callerName={incomingCallData.name}
//         callerImage={incomingCallData.image}
//         callData={incomingCallData}
//         onAccept={handleAcceptCall}
//         onReject={handleRejectCall}
//         fallbackName="Counselor"
//       />

//       {blockedPopup.show && (
//         <div
//           onClick={() => setBlockedPopup({ show: false, reason: "" })}
//           style={{
//             position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
//             display: "flex", alignItems: "center", justifyContent: "center",
//             zIndex: 9999, padding: 16,
//           }}
//         >
//           <div
//             onClick={(e) => e.stopPropagation()}
//             style={{
//               background: "#fff", borderRadius: 12, maxWidth: 380, width: "100%",
//               padding: "24px 22px", boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
//               textAlign: "center",
//             }}
//           >
//             <div style={{ fontSize: 42, marginBottom: 8 }}>🚫</div>
//             <h3 style={{ margin: "0 0 8px", color: "#c0392b", fontSize: 18 }}>
//               Chat Unavailable
//             </h3>
//             <p style={{ margin: "0 0 16px", color: "#444", fontSize: 14, lineHeight: 1.5 }}>
//               This counselor has been blocked by admin. You cannot send messages right now.
//             </p>
//             {blockedPopup.reason && (
//               <p style={{ margin: "0 0 16px", color: "#888", fontSize: 12, fontStyle: "italic" }}>
//                 {blockedPopup.reason}
//               </p>
//             )}
//             <button
//               onClick={() => setBlockedPopup({ show: false, reason: "" })}
//               style={{
//                 background: "#c0392b", color: "#fff", border: "none",
//                 padding: "10px 24px", borderRadius: 8, cursor: "pointer",
//                 fontSize: 14, fontWeight: 600,
//               }}
//             >
//               OK
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ChatBox;



// ChatBox.jsx - Complete Fixed Version with Proper Image/File Display
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPhoneAlt, FaSpinner, FaVideo, FaCamera, FaSearch, FaHistory, FaPaperclip, FaSmile } from "react-icons/fa";
import "./ChatBox.css";
import VideoCallModal from "../CallModal/VideoCallModal";
import PhotoPreviewModal from "../../../common/PhotoPreviewModal/PhotoPreviewModal";
import { API_BASE_URL } from "../../../../axiosConfig";
import socketService from "../../../../services/socketService";
import useRingtone from "../../../../hooks/useRingtone";
import IncomingCallModal from "../../../common/IncomingCallModal/IncomingCallModal";
import { useUserTranslation, useUserApiTranslation } from "../../../../i18n/LanguageContext";
import RatingModal from "../../../../components/RatingModal";
import ratingService from "../../../../services/ratingService";
import {
  formatPresenceText,
  getPresence,
  getPresenceUserId,
  resolveOfflineLastSeen,
} from "../../../../utils/presence";
import TranslatedMessage from "../../../common/TranslatedMessage";
import { getCallHistoryTone } from "../../../common/callHistoryStyle";

const normalizeCounselor = (counselor) => {
  if (!counselor) return counselor;

  const name = [
    counselor.name,
    counselor.fullName,
    counselor.displayName,
    counselor.counselorName,
  ].find((value) => typeof value === "string" && value.trim());

  const profilePhoto =
    counselor.profilePhoto ||
    counselor.profileImage ||
    counselor.photo ||
    (counselor.avatarType === "image" ? counselor.avatar : null);

  return {
    ...counselor,
    ...(name ? { name: name.trim() } : {}),
    ...(profilePhoto ? { profilePhoto } : {}),
  };
};

const mergeCounselorProfiles = (storedCounselor, freshCounselor) => {
  const stored = normalizeCounselor(storedCounselor) || {};
  const fresh = normalizeCounselor(freshCounselor) || {};
  const freshValues = Object.fromEntries(
    Object.entries(fresh).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
  return normalizeCounselor({ ...stored, ...freshValues });
};

const ChatBox = ({ embedded = false, conversation = null, onClose }) => {
  const { t, lang } = useUserTranslation();
  const { translate } = useUserApiTranslation();
  const { id: counselorId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const { chatId, counselor: initialCounselor, user: initialUser } =
    conversation || location.state || {};

  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [callHistory, setCallHistory] = useState([]);
  const [currentCounselor, setCurrentCounselor] = useState(() => {
    if (initialCounselor) return normalizeCounselor(initialCounselor);
    return {
      id: counselorId || null,
      name: "Dr. Suresh Reddy",
      specialization: "Clinical Psychologist",
      online: false,
      avatar: null,
      avatarType: "text",
      profilePhoto: null,
      phoneNumber: "+91 98765 43215",
    };
  });

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [isInitiatingCall, setIsInitiatingCall] = useState(false);
  const [initiatingCallType, setInitiatingCallType] = useState(null);
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
  const [conversationSearch, setConversationSearch] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [remoteIsTyping, setRemoteIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [deletingCallId, setDeletingCallId] = useState(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [chatStatus, setChatStatus] = useState(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [blockedPopup, setBlockedPopup] = useState({ show: false, reason: "" });
  const [originalMessages, setOriginalMessages] = useState([]);
  const [isTranslating, setIsTranslating] = useState(false);

  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);

  // ─── Counselor rating ──────────────────────────────────────────────────────
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingTarget, setRatingTarget] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoSending, setPhotoSending] = useState(false);
  const ratingPromptedRef = useRef(false);
  const sessionChatIdRef = useRef(chatId || null);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const optionsRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const timeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const chatSocketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const isUserScrollingRef = useRef(false);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
    if (typeof counselor.profilePhoto === "string") return counselor.profilePhoto;
    if (counselor?.profilePhoto?.url) return counselor.profilePhoto.url;
    if (counselor?.profilePhoto?.secure_url) return counselor.profilePhoto.secure_url;
    if (typeof counselor.profileImage === "string") return counselor.profileImage;
    if (counselor?.profileImage?.url) return counselor.profileImage.url;
    if (counselor?.avatar && counselor?.avatarType === "image") return counselor.avatar;
    return null;
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2);
  };

  const scrollToBottom = useCallback((behavior = "smooth", force = false) => {
    if (messagesContainerRef.current && (shouldScrollToBottom || force)) {
      const container = messagesContainerRef.current;
      requestAnimationFrame(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: behavior,
        });
      });
    }
  }, [shouldScrollToBottom]);

  const focusMessageInput = useCallback(() => {
    const input = messageInputRef.current;
    if (!input) return;
    requestAnimationFrame(() => input.focus({ preventScroll: true }));
    setTimeout(() => input.focus({ preventScroll: true }), 50);
  }, []);

  // Keep this conversation timeline chat-only. Call records remain
  // available from the portal's dedicated Call History page.
  const getMergedTimeline = useCallback(() => {
    const allItems = [...messages];
    
    return allItems.sort((a, b) => {
      const timeA = a.fullTime || a.createdAt || a.timestamp || a.time;
      const timeB = b.fullTime || b.createdAt || b.timestamp || b.time;
      return new Date(timeA) - new Date(timeB);
    });
  }, [messages]);

  const getMessageDayKey = (item) => {
    const timestamp = item?.fullTime || item?.createdAt || item?.timestamp;
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? null : date.toDateString();
  };

  const formatMessageDay = (item) => {
    const timestamp = item?.fullTime || item?.createdAt || item?.timestamp;
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return null;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // ─── Rating flow ──────────────────────────────────────────────────────────
  const triggerRatingPrompt = useCallback(async () => {
    if (ratingPromptedRef.current) return;
    const counselorIdResolved = resolveCounselorId();
    if (!counselorIdResolved) return;
    ratingPromptedRef.current = true;
    const target = {
      counselorId: counselorIdResolved,
      counselorName: currentCounselor?.name || "Consultant",
      counselorPhoto: getProfilePhotoUrl(currentCounselor),
      chatId: getChatIdForAPI(),
    };
    setRatingTarget(target);
    setShowRatingModal(true);
    await ratingService.savePendingRating(target);
  }, [currentCounselor]);

  const handleBackClick = async () => {
    if (embedded) {
      onClose?.();
      return;
    }
    const counselorIdResolved = resolveCounselorId();
    const apiChatId = getChatIdForAPI();

    const alreadyRatedCounselor = await ratingService.isAlreadyRated(counselorIdResolved);
    if (alreadyRatedCounselor || ratingPromptedRef.current) {
      navigate(-1);
      return;
    }

    const allPending = await ratingService.getAllPendingRatings();
    const hasPendingRating = allPending.some(r => r.chatId === apiChatId);

    if (hasPendingRating && !ratingPromptedRef.current) {
      ratingPromptedRef.current = true;
      const target = {
        counselorId: counselorIdResolved,
        counselorName: currentCounselor?.name || "Consultant",
        counselorPhoto: getProfilePhotoUrl(currentCounselor),
        chatId: apiChatId,
      };
      setRatingTarget(target);
      setShowRatingModal(true);
      return;
    }

    navigate(-1);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const due = await ratingService.getDuePendingRating();
      if (!cancelled && due && !ratingPromptedRef.current) {
        ratingPromptedRef.current = true;
        setRatingTarget(due);
        setShowRatingModal(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const counselorIdResolved = resolveCounselorId();
    const apiChatId = getChatIdForAPI();
    if (counselorIdResolved && apiChatId) {
      ratingService.savePendingRating({
        counselorId: counselorIdResolved,
        counselorName: currentCounselor?.name || "Consultant",
        counselorPhoto: getProfilePhotoUrl(currentCounselor),
        chatId: apiChatId,
      });
    }
  }, []);

  const handleSubmitRating = async ({ stars, comment }) => {
    if (!ratingTarget) return;
    setRatingSubmitting(true);
    try {
      await ratingService.submitRating({
        counselorId: ratingTarget.counselorId,
        stars,
        comment,
        chatId: ratingTarget.chatId,
      });
      setShowRatingModal(false);
      alert("Thank you! Your rating helps others find the right counselor.");
    } catch (e) {
      console.log("submitRating failed:", e?.message);
      alert("Couldn't submit. Please try again in a moment.");
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleDismissRating = () => {
    setShowRatingModal(false);
    ratingPromptedRef.current = false;
    navigate(-1);
  };

  const getChatIdForAPI = () => {
    if (chatId) return chatId;
    if (currentChat?.chatId) return currentChat.chatId;
    if (!sessionChatIdRef.current) {
      const stableUserId = getCurrentUser()?.id || "user";
      const stableCounselorId = counselorId || "counselor";
      sessionChatIdRef.current = `chat_${stableUserId}_${stableCounselorId}`.replace(/\s+/g, "_");
    }
    return sessionChatIdRef.current;
  };

  const normalizeCallType = (callType = "video") => {
    const normalized = String(callType || "").toLowerCase();
    return normalized === "audio" || normalized === "voice" ? "voice" : "video";
  };

  // ─── Fetch Call History ──────────────────────────────────────────────────
  const fetchCallHistory = useCallback(async () => {
    try {
      const userId = resolveCurrentUserId();
      const peerId = resolveCounselorId();

      if (!userId || !peerId) {
        setCallHistory([]);
        return;
      }

      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/api/video/calls/history/${userId}`,
        {
          params: { page: 1, limit: 100 },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      const matchingCalls = (response.data?.history || [])
        .filter((call) => String(call.withId) === String(peerId))
        .slice(0, 10);

      if (matchingCalls.length > 0) {
        const formattedCalls = matchingCalls.map((call) => {
          const timestamp = new Date(call.timestamp);
          const normalizedCallType = normalizeCallType(call.callType || call.type);
          const isOutgoing = call.role === "initiator";
          
          return {
            id: call.id || `${call.timestamp}-${call.type}`,
            callId: call.id || call.callId,
            type: normalizedCallType,
            direction: isOutgoing ? "outgoing" : "incoming",
            status: call.status || "completed",
            time: !isNaN(timestamp.getTime()) 
              ? timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "",
            fullTime: call.timestamp || new Date().toISOString(),
            timestamp: call.timestamp || new Date().toISOString(),
            duration: call.duration || 0,
            isCall: true,
            role: call.role,
            withId: call.withId,
            _original: call,
          };
        });
        setCallHistory(formattedCalls);
      } else {
        setCallHistory([]);
      }
    } catch (error) {
      console.warn("Unable to load chat call history:", error.message);
      setCallHistory([]);
    }
  }, []);

  const handleAcceptCall = async (callId) => {
    try {
      const resolvedCallId = callId || incomingCallData?.callId || incomingCallData?.id || incomingCallData?._id;

      if (!resolvedCallId) {
        throw new Error("Missing callId for incoming call");
      }

      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
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
        roomId: response.data.roomId || detailedCall?.roomId || incomingCallData.roomId,
        name: remoteParticipant?.displayName || remoteParticipant?.fullName || incomingCallData.name || "Consultant",
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
      
      await fetchCallHistory();
      
      return response.data;
    } catch (error) {
      console.error("Error accepting call:", error);
      throw error;
    }
  };

  const handleRejectCall = async (callId) => {
    const resolvedCallId = callId || incomingCallData?.callId || incomingCallData?.id || incomingCallData?._id;

    try {
      if (!resolvedCallId) {
        return false;
      }

      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
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
      
      await fetchCallHistory();
      
      return true;
    } catch (error) {
      if (error?.response?.status === 404) {
        try {
          const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
          await axios.post(
            `${API_BASE_URL}/api/call/${resolvedCallId}/reject`,
            { reason: "declined" },
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          await fetchCallHistory();
          return true;
        } catch (fallbackError) {
          console.error("Reject fallback failed:", fallbackError);
        }
      }
      console.error("Error rejecting call:", error);
      return false;
    }
  };

  // ─── Translation Functions ──────────────────────────────────────────────
  const translateMessage = useCallback(async (text, targetLang) => {
    return text;
  }, []);

  useEffect(() => {
    if (!lang || lang === 'en') {
      setIsTranslating(false);
      setMessages(originalMessages);
      return;
    }

    if (!originalMessages || originalMessages.length === 0) {
      setIsTranslating(false);
      return;
    }

    const translateMessages = async () => {
      setIsTranslating(true);
      try {
        const translatedMsgs = await Promise.all(
          originalMessages.map(async (msg) => {
            if (!msg.text || msg.sender === 'user' || msg.isCall) {
              return msg;
            }

            try {
              const translatedText = await translateMessage(msg.text, lang);
              if (translatedText && translatedText !== msg.text) {
                return { ...msg, text: translatedText };
              }
              return msg;
            } catch (error) {
              console.error('Error translating individual message:', error);
              return msg;
            }
          })
        );

        setMessages(translatedMsgs);
      } catch (error) {
        console.error('❌ Error translating messages:', error);
        setMessages(originalMessages);
      } finally {
        setIsTranslating(false);
      }
    };

    translateMessages();
  }, [lang, originalMessages]);

  const handleEndCall = async (callId) => {
    try {
      const resolvedCallId = callId || selectedCall?.callId || incomingCallData?.callId || selectedCall?.id || incomingCallData?.id || incomingCallData?._id;

      if (!resolvedCallId) {
        return false;
      }

      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
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
      
      await fetchCallHistory();
      
      return true;
    } catch (error) {
      console.error("Error ending call:", error);
      return false;
    }
  };

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

  useEffect(() => {
    const mergedItems = getMergedTimeline();
    if (mergedItems.length === 0) return;
    
    if (isInitialLoadRef.current) {
      scrollToBottom("auto", true);
      
      const timer = setTimeout(() => {
        scrollToBottom("auto", true);
        isInitialLoadRef.current = false;
      }, 50);
      return () => clearTimeout(timer);
    } else if (shouldScrollToBottom) {
      scrollToBottom("smooth");
    } else {
      if (messagesContainerRef.current) {
        prevScrollHeightRef.current = messagesContainerRef.current.scrollHeight;
      }
    }
  }, [messages, callHistory, scrollToBottom, shouldScrollToBottom, getMergedTimeline]);

  useEffect(() => {
    if (!shouldScrollToBottom && messagesContainerRef.current && prevScrollHeightRef.current > 0) {
      const newScrollHeight = messagesContainerRef.current.scrollHeight;
      const scrollDifference = newScrollHeight - prevScrollHeightRef.current;
      if (scrollDifference > 0) {
        messagesContainerRef.current.scrollTop += scrollDifference;
      }
      prevScrollHeightRef.current = newScrollHeight;
    }
  }, [messages, callHistory, shouldScrollToBottom]);

  // ─── Incoming Calls Polling ────────────────────────────────────────────
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

        const callsList = response.data.pendingRequests || response.data.waitingCalls || response.data.calls || [];

        const currentIncomingId = incomingCallData?.callId || incomingCallData?.id || incomingCallData?._id;
        const stillWaiting = currentIncomingId
          ? callsList.some((c) => (c.callId || c.id || c._id) === currentIncomingId)
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
          const waitingCall = callsList.find((call) => {
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

          const callerFullName = fromData.fullName || fromData.displayName || "Consultant";

          const resolvedIncomingCallId = waitingCall.callId || waitingCall.id || waitingCall._id;

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

  // ─── GET messages from API ──────────────────────────────────────────────
  const fetchMessagesFromAPI = async ({ forceRefresh = false } = {}) => {
    try {
      const apiChatId = getChatIdForAPI();
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      setIsLoadingMessages(true);
      
      const response = await axios.get(`${API_BASE_URL}/api/chat/chat/${apiChatId}/messages`, {
        params: forceRefresh ? { _refresh: Date.now() } : undefined,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data && response.data.messages) {
        if (response.data.chatStatus) setChatStatus(response.data.chatStatus);
        const transformedMessages = response.data.messages.map((msg, index) => ({
          id: msg.messageId || msg._id || msg.id || index,
          _id: msg._id || msg.id || null,
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
          isCall: false,
        }));
        setOriginalMessages(transformedMessages);
        setMessages(transformedMessages);
        if (currentChat) {
          setCurrentChat((prev) => ({ ...prev, messages: transformedMessages, chatStatus: response.data.chatStatus }));
        }
      }
      
      // Call history is supplementary; its failure must never make a
      // successful message refresh look like it failed.
      Promise.resolve(fetchCallHistory()).catch((callHistoryError) => {
        console.warn("Call history refresh failed:", callHistoryError);
      });
      return true;
      
    } catch (error) {
      console.error("Error fetching messages from API:", error);
      loadMessagesFromLocalStorage();
      Promise.resolve(fetchCallHistory()).catch((callHistoryError) => {
        console.warn("Call history refresh failed:", callHistoryError);
      });
      return false;
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
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
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
      fullTime: new Date().toISOString(),
      status: "sending",
      isTemporary: true,
      isCall: false,
    };
    setOriginalMessages((prev) => [...prev, tempUserMessage]);
    setMessages((prev) => [...prev, tempUserMessage]);
    setNewMessage("");
    focusMessageInput();
    setShowEmojiPicker(false);
    setIsSending(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    try {
      const sentMsg = await sendMessageToAPI({ messageContent: messageText });
      setOriginalMessages((prev) => {
        const withoutTemp = prev.filter((m) => !m.isTemporary);
        if (!sentMsg) return withoutTemp;
        const alreadyHas = withoutTemp.some((m) => m.messageId && sentMsg.messageId && m.messageId === sentMsg.messageId);
        if (alreadyHas) return withoutTemp;
        return [...withoutTemp, {
          id: sentMsg.messageId || sentMsg._id || sentMsg.id,
          _id: sentMsg._id || sentMsg.id || null,
          messageId: sentMsg.messageId,
          text: sentMsg.content,
          sender: "user",
          senderRole: "user",
          time: new Date(sentMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          fullTime: sentMsg.createdAt,
          contentType: sentMsg.contentType,
          isRead: sentMsg.isRead,
          status: "sent",
          isCall: false,
        }];
      });

      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => !m.isTemporary);
        if (!sentMsg) return withoutTemp;
        const alreadyHas = withoutTemp.some((m) => m.messageId && sentMsg.messageId && m.messageId === sentMsg.messageId);
        if (alreadyHas) return withoutTemp;
        return [...withoutTemp, {
          id: sentMsg.messageId || sentMsg._id || sentMsg.id,
          _id: sentMsg._id || sentMsg.id || null,
          messageId: sentMsg.messageId,
          text: sentMsg.content,
          sender: "user",
          senderRole: "user",
          time: new Date(sentMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          fullTime: sentMsg.createdAt,
          contentType: sentMsg.contentType,
          isRead: sentMsg.isRead,
          status: "sent",
          isCall: false,
        }];
      });
    } catch (err) {
      console.error("Error in message sending flow:", err);
      const status = err?.response?.status;
      const serverError = err?.response?.data?.error || err?.response?.data?.message || "";
      const isBlocked = status === 403 && /restricted|blocked|unavailable/i.test(serverError);

      setMessages((prev) => prev.filter((msg) => msg.id !== tempUserMessage.id));

      if (isBlocked) {
        setBlockedPopup({ show: true, reason: serverError });
      } else {
        const errorMessage = {
          id: `error_${Date.now()}`,
          text: "⚠️ Failed to send message. Please check your internet connection and try again.",
          sender: "counselor",
          senderRole: "counsellor",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          fullTime: new Date().toISOString(),
          isError: true,
          status: "error",
          isCall: false,
        };
        setOriginalMessages((prev) => [...prev, errorMessage]);
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsSending(false);
      focusMessageInput();
    }
  };

  const initiateStreamCall = async (requestedCallType = "video") => {
    const normalizedMode = requestedCallType === "audio" || requestedCallType === "voice" ? "voice" : "video";
    if (!currentCounselor) {
      setCallError("Consultant information not available");
      return;
    }
    setInitiatingCallType(normalizedMode);
    setIsInitiatingCall(true);
    setCallError(null);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      const initiatorId = resolveCurrentUserId();
      const initiatorType = "user";
      const receiverId = resolveCounselorId();
      const receiverName = currentCounselor.name || "Consultant";
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
        
        setTimeout(() => fetchCallHistory(), 2000);
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
      setInitiatingCallType(null);
    }
  };

  const handleVideoCall = () => initiateStreamCall("video");
  const handleVoiceCall = () => initiateStreamCall("audio");
  const handleCloseModal = () => { setIsVideoModalOpen(false); setSelectedCall(null); setCallError(null); };

  const handleMenuItemClick = async (item) => {
    switch (item.id) {
      case 1:
        {
          const refreshed = await fetchMessagesFromAPI({ forceRefresh: true });
          if (refreshed) {
            window.dispatchEvent(new CustomEvent('chat:refresh-list'));
            setShouldScrollToBottom(true);
            requestAnimationFrame(() => scrollToBottom("smooth", true));
          } else {
            const translatedError = t('refresh_failed');
            alert(
              translatedError && translatedError !== 'refresh_failed'
                ? translatedError
                : 'Unable to refresh chat. Please check your connection and try again.',
            );
          }
        }
        break;
      case 2:
        handleClearChat();
        break;
      case 3:
        alert(t('feature_coming_soon') || 'Feature coming soon');
        break;
      case 4:
        alert(t('feature_coming_soon') || 'Feature coming soon');
        break;
      default:
        alert(`${item.label} clicked`);
    }
  };

  const handleClearChat = async () => {
    const confirmed = window.confirm(
      t('confirm_clear_chat') || 'Are you sure? This will delete all messages in this chat. You can start a new conversation after.'
    );
    if (!confirmed) return;

    try {
      setIsSending(true);
      const chatIdToUse = currentChat?._id || currentChat?.id || chatId;

      if (!chatIdToUse) {
        alert(t('error_chat_id_not_found') || 'Error: Chat ID not found');
        return;
      }

      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');

      const response = await axios.delete(
        `${API_BASE_URL}/api/chat/clear/${chatIdToUse}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Chat cleared successfully:', response.data);

      setMessages([]);
      setCallHistory([]);
      setNewMessage('');
      setChatStatus(null);

      const savedChats = JSON.parse(localStorage.getItem('activeChats') || '[]');
      const updatedChats = savedChats.map((c) => {
        if (c.id === currentChat?.id || c.id === chatId) {
          return {
            ...c,
            messages: [],
            unread: 0,
            status: 'active',
            lastMessage: null,
            lastMessageAt: null
          };
        }
        return c;
      });
      localStorage.setItem('activeChats', JSON.stringify(updatedChats));

      setCurrentChat(prev => prev ? {
        ...prev,
        messages: [],
        status: 'active',
        lastMessage: null,
        lastMessageAt: null
      } : null);

      alert(t('chat_cleared_restart') || 'Chat cleared! You can now start a new conversation.');
    } catch (error) {
      console.error('❌ Error clearing chat:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to clear chat';
      alert(t('error_clear_chat') || `Error: ${errorMsg}`);
    } finally {
      setIsSending(false);
      setShowOptions(false);
    }
  };

  const getMessageIdentifier = (message) => message?.messageId || message?._id || message?.id;

  const handleDeleteMessage = async (message) => {
    const messageId = getMessageIdentifier(message);
    if (!messageId || String(messageId).startsWith("temp_")) return;
    if (!window.confirm("Delete this message and its attachment?")) return;

    try {
      setDeletingMessageId(String(messageId));
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      await axios.delete(`${API_BASE_URL}/api/chat/message/${encodeURIComponent(messageId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const matchesDeletedMessage = (item) =>
        [item.id, item._id, item.messageId]
          .filter(Boolean)
          .map(String)
          .includes(String(messageId));
      setMessages((current) => current.filter((item) => !matchesDeletedMessage(item)));
      setOriginalMessages((current) => current.filter((item) => !matchesDeletedMessage(item)));
    } catch (error) {
      console.error("Error deleting chat message:", error);
      alert(error.response?.data?.error || error.response?.data?.message || "Failed to delete message");
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handleDeleteCall = async (call) => {
    const callIdToDelete = call?.callId || call?.id || call?._id;
    if (!callIdToDelete) {
      alert("This call cannot be deleted yet.");
      return;
    }

    if (!window.confirm("Delete this call history item?")) return;

    try {
      setDeletingCallId(String(callIdToDelete));
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");

      await axios.delete(`${API_BASE_URL}/api/video/calls/${encodeURIComponent(callIdToDelete)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const matchesDeletedCall = (item) =>
        String(item.callId || item.id || item._id) === String(callIdToDelete);

      setCallHistory((current) => current.filter((item) => !matchesDeletedCall(item)));
    } catch (error) {
      alert(error.response?.data?.error || error.response?.data?.message || "Failed to delete call");
    } finally {
      setDeletingCallId(null);
    }
  };

  // ─── Initialize Chat ──────────────────────────────────────────────────
  useEffect(() => {
    const initializeChat = async () => {
      try {
        const savedChats = JSON.parse(localStorage.getItem("activeChats") || "[]");
        const stateCounselorId = initialCounselor?.id || initialCounselor?._id;
        let chat =
          savedChats.find((c) => c.chatId === chatId || c.id === chatId) ||
          savedChats.find((c) => c.counselorId === (counselorId || stateCounselorId));
        if (chat) {
          const mergedCounselor = mergeCounselorProfiles(chat.counselor, initialCounselor);
          chat = { ...chat, counselor: mergedCounselor };
          setCurrentChat(chat);
          if (mergedCounselor) setCurrentCounselor(mergedCounselor);
          if (chat.unread) {
            const updatedChats = savedChats.map((c) => { if (c.id === chat.id) return { ...chat, unread: false }; return c; });
            localStorage.setItem("activeChats", JSON.stringify(updatedChats));
          } else {
            const updatedChats = savedChats.map((c) => c.id === chat.id ? chat : c);
            localStorage.setItem("activeChats", JSON.stringify(updatedChats));
          }
        } else if (initialCounselor) {
          const newChat = {
            id: Date.now(),
            chatId: chatId || `chat_${Date.now()}`,
            counselorId: counselorId || stateCounselorId,
            counselor: normalizeCounselor(initialCounselor),
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

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  // ─── Socket Connection ──────────────────────────────────────────────────
  useEffect(() => {
    const apiChatId = getChatIdForAPI();
    if (!apiChatId) return;

    let mounted = true;

    const isCurrentChatMessage = (messageData = {}) => {
      const incomingIds = [
        messageData.chatId,
        messageData.publicChatId,
        messageData.chat?._id,
        messageData.chat?.id,
        messageData.chat?.chatId,
      ].filter(Boolean).map(String);
      const currentIds = [
        apiChatId,
        currentChat?.id,
        currentChat?._id,
        currentChat?.chatId,
      ].filter(Boolean).map(String);
      return incomingIds.length === 0 || incomingIds.some((id) => currentIds.includes(id));
    };

    const onNewMessage = (rawMessageData) => {
      if (!mounted) return;
      const messageData = rawMessageData?.message
        ? {
            ...rawMessageData.message,
            chatId: rawMessageData.message.chatId || rawMessageData.chatId,
            publicChatId: rawMessageData.message.publicChatId || rawMessageData.publicChatId,
          }
        : rawMessageData;
      if (!isCurrentChatMessage(messageData)) return;
      const userId = resolveCurrentUserId();
      if (messageData.senderRole === "user" && String(messageData.senderId) === String(userId)) {
        setMessages((prev) => prev.filter((msg) => !msg.isTemporary));
        return;
      }
      const transformedMessage = {
        id: messageData.messageId || messageData._id || messageData.id || `rt_${Date.now()}`,
        _id: messageData._id || messageData.id || null,
        messageId: messageData.messageId,
        text: messageData.content,
        sender: messageData.senderRole === "user" ? "user" : "counselor",
        senderRole: messageData.senderRole,
        time: new Date(messageData.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        fullTime: messageData.createdAt,
        contentType: messageData.contentType,
        isRead: messageData.isRead,
        status: "sent",
        isCall: false,
      };
      setOriginalMessages((prev) => {
        const isDuplicate = prev.some((msg) => msg.messageId && messageData.messageId && msg.messageId === messageData.messageId);
        if (isDuplicate) return prev;
        return [...prev, transformedMessage];
      });

      setMessages((prev) => {
        const isDuplicate = prev.some((msg) => msg.messageId && messageData.messageId && msg.messageId === messageData.messageId);
        if (isDuplicate) return prev;
        return [...prev, transformedMessage];
      });
    };

    const onTyping = ({ userRole, isTyping: typing }) => {
      if (!mounted) return;
      if (userRole !== "user") setRemoteIsTyping(typing);
    };

    const onMessagesRead = () => {
      if (!mounted) return;
      setMessages((prev) => prev.map((msg) => msg.sender === "user" ? { ...msg, isRead: true } : msg));
    };

    const closeCallUi = () => {
      setIsVideoModalOpen(false);
      setSelectedCall(null);
      setShowIncomingModal(false);
      setIncomingCallData({
        name: "",
        image: null,
        callId: "",
        roomId: "",
        callType: "video",
      });
      stopRinging();
    };

    const onCallRejected = (payload) => {
      if (!mounted) return;
      const declinedBy = payload?.by ? ` by ${payload.by}` : "";
      setCallError(`Call was declined${declinedBy}.`);
      closeCallUi();
      fetchCallHistory();
    };

    const onCallStatusUpdate = ({ status }) => {
      if (!mounted) return;
      const normalizedStatus = String(status || "").toLowerCase();
      if (normalizedStatus === "active" || normalizedStatus === "accepted" || normalizedStatus === "connected") {
        setSelectedCall((previous) =>
          previous ? { ...previous, status: "active" } : previous,
        );
        setIsVideoModalOpen(true);
        return;
      }
      if (normalizedStatus === "rejected" || normalizedStatus === "ended" || normalizedStatus === "cancelled" || normalizedStatus === "canceled" || normalizedStatus === "expired") {
        closeCallUi();
        fetchCallHistory();
      }
    };

    const onCallAccepted = (payload = {}) => {
      if (!mounted) return;
      setSelectedCall((previous) => {
        if (!previous) return previous;
        const previousId = previous.callId || previous.id || previous._id;
        if (payload.callId && previousId && String(payload.callId) !== String(previousId)) {
          return previous;
        }
        setCallError(null);
        setIsVideoModalOpen(true);
        return {
          ...previous,
          roomId: payload.roomId || previous.roomId,
          status: "active",
        };
      });
    };

    const onCallTerminated = (payload = {}) => {
      if (!mounted) return;
      closeCallUi();
      fetchCallHistory();
    };

    const onChatStatusUpdate = ({ status }) => {
      if (!mounted) return;
      setChatStatus(status);
      setCurrentChat((prev) => (prev ? { ...prev, status } : prev));
    };

    const onPresenceUpdate = (payload = {}) => {
      const counselorId = resolveCounselorId();
      const presenceUserId = getPresenceUserId(payload);
      const presence = getPresence(payload);
      if (String(presenceUserId) === String(counselorId)) {
        console.log(`[Chat Presence] Counselor ${presenceUserId} is now ${presence.isOnline ? 'ONLINE' : 'OFFLINE'}`);
        setCurrentCounselor((prev) =>
          prev
            ? {
                ...prev,
                online: presence.isOnline,
                isOnline: presence.isOnline,
                lastSeen: resolveOfflineLastSeen(presence, prev.lastSeen),
              }
            : prev,
        );
      }
    };

    const onConnectError = (err) => {
      console.error("Chat socket connection error:", err.message);
    };

    socketService.connect().then((socket) => {
      if (!mounted) return;
      chatSocketRef.current = socket;
      socket.emit("join-chat", { chatId: apiChatId });
      socket.on("new-message", onNewMessage);
      socket.on("message-notification", onNewMessage);
      socket.on("user-typing", onTyping);
      socket.on("messages-read", onMessagesRead);
      socket.on("call_rejected", onCallRejected);
      socket.on("call_accepted", onCallAccepted);
      socket.on("call-status-update", onCallStatusUpdate);
      socket.on("call_ended", onCallTerminated);
      socket.on("call-ended", onCallTerminated);
      socket.on("call_cancelled", onCallTerminated);
      socket.on("call_expired", onCallTerminated);
      socket.on("chat-status-update", onChatStatusUpdate);
      socket.on("presence-update", onPresenceUpdate);
      socket.on("connect_error", onConnectError);
    }).catch((err) => {
      console.error("[ChatBox] Socket connect failed:", err.message);
    });

    return () => {
      mounted = false;
      const socket = chatSocketRef.current;
      if (socket) {
        socket.off("new-message", onNewMessage);
        socket.off("message-notification", onNewMessage);
        socket.off("user-typing", onTyping);
        socket.off("messages-read", onMessagesRead);
        socket.off("call_rejected", onCallRejected);
        socket.off("call_accepted", onCallAccepted);
        socket.off("call-status-update", onCallStatusUpdate);
        socket.off("call_ended", onCallTerminated);
        socket.off("call-ended", onCallTerminated);
        socket.off("call_cancelled", onCallTerminated);
        socket.off("call_expired", onCallTerminated);
        socket.off("chat-status-update", onChatStatusUpdate);
        socket.off("presence-update", onPresenceUpdate);
        socket.off("connect_error", onConnectError);
      }
      chatSocketRef.current = null;
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

  // ─── Render Call Item ──────────────────────────────────────────────────
  const renderCallItem = (call) => {
    const isOutgoing = call.direction === "outgoing";
    const callType = normalizeCallType(call.callType || call.type);
    const callLabel = callType === "video" ? "Video" : "Voice";
    const callIcon = callType === "video" ? <FaVideo aria-hidden="true" /> : <FaPhoneAlt aria-hidden="true" />;
    
    let statusText = "";
    let statusIcon = "";
    let statusColor = "#667781";
    
    if (call.status === "completed" || call.status === "active") {
      if (isOutgoing) {
        statusText = "Call ended";
        statusIcon = <FaPhoneAlt aria-hidden="true" />;
        statusColor = "#667781";
      } else {
        statusText = "Call ended";
        statusIcon = <FaPhoneAlt aria-hidden="true" />;
        statusColor = "#667781";
      }
    } else if (call.status === "missed") {
      statusText = "Missed call";
      statusIcon = "❌";
      statusColor = "#d32f2f";
    } else if (call.status === "rejected") {
      if (isOutgoing) {
        statusText = "Cancelled";
        statusIcon = <FaPhoneAlt aria-hidden="true" />;
        statusColor = "#667781";
      } else {
        statusText = "Declined";
        statusIcon = <FaPhoneAlt aria-hidden="true" />;
        statusColor = "#667781";
      }
    } else if (call.status === "cancelled" || call.status === "canceled") {
      statusText = "Cancelled";
      statusIcon = <FaPhoneAlt aria-hidden="true" />;
      statusColor = "#667781";
    } else if (call.status === "ringing" || call.status === "waiting" || call.status === "pending" || call.status === "requested") {
      statusText = "Calling...";
      statusIcon = "⏳";
      statusColor = "#f57c00";
    } else {
      statusText = call.status || "Call";
      statusIcon = <FaPhoneAlt aria-hidden="true" />;
      statusColor = "#667781";
    }

    let durationText = "";
    if (call.duration && call.duration > 0) {
      const mins = Math.floor(call.duration / 60);
      const secs = call.duration % 60;
      if (mins > 0) {
        durationText = ` (${mins}m ${secs}s)`;
      } else {
        durationText = ` (${secs}s)`;
      }
    }
    const callTone = getCallHistoryTone(call);
    const primaryCallColor = "#334155";
    const callStatusColor = callTone.variant === "missed" ? callTone.color : statusColor;

    return (
      <article className={`chatMsgBubble ${isOutgoing ? "chatMsgRight" : "chatMsgLeft"}`}>
        <div className="chatMsgContent call-item" style={{
          background: "#ffffff",
          border: "1px solid #e9edef",
          borderLeft: `4px solid ${callTone.borderColor}`,
          borderRadius: "8px",
          padding: "8px 12px",
          maxWidth: "300px",
        }}>
          <div className="call-item-content" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px", color: primaryCallColor }}>{callIcon}</span>
            <div className="call-info" style={{ flex: 1 }}>
              <div style={{ fontWeight: "500", fontSize: "14px", color: primaryCallColor }}>
                {isOutgoing ? "Outgoing" : "Incoming"} {callLabel} call
              </div>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "4px",
                fontSize: "12px",
                color: primaryCallColor
              }}>
                <span style={{ color: callStatusColor }}>{statusIcon}</span>
                <span style={{ color: callStatusColor }}>{statusText}</span>
                {durationText && <span>{durationText}</span>}
              </div>
            </div>
            <span className="chatMsgTimestamp" style={{ 
              fontSize: "11px", 
              color: "#64748b",
              alignSelf: "flex-end"
            }}>
              {call.time}
            </span>
            <button
              type="button"
              className="message-delete-btn"
              onClick={() => handleDeleteCall(call)}
              disabled={String(deletingCallId) === String(call.callId || call.id || call._id)}
              aria-label="Delete call"
              title="Delete call"
            >
              {String(deletingCallId) === String(call.callId || call.id || call._id) ? (
                <span className="delete-loading">⌛</span>
              ) : (
                <span className="delete-icon">🗑️</span>
              )}
            </button>
          </div>
        </div>
      </article>
    );
  };

  // ─── FIXED: Render Message Content ────────────────────────────────────
  const isImageMessage = (item) => {
    const contentType = String(item.contentType || "").toLowerCase();
    const mimeType = String(item.attachmentMimeType || "").toLowerCase();
    const url = String(item.attachmentUrl || "");
    const name = String(item.attachmentName || item.text || "");

    return (
      contentType === "image" ||
      contentType.startsWith("image/") ||
      mimeType.startsWith("image/") ||
      url.startsWith("data:image") ||
      url.startsWith("blob:") ||
      /\.(jpg|jpeg|png|gif|webp|bmp|svg|heic|heif)(\?|$)/i.test(url) ||
      /\.(jpg|jpeg|png|gif|webp|bmp|svg|heic|heif)$/i.test(name)
    );
  };

  const getDisplayMessageText = (item, isImage) => {
    const text = String(item.text || "");
    if (!isImage || !text) return text;

    const attachmentName = String(item.attachmentName || "");
    const normalizedText = text.replace(/^📎\s*/, "").trim();
    const isFilenameOnly =
      normalizedText === attachmentName ||
      (attachmentName && normalizedText.endsWith(attachmentName) && normalizedText.length <= attachmentName.length + 4) ||
      /^photo_\d+\.(jpg|jpeg|png|webp|heic|heif)$/i.test(normalizedText) ||
      /^image_\d+\.(jpg|jpeg|png|webp|heic|heif)$/i.test(normalizedText);

    return isFilenameOnly ? "" : text;
  };

  const renderMessageContent = (item) => {
    const isImage = isImageMessage(item);
    const displayText = getDisplayMessageText(item, isImage);

    // Check if it's a file (non-image)
    const isFile = item.contentType === "FILE" || 
                   (item.attachmentUrl && !isImage && !item.contentType?.startsWith("IMAGE"));

    // Check if it's an image with an attachment URL
    if (isImage && item.attachmentUrl) {
      return (
        <div className="message-image-wrapper">
          <img 
            src={item.attachmentUrl} 
            alt={item.attachmentName || "Shared image"} 
            className="chatMsgImage"
            loading="lazy"
            style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
            onError={(e) => {
              e.target.style.display = 'none';
              const parent = e.target.parentElement;
              if (parent) {
                const fallback = document.createElement('div');
                fallback.className = 'message-text';
                fallback.textContent = `📷 ${item.attachmentName || 'Image'}`;
                parent.appendChild(fallback);
              }
            }}
          />
          {displayText && (
            <div className="message-text" style={{ marginTop: '4px' }}>
              <TranslatedMessage text={displayText} translate={translate} lang={lang} />
            </div>
          )}
        </div>
      );
    }

    // File attachment (non-image)
    if (isFile && item.attachmentUrl) {
      return (
        <div className="message-file-wrapper">
          <div className="message-text file-attachment">
            📎 <a 
              href={item.attachmentUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="chatMsgAttachmentLink"
              style={{ color: '#075e54', textDecoration: 'underline' }}
            >
              {item.attachmentName || item.text || 'Attachment'}
            </a>
          </div>
          {displayText && displayText !== item.attachmentName && (
            <div className="message-text" style={{ marginTop: '4px' }}>
              <TranslatedMessage text={displayText} translate={translate} lang={lang} />
            </div>
          )}
        </div>
      );
    }

    // Regular text message
    return (
      <div className="message-text">
        <TranslatedMessage text={item.text} translate={translate} lang={lang} />
      </div>
    );
  };

  // ─── FIXED: File Selection Handler ────────────────────────────────────
  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file || isSending) return;

    // Handle camera capture separately
    if (e.target === cameraInputRef.current) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
      return;
    }

    // Handle regular file upload
    const isImage = file.type.startsWith("image/");
    
    // Create temporary message with local preview
    const tempFileMessage = {
      id: `temp_file_${Date.now()}`,
      text: isImage ? "📷 Image" : `📎 ${file.name}`,
      sender: "user",
      senderRole: "user",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      fullTime: new Date().toISOString(),
      contentType: isImage ? "IMAGE" : "FILE",
      attachmentUrl: isImage ? URL.createObjectURL(file) : null,
      attachmentName: file.name,
      attachmentMimeType: file.type,
      status: "sending",
      isTemporary: true,
      isCall: false,
    };
    
    setMessages((prev) => [...prev, tempFileMessage]);
    setIsSending(true);
    
    try {
      const sentMsg = await sendMessageToAPI({ file });
      
      // Replace temporary with actual message from server
      setMessages((prev) => {
        const withoutTemp = prev.filter((msg) => !msg.isTemporary);
        if (!sentMsg) return withoutTemp;
        
        const alreadyHas = withoutTemp.some(
          (m) => m.messageId && sentMsg.messageId && m.messageId === sentMsg.messageId
        );
        if (alreadyHas) return withoutTemp;
        
        // IMPORTANT: Keep the image preview URL
        const newMessage = {
          id: sentMsg.messageId || sentMsg._id || sentMsg.id,
          _id: sentMsg._id || sentMsg.id || null,
          messageId: sentMsg.messageId,
          text: sentMsg.content || (isImage ? "📷 Image" : `📎 ${file.name}`),
          sender: "user",
          senderRole: "user",
          time: new Date(sentMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          fullTime: sentMsg.createdAt,
          contentType: sentMsg.contentType || (isImage ? "IMAGE" : "FILE"),
          // Use server URL if available, otherwise keep local preview
          attachmentUrl: sentMsg.attachmentUrl || (isImage ? URL.createObjectURL(file) : null),
          attachmentName: sentMsg.attachmentName || file.name,
          attachmentMimeType: sentMsg.attachmentMimeType || file.type,
          isRead: sentMsg.isRead,
          status: "sent",
          isCall: false,
        };
        
        return [...withoutTemp, newMessage];
      });
      
      // Update originalMessages for localStorage
      setOriginalMessages((prev) => {
        const withoutTemp = prev.filter((msg) => !msg.isTemporary);
        if (!sentMsg) return withoutTemp;
        const alreadyHas = withoutTemp.some(
          (m) => m.messageId && sentMsg.messageId && m.messageId === sentMsg.messageId
        );
        if (alreadyHas) return withoutTemp;
        const newMessage = {
          id: sentMsg.messageId || sentMsg._id || sentMsg.id,
          _id: sentMsg._id || sentMsg.id || null,
          messageId: sentMsg.messageId,
          text: sentMsg.content || (isImage ? "📷 Image" : `📎 ${file.name}`),
          sender: "user",
          senderRole: "user",
          time: new Date(sentMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          fullTime: sentMsg.createdAt,
          contentType: sentMsg.contentType || (isImage ? "IMAGE" : "FILE"),
          attachmentUrl: sentMsg.attachmentUrl || (isImage ? URL.createObjectURL(file) : null),
          attachmentName: sentMsg.attachmentName || file.name,
          attachmentMimeType: sentMsg.attachmentMimeType || file.type,
          isRead: sentMsg.isRead,
          status: "sent",
          isCall: false,
        };
        const updated = [...withoutTemp, newMessage];
        return updated;
      });
      
    } catch (error) {
      console.error("Error sending file:", error);
      setMessages((prev) => prev.map((msg) => 
        msg.id === tempFileMessage.id 
          ? { ...msg, status: "error", error: "Failed to send file" } 
          : msg
      ));
    } finally {
      setIsSending(false);
      e.target.value = "";
      // Revoke object URL after a delay to free memory
      setTimeout(() => {
        if (tempFileMessage.attachmentUrl && tempFileMessage.attachmentUrl.startsWith('blob:')) {
          URL.revokeObjectURL(tempFileMessage.attachmentUrl);
        }
      }, 5000);
    }
  };

  const handleSendPhoto = async () => {
    if (!photoPreview) return;
    setPhotoSending(true);
    try {
      const base64Data = photoPreview.split(",")[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "image/jpeg" });
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
      
      // Show temporary message with local preview
      const tempFileMessage = {
        id: `temp_photo_${Date.now()}`,
        text: "",
        sender: "user",
        senderRole: "user",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        fullTime: new Date().toISOString(),
        contentType: "IMAGE",
        attachmentUrl: photoPreview,
        attachmentName: file.name,
        attachmentMimeType: file.type,
        status: "sending",
        isTemporary: true,
        isCall: false,
      };
      setMessages((prev) => [...prev, tempFileMessage]);
      setOriginalMessages((prev) => [...prev, tempFileMessage]);
      
      const sentMsg = await sendMessageToAPI({ file });
      
      // Replace temporary with actual message
      setMessages((prev) => {
        const withoutTemp = prev.filter((msg) => !msg.isTemporary);
        if (!sentMsg) return withoutTemp;
        const alreadyHas = withoutTemp.some(
          (m) => m.messageId && sentMsg.messageId && m.messageId === sentMsg.messageId
        );
        if (alreadyHas) return withoutTemp;
        return [
          ...withoutTemp,
          {
            id: sentMsg.messageId || sentMsg._id || sentMsg.id,
            _id: sentMsg._id || sentMsg.id || null,
            messageId: sentMsg.messageId,
            text: sentMsg.content || "",
            sender: "user",
            senderRole: "user",
            time: new Date(sentMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            fullTime: sentMsg.createdAt,
            contentType: sentMsg.contentType || "IMAGE",
            attachmentUrl: sentMsg.attachmentUrl || photoPreview,
            attachmentName: sentMsg.attachmentName || file.name,
            attachmentMimeType: sentMsg.attachmentMimeType || file.type,
            isRead: sentMsg.isRead,
            status: "sent",
            isCall: false,
          },
        ];
      });
      
      setOriginalMessages((prev) => {
        const withoutTemp = prev.filter((msg) => !msg.isTemporary);
        if (!sentMsg) return withoutTemp;
        const alreadyHas = withoutTemp.some(
          (m) => m.messageId && sentMsg.messageId && m.messageId === sentMsg.messageId
        );
        if (alreadyHas) return withoutTemp;
        return [
          ...withoutTemp,
          {
            id: sentMsg.messageId || sentMsg._id || sentMsg.id,
            _id: sentMsg._id || sentMsg.id || null,
            messageId: sentMsg.messageId,
            text: sentMsg.content || "",
            sender: "user",
            senderRole: "user",
            time: new Date(sentMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            fullTime: sentMsg.createdAt,
            contentType: sentMsg.contentType || "IMAGE",
            attachmentUrl: sentMsg.attachmentUrl || photoPreview,
            attachmentName: sentMsg.attachmentName || file.name,
            attachmentMimeType: sentMsg.attachmentMimeType || file.type,
            isRead: sentMsg.isRead,
            status: "sent",
            isCall: false,
          },
        ];
      });

      setPhotoPreview(null);
    } catch (error) {
      console.error('Error sending photo:', error);
      alert('Failed to send photo. Please try again.');
    } finally {
      setPhotoSending(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey && !isSending) { e.preventDefault(); handleSendMessage(); focusMessageInput(); } };
  const handleSendButtonClick = (e) => { e.preventDefault(); handleSendMessage(); focusMessageInput(); };
  const addEmoji = (emoji) => { setNewMessage((prev) => prev + emoji); focusMessageInput(); };
  const emojis = ["😊", "😂", "🥰", "😎", "😢", "😡", "👍", "👋", "❤️", "🎉", "🙏", "💪"];
  const optionsMenuItems = useMemo(() => [
    { id: 1, label: t('refresh_messages'), icon: "🔄" },
    { id: 2, label: t('clear_chat'), icon: "🗑️" },
    { id: 3, label: t('report_issue'), icon: "⚠️" },
    { id: 4, label: t('chat_details'), icon: "📋" }
  ], [lang]);
  const handleFileAttach = () => { if (isSending) return; fileInputRef.current?.click(); };

  // ─── Camera Functions ──────────────────────────────────────────────────────
  const handleCameraClick = () => {
    if (isSending) return;
    
    const hasCamera = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    
    if (!hasCamera) {
      alert('Camera is not supported on this device. Please use the attachment option to share images.');
      return;
    }
    
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (isMobile) {
      cameraInputRef.current?.click();
    } else {
      openDesktopCamera();
    }
  };

  const openDesktopCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      setCameraStream(stream);
      setShowCameraPreview(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => console.error('Video play error:', err));
        }
      }, 100);
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      if (error.name === 'NotAllowedError') {
        alert('Camera access was denied. Please allow camera access in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        alert('No camera found on this device. Please use the attachment option.');
      } else {
        alert('Failed to access camera. Please use the attachment option instead.');
      }
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) {
      alert('Camera not ready. Please try again.');
      return;
    }
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      alert('Camera not ready. Please wait a moment and try again.');
      return;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPhotoPreview(imageDataUrl);
    
    closeCamera();
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraPreview(false);
  };

  const renderCameraPreview = () => {
    if (!showCameraPreview) return null;
    
    return (
      <div className="camera-preview-overlay" onClick={closeCamera}>
        <div className="camera-preview-content" onClick={(e) => e.stopPropagation()}>
          <div className="camera-video-wrapper">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline
              muted
              className="camera-preview-video"
            />
            <div className="camera-guide-frame">
              <div className="camera-guide-corners">
                <span className="corner tl"></span>
                <span className="corner tr"></span>
                <span className="corner bl"></span>
                <span className="corner br"></span>
              </div>
            </div>
          </div>
          <div className="camera-preview-actions">
            <button 
              className="camera-capture-btn"
              onClick={capturePhoto}
              disabled={photoSending}
            >
              {photoSending ? '⏳ Sending...' : '📸 Capture'}
            </button>
            <button 
              className="camera-close-btn"
              onClick={closeCamera}
            >
              ✕ Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderProfileAvatar = (counselor, size = "md") => {
    if (!counselor) return <div className={`chat-profile-initials-${size}`}>?</div>;
    const profilePhotoUrl = getProfilePhotoUrl(counselor);
    if (profilePhotoUrl) {
      return <img src={profilePhotoUrl} alt={counselor.name || "Consultant"} className={`chat-profile-image-${size}`} onError={(e) => { e.target.style.display = "none"; e.target.parentElement.innerHTML = `<div class="chat-profile-initials-${size}">${getInitials(counselor.name || "Consultant")}</div>`; }} />;
    }
    return <div className={`chat-profile-initials-${size}`}>{getInitials(counselor.name || "Consultant")}</div>;
  };

  const renderMessageStatus = (message) => {
    const statusForOwnMessage = message.sender === "user";
    
    let statusBadge = null;
    switch (statusForOwnMessage ? message.status : undefined) {
      case "sending": 
        statusBadge = <span className="message-status sending">⌛ Sending...</span>;
        break;
      case "sent": 
        statusBadge = <span className="message-status sent">✓ Sent</span>;
        break;
      case "error": 
        statusBadge = <span className="message-status error">⚠️ Failed</span>;
        break;
      default: 
        statusBadge = null;
    }

    const showDeleteIcon = !message.isTemporary && 
                          message.status !== "error" &&
                          message.status !== "sending";

    return (
      <div className="message-status-container">
        {statusBadge}
        {showDeleteIcon && (
          <button
            type="button"
            className="message-delete-btn"
            onClick={() => handleDeleteMessage(message)}
            disabled={String(deletingMessageId) === String(getMessageIdentifier(message))}
            aria-label="Delete message"
            title="Delete message"
          >
            {String(deletingMessageId) === String(getMessageIdentifier(message)) ? (
              <span className="delete-loading">⌛</span>
            ) : (
              <span className="delete-icon">🗑️</span>
            )}
          </button>
        )}
      </div>
    );
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

  const counselorName = normalizeCounselor(currentCounselor)?.name || "Consultant";
  const counselorSpecialization =
    normalizeCounselor(currentCounselor)?.specialization || t('counselor') || "Consultant";
  const counselorPresence = getPresence(currentCounselor);
  const counselorOnline = counselorPresence.isOnline;
  const counselorPresenceText = formatPresenceText(counselorPresence, {
    onlineText: t('online') || "Online",
    offlineText: t('offline') || "Offline",
  });

  const handleInputChange = (e) => { setNewMessage(e.target.value); setIsTyping(e.target.value.trim() !== ""); if (e.target.value.trim() !== "") handleTypingIndicator(); };

  // ─── Render ──────────────────────────────────────────────────────────
  const mergedTimeline = getMergedTimeline();
  const normalizedConversationSearch = conversationSearch.trim().toLowerCase();
  const visibleTimeline = normalizedConversationSearch
    ? mergedTimeline.filter((item) =>
        [
          item.content,
          item.message,
          item.text,
          item.attachmentName,
          item.callType,
          item.type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedConversationSearch),
      )
    : mergedTimeline;
  return (
    <div className={`chatContainerFull ${embedded ? "chatEmbedded" : ""}`}>
      <div className="chatBoxMain">
        <div className="chatConversationSearch">
          <FaSearch aria-hidden="true" />
          <input
            type="search"
            value={conversationSearch}
            onChange={(event) => setConversationSearch(event.target.value)}
            placeholder="Search messages in this conversation..."
            aria-label="Search messages in this conversation"
          />
        </div>

        <header className="chatBoxHeader">
          <div className="chatBoxHeaderLeft">
            <button onClick={handleBackClick} className={isMobile ? "chatMobileHeaderBack" : "chatDesktopHeaderBack"} aria-label="Go back" title="Go back">
              <FaArrowLeft />
            </button>
            <div className="chatUserDetails">
              <div className="chatProfilePic" aria-label="Consultant profile picture">
                {renderProfileAvatar(currentCounselor, "md")}
                <span className={`chatActiveDot ${counselorOnline ? "chatActiveOnline" : "chatActiveOffline"}`} />
              </div>
              <div className="chatProfileInfo">
                <h2 className="chatProfileName">{counselorName}</h2>
                <p className="chatProfileStatus">
                  <span className="chatStatusText">{counselorSpecialization}</span>
                  <span className={`chatHeaderPresence ${counselorOnline ? "online" : ""}`}>
                    {counselorPresenceText}
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className="chatBoxHeaderRight">
            <button className={`chatActionBtn chatVideoBtn ${isInitiatingCall ? "disabled" : ""}`} onClick={handleVideoCall} disabled={isInitiatingCall} aria-label="Video call">
              <span className="chatBtnIcon" aria-hidden="true">{initiatingCallType === "video" ? <FaSpinner className="spinning" /> : <FaVideo />}</span>
              <span className="chatBtnTooltip">{t('video_call_tooltip')}</span>
            </button>
            <button className={`chatActionBtn chatAudioBtn ${isInitiatingCall ? "disabled" : ""}`} onClick={handleVoiceCall} disabled={isInitiatingCall} aria-label="Voice call">
              <span className="chatBtnIcon" aria-hidden="true">{initiatingCallType === "voice" ? <FaSpinner className="spinning" /> : <FaPhoneAlt />}</span>
              <span className="chatBtnTooltip">{t('voice_call_tooltip')}</span>
            </button>
            <div className="chatMoreOptions" ref={optionsRef}>
              <button className="chatActionBtn" onClick={() => setShowOptions(!showOptions)} aria-label="More options" aria-expanded={showOptions}>
                <FaHistory className="chatHistoryIcon" aria-hidden="true" />
                <span className="chatBtnIcon" aria-hidden="true">⋮</span>
              </button>
              {showOptions && (
                <div className="chatDropdownMenu" role="menu">
                  {optionsMenuItems.filter((item) => item.id === 2).map((item) => (
                    <button key={item.id} className="chatDropdownItem" onClick={() => { setShowOptions(false); handleMenuItemClick(item); }} role="menuitem">
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
          {isLoadingMessages && mergedTimeline.length === 0 ? (
            <div className="chatLoadingMessages">
              <p>{t('loading_messages')}</p>
            </div>
          ) : visibleTimeline.length === 0 ? (
            <div className="chatEmptyState">
              <p>{normalizedConversationSearch ? "No matching messages found." : "No messages yet. Start a conversation!"}</p>
            </div>
          ) : (
            <>
              {visibleTimeline.map((item, index) => (
                <React.Fragment key={item.id || `item_${index}`}>
                  {getMessageDayKey(item) !== getMessageDayKey(visibleTimeline[index - 1]) && formatMessageDay(item) && (
                    <div className="chatDateSeparator">{formatMessageDay(item)}</div>
                  )}
                  
                  {item.isCall ? (
                    renderCallItem(item)
                  ) : (
                    <article className={`chatMsgBubble ${item.sender === "user" ? "chatMsgRight" : "chatMsgLeft"} ${item.status === "error" ? "message-error" : ""}`}>
                      <div className="chatMsgContent">
                        {/* Use renderMessageContent for proper display */}
                        {renderMessageContent(item)}
                        <div className="chatMsgFooter">
                          <time className="chatMsgTimestamp">{item.time}</time>
                          {renderMessageStatus(item)}
                        </div>
                      </div>
                    </article>
                  )}
                </React.Fragment>
              ))}
              {remoteIsTyping && (
                <div className="chatConversationTyping" role="status">
                  <span></span><span></span><span></span>
                  <small>{counselorName} is typing...</small>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </main>

        {showEmojiPicker && (
          <div className="chatEmojiBox" ref={emojiPickerRef} role="dialog" aria-label="Emoji picker">
            <div className="emojiBoxHeader">
              <span className="emojiBoxTitle">{t("emoji")}</span>
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
            <input 
              ref={fileInputRef} 
              type="file" 
              className="chatHiddenFileInput" 
              onChange={handleFileSelected} 
              style={{ display: "none" }} 
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="chatHiddenFileInput"
              onChange={handleFileSelected}
              style={{ display: "none" }}
            />
            
            <button 
              className="chatAttachBtn" 
              onClick={handleFileAttach} 
              disabled={isSending} 
              aria-label="Attach file"
            >
              <FaPaperclip className="chatCorrectAttachIcon" aria-hidden="true" />
              <span className="attachIcon" aria-hidden="true">📎</span>
            </button>
            
            <button 
              className="chatCameraBtn" 
              onClick={handleCameraClick} 
              disabled={isSending} 
              aria-label="Take photo"
            >
              <FaCamera className="camera-icon" />
            </button>
            
            <div className="chatInputWrapper">
              <input 
                ref={messageInputRef} 
                id="messageInput" 
                type="text" 
                value={newMessage} 
                onChange={handleInputChange} 
                onKeyDown={handleKeyDown} 
                placeholder="Type your message..."
                className="chatTextInput" 
                autoComplete="off" 
                enterKeyHint="send" 
                aria-label="Message input" 
              />
              <button 
                className="chatEmojiBtn" 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                aria-label="Open emoji picker"
              >
                <FaSmile className="chatCorrectEmojiIcon" aria-hidden="true" />
                <span className="emojiIcon" aria-hidden="true">😊</span>
              </button>
            </div>
            
            <button 
              onMouseDown={(e) => e.preventDefault()} 
              onClick={handleSendButtonClick} 
              disabled={!newMessage.trim() || isSending} 
              className="chatSendBtn" 
              aria-label="Send message"
            >
              {isSending ? (
                <FaSpinner className="chatCorrectSendIcon spinning" aria-hidden="true" />
              ) : (
                <svg
                  className="chatCorrectSendIcon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M3.4 20.4 21.85 12 3.4 3.6l-.02 6.53L16.55 12 3.38 13.87z" />
                </svg>
              )}
              <span className="sendIcon" aria-hidden="true">
                {isSending ? "⏳" : "➤"}
              </span>
            </button>
          </div>
        </footer>
      </div>

      {renderCameraPreview()}

      <PhotoPreviewModal
        isOpen={!!photoPreview}
        photoSrc={photoPreview}
        onSend={handleSendPhoto}
        onCancel={() => setPhotoPreview(null)}
        loading={photoSending}
      />

      <VideoCallModal
        isOpen={isVideoModalOpen}
        onClose={handleCloseModal}
        callData={selectedCall}
        callMode={selectedCall?.callType || selectedCall?.type || "video"}
        currentUser={currentUser}
        onEndCall={handleEndCall}
      />

      <RatingModal
        visible={showRatingModal}
        counselorName={ratingTarget?.counselorName || currentCounselor?.name}
        counselorPhoto={ratingTarget?.counselorPhoto || getProfilePhotoUrl(currentCounselor)}
        submitting={ratingSubmitting}
        onSubmit={handleSubmitRating}
        onDismiss={handleDismissRating}
      />

      <IncomingCallModal
        isOpen={showIncomingModal}
        onClose={() => setShowIncomingModal(false)}
        callType={incomingCallData.callType}
        callerName={incomingCallData.name}
        callerImage={incomingCallData.image}
        callData={incomingCallData}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
        fallbackName="Consultant"
      />

      {blockedPopup.show && (
        <div
          onClick={() => setBlockedPopup({ show: false, reason: "" })}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999, padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 12, maxWidth: 380, width: "100%",
              padding: "24px 22px", boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 42, marginBottom: 8 }}>🚫</div>
            <h3 style={{ margin: "0 0 8px", color: "#c0392b", fontSize: 18 }}>
              Chat Unavailable
            </h3>
            <p style={{ margin: "0 0 16px", color: "#444", fontSize: 14, lineHeight: 1.5 }}>
              This counselor has been blocked by admin. You cannot send messages right now.
            </p>
            {blockedPopup.reason && (
              <p style={{ margin: "0 0 16px", color: "#888", fontSize: 12, fontStyle: "italic" }}>
                {blockedPopup.reason}
              </p>
            )}
            <button
              onClick={() => setBlockedPopup({ show: false, reason: "" })}
              style={{
                background: "#c0392b", color: "#fff", border: "none",
                padding: "10px 24px", borderRadius: 8, cursor: "pointer",
                fontSize: 14, fontWeight: 600,
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBox;
