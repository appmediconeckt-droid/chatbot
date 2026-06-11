import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../axiosConfig";
import "./PasswordChangePage.css";
import { useUserTranslation, useCounselorTranslation } from "../../i18n/LanguageContext";

const initialForm = {
  otp: "",
  password: "",
  confirmPassword: "",
  oldPassword: "",
  newPassword: "",
  confirmNewPassword: "",
};

const PasswordChangePage = ({ email, hasPassword, onPasswordUpdated, role = "user" }) => {
  const isCounselor = role === "counsellor" || role === "counselor";
  const userT = useUserTranslation();
  const counselorT = useCounselorTranslation();
  const { t } = isCounselor ? counselorT : userT;

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
      setError(t('email_required_password'));
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
        setMessage(response.data.message || t('otp_sent_check_email'));
      } else {
        throw new Error(response.data?.message || t('otp_send_failed'));
      }
    } catch (err) {
      console.error('❌ OTP Error Details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        fullResponse: err.response
      });

      const errorMsg = err.response?.data?.message || err.message || t('otp_send_failed');
      const statusCode = err.response?.status;

      if (statusCode === 500) {
        const details = err.response?.data?.error || err.response?.data?.details || '';
        setError(`${t('server_error')}: ${errorMsg}${details ? ` - ${details}` : ''}. ${t('contact_support')}`);
      } else if (statusCode === 400) {
        setError(`${t('invalid_request')}: ${errorMsg}`);
      } else if (statusCode === 404) {
        setError(`${t('email_not_found')}: ${errorMsg}`);
      } else if (statusCode === 401) {
        setError(`${t('unauthorized')}: ${errorMsg}`);
      } else {
        setError(errorMsg || t('error_try_again'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (event) => {
    event.preventDefault();
    clearStatus();

    if (!passwordIsValid(form.password)) {
      setError(t('password_min_6_chars'));
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(t('passwords_do_not_match'));
      return;
    }
    if (!form.otp || form.otp.length !== 6) {
      setError(t('enter_6_digit_otp'));
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
        setMessage(`✅ ${t('password_set_success')} ${t('redirecting_in')} 2 ${t('seconds')}`);
        setForm(initialForm);
        setOtpSent(false);
        setRedirectCountdown(2);
        onPasswordUpdated?.({ hasPassword: true, requiresLogin: true });
      } else {
        throw new Error(response.data?.message || t('password_set_failed'));
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || t('password_set_failed');
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
      setError(t('enter_current_password'));
      return;
    }
    if (!passwordIsValid(form.newPassword)) {
      setError(t('new_password_min_6_chars'));
      return;
    }
    if (form.newPassword !== form.confirmNewPassword) {
      setError(t('new_passwords_do_not_match'));
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
        setMessage(`✅ ${t('password_changed_success')} ${t('redirecting_in')} 2 ${t('seconds')}`);
        setForm(initialForm);
        setRedirectCountdown(2);
        onPasswordUpdated?.({ hasPassword: true, requiresLogin: true });
      } else {
        throw new Error(response.data?.message || t('password_change_failed'));
      }
    } catch (err) {
      console.error('❌ Password change error:', err.response?.data || err.message);
      const statusCode = err.response?.status;
      const msg = err.response?.data?.message || err.message || t('password_change_failed');

      if (statusCode === 500) {
        setError(`${t('server_error')}: ${msg}. ${t('contact_support')}`);
      } else if (statusCode === 401) {
        setError(t('incorrect_current_password'));
      } else if (statusCode === 400) {
        setError(`${t('invalid_request')}: ${msg}`);
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
          <h2>{t('password_security')}</h2>
          <p>
            {mode === "set"
              ? t('add_reset_password_otp')
              : t('change_account_password')}
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
            {t('add_button')}
          </button>
          <button
            type="button"
            className={mode === "change" ? "active" : ""}
            onClick={() => {
              setMode("change");
              clearStatus();
            }}
          >
            {t('change_button')}
          </button>
        </div>
      </div>

      {mode === "set" ? (
        <form className="password-security-panel__form" onSubmit={handleSetPassword}>
          <div className="password-security-panel__otp-row">
            <input type="email" value={normalizedEmail} readOnly />
            <button type="button" onClick={handleSendOtp} disabled={loading || !normalizedEmail}>
              {otpSent ? t('resend_otp') : t('send_otp')}
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
              placeholder={t('enter_6_digit_otp')}
            />
          )}
          <div className="password-security-panel__grid">
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder={t('new_password')}
              autoComplete="new-password"
            />
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder={t('confirm_password')}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="password-security-panel__primary" disabled={loading}>
            {loading ? t('saving') : t('save_password')}
          </button>
        </form>
      ) : (
        <form className="password-security-panel__form" onSubmit={handleChangePassword}>
          <input
            type="password"
            name="oldPassword"
            value={form.oldPassword}
            onChange={handleChange}
            placeholder={t('current_password')}
            autoComplete="current-password"
          />
          <div className="password-security-panel__grid">
            <input
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              placeholder={t('new_password')}
              autoComplete="new-password"
            />
            <input
              type="password"
              name="confirmNewPassword"
              value={form.confirmNewPassword}
              onChange={handleChange}
              placeholder={t('confirm_new_password')}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="password-security-panel__primary" disabled={loading}>
            {loading ? t('updating') : t('change_password_button')}
          </button>
        </form>
      )}

      {message && <div className="password-security-panel__message">{message}</div>}
      {error && <div className="password-security-panel__error">{error}</div>}
    </section>
  );
};

export default PasswordChangePage;
