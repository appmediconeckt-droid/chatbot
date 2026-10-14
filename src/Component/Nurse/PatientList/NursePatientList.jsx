import React, { useState } from 'react';
import './NursePatientList.css';

const NursePatientList = () => {
  const [patients, setPatients] = useState([
    {
      id: 1,
      name: 'John Smith',
      age: 45,
      gender: 'Male',
      room: 'ICU-4',
      bed: 'Bed 3',
      admissionDate: '2026-01-15',
      assignedDoctor: 'Dr. Michael Chen',
      status: 'critical',
      bloodGroup: 'O+',
      bloodPressure: '130/85',
      heartRate: '78',
      temperature: '98.6°F',
      oxygenLevel: '96%',
      lastCheckup: '2026-01-16 08:30',
      nextCheckup: '2026-01-16 14:00',
      medication: ['Paracetamol', 'Antibiotic'],
      notes: 'Post-surgery recovery',
      hasPreviousRecords: true,
      contactNumber: '+1 (555) 123-4567',
      emergencyContact: 'Mary Smith (Wife)',
      allergies: ['Penicillin', 'Sulfa'],
      diagnosis: 'Appendectomy',
      treatmentPlan: 'Post-operative care'
    },
    {
      id: 2,
      name: 'Emma Johnson',
      age: 32,
      gender: 'Female',
      room: 'ICU-3',
      bed: 'Bed 1',
      admissionDate: '2026-01-14',
      assignedDoctor: 'Dr. James Wilson',
      status: 'stable',
      bloodGroup: 'A+',
      bloodPressure: '120/80',
      heartRate: '72',
      temperature: '98.2°F',
      oxygenLevel: '98%',
      lastCheckup: '2026-01-16 09:00',
      nextCheckup: '2026-01-16 18:00',
      medication: ['Painkiller', 'Antibiotic'],
      notes: 'Monitoring progress',
      hasPreviousRecords: true,
      contactNumber: '+1 (555) 234-5678',
      emergencyContact: 'John Johnson (Husband)',
      allergies: ['None'],
      diagnosis: 'Pneumonia',
      treatmentPlan: 'Antibiotic therapy'
    },
    {
      id: 3,
      name: 'Robert Brown',
      age: 68,
      gender: 'Male',
      room: 'ICU-2',
      bed: 'Bed 2',
      admissionDate: '2026-01-13',
      assignedDoctor: 'Dr. Robert Davis',
      status: 'recovering',
      bloodGroup: 'B+',
      bloodPressure: '140/90',
      heartRate: '82',
      temperature: '99.1°F',
      oxygenLevel: '94%',
      lastCheckup: '2026-01-16 07:45',
      nextCheckup: '2026-01-16 15:00',
      medication: ['Blood Thinner', 'Beta Blocker'],
      notes: 'Post-cardiac care',
      hasPreviousRecords: true,
      contactNumber: '+1 (555) 345-6789',
      emergencyContact: 'Sarah Brown (Daughter)',
      allergies: ['Iodine', 'Latex'],
      diagnosis: 'Myocardial Infarction',
      treatmentPlan: 'Cardiac rehabilitation'
    },
    {
      id: 4,
      name: 'Sophia Williams',
      age: 28,
      gender: 'Female',
      room: 'ICU-5',
      bed: 'Bed 4',
      admissionDate: '2026-01-16',
      assignedDoctor: 'Dr. Michael Chen',
      status: 'critical',
      bloodGroup: 'AB+',
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      oxygenLevel: '',
      lastCheckup: '',
      nextCheckup: '2026-01-16 10:30',
      medication: ['IV Fluids'],
      notes: 'New admission',
      hasPreviousRecords: false,
      contactNumber: '+1 (555) 456-7890',
      emergencyContact: 'David Williams (Father)',
      allergies: ['Peanuts'],
      diagnosis: 'Trauma',
      treatmentPlan: 'Stabilization'
    },
    {
      id: 5,
      name: 'David Miller',
      age: 52,
      gender: 'Male',
      room: 'ICU-4',
      bed: 'Bed 5',
      admissionDate: '2026-01-15',
      assignedDoctor: 'Dr. James Wilson',
      status: 'stable',
      bloodGroup: 'O-',
      bloodPressure: '125/82',
      heartRate: '76',
      temperature: '98.4°F',
      oxygenLevel: '97%',
      lastCheckup: '2026-01-16 08:15',
      nextCheckup: '2026-01-16 16:00',
      medication: ['Antibiotic', 'Anti-inflammatory'],
      notes: 'Post-operative care',
      hasPreviousRecords: true,
      contactNumber: '+1 (555) 567-8901',
      emergencyContact: 'Lisa Miller (Wife)',
      allergies: ['Aspirin'],
      diagnosis: 'Fractured Femur',
      treatmentPlan: 'Surgical repair'
    }
  ]);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showCheckupModal, setShowCheckupModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [checkupData, setCheckupData] = useState({
    bloodPressure: '',
    bloodGroup: '',
    heartRate: '',
    temperature: '',
    oxygenLevel: '',
    medication: '',
    notes: '',
    nextCheckup: ''
  });

  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = patients.filter(patient => {
    const matchesStatus = filter === 'all' || patient.status === filter;
    const matchesSearch = searchTerm === '' || 
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.assignedDoctor.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const patientStats = {
    total: patients.length,
    critical: patients.filter(p => p.status === 'critical').length,
    stable: patients.filter(p => p.status === 'stable').length,
    recovering: patients.filter(p => p.status === 'recovering').length
  };

  const handleOpenCheckup = (patient) => {
    setSelectedPatient(patient);
    setCheckupData({
      bloodPressure: patient.bloodPressure || '',
      bloodGroup: patient.bloodGroup || '',
      heartRate: patient.heartRate || '',
      temperature: patient.temperature || '',
      oxygenLevel: patient.oxygenLevel || '',
      medication: patient.medication?.join(', ') || '',
      notes: patient.notes || '',
      nextCheckup: patient.nextCheckup || ''
    });
    setShowCheckupModal(true);
  };

  const handleOpenView = (patient) => {
    setSelectedPatient(patient);
    setShowViewModal(true);
  };

  const handleCheckupSubmit = (e) => {
    e.preventDefault();
    
    const updatedPatients = patients.map(patient => {
      if (patient.id === selectedPatient.id) {
        return {
          ...patient,
          bloodPressure: checkupData.bloodPressure,
          bloodGroup: checkupData.bloodGroup,
          heartRate: checkupData.heartRate,
          temperature: checkupData.temperature,
          oxygenLevel: checkupData.oxygenLevel,
          medication: checkupData.medication.split(',').map(m => m.trim()).filter(m => m),
          notes: checkupData.notes,
          lastCheckup: new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          nextCheckup: checkupData.nextCheckup,
          hasPreviousRecords: true
        };
      }
      return patient;
    });
    
    setPatients(updatedPatients);
    setShowCheckupModal(false);
    setCheckupData({
      bloodPressure: '',
      bloodGroup: '',
      heartRate: '',
      temperature: '',
      oxygenLevel: '',
      medication: '',
      notes: '',
      nextCheckup: ''
    });
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'critical':
        return <span className="nurseStatusBadge critical">Critical</span>;
      case 'stable':
        return <span className="nurseStatusBadge stable">Stable</span>;
      case 'recovering':
        return <span className="nurseStatusBadge recovering">Recovering</span>;
      default:
        return <span className="nurseStatusBadge">Unknown</span>;
    }
  };

  const getBPColor = (bp) => {
    if (!bp) return '#6b7280';
    const [systolic] = bp.split('/');
    const sysNum = parseInt(systolic);
    if (sysNum < 90) return '#3b82f6';
    if (sysNum <= 120) return '#10b981';
    if (sysNum <= 139) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="nurseDashboard">
      {/* Header */}
      <div className="nurseHeader">
        <div className="nurseTitle">
          <h1>Patient Management</h1>
          <p>Nurse Dashboard - ICU Unit</p>
        </div>
        <div className="nurseStats">
          <div className="nurseStatCard total">
            <span className="nurseStatValue">{patientStats.total}</span>
            <span className="nurseStatLabel">Total</span>
          </div>
          <div className="nurseStatCard critical">
            <span className="nurseStatValue">{patientStats.critical}</span>
            <span className="nurseStatLabel">Critical</span>
          </div>
          <div className="nurseStatCard stable">
            <span className="nurseStatValue">{patientStats.stable}</span>
            <span className="nurseStatLabel">Stable</span>
          </div>
          <div className="nurseStatCard recovering">
            <span className="nurseStatValue">{patientStats.recovering}</span>
            <span className="nurseStatLabel">Recovering</span>
          </div>
        </div>
      </div>

      {/* Patient List Section */}
      <div className="nurseSection">
        <div className="nurseSectionHeader">
          <div className="nurseSectionTitle">
            <h2>Assigned Patients</h2>
            <span className="nurseBadge">{filteredPatients.length} patients</span>
          </div>
          <div className="nurseFilters">
            <div className="nurseSearch">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="nurseSearchInput"
              />
            </div>
            <div className="nurseFilterButtons">
              <button 
                className={`nurseFilterBtn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button 
                className={`nurseFilterBtn ${filter === 'critical' ? 'active' : ''}`}
                onClick={() => setFilter('critical')}
              >
                Critical
              </button>
              <button 
                className={`nurseFilterBtn ${filter === 'stable' ? 'active' : ''}`}
                onClick={() => setFilter('stable')}
              >
                Stable
              </button>
              <button 
                className={`nurseFilterBtn ${filter === 'recovering' ? 'active' : ''}`}
                onClick={() => setFilter('recovering')}
              >
                Recovering
              </button>
            </div>
          </div>
        </div>

        {/* Patients Table */}
        <div className="nurseTableContainer">
          <table className="nurseTable">
            <thead>
              <tr>
                <th className="nurseTh">ID</th>
                <th className="nurseTh">Patient</th>
                <th className="nurseTh">Room/Bed</th>
                <th className="nurseTh">Doctor</th>
                <th className="nurseTh">Blood Group</th>
                <th className="nurseTh">Status</th>
                <th className="nurseTh">Checkup</th>
                <th className="nurseTh">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map(patient => (
                <tr key={patient.id} className="nurseTableRow">
                  <td className="nurseTd id">#{patient.id.toString().padStart(3, '0')}</td>
                  <td className="nurseTd">
                    <div className="nursePatientInfo">
                      <div className="nursePatientAvatar">
                        {patient.name.charAt(0)}
                      </div>
                      <div className="nursePatientDetails">
                        <div className="nursePatientName">{patient.name}</div>
                        <div className="nursePatientMeta">
                          {patient.age}y • {patient.gender} • {patient.admissionDate}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="nurseTd">
                    <div className="nurseLocation">
                      <div className="nurseRoom">{patient.room}</div>
                      <div className="nurseBed">{patient.bed}</div>
                    </div>
                  </td>
                  <td className="nurseTd">
                    <div className="nurseDoctor">
                      Dr. {patient.assignedDoctor.split(' ')[1]}
                    </div>
                  </td>
                  <td className="nurseTd">
                    <span className={`nurseBloodGroup ${patient.bloodGroup ? 'has' : 'none'}`}>
                      {patient.bloodGroup || 'Not Set'}
                    </span>
                  </td>
                  <td className="nurseTd">
                    {getStatusBadge(patient.status)}
                  </td>
                  <td className="nurseTd">
                    <div className="nurseCheckup">
                      <div className="nurseLastCheckup">
                        {patient.lastCheckup || 'No checkup'}
                      </div>
                      <div className="nurseNextCheckup">
                        Next: {patient.nextCheckup}
                      </div>
                    </div>
                  </td>
                  <td className="nurseTd">
                    <div className="nurseActions">
                      <button 
                        className="nurseBtn view"
                        onClick={() => handleOpenView(patient)}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        View
                      </button>
                      <button 
                        className="nurseBtn update"
                        onClick={() => handleOpenCheckup(patient)}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        Update
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredPatients.length === 0 && (
            <div className="nurseEmpty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <h4>No patients found</h4>
              <p>Try different search or filter</p>
            </div>
          )}
        </div>
      </div>

      {/* Checkup Modal */}
      {showCheckupModal && selectedPatient && (
        <div className="nurseModalOverlay">
          <div className="nurseModal">
            <div className="nurseModalHeader">
              <h3>Update Checkup Details</h3>
              <button 
                className="nurseModalClose"
                onClick={() => setShowCheckupModal(false)}
              >
                ×
              </button>
            </div>
            <div className="nurseModalBody">
              <div className="nurseModalPatient">
                <div className="nurseModalAvatar">
                  {selectedPatient.name.charAt(0)}
                </div>
                <div>
                  <h4>{selectedPatient.name}</h4>
                  <p>{selectedPatient.age}y • {selectedPatient.gender} • {selectedPatient.room}</p>
                </div>
              </div>
              
              <form onSubmit={handleCheckupSubmit} className="nurseForm">
                <div className="nurseFormGrid">
                  <div className="nurseFormGroup">
                    <label>Blood Pressure</label>
                    <input
                      type="text"
                      value={checkupData.bloodPressure}
                      onChange={(e) => setCheckupData({...checkupData, bloodPressure: e.target.value})}
                      placeholder="120/80"
                      required
                    />
                  </div>
                  <div className="nurseFormGroup">
                    <label>Blood Group</label>
                    <select
                      value={checkupData.bloodGroup}
                      onChange={(e) => setCheckupData({...checkupData, bloodGroup: e.target.value})}
                    >
                      <option value="">Select</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  <div className="nurseFormGroup">
                    <label>Heart Rate</label>
                    <input
                      type="number"
                      value={checkupData.heartRate}
                      onChange={(e) => setCheckupData({...checkupData, heartRate: e.target.value})}
                      placeholder="72"
                    />
                  </div>
                  <div className="nurseFormGroup">
                    <label>Temperature</label>
                    <input
                      type="text"
                      value={checkupData.temperature}
                      onChange={(e) => setCheckupData({...checkupData, temperature: e.target.value})}
                      placeholder="98.6°F"
                    />
                  </div>
                  <div className="nurseFormGroup">
                    <label>Oxygen Level</label>
                    <input
                      type="number"
                      value={checkupData.oxygenLevel}
                      onChange={(e) => setCheckupData({...checkupData, oxygenLevel: e.target.value})}
                      placeholder="96"
                    />
                  </div>
                  <div className="nurseFormGroup">
                    <label>Next Checkup</label>
                    <input
                      type="datetime-local"
                      value={checkupData.nextCheckup}
                      onChange={(e) => setCheckupData({...checkupData, nextCheckup: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="nurseFormGroup">
                  <label>Medication</label>
                  <textarea
                    value={checkupData.medication}
                    onChange={(e) => setCheckupData({...checkupData, medication: e.target.value})}
                    placeholder="Enter medications separated by commas"
                    rows="2"
                  />
                </div>
                
                <div className="nurseFormGroup">
                  <label>Notes</label>
                  <textarea
                    value={checkupData.notes}
                    onChange={(e) => setCheckupData({...checkupData, notes: e.target.value})}
                    placeholder="Clinical notes and observations"
                    rows="3"
                  />
                </div>
                
                <div className="nurseModalActions">
                  <button
                    type="button"
                    className="nurseModalBtn cancel"
                    onClick={() => setShowCheckupModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="nurseModalBtn submit"
                  >
                    Save Checkup
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedPatient && (
        <div className="nurseModalOverlay">
          <div className="nurseModal viewModal">
            <div className="nurseModalHeader">
              <h3>Patient Medical Records</h3>
              <button 
                className="nurseModalClose"
                onClick={() => setShowViewModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="nurseModalBody">
              <div className="nurseViewHeader">
                <div className="nurseViewAvatar">
                  {selectedPatient.name.charAt(0)}
                </div>
                <div>
                  <h4>{selectedPatient.name}</h4>
                  <p>{selectedPatient.age}y • {selectedPatient.gender} • {selectedPatient.bloodGroup || 'Blood Group N/A'}</p>
                  <p>{selectedPatient.room} • {selectedPatient.bed} • Admitted: {selectedPatient.admissionDate}</p>
                </div>
              </div>
              
              <div className="nurseViewContent">
                <div className="nurseViewSection">
                  <h5>Contact Info</h5>
                  <div className="nurseViewGrid">
                    <div>
                      <label>Contact:</label>
                      <span>{selectedPatient.contactNumber}</span>
                    </div>
                    <div>
                      <label>Emergency:</label>
                      <span>{selectedPatient.emergencyContact}</span>
                    </div>
                    <div>
                      <label>Doctor:</label>
                      <span className="doctor">{selectedPatient.assignedDoctor}</span>
                    </div>
                    <div>
                      <label>Status:</label>
                      <span className="status">{selectedPatient.status}</span>
                    </div>
                  </div>
                </div>
                
                <div className="nurseViewSection">
                  <h5>Medical Info</h5>
                  <div className="nurseViewGrid">
                    <div>
                      <label>Diagnosis:</label>
                      <span>{selectedPatient.diagnosis}</span>
                    </div>
                    <div>
                      <label>Treatment:</label>
                      <span>{selectedPatient.treatmentPlan}</span>
                    </div>
                    <div>
                      <label>Allergies:</label>
                      <span>{selectedPatient.allergies.join(', ') || 'None'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="nurseViewSection">
                  <h5>Current Vitals</h5>
                  {selectedPatient.hasPreviousRecords ? (
                    <div className="nurseVitalsGrid">
                      <div className="nurseVitalItem">
                        <span className="nurseVitalLabel">BP:</span>
                        <span className="nurseVitalValue" style={{color: getBPColor(selectedPatient.bloodPressure)}}>
                          {selectedPatient.bloodPressure || 'N/A'}
                        </span>
                      </div>
                      <div className="nurseVitalItem">
                        <span className="nurseVitalLabel">HR:</span>
                        <span className="nurseVitalValue">
                          {selectedPatient.heartRate || 'N/A'} BPM
                        </span>
                      </div>
                      <div className="nurseVitalItem">
                        <span className="nurseVitalLabel">Temp:</span>
                        <span className="nurseVitalValue">
                          {selectedPatient.temperature || 'N/A'}
                        </span>
                      </div>
                      <div className="nurseVitalItem">
                        <span className="nurseVitalLabel">O₂:</span>
                        <span className="nurseVitalValue">
                          {selectedPatient.oxygenLevel || 'N/A'}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="nurseNoData">No records available</div>
                  )}
                </div>
                
                <div className="nurseViewSection">
                  <h5>Medication</h5>
                  {selectedPatient.medication.length > 0 ? (
                    <div className="nurseMedicationTags">
                      {selectedPatient.medication.map((med, index) => (
                        <span key={index} className="nurseMedicationTag">{med}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="nurseNoData">No medication</p>
                  )}
                </div>
                
                <div className="nurseViewSection">
                  <h5>Checkup Schedule</h5>
                  <div className="nurseCheckupGrid">
                    <div>
                      <label>Last:</label>
                      <span>{selectedPatient.lastCheckup || 'No checkup'}</span>
                    </div>
                    <div>
                      <label>Next:</label>
                      <span className="next">{selectedPatient.nextCheckup}</span>
                    </div>
                  </div>
                </div>
                
                <div className="nurseViewSection">
                  <h5>Notes</h5>
                  <div className="nurseNotes">
                    {selectedPatient.notes || 'No notes'}
                  </div>
                </div>
              </div>
              
              <div className="nurseModalActions">
                <button
                  className="nurseModalBtn update"
                  onClick={() => {
                    setShowViewModal(false);
                    handleOpenCheckup(selectedPatient);
                  }}
                >
                  Update Records
                </button>
                <button
                  className="nurseModalBtn close"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NursePatientList;