import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { PHONE_COUNTRIES, phoneCountryLabel } from '../../utils/phoneCountries.js';
import { applyPatientAddressChange } from '../../utils/patientAddressChange.js';
import LocationSelect from '../common/LocationSelect.jsx';
import useSocketRefresh from "../../hooks/useSocketRefresh";
import { formatPhoneWithCountryCode } from '../../utils/phoneDisplay.js';
import { getLocalPhoneLengths, getLocalPhoneMaxLength, limitPhoneDigits } from '../../utils/profileCompletion.js';
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./PatientProfile.css";
import { API_BASE_URL } from "../../axiosConfig";
import { captureAndSendLocation } from "../../authtication/locationHelper";
import { useUserTranslation } from "../../i18n/LanguageContext";
import AvatarBuilder from "./AvatarBuilder";
import {
  FaCamera,
  FaEdit,
  FaHome,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaStarOfLife,
  FaUser,
} from "react-icons/fa";

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return "";

  const [year, month, day] = String(dateOfBirth).split("-").map(Number);
  const birthDate = new Date(year, month - 1, day);

  if (
    !year ||
    !month ||
    !day ||
    birthDate.getFullYear() !== year ||
    birthDate.getMonth() !== month - 1 ||
    birthDate.getDate() !== day
  ) {
    return "";
  }

  const today = new Date();
  let age = today.getFullYear() - year;
  const hasHadBirthdayThisYear =
    today.getMonth() > month - 1 ||
    (today.getMonth() === month - 1 && today.getDate() >= day);

  if (!hasHadBirthdayThisYear) age -= 1;
  return age >= 0 ? age : "";
};


export { PHONE_COUNTRIES } from '../../utils/phoneCountries.js';

export const splitPhoneNumber = (value) => {
  const raw = String(value || "").trim();
  if (raw.startsWith("+")) {
    const parsed = parsePhoneNumberFromString(raw);
    const parsedCountry = parsed?.country || parsed?.getPossibleCountries()[0];
    const country = PHONE_COUNTRIES.find(({ code }) => code === parsedCountry)
      || [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length)
        .find(({ dial }) => raw.startsWith(dial));
    if (country) {
      return {
        countryCode: country.code,
        localNumber: raw.slice(country.dial.length).replace(/\D/g, ""),
      };
    }
  }
  return { countryCode: "IN", localNumber: raw.replace(/\D/g, "") };
};


