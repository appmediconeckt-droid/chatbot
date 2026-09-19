// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { useLocation } from "react-router-dom";
// import axios from "../../../axiosConfig.js";
// import {
//   FaMicrophone,
//   FaMicrophoneSlash,
//   FaPaperPlane,
//   FaPaperclip,
//   FaPhone,
//   FaPhoneSlash,
//   FaSearch,
//   FaVideo,
//   FaVideoSlash,
// } from "react-icons/fa";
// import {
//   acceptCall as acceptChatCall,
//   endCall as endChatCall,
//   getAssetUrl,
//   getChatList,
//   getConversation,
//   getCurrentUserId,
//   sendAttachment,
//   sendMessage,
//   startCall as startChatCall,
//   unwrapApiArray,
//   unwrapApiObject,
// } from "../doctorChatApi";
// import useCallSocket from "../useDoctorCallSocket";
// import useWebRTCCall from "../useDoctorCallMedia";
// import { API_BASE_URL, getAuthHeaders } from "../doctorApi.js";
// import "./DoctorSmsPatient.css";

// const getInitials = (name) =>
//   String(name || "NA")
//     .split(" ")
//     .map((part) => part[0])
//     .slice(0, 2)
//     .join("")
//     .toUpperCase();

// const formatChatTime = (value) => {
//   if (!value) return "";
//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return value;
//   return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
// };

// const formatFileSize = (value) => {
//   const bytes = Number(value || 0);
//   if (!bytes) return "";
//   if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
//   return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
// };

// const getFirstValue = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");

// const getUserId = (user) => getFirstValue(
//   user?.user_id,
//   user?.userId,
//   user?.id,
//   user?._id,
//   user?.patient_id,
//   user?.patientId,
//   user?.doctor_id,
//   user?.doctorId
// );

// const getUserRole = (user) => String(
//   getFirstValue(user?.role, user?.user_role, user?.userRole, user?.type, user?.user_type) || ""
// ).toLowerCase();

// const isPatientRole = (role) => role === "patient" || role.includes("patient");
// const isDoctorRole = (role) => role === "doctor" || role.includes("doctor");

// const getAppointmentPatient = (appointment) => {
//   const patient = appointment.patient || appointment.patient_data || appointment.patient_details || appointment.user || {};
//   const id = getFirstValue(
//     patient.user_id,
//     patient.userId,
//     appointment.patient_user_id,
//     appointment.patientUserId,
//     appointment.patient_id,
//     appointment.patientId,
//     patient.id,
//     patient._id
//   );
//   if (!id) return null;
//   return {
//     ...patient,
//     id,
//     user_id: getFirstValue(patient.user_id, patient.userId, appointment.patient_user_id, appointment.patientUserId, id),
//     full_name: getFirstValue(
//       patient.full_name,
//       patient.fullname,
//       patient.name,
//       patient.patient_name,
//       appointment.patient_name,
//       appointment.name,
//       "Unknown Patient"
//     ),
//     phone: getFirstValue(patient.phone, patient.phone_number, patient.contact_number, appointment.patient_phone, appointment.phone),
//     role: "patient",
//   };
// };

// // /chat/list can return either a nested patient, sender/receiver objects, or
// // only flat sender/receiver fields. Always resolve the other participant and
// // never turn the logged-in doctor into a patient row.
// const resolvePatientFromChat = (item, currentUserId) => {
//   const lastMessage = typeof (item.lastMessage || item.last_message || item.latest_message) === "object"
//     ? (item.lastMessage || item.last_message || item.latest_message)
//     : {};
//   const flatParticipants = [
//     {
//       id: getFirstValue(item.sender_id, item.senderId, item.from_user_id),
//       full_name: getFirstValue(item.sender_name, item.senderName, item.from_user_name),
//       phone: getFirstValue(item.sender_phone, item.senderPhone),
//       role: getFirstValue(item.sender_role, item.senderRole),
//     },
//     {
//       id: getFirstValue(item.receiver_id, item.receiverId, item.to_user_id),
//       full_name: getFirstValue(item.receiver_name, item.receiverName, item.to_user_name),
//       phone: getFirstValue(item.receiver_phone, item.receiverPhone),
//       role: getFirstValue(item.receiver_role, item.receiverRole),
//     },
//   ];
//   const candidates = [
//     item.patient,
//     item.patient_id || item.patientId ? {
//       id: getFirstValue(item.patient_id, item.patientId),
//       full_name: getFirstValue(item.patient_name, item.patientName),
//       phone: getFirstValue(item.patient_phone, item.patientPhone),
//       role: "patient",
//     } : null,
//     item.other_user,
//     item.otherUser,
//     item.participant,
//     item.sender_user,
//     item.senderUser,
//     typeof item.sender === "object" ? item.sender : null,
//     item.receiver_user,
//     item.receiverUser,
//     typeof item.receiver === "object" ? item.receiver : null,
//     item.user,
//     lastMessage.patient,
//     lastMessage.sender_user,
//     lastMessage.senderUser,
//     typeof lastMessage.sender === "object" ? lastMessage.sender : null,
//     lastMessage.receiver_user,
//     lastMessage.receiverUser,
//     typeof lastMessage.receiver === "object" ? lastMessage.receiver : null,
//     ...flatParticipants,
//     {
//       id: getFirstValue(lastMessage.sender_id, lastMessage.senderId, lastMessage.from_user_id),
//       full_name: getFirstValue(lastMessage.sender_name, lastMessage.senderName),
//       phone: getFirstValue(lastMessage.sender_phone, lastMessage.senderPhone),
//       role: getFirstValue(lastMessage.sender_role, lastMessage.senderRole),
//     },
//     {
//       id: getFirstValue(lastMessage.receiver_id, lastMessage.receiverId, lastMessage.to_user_id),
//       full_name: getFirstValue(lastMessage.receiver_name, lastMessage.receiverName),
//       phone: getFirstValue(lastMessage.receiver_phone, lastMessage.receiverPhone),
//       role: getFirstValue(lastMessage.receiver_role, lastMessage.receiverRole),
//     },
//     // Some backends return the participant itself as each /chat/list row.
//     item,
//   ].filter(Boolean);

//   const isOtherUser = (candidate) => {
//     const id = getUserId(candidate);
//     return id !== undefined && String(id) !== String(currentUserId);
//   };
//   const explicitPatient = candidates.find((candidate) => isOtherUser(candidate) && isPatientRole(getUserRole(candidate)));
//   if (explicitPatient) return explicitPatient;

//   return candidates.find((candidate) => isOtherUser(candidate) && !isDoctorRole(getUserRole(candidate))) || null;
// };

// const normalizeAttachment = (source, fallbackFile) => {
//   const data = unwrapApiObject(source);
//   let rawAttachment = data.attachment || data.file || data.media || data.document;
//   if (typeof rawAttachment === "string" && rawAttachment.trim().startsWith("{")) {
//     try {
//       rawAttachment = JSON.parse(rawAttachment);
//     } catch {
//       // Keep a non-JSON attachment string as-is.
//     }
//   }
//   const messageValue = typeof data.message === "string" ? data.message.trim() : "";
//   const normalizedMessagePath = messageValue.replace(/\\/g, "/");
//   const looksLikeFilePath = /(^|\/)(uploads?|attachments?|files?|media)\//i.test(normalizedMessagePath) || /\.(png|jpe?g|gif|webp|bmp|svg|pdf|docx?|xlsx?|csv|txt|zip|rar)(\?.*)?$/i.test(normalizedMessagePath);
//   const attachment = typeof rawAttachment === "string"
//     ? { url: rawAttachment.replace(/\\/g, "/") }
//     : rawAttachment || (looksLikeFilePath ? { url: normalizedMessagePath } : data);
//   const urlCandidates = [
//     attachment.attachment_url,
//     attachment.attachmentUrl,
//     attachment.attachment_path,
//     attachment.attachmentPath,
//     attachment.file_url,
//     attachment.fileUrl,
//     attachment.file_path,
//     attachment.filePath,
//     attachment.media_url,
//     attachment.mediaUrl,
//     attachment.image_url,
//     attachment.imageUrl,
//     attachment.secure_url,
//     attachment.secureUrl,
//     attachment.cloudinary_url,
//     attachment.cloudinaryUrl,
//     attachment.url,
//     data.attachment_url,
//     data.attachmentUrl,
//     data.file_url,
//     data.fileUrl,
//     data.media_url,
//     data.mediaUrl,
//     data.image_url,
//     data.imageUrl,
//     data.secure_url,
//     data.secureUrl,
//     data.cloudinary_url,
//     data.cloudinaryUrl,
//     data.url,
//     /^https?:\/\//i.test(messageValue) ? messageValue : undefined,
//     fallbackFile?.url
//   ].filter(Boolean);
//   // APIs may return both `attachment_url: "photo.jpeg"` and a real
//   // Cloudinary URL in another field. Always prefer the fetchable absolute URL.
//   const url = urlCandidates.find((candidate) => /^https?:\/\//i.test(String(candidate)) || String(candidate).startsWith("blob:"))
//     || urlCandidates.find((candidate) => String(candidate).replace(/\\/g, "/").includes("/"))
//     || "";
//   const normalizedUrl = String(url || "").replace(/\\/g, "/");
//   const derivedName = normalizedUrl ? decodeURIComponent(normalizedUrl.split("/").pop()?.split("?")[0] || "") : "";
//   const name = getFirstValue(
//     attachment.attachment_name,
//     attachment.attachmentName,
//     attachment.file_name,
//     attachment.fileName,
//     attachment.name,
//     fallbackFile?.name,
//     derivedName
//   );
//   const type = getFirstValue(
//     attachment.message_type,
//     attachment.messageType,
//     data.message_type,
//     data.messageType,
//     attachment.attachment_type,
//     attachment.attachmentType,
//     attachment.file_type,
//     attachment.mime_type,
//     attachment.type,
//     fallbackFile?.type
//   );
//   const size = getFirstValue(attachment.attachment_size, attachment.attachmentSize, attachment.file_size, attachment.size, fallbackFile?.size);

//   if (!url && !name) return null;

//   const imageHint = `${type || ""} ${name || ""} ${normalizedUrl}`.toLowerCase();
//   const isImage =
//     String(type || "").toLowerCase() === "image" ||
//     String(type || "").toLowerCase().startsWith("image/") ||
//     /\.(png|jpe?g|gif|webp|bmp|svg|heic|avif)(\?|#|$)/i.test(imageHint) ||
//     /\/image\/upload\//i.test(normalizedUrl);

//   return {
//     name: name || "Attachment",
//     type: isImage ? "image" : type || "document",
//     size: typeof size === "number" ? formatFileSize(size) : size || "",
//     url: getAssetUrl(normalizedUrl),
//   };
// };

// const cleanAttachmentMessageText = (text, file) => {
//   const value = String(text || "").trim();
//   if (!value) return "";
//   const normalized = value.replace(/\\/g, "/").toLowerCase();
//   const fileUrl = String(file?.url || "").replace(/\\/g, "/").toLowerCase();
//   const fileName = String(file?.name || "").toLowerCase();

//   const pathOnlyMessage = /(^|\/)(uploads?|attachments?|files?|media)\//i.test(normalized) || /\.(png|jpe?g|gif|webp|bmp|svg|pdf|docx?|xlsx?|csv|txt|zip|rar)(\?.*)?$/i.test(normalized);
//   if (pathOnlyMessage || normalized.includes("/uploads/") || normalized === fileUrl || normalized === fileName) {
//     return "";
//   }

//   return value;
// };

// const getLastMessageText = (item) => {
//   const lastMessage = item.lastMessage || item.last_message || item.latest_message;
//   if (typeof lastMessage === "string") return lastMessage;
//   return lastMessage?.message || lastMessage?.text || item.message || item.content || "No messages yet";
// };

// const AttachmentPreviewImage = ({ file }) => {
//   const candidates = useMemo(() => {
//     const primary = String(file?.url || "");
//     if (!primary) return [];
//     const apiFallback = primary.includes("/api/")
//       ? primary
//       : primary.replace(/(https?:\/\/[^/]+)\/(uploads?|attachments?|files?|media)\//i, "$1/api/$2/");
//     return Array.from(new Set([primary, apiFallback].filter(Boolean)));
//   }, [file?.url]);
//   const [previewUrl, setPreviewUrl] = useState("");

//   useEffect(() => {
//     let active = true;
//     let objectUrl = "";
//     const loadAuthenticatedImage = async () => {
//       const headers = { ...getAuthHeaders() };
//       delete headers["Content-Type"];
//       delete headers["content-type"];
//       for (const candidate of candidates) {
//         try {
//           const response = await fetch(candidate, { headers });
//           if (!response.ok) continue;
//           const blob = await response.blob();
//           const knownImageFile = /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(file?.name || candidate);
//           if (!blob.type.startsWith("image/") && !knownImageFile) continue;
//           objectUrl = URL.createObjectURL(blob);
//           if (active) setPreviewUrl(objectUrl);
//           return;
//         } catch {
//           // Try the next supported asset URL.
//         }
//       }
//       if (active) setPreviewUrl("");
//     };
//     setPreviewUrl("");
//     loadAuthenticatedImage();
//     return () => {
//       active = false;
//       if (objectUrl) URL.revokeObjectURL(objectUrl);
//     };
//   }, [candidates]);

//   if (!previewUrl) return null;

//   return (
//     <a href={previewUrl} target="_blank" rel="noreferrer" className="sms-file-preview" title="Open attachment">
//       <img src={previewUrl} alt="Attachment preview" />
//     </a>
//   );
// };

