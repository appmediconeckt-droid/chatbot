import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../axiosConfig";
import { captureAndSendLocation } from "../../authtication/locationHelper";
import PasswordChangePage from "../ChangesPassword/PasswordChangePage";
import PrivacyPolicy from "./PrivacyPolicy";
import HelpSupport from "./HelpSupport";
import "./AccountSettings.css";
import { useUserTranslation, useCounselorTranslation } from "../../i18n/LanguageContext";
import { LanguageSelector } from "../common/LanguageSelector";
import {
  FaBell,
  FaCalendarAlt,
  FaCheck,
  FaChevronRight,
  FaComments,
  FaCog,
  FaCreditCard,
  FaEnvelope,
  FaExclamationTriangle,
  FaGlobe,
  FaHistory,
  FaKey,
  FaLanguage,
  FaLock,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaMobileAlt,
  FaPencilAlt,
  FaPhoneAlt,
  FaQuestionCircle,
  FaRobot,
  FaSearch,
  FaShieldAlt,
  FaSignOutAlt,
  FaUser,
  FaUserEdit,
  FaWallet,
  FaBoxOpen,
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
        profileImage: data.profileImage || data.profilePicture || data.avatar || "",
        specialization: data.specialization || data.professionalTitle || "Psychologist",
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

  if (isCounselor) {
    const securityRows = [
      {
        icon: <FaLock />,
        label: "Change Password",
        action: () => {
          setPasswordEditorMode("change");
          setShowPasswordEditor(true);
        },
      },
      {
        icon: <FaKey />,
        label: "Add Password by OTP",
        action: () => {
          setPasswordEditorMode("set");
          setShowPasswordEditor(true);
        },
      },
      {
        icon: <FaMobileAlt />,
        label: "App Lock",
        action: () => setShowPasswordEditor(true),
      },
      {
        icon: <FaShieldAlt />,
        label: "Two-Factor Authentication",
        badge: account.hasPassword ? "Enabled" : "Setup",
        action: () => {
          setPasswordEditorMode(account.hasPassword ? "change" : "set");
          setShowPasswordEditor(true);
        },
      },
      {
        icon: <FaHistory />,
        label: "Login Activity",
        action: handleLocationRefresh,
      },
    ];

    return (
      <section className={`counselor-security-settings ${counselorSettingsSection === "support" ? "is-support-page" : ""}`}>
        <header className="counselor-security-settings__page-title">
          <h1>{counselorSettingsSection === "support" ? "Help & Support" : "Settings"}</h1>
        </header>

        {notice.message && <div className={`account-settings__notice ${notice.type}`}>{notice.message}</div>}

        <section className="counselor-security-profile">
          <div className="counselor-security-profile__avatar">
            {account.profileImage ? <img src={account.profileImage} alt={account.name} /> : <FaUser />}
            <i><FaCog /></i>
          </div>
          <div>
            <h2>{account.name || "Counselor"}</h2>
            <strong>{account.specialization}</strong>
            <p>{account.email}</p>
          </div>
          {onOpenProfile && <button type="button" onClick={onOpenProfile}><FaPencilAlt /> Edit</button>}
        </section>

        <section className="counselor-settings-toolbar">
          <label><FaSearch /><input type="search" placeholder="Search Setting" aria-label="Search settings" /></label>
          <nav>
            <button type="button" onClick={() => setCounselorSettingsSection("account")}><FaUser /> Profile</button>
            <button type="button" onClick={() => setCounselorSettingsSection("account")}><FaCreditCard /> Payout</button>
            <button type="button" onClick={() => setCounselorSettingsSection("privacy")}><FaShieldAlt /> Privacy</button>
            <button type="button" onClick={() => setCounselorSettingsSection("support")}><FaQuestionCircle /> Help</button>
            <button type="button"><FaGlobe /> Language</button>
          </nav>
        </section>

        <div className="counselor-settings-body">
          <aside>
            <button
              type="button"
              className={counselorSettingsSection === "account" ? "active" : ""}
              onClick={() => setCounselorSettingsSection("account")}
            >
              Account
            </button>
            <button
              type="button"
              className={counselorSettingsSection === "security" ? "active" : ""}
              onClick={() => setCounselorSettingsSection("security")}
            >
              Security
            </button>
            <button type="button"><FaBell /> Notifications</button>
            <button
              type="button"
              className={counselorSettingsSection === "privacy" ? "active" : ""}
              onClick={() => setCounselorSettingsSection("privacy")}
            >
              <FaShieldAlt /> Privacy
            </button>
            <button
              type="button"
              className={counselorSettingsSection === "support" ? "active" : ""}
              onClick={() => setCounselorSettingsSection("support")}
            >
              <FaQuestionCircle /> Support
            </button>
          </aside>

          <main>
            {counselorSettingsSection === "account" ? (
              <>
                <span className="counselor-settings-section-label">ACCOUNT</span>
                <div className="counselor-security-list counselor-account-list">
                  <button type="button" onClick={onOpenProfile}>
                    <i><FaUser /></i><span>Edit Profile</span><FaChevronRight />
                  </button>
                  <button type="button">
                    <i><FaWallet /></i><span>Payout Account</span><FaChevronRight />
                  </button>
                  <button type="button">
                    <i><FaLanguage /></i><span>Language</span><FaChevronRight />
                  </button>
                </div>

                <div className="counselor-app-version">
                  <i><FaBoxOpen /></i>
                  <div><strong>App Version</strong><span>Humaeli v1.2.4 (Build 248)</span></div>
                  <b>Latest</b>
                </div>

                <button
                  type="button"
                  className="counselor-settings-signout"
                  onClick={() => document.querySelector(".couns-sidebar-item.couns-action, .couns-mobile-nav-item.logout")?.click()}
                >
                  <FaSignOutAlt /> Sign Out
                </button>
              </>
            ) : counselorSettingsSection === "security" ? (
              <>
                <span className="counselor-settings-section-label">SECURITY</span>
                <div className="counselor-security-list">
                  {securityRows.map((row) => (
                    <button type="button" key={row.label} onClick={row.action} disabled={row.label === "Login Activity" && locationLoading}>
                      <i>{row.icon}</i>
                      <span>{row.label === "Login Activity" && locationLoading ? t("updating") : row.label}</span>
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
              <PrivacyPolicy />
            ) : counselorSettingsSection === 'support' ? (
              <HelpSupport />
            ) : null}
          </main>
        </div>
      </section>
    );
  }

  return (
    <section className={`account-settings settings-screen ${isCounselor ? "account-settings--counselor" : "account-settings--user"}`}>
      <header className="settings-screen__header">
        <div><h1>{title}</h1><p>Manage your settings and privacy</p></div>
        <label className="settings-search"><FaSearch /><input type="search" placeholder="Search settings..." aria-label="Search settings" /></label>
      </header>

      {notice.message && <div className={`account-settings__notice ${notice.type}`}>{notice.message}</div>}

      <div className="settings-screen__layout">
        <main className="settings-screen__main">
          <section className="settings-security-intro">
            <span className="settings-round-icon"><FaShieldAlt /></span>
            <div><h2>Security Center</h2><p>Manage your account protection and authentication methods.</p></div>
          </section>

          <section className="settings-account-card">
            <span className="settings-card-label">ACCOUNT INFO</span>
            <div className="settings-profile-row">
              <span className="settings-profile-avatar"><FaUser /></span>
              <div><strong>{account.name || t("not_added")}</strong><small>Personal Account</small></div>
              {onOpenProfile && <button type="button" onClick={onOpenProfile}><FaUserEdit /> {t("edit_profile")}</button>}
            </div>
            <dl>
              <div><dt><FaEnvelope /> {t("email")}</dt><dd>{account.email || t("not_added")}</dd></div>
              <div><dt><FaPhoneAlt /> {t("phone")}</dt><dd>{account.phone || t("not_added")}</dd></div>
              <div><dt><FaLock /> Login via</dt><dd>{account.authProvider === "google" ? "Google" : "Email & Password"}</dd></div>
            </dl>
          </section>

          <section className={`settings-password-card ${showPasswordEditor ? "is-open" : ""}`}>
            <div className="settings-password-summary">
              <div>
                <h3>Password Security</h3>
                <p>Update your current password</p>
                <small>Current: &nbsp;••••••••</small>
              </div>
              <div className="settings-password-actions">
                <button type="button" onClick={() => { setPasswordEditorMode("set"); setShowPasswordEditor(true); }}>Add</button>
                <button type="button" className="active" onClick={() => { setPasswordEditorMode("change"); setShowPasswordEditor((value) => !value); }}>
                  {showPasswordEditor ? "Close" : "Change"}
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
            <div><h3>App Lock</h3><p>Setup a password to lock your website</p></div>
            <button type="button" onClick={() => setShowPasswordEditor(true)}>
              <span>›</span>
            </button>
          </section>
        </main>

        <aside className="settings-screen__side">
          <section className="settings-protected-card">
            <div className="settings-protected-title"><strong><FaCheck /> Protected</strong><span>Score: {account.hasPassword ? "92%" : "68%"}</span></div>
            <ul>
              <li><FaCheck /> Account authentication active</li>
              <li><FaCheck /> {account.hasPassword ? "Strong password set" : "Password setup available"}</li>
              <li><FaCheck /> Profile protection enabled</li>
            </ul>
          </section>
          <button type="button" className="settings-save-button" onClick={() => setShowPasswordEditor(true)}>
            <FaLock /> Save Security Settings
          </button>
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
