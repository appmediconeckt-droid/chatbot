// // SMSInput.jsx - Fully Responsive Chat Interface with Zero Padding Issues on Mobile
// import React, { useState, useRef, useEffect, useCallback } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import axios from "axios";
// import { FaChevronDown, FaPhoneAlt, FaSpinner, FaVideo, FaCamera } from "react-icons/fa";
// import "./SMSInput.css";
// import { API_BASE_URL } from "../../../../axiosConfig";
// import socketService from "../../../../services/socketService";
// import VideoCallModal from "../../../UserDashboard/Tab/CallModal/VideoCallModal";
// import PhotoPreviewModal from "../../../common/PhotoPreviewModal/PhotoPreviewModal";
// import useRingtone from "../../../../hooks/useRingtone";
// import IncomingCallModal from "../../../common/IncomingCallModal/IncomingCallModal";
// import { useCounselorTranslation, useCounselorApiTranslation } from "../../../../i18n/LanguageContext";
// import {
//   formatPresenceText,
//   getPresence,
//   getPresenceUserId,
//   resolveOfflineLastSeen,
// } from "../../../../utils/presence";
// import { getAnonymousUserDisplay } from "../../../../utils/anonymousUser";
// import TranslatedMessage from "../../../common/TranslatedMessage";
// import ChatCallHistory from "../../../common/ChatCallHistory";

// const SMSInput = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { t, lang } = useCounselorTranslation();
//   const { translate } = useCounselorApiTranslation();
//   const [message, setMessage] = useState("");
//   const messagesEndRef = useRef(null);
//   const messagesContainerRef = useRef(null);
//   const fileInputRef = useRef(null);
//   const cameraInputRef = useRef(null);
//   const messageInputRef = useRef(null);
//   const chatSocketRef = useRef(null);
//   const typingTimeoutRef = useRef(null);
//   const [remoteIsTyping, setRemoteIsTyping] = useState(false);
//   const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
//   const isInitialLoadRef = useRef(true);

//   // Call modal states
//   const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
//   const [selectedCall, setSelectedCall] = useState(null);
//   const [isInitiatingCall, setIsInitiatingCall] = useState(false);
//   const [callError, setCallError] = useState(null);

//   // Receiving Call States
//   const [showIncomingModal, setShowIncomingModal] = useState(false);
//   const [incomingCallData, setIncomingCallData] = useState({
//     name: "",
//     avatar: "👤",
//     callId: "",
//     roomId: "",
//     callType: "video",
//   });
//   const { startRinging, stopRinging } = useRingtone();

//   // Message states
//   const [messages, setMessages] = useState([]);
//   const [originalMessages, setOriginalMessages] = useState([]);
//   const [isLoadingMessages, setIsLoadingMessages] = useState(false);
//   const [isSending, setIsSending] = useState(false);
//   const [error, setError] = useState(null);
//   const [chatStatus, setChatStatus] = useState(null);
//   const [photoPreview, setPhotoPreview] = useState(null);
//   const [photoSending, setPhotoSending] = useState(false);
//   const [deletingMessageId, setDeletingMessageId] = useState(null);
//   const [openMessageMenuId, setOpenMessageMenuId] = useState(null);
//   // Live desktop camera (getUserMedia), same flow as user-side ChatBox.
//   const [cameraStream, setCameraStream] = useState(null);
//   const [showCameraPreview, setShowCameraPreview] = useState(false);
//   const videoRef = useRef(null);

//   const handleSessionExpired = () => {
//     localStorage.clear();
//     sessionStorage.clear();
//     navigate("/role-selector", {
//       replace: true,
//       state: {
//         reason: "session-expired",
//         message:
//           "You were logged out because your account was used on another device.",
//       },
//     });
//   };

//   const focusMessageInput = () => {
//     const input = messageInputRef.current;
//     if (!input) return;
//     requestAnimationFrame(() => input.focus({ preventScroll: true }));
//     setTimeout(
//       () => messageInputRef.current?.focus({ preventScroll: true }),
//       50,
//     );
//   };

//   // Get selected user from navigation state
//   const selectedUser = location.state?.selectedUser;
//   const chatId = location.state?.chatId;
//   const selectedUserPresence = getPresence(selectedUser || {});
//   const [remotePresence, setRemotePresence] = useState({
//     isOnline: selectedUserPresence.isOnline,
//     lastSeen: selectedUserPresence.lastSeen,
//   });

//   const getCurrentCounselor = () => {
//     let counselorData = null;
//     const storedCounselor = localStorage.getItem("counselor");
//     if (storedCounselor) {
//       try {
//         counselorData = JSON.parse(storedCounselor);
//       } catch (e) {}
//     }
//     if (!counselorData) {
//       const sessionCounselor = sessionStorage.getItem("counselor");
//       if (sessionCounselor) {
//         try {
//           counselorData = JSON.parse(sessionCounselor);
//         } catch (e) {}
//       }
//     }
//     if (!counselorData) {
//       const userData =
//         localStorage.getItem("user") || localStorage.getItem("userData");
//       if (userData) {
//         try {
//           const user = JSON.parse(userData);
//           if (
//             user.role === "counselor" ||
//             user.role === "counsellor" ||
//             user.userType === "counselor"
//           ) {
//             counselorData = user;
//           }
//         } catch (e) {}
//       }
//     }
//     return counselorData;
//   };

//   const getCounselorId = () => {
//     if (currentCounselor) {
//       if (currentCounselor._id) return currentCounselor._id;
//       if (currentCounselor.id) return currentCounselor.id;
//       if (currentCounselor.counselorId) return currentCounselor.counselorId;
//     }
//     const storedId =
//       localStorage.getItem("counselorId") ||
//       localStorage.getItem("counsellorId");
//     if (storedId) return storedId;
//     const sessionId =
//       sessionStorage.getItem("counselorId") ||
//       sessionStorage.getItem("counsellorId");
//     if (sessionId) return sessionId;
//     return "69c679b6e0e8f0800ff08fd1";
//   };

//   const currentCounselor = getCurrentCounselor();
//   const COUNSELOR_ID = getCounselorId();
//   const COUNSELOR_NAME =
//     currentCounselor?.name || currentCounselor?.fullName || "Counselor";

//   const getSelectedUserId = () => {
//     if (!selectedUser) return null;
//     return (
//       selectedUser.receiverId ||
//       selectedUser._id ||
//       selectedUser.id ||
//       selectedUser.userId ||
//       selectedUser.user_id ||
//       selectedUser.user?._id ||
//       selectedUser.user?.id ||
//       selectedUser.user?.userId ||
//       selectedUser.otherParty?._id ||
//       selectedUser.otherParty?.id ||
//       null
//     );
//   };

//   const getUserDetails = () => {
//     const id = getSelectedUserId();
//     const anonymousDisplay = getAnonymousUserDisplay(selectedUser || {});
//     return {
//       id,
//       name:
//         selectedUser?.name ||
//         selectedUser?.fullName ||
//         selectedUser?.user?.name ||
//         selectedUser?.otherParty?.name ||
//         "User",
//       gender:
//         selectedUser?.gender ||
//         selectedUser?.user?.gender ||
//         selectedUser?.otherParty?.gender,
//       phone:
//         selectedUser?.phone ||
//         selectedUser?.phoneNumber ||
//         selectedUser?.user?.phone ||
//         selectedUser?.otherParty?.phone,
//       email:
//         selectedUser?.email ||
//         selectedUser?.user?.email ||
//         selectedUser?.otherParty?.email,
//       avatar:
//         anonymousDisplay.avatar ||
//         selectedUser?.avatar ||
//         selectedUser?.user?.avatar ||
//         selectedUser?.otherParty?.avatar,
//       avatarUrl:
//         anonymousDisplay.avatarUrl ||
//         selectedUser?.avatarUrl ||
//         selectedUser?.anonymousAvatarUrl ||
//         selectedUser?.profilePhoto?.url ||
//         selectedUser?.profilePhoto ||
//         selectedUser?.profilePic ||
//         selectedUser?.avatarImage ||
//         selectedUser?.user?.avatarUrl ||
//         selectedUser?.user?.anonymousAvatarUrl ||
//         selectedUser?.user?.profilePhoto?.url ||
//         selectedUser?.user?.profilePhoto ||
//         selectedUser?.user?.profilePic ||
//         selectedUser?.user?.avatarImage ||
//         selectedUser?.otherParty?.avatarUrl ||
//         selectedUser?.otherParty?.anonymousAvatarUrl ||
//         selectedUser?.otherParty?.profilePhoto?.url ||
//         selectedUser?.otherParty?.profilePhoto ||
//         selectedUser?.otherParty?.profilePic ||
//         selectedUser?.otherParty?.avatarImage,
//     };
//   };

//   const userDetails = getUserDetails();
//   const USER_ID = userDetails.id;
//   const USER_NAME = userDetails.name;
//   const remoteStatusClass = remotePresence.isOnline ? "online" : "offline";
//   const remotePresenceText = formatPresenceText(remotePresence, {
//     onlineText: t('online') || "Online",
//     offlineText: t('offline') || "Offline",
//   });

//   const getMessageDayKey = (messageItem) => {
//     const timestamp = messageItem?.fullTime || messageItem?.createdAt || messageItem?.timestamp;
//     const date = new Date(timestamp);
//     return Number.isNaN(date.getTime()) ? null : date.toDateString();
//   };

//   const formatMessageDay = (messageItem) => {
//     const timestamp = messageItem?.fullTime || messageItem?.createdAt || messageItem?.timestamp;
//     const date = new Date(timestamp);
//     if (Number.isNaN(date.getTime())) return null;
//     const today = new Date();
//     const yesterday = new Date(today);
//     yesterday.setDate(today.getDate() - 1);
//     if (date.toDateString() === today.toDateString()) return "Today";
//     if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
//     return date.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" });
//   };

//   useEffect(() => {
//     const presence = getPresence(selectedUser || {});
//     setRemotePresence({
//       isOnline: presence.isOnline,
//       lastSeen: presence.lastSeen,
//     });
//   }, [selectedUser]);

//   const getChatIdForAPI = () => {
//     const candidateChatId =
//       chatId ||
//       selectedUser?.chatId ||
//       selectedUser?.chat_id ||
//       selectedUser?.chat?.chatId ||
//       selectedUser?.chat?._id ||
//       selectedUser?.chat?.id;
//     if (candidateChatId) return candidateChatId;

//     const possibleId = selectedUser?.id || selectedUser?._id;
//     if (typeof possibleId === "string" && possibleId.startsWith("chat_")) {
//       return possibleId;
//     }

//     return null;
//   };

//   const fetchMessagesFromAPI = async () => {
//     if (!selectedUser) return;
//     try {
//       const apiChatId = getChatIdForAPI();
//       if (!apiChatId) {
//         setError("Chat ID not found");
//         return;
//       }
//       const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
//       setIsLoadingMessages(true);
//       setError(null);
//       const response = await axios.get(
//         `${API_BASE_URL}/api/chat/chat/${apiChatId}/messages`,
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: token ? `Bearer ${token}` : "",
//           },
//         },
//       );
//       if (response.data && response.data.messages) {
//         if (response.data.chatStatus) setChatStatus(response.data.chatStatus);
//         const transformedMessages = response.data.messages.map(
//           (msg, index) => ({
//             id: msg._id || msg.id || msg.messageId || index,
//             _id: msg._id || msg.id,
//             messageId: msg.messageId,
//             text: msg.content,
//             sender: msg.senderRole === "counsellor" ? "me" : "user",
//             senderRole: msg.senderRole,
//             time: new Date(msg.createdAt).toLocaleTimeString([], {
//               hour: "2-digit",
//               minute: "2-digit",
//             }),
//             fullTime: msg.createdAt,
//             contentType: msg.contentType,
//             attachmentUrl: msg.attachmentUrl || null,
//             attachmentName: msg.attachmentName || null,
//             isRead: msg.isRead,
//             status: "sent",
//           }),
//         );
//         setOriginalMessages(transformedMessages);
//         setMessages(transformedMessages);
//         saveMessagesToLocalStorage(transformedMessages);
//       }
//     } catch (error) {
//       console.error("Error fetching messages:", error);
//       if (error?.response?.status === 401) {
//         handleSessionExpired();
//         return;
//       }
//       loadMessagesFromLocalStorage();
//     } finally {
//       setIsLoadingMessages(false);
//     }
//   };

//   const saveMessagesToLocalStorage = (messagesToSave) => {
//     try {
//       const savedChats = JSON.parse(localStorage.getItem("smsChats") || "[]");
//       const chatIdToSave = getChatIdForAPI();
//       const existingChatIndex = savedChats.findIndex(
//         (chat) => chat.chatId === chatIdToSave,
//       );
//       const chatData = {
//         chatId: chatIdToSave,
//         userId: USER_ID,
//         userName: USER_NAME,
//         messages: messagesToSave,
//         chatStatus,
//         lastUpdated: new Date().toISOString(),
//       };
//       if (existingChatIndex >= 0) savedChats[existingChatIndex] = chatData;
//       else savedChats.push(chatData);
//       localStorage.setItem("smsChats", JSON.stringify(savedChats));
//     } catch (error) {}
//   };

//   const loadMessagesFromLocalStorage = () => {
//     try {
//       const savedChats = JSON.parse(localStorage.getItem("smsChats") || "[]");
//       const chatIdToLoad = getChatIdForAPI();
//       const savedChat = savedChats.find((chat) => chat.chatId === chatIdToLoad);
//       if (savedChat && savedChat.messages) {
//         setOriginalMessages(savedChat.messages);
//         setMessages(savedChat.messages);
//       }
//     } catch (error) {}
//   };

//   const sendMessageToAPI = async ({ messageContent = "", file = null }) => {
//     try {
//       const apiChatId = getChatIdForAPI();
//       if (!apiChatId) {
//         throw new Error("Chat ID not found");
//       }
//       const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
//       let response;
//       if (file) {
//         const formData = new FormData();
//         if (messageContent.trim())
//           formData.append("content", messageContent.trim());
//         formData.append("attachment", file);
//         response = await axios.post(
//           `${API_BASE_URL}/api/chat/chat/${apiChatId}/message`,
//           formData,
//           {
//             headers: { Authorization: token ? `Bearer ${token}` : "" },
//           },
//         );
//       } else {
//         response = await axios.post(
//           `${API_BASE_URL}/api/chat/chat/${apiChatId}/message`,
//           { content: messageContent },
//           {
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: token ? `Bearer ${token}` : "",
//             },
//           },
//         );
//       }
//       if (response.data && response.data.success) return response.data.message;
//       else throw new Error("Invalid API response");
//     } catch (error) {
//       console.error("Error sending message:", error);
//       if (error?.response?.status === 401) {
//         handleSessionExpired();
//       }
//       throw error;
//     }
//   };

//   const getMessageIdentifier = (msg) => msg?._id || msg?.id || msg?.messageId;

//   const removeMessageFromState = (messageToDelete) => {
//     const targetId = getMessageIdentifier(messageToDelete);
//     const isSameMessage = (msg) => {
//       const currentId = getMessageIdentifier(msg);
//       return currentId && targetId && String(currentId) === String(targetId);
//     };

//     setMessages((prev) => prev.filter((msg) => !isSameMessage(msg)));
//     setOriginalMessages((prev) => {
//       const updatedMessages = prev.filter((msg) => !isSameMessage(msg));
//       saveMessagesToLocalStorage(updatedMessages);
//       return updatedMessages;
//     });
//   };

//   const toggleMessageMenu = (msg) => {
//     const messageId = getMessageIdentifier(msg);
//     if (!messageId) return;
//     setOpenMessageMenuId((currentId) =>
//       String(currentId) === String(messageId) ? null : messageId,
//     );
//   };

//   const handleDeleteMessage = async (messageToDelete) => {
//     if (!selectedUser || isSending) return;

//     const messageId = getMessageIdentifier(messageToDelete);
//     if (!messageId || String(messageId).startsWith("temp_")) {
//       alert("This message cannot be deleted yet.");
//       return;
//     }

//     const confirmed = window.confirm("Are you sure you want to delete this message?");
//     if (!confirmed) return;

//     try {
//       setDeletingMessageId(messageId);
//       setOpenMessageMenuId(null);
//       setError(null);

//       const token = localStorage.getItem("token") || localStorage.getItem("accessToken");

//       const headers = {
//         "Content-Type": "application/json",
//         Authorization: token ? `Bearer ${token}` : "",
//       };
//       const encodedMessageId = encodeURIComponent(messageId);

//       await axios.delete(`${API_BASE_URL}/api/chat/message/${encodedMessageId}`, {
//         headers,
//       });

//       removeMessageFromState(messageToDelete);
//     } catch (error) {
//       console.error("Error deleting message:", error);
//       if (error?.response?.status === 401) {
//         handleSessionExpired();
//         return;
//       }
//       const errorMsg =
//         error.response?.data?.error ||
//         error.response?.data?.message ||
//         error.message ||
//         "Failed to delete message";
//       alert(errorMsg);
//     } finally {
//       setDeletingMessageId(null);
//       focusMessageInput();
//     }
//   };

