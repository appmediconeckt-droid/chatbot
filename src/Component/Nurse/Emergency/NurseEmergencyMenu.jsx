import React, { useState, useEffect, useRef } from 'react';
import './NurseEmergencyMenu.css';

const NurseEmergencyDashboard = () => {
  // State for emergency alerts
  const [emergencies, setEmergencies] = useState([
    {
      id: 1,
      type: 'critical',
      title: 'Cardiac Arrest',
      patientName: 'John Smith',
      room: 'ICU-101',
      vitalSigns: 'BP: 70/40, HR: 180, SpO2: 82%',
      time: '14:25',
      status: 'active',
      assignedTo: 'Dr. Williams',
      priority: 'CRITICAL',
      responseTime: '2 min',
      codeBlue: true
    },
    {
      id: 2,
      type: 'high',
      title: 'Respiratory Distress',
      patientName: 'Maria Garcia',
      room: 'ER-205',
      vitalSigns: 'RR: 32, SpO2: 88%, HR: 120',
      time: '14:18',
      status: 'active',
      assignedTo: 'Nurse Sarah',
      priority: 'HIGH',
      responseTime: '5 min',
      codeBlue: false
    },
    {
      id: 3,
      type: 'medium',
      title: 'Severe Bleeding',
      patientName: 'Robert Chen',
      room: 'WARD-304',
      vitalSigns: 'BP: 90/60, HR: 110',
      time: '13:45',
      status: 'active',
      assignedTo: 'Dr. Patel',
      priority: 'MEDIUM',
      responseTime: '8 min',
      codeBlue: false
    },
    {
      id: 4,
      type: 'low',
      title: 'Allergic Reaction',
      patientName: 'Emma Wilson',
      room: 'WARD-208',
      vitalSigns: 'BP: 110/70, HR: 95',
      time: '13:20',
      status: 'resolved',
      assignedTo: 'Nurse Mike',
      priority: 'LOW',
      responseTime: '15 min',
      codeBlue: false
    },
    {
      id: 5,
      type: 'critical',
      title: 'Seizure Activity',
      patientName: 'David Miller',
      room: 'NEURO-102',
      vitalSigns: 'BP: 140/90, HR: 130',
      time: '12:55',
      status: 'active',
      assignedTo: 'Dr. Johnson',
      priority: 'CRITICAL',
      responseTime: '3 min',
      codeBlue: true
    }
  ]);

  // State for emergency types
  const [emergencyTypes] = useState([
    {
      type: 'critical',
      name: 'Code Blue',
      description: 'Cardiac/Respiratory Arrest',
      icon: 'fa-heart-pulse',
      color: '#ff4444',
      count: 2
    },
    {
      type: 'high',
      name: 'Rapid Response',
      description: 'Acute Clinical Deterioration',
      icon: 'fa-person-running',
      color: '#ff9900',
      count: 3
    },
    {
      type: 'medium',
      name: 'Emergency Call',
      description: 'Urgent Medical Attention',
      icon: 'fa-phone-emergency',
      color: '#ffcc00',
      count: 5
    },
    {
      type: 'low',
      name: 'Urgent Request',
      description: 'Immediate Nursing Care',
      icon: 'fa-bell',
      color: '#33cc33',
      count: 7
    }
  ]);

  // State for active emergencies summary
  const [activeSummary] = useState({
    totalActive: 8,
    critical: 2,
    high: 3,
    medium: 2,
    low: 1,
    avgResponseTime: '6 min'
  });

  // State for new emergency
  const [newEmergency, setNewEmergency] = useState({
    type: 'medium',
    title: '',
    patientName: '',
    room: '',
    vitalSigns: '',
    assignedTo: '',
    codeBlue: false
  });

  // State for filters
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // State for audio alerts
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [alertSound] = useState(new Audio('/emergency-alert.mp3')); // Replace with actual sound file

  // State for simulated real-time emergencies
  const [simulatedEmergencies, setSimulatedEmergencies] = useState([]);
  const emergencyCounter = useRef(6);

  // Filter emergencies
  const filteredEmergencies = emergencies.filter(emergency => {
    const matchesStatus = filter === 'all' || emergency.status === filter;
    const matchesSearch = emergency.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emergency.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emergency.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Handle new emergency submission
  const handleAddEmergency = () => {
    if (!newEmergency.title || !newEmergency.patientName || !newEmergency.room) {
      alert('Please fill in all required fields');
      return;
    }

    const newEmergencyObj = {
      id: emergencyCounter.current++,
      type: newEmergency.type,
      title: newEmergency.title,
      patientName: newEmergency.patientName,
      room: newEmergency.room,
      vitalSigns: newEmergency.vitalSigns || 'BP: --, HR: --, SpO2: --',
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      status: 'active',
      assignedTo: newEmergency.assignedTo || 'Unassigned',
      priority: newEmergency.type === 'critical' ? 'CRITICAL' : 
               newEmergency.type === 'high' ? 'HIGH' : 
               newEmergency.type === 'medium' ? 'MEDIUM' : 'LOW',
      responseTime: '0 min',
      codeBlue: newEmergency.codeBlue
    };

    setEmergencies([newEmergencyObj, ...emergencies]);
    
    // Play alert sound if enabled
    if (audioEnabled) {
      playAlertSound();
    }

    // Reset form
    setNewEmergency({
      type: 'medium',
      title: '',
      patientName: '',
      room: '',
      vitalSigns: '',
      assignedTo: '',
      codeBlue: false
    });
  };

  // Handle emergency status change
  const handleStatusChange = (id, newStatus) => {
    const updatedEmergencies = emergencies.map(emergency => {
      if (emergency.id === id) {
        return { ...emergency, status: newStatus };
      }
      return emergency;
    });
    
    setEmergencies(updatedEmergencies);
  };

  // Handle assign to me
  const handleAssignToMe = (id) => {
    const updatedEmergencies = emergencies.map(emergency => {
      if (emergency.id === id) {
        return { ...emergency, assignedTo: 'You (Current Nurse)' };
      }
      return emergency;
    });
    
    setEmergencies(updatedEmergencies);
  };

  // Play alert sound
  const playAlertSound = () => {
    alertSound.currentTime = 0;
    alertSound.play().catch(e => console.log('Audio play failed:', e));
  };

  // Simulate new emergency (for demo purposes)
  const simulateEmergency = () => {
    const types = ['critical', 'high', 'medium', 'low'];
    const titles = [
      'Hypertensive Crisis',
      'Hypoglycemic Episode',
      'Acute Pain Episode',
      'Fall with Injury',
      'Medication Error',
      'Equipment Failure'
    ];
    const patients = [
      'James Wilson', 'Sophia Chen', 'Michael Brown', 
      'Olivia Davis', 'William Taylor', 'Ava Martinez'
    ];
    const rooms = ['ICU-102', 'ER-301', 'WARD-405', 'SURG-201', 'CARDIAC-103'];

    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    const randomPatient = patients[Math.floor(Math.random() * patients.length)];
    const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];

    const simulatedEmergency = {
      id: emergencyCounter.current++,
      type: randomType,
      title: randomTitle,
      patientName: randomPatient,
      room: randomRoom,
      vitalSigns: 'BP: --, HR: --, SpO2: --',
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      status: 'active',
      assignedTo: 'Unassigned',
      priority: randomType === 'critical' ? 'CRITICAL' : 
               randomType === 'high' ? 'HIGH' : 
               randomType === 'medium' ? 'MEDIUM' : 'LOW',
      responseTime: '0 min',
      codeBlue: randomType === 'critical'
    };

    setEmergencies([simulatedEmergency, ...emergencies]);
    setSimulatedEmergencies(prev => [...prev, simulatedEmergency]);

    // Play alert sound if enabled
    if (audioEnabled) {
      playAlertSound();
    }
  };

  // Get priority class
  const getPriorityClass = (type) => {
    switch(type) {
      case 'critical': return 'nurse-emergency-critical';
      case 'high': return 'nurse-emergency-high';
      case 'medium': return 'nurse-emergency-medium';
      case 'low': return 'nurse-emergency-low';
      default: return '';
    }
  };

  // Get status class
  const getStatusClass = (status) => {
    switch(status) {
      case 'active': return 'nurse-emergency-status-active';
      case 'resolved': return 'nurse-emergency-status-resolved';
      case 'escalated': return 'nurse-emergency-status-escalated';
      default: return '';
    }
  };

  // Format time
  const formatTime = (timeString) => {
    return timeString;
  };

  // Get emergency icon
  const getEmergencyIcon = (type) => {
    switch(type) {
      case 'critical': return 'fa-heart-circle-exclamation';
      case 'high': return 'fa-person-running';
      case 'medium': return 'fa-triangle-exclamation';
      case 'low': return 'fa-bell';
      default: return 'fa-exclamation';
    }
  };

  // Calculate response time color
  const getResponseTimeColor = (time) => {
    const minutes = parseInt(time);
    if (minutes <= 2) return '#4CAF50';
    if (minutes <= 5) return '#FF9800';
    return '#F44336';
  };

  return (
    <div className="nurse-emergency-container">
      {/* Emergency Alert Banner */}
      <div className="nurse-emergency-alert-banner">
        <div className="nurse-emergency-alert-content">
          <div className="nurse-emergency-alert-icon">
            <i className="fas fa-siren-on"></i>
          </div>
          <div className="nurse-emergency-alert-text">
            <h3>EMERGENCY ALERT SYSTEM ACTIVE</h3>
            <p>Real-time monitoring of all emergency situations</p>
          </div>
          <div className="nurse-emergency-alert-stats">
            <span className="nurse-emergency-alert-count">
              {emergencies.filter(e => e.status === 'active').length} Active Emergencies
            </span>
            <span className="nurse-emergency-response-time">
              Avg Response: {activeSummary.avgResponseTime}
            </span>
          </div>
          <div className="nurse-emergency-alert-controls">
            <button 
              className={`nurse-emergency-audio-btn ${audioEnabled ? 'enabled' : 'disabled'}`}
              onClick={() => setAudioEnabled(!audioEnabled)}
            >
              <i className={`fas fa-volume-${audioEnabled ? 'high' : 'mute'}`}></i>
              {audioEnabled ? 'Sound ON' : 'Sound OFF'}
            </button>
            <button 
              className="nurse-emergency-simulate-btn"
              onClick={simulateEmergency}
            >
              <i className="fas fa-bolt"></i> Simulate Emergency
            </button>
            <button className="nurse-emergency-code-blue-btn">
              <i className="fas fa-heart-pulse"></i> CODE BLUE
            </button>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="nurse-emergency-dashboard">
        {/* Left Panel - Emergency Types */}
        <div className="nurse-emergency-left-panel">
          <h2 className="nurse-emergency-section-title mb-3">
            <i className="fas fa-list-check"></i> Emergency Categories
          </h2>
          
          <div className="nurse-emergency-types-grid">
            {emergencyTypes.map(type => (
              <div key={type.type} className="nurse-emergency-type-card">
                <div 
                  className="nurse-emergency-type-header"
                  style={{ backgroundColor: type.color }}
                >
                  <i className={`fas ${type.icon}`}></i>
                  <h3>{type.name}</h3>
                </div>
                <div className="nurse-emergency-type-content">
                  <p className="nurse-emergency-type-desc">{type.description}</p>
                  <div className="nurse-emergency-type-stats">
                    <span className="nurse-emergency-type-count">
                      {type.count} Active
                    </span>
                    <button className="nurse-emergency-type-action-btn">
                      View All
                    </button>
                  </div>
                  <div className="nurse-emergency-type-examples">
                    <div className="nurse-emergency-type-example">
                      <i className="fas fa-circle"></i>
                      {type.type === 'critical' ? 'Cardiac Arrest' : 
                       type.type === 'high' ? 'Respiratory Failure' :
                       type.type === 'medium' ? 'Severe Bleeding' : 'Allergic Reaction'}
                    </div>
                    <div className="nurse-emergency-type-example">
                      <i className="fas fa-circle"></i>
                      {type.type === 'critical' ? 'Major Trauma' : 
                       type.type === 'high' ? 'Stroke Symptoms' :
                       type.type === 'medium' ? 'Seizure' : 'Acute Pain'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="nurse-emergency-quick-actions">
            <h2 className="nurse-emergency-section-title">
              <i className="fas fa-bolt"></i> Quick Actions
            </h2>
            <div className="nurse-emergency-actions-grid">
              <button className="nurse-emergency-action-btn critical">
                <i className="fas fa-phone-alt"></i>
                <span>Call Rapid Response</span>
              </button>
              <button className="nurse-emergency-action-btn high">
                <i className="fas fa-user-md"></i>
                <span>Page Doctor</span>
              </button>
              <button className="nurse-emergency-action-btn medium">
                <i className="fas fa-ambulance"></i>
                <span>Request Transport</span>
              </button>
              <button className="nurse-emergency-action-btn low">
                <i className="fas fa-kit-medical"></i>
                <span>Get Crash Cart</span>
              </button>
              <button className="nurse-emergency-action-btn critical">
                <i className="fas fa-heart"></i>
                <span>Start CPR</span>
              </button>
              <button className="nurse-emergency-action-btn high">
                <i className="fas fa-syringe"></i>
                <span>Emergency Meds</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Active Emergencies */}
        <div className="nurse-emergency-right-panel">
          <div className="nurse-emergency-right-header">
            <h2 className="nurse-emergency-section-title">
              <i className="fas fa-clock"></i> Active Emergencies
            </h2>
            <div className="nurse-emergency-controls">
              <div className="nurse-emergency-search">
                <input
                  type="text"
                  placeholder="Search emergencies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="nurse-emergency-search-input"
                />
                <i className="fas fa-search"></i>
              </div>
              <div className="nurse-emergency-filters">
                <button 
                  className={`nurse-emergency-filter-btn ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
                <button 
                  className={`nurse-emergency-filter-btn ${filter === 'active' ? 'active' : ''}`}
                  onClick={() => setFilter('active')}
                >
                  Active
                </button>
                <button 
                  className={`nurse-emergency-filter-btn ${filter === 'resolved' ? 'active' : ''}`}
                  onClick={() => setFilter('resolved')}
                >
                  Resolved
                </button>
              </div>
            </div>
          </div>

          {/* Emergency List */}
          <div className="nurse-emergency-list">
            {filteredEmergencies.map(emergency => (
              <div key={emergency.id} className={`nurse-emergency-card ${getPriorityClass(emergency.type)}`}>
                {emergency.codeBlue && (
                  <div className="nurse-emergency-codeblue-badge">
                    <i className="fas fa-heart-pulse"></i> CODE BLUE
                  </div>
                )}
                <div className="nurse-emergency-card-header">
                  <div className="nurse-emergency-card-title">
                    <i className={`fas ${getEmergencyIcon(emergency.type)}`}></i>
                    <h3>{emergency.title}</h3>
                    <span className={`nurse-emergency-priority ${emergency.type}`}>
                      {emergency.priority}
                    </span>
                  </div>
                  <div className="nurse-emergency-card-time">
                    <i className="fas fa-clock"></i>
                    {formatTime(emergency.time)}
                  </div>
                </div>
                
                <div className="nurse-emergency-card-content">
                  <div className="nurse-emergency-patient-info">
                    <div className="nurse-emergency-patient-detail">
                      <i className="fas fa-user-injured"></i>
                      <div>
                        <span className="nurse-emergency-label">Patient</span>
                        <strong>{emergency.patientName}</strong>
                      </div>
                    </div>
                    <div className="nurse-emergency-patient-detail">
                      <i className="fas fa-bed"></i>
                      <div>
                        <span className="nurse-emergency-label">Location</span>
                        <strong>{emergency.room}</strong>
                      </div>
                    </div>
                    <div className="nurse-emergency-patient-detail">
                      <i className="fas fa-heartbeat"></i>
                      <div>
                        <span className="nurse-emergency-label">Vitals</span>
                        <strong>{emergency.vitalSigns}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="nurse-emergency-response-info">
                    <div className="nurse-emergency-response-detail">
                      <span className="nurse-emergency-label">Assigned To</span>
                      <strong>{emergency.assignedTo}</strong>
                    </div>
                    <div className="nurse-emergency-response-detail">
                      <span className="nurse-emergency-label">Response Time</span>
                      <strong style={{ color: getResponseTimeColor(emergency.responseTime) }}>
                        {emergency.responseTime}
                      </strong>
                    </div>
                    <div className="nurse-emergency-response-detail">
                      <span className="nurse-emergency-label">Status</span>
                      <span className={`nurse-emergency-status ${getStatusClass(emergency.status)}`}>
                        {emergency.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="nurse-emergency-card-actions">
                  {emergency.status === 'active' && (
                    <>
                      <button 
                        className="nurse-emergency-action-btn assign"
                        onClick={() => handleAssignToMe(emergency.id)}
                      >
                        <i className="fas fa-user-check"></i> Assign to Me
                      </button>
                      <button 
                        className="nurse-emergency-action-btn escalate"
                        onClick={() => handleStatusChange(emergency.id, 'escalated')}
                      >
                        <i className="fas fa-arrow-up"></i> Escalate
                      </button>
                      <button 
                        className="nurse-emergency-action-btn resolve"
                        onClick={() => handleStatusChange(emergency.id, 'resolved')}
                      >
                        <i className="fas fa-check-circle"></i> Mark Resolved
                      </button>
                    </>
                  )}
                  {emergency.status === 'resolved' && (
                    <button 
                      className="nurse-emergency-action-btn reopen"
                      onClick={() => handleStatusChange(emergency.id, 'active')}
                    >
                      <i className="fas fa-redo"></i> Re-open
                    </button>
                  )}
                  <button className="nurse-emergency-action-btn details">
                    <i className="fas fa-file-medical"></i> View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Emergency Form */}
          <div className="nurse-emergency-add-form">
            <h3 className="nurse-emergency-form-title">
              <i className="fas fa-plus-circle"></i> Report New Emergency
            </h3>
            <div className="nurse-emergency-form-grid">
              <div className="nurse-emergency-form-group">
                <label>Emergency Type *</label>
                <select
                  value={newEmergency.type}
                  onChange={(e) => setNewEmergency({...newEmergency, type: e.target.value})}
                >
                  <option value="critical">Critical - Code Blue</option>
                  <option value="high">High - Rapid Response</option>
                  <option value="medium">Medium - Emergency Call</option>
                  <option value="low">Low - Urgent Request</option>
                </select>
              </div>
              <div className="nurse-emergency-form-group">
                <label>Emergency Title *</label>
                <input
                  type="text"
                  value={newEmergency.title}
                  onChange={(e) => setNewEmergency({...newEmergency, title: e.target.value})}
                  placeholder="e.g., Cardiac Arrest, Severe Bleeding"
                />
              </div>
              <div className="nurse-emergency-form-group">
                <label>Patient Name *</label>
                <input
                  type="text"
                  value={newEmergency.patientName}
                  onChange={(e) => setNewEmergency({...newEmergency, patientName: e.target.value})}
                  placeholder="Enter patient name"
                />
              </div>
              <div className="nurse-emergency-form-group">
                <label>Room/Location *</label>
                <input
                  type="text"
                  value={newEmergency.room}
                  onChange={(e) => setNewEmergency({...newEmergency, room: e.target.value})}
                  placeholder="e.g., ICU-101, ER-205"
                />
              </div>
              <div className="nurse-emergency-form-group">
                <label>Vital Signs</label>
                <input
                  type="text"
                  value={newEmergency.vitalSigns}
                  onChange={(e) => setNewEmergency({...newEmergency, vitalSigns: e.target.value})}
                  placeholder="e.g., BP: 120/80, HR: 90, SpO2: 98%"
                />
              </div>
              <div className="nurse-emergency-form-group">
                <label>Assign To</label>
                <input
                  type="text"
                  value={newEmergency.assignedTo}
                  onChange={(e) => setNewEmergency({...newEmergency, assignedTo: e.target.value})}
                  placeholder="e.g., Dr. Smith, Nurse Johnson"
                />
              </div>
            </div>
            <div className="nurse-emergency-form-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={newEmergency.codeBlue}
                  onChange={(e) => setNewEmergency({...newEmergency, codeBlue: e.target.checked})}
                />
                <span>This is a Code Blue (Cardiac/Respiratory Arrest)</span>
              </label>
            </div>
            <div className="nurse-emergency-form-actions">
              <button 
                className="nurse-emergency-form-cancel"
                onClick={() => setNewEmergency({
                  type: 'medium',
                  title: '',
                  patientName: '',
                  room: '',
                  vitalSigns: '',
                  assignedTo: '',
                  codeBlue: false
                })}
              >
                Clear
              </button>
              <button 
                className="nurse-emergency-form-submit"
                onClick={handleAddEmergency}
              >
                <i className="fas fa-bullhorn"></i> Report Emergency
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Statistics */}
      <div className="nurse-emergency-statistics">
        <h2 className="nurse-emergency-section-title">
          <i className="fas fa-chart-line"></i> Emergency Statistics
        </h2>
        <div className="nurse-emergency-stats-grid">
          <div className="nurse-emergency-stat-card">
            <div className="nurse-emergency-stat-icon critical">
              <i className="fas fa-heart-circle-exclamation"></i>
            </div>
            <div className="nurse-emergency-stat-info">
              <h3>{activeSummary.critical}</h3>
              <p>Critical Emergencies</p>
              <span className="nurse-emergency-stat-trend up">+2 today</span>
            </div>
          </div>
          <div className="nurse-emergency-stat-card">
            <div className="nurse-emergency-stat-icon high">
              <i className="fas fa-person-running"></i>
            </div>
            <div className="nurse-emergency-stat-info">
              <h3>{activeSummary.high}</h3>
              <p>Rapid Response Calls</p>
              <span className="nurse-emergency-stat-trend up">+1 today</span>
            </div>
          </div>
          <div className="nurse-emergency-stat-card">
            <div className="nurse-emergency-stat-icon medium">
              <i className="fas fa-triangle-exclamation"></i>
            </div>
            <div className="nurse-emergency-stat-info">
              <h3>{activeSummary.medium}</h3>
              <p>Emergency Calls</p>
              <span className="nurse-emergency-stat-trend stable">No change</span>
            </div>
          </div>
          <div className="nurse-emergency-stat-card">
            <div className="nurse-emergency-stat-icon low">
              <i className="fas fa-bell"></i>
            </div>
            <div className="nurse-emergency-stat-info">
              <h3>{activeSummary.low}</h3>
              <p>Urgent Requests</p>
              <span className="nurse-emergency-stat-trend down">-1 today</span>
            </div>
          </div>
          <div className="nurse-emergency-stat-card">
            <div className="nurse-emergency-stat-icon response">
              <i className="fas fa-clock-rotate-left"></i>
            </div>
            <div className="nurse-emergency-stat-info">
              <h3>{activeSummary.avgResponseTime}</h3>
              <p>Avg Response Time</p>
              <span className="nurse-emergency-stat-trend down">-2 min</span>
            </div>
          </div>
          <div className="nurse-emergency-stat-card">
            <div className="nurse-emergency-stat-icon code">
              <i className="fas fa-heart-pulse"></i>
            </div>
            <div className="nurse-emergency-stat-info">
              <h3>2</h3>
              <p>Code Blue Today</p>
              <span className="nurse-emergency-stat-trend up">+1 today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Resources */}
      <div className="nurse-emergency-resources">
        <h2 className="nurse-emergency-section-title">
          <i className="fas fa-life-ring"></i> Emergency Resources
        </h2>
        <div className="nurse-emergency-resources-grid">
          <div className="nurse-emergency-resource-card">
            <div className="nurse-emergency-resource-icon">
              <i className="fas fa-phone-alt"></i>
            </div>
            <h3>Emergency Contacts</h3>
            <ul>
              <li><strong>Code Blue:</strong> Ext. 5555</li>
              <li><strong>Rapid Response:</strong> Ext. 2222</li>
              <li><strong>Security:</strong> Ext. 1111</li>
              <li><strong>Pharmacy:</strong> Ext. 3333</li>
            </ul>
          </div>
          <div className="nurse-emergency-resource-card">
            <div className="nurse-emergency-resource-icon">
              <i className="fas fa-map-marker-alt"></i>
            </div>
            <h3>Emergency Locations</h3>
            <ul>
              <li><strong>Crash Carts:</strong> Every Floor</li>
              <li><strong>Defibrillators:</strong> ICU, ER, Wards</li>
              <li><strong>Emergency Meds:</strong> Pharmacy</li>
              <li><strong>O2 Supply:</strong> All Rooms</li>
            </ul>
          </div>
          <div className="nurse-emergency-resource-card">
            <div className="nurse-emergency-resource-icon">
              <i className="fas fa-file-medical"></i>
            </div>
            <h3>Protocols & Guides</h3>
            <ul>
              <li>Code Blue Protocol</li>
              <li>ACLS Guidelines</li>
              <li>Emergency Drug Doses</li>
              <li>Rapid Response Criteria</li>
            </ul>
          </div>
          <div className="nurse-emergency-resource-card">
            <div className="nurse-emergency-resource-icon">
              <i className="fas fa-users"></i>
            </div>
            <h3>On-Call Staff</h3>
            <ul>
              <li><strong>Cardiology:</strong> Dr. Smith (Ext. 4444)</li>
              <li><strong>ICU:</strong> Dr. Johnson (Ext. 5555)</li>
              <li><strong>ER:</strong> Dr. Williams (Ext. 6666)</li>
              <li><strong>Charge Nurse:</strong> Sarah (Ext. 7777)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NurseEmergencyDashboard;