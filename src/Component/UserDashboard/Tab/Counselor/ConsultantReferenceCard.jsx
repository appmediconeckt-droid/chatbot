import { FaRegComment, FaCalendarAlt, FaBriefcase, FaStar, FaUsers, FaQuoteLeft, FaArrowRight } from "react-icons/fa";
import ParticipantPhoto from "../../../common/ParticipantPhoto";

export default function ConsultantReferenceCard({ consultant, t, chatState, onChat, onBook, featured = false }) {
  const expertise = consultant.expertise || [];
  return <article className={`cr-card ${featured ? "cr-featured" : ""}`}>
    <div className="cr-avatar-area">
      <div className="cr-avatar"><div className="cr-avatar-frame"><ParticipantPhoto className="cr-avatar-photo" src={consultant.avatarType === "image" ? consultant.avatar : ""} name={consultant.name} fallback={<span>{consultant.name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("")}</span>} /></div><i className={`cr-presence ${consultant.online ? "online" : ""}`} /></div>
      {featured && <span className={`cr-status ${consultant.online ? "online" : ""}`}><i />{t(consultant.online ? "online" : "offline")}</span>}
    </div>
    {!featured && <span className={`cr-status ${consultant.online ? "online" : ""}`}><i />{t(consultant.online ? "online" : "offline")}</span>}
    <div className="cr-details">
      <h3>{consultant.name}</h3>
      <p className={`cr-role ${consultant.role === "doctor" ? "doctor" : ""}`}>{featured ? consultant.qualification || consultant.specialization : consultant.role === "doctor" ? t("Doctor") : t("Consultant")}</p>
      <div className="cr-tags">{expertise.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}{expertise.length > 3 && <span>+{expertise.length - 3}</span>}</div>
      <div className="cr-stats"><span><FaBriefcase />{consultant.experience} {t("experience").toLowerCase()}</span><span><FaStar /><strong>{consultant.rating > 0 ? Number(consultant.rating).toFixed(1) : t("new")}</strong>{consultant.ratingCount > 0 && <small>({consultant.ratingCount}{featured ? ` ${t("reviews")}` : ""})</small>}</span>{featured && <span><FaUsers />{consultant.totalSessions || 0}+ {t("sessions")}</span>}</div>
    </div>
    {featured && <blockquote className="cr-quote"><FaQuoteLeft /><p>{t("A safe space to help you heal, grow and be your best self.")}</p></blockquote>}
    <div className="cr-actions">
      {!chatState?.hidden && <button type="button" className="cr-chat" disabled={chatState?.disabled} title={chatState?.title} onClick={() => onChat(consultant)}><FaRegComment />{chatState?.text || t("chat_now")}{featured && <FaArrowRight />}</button>}
      <button type="button" className="cr-book" onClick={() => onBook(consultant)}><FaCalendarAlt />{t("book_appointment")}{featured && <FaArrowRight />}</button>
    </div>
  </article>;
}
