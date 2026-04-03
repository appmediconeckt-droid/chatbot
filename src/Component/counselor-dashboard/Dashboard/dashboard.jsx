import React, { useState, useEffect, useRef } from 'react';
import "./CounselorDashboard.css";
import { useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaVideo,
  FaComments,
  FaUserCircle,
  FaStar,
  FaBell,
  FaArrowRight,
  FaExclamationTriangle,
  FaUsers,
  FaMoneyBillWave,
  FaChartPie,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaHome,
  FaCheck,
  FaTimes as FaClose,
  FaMicrophone,
  FaPhoneAlt,
  FaPhoneSlash,
  FaSpinner,
  FaVideo as FaVideoIcon,
} from "react-icons/fa";
// Custom Hooks
import useVibration from '../../../hooks/useVibration';
import Dashboard from '../Tab/CounselorDashboard/Dashboardcou';
import Messagesou from '../Tab/Messages/Messagesou';
import PatientRequests from '../Tab/PatientRequests/PatientRequests';
import axios from 'axios';
import { API_BASE_URL } from '../../../axiosConfig';
import CounselorProfile from '../Tab/Profile-Con/CounselorProfile';

// Voice/Video Call Modal Component for Counselor
const CallModal = ({ isOpen, onClose, callType, callerName, callerImage, callData, onAccept, onEnd, onAcceptCall, onRejectCall, onJoinCall }) => {
  const [callStatus, setCallStatus] = useState('incoming');
  const [callDuration, setCallDuration] = useState(0);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isOpen && callStatus === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else if (!isOpen || callStatus === 'ended') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isOpen, callStatus]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    setCallStatus('connecting');
    
    if (onAcceptCall && callData) {
      try {
        await onAcceptCall(callData.callId);
        setCallStatus('connected');
        if (onAccept) onAccept();
      } catch (error) {
        console.error('Error accepting call:', error);
        setCallStatus('incoming');
      }
    } else {
      setTimeout(() => {
        setCallStatus('connected');
        if (onAccept) onAccept();
      }, 2000);
    }
    setIsAccepting(false);
  };

  const handleReject = async () => {
    setIsRejecting(true);
    setCallStatus('ended');
    
    if (onRejectCall && callData) {
      try {
        await onRejectCall(callData.callId);
      } catch (error) {
        console.error('Error rejecting call:', error);
      }
    }
    
    setTimeout(() => {
      if (onEnd) onEnd();
      onClose();
    }, 1500);
    setIsRejecting(false);
  };

  const handleJoin = async () => {
    setIsJoining(true);
    
    if (onJoinCall && callData) {
      try {
        const result = await onJoinCall(callData.callId);
        if (result) {
          setCallStatus('connected');
        }
      } catch (error) {
        console.error('Error joining call:', error);
      }
    }
    setIsJoining(false);
  };

  const handleEnd = async () => {
    setCallStatus('ended');
    
    if (callData && callData.onEndCall) {
      await callData.onEndCall(callData.callId);
    }
    
    setTimeout(() => {
      if (onEnd) onEnd();
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="couns-call-modal-overlay">
      <div className={`couns-call-modal ${callType === 'video' ? 'video-call-modal' : 'voice-call-modal'}`}>
        {callType === 'video' && callStatus === 'connected' && (
          <div className="couns-video-background">
            <div className="couns-remote-video-placeholder">
              {callerImage && (callerImage === '👨' || callerImage === '👩' || callerImage === '👤') ? (
                <div className="couns-avatar-emoji-large">{callerImage}</div>
              ) : callerImage ? (
                <img src={callerImage} alt={callerName} />
              ) : (
                <FaUserCircle />
              )}
              <div className="couns-video-loading">
                <FaSpinner className="spinning" />
                <span>Connecting video stream...</span>
              </div>
            </div>
            <div className="couns-local-video-preview">
              <div className="couns-local-video-placeholder">
                <FaUserCircle />
                <span>You</span>
              </div>
            </div>
          </div>
        )}

        <div className="couns-call-modal-content">
          <div className="couns-caller-info">
            <div className="couns-caller-avatar">
              {callerImage && (callerImage === '👨' || callerImage === '👩' || callerImage === '👤') ? (
                <div className="couns-avatar-emoji">{callerImage}</div>
              ) : callerImage ? (
                <img src={callerImage} alt={callerName} />
              ) : (
                <FaUserCircle />
              )}
            </div>
            <h3 className="couns-caller-name">{callerName || "User"}</h3>
            {callData && (
              <>
                <p className="couns-caller-user-id">Call ID: {callData.callId?.substring(0, 8)}...</p>
                <p className="couns-caller-user-id">Room ID: {callData.roomId?.substring(0, 8)}...</p>
              </>
            )}
            <p className="couns-call-status-text">
              {callStatus === 'incoming' && `${callType === 'video' ? 'Video' : 'Voice'} call incoming...`}
              {callStatus === 'connecting' && 'Connecting...'}
              {callStatus === 'connected' && `Call in progress • ${formatDuration(callDuration)}`}
              {callStatus === 'ended' && 'Call ended'}
            </p>
          </div>

          <div className="couns-call-controls">
            {callStatus === 'incoming' && (
              <>
                <button 
                  className="couns-call-btn couns-accept-btn" 
                  onClick={handleAccept}
                  disabled={isAccepting}
                >
                  {isAccepting ? <FaSpinner className="spinning" /> : <FaPhoneAlt />}
                  <span>{isAccepting ? 'Accepting...' : 'Accept'}</span>
                </button>
                <button 
                  className="couns-call-btn couns-join-btn" 
                  onClick={handleJoin}
                  disabled={isJoining}
                >
                  {isJoining ? <FaSpinner className="spinning" /> : <FaVideoIcon />}
                  <span>{isJoining ? 'Joining...' : 'Join Call'}</span>
                </button>
                <button 
                  className="couns-call-btn couns-reject-btn" 
                  onClick={handleReject}
                  disabled={isRejecting}
                >
                  {isRejecting ? <FaSpinner className="spinning" /> : <FaPhoneSlash />}
                  <span>{isRejecting ? 'Rejecting...' : 'Decline'}</span>
                </button>
              </>
            )}

            {callStatus === 'connecting' && (
              <div className="couns-connecting-animation">
                <div className="couns-connecting-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <p>Establishing secure connection...</p>
              </div>
            )}

            {callStatus === 'connected' && (
              <>
                {callType === 'video' && (
                  <>
                    <button className="couns-call-btn couns-icon-btn" onClick={() => {}}>
                      <FaMicrophone />
                      <span>Mute</span>
                    </button>
                    <button className="couns-call-btn couns-icon-btn" onClick={() => {}}>
                      <FaVideoIcon />
                      <span>Camera</span>
                    </button>
                  </>
                )}
                <button className="couns-call-btn couns-end-call-btn" onClick={handleEnd}>
                  <FaPhoneSlash />
                  <span>End Call</span>
                </button>
              </>
            )}

            {callStatus === 'ended' && (
              <button className="couns-call-btn couns-close-btn" onClick={onClose}>
                <FaTimes />
                <span>Close</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function CounselorDashboard() {
  const [activeTab, setActiveTab] = useState('messages');
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [latestRequest, setLatestRequest] = useState(null);

  // Call Modal States
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState('video');
  const [callerInfo, setCallerInfo] = useState({
    name: '',
    image: null,
    userId: '',
    userName: '',
    callId: '',
    roomId: '',
    waitingDuration: 0,
    onEndCall: null
  });

  // Waiting calls polling
  const [waitingCalls, setWaitingCalls] = useState([]);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [isPolling, setIsPolling] = useState(true);

  // Modal state for patient requests
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [modalTimer, setModalTimer] = useState(null);
  const [modalCountdown, setModalCountdown] = useState(10);

  const navigate = useNavigate();
  const vibrate = useVibration();

  // ========== CORRECTED API CALLS FOR VIDEO/WAITING ==========
  
  // Fetch waiting calls from API - CORRECTED with proper endpoint /calls/waiting/:userId/:userType
  // Fetch waiting calls from API - CORRECTED endpoint
const fetchWaitingCalls = async () => {
  try {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    
    if (!userId || !token) {
      console.log('No userId or token found');
      return;
    }
    
    // CORRECTED URL - removed /video/ from the path
    const response = await axios.get(`${API_BASE_URL}api/video/calls/waiting/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Waiting calls response:', response.data);
    
    if (response.data && response.data.success && response.data.calls && response.data.calls.length > 0) {
      setWaitingCalls(response.data.calls);
      
      const waitingCall = response.data.calls.find(call => call.status === 'waiting' || call.status === 'ringing');
      
      if (waitingCall && !showCallModal) {
        const callTypeValue = waitingCall.callType || 'video';
        setCallType(callTypeValue);
        
        const initiatorAvatar = waitingCall.initiator?.gender === 'female' ? '👩' : 
                                waitingCall.initiator?.gender === 'male' ? '👨' : '👤';
        
        setCallerInfo({
          name: waitingCall.initiator?.name || 'User',
          image: initiatorAvatar,
          userId: waitingCall.initiator?.id,
          userName: waitingCall.initiator?.name,
          callId: waitingCall.callId || waitingCall.id,
          roomId: waitingCall.roomId,
          waitingDuration: waitingCall.waitingDuration || 0,
          onEndCall: endCall
        });
        
        setShowCallModal(true);
        vibrate([200, 100, 200]);
      }
    } else {
      setWaitingCalls([]);
    }
  } catch (error) {
    console.error('Error fetching waiting calls:', error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }
  }
};

  // Accept Call API (PUT) for Counselor
  const acceptCall = async (callId) => {
    try {
      const token = localStorage.getItem('token');
      const counsellorId = localStorage.getItem('counsellorId');
      
      const requestBody = {
        acceptorId: counsellorId,
        acceptorType: 'counsellor'
      };
      
      console.log('Accepting call with body:', requestBody);
      
      const response = await axios.put(`${API_BASE_URL}/calls/${callId}/accept`, requestBody, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Accept call response:', response.data);
      
      if (response.data && response.data.success) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error accepting call:', error);
      return null;
    }
  };

  // Join Call API (POST) for Counselor
  const joinCall = async (callId) => {
    try {
      const token = localStorage.getItem('token');
      const counsellorId = localStorage.getItem('counsellorId');
      
      const requestBody = {
        userId: counsellorId,
        userType: 'counsellor'
      };
      
      console.log('Joining call with body:', requestBody);
      
      const response = await axios.post(`${API_BASE_URL}/calls/${callId}/join`, requestBody, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Join call response:', response.data);
      
      if (response.data && response.data.success) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error joining call:', error);
      return false;
    }
  };

  // End Call API (PUT) for Counselor
  const endCall = async (callId) => {
    try {
      const token = localStorage.getItem('token');
      const counsellorId = localStorage.getItem('counsellorId');
      
      const requestBody = {
        userId: counsellorId,
        endedBy: 'counsellor'
      };
      
      console.log('Ending call with body:', requestBody);
      
      const response = await axios.put(`${API_BASE_URL}/calls/${callId}/end`, requestBody, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('End call response:', response.data);
      
      if (response.data && response.data.success) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error ending call:', error);
      return null;
    }
  };

  // Reject Call API
  const rejectCall = async (callId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_BASE_URL}/calls/reject/${callId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Reject call response:', response.data);
      return response.data?.success || false;
    } catch (error) {
      console.error('Error rejecting call:', error);
      return false;
    }
  };

  // Start polling for waiting calls
  useEffect(() => {
    if (isPolling && !showCallModal) {
      fetchWaitingCalls();
      
      const interval = setInterval(() => {
        fetchWaitingCalls();
      }, 5000);
      
      setPollingInterval(interval);
      
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    } else if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [isPolling, showCallModal]);

  // Stop polling when call modal is open
  useEffect(() => {
    if (showCallModal) {
      setIsPolling(false);
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    } else {
      setIsPolling(true);
    }
  }, [showCallModal]);

  // ========== END OF CORRECTED API CALLS ==========

  // Function to fetch pending requests using Axios
  const fetchPendingRequests = async () => {
    setLoadingRequests(true);
    try {
      const token = localStorage.getItem('token');

      const response = await axios.get(`${API_BASE_URL}/api/chat/pending-requests`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        timeout: 10000,
      });

      console.log('Pending requests response:', response.data);

      const data = response.data;
      const requests = data.requests || [];

      if (requests.length > 0 && pendingRequests.length !== requests.length) {
        setLatestRequest(requests[0]);
        setShowNotificationPopup(true);

        setTimeout(() => {
          setShowNotificationPopup(false);
        }, 5000);

        showRequestModalWithTimer(requests[0]);
      }

      setPendingRequests(requests);

      if (requests.length > 0) {
        setShowNotesModal(true);
      } else {
        setShowNotesModal(false);
      }

      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Axios error:', error.response?.data || error.message);
        console.error('Status:', error.response?.status);
      } else {
        console.error('Error fetching pending requests:', error);
      }
      return null;
    } finally {
      setLoadingRequests(false);
    }
  };

  // Function to show request modal with auto-hide after 10 seconds
  const showRequestModalWithTimer = (requestData) => {
    if (modalTimer) {
      clearInterval(modalTimer);
    }

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

  // Auto-hide modal after 10 seconds (fallback)
  useEffect(() => {
    if (showRequestModal) {
      const timeout = setTimeout(() => {
        setShowRequestModal(false);
        setCurrentRequest(null);
        if (modalTimer) {
          clearInterval(modalTimer);
          setModalTimer(null);
        }
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [showRequestModal]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (modalTimer) {
        clearInterval(modalTimer);
      }
    };
  }, [modalTimer]);

  // Function to handle accept request with automatic page reload
  const handleAcceptRequest = async () => {
    if (!currentRequest) return;
    
    vibrate([50, 30, 50]);
    
    try {
      const token = localStorage.getItem('token');
      const chatId = currentRequest.chatId;
      
      if (!chatId) {
        console.error('No chatId found in request');
        showToastMessage('Unable to accept request: missing chat ID', 'error');
        return;
      }
      
      const response = await axios.patch(
        `${API_BASE_URL}/api/chat/accept/${chatId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Request accepted successfully:', response.data);
      
      if (modalTimer) {
        clearInterval(modalTimer);
        setModalTimer(null);
      }
      setShowRequestModal(false);
      setCurrentRequest(null);
      
      showToastMessage('Request accepted successfully!', 'success');
      
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error('Error accepting request:', error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        showToastMessage(`Failed to accept request: ${errorMessage}`, 'error');
      } else {
        showToastMessage('Failed to accept request', 'error');
      }
    }
  };

  // Function to handle accept from session notes with automatic page reload
  const handleAcceptFromSessionNotes = async (request) => {
    if (!request) return;
    
    vibrate([50, 30, 50]);
    setLoadingRequests(true);
    
    try {
      const token = localStorage.getItem('token');
      const chatId = request.chatId;
      
      if (!chatId) {
        console.error('No chatId found in request');
        showToastMessage('Unable to accept request: missing chat ID', 'error');
        return;
      }
      
      const response = await axios.patch(
        `${API_BASE_URL}/api/chat/accept/${chatId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Request accepted successfully:', response.data);
      
      setShowNotesModal(false);
      
      showToastMessage('Request accepted successfully!', 'success');
      
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error('Error accepting request:', error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        showToastMessage(`Failed to accept request: ${errorMessage}`, 'error');
      } else {
        showToastMessage('Failed to accept request', 'error');
      }
    } finally {
      setLoadingRequests(false);
    }
  };

  // Function to handle reject request
  const handleRejectRequest = async () => {
    if (!currentRequest) return;

    vibrate([50]);

    try {
      const token = localStorage.getItem('token');
      const chatId = currentRequest.chatId;

      if (!chatId) {
        console.error('No chatId found in request');
        showToastMessage('Unable to reject request: missing chat ID', 'error');
        return;
      }

      const response = await axios.patch(
        `${API_BASE_URL}/api/chat/reject/${chatId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Request rejected successfully:', response.data);

      if (modalTimer) {
        clearInterval(modalTimer);
        setModalTimer(null);
      }
      setShowRequestModal(false);
      setCurrentRequest(null);

      await fetchPendingRequests();

      showToastMessage('Request rejected successfully', 'info');

    } catch (error) {
      console.error('Error rejecting request:', error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        showToastMessage(`Failed to reject request: ${errorMessage}`, 'error');
      } else {
        showToastMessage('Failed to reject request', 'error');
      }
    }
  };

  // Handle Accept Call
  const handleAcceptCall = async (callId) => {
    try {
      const result = await acceptCall(callId);
      if (result) {
        console.log('Call accepted successfully', result);
        return result;
      }
      return null;
    } catch (error) {
      console.error('Error in accept call:', error);
      return null;
    }
  };

  // Handle Join Call
  const handleJoinCall = async (callId) => {
    try {
      const result = await joinCall(callId);
      console.log('Join call result:', result);
      return result;
    } catch (error) {
      console.error('Error in join call:', error);
      return false;
    }
  };

  // Handle Reject Call
  const handleRejectCall = async (callId) => {
    try {
      await rejectCall(callId);
      console.log('Call rejected successfully');
    } catch (error) {
      console.error('Error in reject call:', error);
    }
  };

  const handleAcceptCallModal = () => {
    console.log('Call accepted');
  };

  const handleEndCall = () => {
    console.log('Call ended');
  };

  // Toast notification helper
  const showToastMessage = (message, type = 'info') => {
    console.log(`${type.toUpperCase()}: ${message}`);
    if (type === 'error') {
      alert(`Error: ${message}`);
    } else if (type === 'success') {
      alert(`Success: ${message}`);
    } else {
      alert(message);
    }
  };

  // Poll for pending requests every 10 seconds
  useEffect(() => {
    fetchPendingRequests();

    const interval = setInterval(() => {
      fetchPendingRequests();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      vibrate([50, 30, 50]);

      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (!accessToken && !refreshToken) {
        console.warn("No tokens found, clearing storage and redirecting");
        localStorage.clear();
        navigate("/role-selector");
        return;
      }

      if (accessToken) {
        await axios.post(
          `${API_BASE_URL}/api/auth/logout`,
          { refreshToken: refreshToken },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      localStorage.clear();
      setShowLogoutConfirm(false);
      navigate("/role-selector");

    } catch (error) {
      console.error("Logout Error:", error);
      localStorage.clear();
      setShowLogoutConfirm(false);
      navigate("/role-selector");
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [counselorData, setCounselorData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounsellor = async () => {
      try {
        const counsellorId = localStorage.getItem("counsellorId");
        const token = localStorage.getItem('token');

        if (!counsellorId) {
          console.error("No counsellor ID found");
          setLoading(false);
          return;
        }

        const res = await axios.get(
          `${API_BASE_URL}/api/auth/counsellors/${counsellorId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = res.data.counsellor;

        let profilePhotoUrl = null;
        if (data.profilePhoto) {
          if (typeof data.profilePhoto === 'string') {
            profilePhotoUrl = data.profilePhoto;
          } else if (data.profilePhoto.url) {
            profilePhotoUrl = data.profilePhoto.url;
          } else if (data.profilePhoto.publicId) {
            profilePhotoUrl = `https://res.cloudinary.com/dfll8lwos/image/upload/${data.profilePhoto.publicId}`;
          }
        }

        setCounselorData({
          name: data.fullName || data.name,
          specialization: Array.isArray(data.specialization) ? data.specialization.join(", ") : data.specialization,
          experience: `${data.experience || 0} years`,
          patients: 0,
          rating: data.rating || 4.5,
          email: data.email,
          phoneNumber: data.phoneNumber,
          license: "N/A",
          education: data.qualification || data.education,
          university: "N/A",
          hourlyRate: 0,
          languages: data.languages || [],
          specializations: data.specialization || [],
          aboutMe: data.aboutMe,
          location: data.location,
          consultationMode: data.consultationMode,
          profilePhoto: profilePhotoUrl
        });

      } catch (error) {
        console.error("Error fetching counsellor:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounsellor();
  }, []);

  if (loading) {
    return <div className="couns-loading">
      <div className="couns-loading-spinner"></div>
    </div>;
  }

  const navItems = [
    { id: 'messages', icon: <FaComments />, label: 'Messages', badge: pendingRequests.length },
    { id: 'appointments', icon: <FaCalendarAlt />, label: 'Appointments', },
    { id: 'sessions', icon: <FaVideo />, label: 'Sessions', badge: 0 },
    { id: 'patients', icon: <FaUsers />, label: 'Patients', badge: 0 },
    { id: 'earnings', icon: <FaMoneyBillWave />, label: 'Earnings', badge: 0 },
    { id: 'profile', icon: <FaChartPie />, label: 'Profile', badge: 0 },
    { id: 'settings', icon: <FaCog />, label: 'Settings', badge: 0 }
  ];

  const handleTabChange = (tabId) => {
    vibrate(20);
    setActiveTab(tabId);
    setShowMobileMenu(false);
  };

  return (
    <div className="couns-dashboard">
      {/* Voice/Video Call Modal */}
      <CallModal
        isOpen={showCallModal}
        onClose={() => {
          setShowCallModal(false);
          setCallerInfo({
            name: '',
            image: null,
            userId: '',
            userName: '',
            callId: '',
            roomId: '',
            waitingDuration: 0,
            onEndCall: null
          });
        }}
        callType={callType}
        callerName={callerInfo.userName || callerInfo.name}
        callerImage={callerInfo.image}
        callData={callerInfo}
        onAccept={handleAcceptCallModal}
        onEnd={handleEndCall}
        onAcceptCall={handleAcceptCall}
        onRejectCall={handleRejectCall}
        onJoinCall={handleJoinCall}
      />

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="couns-sidebar">
          <div className="couns-sidebar-header">
            <div className="couns-counselor-profile">
              {counselorData?.profilePhoto ? (
                <img
                  src={counselorData.profilePhoto}
                  alt={counselorData?.name || 'Profile'}
                  className="couns-profile-avatar-img"
                  onError={(e) => {
                    console.error('Image failed to load:', counselorData?.profilePhoto);
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    const fallbackIcon = e.target.nextElementSibling;
                    if (fallbackIcon) fallbackIcon.style.display = 'block';
                  }}
                />
              ) : null}
              {!counselorData?.profilePhoto && (
                <FaUserCircle className="couns-profile-avatar" />
              )}
              <FaUserCircle className="couns-profile-avatar-fallback" style={{ display: 'none' }} />

              <h3>{counselorData?.name || 'Counselor'}</h3>

              <div className="couns-extra-info">
                <p><strong>Specialization:</strong> {counselorData?.specialization || 'Not specified'}</p>
                <p><strong>Email:</strong> {counselorData?.email || 'Not specified'}</p>
                <p><strong>Phone:</strong> {counselorData?.phoneNumber || 'Not specified'}</p>
                <p><strong>Experience:</strong> {counselorData?.experience || '0 years'}</p>
              </div>

            </div>
          </div>

          <nav className="couns-sidebar-nav">
            {navItems.map(item => (
              <button
                key={item.id}
                className={`couns-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => handleTabChange(item.id)}
              >
                <span className="couns-nav-icon">{item.icon}</span>
                <span className="couns-nav-label">{item.label}</span>
                {item.badge > 0 && (
                  <span className="couns-nav-badge">{item.badge}</span>
                )}
              </button>
            ))}

            <button
              className="couns-nav-item logout"
              onClick={() => setShowLogoutConfirm(true)}
            >
              <span className="couns-nav-icon"><FaSignOutAlt /></span>
              <span className="couns-nav-label">Logout</span>
            </button>
          </nav>
        </aside>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <div className="couns-mobile-header">
          <button
            className="couns-menu-toggle"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <FaTimes /> : <FaBars />}
          </button>
          <div className="couns-mobile-title">
            <h2>Counselor Dashboard</h2>
            <p>{new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}</p>
          </div>
          <div className="couns-mobile-notif" onClick={() => fetchPendingRequests()}>
            <FaBell />
            {pendingRequests.length > 0 && (
              <span className="couns-notif-badge">{pendingRequests.length}</span>
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {isMobile && showMobileMenu && (
        <div className="couns-mobile-menu-overlay">
          <div className="couns-mobile-menu">
            <div className="couns-sidebar-header">
              <div className="couns-counselor-profile">
                {counselorData?.profilePhoto ? (
                  <img
                    src={counselorData.profilePhoto}
                    alt={counselorData?.name || 'Profile'}
                    className="couns-profile-avatar-img"
                    onError={(e) => {
                      console.error('Image failed to load:', counselorData?.profilePhoto);
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      const fallbackIcon = e.target.nextElementSibling;
                      if (fallbackIcon) fallbackIcon.style.display = 'block';
                    }}
                  />
                ) : null}
                {!counselorData?.profilePhoto && (
                  <FaUserCircle className="couns-profile-avatar" />
                )}
                <FaUserCircle className="couns-profile-avatar-fallback" style={{ display: 'none' }} />

                <h3>{counselorData?.name || 'Counselor'}</h3>

                <p><strong>Specialization:</strong> {counselorData?.specialization || 'Not specified'}</p>

                <div className="couns-rating-badge">
                  <FaStar className="couns-star" />
                  <span>{counselorData?.rating || 0}</span>
                </div>

                <div className="couns-extra-info">
                  <p><strong>Email:</strong> {counselorData?.email || 'Not specified'}</p>
                  <p><strong>Phone:</strong> {counselorData?.phoneNumber || 'Not specified'}</p>
                  <p><strong>Experience:</strong> {counselorData?.experience || '0 years'}</p>
                </div>

              </div>
            </div>

            <nav className="couns-mobile-nav">
              {navItems.map(item => (
                <button
                  key={item.id}
                  className={`couns-mobile-nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => handleTabChange(item.id)}
                >
                  <span className="couns-mobile-nav-icon">{item.icon}</span>
                  <span className="couns-mobile-nav-label">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="couns-mobile-nav-badge">{item.badge}</span>
                  )}
                  <FaArrowRight className="couns-mobile-nav-arrow" />
                </button>
              ))}

              <button
                className="couns-mobile-nav-item logout"
                onClick={() => {
                  setShowMobileMenu(false);
                  setShowLogoutConfirm(true);
                }}
              >
                <span className="couns-mobile-nav-icon"><FaSignOutAlt /></span>
                <span className="couns-mobile-nav-label">Logout</span>
                <FaArrowRight className="couns-mobile-nav-arrow" />
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      {isMobile && !showMobileMenu && (
        <nav className="couns-mobile-bottom-nav">
          {navItems.slice(0, 5).map(item => (
            <button
              key={item.id}
              className={`couns-bottom-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleTabChange(item.id)}
            >
              <span className="couns-bottom-nav-icon">{item.icon}</span>
              <span className="couns-bottom-nav-label">{item.label}</span>
              {item.badge > 0 && (
                <span className="couns-bottom-nav-badge">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>
      )}

      {/* Main Content */}
      <div className={`couns-main-content ${isMobile ? 'mobile' : ''}`}>
        {activeTab === 'dashboard' && (
          <div className="couns-tab-content">
            <div className="couns-tab-header">
              <Dashboard />
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="couns-tab-content">
            <div className="couns-tab-header">
              <h2>My Appointments</h2>
              <div className="couns-appointment-filters">
                <div className="couns-search-box">
                  <span className="couns-search-icon">🔍</span>
                  <input type="text" placeholder="Search appointments..." />
                </div>
                <select className="couns-filter-select">
                  <option>All Appointments</option>
                  <option>Today</option>
                  <option>Upcoming</option>
                  <option>Completed</option>
                </select>
              </div>
            </div>
            <div className="couns-appointments-grid">
              <div className="couns-coming-soon">
                <FaCalendarAlt className="couns-coming-icon" />
                <h3>Coming Soon</h3>
                <p>Your appointments will appear here</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="couns-tab-content">
            <div className="couns-tab-header">
              <h2>Today's Sessions</h2>
            </div>
            <div className="couns-sessions-list">
              <div className="couns-coming-soon">
                <FaVideo className="couns-coming-icon" />
                <h3>No Sessions Today</h3>
                <p>Your scheduled sessions will appear here</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="couns-tab-content">
            <div className="couns-tab-header">
              <PatientRequests />
            </div>
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="couns-tab-content">
            <div className="couns-tab-header">
              <h2>Earnings Overview</h2>
            </div>
            <div className="couns-earnings-summary">
              <div className="couns-earnings-card">
                <h3>Total Earnings</h3>
                <div className="couns-earnings-amount">₹0</div>
                <div className="couns-earnings-badge">+0% from last month</div>
              </div>
              <div className="couns-earnings-card pending">
                <h3>Pending Payout</h3>
                <div className="couns-earnings-amount">₹0</div>
                <div className="couns-earnings-badge">Awaiting processing</div>
              </div>
              <div className="couns-earnings-card">
                <h3>This Month</h3>
                <div className="couns-earnings-amount">₹0</div>
                <div className="couns-earnings-badge">0 sessions completed</div>
              </div>
            </div>
            <div className="couns-earnings-chart">
              <h3>Earnings Overview</h3>
              <div className="couns-chart-placeholder">
                <div className="couns-chart-bars">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => (
                    <div key={i} className="couns-chart-bar" style={{ height: '0px' }}>
                      {month}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="couns-tab-content">
            <div className="couns-tab-header">
              <Messagesou />
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="couns-tab-content">
            <CounselorProfile />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="couns-tab-content">
            <div className="couns-tab-header">
              <h2>Settings</h2>
            </div>
            <div className="couns-section">
              <div className="couns-section-header">
                <h2>Profile Settings</h2>
              </div>
              <div className="couns-coming-soon">
                <FaCog className="couns-coming-icon" />
                <h3>Coming Soon</h3>
                <p>Profile settings will be available here</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Request Modal */}
      {showRequestModal && currentRequest && (
        <div className="couns-request-modal-overlay" onClick={() => { }}>
          <div className="couns-request-modal" onClick={e => e.stopPropagation()}>
            <div className="couns-request-modal-header">
              <div className="couns-request-header-left">
                <div className="couns-request-icon">
                  <FaUsers />
                </div>
                <div>
                  <h3>New Chat Request</h3>
                  <p className="couns-request-timer">Auto-closes in {modalCountdown}s</p>
                </div>
              </div>
            </div>

            <div className="couns-request-modal-body">
              <div className="couns-request-patient-info">
                <div className="couns-request-patient-name">
                  <h4>{currentRequest.user?.anonymous || currentRequest.patientName || 'Unknown User'}</h4>
                </div>
                <div className="couns-request-type">
                  <span className="couns-request-type-badge">
                    Chat Request
                  </span>
                </div>
              </div>

              <div className="couns-request-message">
                <p>{currentRequest.requestMessage || currentRequest.message || 'Would like to start a conversation with you.'}</p>
              </div>

              <div className="couns-request-meta">
                <span className="couns-request-time">
                  Requested: {new Date(currentRequest.requestedAt || currentRequest.requestedAt).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <div className="couns-request-modal-footer">
              <button
                className="couns-request-btn couns-request-reject"
                onClick={handleRejectRequest}
                disabled={loadingRequests}
              >
                <FaClose />
                Reject
              </button>
              <button
                className="couns-request-btn couns-request-accept"
                onClick={handleAcceptRequest}
                disabled={loadingRequests}
              >
                <FaCheck />
                Accept
              </button>
            </div>

            <div className="couns-request-progress">
              <div
                className="couns-request-progress-bar"
                style={{ width: `${(modalCountdown / 10) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="couns-modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="couns-modal-content small" onClick={e => e.stopPropagation()}>
            <div className="couns-logout-modal">
              <FaExclamationTriangle className="couns-warning-icon" />
              <h3>Confirm Logout</h3>
              <p>Are you sure you want to logout?</p>
              <div className="couns-modal-actions">
                <button
                  className="couns-cancel-btn"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="couns-confirm-btn"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}