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

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

export const PHONE_COUNTRIES = [
  ["AF", "+93", "Afghanistan"], ["AL", "+355", "Albania"], ["DZ", "+213", "Algeria"],
  ["AD", "+376", "Andorra"], ["AO", "+244", "Angola"], ["AG", "+1268", "Antigua and Barbuda"],
  ["AR", "+54", "Argentina"], ["AM", "+374", "Armenia"], ["AU", "+61", "Australia"],
  ["AT", "+43", "Austria"], ["AZ", "+994", "Azerbaijan"], ["BS", "+1242", "Bahamas"],
  ["BH", "+973", "Bahrain"], ["BD", "+880", "Bangladesh"], ["BB", "+1246", "Barbados"],
  ["BY", "+375", "Belarus"], ["BE", "+32", "Belgium"], ["BZ", "+501", "Belize"],
  ["BJ", "+229", "Benin"], ["BT", "+975", "Bhutan"], ["BO", "+591", "Bolivia"],
  ["BA", "+387", "Bosnia and Herzegovina"], ["BW", "+267", "Botswana"], ["BR", "+55", "Brazil"],
  ["BN", "+673", "Brunei"], ["BG", "+359", "Bulgaria"], ["BF", "+226", "Burkina Faso"],
  ["BI", "+257", "Burundi"], ["CV", "+238", "Cabo Verde"], ["KH", "+855", "Cambodia"],
  ["CM", "+237", "Cameroon"], ["CA", "+1", "Canada"], ["CF", "+236", "Central African Republic"],
  ["TD", "+235", "Chad"], ["CL", "+56", "Chile"], ["CN", "+86", "China"],
  ["CO", "+57", "Colombia"], ["KM", "+269", "Comoros"], ["CG", "+242", "Congo"],
  ["CD", "+243", "Congo (DRC)"], ["CR", "+506", "Costa Rica"], ["CI", "+225", "Cote d'Ivoire"],
  ["HR", "+385", "Croatia"], ["CU", "+53", "Cuba"], ["CY", "+357", "Cyprus"],
  ["CZ", "+420", "Czechia"], ["DK", "+45", "Denmark"], ["DJ", "+253", "Djibouti"],
  ["DM", "+1767", "Dominica"], ["DO", "+1809", "Dominican Republic"], ["EC", "+593", "Ecuador"],
  ["EG", "+20", "Egypt"], ["SV", "+503", "El Salvador"], ["GQ", "+240", "Equatorial Guinea"],
  ["ER", "+291", "Eritrea"], ["EE", "+372", "Estonia"], ["SZ", "+268", "Eswatini"],
  ["ET", "+251", "Ethiopia"], ["FJ", "+679", "Fiji"], ["FI", "+358", "Finland"],
  ["FR", "+33", "France"], ["GA", "+241", "Gabon"], ["GM", "+220", "Gambia"],
  ["GE", "+995", "Georgia"], ["DE", "+49", "Germany"], ["GH", "+233", "Ghana"],
  ["GR", "+30", "Greece"], ["GD", "+1473", "Grenada"], ["GT", "+502", "Guatemala"],
  ["GN", "+224", "Guinea"], ["GW", "+245", "Guinea-Bissau"], ["GY", "+592", "Guyana"],
  ["HT", "+509", "Haiti"], ["HN", "+504", "Honduras"], ["HU", "+36", "Hungary"],
  ["IS", "+354", "Iceland"], ["IN", "+91", "India"], ["ID", "+62", "Indonesia"],
  ["IR", "+98", "Iran"], ["IQ", "+964", "Iraq"], ["IE", "+353", "Ireland"],
  ["IL", "+972", "Israel"], ["IT", "+39", "Italy"], ["JM", "+1876", "Jamaica"],
  ["JP", "+81", "Japan"], ["JO", "+962", "Jordan"], ["KZ", "+7", "Kazakhstan"],
  ["KE", "+254", "Kenya"], ["KI", "+686", "Kiribati"], ["KP", "+850", "North Korea"],
  ["KR", "+82", "South Korea"], ["KW", "+965", "Kuwait"], ["KG", "+996", "Kyrgyzstan"],
  ["LA", "+856", "Laos"], ["LV", "+371", "Latvia"], ["LB", "+961", "Lebanon"],
  ["LS", "+266", "Lesotho"], ["LR", "+231", "Liberia"], ["LY", "+218", "Libya"],
  ["LI", "+423", "Liechtenstein"], ["LT", "+370", "Lithuania"], ["LU", "+352", "Luxembourg"],
  ["MG", "+261", "Madagascar"], ["MW", "+265", "Malawi"], ["MY", "+60", "Malaysia"],
  ["MV", "+960", "Maldives"], ["ML", "+223", "Mali"], ["MT", "+356", "Malta"],
  ["MH", "+692", "Marshall Islands"], ["MR", "+222", "Mauritania"], ["MU", "+230", "Mauritius"],
  ["MX", "+52", "Mexico"], ["FM", "+691", "Micronesia"], ["MD", "+373", "Moldova"],
  ["MC", "+377", "Monaco"], ["MN", "+976", "Mongolia"], ["ME", "+382", "Montenegro"],
  ["MA", "+212", "Morocco"], ["MZ", "+258", "Mozambique"], ["MM", "+95", "Myanmar"],
  ["NA", "+264", "Namibia"], ["NR", "+674", "Nauru"], ["NP", "+977", "Nepal"],
  ["NL", "+31", "Netherlands"], ["NZ", "+64", "New Zealand"], ["NI", "+505", "Nicaragua"],
  ["NE", "+227", "Niger"], ["NG", "+234", "Nigeria"], ["MK", "+389", "North Macedonia"],
  ["NO", "+47", "Norway"], ["OM", "+968", "Oman"], ["PK", "+92", "Pakistan"],
  ["PW", "+680", "Palau"], ["PS", "+970", "Palestine"], ["PA", "+507", "Panama"],
  ["PG", "+675", "Papua New Guinea"], ["PY", "+595", "Paraguay"], ["PE", "+51", "Peru"],
  ["PH", "+63", "Philippines"], ["PL", "+48", "Poland"], ["PT", "+351", "Portugal"],
  ["QA", "+974", "Qatar"], ["RO", "+40", "Romania"], ["RU", "+7", "Russia"],
  ["RW", "+250", "Rwanda"], ["KN", "+1869", "Saint Kitts and Nevis"], ["LC", "+1758", "Saint Lucia"],
  ["VC", "+1784", "Saint Vincent and the Grenadines"], ["WS", "+685", "Samoa"], ["SM", "+378", "San Marino"],
  ["ST", "+239", "Sao Tome and Principe"], ["SA", "+966", "Saudi Arabia"], ["SN", "+221", "Senegal"],
  ["RS", "+381", "Serbia"], ["SC", "+248", "Seychelles"], ["SL", "+232", "Sierra Leone"],
  ["SG", "+65", "Singapore"], ["SK", "+421", "Slovakia"], ["SI", "+386", "Slovenia"],
  ["SB", "+677", "Solomon Islands"], ["SO", "+252", "Somalia"], ["ZA", "+27", "South Africa"],
  ["SS", "+211", "South Sudan"], ["ES", "+34", "Spain"], ["LK", "+94", "Sri Lanka"],
  ["SD", "+249", "Sudan"], ["SR", "+597", "Suriname"], ["SE", "+46", "Sweden"],
  ["CH", "+41", "Switzerland"], ["SY", "+963", "Syria"], ["TW", "+886", "Taiwan"],
  ["TJ", "+992", "Tajikistan"], ["TZ", "+255", "Tanzania"], ["TH", "+66", "Thailand"],
  ["TL", "+670", "Timor-Leste"], ["TG", "+228", "Togo"], ["TO", "+676", "Tonga"],
  ["TT", "+1868", "Trinidad and Tobago"], ["TN", "+216", "Tunisia"], ["TR", "+90", "Turkey"],
  ["TM", "+993", "Turkmenistan"], ["TV", "+688", "Tuvalu"], ["UG", "+256", "Uganda"],
  ["UA", "+380", "Ukraine"], ["AE", "+971", "United Arab Emirates"], ["GB", "+44", "United Kingdom"],
  ["US", "+1", "United States"], ["UY", "+598", "Uruguay"], ["UZ", "+998", "Uzbekistan"],
  ["VU", "+678", "Vanuatu"], ["VA", "+39", "Vatican City"], ["VE", "+58", "Venezuela"],
  ["VN", "+84", "Vietnam"], ["YE", "+967", "Yemen"], ["ZM", "+260", "Zambia"],
  ["ZW", "+263", "Zimbabwe"],
].map(([code, dial, label]) => ({ code, dial, label }));

