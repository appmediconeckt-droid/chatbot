// import { useState, useEffect } from "react";
// import axios from "axios";
// import { API_BASE_URL } from "../../../../axiosConfig";
// import { getAuthToken } from "./counsellorAuth";

// export default function useAppointments(activeTab) {
//   const [appointments, setAppointments] = useState([]);
//   const [selectedDate, setSelectedDate] = useState(
//     new Date().toLocaleDateString("en-CA"),
//   );

//   const handleUpdateAppointmentStatus = async (id, status) => {
//     try {
//       const token = getAuthToken();
//       await axios.patch(
//         `${API_BASE_URL}/api/appointments/${id}/status`,
//         { status },
//         { headers: { Authorization: `Bearer ${token}` } },
//       );
//       const response = await axios.get(`${API_BASE_URL}/api/appointments`, {
//         params: { date: selectedDate },
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setAppointments(response.data);
//     } catch (err) {
//       console.error("Error updating appointment status:", err);
//       alert("Failed to update appointment status.");
//     }
//   };

//   useEffect(() => {
//     const fetchAppointments = async () => {
//       try {
//         const token = getAuthToken();
//         const res = await axios.get(`${API_BASE_URL}/api/appointments`, {
//           params: { date: selectedDate },
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         setAppointments(res.data || []);
//       } catch (err) {
//         console.error("Error fetching appointments:", err);
//       }
//     };
//     fetchAppointments();
//   }, [activeTab, selectedDate]);

//   return {
//     appointments,
//     setAppointments,
//     selectedDate,
//     setSelectedDate,
//     handleUpdateAppointmentStatus,
//   };
// }


// hooks/useAppointments.js
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../axiosConfig";
import { getAuthToken } from "./counsellorAuth";
import {
  getAnonymousParticipantId,
  getAnonymousUserAvatarUrl,
} from "../../../../utils/anonymousUser";

const getAppointmentPatient = (appointment = {}) => ({
  ...appointment,
  ...(appointment.user || appointment.patient || appointment.client || {}),
});

const getAppointmentChatId = (appointment = {}) =>
  appointment.chatId ||
  appointment.chat_id ||
  appointment.conversationId ||
  appointment.conversation_id ||
  appointment.chat?.chatId ||
  appointment.chat?._id ||
  appointment.chat?.id;

const getChatPatientId = (chat = {}) => {
  const otherParty = chat.otherParty || chat.user || chat.patient || {};
  return getAnonymousParticipantId({
    ...otherParty,
    userId: chat.userId || otherParty.userId,
    receiverId: chat.receiverId || otherParty.receiverId,
  });
};

const findMatchingChat = (appointment, chats = []) => {
  const appointmentChatId = getAppointmentChatId(appointment);
  if (appointmentChatId) {
    const directMatch = chats.find((chat) =>
      [chat.chatId, chat.id, chat._id].some(
        (id) => id && String(id) === String(appointmentChatId),
      ),
    );
    if (directMatch) return directMatch;
  }

  const patientId = getAnonymousParticipantId(getAppointmentPatient(appointment));
  if (!patientId) return null;

  return chats.find((chat) => String(getChatPatientId(chat)) === String(patientId)) || null;
};

const normalizeAppointmentList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.appointments)) return payload.appointments;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.appointments)) return payload.data.appointments;
  return [];
};

export const mergeAppointmentPatientAvatar = (
  appointment,
  chat,
  profile = null,
) => {
  const chatPeer = chat?.otherParty || chat?.user || chat?.patient || {};
  const existingPatient = appointment?.user || appointment?.patient || appointment?.client || {};
  const avatarUrl =
    getAnonymousUserAvatarUrl(profile || {}) ||
    getAnonymousUserAvatarUrl(chatPeer) ||
    getAnonymousUserAvatarUrl(existingPatient) ||
    getAnonymousUserAvatarUrl(appointment);

  if (!avatarUrl) return appointment;

  const patientPatch = {
    ...(profile || {}),
    ...chatPeer,
    ...existingPatient,
    avatarUrl,
    anonymousAvatarUrl: avatarUrl,
    profilePhoto: existingPatient.profilePhoto || chatPeer.profilePhoto || profile?.profilePhoto || avatarUrl,
  };

  return {
    ...appointment,
    avatarUrl,
    anonymousAvatarUrl: avatarUrl,
    profilePhoto: appointment.profilePhoto || avatarUrl,
    user: appointment.user ? { ...appointment.user, ...patientPatch } : patientPatch,
    patient: appointment.patient ? { ...appointment.patient, ...patientPatch } : appointment.patient,
    client: appointment.client ? { ...appointment.client, ...patientPatch } : appointment.client,
  };
};

