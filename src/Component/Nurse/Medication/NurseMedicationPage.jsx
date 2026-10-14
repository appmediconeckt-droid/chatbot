import React, { useState, useEffect } from 'react';
import './NurseMedicationPage.css';

const NurseMedicationPage = () => {
  // Initial medication data
  const initialMedications = [
    {
      id: 1,
      name: 'Paracetamol',
      dose: '500mg',
      timing: ['Morning', 'Night'],
      route: 'Oral',
      status: 'Given',
      lastGiven: '2024-01-19 08:30',
      nextDose: '2024-01-19 20:30',
      patient: 'John Doe (Room 101)',
      remarks: 'No adverse reactions'
    },
    {
      id: 2,
      name: 'Amoxicillin',
      dose: '250mg',
      timing: ['Morning', 'Afternoon', 'Night'],
      route: 'Oral',
      status: 'Pending',
      lastGiven: '2024-01-19 08:00',
      nextDose: '2024-01-19 14:00',
      patient: 'Sarah Smith (Room 203)',
      remarks: 'Monitor for allergic reactions'
    },
    {
      id: 3,
      name: 'Insulin',
      dose: '10 units',
      timing: ['Morning'],
      route: 'Injection',
      status: 'Missed',
      lastGiven: '2024-01-18 08:15',
      nextDose: '2024-01-19 08:15',
      patient: 'Robert Johnson (Room 305)',
      remarks: 'Patient refused morning dose'
    },
    {
      id: 4,
      name: 'Morphine',
      dose: '2mg',
      timing: ['Afternoon', 'Night'],
      route: 'IV',
      status: 'Given',
      lastGiven: '2024-01-19 12:00',
      nextDose: '2024-01-19 20:00',
      patient: 'Emma Wilson (Room 402)',
      remarks: 'Patient reported pain relief'
    },
    {
      id: 5,
      name: 'Lisinopril',
      dose: '5mg',
      timing: ['Morning'],
      route: 'Oral',
      status: 'Pending',
      lastGiven: '2024-01-19 07:45',
      nextDose: '2024-01-20 07:45',
      patient: 'Michael Brown (Room 108)',
      remarks: 'Monitor BP regularly'
    }
  ];

  const [medications, setMedications] = useState(initialMedications);
  const [filter, setFilter] = useState('all'); // all, given, pending, missed
  const [searchTerm, setSearchTerm] = useState('');
  const [newMedication, setNewMedication] = useState({
    name: '',
    dose: '',
    timing: [],
    route: 'Oral',
    patient: '',
    remarks: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Filter medications based on status and search term
  const filteredMedications = medications.filter(med => {
    const matchesStatus = filter === 'all' || med.status.toLowerCase() === filter;
    const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         med.patient.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Handle status change
  const handleStatusChange = (id, newStatus) => {
    const updatedMedications = medications.map(med => {
      if (med.id === id) {
        const updatedMed = { ...med, status: newStatus };
        
        if (newStatus === 'Given') {
          updatedMed.lastGiven = currentTime.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
          
          // Calculate next dose based on timing
          const nextTime = calculateNextDose(med.timing);
          updatedMed.nextDose = nextTime;
        }
        
        return updatedMed;
      }
      return med;
    });
    
    setMedications(updatedMedications);
  };

  // Calculate next dose time
  const calculateNextDose = (timing) => {
    const now = currentTime.getHours();
    let nextTime = '';
    
    if (timing.includes('Morning') && now < 12) {
      nextTime = 'Today 12:00';
    } else if (timing.includes('Afternoon') && now < 17) {
      nextTime = 'Today 17:00';
    } else if (timing.includes('Night')) {
      nextTime = 'Today 20:00';
    } else {
      nextTime = 'Tomorrow 08:00';
    }
    
    return nextTime;
  };

  // Handle timing selection for new medication
  const handleTimingChange = (time) => {
    const updatedTiming = newMedication.timing.includes(time)
      ? newMedication.timing.filter(t => t !== time)
      : [...newMedication.timing, time];
    
    setNewMedication({...newMedication, timing: updatedTiming});
  };

  // Add new medication
  const handleAddMedication = () => {
    if (!newMedication.name || !newMedication.dose || newMedication.timing.length === 0 || !newMedication.patient) {
      alert('Please fill in all required fields');
      return;
    }
    
    const newMed = {
      id: medications.length + 1,
      name: newMedication.name,
      dose: newMedication.dose,
      timing: newMedication.timing,
      route: newMedication.route,
      status: 'Pending',
      lastGiven: 'Not given yet',
      nextDose: calculateNextDose(newMedication.timing),
      patient: newMedication.patient,
      remarks: newMedication.remarks
    };
    
    setMedications([...medications, newMed]);
    setNewMedication({
      name: '',
      dose: '',
      timing: [],
      route: 'Oral',
      patient: '',
      remarks: ''
    });
    setShowAddForm(false);
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch(status.toLowerCase()) {
      case 'given': return 'nurse-med-status-given';
      case 'pending': return 'nurse-med-status-pending';
      case 'missed': return 'nurse-med-status-missed';
      default: return '';
    }
  };

  // Get route badge class
  const getRouteClass = (route) => {
    switch(route.toLowerCase()) {
      case 'oral': return 'nurse-med-route-oral';
      case 'iv': return 'nurse-med-route-iv';
      case 'injection': return 'nurse-med-route-injection';
      default: return '';
    }
  };

  // Format time display
  const formatTimeDisplay = (timingArray) => {
    return timingArray.join(' / ');
  };

  return (
    <div className="nurse-medication-container">
      <div className="nurse-medication-header">
        <h1 className="nurse-medication-title">Nurse Medication Management</h1>
        <div className="nurse-current-time">
          Current Time: {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </div>
      </div>

      <div className="nurse-medication-controls">
        <div className="nurse-search-box">
          <input
            type="text"
            placeholder="Search by medication or patient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="nurse-search-input"
          />
          <i className="fas fa-search nurse-search-icon"></i>
        </div>

        <div className="nurse-filter-buttons">
          <button 
            className={`nurse-filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Medications
          </button>
          <button 
            className={`nurse-filter-btn ${filter === 'given' ? 'active' : ''}`}
            onClick={() => setFilter('given')}
          >
            Given ✔
          </button>
          <button 
            className={`nurse-filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ⏳
          </button>
          <button 
            className={`nurse-filter-btn ${filter === 'missed' ? 'active' : ''}`}
            onClick={() => setFilter('missed')}
          >
            Missed ⚠
          </button>
        </div>

        <button 
          className="nurse-add-med-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <i className="fas fa-plus"></i> Add New Medication
        </button>
      </div>

      {showAddForm && (
        <div className="nurse-add-medication-form">
          <h3 className="nurse-form-title">Add New Medication</h3>
          <div className="nurse-form-grid">
            <div className="nurse-form-group">
              <label>Medication Name *</label>
              <input
                type="text"
                value={newMedication.name}
                onChange={(e) => setNewMedication({...newMedication, name: e.target.value})}
                placeholder="e.g., Paracetamol"
              />
            </div>
            
            <div className="nurse-form-group">
              <label>Dose *</label>
              <input
                type="text"
                value={newMedication.dose}
                onChange={(e) => setNewMedication({...newMedication, dose: e.target.value})}
                placeholder="e.g., 500mg"
              />
            </div>
            
            <div className="nurse-form-group">
              <label>Timing *</label>
              <div className="nurse-timing-options">
                {['Morning', 'Afternoon', 'Night'].map(time => (
                  <button
                    key={time}
                    type="button"
                    className={`nurse-timing-btn ${newMedication.timing.includes(time) ? 'selected' : ''}`}
                    onClick={() => handleTimingChange(time)}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="nurse-form-group">
              <label>Route *</label>
              <select
                value={newMedication.route}
                onChange={(e) => setNewMedication({...newMedication, route: e.target.value})}
              >
                <option value="Oral">Oral</option>
                <option value="IV">IV</option>
                <option value="Injection">Injection</option>
              </select>
            </div>
            
            <div className="nurse-form-group">
              <label>Patient Name & Room *</label>
              <input
                type="text"
                value={newMedication.patient}
                onChange={(e) => setNewMedication({...newMedication, patient: e.target.value})}
                placeholder="e.g., John Doe (Room 101)"
              />
            </div>
            
            <div className="nurse-form-group">
              <label>Remarks / Special Instructions</label>
              <textarea
                value={newMedication.remarks}
                onChange={(e) => setNewMedication({...newMedication, remarks: e.target.value})}
                placeholder="Any special notes or precautions..."
                rows="3"
              />
            </div>
          </div>
          
          <div className="nurse-form-actions">
            <button 
              className="nurse-form-cancel-btn"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </button>
            <button 
              className="nurse-form-submit-btn"
              onClick={handleAddMedication}
            >
              Add Medication
            </button>
          </div>
        </div>
      )}

      <div className="nurse-medication-stats">
        <div className="nurse-stat-card">
          <div className="nurse-stat-icon given">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="nurse-stat-info">
            <h3>{medications.filter(m => m.status === 'Given').length}</h3>
            <p>Given Today</p>
          </div>
        </div>
        
        <div className="nurse-stat-card">
          <div className="nurse-stat-icon pending">
            <i className="fas fa-clock"></i>
          </div>
          <div className="nurse-stat-info">
            <h3>{medications.filter(m => m.status === 'Pending').length}</h3>
            <p>Pending</p>
          </div>
        </div>
        
        <div className="nurse-stat-card">
          <div className="nurse-stat-icon missed">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div className="nurse-stat-info">
            <h3>{medications.filter(m => m.status === 'Missed').length}</h3>
            <p>Missed</p>
          </div>
        </div>
        
        <div className="nurse-stat-card">
          <div className="nurse-stat-icon total">
            <i className="fas fa-pills"></i>
          </div>
          <div className="nurse-stat-info">
            <h3>{medications.length}</h3>
            <p>Total Medications</p>
          </div>
        </div>
      </div>

      <div className="nurse-medication-table-container">
        <table className="nurse-medication-table">
          <thead>
            <tr>
              <th>Medication</th>
              <th>Dose</th>
              <th>Timing</th>
              <th>Route</th>
              <th>Patient</th>
              <th>Status</th>
              <th>Last Given</th>
              <th>Next Dose</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMedications.map(med => (
              <tr key={med.id} className="nurse-medication-row">
                <td>
                  <div className="nurse-med-name">{med.name}</div>
                  {med.remarks && (
                    <div className="nurse-med-remarks">
                      <i className="fas fa-sticky-note"></i> {med.remarks}
                    </div>
                  )}
                </td>
                <td>
                  <span className="nurse-med-dose">{med.dose}</span>
                </td>
                <td>
                  <div className="nurse-med-timing">
                    {formatTimeDisplay(med.timing)}
                  </div>
                </td>
                <td>
                  <span className={`nurse-med-route ${getRouteClass(med.route)}`}>
                    {med.route}
                  </span>
                </td>
                <td>
                  <div className="nurse-med-patient">{med.patient}</div>
                </td>
                <td>
                  <span className={`nurse-med-status ${getStatusClass(med.status)}`}>
                    {med.status === 'Given' && <i className="fas fa-check"></i>}
                    {med.status === 'Pending' && <i className="fas fa-clock"></i>}
                    {med.status === 'Missed' && <i className="fas fa-exclamation-triangle"></i>}
                    {med.status}
                  </span>
                </td>
                <td>
                  <div className="nurse-med-last-given">{med.lastGiven}</div>
                </td>
                <td>
                  <div className="nurse-med-next-dose">{med.nextDose}</div>
                </td>
                <td>
                  <div className="nurse-med-actions">
                    {med.status !== 'Given' && (
                      <button 
                        className="nurse-action-btn give-btn"
                        onClick={() => handleStatusChange(med.id, 'Given')}
                        title="Mark as Given"
                      >
                        <i className="fas fa-check"></i> Give
                      </button>
                    )}
                    
                    {med.status !== 'Missed' && (
                      <button 
                        className="nurse-action-btn miss-btn"
                        onClick={() => handleStatusChange(med.id, 'Missed')}
                        title="Mark as Missed"
                      >
                        <i className="fas fa-times"></i> Miss
                      </button>
                    )}
                    
                    <button 
                      className="nurse-action-btn edit-btn"
                      title="Edit Remarks"
                      onClick={() => {
                        const newRemarks = prompt('Enter new remarks:', med.remarks);
                        if (newRemarks !== null) {
                          const updatedMeds = medications.map(m => 
                            m.id === med.id ? {...m, remarks: newRemarks} : m
                          );
                          setMedications(updatedMeds);
                        }
                      }}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredMedications.length === 0 && (
          <div className="nurse-no-medications">
            <i className="fas fa-clipboard-list"></i>
            <p>No medications found matching your criteria</p>
          </div>
        )}
      </div>

      <div className="nurse-medication-alerts">
        <h3 className="nurse-alerts-title">
          <i className="fas fa-bell"></i> Medication Alerts
        </h3>
        <div className="nurse-alerts-list">
          {medications
            .filter(med => med.status === 'Pending' || med.status === 'Missed')
            .map(med => (
              <div key={`alert-${med.id}`} className="nurse-alert-item">
                <div className="nurse-alert-icon">
                  {med.status === 'Missed' ? (
                    <i className="fas fa-exclamation-circle missed-alert"></i>
                  ) : (
                    <i className="fas fa-clock pending-alert"></i>
                  )}
                </div>
                <div className="nurse-alert-info">
                  <div className="nurse-alert-med">{med.name} - {med.dose}</div>
                  <div className="nurse-alert-patient">{med.patient}</div>
                  <div className="nurse-alert-time">
                    {med.status === 'Missed' ? 'Missed dose' : 'Due'} - {med.timing.join(', ')}
                  </div>
                </div>
                <div className="nurse-alert-actions">
                  {med.status === 'Pending' && (
                    <button 
                      className="nurse-alert-action-btn"
                      onClick={() => handleStatusChange(med.id, 'Given')}
                    >
                      Mark Given
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default NurseMedicationPage;