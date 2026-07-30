import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaCheck,
  FaHeart,
  FaShieldAlt,
  FaUser,
  FaUserMd,
} from "react-icons/fa";
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
    }, 180);
  };

  return (
    <main className="role-selector-page">
      <div className="role-selector-glow role-selector-glow-one" aria-hidden="true" />
      <div className="role-selector-glow role-selector-glow-two" aria-hidden="true" />
      <div className="role-selector-grid" aria-hidden="true" />

      <section className="x9k3-role-panel" aria-label="Choose your role">
        <header className="m7v2-greeting-area">
          <a className="role-brand" href="/" aria-label="Humaeli home">
            <img src={logo} alt="Humaeli" className="menthy-logo-icon" />
          </a>
          <span className="role-eyebrow">
            <FaHeart aria-hidden="true" />
            Your wellness journey starts here
          </span>
          <h1>How would you like to use Humaeli?</h1>
          <p className="r8t2-sub-line">
            Select the experience that fits you best. You can continue securely in just a few steps.
          </p>
        </header>

        <div className="z6w9-dual-grid">
          <button
            type="button"
            className={`q5b3-role-tile a2f1-user-tile ${selectedRole === "user" ? "l9p3-selected-state" : ""}`}
            onClick={() => handleRoleSelect("user")}
            aria-label="Continue as a user"
          >
            <span className="role-card-accent" aria-hidden="true" />
            <span className="n4d2-icon-circle" aria-hidden="true"><FaUser /></span>
            <span className="role-card-copy">
              <span className="role-card-kicker">For individuals</span>
              <span className="c8v6-role-label">I’m seeking support</span>
              <span className="e3w1-role-hint">
                Find the right counsellor and take charge of your mental wellness.
              </span>
            </span>
            <span className="role-benefits" aria-hidden="true">
              <span><FaCheck /> Private conversations</span>
              <span><FaCheck /> Personalised care</span>
              <span><FaCheck /> Easy appointments</span>
            </span>
            <span className="role-card-action">
              Continue as user <FaArrowRight aria-hidden="true" />
            </span>
          </button>

          <button
            type="button"
            className={`q5b3-role-tile d4m7-counselor-tile ${selectedRole === "counsellor" ? "l9p3-selected-state" : ""}`}
            onClick={() => handleRoleSelect("counsellor")}
            aria-label="Continue as a counsellor"
          >
            <span className="role-card-accent" aria-hidden="true" />
            <span className="role-card-badge">Professional</span>
            <span className="n4d2-icon-circle" aria-hidden="true"><FaUserMd /></span>
            <span className="role-card-copy">
              <span className="role-card-kicker">For care professionals</span>
              <span className="c8v6-role-label">I’m a counsellor</span>
              <span className="e3w1-role-hint">
                Support more people with a calm, organised professional workspace.
              </span>
            </span>
            <span className="role-benefits" aria-hidden="true">
              <span><FaCheck /> Manage clients</span>
              <span><FaCheck /> Secure consultations</span>
              <span><FaCheck /> Grow your practice</span>
            </span>
            <span className="role-card-action">
              Continue as counsellor <FaArrowRight aria-hidden="true" />
            </span>
          </button>
        </div>

        <footer className="h8k1-bottom-actions" aria-label="Platform highlights">
          <span className="role-trust-item"><FaShieldAlt /> Your privacy is protected</span>
          <span className="role-trust-divider" aria-hidden="true" />
          <span className="role-trust-item">Safe. Supportive. Human.</span>
        </footer>
      </section>
    </main>
  );
};

export default RoleSelector;
