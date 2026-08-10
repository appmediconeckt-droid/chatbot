import React, { useState } from "react";
import { FaEnvelope, FaArrowLeft, FaSpinner } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ForgotPassword.css";
import { logoHorizontal } from "../assets/brandAssets";
import { API_BASE_URL } from "../axiosConfig";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const requestedRole = String(location.state?.role || "").toLowerCase();
  const role = ["counselor", "counsellor", "counsellour"].includes(requestedRole)
    ? "counsellor"
    : "user";
  const themeClass = role === "counsellor" ? "auth-theme-counselor" : "auth-theme-user";
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/send-forgot-password-otp`,
        { email },
        { withCredentials: true }
      );

      if (response.data.success) {
        setSuccess(true);
        // Navigate to OTP verification page with email
        navigate("/forgot-password-otp", { 
          state: { email, role, from: "forgot-password" }
        });
      } else {
        setError(response.data.message || "Failed to send OTP");
      }
    } catch (error) {
      setError(
        error.response?.data?.message || 
        "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fp-wrapper ${themeClass}`}>
      <div className="fp-container">
        {/* Back Button */}
        {/* <button 
          className="fp-back-btn"
          onClick={() => navigate("/user-signup")}
          aria-label="Go back"
        >
          <FaArrowLeft />
        </button> */}

        {/* Logo */}
        <div className="fp-logo">
          <img src={logoHorizontal} alt="Humaeli" className="fp-logo-img" />
        </div>

        <div className="fp-card">
          <div className="fp-header">
            <div className="fp-icon-wrapper">
              <FaEnvelope className="fp-icon" />
            </div>
            <h2>Forgot Password</h2>
            <p>Enter your registered email to receive a password reset OTP</p>
          </div>

          {error && (
            <div className="fp-error">
              <span className="fp-error-icon">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="fp-form">
            <div className="fp-field">
              <label className="fp-label">
                <FaEnvelope className="fp-field-icon" />
                Email Address <span className="fp-required">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className={`fp-input ${error ? "fp-input-error" : ""}`}
                placeholder="Enter your registered email"
                disabled={isLoading}
                autoFocus
              />
            </div>

            <button
              type="submit"
              className={`fp-submit ${isLoading ? "fp-submit-loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <FaSpinner className="fp-spin" />
                  Sending OTP...
                </>
              ) : (
                "Send Reset OTP"
              )}
            </button>

            <div className="fp-footer">
              <p>
                Remember your password?{" "}
                <button
                  type="button"
                  className="fp-link"
                  onClick={() => navigate(role === "counsellor" ? "/counselor-signup" : "/user-signup")}
                >
                  Back to Login
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
