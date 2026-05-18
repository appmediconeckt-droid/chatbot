import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../axiosConfig";
import { getAuthToken } from "./counsellorAuth";

export default function useAppointments(activeTab) {
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );

  const handleUpdateAppointmentStatus = async (id, status) => {
    try {
      const token = getAuthToken();
      await axios.patch(
        `${API_BASE_URL}/api/appointments/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const response = await axios.get(`${API_BASE_URL}/api/appointments`, {
        params: { date: selectedDate },
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(response.data);
    } catch (err) {
      console.error("Error updating appointment status:", err);
      alert("Failed to update appointment status.");
    }
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = getAuthToken();
        const res = await axios.get(`${API_BASE_URL}/api/appointments`, {
          params: { date: selectedDate },
          headers: { Authorization: `Bearer ${token}` },
        });
        setAppointments(res.data || []);
      } catch (err) {
        console.error("Error fetching appointments:", err);
      }
    };
    fetchAppointments();
  }, [activeTab, selectedDate]);

  return {
    appointments,
    setAppointments,
    selectedDate,
    setSelectedDate,
    handleUpdateAppointmentStatus,
  };
}