//   const handleSendMessage = async (e) => {
//     e.preventDefault();
//     if (!message.trim() || !selectedUser || isSending) return;
//     const messageText = message.trim();
//     const tempMessage = {
//       id: `temp_${Date.now()}`,
//       text: messageText,
//       sender: "me",
//       senderRole: "counsellor",
//       time: new Date().toLocaleTimeString([], {
//         hour: "2-digit",
//         minute: "2-digit",
//       }),
//       createdAt: new Date().toISOString(),
//       status: "sending",
//       isTemporary: true,
//     };
//     setMessages((prev) => [...prev, tempMessage]);
//     setMessage("");
//     focusMessageInput();
//     setIsSending(true);
//     setError(null);
//     try {
//       const sentMsg = await sendMessageToAPI({ messageContent: messageText });
//       setMessages((prev) => {
//         const withoutTemp = prev.filter((m) => !m.isTemporary);
//         if (!sentMsg) return withoutTemp;
//         const alreadyHas = withoutTemp.some(
//           (m) =>
//             m.messageId &&
//             sentMsg.messageId &&
//             m.messageId === sentMsg.messageId,
//         );
//         if (alreadyHas) return withoutTemp;
//         return [
//           ...withoutTemp,
//           {
//             id: sentMsg._id || sentMsg.id || sentMsg.messageId,
//             _id: sentMsg._id || sentMsg.id,
//             messageId: sentMsg.messageId,
//             text: sentMsg.content,
//             sender: "me",
//             senderRole: "counsellor",
//             time: new Date(sentMsg.createdAt).toLocaleTimeString([], {
//               hour: "2-digit",
//               minute: "2-digit",
//             }),
//             fullTime: sentMsg.createdAt,
//             contentType: sentMsg.contentType,
//             isRead: sentMsg.isRead,
//             status: "sent",
//           },
//         ];
//       });
//     } catch (err) {
//       setMessages((prev) =>
//         prev.map((msg) =>
//           msg.id === tempMessage.id ? { ...msg, status: "error" } : msg,
//         ),
//       );
//       setError("Failed to send message");
//       setTimeout(
//         () =>
//           setMessages((prev) =>
//             prev.filter((msg) => msg.id !== tempMessage.id),
//           ),
//         3000,
//       );
//     } finally {
//       setIsSending(false);
//       focusMessageInput();
//     }
//   };

//   const handleInputKeyDown = (e) => {
//     if (e.key === "Enter" && !e.shiftKey && !isSending) {
//       e.preventDefault();
//       handleSendMessage(e);
//       focusMessageInput();
//     }
//   };

//   useEffect(() => {
//     if (!isSending) focusMessageInput();
//   }, [isSending]);

//   const handleFileAttachClick = () => {
//     if (isSending) return;
//     fileInputRef.current?.click();
//   };

//   // ─── Camera Functions (exact same logic as user-side ChatBox) ──────────────
//   const handleCameraClick = () => {
//     if (isSending) return;

//     const hasCamera =
//       navigator.mediaDevices && navigator.mediaDevices.getUserMedia;

//     if (!hasCamera) {
//       alert(
//         "Camera is not supported on this device. Please use the attachment option to share images."
//       );
//       return;
//     }

//     const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

//     if (isMobile) {
//       // On mobile, use the file input with capture
//       cameraInputRef.current?.click();
//     } else {
//       // On desktop, use getUserMedia API for live camera access
//       openDesktopCamera();
//     }
//   };

//   const openDesktopCamera = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: {
//           facingMode: "user",
//           width: { ideal: 1280 },
//           height: { ideal: 720 },
//         },
//       });

//       setCameraStream(stream);
//       setShowCameraPreview(true);

//       // Set video source after the overlay mounts.
//       setTimeout(() => {
//         if (videoRef.current) {
//           videoRef.current.srcObject = stream;
//           videoRef.current
//             .play()
//             .catch((err) => console.error("Video play error:", err));
//         }
//       }, 100);
//     } catch (error) {
//       console.error("Error accessing camera:", error);
//       if (error.name === "NotAllowedError") {
//         alert(
//           "Camera access was denied. Please allow camera access in your browser settings."
//         );
//       } else if (error.name === "NotFoundError") {
//         alert("No camera found on this device. Please use the attachment option.");
//       } else {
//         alert("Failed to access camera. Please use the attachment option instead.");
//       }
//     }
//   };

//   const capturePhoto = () => {
//     const video = videoRef.current;
//     if (!video) {
//       alert("Camera not ready. Please try again.");
//       return;
//     }

//     if (video.videoWidth === 0 || video.videoHeight === 0) {
//       alert("Camera not ready. Please wait a moment and try again.");
//       return;
//     }

//     const canvas = document.createElement("canvas");
//     canvas.width = video.videoWidth || 1280;
//     canvas.height = video.videoHeight || 720;

//     const context = canvas.getContext("2d");
//     context.drawImage(video, 0, 0, canvas.width, canvas.height);

//     const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
//     setPhotoPreview(imageDataUrl);

//     closeCamera();
//   };

//   const closeCamera = () => {
//     if (cameraStream) {
//       cameraStream.getTracks().forEach((track) => track.stop());
//       setCameraStream(null);
//     }
//     setShowCameraPreview(false);
//   };

//   const renderCameraPreview = () => {
//     if (!showCameraPreview) return null;

//     return (
//       <div className="camera-preview-overlay" onClick={closeCamera}>
//         <div
//           className="camera-preview-content"
//           onClick={(e) => e.stopPropagation()}
//         >
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
//               {photoSending ? "⏳ Sending..." : "📸 Capture"}
//             </button>
//             <button className="camera-close-btn" onClick={closeCamera}>
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
//     } finally {
//       setPhotoSending(false);
//     }
//   };

//   const handleFileSelected = async (e) => {
//     const file = e.target.files?.[0];
//     if (!file || isSending || !selectedUser) return;

//     if (e.target === cameraInputRef.current) {
//       const reader = new FileReader();
//       reader.onload = (event) => {
//         setPhotoPreview(event.target?.result);
//       };
//       reader.readAsDataURL(file);
//     } else {
//       const tempFileMessage = {
//         id: `temp_file_${Date.now()}`,
//         text: file.name,
//         sender: "me",
//         senderRole: "counsellor",
//         time: new Date().toLocaleTimeString([], {
//           hour: "2-digit",
//           minute: "2-digit",
//         }),
//         contentType: file.type.startsWith("image/") ? "IMAGE" : "FILE",
//         status: "sending",
//         isTemporary: true,
//       };
//       setMessages((prev) => [...prev, tempFileMessage]);
//       setIsSending(true);
//       try {
//         await sendMessageToAPI({ file });
//         setMessages((prev) => prev.filter((msg) => !msg.isTemporary));
//       } catch (err) {
//         setMessages((prev) =>
//           prev.map((msg) =>
//             msg.id === tempFileMessage.id ? { ...msg, status: "error" } : msg
//           )
//         );
//         setError("Failed to send file");
//       } finally {
//         setIsSending(false);
//         e.target.value = "";
//       }
//     }
//     e.target.value = "";
//   };

//   const initiateStreamCall = async (requestedCallType = "video") => {
//     const normalizedMode =
//       requestedCallType === "audio" || requestedCallType === "voice"
//         ? "voice"
//         : "video";
//     if (!selectedUser) {
//       setCallError("No user selected for call");
//       return;
//     }
//     const counselorId = getCounselorId();
//     const userId = getSelectedUserId();
//     if (!counselorId || !userId) {
//       setCallError("Missing user information");
//       return;
//     }
//     setIsInitiatingCall(true);
//     setCallError(null);
//     try {
//       const token =
//         localStorage.getItem("token") || localStorage.getItem("accessToken");
//       if (!token) throw new Error("Authentication token not found");
//       const requestBody = {
//         initiatorId: counselorId,
//         initiatorType: "counsellor",
//         receiverId: userId,
//         receiverType: "user",
//         callType: normalizedMode === "voice" ? "audio" : "video",
//       };
//       const response = await axios.post(
//         `${API_BASE_URL}/api/video/calls/initiate`,
//         requestBody,
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//         },
//       );
//       if (response.data && response.data.success) {
//         const callData = {
//           id: response.data.callData?.id,
//           callId: response.data.callId,
//           roomId: response.data.roomId,
//           name: selectedUser.name || USER_NAME,
//           type: normalizedMode,
//           callType: normalizedMode,
//           profilePic: getUserAvatarUrl() || getUserAvatarIcon(),
//           phoneNumber: selectedUser.phone || selectedUser.phoneNumber,
//           status: response.data.status || "ringing",
//           date: "Today",
//           time: new Date().toLocaleTimeString([], {
//             hour: "2-digit",
//             minute: "2-digit",
//           }),
//           apiCallData: response.data.callData,
//         };
//         setSelectedCall(callData);
//         setIsVideoModalOpen(true);
//       } else {
//         throw new Error(
//           response.data?.message || `Failed to initiate ${normalizedMode} call`,
//         );
//       }
//     } catch (error) {
//       console.error("Call initiation error:", error);
//       setCallError(
//         error.response?.data?.message ||
//           error.message ||
//           "Failed to initiate call",
//       );
//     } finally {
//       setIsInitiatingCall(false);
//     }
//   };

//   const handleVideoCall = () => initiateStreamCall("video");
//   const handleVoiceCall = () => initiateStreamCall("audio");

//   const handleJoinIncomingCall = async (callId) => {
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

//       if (!COUNSELOR_ID) {
//         throw new Error("Counselor ID not found");
//       }

//       const response = await axios.put(
//         `${API_BASE_URL}/api/video/calls/${resolvedCallId}/accept`,
//         {
//           acceptorId: COUNSELOR_ID,
//           acceptorType: "counsellor",
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         },
//       );

//       console.log("Join call response:", response.data);

//       if (response.data && response.data.success) {
//         let detailedCall = null;
//         try {
//           const detailsResponse = await axios.get(
//             `${API_BASE_URL}/api/video/calls/${resolvedCallId}/details`,
//             {
//               params: {
//                 userId: COUNSELOR_ID,
//                 userType: "counsellor",
//               },
//               headers: {
//                 Authorization: `Bearer ${token}`,
//               },
//             },
//           );

//           detailedCall = detailsResponse.data?.call || null;
//         } catch (detailsError) {
//           console.warn("Could not fetch accepted call details:", detailsError);
//         }

//         const incomingType = String(
//           incomingCallData.callType || detailedCall?.type || "video",
//         ).toLowerCase();
//         const modalType = incomingType === "audio" ? "voice" : incomingType;

//         const remoteParticipant = detailedCall
//           ? String(detailedCall.initiator?.id) === String(COUNSELOR_ID)
//             ? detailedCall.receiver
//             : detailedCall.initiator
//           : null;
//         const remoteParticipantDisplay = getAnonymousUserDisplay({
//           ...incomingCallData,
//           ...(remoteParticipant || {}),
//         });

//         const callDataForModal = {
//           id: detailedCall?.id || resolvedCallId,
//           callId: resolvedCallId,
//           roomId:
//             response.data.roomId ||
//             detailedCall?.roomId ||
//             incomingCallData.roomId,
//           name:
//             remoteParticipant?.displayName ||
//             remoteParticipant?.fullName ||
//             incomingCallData.name,
//           type: modalType,
//           callType: modalType,
//           profilePic:
//             remoteParticipantDisplay.avatarUrl ||
//             remoteParticipant?.profilePhoto ||
//             incomingCallData.avatar,
//           phoneNumber:
//             remoteParticipant?.phoneNumber || remoteParticipant?.phone || "",
//           status: response.data.status || detailedCall?.status || "active",
//           date: "Today",
//           time: new Date().toLocaleTimeString([], {
//             hour: "2-digit",
//             minute: "2-digit",
//           }),
//           apiCallData: detailedCall,
//           initiator: detailedCall?.initiator,
//           receiver: detailedCall?.receiver,
//           currentUserId: COUNSELOR_ID,
//           currentUserType: "counsellor",
//           isIncoming: true,
//         };
//         setSelectedCall(callDataForModal);
//         setIsVideoModalOpen(true);
//         return { success: true };
//       }
//       throw new Error("Failed to join call");
//     } catch (error) {
//       console.error("Error joining call:", error);
//       throw error;
//     }
//   };

//   const handleRejectIncomingCall = async (callId) => {
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
//       await axios.put(
//         `${API_BASE_URL}/api/video/calls/${resolvedCallId}/reject`,
//         {
//           userId: COUNSELOR_ID,
//           reason: "declined",
//         },
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         },
//       );
//       return true;
//     } catch (error) {
//       // Fallback for older backend deployments that expose reject under /api/call.
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

//   const handleEndIncomingCall = async (callId) => {
//     try {
//       const resolvedCallId =
//         callId ||
//         selectedCall?.callId ||
//         incomingCallData?.callId ||
//         selectedCall?.id ||
//         incomingCallData?.id;

//       if (!resolvedCallId) {
//         return false;
//       }

//       const token =
//         localStorage.getItem("token") || localStorage.getItem("accessToken");

//       await axios.put(
//         `${API_BASE_URL}/api/video/calls/${resolvedCallId}/end`,
//         {
//           userId: COUNSELOR_ID,
//           endedBy: "counsellor",
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         },
//       );
//       return true;
//     } catch (error) {
//       return true;
//     }
//   };

//   useEffect(() => {
//     let isMounted = true;
//     let intervalId = null;
//     const fetchIncomingCalls = async () => {
//       try {
//         const token =
//           localStorage.getItem("token") || localStorage.getItem("accessToken");

//         if (!COUNSELOR_ID || !token || isVideoModalOpen) {
//           console.log("Skipping poll - missing data:", {
//             COUNSELOR_ID,
//             hasToken: !!token,
//             showIncomingModal,
//             isVideoModalOpen,
//           });
//           return;
//         }

//         console.log("Polling for calls with counselor ID:", COUNSELOR_ID);

//         const response = await axios.get(
//           `${API_BASE_URL}/api/video/calls/pending/${COUNSELOR_ID}`,
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           },
//         );

//         if (!isMounted) return;

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
//             avatar: "👤",
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
//           const anonymousCaller = getAnonymousUserDisplay({
//             ...waitingCall,
//             ...fromData,
//           });
//           let displayName = "Anonymous User";
//           if (anonymousCaller.name) displayName = anonymousCaller.name;
//           else if (fromData.isAnonymous) displayName = fromData.isAnonymous;
//           else if (fromData.displayName) displayName = fromData.displayName;
//           else if (fromData.fullName) displayName = fromData.fullName;
//           else if (fromData.name) displayName = fromData.name;
//           setIncomingCallData({
//             callId: waitingCall.callId || waitingCall.id || waitingCall._id,
//             id: waitingCall.id || waitingCall.callId || waitingCall._id || "",
//             _id: waitingCall._id || waitingCall.callId || waitingCall.id || "",
//             roomId: waitingCall.roomId || waitingCall.callId || waitingCall.id,
//             name: displayName,
//             avatar: anonymousCaller.avatarUrl || anonymousCaller.avatar,
//             callType: waitingCall.callType || "video",
//             from: fromData,
//             requestMessage:
//               waitingCall.requestMessage ||
//               `Incoming ${waitingCall.callType || "video"} call...`,
//           });
//           setShowIncomingModal(true);
//         } else if (showIncomingModal) {
//           setShowIncomingModal(false);
//           setIncomingCallData({
//             name: "",
//             avatar: "👤",
//             callId: "",
//             roomId: "",
//             callType: "video",
//           });
//         }
//       } catch (error) {
//         console.error("Error polling for calls:", error);
//       }
//     };
//     intervalId = setInterval(fetchIncomingCalls, 5000);
//     return () => {
//       isMounted = false;
//       if (intervalId) clearInterval(intervalId);
//     };
//   }, [
//     showIncomingModal,
//     COUNSELOR_ID,
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

//   const handleCloseModal = () => {
//     setIsVideoModalOpen(false);
//     setSelectedCall(null);
//     setCallError(null);
//   };
//   const handleBack = () =>
//     navigate("/counselor-dashboard", { state: { selectedTab: "messages" } });
//   const getAvatarIcon = (gender) => {
//     if (gender === "male") return "👨";
//     if (gender === "female") return "👩";
//     return "👤";
//   };
//   const getUserAvatarIcon = () =>
//     userDetails.avatar || getAvatarIcon(userDetails.gender);

//   const getUserAvatarUrl = () => {
//     if (typeof userDetails.avatarUrl === "string" && userDetails.avatarUrl.trim()) {
//       return userDetails.avatarUrl.trim();
//     }
//     return null;
//   };
//   // Handle scroll events to detect if user is near bottom
//   const handleScroll = useCallback(() => {
//     if (!messagesContainerRef.current) return;
//     const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
//     // Consider "at bottom" if within 100px of the actual bottom
//     const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
//     setShouldScrollToBottom(isNearBottom);
//   }, []);

//   // Set up scroll listener
//   useEffect(() => {
//     const container = messagesContainerRef.current;
//     if (container) {
//       container.addEventListener("scroll", handleScroll);
//       return () => container.removeEventListener("scroll", handleScroll);
//     }
//   }, [handleScroll]);

//   const scrollToBottom = useCallback((behavior = "smooth", force = false) => {
//     if (messagesEndRef.current && (shouldScrollToBottom || force)) {
//       messagesEndRef.current.scrollIntoView({ behavior });
//     }
//   }, [shouldScrollToBottom]);

//   useEffect(() => {
//     if (messages.length === 0) return;

//     if (isInitialLoadRef.current) {
//       const timer = setTimeout(() => {
//         scrollToBottom("auto", true);
//         isInitialLoadRef.current = false;
//       }, 50);
//       return () => clearTimeout(timer);
//     } else if (shouldScrollToBottom) {
//       scrollToBottom("smooth");
//     }
//   }, [messages, scrollToBottom, shouldScrollToBottom]);
//   useEffect(() => {
//     if (selectedUser && COUNSELOR_ID) fetchMessagesFromAPI();
//   }, [selectedUser, chatId, COUNSELOR_ID]);
//   useEffect(() => {
//     if (callError) {
//       const timer = setTimeout(() => setCallError(null), 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [callError]);

//   // Socket connection
//   useEffect(() => {
//     const apiChatId = chatId;
//     if (!apiChatId || !selectedUser) return;

//     let mounted = true;

