import { getProfileCompletion } from "../../../utils/profileCompletion";
import useProfileCompletion from "../../../hooks/useProfileCompletion";
import ProfileCompletion from "../../common/ProfileCompletion";
import React, { useState, useEffect } from "react";
import { useDoctorUser } from "../doctorApi.js";
import axios from "../../../axiosConfig.js";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./ActivateProfile.css";
import { API_BASE_URL, getAuthHeaders } from "../doctorApi.js";

const PERSONAL_REQUIRED_FIELDS = [
  "name",
  "email",
  "mobile",
  "dob",
  "gender",
  "currentAddress",
  "permanentAddress",
  "aadhaar",
  "pan",
];

const PROFESSIONAL_REQUIRED_FIELDS = [
  "qualification",
  "experience",
  "languages",
  "about",
  "expertise",
];

const hasProfileValue = (value) => {
  if (Array.isArray(value)) {
    return value.some((item) => String(item ?? "").trim() !== "");
  }
  return value !== null && value !== undefined && String(value).trim() !== "";
};

const isSectionComplete = (profileData, requiredFields) =>
  requiredFields.every((field) => hasProfileValue(profileData?.[field]));

export default function DoctorProfileFlow() {
  const authUser = useDoctorUser();
  const [savedProfileData, setSavedProfileData] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [certificateFile, setCertificateFile] = useState(null);
  const [certificateName, setCertificateName] = useState('');
  const [profile, setProfile] = useState({
    // PERSONAL DETAILS
    name: "",
    email: "",
    mobile: "",
    dob: "",
    gender: "",
    currentAddress: "",
    permanentAddress: "",
    aadhaar: "",
    pan: "",
    photo: null,

    // PROFESSIONAL DETAILS
    qualification: "",
    experience: "",
    languages: "",
    about: "",
    expertise: "",
  });

  // Completion is derived from the current profile values so it can never
  // become stale after loading, editing, or saving the profile.
  const [editingSection, setEditingSection] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [profileStatus, setProfileStatus] = useState("loading");
  const [profileError, setProfileError] = useState("");
  const [savedContact, setSavedContact] = useState({ email: "", mobile: "" });
  const [verification, setVerification] = useState({
    email: { otp: "", sent: false, verified: true, loading: false, message: "" },
    mobile: { otp: "", sent: false, verified: true, loading: false, message: "" },
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const storedAuthUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("userData") || "null");
    } catch {
      return null;
    }
  })();
  const currentUser = authUser || storedAuthUser || {};
  const doctorId = currentUser.doctor_id || currentUser.doctorId || currentUser.id || currentUser._id || currentUser.user_id || currentUser.userId;

  const getImageUrl = (value) => {
    if (!value) return null;
    if (/^(https?:|data:|blob:)/i.test(value)) return value;
    return `${API_BASE_URL.replace(/\/api\/?$/, "")}/${String(value).replace(/^\/+/, "")}`;
  };

  const formatAddress = (value) => {
    if (!value || typeof value !== "object") return value || "";
    return [value.line1, value.line2, value.city, value.state, value.pincode, value.country]
      .filter((part) => part !== null && part !== undefined && String(part).trim() !== "")
      .join(", ");
  };

  const mapApiProfile = (data = {}, fallback = {}) => {
    const source = data.user || data.profile || data.doctor || data;
    const value = (...keys) => {
      const sourceValue = keys.find((key) => source[key] !== undefined && source[key] !== null && String(source[key]).trim() !== "");
      if (sourceValue) return source[sourceValue];
      const fallbackValue = keys.find((key) => fallback[key] !== undefined && fallback[key] !== null && String(fallback[key]).trim() !== "");
      return fallbackValue ? fallback[fallbackValue] : "";
    };
    const dateOfBirth = value("dob", "date_of_birth", "dateOfBirth");
    const languages = value("languages", "known_languages", "language");
    const expertise = value("expertise", "specialization", "speciality", "specialization_name");
    const gender = String(value("gender") || "").toLowerCase();

    return {
      name: value("full_name", "fullName", "name"),
      email: value("email", "email_address"),
      mobile: value("phoneNumber", "mobile", "phone", "phone_number", "contact_number", "contactNumber"),
      dob: dateOfBirth ? String(dateOfBirth).slice(0, 10) : "",
      gender: gender ? `${gender.charAt(0).toUpperCase()}${gender.slice(1)}` : "",
      currentAddress: value("address")?.line1 || value("current_address", "currentAddress") || "",
      address: source.address || { line1: '', city: '', state: '', pincode: '', country: 'India' },
      consultationMode: Array.isArray(source.consultationMode) ? source.consultationMode.join(', ') : source.consultationMode || '',
      permanentAddress: formatAddress(value("permanent_address", "permanentAddress")),
      aadhaar: value("aadhaar", "aadhaar_number", "aadhaarNumber"),
      pan: value("pan", "pan_number", "panNumber"),
      photo: getImageUrl(source.profilePhoto?.url || (typeof source.profilePhoto === "string" ? source.profilePhoto : "") || value("profileImage", "profilePic", "profile_pic", "profile_image", "profile_photo")),
      qualification: value("qualification", "medical_degree", "degree"),
      experience: source.experience ?? value("experience", "years_of_experience", "experience_years"),
      languages: Array.isArray(languages) ? languages.join(", ") : languages,
      about: value("aboutMe", "about_doctor", "about", "professional_summary", "bio"),
      expertise: Array.isArray(expertise) ? expertise.join(", ") : expertise,
    };
  };

  // Load the authenticated doctor's profile from the API. Local storage is a
  // fallback only, so the navbar profile always reflects backend data.
  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      const savedProfile = localStorage.getItem(`doctorProfile:${doctorId || "doctor"}`) || localStorage.getItem("doctorProfile");
      if (!doctorId) {
        if (savedProfile) setProfile(JSON.parse(savedProfile));
        setProfileStatus("failed");
        setProfileError("Doctor ID not found. Please login again.");
        return;
      }
      try {
        setProfileStatus("loading");
        setProfileError("");
        const response = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: getAuthHeaders(),
        });
        if (!active) return;
        const data = response.data?.data || response.data?.profile || response.data || {};
          const mappedProfile = mapApiProfile(data);
        setSavedProfileData(data.user || data);
        setProfile(mappedProfile);
        setSavedContact({ email: mappedProfile.email, mobile: mappedProfile.mobile });
        validateAllSections(mappedProfile);
        localStorage.setItem(`doctorProfile:${doctorId}`, JSON.stringify(mappedProfile));
        setProfileStatus("succeeded");
      } catch (error) {
        if (!active) return;
        if (savedProfile) {
          const cached = JSON.parse(savedProfile);
          setProfile(cached);
          validateAllSections(cached);
        }
        setProfileStatus("failed");
        setProfileError(error.response?.data?.message || error.response?.data?.error || "Failed to load doctor profile");
      }
    };
    loadProfile();
    return () => { active = false; };
  }, [doctorId]);

  const validatePersonal = (profileData = profile) => {
    return isSectionComplete(profileData, PERSONAL_REQUIRED_FIELDS);
  };

  const validateProfessional = (profileData = profile) => {
    return isSectionComplete(profileData, PROFESSIONAL_REQUIRED_FIELDS);
  };

  const validateAllSections = (profileData = profile) => {
    validatePersonal(profileData);
    validateProfessional(profileData);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditClick = (section) => {
    setEditingSection(section);
    setEditFormData(profile);
  };

  const handleInputChange = (e, field) => {
    const { value, type, checked } = e.target;
    setEditFormData({
      ...editFormData,
      [field]: type === "checkbox" ? checked : value,
    });
  };

  const handleSaveClick = () => {
    if (editingSection) {
      setProfile(editFormData);
      validateAllSections(editFormData);
      setEditingSection(null);
      setEditFormData({});
      setIsEditMode(false);
      alert("Profile updated successfully!");
    }
  };

  const handleCancelClick = () => {
    setEditingSection(null);
    setEditFormData({});
    if (savedProfileData) setProfile(mapApiProfile(savedProfileData));
    setPhotoFile(null);
    setCertificateFile(null);
    setCertificateName('');
    setIsEditMode(false);
  };

  const handleEditProfileClick = () => {
    setIsEditMode(true);
  };

  const contactChanged = (type) => String(profile[type] || "").trim() !== String(savedContact[type] || "").trim();

  const updateContact = (type, value) => {
    setProfile((previous) => ({ ...previous, [type]: value }));
    setVerification((previous) => ({
      ...previous,
      [type]: { otp: "", sent: false, verified: false, loading: false, message: "Verification required" },
    }));
  };

  const callOtpEndpoint = async (action, payload) => {
    const response = await axios.post(`${API_BASE_URL}/auth/profile-change/${action === 'send' ? 'send-otp' : 'verify-otp'}`, {
      field: payload.type === 'phone' ? 'phone' : 'email',
      phoneCountryCode: savedProfileData?.phoneCountryCode || '+91',
      newValue: payload.value,
      ...(action === 'verify' ? { otp: payload.otp } : {}),
    }, { headers: getAuthHeaders() });
    return response.data;
  };

  const sendContactOtp = async (type) => {
    const value = String(profile[type] || "").trim();
    if (type === "email" && !/^\S+@\S+\.\S+$/.test(value)) {
      setVerification((previous) => ({ ...previous, email: { ...previous.email, message: "Enter a valid email address" } }));
      return;
    }
    if (type === "mobile" && !/^\+?[0-9]{10,15}$/.test(value.replace(/[\s-]/g, ""))) {
      setVerification((previous) => ({ ...previous, mobile: { ...previous.mobile, message: "Enter a valid phone number" } }));
      return;
    }
    setVerification((previous) => ({ ...previous, [type]: { ...previous[type], loading: true, message: "" } }));
    try {
      await callOtpEndpoint("send", {
        doctor_id: doctorId,
        type: type === "mobile" ? "phone" : "email",
        value,
        email: type === "email" ? value : undefined,
        phone: type === "mobile" ? value : undefined,
      });
      setVerification((previous) => ({
        ...previous,
        [type]: { ...previous[type], sent: true, verified: false, loading: false, message: `OTP sent to ${value}` },
      }));
    } catch (error) {
      setVerification((previous) => ({
        ...previous,
        [type]: { ...previous[type], loading: false, message: error.response?.data?.message || error.message || "Unable to send OTP" },
      }));
    }
  };

  const verifyContactOtp = async (type) => {
    const state = verification[type];
    if (!/^\d{4,6}$/.test(state.otp)) {
      setVerification((previous) => ({ ...previous, [type]: { ...previous[type], message: "Enter a valid OTP" } }));
      return;
    }
    setVerification((previous) => ({ ...previous, [type]: { ...previous[type], loading: true, message: "" } }));
    try {
      const value = String(profile[type] || "").trim();
      await callOtpEndpoint("verify", {
        doctor_id: doctorId,
        type: type === "mobile" ? "phone" : "email",
        value,
        otp: state.otp,
        email: type === "email" ? value : undefined,
        phone: type === "mobile" ? value : undefined,
      });
      setVerification((previous) => ({
        ...previous,
        [type]: { ...previous[type], verified: true, loading: false, message: "Verified successfully" },
      }));
    } catch (error) {
      setVerification((previous) => ({
        ...previous,
        [type]: { ...previous[type], verified: false, loading: false, message: error.response?.data?.message || error.message || "Invalid or expired OTP" },
      }));
    }
  };

  const saveProfileToApi = async () => {
    if (!savedProfileData?._id) { setProfileError("Load your profile before saving. Please reload the page."); return; }
    const emailNeedsVerification = contactChanged("email") && !verification.email.verified;
    const mobileNeedsVerification = contactChanged("mobile") && !verification.mobile.verified;
    if (emailNeedsVerification || mobileNeedsVerification) {
      setProfileError("Please verify the changed email address and phone number before saving.");
      return;
    }
    try {
      setSavingProfile(true);
      setProfileError("");
      const formData = new FormData();
      for (const [key, value] of Object.entries(toApiProfile(profile))) {
        if (key === 'profilePhoto' || key === 'certifications') continue;
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value ?? '');
      }
      if (photoFile) formData.append('profilePhoto', photoFile);
      const certificates = savedProfileData?.certifications || [];
      certificates.forEach((cert, index) => {
        for (const key of ['_id', 'name', 'issuedBy', 'issueDate', 'expiryDate', 'documentUrl', 'documentPublicId', 'documentName']) {
          if (cert[key]) formData.append(`certifications[${index}][${key}]`, cert[key]);
        }
      });
      if (certificateFile) {
        if (!certificateName.trim()) throw new Error('Enter the certificate name before saving.');
        formData.append(`certifications[${certificates.length}][name]`, certificateName.trim());
        formData.append(`certifications[${certificates.length}][document]`, certificateFile);
      }
      const response = await axios.patch(`${API_BASE_URL}/auth/update/${savedProfileData._id}`, formData, { headers: getAuthHeaders() });
      const saved = response.data.user;
      if (!response.data.success || !saved) throw new Error(response.data.message || "Profile update failed");
      setSavedProfileData(saved);
      setProfile(mapApiProfile(saved));
      setPhotoFile(null);
      setCertificateFile(null);
      setCertificateName('');
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: { role: 'doctor' } }));
      setSavedContact({ email: saved.email, mobile: saved.phoneNumber });
      setIsEditMode(false);
      setProfileStatus("succeeded");
      localStorage.setItem(`doctorProfile:${doctorId}`, JSON.stringify(mapApiProfile(saved)));
    } catch (error) {
      setProfileError(error.response?.data?.message || error.message || "Profile update failed");
    } finally {
      setSavingProfile(false);
    }
  };

  const toApiProfile = (data) => ({
    fullName: data.name, email: data.email, phoneNumber: data.mobile,
    aadhaarNumber: data.aadhaar, panNumber: data.pan, permanentAddress: data.permanentAddress,
    phoneCountryCode: savedProfileData?.phoneCountryCode || '+91',
    dateOfBirth: data.dob, gender: String(data.gender || '').toLowerCase(),
    address: { ...data.address, line1: data.currentAddress },
    qualification: data.qualification, experience: data.experience,
    languages: String(data.languages || '').split(',').map((item) => item.trim()).filter(Boolean),
    specialization: String(data.expertise || '').split(',').map((item) => item.trim()).filter(Boolean),
    consultationMode: String(data.consultationMode || '').split(',').map((item) => item.trim()).filter(Boolean),
    aboutMe: data.about,
    profilePhoto: photoFile ? 'pending-upload' : data.photo,
    certifications: [...(savedProfileData?.certifications || []), ...(certificateFile ? [{ name: certificateName, documentUrl: 'pending-upload' }] : [])],
  });
  const draftProfile = toApiProfile(profile);
  const savedCompletion = savedProfileData
    ? getProfileCompletion({ ...savedProfileData, role: 'doctor' })
    : null;
  const completionPreview = useProfileCompletion(savedProfileData?.profileCompletion || savedCompletion, draftProfile, isEditMode);
  const visibleCompletion = savedProfileData && isEditMode
    ? getProfileCompletion({ ...savedProfileData, ...draftProfile, role: 'doctor' })
    : completionPreview.completion;

  const professionalKeys = ['qualification', 'experience', 'languages', 'aboutMe', 'specialization', 'consultationMode', 'certifications'];
  const sectionComplete = (professional) => {
    const fields = visibleCompletion?.fields?.filter((field) => professionalKeys.includes(field.key) === professional);
    return fields?.length > 0 && fields.every((field) => field.complete) ? 'Completed' : 'Incomplete';
  };
  const statusPersonal = sectionComplete(false);
  const statusProfessional = sectionComplete(true);

  // Render Professional Profile View
  const renderProfileView = () => {
    const sections = [
      {
        id: "personalDetails",
        title: "Personal Details",
        fields: [
          { label: "Full Name", key: "name" },
          { label: "Email", key: "email" },
          { label: "Mobile", key: "mobile" },
          { label: "Date of Birth", key: "dob" },
          { label: "Gender", key: "gender" },
          { label: "Aadhaar", key: "aadhaar" },
          { label: "PAN", key: "pan" },
          { label: "Current Address", key: "currentAddress" },
          { label: "Permanent Address", key: "permanentAddress" },
        ]
      },
      {
        id: "professionalDetails",
        title: "Professional Details",
        fields: [
          { label: "Qualification", key: "qualification" },
          { label: "Experience", key: "experience" },
          { label: "Languages", key: "languages" },
          { label: "About", key: "about" },
          { label: "Expertise", key: "expertise" },
        ]
      }
    ];

    return (
      <div className="profile-view-container">
        <div className="profile-header-section">
          <div className="profile-photo-container">
            {profile.photo ? (
              <img src={profile.photo} alt="Profile" className="profile-photo-large" />
            ) : (
              <div className="profile-photo-placeholder">
                <i className="bi bi-person-circle fs-1"></i>
              </div>
            )}
          </div>
          <div className="profile-info">
            <h2>{profile.name || "Dr. Name"}</h2>
            <p className="text-muted">{profile.qualification || "Qualification"}</p>
            <div className="profile-stats">
              <span className="stat-item">
                <i className="bi bi-briefcase me-1"></i>
                {profile.experience || "0"} Years Experience
              </span>
              <span className="stat-item">
                <i className="bi bi-translate me-1"></i>
                {profile.languages || "English"}
              </span>
            </div>
          </div>
          <button
            className="btn-edit-profile"
            onClick={handleEditProfileClick}
          >
            <i className="bi bi-pencil me-2"></i>
            Edit Profile
          </button>
        </div>

        <div className="profile-tables">
          {sections.map((section) => (
            <div key={section.id} className="profile-section-card">
              <div className="section-header">
                <h4>{section.title}</h4>
                {/* <button
                  className="btn-edit-section"
                  onClick={() => handleEditClick(section.id)}
                >
                  <i className="bi bi-pencil me-1"></i>
                  Edit
                </button> */}
              </div>
              <div className="section-content">
                {section.fields.map((field) => (
                  <div key={field.key} className="profile-field">
                    <span className="field-label">{field.label}:</span>
                    <span className="field-value">
                      {(field.key === "currentAddress" ? formatAddress({ ...profile.address, line1: profile.currentAddress }) : profile[field.key]) || "Not set"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Profile Completion Status */}
        
      </div>
    );
  };

  // Render Edit Form
  const renderEditForm = () => {
    return (
      <div className="profile-flow">
        <div className="header d-flex justify-content-between align-items-center mb-4">
          <h2 className="profile-header">Edit Profile</h2>
          <button
            className="btn btn-outline-secondary"
            onClick={handleCancelClick}
          >
            <i className="bi bi-arrow-left me-1"></i>
            Back to View
          </button>
        </div>

        {/* Progress Tracker */}
        <div className="progress-track">
          <div className={`progress-step ${statusPersonal === "Completed" ? "active" : ""}`}>
            1
            <span>Personal</span>
          </div>
          <div className={`progress-step ${statusProfessional === "Completed" ? "active" : ""}`}>
            2
            <span>Professional</span>
          </div>
        </div>

        {/* PERSONAL DETAILS - Edit Mode */}
        <div className="profile-card">
          <div className="section-header">
            <h3 className="section-title">Personal Details</h3>
            <span className={`status-badge ${statusPersonal === "Completed" ? "status-completed" : "status-incomplete"}`}>
              {statusPersonal}
            </span>
          </div>

          <div className="row mt-3">
            <div className="col-md-4 mb-3">
              <label className="form-label">Full Name</label>
              <input
                className="form-input form-control"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Email Address</label>
              <input
                className="form-input form-control"
                type="email"
                value={profile.email}
                onChange={(e) => updateContact("email", e.target.value)}
                placeholder="Enter your email"
              />
              {contactChanged("email") && (
                <div className="profile-contact-verification">
                  <button type="button" onClick={() => sendContactOtp("email")} disabled={verification.email.loading}>
                    {verification.email.loading ? "Please wait..." : verification.email.sent ? "Resend OTP" : "Send OTP"}
                  </button>
                  {verification.email.sent && !verification.email.verified && (
                    <><input inputMode="numeric" maxLength="6" value={verification.email.otp} onChange={(e) => setVerification((previous) => ({ ...previous, email: { ...previous.email, otp: e.target.value.replace(/\D/g, "") } }))} placeholder="OTP" /><button type="button" onClick={() => verifyContactOtp("email")}>Verify</button></>
                  )}
                  <small className={verification.email.verified ? "verified" : ""}>{verification.email.message}</small>
                </div>
              )}
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Mobile Number</label>
              <input
                className="form-input form-control"
                type="tel"
                value={profile.mobile}
                onChange={(e) => updateContact("mobile", e.target.value)}
                placeholder="Enter mobile number"
              />
              {contactChanged("mobile") && (
                <div className="profile-contact-verification">
                  <button type="button" onClick={() => sendContactOtp("mobile")} disabled={verification.mobile.loading}>
                    {verification.mobile.loading ? "Please wait..." : verification.mobile.sent ? "Resend OTP" : "Send OTP"}
                  </button>
                  {verification.mobile.sent && !verification.mobile.verified && (
                    <><input inputMode="numeric" maxLength="6" value={verification.mobile.otp} onChange={(e) => setVerification((previous) => ({ ...previous, mobile: { ...previous.mobile, otp: e.target.value.replace(/\D/g, "") } }))} placeholder="OTP" /><button type="button" onClick={() => verifyContactOtp("mobile")}>Verify</button></>
                  )}
                  <small className={verification.mobile.verified ? "verified" : ""}>{verification.mobile.message}</small>
                </div>
              )}
            </div>
          </div>

          <div className="row mt-3">
            <div className="col-md-3 mb-3">
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                className="form-input form-control"
                value={profile.dob}
                onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
              />
            </div>

            <div className="col-md-3 mb-3">
              <label className="form-label">Gender</label>
              <select
                className="form-input form-control"
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="col-md-3 mb-3">
              <label className="form-label">Aadhaar Number</label>
              <input
                className="form-input form-control"
                value={profile.aadhaar}
                onChange={(e) => setProfile({ ...profile, aadhaar: e.target.value })}
                placeholder="XXXX-XXXX-XXXX"
              />
            </div>

            <div className="col-md-3 mb-3">
              <label className="form-label">PAN Number</label>
              <input
                className="form-input form-control"
                value={profile.pan}
                onChange={(e) => setProfile({ ...profile, pan: e.target.value })}
                placeholder="ABCDE1234F"
              />
            </div>
          </div>

          <div className="row mt-3">
            <div className="col-md-6 mb-3">
              <label className="form-label">Current Address</label>
              <textarea
                className="form-input form-control"
                rows="2"
                value={profile.currentAddress}
                onChange={(e) => setProfile({ ...profile, currentAddress: e.target.value })}
                placeholder="Enter current address"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Permanent Address</label>
              <textarea
                className="form-input form-control"
                rows="2"
                value={profile.permanentAddress}
                onChange={(e) => setProfile({ ...profile, permanentAddress: e.target.value })}
                placeholder="Enter permanent address"
              />
            </div>
          </div>

          <div className="row mt-3">
            {['city', 'state', 'pincode', 'country'].map((field) => (
              <div className="col-md-3 mb-3" key={field}>
                <label className="form-label" htmlFor={`doctor-address-${field}`}>{field === 'pincode' ? 'PIN Code' : field.charAt(0).toUpperCase() + field.slice(1)}</label>
                <input id={`doctor-address-${field}`} className="form-input form-control" value={profile.address?.[field] || ''}
                  onChange={(event) => setProfile((previous) => ({ ...previous, address: { ...previous.address, [field]: event.target.value } }))} />
              </div>
            ))}
          </div>

          <div className="mt-4">
            <label className="form-label">Profile Photo</label>
          <div className="photo-upload" onClick={() => document.getElementById('photoInput').click()}>
              {profile.photo ? (
                <img src={profile.photo} alt="Profile" className="photo-preview" />
              ) : (
                <>
                  <i className="bi bi-camera fs-1 text-muted mb-2"></i>
                  <p className="text-muted mb-0">Click to upload profile photo</p>
                </>
              )}
            </div>
            <input
              id="photoInput"
              type="file"
              className="d-none"
              accept="image/*"
              onChange={handlePhotoUpload}
            />
          </div>

          <div className="d-flex justify-content-between align-items-center mt-3 profile-form-actions">
            <button className="btn btn-secondary" onClick={handleCancelClick}>
              <i className="bi bi-x-circle me-2"></i>
              Cancel
            </button>
            <button className="save-btn" onClick={saveProfileToApi} disabled={savingProfile}>


              <i className="bi bi-check-circle me-2"></i>
              Save Personal Details
            </button>

          </div>
        </div>

        {/* PROFESSIONAL DETAILS - Edit Mode */}
        <div className="profile-card">
          <div className="section-header">
            <h3 className="section-title">Professional Details</h3>
            <span className={`status-badge ${statusProfessional === "Completed" ? "status-completed" : "status-incomplete"}`}>
              {statusProfessional}
            </span>
          </div>

          <div className="row mt-3">
            <div className="col-md-6 mb-3">
              <label className="form-label">Qualification</label>
              <input
                className="form-input form-control"
                value={profile.qualification}
                onChange={(e) => setProfile({ ...profile, qualification: e.target.value })}
                placeholder="MD, Internal Medicine"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Experience (Years)</label>
              <input
                className="form-input form-control"
                type="number"
                value={profile.experience}
                onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                placeholder="15"
              />
            </div>
          </div>

          <div className="row mt-3">
            <div className="col-md-6 mb-3">
              <label className="form-label">Languages Known</label>
              <input
                className="form-input form-control"
                value={profile.languages}
                onChange={(e) => setProfile({ ...profile, languages: e.target.value })}
                placeholder="English, Spanish, French"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Specialization/Expertise</label>
              <input
                className="form-input form-control"
                value={profile.expertise}
                onChange={(e) => setProfile({ ...profile, expertise: e.target.value })}
                placeholder="Diabetes Management, Hypertension"
              />
            </div>
          </div>

          <div className="row mt-3">
            <div className="col-md-12 mb-3">
              <label className="form-label">Professional Summary</label>
              <textarea
                className="form-input form-control"
                rows="3"
                value={profile.about}
                onChange={(e) => setProfile({ ...profile, about: e.target.value })}
                placeholder="Experienced physician specializing in internal medicine..."
              />
            </div>
          </div>

          <div className="row mt-3">
            <div className="col-md-12 mb-3">
              <label className="form-label" htmlFor="doctor-consultation-mode">Consultation Modes</label>
              <input id="doctor-consultation-mode" className="form-input form-control" value={profile.consultationMode || ''}
                placeholder="online, offline" onChange={(event) => setProfile({ ...profile, consultationMode: event.target.value })} />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label" htmlFor="doctor-certificate-name">Certificate Name</label>
              <input id="doctor-certificate-name" className="form-input form-control" value={certificateName} onChange={(event) => setCertificateName(event.target.value)} placeholder="Degree / registration certificate" />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label" htmlFor="doctor-certificate-file">Certificate Document</label>
              <input id="doctor-certificate-file" type="file" accept="image/*,.pdf" className="form-control" disabled={(savedProfileData?.certifications?.length || 0) >= 5}
                onChange={(event) => setCertificateFile(event.target.files?.[0] || null)} />
            </div>
            {(savedProfileData?.certifications || []).map((cert, index) => <div className="col-12 mb-2" key={cert._id || index}><i className="bi bi-file-earmark-check me-2" />{cert.name}</div>)}
          </div>

          <div className="d-flex justify-content-between align-items-center mt-3 profile-form-actions">
            <button className="btn btn-secondary" onClick={handleCancelClick}>
              <i className="bi bi-x-circle me-2"></i>
              Cancel
            </button>

            <button className="save-btn" onClick={saveProfileToApi} disabled={savingProfile}>
              <i className="bi bi-check-circle me-2"></i>
              Save Professional Details
            </button>
          </div>

        </div>
        <div className="text-center">
          <button className="save-btn" onClick={saveProfileToApi} disabled={savingProfile}>
          <i className="bi bi-check-circle me-2"></i>
          {savingProfile ? "Saving..." : "Save"}
        </button>
        </div>
        {/* FINAL STATUS */}
        
      </div>
    );
  };

  // Render Edit Modal for View Mode (for section-wise editing)
  const renderEditModal = () => {
    if (!editingSection) return null;

    return (
      <div className="modal-overlay" onClick={handleCancelClick}>
        <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Edit {editingSection.replace(/([A-Z])/g, ' $1').toUpperCase()}</h3>
            <button className="modal-close" onClick={handleCancelClick}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <div className="modal-body">
            {Object.keys(editFormData).map((key) => {
              if (typeof editFormData[key] === 'boolean') {
                return (
                  <div key={key} className="mb-3">
                    <label className="form-label">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </label>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={editFormData[key]}
                        onChange={(e) => handleInputChange(e, key)}
                      />
                      <label className="form-check-label">
                        {editFormData[key] ? "Yes" : "No"}
                      </label>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={key} className="mb-3">
                    <label className="form-label">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData[key] || ''}
                      onChange={(e) => handleInputChange(e, key)}
                    />
                  </div>
                );
              }
            })}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={handleCancelClick}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSaveClick}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="doctor-profile-container">
      <ProfileCompletion {...completionPreview} completion={visibleCompletion} loading={profileStatus === "loading"} />
      {profileStatus === "succeeded" && savedProfileData && (
        <div className="alert alert-info" role="status">
          {savedProfileData.isActive === false
            ? "Your account is inactive. Contact support to appear in the user directory."
            : !(savedProfileData.profileCompletion || savedCompletion)?.isComplete
              ? "Your saved profile is incomplete. Fill the remaining fields shown above and save your changes to appear in the user directory."
              : "Your saved profile meets the completion requirements for the user directory."}
        </div>
      )}
      {profileStatus === "loading" && (
        <div className="alert alert-info" role="status">Loading doctor profile...</div>
      )}
      {profileError && (
        <div className="alert alert-warning" role="alert">{profileError}</div>
      )}
      {isEditMode ? renderEditForm() : renderProfileView()}
      {renderEditModal()}
    </div>
  );
}
