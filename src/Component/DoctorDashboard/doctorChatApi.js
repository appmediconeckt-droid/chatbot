import api from "../../axiosConfig";
import { API_BASE_URL, getDoctorUser } from "./doctorApi";

export const getCurrentUserId = () => getDoctorUser()?._id || localStorage.getItem("userId");
export const unwrapApiObject = (value) => value?.data?.data || value?.data || value?.call || value || {};
export const unwrapApiArray = (value) => {
  if (Array.isArray(value)) return value;
  for (const key of ["chats", "messages", "appointments", "data", "results"]) {
    if (Array.isArray(value?.[key])) return value[key];
  }
  return [];
};
export const getAssetUrl = (value) => {
  if (!value) return "";
  if (/^(https?:|blob:|data:)/i.test(value)) return value;
  return `${API_BASE_URL.replace(/\/api$/, "")}/${String(value).replace(/^\/+/, "")}`;
};
export const getAttachmentUrl = (message) => getAssetUrl(message?.attachmentUrl || message?.attachment_url || message?.file_url);

export async function getChatList() {
  const { data } = await api.get("/api/chat/chats");
  return unwrapApiArray(data).map((chat) => ({
    ...chat,
    patient: { ...chat.otherParty, full_name: chat.otherParty?.name },
    unread_count: chat.unreadCount,
  }));
}

async function getPatientChat(patientId) {
  const chat = (await getChatList()).find((item) => String(item.otherParty?.id) === String(patientId));
  if (!chat) throw new Error("No active chat found for this patient.");
  return chat;
}

export async function getConversation(patientId) {
  const chat = await getPatientChat(patientId);
  const { data } = await api.get(`/api/chat/chat/${encodeURIComponent(chat.id || chat._id)}/messages`);
  return unwrapApiArray(data).map((message) => ({
    ...message, id: message._id || message.id,
    sender_id: message.senderId?._id || message.senderId,
    message: message.content, created_at: message.createdAt,
    attachment_url: message.attachmentUrl,
  }));
}

export async function sendMessage({ receiverId, message }) {
  const chat = await getPatientChat(receiverId);
  return (await api.post(`/api/chat/chat/${encodeURIComponent(chat.id || chat._id)}/message`, { content: message })).data;
}

export async function sendAttachment({ receiverId, message, file }) {
  const chat = await getPatientChat(receiverId);
  const form = new FormData();
  form.append("attachment", file);
  form.append("content", message || "");
  return (await api.post(`/api/chat/chat/${encodeURIComponent(chat.id || chat._id)}/message`, form)).data;
}

export async function startCall({ receiverId, callType }) {
  const { data } = await api.post("/api/video/calls/initiate", { receiverId, receiverType: "user", callType });
  const call = data.call || data;
  return { ...data, data: { ...call, id: call.callId || data.callId || call.id } };
}
export const acceptCall = async (callId) => (await api.put(`/api/video/calls/${encodeURIComponent(callId)}/accept`, { userId: getCurrentUserId() })).data;
export const endCall = async ({ callId, status }) => (await api.put(`/api/video/calls/${encodeURIComponent(callId)}/${status === "rejected" ? "reject" : "end"}`, { userId: getCurrentUserId(), reason: status })).data;
