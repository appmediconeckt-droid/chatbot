// ProfessionalProfileTable.jsx
import React, { useState, useEffect, useRef } from "react";
import "./ProfessionalProfileTable.css";
import { API_BASE_URL } from "../../doctorApi.js";
import axios from "../../../../axiosConfig.js";

// Default profile image (you can replace with actual image)
const DEFAULT_PROFILE_IMAGE = "data:image/jpeg;base64,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";

const ProfessionalProfileTable = () => {
  // Initial state with Dr. Joshua Rein's data from Mount Sinai profile
   const [profileData, setProfileData] = useState({
    personalDetails: {
      fullName: "",
      qualification: "",
      experience: "",
      languages: "",
      position: "",
      boardCertification: "",
      profileImage: DEFAULT_PROFILE_IMAGE,
    },
    professionalSummary: {
      about: "",
      expertise: "",
      awards: [],
      researchFocus: "",
    },
    educationTraining: {
      medicalDegree: "",
      residency: "",
      fellowship: "",
      specialTraining: "",
    },
    hospitalAffiliations: {
      primaryHospital: "",
      address: "",
      googleMapLink: "",
      allHospitals: [],
      contact: "",
      videoVisits: "",
    },
    clinicalFocus: {
      primarySpecialties: [],
      allConditions: [],
    },
    availability: {
      todayAvailable: false,
      onlineConsultation: false,
      location: "",
      acceptsNewPatients: false,
      consultationHours: "",
    },
    consultationFees: {
      initialConsultation: "",
      followUpVisit: "",
      onlineConsultation: "",
      insuranceAccepted: false,
    },
    insuranceInformation: {
      acceptedInsurances: [],
      insuranceNote: "",
    },
  });



  const [editingSection, setEditingSection] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapLinkInput, setMapLinkInput] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);

  // Animation for section transitions
  const [animatedSections, setAnimatedSections] = useState({});