//     const onNewMessage = (messageData) => {
//       if (!mounted) return;
//       if (
//         messageData.senderRole === "counsellor" &&
//         String(messageData.senderId) === String(COUNSELOR_ID)
//       ) {
//         setMessages((prev) => {
//           const withoutTemp = prev.filter((msg) => !msg.isTemporary);
//           const alreadyHas = withoutTemp.some(
//             (msg) => msg.messageId && messageData.messageId && msg.messageId === messageData.messageId,
//           );
//           if (alreadyHas) return withoutTemp;
//           return [
//             ...withoutTemp,
//             {
//               id: messageData._id || messageData.id || messageData.messageId,
//               _id: messageData._id || messageData.id,
//               messageId: messageData.messageId,
//               text: messageData.content,
//               sender: "me",
//               senderRole: "counsellor",
//               time: new Date(messageData.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
//               fullTime: messageData.createdAt,
//               contentType: messageData.contentType,
//               isRead: messageData.isRead,
//               status: "sent",
//             },
//           ];
//         });
//         return;
//       }
//       const transformedMessage = {
//         id: messageData._id || messageData.id || messageData.messageId,
//         _id: messageData._id || messageData.id,
//         messageId: messageData.messageId,
//         text: messageData.content,
//         sender: "user",
//         senderRole: messageData.senderRole,
//         time: new Date(messageData.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
//         fullTime: messageData.createdAt,
//         contentType: messageData.contentType,
//         isRead: messageData.isRead,
//         status: "sent",
//       };
//       setOriginalMessages((prev) => {
//         const isDuplicate = prev.some(
//           (msg) => msg.messageId && messageData.messageId && msg.messageId === messageData.messageId,
//         );
//         if (isDuplicate) return prev;
//         return [...prev, transformedMessage];
//       });

//       setMessages((prev) => {
//         const isDuplicate = prev.some(
//           (msg) => msg.messageId && messageData.messageId && msg.messageId === messageData.messageId,
//         );
//         if (isDuplicate) return prev;
//         return [...prev, transformedMessage];
//       });
//     };

//     const onTyping = ({ userRole, isTyping: typing }) => {
//       if (!mounted) return;
//       if (userRole === "user") setRemoteIsTyping(typing);
//     };

//     const onMessagesRead = () => {
//       if (!mounted) return;
//       setMessages((prev) => prev.map((msg) => msg.sender === "me" ? { ...msg, isRead: true } : msg));
//     };

//     const onPresenceUpdate = (payload = {}) => {
//       const presenceUserId = getPresenceUserId(payload);
//       if (!mounted || String(presenceUserId) !== String(USER_ID)) return;
//       const presence = getPresence(payload);
//       setRemotePresence((prev) => ({
//         isOnline: presence.isOnline,
//         lastSeen: resolveOfflineLastSeen(presence, prev.lastSeen),
//       }));
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
//       socket.on("presence-update", onPresenceUpdate);
//       socket.on("call_rejected", onCallRejected);
//       socket.on("call-status-update", onCallStatusUpdate);
//       socket.on("connect_error", onConnectError);
//     }).catch((err) => {
//       console.error("[SMSInput] Socket connect failed:", err.message);
//     });

//     return () => {
//       mounted = false;
//       const socket = chatSocketRef.current;
//       if (socket) {
//         socket.off("new-message", onNewMessage);
//         socket.off("user-typing", onTyping);
//         socket.off("messages-read", onMessagesRead);
//         socket.off("presence-update", onPresenceUpdate);
//         socket.off("call_rejected", onCallRejected);
//         socket.off("call-status-update", onCallStatusUpdate);
//         socket.off("connect_error", onConnectError);
//       }
//       chatSocketRef.current = null;
//     };
//   }, [chatId, selectedUser, COUNSELOR_ID, USER_ID]);

//   const renderMessageStatus = (message) => {
//     if (message.sender !== "me") return null;
//     switch (message.status) {
//       case "sending":
//         return <span className="msg-status sending">⌛</span>;
//       case "error":
//         return <span className="msg-status error">⚠️</span>;
//       default:
//         return null;
//     }
//   };

//   if (!selectedUser) {
//     return (
//       <div className="smsinput-container no-user">
//         <div className="smsinput-empty-state">
//           <span className="empty-icon">💬</span>
//           <h3>No user selected</h3>
//           <p>Please select a user from the list to start messaging</p>
//           <button className="back-to-list-btn" onClick={handleBack}>
//             ← Back to SMS List
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="smsinput-container">
//       {/* Header */}
//       <div className="smsinput-header">
//         <div className="header-left">
//           <button
//             className="back-button"
//             onClick={handleBack}
//             title="Back to SMS List"
//           >
//             <svg
//               width="24"
//               height="24"
//               viewBox="0 0 24 24"
//               fill="none"
//               xmlns="http://www.w3.org/2000/svg"
//             >
//               <path
//                 d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z"
//                 fill="currentColor"
//               />
//             </svg>
//           </button>
//           <div className="smsinput-user-info">
//             <div className="smsinput-user-avatar">
//               {getUserAvatarUrl() ? (
//                 <img
//                   src={getUserAvatarUrl()}
//                   alt={USER_NAME}
//                   className="smsinput-user-avatar-img"
//                 />
//               ) : (
//                 <span className="avatar-icon">{getUserAvatarIcon()}</span>
//               )}
//               <span
//                 className={`status-dot ${remoteStatusClass}`}
//               ></span>
//             </div>
//             <div className="smsinput-user-details">
//               <h3>{USER_NAME}</h3>
//               <p className="smsinput-user-status">
//                 {remotePresenceText}
//               </p>
//             </div>
//           </div>
//         </div>
//         <div className="smsinput-call-buttons">
//           <button
//             className={`sms-call-btn sms-voice-call-btn ${isInitiatingCall ? "loading" : ""}`}
//             onClick={handleVoiceCall}
//             disabled={isInitiatingCall}
//             title="Voice call"
//             aria-label="Voice call"
//           >
//             <span className="call-icon" aria-hidden="true">
//               {isInitiatingCall ? <FaSpinner className="spinning" /> : <FaPhoneAlt />}
//             </span>
//           </button>
//           <button
//             className={`sms-call-btn sms-video-call-btn ${isInitiatingCall ? "loading" : ""}`}
//             onClick={handleVideoCall}
//             disabled={isInitiatingCall}
//             title="Video call"
//             aria-label="Video call"
//           >
//             <span className="call-icon" aria-hidden="true">
//               {isInitiatingCall ? <FaSpinner className="spinning" /> : <FaVideo />}
//             </span>
//           </button>
//         </div>
//       </div>

//       {/* Error Banner */}
//       {callError && (
//         <div className="sms-call-error-banner">
//           <span className="error-icon">⚠️</span>
//           <span className="error-text">{callError}</span>
//           <button className="error-close" onClick={() => setCallError(null)}>
//             ✕
//           </button>
//         </div>
//       )}

//       {/* Messages Area */}
//       <div className="smsinput-messages" ref={messagesContainerRef}>
//         {isLoadingMessages && messages.length === 0 ? (
//           <div className="sms-loading-messages">
//             <div className="sms-loading-spinner"></div>
//             <p>Loading messages...</p>
//           </div>
//         ) : error && messages.length === 0 ? (
//           <div className="sms-error-message">
//             <span className="error-icon">⚠️</span>
//             <p>{error}</p>
//             <button onClick={fetchMessagesFromAPI} className="retry-btn">
//               Retry
//             </button>
//           </div>
//         ) : messages.length === 0 ? (
//           <div className="sms-empty-messages">
//             <span className="empty-messages-icon">💬</span>
//             <p>No messages yet</p>
//             <p className="empty-messages-subtext">
//               Start a conversation by sending a message
//             </p>
//           </div>
//         ) : (
//           messages.map((msg, index) => (
//             <React.Fragment key={msg.id}>
//               {getMessageDayKey(msg) !== getMessageDayKey(messages[index - 1]) && formatMessageDay(msg) && (
//                 <div className="sms-chat-date-separator">{formatMessageDay(msg)}</div>
//               )}
//             <div
//               className={`smsinput-message ${msg.sender === "me" ? "sent" : "received"}`}
//             >
//               <div className="message-bubble">
//                 <button
//                   type="button"
//                   className="sms-message-menu-btn"
//                   onClick={() => toggleMessageMenu(msg)}
//                   disabled={String(deletingMessageId) === String(getMessageIdentifier(msg))}
//                   title="Message options"
//                   aria-label="Message options"
//                 >
//                   <FaChevronDown />
//                 </button>
//                 {String(openMessageMenuId) === String(getMessageIdentifier(msg)) && (
//                   <div className="sms-message-options-menu">
//                     <button
//                       type="button"
//                       className="sms-message-options-item delete"
//                       onClick={() => handleDeleteMessage(msg)}
//                       disabled={String(deletingMessageId) === String(getMessageIdentifier(msg))}
//                     >
//                       Delete
//                     </button>
//                   </div>
//                 )}
//                 {msg.contentType === "IMAGE" && msg.attachmentUrl ? (
//                   <>
//                     <img
//                       src={msg.attachmentUrl}
//                       alt={msg.attachmentName || "Shared image"}
//                       className="sms-attachment-image"
//                     />
//                     <a
//                       href={msg.attachmentUrl}
//                       target="_blank"
//                       rel="noreferrer"
//                       className="sms-attachment-link"
//                     >
//                       {msg.attachmentName || "Open image"}
//                     </a>
//                     {msg.text && <div className="message-text"><TranslatedMessage text={msg.text} translate={translate} lang={lang} /></div>}
//                   </>
//                 ) : msg.contentType === "FILE" && msg.attachmentUrl ? (
//                   <>
//                     <a
//                       href={msg.attachmentUrl}
//                       target="_blank"
//                       rel="noreferrer"
//                       className="sms-attachment-link"
//                     >
//                       {msg.attachmentName || msg.text || "Open attachment"}
//                     </a>
//                     {msg.text && <div className="message-text"><TranslatedMessage text={msg.text} translate={translate} lang={lang} /></div>}
//                   </>
//                 ) : (
//                   <div className="message-text"><TranslatedMessage text={msg.text} translate={translate} lang={lang}  /></div>
//                 )}
//                 <div className="message-footer">
//                   <span className="message-time">{msg.time}</span>
//                   {renderMessageStatus(msg)}
//                 </div>
//               </div>
//             </div>
//             </React.Fragment>
//           ))
//         )}
//         <ChatCallHistory userId={COUNSELOR_ID} peerId={USER_ID} />
//         {remoteIsTyping && (
//           <div className="smsinput-message received">
//             <div className="message-bubble typing-bubble">
//               <div className="typing-dots">
//                 <span></span>
//                 <span></span>
//                 <span></span>
//               </div>
//             </div>
//           </div>
//         )}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Input Form */}
//       <form className="smsinput-form" onSubmit={handleSendMessage}>
//         <div className="smsinput-input-wrapper">
//           <input
//             ref={fileInputRef}
//             type="file"
//             style={{ display: "none" }}
//             onChange={handleFileSelected}
//           />
//           <input
//             ref={cameraInputRef}
//             type="file"
//             capture="environment"
//             style={{ display: "none" }}
//             onChange={handleFileSelected}
//           />
//           <button
//             type="button"
//             className="attach-btn"
//             title="Attach file"
//             disabled={isSending}
//             onClick={handleFileAttachClick}
//           >
//             📎
//           </button>
//           <button
//             type="button"
//             className="camera-btn"
//             title="Take photo"
//             disabled={isSending}
//             onClick={handleCameraClick}
//           >
//             📷
//           </button>
//           <input
//             type="text"
//             ref={messageInputRef}
//             className="smsinput-input"
//             placeholder={isSending ? "Sending..." : "Type your message..."}
//             value={message}
//             onChange={(e) => setMessage(e.target.value)}
//             onKeyDown={handleInputKeyDown}
//             disabled={isSending}
//           />
//           <button
//             type="submit"
//             className={`send-btn ${message.trim() && !isSending ? "active" : ""}`}
//             disabled={!message.trim() || isSending}
//           >
//             {isSending ? "Sending..." : "Send"}
//           </button>
//         </div>
//       </form>

//       {/* Call Modals */}
//       <VideoCallModal
//         isOpen={isVideoModalOpen}
//         onClose={handleCloseModal}
//         callData={selectedCall}
//         callMode={selectedCall?.callType || selectedCall?.type || "video"}
//         currentUser={{ id: COUNSELOR_ID, role: "counsellor" }}
//         onEndCall={handleEndIncomingCall}
//       />

//       {/* Professional Incoming Call Modal */}
//       <IncomingCallModal
//         isOpen={showIncomingModal}
//         onClose={() => setShowIncomingModal(false)}
//         callType={incomingCallData.callType}
//         callerName={incomingCallData.name}
//         callerImage={incomingCallData.avatar}
//         callData={incomingCallData}
//         onAccept={handleJoinIncomingCall}
//         onReject={handleRejectIncomingCall}
//         fallbackName="Anonymous User"
//       />

//       {/* Live desktop camera preview overlay */}
//       {renderCameraPreview()}

//       {/* Photo Preview Modal */}
//       <PhotoPreviewModal
//         isOpen={!!photoPreview}
//         photoSrc={photoPreview}
//         onSend={handleSendPhoto}
//         onCancel={() => setPhotoPreview(null)}
//         loading={photoSending}
//       />
//     </div>
//   );
// };

// export default SMSInput;


// SMSInput.jsx - Fully Responsive Chat Interface with Merged Call History (No Separate Call History Component)





// import React, { useState, useRef, useEffect, useCallback } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import axios from "axios";
// import { FaChevronDown, FaPhoneAlt, FaSpinner, FaVideo, FaCamera } from "react-icons/fa";
// import "./SMSInput.css";
// import { API_BASE_URL } from "../../../../axiosConfig";
// import socketService from "../../../../services/socketService";
// import VideoCallModal from "../../../UserDashboard/Tab/CallModal/VideoCallModal";
// import PhotoPreviewModal from "../../../common/PhotoPreviewModal/PhotoPreviewModal";
// import useRingtone from "../../../../hooks/useRingtone";
// import IncomingCallModal from "../../../common/IncomingCallModal/IncomingCallModal";
// import { useCounselorTranslation, useCounselorApiTranslation } from "../../../../i18n/LanguageContext";
// import {
//   formatPresenceText,
//   getPresence,
//   getPresenceUserId,
//   resolveOfflineLastSeen,
// } from "../../../../utils/presence";
// import { getAnonymousUserDisplay } from "../../../../utils/anonymousUser";
// import TranslatedMessage from "../../../common/TranslatedMessage";

// const SMSInput = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { t, lang } = useCounselorTranslation();
//   const { translate } = useCounselorApiTranslation();
//   const [message, setMessage] = useState("");
//   const messagesEndRef = useRef(null);
//   const messagesContainerRef = useRef(null);
//   const fileInputRef = useRef(null);
//   const cameraInputRef = useRef(null);
//   const messageInputRef = useRef(null);
//   const chatSocketRef = useRef(null);
//   const typingTimeoutRef = useRef(null);
//   const [remoteIsTyping, setRemoteIsTyping] = useState(false);
//   const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
//   const isInitialLoadRef = useRef(true);

//   // Call modal states
//   const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
//   const [selectedCall, setSelectedCall] = useState(null);
//   const [isInitiatingCall, setIsInitiatingCall] = useState(false);
//   const [callError, setCallError] = useState(null);

//   // Receiving Call States
//   const [showIncomingModal, setShowIncomingModal] = useState(false);
//   const [incomingCallData, setIncomingCallData] = useState({
//     name: "",
//     avatar: "👤",
//     callId: "",
//     roomId: "",
//     callType: "video",
//   });
//   const { startRinging, stopRinging } = useRingtone();

//   // Message states
//   const [messages, setMessages] = useState([]);
//   const [callHistory, setCallHistory] = useState([]);
//   const [originalMessages, setOriginalMessages] = useState([]);
//   const [isLoadingMessages, setIsLoadingMessages] = useState(false);
//   const [isSending, setIsSending] = useState(false);
//   const [error, setError] = useState(null);
//   const [chatStatus, setChatStatus] = useState(null);
//   const [photoPreview, setPhotoPreview] = useState(null);
//   const [photoSending, setPhotoSending] = useState(false);
//   const [deletingMessageId, setDeletingMessageId] = useState(null);
//   const [openMessageMenuId, setOpenMessageMenuId] = useState(null);
//   const [cameraStream, setCameraStream] = useState(null);
//   const [showCameraPreview, setShowCameraPreview] = useState(false);
//   const videoRef = useRef(null);

//   const handleSessionExpired = () => {
//     localStorage.clear();
//     sessionStorage.clear();
//     navigate("/role-selector", {
//       replace: true,
//       state: {
//         reason: "session-expired",
//         message: "You were logged out because your account was used on another device.",
//       },
//     });
//   };

//   const focusMessageInput = () => {
//     const input = messageInputRef.current;
//     if (!input) return;
//     requestAnimationFrame(() => input.focus({ preventScroll: true }));
//     setTimeout(() => messageInputRef.current?.focus({ preventScroll: true }), 50);
//   };

//   const selectedUser = location.state?.selectedUser;
//   const chatId = location.state?.chatId;
//   const selectedUserPresence = getPresence(selectedUser || {});
//   const [remotePresence, setRemotePresence] = useState({
//     isOnline: selectedUserPresence.isOnline,
//     lastSeen: selectedUserPresence.lastSeen,
//   });

//   const getCurrentCounselor = () => {
//     let counselorData = null;
//     const storedCounselor = localStorage.getItem("counselor");
//     if (storedCounselor) {
//       try {
//         counselorData = JSON.parse(storedCounselor);
//       } catch (e) {}
//     }
//     if (!counselorData) {
//       const sessionCounselor = sessionStorage.getItem("counselor");
//       if (sessionCounselor) {
//         try {
//           counselorData = JSON.parse(sessionCounselor);
//         } catch (e) {}
//       }
//     }
//     if (!counselorData) {
//       const userData = localStorage.getItem("user") || localStorage.getItem("userData");
//       if (userData) {
//         try {
//           const user = JSON.parse(userData);
//           if (user.role === "counselor" || user.role === "counsellor" || user.userType === "counselor") {
//             counselorData = user;
//           }
//         } catch (e) {}
//       }
//     }
//     return counselorData;
//   };

