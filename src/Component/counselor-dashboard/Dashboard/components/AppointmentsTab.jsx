import React from "react";
import "./AppointmentsTab.css";
import { FaRegUser, FaCalendarAlt, FaCheck, FaCheckCircle, FaClock, FaHistory, FaSearch, FaTimes, FaRegComment, FaChevronRight, FaVideo, FaRegFileAlt } from "react-icons/fa";
import { getAppointmentPatientDisplay as getAppointmentDisplay } from "../appointmentPatient";
import { useCounselorTranslation } from "../../../../i18n/LanguageContext";
import ParticipantPhoto from "../../../common/ParticipantPhoto";

export default function AppointmentsTab({
  appointments = [],
  selectedDate,
  setSelectedDate,
  clearDateFilter,
  handleUpdateAppointmentStatus,
  loading = false,
}) {
  const { t, lang } = useCounselorTranslation();
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [detailAppointment, setDetailAppointment] = React.useState(null);
  const detailDialogRef = React.useRef(null);
  React.useEffect(() => {
    if (!detailAppointment) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    detailDialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [detailAppointment]);


  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleClearFilter = () => {
    if (clearDateFilter) {
      clearDateFilter();
      return;
    }

    setSelectedDate("");
  };

  const filteredAppointments = React.useMemo(() => {
    const now = new Date();
    return appointments.filter((apt) => {
      const date = new Date(apt.date);
      if (Number.isNaN(date.getTime())) return false;
      const matchesDate = !selectedDate || date.toISOString().split("T")[0] === selectedDate;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "past"
          ? date < now
          : String(apt.status || "").toLowerCase() === statusFilter);
      const patientName = getAppointmentDisplay(apt).name.toLowerCase();
      const matchesSearch = [patientName, apt.notes, apt.symptoms, apt.diagnosis].filter(Boolean).join(" ").toLowerCase().includes(searchTerm.trim().toLowerCase());
      return matchesDate && matchesStatus && matchesSearch;
    });
  }, [appointments, selectedDate, statusFilter, searchTerm]);

  const counts = React.useMemo(() => {
    const now = new Date();
    return {
      all: appointments.length,
      pending: appointments.filter((apt) => apt.status === "pending").length,
      confirmed: appointments.filter((apt) => apt.status === "confirmed").length,
      past: appointments.filter((apt) => new Date(apt.date) < now).length,
      today: appointments.filter((apt) => {
        const date = new Date(apt.date);
        return !Number.isNaN(date.getTime()) && date.toDateString() === now.toDateString();
      }).length,
    };
  }, [appointments]);

  const tabs = [
    { key: "all", label: t("all"), icon: FaCalendarAlt },
    { key: "pending", label: t("pending"), icon: FaClock },
    { key: "confirmed", label: t("confirmed"), icon: FaCheckCircle },
    { key: "past", label: t("past"), icon: FaHistory },
  ];

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";

    return new Date(dateString).toLocaleDateString(lang || undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="couns-tab-content-stitch counselor-appointments-reference" aria-busy={loading}>
      <div className="stitch-apt-layout stitch-apt-layout-cards-only">
        <div className="stitch-apt-left">
          <section className="stitch-apt-summary">
            <div className="stitch-apt-summary-copy">
              <h1>{t("appointments")}</h1>
              <p>{t("Manage client sessions, review requests, and connect people with the right counselor.")}</p>
            </div>
            <div className="apt-banner-art" aria-hidden="true"><img src="/images/appointments-wellness.png" alt="" /><span>Better<br />Conversations<br />Brighter Tomorrows</span></div>
            <div className="stitch-apt-metrics">
              <div><i className="apt-metric-icon pending"><FaClock /></i><div><strong>{counts.pending}</strong><span>{t("pending")}</span><small>{t("Awaiting your response")}</small></div></div>
              <div><i className="apt-metric-icon confirmed"><FaCheckCircle /></i><div><strong>{counts.confirmed}</strong><span>{t("confirmed")}</span><small>{t("Upcoming sessions")}</small></div></div>
              <div><i className="apt-metric-icon today"><FaCalendarAlt /></i><div><strong>{counts.today}</strong><span>{t("today")}</span><small>{t("Sessions for today")}</small></div></div>
            </div>
          </section>

          <div className="stitch-apt-toolbar">
            <label className="stitch-apt-search">
              <FaSearch aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t("Search patients by name, problem, or keyword...")}
                aria-label={t("search_patients")}
              />
            </label>
            <div className="stitch-apt-header-tools">
              <div className="stitch-date-filter">
                <FaCalendarAlt />
                <input type="date" className="stitch-date-input" value={selectedDate || ""} onChange={handleDateChange} title={t("filter_by_date")} />
                {selectedDate && (
                  <button className="stitch-clear-filter" onClick={handleClearFilter} title={t("clear")} type="button">
                    <FaTimes size={10} />
                  </button>
                )}
              </div>
            </div>

            <div className="stitch-apt-filter-scroll">
              <div className="stitch-apt-filter-tabs">
                {tabs.map(({ key, label, icon: TabIcon }) => (
                  <button key={key} data-status={key} type="button" className={`stitch-apt-filter-tab ${statusFilter === key ? "active" : ""}`} onClick={() => setStatusFilter(key)}>
                    {key !== "all" && React.createElement(TabIcon)}
                    <span>{label}</span>
                    <b>{counts[key]}</b>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="stitch-apt-grid">
            {filteredAppointments.length === 0 ? (
              <div className="stitch-empty-state-couns">
                {selectedDate
                  ? `${t("no_appointments_for_date")} ${formatDateForDisplay(selectedDate)}`
                  : t("no_pending_appointments")}
              </div>
            ) : (
              filteredAppointments.map((apt) => {
                const anonymousUser = getAppointmentDisplay(apt);

                return (
                  <div
                    key={apt._id}
                    className="stitch-apt-card"
                    style={{ position: "relative" }}
                  >
                    <div className="apt-patient-column">
                      <div className="stitch-apt-avatar">
                        <ParticipantPhoto src={anonymousUser.avatarUrl || ""} name={anonymousUser.name} className="stitch-apt-avatar-img" fallback={<FaRegUser />} />
                      </div>
                      <div className="apt-patient-copy">
                        <h3>{anonymousUser.name}</h3>
                        <div className="apt-patient-tags">
                          <span className="stitch-apt-tag"><FaRegUser />{t(apt.follow_up_synced ? "Follow-up Session" : "initial_consultation")}</span>
                          <span className={`status-badge-stitch ${apt.status || "pending"}`}>{t(String(apt.status || "pending").toLowerCase())}</span>
                        </div>
                        {apt.notes?.trim() && <p className="stitch-apt-notes">&ldquo;{apt.notes}&rdquo;</p>}
                      </div>
                    </div>
                    <div className="apt-session-column">
                      <span><FaCalendarAlt />{new Date(apt.date).toLocaleDateString(lang || undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                      <span><FaClock />{new Date(apt.date).toLocaleTimeString(lang || undefined, { hour: "2-digit", minute: "2-digit" })}{apt.duration ? ` (${apt.duration} ${t("mins")})` : ""}</span>
                      <span><FaVideo />{t(apt.sessionType || "Video Session")}</span>
                      {(apt.symptoms || apt.diagnosis) && <span><FaRegFileAlt />{apt.symptoms || apt.diagnosis}</span>}
                    </div>

                    {apt.status === "pending" && (
                      <div className="stitch-apt-actions">
                        <button
                          className="stitch-btn-accept"
                          onClick={() =>
                            handleUpdateAppointmentStatus(apt._id, "confirmed")
                          }
                          type="button"
                        >
                          <FaCheck />{t("accept")}
                        </button>
                        <button
                          className="stitch-btn-reject"
                          onClick={() =>
                            handleUpdateAppointmentStatus(apt._id, "canceled")
                          }
                          type="button"
                        >
                          <FaTimes />{t("reject")}
                        </button>
                      </div>
                    )}
                    <div className="apt-details-column"><button type="button" className="apt-view-details" onClick={() => setDetailAppointment(apt)}><FaRegComment />{t("View Details")}<FaChevronRight /></button></div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      {detailAppointment && (
        <div className="apt-detail-backdrop" onClick={() => setDetailAppointment(null)}>
          <section className="apt-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="apt-detail-title" tabIndex={-1} ref={detailDialogRef} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => {
            if (event.key === "Escape") setDetailAppointment(null);
            if (event.key === "Tab") {
              event.preventDefault();
              detailDialogRef.current?.querySelector("button")?.focus();
            }
          }}>
            <header className="apt-detail-header">
              <div><span className="apt-detail-eyebrow">{t("appointments")}</span><h2 id="apt-detail-title">{t("Appointment Details")}</h2></div>
              <button type="button" className="apt-detail-close" aria-label={t("Close appointment details")} onClick={() => setDetailAppointment(null)}><span aria-hidden="true">&times;</span></button>
            </header>
            <div className="apt-detail-patient">
              <div className="apt-detail-avatar"><ParticipantPhoto src={getAppointmentDisplay(detailAppointment).avatarUrl || ""} name={getAppointmentDisplay(detailAppointment).name} fallback={<FaRegUser />} /></div>
              <div><h3>{getAppointmentDisplay(detailAppointment).name}</h3><span>{t(detailAppointment.follow_up_synced ? "Follow-up Session" : "initial_consultation")}</span></div>
              <span className={`status-badge-stitch ${detailAppointment.status || "pending"}`}>{t(String(detailAppointment.status || "pending").toLowerCase())}</span>
            </div>
            <div className="apt-detail-schedule">
              <div><FaCalendarAlt /><div><span>{t("Date")}</span><strong>{new Date(detailAppointment.date).toLocaleDateString(lang || undefined, { weekday: "short", month: "long", day: "numeric", year: "numeric" })}</strong></div></div>
              <div><FaClock /><div><span>{t("Time")}</span><strong>{new Date(detailAppointment.date).toLocaleTimeString(lang || undefined, { hour: "2-digit", minute: "2-digit" })}</strong></div></div>
              <div><FaVideo /><div><span>{t("Session type")}</span><strong>{t(detailAppointment.sessionType || "Video Session")}</strong></div></div>
            </div>
            {detailAppointment.symptoms && <div className="apt-detail-section"><h4>{t("Symptoms")}</h4><p>{detailAppointment.symptoms}</p></div>}
            {detailAppointment.diagnosis && <div className="apt-detail-section"><h4>{t("Diagnosis")}</h4><p>{detailAppointment.diagnosis}</p></div>}
            {detailAppointment.notes && <div className="apt-detail-section"><h4><FaRegFileAlt />{t("Notes")}</h4><p>{detailAppointment.notes}</p></div>}
          </section>
        </div>
      )}
    </div>
  );
}