const getDoctorId = () => {
    const authUser = localStorage.getItem("userData");

    if (!authUser) return null;

    try {
      const parsed = JSON.parse(authUser);
      return (
        parsed?.id ||
        parsed?.user?.id ||
        parsed?.data?.id ||
        parsed?.data?.user?.id ||
        null
      );
    } catch (error) {
      console.log("authUser parse error:", error);
      return null;
    }
  };

 const stringToArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : value.split(",").map((x) => x.trim());
    } catch {
      return value.split(",").map((x) => x.trim());
    }
  };

   const arrayToString = (value) => {
    if (!value) return "";
    return Array.isArray(value) ? value.join(", ") : value;
  };

  const getImageUrl = (img) => {
    if (!img) return DEFAULT_PROFILE_IMAGE;
    if (img.startsWith("http") || img.startsWith("data:") || img.startsWith("blob:")) {
      return img;
    }

    const baseUrl = API_BASE_URL.replace("/api", "");
    return `${baseUrl}/${img.replace(/^\/+/, "")}`;
  };


 const fetchDoctorProfile = async () => {
    try {
      const doctorId = getDoctorId();

      console.log("Doctor ID:", doctorId);

      if (!doctorId) {
        console.log("Doctor ID not found");
        return;
      }

      const url = `${API_BASE_URL}/auth/doctor-profile/${doctorId}`;
      console.log("GET Profile URL:", url);

      const res = await axios.get(url);
      const data = res.data.data;

      console.log("Profile API Response:", data);

      setProfileData({
        personalDetails: {
          fullName: data.full_name || "",
          qualification: data.qualification || "",
          experience: data.experience || "",
          languages: data.languages || "",
          position: data.position || "",
          boardCertification: data.board_certification || "",
          profileImage: getImageUrl(
            data.profileImage ||
              data.profilePic ||
              data.profile_pic ||
              data.profile_image ||
              data.profile_photo ||
              ""
          ),
        },
        professionalSummary: {
          about: data.about_doctor || "",
          expertise: data.expertise || "",
          awards: stringToArray(data.awards),
          researchFocus: data.research_focus || "",
        },
        educationTraining: {
          medicalDegree: data.medical_degree || "",
          residency: data.residency || "",
          fellowship: data.fellowship || "",
          specialTraining: data.special_training || "",
        },
        hospitalAffiliations: {
          primaryHospital: data.primary_hospital || "",
          address: data.hospital_address || "",
          googleMapLink: data.google_map_link || "",
          allHospitals: stringToArray(data.all_hospitals),
          contact: data.contact_number || "",
          videoVisits: data.video_visits || "",
        },
        clinicalFocus: {
          primarySpecialties: stringToArray(data.primary_specialties),
          allConditions: stringToArray(data.all_conditions),
        },
        availability: {
          todayAvailable: Boolean(data.today_available),
          onlineConsultation: Boolean(data.online_consultation),
          location: data.doctor_location || "",
          acceptsNewPatients: Boolean(data.accepts_new_patients),
          consultationHours: data.consultation_hours || "",
        },
        consultationFees: {
          initialConsultation: data.initial_consultation_fee || "",
          followUpVisit: data.follow_up_visit_fee || "",
          onlineConsultation: data.online_consultation_fee || "",
          insuranceAccepted: Boolean(data.insurance_accepted),
        },
        insuranceInformation: {
          acceptedInsurances: stringToArray(data.accepted_insurances),
          insuranceNote: data.insurance_note || "",
        },
      });
    } catch (error) {
      console.log("GET Profile API Error:", error.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchDoctorProfile();

    Object.keys(profileData).forEach((section, index) => {
      setTimeout(() => {
        setAnimatedSections((prev) => ({ ...prev, [section]: true }));
      }, index * 100);
    });
  }, []);



  // useEffect(() => {
  //   // Trigger entrance animations
  //   const sections = Object.keys(profileData);
  //   sections.forEach((section, index) => {
  //     setTimeout(() => {
  //       setAnimatedSections(prev => ({ ...prev, [section]: true }));
  //     }, index * 100);
  //   });
  // }, []);

  // Handle edit button click
  const handleEditClick = (section) => {
    setEditingSection(section);
    setEditFormData(profileData[section]);
    



    
    // Animation for edit mode
    const editSection = document.querySelector(`.js-profile-section-${section}`);
    if (editSection) {
      editSection.classList.add('js-edit-mode-active');
      setTimeout(() => {
        editSection.classList.remove('js-edit-mode-active');
      }, 500);
    }
  };

  // Handle input changes in edit form
  const handleInputChange = (e, field, isArray = false, arrayIndex = null) => {
    const { value, type, checked } = e.target;
    
    if (isArray && arrayIndex !== null) {
      const newArray = [...editFormData[field]];
      newArray[arrayIndex] = value;
      setEditFormData({
        ...editFormData,
        [field]: newArray
      });
    } else {
      setEditFormData({
        ...editFormData,
        [field]: type === "checkbox" ? checked : value
      });
    }
  };

  // Add new item to array field
  const handleAddArrayItem = (field) => {
    setEditFormData({
      ...editFormData,
      [field]: [...(editFormData[field] || []), ""]
    });
  };

  // Remove item from array field
  const handleRemoveArrayItem = (field, index) => {
    const newArray = editFormData[field].filter((_, i) => i !== index);
    setEditFormData({
      ...editFormData,
      [field]: newArray
    });
  };


   const makeUpdatePayload = () => {
    const updated = {
      ...profileData,
      [editingSection]: editFormData,
    };

    return {
      full_name: updated.personalDetails.fullName,
      qualification: updated.personalDetails.qualification,
      experience: updated.personalDetails.experience,
      languages: updated.personalDetails.languages,
      position: updated.personalDetails.position,
      board_certification: updated.personalDetails.boardCertification,
      profile_image: updated.personalDetails.profileImage,

      about_doctor: updated.professionalSummary.about,
      expertise: updated.professionalSummary.expertise,
      awards: arrayToString(updated.professionalSummary.awards),
      research_focus: updated.professionalSummary.researchFocus,

      medical_degree: updated.educationTraining.medicalDegree,
      residency: updated.educationTraining.residency,
      fellowship: updated.educationTraining.fellowship,
      special_training: updated.educationTraining.specialTraining,

      primary_hospital: updated.hospitalAffiliations.primaryHospital,
      hospital_address: updated.hospitalAffiliations.address,
      google_map_link: updated.hospitalAffiliations.googleMapLink,
      all_hospitals: arrayToString(updated.hospitalAffiliations.allHospitals),
      contact_number: updated.hospitalAffiliations.contact,
      video_visits: updated.hospitalAffiliations.videoVisits,

      primary_specialties: arrayToString(updated.clinicalFocus.primarySpecialties),
      all_conditions: arrayToString(updated.clinicalFocus.allConditions),

      today_available: updated.availability.todayAvailable ? 1 : 0,
      online_consultation: updated.availability.onlineConsultation ? 1 : 0,
      doctor_location: updated.availability.location,
      accepts_new_patients: updated.availability.acceptsNewPatients ? 1 : 0,
      consultation_hours: updated.availability.consultationHours,

      initial_consultation_fee: updated.consultationFees.initialConsultation,
      follow_up_visit_fee: updated.consultationFees.followUpVisit,
      online_consultation_fee: updated.consultationFees.onlineConsultation,
      insurance_accepted: updated.consultationFees.insuranceAccepted ? 1 : 0,

      accepted_insurances: arrayToString(
        updated.insuranceInformation.acceptedInsurances
      ),
      insurance_note: updated.insuranceInformation.insuranceNote,
    };
  };


  // Save changes with animation
   const handleSaveClick = async () => {
    try {
      const doctorId = getDoctorId();

      if (!doctorId) {
        alert("Doctor ID not found");
        return;
      }

      setIsLoading(true);

      const payload = makeUpdatePayload();

      console.log("PUT Payload:", payload);

      const res = await axios.put(
        `${API_BASE_URL}/auth/doctor-profile/${doctorId}`,
        payload
      );

      console.log("Update Response:", res.data);

      await fetchDoctorProfile();

      setEditingSection(null);
      setEditFormData({});
      alert("Profile updated successfully");
    } catch (error) {
      console.log("UPDATE Profile API Error:", error.response?.data || error.message);
      alert(error.response?.data?.message || "Profile update failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel editing
  const handleCancelClick = () => {
    setEditingSection(null);
    setEditFormData({});
  };

  // Open map modal
  const handleOpenMapModal = () => {
    setMapLinkInput(profileData.hospitalAffiliations.googleMapLink || "");
    setShowMapModal(true);
  };

  // Save map link
  const handleSaveMapLink = () => {
    setEditFormData({
      ...editFormData,
      googleMapLink: mapLinkInput
    });
    setShowMapModal(false);
  };

  // Open image modal
  const handleOpenImageModal = () => {
    setImageUrlInput(profileData.personalDetails.profileImage || DEFAULT_PROFILE_IMAGE);
    setShowImageModal(true);
  };

  // Save image URL
const handleSaveImageUrl = async () => {
  try {
    const doctorId = getDoctorId();

    if (!doctorId) {
      alert("Doctor ID not found");
      return;
    }

    const formData = new FormData();

    if (selectedImageFile) {
      formData.append("profilePic", selectedImageFile);
    } else {
      formData.append("profilePic", imageUrlInput);
    }

    setIsLoading(true);

    const res = await axios.put(
      `${API_BASE_URL}/auth/doctor-profile/${doctorId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("Doctor profile image response:", res.data);

    await fetchDoctorProfile();

    setSelectedImageFile(null);
    setShowImageModal(false);

    alert("Profile image updated successfully");
  } catch (error) {
    console.log("Doctor profile image upload error:", error.response?.data || error.message);
    alert(error.response?.data?.message || "Profile image upload failed");
  } finally {
    setIsLoading(false);
  }
};


  

  // Get current location
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newMapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
          setMapLinkInput(newMapLink);
        },
        (error) => {
          alert("Unable to retrieve your location. Please enter manually.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  // Handle file upload
const handleFileUpload = (e) => {
  const file = e.target.files[0];

  if (file) {
    setSelectedImageFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageUrlInput(event.target.result);
    };
    reader.readAsDataURL(file);
  }
};

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Render array items for editing
  const renderArrayEdit = (field, values) => {
    return (
      <div className="js-array-edit-container">
        {values.map((item, index) => (
          <div key={index} className="js-array-item-edit">
            <input
              type="text"
              value={item}
              onChange={(e) => handleInputChange(e, field, true, index)}
              className="js-edit-input js-array-input"
              placeholder={`Item ${index + 1}`}
            />
            <button
              type="button"
              onClick={() => handleRemoveArrayItem(field, index)}
              className="js-remove-item-btn"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => handleAddArrayItem(field)}
          className="js-add-item-btn"
        >
          <i className="fas fa-plus"></i> Add Item
        </button>
      </div>
    );
  };

  // Render table rows based on section
  const renderTableRows = (section, data) => {
    const rows = [];

    for (const [key, value] of Object.entries(data)) {
      if (key === "profileImage") continue; // Skip profile image in table rows
      
      const label = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase());

      rows.push(
        <tr 
          key={key} 
          className={`js-table-row ${animatedSections[section] ? 'js-row-animate' : ''}`}
          style={{ animationDelay: `${rows.length * 0.05}s` }}
        >
          <td className="js-label-cell">
            <span className="js-label-text">{label}</span>
          </td>
          <td className="js-value-cell">
            {editingSection === section ? (
              renderEditField(key, value, section)
            ) : (
              renderDisplayField(key, value)
            )}
          </td>
        </tr>
      );
    }

    return rows;
  };

  const renderEditField = (key, value, section) => {
    if (Array.isArray(value)) {
      return renderArrayEdit(key, editFormData[key] || []);
    } else if (key === "todayAvailable" || key === "onlineConsultation" || key === "acceptsNewPatients" || key === "insuranceAccepted") {
      return (
        <div className="js-checkbox-edit">
          <input
            type="checkbox"
            checked={editFormData[key] || false}
            onChange={(e) => handleInputChange(e, key)}
            className="js-checkbox-input"
            id={`${section}-${key}`}
          />
          <label htmlFor={`${section}-${key}`} className="js-checkbox-label">
            {editFormData[key] ? "Yes" : "No"}
          </label>
        </div>
      );
    } else if (key === "googleMapLink") {
      return (
        <div className="js-map-link-container">
          <input
            type="text"
            value={editFormData[key] || ""}
            onChange={(e) => handleInputChange(e, key)}
            className="js-edit-input"
            placeholder="Enter Google Maps link"
          />
          <button 
            className="js-btn-map-small"
            onClick={handleOpenMapModal}
            type="button"
          >
            <i className="fas fa-map"></i>
          </button>
        </div>
      );
    } else {
      return (
        <input
          type="text"
          value={editFormData[key] || ""}
          onChange={(e) => handleInputChange(e, key)}
          className="js-edit-input"
          placeholder={`Enter ${key}`}
        />
      );
    }
  };

  const renderDisplayField = (key, value) => {
    if (Array.isArray(value)) {
      return (
        <div className="js-array-display">
          <ul className="js-array-list">
            {value.map((item, index) => (
              <li key={index} className="js-array-list-item">
                <span className="js-array-bullet"></span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      );
    } else if (key === "todayAvailable" || key === "onlineConsultation" || key === "acceptsNewPatients" || key === "insuranceAccepted") {
      return (
        <span className={`js-availability ${value ? 'js-available' : 'js-not-available'}`}>
          <span className="js-availability-dot"></span>
          {value ? "Available" : "Not Available"}
        </span>
      );
    } else if (key === "contact") {
      return (
        <a href={`tel:${value}`} className="js-contact-link">
          <i className="fas fa-phone js-contact-icon"></i>
          {value}
        </a>
      );
    } else if (key === "googleMapLink") {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="js-map-link"
        >
          <i className="fas fa-map-marker-alt"></i> View on Google Maps
        </a>
      );
    } else if (key === "address") {
      return (
        <div className="js-address-display">
          <i className="fas fa-location-dot js-address-icon"></i>
          <span className="js-address-text">{value}</span>
        </div>
      );
    } else {
      return <span className="js-display-text">{value}</span>;
    }
  };

  // Define sections for the table
  const sections = [
    { id: "personalDetails", title: "Personal Details", icon: "fas fa-user-md" },
    { id: "professionalSummary", title: "Professional Summary", icon: "fas fa-graduation-cap" },
    { id: "educationTraining", title: "Education & Training", icon: "fas fa-certificate" },
    { id: "clinicalFocus", title: "Clinical Focus", icon: "fas fa-stethoscope" },
    { id: "hospitalAffiliations", title: "Hospital Affiliations", icon: "fas fa-hospital" },
    { id: "availability", title: "Availability", icon: "fas fa-calendar-check" },
    { id: "consultationFees", title: "Consultation Fees", icon: "fas fa-money-bill-wave" },
    { id: "insuranceInformation", title: "Insurance Information", icon: "fas fa-file-medical" }
  ];

  return (
    <div className="js-profile-container">
      {/* Success Message */}
      <div className="js-save-success">
        <i className="fas fa-check-circle"></i>
        Profile updated successfully!
      </div>

      <header className="js-profile-header">
        <div className="js-header-content">
          {/* Profile Image with Edit Button */}
          <div className="js-profile-image-container">
            <div className="js-profile-image-wrapper">
              <img 
                src={profileData.personalDetails.profileImage || DEFAULT_PROFILE_IMAGE} 
                alt="Dr. Joshua Rein" 
                className="js-profile-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_PROFILE_IMAGE;
                }}
              />
              <button 
                className="js-edit-image-btn"
                onClick={handleOpenImageModal}
                title="Change Profile Picture"
              >
                <i className="fas fa-camera"></i>
              </button>
            </div>
            <div className="js-profile-header-info">
              <h1 className="js-profile-title">
                <span className="js-title-text">{profileData.personalDetails.fullName}</span>
                <span className="js-title-sub">Professional Profile</span>
              </h1>
              <p className="js-profile-subtitle">
                {profileData.personalDetails.position} | Mount Sinai Health System
              </p>
              <div className="js-profile-badges">
                <span className="js-badge js-badge-primary">
                  <i className="fas fa-video"></i> Video Visits Available
                </span>
                <span className="js-badge js-badge-success">
                  <i className="fas fa-check-circle"></i> Accepting New Patients
                </span>
                <span className="js-badge js-badge-info">
                  <i className="fas fa-award"></i> Award-Winning Physician
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
                

      <div className="js-table-responsive">
        <table className="js-profile-table">
          <tbody>
            {sections.map((section) => (
              <React.Fragment key={section.id}>
                <tr className={`js-section-header ${animatedSections[section.id] ? 'js-header-animate' : ''}`}>
                  <td colSpan="2">
                    <div className="js-section-title">
                      <div className="js-section-title-content">
                        <i className={section.icon}></i>
                        <span>{section.title}</span>
                      </div>
                      <button
                        className="js-edit-btn"
                        onClick={() => handleEditClick(section.id)}
                      >
                        <i className="fas fa-edit"></i> 
                        <span className="js-edit-btn-text">Edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colSpan="2">
                    <div 
                      className={`js-profile-section js-profile-section-${section.id}`}
                      data-section={section.id}
                    >
                      {renderTableRows(section.id, profileData[section.id])}
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Image Upload Modal */}
      {showImageModal && (
        <div className="js-modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="js-modal js-modal-image" onClick={(e) => e.stopPropagation()}>
            <div className="js-modal-header">
              <h3 className="js-modal-title">
                <i className="fas fa-user-circle"></i>
                Update Profile Picture
              </h3>
              <button 
                className="js-modal-close"
                onClick={() => setShowImageModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="js-modal-body">
              <div className="js-image-preview">
                <img 
                  src={imageUrlInput || DEFAULT_PROFILE_IMAGE} 
                  alt="Preview" 
                  className="js-preview-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_PROFILE_IMAGE;
                  }}
                />
              </div>
              
              <div className="js-image-upload-options">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                
                <div className="js-image-url-input">
                  <label className="js-input-label">Image URL</label>
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="js-image-input"
                  />
                </div>
                
                <div className="js-upload-buttons">
                  <button
                    className="js-btn js-btn-upload"
                    onClick={handleUploadClick}
                  >
                    <i className="fas fa-upload"></i> Upload Image
                  </button>
                  <button
                    className="js-btn js-btn-default"
                    onClick={() => setImageUrlInput(DEFAULT_PROFILE_IMAGE)}
                  >
                    <i className="fas fa-user"></i> Use Default
                  </button>
                </div>
              </div>
              
              <div className="js-modal-buttons">
                <div className="js-action-buttons">
                  <button 
                    className="js-btn js-btn-secondary"
                    onClick={() => setShowImageModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="js-btn js-btn-primary"
                    onClick={handleSaveImageUrl}
                  >
                    Save Image
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
   

      {/* Map Link Modal */}
      {showMapModal && (
        <div className="js-modal-overlay" onClick={() => setShowMapModal(false)}>
          <div className="js-modal js-modal-map" onClick={(e) => e.stopPropagation()}>
            <div className="js-modal-header">
              <h3 className="js-modal-title">
                <i className="fas fa-map-marker-alt"></i>
                Update Location Map
              </h3>
              <button 
                className="js-modal-close"
                onClick={() => setShowMapModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="js-modal-body">
              <div className="js-map-input-group">
                <label className="js-input-label">Google Maps Link</label>
                <input
                  type="text"
                  value={mapLinkInput}
                  onChange={(e) => setMapLinkInput(e.target.value)}
                  placeholder="https://maps.app.goo.gl/..."
                  className="js-map-input"
                />
              </div>
              <div className="js-map-preview">
                <h4 className="js-preview-title">
                  <i className="fas fa-eye"></i> Preview
                </h4>
                <a 
                  href={mapLinkInput} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="js-preview-link"
                >
                  <i className="fas fa-external-link-alt"></i>
                  {mapLinkInput || "No link provided"}
                </a>
              </div>
              <div className="js-modal-buttons">
                <button
                  className="js-btn js-btn-location"
                  onClick={handleGetCurrentLocation}
                >
                  <i className="fas fa-location-dot"></i> Use Current Location
                </button>
                <div className="js-action-buttons">
                  <button 
                    className="js-btn js-btn-secondary"
                    onClick={() => setShowMapModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="js-btn js-btn-primary"
                    onClick={handleSaveMapLink}
                  >
                    Save Map Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Controls */}
         {editingSection && (
        <div className="js-edit-controls">
          <div className="js-edit-controls-inner">
            <div className="js-edit-status">
              <i className="fas fa-edit"></i>
              <span>Editing: {sections.find(s => s.id === editingSection)?.title}</span>
            </div>
            <div className="js-edit-actions">
              <button 
                className="js-btn js-btn-save" 
                onClick={handleSaveClick}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i>
                    Save Changes
                  </>
                )}
              </button>
              <button 
                className="js-btn js-btn-cancel" 
                onClick={handleCancelClick}
                disabled={isLoading}
              >
                <i className="fas fa-times"></i>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="js-loading-overlay">
          <div className="js-loading-content">
            <div className="js-loading-spinner"></div>
            <p className="js-loading-text">Updating Profile Madiconeckt...</p>
          </div>
        </div>
      )}

      <div className="js-instructions">
        <h3 className="js-instructions-title">
          <i className="fas fa-info-circle"></i> Profile Management Instructions
        </h3>
        <ul className="js-instructions-list">
          <li className="js-instruction-item">
            <span className="js-instruction-icon">📷</span>
            Click the camera icon to update profile picture
          </li>
          <li className="js-instruction-item">
            <span className="js-instruction-icon">📝</span>
            Click "Edit" on any section to modify information
          </li>
          <li className="js-instruction-item">
            <span className="js-instruction-icon">➕</span>
            Click "+ Add Item" to add multiple entries in lists
          </li>
          <li className="js-instruction-item">
            <span className="js-instruction-icon">💾</span>
            Click "Save Changes" to apply all modifications
          </li>
        </ul>
      </div>

      <footer className="js-profile-footer">
        <p className="js-footer-text">
          <i className="fas fa-shield-alt"></i>
          Last updated: {new Date().toLocaleDateString()} | Mount Sinai Health System
        </p>
      </footer>
    </div>
  );
};

export default ProfessionalProfileTable;
