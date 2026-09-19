import React from "react";
import "./ProfileCompletion.css";

export default function ProfileCompletion({ completion, editing = false, loading = false, error = false }) {
  const available = Number.isFinite(completion?.percentage);
  const percentage = available ? Math.min(100, Math.max(0, completion.percentage)) : null;
  return (
    <section className="profile-completion-panel" aria-label="Profile completion">
      <div className="profile-completion-panel__heading">
        <div>
          <h3>Profile Completion</h3>
          <p>{available ? `${percentage}% complete / ${100 - percentage}% remaining` : loading ? "Loading your profile progress..." : "Reload your profile to calculate completion."}</p>
        </div>
        <strong>{available ? `${percentage}%` : "..."}</strong>
      </div>
      <div className="profile-completion-panel__track" role="progressbar" aria-label="Profile completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={available ? percentage : undefined} aria-valuetext={available ? `${percentage}% complete, ${100 - percentage}% remaining` : "Completion unavailable"}>
        <div className="profile-completion-panel__fill" style={{ width: `${percentage ?? 0}%` }} />
      </div>
      {available && <p>{completion.completedFields} of {completion.totalFields} required fields filled</p>}
      {error && <p role="status">Server preview unavailable. Progress is based on the loaded profile fields.</p>}
      {editing && <p>Save your changes to confirm completion.</p>}
      {completion?.missingFields?.length > 0 && (
        <p className="profile-completion-panel__missing">Remaining: {completion.missingFields.map((field) => field.label).join(", ")}.</p>
      )}
    </section>
  );
}
