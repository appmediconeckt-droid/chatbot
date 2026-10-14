import React, { useState, useEffect } from 'react';
import './NurseShiftManagement.css';

const NurseShiftManagement = () => {
  // Initial state for shifts
  const [shifts, setShifts] = useState([
    {
      id: 1,
      name: 'Morning Shift',
      timing: '06:00 - 14:00',
      assignedNurses: 4,
      totalNurses: 6,
      color: '#ff9e80',
      status: 'active'
    },
    {
      id: 2,
      name: 'Evening Shift',
      timing: '14:00 - 22:00',
      assignedNurses: 5,
      totalNurses: 7,
      color: '#80deea',
      status: 'active'
    },
    {
      id: 3,
      name: 'Night Shift',
      timing: '22:00 - 06:00',
      assignedNurses: 3,
      totalNurses: 5,
      color: '#ce93d8',
      status: 'active'
    },
    {
      id: 4,
      name: 'General Ward',
      timing: '08:00 - 16:00',
      assignedNurses: 6,
      totalNurses: 8,
      color: '#a5d6a7',
      status: 'active'
    }
  ]);

  // Initial state for ward assignments
  const [wardAssignments, setWardAssignments] = useState([
    {
      id: 1,
      wardName: 'ICU',
      headNurse: 'Sarah Johnson',
      totalNurses: 8,
      assignedNurses: 6,
      capacity: '12 beds',
      shift: '24/7',
      color: '#ffcdd2'
    },
    {
      id: 2,
      wardName: 'Emergency',
      headNurse: 'Michael Chen',
      totalNurses: 10,
      assignedNurses: 8,
      capacity: '15 beds',
      shift: '24/7',
      color: '#c8e6c9'
    },
    {
      id: 3,
      wardName: 'Pediatrics',
      headNurse: 'Lisa Wong',
      totalNurses: 7,
      assignedNurses: 5,
      capacity: '20 beds',
      shift: 'Day Shift',
      color: '#bbdefb'
    },
    {
      id: 4,
      wardName: 'Maternity',
      headNurse: 'Emma Davis',
      totalNurses: 6,
      assignedNurses: 5,
      capacity: '15 beds',
      shift: '24/7',
      color: '#e1bee7'
    },
    {
      id: 5,
      wardName: 'Surgical',
      headNurse: 'Robert Kim',
      totalNurses: 9,
      assignedNurses: 7,
      capacity: '25 beds',
      shift: 'Morning & Evening',
      color: '#fff9c4'
    },
    {
      id: 6,
      wardName: 'Cardiology',
      headNurse: 'David Miller',
      totalNurses: 5,
      assignedNurses: 4,
      capacity: '10 beds',
      shift: 'Day Shift',
      color: '#d7ccc8'
    }
  ]);

  // Initial state for duty roster
  const [dutyRoster, setDutyRoster] = useState([
    {
      id: 1,
      nurseName: 'Nurse Sarah',
      employeeId: 'NUR001',
      monday: { shift: 'Morning', ward: 'ICU' },
      tuesday: { shift: 'Evening', ward: 'Emergency' },
      wednesday: { shift: 'Night', ward: 'ICU' },
      thursday: { shift: 'Morning', ward: 'Pediatrics' },
      friday: { shift: 'Evening', ward: 'Surgical' },
      saturday: { shift: 'Off', ward: '' },
      sunday: { shift: 'Off', ward: '' }
    },
    {
      id: 2,
      nurseName: 'Nurse Mike',
      employeeId: 'NUR002',
      monday: { shift: 'Evening', ward: 'Emergency' },
      tuesday: { shift: 'Night', ward: 'ICU' },
      wednesday: { shift: 'Morning', ward: 'Maternity' },
      thursday: { shift: 'Evening', ward: 'Surgical' },
      friday: { shift: 'Morning', ward: 'Cardiology' },
      saturday: { shift: 'Evening', ward: 'Emergency' },
      sunday: { shift: 'Off', ward: '' }
    },
    {
      id: 3,
      nurseName: 'Nurse Lisa',
      employeeId: 'NUR003',
      monday: { shift: 'Night', ward: 'ICU' },
      tuesday: { shift: 'Morning', ward: 'Pediatrics' },
      wednesday: { shift: 'Evening', ward: 'Emergency' },
      thursday: { shift: 'Night', ward: 'Maternity' },
      friday: { shift: 'Off', ward: '' },
      saturday: { shift: 'Morning', ward: 'Surgical' },
      sunday: { shift: 'Evening', ward: 'Cardiology' }
    },
    {
      id: 4,
      nurseName: 'Nurse Emma',
      employeeId: 'NUR004',
      monday: { shift: 'Morning', ward: 'Surgical' },
      tuesday: { shift: 'Evening', ward: 'Maternity' },
      wednesday: { shift: 'Morning', ward: 'Cardiology' },
      thursday: { shift: 'Evening', ward: 'ICU' },
      friday: { shift: 'Night', ward: 'Emergency' },
      saturday: { shift: 'Off', ward: '' },
      sunday: { shift: 'Morning', ward: 'Pediatrics' }
    }
  ]);

  // Initial state for attendance
  const [attendance, setAttendance] = useState([
    {
      id: 1,
      nurseName: 'Sarah Johnson',
      date: '2024-01-15',
      checkIn: '07:58',
      checkOut: '15:05',
      shift: 'Morning',
      ward: 'ICU',
      status: 'Present',
      overtime: '0h 5m'
    },
    {
      id: 2,
      nurseName: 'Michael Chen',
      date: '2024-01-15',
      checkIn: '13:55',
      checkOut: '22:10',
      shift: 'Evening',
      ward: 'Emergency',
      status: 'Present',
      overtime: '0h 10m'
    },
    {
      id: 3,
      nurseName: 'Lisa Wong',
      date: '2024-01-15',
      checkIn: '21:45',
      checkOut: '06:15',
      shift: 'Night',
      ward: 'Pediatrics',
      status: 'Present',
      overtime: '0h 15m'
    },
    {
      id: 4,
      nurseName: 'Emma Davis',
      date: '2024-01-15',
      checkIn: null,
      checkOut: null,
      shift: 'Morning',
      ward: 'Maternity',
      status: 'Absent',
      overtime: '0h 0m'
    },
    {
      id: 5,
      nurseName: 'Robert Kim',
      date: '2024-01-15',
      checkIn: '07:30',
      checkOut: null,
      shift: 'Morning',
      ward: 'Surgical',
      status: 'On Duty',
      overtime: '0h 0m'
    }
  ]);

  // Initial state for leave requests
  const [leaveRequests, setLeaveRequests] = useState([
    {
      id: 1,
      nurseName: 'Sarah Johnson',
      employeeId: 'NUR001',
      leaveType: 'Annual Leave',
      startDate: '2024-01-20',
      endDate: '2024-01-25',
      totalDays: 5,
      reason: 'Family vacation',
      status: 'Pending',
      appliedDate: '2024-01-10'
    },
    {
      id: 2,
      nurseName: 'Michael Chen',
      employeeId: 'NUR002',
      leaveType: 'Sick Leave',
      startDate: '2024-01-16',
      endDate: '2024-01-17',
      totalDays: 2,
      reason: 'Flu and fever',
      status: 'Approved',
      appliedDate: '2024-01-15'
    },
    {
      id: 3,
      nurseName: 'Lisa Wong',
      employeeId: 'NUR003',
      leaveType: 'Emergency Leave',
      startDate: '2024-01-18',
      endDate: '2024-01-18',
      totalDays: 1,
      reason: 'Family emergency',
      status: 'Pending',
      appliedDate: '2024-01-17'
    },
    {
      id: 4,
      nurseName: 'Emma Davis',
      employeeId: 'NUR004',
      leaveType: 'Casual Leave',
      startDate: '2024-01-22',
      endDate: '2024-01-22',
      totalDays: 1,
      reason: 'Personal work',
      status: 'Rejected',
      appliedDate: '2024-01-12'
    }
  ]);

  const [activeTab, setActiveTab] = useState('shifts');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showNewShiftForm, setShowNewShiftForm] = useState(false);
  const [showNewLeaveForm, setShowNewLeaveForm] = useState(false);
  const [newShift, setNewShift] = useState({
    name: '',
    startTime: '08:00',
    endTime: '16:00',
    totalNurses: 5
  });
  const [newLeave, setNewLeave] = useState({
    leaveType: 'Annual Leave',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [attendanceFilter, setAttendanceFilter] = useState('all');
  const [leaveFilter, setLeaveFilter] = useState('all');

  // Update current date
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Format date
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate shift timing
  const calculateShiftTiming = (startTime, endTime) => {
    return `${startTime} - ${endTime}`;
  };

  // Handle new shift creation
  const handleAddShift = () => {
    if (!newShift.name || !newShift.startTime || !newShift.endTime) {
      alert('Please fill in all required fields');
      return;
    }

    const newShiftObj = {
      id: shifts.length + 1,
      name: newShift.name,
      timing: calculateShiftTiming(newShift.startTime, newShift.endTime),
      assignedNurses: 0,
      totalNurses: parseInt(newShift.totalNurses),
      color: getRandomColor(),
      status: 'active'
    };

    setShifts([...shifts, newShiftObj]);
    setNewShift({
      name: '',
      startTime: '08:00',
      endTime: '16:00',
      totalNurses: 5
    });
    setShowNewShiftForm(false);
  };

  // Handle new leave request
  const handleAddLeaveRequest = () => {
    if (!newLeave.leaveType || !newLeave.startDate || !newLeave.endDate || !newLeave.reason) {
      alert('Please fill in all required fields');
      return;
    }

    const start = new Date(newLeave.startDate);
    const end = new Date(newLeave.endDate);
    const timeDiff = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    const newLeaveRequest = {
      id: leaveRequests.length + 1,
      nurseName: 'Current Nurse',
      employeeId: 'NUR005',
      leaveType: newLeave.leaveType,
      startDate: newLeave.startDate,
      endDate: newLeave.endDate,
      totalDays: totalDays,
      reason: newLeave.reason,
      status: 'Pending',
      appliedDate: new Date().toISOString().split('T')[0]
    };

    setLeaveRequests([...leaveRequests, newLeaveRequest]);
    setNewLeave({
      leaveType: 'Annual Leave',
      startDate: '',
      endDate: '',
      reason: ''
    });
    setShowNewLeaveForm(false);
  };

  // Handle leave status change
  const handleLeaveStatusChange = (id, status) => {
    const updatedRequests = leaveRequests.map(request => {
      if (request.id === id) {
        return { ...request, status: status };
      }
      return request;
    });
    
    setLeaveRequests(updatedRequests);
  };

  // Handle attendance status change
  const handleAttendanceStatusChange = (id, status) => {
    const updatedAttendance = attendance.map(record => {
      if (record.id === id) {
        if (status === 'Present' && !record.checkIn) {
          return { 
            ...record, 
            status: status,
            checkIn: '08:00',
            checkOut: '16:00'
          };
        } else if (status === 'Absent') {
          return { 
            ...record, 
            status: status,
            checkIn: null,
            checkOut: null
          };
        }
        return { ...record, status: status };
      }
      return record;
    });
    
    setAttendance(updatedAttendance);
  };

  // Get random color for shifts
  const getRandomColor = () => {
    const colors = ['#ff9e80', '#80deea', '#ce93d8', '#a5d6a7', '#fff59d', '#bcaaa4'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Get status class
  const getStatusClass = (status) => {
    switch(status.toLowerCase()) {
      case 'present':
      case 'approved':
        return 'nurse-status-approved';
      case 'pending':
      case 'on duty':
        return 'nurse-status-pending';
      case 'absent':
      case 'rejected':
        return 'nurse-status-rejected';
      default:
        return '';
    }
  };

  // Get shift class
  const getShiftClass = (shift) => {
    switch(shift.toLowerCase()) {
      case 'morning':
        return 'nurse-shift-morning';
      case 'evening':
        return 'nurse-shift-evening';
      case 'night':
        return 'nurse-shift-night';
      case 'off':
        return 'nurse-shift-off';
      default:
        return '';
    }
  };

  // Filter attendance records
  const filteredAttendance = attendance.filter(record => {
    if (attendanceFilter === 'all') return true;
    return record.status.toLowerCase() === attendanceFilter.toLowerCase();
  });

  // Filter leave requests
  const filteredLeaveRequests = leaveRequests.filter(request => {
    if (leaveFilter === 'all') return true;
    return request.status.toLowerCase() === leaveFilter.toLowerCase();
  });

  // Calculate statistics
  const totalNurses = 28;
  const presentToday = attendance.filter(a => a.status === 'Present').length;
  const onLeaveToday = leaveRequests.filter(l => 
    l.status === 'Approved' && 
    currentDate.toISOString().split('T')[0] >= l.startDate && 
    currentDate.toISOString().split('T')[0] <= l.endDate
  ).length;
  const pendingLeaveRequests = leaveRequests.filter(l => l.status === 'Pending').length;

  return (
    <div className="nurse-shift-management-container">
      {/* Header */}
      <div className="nurse-shift-header">
        <div className="nurse-shift-header-content">
          <h1 className="nurse-shift-title">Nurse Shift & Duty Management</h1>
          <div className="nurse-shift-date">
            <i className="fas fa-calendar-alt"></i>
            {formatDate(currentDate)}
          </div>
        </div>
        <div className="nurse-shift-stats">
          <div className="nurse-shift-stat">
            <div className="nurse-shift-stat-icon total">
              <i className="fas fa-user-nurse"></i>
            </div>
            <div className="nurse-shift-stat-info">
              <h3>{totalNurses}</h3>
              <p>Total Nurses</p>
            </div>
          </div>
          <div className="nurse-shift-stat">
            <div className="nurse-shift-stat-icon present">
              <i className="fas fa-user-check"></i>
            </div>
            <div className="nurse-shift-stat-info">
              <h3>{presentToday}</h3>
              <p>Present Today</p>
            </div>
          </div>
          <div className="nurse-shift-stat">
            <div className="nurse-shift-stat-icon leave">
              <i className="fas fa-umbrella-beach"></i>
            </div>
            <div className="nurse-shift-stat-info">
              <h3>{onLeaveToday}</h3>
              <p>On Leave Today</p>
            </div>
          </div>
          <div className="nurse-shift-stat">
            <div className="nurse-shift-stat-icon pending">
              <i className="fas fa-clock"></i>
            </div>
            <div className="nurse-shift-stat-info">
              <h3>{pendingLeaveRequests}</h3>
              <p>Pending Requests</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="nurse-shift-tabs">
        <button 
          className={`nurse-shift-tab ${activeTab === 'shifts' ? 'active' : ''}`}
          onClick={() => setActiveTab('shifts')}
        >
          <i className="fas fa-clock"></i> Shift Timing
        </button>
        <button 
          className={`nurse-shift-tab ${activeTab === 'wards' ? 'active' : ''}`}
          onClick={() => setActiveTab('wards')}
        >
          <i className="fas fa-bed"></i> Ward Assignment
        </button>
        <button 
          className={`nurse-shift-tab ${activeTab === 'roster' ? 'active' : ''}`}
          onClick={() => setActiveTab('roster')}
        >
          <i className="fas fa-calendar-week"></i> Duty Roster
        </button>
        <button 
          className={`nurse-shift-tab ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <i className="fas fa-clipboard-check"></i> Attendance
        </button>
        <button 
          className={`nurse-shift-tab ${activeTab === 'leave' ? 'active' : ''}`}
          onClick={() => setActiveTab('leave')}
        >
          <i className="fas fa-file-medical-alt"></i> Leave Request
        </button>
      </div>

      {/* Content Area */}
      <div className="nurse-shift-content">
        
        {/* Shift Timing Tab */}
        {activeTab === 'shifts' && (
          <div className="nurse-shift-tab-content">
            <div className="nurse-shift-tab-header">
              <h2 className="nurse-shift-tab-title">
                <i className="fas fa-clock"></i> Shift Timing Management
              </h2>
              <button 
                className="nurse-shift-add-btn"
                onClick={() => setShowNewShiftForm(!showNewShiftForm)}
              >
                <i className="fas fa-plus"></i> Add New Shift
              </button>
            </div>

            {showNewShiftForm && (
              <div className="nurse-shift-form">
                <h3 className="nurse-form-title">Create New Shift</h3>
                <div className="nurse-shift-form-grid">
                  <div className="nurse-form-group">
                    <label>Shift Name *</label>
                    <input
                      type="text"
                      value={newShift.name}
                      onChange={(e) => setNewShift({...newShift, name: e.target.value})}
                      placeholder="e.g., Day Shift, Special Duty"
                    />
                  </div>
                  <div className="nurse-form-group">
                    <label>Start Time *</label>
                    <input
                      type="time"
                      value={newShift.startTime}
                      onChange={(e) => setNewShift({...newShift, startTime: e.target.value})}
                    />
                  </div>
                  <div className="nurse-form-group">
                    <label>End Time *</label>
                    <input
                      type="time"
                      value={newShift.endTime}
                      onChange={(e) => setNewShift({...newShift, endTime: e.target.value})}
                    />
                  </div>
                  <div className="nurse-form-group">
                    <label>Required Nurses *</label>
                    <input
                      type="number"
                      value={newShift.totalNurses}
                      onChange={(e) => setNewShift({...newShift, totalNurses: e.target.value})}
                      min="1"
                      max="20"
                    />
                  </div>
                </div>
                <div className="nurse-shift-form-actions">
                  <button 
                    className="nurse-form-cancel-btn"
                    onClick={() => setShowNewShiftForm(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="nurse-form-submit-btn"
                    onClick={handleAddShift}
                  >
                    Create Shift
                  </button>
                </div>
              </div>
            )}

            <div className="nurse-shifts-grid">
              {shifts.map(shift => (
                <div key={shift.id} className="nurse-shift-card">
                  <div 
                    className="nurse-shift-color-bar"
                    style={{ backgroundColor: shift.color }}
                  ></div>
                  <div className="nurse-shift-content">
                    <div className="nurse-shift-header-info">
                      <h3 className="nurse-shift-name">{shift.name}</h3>
                      <span className={`nurse-shift-status ${shift.status}`}>
                        {shift.status}
                      </span>
                    </div>
                    <div className="nurse-shift-timing">
                      <i className="fas fa-clock"></i>
                      {shift.timing}
                    </div>
                    <div className="nurse-shift-staffing">
                      <div className="nurse-shift-staffing-info">
                        <div className="nurse-shift-staffing-label">Staffing</div>
                        <div className="nurse-shift-staffing-count">
                          {shift.assignedNurses} / {shift.totalNurses}
                        </div>
                      </div>
                      <div className="nurse-shift-progress">
                        <div 
                          className="nurse-shift-progress-bar"
                          style={{ 
                            width: `${(shift.assignedNurses / shift.totalNurses) * 100}%`,
                            backgroundColor: shift.color
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="nurse-shift-actions">
                      <button className="nurse-shift-action-btn edit">
                        <i className="fas fa-edit"></i> Edit
                      </button>
                      <button className="nurse-shift-action-btn assign">
                        <i className="fas fa-user-plus"></i> Assign
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ward Assignment Tab */}
        {activeTab === 'wards' && (
          <div className="nurse-shift-tab-content">
            <div className="nurse-shift-tab-header">
              <h2 className="nurse-shift-tab-title">
                <i className="fas fa-bed"></i> Ward Assignments
              </h2>
              <div className="nurse-ward-search">
                <input 
                  type="text" 
                  placeholder="Search wards..." 
                  className="nurse-ward-search-input"
                />
                <i className="fas fa-search"></i>
              </div>
            </div>

            <div className="nurse-wards-grid">
              {wardAssignments.map(ward => (
                <div key={ward.id} className="nurse-ward-card">
                  <div 
                    className="nurse-ward-header"
                    style={{ backgroundColor: ward.color }}
                  >
                    <h3 className="nurse-ward-name">{ward.wardName}</h3>
                    <div className="nurse-ward-capacity">{ward.capacity}</div>
                  </div>
                  <div className="nurse-ward-content">
                    <div className="nurse-ward-info">
                      <div className="nurse-ward-info-item">
                        <i className="fas fa-user-md"></i>
                        <span>Head Nurse:</span>
                        <strong>{ward.headNurse}</strong>
                      </div>
                      <div className="nurse-ward-info-item">
                        <i className="fas fa-user-nurse"></i>
                        <span>Staff:</span>
                        <strong>{ward.assignedNurses} / {ward.totalNurses}</strong>
                      </div>
                      <div className="nurse-ward-info-item">
                        <i className="fas fa-clock"></i>
                        <span>Shift:</span>
                        <strong>{ward.shift}</strong>
                      </div>
                    </div>
                    <div className="nurse-ward-staffing">
                      <div className="nurse-ward-staffing-label">Staffing Level</div>
                      <div className="nurse-ward-progress">
                        <div 
                          className="nurse-ward-progress-bar"
                          style={{ 
                            width: `${(ward.assignedNurses / ward.totalNurses) * 100}%`,
                            backgroundColor: ward.color
                          }}
                        ></div>
                      </div>
                      <div className="nurse-ward-staffing-percent">
                        {Math.round((ward.assignedNurses / ward.totalNurses) * 100)}%
                      </div>
                    </div>
                    <div className="nurse-ward-actions">
                      <button className="nurse-ward-action-btn view">
                        <i className="fas fa-eye"></i> View Staff
                      </button>
                      <button className="nurse-ward-action-btn assign">
                        <i className="fas fa-exchange-alt"></i> Reassign
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Duty Roster Tab */}
        {activeTab === 'roster' && (
          <div className="nurse-shift-tab-content">
            <div className="nurse-shift-tab-header">
              <h2 className="nurse-shift-tab-title">
                <i className="fas fa-calendar-week"></i> Weekly Duty Roster
              </h2>
              <div className="nurse-roster-controls">
                <button className="nurse-roster-btn prev">
                  <i className="fas fa-chevron-left"></i> Previous Week
                </button>
                <div className="nurse-roster-week">
                  Week 3, January 2024
                </div>
                <button className="nurse-roster-btn next">
                  Next Week <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>

            <div className="nurse-roster-table-container">
              <table className="nurse-roster-table">
                <thead>
                  <tr>
                    <th>Nurse</th>
                    <th>ID</th>
                    <th>Monday</th>
                    <th>Tuesday</th>
                    <th>Wednesday</th>
                    <th>Thursday</th>
                    <th>Friday</th>
                    <th>Saturday</th>
                    <th>Sunday</th>
                  </tr>
                </thead>
                <tbody>
                  {dutyRoster.map(nurse => (
                    <tr key={nurse.id} className="nurse-roster-row">
                      <td>
                        <div className="nurse-roster-name">
                          <i className="fas fa-user-nurse"></i>
                          {nurse.nurseName}
                        </div>
                      </td>
                      <td>
                        <span className="nurse-roster-id">{nurse.employeeId}</span>
                      </td>
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                        <td key={day}>
                          <div className={`nurse-roster-cell ${getShiftClass(nurse[day].shift)}`}>
                            <div className="nurse-roster-shift">{nurse[day].shift}</div>
                            {nurse[day].ward && (
                              <div className="nurse-roster-ward">{nurse[day].ward}</div>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="nurse-roster-legend">
              <div className="nurse-roster-legend-title">Shift Legend:</div>
              <div className="nurse-roster-legend-items">
                <div className="nurse-roster-legend-item">
                  <div className="nurse-roster-legend-color morning"></div>
                  <span>Morning Shift</span>
                </div>
                <div className="nurse-roster-legend-item">
                  <div className="nurse-roster-legend-color evening"></div>
                  <span>Evening Shift</span>
                </div>
                <div className="nurse-roster-legend-item">
                  <div className="nurse-roster-legend-color night"></div>
                  <span>Night Shift</span>
                </div>
                <div className="nurse-roster-legend-item">
                  <div className="nurse-roster-legend-color off"></div>
                  <span>Day Off</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="nurse-shift-tab-content">
            <div className="nurse-shift-tab-header">
              <h2 className="nurse-shift-tab-title">
                <i className="fas fa-clipboard-check"></i> Today's Attendance
              </h2>
              <div className="nurse-attendance-filters">
                <button 
                  className={`nurse-attendance-filter-btn ${attendanceFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setAttendanceFilter('all')}
                >
                  All
                </button>
                <button 
                  className={`nurse-attendance-filter-btn ${attendanceFilter === 'present' ? 'active' : ''}`}
                  onClick={() => setAttendanceFilter('present')}
                >
                  Present
                </button>
                <button 
                  className={`nurse-attendance-filter-btn ${attendanceFilter === 'absent' ? 'active' : ''}`}
                  onClick={() => setAttendanceFilter('absent')}
                >
                  Absent
                </button>
                <button 
                  className={`nurse-attendance-filter-btn ${attendanceFilter === 'on duty' ? 'active' : ''}`}
                  onClick={() => setAttendanceFilter('on duty')}
                >
                  On Duty
                </button>
              </div>
            </div>

            <div className="nurse-attendance-table-container">
              <table className="nurse-attendance-table">
                <thead>
                  <tr>
                    <th>Nurse Name</th>
                    <th>Date</th>
                    <th>Shift</th>
                    <th>Ward</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Overtime</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.map(record => (
                    <tr key={record.id} className="nurse-attendance-row">
                      <td>
                        <div className="nurse-attendance-name">
                          <i className="fas fa-user-nurse"></i>
                          {record.nurseName}
                        </div>
                      </td>
                      <td>{record.date}</td>
                      <td>
                        <span className={`nurse-attendance-shift ${getShiftClass(record.shift)}`}>
                          {record.shift}
                        </span>
                      </td>
                      <td>{record.ward}</td>
                      <td>
                        <span className={`nurse-attendance-time ${record.checkIn ? 'present' : 'absent'}`}>
                          {record.checkIn || '--:--'}
                        </span>
                      </td>
                      <td>
                        <span className={`nurse-attendance-time ${record.checkOut ? 'present' : 'absent'}`}>
                          {record.checkOut || '--:--'}
                        </span>
                      </td>
                      <td>
                        <span className="nurse-attendance-overtime">
                          {record.overtime}
                        </span>
                      </td>
                      <td>
                        <span className={`nurse-attendance-status ${getStatusClass(record.status)}`}>
                          {record.status === 'On Duty' ? (
                            <i className="fas fa-running"></i>
                          ) : record.status === 'Present' ? (
                            <i className="fas fa-check-circle"></i>
                          ) : (
                            <i className="fas fa-times-circle"></i>
                          )}
                          {record.status}
                        </span>
                      </td>
                      <td>
                        <div className="nurse-attendance-actions">
                          {record.status !== 'Present' && (
                            <button 
                              className="nurse-attendance-action-btn mark-present"
                              onClick={() => handleAttendanceStatusChange(record.id, 'Present')}
                            >
                              <i className="fas fa-check"></i>
                            </button>
                          )}
                          {record.status !== 'Absent' && (
                            <button 
                              className="nurse-attendance-action-btn mark-absent"
                              onClick={() => handleAttendanceStatusChange(record.id, 'Absent')}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          )}
                          <button className="nurse-attendance-action-btn edit">
                            <i className="fas fa-edit"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="nurse-attendance-summary">
              <div className="nurse-attendance-summary-card">
                <h4>Attendance Summary</h4>
                <div className="nurse-attendance-summary-stats">
                  <div className="nurse-attendance-summary-stat">
                    <div className="nurse-attendance-summary-value present">
                      {attendance.filter(a => a.status === 'Present').length}
                    </div>
                    <div className="nurse-attendance-summary-label">Present</div>
                  </div>
                  <div className="nurse-attendance-summary-stat">
                    <div className="nurse-attendance-summary-value absent">
                      {attendance.filter(a => a.status === 'Absent').length}
                    </div>
                    <div className="nurse-attendance-summary-label">Absent</div>
                  </div>
                  <div className="nurse-attendance-summary-stat">
                    <div className="nurse-attendance-summary-value on-duty">
                      {attendance.filter(a => a.status === 'On Duty').length}
                    </div>
                    <div className="nurse-attendance-summary-label">On Duty</div>
                  </div>
                  <div className="nurse-attendance-summary-stat">
                    <div className="nurse-attendance-summary-value total">
                      {attendance.length}
                    </div>
                    <div className="nurse-attendance-summary-label">Total</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leave Request Tab */}
        {activeTab === 'leave' && (
          <div className="nurse-shift-tab-content">
            <div className="nurse-shift-tab-header">
              <h2 className="nurse-shift-tab-title">
                <i className="fas fa-file-medical-alt"></i> Leave Requests
              </h2>
              <div className="nurse-leave-header-actions">
                <div className="nurse-leave-filters">
                  <button 
                    className={`nurse-leave-filter-btn ${leaveFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setLeaveFilter('all')}
                  >
                    All
                  </button>
                  <button 
                    className={`nurse-leave-filter-btn ${leaveFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => setLeaveFilter('pending')}
                  >
                    Pending
                  </button>
                  <button 
                    className={`nurse-leave-filter-btn ${leaveFilter === 'approved' ? 'active' : ''}`}
                    onClick={() => setLeaveFilter('approved')}
                  >
                    Approved
                  </button>
                  <button 
                    className={`nurse-leave-filter-btn ${leaveFilter === 'rejected' ? 'active' : ''}`}
                    onClick={() => setLeaveFilter('rejected')}
                  >
                    Rejected
                  </button>
                </div>
                <button 
                  className="nurse-leave-add-btn"
                  onClick={() => setShowNewLeaveForm(!showNewLeaveForm)}
                >
                  <i className="fas fa-plus"></i> New Leave Request
                </button>
              </div>
            </div>

            {showNewLeaveForm && (
              <div className="nurse-leave-form">
                <h3 className="nurse-form-title">Apply for Leave</h3>
                <div className="nurse-leave-form-grid">
                  <div className="nurse-form-group">
                    <label>Leave Type *</label>
                    <select
                      value={newLeave.leaveType}
                      onChange={(e) => setNewLeave({...newLeave, leaveType: e.target.value})}
                    >
                      <option value="Annual Leave">Annual Leave</option>
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Casual Leave">Casual Leave</option>
                      <option value="Emergency Leave">Emergency Leave</option>
                      <option value="Maternity Leave">Maternity Leave</option>
                      <option value="Paternity Leave">Paternity Leave</option>
                    </select>
                  </div>
                  <div className="nurse-form-group">
                    <label>Start Date *</label>
                    <input
                      type="date"
                      value={newLeave.startDate}
                      onChange={(e) => setNewLeave({...newLeave, startDate: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="nurse-form-group">
                    <label>End Date *</label>
                    <input
                      type="date"
                      value={newLeave.endDate}
                      onChange={(e) => setNewLeave({...newLeave, endDate: e.target.value})}
                      min={newLeave.startDate || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="nurse-form-group">
                    <label>Reason *</label>
                    <textarea
                      value={newLeave.reason}
                      onChange={(e) => setNewLeave({...newLeave, reason: e.target.value})}
                      placeholder="Please provide a reason for your leave..."
                      rows="3"
                    ></textarea>
                  </div>
                </div>
                <div className="nurse-leave-form-actions">
                  <button 
                    className="nurse-form-cancel-btn"
                    onClick={() => setShowNewLeaveForm(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="nurse-form-submit-btn"
                    onClick={handleAddLeaveRequest}
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            )}

            <div className="nurse-leave-requests-container">
              <table className="nurse-leave-table">
                <thead>
                  <tr>
                    <th>Nurse</th>
                    <th>Leave Type</th>
                    <th>Period</th>
                    <th>Total Days</th>
                    <th>Reason</th>
                    <th>Applied On</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaveRequests.map(request => (
                    <tr key={request.id} className="nurse-leave-row">
                      <td>
                        <div className="nurse-leave-name">
                          <i className="fas fa-user-nurse"></i>
                          <div>
                            <div className="nurse-leave-nurse-name">{request.nurseName}</div>
                            <div className="nurse-leave-id">{request.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="nurse-leave-type">{request.leaveType}</span>
                      </td>
                      <td>
                        <div className="nurse-leave-period">
                          {request.startDate} to {request.endDate}
                        </div>
                      </td>
                      <td>
                        <span className="nurse-leave-days">{request.totalDays} days</span>
                      </td>
                      <td>
                        <div className="nurse-leave-reason">{request.reason}</div>
                      </td>
                      <td>{request.appliedDate}</td>
                      <td>
                        <span className={`nurse-leave-status ${getStatusClass(request.status)}`}>
                          {request.status === 'Pending' && <i className="fas fa-clock"></i>}
                          {request.status === 'Approved' && <i className="fas fa-check-circle"></i>}
                          {request.status === 'Rejected' && <i className="fas fa-times-circle"></i>}
                          {request.status}
                        </span>
                      </td>
                      <td>
                        <div className="nurse-leave-actions">
                          {request.status === 'Pending' && (
                            <>
                              <button 
                                className="nurse-leave-action-btn approve"
                                onClick={() => handleLeaveStatusChange(request.id, 'Approved')}
                                title="Approve"
                              >
                                <i className="fas fa-check"></i>
                              </button>
                              <button 
                                className="nurse-leave-action-btn reject"
                                onClick={() => handleLeaveStatusChange(request.id, 'Rejected')}
                                title="Reject"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </>
                          )}
                          <button 
                            className="nurse-leave-action-btn view"
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="nurse-leave-stats">
              <div className="nurse-leave-stat-card">
                <h4>Leave Balance</h4>
                <div className="nurse-leave-balance">
                  <div className="nurse-leave-balance-item">
                    <div className="nurse-leave-balance-label">Annual Leave</div>
                    <div className="nurse-leave-balance-value">12 days</div>
                  </div>
                  <div className="nurse-leave-balance-item">
                    <div className="nurse-leave-balance-label">Sick Leave</div>
                    <div className="nurse-leave-balance-value">10 days</div>
                  </div>
                  <div className="nurse-leave-balance-item">
                    <div className="nurse-leave-balance-label">Casual Leave</div>
                    <div className="nurse-leave-balance-value">7 days</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NurseShiftManagement;