import React from "react";
import { FaUserCircle, FaSignOutAlt } from "react-icons/fa";

export default function CounselorSidebar({
  counselorData,
  navItems,
  activeTab,
  handleTabChange,
  setShowLogoutConfirm,
}) {
  return (
    <aside className="couns-sidebar">
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

          <div className="couns-extra-info">
            <p>
              <strong>Specialization:</strong>{" "}
              {counselorData?.specialization || "Not specified"}
            </p>
            <p>
              <strong>Email:</strong> {counselorData?.email || "Not specified"}
            </p>
            <p>
              <strong>Phone:</strong>{" "}
              {counselorData?.phoneNumber || "Not specified"}
            </p>
            <p>
              <strong>Experience:</strong>{" "}
              {counselorData?.experience || "0 years"}
            </p>
          </div>
        </div>
      </div>

      <nav className="couns-sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`couns-nav-item ${activeTab === item.id ? "active" : ""}`}
            onClick={() => handleTabChange(item.id)}
          >
            <span className="couns-nav-icon">{item.icon}</span>
            <span className="couns-nav-label">{item.label}</span>
            {item.badge > 0 && (
              <span className="couns-nav-badge">{item.badge}</span>
            )}
          </button>
        ))}

        <button
          className="couns-nav-item logout"
          onClick={() => setShowLogoutConfirm(true)}
        >
          <span className="couns-nav-icon">
            <FaSignOutAlt />
          </span>
          <span className="couns-nav-label">Logout</span>
        </button>
      </nav>
    </aside>
  );
}
