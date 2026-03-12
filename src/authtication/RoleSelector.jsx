import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RoleSelector.css';
import logo from '../image/Mediconect Logo-3.png';

const RoleSelector = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    console.log(`${role} selected`);
    
    // Add routing based on role selection
    if (role === 'user') {
      navigate('/user-signup');
    } else if (role === 'counselor') {
      navigate('/counselor-signup');
    }
  };

  return (
    <div className="x9k3-role-panel ">
      <div className="m7v2-greeting-area">
        <img src={logo} height={50} alt="Mediconect Logo" className="menthy-logo-icon" />
        <h1 className="p4h1-gradient-title">✦ welcome back ✦</h1>
        <p className="r8t2-sub-line">choose your path —</p>
      </div>

      <div className="z6w9-dual-grid">
        {/* USER CARD */}
        <div
          className={`q5b3-role-tile a2f1-user-tile ${
            selectedRole === 'user' ? 'l9p3-selected-state' : ''
          }`}
          onClick={() => handleRoleSelect('user')}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => e.key === 'Enter' && handleRoleSelect('user')}
          aria-label="select user role"
        >
          <div className="n4d2-icon-circle">
            <span className="j7h3-unicode-symbol">🧑‍💼</span>
          </div>
          <span className="c8v6-role-label">user</span>
          <span className="e3w1-role-hint">personal dashboard</span>
          <div className="v9b2-micro-divider"></div>
          <span className="t5n6-footer-note">explore</span>
        </div>

        {/* COUNSELOR CARD */}
        <div
          className={`q5b3-role-tile d4m7-counselor-tile ${
            selectedRole === 'counselor' ? 'l9p3-selected-state' : ''
          }`}
          onClick={() => handleRoleSelect('counselor')}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => e.key === 'Enter' && handleRoleSelect('counselor')}
          aria-label="select counselor role"
        >
          <div className="n4d2-icon-circle">
            <span className="j7h3-unicode-symbol">👩‍⚕️</span>
          </div>
          <span className="c8v6-role-label">counselor</span>
          <span className="e3w1-role-hint">professional toolkit</span>
          <div className="v9b2-micro-divider"></div>
          <span className="t5n6-footer-note">guide</span>
        </div>
      </div>

      <div className="h8k1-bottom-actions">
        <span className="w2p3-action-pill">⚡ both paths</span>
        <span className="w2p3-action-pill">🕊️ uniuce</span>
        <span className="w2p3-action-pill">❔ help</span>
      </div>
    </div>
  );
};

export default RoleSelector;