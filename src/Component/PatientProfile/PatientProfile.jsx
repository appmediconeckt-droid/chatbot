import React, { useState } from 'react';
import './PatientProfile.css';

const PatientProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [showNotification, setShowNotification] = useState({ show: false, message: '', type: '' });

  // Complete patient data
  const [patientData, setPatientData] = useState({
    personalInfo: {
      id: "P-12345",
      name: "Ashish Sharma",
      age: 45,
      gender: "Male",
      dateOfBirth: "1979-03-15",
      bloodGroup: "O+",
      maritalStatus: "Married",
      occupation: "Software Engineer",
      email: "ashish.sharma@email.com",
      phone: "+91 98765-43210",
      alternativePhone: "+91 98765-12345",
      aadharNumber: "1234-5678-9012",
      panNumber: "ABCDE1234F",
      passportNumber: "Z1234567",
      drivingLicense: "MP09-1234567890",
      emergencyContact: {
        name: "Priya Sharma",
        relation: "Spouse",
        phone: "+91 98765-43210",
        alternativePhone: "+91 98765-54321",
        email: "priya.sharma@email.com",
        address: "123 Main Street, Indore, MP, India - 452001"
      },
      presentAddress: {
        line1: "123 Main Street",
        line2: "Near Anand Bazaar",
        city: "Indore",
        state: "Madhya Pradesh",
        pincode: "452001",
        country: "India",
        landmark: "Near Anand Bazaar"
      },
      permanentAddress: {
        line1: "456 Village Road",
        line2: "Near Post Office",
        city: "Ujjain",
        state: "Madhya Pradesh",
        pincode: "456001",
        country: "India",
        landmark: "Near Old Temple"
      },
      medicalInfo: {
        bloodGroup: "O+",
        height: "175 cm",
        weight: "75 kg",
        allergies: ["Penicillin", "Dust", "Pollen"],
        chronicConditions: ["Hypertension", "Diabetes Type 2"],
        pastSurgeries: ["Appendectomy - 2015", "Knee Surgery - 2020"],
        familyHistory: ["Father - Hypertension", "Mother - Diabetes"],
        currentMedications: ["Metformin 500mg", "Lisinopril 10mg"],
        dietaryRestrictions: ["Low Sugar", "Low Salt"],
        bloodPressure: "120/80",
        heartRate: "72 bpm",
        respiratoryRate: "16/min",
        temperature: "98.6°F",
        oxygenSaturation: "98%"
      },
      insuranceInfo: {
        provider: "Star Health Insurance",
        policyNumber: "SHI-12345-6789",
        groupNumber: "GRP-2024-001",
        validityDate: "2025-12-31",
        coverageAmount: "₹5,00,000",
        nominee: "Priya Sharma",
        relationship: "Spouse",
        insuranceType: "Family Floater",
        tpaName: "MediAssist TPA",
        tpaContact: "1800-123-4567"
      },
      workInfo: {
        companyName: "Tech Solutions Ltd.",
        designation: "Senior Software Engineer",
        workEmail: "ashish.sharma@techsolutions.com",
        workPhone: "+91 98765-11111",
        officeAddress: "Tech Park, Vijay Nagar, Indore, MP - 452010",
        joiningDate: "2020-06-01",
        employeeId: "EMP-2020-1234"
      },
      socialInfo: {
        twitter: "@ashish_sharma",
        linkedin: "linkedin.com/in/ashish-sharma",
        facebook: "facebook.com/ashish.sharma",
        instagram: "@ashish_sharma"
      },
      preferences: {
        language: "English, Hindi",
        communicationMode: "Email, SMS",
        appointmentReminder: true,
        newsletterSubscription: true,
        twoFactorAuth: true,
        dataSharingConsent: true,
        marketingConsent: false
      },
      emergencyContacts: [
        {
          name: "Priya Sharma",
          relation: "Spouse",
          phone: "+91 98765-43210",
          priority: "Primary"
        },
        {
          name: "Rahul Sharma",
          relation: "Brother",
          phone: "+91 98765-11111",
          priority: "Secondary"
        },
        {
          name: "Dr. Amit Patel",
          relation: "Family Doctor",
          phone: "+91 98765-22222",
          priority: "Medical"
        }
      ],
      documents: [
        {
          type: "Aadhar Card",
          number: "1234-5678-9012",
          issuedBy: "UIDAI",
          validUntil: "Lifetime"
        },
        {
          type: "PAN Card",
          number: "ABCDE1234F",
          issuedBy: "Income Tax Dept",
          validUntil: "Lifetime"
        },
        {
          type: "Passport",
          number: "Z1234567",
          issuedBy: "Passport Office",
          validUntil: "2030-01-01"
        },
        {
          type: "Driving License",
          number: "MP09-1234567890",
          issuedBy: "RTO Indore",
          validUntil: "2030-12-31"
        },
        {
          type: "Voter ID",
          number: "MP/09/123/456789",
          issuedBy: "Election Commission",
          validUntil: "Lifetime"
        }
      ],
      familyMembers: [
        {
          name: "Priya Sharma",
          relation: "Spouse",
          age: 42,
          bloodGroup: "B+",
          medicalConditions: "None"
        },
        {
          name: "Aarav Sharma",
          relation: "Son",
          age: 15,
          bloodGroup: "O+",
          medicalConditions: "Asthma"
        },
        {
          name: "Anaya Sharma",
          relation: "Daughter",
          age: 12,
          bloodGroup: "A+",
          medicalConditions: "None"
        }
      ],
      appointments: [
        {
          date: "2024-01-15",
          time: "10:30 AM",
          doctor: "Dr. Rajesh Gupta",
          specialty: "Cardiologist",
          hospital: "Apollo Hospital",
          status: "Completed"
        },
        {
          date: "2024-02-20",
          time: "11:00 AM",
          doctor: "Dr. Priya Singh",
          specialty: "Endocrinologist",
          hospital: "Medanta Hospital",
          status: "Upcoming"
        }
      ],
      labReports: [
        {
          date: "2024-01-10",
          testName: "Complete Blood Count",
          labName: "Pathkind Labs",
          result: "Normal",
          fileUrl: "#"
        },
        {
          date: "2024-01-10",
          testName: "Blood Sugar Fasting",
          labName: "Pathkind Labs",
          result: "110 mg/dL",
          fileUrl: "#"
        }
      ],
      prescriptions: [
        {
          date: "2024-01-15",
          doctor: "Dr. Rajesh Gupta",
          medication: "Metformin 500mg",
          dosage: "Twice daily",
          duration: "3 months"
        }
      ]
    }
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState({...patientData.personalInfo});

  // Initialize edit form data when opening modal
  const initializeEditForm = () => {
    setEditFormData({...patientData.personalInfo});
    setIsEditing(true);
  };

  // Notification function
  const showNotificationMessage = (message, type) => {
    setShowNotification({ show: true, message, type });
    setTimeout(() => {
      setShowNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Handle Profile Image Upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotificationMessage('File size should be less than 5MB', 'error');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showNotificationMessage('Please upload an image file', 'error');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
        showNotificationMessage('Profile picture updated successfully!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Save Profile
  const handleSaveProfile = () => {
    setPatientData({
      ...patientData,
      personalInfo: editFormData
    });
    setIsEditing(false);
    showNotificationMessage('Profile updated successfully!', 'success');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({...patientData.personalInfo});
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested objects
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle array fields
  const handleArrayFieldChange = (parent, index, field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [parent]: prev[parent].map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addArrayItem = (parent, newItem) => {
    setEditFormData(prev => ({
      ...prev,
      [parent]: [...prev[parent], newItem]
    }));
  };

  const removeArrayItem = (parent, index) => {
    setEditFormData(prev => ({
      ...prev,
      [parent]: prev[parent].filter((_, i) => i !== index)
    }));
  };

  // Notification Component
  const Notification = () => (
    showNotification.show && (
      <div className={`notification ${showNotification.type}`}>
        {showNotification.message}
      </div>
    )
  );

  // Render Edit Modal
  const renderEditModal = () => (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Edit Complete Profile</h3>
          <button className="close-btn" onClick={handleCancelEdit}>×</button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
          <div className="modal-body">
            {/* Personal Information Section */}
            <div className="form-section">
              <h4>Personal Information</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name || ''}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Patient ID</label>
                  <input
                    type="text"
                    name="id"
                    value={editFormData.id || ''}
                    onChange={handleEditFormChange}
                    readOnly
                    className="readonly-field"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date of Birth *</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={editFormData.dateOfBirth || ''}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    name="age"
                    value={editFormData.age || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Gender *</label>
                  <select
                    name="gender"
                    value={editFormData.gender || ''}
                    onChange={handleEditFormChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Marital Status</label>
                  <select
                    name="maritalStatus"
                    value={editFormData.maritalStatus || ''}
                    onChange={handleEditFormChange}
                  >
                    <option value="">Select</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Occupation</label>
                  <input
                    type="text"
                    name="occupation"
                    value={editFormData.occupation || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Blood Group</label>
                  <select
                    name="bloodGroup"
                    value={editFormData.bloodGroup || ''}
                    onChange={handleEditFormChange}
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="form-section">
              <h4>Contact Information</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email || ''}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={editFormData.phone || ''}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Alternative Phone</label>
                <input
                  type="tel"
                  name="alternativePhone"
                  value={editFormData.alternativePhone || ''}
                  onChange={handleEditFormChange}
                />
              </div>
            </div>

            {/* Identity Documents */}
            <div className="form-section">
              <h4>Identity Documents</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Aadhar Number</label>
                  <input
                    type="text"
                    name="aadharNumber"
                    value={editFormData.aadharNumber || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>PAN Number</label>
                  <input
                    type="text"
                    name="panNumber"
                    value={editFormData.panNumber || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Passport Number</label>
                  <input
                    type="text"
                    name="passportNumber"
                    value={editFormData.passportNumber || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Driving License</label>
                  <input
                    type="text"
                    name="drivingLicense"
                    value={editFormData.drivingLicense || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
              </div>
            </div>

            {/* Present Address */}
            <div className="form-section">
              <h4>Present Address</h4>
              <div className="form-group">
                <label>Address Line 1</label>
                <input
                  type="text"
                  name="presentAddress.line1"
                  value={editFormData.presentAddress?.line1 || ''}
                  onChange={handleEditFormChange}
                />
              </div>
              <div className="form-group">
                <label>Address Line 2</label>
                <input
                  type="text"
                  name="presentAddress.line2"
                  value={editFormData.presentAddress?.line2 || ''}
                  onChange={handleEditFormChange}
                />
              </div>
              <div className="form-group">
                <label>Landmark</label>
                <input
                  type="text"
                  name="presentAddress.landmark"
                  value={editFormData.presentAddress?.landmark || ''}
                  onChange={handleEditFormChange}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="presentAddress.city"
                    value={editFormData.presentAddress?.city || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="presentAddress.state"
                    value={editFormData.presentAddress?.state || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Pincode</label>
                  <input
                    type="text"
                    name="presentAddress.pincode"
                    value={editFormData.presentAddress?.pincode || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    name="presentAddress.country"
                    value={editFormData.presentAddress?.country || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
              </div>
            </div>

            {/* Permanent Address */}
            <div className="form-section">
              <h4>Permanent Address</h4>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setEditFormData(prev => ({
                          ...prev,
                          permanentAddress: {...prev.presentAddress}
                        }));
                      }
                    }}
                  /> Same as Present Address
                </label>
              </div>
              <div className="form-group">
                <label>Address Line 1</label>
                <input
                  type="text"
                  name="permanentAddress.line1"
                  value={editFormData.permanentAddress?.line1 || ''}
                  onChange={handleEditFormChange}
                />
              </div>
              <div className="form-group">
                <label>Address Line 2</label>
                <input
                  type="text"
                  name="permanentAddress.line2"
                  value={editFormData.permanentAddress?.line2 || ''}
                  onChange={handleEditFormChange}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="permanentAddress.city"
                    value={editFormData.permanentAddress?.city || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="permanentAddress.state"
                    value={editFormData.permanentAddress?.state || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Pincode</label>
                  <input
                    type="text"
                    name="permanentAddress.pincode"
                    value={editFormData.permanentAddress?.pincode || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    name="permanentAddress.country"
                    value={editFormData.permanentAddress?.country || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="form-section">
              <h4>Medical Information</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Height (cm)</label>
                  <input
                    type="text"
                    name="medicalInfo.height"
                    value={editFormData.medicalInfo?.height || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input
                    type="text"
                    name="medicalInfo.weight"
                    value={editFormData.medicalInfo?.weight || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Blood Pressure</label>
                  <input
                    type="text"
                    name="medicalInfo.bloodPressure"
                    value={editFormData.medicalInfo?.bloodPressure || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Heart Rate</label>
                  <input
                    type="text"
                    name="medicalInfo.heartRate"
                    value={editFormData.medicalInfo?.heartRate || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Allergies (comma separated)</label>
                <input
                  type="text"
                  name="medicalInfo.allergies"
                  value={editFormData.medicalInfo?.allergies?.join(', ') || ''}
                  onChange={(e) => {
                    const allergies = e.target.value.split(',').map(item => item.trim());
                    setEditFormData(prev => ({
                      ...prev,
                      medicalInfo: {
                        ...prev.medicalInfo,
                        allergies
                      }
                    }));
                  }}
                />
              </div>

              <div className="form-group">
                <label>Chronic Conditions (comma separated)</label>
                <input
                  type="text"
                  name="medicalInfo.chronicConditions"
                  value={editFormData.medicalInfo?.chronicConditions?.join(', ') || ''}
                  onChange={(e) => {
                    const conditions = e.target.value.split(',').map(item => item.trim());
                    setEditFormData(prev => ({
                      ...prev,
                      medicalInfo: {
                        ...prev.medicalInfo,
                        chronicConditions: conditions
                      }
                    }));
                  }}
                />
              </div>

              <div className="form-group">
                <label>Current Medications (comma separated)</label>
                <input
                  type="text"
                  name="medicalInfo.currentMedications"
                  value={editFormData.medicalInfo?.currentMedications?.join(', ') || ''}
                  onChange={(e) => {
                    const medications = e.target.value.split(',').map(item => item.trim());
                    setEditFormData(prev => ({
                      ...prev,
                      medicalInfo: {
                        ...prev.medicalInfo,
                        currentMedications: medications
                      }
                    }));
                  }}
                />
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="form-section">
              <h4>Emergency Contacts</h4>
              {editFormData.emergencyContacts?.map((contact, index) => (
                <div key={index} className="emergency-contact-item">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        value={contact.name || ''}
                        onChange={(e) => handleArrayFieldChange('emergencyContacts', index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Relation</label>
                      <input
                        type="text"
                        value={contact.relation || ''}
                        onChange={(e) => handleArrayFieldChange('emergencyContacts', index, 'relation', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="tel"
                        value={contact.phone || ''}
                        onChange={(e) => handleArrayFieldChange('emergencyContacts', index, 'phone', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Priority</label>
                      <select
                        value={contact.priority || ''}
                        onChange={(e) => handleArrayFieldChange('emergencyContacts', index, 'priority', e.target.value)}
                      >
                        <option value="Primary">Primary</option>
                        <option value="Secondary">Secondary</option>
                        <option value="Medical">Medical</option>
                      </select>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="remove-btn"
                    onClick={() => removeArrayItem('emergencyContacts', index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button 
                type="button" 
                className="add-btn"
                onClick={() => addArrayItem('emergencyContacts', {
                  name: '',
                  relation: '',
                  phone: '',
                  priority: 'Secondary'
                })}
              >
                + Add Emergency Contact
              </button>
            </div>

            {/* Insurance Information */}
            <div className="form-section">
              <h4>Insurance Information</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Provider</label>
                  <input
                    type="text"
                    name="insuranceInfo.provider"
                    value={editFormData.insuranceInfo?.provider || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Policy Number</label>
                  <input
                    type="text"
                    name="insuranceInfo.policyNumber"
                    value={editFormData.insuranceInfo?.policyNumber || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Group Number</label>
                  <input
                    type="text"
                    name="insuranceInfo.groupNumber"
                    value={editFormData.insuranceInfo?.groupNumber || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Validity Date</label>
                  <input
                    type="date"
                    name="insuranceInfo.validityDate"
                    value={editFormData.insuranceInfo?.validityDate || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Coverage Amount</label>
                  <input
                    type="text"
                    name="insuranceInfo.coverageAmount"
                    value={editFormData.insuranceInfo?.coverageAmount || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Nominee</label>
                  <input
                    type="text"
                    name="insuranceInfo.nominee"
                    value={editFormData.insuranceInfo?.nominee || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
              </div>
            </div>

            {/* Work Information */}
            <div className="form-section">
              <h4>Work Information</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    name="workInfo.companyName"
                    value={editFormData.workInfo?.companyName || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Designation</label>
                  <input
                    type="text"
                    name="workInfo.designation"
                    value={editFormData.workInfo?.designation || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Work Email</label>
                  <input
                    type="email"
                    name="workInfo.workEmail"
                    value={editFormData.workInfo?.workEmail || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Work Phone</label>
                  <input
                    type="tel"
                    name="workInfo.workPhone"
                    value={editFormData.workInfo?.workPhone || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Office Address</label>
                <textarea
                  name="workInfo.officeAddress"
                  value={editFormData.workInfo?.officeAddress || ''}
                  onChange={handleEditFormChange}
                  rows="2"
                />
              </div>
            </div>

            {/* Social Media */}
            <div className="form-section">
              <h4>Social Media</h4>
              <div className="form-group">
                <label>Twitter</label>
                <input
                  type="text"
                  name="socialInfo.twitter"
                  value={editFormData.socialInfo?.twitter || ''}
                  onChange={handleEditFormChange}
                />
              </div>
              <div className="form-group">
                <label>LinkedIn</label>
                <input
                  type="text"
                  name="socialInfo.linkedin"
                  value={editFormData.socialInfo?.linkedin || ''}
                  onChange={handleEditFormChange}
                />
              </div>
              <div className="form-group">
                <label>Facebook</label>
                <input
                  type="text"
                  name="socialInfo.facebook"
                  value={editFormData.socialInfo?.facebook || ''}
                  onChange={handleEditFormChange}
                />
              </div>
              <div className="form-group">
                <label>Instagram</label>
                <input
                  type="text"
                  name="socialInfo.instagram"
                  value={editFormData.socialInfo?.instagram || ''}
                  onChange={handleEditFormChange}
                />
              </div>
            </div>

            {/* Preferences */}
            <div className="form-section">
              <h4>Preferences</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Preferred Language</label>
                  <input
                    type="text"
                    name="preferences.language"
                    value={editFormData.preferences?.language || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Communication Mode</label>
                  <input
                    type="text"
                    name="preferences.communicationMode"
                    value={editFormData.preferences?.communicationMode || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
              </div>

              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="preferences.appointmentReminder"
                    checked={editFormData.preferences?.appointmentReminder || false}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        appointmentReminder: e.target.checked
                      }
                    }))}
                  />
                  Appointment Reminders
                </label>

                <label>
                  <input
                    type="checkbox"
                    name="preferences.newsletterSubscription"
                    checked={editFormData.preferences?.newsletterSubscription || false}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        newsletterSubscription: e.target.checked
                      }
                    }))}
                  />
                  Newsletter Subscription
                </label>

                <label>
                  <input
                    type="checkbox"
                    name="preferences.twoFactorAuth"
                    checked={editFormData.preferences?.twoFactorAuth || false}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        twoFactorAuth: e.target.checked
                      }
                    }))}
                  />
                  Two Factor Authentication
                </label>

                <label>
                  <input
                    type="checkbox"
                    name="preferences.dataSharingConsent"
                    checked={editFormData.preferences?.dataSharingConsent || false}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        dataSharingConsent: e.target.checked
                      }
                    }))}
                  />
                  Data Sharing Consent
                </label>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn-primary">Save All Changes</button>
            <button type="button" className="btn-secondary" onClick={handleCancelEdit}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="patient-profile">
      <Notification />
      
      {/* Header Section */}
      <div className="profile-header">
        <div className="profile-avatar-section">
          <div className="profile-avatar">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="avatar-image" />
            ) : (
              <div className="avatar-placeholder">
                {patientData.personalInfo.name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
          </div>
          <div className="avatar-upload">
            <label htmlFor="imageUpload" className="upload-btn">
              <span className="upload-icon">📷</span> Change Photo
            </label>
            <input
              type="file"
              id="imageUpload"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <p className="upload-hint">Max size: 5MB</p>
          </div>
        </div>
        
        <div className="profile-title">
          <h1>{patientData.personalInfo.name}</h1>
          <p className="patient-id">Patient ID: {patientData.personalInfo.id}</p>
          <div className="patient-badges">
            <span className="badge">{patientData.personalInfo.bloodGroup}</span>
            <span className="badge">{patientData.personalInfo.age} years</span>
            <span className="badge">{patientData.personalInfo.gender}</span>
          </div>
        </div>
        
        <div className="header-actions">
          <button className="btn-primary" onClick={initializeEditForm}>
            <span className="btn-icon">✏️</span> Edit Complete Profile
          </button>
        </div>
      </div>

      {/* Main Content - All Information Display */}
      <div className="profile-content">
        {/* Personal Information Section */}
        <div className="info-section">
          <div className="section-header">
            <h2>Personal Information</h2>
          </div>
          
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">👤</div>
              <div className="info-content">
                <label>Full Name</label>
                <span>{patientData.personalInfo.name}</span>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">📅</div>
              <div className="info-content">
                <label>Date of Birth</label>
                <span>{patientData.personalInfo.dateOfBirth}</span>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">⚥</div>
              <div className="info-content">
                <label>Gender</label>
                <span>{patientData.personalInfo.gender}</span>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">💉</div>
              <div className="info-content">
                <label>Blood Group</label>
                <span>{patientData.personalInfo.bloodGroup}</span>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">💍</div>
              <div className="info-content">
                <label>Marital Status</label>
                <span>{patientData.personalInfo.maritalStatus}</span>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">💼</div>
              <div className="info-content">
                <label>Occupation</label>
                <span>{patientData.personalInfo.occupation}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="info-section">
          <div className="section-header">
            <h2>Contact Information</h2>
          </div>
          
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">📧</div>
              <div className="info-content">
                <label>Email</label>
                <span>{patientData.personalInfo.email}</span>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">📱</div>
              <div className="info-content">
                <label>Phone</label>
                <span>{patientData.personalInfo.phone}</span>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">📞</div>
              <div className="info-content">
                <label>Alternative Phone</label>
                <span>{patientData.personalInfo.alternativePhone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Identity Documents */}
        <div className="info-section">
          <div className="section-header">
            <h2>Identity Documents</h2>
          </div>
          
          <div className="documents-grid">
            {patientData.personalInfo.documents?.map((doc, index) => (
              <div key={index} className="document-card">
                <div className="document-icon">📄</div>
                <div className="document-details">
                  <h4>{doc.type}</h4>
                  <p className="doc-number">{doc.number}</p>
                  <p className="doc-issuer">Issued by: {doc.issuedBy}</p>
                  <p className="doc-validity">Valid until: {doc.validUntil}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Present Address */}
        <div className="info-section">
          <div className="section-header">
            <h2>Present Address</h2>
          </div>
          
          <div className="address-card">
            <div className="address-icon">📍</div>
            <div className="address-details">
              <p>{patientData.personalInfo.presentAddress?.line1}</p>
              <p>{patientData.personalInfo.presentAddress?.line2}</p>
              <p>{patientData.personalInfo.presentAddress?.landmark}</p>
              <p>
                {patientData.personalInfo.presentAddress?.city}, 
                {patientData.personalInfo.presentAddress?.state} - 
                {patientData.personalInfo.presentAddress?.pincode}
              </p>
              <p>{patientData.personalInfo.presentAddress?.country}</p>
            </div>
          </div>
        </div>

        {/* Permanent Address */}
        <div className="info-section">
          <div className="section-header">
            <h2>Permanent Address</h2>
          </div>
          
          <div className="address-card">
            <div className="address-icon">🏠</div>
            <div className="address-details">
              <p>{patientData.personalInfo.permanentAddress?.line1}</p>
              <p>{patientData.personalInfo.permanentAddress?.line2}</p>
              <p>
                {patientData.personalInfo.permanentAddress?.city}, 
                {patientData.personalInfo.permanentAddress?.state} - 
                {patientData.personalInfo.permanentAddress?.pincode}
              </p>
              <p>{patientData.personalInfo.permanentAddress?.country}</p>
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="info-section">
          <div className="section-header">
            <h2>Medical Information</h2>
          </div>
          
          <div className="medical-grid">
            <div className="vital-signs">
              <h3>Vital Signs</h3>
              <div className="vital-item">
                <span className="vital-label">Blood Pressure:</span>
                <span className="vital-value">{patientData.personalInfo.medicalInfo?.bloodPressure}</span>
              </div>
              <div className="vital-item">
                <span className="vital-label">Heart Rate:</span>
                <span className="vital-value">{patientData.personalInfo.medicalInfo?.heartRate}</span>
              </div>
              <div className="vital-item">
                <span className="vital-label">Temperature:</span>
                <span className="vital-value">{patientData.personalInfo.medicalInfo?.temperature}</span>
              </div>
              <div className="vital-item">
                <span className="vital-label">O2 Saturation:</span>
                <span className="vital-value">{patientData.personalInfo.medicalInfo?.oxygenSaturation}</span>
              </div>
            </div>

            <div className="medical-details">
              <div className="detail-item">
                <h4>Allergies</h4>
                <ul>
                  {patientData.personalInfo.medicalInfo?.allergies?.map((allergy, index) => (
                    <li key={index}>{allergy}</li>
                  ))}
                </ul>
              </div>

              <div className="detail-item">
                <h4>Chronic Conditions</h4>
                <ul>
                  {patientData.personalInfo.medicalInfo?.chronicConditions?.map((condition, index) => (
                    <li key={index}>{condition}</li>
                  ))}
                </ul>
              </div>

              <div className="detail-item">
                <h4>Current Medications</h4>
                <ul>
                  {patientData.personalInfo.medicalInfo?.currentMedications?.map((med, index) => (
                    <li key={index}>{med}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="info-section">
          <div className="section-header">
            <h2>Emergency Contacts</h2>
          </div>
          
          <div className="emergency-contacts-grid">
            {patientData.personalInfo.emergencyContacts?.map((contact, index) => (
              <div key={index} className={`emergency-card priority-${contact.priority?.toLowerCase()}`}>
                <div className="emergency-header">
                  <span className="emergency-priority">{contact.priority}</span>
                  <span className="emergency-icon">🆘</span>
                </div>
                <div className="emergency-details">
                  <h3>{contact.name}</h3>
                  <p className="relation">{contact.relation}</p>
                  <p className="phone">{contact.phone}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insurance Information */}
        <div className="info-section">
          <div className="section-header">
            <h2>Insurance Information</h2>
          </div>
          
          <div className="insurance-card">
            <div className="insurance-header">
              <h3>{patientData.personalInfo.insuranceInfo?.provider}</h3>
              <span className="insurance-type">{patientData.personalInfo.insuranceInfo?.insuranceType}</span>
            </div>
            <div className="insurance-details">
              <div className="detail-row">
                <span className="label">Policy Number:</span>
                <span className="value">{patientData.personalInfo.insuranceInfo?.policyNumber}</span>
              </div>
              <div className="detail-row">
                <span className="label">Group Number:</span>
                <span className="value">{patientData.personalInfo.insuranceInfo?.groupNumber}</span>
              </div>
              <div className="detail-row">
                <span className="label">Coverage Amount:</span>
                <span className="value">{patientData.personalInfo.insuranceInfo?.coverageAmount}</span>
              </div>
              <div className="detail-row">
                <span className="label">Validity:</span>
                <span className="value">{patientData.personalInfo.insuranceInfo?.validityDate}</span>
              </div>
              <div className="detail-row">
                <span className="label">Nominee:</span>
                <span className="value">{patientData.personalInfo.insuranceInfo?.nominee} ({patientData.personalInfo.insuranceInfo?.relationship})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Work Information */}
        <div className="info-section">
          <div className="section-header">
            <h2>Work Information</h2>
          </div>
          
          <div className="work-card">
            <div className="work-header">
              <h3>{patientData.personalInfo.workInfo?.companyName}</h3>
              <span className="designation">{patientData.personalInfo.workInfo?.designation}</span>
            </div>
            <div className="work-details">
              <div className="detail-row">
                <span className="label">Employee ID:</span>
                <span className="value">{patientData.personalInfo.workInfo?.employeeId}</span>
              </div>
              <div className="detail-row">
                <span className="label">Work Email:</span>
                <span className="value">{patientData.personalInfo.workInfo?.workEmail}</span>
              </div>
              <div className="detail-row">
                <span className="label">Work Phone:</span>
                <span className="value">{patientData.personalInfo.workInfo?.workPhone}</span>
              </div>
              <div className="detail-row">
                <span className="label">Joining Date:</span>
                <span className="value">{patientData.personalInfo.workInfo?.joiningDate}</span>
              </div>
              <div className="detail-row">
                <span className="label">Office Address:</span>
                <span className="value">{patientData.personalInfo.workInfo?.officeAddress}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Family Members */}
        <div className="info-section">
          <div className="section-header">
            <h2>Family Members</h2>
          </div>
          
          <div className="family-grid">
            {patientData.personalInfo.familyMembers?.map((member, index) => (
              <div key={index} className="family-card">
                <div className="family-icon">👪</div>
                <div className="family-details">
                  <h4>{member.name}</h4>
                  <p className="relation">{member.relation}</p>
                  <p className="age">Age: {member.age}</p>
                  <p className="blood-group">Blood Group: {member.bloodGroup}</p>
                  {member.medicalConditions !== "None" && (
                    <p className="medical-conditions">Medical: {member.medicalConditions}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="info-section">
          <div className="section-header">
            <h2>Recent Appointments</h2>
          </div>
          
          <div className="appointments-list">
            {patientData.personalInfo.appointments?.map((appointment, index) => (
              <div key={index} className="appointment-item">
                <div className="appointment-date">
                  <span className="date">{appointment.date}</span>
                  <span className="time">{appointment.time}</span>
                </div>
                <div className="appointment-details">
                  <h4>{appointment.doctor}</h4>
                  <p className="specialty">{appointment.specialty}</p>
                  <p className="hospital">{appointment.hospital}</p>
                </div>
                <div className={`appointment-status ${appointment.status.toLowerCase()}`}>
                  {appointment.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preferences */}
        <div className="info-section">
          <div className="section-header">
            <h2>Preferences</h2>
          </div>
          
          <div className="preferences-grid">
            <div className="preference-item">
              <span className="pref-label">Preferred Language:</span>
              <span className="pref-value">{patientData.personalInfo.preferences?.language}</span>
            </div>
            <div className="preference-item">
              <span className="pref-label">Communication Mode:</span>
              <span className="pref-value">{patientData.personalInfo.preferences?.communicationMode}</span>
            </div>
            <div className="preference-item">
              <span className="pref-label">Appointment Reminders:</span>
              <span className={`pref-status ${patientData.personalInfo.preferences?.appointmentReminder ? 'enabled' : 'disabled'}`}>
                {patientData.personalInfo.preferences?.appointmentReminder ? '✓ Enabled' : '✗ Disabled'}
              </span>
            </div>
            <div className="preference-item">
              <span className="pref-label">Two Factor Auth:</span>
              <span className={`pref-status ${patientData.personalInfo.preferences?.twoFactorAuth ? 'enabled' : 'disabled'}`}>
                {patientData.personalInfo.preferences?.twoFactorAuth ? '✓ Enabled' : '✗ Disabled'}
              </span>
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="info-section">
          <div className="section-header">
            <h2>Social Media</h2>
          </div>
          
          <div className="social-grid">
            {patientData.personalInfo.socialInfo?.twitter && (
              <div className="social-item">
                <span className="social-icon">🐦</span>
                <span className="social-handle">{patientData.personalInfo.socialInfo.twitter}</span>
              </div>
            )}
            {patientData.personalInfo.socialInfo?.linkedin && (
              <div className="social-item">
                <span className="social-icon">💼</span>
                <span className="social-handle">{patientData.personalInfo.socialInfo.linkedin}</span>
              </div>
            )}
            {patientData.personalInfo.socialInfo?.facebook && (
              <div className="social-item">
                <span className="social-icon">📘</span>
                <span className="social-handle">{patientData.personalInfo.socialInfo.facebook}</span>
              </div>
            )}
            {patientData.personalInfo.socialInfo?.instagram && (
              <div className="social-item">
                <span className="social-icon">📷</span>
                <span className="social-handle">{patientData.personalInfo.socialInfo.instagram}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && renderEditModal()}
    </div>
  );
};

export default PatientProfile;