export default function useAppointments(activeTab) {
  const [appointments, setAppointments] = useState([]);
  const [sessionAppointments, setSessionAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // ✅ Appointments ke liye - empty by default (saare appointments)
  const [selectedDate, setSelectedDate] = useState("");
  
  // ✅ Sessions ke liye - today's date by default
  const [sessionSelectedDate, setSessionSelectedDate] = useState(
    new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD
  );

  const getCounselorChats = useCallback(async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/chat/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return Array.isArray(response.data?.chats) ? response.data.chats : [];
    } catch (error) {
      console.error("Error fetching chats for appointment avatars:", error);
      return [];
    }
  }, []);

  const getUserProfile = useCallback(async (token, userId) => {
    if (!userId) return null;
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/auth/getUser/${encodeURIComponent(userId)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return response.data?.user || response.data?.data || response.data || null;
    } catch (error) {
      console.error("Error fetching appointment user avatar:", error);
      return null;
    }
  }, []);

  const hydrateAppointmentAvatars = useCallback(async (items, token, chats = []) => {
    const appointments = Array.isArray(items) ? items : [];
    if (!appointments.length) return [];

    return Promise.all(
      appointments.map(async (appointment) => {
        const matchingChat = findMatchingChat(appointment, chats);
        const fromChat = mergeAppointmentPatientAvatar(appointment, matchingChat);
        if (getAnonymousUserAvatarUrl(fromChat)) return fromChat;

        const patientId = getAnonymousParticipantId(getAppointmentPatient(fromChat));
        const profile = await getUserProfile(token, patientId);
        return mergeAppointmentPatientAvatar(fromChat, matchingChat, profile);
      }),
    );
  }, [getUserProfile]);

  // ✅ Fetch appointments function
  const fetchAppointments = useCallback(async (date) => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        console.error("No auth token found");
        setLoading(false);
        return;
      }

      const params = date ? { date } : {};
      
      const res = await axios.get(`${API_BASE_URL}/api/appointments`, {
        params: params,
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const chats = await getCounselorChats(token);
      const allAppointments = await hydrateAppointmentAvatars(
        normalizeAppointmentList(res.data),
        token,
        chats,
      );
      setAppointments(allAppointments);
      
      // ✅ Filter confirmed appointments for sessions
      const confirmedAppointments = allAppointments.filter(
        apt => apt.status === "confirmed"
      );
      setSessionAppointments(confirmedAppointments);
      
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setAppointments([]);
      setSessionAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [getCounselorChats, hydrateAppointmentAvatars]);

  // ✅ Fetch session appointments with date filter
  const fetchSessionAppointments = useCallback(async (date) => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        console.error("No auth token found");
        setLoading(false);
        return;
      }

      // ✅ Always send date for sessions
      const params = { date: date || new Date().toISOString().split('T')[0] };
      
      const res = await axios.get(`${API_BASE_URL}/api/appointments`, {
        params: params,
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const chats = await getCounselorChats(token);
      const allAppointments = await hydrateAppointmentAvatars(
        normalizeAppointmentList(res.data),
        token,
        chats,
      );
      
      // ✅ Only confirmed appointments for sessions
      const confirmedAppointments = allAppointments.filter(
        apt => apt.status === "confirmed"
      );
      setSessionAppointments(confirmedAppointments);
      
    } catch (err) {
      console.error("Error fetching session appointments:", err);
      setSessionAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [getCounselorChats, hydrateAppointmentAvatars]);

  // ✅ Handle update appointment status
  const handleUpdateAppointmentStatus = useCallback(async (id, status) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error("No auth token found");
        return;
      }

      await axios.patch(
        `${API_BASE_URL}/api/appointments/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      
      // ✅ Refresh based on active tab
      if (activeTab === 'appointments') {
        await fetchAppointments(selectedDate);
      } else if (activeTab === 'sessions') {
        await fetchSessionAppointments(sessionSelectedDate);
      }
    } catch (err) {
      console.error("Error updating appointment status:", err);
      alert("Failed to update appointment status.");
    }
  }, [selectedDate, sessionSelectedDate, activeTab, fetchAppointments, fetchSessionAppointments]);

  // ✅ Handle appointment date change
  const handleDateChange = useCallback((date) => {
    setSelectedDate(date);
  }, []);

  // ✅ Handle session date change
  const handleSessionDateChange = useCallback((date) => {
    setSessionSelectedDate(date);
    // ✅ Fetch with new date
    fetchSessionAppointments(date);
  }, [fetchSessionAppointments]);

  // ✅ Clear appointment date filter
  const clearDateFilter = useCallback(() => {
    setSelectedDate("");
    fetchAppointments("");
  }, [fetchAppointments]);

  // ✅ Clear session date filter (reset to today)
  const clearSessionDateFilter = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setSessionSelectedDate(today);
    fetchSessionAppointments(today);
  }, [fetchSessionAppointments]);

  // ✅ Fetch appointments when tab changes
  useEffect(() => {
    fetchAppointments("");
    fetchSessionAppointments(sessionSelectedDate);
  }, [fetchAppointments, fetchSessionAppointments]);

  useEffect(() => {
    if (activeTab === 'appointments') {
      fetchAppointments(selectedDate);
    } else if (activeTab === 'sessions') {
      // ✅ Always fetch with today's date for sessions
      fetchSessionAppointments(sessionSelectedDate);
    }
  }, [activeTab, selectedDate, sessionSelectedDate, fetchAppointments, fetchSessionAppointments]);

  return {
    appointments,
    sessionAppointments,
    setAppointments,
    selectedDate,
    setSelectedDate: handleDateChange,
    sessionSelectedDate,
    setSessionSelectedDate: handleSessionDateChange,
    clearDateFilter,
    clearSessionDateFilter,
    loading,
    handleUpdateAppointmentStatus,
    fetchAppointments,
    fetchSessionAppointments,
  };
}