// const normalizeChatMessage = (msg, index, currentUserId) => {
//   const senderObject = typeof msg.sender === "object" ? msg.sender : null;
//   const senderId = getFirstValue(msg.sender_id, msg.senderId, msg.from_user_id, getUserId(senderObject), msg.user_id);
//   const rawSenderRole = getFirstValue(
//     typeof msg.sender === "string" ? msg.sender : undefined,
//     msg.sender_role,
//     msg.senderRole,
//     getUserRole(senderObject),
//     msg.role
//   );
//   const normalizedRole = String(rawSenderRole || "").toLowerCase();
//   const senderRole = isDoctorRole(normalizedRole) ? "doctor" : isPatientRole(normalizedRole) ? "patient" : "";
//   const createdAt = msg.time || msg.created_at || msg.createdAt || new Date().toISOString();
//   const file = normalizeAttachment(msg);
//   const rawText = msg.message || msg.text || msg.content || "";

//   return {
//     id: msg.id || msg._id || `api-${index}`,
//     sender: senderRole || (String(senderId) === String(currentUserId) ? "doctor" : "patient"),
//     text: cleanAttachmentMessageText(rawText, file),
//     file,
//     time: formatChatTime(createdAt) || createdAt,
//   };
// };

// function PatientList() {
//   const location = useLocation();
//   const appointmentCallTarget = location.state?.callTargetId || "";
//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [patients, setPatients] = useState([]);
//   const [selectedPatientId, setSelectedPatientId] = useState(appointmentCallTarget);
//   const [message, setMessage] = useState("");
//   const [messagesByPatient, setMessagesByPatient] = useState({});
//   const [status, setStatus] = useState("loading");
//   const [error, setError] = useState("");
//   const [isSending, setIsSending] = useState(false);
//   const [pendingAttachment, setPendingAttachment] = useState(null);
//   const [activeCall, setActiveCall] = useState(null);
//   const [doctorAppointments, setDoctorAppointments] = useState([]);
//   const [postCallAppointment, setPostCallAppointment] = useState(null);
//   const [showPostCallForm, setShowPostCallForm] = useState(false);
//   const [savingConsultation, setSavingConsultation] = useState(false);
//   const [remoteConsultationForm, setRemoteConsultationForm] = useState({ diagnosis: "", medicine: "", advice: "", recommendedTests: [] });
//   const [callSeconds, setCallSeconds] = useState(0);
//   const messageAreaRef = useRef(null);
//   const fileInputRef = useRef(null);
//   const videoPreviewRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const remoteAudioRef = useRef(null);
//   const mediaStreamRef = useRef(null);
//   const appointmentCallStartedRef = useRef(false);
//   const rtc = useWebRTCCall({ callId: activeCall?.id, peerUserId: selectedPatientId, callType: activeCall?.type || "voice" });

//   const openPostCallConsultation = (call = activeCall) => {
//     const appointmentId = getFirstValue(call?.appointment_id, call?.appointmentId, location.state?.appointment?.apiId, location.state?.appointment?.id);
//     const appointment = doctorAppointments.find((item) => String(item.id || item._id) === String(appointmentId)) ||
//       doctorAppointments.find((item) => {
//         const patientId = getFirstValue(item.patient_id, item.patientId, item.patient?.id, item.patient?._id);
//         const mode = String(getFirstValue(item.consultation_mode, item.consultationMode, item.mode, "")).toLowerCase();
//         const status = String(getFirstValue(item.appointment_status, item.status, "")).toLowerCase();
//         return String(patientId) === String(selectedPatientId) && (mode.includes("video") || mode.includes("voice")) && !status.includes("complete");
//       });
//     if (!appointment) return;
//     setPostCallAppointment(appointment);
//     setRemoteConsultationForm({ diagnosis: "", medicine: "", advice: "", recommendedTests: [] });
//     setShowPostCallForm(true);
//   };

//   useEffect(() => {
//     if (videoPreviewRef.current && rtc.localStream) videoPreviewRef.current.srcObject = rtc.localStream;
//     if (remoteVideoRef.current && rtc.remoteStream) remoteVideoRef.current.srcObject = rtc.remoteStream;
//     if (remoteAudioRef.current && rtc.remoteStream) remoteAudioRef.current.srcObject = rtc.remoteStream;
//   }, [rtc.localStream, rtc.remoteStream, activeCall?.type]);

//   useEffect(() => {
//     rtc.setAudioMuted(Boolean(activeCall?.isMuted));
//   }, [activeCall?.isMuted, rtc.localStream, rtc.setAudioMuted]);

//   useEffect(() => {
//     rtc.setVideoOff(Boolean(activeCall?.isVideoOff));
//   }, [activeCall?.isVideoOff, rtc.localStream, rtc.setVideoOff]);

//   useEffect(() => {
//     if (activeCall?.status === "connected" && activeCall?.direction !== "incoming") rtc.startOffer();
//   }, [activeCall?.status, activeCall?.direction, activeCall?.id]);

//   useCallSocket({
//     onRinging: (call) => {
//       const currentUserId = getCurrentUserId();
//       const callerId = getFirstValue(call?.caller_id, call?.callerId, call?.sender_id, call?.user_id);
//       const receiverId = getFirstValue(call?.receiver_id, call?.receiverId, call?.callee_id, call?.calleeId);
//       if (receiverId && String(receiverId) !== String(currentUserId)) return;
//       if (!receiverId && callerId && String(callerId) === String(currentUserId)) return;
//       if (callerId) setSelectedPatientId(callerId);
//       setCallSeconds(0);
//       setActiveCall({ ...call, id: getFirstValue(call?.id, call?._id, call?.call_id, call?.callId), type: getFirstValue(call?.call_type, call?.callType, call?.type, "voice"), status: "ringing", direction: "incoming", isMuted: false, isVideoOff: false });
//     },
//     onAccepted: (call) => setActiveCall((current) => current ? { ...current, ...call, status: "connected" } : current),
//     onRejected: () => { stopLocalMedia(); setActiveCall(null); },
//     onCancelled: () => { stopLocalMedia(); setActiveCall(null); },
//     onEnded: () => { openPostCallConsultation(); stopLocalMedia(); setActiveCall(null); },
//     onMissed: () => { stopLocalMedia(); setActiveCall(null); },
//   });

//   useEffect(() => {
//     setPendingAttachment((current) => {
//       if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
//       return null;
//     });
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   }, [selectedPatientId]);

//   useEffect(() => {
//     let active = true;
//     const loadPatients = async () => {
//       try {
//         if (active) setStatus((current) => current === "succeeded" ? current : "loading");
//         setError("");
//         const doctorId = getCurrentUserId();
//         const [chatList, appointmentResponse] = await Promise.all([
//           getChatList(),
//           axios.get(`${API_BASE_URL}/appointments`, {
//             headers: getAuthHeaders(),
//             params: { doctor_id: doctorId },
//           }).catch(() => null),
//         ]);
//         const currentUserId = getCurrentUserId();
//         const resolvedPatients = chatList.map((item) => {
//           const patient = resolvePatientFromChat(item, currentUserId);
//           if (!patient) return null;
//           const lastMessage = item.lastMessage || item.last_message || item.latest_message;
//           const receiverId =
//             getUserId(patient) ||
//             item.patient_id;

//           if (!receiverId || String(receiverId) === String(currentUserId)) return null;

//           return {
//             id: receiverId,
//             receiverId,
//             name: patient.full_name || patient.fullname || patient.name || patient.patient_name || item.patient_name || "Unknown Patient",
//             age: patient.age || "NA",
//             gender: patient.gender || "Male",
//             condition: patient.condition || patient.diagnosis || item.condition || "No condition",
//             status: patient.status || item.status || "Stable",
//             phone: patient.contact_number || patient.phone || patient.phone_number || "",
//             bloodGroup: patient.bloodGroup || patient.blood_group || "",
//             previewTitle: patient.condition || patient.diagnosis || item.condition || "No condition",
//             lastMessage: getLastMessageText(item),
//             messageTime: formatChatTime(lastMessage?.created_at || lastMessage?.createdAt || item.updated_at || item.created_at),
//             unread: item.unread || item.unread_count || patient.unread || patient.unread_count || 0,
//           };
//         }).filter(Boolean);
//         const appointments = appointmentResponse ? unwrapApiArray(appointmentResponse.data) : [];
//         setDoctorAppointments(appointments);
//         const appointmentPatients = Array.from(new Map(
//           appointments
//             .map(getAppointmentPatient)
//             .filter(Boolean)
//             .filter((patient) => String(getUserId(patient)) !== String(currentUserId))
//             .map((patient) => [String(getUserId(patient)), patient])
//         ).values());
//         const listedIds = new Set(resolvedPatients.map((patient) => String(patient.id)));
//         const missingAppointmentPatients = appointmentPatients.filter((patient) => !listedIds.has(String(getUserId(patient))));
//         const conversationResults = await Promise.allSettled(
//           missingAppointmentPatients.map(async (patient) => ({
//             patient,
//             conversation: await getConversation(getUserId(patient)),
//           }))
//         );
//         conversationResults.forEach((result) => {
//           if (result.status !== "fulfilled" || !result.value.conversation.length) return;
//           const { patient, conversation } = result.value;
//           const latestMessage = conversation[conversation.length - 1];
//           resolvedPatients.push({
//             id: getUserId(patient),
//             receiverId: getUserId(patient),
//             name: patient.full_name,
//             age: patient.age || "NA",
//             gender: patient.gender || patient.patient_gender || "NA",
//             condition: patient.condition || patient.diagnosis || "No condition",
//             status: patient.status || "Stable",
//             phone: patient.phone || "",
//             bloodGroup: patient.blood_group || patient.bloodGroup || "",
//             previewTitle: patient.condition || patient.diagnosis || "No condition",
//             lastMessage: getLastMessageText(latestMessage),
//             messageTime: formatChatTime(latestMessage.created_at || latestMessage.createdAt || latestMessage.time),
//             unread: 0,
//           });
//         });
//         const apiPatients = Array.from(
//           new Map(resolvedPatients.map((patient) => [String(patient.id), patient])).values()
//         );
//         if (!active) return;
//         setPatients(apiPatients);
//         setSelectedPatientId((current) =>
//           apiPatients.some((patient) => String(patient.id) === String(current)) ? current : (apiPatients[0]?.id || "")
//         );
//         setStatus("succeeded");
//       } catch (err) {
//         if (!active) return;
//         setError(err.response?.data?.message || err.message || "Failed to load chat list");
//         setPatients([]);
//         setStatus("failed");
//       }
//     };

//     loadPatients();
//     const refreshTimer = window.setInterval(loadPatients, 10000);
//     return () => {
//       active = false;
//       window.clearInterval(refreshTimer);
//     };
//   }, []);

//   useEffect(() => {
//     let active = true;
//     const loadConversation = async () => {
//       if (!selectedPatientId) return;

//       try {
//         const conversation = await getConversation(selectedPatientId);
//         if (!active) return;
//         const currentUserId = getCurrentUserId();
//         const serverMessages = conversation.map((item, index) => normalizeChatMessage(item, index, currentUserId));
//         setMessagesByPatient((prev) => ({
//           ...prev,
//           [selectedPatientId]: (() => {
//             const currentMessages = prev[selectedPatientId] || [];
//             const currentById = new Map(currentMessages.map((message) => [String(message.id), message]));
//             const mergedServerMessages = serverMessages.map((serverMessage) => {
//               const currentMessage = currentById.get(String(serverMessage.id));
//               if (!currentMessage) return serverMessage;
//               currentById.delete(String(serverMessage.id));
//               const currentHasUsablePreview = currentMessage.file?.url?.startsWith("blob:");
//               return {
//                 ...serverMessage,
//                 file: currentHasUsablePreview ? currentMessage.file : serverMessage.file || currentMessage.file,
//                 text: serverMessage.text || currentMessage.text,
//               };
//             });
//             // Keep optimistic messages not included in an older/in-flight GET
//             // response. This prevents a valid image preview disappearing after
//             // one or two seconds.
//             const optimisticMessages = Array.from(currentById.values()).filter((message) =>
//               String(message.id).startsWith("local-") ||
//               String(message.id).startsWith("file-") ||
//               message.file?.url?.startsWith("blob:")
//             );
//             return [...mergedServerMessages, ...optimisticMessages];
//           })(),
//         }));
//       } catch (err) {
//         if (!active) return;
//         setError(err.response?.data?.message || err.message || "Failed to load conversation");
//         setMessagesByPatient((prev) => ({
//           ...prev,
//           [selectedPatientId]: [],
//         }));
//       }
//     };

//     loadConversation();
//     const refreshTimer = window.setInterval(loadConversation, 5000);
//     return () => {
//       active = false;
//       window.clearInterval(refreshTimer);
//     };
//   }, [selectedPatientId]);

//   const sourcePatients = patients;

//   const filteredPatients = sourcePatients.filter((patient) => {
//     const statusValue = String(patient.status || "").toLowerCase();
//     const term = searchTerm.toLowerCase();
//     const matchesSearch =
//       patient.name.toLowerCase().includes(term) ||
//       String(patient.condition || "").toLowerCase().includes(term) ||
//       String(patient.lastMessage || "").toLowerCase().includes(term);

//     const matchesStatus =
//       statusFilter === "all" ||
//       statusFilter === "unread" ||
//       statusFilter === "archived" ||
//       statusValue === statusFilter;

//     return matchesSearch && matchesStatus;
//   });

//   const unreadCount = sourcePatients.reduce((sum, patient) => sum + Number(patient.unread || 0), 0);
//   const criticalCount = sourcePatients.filter((patient) => String(patient.status || "").toLowerCase() === "critical").length;
//   const waitingCount = sourcePatients.filter((patient) => String(patient.status || "").toLowerCase().includes("waiting")).length;
//   const resolvedCount = sourcePatients.filter((patient) => String(patient.status || "").toLowerCase().includes("resolved")).length;

//   const selectedPatient = useMemo(
//     () => sourcePatients.find((patient) => String(patient.id) === String(selectedPatientId)) || sourcePatients[0],
//     [sourcePatients, selectedPatientId]
//   );

//   const selectedMessages =
//     messagesByPatient[selectedPatient?.id] ||
//     (selectedPatient?.lastMessage && selectedPatient.lastMessage !== "No messages yet"
//       ? [
//         {
//           id: "latest-message",
//           sender: "patient",
//           text: selectedPatient.lastMessage,
//           time: selectedPatient.messageTime || "Today",
//         },
//       ]
//       : []);

