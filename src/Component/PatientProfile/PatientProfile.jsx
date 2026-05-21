import React, { useState, useEffect } from "react";
import axios from "axios";
import "./PatientProfile.css";
import { API_BASE_URL } from "../../axiosConfig";



const PatientProfile = () => {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [showNotification, setShowNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

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
      profilePhoto: "",
      address: {
        line1: "",
        line2: "",
        city: "",
        state: "",
        pincode: "",
        country: "",
      },
      emergencyContact: {
        name: "",
        relation: "",
        phone: "",
      },
    },
    medicalInfo: {
      height: "",
      weight: "",
      allergies: [],
      chronicConditions: [],
      currentMedications: [],
    },
    insuranceInfo: {
      provider: "",
      policyNumber: "",
      groupNumber: "",
      coverageAmount: "",
      validityDate: "",
      nominee: "",
      relationship: "",
      insuranceType: "",
    },
  });

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
    "Care Health Insurance",
  ];

  const insuranceTypes = [
    "Individual",
    "Family Floater",
    "Senior Citizen",
    "Critical Illness",
    "Group Health Insurance",
    "Maternity Insurance",
  ];

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
      country: "India",
    },
    emergencyContact: { name: "", relation: "", phone: "" },
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
    insuranceType: "",
  });

  useEffect(() => {
    fetchPatientProfile();
  }, []);

  const getProfilePhotoUrl = (userData) => {
    if (userData.profilePhoto) {
      if (
        typeof userData.profilePhoto === "object" &&
        userData.profilePhoto.url
      ) {
        return userData.profilePhoto.url;
      }
      if (typeof userData.profilePhoto === "string") {
        return userData.profilePhoto;
      }
    }
    return "";
  };

  const fetchPatientProfile = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      if (!userId) {
        showNotificationMessage(
          "User ID not found. Please login again.",
          "error",
        );
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/auth/getUser/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success && response.data.user) {
        const userData = response.data.user;
        const profilePhotoUrl = getProfilePhotoUrl(userData);

        const formattedData = {
          personalInfo: {
            id: userData._id,
            name: userData.fullName || "",
            age: userData.age || null,
            gender: userData.gender || "",
            dateOfBirth: userData.dateOfBirth
              ? userData.dateOfBirth.split("T")[0]
              : "",
            bloodGroup: userData.bloodGroup || "",
            email: userData.email || "",
            phone: userData.phoneNumber || "",
            profilePhoto: profilePhotoUrl,
            address: userData.address || {
              line1: "",
              line2: "",
              city: "",
              state: "",
              pincode: "",
              country: "",
            },
            emergencyContact: userData.emergencyContact || {
              name: "",
              relation: "",
              phone: "",
            },
          },
          medicalInfo: {
            height: userData.medicalInfo?.height || "",
            weight: userData.medicalInfo?.weight || "",
            allergies: Array.isArray(userData.medicalInfo?.allergies)
              ? userData.medicalInfo.allergies
              : [],
            chronicConditions: Array.isArray(
              userData.medicalInfo?.chronicConditions,
            )
              ? userData.medicalInfo.chronicConditions
              : [],
            currentMedications: Array.isArray(
              userData.medicalInfo?.currentMedications,
            )
              ? userData.medicalInfo.currentMedications
              : [],
          },
          insuranceInfo: {
            provider: userData.insuranceInfo?.provider || "",
            policyNumber: userData.insuranceInfo?.policyNumber || "",
            groupNumber: userData.insuranceInfo?.groupNumber || "",
            coverageAmount: userData.insuranceInfo?.coverageAmount || "",
            validityDate: userData.insuranceInfo?.validityDate
              ? userData.insuranceInfo.validityDate.split("T")[0]
              : "",
            nominee: userData.insuranceInfo?.nominee || "",
            relationship: userData.insuranceInfo?.relationship || "",
            insuranceType: userData.insuranceInfo?.insuranceType || "",
          },
        };

        setPatientData(formattedData);
        initializeEditForm(formattedData);
      } else {
        showNotificationMessage(
          response.data.message || "Failed to load profile data",
          "error",
        );
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      showNotificationMessage(
        "Failed to load profile data. Please try again.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const updatePatientProfile = async (formData) => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    return await axios.patch(
      `${API_BASE_URL}/api/auth/update/${userId}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      },
    );
  };

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
        country: data.personalInfo.address?.country || "India",
      },
      emergencyContact: {
        name: data.personalInfo.emergencyContact?.name || "",
        relation: data.personalInfo.emergencyContact?.relation || "",
        phone: data.personalInfo.emergencyContact?.phone || "",
      },
      height: data.medicalInfo.height || "",
      weight: data.medicalInfo.weight || "",
      allergies: Array.isArray(data.medicalInfo.allergies)
        ? data.medicalInfo.allergies.join(", ")
        : "",
      chronicConditions: Array.isArray(data.medicalInfo.chronicConditions)
        ? data.medicalInfo.chronicConditions.join(", ")
        : "",
      currentMedications: Array.isArray(data.medicalInfo.currentMedications)
        ? data.medicalInfo.currentMedications.join(", ")
        : "",
      insuranceProvider: data.insuranceInfo.provider || "",
      policyNumber: data.insuranceInfo.policyNumber || "",
      groupNumber: data.insuranceInfo.groupNumber || "",
      coverageAmount: data.insuranceInfo.coverageAmount || "",
      validityDate: data.insuranceInfo.validityDate || "",
      nominee: data.insuranceInfo.nominee || "",
      relationship: data.insuranceInfo.relationship || "",
      insuranceType: data.insuranceInfo.insuranceType || "",
    });
  };

  const openEditModal = () => {
    initializeEditForm(patientData);
    setProfileImage(null);
    setProfileImageFile(null);
    setIsEditing(true);
  };

  const showNotificationMessage = (message, type) => {
    setShowNotification({ show: true, message, type });
    setTimeout(() => {
      setShowNotification({ show: false, message: "", type: "" });
    }, 3000);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotificationMessage("File size should be less than 5MB", "error");
        return;
      }
      if (!file.type.startsWith("image/")) {
        showNotificationMessage("Please upload an image file", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
        setProfileImageFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setProfileImageFile(null);
    showNotificationMessage(
      "Profile picture will be removed on save",
      "success",
    );
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const formData = new FormData();

      formData.append("fullName", editFormData.name);
      formData.append("email", editFormData.email);
      formData.append("phoneNumber", editFormData.phone);
      formData.append("age", editFormData.age.toString());
      formData.append("gender", editFormData.gender);
      formData.append("bloodGroup", editFormData.bloodGroup);
      formData.append("dateOfBirth", editFormData.dateOfBirth);

      const addressObj = {
        ...editFormData.address,
        country: editFormData.address.country || "India",
      };
      formData.append("address", JSON.stringify(addressObj));
      formData.append(
        "emergencyContact",
        JSON.stringify(editFormData.emergencyContact),
      );

      const medicalObj = {
        height: editFormData.height,
        weight: editFormData.weight,
        allergies: editFormData.allergies
          ? editFormData.allergies
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item)
          : [],
        chronicConditions: editFormData.chronicConditions
          ? editFormData.chronicConditions
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item)
          : [],
        currentMedications: editFormData.currentMedications
          ? editFormData.currentMedications
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item)
          : [],
      };
      formData.append("medicalInfo", JSON.stringify(medicalObj));

      const insuranceObj = {
        provider: editFormData.insuranceProvider,
        policyNumber: editFormData.policyNumber,
        groupNumber: editFormData.groupNumber,
        coverageAmount: editFormData.coverageAmount,
        validityDate: editFormData.validityDate,
        nominee: editFormData.nominee,
        relationship: editFormData.relationship,
        insuranceType: editFormData.insuranceType,
      };
      formData.append("insuranceInfo", JSON.stringify(insuranceObj));

      if (profileImageFile) {
        formData.append("profilePhoto", profileImageFile);
      } else if (
        profileImage === null &&
        patientData.personalInfo.profilePhoto
      ) {
        formData.append("removeProfilePhoto", "true");
      }

      const response = await updatePatientProfile(formData);

      if (response.data.success) {
        showNotificationMessage("Profile updated successfully!", "success");
        await fetchPatientProfile();
        setIsEditing(false);
        setProfileImage(null);
        setProfileImageFile(null);
      } else {
        showNotificationMessage(
          response.data.message || "Failed to update profile",
          "error",
        );
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      showNotificationMessage(
        err.response?.data?.message || "Failed to update profile",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    initializeEditForm(patientData);
    setProfileImage(null);
    setProfileImageFile(null);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setEditFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setEditFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading && !patientData.personalInfo.id) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {showNotification.show && (
        <div className={`notification ${showNotification.type}`}>
          {showNotification.message}
        </div>
      )}

      {/* Header Section */}
      <div className="profile-header">
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar">
            {patientData.personalInfo.profilePhoto ? (
              <img
                src={patientData.personalInfo.profilePhoto}
                alt={patientData.personalInfo.name}
              />
            ) : (
              <div className="avatar-placeholder">
                {patientData.personalInfo.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
            )}
          </div>
        </div>

        <div className="profile-info">
          <h1>{patientData.personalInfo.name}</h1>
          <p className="patient-id">
            Patient ID: {patientData.personalInfo.id}
          </p>
          <div className="badge-group">
            <span className="badge">
              {patientData.personalInfo.bloodGroup || "Blood Group"}
            </span>
            <span className="badge">
              {patientData.personalInfo.age || "--"} years
            </span>
            <span className="badge">
              {patientData.personalInfo.gender || "Gender"}
            </span>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="btn-primary"
            onClick={openEditModal}
            disabled={loading}
          >
            ✏️ Edit Profile
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="profile-content">
        {/* Personal Information */}
        <div className="info-card-modern">
          <div className="card-header">
            <h2>Personal Information</h2>
          </div>
          <div className="info-grid">
            <div className="info-item">
              <label>Full Name</label>
              <span>{patientData.personalInfo.name}</span>
            </div>
            <div className="info-item">
              <label>Date of Birth</label>
              <span>{formatDate(patientData.personalInfo.dateOfBirth)}</span>
            </div>
            <div className="info-item">
              <label>Gender</label>
              <span>{patientData.personalInfo.gender || "Not specified"}</span>
            </div>
            <div className="info-item">
              <label>Blood Group</label>
              <span>
                {patientData.personalInfo.bloodGroup || "Not specified"}
              </span>
            </div>
            <div className="info-item">
              <label>Email</label>
              <span>{patientData.personalInfo.email}</span>
            </div>
            <div className="info-item">
              <label>Phone</label>
              <span>{patientData.personalInfo.phone}</span>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="info-card-modern">
          <div className="card-header">
            <h2>Address</h2>
          </div>
          <div className="address-display">
            <p>
              {patientData.personalInfo.address?.line1 || "No address provided"}
            </p>
            {patientData.personalInfo.address?.line2 && (
              <p>{patientData.personalInfo.address.line2}</p>
            )}
            <p>
              {patientData.personalInfo.address?.city &&
                `${patientData.personalInfo.address.city}, `}
              {patientData.personalInfo.address?.state &&
                `${patientData.personalInfo.address.state} `}
              {patientData.personalInfo.address?.pincode &&
                `- ${patientData.personalInfo.address.pincode}`}
            </p>
            {patientData.personalInfo.address?.country && (
              <p>{patientData.personalInfo.address.country}</p>
            )}
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="info-card-modern">
          <div className="card-header">
            <h2>Emergency Contact</h2>
          </div>
          <div className="emergency-display">
            <div className="emergency-icon">🆘</div>
            <div className="emergency-details">
              <h3>
                {patientData.personalInfo.emergencyContact?.name ||
                  "Not specified"}
              </h3>
              <p>{patientData.personalInfo.emergencyContact?.relation}</p>
              <p className="phone">
                {patientData.personalInfo.emergencyContact?.phone}
              </p>
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="info-card-modern">
          <div className="card-header">
            <h2>Medical Information</h2>
          </div>
          <div className="medical-grid">
            <div className="vital-stats">
              <h3>Vital Stats</h3>
              <div className="vital-row">
                <span>Height:</span>
                <strong>{patientData.medicalInfo?.height || "--"} cm</strong>
              </div>
              <div className="vital-row">
                <span>Weight:</span>
                <strong>{patientData.medicalInfo?.weight || "--"} kg</strong>
              </div>
            </div>
            <div className="conditions-list">
              {patientData.medicalInfo?.allergies?.length > 0 && (
                <div>
                  <h4>Allergies</h4>
                  <div className="tags">
                    {patientData.medicalInfo.allergies.map((a, i) => (
                      <span key={i} className="tag">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {patientData.medicalInfo?.chronicConditions?.length > 0 && (
                <div>
                  <h4>Chronic Conditions</h4>
                  <div className="tags">
                    {patientData.medicalInfo.chronicConditions.map((c, i) => (
                      <span key={i} className="tag">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {patientData.medicalInfo?.currentMedications?.length > 0 && (
                <div>
                  <h4>Current Medications</h4>
                  <div className="tags">
                    {patientData.medicalInfo.currentMedications.map((m, i) => (
                      <span key={i} className="tag">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {!patientData.medicalInfo?.allergies?.length &&
                !patientData.medicalInfo?.chronicConditions?.length &&
                !patientData.medicalInfo?.currentMedications?.length && (
                  <p className="no-data">No medical information provided</p>
                )}
            </div>
          </div>
        </div>

        {/* Insurance Information */}
        <div className="info-card-modern">
          <div className="card-header">
            <h2>Insurance Information</h2>
          </div>
          {patientData.insuranceInfo?.provider ? (
            <div className="insurance-display">
              <div className="insurance-header">
                <h3>{patientData.insuranceInfo.provider}</h3>
                <span className="insurance-badge">
                  {patientData.insuranceInfo.insuranceType}
                </span>
              </div>
              <div className="insurance-details">
                <div>
                  <span>Policy Number:</span>{" "}
                  <strong>{patientData.insuranceInfo.policyNumber}</strong>
                </div>
                <div>
                  <span>Group Number:</span>{" "}
                  <strong>{patientData.insuranceInfo.groupNumber}</strong>
                </div>
                <div>
                  <span>Coverage Amount:</span>{" "}
                  <strong>{patientData.insuranceInfo.coverageAmount}</strong>
                </div>
                <div>
                  <span>Validity:</span>{" "}
                  <strong>
                    {formatDate(patientData.insuranceInfo.validityDate)}
                  </strong>
                </div>
                <div>
                  <span>Nominee:</span>{" "}
                  <strong>
                    {patientData.insuranceInfo.nominee} (
                    {patientData.insuranceInfo.relationship})
                  </strong>
                </div>
              </div>
            </div>
          ) : (
            <p className="no-data">No insurance information added yet.</p>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button className="close-modal" onClick={handleCancelEdit}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {/* Profile Picture */}
              <div className="form-section">
                <h4>Profile Picture</h4>
                <div className="profile-picture-edit">
                  <div className="avatar-preview">
                    {profileImage || patientData.personalInfo.profilePhoto ? (
                      <img
                        src={
                          profileImage || patientData.personalInfo.profilePhoto
                        }
                        alt="Profile"
                      />
                    ) : (
                      <div className="avatar-placeholder-md">
                        {editFormData.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                    )}
                  </div>
                  <div className="upload-actions">
                    <label className="upload-btn">
                      📷 Change Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        hidden
                      />
                    </label>
                    {(profileImage ||
                      patientData.personalInfo.profilePhoto) && (
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={handleRemoveImage}
                      >
                        🗑️ Remove
                      </button>
                    )}
                  </div>
                  <small>JPG, PNG, GIF (max 5MB)</small>
                </div>
              </div>

              {/* Personal Info */}
              <div className="form-section">
                <h4>Personal Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
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
                      className="readonly"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date of Birth *</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={editFormData.dateOfBirth}
                      onChange={handleEditFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Age</label>
                    <input
                      type="number"
                      name="age"
                      value={editFormData.age}
                      onChange={handleEditFormChange}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Gender *</label>
                    <select
                      name="gender"
                      value={editFormData.gender}
                      onChange={handleEditFormChange}
                      required
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Blood Group</label>
                    <select
                      name="bloodGroup"
                      value={editFormData.bloodGroup}
                      onChange={handleEditFormChange}
                    >
                      <option value="">Select</option>
                      <option>A+</option>
                      <option>A-</option>
                      <option>B+</option>
                      <option>B-</option>
                      <option>O+</option>
                      <option>O-</option>
                      <option>AB+</option>
                      <option>AB-</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleEditFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={editFormData.phone}
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
                  <label>Line 1</label>
                  <input
                    type="text"
                    name="address.line1"
                    value={editFormData.address.line1}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Line 2</label>
                  <input
                    type="text"
                    name="address.line2"
                    value={editFormData.address.line2}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      name="address.city"
                      value={editFormData.address.city}
                      onChange={handleEditFormChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      name="address.state"
                      value={editFormData.address.state}
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
                      value={editFormData.address.pincode}
                      onChange={handleEditFormChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      name="address.country"
                      value={editFormData.address.country}
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
                      value={editFormData.emergencyContact.name}
                      onChange={handleEditFormChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Relation</label>
                    <input
                      type="text"
                      name="emergencyContact.relation"
                      value={editFormData.emergencyContact.relation}
                      onChange={handleEditFormChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="emergencyContact.phone"
                    value={editFormData.emergencyContact.phone}
                    onChange={handleEditFormChange}
                  />
                </div>
              </div>

              {/* Medical */}
              <div className="form-section">
                <h4>Medical Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Height (cm)</label>
                    <input
                      type="text"
                      name="height"
                      value={editFormData.height}
                      onChange={handleEditFormChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Weight (kg)</label>
                    <input
                      type="text"
                      name="weight"
                      value={editFormData.weight}
                      onChange={handleEditFormChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Allergies (comma separated)</label>
                  <input
                    type="text"
                    name="allergies"
                    value={editFormData.allergies}
                    onChange={handleEditFormChange}
                    placeholder="e.g., Penicillin, Dust"
                  />
                </div>
                <div className="form-group">
                  <label>Chronic Conditions</label>
                  <input
                    type="text"
                    name="chronicConditions"
                    value={editFormData.chronicConditions}
                    onChange={handleEditFormChange}
                    placeholder="e.g., Diabetes, Hypertension"
                  />
                </div>
                <div className="form-group">
                  <label>Current Medications</label>
                  <input
                    type="text"
                    name="currentMedications"
                    value={editFormData.currentMedications}
                    onChange={handleEditFormChange}
                    placeholder="e.g., Metformin 500mg"
                  />
                </div>
              </div>

              {/* Insurance */}
              <div className="form-section">
                <h4>Insurance Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Provider</label>
                    <select
                      name="insuranceProvider"
                      value={editFormData.insuranceProvider}
                      onChange={handleEditFormChange}
                    >
                      <option value="">Select</option>
                      {insuranceProviders.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Insurance Type</label>
                    <select
                      name="insuranceType"
                      value={editFormData.insuranceType}
                      onChange={handleEditFormChange}
                    >
                      <option value="">Select</option>
                      {insuranceTypes.map((t) => (
                        <option key={t}>{t}</option>
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
                      value={editFormData.policyNumber}
                      onChange={handleEditFormChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Group Number</label>
                    <input
                      type="text"
                      name="groupNumber"
                      value={editFormData.groupNumber}
                      onChange={handleEditFormChange}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Coverage Amount</label>
                    <input
                      type="text"
                      name="coverageAmount"
                      value={editFormData.coverageAmount}
                      onChange={handleEditFormChange}
                      placeholder="₹5,00,000"
                    />
                  </div>
                  <div className="form-group">
                    <label>Validity Date</label>
                    <input
                      type="date"
                      name="validityDate"
                      value={editFormData.validityDate}
                      onChange={handleEditFormChange}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nominee</label>
                    <input
                      type="text"
                      name="nominee"
                      value={editFormData.nominee}
                      onChange={handleEditFormChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Relationship</label>
                    <input
                      type="text"
                      name="relationship"
                      value={editFormData.relationship}
                      onChange={handleEditFormChange}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={handleCancelEdit}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveProfile}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientProfile;
