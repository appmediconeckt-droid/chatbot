import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../axiosConfig";
import { captureAndSendLocation } from "../../authtication/locationHelper";
import PasswordChangePage from "../ChangesPassword/PasswordChangePage";
import "./AccountSettings.css";
import { useUserTranslation, useCounselorTranslation } from "../../i18n/LanguageContext";
import { LanguageSelector } from "../common/LanguageSelector";
import { FaCog, FaEnvelope, FaMapMarkerAlt, FaPhoneAlt, FaShieldAlt, FaUser, FaUserEdit } from "react-icons/fa";

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

  const title = isCounselor ? t('counselor_settings') : t('settings');

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
        message: t('account_id_not_found'),
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
        throw new Error(response.data?.message || t('failed_load_settings'));
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
          t('failed_load_account_settings'),
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
      setNotice({ type: "success", message: t('location_updated_success') });
    } catch (err) {
      setNotice({
        type: "error",
        message: err.message || t('failed_update_location'),
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
        message: t('password_updated_redirecting'),
      });
    } else {
      setNotice({
        type: "success",
        message: t('password_updated_success'),
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
    <section className={`account-settings ${isCounselor ? "account-settings--counselor" : "account-settings--user"}`}>
      <div className="account-settings__header">
        <div className="account-settings__header-copy">
          <span className="account-settings__header-icon"><FaCog /></span>
          <div>
            <span className="account-settings__eyebrow">ACCOUNT PREFERENCES</span>
            <h1>{title}</h1>
            <p>{t('manage_account')}</p>
          </div>
        </div>
        <div className="account-settings__actions">
          {onOpenProfile && (
            <button
              type="button"
              className="account-settings__edit-btn"
              onClick={onOpenProfile}
            >
              <FaUserEdit /> {t('edit_profile')}
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
        <div className={`account-settings__panel account-settings__panel--account ${!isCounselor ? "account-settings__panel--account-with-language" : ""}`}>
          <div className="account-settings__panel-heading">
            <span className="account-settings__panel-icon account-settings__panel-icon--account"><FaUser /></span>
            <div><h2>{t('account')}</h2><p>Your personal and contact information</p></div>
          </div>
          <dl className="account-settings__details">
            <div>
              <dt><span><FaUser /></span>{t('name')}</dt>
              <dd>{account.name || t('not_added')}</dd>
            </div>
            <div>
              <dt><span><FaEnvelope /></span>{t('email')}</dt>
              <dd>{account.email || t('not_added')}</dd>
            </div>
            <div>
              <dt><span><FaPhoneAlt /></span>{t('phone')}</dt>
              <dd>{account.phone || t('not_added')}</dd>
            </div>
            {/* <div>
              <dt>{t('login')}</dt>
              <dd>{account.authProvider === "google" ? "Google" : "Email password"}</dd>
            </div>
            <div>
              <dt>{t('password')}</dt>
              <dd>{account.hasPassword ? t('password_added') : t('not_added')}</dd>
            </div> */}
          </dl>
        </div>

        <div className="account-settings__panel account-settings__panel--location">
          <div className="account-settings__panel-heading">
            <span className="account-settings__panel-icon account-settings__panel-icon--location"><FaMapMarkerAlt /></span>
            <div><h2>{t('location')}</h2><span className="account-settings__status"><i /> Location services</span></div>
          </div>
          <p>{t('location_desc')}</p>
          <button
            type="button"
            className="account-settings__primary"
            onClick={handleLocationRefresh}
            disabled={locationLoading}
          >
            <FaMapMarkerAlt /> {locationLoading ? t('updating') : t('update_location')}
          </button>
        </div>

        {/* {!isCounselor && (
          <div className="account-settings__panel account-settings__panel--language">
            <h2>🌐 {t('language')}</h2>
            <p>{t('change_language')}</p>
            <div className="account-settings__language-select">
              <LanguageSelector lang={lang} setLang={setLang} t={t} />
            </div>
            <small className="account-settings__language-note">
              {t('select_language')}: {lang.toUpperCase()}
            </small>
          </div>
        )} */}
      </div>

      <div className="account-settings__security">
        <div className="account-settings__security-title">
          <span><FaShieldAlt /></span>
          <div><h2>Security</h2><p>Keep your account protected with a secure password.</p></div>
        </div>
        <PasswordChangePage
          email={account.email}
          hasPassword={account.hasPassword}
          onPasswordUpdated={handlePasswordUpdated}
          role={role}
        />
      </div>
    </section>
  );
};

export default AccountSettings;
