import React, { useState, useEffect } from "react";
import {
  FaEnvelope,
  FaLock,
  FaUser,
  FaPhone,
  FaIdCard,
  FaGraduationCap,
  FaBriefcase,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaVenusMars,
  FaUsers,
  FaCheckCircle,
  FaSpinner,
  FaTimes,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import "./CounselorSignup.css";
import logo from "../image/Mediconect Logo-3.png";
import axios from "axios";
import { API_BASE_URL } from "../axiosConfig";

const CounselorSignup = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [slideAnim, setSlideAnim] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phoneNumber: "",
    age: "",
    gender: "",
    qualification: "",
    specialization: "",
    experience: "",
    location: "",
    consultationMode: [],
    languages: [],
    aboutMe: "",
    profilePhoto: null,
    confirmPassword: "",
  });

  // Verification states
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
  const [showPhoneOtpModal, setShowPhoneOtpModal] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);
  const [isVerifyingPhoneOtp, setIsVerifyingPhoneOtp] = useState(false);
  const [emailOtpError, setEmailOtpError] = useState("");
  const [phoneOtpError, setPhoneOtpError] = useState("");
  const [emailOtpSuccess, setEmailOtpSuccess] = useState(false);
  const [phoneOtpSuccess, setPhoneOtpSuccess] = useState(false);
  const [emailResendTimer, setEmailResendTimer] = useState(0);
  const [phoneResendTimer, setPhoneResendTimer] = useState(0);

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });
  const [showDeviceConflict, setShowDeviceConflict] = useState(false);
  const [deviceOtp, setDeviceOtp] = useState("");
  const [deviceOtpSent, setDeviceOtpSent] = useState(false);
  const [isSendingDeviceOtp, setIsSendingDeviceOtp] = useState(false);
  const [isVerifyingDeviceOtp, setIsVerifyingDeviceOtp] = useState(false);

  const consultationModes = ["Online", "Offline", "Both"];
  const languageOptions = [
    "Hindi",
    "English",
    "Gujarati",
    "Marathi",
    "Tamil",
    "Telugu",
    "Bengali",
    "Punjabi",
  ];

  useEffect(() => {
    let interval;
    if (emailResendTimer > 0) {
      interval = setInterval(
        () => setEmailResendTimer((prev) => prev - 1),
        1000,
      );
    }
    return () => clearInterval(interval);
  }, [emailResendTimer]);

  useEffect(() => {
    let interval;
    if (phoneResendTimer > 0) {
      interval = setInterval(
        () => setPhoneResendTimer((prev) => prev - 1),
        1000,
      );
    }
    return () => clearInterval(interval);
  }, [phoneResendTimer]);

  useEffect(() => {
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");
    const userRole = (localStorage.getItem("userRole") || "").toLowerCase();
    if (token && (userRole === "counselor" || userRole === "counsellor")) {
      navigate("/counselor-dashboard");
    } else if (token && userRole === "user") {
      navigate("/user-dashboard");
    }
  }, [navigate]);

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "" }),
      3000,
    );
  };
  const location = useLocation();
  const roleFromState = location.state?.role;

  useEffect(() => {
    if (roleFromState) {
      localStorage.setItem("role", roleFromState);
    }
  }, [roleFromState]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      setFormData({ ...formData, [name]: files[0] });
    } else if (type === "checkbox") {
      if (name === "consultationMode") {
        let updatedModes = [...formData.consultationMode];
        if (checked) updatedModes.push(value);
        else updatedModes = updatedModes.filter((mode) => mode !== value);
        setFormData({ ...formData, consultationMode: updatedModes });
      } else if (name === "languages") {
        let updatedLanguages = [...formData.languages];
        if (checked) updatedLanguages.push(value);
        else
          updatedLanguages = updatedLanguages.filter((lang) => lang !== value);
        setFormData({ ...formData, languages: updatedLanguages });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }

    if (errors[name]) setErrors({ ...errors, [name]: "" });
    if (name === "email") setEmailVerified(false);
    if (name === "phoneNumber") setPhoneVerified(false);
  };

  const validateLogin = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";
    if (!formData.password) newErrors.password = "Password is required";
    return newErrors;
  };

  const handleForgotPassword = async () => {
    const emailFromForm = String(formData.email || "")
      .trim()
      .toLowerCase();
    const promptedEmail = emailFromForm
      ? ""
      : window.prompt("Enter your registered email:", "") || "";
    const normalizedEmail = String(emailFromForm || promptedEmail)
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      showNotification("Please enter your registered email", "error");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      showNotification("Please enter a valid email address", "error");
      return;
    }

    try {
      setIsLoading(true);
      const endpoints = ["forgot-password", "forgotPassword"];
      let sent = false;

      for (const endpoint of endpoints) {
        try {
          await axios.post(
            `${API_BASE_URL}/api/auth/${endpoint}`,
            { email: normalizedEmail },
            { withCredentials: true },
          );
          sent = true;
          break;
        } catch (error) {
          if (error?.response?.status !== 404) {
            throw error;
          }
        }
      }

      if (!sent) {
        throw new Error("Unable to reach forgot password API");
      }

      setFormData((prev) => ({ ...prev, email: normalizedEmail }));
      showNotification("Reset link sent to your email", "success");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to send reset link right now";
      showNotification(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const validateSignup = () => {
    const newErrors = {};
    if (!formData.fullName) newErrors.fullName = "Full name is required";
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";
    else if (!emailVerified) newErrors.email = "Please verify your email first";

    if (!formData.phoneNumber)
      newErrors.phoneNumber = "Phone number is required";
    else if (!/^\d{10}$/.test(formData.phoneNumber))
      newErrors.phoneNumber = "Phone number must be 10 digits";
    else if (!phoneVerified)
      newErrors.phoneNumber = "Please verify your phone number first";

    if (!formData.age) newErrors.age = "Age is required";
    else if (formData.age < 18 || formData.age > 100)
      newErrors.age = "Age must be between 18 and 100";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.qualification)
      newErrors.qualification = "Qualification is required";
    if (!formData.specialization)
      newErrors.specialization = "Specialization is required";
    if (!formData.experience) newErrors.experience = "Experience is required";
    else if (formData.experience < 0)
      newErrors.experience = "Experience cannot be negative";
    if (!formData.location) newErrors.location = "Location is required";
    if (formData.consultationMode.length === 0)
      newErrors.consultationMode = "Select at least one consultation mode";
    if (formData.languages.length === 0)
      newErrors.languages = "Select at least one language";
    if (!formData.aboutMe) newErrors.aboutMe = "About me is required";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Please confirm password";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    return newErrors;
  };

  const handleSendEmailOtp = async () => {
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      setEmailOtpError("Please enter a valid email address");
      return;
    }
    setIsSendingEmailOtp(true);
    setEmailOtpError("");
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/send-email-otp`,
        { email: formData.email },
      );
      if (response.data.success) {
        showNotification("OTP sent to your email!", "success");
        setEmailResendTimer(60);
        setEmailOtpSuccess(false);
        setEmailOtp("");
      } else {
        setEmailOtpError(response.data.message || "Failed to send OTP");
      }
    } catch (error) {
      setEmailOtpError(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtp || emailOtp.length !== 6) {
      setEmailOtpError("Please enter 6-digit OTP");
      return;
    }
    setIsVerifyingEmailOtp(true);
    setEmailOtpError("");
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/verify-email-otp`,
        { email: formData.email, otp: emailOtp },
      );
      if (response.data.success) {
        setEmailVerified(true);
        setEmailOtpSuccess(true);
        showNotification("Email verified successfully!", "success");
        setTimeout(() => {
          setShowEmailOtpModal(false);
          resetEmailOtpState();
        }, 1500);
      } else {
        setEmailOtpError(response.data.message || "Invalid OTP");
      }
    } catch (error) {
      setEmailOtpError(error.response?.data?.message || "Verification failed");
    } finally {
      setIsVerifyingEmailOtp(false);
    }
  };

  const resetEmailOtpState = () => {
    setEmailOtp("");
    setEmailOtpError("");
    setEmailOtpSuccess(false);
    setEmailResendTimer(0);
  };

  const handleSendPhoneOtp = async () => {
    if (!formData.phoneNumber || !/^\d{10}$/.test(formData.phoneNumber)) {
      setPhoneOtpError("Please enter a valid 10-digit phone number");
      return;
    }
    setIsSendingPhoneOtp(true);
    setPhoneOtpError("");
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/send-phone-otp`,
        { phoneNumber: formData.phoneNumber, email: formData.email },
      );
      if (response.data.success) {
        showNotification("OTP sent to your phone!", "success");
        setPhoneResendTimer(60);
        setPhoneOtpSuccess(false);
        setPhoneOtp("");
      } else {
        setPhoneOtpError(response.data.message || "Failed to send OTP");
      }
    } catch (error) {
      setPhoneOtpError(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsSendingPhoneOtp(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtp || phoneOtp.length !== 6) {
      setPhoneOtpError("Please enter 6-digit OTP");
      return;
    }
    setIsVerifyingPhoneOtp(true);
    setPhoneOtpError("");
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/verify-phone-otp`,
        { phoneNumber: formData.phoneNumber, otp: phoneOtp },
      );
      if (response.data.success) {
        setPhoneVerified(true);
        setPhoneOtpSuccess(true);
        showNotification("Phone number verified successfully!", "success");
        setTimeout(() => {
          setShowPhoneOtpModal(false);
          resetPhoneOtpState();
        }, 1500);
      } else {
        setPhoneOtpError(response.data.message || "Invalid OTP");
      }
    } catch (error) {
      setPhoneOtpError(error.response?.data?.message || "Verification failed");
    } finally {
      setIsVerifyingPhoneOtp(false);
    }
  };

  const resetPhoneOtpState = () => {
    setPhoneOtp("");
    setPhoneOtpError("");
    setPhoneOtpSuccess(false);
    setPhoneResendTimer(0);
  };

  const persistCounselorSession = (data) => {
    // Store tokens from response if present
    if (data?.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
    }
    if (data?.refreshToken) {
      localStorage.setItem("refreshToken", data.refreshToken);
    }
    const token = data?.token || data?.accessToken;
    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("accessToken", token);
    }
    if (data.user) {
      localStorage.setItem("userData", JSON.stringify(data.user));
      localStorage.setItem("userRole", data.user.role || "counsellor");
      const id = data.user._id || data.user.id;
      if (id) {
        localStorage.setItem("counsellorId", id);
        localStorage.setItem("counselorId", id);
        localStorage.setItem("userId", id);
      }
    } else {
      localStorage.setItem("userRole", "counselor");
    }
    localStorage.setItem("userEmail", formData.email);
    localStorage.setItem("isAuthenticated", "true");
    return true;
  };

  const handleLogin = async () => {
    try {
      // Always send role for login to match backend expectation
      const role = roleFromState || localStorage.getItem("role") || "counselor";
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        {
          email: formData.email,
          password: formData.password,
          role,
        },
        { withCredentials: true },
      );

      // Enforce role: only counsellor accounts can login here
      const returnedRole = (
        response.data?.role ||
        response.data?.user?.role ||
        "counsellor"
      ).toLowerCase();
      const isCounselor =
        returnedRole === "counselor" || returnedRole === "counsellor";

      if (!isCounselor) {
        showNotification(
          "Access denied: Your account is registered as a User. Please use the User login page.",
          "error",
        );
        return;
      }

      if (persistCounselorSession(response.data)) {
        showNotification("Login successful! Redirecting...", "success");
        setTimeout(() => navigate("/counselor-dashboard"), 1200);
      } else {
        showNotification(response.data?.message || "Login failed", "error");
      }
    } catch (error) {
      if (error.response?.status === 409 && error.response?.data?.needLogout) {
        setShowDeviceConflict(true);
        setDeviceOtpSent(false);
        setDeviceOtp("");
        showNotification(
          "Already login detected. Continue with OTP verification.",
          "info",
        );
        return;
      }
      showNotification(
        error.response?.data?.message || "Something went wrong",
        "error",
      );
    }
  };

  const handleSendDeviceOtp = async () => {
    setIsSendingDeviceOtp(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/logout-other-devices`,
        { email: formData.email },
        { withCredentials: true },
      );
      if (response.data?.success) {
        setDeviceOtpSent(true);
        showNotification("OTP sent to your email. Enter it below.", "success");
      } else {
        showNotification(
          response.data?.message || "Failed to send OTP",
          "error",
        );
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || "Failed to send OTP",
        "error",
      );
    } finally {
      setIsSendingDeviceOtp(false);
    }
  };

  const handleVerifyDeviceOtp = async () => {
    if (!deviceOtp || deviceOtp.length !== 6) {
      showNotification("Please enter a valid 6-digit OTP", "error");
      return;
    }
    setIsVerifyingDeviceOtp(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/verify-login-otp`,
        { email: formData.email, otp: deviceOtp },
        { withCredentials: true },
      );
      if (persistCounselorSession(response.data)) {
        setShowDeviceConflict(false);
        showNotification("OTP verified! Redirecting...", "success");
        setTimeout(() => navigate("/counselor-dashboard"), 1200);
      } else {
        showNotification(
          response.data?.message || "OTP verification failed",
          "error",
        );
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || "OTP verification failed",
        "error",
      );
    } finally {
      setIsVerifyingDeviceOtp(false);
    }
  };

  const handleSignup = async () => {
    if (!emailVerified) {
      setErrors((prev) => ({
        ...prev,
        email: "Please verify your email first",
      }));
      showNotification("Please verify your email first", "error");
      return;
    }
    if (!phoneVerified) {
      setErrors((prev) => ({
        ...prev,
        phoneNumber: "Please verify your phone number first",
      }));
      showNotification("Please verify your phone number first", "error");
      return;
    }

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        age: Number(formData.age),
        gender: formData.gender.toLowerCase(),
        qualification: formData.qualification.trim(),
        specialization: formData.specialization.trim(),
        experience: Number(formData.experience),
        location: formData.location.trim(),
        consultationMode: formData.consultationMode.map((m) => m.toLowerCase()),
        languages: formData.languages,
        aboutMe: formData.aboutMe.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: "counselor",
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/auth/complete-registration`,
        payload,
      );

      if (response.data.success) {
        showNotification(
          "Counselor registered successfully! Redirecting...",
          "success",
        );
        const token = response.data?.token || response.data?.accessToken;
        if (token) {
          localStorage.setItem("accessToken", token);
          localStorage.setItem("token", token);
          localStorage.setItem("userRole", "counselor");
          localStorage.setItem("userEmail", formData.email);
          localStorage.setItem("isAuthenticated", "true");
          if (response.data.user) {
            localStorage.setItem(
              "userData",
              JSON.stringify(response.data.user),
            );
            localStorage.setItem("counsellorId", response.data.user._id);
          }
        }
        setTimeout(() => navigate("/counselor-dashboard"), 1500);
      } else {
        showNotification(
          response.data.message || "Registration failed",
          "error",
        );
      }
    } catch (error) {
      if (error.response?.status === 409) {
        showNotification(
          "Counselor with this email or phone already exists",
          "error",
        );
      } else {
        showNotification("Registration failed. Please try again.", "error");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (isLogin) {
      const loginErrors = validateLogin();
      if (Object.keys(loginErrors).length > 0) {
        setErrors(loginErrors);
        setIsLoading(false);
        showNotification("Please fill in all required fields", "error");
        return;
      }
      await handleLogin();
    } else {
      const signupErrors = validateSignup();
      if (Object.keys(signupErrors).length > 0) {
        setErrors(signupErrors);
        setIsLoading(false);
        showNotification(
          "Please fill in all required fields correctly",
          "error",
        );
        return;
      }
      await handleSignup();
    }
    setIsLoading(false);
  };

  // Smooth toggle with slide animation
  const toggleMode = () => {
    if (isLoading) return;
    // Set animation direction: slide-left when going to signup, slide-right when going to login
    setSlideAnim(isLogin ? "slide-left" : "slide-right");
    setTimeout(() => {
      setIsLogin(!isLogin);
      setErrors({});
      setShowDeviceConflict(false);
      setDeviceOtpSent(false);
      setDeviceOtp("");
      setEmailVerified(false);
      setPhoneVerified(false);
      setFormData({
        email: "",
        password: "",
        fullName: "",
        phoneNumber: "",
        age: "",
        gender: "",
        qualification: "",
        specialization: "",
        experience: "",
        location: "",
        consultationMode: [],
        languages: [],
        aboutMe: "",
        profilePhoto: null,
        confirmPassword: "",
      });
      setNotification({ show: false, message: "", type: "" });
      setTimeout(() => setSlideAnim(""), 50);
    }, 300);
  };

  // Login Form Component
  const LoginForm = () => (
    <form onSubmit={handleSubmit} className="cs-form">
      <div className="cs-field">
        <label className="cs-label">
          <FaEnvelope className="cs-field-icon" /> Email Address{" "}
          <span className="cs-required">*</span>
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`cs-input ${errors.email ? "cs-input-error" : ""}`}
          placeholder="Enter your email"
          disabled={isLoading}
        />
        {errors.email && <span className="cs-error">{errors.email}</span>}
      </div>

      <div className="cs-field">
        <label className="cs-label">
          <FaLock className="cs-field-icon" /> Password{" "}
          <span className="cs-required">*</span>
        </label>
        <div className="cs-password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`cs-input ${errors.password ? "cs-input-error" : ""}`}
            placeholder="Enter your password"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="cs-password-toggle"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {errors.password && <span className="cs-error">{errors.password}</span>}
      </div>

      <div className="cs-options">
        <label className="cs-checkbox">
          <input type="checkbox" disabled={isLoading} /> Remember me
        </label>
        <a href="#" className={`cs-forgot ${isLoading ? "cs-disabled" : ""}`}>
          Forgot password?
        </a>
      </div>

      <button
        type="submit"
        className={`cs-submit ${isLoading ? "cs-submit-loading" : ""}`}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span className="cs-spinner"></span> Logging in...
          </>
        ) : (
          "Login"
        )}
      </button>
    </form>
  );

  // Signup Form Component
  const SignupForm = () => (
    <form onSubmit={handleSubmit} className="cs-form">
      <div className="cs-grid">
        <div className="cs-field">
          <label className="cs-label">
            <FaUser className="cs-field-icon" /> Full Name{" "}
            <span className="cs-required">*</span>
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className={`cs-input ${errors.fullName ? "cs-input-error" : ""}`}
            placeholder="Enter your full name"
            disabled={isLoading}
          />
          {errors.fullName && (
            <span className="cs-error">{errors.fullName}</span>
          )}
        </div>

        <div className="cs-field">
          <label className="cs-label">
            <FaEnvelope className="cs-field-icon" /> Email{" "}
            <span className="cs-required">*</span>
          </label>
          <div className="cs-verify-group">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`cs-input ${errors.email ? "cs-input-error" : ""} ${emailVerified ? "cs-verified-input" : ""}`}
              placeholder="Enter your email"
              disabled={isLoading || emailVerified}
            />
            {!emailVerified &&
              formData.email &&
              /\S+@\S+\.\S+/.test(formData.email) && (
                <button
                  type="button"
                  onClick={() => {
                    resetEmailOtpState();
                    setShowEmailOtpModal(true);
                    handleSendEmailOtp();
                  }}
                  className="cs-verify-btn"
                  disabled={isLoading}
                >
                  Verify
                </button>
              )}
            {emailVerified && (
              <span className="cs-verified-badge">
                <FaCheckCircle /> Verified
              </span>
            )}
          </div>
          {errors.email && <span className="cs-error">{errors.email}</span>}
        </div>

        <div className="cs-field">
          <label className="cs-label">
            <FaPhone className="cs-field-icon" /> Phone Number{" "}
            <span className="cs-required">*</span>
          </label>
          <div className="cs-verify-group">
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className={`cs-input ${errors.phoneNumber ? "cs-input-error" : ""} ${phoneVerified ? "cs-verified-input" : ""}`}
              placeholder="10 digit mobile number"
              maxLength="10"
              disabled={isLoading || phoneVerified}
            />
            {!phoneVerified &&
              formData.phoneNumber &&
              /^\d{10}$/.test(formData.phoneNumber) && (
                <button
                  type="button"
                  onClick={() => {
                    resetPhoneOtpState();
                    setShowPhoneOtpModal(true);
                    handleSendPhoneOtp();
                  }}
                  className="cs-verify-btn"
                  disabled={isLoading}
                >
                  Verify
                </button>
              )}
            {phoneVerified && (
              <span className="cs-verified-badge">
                <FaCheckCircle /> Verified
              </span>
            )}
          </div>
          {errors.phoneNumber && (
            <span className="cs-error">{errors.phoneNumber}</span>
          )}
        </div>

        <div className="cs-field">
          <label className="cs-label">
            <FaCalendarAlt className="cs-field-icon" /> Age{" "}
            <span className="cs-required">*</span>
          </label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            className={`cs-input ${errors.age ? "cs-input-error" : ""}`}
            placeholder="Your age"
            min="18"
            max="100"
            disabled={isLoading}
          />
          {errors.age && <span className="cs-error">{errors.age}</span>}
        </div>

        <div className="cs-field">
          <label className="cs-label">
            <FaVenusMars className="cs-field-icon" /> Gender{" "}
            <span className="cs-required">*</span>
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className={`cs-select ${errors.gender ? "cs-input-error" : ""}`}
            disabled={isLoading}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          {errors.gender && <span className="cs-error">{errors.gender}</span>}
        </div>

        <div className="cs-field">
          <label className="cs-label">
            <FaGraduationCap className="cs-field-icon" /> Qualification{" "}
            <span className="cs-required">*</span>
          </label>
          <input
            type="text"
            name="qualification"
            value={formData.qualification}
            onChange={handleChange}
            className={`cs-input ${errors.qualification ? "cs-input-error" : ""}`}
            placeholder="e.g., M.Sc Psychology"
            disabled={isLoading}
          />
          {errors.qualification && (
            <span className="cs-error">{errors.qualification}</span>
          )}
        </div>

        <div className="cs-field">
          <label className="cs-label">
            <FaIdCard className="cs-field-icon" /> Specialization{" "}
            <span className="cs-required">*</span>
          </label>
          <input
            type="text"
            name="specialization"
            value={formData.specialization}
            onChange={handleChange}
            className={`cs-input ${errors.specialization ? "cs-input-error" : ""}`}
            placeholder="e.g., Clinical Psychology"
            disabled={isLoading}
          />
          {errors.specialization && (
            <span className="cs-error">{errors.specialization}</span>
          )}
        </div>

        <div className="cs-field">
          <label className="cs-label">
            <FaBriefcase className="cs-field-icon" /> Experience (Years){" "}
            <span className="cs-required">*</span>
          </label>
          <input
            type="number"
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            className={`cs-input ${errors.experience ? "cs-input-error" : ""}`}
            placeholder="Years of experience"
            min="0"
            step="0.5"
            disabled={isLoading}
          />
          {errors.experience && (
            <span className="cs-error">{errors.experience}</span>
          )}
        </div>

        <div className="cs-field">
          <label className="cs-label">
            <FaMapMarkerAlt className="cs-field-icon" /> Location{" "}
            <span className="cs-required">*</span>
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className={`cs-input ${errors.location ? "cs-input-error" : ""}`}
            placeholder="City, State"
            disabled={isLoading}
          />
          {errors.location && (
            <span className="cs-error">{errors.location}</span>
          )}
        </div>
      </div>

      <div className="cs-field">
        <label className="cs-label">
          <FaUsers className="cs-field-icon" /> Consultation Mode{" "}
          <span className="cs-required">*</span>
        </label>
        <div className="cs-checkbox-group">
          {consultationModes.map((mode) => (
            <label key={mode} className="cs-checkbox-label">
              <input
                type="checkbox"
                name="consultationMode"
                value={mode}
                checked={formData.consultationMode.includes(mode)}
                onChange={handleChange}
                disabled={isLoading}
              />{" "}
              {mode}
            </label>
          ))}
        </div>
        {errors.consultationMode && (
          <span className="cs-error">{errors.consultationMode}</span>
        )}
      </div>

      <div className="cs-field">
        <label className="cs-label">
          Languages <span className="cs-required">*</span>
        </label>
        <div className="cs-checkbox-group">
          {languageOptions.map((lang) => (
            <label key={lang} className="cs-checkbox-label">
              <input
                type="checkbox"
                name="languages"
                value={lang}
                checked={formData.languages.includes(lang)}
                onChange={handleChange}
                disabled={isLoading}
              />{" "}
              {lang}
            </label>
          ))}
        </div>
        {errors.languages && (
          <span className="cs-error">{errors.languages}</span>
        )}
      </div>

      <div className="cs-field">
        <label className="cs-label">
          About Me <span className="cs-required">*</span>
        </label>
        <textarea
          name="aboutMe"
          value={formData.aboutMe}
          onChange={handleChange}
          className={`cs-textarea ${errors.aboutMe ? "cs-input-error" : ""}`}
          placeholder="Tell us about yourself, your approach, and expertise..."
          rows="4"
          disabled={isLoading}
        />
        {errors.aboutMe && <span className="cs-error">{errors.aboutMe}</span>}
      </div>

      <div className="cs-field">
        <label className="cs-label">Profile Photo</label>
        <input
          type="file"
          name="profilePhoto"
          onChange={handleChange}
          accept="image/*"
          className="cs-file"
          disabled={isLoading}
        />
      </div>

      <div className="cs-field">
        <label className="cs-label">
          <FaLock className="cs-field-icon" /> Password{" "}
          <span className="cs-required">*</span>
        </label>
        <div className="cs-password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`cs-input ${errors.password ? "cs-input-error" : ""}`}
            placeholder="Create a password"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="cs-password-toggle"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {errors.password && <span className="cs-error">{errors.password}</span>}
      </div>

      <div className="cs-field">
        <label className="cs-label">
          <FaLock className="cs-field-icon" /> Confirm Password{" "}
          <span className="cs-required">*</span>
        </label>
        <div className="cs-password-wrapper">
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`cs-input ${errors.confirmPassword ? "cs-input-error" : ""}`}
            placeholder="Confirm your password"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="cs-password-toggle"
          >
            {showConfirmPassword ? "Hide" : "Show"}
          </button>
        </div>
        {errors.confirmPassword && (
          <span className="cs-error">{errors.confirmPassword}</span>
        )}
      </div>

      <button
        type="submit"
        className={`cs-submit ${isLoading ? "cs-submit-loading" : ""}`}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span className="cs-spinner"></span> Creating Account...
          </>
        ) : (
          "Create Account"
        )}
      </button>

      <p className="cs-terms">
        By signing up, you agree to our <a href="#">Terms of Service</a> and{" "}
        <a href="#">Privacy Policy</a>
      </p>
    </form>
  );

  // Email OTP Modal
  const EmailOtpModal = () => (
    <div
      className="cs-otp-overlay"
      onClick={() => {
        if (!emailOtpSuccess) {
          setShowEmailOtpModal(false);
          resetEmailOtpState();
        }
      }}
    >
      <div className="cs-otp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cs-otp-header">
          <div className="cs-otp-icon-wrapper">
            <FaEnvelope />
          </div>
          <h3>Verify Email Address</h3>
          <button
            className="cs-otp-close"
            onClick={() => {
              setShowEmailOtpModal(false);
              resetEmailOtpState();
            }}
            disabled={isVerifyingEmailOtp}
          >
            <FaTimes />
          </button>
        </div>
        <div className="cs-otp-body">
          <p>Enter the verification code sent to</p>
          <div className="cs-otp-recipient">{formData.email}</div>
          <div className="cs-otp-input-group">
            <input
              type="text"
              placeholder="000000"
              value={emailOtp}
              onChange={(e) =>
                setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className={`cs-otp-input ${emailOtpSuccess ? "cs-otp-input-success" : ""}`}
              maxLength="6"
              disabled={isVerifyingEmailOtp || emailOtpSuccess}
              autoFocus
            />
            {emailOtpSuccess && (
              <FaCheckCircle className="cs-otp-success-icon" />
            )}
          </div>
          {emailOtpError && <div className="cs-otp-error">{emailOtpError}</div>}
          <div className="cs-otp-actions">
            <button
              onClick={handleVerifyEmailOtp}
              className="cs-otp-verify"
              disabled={isVerifyingEmailOtp || emailOtpSuccess || !emailOtp}
            >
              {isVerifyingEmailOtp ? (
                <FaSpinner className="cs-spin" />
              ) : (
                "Verify"
              )}
            </button>
            <button
              onClick={handleSendEmailOtp}
              className="cs-otp-resend"
              disabled={
                isSendingEmailOtp || emailResendTimer > 0 || emailOtpSuccess
              }
            >
              {isSendingEmailOtp ? (
                <>
                  <FaSpinner className="cs-spin" /> Sending
                </>
              ) : emailResendTimer > 0 ? (
                `Resend in ${emailResendTimer}s`
              ) : (
                "Resend Code"
              )}
            </button>
          </div>
          {emailOtpSuccess && (
            <div className="cs-otp-success">
              <FaCheckCircle /> Email verified successfully!
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Phone OTP Modal
  const PhoneOtpModal = () => (
    <div
      className="cs-otp-overlay"
      onClick={() => {
        if (!phoneOtpSuccess) {
          setShowPhoneOtpModal(false);
          resetPhoneOtpState();
        }
      }}
    >
      <div
        className="cs-otp-modal cs-otp-modal-phone"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cs-otp-header">
          <div className="cs-otp-icon-wrapper">
            <FaPhone />
          </div>
          <h3>Verify Phone Number</h3>
          <button
            className="cs-otp-close"
            onClick={() => {
              setShowPhoneOtpModal(false);
              resetPhoneOtpState();
            }}
            disabled={isVerifyingPhoneOtp}
          >
            <FaTimes />
          </button>
        </div>
        <div className="cs-otp-body">
          <p>Enter the verification code sent to</p>
          <div className="cs-otp-recipient">{formData.phoneNumber}</div>
          <div className="cs-otp-input-group">
            <input
              type="text"
              placeholder="000000"
              value={phoneOtp}
              onChange={(e) =>
                setPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className={`cs-otp-input ${phoneOtpSuccess ? "cs-otp-input-success" : ""}`}
              maxLength="6"
              disabled={isVerifyingPhoneOtp || phoneOtpSuccess}
              autoFocus
            />
            {phoneOtpSuccess && (
              <FaCheckCircle className="cs-otp-success-icon" />
            )}
          </div>
          {phoneOtpError && <div className="cs-otp-error">{phoneOtpError}</div>}
          <div className="cs-otp-actions">
            <button
              onClick={handleVerifyPhoneOtp}
              className="cs-otp-verify"
              disabled={isVerifyingPhoneOtp || phoneOtpSuccess || !phoneOtp}
            >
              {isVerifyingPhoneOtp ? (
                <FaSpinner className="cs-spin" />
              ) : (
                "Verify"
              )}
            </button>
            <button
              onClick={handleSendPhoneOtp}
              className="cs-otp-resend"
              disabled={
                isSendingPhoneOtp || phoneResendTimer > 0 || phoneOtpSuccess
              }
            >
              {isSendingPhoneOtp ? (
                <>
                  <FaSpinner className="cs-spin" /> Sending
                </>
              ) : phoneResendTimer > 0 ? (
                `Resend in ${phoneResendTimer}s`
              ) : (
                "Resend Code"
              )}
            </button>
          </div>
          {phoneOtpSuccess && (
            <div className="cs-otp-success">
              <FaCheckCircle /> Phone verified successfully!
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="cs-wrapper">
      {notification.show && (
        <div className={`cs-notification cs-notification-${notification.type}`}>
          <div className="cs-notification-content">
            <span className="cs-notification-icon">
              {notification.type === "success" && "✓"}
              {notification.type === "error" && "⚠️"}
              {notification.type === "info" && "ℹ️"}
            </span>
            <span className="cs-notification-message">
              {notification.message}
            </span>
          </div>
        </div>
      )}

      {showEmailOtpModal && <EmailOtpModal />}
      {showPhoneOtpModal && <PhoneOtpModal />}

      <div className="cs-container">
        <div className="cs-brand">
          <div className="cs-brand-content">
            <div className="cs-logo">
              <img src={logo} alt="Mediconect Logo" className="cs-logo-img" />
              <span className="cs-logo-text">Counselors</span>
            </div>
            <h1 className="cs-brand-title">
              {isLogin ? "Welcome Back!" : "Join Our Community"}
            </h1>
            <p className="cs-brand-subtitle">
              {isLogin
                ? "Connect with expert counselors and find the support you need."
                : "Start your journey as a certified mental health counselor."}
            </p>
            <div className="cs-features">
              <div className="cs-feature">✓ Expert Counselors</div>
              <div className="cs-feature">✓ 24/7 Support</div>
              <div className="cs-feature">✓ Confidential Sessions</div>
            </div>
          </div>
        </div>

        <div className="cs-form-section">
          <div className="cs-form-header">
            <h2>{isLogin ? "Login to Account" : "Create Account"}</h2>
            <p>
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                onClick={toggleMode}
                className="cs-toggle"
                disabled={isLoading}
              >
                {isLogin ? "Sign Up" : "Login"}
              </button>
            </p>
          </div>

          {isLogin && showDeviceConflict && (
            <div className="cs-device-conflict-box">
              <p className="cs-device-conflict-text">
                Already login detected on another device.
              </p>
              <button
                type="button"
                onClick={handleSendDeviceOtp}
                className="cs-device-action-btn"
                disabled={isSendingDeviceOtp}
              >
                {isSendingDeviceOtp ? (
                  <>
                    <FaSpinner className="cs-spin" /> Sending OTP...
                  </>
                ) : (
                  "Logout Other Devices & Send OTP"
                )}
              </button>
              {deviceOtpSent && (
                <div className="cs-device-otp-row">
                  <input
                    type="text"
                    value={deviceOtp}
                    onChange={(e) =>
                      setDeviceOtp(
                        e.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                    className="cs-input"
                    placeholder="Enter 6-digit OTP"
                    maxLength="6"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyDeviceOtp}
                    className="cs-device-action-btn cs-device-verify-btn"
                    disabled={isVerifyingDeviceOtp}
                  >
                    {isVerifyingDeviceOtp ? (
                      <>
                        <FaSpinner className="cs-spin" /> Verifying...
                      </>
                    ) : (
                      "Verify OTP"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="cs-form">
            {isLogin ? (
              <>
                <div className="cs-field">
                  <label className="cs-label">
                    <FaEnvelope className="cs-field-icon" />
                    Email Address <span className="cs-required">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`cs-input ${errors.email ? "cs-input-error" : ""}`}
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <span className="cs-error">{errors.email}</span>
                  )}
                </div>

                <div className="cs-field">
                  <label className="cs-label">
                    <FaLock className="cs-field-icon" />
                    Password <span className="cs-required">*</span>
                  </label>
                  <div className="cs-password-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`cs-input ${errors.password ? "cs-input-error" : ""}`}
                      placeholder="Enter your password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="cs-password-toggle"
                      disabled={isLoading}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="cs-error">{errors.password}</span>
                  )}
                </div>

                <div className="cs-options">
                  <label className="cs-checkbox">
                    <input type="checkbox" disabled={isLoading} /> Remember me
                  </label>
                  <a
                    href="#"
                    className={`cs-forgot ${isLoading ? "cs-disabled" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      if (!isLoading) {
                        void handleForgotPassword();
                      }
                    }}
                  >
                    Forgot password?
                  </a>
                </div>
              </>
            ) : (
              <>
                <div className="cs-grid">
                  <div className="cs-field">
                    <label className="cs-label">
                      <FaUser className="cs-field-icon" />
                      Full Name <span className="cs-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`cs-input ${errors.fullName ? "cs-input-error" : ""}`}
                      placeholder="Enter your full name"
                      disabled={isLoading}
                    />
                    {errors.fullName && (
                      <span className="cs-error">{errors.fullName}</span>
                    )}
                  </div>

                  <div className="cs-field">
                    <label className="cs-label">
                      <FaEnvelope className="cs-field-icon" />
                      Email <span className="cs-required">*</span>
                    </label>
                    <div className="cs-verify-group">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`cs-input ${errors.email ? "cs-input-error" : ""} ${emailVerified ? "cs-verified-input" : ""}`}
                        placeholder="Enter your email"
                        disabled={isLoading || emailVerified}
                      />
                      {!emailVerified &&
                        formData.email &&
                        /\S+@\S+\.\S+/.test(formData.email) && (
                          <button
                            type="button"
                            onClick={() => {
                              resetEmailOtpState();
                              setShowEmailOtpModal(true);
                              handleSendEmailOtp();
                            }}
                            className="cs-verify-btn"
                            disabled={isLoading}
                          >
                            Verify
                          </button>
                        )}
                      {emailVerified && (
                        <span className="cs-verified-badge">
                          <FaCheckCircle /> Verified
                        </span>
                      )}
                    </div>
                    {errors.email && (
                      <span className="cs-error">{errors.email}</span>
                    )}
                  </div>

                  <div className="cs-field">
                    <label className="cs-label">
                      <FaPhone className="cs-field-icon" />
                      Phone Number <span className="cs-required">*</span>
                    </label>
                    <div className="cs-verify-group">
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className={`cs-input ${errors.phoneNumber ? "cs-input-error" : ""} ${phoneVerified ? "cs-verified-input" : ""}`}
                        placeholder="10 digit mobile number"
                        maxLength="10"
                        disabled={isLoading || phoneVerified}
                      />
                      {!phoneVerified &&
                        formData.phoneNumber &&
                        /^\d{10}$/.test(formData.phoneNumber) && (
                          <button
                            type="button"
                            onClick={() => {
                              resetPhoneOtpState();
                              setShowPhoneOtpModal(true);
                              handleSendPhoneOtp();
                            }}
                            className="cs-verify-btn"
                            disabled={isLoading}
                          >
                            Verify
                          </button>
                        )}
                      {phoneVerified && (
                        <span className="cs-verified-badge">
                          <FaCheckCircle /> Verified
                        </span>
                      )}
                    </div>
                    {errors.phoneNumber && (
                      <span className="cs-error">{errors.phoneNumber}</span>
                    )}
                  </div>

                  <div className="cs-field">
                    <label className="cs-label">
                      <FaCalendarAlt className="cs-field-icon" />
                      Age <span className="cs-required">*</span>
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      className={`cs-input ${errors.age ? "cs-input-error" : ""}`}
                      placeholder="Your age"
                      min="18"
                      max="100"
                      disabled={isLoading}
                    />
                    {errors.age && (
                      <span className="cs-error">{errors.age}</span>
                    )}
                  </div>

                  <div className="cs-field">
                    <label className="cs-label">
                      <FaVenusMars className="cs-field-icon" />
                      Gender <span className="cs-required">*</span>
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className={`cs-select ${errors.gender ? "cs-input-error" : ""}`}
                      disabled={isLoading}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.gender && (
                      <span className="cs-error">{errors.gender}</span>
                    )}
                  </div>

                  <div className="cs-field">
                    <label className="cs-label">
                      <FaGraduationCap className="cs-field-icon" />
                      Qualification <span className="cs-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleChange}
                      className={`cs-input ${errors.qualification ? "cs-input-error" : ""}`}
                      placeholder="e.g., M.Sc Psychology"
                      disabled={isLoading}
                    />
                    {errors.qualification && (
                      <span className="cs-error">{errors.qualification}</span>
                    )}
                  </div>

                  <div className="cs-field">
                    <label className="cs-label">
                      <FaIdCard className="cs-field-icon" />
                      Specialization <span className="cs-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className={`cs-input ${errors.specialization ? "cs-input-error" : ""}`}
                      placeholder="e.g., Clinical Psychology"
                      disabled={isLoading}
                    />
                    {errors.specialization && (
                      <span className="cs-error">{errors.specialization}</span>
                    )}
                  </div>

                  <div className="cs-field">
                    <label className="cs-label">
                      <FaBriefcase className="cs-field-icon" />
                      Experience (Years) <span className="cs-required">*</span>
                    </label>
                    <input
                      type="number"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      className={`cs-input ${errors.experience ? "cs-input-error" : ""}`}
                      placeholder="Years of experience"
                      min="0"
                      step="0.5"
                      disabled={isLoading}
                    />
                    {errors.experience && (
                      <span className="cs-error">{errors.experience}</span>
                    )}
                  </div>

                  <div className="cs-field">
                    <label className="cs-label">
                      <FaMapMarkerAlt className="cs-field-icon" />
                      Location <span className="cs-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className={`cs-input ${errors.location ? "cs-input-error" : ""}`}
                      placeholder="City, State"
                      disabled={isLoading}
                    />
                    {errors.location && (
                      <span className="cs-error">{errors.location}</span>
                    )}
                  </div>
                </div>

                <div className="cs-field">
                  <label className="cs-label">
                    <FaUsers className="cs-field-icon" />
                    Consultation Mode <span className="cs-required">*</span>
                  </label>
                  <div className="cs-checkbox-group">
                    {consultationModes.map((mode) => (
                      <label key={mode} className="cs-checkbox-label">
                        <input
                          type="checkbox"
                          name="consultationMode"
                          value={mode}
                          checked={formData.consultationMode.includes(mode)}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                        {mode}
                      </label>
                    ))}
                  </div>
                  {errors.consultationMode && (
                    <span className="cs-error">{errors.consultationMode}</span>
                  )}
                </div>

                <div className="cs-field">
                  <label className="cs-label">
                    Languages <span className="cs-required">*</span>
                  </label>
                  <div className="cs-checkbox-group">
                    {languageOptions.map((lang) => (
                      <label key={lang} className="cs-checkbox-label">
                        <input
                          type="checkbox"
                          name="languages"
                          value={lang}
                          checked={formData.languages.includes(lang)}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                        {lang}
                      </label>
                    ))}
                  </div>
                  {errors.languages && (
                    <span className="cs-error">{errors.languages}</span>
                  )}
                </div>

                <div className="cs-field">
                  <label className="cs-label">
                    About Me <span className="cs-required">*</span>
                  </label>
                  <textarea
                    name="aboutMe"
                    value={formData.aboutMe}
                    onChange={handleChange}
                    className={`cs-textarea ${errors.aboutMe ? "cs-input-error" : ""}`}
                    placeholder="Tell us about yourself, your approach, and expertise..."
                    rows="4"
                    disabled={isLoading}
                  />
                  {errors.aboutMe && (
                    <span className="cs-error">{errors.aboutMe}</span>
                  )}
                </div>

                <div className="cs-field">
                  <label className="cs-label">Profile Photo</label>
                  <input
                    type="file"
                    name="profilePhoto"
                    onChange={handleChange}
                    accept="image/*"
                    className="cs-file"
                    disabled={isLoading}
                  />
                </div>

                <div className="cs-field">
                  <label className="cs-label">
                    <FaLock className="cs-field-icon" />
                    Password <span className="cs-required">*</span>
                  </label>
                  <div className="cs-password-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`cs-input ${errors.password ? "cs-input-error" : ""}`}
                      placeholder="Create a password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="cs-password-toggle"
                      disabled={isLoading}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="cs-error">{errors.password}</span>
                  )}
                </div>

                <div className="cs-field">
                  <label className="cs-label">
                    <FaLock className="cs-field-icon" />
                    Confirm Password <span className="cs-required">*</span>
                  </label>
                  <div className="cs-password-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`cs-input ${errors.confirmPassword ? "cs-input-error" : ""}`}
                      placeholder="Confirm your password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="cs-password-toggle"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span className="cs-error">{errors.confirmPassword}</span>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              className={`cs-submit ${isLoading ? "cs-submit-loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="cs-spinner"></span>
                  {isLogin ? "Logging in..." : "Creating Account..."}
                </>
              ) : isLogin ? (
                "Login"
              ) : (
                "Create Account"
              )}
            </button>

            {!isLogin && (
              <p className="cs-terms">
                By signing up, you agree to our{" "}
                <a href="#" className={isLoading ? "cs-disabled" : ""}>
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className={isLoading ? "cs-disabled" : ""}>
                  Privacy Policy
                </a>
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CounselorSignup;
