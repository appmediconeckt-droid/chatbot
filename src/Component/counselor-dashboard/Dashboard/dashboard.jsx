// CounselorDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import "./CounselorDashboard.css";
import { useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaVideo,
  FaComments,
  FaUserCircle,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaStar,
  FaBell,
  FaArrowRight,
  FaExclamationTriangle,
  FaSmile,
  FaFrown,
  FaMeh,
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

export default function CounselorDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navigate = useNavigate();
  const vibrate = useVibration();

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
  const [counselorData, setCounselorData] = useState({
    name: "Dr. Priya Sharma",
    specialization: "Clinical Psychologist",
    experience: "8 years",
    patients: 127,
    rating: 4.9,
    email: "priya.sharma@counseling.com",
    phone: "+91 98765 43210",
    license: "PSY-12345",
    education: "Ph.D. in Clinical Psychology",
    university: "University of Delhi",
    hourlyRate: 1500,
    languages: ["Hindi", "English"],
    specializations: ["Anxiety", "Depression", "Trauma", "Couples Therapy"]
  });

  const navItems = [
    { id: 'dashboard', icon: <FaHome />, label: 'Dashboard', badge: 0 },
      { id: 'messages', icon: <FaComments />, label: 'Messages', badge: 5 },
    { id: 'appointments', icon: <FaCalendarAlt />, label: 'Appointments', },
    { id: 'sessions', icon: <FaVideo />, label: 'Sessions', badge: 0 },
    { id: 'patients', icon: <FaUsers />, label: 'Patients', badge: 0 },
  
    { id: 'earnings', icon: <FaMoneyBillWave />, label: 'Earnings', badge: 0 },
    { id: 'analytics', icon: <FaChartPie />, label: 'Analytics', badge: 0 },
    { id: 'settings', icon: <FaCog />, label: 'Settings', badge: 0 }
  ];

  // Handle appointment status change


  // Handle logout
  const handleLogout = () => {
    vibrate([50, 30, 50]);
    setShowLogoutConfirm(false);
    navigate('/role-selector');
  };

  // Handle tab change
  const handleTabChange = (tabId) => {
    vibrate(20);
    setActiveTab(tabId);
    setShowMobileMenu(false);
  };

  // Filter appointments based on status and search


  return (
    <div className="couns-dashboard">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="couns-sidebar">
          <div className="couns-sidebar-header">
            <div className="couns-counselor-profile">
              <FaUserCircle className="couns-profile-avatar" />
              <h3>{counselorData.name}</h3>
              <p>{counselorData.specialization}</p>
              <div className="couns-rating-badge">
                <FaStar className="couns-star" />
                <span>{counselorData.rating}</span>
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
            <div className="couns-mobile-menu-header">
              <FaUserCircle className="couns-mobile-avatar" />
              <h3>{counselorData.name}</h3>
              <p>{counselorData.specialization}</p>
              <div className="couns-mobile-rating">
                <FaStar className="couns-star" />
                <span>{counselorData.rating}</span>
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
      <main className={`couns-main-content ${isMobile ? 'mobile' : ''}`}>
        {/* Welcome Banner */}
        {/* <div className="couns-welcome-banner">
          <div className="couns-welcome-text">
            <h1>Welcome back, Dr. Sharma! 👋</h1>
            <p>You have {todayAppointments.length} sessions scheduled for today</p>
          </div>
          <div className="couns-quick-actions">
            <button 
              className="couns-quick-btn"
              onClick={() => handleTabChange('appointments')}
            >
              <FaCalendarCheck /> View Schedule
            </button>
            <button className="couns-quick-btn primary">
              <FaVideo /> Start Next Session
            </button>
          </div>
        </div> */}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            <div className="couns-tab-content">
              <div className="couns-tab-header">
                <h2>Dashboard</h2>
              </div>
            </div>
          </>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="couns-tab-content">
            <div className="couns-tab-header">
              <h2>My Appointments</h2>
            </div>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="couns-tab-content">
            <div className="couns-tab-header">
              <h2>Today's Sessions</h2>
            </div>
          </div>
        )}

        {/* Patients Tab */}
        {activeTab === 'patients' && (
          <div className="couns-tab-content">
            <div className="couns-tab-header">
              <h2>My Patients</h2>
            </div>
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="couns-tab-content">
            <div className="couns-tab-header">
              <h2>Earnings Overview</h2>
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="couns-tab-content">
            <div className="couns-tab-header">
              <h2>Messages</h2>
            </div>

          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="couns-tab-content">
            <div className="couns-tab-header">
              <h2>Analytics</h2>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="couns-tab-content">
            <div className="couns-tab-header">
              <h2>Settings</h2>
            </div>
          </div>
        )}
      </main>

      {/* Session Notes Modal */}
      {showNotesModal && (
        <div className="couns-modal-overlay" onClick={() => setShowNotesModal(false)}>
          <div className="couns-modal-content" onClick={e => e.stopPropagation()}>
            <SessionNotes onClose={() => setShowNotesModal(false)} />
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