export const splitPhoneNumber = (value) => {
  const raw = String(value || "").trim();
  if (raw.startsWith("+")) {
    const country = [...PHONE_COUNTRIES]
      .sort((a, b) => b.dial.length - a.dial.length)
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
    const phoneParts = splitPhoneNumber(data.personalInfo.phone);
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
    try {
      setIsSaving(true);
      const formData = new FormData();
      const calculatedAge = calculateAge(editFormData.dateOfBirth);

      formData.append("fullName", editFormData.name);
      formData.append("anonymous", editFormData.anonymous || "");
      formData.append("email", editFormData.email);
      formData.append("phoneNumber", getCompletePhoneNumber());
      formData.append("age", String(calculatedAge));
      formData.append("gender", editFormData.gender);
      formData.append("bloodGroup", editFormData.bloodGroup || "");
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

  return (
    <div className="profile-container" aria-busy={isInitialLoading}>
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
            {patientData.personalInfo.phone || t('profile.notSpecified')}
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
              <label>{t('profile.bloodGroup')}</label>
              <span>{patientData.personalInfo.bloodGroup || t('profile.notSpecified')}</span>
            </div>
            <div className="info-item">
              <label>{t('profile.email')}</label>
              <span>{patientData.personalInfo.email}</span>
            </div>
            <div className="info-item">
              <label>{t('profile.phone')}</label>
              <span>{patientData.personalInfo.phone}</span>
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
            <strong>Share my current location</strong>
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
                {patientData.personalInfo.emergencyContact?.phone}
              </p>
            </div>
            {patientData.personalInfo.emergencyContact?.phone && (
              <a className="emergency-call" href={`tel:${patientData.personalInfo.emergencyContact.phone}`} aria-label="Call emergency contact">
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
                <h4>Profile Picture</h4>
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
                    <label>Blood Group</label>
                    <select
                      name="bloodGroup"
                      value={editFormData.bloodGroup}
                      onChange={handleEditFormChange}
                    >
                      <option value="">Select Blood Group</option>
                      {BLOOD_GROUPS.map((bloodGroup) => (
                        <option key={bloodGroup} value={bloodGroup}>
                          {bloodGroup}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
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
                            {country.label} ({country.dial})
                          </option>
                        ))}
                      </select>
                      <input
                        className="phone-local-input"
                        type="tel"
                        name="phone"
                        inputMode="tel"
                        value={editFormData.phone}
                        onChange={(event) =>
                          setEditFormData((previous) => ({
                            ...previous,
                            phone: event.target.value.replace(/[^\d\s()-]/g, ""),
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
                <h4>Address</h4>
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
