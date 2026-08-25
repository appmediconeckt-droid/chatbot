import React from "react";
import { getPasswordChecks } from "../../utils/passwordStrength";
import "./StrongPasswordChecklist.css";

export default function StrongPasswordChecklist({ password = "" }) {
  const checks = getPasswordChecks(password);
  const requirements = [
    ["length", "8+ characters"],
    ["uppercase", "Uppercase letter"],
    ["lowercase", "Lowercase letter"],
    ["number", "Number"],
    ["special", "Special character"],
  ];

  return (
    <div className="strong-password-checklist" aria-live="polite">
      <strong>Strong password</strong>
      <div>
        {requirements.map(([key, label]) => (
          <span key={key} className={checks[key] ? "passed" : ""}>
            {checks[key] ? "✓" : "○"} {label}
          </span>
        ))}
      </div>
    </div>
  );
}
