import React, { useState, useEffect } from "react";
import { FaCheckCircle, FaSpinner, FaArrowLeft, FaEnvelope } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./ForgotPasswordOTP.css";
import logo from "../image/Mediconect Logo-3.png";
import { API_BASE_URL } from "../axiosConfig";

const ForgotPasswordOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
      return;
    }

    // Start resend timer
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
  }, [email, navigate]);

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const response = await axios.post(
        `${API_BASE_URL}/api/auth/verify-forgot-password-otp`,
        { email, otp },
        { withCredentials: true }
      );

      if (response.data.success) {
        setSuccess(true);
        // Navigate to reset password page
        setTimeout(() => {
          navigate("/reset-password", { 
            state: { email, from: "otp-verified" } 
          });
        }, 1500);
      } else {
        setError(response.data.message || "Invalid OTP");
      }
    } catch (error) {
      setError(
        error.response?.data?.message || 
        "Verification failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setIsResending(true);
      setError("");
      setResendTimer(60);

      const response = await axios.post(
        `${API_BASE_URL}/api/auth/send-forgot-password-otp`,
        { email },
        { withCredentials: true }
      );

      if (response.data.success) {
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
      } else {
        setError(response.data.message || "Failed to resend OTP");
      }
    } catch (error) {
      setError(
        error.response?.data?.message || 
        "Failed to resend OTP. Please try again."
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && otp.length === 6) {
      handleVerify();
    }
  };

  return (
    <div className="fpotp-wrapper">
      <div className="fpotp-container">
        {/* Back Button */}
        <button 
          className="fpotp-back-btn"
          onClick={() => navigate("/forgot-password")}
          aria-label="Go back"
        >
          <FaArrowLeft />
        </button>

        {/* Logo */}
        <div className="fpotp-logo">
          <img src={logo} alt="Mediconeckt" className="fpotp-logo-img" />
          <span className="fpotp-logo-text">Mediconeckt ChatBot</span>
        </div>

        <div className="fpotp-card">
          <div className="fpotp-header">
            <div className="fpotp-icon-wrapper">
              <FaEnvelope className="fpotp-icon" />
            </div>
            <h2>Verify OTP</h2>
            <p>Enter the 6-digit code sent to</p>
            <div className="fpotp-email-display">{email}</div>
          </div>

          {error && (
            <div className="fpotp-error">
              <span className="fpotp-error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="fpotp-form">
            <div className="fpotp-otp-field">
              <label className="fpotp-label">
                OTP Code <span className="fpotp-required">*</span>
              </label>
              <div className="fpotp-otp-input-wrapper">
                <input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setOtp(value);
                    setError("");
                  }}
                  onKeyPress={handleKeyPress}
                  className={`fpotp-otp-input ${error ? "fpotp-input-error" : ""} ${success ? "fpotp-otp-input-success" : ""}`}
                  maxLength="6"
                  disabled={isLoading || success}
                  autoFocus
                />
                {success && (
                  <FaCheckCircle className="fpotp-success-icon" />
                )}
              </div>
            </div>

            <div className="fpotp-actions">
              <button
                onClick={handleVerify}
                className={`fpotp-verify-btn ${isLoading ? "fpotp-btn-loading" : ""}`}
                disabled={isLoading || success || !otp}
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="fpotp-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify OTP"
                )}
              </button>

              <button
                onClick={handleResend}
                className="fpotp-resend-btn"
                disabled={isResending || resendTimer > 0 || success}
              >
                {isResending ? (
                  <>
                    <FaSpinner className="fpotp-spin" />
                    Sending...
                  </>
                ) : resendTimer > 0 ? (
                  `Resend in ${resendTimer}s`
                ) : (
                  "Resend OTP"
                )}
              </button>
            </div>

            {success && (
              <div className="fpotp-success">
                <FaCheckCircle />
                <span>OTP verified successfully! Redirecting...</span>
              </div>
            )}

            <div className="fpotp-footer">
              <p>
                Wrong email?{" "}
                <button
                  type="button"
                  className="fpotp-link"
                  onClick={() => navigate("/forgot-password")}
                >
                  Go back
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordOTP;