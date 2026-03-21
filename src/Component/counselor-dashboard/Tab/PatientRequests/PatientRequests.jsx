// PatientRequests.jsx
import React, { useState } from 'react';
import './PatientRequests.css';

const PatientRequests = () => {
  // Sample patient requests data
  const [patients, setPatients] = useState([
    {
      id: 'PT001',
      name: 'Rahul Sharma',
      age: 28,
      gender: 'Male',
      issue: 'Anxiety and Stress',
      requestedDate: '2024-01-15',
      status: 'pending',
      priority: 'high',
      contact: '+91 98765 43210'
    },
    {
      id: 'PT002',
      name: 'Priya Patel',
      age: 32,
      gender: 'Female',
      issue: 'Depression',
      requestedDate: '2024-01-14',
      status: 'pending',
      priority: 'medium',
      contact: '+91 98765 43211'
    },
    {
      id: 'PT003',
      name: 'Amit Kumar',
      age: 45,
      gender: 'Male',
      issue: 'Work-life balance',
      requestedDate: '2024-01-14',
      status: 'pending',
      priority: 'low',
      contact: '+91 98765 43212'
    },
    {
      id: 'PT004',
      name: 'Neha Singh',
      age: 24,
      gender: 'Female',
      issue: 'Relationship counseling',
      requestedDate: '2024-01-13',
      status: 'pending',
      priority: 'high',
      contact: '+91 98765 43213'
    }
  ]);

  const [filter, setFilter] = useState('all');

  // Handle accept request
  const handleAccept = (patientId) => {
    setPatients(prevPatients =>
      prevPatients.map(patient =>
        patient.id === patientId
          ? { ...patient, status: 'accepted' }
          : patient
      )
    );
    alert(`Patient ${patientId} has been accepted successfully!`);
  };

  // Handle cancel request
  const handleCancel = (patientId) => {
    setPatients(prevPatients =>
      prevPatients.map(patient =>
        patient.id === patientId
          ? { ...patient, status: 'cancelled' }
          : patient
      )
    );
    alert(`Patient ${patientId} has been cancelled.`);
  };

  // Filter patients based on status
  const filteredPatients = patients.filter(patient => {
    if (filter === 'all') return true;
    return patient.status === filter;
  });

  // Get status class name
  const getStatusClassName = (status) => {
    switch(status) {
      case 'pending': return 'status-pending';
      case 'accepted': return 'status-accepted';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  // Get priority class name
  const getPriorityClassName = (priority) => {
    return `priority-${priority}`;
  };

  return (
    <div className="counselor-container">
      {/* Header Section */}
      <header className="counselor-header">
        <h1 className="counselor-title">Patient Requests Dashboard</h1>
        <div className="counselor-stats">
          <div className="stat-box stat-pending">
            <span className="stat-label">Pending</span>
            <span className="stat-value">{patients.filter(p => p.status === 'pending').length}</span>
          </div>
          <div className="stat-box stat-accepted">
            <span className="stat-label">Accepted</span>
            <span className="stat-value">{patients.filter(p => p.status === 'accepted').length}</span>
          </div>
          <div className="stat-box stat-cancelled">
            <span className="stat-label">Cancelled</span>
            <span className="stat-value">{patients.filter(p => p.status === 'cancelled').length}</span>
          </div>
        </div>
      </header>

      {/* Filter Section */}
      <div className="filter-section">
        <label className="filter-label">Filter by status:</label>
        <select 
          className="filter-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Patients</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Patients Grid */}
      <div className="patients-grid">
        {filteredPatients.length > 0 ? (
          filteredPatients.map((patient) => (
            <div 
              key={patient.id} 
              className={`patient-card patient-card-${patient.id.toLowerCase()}`}
            >
              {/* Patient Header with ID */}
              <div className="patient-header">
                <div className="patient-id-section">
                  <span className="patient-id-label">Patient Code:</span>
                  <span className="patient-id-value patient-id-{patient.id}">{patient.id}</span>
                </div>
                <span className={`priority-badge ${getPriorityClassName(patient.priority)}`}>
                  {patient.priority} priority
                </span>
              </div>

              {/* Patient Details */}
              <div className="patient-details">
                <h3 className="patient-name patient-name-{patient.id}">{patient.name}</h3>
                
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Age/Gender:</span>
                    <span className="info-value">{patient.age} yrs, {patient.gender}</span>
                  </div>
                  
                  <div className="info-item">
                    <span className="info-label">Issue:</span>
                    <span className="info-value">{patient.issue}</span>
                  </div>
                  
                  <div className="info-item">
                    <span className="info-label">Requested:</span>
                    <span className="info-value">{patient.requestedDate}</span>
                  </div>
                  
                  <div className="info-item">
                    <span className="info-label">Contact:</span>
                    <span className="info-value">{patient.contact}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className={`status-badge ${getStatusClassName(patient.status)}`}>
                  {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                </div>
              </div>

              {/* Action Buttons - Show only for pending requests */}
              {patient.status === 'pending' && (
                <div className="action-buttons">
                  <button 
                    className="btn-accept"
                    onClick={() => handleAccept(patient.id)}
                  >
                    ✓ Accept Request
                  </button>
                  <button 
                    className="btn-cancel"
                    onClick={() => handleCancel(patient.id)}
                  >
                    ✕ Cancel Request
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="no-patients">
            <p>No patients found with the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientRequests;