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
} from "react-icons/fa";
// Custom Hooks
import useVibration from '../../../hooks/useVibration';
import Dashboard from '../Tab/CounselorDashboard/Dashboardcou';
import Messagesou from '../Tab/Messages/Messagesou';
import PatientRequests from '../Tab/PatientRequests/PatientRequests';
import axios from 'axios';
import { API_BASE_URL } from '../../../axiosConfig';

export default function CounselorDashboard() {
  const [activeTab, setActiveTab] = useState('messages');
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const vibrate = useVibration();

  const handleLogout = async () => {
    try {
      vibrate([50, 30, 50]);

      // Get tokens from localStorage - using correct keys
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      // If no tokens found, just clear storage and redirect
      if (!accessToken && !refreshToken) {
        console.warn("No tokens found, clearing storage and redirecting");
        localStorage.clear();
        navigate("/role-selector");
        return;
      }

      // Only attempt API logout if we have tokens
      if (accessToken) {
        await axios.post(
          `${API_BASE_URL}/logout`,
          { refreshToken: refreshToken },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      // Clear all localStorage items
      localStorage.clear();

      // Close modal
      setShowLogoutConfirm(false);

      // Redirect to role selector
      navigate("/role-selector");

    } catch (error) {
      console.error("Logout Error:", error);

      // Even if API fails, force logout on client side
      localStorage.clear();
      setShowLogoutConfirm(false);
      navigate("/role-selector");
    }
  };

  // Check screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Counselor Data - All Indian names
  const [counselorData, setCounselorData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounsellor = async () => {
      try {
        const counsellorId = localStorage.getItem("counsellorId"); // dynamic kar sakte ho

        const res = await axios.get(
          `${API_BASE_URL}/counsellors/${counsellorId}`
        );

        const data = res.data.counsellor;

        // ✅ API → UI mapping
        setCounselorData({
          name: data.fullName,
          specialization: data.specialization?.join(", "),
          experience: `${data.experience} years`,
          patients: 0,
          rating: 4.5, // dummy (API me nahi hai)
          email: data.email,
          phoneNumber: data.phoneNumber,
          license: "N/A",
          education: data.qualification,
          university: "N/A",
          hourlyRate: 0,
          languages: data.languages || [],
          specializations: data.specialization || [],
          aboutMe: data.aboutMe,
          location: data.location,
          consultationMode: data.consultationMode,
          profilePhoto: data.profilePhoto
        });

      } catch (error) {
        console.error("Error fetching counsellor:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounsellor();
  }, []);

  // ✅ Loading state
  if (loading) {
    return <div className="couns-loading">
      <div className="couns-loading-spinner"></div>
    </div>;
  }

  const navItems = [
    { id: 'messages', icon: <FaComments />, label: 'Messages', badge: 1 },
    { id: 'appointments', icon: <FaCalendarAlt />, label: 'Appointments', },
    { id: 'sessions', icon: <FaVideo />, label: 'Sessions', badge: 0 },
    { id: 'patients', icon: <FaUsers />, label: 'Patients', badge: 0 },
    { id: 'earnings', icon: <FaMoneyBillWave />, label: 'Earnings', badge: 0 },
    { id: 'analytics', icon: <FaChartPie />, label: 'Analytics', badge: 0 },
    { id: 'settings', icon: <FaCog />, label: 'Settings', badge: 0 }
  ];

  // Handle tab change
  const handleTabChange = (tabId) => {
    vibrate(20);
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

              {/* ✅ Profile Image */}
             
                <img
                  src={counselorData.profilePhoto}
                  alt="profile"
                  className="couns-profile-avatar-img"
                />
              

              {/* ✅ Name */}
              <h3>{counselorData?.name}</h3>

              {/* ✅ Specialization */}
              <p><strong>Specialization:</strong> {counselorData?.specialization}</p>

              {/* ✅ Rating */}


              {/* ✅ Extra Details */}
              <div className="couns-extra-info">
                <p><strong>Email:</strong> {counselorData?.email}</p>
                <p><strong>Phone:</strong> {counselorData?.phoneNumber}</p>

                <p><strong>Experience:</strong> {counselorData?.experience}</p>
                <div className="couns-rating-badge">
                  <FaStar className="couns-star" />
                  <span>{counselorData?.rating}</span>
                </div>
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
            <span className="couns-notif-badge">3</span>
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {isMobile && showMobileMenu && (
        <div className="couns-mobile-menu-overlay">
          <div className="couns-mobile-menu">
           <div className="couns-sidebar-header">
            <div className="couns-counselor-profile">

              {/* ✅ Profile Image */}
              {counselorData?.profilePhoto ? (
                <img
                  src={counselorData.profilePhoto}
                  alt="profile"
                  className="couns-profile-avatar-img"
                />
              ) : (
                <FaUserCircle className="couns-profile-avatar" />
              )}

              {/* ✅ Name */}
              <h3>{counselorData?.name}</h3>

              {/* ✅ Specialization */}
              <p><strong>Specialization:</strong> {counselorData?.specialization}</p>

              {/* ✅ Rating */}


              {/* ✅ Extra Details */}
              <div className="couns-extra-info">
                <p><strong>Email:</strong> {counselorData?.email}</p>
                <p><strong>Phone:</strong> {counselorData?.phoneNumber}</p>

                <p><strong>Experience:</strong> {counselorData?.experience}</p>
                <div className="couns-rating-badge">
                  <FaStar className="couns-star" />
                  <span>{counselorData?.rating}</span>
                </div>
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
          <>
            <div className="couns-tab-content">
              <div className="couns-tab-header">
                <Dashboard />
              </div>
            </div>
          </>
        )}

        {/* Appointments Tab */}
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
              {/* Appointment cards will go here */}
              <div className="couns-coming-soon">
                <FaCalendarAlt className="couns-coming-icon" />
                <h3>Coming Soon</h3>
                <p>Your appointments will appear here</p>
              </div>
            </div>
          </div>
        )}

        {/* Sessions Tab */}
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

        {/* Patients Tab */}
        {activeTab === 'patients' && (
          <div className="couns-tab-content">
            <div className="couns-tab-header">
              <PatientRequests />
            </div>
          </div>
        )}

        {/* Earnings Tab */}
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

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="couns-tab-content">
            <div className="couns-tab-header">
              <Messagesou />
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="couns-tab-content">
            <div className="couns-tab-header">
              <h2>Analytics</h2>
            </div>
            <div className="couns-analytics-grid">
              <div className="couns-analytics-card couns-purple">
                <div className="couns-analytics-icon">
                  <FaUsers />
                </div>
                <div className="couns-analytics-info">
                  <h4>Total Patients</h4>
                  <div className="couns-analytics-value">0</div>
                  <div className="couns-analytics-change">+0 this month</div>
                </div>
              </div>
              <div className="couns-analytics-card couns-blue">
                <div className="couns-analytics-icon">
                  <FaCalendarAlt />
                </div>
                <div className="couns-analytics-info">
                  <h4>Sessions Completed</h4>
                  <div className="couns-analytics-value">0</div>
                  <div className="couns-analytics-change">This month</div>
                </div>
              </div>
              <div className="couns-analytics-card couns-green">
                <div className="couns-analytics-icon">
                  <FaStar />
                </div>
                <div className="couns-analytics-info">
                  <h4>Average Rating</h4>
                  <div className="couns-analytics-value">{counselorData?.rating || 0}</div>
                  <div className="couns-analytics-change">⭐ from 0 reviews</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
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