//   useEffect(() => {
//     const messageArea = messageAreaRef.current;
//     if (!messageArea) return;

//     window.requestAnimationFrame(() => {
//       messageArea.scrollTop = messageArea.scrollHeight;
//     });
//   }, [selectedMessages.length, selectedPatient?.id]);

//   useEffect(() => {
//     if (!activeCall) {
//       setCallSeconds(0);
//       return undefined;
//     }

//     const missedTimer = activeCall.status === "ringing"
//       ? window.setTimeout(() => {
//         setActiveCall((call) => call ? { ...call, status: "missed" } : call);
//       }, 30000)
//       : null;

//     const closeMissedTimer = activeCall.status === "missed"
//       ? window.setTimeout(() => {
//         stopLocalMedia();
//         setActiveCall(null);
//       }, 1800)
//       : null;

//     const durationTimer = window.setInterval(() => {
//       setCallSeconds((seconds) => seconds + 1);
//     }, 1000);

//     return () => {
//       if (missedTimer) window.clearTimeout(missedTimer);
//       if (closeMissedTimer) window.clearTimeout(closeMissedTimer);
//       window.clearInterval(durationTimer);
//     };
//   }, [activeCall]);

//   useEffect(() => {
//     if (videoPreviewRef.current && mediaStreamRef.current && !activeCall?.isVideoOff) {
//       videoPreviewRef.current.srcObject = mediaStreamRef.current;
//     }
//   }, [activeCall?.isVideoOff, activeCall?.type]);

//   useEffect(() => () => {
//     stopLocalMedia();
//   }, []);

//   const getStatusClass = (value) => {
//     const normalized = String(value || "stable").toLowerCase().replace(/\s+/g, "-");
//     if (normalized === "critical") return "status-critical";
//     if (normalized === "needs-attention") return "status-warning";
//     if (normalized === "improving") return "status-improving";
//     return "status-stable";
//   };

//   const sendLocalMessage = async (event) => {
//     event.preventDefault();
//     if ((!message.trim() && !pendingAttachment) || !selectedPatient?.id || isSending) return;

//     const messageText = message.trim();
//     const receiverId = selectedPatient.receiverId || selectedPatient.id;
//     if (pendingAttachment) {
//       try {
//         setIsSending(true);
//         setError("");
//         const { file, previewUrl } = pendingAttachment;
//         const fallbackFile = { name: file.name, type: file.type, size: file.size, url: previewUrl };
//         const optimisticMessage = {
//           id: `file-${Date.now()}`,
//           sender: "doctor",
//           text: messageText,
//           file: {
//             name: file.name,
//             type: file.type.startsWith("image/") ? "image" : "document",
//             size: formatFileSize(file.size),
//             url: previewUrl,
//           },
//           time: "Just now",
//         };
//         setMessagesByPatient((prev) => ({
//           ...prev,
//           [selectedPatient.id]: [...(prev[selectedPatient.id] || []), optimisticMessage],
//         }));

//         await sendAttachment({
//           receiverId,
//           message: messageText,
//           file,
//           messageType: file.type.startsWith("image/") ? "image" : "file",
//         });
//         // Match the working patient portal: reload the stored conversation
//         // instead of rendering the upload response (which may contain only a filename/path).
//         const conversation = await getConversation(receiverId);
//         const currentUserId = getCurrentUserId();
//         const serverMessages = conversation.map((item, index) => normalizeChatMessage(item, index, currentUserId));
//         setMessagesByPatient((prev) => ({ ...prev, [selectedPatient.id]: serverMessages }));
//         setPatients((prev) => prev.map((patient) => String(patient.id) === String(selectedPatient.id)
//           ? { ...patient, lastMessage: file.name, messageTime: "Just now" }
//           : patient));
//         setPendingAttachment(null);
//         setMessage("");
//         if (fallbackFile.url?.startsWith("blob:")) URL.revokeObjectURL(fallbackFile.url);
//         if (fileInputRef.current) fileInputRef.current.value = "";
//       } catch (err) {
//         setError(err.response?.data?.message || err.message || "Failed to upload attachment");
//       } finally {
//         setIsSending(false);
//       }
//       return;
//     }
//     const localMessage = {
//       id: `local-${Date.now()}`,
//       sender: "doctor",
//       text: messageText,
//       time: "Just now",
//     };

//     setMessagesByPatient((prev) => ({
//       ...prev,
//       [selectedPatient.id]: [...(prev[selectedPatient.id] || []), localMessage],
//     }));
//     setPatients((prev) =>
//       prev.map((patient) =>
//         String(patient.id) === String(selectedPatient.id)
//           ? { ...patient, lastMessage: messageText, messageTime: "Just now" }
//           : patient
//       )
//     );
//     setMessage("");
//     setError("");

//     try {
//       setIsSending(true);
//       await sendMessage({ receiverId, message: messageText });
//     } catch (err) {
//       setError(err.response?.data?.message || err.message || "Failed to send message");
//     } finally {
//       setIsSending(false);
//     }
//   };

//   const stopLocalMedia = () => {
//     if (!mediaStreamRef.current) return;
//     mediaStreamRef.current.getTracks().forEach((track) => track.stop());
//     mediaStreamRef.current = null;
//     if (videoPreviewRef.current) {
//       videoPreviewRef.current.srcObject = null;
//     }
//   };

//   const startLocalMedia = async (type) => {
//     stopLocalMedia();
//     if (!navigator.mediaDevices?.getUserMedia) {
//       throw new Error("Camera/microphone is not supported in this browser");
//     }

//     const stream = await navigator.mediaDevices.getUserMedia({
//       audio: true,
//       video: type === "video" ? { facingMode: "user" } : false,
//     });
//     mediaStreamRef.current = stream;
//     return stream;
//   };

//   const startCall = async (type, receiverOverride = null) => {
//     if (!receiverOverride && !selectedPatient?.id) {
//       setError("Please select a patient before starting a call");
//       return;
//     }
//     const receiverId = receiverOverride || selectedPatient.receiverId || selectedPatient.id;
//     setError("");
//     setCallSeconds(0);

//     try {
//       const localStream = await startLocalMedia(type);
//       const response = await startChatCall({ receiverId, callType: type });
//       const callData = unwrapApiObject(response);
//       setActiveCall({
//         id: getFirstValue(callData.id, callData.call_id, callData.callId, response?.call_id, response?.id),
//         type,
//         status: getFirstValue(callData.status, response?.status) === "accepted" ? "connected" : "ringing",
//         isMuted: false,
//         isVideoOff: false,
//       });
//       window.requestAnimationFrame(() => {
//         if (type === "video" && videoPreviewRef.current) {
//           videoPreviewRef.current.srcObject = localStream;
//         }
//       });
//     } catch (err) {
//       stopLocalMedia();
//       setError(err.response?.data?.message || err.message || "Failed to start call");
//     }
//   };

//   useEffect(() => {
//     const type = location.state?.autoStartCallType;
//     const targetId = location.state?.callTargetId;
//     const targetIsLoaded = sourcePatients.some((patient) => String(patient.id) === String(targetId) || String(patient.receiverId) === String(targetId));
//     if (!type || !targetId || !targetIsLoaded || appointmentCallStartedRef.current || activeCall) return;
//     appointmentCallStartedRef.current = true;
//     setSelectedPatientId(targetId);
//     startCall(type, targetId);
//   }, [sourcePatients, selectedPatientId, activeCall, location.state]);

//   const endCall = async (statusValue = "cancelled") => {
//     const endedCall = activeCall;
//     const callId = activeCall?.id;
//     setActiveCall(null);
//     stopLocalMedia();
//     if (!callId) return;

//     try {
//       await endChatCall({ callId, status: statusValue });
//       if (statusValue === "ended" || endedCall?.status === "connected") openPostCallConsultation(endedCall);
//     } catch (err) {
//       setError(err.response?.data?.message || err.message || "Failed to update call status");
//     }
//   };

//   const addRemoteTest = () => setRemoteConsultationForm((form) => ({ ...form, recommendedTests: [...form.recommendedTests, { testName: "", completeBy: "", reason: "", instructions: "" }] }));
//   const updateRemoteTest = (index, field, value) => setRemoteConsultationForm((form) => ({ ...form, recommendedTests: form.recommendedTests.map((test, idx) => idx === index ? { ...test, [field]: value } : test) }));
//   const removeRemoteTest = (index) => setRemoteConsultationForm((form) => ({ ...form, recommendedTests: form.recommendedTests.filter((_, idx) => idx !== index) }));

//   const saveRemoteConsultation = async () => {
//     if (!postCallAppointment || !remoteConsultationForm.diagnosis.trim() || !remoteConsultationForm.medicine.trim() || !remoteConsultationForm.advice.trim()) return;
//     const tests = remoteConsultationForm.recommendedTests.filter((test) => test.testName.trim());
//     const primaryTest = tests[0] || {};
//     const appointmentId = postCallAppointment.id || postCallAppointment._id;
//     setSavingConsultation(true);
//     try {
//       await axios.patch(`${API_BASE_URL}/appointments/${appointmentId}`, {
//         appointment_status: "completed",
//         diagnosis: remoteConsultationForm.diagnosis.trim(),
//         medicine: remoteConsultationForm.medicine.trim(),
//         advice: remoteConsultationForm.advice.trim(),
//         testName: primaryTest.testName || null,
//         completeBy: primaryTest.completeBy || null,
//         reason: primaryTest.reason || "",
//         instructions: primaryTest.instructions || "",
//         recommended_tests: tests,
//         recommendedTests: tests,
//       }, { headers: getAuthHeaders() });
//       setDoctorAppointments((items) => items.map((item) => String(item.id || item._id) === String(appointmentId) ? { ...item, appointment_status: "completed" } : item));
//       setShowPostCallForm(false);
//       setPostCallAppointment(null);
//     } catch (err) {
//       setError(err.response?.data?.message || err.message || "Failed to complete consultation");
//     } finally {
//       setSavingConsultation(false);
//     }
//   };

//   const acceptIncomingCall = async () => {
//     if (!activeCall?.id) return;
//     try {
//       await rtc.getLocalMedia(activeCall.type);
//       await acceptChatCall(activeCall.id);
//       setActiveCall((call) => call ? { ...call, status: "connected" } : call);
//     } catch (err) {
//       setError(err.response?.data?.message || err.message || "Failed to accept call");
//     }
//   };

//   const formatCallDuration = (seconds) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
//   };

//   const getCallStatusText = () => {
//     if (!activeCall) return "";
//     if (activeCall.status === "missed") return "No answer";
//     if (activeCall.status === "connected") return "Connected";
//     return `Ringing... ${Math.min(callSeconds, 30)}s`;
//   };

//   const renderAttachment = (file) => {
//     if (!file) return null;
//     const imagePattern = /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i;
//     const isImage =
//       String(file.type || "").startsWith("image") ||
//       imagePattern.test(file.name || "") ||
//       imagePattern.test(file.url || "");

//     return (
//       <div className={`sms-file-attachment ${isImage ? "image" : ""}`}>
//         {isImage && file.url && <AttachmentPreviewImage file={file} />}
//         <div className="sms-file-details">
//           <FaPaperclip />
//           {file.url ? (
//             <a href={file.url} target="_blank" rel="noreferrer">{file.name || "Attachment"}</a>
//           ) : (
//             <span>{file.name || "Attachment"}</span>
//           )}
//           {file.size && <small>{file.size}</small>}
//         </div>
//       </div>
//     );
//   };

//   const toggleMute = () => {
//     setActiveCall((call) => {
//       if (!call) return call;
//       const nextMuted = !call.isMuted;
//       mediaStreamRef.current?.getAudioTracks().forEach((track) => {
//         track.enabled = !nextMuted;
//       });
//       rtc.setAudioMuted(nextMuted);
//       return { ...call, isMuted: nextMuted };
//     });
//   };

//   const toggleVideo = () => {
//     setActiveCall((call) => {
//       if (!call) return call;
//       const nextVideoOff = !call.isVideoOff;
//       mediaStreamRef.current?.getVideoTracks().forEach((track) => {
//         track.enabled = !nextVideoOff;
//       });
//       rtc.setVideoOff(nextVideoOff);
//       return { ...call, isVideoOff: nextVideoOff };
//     });
//   };

//   const handleAttachmentClick = () => {
//     fileInputRef.current?.click();
//   };

//   const handleAttachmentChange = (event) => {
//     const file = event.target.files?.[0];
//     if (!file || !selectedPatient?.id) return;
//     setError("");
//     if (pendingAttachment?.previewUrl) URL.revokeObjectURL(pendingAttachment.previewUrl);
//     setPendingAttachment({ file, previewUrl: URL.createObjectURL(file) });
//   };

