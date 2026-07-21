import React, { useState, useEffect } from "react";
import { 
  FaLock, 
  FaArrowLeft, 
  FaSpinner, 
  FaCheckCircle,
  FaEye,
  FaEyeSlash
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./ResetPassword.css";
import logo from "../image/Mediconect Logo-3.png";
import { API_BASE_URL } from "../axiosConfig";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const role = location.state?.role === "counsellor" ? "counsellor" : "user";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password", { state: { role } });
    }
  }, [email, navigate, role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newPassword) {
      setError("Please enter a new password");
      return;
    }
    if (newPassword.length < 3) {
      setError("Password must be at least 3 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const response = await axios.post(
        `${API_BASE_URL}/api/auth/reset-password`,
        {
          email,
          newPassword,
          confirmPassword,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setSuccess(true);
        // Navigate to login after success
        setTimeout(() => {
          navigate(role === "counsellor" ? "/counselor-signup" : "/user-signup", {
            state: { message: "Password reset successfully! Please login." } 
          });
        }, 2000);
      } else {
        setError(response.data.message || "Failed to reset password");
      }
    } catch (error) {
      setError(
        error.response?.data?.message || 
        "Failed to reset password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rp-wrapper">
      <div className="rp-container">
        {/* Back Button */}
        <button 
          className="rp-back-btn"
          onClick={() => navigate("/forgot-password-otp", { state: { email, role } })}
          aria-label="Go back"
        >
          <FaArrowLeft />
        </button>

        {/* Logo */}
        <div className="rp-logo">
          <img src={logo} alt="Mediconeckt" className="rp-logo-img" />
          <span className="rp-logo-text">Mediconeckt ChatBot</span>
        </div>

        <div className="rp-card">
          <div className="rp-header">
            <div className="rp-icon-wrapper">
              <FaLock className="rp-icon" />
            </div>
            <h2>Reset Password</h2>
            <p>Create a new password for your account</p>
            <div className="rp-email-display">{email}</div>
          </div>

          {error && (
            <div className="rp-error">
              <span className="rp-error-icon">⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div className="rp-success">
              <FaCheckCircle />
              <span>Password reset successfully! Redirecting to login...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="rp-form">
            <div className="rp-field">
              <label className="rp-label">
                <FaLock className="rp-field-icon" />
                New Password <span className="rp-required">*</span>
              </label>
              <div className="rp-password-wrapper">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError("");
                  }}
                  className={`rp-input ${error ? "rp-input-error" : ""}`}
                  placeholder="Enter new password"
                  disabled={isLoading || success}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="rp-password-toggle"
                  disabled={isLoading || success}
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="rp-field">
              <label className="rp-label">
                <FaLock className="rp-field-icon" />
                Confirm Password <span className="rp-required">*</span>
              </label>
              <div className="rp-password-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  className={`rp-input ${error ? "rp-input-error" : ""}`}
                  placeholder="Confirm new password"
                  disabled={isLoading || success}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="rp-password-toggle"
                  disabled={isLoading || success}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`rp-submit ${isLoading ? "rp-submit-loading" : ""}`}
              disabled={isLoading || success}
            >
              {isLoading ? (
                <>
                  <FaSpinner className="rp-spin" />
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </button>

            <div className="rp-footer">
              <p>
                Remember your password?{" "}
                <button
                  type="button"
                  className="rp-link"
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

export default ResetPassword;