//   const getCounselorId = () => {
//     if (currentCounselor) {
//       if (currentCounselor._id) return currentCounselor._id;
//       if (currentCounselor.id) return currentCounselor.id;
//       if (currentCounselor.counselorId) return currentCounselor.counselorId;
//     }
//     const storedId = localStorage.getItem("counselorId") || localStorage.getItem("counsellorId");
//     if (storedId) return storedId;
//     const sessionId = sessionStorage.getItem("counselorId") || sessionStorage.getItem("counsellorId");
//     if (sessionId) return sessionId;
//     return "69c679b6e0e8f0800ff08fd1";
//   };

//   const currentCounselor = getCurrentCounselor();
//   const COUNSELOR_ID = getCounselorId();
//   const COUNSELOR_NAME = currentCounselor?.name || currentCounselor?.fullName || "Counselor";

//   const getSelectedUserId = () => {
//     if (!selectedUser) return null;
//     return (
//       selectedUser.receiverId ||
//       selectedUser._id ||
//       selectedUser.id ||
//       selectedUser.userId ||
//       selectedUser.user_id ||
//       selectedUser.user?._id ||
//       selectedUser.user?.id ||
//       selectedUser.user?.userId ||
//       selectedUser.otherParty?._id ||
//       selectedUser.otherParty?.id ||
//       null
//     );
//   };

//   const getUserDetails = () => {
//     const id = getSelectedUserId();
//     const anonymousDisplay = getAnonymousUserDisplay(selectedUser || {});
//     return {
//       id,
//       name: selectedUser?.name || selectedUser?.fullName || selectedUser?.user?.name || selectedUser?.otherParty?.name || "User",
//       gender: selectedUser?.gender || selectedUser?.user?.gender || selectedUser?.otherParty?.gender,
//       phone: selectedUser?.phone || selectedUser?.phoneNumber || selectedUser?.user?.phone || selectedUser?.otherParty?.phone,
//       email: selectedUser?.email || selectedUser?.user?.email || selectedUser?.otherParty?.email,
//       avatar: anonymousDisplay.avatar || selectedUser?.avatar || selectedUser?.user?.avatar || selectedUser?.otherParty?.avatar,
//       avatarUrl: anonymousDisplay.avatarUrl || selectedUser?.avatarUrl || selectedUser?.anonymousAvatarUrl || selectedUser?.profilePhoto?.url || selectedUser?.profilePhoto || selectedUser?.profilePic || selectedUser?.avatarImage || selectedUser?.user?.avatarUrl || selectedUser?.user?.anonymousAvatarUrl || selectedUser?.user?.profilePhoto?.url || selectedUser?.user?.profilePhoto || selectedUser?.user?.profilePic || selectedUser?.user?.avatarImage || selectedUser?.otherParty?.avatarUrl || selectedUser?.otherParty?.anonymousAvatarUrl || selectedUser?.otherParty?.profilePhoto?.url || selectedUser?.otherParty?.profilePhoto || selectedUser?.otherParty?.profilePic || selectedUser?.otherParty?.avatarImage,
//     };
//   };

//   const userDetails = getUserDetails();
//   const USER_ID = userDetails.id;
//   const USER_NAME = userDetails.name;
//   const remoteStatusClass = remotePresence.isOnline ? "online" : "offline";
//   const remotePresenceText = formatPresenceText(remotePresence, {
//     onlineText: t('online') || "Online",
//     offlineText: t('offline') || "Offline",
//   });

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
//     return date.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" });
//   };

//   useEffect(() => {
//     const presence = getPresence(selectedUser || {});
//     setRemotePresence({
//       isOnline: presence.isOnline,
//       lastSeen: presence.lastSeen,
//     });
//   }, [selectedUser]);

//   const getChatIdForAPI = () => {
//     const candidateChatId = chatId || selectedUser?.chatId || selectedUser?.chat_id || selectedUser?.chat?.chatId || selectedUser?.chat?._id || selectedUser?.chat?.id;
//     if (candidateChatId) return candidateChatId;
//     const possibleId = selectedUser?.id || selectedUser?._id;
//     if (typeof possibleId === "string" && possibleId.startsWith("chat_")) {
//       return possibleId;
//     }
//     return null;
//   };

//   // ─── Fetch Call History ──────────────────────────────────────────────────
//   const fetchCallHistory = useCallback(async () => {
//     try {
//       const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
//       const userId = getSelectedUserId();
//       const counselorId = getCounselorId();

//       if (!userId || !counselorId) {
//         setCallHistory([]);
//         return;
//       }

//       const response = await axios.get(
//         `${API_BASE_URL}/api/video/calls/history/${counselorId}`,
//         {
//           params: { 
//             peerId: userId,
//             peerType: "user",
//             page: 1, 
//             limit: 100 
//           },
//           headers: token ? { Authorization: `Bearer ${token}` } : {},
//         }
//       );

//       // Extract calls from response - checking both 'calls' and 'history' fields
//       const callsData = response.data?.calls || response.data?.history || [];
      
//       if (callsData.length > 0) {
//         const formattedCalls = callsData
//           .filter((call) => String(call.withId || call.receiverId || call.peerId || call.receiver?.id || call.peer?.id) === String(userId))
//           .map((call) => ({
//             id: call.id || call._id || `call_${Date.now()}_${Math.random()}`,
//             callId: call.callId || call.id,
//             type: call.callType === "audio" ? "voice" : "video",
//             direction: call.role === "initiator" || call.initiator?.id === counselorId ? "outgoing" : "incoming",
//             status: call.status || "completed",
//             time: new Date(call.timestamp || call.createdAt || call.startedAt || call.updatedAt).toLocaleTimeString([], {
//               hour: "2-digit",
//               minute: "2-digit",
//             }),
//             fullTime: call.timestamp || call.createdAt || call.startedAt || call.updatedAt || new Date().toISOString(),
//             timestamp: call.timestamp || call.createdAt || call.startedAt || call.updatedAt || new Date().toISOString(),
//             duration: call.duration || 0,
//             isCall: true,
//             _original: call,
//           }));
//         setCallHistory(formattedCalls);
//       } else {
//         setCallHistory([]);
//       }
//     } catch (error) {
//       console.error("Error fetching call history:", error);
//       setCallHistory([]);
//     }
//   }, []);

//   // ─── Fetch Messages ──────────────────────────────────────────────────
//   const fetchMessagesFromAPI = async () => {
//     if (!selectedUser) return;
//     try {
//       const apiChatId = getChatIdForAPI();
//       if (!apiChatId) {
//         setError("Chat ID not found");
//         return;
//       }
//       const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
//       setIsLoadingMessages(true);
//       setError(null);
      
//       const response = await axios.get(
//         `${API_BASE_URL}/api/chat/chat/${apiChatId}/messages`,
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: token ? `Bearer ${token}` : "",
//           },
//         }
//       );
      
//       if (response.data && response.data.messages) {
//         if (response.data.chatStatus) setChatStatus(response.data.chatStatus);
//         const transformedMessages = response.data.messages.map((msg, index) => ({
//           id: msg._id || msg.id || msg.messageId || index,
//           _id: msg._id || msg.id,
//           messageId: msg.messageId,
//           text: msg.content,
//           sender: msg.senderRole === "counsellor" ? "me" : "user",
//           senderRole: msg.senderRole,
//           time: new Date(msg.createdAt).toLocaleTimeString([], {
//             hour: "2-digit",
//             minute: "2-digit",
//           }),
//           fullTime: msg.createdAt,
//           contentType: msg.contentType,
//           attachmentUrl: msg.attachmentUrl || null,
//           attachmentName: msg.attachmentName || null,
//           isRead: msg.isRead,
//           status: "sent",
//           isCall: false,
//         }));
//         setOriginalMessages(transformedMessages);
//         setMessages(transformedMessages);
//         saveMessagesToLocalStorage(transformedMessages);
//       }
      
//       // Fetch call history after messages
//       await fetchCallHistory();
      
//     } catch (error) {
//       console.error("Error fetching messages:", error);
//       if (error?.response?.status === 401) {
//         handleSessionExpired();
//         return;
//       }
//       loadMessagesFromLocalStorage();
//       // Try to load call history even if messages fail
//       await fetchCallHistory();
//     } finally {
//       setIsLoadingMessages(false);
//     }
//   };

//   const saveMessagesToLocalStorage = (messagesToSave) => {
//     try {
//       const savedChats = JSON.parse(localStorage.getItem("smsChats") || "[]");
//       const chatIdToSave = getChatIdForAPI();
//       const existingChatIndex = savedChats.findIndex((chat) => chat.chatId === chatIdToSave);
//       const chatData = {
//         chatId: chatIdToSave,
//         userId: USER_ID,
//         userName: USER_NAME,
//         messages: messagesToSave,
//         chatStatus,
//         lastUpdated: new Date().toISOString(),
//       };
//       if (existingChatIndex >= 0) savedChats[existingChatIndex] = chatData;
//       else savedChats.push(chatData);
//       localStorage.setItem("smsChats", JSON.stringify(savedChats));
//     } catch (error) {}
//   };

//   const loadMessagesFromLocalStorage = () => {
//     try {
//       const savedChats = JSON.parse(localStorage.getItem("smsChats") || "[]");
//       const chatIdToLoad = getChatIdForAPI();
//       const savedChat = savedChats.find((chat) => chat.chatId === chatIdToLoad);
//       if (savedChat && savedChat.messages) {
//         setOriginalMessages(savedChat.messages);
//         setMessages(savedChat.messages);
//       }
//     } catch (error) {}
//   };

//   const sendMessageToAPI = async ({ messageContent = "", file = null }) => {
//     try {
//       const apiChatId = getChatIdForAPI();
//       if (!apiChatId) {
//         throw new Error("Chat ID not found");
//       }
//       const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
//       let response;
//       if (file) {
//         const formData = new FormData();
//         if (messageContent.trim()) formData.append("content", messageContent.trim());
//         formData.append("attachment", file);
//         response = await axios.post(
//           `${API_BASE_URL}/api/chat/chat/${apiChatId}/message`,
//           formData,
//           {
//             headers: { Authorization: token ? `Bearer ${token}` : "" },
//           }
//         );
//       } else {
//         response = await axios.post(
//           `${API_BASE_URL}/api/chat/chat/${apiChatId}/message`,
//           { content: messageContent },
//           {
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: token ? `Bearer ${token}` : "",
//             },
//           }
//         );
//       }
//       if (response.data && response.data.success) return response.data.message;
//       else throw new Error("Invalid API response");
//     } catch (error) {
//       console.error("Error sending message:", error);
//       if (error?.response?.status === 401) {
//         handleSessionExpired();
//       }
//       throw error;
//     }
//   };

//   const getMessageIdentifier = (msg) => msg?._id || msg?.id || msg?.messageId;

//   const removeMessageFromState = (messageToDelete) => {
//     const targetId = getMessageIdentifier(messageToDelete);
//     const isSameMessage = (msg) => {
//       const currentId = getMessageIdentifier(msg);
//       return currentId && targetId && String(currentId) === String(targetId);
//     };

//     setMessages((prev) => prev.filter((msg) => !isSameMessage(msg)));
//     setOriginalMessages((prev) => {
//       const updatedMessages = prev.filter((msg) => !isSameMessage(msg));
//       saveMessagesToLocalStorage(updatedMessages);
//       return updatedMessages;
//     });
//   };

//   const toggleMessageMenu = (msg) => {
//     const messageId = getMessageIdentifier(msg);
//     if (!messageId) return;
//     setOpenMessageMenuId((currentId) =>
//       String(currentId) === String(messageId) ? null : messageId,
//     );
//   };

//   const handleDeleteMessage = async (messageToDelete) => {
//     if (!selectedUser || isSending) return;

//     const messageId = getMessageIdentifier(messageToDelete);
//     if (!messageId || String(messageId).startsWith("temp_")) {
//       alert("This message cannot be deleted yet.");
//       return;
//     }

//     const confirmed = window.confirm("Are you sure you want to delete this message?");
//     if (!confirmed) return;

//     try {
//       setDeletingMessageId(messageId);
//       setOpenMessageMenuId(null);
//       setError(null);

//       const token = localStorage.getItem("token") || localStorage.getItem("accessToken");

//       const headers = {
//         "Content-Type": "application/json",
//         Authorization: token ? `Bearer ${token}` : "",
//       };
//       const encodedMessageId = encodeURIComponent(messageId);

//       await axios.delete(`${API_BASE_URL}/api/chat/message/${encodedMessageId}`, {
//         headers,
//       });

//       removeMessageFromState(messageToDelete);
//     } catch (error) {
//       console.error("Error deleting message:", error);
//       if (error?.response?.status === 401) {
//         handleSessionExpired();
//         return;
//       }
//       const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || "Failed to delete message";
//       alert(errorMsg);
//     } finally {
//       setDeletingMessageId(null);
//       focusMessageInput();
//     }
//   };

//   const handleSendMessage = async (e) => {
//     e.preventDefault();
//     if (!message.trim() || !selectedUser || isSending) return;
//     const messageText = message.trim();
//     const tempMessage = {
//       id: `temp_${Date.now()}`,
//       text: messageText,
//       sender: "me",
//       senderRole: "counsellor",
//       time: new Date().toLocaleTimeString([], {
//         hour: "2-digit",
//         minute: "2-digit",
//       }),
//       fullTime: new Date().toISOString(),
//       status: "sending",
//       isTemporary: true,
//       isCall: false,
//     };
//     setMessages((prev) => [...prev, tempMessage]);
//     setMessage("");
//     focusMessageInput();
//     setIsSending(true);
//     setError(null);
//     try {
//       const sentMsg = await sendMessageToAPI({ messageContent: messageText });
//       setMessages((prev) => {
//         const withoutTemp = prev.filter((m) => !m.isTemporary);
//         if (!sentMsg) return withoutTemp;
//         const alreadyHas = withoutTemp.some(
//           (m) => m.messageId && sentMsg.messageId && m.messageId === sentMsg.messageId
//         );
//         if (alreadyHas) return withoutTemp;
//         return [
//           ...withoutTemp,
//           {
//             id: sentMsg._id || sentMsg.id || sentMsg.messageId,
//             _id: sentMsg._id || sentMsg.id,
//             messageId: sentMsg.messageId,
//             text: sentMsg.content,
//             sender: "me",
//             senderRole: "counsellor",
//             time: new Date(sentMsg.createdAt).toLocaleTimeString([], {
//               hour: "2-digit",
//               minute: "2-digit",
//             }),
//             fullTime: sentMsg.createdAt,
//             contentType: sentMsg.contentType,
//             isRead: sentMsg.isRead,
//             status: "sent",
//             isCall: false,
//           },
//         ];
//       });
//     } catch (err) {
//       setMessages((prev) =>
//         prev.map((msg) =>
//           msg.id === tempMessage.id ? { ...msg, status: "error" } : msg
//         )
//       );
//       setError("Failed to send message");
//       setTimeout(() => setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id)), 3000);
//     } finally {
//       setIsSending(false);
//       focusMessageInput();
//     }
//   };

//   const handleInputKeyDown = (e) => {
//     if (e.key === "Enter" && !e.shiftKey && !isSending) {
//       e.preventDefault();
//       handleSendMessage(e);
//       focusMessageInput();
//     }
//   };

//   useEffect(() => {
//     if (!isSending) focusMessageInput();
//   }, [isSending]);

//   const handleFileAttachClick = () => {
//     if (isSending) return;
//     fileInputRef.current?.click();
//   };

//   // ─── Camera Functions ──────────────────────────────────────────────────
//   const handleCameraClick = () => {
//     if (isSending) return;

//     const hasCamera = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;

//     if (!hasCamera) {
//       alert("Camera is not supported on this device. Please use the attachment option to share images.");
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
//           facingMode: "user",
//           width: { ideal: 1280 },
//           height: { ideal: 720 },
//         },
//       });

//       setCameraStream(stream);
//       setShowCameraPreview(true);

//       setTimeout(() => {
//         if (videoRef.current) {
//           videoRef.current.srcObject = stream;
//           videoRef.current.play().catch((err) => console.error("Video play error:", err));
//         }
//       }, 100);
//     } catch (error) {
//       console.error("Error accessing camera:", error);
//       if (error.name === "NotAllowedError") {
//         alert("Camera access was denied. Please allow camera access in your browser settings.");
//       } else if (error.name === "NotFoundError") {
//         alert("No camera found on this device. Please use the attachment option.");
//       } else {
//         alert("Failed to access camera. Please use the attachment option instead.");
//       }
//     }
//   };

//   const capturePhoto = () => {
//     const video = videoRef.current;
//     if (!video) {
//       alert("Camera not ready. Please try again.");
//       return;
//     }

//     if (video.videoWidth === 0 || video.videoHeight === 0) {
//       alert("Camera not ready. Please wait a moment and try again.");
//       return;
//     }

//     const canvas = document.createElement("canvas");
//     canvas.width = video.videoWidth || 1280;
//     canvas.height = video.videoHeight || 720;

//     const context = canvas.getContext("2d");
//     context.drawImage(video, 0, 0, canvas.width, canvas.height);

//     const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
//     setPhotoPreview(imageDataUrl);

//     closeCamera();
//   };

//   const closeCamera = () => {
//     if (cameraStream) {
//       cameraStream.getTracks().forEach((track) => track.stop());
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
//             <video ref={videoRef} autoPlay playsInline muted className="camera-preview-video" />
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
//             <button className="camera-capture-btn" onClick={capturePhoto} disabled={photoSending}>
//               {photoSending ? "⏳ Sending..." : "📸 Capture"}
//             </button>
//             <button className="camera-close-btn" onClick={closeCamera}>✕ Close</button>
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
//     } finally {
//       setPhotoSending(false);
//     }
//   };

//  const handleFileSelected = async (e) => {
//   const file = e.target.files?.[0];
//   if (!file || isSending || !selectedUser) return;

