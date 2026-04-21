import React, { useState, useEffect } from "react";
import {
  FaEnvelope,
  FaLock,
  FaUser,
  FaPhone,
  FaCalendarAlt,
  FaVenusMars,
  FaCheckCircle,
  FaSpinner,
  FaTimes,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./UserSignup.css";
import logo from "../image/Mediconect Logo-3.png";
import { API_BASE_URL } from "../axiosConfig";

const UserSignup = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    anonymous: "",
    phoneNumber: "",
    age: "",
    gender: "",
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
  const [apiError, setApiError] = useState("");
  const [showVerifyButton, setShowVerifyButton] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [loginOtp, setLoginOtp] = useState("");
  const [otpSentForLogin, setOtpSentForLogin] = useState(false);
  const [isOtpVerifyLoading, setIsOtpVerifyLoading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  useEffect(() => {
    let interval;
    if (emailResendTimer > 0) {
      interval = setInterval(() => {
        setEmailResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [emailResendTimer]);

  useEffect(() => {
    let interval;
    if (phoneResendTimer > 0) {
      interval = setInterval(() => {
        setPhoneResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phoneResendTimer]);

  useEffect(() => {
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (token) {
      navigate("/user-dashboard");
    }
  }, [navigate]);

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
    if (apiError) {
      setApiError("");
    }

    if (name === "email") setEmailVerified(false);
    if (name === "phoneNumber") setPhoneVerified(false);
  };

  const validateLogin = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
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
    if (!formData.anonymous) newErrors.anonymous = "Anonymous name is required";

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    } else if (!emailVerified) {
      newErrors.email = "Please verify your email first";
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Phone number must be 10 digits";
    } else if (!phoneVerified) {
      newErrors.phoneNumber = "Please verify your phone number first";
    }

    if (!formData.age) {
      newErrors.age = "Age is required";
    } else if (formData.age < 13 || formData.age > 120) {
      newErrors.age = "Age must be between 13 and 120";
    }

    if (!formData.gender) newErrors.gender = "Gender is required";

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 3) {
      newErrors.password = "Password must be at least 3 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const handleSendEmailOtp = async () => {
    if (!formData.email) {
      setEmailOtpError("Please enter email first");
      return;
    }

    try {
      setIsSendingEmailOtp(true);
      setEmailOtpError("");

      const response = await axios.post(
        `${API_BASE_URL}/api/auth/send-email-otp`,
        {
          email: formData.email,
        },
      );

      if (response.data.success) {
        setEmailResendTimer(60);
        showNotification("OTP sent to email successfully!", "success");
      } else {
        setEmailOtpError(response.data.message || "Failed to send OTP");
      }
    } catch (error) {
      setEmailOtpError(error.response?.data?.message || "Something went wrong");
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    try {
      setIsVerifyingEmailOtp(true);
      setEmailOtpError("");

      const response = await axios.post(
        `${API_BASE_URL}/api/auth/verify-email-otp`,
        {
          email: formData.email,
          otp: emailOtp,
        },
      );

      if (response.data.success) {
        setEmailOtpSuccess(true);
        setEmailVerified(true);
        showNotification("Email verified successfully!", "success");
        setTimeout(() => {
          setShowEmailOtpModal(false);
          resetEmailOtpState();
        }, 1000);
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
    if (!formData.phoneNumber) {
      setPhoneOtpError("Enter phone number first");
      return;
    }

    try {
      setIsSendingPhoneOtp(true);
      setPhoneOtpError("");

      const response = await axios.post(
        `${API_BASE_URL}/api/auth/send-phone-otp`,
        {
          phoneNumber: `+${formData.phoneNumber}`,
          email: formData.email,
        },
      );

      if (response.data.success) {
        showNotification("OTP sent successfully!", "success");
        setPhoneResendTimer(60);
      } else {
        setPhoneOtpError(response.data.message || "Failed to send OTP");
      }
    } catch (error) {
      setPhoneOtpError(error.response?.data?.message || "Error sending OTP");
    } finally {
      setIsSendingPhoneOtp(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (phoneOtp.length !== 6) {
      setPhoneOtpError("Enter 6 digit OTP");
      return;
    }

    try {
      setIsVerifyingPhoneOtp(true);
      setPhoneOtpError("");

      const response = await axios.post(
        `${API_BASE_URL}/api/auth/verify-phone-otp`,
        {
          phoneNumber: `+${formData.phoneNumber}`,
          otp: phoneOtp,
          email: formData.email,
        },
      );

      if (response.data.success) {
        setPhoneVerified(true);
        setPhoneOtpSuccess(true);
        showNotification("Phone verified successfully!", "success");
        setTimeout(() => {
          setShowPhoneOtpModal(false);
          resetPhoneOtpState();
        }, 1000);
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

  const persistUserSession = (data) => {
    const token =
      data?.token ||
      data?.accessToken ||
      data?.data?.token ||
      data?.data?.accessToken;
    const refreshToken = data?.refreshToken || data?.data?.refreshToken;

    if (!token) return false;

    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("userType", "user");
    localStorage.setItem("userEmail", formData.email);
    localStorage.setItem("token", token);
    localStorage.setItem("accessToken", token);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    if (data?.user) localStorage.setItem("userData", JSON.stringify(data.user));
    if (data?.user?._id) localStorage.setItem("userId", data.user._id);

    return true;
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        {
          email: formData.email,
          password: formData.password,
        },
        { withCredentials: true },
      );

      // Enforce role: only "user" accounts can login here
      const returnedRole = (
        response.data?.role ||
        response.data?.user?.role ||
        "user"
      ).toLowerCase();
      const isCounselor =
        returnedRole === "counselor" || returnedRole === "counsellor";

      if (isCounselor) {
        setApiError(
          "Access denied: Your account is registered as a Counsellor. Please use the Counsellor login page.",
        );
        showNotification(
          "Access denied: Please use the Counsellor login page.",
          "error",
        );
        return;
      }

      if (persistUserSession(response.data)) {
        showNotification("Login successful!", "success");
        setTimeout(() => navigate("/user-dashboard"), 1200);
        return;
      }

      setApiError(response.data?.message || "Login failed");
      showNotification(response.data?.message || "Login failed", "error");
    } catch (error) {
      console.error("Login error:", error);

      if (error.response?.status === 409 && error.response?.data?.needLogout) {
        setShowVerifyButton(true);
        setVerifySuccess(false);
        setOtpSentForLogin(false);
        setLoginOtp("");
        setApiError("");
        showNotification(
          "Already login detected. Continue with email OTP.",
          "info",
        );
        return;
      }

      let errorMessage = "Something went wrong";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = "Invalid email or password";
      } else if (error.request) {
        errorMessage = "Network error. Please check your connection.";
      }
      setApiError(errorMessage);
      showNotification(errorMessage, "error");
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
      const signupData = {
        fullName: formData.fullName,
        email: formData.email,
        anonymous: formData.anonymous,
        phoneNum: formData.phoneNumber,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        age: parseInt(formData.age),
        gender: formData.gender,
        role: "user",
        isEmailVerified: true,
        isPhoneVerified: true,
      };

      console.log("Sending signup data:", signupData);

      const response = await axios.post(
        `${API_BASE_URL}/api/auth/complete-registration`,
        signupData,
      );

      if (
        response.data &&
        (response.data.message?.includes("success") || response.data.success)
      ) {
        const token = response.data?.token || response.data?.accessToken;

        if (token) {
          localStorage.setItem("isAuthenticated", "true");
          localStorage.setItem("userType", "user");
          localStorage.setItem("userEmail", formData.email);
          localStorage.setItem("token", token);
          localStorage.setItem("accessToken", token);
        }

        if (response.data.user?._id) {
          localStorage.setItem("userId", response.data.user._id);
        }

        if (response.data.user) {
          localStorage.setItem("userData", JSON.stringify(response.data.user));
        }

        showNotification("Account created successfully!", "success");

        setTimeout(() => {
          navigate("/user-dashboard");
        }, 1500);
      } else {
        showNotification(
          "Account created successfully! Redirecting to dashboard...",
          "success",
        );
        setTimeout(() => {
          navigate("/user-dashboard");
        }, 1500);
      }
    } catch (error) {
      console.error("Signup error:", error);

      if (error.response) {
        if (error.response.status === 400) {
          if (error.response.data.errors) {
            const serverErrors = {};
            Object.keys(error.response.data.errors).forEach((key) => {
              serverErrors[key] = error.response.data.errors[key][0];
            });
            setErrors(serverErrors);
            showNotification("Please check the form for errors", "error");
          } else if (error.response.data.message) {
            setApiError(error.response.data.message);
            showNotification(error.response.data.message, "error");
          } else {
            setApiError("Registration failed. Please check your information.");
            showNotification(
              "Registration failed. Please check your information.",
              "error",
            );
          }
        } else if (error.response.status === 409) {
          setApiError("User with this email already exists");
          showNotification("User with this email already exists", "error");
        } else {
          setApiError("Registration failed. Please try again.");
          showNotification("Registration failed. Please try again.", "error");
        }
      } else if (error.request) {
        setApiError("Network error. Please check your connection.");
        showNotification(
          "Network error. Please check your connection.",
          "error",
        );
      } else {
        setApiError("An error occurred. Please try again.");
        showNotification("An error occurred. Please try again.", "error");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setApiError("");

    if (isLogin) {
      const loginErrors = validateLogin();
      if (Object.keys(loginErrors).length === 0) {
        await handleLogin();
      } else {
        setErrors(loginErrors);
        showNotification("Please fill in all required fields", "error");
      }
    } else {
      const signupErrors = validateSignup();
      if (Object.keys(signupErrors).length === 0) {
        await handleSignup();
      } else {
        setErrors(signupErrors);
        showNotification(
          "Please fill in all required fields correctly",
          "error",
        );
      }
    }

    setIsLoading(false);
  };

  const handleVerify = async () => {
    try {
      setIsVerifying(true);
      setVerifySuccess(false);
      const verifyResponse = await axios.post(
        `${API_BASE_URL}/api/auth/logout-other-devices`,
        { email: formData.email },
        { withCredentials: true },
      );
      if (verifyResponse.data?.success) {
        setVerifySuccess(true);
        setOtpSentForLogin(true);
        showNotification("OTP sent successfully! Check your email.", "success");
      }
    } catch (error) {
      console.error("Verification error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to send OTP. Please try again.";
      setApiError(errorMessage);
      showNotification(errorMessage, "error");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyLoginOtp = async () => {
    if (!loginOtp || loginOtp.length !== 6) {
      showNotification("Please enter a valid 6-digit OTP", "error");
      return;
    }
    try {
      setIsOtpVerifyLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/verify-login-otp`,
        { email: formData.email, otp: loginOtp },
        { withCredentials: true },
      );

      if (persistUserSession(response.data)) {
        setShowVerifyButton(false);
        setOtpSentForLogin(false);
        setLoginOtp("");
        showNotification("OTP verified! Login successful.", "success");
        setTimeout(() => navigate("/user-dashboard"), 1200);
      } else {
        showNotification(
          response.data?.message || "OTP verification failed",
          "error",
        );
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "OTP verification failed";
      setApiError(errorMessage);
      showNotification(errorMessage, "error");
    } finally {
      setIsOtpVerifyLoading(false);
    }
  };

  const toggleMode = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    setTimeout(() => {
      setIsLogin(!isLogin);
      setErrors({});
      setApiError("");
      setShowVerifyButton(false);
      setVerifySuccess(false);
      setOtpSentForLogin(false);
      setLoginOtp("");
      setEmailVerified(false);
      setPhoneVerified(false);
      setFormData({
        email: "",
        password: "",
        fullName: "",
        anonymous: "",
        phoneNumber: "",
        age: "",
        gender: "",
        confirmPassword: "",
      });
      setNotification({ show: false, message: "", type: "" });
      
      setTimeout(() => {
        setIsAnimating(false);
      }, 500);
    }, 300);
  };

  const EmailOtpModal = () => (
    <div
      className="us-otp-overlay"
      onClick={() => {
        if (!emailOtpSuccess) {
          setShowEmailOtpModal(false);
          resetEmailOtpState();
        }
      }}
    >
      <div className="us-otp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="us-otp-header">
          <div className="us-otp-icon">
            <FaEnvelope />
          </div>
          <h3>Verify Email Address</h3>
          <button
            className="us-otp-close"
            onClick={() => {
              setShowEmailOtpModal(false);
              resetEmailOtpState();
            }}
            disabled={isVerifyingEmailOtp}
          >
            <FaTimes />
          </button>
        </div>
        <div className="us-otp-body">
          <p>Enter the 6-digit code sent to</p>
          <div className="us-otp-recipient">{formData.email}</div>

          <div className="us-otp-input-wrapper">
            <input
              type="text"
              placeholder="000000"
              value={emailOtp}
              onChange={(e) =>
                setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className={`us-otp-input ${emailOtpSuccess ? "us-otp-input-success" : ""}`}
              maxLength="6"
              disabled={isVerifyingEmailOtp || emailOtpSuccess}
              autoFocus
            />
            {emailOtpSuccess && (
              <FaCheckCircle className="us-otp-success-icon" />
            )}
          </div>

          {emailOtpError && <div className="us-otp-error">{emailOtpError}</div>}

          <div className="us-otp-actions">
            <button
              onClick={handleVerifyEmailOtp}
              className="us-otp-verify"
              disabled={isVerifyingEmailOtp || emailOtpSuccess || !emailOtp}
            >
              {isVerifyingEmailOtp ? (
                <FaSpinner className="us-spin" />
              ) : (
                "Verify"
              )}
            </button>
            <button
              onClick={handleSendEmailOtp}
              className="us-otp-resend"
              disabled={
                isSendingEmailOtp || emailResendTimer > 0 || emailOtpSuccess
              }
            >
              {isSendingEmailOtp ? (
                <>
                  <FaSpinner className="us-spin" /> Sending
                </>
              ) : emailResendTimer > 0 ? (
                `Resend in ${emailResendTimer}s`
              ) : (
                "Resend Code"
              )}
            </button>
          </div>

          {emailOtpSuccess && (
            <div className="us-otp-success">
              <FaCheckCircle /> Email verified successfully!
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const PhoneOtpModal = () => (
    <div
      className="us-otp-overlay"
      onClick={() => {
        if (!phoneOtpSuccess) {
          setShowPhoneOtpModal(false);
          resetPhoneOtpState();
        }
      }}
    >
      <div
        className="us-otp-modal us-otp-modal-phone"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="us-otp-header">
          <div className="us-otp-icon">
            <FaPhone />
          </div>
          <h3>Verify Phone Number</h3>
          <button
            className="us-otp-close"
            onClick={() => {
              setShowPhoneOtpModal(false);
              resetPhoneOtpState();
            }}
            disabled={isVerifyingPhoneOtp}
          >
            <FaTimes />
          </button>
        </div>
        <div className="us-otp-body">
          <p>Enter the 6-digit code sent to</p>
          <div className="us-otp-recipient">{formData.phoneNumber}</div>

          <div className="us-otp-input-wrapper">
            <input
              type="text"
              placeholder="000000"
              value={phoneOtp}
              onChange={(e) =>
                setPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className={`us-otp-input ${phoneOtpSuccess ? "us-otp-input-success" : ""}`}
              maxLength="6"
              disabled={isVerifyingPhoneOtp || phoneOtpSuccess}
              autoFocus
            />
            {phoneOtpSuccess && (
              <FaCheckCircle className="us-otp-success-icon" />
            )}
          </div>

          {phoneOtpError && <div className="us-otp-error">{phoneOtpError}</div>}

          <div className="us-otp-actions">
            <button
              onClick={handleVerifyPhoneOtp}
              className="us-otp-verify"
              disabled={isVerifyingPhoneOtp || phoneOtpSuccess || !phoneOtp}
            >
              {isVerifyingPhoneOtp ? (
                <FaSpinner className="us-spin" />
              ) : (
                "Verify"
              )}
            </button>
            <button
              onClick={handleSendPhoneOtp}
              className="us-otp-resend"
              disabled={
                isSendingPhoneOtp || phoneResendTimer > 0 || phoneOtpSuccess
              }
            >
              {isSendingPhoneOtp ? (
                <>
                  <FaSpinner className="us-spin" /> Sending
                </>
              ) : phoneResendTimer > 0 ? (
                `Resend in ${phoneResendTimer}s`
              ) : (
                "Resend Code"
              )}
            </button>
          </div>

          {phoneOtpSuccess && (
            <div className="us-otp-success">
              <FaCheckCircle /> Phone verified successfully!
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="us-wrapper">
      {notification.show && (
        <div className={`us-notification us-notification-${notification.type}`}>
          <div className="us-notification-content">
            <span className="us-notification-icon">
              {notification.type === "success" && "✓"}
              {notification.type === "error" && "⚠️"}
              {notification.type === "info" && "ℹ️"}
            </span>
            <span className="us-notification-message">
              {notification.message}
            </span>
          </div>
        </div>
      )}

      {showEmailOtpModal && <EmailOtpModal />}
      {showPhoneOtpModal && <PhoneOtpModal />}

      <div className={`us-container ${isLogin ? "us-login-layout" : "us-signup-layout"}`}>
        <div className="us-brand">
          <div className="us-brand-content">
            <div className="us-logo">
              <img
                src={logo}
                alt="Mediconeckt ChatBot Logo"
                className="us-logo-img"
              />
              <span className="us-logo-text">Mediconeckt ChatBot</span>
            </div>
            <h1 className="us-brand-title">
              {isLogin ? "Welcome Back!" : "Begin Your Journey"}
            </h1>
            <p className="us-brand-subtitle">
              {isLogin
                ? "Connect with professional counselors and start your healing journey."
                : "Join thousands of people who have found peace and clarity."}
            </p>
            <div className="us-features">
              <div className="us-feature">✓ 24/7 Confidential Support</div>
              <div className="us-feature">
                ✓ Expert Mental Health Professionals
              </div>
              <div className="us-feature">✓ Safe & Anonymous Sessions</div>
            </div>
          </div>
        </div>

        <div className="us-form-section">
          <div className="us-form-header">
            <h2>{isLogin ? "Login to Account" : "Create Account"}</h2>
            <p>
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                onClick={toggleMode}
                className="us-toggle"
                disabled={isLoading || isAnimating}
              >
                {isLogin ? "Sign Up" : "Login"}
              </button>
            </p>
          </div>

          {apiError && (
            <div className="us-api-error">
              <span className="us-error-icon">⚠️</span>
              {apiError}
            </div>
          )}

          {showVerifyButton && (
            <div className="us-verify-section">
              {verifySuccess ? (
                <div className="us-verify-success">
                  <span className="us-verify-icon">✓</span>
                  <p>OTP sent successfully! Check your email inbox.</p>
                </div>
              ) : (
                <>
                  <p className="us-verify-message">
                    Your account is already logged in on another device.
                  </p>
                  <button
                    onClick={handleVerify}
                    className="us-verify-btn"
                    disabled={isVerifying || isLoading}
                  >
                    {isVerifying ? (
                      <>
                        <span className="us-spinner-small"></span>
                        Sending OTP...
                      </>
                    ) : (
                      "📧 Logout Other Devices & Send OTP"
                    )}
                  </button>
                </>
              )}

              {otpSentForLogin && (
                <div className="us-login-otp-row">
                  <input
                    type="text"
                    value={loginOtp}
                    onChange={(e) =>
                      setLoginOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="us-input"
                    placeholder="Enter 6-digit OTP"
                    maxLength="6"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyLoginOtp}
                    className="us-verify-btn"
                    disabled={isOtpVerifyLoading}
                  >
                    {isOtpVerifyLoading ? (
                      <>
                        <span className="us-spinner-small"></span>
                        Verifying...
                      </>
                    ) : (
                      "Verify OTP"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="us-form">
            {isLogin ? (
              <>
                <div className="us-field">
                  <label className="us-label">
                    <FaEnvelope className="us-field-icon" />
                    Email Address <span className="us-required">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`us-input ${errors.email ? "us-input-error" : ""}`}
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <span className="us-error">{errors.email}</span>
                  )}
                </div>

                <div className="us-field">
                  <label className="us-label">
                    <FaLock className="us-field-icon" />
                    Password <span className="us-required">*</span>
                  </label>
                  <div className="us-password-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`us-input ${errors.password ? "us-input-error" : ""}`}
                      placeholder="Enter your password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="us-password-toggle"
                      disabled={isLoading}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="us-error">{errors.password}</span>
                  )}
                </div>

                <div className="us-options">
                  <label className="us-checkbox">
                    <input type="checkbox" disabled={isLoading} /> Remember me
                  </label>
                  <button
                    type="button"
                    className="us-forgot"
                    disabled={isLoading}
                    onClick={() => {
                      void handleForgotPassword();
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="us-grid">
                  <div className="us-field">
                    <label className="us-label">
                      <FaUser className="us-field-icon" />
                      Full Name <span className="us-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`us-input ${errors.fullName ? "us-input-error" : ""}`}
                      placeholder="Enter your full name"
                      disabled={isLoading}
                    />
                    {errors.fullName && (
                      <span className="us-error">{errors.fullName}</span>
                    )}
                  </div>

                  <div className="us-field">
                    <label className="us-label">
                      <FaUser className="us-field-icon" />
                      Anonymous Name <span className="us-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="anonymous"
                      value={formData.anonymous}
                      onChange={handleChange}
                      className={`us-input ${errors.anonymous ? "us-input-error" : ""}`}
                      placeholder="Choose an anonymous name"
                      disabled={isLoading}
                    />
                    {errors.anonymous && (
                      <span className="us-error">{errors.anonymous}</span>
                    )}
                  </div>

                  <div className="us-field">
                    <label className="us-label">
                      <FaEnvelope className="us-field-icon" />
                      Email <span className="us-required">*</span>
                    </label>
                    <div className="us-verify-group">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`us-input ${errors.email ? "us-input-error" : ""} ${emailVerified ? "us-verified-input" : ""}`}
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
                            className="us-verify-btn-sm"
                            disabled={isLoading}
                          >
                            Verify
                          </button>
                        )}
                      {emailVerified && (
                        <span className="us-verified-badge">
                          <FaCheckCircle /> Verified
                        </span>
                      )}
                    </div>
                    {errors.email && (
                      <span className="us-error">{errors.email}</span>
                    )}
                  </div>

                  <div className="us-field">
                    <label className="us-label">
                      <FaPhone className="us-field-icon" />
                      Phone Number <span className="us-required">*</span>
                    </label>
                    <div className="us-verify-group">
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className={`us-input ${errors.phoneNumber ? "us-input-error" : ""} ${phoneVerified ? "us-verified-input" : ""}`}
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
                            className="us-verify-btn-sm"
                            disabled={isLoading}
                          >
                            Verify
                          </button>
                        )}
                      {phoneVerified && (
                        <span className="us-verified-badge">
                          <FaCheckCircle /> Verified
                        </span>
                      )}
                    </div>
                    {errors.phoneNumber && (
                      <span className="us-error">{errors.phoneNumber}</span>
                    )}
                  </div>

                  <div className="us-field">
                    <label className="us-label">
                      <FaCalendarAlt className="us-field-icon" />
                      Age <span className="us-required">*</span>
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      className={`us-input ${errors.age ? "us-input-error" : ""}`}
                      placeholder="Your age"
                      min="13"
                      max="120"
                      disabled={isLoading}
                    />
                    {errors.age && (
                      <span className="us-error">{errors.age}</span>
                    )}
                  </div>

                  <div className="us-field">
                    <label className="us-label">
                      <FaVenusMars className="us-field-icon" />
                      Gender <span className="us-required">*</span>
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className={`us-select ${errors.gender ? "us-input-error" : ""}`}
                      disabled={isLoading}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">
                        Prefer not to say
                      </option>
                    </select>
                    {errors.gender && (
                      <span className="us-error">{errors.gender}</span>
                    )}
                  </div>
                </div>

                <div className="us-field">
                  <label className="us-label">
                    <FaLock className="us-field-icon" />
                    Password <span className="us-required">*</span>
                  </label>
                  <div className="us-password-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`us-input ${errors.password ? "us-input-error" : ""}`}
                      placeholder="Create a password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="us-password-toggle"
                      disabled={isLoading}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="us-error">{errors.password}</span>
                  )}
                </div>

                <div className="us-field">
                  <label className="us-label">
                    <FaLock className="us-field-icon" />
                    Confirm Password <span className="us-required">*</span>
                  </label>
                  <div className="us-password-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`us-input ${errors.confirmPassword ? "us-input-error" : ""}`}
                      placeholder="Confirm your password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="us-password-toggle"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span className="us-error">{errors.confirmPassword}</span>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              className={`us-submit ${isLoading ? "us-submit-loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="us-spinner"></span>
                  {isLogin ? "Logging in..." : "Creating Account..."}
                </>
              ) : isLogin ? (
                "Login"
              ) : (
                "Create Account"
              )}
            </button>

            {!isLogin && (
              <p className="us-terms">
                By signing up, you agree to our{" "}
                <a href="#" className={isLoading ? "us-disabled" : ""}>
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className={isLoading ? "us-disabled" : ""}>
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

export default UserSignup;