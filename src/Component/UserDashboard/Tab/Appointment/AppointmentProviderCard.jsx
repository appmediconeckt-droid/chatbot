import ProviderRating from './ProviderRating.jsx';
import { FaCalendarAlt, FaCheckCircle, FaEllipsisH, FaArrowRight } from "react-icons/fa";
import ProfileAvatar from "../../../common/ProfileAvatar.jsx";

export default function AppointmentProviderCard({ group, role, schedule, t, onOpen, featured = false }) {
  const provider = group.latest.counselor || group.latest.doctor || group.latest.consultant || {};
  const name = provider.fullName || provider.name || t("Provider unavailable");
  const specialization = Array.isArray(provider.specialization) ? provider.specialization.join(" · ") : provider.specialization;
  const completed = group.appointments.filter((item) => String(item.status).toLowerCase() === "completed").length;

  return <article className={`user-provider-card appointment-provider-reference ${featured ? "is-featured" : ""}`}>
    <details className="uap-card-menu">
      <summary aria-label={`${t("Appointment options for")} ${name}`}><FaEllipsisH /></summary>
      <div><button type="button" onClick={() => onOpen()}>{t("View appointments")}</button><button type="button" onClick={() => onOpen("Completed")}>{t("View completed appointments")}</button></div>
    </details>
    <div className="user-provider-card-person">
      <ProfileAvatar photo={provider.profilePhoto || provider.profileImage} name={name} size={68} className="user-provider-avatar" />
      <div className="uap-provider-copy"><h3>{name}</h3><span className="uap-role">{role.label}</span><p>{specialization || provider.qualification || role.label}</p></div>
    </div>
    <ProviderRating provider={provider} />
    <div className="user-provider-card-counts">
      <span><FaCalendarAlt />{group.appointments.length} {t(group.appointments.length === 1 ? "appointment" : "appointments")}</span>
      <span><FaCheckCircle />{completed} {t("completed")}</span>
    </div>
    <div className="user-provider-card-latest"><FaCalendarAlt /><div><span>{t("Latest appointment")}</span><strong>{schedule.date}{schedule.time && <> &middot; {schedule.time}</>}</strong></div></div>
    <button type="button" className="user-provider-card-open" onClick={() => onOpen()} aria-label={`${t("View appointments")}: ${name}`}><span>{t("View appointments")}</span><FaArrowRight /></button>
  </article>;
}
