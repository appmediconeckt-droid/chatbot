import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../axiosConfig";
import "./PasswordChangePage.css";

const initialForm = {
  otp: "",
  password: "",
  confirmPassword: "",
  oldPassword: "",
  newPassword: "",
  confirmNewPassword: "",
};

const PasswordChangePage = ({ email, hasPassword, onPasswordUpdated }) => {
  const [mode, setMode] = useState(hasPassword ? "change" : "set");
  const [form, setForm] = useState(initialForm);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [redirectCountdown, setRedirectCountdown] = useState(0);

  useEffect(() => {
    if (typeof hasPassword === "boolean") {
      setMode(hasPassword ? "change" : "set");
    }
  }, [hasPassword]);

  // Countdown effect for redirect
  useEffect(() => {
    if (redirectCountdown <= 0) return;

    const timer = setTimeout(() => {
      setRedirectCountdown(redirectCountdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [redirectCountdown]);

  const authHeaders = () => {
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const normalizedEmail = useMemo(
    () => String(email || "").trim().toLowerCase(),
    [email],
  );

  const clearStatus = () => {
    setMessage("");
    setError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "otp" ? value.replace(/\D/g, "") : value,
    }));
  };

  const passwordIsValid = (value) => String(value || "").length >= 6;

  const handleSendOtp = async () => {
    clearStatus();
    if (!normalizedEmail) {
      setError("Email is required before setting a password.");
      return;
    }

    setLoading(true);
    try {
      console.log('📧 Sending OTP to:', normalizedEmail);
      const response = await axios.post(`${API_BASE_URL}/api/auth/generateOtp`, {
        email: normalizedEmail,
      });
      console.log('✅ OTP Response:', response.data);
      if (response.data?.success) {
        setOtpSent(true);
        setMessage(response.data.message || "OTP sent to your email. Check your inbox (and spam folder).");
      } else {
        throw new Error(response.data?.message || "Failed to send OTP.");
      }
    } catch (err) {
      console.error('❌ OTP Error Details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        fullResponse: err.response
      });

      const errorMsg = err.response?.data?.message || err.message || "Failed to send OTP.";
      const statusCode = err.response?.status;

      if (statusCode === 500) {
        const details = err.response?.data?.error || err.response?.data?.details || '';
        setError(`Server error (500): ${errorMsg}${details ? ` - ${details}` : ''}. Please check backend logs or contact support.`);
      } else if (statusCode === 400) {
        setError(`Invalid request: ${errorMsg}`);
      } else if (statusCode === 404) {
        setError(`Email not found: ${errorMsg}`);
      } else if (statusCode === 401) {
        setError(`Unauthorized: ${errorMsg}`);
      } else {
        setError(errorMsg || "An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (event) => {
    event.preventDefault();
    clearStatus();

    if (!passwordIsValid(form.password)) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!form.otp || form.otp.length !== 6) {
      setError("Enter the 6-digit OTP sent to your email.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/set-password-by-otp`,
        {
          email: normalizedEmail,
          otp: form.otp,
          password: form.password,
        },
      );

      if (response.data?.success) {
        setMessage("✅ Password set successfully! Redirecting in 2 seconds...");
        setForm(initialForm);
        setOtpSent(false);
        setRedirectCountdown(2);
        onPasswordUpdated?.({ hasPassword: true, requiresLogin: true });
      } else {
        throw new Error(response.data?.message || "Failed to set password.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to set password.";
      setError(msg);
      if (/already has a password|password already set/i.test(msg)) {
        setMode("change");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    clearStatus();

    if (!form.oldPassword) {
      setError("Enter your current password.");
      return;
    }
    if (!passwordIsValid(form.newPassword)) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (form.newPassword !== form.confirmNewPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Changing password...');
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/changePassword`,
        {
          oldPassword: form.oldPassword,
          newPassword: form.newPassword,
        },
        { headers: authHeaders() },
      );

      console.log('✅ Password change response:', response.data);
      if (response.data?.success) {
        setMessage("✅ Password changed successfully! Redirecting in 2 seconds...");
        setForm(initialForm);
        setRedirectCountdown(2);
        onPasswordUpdated?.({ hasPassword: true, requiresLogin: true });
      } else {
        throw new Error(response.data?.message || "Failed to change password.");
      }
    } catch (err) {
      console.error('❌ Password change error:', err.response?.data || err.message);
      const statusCode = err.response?.status;
      const msg = err.response?.data?.message || err.message || "Failed to change password.";

      if (statusCode === 500) {
        setError(`Server error (500): ${msg}. Please contact support.`);
      } else if (statusCode === 401) {
        setError('Incorrect current password. Please try again.');
      } else if (statusCode === 400) {
        setError(`Invalid request: ${msg}`);
      } else {
        setError(msg);
      }

      if (/no password set/i.test(msg)) {
        setMode("set");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="password-security-panel">
      <div className="password-security-panel__header">
        <div>
          <h2>Password Security</h2>
          <p>
            {mode === "set"
              ? "Add or reset your password using email OTP."
              : "Change your account password."}
          </p>
        </div>
        <div className="password-security-panel__switch">
          <button
            type="button"
            className={mode === "set" ? "active" : ""}
            onClick={() => {
              setMode("set");
              clearStatus();
            }}
          >
            Add
          </button>
          <button
            type="button"
            className={mode === "change" ? "active" : ""}
            onClick={() => {
              setMode("change");
              clearStatus();
            }}
          >
            Change
          </button>
        </div>
      </div>

      {mode === "set" ? (
        <form className="password-security-panel__form" onSubmit={handleSetPassword}>
          <div className="password-security-panel__otp-row">
            <input type="email" value={normalizedEmail} readOnly />
            <button type="button" onClick={handleSendOtp} disabled={loading || !normalizedEmail}>
              {otpSent ? "Resend OTP" : "Send OTP"}
            </button>
          </div>
          {otpSent && (
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              name="otp"
              value={form.otp}
              onChange={handleChange}
              placeholder="Enter 6-digit OTP"
            />
          )}
          <div className="password-security-panel__grid">
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="New password"
              autoComplete="new-password"
            />
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="password-security-panel__primary" disabled={loading}>
            {loading ? "Saving..." : "Save Password"}
          </button>
        </form>
      ) : (
        <form className="password-security-panel__form" onSubmit={handleChangePassword}>
          <input
            type="password"
            name="oldPassword"
            value={form.oldPassword}
            onChange={handleChange}
            placeholder="Current password"
            autoComplete="current-password"
          />
          <div className="password-security-panel__grid">
            <input
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              placeholder="New password"
              autoComplete="new-password"
            />
            <input
              type="password"
              name="confirmNewPassword"
              value={form.confirmNewPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="password-security-panel__primary" disabled={loading}>
            {loading ? "Updating..." : "Change Password"}
          </button>
        </form>
      )}

      {message && <div className="password-security-panel__message">{message}</div>}
      {error && <div className="password-security-panel__error">{error}</div>}
    </section>
  );
};

export default PasswordChangePage;
