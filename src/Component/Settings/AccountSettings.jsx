import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../axiosConfig";
import { captureAndSendLocation } from "../../authtication/locationHelper";
import PasswordChangePage from "../ChangesPassword/PasswordChangePage";
import PrivacyPolicy from "./PrivacyPolicy";
import HelpSupport from "./HelpSupport";
import CounselorProfile from "../counselor-dashboard/Tab/Profile-Con/CounselorProfile";
import "./AccountSettings.css";
import { useUserTranslation, useCounselorTranslation } from "../../i18n/LanguageContext";
import { LanguageSelector } from "../common/LanguageSelector";
import {
  FaCalendarAlt,
  FaCheck,
  FaChevronRight,
  FaComments,
  FaCog,
  FaEnvelope,
  FaExclamationTriangle,
  FaKey,
  FaLock,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaPencilAlt,
  FaPhoneAlt,
  FaQuestionCircle,
  FaRobot,
  FaSearch,
  FaShieldAlt,
  FaSignOutAlt,
  FaUser,
  FaUserEdit,
  FaImage,
} from "react-icons/fa";

const emptyAccount = {
  name: "",
  email: "",
  phone: "",
  role: "",
  authProvider: "",
  hasPassword: false,
  profileCompleted: false,
  profileImage: "",
  specialization: "",
};