//   const removePendingAttachment = () => {
//     if (pendingAttachment?.previewUrl) URL.revokeObjectURL(pendingAttachment.previewUrl);
//     setPendingAttachment(null);
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   return (
//     <div className="patient-list-container sms-communications-screen">
//       <header className="sms-page-header">
//         <h1>Patient Communications</h1>
//         <p>Manage patient conversations and urgent communications.</p>
//       </header>

//       <section className="sms-stats-grid">
//         <article><span className="sms-stat-icon critical">△</span><b>Live</b><strong>{criticalCount}</strong><h3>Critical Patients</h3></article>
//         <article><span className="sms-stat-icon unread">✉</span><b className="blue">Live</b><strong>{unreadCount}</strong><h3>Unread Messages</h3></article>
//         <article><span className="sms-stat-icon waiting">▣</span><b className="muted">Live</b><strong>{waitingCount}</strong><h3>Waiting for Reply</h3></article>
//         <article><span className="sms-stat-icon resolved">✓</span><b className="green">Live</b><strong>{resolvedCount}</strong><h3>Resolved Today</h3></article>
//       </section>

//       <div className="sms-filter-bar">
//         <div className="sms-filter-tabs">
//           {[
//             ["all", "All"],
//             ["unread", "Unread"],
//             ["critical", "Critical"],
//             ["needs attention", "Needs Attention"],
//             ["stable", "Stable"],
//             ["improving", "Improving"],
//             ["archived", "Archived"],
//           ].map(([value, label]) => (
//             <button className={statusFilter === value ? "active" : ""} key={value} onClick={() => setStatusFilter(value)} type="button">
//               {label}
//               {value === "unread" && <span>{unreadCount}</span>}
//             </button>
//           ))}
//         </div>
//         <div className="sms-sort-actions">
//           <button type="button">☰ Recent</button>
//           <button type="button">≡ Filter</button>
//         </div>
//       </div>

//       <div className="sms-communications-layout">
//         <aside className="sms-conversations-card">
//           <div className="sms-conversations-header">
//             <h2>Conversations</h2>
//             <button type="button">+</button>
//           </div>

//           <label className="sms-search-box">
//             <FaSearch />
//             <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search conversations..." />
//           </label>

//           <div className="sms-conversation-list">
//             {filteredPatients.length === 0 ? (
//               <div className="no-patients"><p>{status === "loading" ? "Loading conversations..." : status === "failed" ? error : "No conversations found."}</p></div>
//             ) : filteredPatients.map((patient) => (
//               <button
//                 className={`sms-conversation-item ${String(selectedPatient?.id) === String(patient.id) ? "active" : ""}`}
//                 key={patient.id}
//                 onClick={() => setSelectedPatientId(patient.id)}
//                 type="button"
//               >
//                 <div className="sms-conversation-main">
//                   <div>
//                     <strong>{patient.name}</strong>
//                     <span className={`sms-status-pill ${getStatusClass(patient.status)}`}>{patient.status}</span>
//                   </div>
//                   <small>{patient.previewTitle || patient.condition}</small>
//                   <p>{patient.lastMessage || "No messages yet"}</p>
//                 </div>
//                 <div className="sms-conversation-meta">
//                   <span>{patient.messageTime || "Yesterday"}</span>
//                   {(patient.unread || 0) > 0 && <b>{patient.unread}</b>}
//                 </div>
//               </button>
//             ))}
//           </div>
//         </aside>

//         <section className="sms-chat-card">
//           <div className="sms-chat-header">
//             <div className="sms-chat-avatar">{getInitials(selectedPatient?.name)}</div>
//             <div className="sms-chat-title">
//               <h2>
//                 {selectedPatient?.name || "Select a patient"}
//                 {selectedPatient?.status && <span className={`sms-status-pill ${getStatusClass(selectedPatient.status)}`}>{selectedPatient.status}</span>}
//               </h2>
//               <p>
//                 {selectedPatient
//                   ? `${selectedPatient.age}${selectedPatient.gender?.[0] || ""} - Blood ${selectedPatient.bloodGroup || "N/A"} - ${selectedPatient.condition}`
//                   : "Choose a conversation to view messages"}
//               </p>
//             </div>
//             <div className="sms-chat-actions">
//               <button type="button" onClick={() => startCall("voice")} title="Voice call"><FaPhone /></button>
//               <button type="button" onClick={() => startCall("video")} title="Video call"><FaVideo /></button>
//             </div>
//           </div>

//           <div className="sms-message-area" ref={messageAreaRef}>
//             <div className="sms-date-chip">{selectedPatient ? "Today" : "No conversation selected"}</div>
//             {selectedMessages.slice(0, 1).map((msg) => (
//               <div className={`sms-message-row ${msg.sender}`} key={msg.id}>
//                 <span className="sms-message-avatar">{getInitials(selectedPatient?.name)}</span>
//                 <div>
//                   <div className="sms-message-meta">{msg.sender === "doctor" ? "You" : selectedPatient?.name} <span>{msg.time}</span></div>
//                   <div className="sms-message-bubble">
//                     {msg.text}
//                     {msg.file && renderAttachment(msg.file)}
//                   </div>
//                 </div>
//               </div>
//             ))}
//             {selectedMessages.length > 1 && <div className="sms-new-divider"><span>New Messages</span></div>}
//             {selectedMessages.slice(1).map((msg) => (
//               <div className={`sms-message-row ${msg.sender}`} key={msg.id}>
//                 {msg.sender === "patient" && <span className="sms-message-avatar">{getInitials(selectedPatient?.name)}</span>}
//                 <div>
//                   <div className="sms-message-meta">{msg.sender === "doctor" ? "You" : selectedPatient?.name} <span>{msg.time}</span></div>
//                   <div className="sms-message-bubble">
//                     {msg.text}
//                     {msg.file && renderAttachment(msg.file)}
//                   </div>
//                 </div>
//                 {msg.sender === "doctor" && <span className="sms-message-avatar doctor">YU</span>}
//               </div>
//             ))}
//           </div>

//           <div className="sms-quick-actions">
//             <button type="button">▣ Schedule Appointment</button>
//             <button type="button">▤ Request Reports</button>
//             <button type="button">☤ Upload Prescription</button>
//             <button type="button">⟳ Follow Up</button>
//           </div>

//           {error && <div className="sms-send-error">{error}</div>}

//           <input ref={fileInputRef} type="file" className="sms-hidden-file-input" onChange={handleAttachmentChange} />

//           {pendingAttachment && (
//             <div className="sms-pending-attachment">
//               <FaPaperclip />
//               <span><strong>{pendingAttachment.file.name}</strong><small>{formatFileSize(pendingAttachment.file.size)} · Ready to send</small></span>
//               <button type="button" onClick={removePendingAttachment} aria-label="Remove attachment"><i className="fa-solid fa-xmark" /></button>
//             </div>
//           )}

//           <form className="sms-message-form" onSubmit={sendLocalMessage}>
//             <button type="button" onClick={handleAttachmentClick} disabled={!selectedPatient?.id} title="Attach file"><FaPaperclip /></button>
//             <button type="button">☺</button>
//             <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder={`Type a message to ${selectedPatient?.name?.split(" ")[0] || "patient"}...`} />
//             <button type="button">♩</button>
//             <button className="send" type="submit" disabled={(!message.trim() && !pendingAttachment) || isSending}><FaPaperPlane /></button>
//           </form>
//         </section>
//       </div>

//       {activeCall && (
//         <div className="sms-call-overlay" role="dialog" aria-modal="true">
//           <div className={`sms-call-card ${activeCall.type} ${activeCall.status}`}>
//             <div className="sms-call-top">
//               <span>{activeCall.type === "video" ? "Video call" : "Voice call"}</span>
//               <strong>{activeCall.status === "connected" ? formatCallDuration(callSeconds) : getCallStatusText()}</strong>
//             </div>
//             <div className="sms-call-avatar">{getInitials(selectedPatient?.name)}</div>
//             <h2>{selectedPatient?.name || "Patient"}</h2>
//             <p>
//               {activeCall.status === "missed"
//                 ? "Patient did not answer. Call marked as missed."
//                 : activeCall.status === "ringing"
//                   ? "Calling patient..."
//                   : "Connected"}
//             </p>

//             {activeCall.type === "voice" && <audio ref={remoteAudioRef} autoPlay />}

//             {activeCall.type === "video" && (
//               <div className="sms-video-preview">
//                 <video className="sms-remote-video" ref={remoteVideoRef} autoPlay playsInline style={{ display: rtc.remoteStream ? "block" : "none" }} />
//                 {activeCall.isVideoOff ? (
//                   <span className="sms-local-video sms-local-video-off">Camera off</span>
//                 ) : (
//                   <video className="sms-local-video" ref={videoPreviewRef} autoPlay playsInline muted />
//                 )}
//               </div>
//             )}

//             <div className="sms-call-controls">
//               {activeCall.direction === "incoming" && activeCall.status === "ringing" && (
//                 <button type="button" className="accept incoming-action" onClick={acceptIncomingCall} title="Accept incoming call"><FaPhone /><span>Accept Call</span></button>
//               )}
//               <button
//                 type="button"
//                 className={activeCall.isMuted ? "active" : ""}
//                 onClick={toggleMute}
//                 title={activeCall.isMuted ? "Unmute" : "Mute"}
//               >
//                 <FaMicrophone />
//               </button>
//               {activeCall.type === "video" && (
//                 <button
//                   type="button"
//                   className={activeCall.isVideoOff ? "active" : ""}
//                   onClick={toggleVideo}
//                   title={activeCall.isVideoOff ? "Turn camera on" : "Turn camera off"}
//                 >
//                   <FaVideo />
//                 </button>
//               )}
//               <button type="button" className={activeCall.direction === "incoming" && activeCall.status === "ringing" ? "reject incoming-action" : "end"} onClick={() => endCall(activeCall.status === "ringing" ? (activeCall.direction === "incoming" ? "rejected" : "cancelled") : "ended")} title={activeCall.status === "ringing" && activeCall.direction === "incoming" ? "Reject incoming call" : "End call"}>
//                 <FaPhoneSlash />
//                 {activeCall.direction === "incoming" && activeCall.status === "ringing" && <span>Reject Call</span>}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {showPostCallForm && postCallAppointment && (
//         <div className="sms-consult-overlay" role="dialog" aria-modal="true">
//           <div className="sms-consult-modal">
//             <div className="sms-consult-head"><div><span>Remote Consultation</span><h2>Check & Complete Appointment</h2><p>Add the prescription and recommended tests for {selectedPatient?.name || "this patient"}.</p></div><button type="button" onClick={() => setShowPostCallForm(false)}><i className="fa-solid fa-xmark"></i></button></div>
//             <div className="sms-consult-body">
//               <label>Diagnosis <b>*</b><textarea rows="2" value={remoteConsultationForm.diagnosis} onChange={(event) => setRemoteConsultationForm((form) => ({ ...form, diagnosis: event.target.value }))} placeholder="Clinical diagnosis and findings" /></label>
//               <label>Medicine / Prescription <b>*</b><textarea rows="4" value={remoteConsultationForm.medicine} onChange={(event) => setRemoteConsultationForm((form) => ({ ...form, medicine: event.target.value }))} placeholder="Medicine name, dosage, timing and duration" /></label>
//               <label>Doctor's Advice <b>*</b><textarea rows="2" value={remoteConsultationForm.advice} onChange={(event) => setRemoteConsultationForm((form) => ({ ...form, advice: event.target.value }))} placeholder="Diet, care and follow-up advice" /></label>
//               <div className="sms-consult-tests-head"><strong>Recommended Tests / Investigations</strong><button type="button" onClick={addRemoteTest}><i className="fa-solid fa-plus"></i> Add Test</button></div>
//               {remoteConsultationForm.recommendedTests.map((test, index) => (
//                 <div className="sms-consult-test" key={`remote-test-${index}`}>
//                   <input value={test.testName} onChange={(event) => updateRemoteTest(index, "testName", event.target.value)} placeholder="Test name (e.g. CBC)" />
//                   <input type="date" value={test.completeBy} onChange={(event) => updateRemoteTest(index, "completeBy", event.target.value)} />
//                   <input value={test.reason} onChange={(event) => updateRemoteTest(index, "reason", event.target.value)} placeholder="Reason" />
//                   <input value={test.instructions} onChange={(event) => updateRemoteTest(index, "instructions", event.target.value)} placeholder="Instructions (e.g. fasting)" />
//                   <button type="button" onClick={() => removeRemoteTest(index)} aria-label="Remove test"><i className="fa-solid fa-trash"></i></button>
//                 </div>
//               ))}
//             </div>
//             <div className="sms-consult-actions"><button type="button" className="secondary" onClick={() => setShowPostCallForm(false)}>Save Later</button><button type="button" className="primary" disabled={savingConsultation || !remoteConsultationForm.diagnosis.trim() || !remoteConsultationForm.medicine.trim() || !remoteConsultationForm.advice.trim()} onClick={saveRemoteConsultation}>{savingConsultation ? "Saving..." : "Save & Complete"}</button></div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default PatientList;



import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "../../../axiosConfig.js";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaPaperPlane,
  FaPaperclip,
  FaPhone,
  FaPhoneSlash,
  FaSearch,
  FaVideo,
  FaVideoSlash,
} from "react-icons/fa";
import {
  acceptCall as acceptChatCall,
  endCall as endChatCall,
  getAssetUrl,
  getChatList,
  getConversation,
  getCurrentUserId,
  sendAttachment,
  sendMessage,
  startCall as startChatCall,
  unwrapApiArray,
  unwrapApiObject,
} from "../doctorChatApi";
import useCallSocket from "../useDoctorCallSocket";
import useWebRTCCall from "../useDoctorCallMedia";
import { API_BASE_URL, getAuthHeaders } from "../doctorApi.js";
import "./DoctorSmsPatient.css";

