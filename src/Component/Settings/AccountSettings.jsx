import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../axiosConfig";
import { captureAndSendLocation } from "../../authtication/locationHelper";
import PasswordChangePage from "../ChangesPassword/PasswordChangePage";
import "./AccountSettings.css";
import { useUserTranslation, useCounselorTranslation } from "../../i18n/LanguageContext";
import { LanguageSelector } from "../common/LanguageSelector";

const emptyAccount = {
  name: "",
  email: "",
  phone: "",
  role: "",
  authProvider: "",
  hasPassword: false,
  profileCompleted: false,
};

const AccountSettings = ({ role = "user", onOpenProfile }) => {
  const navigate = useNavigate();
  const isCounselor = role === "counsellor" || role === "counselor";
  const userT = useUserTranslation();
  const counselorT = useCounselorTranslation();
  const { t, lang, setLang } = isCounselor ? counselorT : userT;
  const [account, setAccount] = useState(emptyAccount);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [notice, setNotice] = useState({ type: "", message: "" });

  const title = isCounselor ? t('counselor_settings') : t('settings_title');

  const authHeaders = () => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const accountId = useMemo(
    () =>
      isCounselor
        ? localStorage.getItem("counsellorId")
        : localStorage.getItem("userId"),
    [isCounselor],
  );

  const fetchAccount = async () => {
    if (!accountId) {
      setNotice({
        type: "error",
        message: "Account ID not found. Please log in again.",
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const url = isCounselor
        ? `${API_BASE_URL}/api/auth/counsellors/${accountId}`
        : `${API_BASE_URL}/api/auth/getUser/${accountId}`;
      const response = await axios.get(url, { headers: authHeaders() });
      const data = isCounselor ? response.data?.counsellor : response.data?.user;

      if (!response.data?.success || !data) {
        throw new Error(response.data?.message || "Failed to load settings.");
      }

      setAccount({
        name: data.fullName || data.name || "",
        email: data.email || "",
        phone: data.phoneNumber || data.phone || "",
        role: data.role || (isCounselor ? "counsellor" : "user"),
        authProvider: data.authProvider || "",
        hasPassword:
          typeof data.hasPassword === "boolean"
            ? data.hasPassword
            : data.authProvider !== "google" || !data.googleId,
        profileCompleted: Boolean(data.profileCompleted),
      });
      setNotice({ type: "", message: "" });
    } catch (err) {
      setNotice({
        type: "error",
        message:
          err.response?.data?.message ||
          err.message ||
          "Failed to load account settings.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, isCounselor]);

  const handleLocationRefresh = async () => {
    setLocationLoading(true);
    setNotice({ type: "", message: "" });
    try {
      await captureAndSendLocation("manual");
      setNotice({ type: "success", message: "Location updated successfully." });
    } catch (err) {
      setNotice({
        type: "error",
        message: err.message || "Failed to update location.",
      });
    } finally {
      setLocationLoading(false);
    }
  };

  const handlePasswordUpdated = ({ hasPassword, requiresLogin } = {}) => {
    setAccount((prev) => ({
      ...prev,
      hasPassword: typeof hasPassword === "boolean" ? hasPassword : true,
    }));

    // If password was just set/changed, redirect to role-based dashboard after 2 seconds
    if (requiresLogin) {
      setTimeout(() => {
        console.log('🔄 Redirecting to role-based dashboard...');
        navigate(isCounselor ? '/counselor-dashboard' : '/user-dashboard');
      }, 2000);
      setNotice({
        type: "success",
        message: "Password updated successfully. Redirecting...",
      });
    } else {
      setNotice({
        type: "success",
        message: "Password updated successfully.",
      });
    }
  };

  if (loading) {
    return (
      <section className="account-settings">
        <div className="account-settings__loading">{t('loading_settings')}</div>
      </section>
    );
  }

  return (
    <section className="account-settings">
      <div className="account-settings__header">
        <div>
          <h1>{title}</h1>
          <p>{t('manage_account')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {isCounselor && (
            <div style={{ background: '#4f46e5', borderRadius: 20, padding: '2px' }}>
              <LanguageSelector lang={lang} setLang={setLang} t={t} compact />
            </div>
          )}
          {onOpenProfile && (
            <button type="button" onClick={onOpenProfile}>
              {t('edit_profile')}
            </button>
          )}
        </div>
      </div>

      {notice.message && (
        <div className={`account-settings__notice ${notice.type}`}>
          {notice.message}
        </div>
      )}

      <div className="account-settings__grid">
        <div className="account-settings__panel">
          <h2>{t('account')}</h2>
          <dl className="account-settings__details">
            <div>
              <dt>{t('name')}</dt>
              <dd>{account.name || t('not_added')}</dd>
            </div>
            <div>
              <dt>{t('email')}</dt>
              <dd>{account.email || t('not_added')}</dd>
            </div>
            <div>
              <dt>{t('phone')}</dt>
              <dd>{account.phone || t('not_added')}</dd>
            </div>
            <div>
              <dt>{t('login')}</dt>
              <dd>{account.authProvider === "google" ? "Google" : "Email password"}</dd>
            </div>
            <div>
              <dt>{t('password')}</dt>
              <dd>{account.hasPassword ? t('password_added') : t('not_added')}</dd>
            </div>
          </dl>
        </div>

        <div className="account-settings__panel">
          <h2>{t('location')}</h2>
          <p>{t('location_desc')}</p>
          <button
            type="button"
            className="account-settings__primary"
            onClick={handleLocationRefresh}
            disabled={locationLoading}
          >
            {locationLoading ? t('updating') : t('update_location')}
          </button>
        </div>

        <div className="account-settings__panel">
          <h2>🌐 {t('language')}</h2>
          <p>{t('change_language')}</p>
          <div style={{ margin: '15px 0' }}>
            <LanguageSelector lang={lang} setLang={setLang} t={t} />
          </div>
          <small style={{ color: '#666', display: 'block', marginTop: '10px' }}>
            {t('select_language')}: {lang.toUpperCase()}
          </small>
        </div>
      </div>

      <PasswordChangePage
        email={account.email}
        hasPassword={account.hasPassword}
        onPasswordUpdated={handlePasswordUpdated}
        role={role}
      />
    </section>
  );
};

export default AccountSettings;
