import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";
import logo from "../image/Mediconect Logo-3.png";
import { API_BASE_URL } from "../axiosConfig";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [showConflictModal, setShowConflictModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const validateEmail = () => {
    if (!email) {
      setErrorMessage("Please enter your email");
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrorMessage("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateEmail()) return;
    if (!password) {
      setErrorMessage("Please enter your password");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        { email, password },
        { withCredentials: true },
      );

      // FIRST: Get the role from response
      const userRole =
        response.data?.role || response.data?.user?.role || "user";
      const normalizedUserRole = userRole.toLowerCase();
      const isCounselor =
        normalizedUserRole === "counselor" ||
        normalizedUserRole === "counsellor";

      // SECOND: Read the role the user selected in RoleSelector.
      // RoleSelector saves the key as "role" with value "user" or "counsellor".
      const selectedRole = localStorage.getItem("role"); // "user" | "counsellor" | null
      const selectedAsCounselor =
        selectedRole === "counselor" || selectedRole === "counsellor";

      // THIRD: Validate — if a role was explicitly selected, enforce it.
      if (selectedRole) {
        if (selectedAsCounselor && !isCounselor) {
          setErrorMessage(
            "Access denied: You selected the Counsellor login but your account is registered as a User. Please go back and select the correct role.",
          );
          setIsLoading(false);
          return;
        }

        if (!selectedAsCounselor && isCounselor) {
          setErrorMessage(
            "Access denied: You selected the User login but your account is registered as a Counsellor. Please go back and select the correct role.",
          );
          setIsLoading(false);
          return;
        }
      }

      // ONLY NOW store the role and proceed with successful login
      localStorage.setItem("userRole", userRole);
      // Clear the temporary selectedRole flag after successful login
      localStorage.removeItem("role");

      if (rememberMe) {
        localStorage.setItem("rememberedUserId", email);
      } else {
        localStorage.removeItem("rememberedUserId");
      }

      setSuccessMessage("Login successful! Redirecting...");
      setTimeout(() => {
        if (isCounselor) {
          navigate("/counselor-dashboard");
        } else {
          navigate("/user-dashboard");
        }
      }, 1200);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Please check your credentials and try again.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutOtherDevices = async () => {
    setLogoutLoading(true);
    setErrorMessage("");

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/logout-other-devices`,
        { email },
        { withCredentials: true },
      );

      if (response.data?.success) {
        setOtpSent(true);
        setSuccessMessage("OTP sent to your email.");
      } else {
        setErrorMessage(response.data?.message || "Failed to send OTP");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to send OTP";
      setErrorMessage(msg);
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setErrorMessage("Please enter a valid 6-digit OTP");
      return;
    }

    setOtpLoading(true);
    setErrorMessage("");

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/verify-login-otp`,
        { email, otp },
        { withCredentials: true },
      );

      if (response.data?.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
      }
      if (response.data?.refreshToken) {
        localStorage.setItem("refreshToken", response.data.refreshToken);
      }

      setShowConflictModal(false);
      setSuccessMessage("OTP verified! Redirecting...");
      setTimeout(() => navigate("/user-dashboard"), 1200);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "OTP verification failed";
      setErrorMessage(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && email && password) {
      handleLogin();
    }
  };

  useEffect(() => {
    const rememberedUserId = localStorage.getItem("rememberedUserId");
    if (rememberedUserId) {
      setEmail(rememberedUserId);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-card-wrapper">
          <div className="auth-header-section">
            <div className="app-logo-circle">
              <img src={logo} alt="Mediconect Logo" />
            </div>
            <h1 className="app-title-text">Welcome Back</h1>
            <p className="app-subtitle-text">
              Login with your email and password
            </p>
          </div>

          <div className="login-form-container">
            <div className="login-form">
              <div className="input-field-group">
                <label htmlFor="email" className="input-label-text">
                  Email
                </label>
                <div className="input-wrapper">
                  <i className="fas fa-user input-icon"></i>
                  <input
                    type="email"
                    id="email"
                    className="login-input"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage("");
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter your email"
                    autoFocus
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="input-field-group">
                <label htmlFor="password" className="input-label-text">
                  Password
                </label>
                <div className="input-wrapper">
                  <i className="fas fa-lock input-icon"></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="login-input"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage("");
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    <i
                      className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                    ></i>
                  </button>
                </div>
              </div>

              <div className="login-options">
                <label className="remember-me-checkbox">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkbox-text">Remember me</span>
                </label>
                <a
                  href="#"
                  className="forgot-password-link"
                  onClick={(e) => e.preventDefault()}
                >
                  Forgot Password?
                </a>
              </div>

              <button
                className="login-button"
                onClick={handleLogin}
                disabled={isLoading || !email || !password}
              >
                {isLoading ? (
                  <span className="button-loading-spinner">
                    <i className="fas fa-spinner fa-spin"></i> Logging in...
                  </span>
                ) : (
                  "Login"
                )}
              </button>
            </div>

            {errorMessage && (
              <div className="error-message-box">
                <i className="fas fa-exclamation-circle error-icon"></i>
                <span className="error-message-text">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="success-message-box">
                <i className="fas fa-check-circle success-icon"></i>
                <span className="success-message-text">{successMessage}</span>
              </div>
            )}

            {showConflictModal && (
              <div className="conflict-modal-overlay">
                <div className="conflict-modal">
                  <h3 className="conflict-title">Session Conflict Detected</h3>
                  <p className="conflict-text">
                    You are already logged in on another device.
                  </p>
                  <button
                    className="conflict-action-button"
                    onClick={handleLogoutOtherDevices}
                    disabled={logoutLoading}
                  >
                    {logoutLoading ? (
                      <span>
                        <i className="fas fa-spinner fa-spin"></i> Sending
                        OTP...
                      </span>
                    ) : (
                      "Logout Other Devices & Send OTP"
                    )}
                  </button>

                  {otpSent && (
                    <div className="otp-section">
                      <label htmlFor="otp-input" className="otp-label">
                        Enter OTP:
                      </label>
                      <input
                        id="otp-input"
                        type="text"
                        className="otp-input"
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        placeholder="6-digit code"
                        maxLength="6"
                      />
                      <button
                        className="otp-verify-button"
                        onClick={handleVerifyOtp}
                        disabled={otpLoading}
                      >
                        {otpLoading ? (
                          <span>
                            <i className="fas fa-spinner fa-spin"></i>{" "}
                            Verifying...
                          </span>
                        ) : (
                          "Verify OTP"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="login-footer">
            Don't have an account?
            <Link to="/role-selector" className="create-account-link">
              <span className="create-account-text"> Sign Up</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
