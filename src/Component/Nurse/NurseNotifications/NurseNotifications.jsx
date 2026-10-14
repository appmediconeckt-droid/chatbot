import React, { useState, useEffect, useRef } from 'react';
import './NurseNotifications.css';

const NurseNotifications = () => {
  // State for notifications
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'medication',
      title: 'Medication Due',
      message: 'Paracetamol 500mg due for John Smith (Room 101)',
      time: '2 minutes ago',
      timeFull: '14:30',
      priority: 'high',
      read: false,
      actionRequired: true,
      patientId: 'PAT001',
      medication: 'Paracetamol',
      dose: '500mg',
      icon: 'fa-pills'
    },
    {
      id: 2,
      type: 'vital',
      title: 'Critical Vitals Alert',
      message: 'BP: 180/110, HR: 130 for Emma Wilson',
      time: '5 minutes ago',
      timeFull: '14:27',
      priority: 'critical',
      read: false,
      actionRequired: true,
      patientId: 'PAT002',
      vitalType: 'Blood Pressure',
      icon: 'fa-heart-pulse'
    },
    {
      id: 3,
      type: 'lab',
      title: 'Lab Results Ready',
      message: 'CBC results available for Robert Chen',
      time: '15 minutes ago',
      timeFull: '14:15',
      priority: 'medium',
      read: true,
      actionRequired: false,
      patientId: 'PAT003',
      testType: 'CBC',
      icon: 'fa-flask'
    },
    {
      id: 4,
      type: 'appointment',
      title: 'Upcoming Procedure',
      message: 'Dressing change scheduled in 30 minutes',
      time: '30 minutes ago',
      timeFull: '14:00',
      priority: 'medium',
      read: true,
      actionRequired: true,
      patientId: 'PAT004',
      procedure: 'Dressing Change',
      icon: 'fa-calendar-check'
    },
    {
      id: 5,
      type: 'system',
      title: 'System Maintenance',
      message: 'EHR system maintenance tonight at 2 AM',
      time: '1 hour ago',
      timeFull: '13:30',
      priority: 'low',
      read: true,
      actionRequired: false,
      icon: 'fa-server'
    },
    {
      id: 6,
      type: 'emergency',
      title: 'Rapid Response Team',
      message: 'Rapid Response needed in ICU Room 3',
      time: 'Just now',
      timeFull: '14:32',
      priority: 'critical',
      read: false,
      actionRequired: true,
      icon: 'fa-siren-on'
    },
    {
      id: 7,
      type: 'shift',
      title: 'Shift Change Reminder',
      message: 'Your shift ends in 2 hours',
      time: '2 hours ago',
      timeFull: '12:30',
      priority: 'low',
      read: true,
      actionRequired: false,
      icon: 'fa-clock-rotate-left'
    },
    {
      id: 8,
      type: 'patient',
      title: 'Patient Request',
      message: 'Sarah Johnson requesting pain medication',
      time: '45 minutes ago',
      timeFull: '13:45',
      priority: 'medium',
      read: false,
      actionRequired: true,
      patientId: 'PAT005',
      icon: 'fa-user-injured'
    },
    {
      id: 9,
      type: 'equipment',
      title: 'Equipment Alert',
      message: 'IV Pump battery low in Room 205',
      time: '3 hours ago',
      timeFull: '11:30',
      priority: 'medium',
      read: true,
      actionRequired: true,
      equipment: 'IV Pump',
      icon: 'fa-toolbox'
    },
    {
      id: 10,
      type: 'training',
      title: 'New Protocol Available',
      message: 'Updated medication administration protocol',
      time: '1 day ago',
      timeFull: 'Yesterday 09:00',
      priority: 'low',
      read: true,
      actionRequired: false,
      icon: 'fa-file-medical'
    }
  ]);

  // State for notification filters
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationSound] = useState(new Audio('/notification-sound.mp3'));
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [autoClear, setAutoClear] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Calculate unread notifications
  useEffect(() => {
    const unreadCount = notifications.filter(n => !n.read).length;
    setNotificationCount(unreadCount);
    
    // Update document title with notification count
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) Nurse Notifications`;
    } else {
      document.title = 'Nurse Notifications';
    }
  }, [notifications]);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || notification.type === filter || 
                         (filter === 'unread' && !notification.read) ||
                         (filter === 'action' && notification.actionRequired);
    
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  // Delete notification
  const deleteNotification = (id) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Add sample notification
  const addSampleNotification = () => {
    const sampleTypes = ['medication', 'vital', 'lab', 'patient', 'emergency'];
    const sampleTitles = [
      'New Medication Order',
      'Vital Signs Alert',
      'Lab Test Ordered',
      'Patient Call',
      'Equipment Check Required'
    ];
    const sampleMessages = [
      'New antibiotic prescribed for Room 304',
      'Temperature spike detected for patient in Ward 2',
      'Urine culture ordered for outpatient',
      'Patient requesting assistance with mobility',
      'Defibrillator maintenance due this week'
    ];
    
    const randomIndex = Math.floor(Math.random() * sampleTypes.length);
    const newId = notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) + 1 : 1;

    const newNotification = {
      id: newId,
      type: sampleTypes[randomIndex],
      title: sampleTitles[randomIndex],
      message: sampleMessages[randomIndex],
      time: 'Just now',
      timeFull: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      priority: ['critical', 'high', 'medium', 'low'][Math.floor(Math.random() * 4)],
      read: false,
      actionRequired: Math.random() > 0.5,
      patientId: `PAT${Math.floor(Math.random() * 900) + 100}`,
      icon: getIconForType(sampleTypes[randomIndex])
    };

    setNotifications([newNotification, ...notifications]);
    
    // Play notification sound
    if (soundEnabled) {
      notificationSound.currentTime = 0;
      notificationSound.play().catch(e => console.log('Audio play failed:', e));
    }

    // Vibrate if enabled
    if (vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate(200);
    }
  };

  // Get icon for notification type
  const getIconForType = (type) => {
    switch(type) {
      case 'medication': return 'fa-pills';
      case 'vital': return 'fa-heart-pulse';
      case 'lab': return 'fa-flask';
      case 'appointment': return 'fa-calendar-check';
      case 'emergency': return 'fa-siren-on';
      case 'shift': return 'fa-clock-rotate-left';
      case 'patient': return 'fa-user-injured';
      case 'equipment': return 'fa-toolbox';
      case 'training': return 'fa-file-medical';
      case 'system': return 'fa-server';
      default: return 'fa-bell';
    }
  };

  // Get priority class
  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'critical': return 'nurse-notif-priority-critical';
      case 'high': return 'nurse-notif-priority-high';
      case 'medium': return 'nurse-notif-priority-medium';
      case 'low': return 'nurse-notif-priority-low';
      default: return '';
    }
  };

  // Get notification type label
  const getTypeLabel = (type) => {
    switch(type) {
      case 'medication': return 'Medication';
      case 'vital': return 'Vital Signs';
      case 'lab': return 'Lab Results';
      case 'appointment': return 'Appointment';
      case 'emergency': return 'Emergency';
      case 'shift': return 'Shift';
      case 'patient': return 'Patient';
      case 'equipment': return 'Equipment';
      case 'training': return 'Training';
      case 'system': return 'System';
      default: return 'General';
    }
  };

  // Handle notification action
  const handleNotificationAction = (notification) => {
    markAsRead(notification.id);
    
    // Simulate different actions based on notification type
    switch(notification.type) {
      case 'medication':
        alert(`Administering ${notification.medication || 'medication'} to ${notification.patientId || 'patient'}`);
        break;
      case 'vital':
        alert(`Checking vital signs for ${notification.patientId || 'patient'}`);
        break;
      case 'emergency':
        alert(`Responding to emergency in ${notification.message}`);
        break;
      case 'patient':
        alert(`Responding to patient request from ${notification.patientId || 'patient'}`);
        break;
      default:
        console.log(`Action taken for notification: ${notification.title}`);
    }
  };

  // Notification categories statistics
  const notificationStats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    actionRequired: notifications.filter(n => n.actionRequired).length,
    critical: notifications.filter(n => n.priority === 'critical').length,
    medication: notifications.filter(n => n.type === 'medication').length,
    vital: notifications.filter(n => n.type === 'vital').length
  };

  return (
    <div className="nurse-notifications-container">
      {/* Header */}
      <div className="nurse-notifications-header">
        <div className="nurse-notifications-header-content">
          <h1 className="nurse-notifications-title">
            <i className="fas fa-bell"></i> Nurse Notifications
            {notificationCount > 0 && (
              <span className="nurse-notifications-badge">
                {notificationCount}
              </span>
            )}
          </h1>
          <div className="nurse-notifications-time">
            <i className="fas fa-clock"></i>
            {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
        </div>
        
        <div className="nurse-notifications-controls">
          <button 
            className="nurse-notif-btn mark-all-read"
            onClick={markAllAsRead}
            disabled={notificationCount === 0}
          >
            <i className="fas fa-check-double"></i> Mark All Read
          </button>
          <button 
            className="nurse-notif-btn clear-all"
            onClick={clearAllNotifications}
            disabled={notifications.length === 0}
          >
            <i className="fas fa-trash"></i> Clear All
          </button>
          <button 
            className="nurse-notif-btn add-sample"
            onClick={addSampleNotification}
          >
            <i className="fas fa-plus"></i> Add Sample
          </button>
          <button 
            className="nurse-notif-btn settings"
            onClick={() => setShowSettings(!showSettings)}
          >
            <i className="fas fa-cog"></i> Settings
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="nurse-notifications-settings">
          <h3 className="nurse-notif-settings-title">
            <i className="fas fa-sliders-h"></i> Notification Settings
          </h3>
          <div className="nurse-notif-settings-grid">
            <div className="nurse-notif-setting">
              <label>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={() => setSoundEnabled(!soundEnabled)}
                />
                <span>Enable Notification Sound</span>
              </label>
              <p className="nurse-notif-setting-desc">Play sound for new notifications</p>
            </div>
            <div className="nurse-notif-setting">
              <label>
                <input
                  type="checkbox"
                  checked={vibrationEnabled}
                  onChange={() => setVibrationEnabled(!vibrationEnabled)}
                />
                <span>Enable Vibration</span>
              </label>
              <p className="nurse-notif-setting-desc">Vibrate for important notifications</p>
            </div>
            <div className="nurse-notif-setting">
              <label>
                <input
                  type="checkbox"
                  checked={autoClear}
                  onChange={() => setAutoClear(!autoClear)}
                />
                <span>Auto-clear Read Notifications</span>
              </label>
              <p className="nurse-notif-setting-desc">Automatically remove read notifications after 24 hours</p>
            </div>
            <div className="nurse-notif-setting">
              <label>Notification Volume</label>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="80"
                className="nurse-notif-volume-slider"
              />
            </div>
          </div>
          <div className="nurse-notif-settings-actions">
            <button className="nurse-notif-btn save-settings">
              <i className="fas fa-save"></i> Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="nurse-notifications-stats">
        <div className="nurse-notif-stat-card total">
          <div className="nurse-notif-stat-icon">
            <i className="fas fa-bell"></i>
          </div>
          <div className="nurse-notif-stat-info">
            <h3>{notificationStats.total}</h3>
            <p>Total Notifications</p>
          </div>
        </div>
        <div className="nurse-notif-stat-card unread">
          <div className="nurse-notif-stat-icon">
            <i className="fas fa-envelope"></i>
          </div>
          <div className="nurse-notif-stat-info">
            <h3>{notificationStats.unread}</h3>
            <p>Unread</p>
          </div>
        </div>
        <div className="nurse-notif-stat-card action">
          <div className="nurse-notif-stat-icon">
            <i className="fas fa-exclamation-circle"></i>
          </div>
          <div className="nurse-notif-stat-info">
            <h3>{notificationStats.actionRequired}</h3>
            <p>Action Required</p>
          </div>
        </div>
        <div className="nurse-notif-stat-card critical">
          <div className="nurse-notif-stat-icon">
            <i className="fas fa-triangle-exclamation"></i>
          </div>
          <div className="nurse-notif-stat-info">
            <h3>{notificationStats.critical}</h3>
            <p>Critical</p>
          </div>
        </div>
        <div className="nurse-notif-stat-card medication">
          <div className="nurse-notif-stat-icon">
            <i className="fas fa-pills"></i>
          </div>
          <div className="nurse-notif-stat-info">
            <h3>{notificationStats.medication}</h3>
            <p>Medication Alerts</p>
          </div>
        </div>
        <div className="nurse-notif-stat-card vital">
          <div className="nurse-notif-stat-icon">
            <i className="fas fa-heart-pulse"></i>
          </div>
          <div className="nurse-notif-stat-info">
            <h3>{notificationStats.vital}</h3>
            <p>Vital Alerts</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="nurse-notifications-filters">
        <div className="nurse-notif-search">
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="nurse-notif-search-input"
          />
          <i className="fas fa-search"></i>
        </div>
        
        <div className="nurse-notif-filter-buttons">
          <button 
            className={`nurse-notif-filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`nurse-notif-filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread
          </button>
          <button 
            className={`nurse-notif-filter-btn ${filter === 'action' ? 'active' : ''}`}
            onClick={() => setFilter('action')}
          >
            Action Required
          </button>
          <button 
            className={`nurse-notif-filter-btn ${filter === 'critical' ? 'active' : ''}`}
            onClick={() => setFilter('critical')}
          >
            Critical
          </button>
          
          <div className="nurse-notif-type-filter">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="nurse-notif-type-select"
            >
              <option value="all">All Types</option>
              <option value="medication">Medication</option>
              <option value="vital">Vital Signs</option>
              <option value="lab">Lab Results</option>
              <option value="emergency">Emergency</option>
              <option value="patient">Patient</option>
              <option value="equipment">Equipment</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="nurse-notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="nurse-no-notifications">
            <i className="fas fa-inbox"></i>
            <h3>No Notifications</h3>
            <p>You're all caught up! No new notifications.</p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div 
              key={notification.id} 
              className={`nurse-notification-item ${notification.read ? 'read' : 'unread'} ${getPriorityClass(notification.priority)}`}
            >
              <div className="nurse-notif-item-left">
                <div className="nurse-notif-icon">
                  <i className={`fas ${notification.icon}`}></i>
                </div>
                <div className="nurse-notif-content">
                  <div className="nurse-notif-header">
                    <h4 className="nurse-notif-title">{notification.title}</h4>
                    <span className="nurse-notif-type">{getTypeLabel(notification.type)}</span>
                    <span className={`nurse-notif-priority ${notification.priority}`}>
                      {notification.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="nurse-notif-message">{notification.message}</p>
                  <div className="nurse-notif-meta">
                    <span className="nurse-notif-time">
                      <i className="fas fa-clock"></i> {notification.time}
                    </span>
                    {notification.patientId && (
                      <span className="nurse-notif-patient">
                        <i className="fas fa-user-injured"></i> {notification.patientId}
                      </span>
                    )}
                    {notification.actionRequired && (
                      <span className="nurse-notif-action-required">
                        <i className="fas fa-exclamation-circle"></i> Action Required
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="nurse-notif-item-right">
                <div className="nurse-notif-actions">
                  {!notification.read && (
                    <button 
                      className="nurse-notif-action-btn mark-read"
                      onClick={() => markAsRead(notification.id)}
                      title="Mark as Read"
                    >
                      <i className="fas fa-check"></i>
                    </button>
                  )}
                  
                  {notification.actionRequired && (
                    <button 
                      className="nurse-notif-action-btn take-action"
                      onClick={() => handleNotificationAction(notification)}
                      title="Take Action"
                    >
                      <i className="fas fa-play"></i> Action
                    </button>
                  )}
                  
                  <button 
                    className="nurse-notif-action-btn view"
                    title="View Details"
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                  
                  <button 
                    className="nurse-notif-action-btn delete"
                    onClick={() => deleteNotification(notification.id)}
                    title="Delete"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
                <div className="nurse-notif-time-full">
                  {notification.timeFull}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notification Categories */}
      <div className="nurse-notification-categories">
        <h3 className="nurse-notif-categories-title">
          <i className="fas fa-layer-group"></i> Notification Categories
        </h3>
        <div className="nurse-notif-categories-grid">
          <div className="nurse-notif-category-card medication">
            <div className="nurse-notif-category-icon">
              <i className="fas fa-pills"></i>
            </div>
            <div className="nurse-notif-category-info">
              <h4>Medication Alerts</h4>
              <p>Due medications, new orders, administration reminders</p>
              <span className="nurse-notif-category-count">
                {notifications.filter(n => n.type === 'medication').length} active
              </span>
            </div>
          </div>
          
          <div className="nurse-notif-category-card vital">
            <div className="nurse-notif-category-icon">
              <i className="fas fa-heart-pulse"></i>
            </div>
            <div className="nurse-notif-category-info">
              <h4>Vital Signs</h4>
              <p>Critical vitals, abnormal readings, monitoring alerts</p>
              <span className="nurse-notif-category-count">
                {notifications.filter(n => n.type === 'vital').length} active
              </span>
            </div>
          </div>
          
          <div className="nurse-notif-category-card emergency">
            <div className="nurse-notif-category-icon">
              <i className="fas fa-siren-on"></i>
            </div>
            <div className="nurse-notif-category-info">
              <h4>Emergency Alerts</h4>
              <p>Code blue, rapid response, urgent situations</p>
              <span className="nurse-notif-category-count">
                {notifications.filter(n => n.type === 'emergency').length} active
              </span>
            </div>
          </div>
          
          <div className="nurse-notif-category-card patient">
            <div className="nurse-notif-category-icon">
              <i className="fas fa-user-injured"></i>
            </div>
            <div className="nurse-notif-category-info">
              <h4>Patient Requests</h4>
              <p>Calls, needs, assistance requests from patients</p>
              <span className="nurse-notif-category-count">
                {notifications.filter(n => n.type === 'patient').length} active
              </span>
            </div>
          </div>
          
          <div className="nurse-notif-category-card lab">
            <div className="nurse-notif-category-icon">
              <i className="fas fa-flask"></i>
            </div>
            <div className="nurse-notif-category-info">
              <h4>Lab Results</h4>
              <p>Test results, abnormal findings, culture reports</p>
              <span className="nurse-notif-category-count">
                {notifications.filter(n => n.type === 'lab').length} active
              </span>
            </div>
          </div>
          
          <div className="nurse-notif-category-card system">
            <div className="nurse-notif-category-icon">
              <i className="fas fa-server"></i>
            </div>
            <div className="nurse-notif-category-info">
              <h4>System Alerts</h4>
              <p>Maintenance, updates, equipment status</p>
              <span className="nurse-notif-category-count">
                {notifications.filter(n => n.type === 'system').length} active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="nurse-notifications-quick-actions">
        <h3 className="nurse-notif-quick-title">
          <i className="fas fa-bolt"></i> Quick Actions
        </h3>
        <div className="nurse-notif-quick-grid">
          <button className="nurse-notif-quick-btn">
            <i className="fas fa-volume-up"></i>
            <span>Mute for 1 hour</span>
          </button>
          <button className="nurse-notif-quick-btn">
            <i className="fas fa-filter"></i>
            <span>Filter by Priority</span>
          </button>
          <button className="nurse-notif-quick-btn">
            <i className="fas fa-download"></i>
            <span>Export Notifications</span>
          </button>
          <button className="nurse-notif-quick-btn">
            <i className="fas fa-bell-slash"></i>
            <span>Snooze All</span>
          </button>
          <button className="nurse-notif-quick-btn">
            <i className="fas fa-print"></i>
            <span>Print Summary</span>
          </button>
          <button className="nurse-notif-quick-btn">
            <i className="fas fa-question-circle"></i>
            <span>Help & Support</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NurseNotifications;