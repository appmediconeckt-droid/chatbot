import React from "react";
import { PortalText, PortalTemplate, PortalElement } from './PortalTranslation';
import "./ProfileCompletion.css";

export default function ProfileCompletion({ completion, editing = false, loading = false, error = false }) {
  const available = Number.isFinite(completion?.percentage);
  const percentage = available ? Math.min(100, Math.max(0, completion.percentage)) : null;
  const isComplete = percentage === 100;
  return (
    <PortalElement as="section" className="profile-completion-panel" aria-label="Profile completion">
      <div className="profile-completion-panel__heading">
        <div>
          <h3><PortalText text="Profile Completion" /></h3>
          {!isComplete && <p>{available ? <PortalTemplate text="{0}% complete / {1}% remaining" values={[percentage, 100 - percentage]} /> : <PortalText text={loading ? "Loading your profile progress..." : "Reload your profile to calculate completion."} />}</p>}
        </div>
        <strong>{available ? `${percentage}%` : "..."}</strong>
      </div>
      {!isComplete && (
        <>
          <PortalElement as="div" className="profile-completion-panel__track" role="progressbar" aria-label="Profile completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={available ? percentage : undefined} aria-valuetext={available ? `${percentage}% complete, ${100 - percentage}% remaining` : "Completion unavailable"}>
            <div className="profile-completion-panel__fill" style={{ width: `${percentage ?? 0}%` }} />
          </PortalElement>
          {available && <p><PortalTemplate text="{0} of {1} required fields filled" values={[completion.completedFields, completion.totalFields]} /></p>}
          {error && <p role="status"><PortalText text="Server preview unavailable. Progress is based on the loaded profile fields." /></p>}
          {editing && <p><PortalText text="Save your changes to confirm completion." /></p>}
          {completion?.missingFields?.length > 0 && (
            <p className="profile-completion-panel__missing"><PortalText text="Remaining:" /> {completion.missingFields.map((field, index) => <React.Fragment key={field.key || field.label}>{index > 0 && ', '}<PortalText text={field.label} /></React.Fragment>)}.</p>
          )}
        </>
      )}
    </PortalElement>
  );
}
