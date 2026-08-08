import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FaEnvelope, FaSpinner, FaCheckCircle, FaArrowLeft } from "react-icons/fa";
import { API_BASE_URL } from "../axiosConfig";
import "./LoginOtpVerification.css";

const LoginOtpVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loginOtp, setLoginOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(
    () =>
      location.state?.role ||
      localStorage.getItem("userRole") ||
      "user",
  );
  const isCounselor =
    role === "counselor" ||
    role === "counsellor" ||
    role === "counsellour";
  const normalizedEmail = String(email || "").trim().toLowerCase();

  useEffect(() => {
    // Get email from location state or localStorage
    const emailFromState = location.state?.email;
    const emailFromStorage = localStorage.getItem("userEmail");
    const emailToUse = String(emailFromState || emailFromStorage || "")
      .trim()
      .toLowerCase();
    setEmail(emailToUse);

    // Get role from location state or localStorage
    const roleFromState = location.state?.role;
    const roleFromStorage = localStorage.getItem("userRole") || "user";
    const roleToUse = roleFromState || roleFromStorage || "user";
    setRole(roleToUse);

    if (!emailToUse) {
      setError("Email not found. Please try logging in again.");
    }

    // Start timer for resend
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [location.state]);

  const handleVerifyOtp = async () => {
    if (!loginOtp || loginOtp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setIsVerifying(true);
      setError("");

      const response = await axios.post(
        `${API_BASE_URL}/api/auth/verify-login-otp`,
        { email: normalizedEmail, otp: loginOtp },
        { withCredentials: true }
      );

      console.log("OTP Verification Response:", response.data);

      // Check if we have a token in the response
      const token = response.data?.token || response.data?.accessToken;
      
      if (token) {
        // Store all necessary data
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userType", role);
        localStorage.setItem("userRole", role);
        localStorage.setItem("token", token);
        localStorage.setItem("accessToken", token);
        
        if (response.data.refreshToken) {
          localStorage.setItem("refreshToken", response.data.refreshToken);
        }
        
        if (response.data.user) {
          localStorage.setItem("userData", JSON.stringify(response.data.user));
          if (response.data.user._id) {
            localStorage.setItem("userId", response.data.user._id);
            // Store counselor specific IDs if role is counselor
            if (role === "counselor" || role === "counsellor") {
              localStorage.setItem("counsellorId", response.data.user._id);
              localStorage.setItem("counselorId", response.data.user._id);
            }
          }
          if (response.data.user.email) {
            localStorage.setItem("userEmail", response.data.user.email);
          }
        }

        setSuccess(true);
        
        // Show success message for a moment then navigate
        setTimeout(() => {
          console.log("Navigating to dashboard...");
          // Determine dashboard path based on role
          const dashboardPath = role === "counselor" || role === "counsellor" 
            ? "/counselor-dashboard" 
            : "/user-dashboard";
          navigate(dashboardPath, { replace: true });
        }, 1500);
      } else {
        setError("No token received. Please try again.");
      }
    } catch (error) {
      console.error("OTP Verification Error:", error);
      const errorMessage =
        error.response?.data?.message || "OTP verification failed. Please try again.";
      setError(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setIsResending(true);
      setError("");

      // First, logout other devices and send new OTP
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/logout-other-devices`,
        { email: normalizedEmail },
        { withCredentials: true }
      );

      if (response.data?.success) {
        setResendTimer(60);
        // Reset timer
        const timer = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setError(""); // Clear any previous errors
        showNotification("OTP resent successfully!", "success");
      } else {
        setError(response.data?.message || "Failed to resend OTP");
      }
    } catch (error) {
      console.error("Resend OTP Error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to resend OTP. Please try again.";
      setError(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  // Show notification function
  const showNotification = (message, type = "success") => {
    // You can implement this if you want notifications on the OTP page
    // For now, we'll just use the error state
    setError("");
  };

  // Also add a direct navigation on success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        const dashboardPath = role === "counselor" || role === "counsellor" 
          ? "/counselor-dashboard" 
          : "/user-dashboard";
        navigate(dashboardPath, { replace: true });
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [success, navigate, role]);

  return (
    <div className={`us-wrapper ${isCounselor ? "auth-theme-counselor" : "auth-theme-user"}`}>
      <div className="us-otp-page-container">
        <button
          onClick={() => navigate(role === "counselor" || role === "counsellor" ? "/counselor-signup" : "/user-signup")}
          className="us-back-btn"
          aria-label="Go back"
        >
          <FaArrowLeft /> Back
        </button>

        <main className="us-otp-page-card">
          <div className="us-otp-page-header">
            <div className="us-otp-page-icon">
              <FaEnvelope />
            </div>
            <h2>Verify Your Identity</h2>
            <p className="us-otp-page-subtitle">
              We've sent a verification code to your email address
            </p>
          </div>

          <div className="us-otp-page-body">
            <div className="us-otp-page-email">
              <span className="us-email-label">Email:</span>
              <span className="us-email-value" title={email}>{email || "Email unavailable"}</span>
            </div>
            
            <div className="us-otp-page-role">
              <span className="us-role-label">Account Type:</span>
              <span className="us-role-value">{role === "counselor" || role === "counsellor" ? "Counselor" : "User"}</span>
            </div>

            {error && (
              <div className="us-otp-page-error">
                <span className="us-error-icon">⚠️</span>
                {error}
              </div>
            )}

            {success && (
              <div className="us-otp-page-success">
                <FaCheckCircle className="us-success-icon" />
                <span>Login successful! Redirecting to dashboard...</span>
              </div>
            )}

            <div className="us-otp-page-input-wrapper">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="000000"
                aria-label="Enter 6 digit OTP"
                value={loginOtp}
                onChange={(e) =>
                  setLoginOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="us-otp-page-input"
                maxLength={6}
                disabled={isVerifying || success}
                autoComplete="one-time-code"
                autoFocus
              />
              {loginOtp.length === 6 && !success && (
                <span className="us-otp-page-char-count">✓</span>
              )}
            </div>

            <div className="us-otp-page-actions">
              <button
                onClick={handleVerifyOtp}
                className="us-otp-page-verify-btn"
                disabled={isVerifying || success || loginOtp.length !== 6}
              >
                {isVerifying ? (
                  <>
                    <FaSpinner className="us-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify OTP"
                )}
              </button>
            </div>

            <div className="us-otp-page-resend">
              <button
                onClick={handleResendOtp}
                className="us-otp-page-resend-btn"
                disabled={isResending || resendTimer > 0 || success}
              >
                {isResending ? (
                  <>
                    <FaSpinner className="us-spin" />
                    Sending...
                  </>
                ) : resendTimer > 0 ? (
                  `Resend in ${resendTimer}s`
                ) : (
                  "Resend Code"
                )}
              </button>
            </div>

            <div className="us-otp-page-help">
              <p>
                Didn't receive the code? Check your spam folder or{" "}
                <button
                  onClick={handleResendOtp}
                  className="us-otp-page-help-link"
                  disabled={isResending || resendTimer > 0 || success}
                >
                  request a new one
                </button>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LoginOtpVerification;