const getInitials = (name) =>
  String(name || "NA")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const formatChatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatFileSize = (value) => {
  const bytes = Number(value || 0);
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFirstValue = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");

const normalizeCallType = (value) =>
  String(value || "").toLowerCase().includes("video") ? "video" : "voice";

const getUserId = (user) => getFirstValue(
  user?.user_id,
  user?.userId,
  user?.id,
  user?._id,
  user?.patient_id,
  user?.patientId,
  user?.doctor_id,
  user?.doctorId
);

const getUserRole = (user) => String(
  getFirstValue(user?.role, user?.user_role, user?.userRole, user?.type, user?.user_type) || ""
).toLowerCase();

const isPatientRole = (role) => role === "patient" || role.includes("patient");
const isDoctorRole = (role) => role === "doctor" || role.includes("doctor");

const getAppointmentPatient = (appointment) => {
  const patient = appointment.patient || appointment.patient_data || appointment.patient_details || appointment.user || {};
  const id = getFirstValue(
    patient.user_id,
    patient.userId,
    appointment.patient_user_id,
    appointment.patientUserId,
    appointment.patient_id,
    appointment.patientId,
    patient.id,
    patient._id
  );
  if (!id) return null;
  return {
    ...patient,
    id,
    user_id: getFirstValue(patient.user_id, patient.userId, appointment.patient_user_id, appointment.patientUserId, id),
    full_name: getFirstValue(
      patient.full_name,
      patient.fullname,
      patient.name,
      patient.patient_name,
      appointment.patient_name,
      appointment.name,
      "Unknown Patient"
    ),
    phone: getFirstValue(patient.phone, patient.phone_number, patient.contact_number, appointment.patient_phone, appointment.phone),
    role: "patient",
  };
};

const resolvePatientFromChat = (item, currentUserId) => {
  const lastMessage = typeof (item.lastMessage || item.last_message || item.latest_message) === "object"
    ? (item.lastMessage || item.last_message || item.latest_message)
    : {};
  const flatParticipants = [
    {
      id: getFirstValue(item.sender_id, item.senderId, item.from_user_id),
      full_name: getFirstValue(item.sender_name, item.senderName, item.from_user_name),
      phone: getFirstValue(item.sender_phone, item.senderPhone),
      role: getFirstValue(item.sender_role, item.senderRole),
    },
    {
      id: getFirstValue(item.receiver_id, item.receiverId, item.to_user_id),
      full_name: getFirstValue(item.receiver_name, item.receiverName, item.to_user_name),
      phone: getFirstValue(item.receiver_phone, item.receiverPhone),
      role: getFirstValue(item.receiver_role, item.receiverRole),
    },
  ];
  const candidates = [
    item.patient,
    item.patient_id || item.patientId ? {
      id: getFirstValue(item.patient_id, item.patientId),
      full_name: getFirstValue(item.patient_name, item.patientName),
      phone: getFirstValue(item.patient_phone, item.patientPhone),
      role: "patient",
    } : null,
    item.other_user,
    item.otherUser,
    item.participant,
    item.sender_user,
    item.senderUser,
    typeof item.sender === "object" ? item.sender : null,
    item.receiver_user,
    item.receiverUser,
    typeof item.receiver === "object" ? item.receiver : null,
    item.user,
    lastMessage.patient,
    lastMessage.sender_user,
    lastMessage.senderUser,
    typeof lastMessage.sender === "object" ? lastMessage.sender : null,
    lastMessage.receiver_user,
    lastMessage.receiverUser,
    typeof lastMessage.receiver === "object" ? lastMessage.receiver : null,
    ...flatParticipants,
    {
      id: getFirstValue(lastMessage.sender_id, lastMessage.senderId, lastMessage.from_user_id),
      full_name: getFirstValue(lastMessage.sender_name, lastMessage.senderName),
      phone: getFirstValue(lastMessage.sender_phone, lastMessage.senderPhone),
      role: getFirstValue(lastMessage.sender_role, lastMessage.senderRole),
    },
    {
      id: getFirstValue(lastMessage.receiver_id, lastMessage.receiverId, lastMessage.to_user_id),
      full_name: getFirstValue(lastMessage.receiver_name, lastMessage.receiverName),
      phone: getFirstValue(lastMessage.receiver_phone, lastMessage.receiverPhone),
      role: getFirstValue(lastMessage.receiver_role, lastMessage.receiverRole),
    },
    item,
  ].filter(Boolean);

  const isOtherUser = (candidate) => {
    const id = getUserId(candidate);
    return id !== undefined && String(id) !== String(currentUserId);
  };
  const explicitPatient = candidates.find((candidate) => isOtherUser(candidate) && isPatientRole(getUserRole(candidate)));
  if (explicitPatient) return explicitPatient;

  return candidates.find((candidate) => isOtherUser(candidate) && !isDoctorRole(getUserRole(candidate))) || null;
};

const normalizeAttachment = (source, fallbackFile) => {
  const data = unwrapApiObject(source);
  let rawAttachment = data.attachment || data.file || data.media || data.document;
  if (typeof rawAttachment === "string" && rawAttachment.trim().startsWith("{")) {
    try {
      rawAttachment = JSON.parse(rawAttachment);
    } catch {
      // Keep a non-JSON attachment string as-is.
    }
  }
  const messageValue = typeof data.message === "string" ? data.message.trim() : "";
  const normalizedMessagePath = messageValue.replace(/\\/g, "/");
  const looksLikeFilePath = /(^|\/)(uploads?|attachments?|files?|media)\//i.test(normalizedMessagePath) || /\.(png|jpe?g|gif|webp|bmp|svg|pdf|docx?|xlsx?|csv|txt|zip|rar)(\?.*)?$/i.test(normalizedMessagePath);
  const attachment = typeof rawAttachment === "string"
    ? { url: rawAttachment.replace(/\\/g, "/") }
    : rawAttachment || (looksLikeFilePath ? { url: normalizedMessagePath } : data);
  const urlCandidates = [
    attachment.attachment_url,
    attachment.attachmentUrl,
    attachment.attachment_path,
    attachment.attachmentPath,
    attachment.file_url,
    attachment.fileUrl,
    attachment.file_path,
    attachment.filePath,
    attachment.media_url,
    attachment.mediaUrl,
    attachment.image_url,
    attachment.imageUrl,
    attachment.secure_url,
    attachment.secureUrl,
    attachment.cloudinary_url,
    attachment.cloudinaryUrl,
    attachment.url,
    data.attachment_url,
    data.attachmentUrl,
    data.file_url,
    data.fileUrl,
    data.media_url,
    data.mediaUrl,
    data.image_url,
    data.imageUrl,
    data.secure_url,
    data.secureUrl,
    data.cloudinary_url,
    data.cloudinaryUrl,
    data.url,
    /^https?:\/\//i.test(messageValue) ? messageValue : undefined,
    fallbackFile?.url
  ].filter(Boolean);
  const url = urlCandidates.find((candidate) => /^https?:\/\//i.test(String(candidate)) || String(candidate).startsWith("blob:"))
    || urlCandidates.find((candidate) => String(candidate).replace(/\\/g, "/").includes("/"))
    || "";
  const normalizedUrl = String(url || "").replace(/\\/g, "/");
  const derivedName = normalizedUrl ? decodeURIComponent(normalizedUrl.split("/").pop()?.split("?")[0] || "") : "";
  const name = getFirstValue(
    attachment.attachment_name,
    attachment.attachmentName,
    attachment.file_name,
    attachment.fileName,
    attachment.name,
    fallbackFile?.name,
    derivedName
  );
  const type = getFirstValue(
    attachment.message_type,
    attachment.messageType,
    data.message_type,
    data.messageType,
    attachment.attachment_type,
    attachment.attachmentType,
    attachment.file_type,
    attachment.mime_type,
    attachment.type,
    fallbackFile?.type
  );
  const size = getFirstValue(attachment.attachment_size, attachment.attachmentSize, attachment.file_size, attachment.size, fallbackFile?.size);

  if (!url && !name) return null;

  const imageHint = `${type || ""} ${name || ""} ${normalizedUrl}`.toLowerCase();
  const isImage =
    String(type || "").toLowerCase() === "image" ||
    String(type || "").toLowerCase().startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|bmp|svg|heic|avif)(\?|#|$)/i.test(imageHint) ||
    /\/image\/upload\//i.test(normalizedUrl);

  return {
    name: name || "Attachment",
    type: isImage ? "image" : type || "document",
    size: typeof size === "number" ? formatFileSize(size) : size || "",
    url: getAssetUrl(normalizedUrl),
  };
};

const cleanAttachmentMessageText = (text, file) => {
  const value = String(text || "").trim();
  if (!value) return "";
  const normalized = value.replace(/\\/g, "/").toLowerCase();
  const fileUrl = String(file?.url || "").replace(/\\/g, "/").toLowerCase();
  const fileName = String(file?.name || "").toLowerCase();

  const pathOnlyMessage = /(^|\/)(uploads?|attachments?|files?|media)\//i.test(normalized) || /\.(png|jpe?g|gif|webp|bmp|svg|pdf|docx?|xlsx?|csv|txt|zip|rar)(\?.*)?$/i.test(normalized);
  if (pathOnlyMessage || normalized.includes("/uploads/") || normalized === fileUrl || normalized === fileName) {
    return "";
  }

  return value;
};

const getLastMessageText = (item) => {
  const lastMessage = item.lastMessage || item.last_message || item.latest_message;
  if (typeof lastMessage === "string") return lastMessage;
  return lastMessage?.message || lastMessage?.text || item.message || item.content || "No messages yet";
};

const AttachmentPreviewImage = ({ file }) => {
  const candidates = useMemo(() => {
    const primary = String(file?.url || "");
    if (!primary) return [];
    const apiFallback = primary.includes("/api/")
      ? primary
      : primary.replace(/(https?:\/\/[^/]+)\/(uploads?|attachments?|files?|media)\//i, "$1/api/$2/");
    return Array.from(new Set([primary, apiFallback].filter(Boolean)));
  }, [file?.url]);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    let active = true;
    let objectUrl = "";
    const loadAuthenticatedImage = async () => {
      const headers = { ...getAuthHeaders() };
      delete headers["Content-Type"];
      delete headers["content-type"];
      for (const candidate of candidates) {
        try {
          const response = await fetch(candidate, { headers });
          if (!response.ok) continue;
          const blob = await response.blob();
          const knownImageFile = /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(file?.name || candidate);
          if (!blob.type.startsWith("image/") && !knownImageFile) continue;
          objectUrl = URL.createObjectURL(blob);
          if (active) setPreviewUrl(objectUrl);
          return;
        } catch {
          // Try the next supported asset URL.
        }
      }
      if (active) setPreviewUrl("");
    };
    setPreviewUrl("");
    loadAuthenticatedImage();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [candidates]);

  if (!previewUrl) return null;

  return (
    <a href={previewUrl} target="_blank" rel="noreferrer" className="sms-file-preview" title="Open attachment">
      <img src={previewUrl} alt="Attachment preview" />
    </a>
  );
};

const normalizeChatMessage = (msg, index, currentUserId) => {
  const senderObject = typeof msg.sender === "object" ? msg.sender : null;
  const senderId = getFirstValue(msg.sender_id, msg.senderId, msg.from_user_id, getUserId(senderObject), msg.user_id);
  const rawSenderRole = getFirstValue(
    typeof msg.sender === "string" ? msg.sender : undefined,
    msg.sender_role,
    msg.senderRole,
    getUserRole(senderObject),
    msg.role
  );
  const normalizedRole = String(rawSenderRole || "").toLowerCase();
  const senderRole = isDoctorRole(normalizedRole) ? "doctor" : isPatientRole(normalizedRole) ? "patient" : "";
  const createdAt = msg.time || msg.created_at || msg.createdAt || new Date().toISOString();
  const file = normalizeAttachment(msg);
  const rawText = msg.message || msg.text || msg.content || "";

  return {
    id: msg.id || msg._id || `api-${index}`,
    sender: senderRole || (String(senderId) === String(currentUserId) ? "doctor" : "patient"),
    text: cleanAttachmentMessageText(rawText, file),
    file,
    time: formatChatTime(createdAt) || createdAt,
  };
};

function PatientList() {
  const location = useLocation();
  const appointmentCallTarget = location.state?.callTargetId || "";
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(appointmentCallTarget);
  const [message, setMessage] = useState("");
  const [messagesByPatient, setMessagesByPatient] = useState({});
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [doctorAppointments, setDoctorAppointments] = useState([]);
  const [postCallAppointment, setPostCallAppointment] = useState(null);
  const [showPostCallForm, setShowPostCallForm] = useState(false);
  const [savingConsultation, setSavingConsultation] = useState(false);
  const [remoteConsultationForm, setRemoteConsultationForm] = useState({ diagnosis: "", medicine: "", advice: "", recommendedTests: [] });
  const [callSeconds, setCallSeconds] = useState(0);
  const messageAreaRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const appointmentCallStartedRef = useRef(false);
  const activeCallRef = useRef(null);
  const connectedAtRef = useRef(null);
  const offerStartedCallIdRef = useRef(null);
  const offerRetryTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const remoteAudioSourceRef = useRef(null);
  const latestRemoteStreamRef = useRef(null);
  const rtc = useWebRTCCall({ callId: activeCall?.id, peerUserId: selectedPatientId, callType: activeCall?.type || "voice" });
  useEffect(() => { if (rtc.error) setError(rtc.error); }, [rtc.error]);
  const rtcRef = useRef(rtc);
  rtcRef.current = rtc;

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    latestRemoteStreamRef.current = rtc.remoteStream || null;
  }, [rtc.remoteStream]);

  const unlockCallAudio = async () => {
    if (typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      audioContextRef.current = new AudioContextClass();
    }
    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }
  };

  const waitForMediaCommit = () => new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(resolve);
    });
  });

  const stopRemoteAudioPlayback = () => {
    if (remoteAudioSourceRef.current) {
      try { remoteAudioSourceRef.current.disconnect(); } catch { /* already disconnected */ }
      remoteAudioSourceRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
    }
  };

  // FIXED: Remote audio playback - always use the hidden audio element
  const playRemoteAudio = async (stream) => {
    if (!stream || activeCallRef.current?.status !== "connected") {
      return;
    }

    const audioElement = remoteAudioRef.current;
    if (!audioElement) {
      console.warn("[DoctorSmsPatient] Remote audio element not found");
      return;
    }

    try {
      audioElement.srcObject = stream;
      audioElement.muted = false;
      audioElement.volume = 1;
      audioElement.autoplay = true;
      
      await audioElement.play();
      console.log("[DoctorSmsPatient] Remote audio playback started");
      
      if (remoteAudioSourceRef.current) {
        try { remoteAudioSourceRef.current.disconnect(); } catch (e) {}
        remoteAudioSourceRef.current = null;
      }
    } catch (playError) {
      console.warn("[DoctorSmsPatient] Audio element failed, using AudioContext fallback", playError);
      
      try {
        await unlockCallAudio();
        const context = audioContextRef.current;
        if (!context) return;

        if (remoteAudioSourceRef.current) {
          try { remoteAudioSourceRef.current.disconnect(); } catch (e) {}
        }

        const source = context.createMediaStreamSource(stream);
        source.connect(context.destination);
        remoteAudioSourceRef.current = source;
        console.log("[DoctorSmsPatient] AudioContext fallback started");
      } catch (audioError) {
        console.error("[DoctorSmsPatient] All audio playback failed", audioError);
      }
    }
  };

  const openPostCallConsultation = (call = activeCall) => {
    const appointmentId = getFirstValue(call?.appointment_id, call?.appointmentId, location.state?.appointment?.apiId, location.state?.appointment?.id);
    const appointment = doctorAppointments.find((item) => String(item.id || item._id) === String(appointmentId)) ||
      doctorAppointments.find((item) => {
        const patientId = getFirstValue(item.patient_id, item.patientId, item.patient?.id, item.patient?._id);
        const mode = String(getFirstValue(item.consultation_mode, item.consultationMode, item.mode, "")).toLowerCase();
        const status = String(getFirstValue(item.appointment_status, item.status, "")).toLowerCase();
        return String(patientId) === String(selectedPatientId) && (mode.includes("video") || mode.includes("voice")) && !status.includes("complete");
      });
    if (!appointment) return;
    setPostCallAppointment(appointment);
    setRemoteConsultationForm({ diagnosis: "", medicine: "", advice: "", recommendedTests: [] });
    setShowPostCallForm(true);
  };

  // FIXED: Remote stream handling - plays remote audio
  useEffect(() => {
    const connected = activeCall?.status === "connected";
    const remoteStream = connected ? (rtc.remoteStream || null) : null;

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.muted = true;
      if (remoteStream && activeCall?.type === "video") {
        remoteVideoRef.current.play().catch(() => {});
      }
    }

    if (remoteStream) {
      playRemoteAudio(remoteStream);
    } else {
      stopRemoteAudioPlayback();
    }
  }, [rtc.remoteStream, activeCall?.status, activeCall?.type]);

  // FIXED: Local stream handling - for preview and track control
  useEffect(() => {
    const connected = activeCall?.status === "connected";
    const localStream = connected ? (rtc.localStream || null) : null;

    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = localStream;
    }

    if (localStream && connected) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !activeCall?.isMuted;
      });
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !activeCall?.isVideoOff;
      });
    }
  }, [rtc.localStream, activeCall?.status, activeCall?.isMuted, activeCall?.isVideoOff]);

  // FIXED: Mute toggle
  const toggleMute = () => {
    if (!activeCall || activeCall.status !== "connected") return;

    const nextMuted = !Boolean(activeCall.isMuted);
    
    if (rtc.localStream) {
      rtc.localStream.getAudioTracks().forEach(track => {
        track.enabled = !nextMuted;
      });
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !nextMuted;
      });
    }
    
    rtc.setAudioMuted(nextMuted);
    setActiveCall((call) => call ? { ...call, isMuted: nextMuted } : call);
  };

  // FIXED: Video toggle
  const toggleVideo = () => {
    if (!activeCall || activeCall.status !== "connected" || activeCall.type !== "video") return;

    const nextVideoOff = !Boolean(activeCall.isVideoOff);
    
    if (rtc.localStream) {
      rtc.localStream.getVideoTracks().forEach(track => {
        track.enabled = !nextVideoOff;
      });
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !nextVideoOff;
      });
    }
    
    rtc.setVideoOff(nextVideoOff);
    setActiveCall((call) => call ? { ...call, isVideoOff: nextVideoOff } : call);
  };

  useEffect(() => {
    if (activeCall?.status !== "connected") return;
    rtc.setAudioMuted(Boolean(activeCall?.isMuted));
  }, [activeCall?.status, activeCall?.isMuted]);

  useEffect(() => {
    if (activeCall?.status !== "connected") return;
    rtc.setVideoOff(Boolean(activeCall?.isVideoOff));
  }, [activeCall?.status, activeCall?.isVideoOff]);

  // FIXED: Prepare media for connected call
  useEffect(() => {
    if (
      activeCall?.status !== "connected" ||
      !activeCall?.id ||
      !activeCall?.type
    ) return undefined;

    let cancelled = false;
    const callKey = String(activeCall.id);

    const prepareConnectedMedia = async () => {
      try {
        const stream = await prepareLocalMedia(activeCall.type);
        if (cancelled) return;

        const audioTracks = stream?.getAudioTracks?.() || [];
        if (!audioTracks.length) throw new Error("Microphone track was not created");

        audioTracks.forEach((track) => { track.enabled = !activeCall?.isMuted; });
        if (activeCall.type === "video") {
          stream.getVideoTracks().forEach((track) => { track.enabled = !activeCall?.isVideoOff; });
        }
        rtcRef.current.setAudioMuted(activeCall?.isMuted || false);
      } catch (connectionError) {
        console.error("[DoctorSmsPatient] failed to prepare connected media", connectionError);
        setError(connectionError.message || "Unable to connect call audio");
      }
    };

    prepareConnectedMedia();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCall?.status, activeCall?.id, activeCall?.type]);

  // FIXED: Create offer for outgoing calls
  useEffect(() => {
    if (
      activeCall?.status !== "connected" ||
      activeCall?.direction === "incoming" ||
      !activeCall?.id ||
      !activeCall?.type
    ) return undefined;

    const callKey = String(activeCall.id);
    const audioTrack = rtc.localStream?.getAudioTracks?.()[0];
    if (
      !audioTrack ||
      audioTrack.readyState !== "live" ||
      offerStartedCallIdRef.current === callKey
    ) return undefined;

    let cancelled = false;
    let firstFrame = 0;
    let secondFrame = 0;

    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(async () => {
        const current = activeCallRef.current;
        if (
          cancelled ||
          current?.status !== "connected" ||
          String(current?.id) !== callKey
        ) return;

        offerStartedCallIdRef.current = callKey;
        try {
          await rtcRef.current.startOffer();
          console.log("[DoctorSmsPatient] Offer sent successfully");
        } catch (offerError) {
          offerStartedCallIdRef.current = null;
          console.error("[DoctorSmsPatient] WebRTC offer failed", offerError);
          setError(offerError.message || "Unable to start call audio");
        }
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [rtc.localStream, activeCall?.status, activeCall?.direction, activeCall?.id, activeCall?.type]);

  useCallSocket({
    onRinging: (call) => {
      const currentUserId = getCurrentUserId();
      const callerId = getFirstValue(call?.caller_id, call?.callerId, call?.sender_id, call?.user_id);
      const receiverId = getFirstValue(call?.receiver_id, call?.receiverId, call?.callee_id, call?.calleeId);
      if (receiverId && String(receiverId) !== String(currentUserId)) return;
      if (!receiverId && callerId && String(callerId) === String(currentUserId)) return;
      if (callerId) setSelectedPatientId(callerId);
      setCallSeconds(0);
      setActiveCall({ 
        ...call, 
        id: getFirstValue(call?.id, call?._id, call?.call_id, call?.callId), 
        type: normalizeCallType(getFirstValue(call?.call_type, call?.callType, call?.type)), 
        status: "ringing", 
        direction: "incoming", 
        isMuted: false, 
        isVideoOff: false 
      });
    },
    onAccepted: (call) => {
      const current = activeCallRef.current;
      if (!current) return;

      const acceptedCallId = getFirstValue(call?.id, call?._id, call?.call_id, call?.callId);
      if (acceptedCallId && current.id && String(acceptedCallId) !== String(current.id)) return;

      const acceptedType = normalizeCallType(getFirstValue(call?.call_type, call?.callType, call?.type, current.type));
      connectedAtRef.current = Date.now();
      setCallSeconds(0);
      setActiveCall((latest) => latest ? {
        ...latest,
        ...call,
        id: getFirstValue(acceptedCallId, latest.id),
        type: acceptedType,
        status: "connected",
        direction: latest.direction || "outgoing",
        isMuted: false,
        isVideoOff: false,
      } : latest);
    },
    onRejected: () => { 
      connectedAtRef.current = null; 
      offerStartedCallIdRef.current = null; 
      setCallSeconds(0); 
      stopLocalMedia(); 
      setActiveCall(null); 
    },
    onCancelled: () => { 
      connectedAtRef.current = null; 
      offerStartedCallIdRef.current = null; 
      setCallSeconds(0); 
      stopLocalMedia(); 
      setActiveCall(null); 
    },
    onEnded: () => { 
      openPostCallConsultation(); 
      connectedAtRef.current = null; 
      offerStartedCallIdRef.current = null; 
      setCallSeconds(0); 
      stopLocalMedia(); 
      setActiveCall(null); 
    },
    onMissed: () => { 
      connectedAtRef.current = null; 
      offerStartedCallIdRef.current = null; 
      setCallSeconds(0); 
      stopLocalMedia(); 
      setActiveCall(null); 
    },
  });

  useEffect(() => {
    setPendingAttachment((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [selectedPatientId]);

  useEffect(() => {
    let active = true;
    const loadPatients = async () => {
      try {
        if (active) setStatus((current) => current === "succeeded" ? current : "loading");
        setError("");
        const doctorId = getCurrentUserId();
        const [chatList, appointmentResponse] = await Promise.all([
          getChatList(),
          axios.get(`${API_BASE_URL}/appointments`, {
            headers: getAuthHeaders(),
            params: { doctor_id: doctorId },
          }).catch(() => null),
        ]);
        const currentUserId = getCurrentUserId();
        const resolvedPatients = chatList.map((item) => {
          const patient = resolvePatientFromChat(item, currentUserId);
          if (!patient) return null;
          const lastMessage = item.lastMessage || item.last_message || item.latest_message;
          const receiverId =
            getUserId(patient) ||
            item.patient_id;

          if (!receiverId || String(receiverId) === String(currentUserId)) return null;

          return {
            id: receiverId,
            receiverId,
            name: patient.full_name || patient.fullname || patient.name || patient.patient_name || item.patient_name || "Unknown Patient",
            age: patient.age || "NA",
            gender: patient.gender || "Male",
            condition: patient.condition || patient.diagnosis || item.condition || "No condition",
            status: patient.status || item.status || "Stable",
            phone: patient.contact_number || patient.phone || patient.phone_number || "",
            bloodGroup: patient.bloodGroup || patient.blood_group || "",
            previewTitle: patient.condition || patient.diagnosis || item.condition || "No condition",
            lastMessage: getLastMessageText(item),
            messageTime: formatChatTime(lastMessage?.created_at || lastMessage?.createdAt || item.updated_at || item.created_at),
            unread: item.unread || item.unread_count || patient.unread || patient.unread_count || 0,
          };
        }).filter(Boolean);
        const appointments = appointmentResponse ? unwrapApiArray(appointmentResponse.data) : [];
        setDoctorAppointments(appointments);
        const appointmentPatients = Array.from(new Map(
          appointments
            .map(getAppointmentPatient)
            .filter(Boolean)
            .filter((patient) => String(getUserId(patient)) !== String(currentUserId))
            .map((patient) => [String(getUserId(patient)), patient])
        ).values());
        const listedIds = new Set(resolvedPatients.map((patient) => String(patient.id)));
        const missingAppointmentPatients = appointmentPatients.filter((patient) => !listedIds.has(String(getUserId(patient))));
        const conversationResults = await Promise.allSettled(
          missingAppointmentPatients.map(async (patient) => ({
            patient,
            conversation: await getConversation(getUserId(patient)),
          }))
        );
        conversationResults.forEach((result) => {
          if (result.status !== "fulfilled" || !result.value.conversation.length) return;
          const { patient, conversation } = result.value;
          const latestMessage = conversation[conversation.length - 1];
          resolvedPatients.push({
            id: getUserId(patient),
            receiverId: getUserId(patient),
            name: patient.full_name,
            age: patient.age || "NA",
            gender: patient.gender || patient.patient_gender || "NA",
            condition: patient.condition || patient.diagnosis || "No condition",
            status: patient.status || "Stable",
            phone: patient.phone || "",
            bloodGroup: patient.blood_group || patient.bloodGroup || "",
            previewTitle: patient.condition || patient.diagnosis || "No condition",
            lastMessage: getLastMessageText(latestMessage),
            messageTime: formatChatTime(latestMessage.created_at || latestMessage.createdAt || latestMessage.time),
            unread: 0,
          });
        });
        const apiPatients = Array.from(
          new Map(resolvedPatients.map((patient) => [String(patient.id), patient])).values()
        );
        if (!active) return;
        setPatients(apiPatients);
        setSelectedPatientId((current) =>
          apiPatients.some((patient) => String(patient.id) === String(current)) ? current : (apiPatients[0]?.id || "")
        );
        setStatus("succeeded");
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.message || err.message || "Failed to load chat list");
        setPatients([]);
        setStatus("failed");
      }
    };

    loadPatients();
    const refreshTimer = window.setInterval(loadPatients, 10000);
    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadConversation = async () => {
      if (!selectedPatientId) return;

      try {
        const conversation = await getConversation(selectedPatientId);
        if (!active) return;
        const currentUserId = getCurrentUserId();
        const serverMessages = conversation.map((item, index) => normalizeChatMessage(item, index, currentUserId));
        setMessagesByPatient((prev) => ({
          ...prev,
          [selectedPatientId]: (() => {
            const currentMessages = prev[selectedPatientId] || [];
            const currentById = new Map(currentMessages.map((message) => [String(message.id), message]));
            const mergedServerMessages = serverMessages.map((serverMessage) => {
              const currentMessage = currentById.get(String(serverMessage.id));
              if (!currentMessage) return serverMessage;
              currentById.delete(String(serverMessage.id));
              const currentHasUsablePreview = currentMessage.file?.url?.startsWith("blob:");
              return {
                ...serverMessage,
                file: currentHasUsablePreview ? currentMessage.file : serverMessage.file || currentMessage.file,
                text: serverMessage.text || currentMessage.text,
              };
            });
            const optimisticMessages = Array.from(currentById.values()).filter((message) =>
              String(message.id).startsWith("local-") ||
              String(message.id).startsWith("file-") ||
              message.file?.url?.startsWith("blob:")
            );
            return [...mergedServerMessages, ...optimisticMessages];
          })(),
        }));
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.message || err.message || "Failed to load conversation");
        setMessagesByPatient((prev) => ({
          ...prev,
          [selectedPatientId]: [],
        }));
      }
    };

    loadConversation();
    const refreshTimer = window.setInterval(loadConversation, 5000);
    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, [selectedPatientId]);

  const sourcePatients = patients;

  const filteredPatients = sourcePatients.filter((patient) => {
    const statusValue = String(patient.status || "").toLowerCase();
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      patient.name.toLowerCase().includes(term) ||
      String(patient.condition || "").toLowerCase().includes(term) ||
      String(patient.lastMessage || "").toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "all" ||
      statusFilter === "unread" ||
      statusFilter === "archived" ||
      statusValue === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const unreadCount = sourcePatients.reduce((sum, patient) => sum + Number(patient.unread || 0), 0);
  const criticalCount = sourcePatients.filter((patient) => String(patient.status || "").toLowerCase() === "critical").length;
  const waitingCount = sourcePatients.filter((patient) => String(patient.status || "").toLowerCase().includes("waiting")).length;
  const resolvedCount = sourcePatients.filter((patient) => String(patient.status || "").toLowerCase().includes("resolved")).length;

  const selectedPatient = useMemo(
    () => sourcePatients.find((patient) => String(patient.id) === String(selectedPatientId)) || sourcePatients[0],
    [sourcePatients, selectedPatientId]
  );

  const selectedMessages =
    messagesByPatient[selectedPatient?.id] ||
    (selectedPatient?.lastMessage && selectedPatient.lastMessage !== "No messages yet"
      ? [
        {
          id: "latest-message",
          sender: "patient",
          text: selectedPatient.lastMessage,
          time: selectedPatient.messageTime || "Today",
        },
      ]
      : []);

  useEffect(() => {
    const messageArea = messageAreaRef.current;
    if (!messageArea) return;

    window.requestAnimationFrame(() => {
      messageArea.scrollTop = messageArea.scrollHeight;
    });
  }, [selectedMessages.length, selectedPatient?.id]);

  useEffect(() => {
    if (!activeCall) {
      connectedAtRef.current = null;
      setCallSeconds(0);
      return undefined;
    }

    const missedTimer = activeCall.status === "ringing"
      ? window.setTimeout(() => {
        setActiveCall((call) => call ? { ...call, status: "missed" } : call);
      }, 30000)
      : null;

    const closeMissedTimer = activeCall.status === "missed"
      ? window.setTimeout(() => {
        connectedAtRef.current = null;
        stopLocalMedia();
        setActiveCall(null);
      }, 1800)
      : null;

    let durationTimer = null;
    if (activeCall.status === "connected") {
      if (!connectedAtRef.current) connectedAtRef.current = Date.now();
      const updateDuration = () => {
        setCallSeconds(Math.max(0, Math.floor((Date.now() - connectedAtRef.current) / 1000)));
      };
      updateDuration();
      durationTimer = window.setInterval(updateDuration, 1000);
    } else {
      setCallSeconds(0);
    }

    return () => {
      if (missedTimer) window.clearTimeout(missedTimer);
      if (closeMissedTimer) window.clearTimeout(closeMissedTimer);
      if (durationTimer) window.clearInterval(durationTimer);
    };
  }, [activeCall?.status, activeCall?.id]);

  useEffect(() => {
    if (
      activeCall?.status === "connected" &&
      videoPreviewRef.current &&
      mediaStreamRef.current &&
      !activeCall?.isVideoOff
    ) {
      videoPreviewRef.current.srcObject = mediaStreamRef.current;
    }
  }, [activeCall?.status, activeCall?.isVideoOff, activeCall?.type]);

  useEffect(() => () => {
    stopLocalMedia();
  }, []);

  const getStatusClass = (value) => {
    const normalized = String(value || "stable").toLowerCase().replace(/\s+/g, "-");
    if (normalized === "critical") return "status-critical";
    if (normalized === "needs-attention") return "status-warning";
    if (normalized === "improving") return "status-improving";
    return "status-stable";
  };

  const sendLocalMessage = async (event) => {
    event.preventDefault();
    if ((!message.trim() && !pendingAttachment) || !selectedPatient?.id || isSending) return;

    const messageText = message.trim();
    const receiverId = selectedPatient.receiverId || selectedPatient.id;
    if (pendingAttachment) {
      try {
        setIsSending(true);
        setError("");
        const { file, previewUrl } = pendingAttachment;
        const fallbackFile = { name: file.name, type: file.type, size: file.size, url: previewUrl };
        const optimisticMessage = {
          id: `file-${Date.now()}`,
          sender: "doctor",
          text: messageText,
          file: {
            name: file.name,
            type: file.type.startsWith("image/") ? "image" : "document",
            size: formatFileSize(file.size),
            url: previewUrl,
          },
          time: "Just now",
        };
        setMessagesByPatient((prev) => ({
          ...prev,
          [selectedPatient.id]: [...(prev[selectedPatient.id] || []), optimisticMessage],
        }));

        await sendAttachment({
          receiverId,
          message: messageText,
          file,
          messageType: file.type.startsWith("image/") ? "image" : "file",
        });
        const conversation = await getConversation(receiverId);
        const currentUserId = getCurrentUserId();
        const serverMessages = conversation.map((item, index) => normalizeChatMessage(item, index, currentUserId));
        setMessagesByPatient((prev) => ({ ...prev, [selectedPatient.id]: serverMessages }));
        setPatients((prev) => prev.map((patient) => String(patient.id) === String(selectedPatient.id)
          ? { ...patient, lastMessage: file.name, messageTime: "Just now" }
          : patient));
        setPendingAttachment(null);
        setMessage("");
        if (fallbackFile.url?.startsWith("blob:")) URL.revokeObjectURL(fallbackFile.url);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to upload attachment");
      } finally {
        setIsSending(false);
      }
      return;
    }
    const localMessage = {
      id: `local-${Date.now()}`,
      sender: "doctor",
      text: messageText,
      time: "Just now",
    };

    setMessagesByPatient((prev) => ({
      ...prev,
      [selectedPatient.id]: [...(prev[selectedPatient.id] || []), localMessage],
    }));
    setPatients((prev) =>
      prev.map((patient) =>
        String(patient.id) === String(selectedPatient.id)
          ? { ...patient, lastMessage: messageText, messageTime: "Just now" }
          : patient
      )
    );
    setMessage("");
    setError("");

    try {
      setIsSending(true);
      await sendMessage({ receiverId, message: messageText });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const getLocalCallStreams = () => {
    const streams = [mediaStreamRef.current, rtc.localStream].filter(
      (stream) => stream && typeof stream.getTracks === "function"
    );

    return Array.from(new Set(streams));
  };

  const setLocalTrackEnabled = (kind, enabled) => {
    getLocalCallStreams().forEach((stream) => {
      const tracks = kind === "audio" ? stream.getAudioTracks() : stream.getVideoTracks();
      tracks.forEach((track) => {
        track.enabled = enabled;
      });
    });
  };

  const stopLocalMedia = () => {
    getLocalCallStreams().forEach((stream) => {
      stream.getTracks().forEach((track) => track.stop());
    });

    window.clearTimeout(offerRetryTimerRef.current);
    offerStartedCallIdRef.current = null;
    connectedAtRef.current = null;
    mediaStreamRef.current = null;
    stopRemoteAudioPlayback();

    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;
  };

  const prepareLocalMedia = async (type) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera/microphone is not supported in this browser");
    }

    const stream = await rtcRef.current.getLocalMedia(type);
    const resolvedStream =
      stream && typeof stream.getTracks === "function" ? stream : rtcRef.current.localStream;

    if (resolvedStream) {
      mediaStreamRef.current = resolvedStream;
      resolvedStream.getAudioTracks().forEach((track) => { track.enabled = !activeCall?.isMuted; });
      if (type === "video") {
        resolvedStream.getVideoTracks().forEach((track) => { track.enabled = !activeCall?.isVideoOff; });
      }
    }
    rtcRef.current.setAudioMuted(activeCall?.isMuted || false);

    return resolvedStream;
  };

  const startCall = async (type, receiverOverride = null) => {
    if (!receiverOverride && !selectedPatient?.id) {
      setError("Please select a patient before starting a call");
      return;
    }
    const receiverId = receiverOverride || selectedPatient.receiverId || selectedPatient.id;
    setError("");
    setCallSeconds(0);

    try {
      await unlockCallAudio().catch(() => {});
      connectedAtRef.current = null;
      offerStartedCallIdRef.current = null;
      window.clearTimeout(offerRetryTimerRef.current);
      const response = await startChatCall({ receiverId, callType: type });
      const callData = unwrapApiObject(response);
      setActiveCall({
        id: getFirstValue(callData.id, callData.call_id, callData.callId, response?.call_id, response?.id),
        type,
        status: "ringing",
        direction: "outgoing",
        isMuted: false,
        isVideoOff: false,
      });
    } catch (err) {
      stopLocalMedia();
      setError(err.response?.data?.message || err.message || "Failed to start call");
    }
  };

  useEffect(() => {
    const type = location.state?.autoStartCallType;
    const targetId = location.state?.callTargetId;
    const targetIsLoaded = sourcePatients.some((patient) => String(patient.id) === String(targetId) || String(patient.receiverId) === String(targetId));
    if (!type || !targetId || !targetIsLoaded || appointmentCallStartedRef.current || activeCall) return;
    appointmentCallStartedRef.current = true;
    setSelectedPatientId(targetId);
    startCall(type, targetId);
  }, [sourcePatients, selectedPatientId, activeCall, location.state]);

  const endCall = async (statusValue = "cancelled") => {
    const endedCall = activeCall;
    const callId = activeCall?.id;
    setActiveCall(null);
    connectedAtRef.current = null;
    offerStartedCallIdRef.current = null;
    stopLocalMedia();
    if (!callId) return;

    try {
      await endChatCall({ callId, status: statusValue });
      if (statusValue === "ended" || endedCall?.status === "connected") openPostCallConsultation(endedCall);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to update call status");
    }
  };

  const addRemoteTest = () => setRemoteConsultationForm((form) => ({ ...form, recommendedTests: [...form.recommendedTests, { testName: "", completeBy: "", reason: "", instructions: "" }] }));
  const updateRemoteTest = (index, field, value) => setRemoteConsultationForm((form) => ({ ...form, recommendedTests: form.recommendedTests.map((test, idx) => idx === index ? { ...test, [field]: value } : test) }));
  const removeRemoteTest = (index) => setRemoteConsultationForm((form) => ({ ...form, recommendedTests: form.recommendedTests.filter((_, idx) => idx !== index) }));

  const saveRemoteConsultation = async () => {
    if (!postCallAppointment || !remoteConsultationForm.diagnosis.trim() || !remoteConsultationForm.medicine.trim() || !remoteConsultationForm.advice.trim()) return;
    const tests = remoteConsultationForm.recommendedTests.filter((test) => test.testName.trim());
    const primaryTest = tests[0] || {};
    const appointmentId = postCallAppointment.id || postCallAppointment._id;
    setSavingConsultation(true);
    try {
      await axios.patch(`${API_BASE_URL}/appointments/${appointmentId}`, {
        appointment_status: "completed",
        diagnosis: remoteConsultationForm.diagnosis.trim(),
        medicine: remoteConsultationForm.medicine.trim(),
        advice: remoteConsultationForm.advice.trim(),
        testName: primaryTest.testName || null,
        completeBy: primaryTest.completeBy || null,
        reason: primaryTest.reason || "",
        instructions: primaryTest.instructions || "",
        recommended_tests: tests,
        recommendedTests: tests,
      }, { headers: getAuthHeaders() });
      setDoctorAppointments((items) => items.map((item) => String(item.id || item._id) === String(appointmentId) ? { ...item, appointment_status: "completed" } : item));
      setShowPostCallForm(false);
      setPostCallAppointment(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to complete consultation");
    } finally {
      setSavingConsultation(false);
    }
  };

  const acceptIncomingCall = async () => {
    if (!activeCall?.id) return;
    try {
      await unlockCallAudio().catch(() => {});
      const stream = await prepareLocalMedia(activeCall.type);
      const audioTracks = stream?.getAudioTracks?.() || [];
      if (!audioTracks.length) throw new Error("Microphone permission was not granted");

      audioTracks.forEach((track) => { track.enabled = true; });
      if (activeCall.type === "video") {
        stream.getVideoTracks().forEach((track) => { track.enabled = true; });
      }
      rtcRef.current.setAudioMuted(false);

      await waitForMediaCommit();
      await acceptChatCall(activeCall.id);

      connectedAtRef.current = Date.now();
      setCallSeconds(0);
      setActiveCall((call) => call ? {
        ...call,
        status: "connected",
        isMuted: false,
        isVideoOff: false,
      } : call);
    } catch (err) {
      console.error("[DoctorSmsPatient] accept call failed", err);
      setError(err.response?.data?.message || err.message || "Failed to accept call");
    }
  };

  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const getCallStatusText = () => {
    if (!activeCall) return "";
    if (activeCall.status === "missed") return "No answer";
    if (activeCall.status === "connected") return "Connected";
    return `Ringing... ${Math.min(callSeconds, 30)}s`;
  };

  const renderAttachment = (file) => {
    if (!file) return null;
    const imagePattern = /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i;
    const isImage =
      String(file.type || "").startsWith("image") ||
      imagePattern.test(file.name || "") ||
      imagePattern.test(file.url || "");

    return (
      <div className={`sms-file-attachment ${isImage ? "image" : ""}`}>
        {isImage && file.url && <AttachmentPreviewImage file={file} />}
        <div className="sms-file-details">
          <FaPaperclip />
          {file.url ? (
            <a href={file.url} target="_blank" rel="noreferrer">{file.name || "Attachment"}</a>
          ) : (
            <span>{file.name || "Attachment"}</span>
          )}
          {file.size && <small>{file.size}</small>}
        </div>
      </div>
    );
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleAttachmentChange = (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedPatient?.id) return;
    setError("");
    if (pendingAttachment?.previewUrl) URL.revokeObjectURL(pendingAttachment.previewUrl);
    setPendingAttachment({ file, previewUrl: URL.createObjectURL(file) });
  };

  const removePendingAttachment = () => {
    if (pendingAttachment?.previewUrl) URL.revokeObjectURL(pendingAttachment.previewUrl);
    setPendingAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="patient-list-container sms-communications-screen">
      <header className="sms-page-header">
        <h1>Patient Communications</h1>
        <p>Manage patient conversations and urgent communications.</p>
      </header>

      <section className="sms-stats-grid">
        <article><span className="sms-stat-icon critical">△</span><b>Live</b><strong>{criticalCount}</strong><h3>Critical Patients</h3></article>
        <article><span className="sms-stat-icon unread">✉</span><b className="blue">Live</b><strong>{unreadCount}</strong><h3>Unread Messages</h3></article>
        <article><span className="sms-stat-icon waiting">▣</span><b className="muted">Live</b><strong>{waitingCount}</strong><h3>Waiting for Reply</h3></article>
        <article><span className="sms-stat-icon resolved">✓</span><b className="green">Live</b><strong>{resolvedCount}</strong><h3>Resolved Today</h3></article>
      </section>

      <div className="sms-filter-bar">
        <div className="sms-filter-tabs">
          {[
            ["all", "All"],
            ["unread", "Unread"],
            ["critical", "Critical"],
            ["needs attention", "Needs Attention"],
            ["stable", "Stable"],
            ["improving", "Improving"],
            ["archived", "Archived"],
          ].map(([value, label]) => (
            <button className={statusFilter === value ? "active" : ""} key={value} onClick={() => setStatusFilter(value)} type="button">
              {label}
              {value === "unread" && <span>{unreadCount}</span>}
            </button>
          ))}
        </div>
        <div className="sms-sort-actions">
          <button type="button">☰ Recent</button>
          <button type="button">≡ Filter</button>
        </div>
      </div>

      <div className="sms-communications-layout">
        <aside className="sms-conversations-card">
          <div className="sms-conversations-header">
            <h2>Conversations</h2>
            <button type="button">+</button>
          </div>

          <label className="sms-search-box">
            <FaSearch />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search conversations..." />
          </label>

          <div className="sms-conversation-list">
            {filteredPatients.length === 0 ? (
              <div className="no-patients"><p>{status === "loading" ? "Loading conversations..." : status === "failed" ? error : "No conversations found."}</p></div>
            ) : filteredPatients.map((patient) => (
              <button
                className={`sms-conversation-item ${String(selectedPatient?.id) === String(patient.id) ? "active" : ""}`}
                key={patient.id}
                onClick={() => setSelectedPatientId(patient.id)}
                type="button"
              >
                <div className="sms-conversation-main">
                  <div>
                    <strong>{patient.name}</strong>
                    <span className={`sms-status-pill ${getStatusClass(patient.status)}`}>{patient.status}</span>
                  </div>
                  <small>{patient.previewTitle || patient.condition}</small>
                  <p>{patient.lastMessage || "No messages yet"}</p>
                </div>
                <div className="sms-conversation-meta">
                  <span>{patient.messageTime || "Yesterday"}</span>
                  {(patient.unread || 0) > 0 && <b>{patient.unread}</b>}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="sms-chat-card">
          <div className="sms-chat-header">
            <div className="sms-chat-avatar">{getInitials(selectedPatient?.name)}</div>
            <div className="sms-chat-title">
              <h2>
                {selectedPatient?.name || "Select a patient"}
                {selectedPatient?.status && <span className={`sms-status-pill ${getStatusClass(selectedPatient.status)}`}>{selectedPatient.status}</span>}
              </h2>
              <p>
                {selectedPatient
                  ? `${selectedPatient.age}${selectedPatient.gender?.[0] || ""} - Blood ${selectedPatient.bloodGroup || "N/A"} - ${selectedPatient.condition}`
                  : "Choose a conversation to view messages"}
              </p>
            </div>
            <div className="sms-chat-actions">
              <button type="button" onClick={() => startCall("voice")} title="Voice call"><FaPhone /></button>
              <button type="button" onClick={() => startCall("video")} title="Video call"><FaVideo /></button>
            </div>
          </div>

          <div className="sms-message-area" ref={messageAreaRef}>
            <div className="sms-date-chip">{selectedPatient ? "Today" : "No conversation selected"}</div>
            {selectedMessages.slice(0, 1).map((msg) => (
              <div className={`sms-message-row ${msg.sender}`} key={msg.id}>
                <span className="sms-message-avatar">{getInitials(selectedPatient?.name)}</span>
                <div>
                  <div className="sms-message-meta">{msg.sender === "doctor" ? "You" : selectedPatient?.name} <span>{msg.time}</span></div>
                  <div className="sms-message-bubble">
                    {msg.text}
                    {msg.file && renderAttachment(msg.file)}
                  </div>
                </div>
              </div>
            ))}
            {selectedMessages.length > 1 && <div className="sms-new-divider"><span>New Messages</span></div>}
            {selectedMessages.slice(1).map((msg) => (
              <div className={`sms-message-row ${msg.sender}`} key={msg.id}>
                {msg.sender === "patient" && <span className="sms-message-avatar">{getInitials(selectedPatient?.name)}</span>}
                <div>
                  <div className="sms-message-meta">{msg.sender === "doctor" ? "You" : selectedPatient?.name} <span>{msg.time}</span></div>
                  <div className="sms-message-bubble">
                    {msg.text}
                    {msg.file && renderAttachment(msg.file)}
                  </div>
                </div>
                {msg.sender === "doctor" && <span className="sms-message-avatar doctor">YU</span>}
              </div>
            ))}
          </div>

          <div className="sms-quick-actions">
            <button type="button">▣ Schedule Appointment</button>
            <button type="button">▤ Request Reports</button>
            <button type="button">☤ Upload Prescription</button>
            <button type="button">⟳ Follow Up</button>
          </div>

          {error && <div className="sms-send-error">{error}</div>}

          <input ref={fileInputRef} type="file" className="sms-hidden-file-input" onChange={handleAttachmentChange} />

          {pendingAttachment && (
            <div className="sms-pending-attachment">
              <FaPaperclip />
              <span><strong>{pendingAttachment.file.name}</strong><small>{formatFileSize(pendingAttachment.file.size)} · Ready to send</small></span>
              <button type="button" onClick={removePendingAttachment} aria-label="Remove attachment"><i className="fa-solid fa-xmark" /></button>
            </div>
          )}

          <form className="sms-message-form" onSubmit={sendLocalMessage}>
            <button type="button" onClick={handleAttachmentClick} disabled={!selectedPatient?.id} title="Attach file"><FaPaperclip /></button>
            <button type="button">☺</button>
            <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder={`Type a message to ${selectedPatient?.name?.split(" ")[0] || "patient"}...`} />
            <button type="button">♩</button>
            <button className="send" type="submit" disabled={(!message.trim() && !pendingAttachment) || isSending}><FaPaperPlane /></button>
          </form>
        </section>
      </div>

      {activeCall && (
        <div className="sms-call-overlay" role="dialog" aria-modal="true">
          <div className={`sms-call-card ${activeCall.type} ${activeCall.status}`}>
            <div className="sms-call-top">
              <span>{activeCall.type === "video" ? "Video call" : "Voice call"}</span>
              <strong>{activeCall.status === "connected" ? formatCallDuration(callSeconds) : getCallStatusText()}</strong>
            </div>
            <div className="sms-call-avatar">{getInitials(selectedPatient?.name)}</div>
            <h2>{selectedPatient?.name || "Patient"}</h2>
            <p>
              {activeCall.status === "missed"
                ? "Patient did not answer. Call marked as missed."
                : activeCall.status === "ringing"
                  ? "Calling patient..."
                  : `Connected • ${formatCallDuration(callSeconds)}`}
            </p>

            {activeCall.status === "connected" && (
              <audio
                ref={remoteAudioRef}
                autoPlay
                playsInline
                aria-hidden="true"
                style={{ position: "fixed", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
              />
            )}

            {activeCall.type === "video" && (
              <div className="sms-video-preview">
                <video
                  className="sms-remote-video"
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    display: activeCall.status === "connected" && rtc.remoteStream ? "block" : "none",
                  }}
                />
                {activeCall.status !== "connected" ? (
                  <span className="sms-local-video sms-local-video-off">Waiting for patient to accept...</span>
                ) : activeCall.isVideoOff ? (
                  <span className="sms-local-video sms-local-video-off">Camera off</span>
                ) : (
                  <video className="sms-local-video" ref={videoPreviewRef} autoPlay playsInline muted />
                )}
              </div>
            )}

            <div className="sms-call-controls">
              {activeCall.direction === "incoming" && activeCall.status === "ringing" && (
                <button type="button" className="accept incoming-action" onClick={acceptIncomingCall} title="Accept incoming call"><FaPhone /><span>Accept Call</span></button>
              )}
              <button
                type="button"
                className={`mute-control ${activeCall.isMuted ? "active" : ""}`}
                onClick={toggleMute}
                title={activeCall.isMuted ? "Unmute microphone" : "Mute microphone"}
                aria-label={activeCall.isMuted ? "Unmute microphone" : "Mute microphone"}
                aria-pressed={Boolean(activeCall.isMuted)}
                data-control-state={activeCall.isMuted ? "muted" : "unmuted"}
                disabled={activeCall.status !== "connected"}
              >
                {activeCall.isMuted ? (
                  <FaMicrophoneSlash
                    className="sms-call-control-icon"
                    style={{ display: "block", visibility: "visible", opacity: 1 }}
                  />
                ) : (
                  <FaMicrophone
                    className="sms-call-control-icon"
                    style={{ display: "block", visibility: "visible", opacity: 1 }}
                  />
                )}
              </button>
              {activeCall.type === "video" && (
                <button
                  type="button"
                  className={`video-control ${activeCall.isVideoOff ? "active" : ""}`}
                  onClick={toggleVideo}
                  title={activeCall.isVideoOff ? "Turn camera on" : "Turn camera off"}
                  aria-label={activeCall.isVideoOff ? "Turn camera on" : "Turn camera off"}
                  aria-pressed={Boolean(activeCall.isVideoOff)}
                  data-control-state={activeCall.isVideoOff ? "off" : "on"}
                  disabled={activeCall.status !== "connected"}
                >
                  {activeCall.isVideoOff ? (
                    <FaVideoSlash
                      className="sms-call-control-icon"
                      style={{ display: "block", visibility: "visible", opacity: 1 }}
                    />
                  ) : (
                    <FaVideo
                      className="sms-call-control-icon"
                      style={{ display: "block", visibility: "visible", opacity: 1 }}
                    />
                  )}
                </button>
              )}
              <button type="button" className={activeCall.direction === "incoming" && activeCall.status === "ringing" ? "reject incoming-action" : "end"} onClick={() => endCall(activeCall.status === "ringing" ? (activeCall.direction === "incoming" ? "rejected" : "cancelled") : "ended")} title={activeCall.status === "ringing" && activeCall.direction === "incoming" ? "Reject incoming call" : "End call"}>
                <FaPhoneSlash />
                {activeCall.direction === "incoming" && activeCall.status === "ringing" && <span>Reject Call</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPostCallForm && postCallAppointment && (
        <div className="sms-consult-overlay" role="dialog" aria-modal="true">
          <div className="sms-consult-modal">
            <div className="sms-consult-head"><div><span>Remote Consultation</span><h2>Check & Complete Appointment</h2><p>Add the prescription and recommended tests for {selectedPatient?.name || "this patient"}.</p></div><button type="button" onClick={() => setShowPostCallForm(false)}><i className="fa-solid fa-xmark"></i></button></div>
            <div className="sms-consult-body">
              <label>Diagnosis <b>*</b><textarea rows="2" value={remoteConsultationForm.diagnosis} onChange={(event) => setRemoteConsultationForm((form) => ({ ...form, diagnosis: event.target.value }))} placeholder="Clinical diagnosis and findings" /></label>
              <label>Medicine / Prescription <b>*</b><textarea rows="4" value={remoteConsultationForm.medicine} onChange={(event) => setRemoteConsultationForm((form) => ({ ...form, medicine: event.target.value }))} placeholder="Medicine name, dosage, timing and duration" /></label>
              <label>Doctor's Advice <b>*</b><textarea rows="2" value={remoteConsultationForm.advice} onChange={(event) => setRemoteConsultationForm((form) => ({ ...form, advice: event.target.value }))} placeholder="Diet, care and follow-up advice" /></label>
              <div className="sms-consult-tests-head"><strong>Recommended Tests / Investigations</strong><button type="button" onClick={addRemoteTest}><i className="fa-solid fa-plus"></i> Add Test</button></div>
              {remoteConsultationForm.recommendedTests.map((test, index) => (
                <div className="sms-consult-test" key={`remote-test-${index}`}>
                  <input value={test.testName} onChange={(event) => updateRemoteTest(index, "testName", event.target.value)} placeholder="Test name (e.g. CBC)" />
                  <input type="date" value={test.completeBy} onChange={(event) => updateRemoteTest(index, "completeBy", event.target.value)} />
                  <input value={test.reason} onChange={(event) => updateRemoteTest(index, "reason", event.target.value)} placeholder="Reason" />
                  <input value={test.instructions} onChange={(event) => updateRemoteTest(index, "instructions", event.target.value)} placeholder="Instructions (e.g. fasting)" />
                  <button type="button" onClick={() => removeRemoteTest(index)} aria-label="Remove test"><i className="fa-solid fa-trash"></i></button>
                </div>
              ))}
            </div>
            <div className="sms-consult-actions"><button type="button" className="secondary" onClick={() => setShowPostCallForm(false)}>Save Later</button><button type="button" className="primary" disabled={savingConsultation || !remoteConsultationForm.diagnosis.trim() || !remoteConsultationForm.medicine.trim() || !remoteConsultationForm.advice.trim()} onClick={saveRemoteConsultation}>{savingConsultation ? "Saving..." : "Save & Complete"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientList;