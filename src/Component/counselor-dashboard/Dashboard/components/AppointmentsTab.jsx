import React from "react";
import { FaBrain, FaCalendarAlt, FaCheckCircle, FaClock, FaHistory, FaSearch, FaTimes } from "react-icons/fa";
import { getAnonymousUserDisplay } from "../../../../utils/anonymousUser";
import { useCounselorTranslation } from "../../../../i18n/LanguageContext";
import { getTimeGreetingKey } from "../../../../utils/timeGreeting";

export default function AppointmentsTab({
  appointments = [],
  counselorName = "",
  selectedDate,
  setSelectedDate,
  clearDateFilter,
  handleUpdateAppointmentStatus,
  loading = false,
}) {
  const { t, lang } = useCounselorTranslation();
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [searchTerm, setSearchTerm] = React.useState("");
  const displayCounselorName = React.useMemo(() => {
    const normalizedName = String(counselorName || "").trim();
    if (!normalizedName) return "Counselor";

    return /^dr\.?\s/i.test(normalizedName)
      ? normalizedName
      : `Dr. ${normalizedName}`;
  }, [counselorName]);

  const getAppointmentDisplay = (appointment) =>
    getAnonymousUserDisplay({
      ...appointment,
      ...(appointment?.user || appointment?.patient || appointment?.client || {}),
    });

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
      const matchesSearch = patientName.includes(searchTerm.trim().toLowerCase());
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
    <div className="couns-tab-content-stitch" aria-busy={loading}>
      <div className="stitch-apt-page-title">{t("appointments")}</div>
      <div className="stitch-apt-layout stitch-apt-layout-cards-only">
        <div className="stitch-apt-left">
          <section className="stitch-apt-summary">
            <div className="stitch-apt-summary-copy">
              <span>{t(getTimeGreetingKey())}</span>
              <h2>{displayCounselorName}</h2>
              <p>{counts.all} {t("appointments")}</p>
            </div>
            <div className="stitch-apt-metrics">
              <div><strong>{counts.pending}</strong><span>{t("pending")}</span></div>
              <div><strong>{counts.confirmed}</strong><span>{t("confirmed")}</span></div>
              <div><strong>{counts.today}</strong><span>{t("today")}</span></div>
            </div>
          </section>

          <div className="stitch-apt-toolbar">
            <label className="stitch-apt-search">
              <FaSearch aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t("search_patients")}
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
                  <button key={key} type="button" className={`stitch-apt-filter-tab ${statusFilter === key ? "active" : ""}`} onClick={() => setStatusFilter(key)}>
                    <TabIcon />
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
                    <div>
                      <div className="stitch-apt-card-top">
                        <div className="stitch-apt-avatar">
                          {anonymousUser.avatarUrl ? (
                            <img
                              src={anonymousUser.avatarUrl}
                              alt={anonymousUser.name}
                              className="stitch-apt-avatar-img"
                            />
                          ) : (
                            <span>{anonymousUser.avatar}</span>
                          )}
                        </div>
                        <div className="stitch-apt-info">
                          <h3>{anonymousUser.name}</h3>
                          <div className="stitch-apt-tag">
                            <FaBrain />
                            {t("initial_consultation").toUpperCase()}
                          </div>
                        </div>
                      </div>

                      <div className={`status-badge-stitch ${apt.status || "pending"}`}>
                        {t(String(apt.status || "pending").toLowerCase()).toUpperCase()}
                      </div>

                      {apt.notes && apt.notes.trim() !== "" && (
                        <div className="stitch-apt-notes">
                          "{apt.notes}"
                        </div>
                      )}

                      <div className="stitch-apt-time">
                        <span className="stitch-apt-time-label">{t("appointment_date")}</span>
                        <span className="stitch-apt-time-value">
                          {new Date(apt.date).toLocaleDateString(lang || undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                          {" • "}
                          {new Date(apt.date).toLocaleTimeString(lang || undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
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
                          {t("accept")}
                        </button>
                        <button
                          className="stitch-btn-reject"
                          onClick={() =>
                            handleUpdateAppointmentStatus(apt._id, "canceled")
                          }
                          type="button"
                        >
                          {t("reject")}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
