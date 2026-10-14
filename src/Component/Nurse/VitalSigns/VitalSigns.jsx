import React, { useState, useEffect } from 'react';
import './VitalSigns.css';

const VitalSignsDashboard = () => {
  // Initial patient data
  const initialPatients = [
    {
      id: 1,
      name: 'John Smith',
      age: 65,
      gender: 'Male',
      room: '301A',
      diagnosis: 'Hypertension',
      admissionDate: '2023-10-10',
      doctor: 'Dr. Sharma',
      nurse: 'Nurse Priya',
      vitalSigns: {
        temperature: 98.6,
        heartRate: 72,
        bloodPressure: '120/80',
        respiratoryRate: 16,
        oxygenSaturation: 98,
        bloodGlucose: 110,
        painLevel: 2,
        weight: 75,
        height: 175
      },
      lastUpdated: '2023-10-15 09:30 AM',
      status: 'stable',
      notes: 'Patient responding well to medication.'
    },
    {
      id: 2,
      name: 'Maria Garcia',
      age: 58,
      gender: 'Female',
      room: '305B',
      diagnosis: 'Type 2 Diabetes',
      admissionDate: '2023-10-12',
      doctor: 'Dr. Verma',
      nurse: 'Nurse Sunita',
      vitalSigns: {
        temperature: 99.1,
        heartRate: 85,
        bloodPressure: '135/88',
        respiratoryRate: 18,
        oxygenSaturation: 96,
        bloodGlucose: 185,
        painLevel: 4,
        weight: 68,
        height: 162
      },
      lastUpdated: '2023-10-15 10:15 AM',
      status: 'monitoring',
      notes: 'Blood sugar levels need monitoring.'
    },
    {
      id: 3,
      name: 'Robert Johnson',
      age: 72,
      gender: 'Male',
      room: '310C',
      diagnosis: 'COPD',
      admissionDate: '2023-10-08',
      doctor: 'Dr. Kumar',
      nurse: 'Nurse Reena',
      vitalSigns: {
        temperature: 98.9,
        heartRate: 92,
        bloodPressure: '142/90',
        respiratoryRate: 22,
        oxygenSaturation: 92,
        bloodGlucose: 120,
        painLevel: 3,
        weight: 80,
        height: 180
      },
      lastUpdated: '2023-10-15 08:45 AM',
      status: 'critical',
      notes: 'Requires oxygen support frequently.'
    },
    {
      id: 4,
      name: 'Sarah Williams',
      age: 45,
      gender: 'Female',
      room: '302D',
      diagnosis: 'Post-op Recovery',
      admissionDate: '2023-10-13',
      doctor: 'Dr. Patel',
      nurse: 'Nurse Kavita',
      vitalSigns: {
        temperature: 100.2,
        heartRate: 78,
        bloodPressure: '118/76',
        respiratoryRate: 20,
        oxygenSaturation: 97,
        bloodGlucose: 95,
        painLevel: 6,
        weight: 62,
        height: 168
      },
      lastUpdated: '2023-10-15 11:00 AM',
      status: 'monitoring',
      notes: 'Post-surgery recovery progressing.'
    },
    {
      id: 5,
      name: 'David Brown',
      age: 52,
      gender: 'Male',
      room: '308E',
      diagnosis: 'Pneumonia',
      admissionDate: '2023-10-14',
      doctor: 'Dr. Singh',
      nurse: 'Nurse Meena',
      vitalSigns: {
        temperature: 101.5,
        heartRate: 95,
        bloodPressure: '130/85',
        respiratoryRate: 24,
        oxygenSaturation: 94,
        bloodGlucose: 130,
        painLevel: 5,
        weight: 85,
        height: 178
      },
      lastUpdated: '2023-10-15 09:15 AM',
      status: 'critical',
      notes: 'High fever, requires monitoring.'
    },
    {
      id: 6,
      name: 'Lisa Anderson',
      age: 38,
      gender: 'Female',
      room: '304F',
      diagnosis: 'Appendicitis',
      admissionDate: '2023-10-15',
      doctor: 'Dr. Gupta',
      nurse: 'Nurse Anjali',
      vitalSigns: {
        temperature: 99.8,
        heartRate: 88,
        bloodPressure: '125/82',
        respiratoryRate: 19,
        oxygenSaturation: 98,
        bloodGlucose: 105,
        painLevel: 7,
        weight: 58,
        height: 165
      },
      lastUpdated: '2023-10-15 10:45 AM',
      status: 'monitoring',
      notes: 'Scheduled for surgery tomorrow.'
    }
  ];

  const [patients, setPatients] = useState(initialPatients);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingPatient, setIsAddingPatient] = useState(false); // New state for add patient modal
  const [editedVitals, setEditedVitals] = useState({});
  const [view, setView] = useState('list'); // 'list' or 'vitals'
  
  // New patient form state
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: '',
    gender: 'Male',
    room: '',
    diagnosis: '',
    admissionDate: new Date().toISOString().split('T')[0],
    doctor: '',
    nurse: '',
    vitalSigns: {
      temperature: 98.6,
      heartRate: 72,
      bloodPressure: '120/80',
      respiratoryRate: 16,
      oxygenSaturation: 98,
      bloodGlucose: 110,
      painLevel: 0,
      weight: 70,
      height: 170
    },
    notes: ''
  });
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  // Handle patient selection
  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setView('vitals');
  };

  // Handle back to list
  const handleBackToList = () => {
    setView('list');
    setSelectedPatient(null);
  };

  // Handle editing vital signs
  const handleEditClick = () => {
    setEditedVitals({...selectedPatient.vitalSigns});
    setIsEditing(true);
  };

  const handleSaveVitals = () => {
    const updatedPatients = patients.map(patient => {
      if (patient.id === selectedPatient.id) {
        const updatedPatient = {
          ...patient,
          vitalSigns: editedVitals,
          lastUpdated: new Date().toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          status: calculateStatus(editedVitals)
        };
        setSelectedPatient(updatedPatient);
        return updatedPatient;
      }
      return patient;
    });
    
    setPatients(updatedPatients);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleVitalChange = (field, value) => {
    setEditedVitals(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle add patient
  const handleAddPatientClick = () => {
    setIsAddingPatient(true);
  };

  const handleNewPatientChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setNewPatient(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setNewPatient(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSaveNewPatient = () => {
    // Validate required fields
    if (!newPatient.name || !newPatient.age || !newPatient.room || !newPatient.diagnosis) {
      alert('Please fill all required fields!');
      return;
    }

    const newId = Math.max(...patients.map(p => p.id)) + 1;
    const currentDateTime = new Date().toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const patientToAdd = {
      id: newId,
      name: newPatient.name,
      age: parseInt(newPatient.age),
      gender: newPatient.gender,
      room: newPatient.room,
      diagnosis: newPatient.diagnosis,
      admissionDate: newPatient.admissionDate,
      doctor: newPatient.doctor || 'To be assigned',
      nurse: newPatient.nurse || 'To be assigned',
      vitalSigns: {
        temperature: parseFloat(newPatient.vitalSigns.temperature),
        heartRate: parseInt(newPatient.vitalSigns.heartRate),
        bloodPressure: newPatient.vitalSigns.bloodPressure,
        respiratoryRate: parseInt(newPatient.vitalSigns.respiratoryRate),
        oxygenSaturation: parseInt(newPatient.vitalSigns.oxygenSaturation),
        bloodGlucose: parseInt(newPatient.vitalSigns.bloodGlucose),
        painLevel: parseInt(newPatient.vitalSigns.painLevel),
        weight: parseFloat(newPatient.vitalSigns.weight),
        height: parseFloat(newPatient.vitalSigns.height)
      },
      lastUpdated: currentDateTime,
      status: calculateStatus(newPatient.vitalSigns),
      notes: newPatient.notes || 'New patient admitted'
    };

    setPatients([...patients, patientToAdd]);
    setIsAddingPatient(false);
    
    // Reset form
    setNewPatient({
      name: '',
      age: '',
      gender: 'Male',
      room: '',
      diagnosis: '',
      admissionDate: new Date().toISOString().split('T')[0],
      doctor: '',
      nurse: '',
      vitalSigns: {
        temperature: 98.6,
        heartRate: 72,
        bloodPressure: '120/80',
        respiratoryRate: 16,
        oxygenSaturation: 98,
        bloodGlucose: 110,
        painLevel: 0,
        weight: 70,
        height: 170
      },
      notes: ''
    });
  };

  const handleCancelAddPatient = () => {
    setIsAddingPatient(false);
    setNewPatient({
      name: '',
      age: '',
      gender: 'Male',
      room: '',
      diagnosis: '',
      admissionDate: new Date().toISOString().split('T')[0],
      doctor: '',
      nurse: '',
      vitalSigns: {
        temperature: 98.6,
        heartRate: 72,
        bloodPressure: '120/80',
        respiratoryRate: 16,
        oxygenSaturation: 98,
        bloodGlucose: 110,
        painLevel: 0,
        weight: 70,
        height: 170
      },
      notes: ''
    });
  };

  // Calculate patient status based on vital signs
  const calculateStatus = (vitals) => {
    const { heartRate, bloodPressure, oxygenSaturation, temperature } = vitals;
    
    const [systolic, diastolic] = bloodPressure.split('/').map(Number);
    
    if (oxygenSaturation < 92 || heartRate > 120 || heartRate < 50 || temperature > 102) {
      return 'critical';
    } else if (oxygenSaturation < 95 || heartRate > 100 || systolic > 160 || diastolic > 100 || temperature > 100.4) {
      return 'monitoring';
    } else {
      return 'stable';
    }
  };

  // Filter and sort patients
  const filteredPatients = patients.filter(patient => {
    const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  }).sort((a, b) => {
    switch(sortBy) {
      case 'name': return a.name.localeCompare(b.name);
      case 'room': return a.room.localeCompare(b.room);
      case 'status': return a.status.localeCompare(b.status);
      case 'age': return a.age - b.age;
      default: return 0;
    }
  });

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'stable': return 'patient-status-badge stable';
      case 'monitoring': return 'patient-status-badge monitoring';
      case 'critical': return 'patient-status-badge critical';
      default: return 'patient-status-badge';
    }
  };

  // Get vital sign indicator color
  const getVitalColor = (type, value) => {
    if (type === 'temperature') {
      if (value > 100.4) return 'vital-value-high';
      if (value < 97) return 'vital-value-low';
      return 'vital-value-normal';
    }
    
    if (type === 'heartRate') {
      if (value > 100 || value < 60) return 'vital-value-high';
      return 'vital-value-normal';
    }
    
    if (type === 'bloodPressure') {
      const [systolic, diastolic] = value.split('/').map(Number);
      if (systolic > 140 || diastolic > 90) return 'vital-value-high';
      if (systolic < 90 || diastolic < 60) return 'vital-value-low';
      return 'vital-value-normal';
    }
    
    if (type === 'oxygenSaturation') {
      if (value < 92) return 'vital-value-critical';
      if (value < 95) return 'vital-value-high';
      return 'vital-value-normal';
    }
    
    if (type === 'bloodGlucose') {
      if (value > 180 || value < 70) return 'vital-value-high';
      return 'vital-value-normal';
    }
    
    if (type === 'painLevel') {
      if (value >= 7) return 'vital-value-critical';
      if (value >= 4) return 'vital-value-high';
      return 'vital-value-normal';
    }
    
    return 'vital-value-normal';
  };

  // Calculate BMI
  const calculateBMI = (weight, height) => {
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return bmi.toFixed(1);
  };

  // Get BMI category
  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  return (
    <div className="nurse-vital-dashboard">
      {/* Header */}
      <div className="vital-header">
        <h1 className="dashboard-title">
          Vital Signs Dashboard
        </h1>
      </div>

      {/* Main Content */}
      {view === 'list' ? (
        <>
          {/* Controls */}
          <div className="dashboard-controls">
            <div className="controls-left">
              <div className="search-container">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search patients by name, room, or diagnosis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="filter-container">
                <span className="filter-label">Status:</span>
                <div className="filter-buttons">
                  <button 
                    className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('all')}
                  >
                    All ({patients.length})
                  </button>
                  <button 
                    className={`filter-btn ${statusFilter === 'stable' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('stable')}
                  >
                    Stable ({patients.filter(p => p.status === 'stable').length})
                  </button>
                  <button 
                    className={`filter-btn ${statusFilter === 'monitoring' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('monitoring')}
                  >
                    Monitoring ({patients.filter(p => p.status === 'monitoring').length})
                  </button>
                  <button 
                    className={`filter-btn ${statusFilter === 'critical' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('critical')}
                  >
                    Critical ({patients.filter(p => p.status === 'critical').length})
                  </button>
                </div>
              </div>
            </div>
            
            <div className="controls-right">
              <div className="sort-container">
                <span className="sort-label">Sort by:</span>
                <select 
                  className="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="name">Name</option>
                  <option value="room">Room</option>
                  <option value="status">Status</option>
                  <option value="age">Age</option>
                </select>
              </div>
              <button className="add-patient-btn" onClick={handleAddPatientClick}>
                <i className="fas fa-plus"></i> Add Patient
              </button>
            </div>
          </div>

          {/* Patient List */}
          <div className="patient-list-container">
            <div className="patient-list-header">
              <h2><i className="fas fa-procedures"></i> Patient List ({filteredPatients.length})</h2>
              <div className="list-stats">
                <span className="stat-item">
                  <i className="fas fa-bed"></i> Total Beds: 6
                </span>
                <span className="stat-item">
                  <i className="fas fa-user-injured"></i> Occupied: {patients.length}
                </span>
              </div>
            </div>
            
            <div className="patient-list">
              {filteredPatients.map(patient => (
                <div 
                  key={patient.id} 
                  className="patient-list-item"
                  onClick={() => handlePatientSelect(patient)}
                >
                  <div className="patient-basic-info">
                    <div className="patient-name-room">
                      <h3>{patient.name}</h3>
                      <span className="patient-room">Room: {patient.room}</span>
                    </div>
                    <div className={getStatusBadgeClass(patient.status)}>
                      {patient.status.toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="patient-details-row">
                    <div className="detail-item">
                      <i className="fas fa-user"></i>
                      <span>{patient.age}y, {patient.gender}</span>
                    </div>
                    <div className="detail-item">
                      <i className="fas fa-stethoscope"></i>
                      <span>{patient.diagnosis}</span>
                    </div>
                    <div className="detail-item">
                      <i className="fas fa-user-md"></i>
                      <span>{patient.doctor}</span>
                    </div>
                    <div className="detail-item">
                      <i className="fas fa-calendar-alt"></i>
                      <span>Admitted: {patient.admissionDate}</span>
                    </div>
                  </div>
                  
                  <div className="patient-vitals-preview">
                    <div className="vital-preview-item">
                      <i className="fas fa-thermometer-half"></i>
                      <span>{patient.vitalSigns.temperature}°F</span>
                    </div>
                    <div className="vital-preview-item">
                      <i className="fas fa-heart"></i>
                      <span>{patient.vitalSigns.heartRate} bpm</span>
                    </div>
                    <div className="vital-preview-item">
                      <i className="fas fa-tachometer-alt"></i>
                      <span>{patient.vitalSigns.bloodPressure}</span>
                    </div>
                    <div className="vital-preview-item">
                      <i className="fas fa-lungs"></i>
                      <span>SpO₂: {patient.vitalSigns.oxygenSaturation}%</span>
                    </div>
                  </div>
                  
                  <div className="patient-footer">
                    <div className="last-updated">
                      <i className="far fa-clock"></i>
                      Last updated: {patient.lastUpdated}
                    </div>
                    <div className="action-buttons">
                      <button className="view-vitals-btn" onClick={(e) => {
                        e.stopPropagation();
                        handlePatientSelect(patient);
                      }}>
                        <i className="fas fa-chart-line"></i> View Vitals
                      </button>
                      <button className="quick-edit-btn" onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPatient(patient);
                        setIsEditing(true);
                      }}>
                        <i className="fas fa-edit"></i> Quick Update
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Vital Signs Detail View */}
          {selectedPatient && (
            <div className="vital-detail-view">
              <div className="detail-header">
                <button className="back-button" onClick={handleBackToList}>
                  <i className="fas fa-arrow-left"></i> Back to Patient List
                </button>
                <div className="patient-header-info">
                  <div>
                    <h2>{selectedPatient.name}'s Vital Signs</h2>
                    <p className="patient-subtitle">
                      {selectedPatient.age}y, {selectedPatient.gender} • Room {selectedPatient.room} • {selectedPatient.diagnosis}
                    </p>
                  </div>
                  <div className={getStatusBadgeClass(selectedPatient.status)}>
                    {selectedPatient.status.toUpperCase()}
                  </div>
                </div>
              </div>
              
              <div className="vital-detail-content">
                {/* Patient Information Card */}
                <div className="patient-info-card">
                  <h3><i className="fas fa-info-circle"></i> Patient Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Admission Date:</span>
                      <span className="info-value">{selectedPatient.admissionDate}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Attending Doctor:</span>
                      <span className="info-value">{selectedPatient.doctor}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Assigned Nurse:</span>
                      <span className="info-value">{selectedPatient.nurse}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Last Updated:</span>
                      <span className="info-value">{selectedPatient.lastUpdated}</span>
                    </div>
                  </div>
                  <div className="patient-notes">
                    <h4>Clinical Notes:</h4>
                    <p>{selectedPatient.notes}</p>
                  </div>
                </div>
                
                {/* Vital Signs Grid */}
                <div className="vital-signs-grid">
                  <h3><i className="fas fa-heartbeat"></i> Vital Signs</h3>
                  
                  <div className="vital-cards-container">
                    {/* Temperature */}
                    <div className="vital-card temperature">
                      <div className="vital-card-header">
                        <i className="fas fa-thermometer-half"></i>
                        <h4>Temperature</h4>
                      </div>
                      <div className={`vital-card-value ${getVitalColor('temperature', selectedPatient.vitalSigns.temperature)}`}>
                        {selectedPatient.vitalSigns.temperature}°F
                      </div>
                      <div className="vital-card-range">
                        Normal: 97°F - 99°F
                      </div>
                    </div>
                    
                    {/* Heart Rate */}
                    <div className="vital-card heart-rate">
                      <div className="vital-card-header">
                        <i className="fas fa-heart"></i>
                        <h4>Heart Rate</h4>
                      </div>
                      <div className={`vital-card-value ${getVitalColor('heartRate', selectedPatient.vitalSigns.heartRate)}`}>
                        {selectedPatient.vitalSigns.heartRate} bpm
                      </div>
                      <div className="vital-card-range">
                        Normal: 60-100 bpm
                      </div>
                    </div>
                    
                    {/* Blood Pressure */}
                    <div className="vital-card blood-pressure">
                      <div className="vital-card-header">
                        <i className="fas fa-tachometer-alt"></i>
                        <h4>Blood Pressure</h4>
                      </div>
                      <div className={`vital-card-value ${getVitalColor('bloodPressure', selectedPatient.vitalSigns.bloodPressure)}`}>
                        {selectedPatient.vitalSigns.bloodPressure}
                      </div>
                      <div className="vital-card-range">
                        Normal: 120/80 mmHg
                      </div>
                    </div>
                    
                    {/* Respiratory Rate */}
                    <div className="vital-card respiratory-rate">
                      <div className="vital-card-header">
                        <i className="fas fa-wind"></i>
                        <h4>Respiratory Rate</h4>
                      </div>
                      <div className="vital-card-value vital-value-normal">
                        {selectedPatient.vitalSigns.respiratoryRate} breaths/min
                      </div>
                      <div className="vital-card-range">
                        Normal: 12-20 breaths/min
                      </div>
                    </div>
                    
                    {/* Oxygen Saturation */}
                    <div className="vital-card oxygen-saturation">
                      <div className="vital-card-header">
                        <i className="fas fa-lungs"></i>
                        <h4>Oxygen Saturation</h4>
                      </div>
                      <div className={`vital-card-value ${getVitalColor('oxygenSaturation', selectedPatient.vitalSigns.oxygenSaturation)}`}>
                        {selectedPatient.vitalSigns.oxygenSaturation}%
                      </div>
                      <div className="vital-card-range">
                        Normal: 95-100%
                      </div>
                    </div>
                    
                    {/* Blood Glucose */}
                    <div className="vital-card blood-glucose">
                      <div className="vital-card-header">
                        <i className="fas fa-tint"></i>
                        <h4>Blood Glucose</h4>
                      </div>
                      <div className={`vital-card-value ${getVitalColor('bloodGlucose', selectedPatient.vitalSigns.bloodGlucose)}`}>
                        {selectedPatient.vitalSigns.bloodGlucose} mg/dL
                      </div>
                      <div className="vital-card-range">
                        Normal: 70-140 mg/dL
                      </div>
                    </div>
                    
                    {/* Pain Level */}
                    <div className="vital-card pain-level">
                      <div className="vital-card-header">
                        <i className="fas fa-exclamation-triangle"></i>
                        <h4>Pain Level</h4>
                      </div>
                      <div className={`vital-card-value ${getVitalColor('painLevel', selectedPatient.vitalSigns.painLevel)}`}>
                        {selectedPatient.vitalSigns.painLevel}/10
                      </div>
                      <div className="pain-scale">
                        <div className="pain-indicator" style={{width: `${selectedPatient.vitalSigns.painLevel * 10}%`}}></div>
                      </div>
                    </div>
                    
                    {/* BMI */}
                    <div className="vital-card bmi">
                      <div className="vital-card-header">
                        <i className="fas fa-weight-scale"></i>
                        <h4>BMI</h4>
                      </div>
                      <div className="vital-card-value">
                        {calculateBMI(selectedPatient.vitalSigns.weight, selectedPatient.vitalSigns.height)}
                      </div>
                      <div className="vital-card-range">
                        {getBMICategory(calculateBMI(selectedPatient.vitalSigns.weight, selectedPatient.vitalSigns.height))}
                      </div>
                      <div className="bmi-details">
                        Weight: {selectedPatient.vitalSigns.weight}kg | Height: {selectedPatient.vitalSigns.height}cm
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="action-buttons-row">
                  <button className="action-btn primary" onClick={handleEditClick}>
                    <i className="fas fa-edit"></i> Update Vital Signs
                  </button>
                  <button className="action-btn secondary">
                    <i className="fas fa-history"></i> View History
                  </button>
                  <button className="action-btn warning">
                    <i className="fas fa-bell"></i> Set Alert
                  </button>
                  <button className="action-btn danger">
                    <i className="fas fa-file-pdf"></i> Generate Report
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {isEditing && selectedPatient && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <div className="modal-header">
              <h2>
                <i className="fas fa-edit"></i> Update Vital Signs - {selectedPatient.name}
              </h2>
              <button className="close-modal" onClick={handleCancelEdit}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="edit-vitals-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="temperature">
                      <i className="fas fa-thermometer-half"></i> Temperature (°F)
                    </label>
                    <input
                      type="number"
                      id="temperature"
                      step="0.1"
                      value={editedVitals.temperature}
                      onChange={(e) => handleVitalChange('temperature', parseFloat(e.target.value))}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="heartRate">
                      <i className="fas fa-heart"></i> Heart Rate (bpm)
                    </label>
                    <input
                      type="number"
                      id="heartRate"
                      value={editedVitals.heartRate}
                      onChange={(e) => handleVitalChange('heartRate', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="bloodPressure">
                      <i className="fas fa-tachometer-alt"></i> Blood Pressure
                    </label>
                    <input
                      type="text"
                      id="bloodPressure"
                      placeholder="e.g., 120/80"
                      value={editedVitals.bloodPressure}
                      onChange={(e) => handleVitalChange('bloodPressure', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="respiratoryRate">
                      <i className="fas fa-wind"></i> Respiratory Rate
                    </label>
                    <input
                      type="number"
                      id="respiratoryRate"
                      value={editedVitals.respiratoryRate}
                      onChange={(e) => handleVitalChange('respiratoryRate', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="oxygenSaturation">
                      <i className="fas fa-lungs"></i> Oxygen Saturation (%)
                    </label>
                    <input
                      type="number"
                      id="oxygenSaturation"
                      min="0"
                      max="100"
                      value={editedVitals.oxygenSaturation}
                      onChange={(e) => handleVitalChange('oxygenSaturation', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="bloodGlucose">
                      <i className="fas fa-tint"></i> Blood Glucose (mg/dL)
                    </label>
                    <input
                      type="number"
                      id="bloodGlucose"
                      value={editedVitals.bloodGlucose}
                      onChange={(e) => handleVitalChange('bloodGlucose', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="painLevel">
                      <i className="fas fa-exclamation-triangle"></i> Pain Level (0-10)
                    </label>
                    <div className="pain-input-group">
                      <input
                        type="range"
                        id="painLevel"
                        min="0"
                        max="10"
                        value={editedVitals.painLevel}
                        onChange={(e) => handleVitalChange('painLevel', parseInt(e.target.value))}
                      />
                      <div className="pain-level-display">{editedVitals.painLevel}/10</div>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="weight">
                      <i className="fas fa-weight-scale"></i> Weight (kg)
                    </label>
                    <input
                      type="number"
                      id="weight"
                      step="0.1"
                      value={editedVitals.weight}
                      onChange={(e) => handleVitalChange('weight', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="cancel-btn" onClick={handleCancelEdit}>
                <i className="fas fa-times"></i> Cancel
              </button>
              <button className="save-btn" onClick={handleSaveVitals}>
                <i className="fas fa-save"></i> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Patient Modal - NEW */}
      {isAddingPatient && (
        <div className="edit-modal-overlay">
          <div className="edit-modal add-patient-modal">
            <div className="modal-header">
              <h2>
                <i className="fas fa-user-plus"></i> Add New Patient
              </h2>
              <button className="close-modal" onClick={handleCancelAddPatient}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="edit-vitals-form">
                <h3 className="form-section-title">Personal Information</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      placeholder="Enter patient name"
                      value={newPatient.name}
                      onChange={(e) => handleNewPatientChange('name', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="age">Age *</label>
                    <input
                      type="number"
                      id="age"
                      placeholder="Enter age"
                      value={newPatient.age}
                      onChange={(e) => handleNewPatientChange('age', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="gender">Gender</label>
                    <select
                      id="gender"
                      value={newPatient.gender}
                      onChange={(e) => handleNewPatientChange('gender', e.target.value)}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="room">Room Number *</label>
                    <input
                      type="text"
                      id="room"
                      placeholder="e.g., 301A"
                      value={newPatient.room}
                      onChange={(e) => handleNewPatientChange('room', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="diagnosis">Diagnosis *</label>
                    <input
                      type="text"
                      id="diagnosis"
                      placeholder="Enter diagnosis"
                      value={newPatient.diagnosis}
                      onChange={(e) => handleNewPatientChange('diagnosis', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="admissionDate">Admission Date</label>
                    <input
                      type="date"
                      id="admissionDate"
                      value={newPatient.admissionDate}
                      onChange={(e) => handleNewPatientChange('admissionDate', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="doctor">Attending Doctor</label>
                    <input
                      type="text"
                      id="doctor"
                      placeholder="Enter doctor name"
                      value={newPatient.doctor}
                      onChange={(e) => handleNewPatientChange('doctor', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="nurse">Assigned Nurse</label>
                    <input
                      type="text"
                      id="nurse"
                      placeholder="Enter nurse name"
                      value={newPatient.nurse}
                      onChange={(e) => handleNewPatientChange('nurse', e.target.value)}
                    />
                  </div>
                </div>
                
                <h3 className="form-section-title">Initial Vital Signs</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="temp">Temperature (°F)</label>
                    <input
                      type="number"
                      id="temp"
                      step="0.1"
                      value={newPatient.vitalSigns.temperature}
                      onChange={(e) => handleNewPatientChange('vitalSigns.temperature', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="hr">Heart Rate (bpm)</label>
                    <input
                      type="number"
                      id="hr"
                      value={newPatient.vitalSigns.heartRate}
                      onChange={(e) => handleNewPatientChange('vitalSigns.heartRate', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="bp">Blood Pressure</label>
                    <input
                      type="text"
                      id="bp"
                      placeholder="120/80"
                      value={newPatient.vitalSigns.bloodPressure}
                      onChange={(e) => handleNewPatientChange('vitalSigns.bloodPressure', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="rr">Respiratory Rate</label>
                    <input
                      type="number"
                      id="rr"
                      value={newPatient.vitalSigns.respiratoryRate}
                      onChange={(e) => handleNewPatientChange('vitalSigns.respiratoryRate', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="spo2">Oxygen Saturation (%)</label>
                    <input
                      type="number"
                      id="spo2"
                      min="0"
                      max="100"
                      value={newPatient.vitalSigns.oxygenSaturation}
                      onChange={(e) => handleNewPatientChange('vitalSigns.oxygenSaturation', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="glucose">Blood Glucose (mg/dL)</label>
                    <input
                      type="number"
                      id="glucose"
                      value={newPatient.vitalSigns.bloodGlucose}
                      onChange={(e) => handleNewPatientChange('vitalSigns.bloodGlucose', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="pain">Pain Level (0-10)</label>
                    <div className="pain-input-group">
                      <input
                        type="range"
                        id="pain"
                        min="0"
                        max="10"
                        value={newPatient.vitalSigns.painLevel}
                        onChange={(e) => handleNewPatientChange('vitalSigns.painLevel', e.target.value)}
                      />
                      <div className="pain-level-display">{newPatient.vitalSigns.painLevel}/10</div>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="weight">Weight (kg)</label>
                    <input
                      type="number"
                      id="weight"
                      step="0.1"
                      value={newPatient.vitalSigns.weight}
                      onChange={(e) => handleNewPatientChange('vitalSigns.weight', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="height">Height (cm)</label>
                    <input
                      type="number"
                      id="height"
                      value={newPatient.vitalSigns.height}
                      onChange={(e) => handleNewPatientChange('vitalSigns.height', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="notes">Clinical Notes</label>
                  <textarea
                    id="notes"
                    rows="3"
                    placeholder="Enter initial clinical notes..."
                    value={newPatient.notes}
                    onChange={(e) => handleNewPatientChange('notes', e.target.value)}
                  ></textarea>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="cancel-btn" onClick={handleCancelAddPatient}>
                <i className="fas fa-times"></i> Cancel
              </button>
              <button className="save-btn" onClick={handleSaveNewPatient}>
                <i className="fas fa-save"></i> Add Patient
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VitalSignsDashboard;