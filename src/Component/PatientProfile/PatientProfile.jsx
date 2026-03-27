import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PatientProfile.css';
import { API_BASE_URL } from '../../axiosConfig';

const PatientProfile = () => {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [showNotification, setShowNotification] = useState({ show: false, message: '', type: '' });

  // Essential patient data with complete insurance fields
  const [patientData, setPatientData] = useState({
    personalInfo: {
      id: "",
      name: "",
      age: null,
      gender: "",
      dateOfBirth: "",
      bloodGroup: "",
      email: "",
      phone: "",
      address: {
        line1: "",
        line2: "",
        city: "",
        state: "",
        pincode: "",
        country: ""
      },
      emergencyContact: {
        name: "",
        relation: "",
        phone: ""
      }
    },
    medicalInfo: {
      height: "",
      weight: "",
      allergies: [],
      chronicConditions: [],
      currentMedications: []
    },
    insuranceInfo: {
      provider: "",
      policyNumber: "",
      groupNumber: "",
      coverageAmount: "",
      validityDate: "",
      nominee: "",
      relationship: "",
      insuranceType: ""
    }
  });

  // List of insurance providers for dropdown
  const insuranceProviders = [
    "Star Health Insurance",
    "ICICI Lombard",
    "HDFC ERGO",
    "Bajaj Allianz",
    "New India Assurance",
    "National Insurance",
    "Oriental Insurance",
    "United India Insurance",
    "Max Bupa Health Insurance",
    "Care Health Insurance"
  ];

  // List of insurance types for dropdown
  const insuranceTypes = [
    "Individual",
    "Family Floater",
    "Senior Citizen",
    "Critical Illness",
    "Group Health Insurance",
    "Maternity Insurance"
  ];

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    name: "",
    age: "",
    gender: "",
    dateOfBirth: "",
    bloodGroup: "",
    email: "",
    phone: "",
    address: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      pincode: "",
      country: ""
    },
    emergencyContact: {
      name: "",
      relation: "",
      phone: ""
    },
    height: "",
    weight: "",
    allergies: "",
    chronicConditions: "",
    currentMedications: "",
    insuranceProvider: "",
    policyNumber: "",
    groupNumber: "",
    coverageAmount: "",
    validityDate: "",
    nominee: "",
    relationship: "",
    insuranceType: ""
  });

  // Fetch profile data on component mount
  useEffect(() => {
    fetchPatientProfile();
  }, []);

  // GET API - Fetch patient profile
  const fetchPatientProfile = async () => {
    try {
      setLoading(true);
      
      const patientId = localStorage.getItem("patientId");
      const token = localStorage.getItem('token');
      
      if (!patientId) {
        showNotificationMessage('Patient ID not found. Please login again.', 'error');
        setLoading(false);
        return;
      }
      
      console.log('Fetching profile for Patient ID:', patientId);
      
      // GET request to fetch patient data
      const response = await axios.get(`${API_BASE_URL}/api/auth/patients/${patientId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('GET API Response:', response.data);

      // FIXED: API returns data in 'user' object
      if (response.data.success && response.data.user) {
        const userData = response.data.user;
        
        // Transform API data to match component structure
        const formattedData = {
          personalInfo: {
            id: userData._id,
            name: userData.fullName || '',
            age: userData.age || null,
            gender: userData.gender || '',
            dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : '',
            bloodGroup: userData.bloodGroup || '',
            email: userData.email || '',
            phone: userData.phoneNumber || '',
            address: userData.address || {
              line1: '',
              line2: '',
              city: '',
              state: '',
              pincode: '',
              country: ''
            },
            emergencyContact: userData.emergencyContact || {
              name: '',
              relation: '',
              phone: ''
            }
          },
          medicalInfo: {
            height: userData.medicalInfo?.height || '',
            weight: userData.medicalInfo?.weight || '',
            allergies: Array.isArray(userData.medicalInfo?.allergies) ? userData.medicalInfo.allergies : [],
            chronicConditions: Array.isArray(userData.medicalInfo?.chronicConditions) ? userData.medicalInfo.chronicConditions : [],
            currentMedications: Array.isArray(userData.medicalInfo?.currentMedications) ? userData.medicalInfo.currentMedications : []
          },
          insuranceInfo: {
            provider: userData.insuranceInfo?.provider || '',
            policyNumber: userData.insuranceInfo?.policyNumber || '',
            groupNumber: userData.insuranceInfo?.groupNumber || '',
            coverageAmount: userData.insuranceInfo?.coverageAmount || '',
            validityDate: userData.insuranceInfo?.validityDate ? userData.insuranceInfo.validityDate.split('T')[0] : '',
            nominee: userData.insuranceInfo?.nominee || '',
            relationship: userData.insuranceInfo?.relationship || '',
            insuranceType: userData.insuranceInfo?.insuranceType || ''
          }
        };
        
        setPatientData(formattedData);
        
        // Initialize edit form data
        initializeEditForm(formattedData);
      } else {
        showNotificationMessage(response.data.message || 'Failed to load profile data', 'error');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      if (err.response) {
        showNotificationMessage(err.response.data?.message || `Error: ${err.response.status} - ${err.response.statusText}`, 'error');
      } else if (err.request) {
        showNotificationMessage('Network error. Please check your connection.', 'error');
      } else {
        showNotificationMessage('Failed to load profile data. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // PATCH API - Update patient profile
  const updatePatientProfile = async (formData) => {
    try {
      const patientId = localStorage.getItem("patientId");
      const token = localStorage.getItem('token');
      
      const response = await axios.patch(`${API_BASE_URL}/api/auth/update-patient/${patientId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Initialize edit form data
  const initializeEditForm = (data) => {
    setEditFormData({
      name: data.personalInfo.name || "",
      age: data.personalInfo.age || "",
      gender: data.personalInfo.gender || "",
      dateOfBirth: data.personalInfo.dateOfBirth || "",
      bloodGroup: data.personalInfo.bloodGroup || "",
      email: data.personalInfo.email || "",
      phone: data.personalInfo.phone || "",
      address: {
        line1: data.personalInfo.address?.line1 || "",
        line2: data.personalInfo.address?.line2 || "",
        city: data.personalInfo.address?.city || "",
        state: data.personalInfo.address?.state || "",
        pincode: data.personalInfo.address?.pincode || "",
        country: data.personalInfo.address?.country || "India"
      },
      emergencyContact: {
        name: data.personalInfo.emergencyContact?.name || "",
        relation: data.personalInfo.emergencyContact?.relation || "",
        phone: data.personalInfo.emergencyContact?.phone || ""
      },
      height: data.medicalInfo.height || "",
      weight: data.medicalInfo.weight || "",
      allergies: Array.isArray(data.medicalInfo.allergies) ? data.medicalInfo.allergies.join(', ') : "",
      chronicConditions: Array.isArray(data.medicalInfo.chronicConditions) ? data.medicalInfo.chronicConditions.join(', ') : "",
      currentMedications: Array.isArray(data.medicalInfo.currentMedications) ? data.medicalInfo.currentMedications.join(', ') : "",
      insuranceProvider: data.insuranceInfo.provider || "",
      policyNumber: data.insuranceInfo.policyNumber || "",
      groupNumber: data.insuranceInfo.groupNumber || "",
      coverageAmount: data.insuranceInfo.coverageAmount || "",
      validityDate: data.insuranceInfo.validityDate || "",
      nominee: data.insuranceInfo.nominee || "",
      relationship: data.insuranceInfo.relationship || "",
      insuranceType: data.insuranceInfo.insuranceType || ""
    });
  };

  // Open edit modal
  const initializeEditFormModal = () => {
    initializeEditForm(patientData);
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
  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      
      // Prepare form data for API
      const formData = new FormData();
      
      // Add basic fields
      formData.append('fullName', editFormData.name);
      formData.append('email', editFormData.email);
      formData.append('phoneNumber', editFormData.phone);
      formData.append('age', editFormData.age.toString());
      formData.append('gender', editFormData.gender);
      formData.append('bloodGroup', editFormData.bloodGroup);
      formData.append('dateOfBirth', editFormData.dateOfBirth);
      
      // Add address
      const addressObj = {
        line1: editFormData.address.line1,
        line2: editFormData.address.line2,
        city: editFormData.address.city,
        state: editFormData.address.state,
        pincode: editFormData.address.pincode,
        country: editFormData.address.country || "India"
      };
      formData.append('address', JSON.stringify(addressObj));
      
      // Add emergency contact
      const emergencyObj = {
        name: editFormData.emergencyContact.name,
        relation: editFormData.emergencyContact.relation,
        phone: editFormData.emergencyContact.phone
      };
      formData.append('emergencyContact', JSON.stringify(emergencyObj));
      
      // Add medical info
      const medicalObj = {
        height: editFormData.height,
        weight: editFormData.weight,
        allergies: editFormData.allergies ? editFormData.allergies.split(',').map(item => item.trim()).filter(item => item) : [],
        chronicConditions: editFormData.chronicConditions ? editFormData.chronicConditions.split(',').map(item => item.trim()).filter(item => item) : [],
        currentMedications: editFormData.currentMedications ? editFormData.currentMedications.split(',').map(item => item.trim()).filter(item => item) : []
      };
      formData.append('medicalInfo', JSON.stringify(medicalObj));
      
      // Add insurance info
      const insuranceObj = {
        provider: editFormData.insuranceProvider,
        policyNumber: editFormData.policyNumber,
        groupNumber: editFormData.groupNumber,
        coverageAmount: editFormData.coverageAmount,
        validityDate: editFormData.validityDate,
        nominee: editFormData.nominee,
        relationship: editFormData.relationship,
        insuranceType: editFormData.insuranceType
      };
      formData.append('insuranceInfo', JSON.stringify(insuranceObj));
      
      // Add profile photo if changed
      if (profileImage && !profileImage.startsWith('http')) {
        // Convert base64 to blob
        const response = await fetch(profileImage);
        const blob = await response.blob();
        formData.append('profilePhoto', blob, 'profile.jpg');
      }
      
      // Call the update API
      const response = await updatePatientProfile(formData);
      
      if (response.data.success) {
        showNotificationMessage('Profile updated successfully!', 'success');
        
        // Fetch fresh data to update the state
        await fetchPatientProfile();
        setIsEditing(false);
        setProfileImage(null);
      } else {
        showNotificationMessage(response.data.message || 'Failed to update profile', 'error');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      console.error('Error details:', err.response?.data);
      showNotificationMessage(err.response?.data?.message || err.response?.data?.error || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    initializeEditForm(patientData);
    setProfileImage(null);
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

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Notification Component
  const Notification = () => (
    showNotification.show && (
      <div className={`notification ${showNotification.type}`}>
        {showNotification.message}
      </div>
    )
  );

  // Loading Spinner
  if (loading && !patientData.personalInfo.id) {
    return (
      <div className="patient-profile">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  // Render Edit Modal
  const renderEditModal = () => (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Edit Profile</h3>
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
                    value={patientData.personalInfo.id}
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
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
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
            </div>

            {/* Address */}
            <div className="form-section">
              <h4>Address</h4>
              <div className="form-group">
                <label>Address Line 1</label>
                <input
                  type="text"
                  name="address.line1"
                  value={editFormData.address?.line1 || ''}
                  onChange={handleEditFormChange}
                />
              </div>
              <div className="form-group">
                <label>Address Line 2</label>
                <input
                  type="text"
                  name="address.line2"
                  value={editFormData.address?.line2 || ''}
                  onChange={handleEditFormChange}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="address.city"
                    value={editFormData.address?.city || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="address.state"
                    value={editFormData.address?.state || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Pincode</label>
                  <input
                    type="text"
                    name="address.pincode"
                    value={editFormData.address?.pincode || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    name="address.country"
                    value={editFormData.address?.country || 'India'}
                    onChange={handleEditFormChange}
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="form-section">
              <h4>Emergency Contact</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    name="emergencyContact.name"
                    value={editFormData.emergencyContact?.name || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Relation</label>
                  <input
                    type="text"
                    name="emergencyContact.relation"
                    value={editFormData.emergencyContact?.relation || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="emergencyContact.phone"
                  value={editFormData.emergencyContact?.phone || ''}
                  onChange={handleEditFormChange}
                />
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
                    name="height"
                    value={editFormData.height || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input
                    type="text"
                    name="weight"
                    value={editFormData.weight || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Allergies (comma separated)</label>
                <input
                  type="text"
                  name="allergies"
                  value={editFormData.allergies || ''}
                  onChange={handleEditFormChange}
                  placeholder="e.g., Penicillin, Dust, Pollen"
                />
              </div>

              <div className="form-group">
                <label>Chronic Conditions (comma separated)</label>
                <input
                  type="text"
                  name="chronicConditions"
                  value={editFormData.chronicConditions || ''}
                  onChange={handleEditFormChange}
                  placeholder="e.g., Hypertension, Diabetes"
                />
              </div>

              <div className="form-group">
                <label>Current Medications (comma separated)</label>
                <input
                  type="text"
                  name="currentMedications"
                  value={editFormData.currentMedications || ''}
                  onChange={handleEditFormChange}
                  placeholder="e.g., Metformin 500mg, Lisinopril 10mg"
                />
              </div>
            </div>

            {/* Insurance Information */}
            <div className="form-section">
              <h4>Insurance Information</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Insurance Provider</label>
                  <select
                    name="insuranceProvider"
                    value={editFormData.insuranceProvider || ''}
                    onChange={handleEditFormChange}
                  >
                    <option value="">Select Insurance Provider</option>
                    {insuranceProviders.map(provider => (
                      <option key={provider} value={provider}>{provider}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Insurance Type</label>
                  <select
                    name="insuranceType"
                    value={editFormData.insuranceType || ''}
                    onChange={handleEditFormChange}
                  >
                    <option value="">Select Insurance Type</option>
                    {insuranceTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Policy Number</label>
                  <input
                    type="text"
                    name="policyNumber"
                    value={editFormData.policyNumber || ''}
                    onChange={handleEditFormChange}
                    placeholder="e.g., SHI-12345-6789"
                  />
                </div>
                <div className="form-group">
                  <label>Group Number</label>
                  <input
                    type="text"
                    name="groupNumber"
                    value={editFormData.groupNumber || ''}
                    onChange={handleEditFormChange}
                    placeholder="e.g., GRP-2024-001"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Coverage Amount</label>
                  <input
                    type="text"
                    name="coverageAmount"
                    value={editFormData.coverageAmount || ''}
                    onChange={handleEditFormChange}
                    placeholder="e.g., ₹5,00,000"
                  />
                </div>
                <div className="form-group">
                  <label>Validity Date</label>
                  <input
                    type="date"
                    name="validityDate"
                    value={editFormData.validityDate || ''}
                    onChange={handleEditFormChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nominee Name</label>
                  <input
                    type="text"
                    name="nominee"
                    value={editFormData.nominee || ''}
                    onChange={handleEditFormChange}
                    placeholder="e.g., Priya Sharma"
                  />
                </div>
                <div className="form-group">
                  <label>Relationship with Nominee</label>
                  <input
                    type="text"
                    name="relationship"
                    value={editFormData.relationship || ''}
                    onChange={handleEditFormChange}
                    placeholder="e.g., Spouse"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" className="btn-secondary" onClick={handleCancelEdit} disabled={loading}>
              Cancel
            </button>
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
          <button className="btn-primary" onClick={initializeEditFormModal} disabled={loading}>
            <span className="btn-icon">✏️</span> Edit Profile
          </button>
        </div>
      </div>

      {/* Main Content - Essential Information Display */}
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
                <span>{formatDate(patientData.personalInfo.dateOfBirth)}</span>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">⚥</div>
              <div className="info-content">
                <label>Gender</label>
                <span>{patientData.personalInfo.gender ? patientData.personalInfo.gender.charAt(0).toUpperCase() + patientData.personalInfo.gender.slice(1) : 'Not specified'}</span>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">💉</div>
              <div className="info-content">
                <label>Blood Group</label>
                <span>{patientData.personalInfo.bloodGroup || 'Not specified'}</span>
              </div>
            </div>

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
          </div>
        </div>

        {/* Address Section */}
        <div className="info-section">
          <div className="section-header">
            <h2>Address</h2>
          </div>
          
          <div className="address-card">
            <div className="address-icon">📍</div>
            <div className="address-details">
              {patientData.personalInfo.address?.line1 && <p>{patientData.personalInfo.address.line1}</p>}
              {patientData.personalInfo.address?.line2 && <p>{patientData.personalInfo.address.line2}</p>}
              <p>
                {patientData.personalInfo.address?.city && `${patientData.personalInfo.address.city}, `}
                {patientData.personalInfo.address?.state && `${patientData.personalInfo.address.state} `}
                {patientData.personalInfo.address?.pincode && `- ${patientData.personalInfo.address.pincode}`}
              </p>
              {patientData.personalInfo.address?.country && <p>{patientData.personalInfo.address.country}</p>}
              {!patientData.personalInfo.address?.line1 && !patientData.personalInfo.address?.city && (
                <p>No address provided</p>
              )}
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="info-section">
          <div className="section-header">
            <h2>Emergency Contact</h2>
          </div>
          
          <div className="emergency-card">
            <div className="emergency-icon">🆘</div>
            <div className="emergency-details">
              <h3>{patientData.personalInfo.emergencyContact?.name || 'Not specified'}</h3>
              <p className="relation">{patientData.personalInfo.emergencyContact?.relation}</p>
              <p className="phone">{patientData.personalInfo.emergencyContact?.phone}</p>
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
              <h3>Vital Stats</h3>
              <div className="vital-item">
                <span className="vital-label">Height:</span>
                <span className="vital-value">{patientData.medicalInfo?.height || 'Not specified'}</span>
              </div>
              <div className="vital-item">
                <span className="vital-label">Weight:</span>
                <span className="vital-value">{patientData.medicalInfo?.weight || 'Not specified'}</span>
              </div>
              <div className="vital-item">
                <span className="vital-label">Blood Group:</span>
                <span className="vital-value">{patientData.personalInfo.bloodGroup || 'Not specified'}</span>
              </div>
            </div>

            <div className="medical-details">
              {patientData.medicalInfo?.allergies?.length > 0 && (
                <div className="detail-item">
                  <h4>Allergies</h4>
                  <ul>
                    {patientData.medicalInfo.allergies.map((allergy, index) => (
                      <li key={index}>{allergy}</li>
                    ))}
                  </ul>
                </div>
              )}

              {patientData.medicalInfo?.chronicConditions?.length > 0 && (
                <div className="detail-item">
                  <h4>Chronic Conditions</h4>
                  <ul>
                    {patientData.medicalInfo.chronicConditions.map((condition, index) => (
                      <li key={index}>{condition}</li>
                    ))}
                  </ul>
                </div>
              )}

              {patientData.medicalInfo?.currentMedications?.length > 0 && (
                <div className="detail-item">
                  <h4>Current Medications</h4>
                  <ul>
                    {patientData.medicalInfo.currentMedications.map((med, index) => (
                      <li key={index}>{med}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(!patientData.medicalInfo?.allergies?.length && 
                !patientData.medicalInfo?.chronicConditions?.length && 
                !patientData.medicalInfo?.currentMedications?.length) && (
                <p className="no-data">No medical information provided</p>
              )}
            </div>
          </div>
        </div>

        {/* Insurance Information */}
        <div className="info-section">
          <div className="section-header">
            <h2>Insurance Information</h2>
          </div>
          
          {patientData.insuranceInfo?.provider ? (
            <div className="insurance-card">
              <div className="insurance-header">
                <h3>{patientData.insuranceInfo.provider}</h3>
                <span className="insurance-type">{patientData.insuranceInfo.insuranceType}</span>
              </div>
              <div className="insurance-details">
                <div className="detail-row">
                  <span className="label">Policy Number:</span>
                  <span className="value">{patientData.insuranceInfo.policyNumber}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Group Number:</span>
                  <span className="value">{patientData.insuranceInfo.groupNumber}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Coverage Amount:</span>
                  <span className="value">{patientData.insuranceInfo.coverageAmount}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Validity:</span>
                  <span className="value">{formatDate(patientData.insuranceInfo.validityDate)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Nominee:</span>
                  <span className="value">{patientData.insuranceInfo.nominee} ({patientData.insuranceInfo.relationship})</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-insurance">
              <p>No insurance information added yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && renderEditModal()}
    </div>
  );
};

export default PatientProfile;