import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../axiosConfig";
import "./PasswordChangePage.css";
import { useUserTranslation, useCounselorTranslation } from "../../i18n/LanguageContext";
import { getPasswordChecks, isStrongPassword, STRONG_PASSWORD_ERROR } from "../../utils/passwordStrength";

const initialForm = {
  otp: "",
  password: "",
  confirmPassword: "",
  oldPassword: "",
  newPassword: "",
  confirmNewPassword: "",
};

const PasswordChangePage = ({ email, hasPassword, initialMode, onPasswordUpdated, onCancel, role = "user" }) => {
  const isCounselor = role === "counsellor" || role === "counselor";
  const userT = useUserTranslation();
  const counselorT = useCounselorTranslation();
  const { t } = isCounselor ? counselorT : userT;

  const [mode, setMode] = useState(hasPassword ? "change" : "set");
  const [form, setForm] = useState(initialForm);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [redirectCountdown, setRedirectCountdown] = useState(0);

  useEffect(() => {
    if (initialMode === "set" || initialMode === "change") {
      setMode(initialMode);
    } else if (typeof hasPassword === "boolean") {
      setMode(hasPassword ? "change" : "set");
    }
  }, [hasPassword, initialMode]);

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

  const passwordIsValid = isStrongPassword;
  const newPasswordChecks = getPasswordChecks(form.newPassword);
  const setPasswordChecks = getPasswordChecks(form.password);

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
        setOtpVerified(false);
        setForm((prev) => ({ ...prev, otp: "", password: "", confirmPassword: "" }));
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

  const handleVerifyOtp = async () => {
    clearStatus();
    if (!form.otp || form.otp.length !== 6) {
      setError(t('enter_6_digit_otp'));
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/verify-password-otp`,
        { email: normalizedEmail, otp: form.otp },
        { headers: authHeaders() },
      );
      if (!response.data?.success) {
        throw new Error(response.data?.message || "OTP verification failed");
      }
      setOtpVerified(true);
      setMessage(response.data.message || "OTP verified successfully");
    } catch (err) {
      setOtpVerified(false);
      setError(err.response?.data?.message || err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (event) => {
    event.preventDefault();
    clearStatus();

    if (!passwordIsValid(form.password)) {
      setError(STRONG_PASSWORD_ERROR);
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
        setOtpVerified(false);
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
      setError(STRONG_PASSWORD_ERROR);
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
          <h2>{t("password_security")}</h2>
          <p>
            {mode === "set"
              ? t('add_reset_password_otp')
              : t("update_current_password")}
          </p>
        </div>
        <div className="password-security-panel__switch">
          <button
            type="button"
            className={mode === "set" ? "active" : ""}
            onClick={() => {
              setMode("set");
              setForm(initialForm);
              setOtpSent(false);
              setOtpVerified(false);
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
              setForm(initialForm);
              setOtpSent(false);
              setOtpVerified(false);
              clearStatus();
            }}
          >
            {t('change_button')}
          </button>
        </div>
      </div>

      {mode === "set" ? (
        <form className="password-security-panel__form" onSubmit={handleSetPassword}>
          <label className="password-field password-email-field">
            <span>{t("email")}</span>
            <div className="password-email-input-row">
              <input type="email" value={normalizedEmail} placeholder={t("email")} readOnly />
              <button type="button" onClick={handleSendOtp} disabled={loading || !normalizedEmail}>
                {otpSent ? t("resend_otp") : t("send_otp")}
              </button>
            </div>
          </label>
          {otpSent && !otpVerified && (
            <label className="password-field password-otp-field">
              <span>{t("verification_code")}</span>
              <input type="text" inputMode="numeric" maxLength={6} name="otp" value={form.otp} onChange={handleChange} placeholder={t("enter_6_digit_otp")} />
              <button type="button" className="password-security-panel__primary" onClick={handleVerifyOtp} disabled={loading || form.otp.length !== 6}>
                {loading ? t("verifying") : t("verify_otp")}
              </button>
            </label>
          )}
          {otpVerified && <div className="password-security-panel__message">{t("otp_verified")}</div>}
          {otpVerified && <>
          <label className="password-field password-new-field">
            <span>{t("new_password")}</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder={t("minimum_8_characters")}
              autoComplete="new-password"
            />
          </label>
          <div className="password-strength">
            <div className="password-strength-row">
              <div className="password-strength-bar">
                {[0, 1, 2, 3, 4].map((part) => <i key={part} className={Object.values(setPasswordChecks).filter(Boolean).length > part ? "passed" : ""} />)}
              </div>
              <strong>{t("strong_password")}</strong>
            </div>
            <ul>
              <li className={setPasswordChecks.length ? "passed" : ""}>8+ chars</li>
              <li className={setPasswordChecks.uppercase ? "passed" : ""}>Uppercase</li>
              <li className={setPasswordChecks.lowercase ? "passed" : ""}>Lowercase</li>
              <li className={setPasswordChecks.number ? "passed" : ""}>Number</li>
              <li className={setPasswordChecks.special ? "passed" : ""}>Special char</li>
            </ul>
          </div>
          <label className="password-field password-confirm-field">
            <span>{t("confirm_password")}</span>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder={t("confirm_password")}
              autoComplete="new-password"
            />
          </label>
          <div className="password-change-actions">
            <button type="submit" className="password-security-panel__primary" disabled={loading}>
              {loading ? t("saving") : t("save_changes")}
            </button>
            <button type="button" className="password-change-cancel" onClick={() => { setForm(initialForm); setOtpSent(false); setOtpVerified(false); clearStatus(); onCancel?.(); }}>{t("cancel")}</button>
          </div>
          </>}
        </form>
      ) : (
        <form className="password-security-panel__form" onSubmit={handleChangePassword}>
          <div className="password-current-meta">
            <span>{t("current_password")}:</span><strong>••••••••</strong>
          </div>
          <label className="password-field">
            <span>{t("current_password")}</span>
            <input
              type="password"
              name="oldPassword"
              value={form.oldPassword}
              onChange={handleChange}
              placeholder={t("current_password")}
              autoComplete="current-password"
            />
          </label>
          <label className="password-field">
            <span>{t("new_password")}</span>
            <input
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              placeholder={t("minimum_8_characters")}
              autoComplete="new-password"
            />
          </label>
          <div className="password-strength">
            <div className="password-strength-row">
              <div className="password-strength-bar">
                {[0, 1, 2, 3, 4].map((part) => <i key={part} className={Object.values(newPasswordChecks).filter(Boolean).length > part ? "passed" : ""} />)}
              </div>
              <strong>{t("strong_password")}</strong>
            </div>
            <ul>
              <li className={newPasswordChecks.length ? "passed" : ""}>8+ chars</li>
              <li className={newPasswordChecks.uppercase ? "passed" : ""}>Uppercase</li>
              <li className={newPasswordChecks.lowercase ? "passed" : ""}>Lowercase</li>
              <li className={newPasswordChecks.number ? "passed" : ""}>Number</li>
              <li className={newPasswordChecks.special ? "passed" : ""}>Special char</li>
            </ul>
          </div>
          <label className="password-field">
            <span>{t("confirm_password")}</span>
            <input
              type="password"
              name="confirmNewPassword"
              value={form.confirmNewPassword}
              onChange={handleChange}
              placeholder={t("confirm_password")}
              autoComplete="new-password"
            />
          </label>
          <div className="password-change-actions">
            <button type="submit" className="password-security-panel__primary" disabled={loading}>
              {loading ? t('updating') : t("save_changes")}
            </button>
            <button type="button" className="password-change-cancel" onClick={() => { setForm(initialForm); clearStatus(); onCancel?.(); }}>{t("cancel")}</button>
          </div>
        </form>
      )}

      {message && <div className="password-security-panel__message">{message}</div>}
      {error && <div className="password-security-panel__error">{error}</div>}
    </section>
  );
};

export default PasswordChangePage;
