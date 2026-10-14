import React, { useState, useEffect } from 'react';
import ProfileAvatar from '../../common/ProfileAvatar.jsx';
import { useOutletContext } from 'react-router-dom';
import './NurseDashboard.css';

const NurseDashboard = () => {
  const { profile } = useOutletContext();
  // Today's date
  const today = new Date();
  const todayDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(today);
  
  // Nurse information with login status
  const nurseInfo = {
    name: profile.fullName || 'Nurse',
    licenseNumber: profile.nursingLicense || 'License not added',
    department: profile.department || 'Department not assigned',
    specialization: profile.qualifications || 'Nurse',
    phone: profile.phoneNumber || '',
    email: profile.email || '',
    loginStatus: 'active', // 'active' or 'offline'
    lastLogin: 'Current session',
    currentLocation: profile.clinic_name || 'Not assigned'
  };

  // All shifts data
  const [shifts, setShifts] = useState([
    {
      id: 1,
      date: '2026-01-16',
      type: 'Day',
      startTime: '07:00 AM',
      endTime: '07:00 PM',
      duration: '12 hours',
      doctor: 'Dr. Michael Chen',
      room: 'ICU-4',
      status: 'current',
      doctorPhone: 'Ext. 4567',
      doctorEmail: 'mchen@hospital.com',
      assignedPatients: 4,
      completedTasks: 8,
      totalTasks: 12
    },
    {
      id: 2,
      date: '2026-01-15',
      type: 'Day',
      startTime: '07:00 AM',
      endTime: '07:00 PM',
      duration: '12 hours',
      doctor: 'Dr. Michael Chen',
      room: 'ICU-3',
      status: 'completed',
      doctorPhone: 'Ext. 4567',
      doctorEmail: 'mchen@hospital.com',
      assignedPatients: 3,
      completedTasks: 10,
      totalTasks: 10
    },
    {
      id: 3,
      date: '2026-01-14',
      type: 'Night',
      startTime: '07:00 PM',
      endTime: '07:00 AM',
      duration: '12 hours',
      doctor: 'Dr. James Wilson',
      room: 'ICU-2',
      status: 'completed',
      doctorPhone: 'Ext. 7890',
      doctorEmail: 'jwilson@hospital.com',
      assignedPatients: 5,
      completedTasks: 15,
      totalTasks: 15
    },
    {
      id: 4,
      date: '2026-01-17',
      type: 'Day',
      startTime: '07:00 AM',
      endTime: '07:00 PM',
      duration: '12 hours',
      doctor: 'Dr. Michael Chen',
      room: 'ICU-4',
      status: 'upcoming',
      doctorPhone: 'Ext. 4567',
      doctorEmail: 'mchen@hospital.com',
      assignedPatients: 0,
      completedTasks: 0,
      totalTasks: 0
    },
    {
      id: 5,
      date: '2026-01-18',
      type: 'Night',
      startTime: '07:00 PM',
      endTime: '07:00 AM',
      duration: '12 hours',
      doctor: 'Dr. Robert Brown',
      room: 'ICU-5',
      status: 'upcoming',
      doctorPhone: 'Ext. 2345',
      doctorEmail: 'rbrown@hospital.com',
      assignedPatients: 0,
      completedTasks: 0,
      totalTasks: 0
    }
  ]);

  // State for selected shift
  const [selectedShift, setSelectedShift] = useState(null);
  const [loginStatus, setLoginStatus] = useState(nurseInfo.loginStatus);

  // Find today's shift
  const todayShift = shifts.find(shift => shift.date === todayDate);

  // Set initial selected shift to today's shift or first shift
  useEffect(() => {
    if (todayShift) {
      setSelectedShift(todayShift);
    } else if (shifts.length > 0) {
      setSelectedShift(shifts[0]);
    }
  }, []);

  // Function to handle shift selection
  const handleShiftSelect = (shift) => {
    setSelectedShift(shift);
  };

  // Function to toggle login status
  const toggleLoginStatus = () => {
    setLoginStatus(prev => prev === 'active' ? 'offline' : 'active');
  };

  // Get shift status badge
  const getStatusBadge = (status) => {
    switch(status) {
      case 'current':
        return <span className="badge current">Current</span>;
      case 'completed':
        return <span className="badge completed">Completed</span>;
      case 'upcoming':
        return <span className="badge upcoming">Upcoming</span>;
      default:
        return <span className="badge">Scheduled</span>;
    }
  };

  // Get login status badge
  const getLoginStatusBadge = () => {
    return (
      <div className={`loginStatus ${loginStatus}`}>
        <span className="statusDot"></span>
        <span className="statusText">
          {loginStatus === 'active' ? 'Active on Duty' : 'Off Duty'}
        </span>
      </div>
    );
  };

  return (
    <div className="nurseDashboard">
      {/* Header with nurse info and login status */}
      <div className="nurse-dashboard-header">
        <div className="nurseInfo">
          <div className="avatar">
            <ProfileAvatar photo={profile.profilePhoto} name={nurseInfo.name} size={80} />
            <div className={`avatarStatus ${loginStatus}`}></div>
          </div>
          <div className="details">
            <div className="nameRow">
              <h1>{nurseInfo.name}</h1>
              {getLoginStatusBadge()}
            </div>
            <div className="credentials">
              <span className="badge license">{nurseInfo.licenseNumber}</span>
              <span className="badge department">{nurseInfo.department}</span>
              <span className="badge specialization">{nurseInfo.specialization}</span>
            </div>
            <div className="contactInfo">
              <span className="contactItem">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                {nurseInfo.phone}
              </span>
              <span className="contactItem">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                {nurseInfo.email}
              </span>
            </div>
          </div>
        </div>
        
        {/* Login Status Control */}
        <div className="loginControl">
          <div className="statusCard">
            <div className="statusHeader">
              <h3>Current Status</h3>
              <button 
                className={`statusToggle ${loginStatus}`}
                onClick={toggleLoginStatus}
              >
                {loginStatus === 'active' ? 'Go Offline' : 'Go Active'}
              </button>
            </div>
            <div className="statusDetails">
              <div className="statusDetail">
                <span className="label">Last Login:</span>
                <span className="value">{nurseInfo.lastLogin}</span>
              </div>
              <div className="statusDetail">
                <span className="label">Location:</span>
                <span className="value location">{nurseInfo.currentLocation}</span>
              </div>
              <div className="statusDetail">
                <span className="label">Shift Today:</span>
                <span className="value">{todayShift ? todayShift.type + ' Shift' : 'No Shift'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Shift Summary */}
      <div className="todayShiftCard mb-4 mt-3">
        <div className="cardHeader">
          <h3>Today's Shift Overview</h3>
          <div className="shiftStats">
            {todayShift && (
              <>
                <div className="stat">
                  <span className="statValue">{todayShift.assignedPatients}</span>
                  <span className="statLabel">Patients</span>
                </div>
                <div className="stat">
                  <span className="statValue">{todayShift.completedTasks}/{todayShift.totalTasks}</span>
                  <span className="statLabel">Tasks</span>
                </div>
                <div className="stat">
                  <span className="statValue">
                    {Math.round((todayShift.completedTasks / todayShift.totalTasks) * 100)}%
                  </span>
                  <span className="statLabel">Complete</span>
                </div>
              </>
            )}
          </div>
        </div>
        {todayShift ? (
          <div className="todayInfo">
            <div className="todayDetail">
              <span className="label">Type:</span>
              <span className="value shiftType">{todayShift.type} Shift</span>
            </div>
            <div className="todayDetail">
              <span className="label">Time:</span>
              <span className="value">{todayShift.startTime} - {todayShift.endTime}</span>
            </div>
            <div className="todayDetail">
              <span className="label">Doctor:</span>
              <span className="value doctor">{todayShift.doctor}</span>
            </div>
            <div className="todayDetail">
              <span className="label">Room:</span>
              <span className="value room">{todayShift.room}</span>
            </div>
          </div>
        ) : (
          <div className="noShift">
            <p>No shift scheduled for today</p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="mainContent">
        {/* Selected Shift Details */}
        <div className="selectedShiftSection">
          <h2>Shift Details</h2>
          {selectedShift && (
            <div className="shiftDetailCard">
              <div className="shiftHeader">
                <h3>{selectedShift.type} Shift Details</h3>
                {getStatusBadge(selectedShift.status)}
              </div>
              
              <div className="detailGrid">
                <div className="detailGroup">
                  <div className="detailItem">
                    <span className="label">Date:</span>
                    <span className="value">{selectedShift.date}</span>
                  </div>
                  <div className="detailItem">
                    <span className="label">Shift Type:</span>
                    <span className="value">{selectedShift.type} Shift</span>
                  </div>
                  <div className="detailItem">
                    <span className="label">Duration:</span>
                    <span className="value">{selectedShift.duration}</span>
                  </div>
                </div>

                <div className="detailGroup">
                  <div className="detailItem">
                    <span className="label">Start Time:</span>
                    <span className="value time">{selectedShift.startTime}</span>
                  </div>
                  <div className="detailItem">
                    <span className="label">End Time:</span>
                    <span className="value time">{selectedShift.endTime}</span>
                  </div>
                  <div className="detailItem">
                    <span className="label">Room Assigned:</span>
                    <span className="value room">{selectedShift.room}</span>
                  </div>
                </div>

                <div className="detailGroup">
                  <div className="detailItem">
                    <span className="label">Assigned By:</span>
                    <span className="value doctor">{selectedShift.doctor}</span>
                  </div>
                  <div className="detailItem">
                    <span className="label">Doctor's Phone:</span>
                    <span className="value">{selectedShift.doctorPhone}</span>
                  </div>
                  <div className="detailItem">
                    <span className="label">Doctor's Email:</span>
                    <span className="value email">{selectedShift.doctorEmail}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar for Current Shift */}
              {selectedShift.status === 'current' && selectedShift.totalTasks > 0 && (
                <div className="progressSection">
                  <div className="progressHeader">
                    <span className="label">Shift Progress</span>
                    <span className="progressValue">
                      {selectedShift.completedTasks}/{selectedShift.totalTasks} tasks completed
                    </span>
                  </div>
                  <div className="progressBar">
                    <div 
                      className="progressFill"
                      style={{
                        width: `${(selectedShift.completedTasks / selectedShift.totalTasks) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="shiftStatus">
                <div className="statusItem">
                  <span className="label">Current Status:</span>
                  <span className={`status ${selectedShift.status}`}>
                    {selectedShift.status.charAt(0).toUpperCase() + selectedShift.status.slice(1)}
                  </span>
                </div>
                {selectedShift.status === 'current' && (
                  <div className="statusItem">
                    <span className="label">Time Remaining:</span>
                    <span className="value">10 hours 15 minutes</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* All Shifts List */}
        <div className="allShiftsSection">
          <div className="sectionHeader">
            <h2>All Shifts</h2>
            <div className="sectionFilter">
              <span className="filterLabel">Filter by:</span>
              <select className="filterSelect">
                <option value="all">All Shifts</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="current">Current</option>
              </select>
            </div>
          </div>
          <div className="shiftsList">
            {shifts.map(shift => (
              <div 
                key={shift.id} 
                className={`shiftCard ${selectedShift?.id === shift.id ? 'selected' : ''}`}
                onClick={() => handleShiftSelect(shift)}
              >
                <div className="shiftCardHeader">
                  <div className="shiftDate">
                    <span className="day">{new Date(shift.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <span className="date">{shift.date}</span>
                  </div>
                  {getStatusBadge(shift.status)}
                </div>
                
                <div className="shiftCardBody">
                  <div className="shiftInfo">
                    <span className="type">{shift.type} Shift</span>
                    <span className="time">{shift.startTime} - {shift.endTime}</span>
                  </div>
                  
                  <div className="shiftDetails">
                    <div className="infoItem">
                      <span className="label">Doctor:</span>
                      <span className="value">{shift.doctor}</span>
                    </div>
                    <div className="infoItem">
                      <span className="label">Room:</span>
                      <span className="value">{shift.room}</span>
                    </div>
                    <div className="infoItem">
                      <span className="label">Patients:</span>
                      <span className="value">{shift.assignedPatients}</span>
                    </div>
                  </div>

                  {shift.status === 'current' && shift.totalTasks > 0 && (
                    <div className="shiftProgress">
                      <div className="progressText">
                        {shift.completedTasks}/{shift.totalTasks} tasks
                      </div>
                      <div className="progressBarMini">
                        <div 
                          className="progressFill"
                          style={{
                            width: `${(shift.completedTasks / shift.totalTasks) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="shiftCardFooter">
                  <span className="clickHint">Click to view details →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Schedule */}
      <div className="upcomingSection">
        <h2>Upcoming Schedule (Next 7 Days)</h2>
        <div className="scheduleTable">
          <div className="tableHeader">
            <div className="col">Date</div>
            <div className="col">Shift Type</div>
            <div className="col">Time</div>
            <div className="col">Doctor</div>
            <div className="col">Room</div>
            <div className="col">Status</div>
          </div>
          
          {shifts.filter(shift => shift.status === 'upcoming' || shift.status === 'current').map(shift => (
            <div 
              key={shift.id} 
              className={`tableRow ${selectedShift?.id === shift.id ? 'active' : ''}`}
              onClick={() => handleShiftSelect(shift)}
            >
              <div className="col" data-label="Date">{shift.date}</div>
              <div className="col" data-label="Shift Type">
                <span className={`typeBadge ${shift.type.toLowerCase()}`}>
                  {shift.type}
                </span>
              </div>
              <div className="col" data-label="Time">{shift.startTime} - {shift.endTime}</div>
              <div className="col doctor" data-label="Doctor">{shift.doctor}</div>
              <div className="col" data-label="Room">{shift.room}</div>
              <div className="col" data-label="Status">
                <span className={`statusBadge ${shift.status}`}>
                  {shift.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NurseDashboard;
