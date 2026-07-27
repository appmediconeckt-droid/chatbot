import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RoleSelector.css";
import logo from "../assets/humaeli.png";

const RoleSelector = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();

  const clearExistingSession = () => {
    [
      "accessToken", "token", "refreshToken", "isAuthenticated", "userRole",
      "userType", "userEmail", "userData", "userId", "counsellorId",
      "counselorId", "isVerified",
    ].forEach((key) => localStorage.removeItem(key));
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    const userRole = (localStorage.getItem("userRole") || "").toLowerCase();
    if (token && ["counselor", "counsellor"].includes(userRole)) {
      navigate("/counselor-dashboard");
    } else if (token && userRole === "user") {
      navigate("/user-dashboard");
    }
  }, [navigate]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    clearExistingSession();
    localStorage.setItem("role", role);
    window.setTimeout(() => {
      navigate(role === "user" ? "/user-signup" : "/counselor-signup", {
        state: { role },
      });
    }, 120);
  };

  const handleKeyDown = (event, role) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleRoleSelect(role);
    }
  };

  return (
    <main className="role-selector-page">
      <section className="x9k3-role-panel" aria-label="Choose your role">
        <header className="m7v2-greeting-area">
          <img src={logo} alt="Humaeli" className="menthy-logo-icon" />
          <p className="r8t2-sub-line">choose your path —</p>
        </header>

        <div className="z6w9-dual-grid">
          <article
            className={`q5b3-role-tile a2f1-user-tile ${
              selectedRole === "user" ? "l9p3-selected-state" : ""
            }`}
            onClick={() => handleRoleSelect("user")}
            onKeyDown={(event) => handleKeyDown(event, "user")}
            role="button"
            tabIndex={0}
            aria-label="Continue as user"
          >
            <div className="n4d2-icon-circle" aria-hidden="true">🧑‍💼</div>
            <h2 className="c8v6-role-label">user</h2>
            <p className="e3w1-role-hint">personal dashboard</p>
            <div className="v9b2-micro-divider" />
            <span className="t5n6-footer-note">explore</span>
          </article>

          <article
            className={`q5b3-role-tile d4m7-counselor-tile ${
              selectedRole === "counsellor" ? "l9p3-selected-state" : ""
            }`}
            onClick={() => handleRoleSelect("counsellor")}
            onKeyDown={(event) => handleKeyDown(event, "counsellor")}
            role="button"
            tabIndex={0}
            aria-label="Continue as counsellor"
          >
            <div className="n4d2-icon-circle" aria-hidden="true">👩‍⚕️</div>
            <h2 className="c8v6-role-label">counsellor</h2>
            <p className="e3w1-role-hint">professional toolkit</p>
            <div className="v9b2-micro-divider" />
            <span className="t5n6-footer-note">guide</span>
          </article>
        </div>

        <footer className="h8k1-bottom-actions" aria-label="Platform highlights">
          <span className="w2p3-action-pill">⚡ both paths</span>
          <span className="w2p3-action-pill">🧠 Mental Health Guide</span>
          <span className="w2p3-action-pill">❓ help</span>
        </footer>
      </section>
    </main>
  );
};

export default RoleSelector;
