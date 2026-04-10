import React, { useState } from 'react';
import './CallHistory.css';

// Modal Components (simplified for demonstration)
const VideoCallModal = ({ isOpen, onClose, callData }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Video Call {callData ? `with ${callData.name}` : '(New Call)'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body video-modal-body">
          <div className="video-preview-placeholder">
            <span className="video-icon">📹</span>
            <p>Video call interface would appear here</p>
            <small>{callData ? `Calling ${callData.name}...` : 'Starting new video call...'}</small>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-end-call" onClick={onClose}>End Call</button>
        </div>
      </div>
    </div>
  );
};

const VoiceCallModal = ({ isOpen, onClose, callData }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Voice Call {callData ? `with ${callData.name}` : '(New Call)'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body voice-modal-body">
          <div className="voice-preview-placeholder">
            <span className="voice-icon">🎤</span>
            <p>Voice call interface would appear here</p>
            <small>{callData ? `Calling ${callData.name}...` : 'Starting new voice call...'}</small>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-end-call" onClick={onClose}>End Call</button>
        </div>
      </div>
    </div>
  );
};

const CallHistory = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);

  // Call Data
  const callsData = [
    {
      id: 1,
      name: "Dr. Priya Sharma",
      type: "video",
      status: "outgoing",
      date: "Today",
      time: "10:30 AM",
      duration: "25:30",
      profilePic: "👩‍⚕️",
      phoneNumber: "+91 98765 43210",
      missed: false
    },
    {
      id: 2,
      name: "Dr. Rajesh Kumar",
      type: "voice",
      status: "incoming",
      date: "Today",
      time: "09:15 AM",
      duration: "15:20",
      profilePic: "👨‍⚕️",
      phoneNumber: "+91 98765 43211",
      missed: false
    },
    {
      id: 3,
      name: "Dr. Sneha Patel",
      type: "video",
      status: "missed",
      date: "Yesterday",
      time: "06:45 PM",
      duration: null,
      profilePic: "👩‍⚕️",
      phoneNumber: "+91 98765 43212",
      missed: true
    },
    {
      id: 4,
      name: "Dr. Amit Verma",
      type: "voice",
      status: "outgoing",
      date: "Yesterday",
      time: "03:20 PM",
      duration: "12:15",
      profilePic: "👨‍⚕️",
      phoneNumber: "+91 98765 43213",
      missed: false
    },
    {
      id: 5,
      name: "Dr. Neha Gupta",
      type: "video",
      status: "incoming",
      date: "19 Feb",
      time: "11:00 AM",
      duration: "32:10",
      profilePic: "👩‍⚕️",
      phoneNumber: "+91 98765 43214",
      missed: false
    },
    {
      id: 6,
      name: "Dr. Vikram Singh",
      type: "voice",
      status: "missed",
      date: "18 Feb",
      time: "02:15 PM",
      duration: null,
      profilePic: "👨‍⚕️",
      phoneNumber: "+91 98765 43215",
      missed: true
    },
    {
      id: 7,
      name: "Dr. Anjali Mehta",
      type: "video",
      status: "outgoing",
      date: "17 Feb",
      time: "11:45 AM",
      duration: "18:45",
      profilePic: "👩‍⚕️",
      phoneNumber: "+91 98765 43216",
      missed: false
    }
  ];

  // Filter calls
  const filteredCalls = callsData.filter(call => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'missed') return call.missed;
    if (activeFilter === 'video') return call.type === 'video';
    if (activeFilter === 'voice') return call.type === 'voice';
    return true;
  }).filter(call => 
    call.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group calls by date
  const groupedCalls = filteredCalls.reduce((groups, call) => {
    const date = call.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(call);
    return groups;
  }, {});

  // Open appropriate modal based on call type
  const openCallModal = (call) => {
    setSelectedCall(call);
    if (call.type === 'video') {
      setIsVideoModalOpen(true);
    } else {
      setIsVoiceModalOpen(true);
    }
  };

  // Open new call modals
  const openNewVideoCall = () => {
    setSelectedCall(null);
    setIsVideoModalOpen(true);
  };

  const openNewVoiceCall = () => {
    setSelectedCall(null);
    setIsVoiceModalOpen(true);
  };

  // Get icon for call type
  const getCallIcon = (type) => {
    return type === 'video' ? '📹' : '📞';
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch(status) {
      case 'incoming': return '📥';
      case 'outgoing': return '📤';
      case 'missed': return '❌';
      default: return '📤';
    }
  };

  return (
    <div className="call-history-container">
      {/* Fixed Header Section */}
      <div className="call-history-header-fixed">
        <div className="call-header">
          <h2 className="call-title">Call History</h2>
          <div className="call-header-actions">
            <button 
              className="call-icon-btn" 
              onClick={openNewVoiceCall}
              title="New Voice Call"
              aria-label="New Voice Call"
            >
              📞
            </button>
            <button 
              className="call-icon-btn" 
              onClick={openNewVideoCall}
              title="New Video Call"
              aria-label="New Video Call"
            >
              📹
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="call-search">
          <span className="call-search-icon">🔍</span>
          <input
            type="text"
            className="call-search-input"
            placeholder="Search calls..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search calls"
          />
          {searchTerm && (
            <button className="call-clear-btn" onClick={() => setSearchTerm('')} aria-label="Clear search">
              ✕
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="call-filters">
          <button 
            className={`call-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All
          </button>
          <button 
            className={`call-filter-btn ${activeFilter === 'missed' ? 'active' : ''}`}
            onClick={() => setActiveFilter('missed')}
          >
            Missed
          </button>
          <button 
            className={`call-filter-btn ${activeFilter === 'video' ? 'active' : ''}`}
            onClick={() => setActiveFilter('video')}
          >
            Video
          </button>
          <button 
            className={`call-filter-btn ${activeFilter === 'voice' ? 'active' : ''}`}
            onClick={() => setActiveFilter('voice')}
          >
            Voice
          </button>
        </div>
      </div>

      {/* Scrollable Calls List */}
      <div className="calls-list">
        {Object.keys(groupedCalls).map(date => (
          <div key={date} className="call-date-group">
            <div className="call-date-header">
              <span className="call-date">{date}</span>
            </div>
            
            {groupedCalls[date].map(call => (
              <div 
                key={call.id} 
                className={`call-item ${call.missed ? 'missed-call' : ''}`}
                onClick={() => openCallModal(call)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && openCallModal(call)}
              >
                {/* Profile Picture */}
                <div className="call-avatar">
                  <span className="call-avatar-emoji">{call.profilePic}</span>
                </div>

                {/* Call Info */}
                <div className="call-info">
                  <div className="call-name-row">
                    <span className="call-name">{call.name}</span>
                    <span className="call-time">{call.time}</span>
                  </div>
                  
                  <div className="call-details">
                    <span className="call-status-icon">
                      {getStatusIcon(call.status)}
                    </span>
                    <span className="call-type-icon">
                      {getCallIcon(call.type)}
                    </span>
                    <span className="call-type">
                      {call.type === 'video' ? 'Video Call' : 'Voice Call'}
                    </span>
                    {call.duration && (
                      <>
                        <span className="call-dot">•</span>
                        <span>{call.duration}</span>
                      </>
                    )}
                    {call.missed && (
                      <span className="call-missed-tag">Missed</span>
                    )}
                  </div>
                </div>

                {/* Call Action Button */}
                <button 
                  className="call-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    openCallModal(call);
                  }}
                  aria-label={`Call ${call.name}`}
                >
                  {getCallIcon(call.type)}
                </button>
              </div>
            ))}
          </div>
        ))}

        {/* No Results */}
        {filteredCalls.length === 0 && (
          <div className="call-no-results">
            <span className="call-no-results-icon">📞</span>
            <p>No calls found</p>
            <small>Try changing your search or filter</small>
          </div>
        )}
      </div>

      {/* Modals */}
      <VideoCallModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        callData={selectedCall}
      />

      <VoiceCallModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        callData={selectedCall}
      />
    </div>
  );
};

export default CallHistory;