// CounselorDashboard.jsx
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
} from "react-icons/fa";
// Custom Hooks
import useVibration from '../../../hooks/useVibration';
import Dashboard from '../Tab/CounselorDashboard/Dashboardcou';
import Messagesou from '../Tab/Messages/Messagesou';
import PatientRequests from '../Tab/PatientRequests/PatientRequests';
import axios from 'axios';
import { API_BASE_URL } from '../../../axiosConfig';
import CounselorProfile from '../Tab/Profile-Con/CounselorProfile';

export default function CounselorDashboard() {
  const [activeTab, setActiveTab] = useState('messages');
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Modal state for patient requests
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [modalCountdown, setModalCountdown] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const modalTimerRef = useRef(null);
  const [processedRequestIds, setProcessedRequestIds] = useState(new Set());
  const [requestQueue, setRequestQueue] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Ref to track modal open state (used in fetch to avoid race conditions)
  const isModalOpenRef = useRef(false);
  useEffect(() => {
    isModalOpenRef.current = isModalOpen;
  }, [isModalOpen]);

  const navigate = useNavigate();
  const vibrate = useVibration();

  // Show next request in queue
  const showNextRequest = () => {
    if (requestQueue.length > 0 && !isModalOpenRef.current) {
      const nextRequest = requestQueue[0];
      showRequestModalWithTimer(nextRequest);
      setRequestQueue(prev => prev.slice(1));
    }
  };

  // Show request modal with timer based on remainingSeconds from API
  const showRequestModalWithTimer = (requestData) => {
    // Clear any existing timer
    if (modalTimerRef.current) {
      clearInterval(modalTimerRef.current);
      modalTimerRef.current = null;
    }

    // Don't show if already expired
    if ((requestData.remainingSeconds || 10) <= 0) {
      return;
    }

    setIsModalOpen(true);
    setCurrentRequest(requestData);
    setShowRequestModal(true);

    const initialTime = requestData.remainingSeconds || 10;
    setModalCountdown(initialTime);

    modalTimerRef.current = setInterval(() => {
      setModalCountdown(prev => {
        const newVal = prev - 1;
        if (newVal <= 0) {
          // Time's up – close modal
          clearInterval(modalTimerRef.current);
          modalTimerRef.current = null;
          closeRequestModal();
          return 0;
        }
        return newVal;
      });
    }, 1000);
  };

  // Close modal function
  const closeRequestModal = () => {
    if (modalTimerRef.current) {
      clearInterval(modalTimerRef.current);
      modalTimerRef.current = null;
    }

    setShowRequestModal(false);
    setCurrentRequest(null);
    setIsModalOpen(false);
    setModalCountdown(null);

    // Show next request safely
    setTimeout(() => {
      showNextRequest();
    }, 200);
  };

  // Fetch pending requests
  const fetchPendingRequests = async () => {
    // Prevent multiple simultaneous fetches
    if (isFetching) return;

    setIsFetching(true);
    try {
      const token = localStorage.getItem('token');
      const counsellorId = localStorage.getItem("counsellorId");

      if (!token || !counsellorId) {
        console.error("No token or counsellorId found");
        setIsFetching(false);
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/chat/pending-requests`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.requests && response.data.requests.length > 0) {
        setPendingRequests(response.data.requests);

        // Process only new requests
        const newRequests = response.data.requests.filter(
          request => !processedRequestIds.has(request.id)
        );

        newRequests.forEach(request => {
          // Mark as processed immediately to avoid duplicates
          setProcessedRequestIds(prev => new Set(prev).add(request.id));

          const displayName = request.user.anonymous || request.user.name;

          const requestData = {
            id: request.id,
            chatId: request.chatId,
            patientName: displayName,
            originalName: request.user.name,
            isAnonymous: !!request.user.anonymous,
            patientAge: 'N/A',
            patientGender: 'N/A',
            requestType: 'Chat Request',
            message: request.requestMessage,
            requestedAt: request.requestedAt,
            urgency: 'medium',
            user: request.user,
            remainingSeconds: request.remainingSeconds || 10,
            avatar: request.user.avatar,
            expiresAt: request.expiresAt,
            status: request.status
          };

          // Show modal immediately if not already open, otherwise add to queue
          if (!isModalOpenRef.current && !showRequestModal) {
            showRequestModalWithTimer(requestData);
          } else {
            setRequestQueue(prev => [...prev, requestData]);
          }
        });
      } else {
        setPendingRequests([]);
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    } finally {
      setIsFetching(false);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (modalTimerRef.current) {
        clearInterval(modalTimerRef.current);
        modalTimerRef.current = null;
      }
    };
  }, []);

  // Handle accept request
  const handleAcceptRequest = async () => {
    if (!currentRequest) return;

    if (vibrate) vibrate([50, 30, 50]);

    try {
      const token = localStorage.getItem('token');
      const counsellorId = localStorage.getItem("counsellorId");

      // Use the accept API with chatId
      await axios.patch(
        `${API_BASE_URL}/api/chat/accept/${currentRequest.chatId}`,
        { counsellorId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Remove from processed IDs to allow future requests
      setProcessedRequestIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentRequest.id);
        return newSet;
      });

      closeRequestModal();
      
      // Store the accepted request data
      localStorage.setItem('acceptedRequest', JSON.stringify({
        ...currentRequest,
        acceptedAt: new Date().toISOString()
      }));
      
      // Navigate to SMS input page
      navigate("/sms-input");

    } catch (error) {
      console.error('Error accepting request:', error);
      // Show error toast or notification here if needed
      closeRequestModal();
    }
  };

  // Handle reject request
  const handleRejectRequest = async () => {
    if (!currentRequest) return;

    if (vibrate) vibrate([50]);

    try {
      const token = localStorage.getItem('token');
      const counsellorId = localStorage.getItem("counsellorId");

      // Use the reject API with chatId
      await axios.patch(
        `${API_BASE_URL}/api/chat/reject/${currentRequest.chatId}`,
        { counsellorId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Remove from processed IDs to allow future requests
      setProcessedRequestIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentRequest.id);
        return newSet;
      });

      closeRequestModal();
      console.log('Request rejected successfully');
    } catch (error) {
      console.error('Error rejecting request:', error);
      closeRequestModal();
    }
  };

  // Poll for pending requests - set to 5 seconds interval
  useEffect(() => {
    // Initial fetch
    fetchPendingRequests();

    const pollingInterval = setInterval(() => {
      if (!isModalOpenRef.current && !showRequestModal) {
        fetchPendingRequests();
      }
    }, 5000); // 5 seconds

    return () => {
      clearInterval(pollingInterval);
      setProcessedRequestIds(new Set());
      setRequestQueue([]);
      if (modalTimerRef.current) {
        clearInterval(modalTimerRef.current);
      }
    };
  }, []); // Run only once on mount, but use refs for modal state

  const handleLogout = async () => {
    try {
      if (vibrate) vibrate([50, 30, 50]);

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
    { id: 'messages', icon: <FaComments />, label: 'Messages', badge: 0 },
    { id: 'appointments', icon: <FaCalendarAlt />, label: 'Appointments' },
    { id: 'sessions', icon: <FaVideo />, label: 'Sessions', badge: 0 },
    { id: 'patients', icon: <FaUsers />, label: 'Patients', badge: 0 },
    { id: 'earnings', icon: <FaMoneyBillWave />, label: 'Earnings', badge: 0 },
    { id: 'profile', icon: <FaChartPie />, label: 'Profile', badge: 0 },
    { id: 'settings', icon: <FaCog />, label: 'Settings', badge: 0 }
  ];

  const handleTabChange = (tabId) => {
    if (vibrate) vibrate(20);
    setActiveTab(tabId);
    setShowMobileMenu(false);
  };

  return (
    <div className="couns-dashboard">
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
          <div className="couns-mobile-notif">
            <FaBell />
            {pendingRequests.length > 0 && (
              <span className="couns-notif-badge">{pendingRequests.length}</span>
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {isMobile && showMobileMenu && (
        <div className="couns-mobile-menu-overlay" onClick={() => setShowMobileMenu(false)}>
          <div className="couns-mobile-menu" onClick={e => e.stopPropagation()}>
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
            <Dashboard />
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
            <PatientRequests />
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
            <Messagesou />
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

      {/* Request Modal - Right Side with Timer based on remainingSeconds */}
      {showRequestModal && currentRequest && (
        <div className="couns-request-modal-overlay" onClick={closeRequestModal}>
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
                  <h4>
                    {currentRequest.patientName}
                    {currentRequest.isAnonymous && (
                      <span className="couns-anonymous-badge"> (Anonymous)</span>
                    )}
                  </h4>
                </div>
                <div className="couns-request-type">
                  <span className={`couns-request-type-badge ${currentRequest.urgency}`}>
                    {currentRequest.requestType}
                  </span>
                </div>
              </div>

              <div className="couns-request-message">
                <p>{currentRequest.message}</p>
              </div>

              <div className="couns-request-meta">
                <span className="couns-request-time">
                  Requested: {new Date(currentRequest.requestedAt).toLocaleTimeString()}
                </span>
                {currentRequest.remainingSeconds && (
                  <span className="couns-request-expiry">
                    ⏱️ Expires in: {modalCountdown}s
                  </span>
                )}
              </div>
            </div>

            <div className="couns-request-modal-footer">
              <button
                className="couns-request-btn couns-request-reject"
                onClick={handleRejectRequest}
              >
                <FaClose />
                Reject
              </button>
              <button
                className="couns-request-btn couns-request-accept"
                onClick={handleAcceptRequest}
              >
                <FaCheck />
                Accept
              </button>
            </div>

            <div className="couns-request-progress">
              <div
                className="couns-request-progress-bar"
                style={{
                  width: `${((modalCountdown || 0) / (currentRequest.remainingSeconds || 10)) * 100}%`,
                  transition: 'width 1s linear'
                }}
              >
                <span className="couns-progress-text">{modalCountdown}s</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Notes Modal */}
      {showNotesModal && (
        <div className="couns-modal-overlay" onClick={() => setShowNotesModal(false)}>
          <div className="couns-modal-content" onClick={e => e.stopPropagation()}>
            {/* <SessionNotes onClose={() => setShowNotesModal(false)} /> */}
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