//   if (e.target === cameraInputRef.current) {
//     const reader = new FileReader();
//     reader.onload = (event) => {
//       setPhotoPreview(event.target?.result);
//     };
//     reader.readAsDataURL(file);
//   } else {
//     // Create temporary message with local preview
//     const tempFileMessage = {
//       id: `temp_file_${Date.now()}`,
//       text: file.name,
//       sender: "me",
//       senderRole: "counsellor",
//       time: new Date().toLocaleTimeString([], {
//         hour: "2-digit",
//         minute: "2-digit",
//       }),
//       fullTime: new Date().toISOString(),
//       contentType: file.type.startsWith("image/") ? "IMAGE" : "FILE",
//       attachmentUrl: URL.createObjectURL(file), // Local preview
//       attachmentName: file.name,
//       attachmentMimeType: file.type,
//       status: "sending",
//       isTemporary: true,
//       isCall: false,
//     };
//     setMessages((prev) => [...prev, tempFileMessage]);
//     setIsSending(true);
    
//     try {
//       const sentMsg = await sendMessageToAPI({ file });
      
//       // Remove temporary message and add the actual message from server
//       setMessages((prev) => {
//         const withoutTemp = prev.filter((msg) => !msg.isTemporary);
//         if (!sentMsg) return withoutTemp;
        
//         // Check if message already exists
//         const alreadyHas = withoutTemp.some(
//           (m) => m.messageId && sentMsg.messageId && m.messageId === sentMsg.messageId
//         );
//         if (alreadyHas) return withoutTemp;
        
//         // Create proper message with server data
//         return [
//           ...withoutTemp,
//           {
//             id: sentMsg._id || sentMsg.id || sentMsg.messageId,
//             _id: sentMsg._id || sentMsg.id,
//             messageId: sentMsg.messageId,
//             text: sentMsg.content || file.name,
//             sender: "me",
//             senderRole: "counsellor",
//             time: new Date(sentMsg.createdAt).toLocaleTimeString([], {
//               hour: "2-digit",
//               minute: "2-digit",
//             }),
//             fullTime: sentMsg.createdAt,
//             contentType: sentMsg.contentType || (file.type.startsWith("image/") ? "IMAGE" : "FILE"),
//             attachmentUrl: sentMsg.attachmentUrl || URL.createObjectURL(file),
//             attachmentName: sentMsg.attachmentName || file.name,
//             attachmentMimeType: sentMsg.attachmentMimeType || file.type,
//             isRead: sentMsg.isRead,
//             status: "sent",
//             isCall: false,
//           },
//         ];
//       });
      
//       // Save to localStorage
//       setOriginalMessages((prev) => {
//         const withoutTemp = prev.filter((msg) => !msg.isTemporary);
//         if (!sentMsg) return withoutTemp;
//         const alreadyHas = withoutTemp.some(
//           (m) => m.messageId && sentMsg.messageId && m.messageId === sentMsg.messageId
//         );
//         if (alreadyHas) return withoutTemp;
//         return [
//           ...withoutTemp,
//           {
//             id: sentMsg._id || sentMsg.id || sentMsg.messageId,
//             _id: sentMsg._id || sentMsg.id,
//             messageId: sentMsg.messageId,
//             text: sentMsg.content || file.name,
//             sender: "me",
//             senderRole: "counsellor",
//             time: new Date(sentMsg.createdAt).toLocaleTimeString([], {
//               hour: "2-digit",
//               minute: "2-digit",
//             }),
//             fullTime: sentMsg.createdAt,
//             contentType: sentMsg.contentType || (file.type.startsWith("image/") ? "IMAGE" : "FILE"),
//             attachmentUrl: sentMsg.attachmentUrl || URL.createObjectURL(file),
//             attachmentName: sentMsg.attachmentName || file.name,
//             attachmentMimeType: sentMsg.attachmentMimeType || file.type,
//             isRead: sentMsg.isRead,
//             status: "sent",
//             isCall: false,
//           },
//         ];
//       });
      
//     } catch (err) {
//       setMessages((prev) =>
//         prev.map((msg) =>
//           msg.id === tempFileMessage.id ? { ...msg, status: "error" } : msg
//         )
//       );
//       setError("Failed to send file");
//     } finally {
//       setIsSending(false);
//       e.target.value = "";
//     }
//   }
//   e.target.value = "";
// };
//   // ─── Call Functions ─────────────────────────────────────────────────────
//   const initiateStreamCall = async (requestedCallType = "video") => {
//     const normalizedMode = requestedCallType === "audio" || requestedCallType === "voice" ? "voice" : "video";
//     if (!selectedUser) {
//       setCallError("No user selected for call");
//       return;
//     }
//     const counselorId = getCounselorId();
//     const userId = getSelectedUserId();
//     if (!counselorId || !userId) {
//       setCallError("Missing user information");
//       return;
//     }
//     setIsInitiatingCall(true);
//     setCallError(null);
//     try {
//       const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
//       if (!token) throw new Error("Authentication token not found");
//       const requestBody = {
//         initiatorId: counselorId,
//         initiatorType: "counsellor",
//         receiverId: userId,
//         receiverType: "user",
//         callType: normalizedMode === "voice" ? "audio" : "video",
//       };
//       const response = await axios.post(
//         `${API_BASE_URL}/api/video/calls/initiate`,
//         requestBody,
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );
//       if (response.data && response.data.success) {
//         const callData = {
//           id: response.data.callData?.id,
//           callId: response.data.callId,
//           roomId: response.data.roomId,
//           name: selectedUser.name || USER_NAME,
//           type: normalizedMode,
//           callType: normalizedMode,
//           profilePic: getUserAvatarUrl() || getUserAvatarIcon(),
//           phoneNumber: selectedUser.phone || selectedUser.phoneNumber,
//           status: response.data.status || "ringing",
//           date: "Today",
//           time: new Date().toLocaleTimeString([], {
//             hour: "2-digit",
//             minute: "2-digit",
//           }),
//           apiCallData: response.data.callData,
//         };
//         setSelectedCall(callData);
//         setIsVideoModalOpen(true);
        
//         // Refresh call history after initiating
//         setTimeout(() => fetchCallHistory(), 2000);
//       } else {
//         throw new Error(response.data?.message || `Failed to initiate ${normalizedMode} call`);
//       }
//     } catch (error) {
//       console.error("Call initiation error:", error);
//       setCallError(error.response?.data?.message || error.message || "Failed to initiate call");
//     } finally {
//       setIsInitiatingCall(false);
//     }
//   };

//   const handleVideoCall = () => initiateStreamCall("video");
//   const handleVoiceCall = () => initiateStreamCall("audio");

//   const handleJoinIncomingCall = async (callId) => {
//     try {
//       const resolvedCallId = callId || incomingCallData?.callId || incomingCallData?.id || incomingCallData?._id;

//       if (!resolvedCallId) {
//         throw new Error("Missing callId for incoming call");
//       }

//       const token = localStorage.getItem("token") || localStorage.getItem("accessToken");

//       if (!COUNSELOR_ID) {
//         throw new Error("Counselor ID not found");
//       }

//       const response = await axios.put(
//         `${API_BASE_URL}/api/video/calls/${resolvedCallId}/accept`,
//         {
//           acceptorId: COUNSELOR_ID,
//           acceptorType: "counsellor",
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       if (response.data && response.data.success) {
//         let detailedCall = null;
//         try {
//           const detailsResponse = await axios.get(
//             `${API_BASE_URL}/api/video/calls/${resolvedCallId}/details`,
//             {
//               params: {
//                 userId: COUNSELOR_ID,
//                 userType: "counsellor",
//               },
//               headers: {
//                 Authorization: `Bearer ${token}`,
//               },
//             }
//           );
//           detailedCall = detailsResponse.data?.call || null;
//         } catch (detailsError) {
//           console.warn("Could not fetch accepted call details:", detailsError);
//         }

//         const incomingType = String(incomingCallData.callType || detailedCall?.type || "video").toLowerCase();
//         const modalType = incomingType === "audio" ? "voice" : incomingType;

//         const remoteParticipant = detailedCall
//           ? String(detailedCall.initiator?.id) === String(COUNSELOR_ID)
//             ? detailedCall.receiver
//             : detailedCall.initiator
//           : null;
//         const remoteParticipantDisplay = getAnonymousUserDisplay({
//           ...incomingCallData,
//           ...(remoteParticipant || {}),
//         });

//         const callDataForModal = {
//           id: detailedCall?.id || resolvedCallId,
//           callId: resolvedCallId,
//           roomId: response.data.roomId || detailedCall?.roomId || incomingCallData.roomId,
//           name: remoteParticipant?.displayName || remoteParticipant?.fullName || incomingCallData.name,
//           type: modalType,
//           callType: modalType,
//           profilePic: remoteParticipantDisplay.avatarUrl || remoteParticipant?.profilePhoto || incomingCallData.avatar,
//           phoneNumber: remoteParticipant?.phoneNumber || remoteParticipant?.phone || "",
//           status: response.data.status || detailedCall?.status || "active",
//           date: "Today",
//           time: new Date().toLocaleTimeString([], {
//             hour: "2-digit",
//             minute: "2-digit",
//           }),
//           apiCallData: detailedCall,
//           initiator: detailedCall?.initiator,
//           receiver: detailedCall?.receiver,
//           currentUserId: COUNSELOR_ID,
//           currentUserType: "counsellor",
//           isIncoming: true,
//         };
//         setSelectedCall(callDataForModal);
//         setIsVideoModalOpen(true);
        
//         // Refresh call history after accepting
//         await fetchCallHistory();
        
//         return { success: true };
//       }
//       throw new Error("Failed to join call");
//     } catch (error) {
//       console.error("Error joining call:", error);
//       throw error;
//     }
//   };

//   const handleRejectIncomingCall = async (callId) => {
//     const resolvedCallId = callId || incomingCallData?.callId || incomingCallData?.id || incomingCallData?._id;

//     try {
//       if (!resolvedCallId) {
//         return false;
//       }

//       const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
//       await axios.put(
//         `${API_BASE_URL}/api/video/calls/${resolvedCallId}/reject`,
//         {
//           userId: COUNSELOR_ID,
//           reason: "declined",
//         },
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
      
//       // Refresh call history after rejecting
//       await fetchCallHistory();
      
//       return true;
//     } catch (error) {
//       if (error?.response?.status === 404) {
//         try {
//           const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
//           await axios.post(
//             `${API_BASE_URL}/api/call/${resolvedCallId}/reject`,
//             { reason: "declined" },
//             {
//               headers: { Authorization: `Bearer ${token}` },
//             }
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

//   const handleEndIncomingCall = async (callId) => {
//     try {
//       const resolvedCallId = callId || selectedCall?.callId || incomingCallData?.callId || selectedCall?.id || incomingCallData?.id;

//       if (!resolvedCallId) {
//         return false;
//       }

//       const token = localStorage.getItem("token") || localStorage.getItem("accessToken");

//       await axios.put(
//         `${API_BASE_URL}/api/video/calls/${resolvedCallId}/end`,
//         {
//           userId: COUNSELOR_ID,
//           endedBy: "counsellor",
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );
      
//       // Refresh call history after ending
//       await fetchCallHistory();
      
//       return true;
//     } catch (error) {
//       return true;
//     }
//   };

//   // ─── Incoming Calls Polling ────────────────────────────────────────────
//   useEffect(() => {
//     let isMounted = true;
//     let intervalId = null;
//     const fetchIncomingCalls = async () => {
//       try {
//         const token = localStorage.getItem("token") || localStorage.getItem("accessToken");

//         if (!COUNSELOR_ID || !token || isVideoModalOpen) {
//           return;
//         }

//         const response = await axios.get(
//           `${API_BASE_URL}/api/video/calls/pending/${COUNSELOR_ID}`,
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           }
//         );

//         if (!isMounted) return;

//         const callsList = response.data.pendingRequests || response.data.waitingCalls || response.data.calls || [];

//         const currentIncomingId = incomingCallData?.callId || incomingCallData?.id || incomingCallData?._id;
//         const stillWaiting = currentIncomingId
//           ? callsList.some((c) => (c.callId || c.id || c._id) === currentIncomingId)
//           : false;

//         if (showIncomingModal && currentIncomingId && !stillWaiting) {
//           setShowIncomingModal(false);
//           setIncomingCallData({
//             name: "",
//             avatar: "👤",
//             callId: "",
//             roomId: "",
//             callType: "video",
//           });
//           return;
//         }

//         if (response.data.success && callsList.length > 0) {
//           const waitingCall = callsList.find((call) => {
//             const normalizedStatus = String(call.status || "").toLowerCase();
//             return (
//               !normalizedStatus ||
//               normalizedStatus === "waiting" ||
//               normalizedStatus === "ringing" ||
//               normalizedStatus === "pending" ||
//               normalizedStatus === "requested"
//             );
//           }) || callsList[0];

//           if (!waitingCall || showIncomingModal) {
//             return;
//           }

//           const fromData = waitingCall.from || {};
//           const anonymousCaller = getAnonymousUserDisplay({
//             ...waitingCall,
//             ...fromData,
//           });
//           let displayName = "Anonymous User";
//           if (anonymousCaller.name) displayName = anonymousCaller.name;
//           else if (fromData.isAnonymous) displayName = fromData.isAnonymous;
//           else if (fromData.displayName) displayName = fromData.displayName;
//           else if (fromData.fullName) displayName = fromData.fullName;
//           else if (fromData.name) displayName = fromData.name;
//           setIncomingCallData({
//             callId: waitingCall.callId || waitingCall.id || waitingCall._id,
//             id: waitingCall.id || waitingCall.callId || waitingCall._id || "",
//             _id: waitingCall._id || waitingCall.callId || waitingCall.id || "",
//             roomId: waitingCall.roomId || waitingCall.callId || waitingCall.id,
//             name: displayName,
//             avatar: anonymousCaller.avatarUrl || anonymousCaller.avatar,
//             callType: waitingCall.callType || "video",
//             from: fromData,
//             requestMessage: waitingCall.requestMessage || `Incoming ${waitingCall.callType || "video"} call...`,
//           });
//           setShowIncomingModal(true);
//         } else if (showIncomingModal) {
//           setShowIncomingModal(false);
//           setIncomingCallData({
//             name: "",
//             avatar: "👤",
//             callId: "",
//             roomId: "",
//             callType: "video",
//           });
//         }
//       } catch (error) {
//         console.error("Error polling for calls:", error);
//       }
//     };
//     intervalId = setInterval(fetchIncomingCalls, 5000);
//     return () => {
//       isMounted = false;
//       if (intervalId) clearInterval(intervalId);
//     };
//   }, [showIncomingModal, COUNSELOR_ID, isVideoModalOpen, incomingCallData?.callId]);

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

//   const handleCloseModal = () => {
//     setIsVideoModalOpen(false);
//     setSelectedCall(null);
//     setCallError(null);
//   };
//   const handleBack = () => navigate("/counselor-dashboard", { state: { selectedTab: "messages" } });
//   const getAvatarIcon = (gender) => {
//     if (gender === "male") return "👨";
//     if (gender === "female") return "👩";
//     return "👤";
//   };
//   const getUserAvatarIcon = () => userDetails.avatar || getAvatarIcon(userDetails.gender);

//   const getUserAvatarUrl = () => {
//     if (typeof userDetails.avatarUrl === "string" && userDetails.avatarUrl.trim()) {
//       return userDetails.avatarUrl.trim();
//     }
//     return null;
//   };

//   // ─── Scroll Functions ──────────────────────────────────────────────────
//   const handleScroll = useCallback(() => {
//     if (!messagesContainerRef.current) return;
//     const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
//     const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
//     setShouldScrollToBottom(isNearBottom);
//   }, []);

//   useEffect(() => {
//     const container = messagesContainerRef.current;
//     if (container) {
//       container.addEventListener("scroll", handleScroll);
//       return () => container.removeEventListener("scroll", handleScroll);
//     }
//   }, [handleScroll]);

//   const scrollToBottom = useCallback((behavior = "smooth", force = false) => {
//     if (messagesEndRef.current && (shouldScrollToBottom || force)) {
//       messagesEndRef.current.scrollIntoView({ behavior });
//     }
//   }, [shouldScrollToBottom]);

//   // Scroll to bottom when new items arrive
//   useEffect(() => {
//     const mergedItems = getMergedTimeline();
//     if (mergedItems.length === 0) return;

//     if (isInitialLoadRef.current) {
//       const timer = setTimeout(() => {
//         scrollToBottom("auto", true);
//         isInitialLoadRef.current = false;
//       }, 50);
//       return () => clearTimeout(timer);
//     } else if (shouldScrollToBottom) {
//       scrollToBottom("smooth");
//     }
//   }, [messages, callHistory, scrollToBottom, shouldScrollToBottom, getMergedTimeline]);

//   // ─── Initialize Chat ──────────────────────────────────────────────────
//   useEffect(() => {
//     if (selectedUser && COUNSELOR_ID) {
//       fetchMessagesFromAPI();
//     }
//   }, [selectedUser, chatId, COUNSELOR_ID]);

//   useEffect(() => {
//     if (callError) {
//       const timer = setTimeout(() => setCallError(null), 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [callError]);

//   // ─── Socket Connection ──────────────────────────────────────────────────
//   useEffect(() => {
//     const apiChatId = chatId;
//     if (!apiChatId || !selectedUser) return;

//     let mounted = true;

//     const onNewMessage = (messageData) => {
//       if (!mounted) return;
//       if (
//         messageData.senderRole === "counsellor" &&
//         String(messageData.senderId) === String(COUNSELOR_ID)
//       ) {
//         setMessages((prev) => {
//           const withoutTemp = prev.filter((msg) => !msg.isTemporary);
//           const alreadyHas = withoutTemp.some(
//             (msg) => msg.messageId && messageData.messageId && msg.messageId === messageData.messageId
//           );
//           if (alreadyHas) return withoutTemp;
//           return [
//             ...withoutTemp,
//             {
//               id: messageData._id || messageData.id || messageData.messageId,
//               _id: messageData._id || messageData.id,
//               messageId: messageData.messageId,
//               text: messageData.content,
//               sender: "me",
//               senderRole: "counsellor",
//               time: new Date(messageData.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
//               fullTime: messageData.createdAt,
//               contentType: messageData.contentType,
//               isRead: messageData.isRead,
//               status: "sent",
//               isCall: false,
//             },
//           ];
//         });
//         return;
//       }
//       const transformedMessage = {
//         id: messageData._id || messageData.id || messageData.messageId,
//         _id: messageData._id || messageData.id,
//         messageId: messageData.messageId,
//         text: messageData.content,
//         sender: "user",
//         senderRole: messageData.senderRole,
//         time: new Date(messageData.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
//         fullTime: messageData.createdAt,
//         contentType: messageData.contentType,
//         isRead: messageData.isRead,
//         status: "sent",
//         isCall: false,
//       };
//       setOriginalMessages((prev) => {
//         const isDuplicate = prev.some(
//           (msg) => msg.messageId && messageData.messageId && msg.messageId === messageData.messageId
//         );
//         if (isDuplicate) return prev;
//         return [...prev, transformedMessage];
//       });

