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
      
      const allAppointments = res.data || [];
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
  }, []);

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
      
      const allAppointments = res.data || [];
      
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
  }, []);

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
