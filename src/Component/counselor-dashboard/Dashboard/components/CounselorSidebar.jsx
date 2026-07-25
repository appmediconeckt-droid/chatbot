import React from "react";
import { FaUserCircle, FaSignOutAlt, FaEnvelope, FaPhone, FaUser } from "react-icons/fa";
import { useCounselorTranslation } from "../../../../i18n/LanguageContext";
import { LanguageSelector } from "../../../common/LanguageSelector";

export default function CounselorSidebar({
  counselorData,
  navItems,
  activeTab,
  handleTabChange,
  setShowLogoutConfirm,
}) {
  const { t, lang, setLang } = useCounselorTranslation();

  return (
    <aside className="couns-sidebar">
      <div className="couns-sidebar-content">
        {/* Header with Profile - Centered Layout */}
        <div className="couns-sidebar-header">
          <div className="couns-profile-section">
            {/* Profile Image */}
            <div className="couns-profile-avatar-wrap">
              <div className="couns-profile-image">
                {counselorData?.profilePhoto ? (
                  <img
                    src={counselorData.profilePhoto}
                    alt={counselorData?.name || "Profile"}
                    className="couns-profile-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = "none";
                      const fallback = e.target.nextElementSibling;
                      if (fallback) fallback.style.display = "block";
                    }}
                  />
                ) : null}
                {!counselorData?.profilePhoto && (
                  <FaUserCircle className="couns-default-avatar" />
                )}
                <FaUserCircle
                  className="couns-profile-avatar-fallback"
                  style={{ display: "none" }}
                />
              </div>
              <span className="couns-profile-status" aria-hidden="true" />
            </div>

            {/* Profile Info - Centered */}
            <div className="couns-profile-info">
              {/* Name */}
              <h3 className="couns-sidebar-name" title={counselorData?.name}>
                {counselorData?.name || "Counselor"}
              </h3>

              {/* Email */}
              {counselorData?.email && (
                <p className="couns-sidebar-meta couns-sidebar-meta--email" title={counselorData.email}>
                  <FaEnvelope className="couns-sidebar-meta-icon" />
                  <span>{counselorData.email}</span>
                </p>
              )}

              {/* Phone */}
              {counselorData?.phoneNumber && (
                <p className="couns-sidebar-meta" title={counselorData.phoneNumber}>
                  <FaPhone className="couns-sidebar-meta-icon" />
                  <span>{counselorData.phoneNumber}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="couns-sidebar-menu">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`couns-sidebar-item ${activeTab === item.id ? "couns-active" : ""}`}
            >
              <span className="couns-sidebar-icon">{item.icon}</span>
              <span className="couns-sidebar-text">{item.label}</span>
              {item.badge > 0 && (
                <span className="couns-sidebar-badge">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Actions Section */}
        <div className="couns-sidebar-actions">
          <LanguageSelector lang={lang} setLang={setLang} t={t} />
          <button
            className={`couns-sidebar-item ${activeTab === "profile" ? "couns-active" : ""}`}
            onClick={() => handleTabChange("profile")}
          >
            <span className="couns-sidebar-icon">
              <FaUser />
            </span>
            <span className="couns-sidebar-text">{t('my_profile')}</span>
          </button>
          <button
            className="couns-sidebar-item couns-action"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <span className="couns-sidebar-icon">
              <FaSignOutAlt />
            </span>
            <span className="couns-sidebar-text">{t('logout')}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