//       setMessages((prev) => {
//         const isDuplicate = prev.some(
//           (msg) => msg.messageId && messageData.messageId && msg.messageId === messageData.messageId
//         );
//         if (isDuplicate) return prev;
//         return [...prev, transformedMessage];
//       });
//     };

//     const onTyping = ({ userRole, isTyping: typing }) => {
//       if (!mounted) return;
//       if (userRole === "user") setRemoteIsTyping(typing);
//     };

//     const onMessagesRead = () => {
//       if (!mounted) return;
//       setMessages((prev) => prev.map((msg) => msg.sender === "me" ? { ...msg, isRead: true } : msg));
//     };

//     const onPresenceUpdate = (payload = {}) => {
//       const presenceUserId = getPresenceUserId(payload);
//       if (!mounted || String(presenceUserId) !== String(USER_ID)) return;
//       const presence = getPresence(payload);
//       setRemotePresence((prev) => ({
//         isOnline: presence.isOnline,
//         lastSeen: resolveOfflineLastSeen(presence, prev.lastSeen),
//       }));
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
//       socket.on("presence-update", onPresenceUpdate);
//       socket.on("call_rejected", onCallRejected);
//       socket.on("call-status-update", onCallStatusUpdate);
//       socket.on("connect_error", onConnectError);
//     }).catch((err) => {
//       console.error("[SMSInput] Socket connect failed:", err.message);
//     });

//     return () => {
//       mounted = false;
//       const socket = chatSocketRef.current;
//       if (socket) {
//         socket.off("new-message", onNewMessage);
//         socket.off("user-typing", onTyping);
//         socket.off("messages-read", onMessagesRead);
//         socket.off("presence-update", onPresenceUpdate);
//         socket.off("call_rejected", onCallRejected);
//         socket.off("call-status-update", onCallStatusUpdate);
//         socket.off("connect_error", onConnectError);
//       }
//       chatSocketRef.current = null;
//     };
//   }, [chatId, selectedUser, COUNSELOR_ID, USER_ID]);

//   // ─── Render Call Item ──────────────────────────────────────────────────
//  // SMSInput.jsx - Updated with WhatsApp-style Call Display
// // ... (previous imports and code remain same until renderCallItem function)

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
//         statusColor = "#d32f2f";
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
//       <div className={`smsinput-message ${isOutgoing ? "sent" : "received"}`}>
//         <div className="message-bubble call-item" style={{ 
//           background: isOutgoing ? "#d9fdd3" : "#ffffff",
//           border: `1px solid ${isOutgoing ? "#25d366" : "#e9edef"}`,
//           borderRadius: "8px",
//           padding: "8px 12px",
//           maxWidth: "300px",
//           marginLeft: isOutgoing ? "auto" : "0",
//           marginRight: isOutgoing ? "0" : "auto",
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
//             <span className="message-time" style={{ 
//               fontSize: "11px", 
//               color: "#667781",
//               alignSelf: "flex-end"
//             }}>
//               {call.time}
//             </span>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // ─── Rest of the code remains the same until render ──────────────────

//   const renderMessageStatus = (message) => {
//     if (message.sender !== "me") return null;
//     switch (message.status) {
//       case "sending":
//         return <span className="msg-status sending">⌛</span>;
//       case "error":
//         return <span className="msg-status error">⚠️</span>;
//       default:
//         return null;
//     }
//   };

//   if (!selectedUser) {
//     return (
//       <div className="smsinput-container no-user">
//         <div className="smsinput-empty-state">
//           <span className="empty-icon">💬</span>
//           <h3>No user selected</h3>
//           <p>Please select a user from the list to start messaging</p>
//           <button className="back-to-list-btn" onClick={handleBack}>← Back to SMS List</button>
//         </div>
//       </div>
//     );
//   }

//   // ─── Render ──────────────────────────────────────────────────────────
//   const mergedTimeline = getMergedTimeline();

//   return (
//     <div className="smsinput-container">
//       {/* Header */}
//       <div className="smsinput-header">
//         <div className="header-left">
//           <button className="back-button" onClick={handleBack} title="Back to SMS List">
//             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//               <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor" />
//             </svg>
//           </button>
//           <div className="smsinput-user-info">
//             <div className="smsinput-user-avatar">
//               {getUserAvatarUrl() ? (
//                 <img src={getUserAvatarUrl()} alt={USER_NAME} className="smsinput-user-avatar-img" />
//               ) : (
//                 <span className="avatar-icon">{getUserAvatarIcon()}</span>
//               )}
//               <span className={`status-dot ${remoteStatusClass}`}></span>
//             </div>
//             <div className="smsinput-user-details">
//               <h3>{USER_NAME}</h3>
//               <p className="smsinput-user-status">{remotePresenceText}</p>
//             </div>
//           </div>
//         </div>
//         <div className="smsinput-call-buttons">
//           <button
//             className={`sms-call-btn sms-voice-call-btn ${isInitiatingCall ? "loading" : ""}`}
//             onClick={handleVoiceCall}
//             disabled={isInitiatingCall}
//             title="Voice call"
//             aria-label="Voice call"
//           >
//             <span className="call-icon" aria-hidden="true">
//               {isInitiatingCall ? <FaSpinner className="spinning" /> : <FaPhoneAlt />}
//             </span>
//           </button>
//           <button
//             className={`sms-call-btn sms-video-call-btn ${isInitiatingCall ? "loading" : ""}`}
//             onClick={handleVideoCall}
//             disabled={isInitiatingCall}
//             title="Video call"
//             aria-label="Video call"
//           >
//             <span className="call-icon" aria-hidden="true">
//               {isInitiatingCall ? <FaSpinner className="spinning" /> : <FaVideo />}
//             </span>
//           </button>
//         </div>
//       </div>

//       {/* Error Banner */}
//       {callError && (
//         <div className="sms-call-error-banner">
//           <span className="error-icon">⚠️</span>
//           <span className="error-text">{callError}</span>
//           <button className="error-close" onClick={() => setCallError(null)}>✕</button>
//         </div>
//       )}

//       {/* Messages Area - Using merged timeline */}
//       <div className="smsinput-messages" ref={messagesContainerRef}>
//         {isLoadingMessages && mergedTimeline.length === 0 ? (
//           <div className="sms-loading-messages">
//             <div className="sms-loading-spinner"></div>
//             <p>Loading messages...</p>
//           </div>
//         ) : error && mergedTimeline.length === 0 ? (
//           <div className="sms-error-message">
//             <span className="error-icon">⚠️</span>
//             <p>{error}</p>
//             <button onClick={fetchMessagesFromAPI} className="retry-btn">Retry</button>
//           </div>
//         ) : mergedTimeline.length === 0 ? (
//           <div className="sms-empty-messages">
//             <span className="empty-messages-icon">💬</span>
//             <p>No messages or calls yet</p>
//             <p className="empty-messages-subtext">Start a conversation by sending a message</p>
//           </div>
//         ) : (
//           mergedTimeline.map((item, index) => (
//             <React.Fragment key={item.id || `item_${index}`}>
//               {getMessageDayKey(item) !== getMessageDayKey(mergedTimeline[index - 1]) && formatMessageDay(item) && (
//                 <div className="sms-chat-date-separator">{formatMessageDay(item)}</div>
//               )}
              
//               {item.isCall ? (
//                 renderCallItem(item)
//               ) : (
//                 <div className={`smsinput-message ${item.sender === "me" ? "sent" : "received"}`}>
//                   <div className="message-bubble">
//                     <button
//                       type="button"
//                       className="sms-message-menu-btn"
//                       onClick={() => toggleMessageMenu(item)}
//                       disabled={String(deletingMessageId) === String(getMessageIdentifier(item))}
//                       title="Message options"
//                       aria-label="Message options"
//                     >
//                       <FaChevronDown />
//                     </button>
//                     {String(openMessageMenuId) === String(getMessageIdentifier(item)) && (
//                       <div className="sms-message-options-menu">
//                         <button
//                           type="button"
//                           className="sms-message-options-item delete"
//                           onClick={() => handleDeleteMessage(item)}
//                           disabled={String(deletingMessageId) === String(getMessageIdentifier(item))}
//                         >
//                           Delete
//                         </button>
//                       </div>
//                     )}
//                     {(item.contentType === "IMAGE" || item.attachmentMimeType?.startsWith("image/")) && item.attachmentUrl ? (
//                       <>
//                         <img src={item.attachmentUrl} alt={item.attachmentName || "Shared image"} className="sms-attachment-image" />
//                         <a href={item.attachmentUrl} target="_blank" rel="noreferrer" className="sms-attachment-link">
//                           {item.attachmentName || "Open image"}
//                         </a>
//                         {item.text && <div className="message-text"><TranslatedMessage text={item.text} translate={translate} lang={lang} /></div>}
//                       </>
//                     ) : item.contentType === "FILE" && item.attachmentUrl ? (
//                       <>
//                         <a href={item.attachmentUrl} target="_blank" rel="noreferrer" className="sms-attachment-link">
//                           {item.attachmentName || item.text || "Open attachment"}
//                         </a>
//                         {item.text && <div className="message-text"><TranslatedMessage text={item.text} translate={translate} lang={lang} /></div>}
//                       </>
//                     ) : (
//                       <div className="message-text"><TranslatedMessage text={item.text} translate={translate} lang={lang} /></div>
//                     )}
//                     <div className="message-footer">
//                       <span className="message-time">{item.time}</span>
//                       {renderMessageStatus(item)}
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </React.Fragment>
//           ))
//         )}
//         {remoteIsTyping && (
//           <div className="smsinput-message received">
//             <div className="message-bubble typing-bubble">
//               <div className="typing-dots">
//                 <span></span>
//                 <span></span>
//                 <span></span>
//               </div>
//             </div>
//           </div>
//         )}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Input Form */}
//       <form className="smsinput-form" onSubmit={handleSendMessage}>
//         <div className="smsinput-input-wrapper">
//           <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileSelected} />
//           <input ref={cameraInputRef} type="file" capture="environment" style={{ display: "none" }} onChange={handleFileSelected} />
//           <button type="button" className="attach-btn" title="Attach file" disabled={isSending} onClick={handleFileAttachClick}>📎</button>
//           <button type="button" className="camera-btn" title="Take photo" disabled={isSending} onClick={handleCameraClick}>📷</button>
//           <input
//             type="text"
//             ref={messageInputRef}
//             className="smsinput-input"
//             placeholder={isSending ? "Sending..." : "Type your message..."}
//             value={message}
//             onChange={(e) => setMessage(e.target.value)}
//             onKeyDown={handleInputKeyDown}
//             disabled={isSending}
//           />
//           <button
//             type="submit"
//             className={`send-btn ${message.trim() && !isSending ? "active" : ""}`}
//             disabled={!message.trim() || isSending}
//           >
//             {isSending ? "Sending..." : "Send"}
//           </button>
//         </div>
//       </form>

//       {/* Call Modals */}
//       <VideoCallModal
//         isOpen={isVideoModalOpen}
//         onClose={handleCloseModal}
//         callData={selectedCall}
//         callMode={selectedCall?.callType || selectedCall?.type || "video"}
//         currentUser={{ id: COUNSELOR_ID, role: "counsellor" }}
//         onEndCall={handleEndIncomingCall}
//       />

//       <IncomingCallModal
//         isOpen={showIncomingModal}
//         onClose={() => setShowIncomingModal(false)}
//         callType={incomingCallData.callType}
//         callerName={incomingCallData.name}
//         callerImage={incomingCallData.avatar}
//         callData={incomingCallData}
//         onAccept={handleJoinIncomingCall}
//         onReject={handleRejectIncomingCall}
//         fallbackName="Anonymous User"
//       />

//       {renderCameraPreview()}

//       <PhotoPreviewModal
//         isOpen={!!photoPreview}
//         photoSrc={photoPreview}
//         onSend={handleSendPhoto}
//         onCancel={() => setPhotoPreview(null)}
//         loading={photoSending}
//       />
//     </div>
//   );
// };

// export default SMSInput;



// SMSInput.jsx - Complete Fixed Version
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEllipsisV, FaPaperPlane, FaPhoneAlt, FaSpinner, FaSyncAlt, FaTrashAlt, FaVideo, FaCamera } from "react-icons/fa";
import "./SMSInput.css";
import { API_BASE_URL } from "../../../../axiosConfig";
import socketService from "../../../../services/socketService";
import VideoCallModal from "../../../UserDashboard/Tab/CallModal/VideoCallModal";
import PhotoPreviewModal from "../../../common/PhotoPreviewModal/PhotoPreviewModal";
import useRingtone from "../../../../hooks/useRingtone";
import IncomingCallModal from "../../../common/IncomingCallModal/IncomingCallModal";
import { useCounselorTranslation, useCounselorApiTranslation } from "../../../../i18n/LanguageContext";
import {
  formatPresenceText,
  getPresence,
  getPresenceUserId,
  resolveOfflineLastSeen,
} from "../../../../utils/presence";
import { getAnonymousUserDisplay } from "../../../../utils/anonymousUser";
import TranslatedMessage from "../../../common/TranslatedMessage";
import { getCallHistoryTone } from "../../../common/callHistoryStyle";