const resolveCounselorProfilePhoto = (data = {}) => {
  const candidates = [
    data.profilePhoto,
    data.profilePhotoUrl,
    data.profileImage,
    data.profilePicture,
    data.avatar,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate;
    if (candidate && typeof candidate === "object") {
      const url = candidate.url || candidate.secureUrl || candidate.secure_url;
      if (url) return url;
      if (candidate.publicId || candidate.public_id) {
        return `https://res.cloudinary.com/dfll8lwos/image/upload/${candidate.publicId || candidate.public_id}`;
      }
    }
  }

  return "";
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
  const [showPasswordEditor, setShowPasswordEditor] = useState(false);
  const [passwordEditorMode, setPasswordEditorMode] = useState("change");
  const [counselorSettingsSection, setCounselorSettingsSection] = useState("account");
  const [showCounselorProfileEditor, setShowCounselorProfileEditor] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);

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

      const specialization = Array.isArray(data.specialization)
        ? data.specialization.filter(Boolean).join(" • ")
        : data.specialization || data.professionalTitle || "Psychologist";

      setProfileImageError(false);
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
        profileImage: resolveCounselorProfilePhoto(data),
        specialization,
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

  if (isCounselor) {
    const securityRows = [
      {
        icon: <FaLock />,
        key: "change_password",
        action: () => {
          setPasswordEditorMode("change");
          setShowPasswordEditor(true);
        },
      },
      {
        icon: <FaKey />,
        key: "add_password_by_otp",
        action: () => {
          setPasswordEditorMode("set");
          setShowPasswordEditor(true);
        },
      },
    ];

    return (
      <section className={`counselor-security-settings ${counselorSettingsSection === "support" ? "is-support-page" : ""}`}>
        <header className="counselor-security-settings__page-title">
          <h1>{counselorSettingsSection === "support" ? t("help_support") : t("settings.title")}</h1>
        </header>

        {notice.message && <div className={`account-settings__notice ${notice.type}`}>{notice.message}</div>}

        <section className="counselor-security-profile">
          <div className="counselor-security-profile__avatar">
            {account.profileImage && !profileImageError ? (
              <img
                src={account.profileImage}
                alt={account.name || "Consultant profile"}
                onError={() => setProfileImageError(true)}
              />
            ) : (
              <FaUser />
            )}
            <button
              type="button"
              className="counselor-security-profile__avatar-edit"
              onClick={() => setShowCounselorProfileEditor(true)}
              title="Update profile photo"
              aria-label="Open profile editor to update profile photo"
            >
              <FaUserEdit />
            </button>
          </div>
          <div>
            <h2>{account.name || "Consultant"}</h2>
            <strong>{account.specialization}</strong>
            <p>{account.email}</p>
          </div>
          <button type="button" onClick={() => setShowCounselorProfileEditor(true)}><FaPencilAlt /> {t("edit")}</button>
        </section>

        {showCounselorProfileEditor && (
          <div className="counselor-profile-editor-modal" role="dialog" aria-modal="true" aria-label="Edit counselor profile">
            <div className="counselor-profile-editor-modal__panel">
              <CounselorProfile
                initialEditing
                onRequestClose={() => setShowCounselorProfileEditor(false)}
                onSaved={() => {
                  setShowCounselorProfileEditor(false);
                  fetchAccount();
                }}
              />
            </div>
          </div>
        )}

        <div className="counselor-settings-body">
          <aside>
            <button
              type="button"
              className={counselorSettingsSection === "account" ? "active" : ""}
              onClick={() => setCounselorSettingsSection("account")}
            >
              {t("account")}
            </button>
            <button
              type="button"
              className={counselorSettingsSection === "security" ? "active" : ""}
              onClick={() => setCounselorSettingsSection("security")}
            >
              {t("security")}
            </button>
            <button
              type="button"
              className={counselorSettingsSection === "privacy" ? "active" : ""}
              onClick={() => setCounselorSettingsSection("privacy")}
            >
              <FaShieldAlt /> {t("privacy")}
            </button>
            <button
              type="button"
              className={counselorSettingsSection === "support" ? "active" : ""}
              onClick={() => setCounselorSettingsSection("support")}
            >
              <FaQuestionCircle /> {t("support")}
            </button>
          </aside>

          <main>
            {counselorSettingsSection === "account" ? (
              <>
                <span className="counselor-settings-section-label">{t("account")}</span>
                <div className="counselor-security-list counselor-account-list">
                  <button type="button" onClick={() => setShowCounselorProfileEditor(true)}>
                    <i><FaUser /></i><span>{t("edit_profile")}</span><FaChevronRight />
                  </button>
                </div>

                <button
                  type="button"
                  className="counselor-settings-signout"
                  onClick={() => document.querySelector(".couns-sidebar-item.couns-action, .couns-mobile-nav-item.logout")?.click()}
                >
                  <FaSignOutAlt /> {t("sign_out")}
                </button>
              </>
            ) : counselorSettingsSection === "security" ? (
              <>
                <span className="counselor-settings-section-label">{t("security")}</span>
                <div className="counselor-security-list">
                  {securityRows.map((row) => (
                    <button type="button" key={row.key} onClick={row.action}>
                      <i>{row.icon}</i>
                      <span>{t(row.key)}</span>
                      {row.badge && <b>{row.badge}</b>}
                      <FaChevronRight />
                    </button>
                  ))}
                </div>

                {showPasswordEditor && (
                  <div className="counselor-security-password-editor">
                    <PasswordChangePage
                      email={account.email}
                      hasPassword={account.hasPassword}
                      initialMode={passwordEditorMode}
                      onPasswordUpdated={handlePasswordUpdated}
                      onCancel={() => setShowPasswordEditor(false)}
                      role={role}
                    />
                  </div>
                )}
              </>
            ) : counselorSettingsSection === 'privacy' ? (
              <PrivacyPolicy role={role} />
            ) : counselorSettingsSection === 'support' ? (
              <HelpSupport role={role} />
            ) : null}
          </main>
        </div>
      </section>
    );
  }

  return (
    <section className={`account-settings settings-screen ${isCounselor ? "account-settings--counselor" : "account-settings--user"}`}>
      <header className="settings-screen__header">
        <div><h1>{title}</h1><p>{t('settings')} · {t('privacy')}</p></div>
        <label className="settings-search"><FaSearch /><input type="search" placeholder={t('search_settings')} aria-label={t('search_settings')} /></label>
      </header>

      {notice.message && <div className={`account-settings__notice ${notice.type}`}>{notice.message}</div>}

      <div className="settings-screen__layout">
        <main className="settings-screen__main">
          <section className="settings-security-intro">
            <span className="settings-round-icon"><FaShieldAlt /></span>
            <div><h2>{t('security')}</h2><p>{t('protected')} · {t('account')}</p></div>
          </section>

          <section className="settings-account-card">
            <span className="settings-card-label">{t('account')}</span>
            <div className="settings-profile-row">
              <span className="settings-profile-avatar"><FaUser /></span>
              <div><strong>{account.name || t("not_added")}</strong><small>{t('account')}</small></div>
              {onOpenProfile && <button type="button" onClick={onOpenProfile}><FaUserEdit /> {t("edit_profile")}</button>}
            </div>
            <dl>
              <div><dt><FaEnvelope /> {t("email")}</dt><dd>{account.email || t("not_added")}</dd></div>
              <div><dt><FaPhoneAlt /> {t("phone")}</dt><dd>{account.phone || t("not_added")}</dd></div>
              <div><dt><FaLock /> {t('login')}</dt><dd>{account.authProvider === "google" ? "Google" : `${t('email')} · ${t('password')}`}</dd></div>
            </dl>
          </section>

          <section className={`settings-password-card ${showPasswordEditor ? "is-open" : ""}`}>
            <div className="settings-password-summary">
              <div>
                <h3>{t("password_security")}</h3>
                <p>{t("update_current_password")}</p>
                <small>{t('current_password')}: &nbsp;••••••••</small>
              </div>
              <div className="settings-password-actions">
                <button type="button" onClick={() => { setPasswordEditorMode("set"); setShowPasswordEditor(true); }}>{t("add")}</button>
                <button type="button" className="active" onClick={() => { setPasswordEditorMode("change"); setShowPasswordEditor((value) => !value); }}>
                  {showPasswordEditor ? t('cancel') : t('change_password')}
                </button>
              </div>
            </div>
            {showPasswordEditor && (
              <PasswordChangePage
                email={account.email}
                hasPassword={account.hasPassword}
                initialMode={passwordEditorMode}
                onPasswordUpdated={handlePasswordUpdated}
                onCancel={() => setShowPasswordEditor(false)}
                role={role}
              />
            )}
          </section>

          <section className="settings-location-card settings-app-lock-card">
            <span className="settings-round-icon"><FaLock /></span>
              <div><h3>{t("app_lock")}</h3><p>{t("app_lock_description")}</p></div>
            <button type="button" onClick={() => setShowPasswordEditor(true)}>
              <span>›</span>
            </button>
          </section>
        </main>

        <aside className="settings-screen__side">
          <section className="settings-protected-card">
              <div className="settings-protected-title"><strong><FaCheck /> {t("protected")}</strong></div>
            <ul>
                <li><FaCheck /> {t("account_authentication_active")}</li>
              <li><FaCheck /> {account.hasPassword ? t('password') : t('add_password')}</li>
                <li><FaCheck /> {t("profile_protection_enabled")}</li>
            </ul>
          </section>
          {/* <button type="button" className="settings-save-button" onClick={() => setShowPasswordEditor(true)}>
            <FaLock /> Save Security Settings
          </button> */}
          <button type="button" className="settings-location-update" onClick={handleLocationRefresh} disabled={locationLoading}>
            <FaMapMarkerAlt /> {locationLoading ? t("updating") : t("update_location")}
          </button>
          {!isCounselor && <div className="settings-language-access"><LanguageSelector lang={lang} setLang={setLang} t={t} /></div>}
        </aside>
      </div>
    </section>
  );

  return (
    <section className={`account-settings ${isCounselor ? "account-settings--counselor" : "account-settings--user"}`}>
      <div className="account-settings__header">
        <div className="account-settings__header-copy">
          <span className="account-settings__header-icon"><FaCog /></span>
          <div>
          <span className="account-settings__eyebrow">{t("account_preferences")}</span>
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
          <div><h2>{t('account')}</h2><p>{t("personal_contact_information")}</p></div>
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
            <div><h2>{t('location')}</h2><span className="account-settings__status"><i /> {t('location')}</span></div>
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
          <div><h2>{t("settings.security")}</h2><p>{t("secure_password_description")}</p></div>
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