const PatientProfile = () => {
  const { t } = useUserTranslation();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImageRemoved, setProfileImageRemoved] = useState(false);
  const [selectedAvatarPayload, setSelectedAvatarPayload] = useState(null);
  const [showAvatarBuilder, setShowAvatarBuilder] = useState(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [showNotification, setShowNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  // Profile-change OTP state. One slot per protected field. Backend gates
  // email/phone updates behind a verified OTP, so the UI tracks per-field:
  //   sending  - "Send OTP" request in flight
  //   sent     - OTP delivered, waiting for user to enter it
  //   verifying - "Verify" request in flight
  //   verified + verifiedValue - confirmed by server for THIS exact value;
  //              if the user re-edits the field after, we drop the flag.
  const blankChange = {
    sending: false,
    sent: false,
    verifying: false,
    verified: false,
    verifiedValue: null,
    otp: "",
    error: "",
  };
  const [emailChange, setEmailChange] = useState(blankChange);
  const [phoneChange, setPhoneChange] = useState(blankChange);

  const notify = (message, type = "success") => {
    setShowNotification({ show: true, message, type });
    setTimeout(
      () => setShowNotification({ show: false, message: "", type: "" }),
      3000,
    );
  };

  const handleUpdateLocation = async () => {
    setIsUpdatingLocation(true);
    try {
      await captureAndSendLocation("manual");
      notify("Location updated successfully", "success");
    } catch (err) {
      notify(err.message || "Failed to update location", "error");
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const [patientData, setPatientData] = useState({
    personalInfo: {
      id: "",
      name: "",
      age: null,
      gender: "",
      bloodGroup: "",
      dateOfBirth: "",
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
    security: {
      hasPassword: false,
      authProvider: "",
      googleId: "",
    },
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    anonymous: "",
    age: "",
    gender: "",
    bloodGroup: "",
    dateOfBirth: "",
    email: "",
    phone: "",
    phoneCountry: "IN",
    emergencyPhoneCountry: "IN",
    address: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
    },
    emergencyContact: { name: "", relation: "", phone: "" },
  });

  useEffect(() => {
    fetchPatientProfile();
  }, []);

  useSocketRefresh(() => fetchPatientProfile({ showSkeleton: false }), ["profile:updated"], !isEditing, { initial: false });

  const getProfilePhotoUrl = (userData) => {
    // profilePhoto is the authoritative, latest saved image. The sidebar
    // already uses it; checking avatar first made the profile page show an
    // older generated avatar after a new photo had been saved.
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

    if (
      userData.avatar &&
      userData.avatar.type !== "uploaded" &&
      typeof userData.avatar.url === "string" &&
      userData.avatar.url
    ) {
      return userData.avatar.url;
    }

    return "";
  };

  const fetchPatientProfile = async ({ showSkeleton = true } = {}) => {
    try {
      if (showSkeleton) setIsInitialLoading(true);
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");

      if (!userId) {
        showNotificationMessage(
          "User ID not found. Please login again.",
          "error",
        );
        if (showSkeleton) setIsInitialLoading(false);
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
            anonymous: userData.anonymous || "",
            age: userData.age || null,
            gender: userData.gender || "",
            bloodGroup: userData.bloodGroup || "",
            dateOfBirth: userData.dateOfBirth
              ? userData.dateOfBirth.split("T")[0]
              : "",
            email: userData.email || "",
            phone: userData.phoneNumber || "",
            phoneCountryCode: userData.phoneCountryCode || '+91',
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
          security: {
            hasPassword:
              typeof userData.hasPassword === "boolean"
                ? userData.hasPassword
                : userData.authProvider !== "google" || !userData.googleId,
            authProvider: userData.authProvider || "",
            googleId: userData.googleId || "",
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
      if (showSkeleton) setIsInitialLoading(false);
    }
  };

  const updatePatientProfile = async (formData) => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
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

  // ─── Profile-change OTP helpers ──────────────────────────────────────
  const authHeaders = () => {
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const isEmailDirty = () =>
    String(editFormData?.email || "").trim().toLowerCase() !==
    String(patientData?.personalInfo?.email || "").trim().toLowerCase();
  const getCompletePhoneNumber = () => {
    const localNumber = String(editFormData?.phone || "").replace(/\D/g, "");
    if (!localNumber) return "";

    const country =
      PHONE_COUNTRIES.find(({ code }) => code === editFormData?.phoneCountry) ||
      PHONE_COUNTRIES[0];
    return `${country.dial}${localNumber}`;
  };
  const emailReady =
    !isEmailDirty() ||
    (emailChange.verified &&
      emailChange.verifiedValue ===
        String(editFormData?.email || "").trim().toLowerCase());
  const sendChangeOtp = async (field) => {
    const setState = field === "email" ? setEmailChange : setPhoneChange;
    const newValue =
      field === "email"
        ? String(editFormData.email || "").trim().toLowerCase()
        : getCompletePhoneNumber().replace(/\D/g, "");
    setState((s) => ({ ...s, sending: true, error: "" }));
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/auth/profile-change/send-otp`,
        { field, newValue },
        { headers: authHeaders() },
      );
      if (res.data?.success) {
        setState({
          sending: false,
          sent: true,
          verifying: false,
          verified: false,
          verifiedValue: null,
          otp: "",
          error: "",
        });
        notify(res.data.message || "OTP sent", "success");
      } else {
        throw new Error(res.data?.message || "Failed to send OTP");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setState((s) => ({ ...s, sending: false, error: msg }));
      notify(msg, "error");
    }
  };

  const verifyChangeOtp = async (field) => {
    const setState = field === "email" ? setEmailChange : setPhoneChange;
    const state = field === "email" ? emailChange : phoneChange;
    const newValue =
      field === "email"
        ? String(editFormData.email || "").trim().toLowerCase()
        : getCompletePhoneNumber().replace(/\D/g, "");
    if (!state.otp || state.otp.length < 4) {
      setState((s) => ({ ...s, error: "Enter the OTP first" }));
      return;
    }
    setState((s) => ({ ...s, verifying: true, error: "" }));
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/auth/profile-change/verify-otp`,
        { field, newValue, otp: state.otp },
        { headers: authHeaders() },
      );
      if (res.data?.success) {
        setState({
          sending: false,
          sent: false,
          verifying: false,
          verified: true,
          verifiedValue: newValue,
          otp: "",
          error: "",
        });
        notify(`${field === "email" ? "Email" : "Phone"} verified`, "success");
      } else {
        throw new Error(res.data?.message || "Verification failed");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setState((s) => ({ ...s, verifying: false, error: msg }));
      notify(msg, "error");
    }
  };

  // Drop the verified flag if the user re-edits the field after verifying —
  // they'd have to re-verify the new value before Save will accept it.
  useEffect(() => {
    if (
      emailChange.verified &&
      emailChange.verifiedValue !==
        String(editFormData?.email || "").trim().toLowerCase()
    ) {
      setEmailChange(blankChange);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editFormData?.email]);

  useEffect(() => {
    if (
      phoneChange.verified &&
      phoneChange.verifiedValue !==
        getCompletePhoneNumber().replace(/\D/g, "")
    ) {
      setPhoneChange(blankChange);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editFormData?.phone, editFormData?.phoneCountry]);

  // Reset everything when exiting edit mode.
  useEffect(() => {
    if (!isEditing) {
      setEmailChange(blankChange);
      setPhoneChange(blankChange);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const initializeEditForm = (data) => {
    const dateOfBirth = data.personalInfo.dateOfBirth || "";
    const phoneParts = splitPhoneNumber(formatPhoneWithCountryCode(data.personalInfo.phone, data.personalInfo.phoneCountryCode));
    const emergencyPhoneParts = splitPhoneNumber(formatPhoneWithCountryCode(
      data.personalInfo.emergencyContact?.phone,
      data.personalInfo.emergencyContact?.phoneCountryCode || data.personalInfo.phoneCountryCode || '+91',
    ));
    setEditFormData({
      name: data.personalInfo.name || "",
      anonymous: data.personalInfo.anonymous || "",
      age: calculateAge(dateOfBirth),
      gender: data.personalInfo.gender || "",
      bloodGroup: data.personalInfo.bloodGroup || "",
      dateOfBirth,
      email: data.personalInfo.email || "",
      phone: phoneParts.localNumber,
      phoneCountry: phoneParts.countryCode,
      emergencyPhoneCountry: emergencyPhoneParts.countryCode,
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
        phone: emergencyPhoneParts.localNumber,
      },
    });
  };

  const openEditModal = () => {
    initializeEditForm(patientData);
    setProfileImage(null);
    setProfileImageFile(null);
    setProfileImageRemoved(false);
    setSelectedAvatarPayload(null);
    setIsEditing(true);
  };

  const showNotificationMessage = (message, type) => {
    setShowNotification({ show: true, message, type });
    setTimeout(() => {
      setShowNotification({ show: false, message: "", type: "" });
    }, type === "error" ? 6000 : 3000);
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setProfileImageFile(null);
    setProfileImageRemoved(true);
    setSelectedAvatarPayload(null);
    showNotificationMessage(
      "Profile picture will be removed on save",
      "success",
    );
  };

  const handleAvatarSelect = async (avatar) => {
    const avatarUrl = typeof avatar === "string" ? avatar : avatar?.url || avatar?.avatarUrl;
    if (!avatarUrl) return;

    setProfileImage(avatarUrl);
    if (avatarUrl.startsWith("data:image/")) {
      // GPT Image returns base64 image data. Turn it into a file so the normal
      // profile-photo upload path stores it permanently instead of losing it on save.
      try {
        const imageResponse = await fetch(avatarUrl);
        const imageBlob = await imageResponse.blob();
        setProfileImageFile(new File([imageBlob], "ai-avatar.png", { type: imageBlob.type || "image/png" }));
      } catch (error) {
        console.error("Unable to prepare generated avatar for upload:", error);
        showNotificationMessage("Avatar was generated but could not be prepared for saving. Please try again.", "error");
        return;
      }
    } else {
      setProfileImageFile(null); // URL-based avatar, no file upload needed
    }
    setProfileImageRemoved(false);
    setSelectedAvatarPayload(
      typeof avatar === "string"
        ? {
            avatarUrl,
            avatarType: "preset",
          }
        : {
            ...avatar,
            avatarUrl,
            avatarType: avatar.avatarType || "builder",
        },
    );
    showNotificationMessage("Avatar selected. Click Save Changes to update your profile.", "success");
  };

  const handleSaveProfile = async () => {
    const emergencyDial = (PHONE_COUNTRIES.find(({ code }) => code === editFormData.emergencyPhoneCountry) || PHONE_COUNTRIES.find(({ code }) => code === 'IN')).dial;
    const emergencyPhone = String(editFormData.emergencyContact.phone || '').replace(/\D/g, '');
    if (emergencyPhone && !getLocalPhoneLengths(emergencyDial).includes(emergencyPhone.length)) {
      showNotificationMessage('Enter a valid emergency contact phone number for the selected country.', 'error');
      return;
    }
    const phoneDial = (PHONE_COUNTRIES.find(({ code }) => code === editFormData.phoneCountry) || PHONE_COUNTRIES[0]).dial;
    if (!getLocalPhoneLengths(phoneDial).includes(String(editFormData.phone || '').replace(/\D/g, '').length)) {
      showNotificationMessage('Enter a valid phone number for the selected country.', 'error');
      return;
    }
    try {
      setIsSaving(true);
      const formData = new FormData();
      const calculatedAge = calculateAge(editFormData.dateOfBirth);

      formData.append("fullName", editFormData.name);
      formData.append("anonymous", editFormData.anonymous || "");
      formData.append("email", editFormData.email);
      formData.append("phoneNumber", getCompletePhoneNumber());
      formData.append("phoneCountryCode", (PHONE_COUNTRIES.find(({ code }) => code === editFormData.phoneCountry) || PHONE_COUNTRIES[0]).dial);
      formData.append("age", String(calculatedAge));
      formData.append("gender", editFormData.gender);
      formData.append("dateOfBirth", editFormData.dateOfBirth);

      const addressObj = {
        ...editFormData.address,
        country: editFormData.address.country || "India",
      };
      formData.append("address", JSON.stringify(addressObj));
      formData.append(
        "emergencyContact",
        JSON.stringify({ ...editFormData.emergencyContact, phone: emergencyPhone ? `${emergencyDial}${emergencyPhone}` : '' }),
      );

      if (profileImageFile) {
        formData.append("profilePhoto", profileImageFile);
      } else if (
        profileImage &&
        typeof profileImage === "string" &&
        profileImage.startsWith("http")
      ) {
        // Avatar URL from generator — store directly without file upload
        const avatarPayload = selectedAvatarPayload || {
          avatarUrl: profileImage,
          avatarType: "preset",
        };
        formData.append("avatarUrl", avatarPayload.avatarUrl || profileImage);
        formData.append("avatarType", avatarPayload.avatarType || "preset");
        if (avatarPayload.avatarSeed) {
          formData.append("avatarSeed", avatarPayload.avatarSeed);
        }
        if (avatarPayload.avatarBackgroundColor) {
          formData.append("avatarBackgroundColor", avatarPayload.avatarBackgroundColor);
        }
        if (avatarPayload.avatarTextColor) {
          formData.append("avatarTextColor", avatarPayload.avatarTextColor);
        }
        if (avatarPayload.avatarBuilder) {
          formData.append("avatarBuilder", JSON.stringify(avatarPayload.avatarBuilder));
        }
      } else if (profileImageRemoved) {
        formData.append("removeProfilePhoto", "true");
      }

      const response = await updatePatientProfile(formData);

      if (response.data.success) {
        showNotificationMessage("Profile updated successfully!", "success");
        await fetchPatientProfile({ showSkeleton: false });
        window.dispatchEvent(
          new CustomEvent("profile-updated", { detail: { role: "user" } }),
        );
        setIsEditing(false);
        setProfileImage(null);
        setProfileImageFile(null);
        setProfileImageRemoved(false);
        setSelectedAvatarPayload(null);
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
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    initializeEditForm(patientData);
    setProfileImage(null);
    setProfileImageFile(null);
    setProfileImageRemoved(false);
    setSelectedAvatarPayload(null);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'emergencyPhoneCountry') {
      const dial = PHONE_COUNTRIES.find(({ code }) => code === value)?.dial || '+91';
      setEditFormData(previous => ({ ...previous, emergencyPhoneCountry: value,
        emergencyContact: { ...previous.emergencyContact, phone: limitPhoneDigits(previous.emergencyContact.phone, dial) } }));
      return;
    }
    if (name === 'emergencyContact.phone') {
      setEditFormData(previous => ({ ...previous, emergencyContact: { ...previous.emergencyContact,
        phone: limitPhoneDigits(value, PHONE_COUNTRIES.find(({ code }) => code === previous.emergencyPhoneCountry)?.dial || '+91') } }));
      return;
    }
    if (name === 'phoneCountry') {
      const dial = (PHONE_COUNTRIES.find(({ code }) => code === value) || PHONE_COUNTRIES[0]).dial;
      setEditFormData((previous) => ({ ...previous, phoneCountry: value, phone: limitPhoneDigits(previous.phone, dial) }));
      return;
    }
    if (name === "dateOfBirth") {
      setEditFormData((prev) => ({
        ...prev,
        dateOfBirth: value,
        age: calculateAge(value),
      }));
      return;
    }

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

  useEffect(() => {
    const calculatedAge = calculateAge(editFormData.dateOfBirth);
    setEditFormData((prev) =>
      prev.age === calculatedAge ? prev : { ...prev, age: calculatedAge },
    );
  }, [editFormData.dateOfBirth]);

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const emergencyPhoneDisplay = formatPhoneWithCountryCode(
    patientData.personalInfo.emergencyContact?.phone,
    patientData.personalInfo.emergencyContact?.phoneCountryCode || patientData.personalInfo.phoneCountryCode || '+91',
  );

  return (
    <div className="profile-container" aria-busy={isInitialLoading}>
      <header className="portal-page-header"><h1>{t("profile")}</h1></header>
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
            <button type="button" className="profile-camera-button" onClick={openEditModal} aria-label="Change profile photo">
              <FaCamera />
            </button>
          </div>
        </div>

        <div className="profile-info">
          <h1>{patientData.personalInfo.name}</h1>
          <p className="profile-contact-line">
            {patientData.personalInfo.email}
            <span aria-hidden="true">|</span>
            {formatPhoneWithCountryCode(patientData.personalInfo.phone, patientData.personalInfo.phoneCountryCode) || t('profile.notSpecified')}
          </p>
          <p className="patient-id">
            ID: #{patientData.personalInfo.id?.slice(-8).toUpperCase()}
          </p>
          <div className="badge-group">
            <span className="badge">
              Gender - {patientData.personalInfo.gender || "--"}
            </span>
            <span className="badge">
              Age - {patientData.personalInfo.age || "--"} yrs
            </span>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="btn-primary"
            onClick={openEditModal}
            disabled={isSaving}
          >
            <FaEdit aria-hidden="true" /> {t('profile.editProfile')}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="profile-content">
        <div className="profile-main-column">
        {/* Personal Information */}
        <div className="info-card-modern">
          <div className="card-header">
            <h2><FaUser /> {t('profile.personalInformation')}</h2>
          </div>
          <div className="info-grid">
            <div className="info-item">
              <label>{t('profile.fullName')}</label>
              <span>{patientData.personalInfo.name}</span>
            </div>
            <div className="info-item">
              <label>{t('profile.anonymousName')}</label>
              <span>
                {patientData.personalInfo.anonymous
                  ? patientData.personalInfo.anonymous
                  : t('profile.notSpecified')}
              </span>
            </div>
            <div className="info-item">
              <label>{t('profile.dateOfBirth')}</label>
              <span>{formatDate(patientData.personalInfo.dateOfBirth)}</span>
            </div>
            <div className="info-item">
              <label>{t('profile.gender')}</label>
              <span>{patientData.personalInfo.gender || t('profile.notSpecified')}</span>
            </div>
            <div className="info-item">
              <label>{t('profile.email')}</label>
              <span>{patientData.personalInfo.email}</span>
            </div>
            <div className="info-item">
              <label>{t('profile.phone')}</label>
              <span>{formatPhoneWithCountryCode(patientData.personalInfo.phone, patientData.personalInfo.phoneCountryCode)}</span>
            </div>
          </div>
        </div>


        {/* Address */}
        <div className="info-card-modern">
          <div className="card-header">
            <h2><FaHome /> {t('profile.address')}</h2>
            <button type="button" className="profile-card-edit" onClick={openEditModal} aria-label="Edit address"><FaEdit /></button>
          </div>
          <div className="address-display">
            <p>
              {patientData.personalInfo.address?.line1 || t('profile.noAddressProvided')}
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
        </div>

        <aside className="profile-side-column">
        <div className="profile-location-card">
          <FaMapMarkerAlt />
          <div>
            <strong>{t('update_location')}</strong>
            <span>{[
              patientData.personalInfo.address?.city,
              patientData.personalInfo.address?.state,
            ].filter(Boolean).join(", ") || "Location not added"}</span>
          </div>
          <button
            type="button"
            onClick={handleUpdateLocation}
            disabled={isSaving || isUpdatingLocation}
            title="Send your current GPS coordinates to the server"
          >
            {isUpdatingLocation ? <span className="btn-location-spinner" /> : "Update"}
          </button>
        </div>

        {/* Emergency Contact */}
        <div className="info-card-modern">
          <div className="card-header">
            <h2 className="emergency-title"><FaStarOfLife /> {t('profile.emergencyContact')}</h2>
          </div>
          <div className="emergency-display">
            <div className="emergency-icon">SOS</div>
            <div className="emergency-details">
              <h3>
                {patientData.personalInfo.emergencyContact?.name ||
                  t('profile.notSpecified')}
              </h3>
              <p>{patientData.personalInfo.emergencyContact?.relation}</p>
              <p className="phone">
                {emergencyPhoneDisplay}
              </p>
            </div>
            {patientData.personalInfo.emergencyContact?.phone && (
              <a className="emergency-call" href={`tel:${emergencyPhoneDisplay.replace(/\s/g, '')}`} aria-label="Call emergency contact">
                <FaPhoneAlt />
              </a>
            )}
          </div>
        </div>

        </aside>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="patient-profile-modal-overlay" onClick={handleCancelEdit}>
          <div className="patient-profile-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="patient-profile-modal-header">
              <h3>{t('profile.editProfile')}</h3>
              <button className="close-modal" onClick={handleCancelEdit}>
                ×
              </button>
            </div>
            <div className="patient-profile-modal-body">
              {/* Profile Picture */}
              <div className="form-section">
                <h4>{t('profile')}</h4>
                <div className="profile-picture-edit">
                  <div className="avatar-preview">
                    {!profileImageRemoved && (profileImage || patientData.personalInfo.profilePhoto) ? (
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
                    <button
                      type="button"
                      className="upload-btn"
                      style={{ background: "linear-gradient(135deg, #006B2C, #01CE54)", color: "#fff" }}
                      onClick={() => setShowAvatarBuilder(true)}
                    >
                      Choose Avatar
                    </button>
                    {!profileImageRemoved && (profileImage || patientData.personalInfo.profilePhoto) && (
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={handleRemoveImage}
                      >
                        🗑️ Remove
                      </button>
                    )}
                  </div>
                  <small>Select a dummy avatar and click Save Changes to update your profile.</small>
                </div>
              </div>

              {/* Personal Info */}
              <div className="form-section">
                <h4>{t('personal_information')}</h4>
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
                    <label>Anonymous Name (optional)</label>
                    <input
                      type="text"
                      name="anonymous"
                      value={editFormData.anonymous}
                      onChange={handleEditFormChange}
                      placeholder="Display name for anonymous chats"
                    />
                  </div>
                </div>
                <div className="form-row profile-demographics-row">
                  <div className="form-group">
                    <label>Gender *</label>
                    <select
                      name="gender"
                      value={editFormData.gender}
                      onChange={handleEditFormChange}
                      required
                    >
                      <option value="">{t('select')}</option>
                      <option value="male">{t('male')}</option>
                      <option value="female">{t('female')}</option>
                      <option value="other">{t('other')}</option>
                    </select>
                  </div>
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
                    <label>{t('age')}</label>
                    <input
                      type="number"
                      name="age"
                      value={calculateAge(editFormData.dateOfBirth)}
                      readOnly
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email *</label>
                    <div className="otp-field-row">
                      <input
                        type="email"
                        name="email"
                        value={editFormData.email}
                        onChange={handleEditFormChange}
                        required
                      />
                      {isEmailDirty() && !emailChange.verified && (
                        <button
                          type="button"
                          className="otp-verify-btn"
                          onClick={() => sendChangeOtp("email")}
                          disabled={emailChange.sending}
                        >
                          {emailChange.sending
                            ? "Sending…"
                            : emailChange.sent
                              ? "Resend"
                              : "Verify"}
                        </button>
                      )}
                      {emailChange.verified && (
                        <span className="otp-verified-badge" title="Verified">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    {isEmailDirty() &&
                      emailChange.sent &&
                      !emailChange.verified && (
                        <div className="otp-input-row">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="Enter 6-digit OTP"
                            value={emailChange.otp}
                            onChange={(e) =>
                              setEmailChange((s) => ({
                                ...s,
                                otp: e.target.value.replace(/\D/g, ""),
                              }))
                            }
                          />
                          <button
                            type="button"
                            className="otp-confirm-btn"
                            onClick={() => verifyChangeOtp("email")}
                            disabled={emailChange.verifying}
                          >
                            {emailChange.verifying ? "Verifying…" : "Confirm"}
                          </button>
                        </div>
                      )}
                    {emailChange.error && (
                      <div className="otp-error">{emailChange.error}</div>
                    )}
                    {isEmailDirty() && !emailChange.verified && !emailChange.sent && (
                      <div className="otp-hint">
                        OTP will be sent to the new email before saving.
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Phone *</label>
                    <div className="phone-country-field">
                      <select
                        className="phone-country-select"
                        name="phoneCountry"
                        value={editFormData.phoneCountry}
                        onChange={handleEditFormChange}
                        aria-label="Phone country code"
                      >
                        {PHONE_COUNTRIES.map((country) => (
                          <option key={country.code} value={country.code}>
                            {phoneCountryLabel(country, editFormData.phoneCountry)}
                          </option>
                        ))}
                      </select>
                      <input
                        className="phone-local-input"
                        type="tel"
                        name="phone"
                        inputMode="numeric"
                        maxLength={getLocalPhoneMaxLength((PHONE_COUNTRIES.find(({ code }) => code === editFormData.phoneCountry) || PHONE_COUNTRIES[0]).dial)}
                        value={editFormData.phone}
                        onChange={(event) =>
                          setEditFormData((previous) => ({
                            ...previous,
                            phone: limitPhoneDigits(event.target.value, (PHONE_COUNTRIES.find(({ code }) => code === previous.phoneCountry) || PHONE_COUNTRIES[0]).dial),
                          }))
                        }
                        placeholder="Phone number"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="form-section">
                <h4>{t('address')}</h4>
                <div className="form-row">
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
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('city')}</label>
                    <LocationSelect field="city" name="address.city" address={editFormData.address}
                      onChange={patch => setEditFormData(previous => ({ ...previous, address: { ...previous.address, ...patch } }))} />
                  </div>
                  <div className="form-group">
                    <label>{t('state')}</label>
                    <LocationSelect field="state" name="address.state" address={editFormData.address}
                      onChange={patch => setEditFormData(previous => ({ ...previous, address: { ...previous.address, ...patch } }))} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('pincode')}</label>
                    <input
                      type="text"
                      name="address.pincode"
                      value={editFormData.address.pincode}
                      onChange={handleEditFormChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('country')}</label>
                    <LocationSelect field="country" name="address.country" address={editFormData.address}
                      onChange={patch => setEditFormData(previous => applyPatientAddressChange(previous, patch))} />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="form-section">
                <h4>{t('emergency_contact')}</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('name')}</label>
                    <input
                      type="text"
                      name="emergencyContact.name"
                      value={editFormData.emergencyContact.name}
                      onChange={handleEditFormChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('relation')}</label>
                    <input
                      type="text"
                      name="emergencyContact.relation"
                      value={editFormData.emergencyContact.relation}
                      onChange={handleEditFormChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>{t('phone')}</label>
                  <div className="phone-country-field phone-country-field--emergency">
                    <select className="phone-country-select" name="emergencyPhoneCountry"
                      value={editFormData.emergencyPhoneCountry} onChange={handleEditFormChange}
                      aria-label="Emergency contact country code">
                      {PHONE_COUNTRIES.map(country => <option key={country.code} value={country.code}>{phoneCountryLabel(country, editFormData.emergencyPhoneCountry)}</option>)}
                    </select>
                  <input
                    className="phone-local-input"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    aria-label="Emergency contact phone number"
                    maxLength={getLocalPhoneMaxLength(PHONE_COUNTRIES.find(({ code }) => code === editFormData.emergencyPhoneCountry)?.dial || '+91')}
                    name="emergencyContact.phone"
                    value={editFormData.emergencyContact.phone}
                    onChange={handleEditFormChange}
                  />
                  </div>
                </div>
              </div>

            </div>
            <div className="patient-profile-modal-footer">
              <button
                className="btn-secondary"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveProfile}
                disabled={isSaving || !emailReady}
                title={
                  !emailReady
                    ? "Verify your new email via OTP first"
                    : ""
                }
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAvatarBuilder && (
        <AvatarBuilder
          userName={editFormData.name || patientData.personalInfo.name}
          onSelect={handleAvatarSelect}
          onClose={() => setShowAvatarBuilder(false)}
        />
      )}
    </div>
  );
};

export default PatientProfile;