const SMSInput = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, lang } = useCounselorTranslation();
  const { translate } = useCounselorApiTranslation();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const chatSocketRef = useRef(null);
  const [remoteIsTyping, setRemoteIsTyping] = useState(false);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const isInitialLoadRef = useRef(true);

  // Call modal states
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [isInitiatingCall, setIsInitiatingCall] = useState(false);
  const [initiatingCallType, setInitiatingCallType] = useState(null);
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
  const [callHistory, setCallHistory] = useState([]);
  const [originalMessages, setOriginalMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [chatStatus, setChatStatus] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoSending, setPhotoSending] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [deletingCallId, setDeletingCallId] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const videoRef = useRef(null);
  const optionsRef = useRef(null);

  const handleSessionExpired = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/role-selector", {
      replace: true,
      state: {
        reason: "session-expired",
        message: "You were logged out because your account was used on another device.",
      },
    });
  };

  const focusMessageInput = () => {
    const input = messageInputRef.current;
    if (!input) return;
    requestAnimationFrame(() => input.focus({ preventScroll: true }));
    setTimeout(() => messageInputRef.current?.focus({ preventScroll: true }), 50);
  };

  const selectedUser = location.state?.selectedUser;
  const chatId = location.state?.chatId;
  const selectedUserPresence = getPresence(selectedUser || {});
  const [remotePresence, setRemotePresence] = useState({
    isOnline: selectedUserPresence.isOnline,
    lastSeen: selectedUserPresence.lastSeen,
  });

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
      const userData = localStorage.getItem("user") || localStorage.getItem("userData");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.role === "counselor" || user.role === "counsellor" || user.userType === "counselor") {
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
    const storedId = localStorage.getItem("counselorId") || localStorage.getItem("counsellorId");
    if (storedId) return storedId;
    const sessionId = sessionStorage.getItem("counselorId") || sessionStorage.getItem("counsellorId");
    if (sessionId) return sessionId;
    return "69c679b6e0e8f0800ff08fd1";
  };

  const currentCounselor = getCurrentCounselor();
  const COUNSELOR_ID = getCounselorId();
  const COUNSELOR_NAME = currentCounselor?.name || currentCounselor?.fullName || "Counselor";

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
    const anonymousDisplay = getAnonymousUserDisplay(selectedUser || {});
    return {
      id,
      name: selectedUser?.name || selectedUser?.fullName || selectedUser?.user?.name || selectedUser?.otherParty?.name || "User",
      gender: selectedUser?.gender || selectedUser?.user?.gender || selectedUser?.otherParty?.gender,
      phone: selectedUser?.phone || selectedUser?.phoneNumber || selectedUser?.user?.phone || selectedUser?.otherParty?.phone,
      email: selectedUser?.email || selectedUser?.user?.email || selectedUser?.otherParty?.email,
      avatar: anonymousDisplay.avatar || selectedUser?.avatar || selectedUser?.user?.avatar || selectedUser?.otherParty?.avatar,
      avatarUrl: anonymousDisplay.avatarUrl || selectedUser?.avatarUrl || selectedUser?.anonymousAvatarUrl || selectedUser?.profilePhoto?.url || selectedUser?.profilePhoto || selectedUser?.profilePic || selectedUser?.avatarImage || selectedUser?.user?.avatarUrl || selectedUser?.user?.anonymousAvatarUrl || selectedUser?.user?.profilePhoto?.url || selectedUser?.user?.profilePhoto || selectedUser?.user?.profilePic || selectedUser?.user?.avatarImage || selectedUser?.otherParty?.avatarUrl || selectedUser?.otherParty?.anonymousAvatarUrl || selectedUser?.otherParty?.profilePhoto?.url || selectedUser?.otherParty?.profilePhoto || selectedUser?.otherParty?.profilePic || selectedUser?.otherParty?.avatarImage,
    };
  };

  const userDetails = getUserDetails();
  const USER_ID = userDetails.id;
  const USER_NAME = userDetails.name;
  const remoteStatusClass = remotePresence.isOnline ? "online" : "offline";
  const remotePresenceText = formatPresenceText(remotePresence, {
    onlineText: t('online') || "Online",
    offlineText: t('offline') || "Offline",
  });

  const getMergedTimeline = useCallback(() => {
    const allItems = [...messages, ...callHistory];
    return allItems.sort((a, b) => {
      const timeA = a.fullTime || a.createdAt || a.timestamp || a.time;
      const timeB = b.fullTime || b.createdAt || b.timestamp || b.time;
      return new Date(timeA) - new Date(timeB);
    });
  }, [messages, callHistory]);

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
    return date.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  useEffect(() => {
    const presence = getPresence(selectedUser || {});
    setRemotePresence({
      isOnline: presence.isOnline,
      lastSeen: presence.lastSeen,
    });
  }, [selectedUser]);

  const getChatIdForAPI = () => {
    const candidateChatId = chatId || selectedUser?.chatId || selectedUser?.chat_id || selectedUser?.chat?.chatId || selectedUser?.chat?._id || selectedUser?.chat?.id;
    if (candidateChatId) return candidateChatId;
    const possibleId = selectedUser?.id || selectedUser?._id;
    if (typeof possibleId === "string" && possibleId.startsWith("chat_")) {
      return possibleId;
    }
    return null;
  };

  const normalizeCallType = (callType = "video") => {
    const normalized = String(callType || "").toLowerCase();
    return normalized === "audio" || normalized === "voice" ? "voice" : "video";
  };

  const fetchCallHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      const userId = getSelectedUserId();
      const counselorId = getCounselorId();

      if (!userId || !counselorId) {
        setCallHistory([]);
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/video/calls/history/${counselorId}`,
        {
          params: { 
            peerId: userId,
            peerType: "user",
            page: 1, 
            limit: 100 
          },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      const callsData = response.data?.calls || response.data?.history || [];
      
      if (callsData.length > 0) {
        const formattedCalls = callsData
          .filter((call) => String(call.withId || call.receiverId || call.peerId || call.receiver?.id || call.peer?.id) === String(userId))
          .map((call) => {
            const normalizedCallType = normalizeCallType(call.callType || call.type);

            return {
              id: call.id || call._id || `call_${Date.now()}_${Math.random()}`,
              callId: call.callId || call.id,
              type: normalizedCallType,
              direction: call.role === "initiator" || call.initiator?.id === counselorId ? "outgoing" : "incoming",
              status: call.status || "completed",
              time: new Date(call.timestamp || call.createdAt || call.startedAt || call.updatedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              fullTime: call.timestamp || call.createdAt || call.startedAt || call.updatedAt || new Date().toISOString(),
              timestamp: call.timestamp || call.createdAt || call.startedAt || call.updatedAt || new Date().toISOString(),
              duration: call.duration || 0,
              isCall: true,
              _original: call,
            };
          });
        setCallHistory(formattedCalls);
      } else {
        setCallHistory([]);
      }
    } catch (error) {
      console.error("Error fetching call history:", error);
      setCallHistory([]);
    }
  }, []);

  const fetchMessagesFromAPI = async () => {
    if (!selectedUser) return;
    try {
      const apiChatId = getChatIdForAPI();
      if (!apiChatId) {
        setError("Chat ID not found");
        return;
      }
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
        }
      );
      
      if (response.data && response.data.messages) {
        if (response.data.chatStatus) setChatStatus(response.data.chatStatus);
        const transformedMessages = response.data.messages.map((msg, index) => ({
          id: msg._id || msg.id || msg.messageId || index,
          _id: msg._id || msg.id,
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
          isCall: false,
        }));
        setOriginalMessages(transformedMessages);
        setMessages(transformedMessages);
        saveMessagesToLocalStorage(transformedMessages);
      }
      
      await fetchCallHistory();
      
    } catch (error) {
      console.error("Error fetching messages:", error);
      if (error?.response?.status === 401) {
        handleSessionExpired();
        return;
      }
      loadMessagesFromLocalStorage();
      await fetchCallHistory();
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleClearChat = async () => {
    const confirmed = window.confirm(
      t('confirm_clear_chat') || 'Are you sure? This will delete all messages in this chat. You can start a new conversation after.'
    );
    if (!confirmed) return;

    try {
      setIsSending(true);
      const apiChatId = getChatIdForAPI();

      if (!apiChatId) {
        alert(t('error_chat_id_not_found') || 'Error: Chat ID not found');
        return;
      }

      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');

      await axios.delete(`${API_BASE_URL}/api/chat/clear/${apiChatId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setMessages([]);
      setOriginalMessages([]);
      setCallHistory([]);
      setMessage('');
      setChatStatus(null);
      saveMessagesToLocalStorage([]);

      alert(t('chat_cleared_restart') || 'Chat cleared! You can now start a new conversation.');
    } catch (error) {
      console.error('Error clearing chat:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to clear chat';
      alert(t('error_clear_chat') || `Error: ${errorMsg}`);
    } finally {
      setIsSending(false);
      setShowOptions(false);
    }
  };

  const counselorOptionsMenuItems = [
    { id: 1, label: t('refresh_messages') || 'Refresh messages', icon: <FaSyncAlt /> },
    { id: 2, label: t('clear_chat') || 'Clear Chat', icon: <FaTrashAlt /> },
  ];

  const handleOptionsMenuClick = (item) => {
    setShowOptions(false);
    if (item.id === 1) {
      fetchMessagesFromAPI();
      return;
    }
    if (item.id === 2) {
      handleClearChat();
    }
  };

  const saveMessagesToLocalStorage = (messagesToSave) => {
    try {
      const savedChats = JSON.parse(localStorage.getItem("smsChats") || "[]");
      const chatIdToSave = getChatIdForAPI();
      const existingChatIndex = savedChats.findIndex((chat) => chat.chatId === chatIdToSave);
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
      if (savedChat && savedChat.messages) {
        setOriginalMessages(savedChat.messages);
        setMessages(savedChat.messages);
      }
    } catch (error) {}
  };

  const sendMessageToAPI = async ({ messageContent = "", file = null }) => {
    try {
      const apiChatId = getChatIdForAPI();
      if (!apiChatId) {
        throw new Error("Chat ID not found");
      }
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      let response;
      if (file) {
        const formData = new FormData();
        if (messageContent.trim()) formData.append("content", messageContent.trim());
        formData.append("attachment", file);
        response = await axios.post(
          `${API_BASE_URL}/api/chat/chat/${apiChatId}/message`,
          formData,
          {
            headers: { Authorization: token ? `Bearer ${token}` : "" },
          }
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
          }
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

  const getMessageIdentifier = (msg) => msg?._id || msg?.id || msg?.messageId;

  const removeMessageFromState = (messageToDelete) => {
    const targetId = getMessageIdentifier(messageToDelete);
    const isSameMessage = (msg) => {
      const currentId = getMessageIdentifier(msg);
      return currentId && targetId && String(currentId) === String(targetId);
    };

    setMessages((prev) => prev.filter((msg) => !isSameMessage(msg)));
    setOriginalMessages((prev) => {
      const updatedMessages = prev.filter((msg) => !isSameMessage(msg));
      saveMessagesToLocalStorage(updatedMessages);
      return updatedMessages;
    });
  };

  const handleDeleteMessage = async (messageToDelete) => {
    if (!selectedUser || isSending) return;

    const messageId = getMessageIdentifier(messageToDelete);
    if (!messageId || String(messageId).startsWith("temp_")) {
      alert("This message cannot be deleted yet.");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this message?");
    if (!confirmed) return;

    try {
      setDeletingMessageId(messageId);
      setError(null);

      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");

      const headers = {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      };
      const encodedMessageId = encodeURIComponent(messageId);

      await axios.delete(`${API_BASE_URL}/api/chat/message/${encodedMessageId}`, {
        headers,
      });

      removeMessageFromState(messageToDelete);
    } catch (error) {
      console.error("Error deleting message:", error);
      if (error?.response?.status === 401) {
        handleSessionExpired();
        return;
      }
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || "Failed to delete message";
      alert(errorMsg);
    } finally {
      setDeletingMessageId(null);
      focusMessageInput();
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
      fullTime: new Date().toISOString(),
      status: "sending",
      isTemporary: true,
      isCall: false,
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
          (m) => m.messageId && sentMsg.messageId && m.messageId === sentMsg.messageId
        );
        if (alreadyHas) return withoutTemp;
        return [
          ...withoutTemp,
          {
            id: sentMsg._id || sentMsg.id || sentMsg.messageId,
            _id: sentMsg._id || sentMsg.id,
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
            isCall: false,
          },
        ];
      });
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessage.id ? { ...msg, status: "error" } : msg
        )
      );
      setError("Failed to send message");
      setTimeout(() => setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id)), 3000);
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

  // ─── Camera Functions ──────────────────────────────────────────────────
  const handleCameraClick = () => {
    if (isSending) return;

    const hasCamera = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;

    if (!hasCamera) {
      alert("Camera is not supported on this device. Please use the attachment option to share images.");
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
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setCameraStream(stream);
      setShowCameraPreview(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => console.error("Video play error:", err));
        }
      }, 100);
    } catch (error) {
      console.error("Error accessing camera:", error);
      if (error.name === "NotAllowedError") {
        alert("Camera access was denied. Please allow camera access in your browser settings.");
      } else if (error.name === "NotFoundError") {
        alert("No camera found on this device. Please use the attachment option.");
      } else {
        alert("Failed to access camera. Please use the attachment option instead.");
      }
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) {
      alert("Camera not ready. Please try again.");
      return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      alert("Camera not ready. Please wait a moment and try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setPhotoPreview(imageDataUrl);

    closeCamera();
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
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
            <video ref={videoRef} autoPlay playsInline muted className="camera-preview-video" />
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
            <button className="camera-capture-btn" onClick={capturePhoto} disabled={photoSending}>
              {photoSending ? "⏳ Sending..." : "📸 Capture"}
            </button>
            <button className="camera-close-btn" onClick={closeCamera}>✕ Close</button>
          </div>
        </div>
      </div>
    );
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
      
      const tempFileMessage = {
        id: `temp_photo_${Date.now()}`,
        text: `📷 Photo`,
        sender: "me",
        senderRole: "counsellor",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        fullTime: new Date().toISOString(),
        contentType: "IMAGE",
        attachmentUrl: photoPreview,
        attachmentName: `photo_${Date.now()}.jpg`,
        status: "sending",
        isTemporary: true,
        isCall: false,
      };
      setMessages((prev) => [...prev, tempFileMessage]);
      
      const sentMsg = await sendMessageToAPI({ file });
      
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
            id: sentMsg._id || sentMsg.id || sentMsg.messageId,
            _id: sentMsg._id || sentMsg.id,
            messageId: sentMsg.messageId,
            text: sentMsg.content || "📷 Photo",
            sender: "me",
            senderRole: "counsellor",
            time: new Date(sentMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            fullTime: sentMsg.createdAt,
            contentType: sentMsg.contentType || "IMAGE",
            attachmentUrl: sentMsg.attachmentUrl || photoPreview,
            attachmentName: sentMsg.attachmentName || `photo_${Date.now()}.jpg`,
            isRead: sentMsg.isRead,
            status: "sent",
            isCall: false,
          },
        ];
      });
      
      setPhotoPreview(null);
    } finally {
      setPhotoSending(false);
    }
  };

  // ─── FIXED: File Selection Handler ────────────────────────────────────
  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file || isSending || !selectedUser) return;

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
      sender: "me",
      senderRole: "counsellor",
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
          id: sentMsg._id || sentMsg.id || sentMsg.messageId,
          _id: sentMsg._id || sentMsg.id,
          messageId: sentMsg.messageId,
          text: sentMsg.content || (isImage ? "📷 Image" : `📎 ${file.name}`),
          sender: "me",
          senderRole: "counsellor",
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
          id: sentMsg._id || sentMsg.id || sentMsg.messageId,
          _id: sentMsg._id || sentMsg.id,
          messageId: sentMsg.messageId,
          text: sentMsg.content || (isImage ? "📷 Image" : `📎 ${file.name}`),
          sender: "me",
          senderRole: "counsellor",
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
        saveMessagesToLocalStorage(updated);
        return updated;
      });
      
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempFileMessage.id ? { ...msg, status: "error" } : msg
        )
      );
      setError("Failed to send file");
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

  // ─── Call Functions ─────────────────────────────────────────────────────
  const initiateStreamCall = async (requestedCallType = "video") => {
    const normalizedMode = requestedCallType === "audio" || requestedCallType === "voice" ? "voice" : "video";
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
    setInitiatingCallType(normalizedMode);
    setCallError(null);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
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
        }
      );
      if (response.data && response.data.success) {
        const callData = {
          id: response.data.callData?.id,
          callId: response.data.callId,
          roomId: response.data.roomId,
          name: selectedUser.name || USER_NAME,
          type: normalizedMode,
          callType: normalizedMode,
          profilePic: getUserAvatarUrl() || getUserAvatarIcon(),
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
        
        setTimeout(() => fetchCallHistory(), 2000);
      } else {
        throw new Error(response.data?.message || `Failed to initiate ${normalizedMode} call`);
      }
    } catch (error) {
      console.error("Call initiation error:", error);
      setCallError(error.response?.data?.message || error.message || "Failed to initiate call");
    } finally {
      setIsInitiatingCall(false);
      setInitiatingCallType(null);
    }
  };

  const handleDeleteCall = async (call) => {
    const callIdToDelete = call?.callId || call?.id || call?._id;
    if (!callIdToDelete) {
      alert("This call cannot be deleted yet.");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this call history item?");
    if (!confirmed) return;

    try {
      setDeletingCallId(String(callIdToDelete));
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");

      await axios.delete(`${API_BASE_URL}/api/video/calls/${encodeURIComponent(callIdToDelete)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const matchesDeletedCall = (item) =>
        String(item.callId || item.id || item._id) === String(callIdToDelete);

      setCallHistory((prev) => prev.filter((item) => !matchesDeletedCall(item)));
    } catch (error) {
      console.error("Error deleting call:", error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || "Failed to delete call";
      alert(errorMsg);
    } finally {
      setDeletingCallId(null);
      focusMessageInput();
    }
  };

  const handleVideoCall = () => initiateStreamCall("video");
  const handleVoiceCall = () => initiateStreamCall("audio");

  const handleJoinIncomingCall = async (callId) => {
    try {
      const resolvedCallId = callId || incomingCallData?.callId || incomingCallData?.id || incomingCallData?._id;

      if (!resolvedCallId) {
        throw new Error("Missing callId for incoming call");
      }

      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");

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
        }
      );

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
            }
          );
          detailedCall = detailsResponse.data?.call || null;
        } catch (detailsError) {
          console.warn("Could not fetch accepted call details:", detailsError);
        }

        const incomingType = String(incomingCallData.callType || detailedCall?.type || "video").toLowerCase();
        const modalType = incomingType === "audio" ? "voice" : incomingType;

        const remoteParticipant = detailedCall
          ? String(detailedCall.initiator?.id) === String(COUNSELOR_ID)
            ? detailedCall.receiver
            : detailedCall.initiator
          : null;
        const remoteParticipantDisplay = getAnonymousUserDisplay({
          ...incomingCallData,
          ...(remoteParticipant || {}),
        });

        const callDataForModal = {
          id: detailedCall?.id || resolvedCallId,
          callId: resolvedCallId,
          roomId: response.data.roomId || detailedCall?.roomId || incomingCallData.roomId,
          name: remoteParticipant?.displayName || remoteParticipant?.fullName || incomingCallData.name,
          type: modalType,
          callType: modalType,
          profilePic: remoteParticipantDisplay.avatarUrl || remoteParticipant?.profilePhoto || incomingCallData.avatar,
          phoneNumber: remoteParticipant?.phoneNumber || remoteParticipant?.phone || "",
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
        
        await fetchCallHistory();
        
        return { success: true };
      }
      throw new Error("Failed to join call");
    } catch (error) {
      console.error("Error joining call:", error);
      throw error;
    }
  };

  const handleRejectIncomingCall = async (callId) => {
    const resolvedCallId = callId || incomingCallData?.callId || incomingCallData?.id || incomingCallData?._id;

    try {
      if (!resolvedCallId) {
        return false;
      }

      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      await axios.put(
        `${API_BASE_URL}/api/video/calls/${resolvedCallId}/reject`,
        {
          userId: COUNSELOR_ID,
          reason: "declined",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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
            }
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

  const handleEndIncomingCall = async (callId) => {
    try {
      const resolvedCallId = callId || selectedCall?.callId || incomingCallData?.callId || selectedCall?.id || incomingCallData?.id;

      if (!resolvedCallId) {
        return false;
      }

      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");

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
        }
      );
      
      await fetchCallHistory();
      
      return true;
    } catch (error) {
      return true;
    }
  };

  // ─── Incoming Calls Polling ────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    let intervalId = null;
    const fetchIncomingCalls = async () => {
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("accessToken");

        if (!COUNSELOR_ID || !token || isVideoModalOpen) {
          return;
        }

        const response = await axios.get(
          `${API_BASE_URL}/api/video/calls/pending/${COUNSELOR_ID}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!isMounted) return;

        const callsList = response.data.pendingRequests || response.data.waitingCalls || response.data.calls || [];

        const currentIncomingId = incomingCallData?.callId || incomingCallData?.id || incomingCallData?._id;
        const stillWaiting = currentIncomingId
          ? callsList.some((c) => (c.callId || c.id || c._id) === currentIncomingId)
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
          const anonymousCaller = getAnonymousUserDisplay({
            ...waitingCall,
            ...fromData,
          });
          let displayName = "Anonymous User";
          if (anonymousCaller.name) displayName = anonymousCaller.name;
          else if (fromData.isAnonymous) displayName = fromData.isAnonymous;
          else if (fromData.displayName) displayName = fromData.displayName;
          else if (fromData.fullName) displayName = fromData.fullName;
          else if (fromData.name) displayName = fromData.name;
          setIncomingCallData({
            callId: waitingCall.callId || waitingCall.id || waitingCall._id,
            id: waitingCall.id || waitingCall.callId || waitingCall._id || "",
            _id: waitingCall._id || waitingCall.callId || waitingCall.id || "",
            roomId: waitingCall.roomId || waitingCall.callId || waitingCall.id,
            name: displayName,
            avatar: anonymousCaller.avatarUrl || anonymousCaller.avatar,
            callType: waitingCall.callType || "video",
            from: fromData,
            requestMessage: waitingCall.requestMessage || `Incoming ${waitingCall.callType || "video"} call...`,
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
  }, [showIncomingModal, COUNSELOR_ID, isVideoModalOpen, incomingCallData?.callId]);

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
  const handleBack = () => navigate("/counselor-dashboard", { state: { selectedTab: "messages" } });
  const getAvatarIcon = (gender) => {
    if (gender === "male") return "👨";
    if (gender === "female") return "👩";
    return "👤";
  };
  const getUserAvatarIcon = () => userDetails.avatar || getAvatarIcon(userDetails.gender);

  const getUserAvatarUrl = () => {
    if (typeof userDetails.avatarUrl === "string" && userDetails.avatarUrl.trim()) {
      return userDetails.avatarUrl.trim();
    }
    return null;
  };

  // ─── Scroll Functions ──────────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldScrollToBottom(isNearBottom);
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const scrollToBottom = useCallback((behavior = "smooth", force = false) => {
    if (messagesEndRef.current && (shouldScrollToBottom || force)) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  }, [shouldScrollToBottom]);

  useEffect(() => {
    const mergedItems = getMergedTimeline();
    if (mergedItems.length === 0) return;

    if (isInitialLoadRef.current) {
      const timer = setTimeout(() => {
        scrollToBottom("auto", true);
        isInitialLoadRef.current = false;
      }, 50);
      return () => clearTimeout(timer);
    } else if (shouldScrollToBottom) {
      scrollToBottom("smooth");
    }
  }, [messages, callHistory, scrollToBottom, shouldScrollToBottom, getMergedTimeline]);

  // ─── Initialize Chat ──────────────────────────────────────────────────
  useEffect(() => {
    if (selectedUser && COUNSELOR_ID) {
      fetchMessagesFromAPI();
    }
  }, [selectedUser, chatId, COUNSELOR_ID]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!selectedUser || !COUNSELOR_ID) return;

    let cancelled = false;

    const syncMessagesSilently = async () => {
      if (document.visibilityState !== "visible") return;

      const apiChatId = getChatIdForAPI();
      if (!apiChatId) return;

      try {
        const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
        const response = await axios.get(
          `${API_BASE_URL}/api/chat/chat/${apiChatId}/messages`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : "",
            },
          },
        );

        if (cancelled || !response.data?.messages) return;
        if (response.data.chatStatus) setChatStatus(response.data.chatStatus);

        const transformedMessages = response.data.messages.map((msg, index) => ({
          id: msg._id || msg.id || msg.messageId || index,
          _id: msg._id || msg.id,
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
          isCall: false,
        }));

        const sameMessageList = (current) => {
          const withoutTemp = current.filter((msg) => !msg.isTemporary);
          if (withoutTemp.length !== transformedMessages.length) return false;
          return transformedMessages.every((msg, index) => {
            const currentMsg = withoutTemp[index];
            return (
              String(currentMsg?.messageId || currentMsg?.id || currentMsg?._id) ===
              String(msg.messageId || msg.id || msg._id)
            );
          });
        };

        setOriginalMessages((prev) => {
          if (sameMessageList(prev)) return prev;
          return transformedMessages;
        });
        setMessages((prev) => {
          if (sameMessageList(prev)) return prev;
          const temporaryMessages = prev.filter((msg) => msg.isTemporary);
          const nextMessages = [...transformedMessages, ...temporaryMessages];
          saveMessagesToLocalStorage(nextMessages);
          return nextMessages;
        });
      } catch (error) {
        if (error?.response?.status === 401) handleSessionExpired();
      }
    };

    const intervalId = setInterval(syncMessagesSilently, 1500);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [selectedUser, chatId, COUNSELOR_ID]);

  useEffect(() => {
    if (callError) {
      const timer = setTimeout(() => setCallError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [callError]);

  // ─── Socket Connection ──────────────────────────────────────────────────
  useEffect(() => {
    const apiChatId = getChatIdForAPI();
    if (!apiChatId || !selectedUser) return;

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
        selectedUser?.id,
        selectedUser?._id,
        selectedUser?.chatId,
        selectedUser?.publicChatId,
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
      if (
        messageData.senderRole === "counsellor" &&
        String(messageData.senderId) === String(COUNSELOR_ID)
      ) {
        setMessages((prev) => {
          const withoutTemp = prev.filter((msg) => !msg.isTemporary);
          const alreadyHas = withoutTemp.some(
            (msg) => msg.messageId && messageData.messageId && msg.messageId === messageData.messageId
          );
          if (alreadyHas) return withoutTemp;
          return [
            ...withoutTemp,
            {
              id: messageData._id || messageData.id || messageData.messageId,
              _id: messageData._id || messageData.id,
              messageId: messageData.messageId,
              text: messageData.content,
              sender: "me",
              senderRole: "counsellor",
              time: new Date(messageData.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              fullTime: messageData.createdAt,
              contentType: messageData.contentType,
              isRead: messageData.isRead,
              status: "sent",
              isCall: false,
            },
          ];
        });
        return;
      }
      const transformedMessage = {
        id: messageData._id || messageData.id || messageData.messageId,
        _id: messageData._id || messageData.id,
        messageId: messageData.messageId,
        text: messageData.content,
        sender: "user",
        senderRole: messageData.senderRole,
        time: new Date(messageData.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        fullTime: messageData.createdAt,
        contentType: messageData.contentType,
        isRead: messageData.isRead,
        status: "sent",
        isCall: false,
      };
      setOriginalMessages((prev) => {
        const isDuplicate = prev.some(
          (msg) => msg.messageId && messageData.messageId && msg.messageId === messageData.messageId
        );
        if (isDuplicate) return prev;
        return [...prev, transformedMessage];
      });

      setMessages((prev) => {
        const isDuplicate = prev.some(
          (msg) => msg.messageId && messageData.messageId && msg.messageId === messageData.messageId
        );
        if (isDuplicate) return prev;
        return [...prev, transformedMessage];
      });
    };

    const onTyping = ({ userRole, isTyping: typing }) => {
      if (!mounted) return;
      if (userRole === "user") setRemoteIsTyping(typing);
    };

    const onMessagesRead = () => {
      if (!mounted) return;
      setMessages((prev) => prev.map((msg) => msg.sender === "me" ? { ...msg, isRead: true } : msg));
    };

    const onPresenceUpdate = (payload = {}) => {
      const presenceUserId = getPresenceUserId(payload);
      if (!mounted || String(presenceUserId) !== String(USER_ID)) return;
      const presence = getPresence(payload);
      setRemotePresence((prev) => ({
        isOnline: presence.isOnline,
        lastSeen: resolveOfflineLastSeen(presence, prev.lastSeen),
      }));
    };

    const closeCallUi = () => {
      setIsVideoModalOpen(false);
      setSelectedCall(null);
      setShowIncomingModal(false);
      setIncomingCallData({
        name: "",
        avatar: "👤",
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
      if (normalizedStatus === "rejected" || normalizedStatus === "ended" || normalizedStatus === "cancelled" || normalizedStatus === "canceled" || normalizedStatus === "expired") {
        closeCallUi();
        fetchCallHistory();
      }
    };

    const onCallTerminated = (payload = {}) => {
      if (!mounted) return;
      closeCallUi();
      fetchCallHistory();
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
      socket.on("presence-update", onPresenceUpdate);
      socket.on("call_rejected", onCallRejected);
      socket.on("call-status-update", onCallStatusUpdate);
      socket.on("call_ended", onCallTerminated);
      socket.on("call-ended", onCallTerminated);
      socket.on("call_cancelled", onCallTerminated);
      socket.on("call_expired", onCallTerminated);
      socket.on("connect_error", onConnectError);
    }).catch((err) => {
      console.error("[SMSInput] Socket connect failed:", err.message);
    });

    return () => {
      mounted = false;
      const socket = chatSocketRef.current;
      if (socket) {
        socket.off("new-message", onNewMessage);
        socket.off("message-notification", onNewMessage);
        socket.off("user-typing", onTyping);
        socket.off("messages-read", onMessagesRead);
        socket.off("presence-update", onPresenceUpdate);
        socket.off("call_rejected", onCallRejected);
        socket.off("call-status-update", onCallStatusUpdate);
        socket.off("call_ended", onCallTerminated);
        socket.off("call-ended", onCallTerminated);
        socket.off("call_cancelled", onCallTerminated);
        socket.off("call_expired", onCallTerminated);
        socket.off("connect_error", onConnectError);
      }
      chatSocketRef.current = null;
    };
  }, [chatId, selectedUser, COUNSELOR_ID, USER_ID]);

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
      if (isOutgoing) {
        statusText = "Cancelled";
        statusIcon = <FaPhoneAlt aria-hidden="true" />;
        statusColor = "#d32f2f";
      } else {
        statusText = "Missed";
        statusIcon = "❌";
        statusColor = "#d32f2f";
      }
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
    const callTextColor = callTone.variant === "neutral" ? statusColor : callTone.color;

    return (
      <div className={`smsinput-message ${isOutgoing ? "sent" : "received"}`}>
        <div className="message-bubble call-item" style={{ 
          background: "#ffffff",
          "--call-history-border-color": callTone.borderColor,
          border: "1px solid #e9edef",
          borderLeft: `4px solid ${callTone.borderColor}`,
          borderRadius: "8px",
          padding: "8px 12px",
          maxWidth: "300px",
          marginLeft: isOutgoing ? "auto" : "0",
          marginRight: isOutgoing ? "0" : "auto",
        }}>
          <div className="call-item-content" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px", color: callTextColor }}>{callIcon}</span>
            <div className="call-info" style={{ flex: 1 }}>
              <div style={{ fontWeight: "500", fontSize: "14px", color: callTextColor }}>
                {isOutgoing ? "Outgoing" : "Incoming"} {callLabel} call
              </div>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "4px",
                fontSize: "12px",
                color: callTextColor
              }}>
                <span>{statusIcon}</span>
                <span>{statusText}</span>
                {durationText && <span>{durationText}</span>}
              </div>
            </div>
            <span className="message-time" style={{ 
              fontSize: "11px", 
              color: callTextColor,
              alignSelf: "flex-end"
            }}>
              {call.time}
            </span>
            <button
              type="button"
              className="sms-message-delete-btn"
              onClick={() => handleDeleteCall(call)}
              disabled={String(deletingCallId) === String(call.callId || call.id || call._id)}
              title="Delete call"
              aria-label="Delete call"
            >
              {String(deletingCallId) === String(call.callId || call.id || call._id) ? (
                <span className="delete-loading">⌛</span>
              ) : (
                <span className="delete-icon">🗑️</span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Render Message Status ──────────────────────────────────────────────────
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
          <button className="back-to-list-btn" onClick={handleBack}>← Back to SMS List</button>
        </div>
      </div>
    );
  }

  // ─── FIXED: Render Message Content ────────────────────────────────────
  const renderMessageContent = (item) => {
    // Check if it's an image
    const isImage = item.contentType === "IMAGE" || 
                    (item.attachmentUrl && 
                     (item.attachmentUrl.startsWith('data:image') || 
                      item.attachmentUrl.startsWith('blob:') ||
                      /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(item.attachmentUrl)));

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
            className="sms-attachment-image"
            loading="lazy"
            style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
            onError={(e) => {
              e.target.style.display = 'none';
              // Show fallback text
              const parent = e.target.parentElement;
              if (parent) {
                const fallback = document.createElement('div');
                fallback.className = 'message-text';
                fallback.textContent = `📷 ${item.attachmentName || 'Image'}`;
                parent.appendChild(fallback);
              }
            }}
          />
          {item.text && item.text !== item.attachmentName && (
            <div className="message-text" style={{ marginTop: '4px' }}>
              <TranslatedMessage text={item.text} translate={translate} lang={lang} />
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
              className="sms-attachment-link"
              style={{ color: '#075e54', textDecoration: 'underline' }}
            >
              {item.attachmentName || item.text || 'Attachment'}
            </a>
          </div>
          {item.text && item.text !== item.attachmentName && (
            <div className="message-text" style={{ marginTop: '4px' }}>
              <TranslatedMessage text={item.text} translate={translate} lang={lang} />
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

  // ─── Render ──────────────────────────────────────────────────────────
  const mergedTimeline = getMergedTimeline();

  return (
    <div className="smsinput-container">
      {/* Header */}
      <div className="smsinput-header">
        <div className="header-left">
          <button className="back-button" onClick={handleBack} title="Back to SMS List">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor" />
            </svg>
          </button>
          <div className="smsinput-user-info">
            <div className="smsinput-user-avatar">
              {getUserAvatarUrl() ? (
                <img src={getUserAvatarUrl()} alt={USER_NAME} className="smsinput-user-avatar-img" />
              ) : (
                <span className="avatar-icon">{getUserAvatarIcon()}</span>
              )}
              <span className={`status-dot ${remoteStatusClass}`}></span>
            </div>
            <div className="smsinput-user-details">
              <h3>{USER_NAME}</h3>
              <p className="smsinput-user-status">{remotePresenceText}</p>
            </div>
          </div>
        </div>
        <div className="smsinput-call-buttons">
          <button
            className={`sms-call-btn sms-voice-call-btn ${initiatingCallType === "voice" ? "loading" : ""}`}
            onClick={handleVoiceCall}
            disabled={isInitiatingCall}
            title="Voice call"
            aria-label="Voice call"
          >
            <span className="call-icon" aria-hidden="true">
              {initiatingCallType === "voice" ? <FaSpinner className="spinning" /> : <FaPhoneAlt />}
            </span>
          </button>
          <button
            className={`sms-call-btn sms-video-call-btn ${initiatingCallType === "video" ? "loading" : ""}`}
            onClick={handleVideoCall}
            disabled={isInitiatingCall}
            title="Video call"
            aria-label="Video call"
          >
            <span className="call-icon" aria-hidden="true">
              {initiatingCallType === "video" ? <FaSpinner className="spinning" /> : <FaVideo />}
            </span>
          </button>
          <div className="sms-more-options" ref={optionsRef}>
            <button
              className="sms-call-btn sms-more-options-btn"
              onClick={() => setShowOptions((visible) => !visible)}
              title="More options"
              aria-label="More options"
              aria-expanded={showOptions}
              aria-haspopup="menu"
            >
              <span className="call-icon" aria-hidden="true">
                <FaEllipsisV />
              </span>
            </button>
            {showOptions && (
              <div className="sms-chat-dropdown-menu" role="menu">
                {counselorOptionsMenuItems.map((item) => (
                  <button
                    key={item.id}
                    className="sms-chat-dropdown-item"
                    onClick={() => handleOptionsMenuClick(item)}
                    role="menuitem"
                  >
                    <span className="sms-chat-dropdown-icon" aria-hidden="true">{item.icon}</span>
                    <span className="sms-chat-dropdown-text">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {callError && (
        <div className="sms-call-error-banner">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{callError}</span>
          <button className="error-close" onClick={() => setCallError(null)}>✕</button>
        </div>
      )}

      {/* Messages Area - FIXED: Using renderMessageContent properly */}
      <div className="smsinput-messages" ref={messagesContainerRef}>
        {isLoadingMessages && mergedTimeline.length === 0 ? (
          <div className="sms-loading-messages">
            <div className="sms-loading-spinner"></div>
            <p>Loading messages...</p>
          </div>
        ) : error && mergedTimeline.length === 0 ? (
          <div className="sms-error-message">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <button onClick={fetchMessagesFromAPI} className="retry-btn">Retry</button>
          </div>
        ) : mergedTimeline.length === 0 ? (
          <div className="sms-empty-messages">
            <span className="empty-messages-icon">💬</span>
            <p>No messages or calls yet</p>
            <p className="empty-messages-subtext">Start a conversation by sending a message</p>
          </div>
        ) : (
          mergedTimeline.map((item, index) => (
            <React.Fragment key={item.id || `item_${index}`}>
              {getMessageDayKey(item) !== getMessageDayKey(mergedTimeline[index - 1]) && formatMessageDay(item) && (
                <div className="sms-chat-date-separator">{formatMessageDay(item)}</div>
              )}
              
              {item.isCall ? (
                renderCallItem(item)
              ) : (
                <div className={`smsinput-message ${item.sender === "me" ? "sent" : "received"}`}>
                  <div className="message-bubble">
                    {/* Render message content based on type */}
                    {renderMessageContent(item)}
                    
                    <div className="message-footer">
                      <span className="message-time">{item.time}</span>
                      {renderMessageStatus(item)}
                      {!item.isTemporary && item.status !== "sending" && item.status !== "error" && (
                        <button
                          type="button"
                          className="sms-message-delete-btn"
                          onClick={() => handleDeleteMessage(item)}
                          disabled={String(deletingMessageId) === String(getMessageIdentifier(item))}
                          title="Delete message"
                          aria-label="Delete message"
                        >
                          {String(deletingMessageId) === String(getMessageIdentifier(item)) ? (
                            <span className="delete-loading">⌛</span>
                          ) : (
                            <span className="delete-icon">🗑️</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
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
          <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileSelected} />
          <input ref={cameraInputRef} type="file" capture="environment" style={{ display: "none" }} onChange={handleFileSelected} />
          <button type="button" className="attach-btn" title="Attach file" disabled={isSending} onClick={handleFileAttachClick}>📎</button>
          <button type="button" className="camera-btn" title="Take photo" disabled={isSending} onClick={handleCameraClick}>📷</button>
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
            aria-label={isSending ? "Sending message" : "Send message"}
            title={isSending ? "Sending..." : "Send message"}
          >
            {isSending ? (
              <FaSpinner className="send-btn-spinner" aria-hidden="true" />
            ) : (
              <FaPaperPlane aria-hidden="true" />
            )}
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

      {renderCameraPreview()}

      <PhotoPreviewModal
        isOpen={!!photoPreview}
        photoSrc={photoPreview}
        onSend={handleSendPhoto}
        onCancel={() => setPhotoPreview(null)}
        loading={photoSending}
      />
    </div>
  );
};

export default SMSInput;
