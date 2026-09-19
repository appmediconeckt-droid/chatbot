import { useState } from "react";
import { FaUser, FaUserMd, FaComments, FaCheck } from "react-icons/fa";
import UserSignup from "./UserSignup";
import CounselorSignup from "./CounselorSignup";
import "./Signup.css";

const signupRoles = [
  { value: "user", label: "User", icon: FaUser },
  { value: "doctor", label: "Doctor", icon: FaUserMd },
  { value: "counselor", label: "Counselor", icon: FaComments },
];

export default function Signup() {
  const [role, setRole] = useState("user");
  const roleSelector = (disabled) => (
    <fieldset className="signup-role" disabled={disabled}>
      <legend className="signup-role-title">Choose your role</legend>
      <p className="signup-role-hint">Select the account you want to create.</p>
      <div className="signup-role-options">
        {signupRoles.map(({ value, label, icon: Icon }) => (
          <label className="signup-role-option" key={value}>
            <input
              type="radio"
              name="role"
              value={value}
              checked={role === value}
              onChange={() => setRole(value)}
              required
            />
            <span className="signup-role-card">
              <span className="signup-role-check" aria-hidden="true"><FaCheck /></span>
              <span className="signup-role-icon" aria-hidden="true"><Icon /></span>
              <span>{label}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );

  return role === "user" ? (
    <UserSignup initialSignup roleSelector={roleSelector} />
  ) : (
    <CounselorSignup initialSignup accountRole={role} roleSelector={roleSelector} />
  );
}
