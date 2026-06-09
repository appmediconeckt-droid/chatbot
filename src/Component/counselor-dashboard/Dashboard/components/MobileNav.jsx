import React from "react";
import {
  FaBars,
  FaTimes,
  FaArrowRight,
  FaSignOutAlt,
  FaStar,
  FaUserCircle,
} from "react-icons/fa";
import { useCounselorTranslation } from "../../../../i18n/LanguageContext";
import { LanguageSelector } from "../../../common/LanguageSelector";

export function MobileHeader({ showMobileMenu, setShowMobileMenu }) {
  return (
    <div className="couns-mobile-header">
      <button
        className="couns-menu-toggle"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
      >
        {showMobileMenu ? <FaTimes /> : <FaBars />}
      </button>
    </div>
  );
}

export function MobileMenuOverlay({
  counselorData,
  navItems,
  activeTab,
  handleTabChange,
  setShowLogoutConfirm,
  setShowMobileMenu,
}) {
  const { t, lang, setLang } = useCounselorTranslation();
  return (
    <div className="couns-mobile-menu-overlay">
      <div className="couns-mobile-menu">
        <div className="couns-sidebar-header">
          <div className="couns-counselor-profile">
            {counselorData?.profilePhoto ? (
              <img
                src={counselorData.profilePhoto}
                alt={counselorData?.name || "Profile"}
                className="couns-profile-avatar-img"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                  const fallback = e.target.nextElementSibling;
                  if (fallback) fallback.style.display = "block";
                }}
              />
            ) : null}
            {!counselorData?.profilePhoto && (
              <FaUserCircle className="couns-profile-avatar" />
            )}
            <FaUserCircle
              className="couns-profile-avatar-fallback"
              style={{ display: "none" }}
            />

            <h3>{counselorData?.name || "Counselor"}</h3>

            <p>
              <strong>{t('specialization')}:</strong>{" "}
              {counselorData?.specialization || t('not_specified')}
            </p>

            <div className="couns-rating-badge">
              <FaStar className="couns-star" />
              <span>{counselorData?.rating || 0}</span>
            </div>

            <div className="couns-extra-info">
              <p>
                <strong>{t('email')}:</strong> {counselorData?.email || t('not_specified')}
              </p>
              <p>
                <strong>{t('phone')}:</strong>{" "}
                {counselorData?.phoneNumber || t('not_specified')}
              </p>
              <p>
                <strong>{t('experience')}:</strong>{" "}
                {counselorData?.experience || `0 ${t('years')}`}
              </p>
            </div>
            <div style={{ marginTop: 10 }}>
              <LanguageSelector lang={lang} setLang={setLang} t={t} />
            </div>
          </div>
        </div>

        <nav className="couns-mobile-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`couns-mobile-nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => handleTabChange(item.id)}
            >
              <span className="couns-mobile-nav-icon">{item.icon}</span>
              <span className="couns-mobile-nav-label">{item.label}</span>
              {item.badge > 0 && (
                <span className="couns-mobile-nav-badge">{item.badge}</span>
              )}
              <FaArrowRight className="couns-mobile-nav-arrow" />
            </button>
          ))}

          <button
            className="couns-mobile-nav-item logout"
            onClick={() => {
              setShowMobileMenu(false);
              setShowLogoutConfirm(true);
            }}
          >
            <span className="couns-mobile-nav-icon">
              <FaSignOutAlt />
            </span>
            <span className="couns-mobile-nav-label">{t('logout')}</span>
            <FaArrowRight className="couns-mobile-nav-arrow" />
          </button>
        </nav>
      </div>
    </div>
  );
}

export function MobileBottomNav({ navItems, activeTab, handleTabChange }) {
  return (
    <nav className="couns-mobile-bottom-nav">
      {navItems.slice(0, 5).map((item) => (
        <button
          key={item.id}
          className={`couns-bottom-nav-item ${activeTab === item.id ? "active" : ""}`}
          onClick={() => handleTabChange(item.id)}
        >
          <span className="couns-bottom-nav-icon">{item.icon}</span>
          <span className="couns-bottom-nav-label">{item.label}</span>
          {item.badge > 0 && (
            <span className="couns-bottom-nav-badge">{item.badge}</span>
          )}
        </button>
      ))}
    </nav>
  );
}
