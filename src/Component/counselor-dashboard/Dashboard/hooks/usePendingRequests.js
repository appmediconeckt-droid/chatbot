import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../axiosConfig";
import { getAuthToken } from "./counsellorAuth";

export default function usePendingRequests({ vibrate, onSessionExpired }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [latestRequest, setLatestRequest] = useState(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [modalTimer, setModalTimer] = useState(null);
  const [modalCountdown, setModalCountdown] = useState(10);

  const showToastMessage = (message, type = "info") => {
    console.log(`${type.toUpperCase()}: ${message}`);
    if (type === "error") {
      alert(`Error: ${message}`);
    } else if (type === "success") {
      alert(`Success: ${message}`);
    } else {
      alert(message);
    }
  };

  const showRequestModalWithTimer = (requestData) => {
    if (modalTimer) clearInterval(modalTimer);

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

  const fetchPendingRequests = async () => {
    setLoadingRequests(true);
    try {
      const token = getAuthToken();
      if (!token) {
        onSessionExpired();
        return null;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/chat/pending-requests`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          timeout: 30000,
        },
      );

      const data = response.data;
      const requests = data.requests || [];

      if (requests.length > 0 && pendingRequests.length !== requests.length) {
        setLatestRequest(requests[0]);
        setShowNotificationPopup(true);
        setTimeout(() => setShowNotificationPopup(false), 5000);
        showRequestModalWithTimer(requests[0]);
      }

      setPendingRequests(requests);
      setShowNotesModal(requests.length > 0);

      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          onSessionExpired();
          return null;
        }
        console.error("Axios error:", error.response?.data || error.message);
      } else {
        console.error("Error fetching pending requests:", error);
      }
      return null;
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!currentRequest) return;

    vibrate([50, 30, 50]);

    try {
      const token = getAuthToken();
      const chatId = currentRequest.chatId;

      if (!chatId) {
        showToastMessage("Unable to accept request: missing chat ID", "error");
        return;
      }

      await axios.patch(
        `${API_BASE_URL}/api/chat/accept/${chatId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (modalTimer) {
        clearInterval(modalTimer);
        setModalTimer(null);
      }
      setShowRequestModal(false);
      setCurrentRequest(null);

      showToastMessage("Request accepted successfully!", "success");
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error("Error accepting request:", error);
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : "Failed to accept request";
      showToastMessage(`Failed to accept request: ${errorMessage}`, "error");
    }
  };

  const handleRejectRequest = async () => {
    if (!currentRequest) return;

    vibrate([50]);

    try {
      const token = getAuthToken();
      const chatId = currentRequest.chatId;

      if (!chatId) {
        showToastMessage("Unable to reject request: missing chat ID", "error");
        return;
      }

      await axios.patch(
        `${API_BASE_URL}/api/chat/reject/${chatId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (modalTimer) {
        clearInterval(modalTimer);
        setModalTimer(null);
      }
      setShowRequestModal(false);
      setCurrentRequest(null);

      await fetchPendingRequests();
      showToastMessage("Request rejected successfully", "info");
    } catch (error) {
      console.error("Error rejecting request:", error);
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : "Failed to reject request";
      showToastMessage(`Failed to reject request: ${errorMessage}`, "error");
    }
  };

  useEffect(() => {
    if (!showRequestModal) return;
    const timeout = setTimeout(() => {
      setShowRequestModal(false);
      setCurrentRequest(null);
      if (modalTimer) {
        clearInterval(modalTimer);
        setModalTimer(null);
      }
    }, 10000);
    return () => clearTimeout(timeout);
  }, [showRequestModal]);

  useEffect(() => {
    return () => {
      if (modalTimer) clearInterval(modalTimer);
    };
  }, [modalTimer]);

  useEffect(() => {
    fetchPendingRequests();
    const interval = setInterval(fetchPendingRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  return {
    pendingRequests,
    loadingRequests,
    showNotificationPopup,
    latestRequest,
    showNotesModal,
    showRequestModal,
    currentRequest,
    modalCountdown,
    handleAcceptRequest,
    handleRejectRequest,
  };
}
