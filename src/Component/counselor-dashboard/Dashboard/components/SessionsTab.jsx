// components/SessionsTab.js
import React from "react";
import {
  FaVideo,
  FaPhoneAlt,
  FaComments,
  FaClock,
  FaCalendarAlt,
  FaUser,
  FaVideoSlash,
  FaRedoAlt,
  FaMagic,
  FaShieldAlt,
  FaQuoteLeft,
  FaBriefcaseMedical,
} from "react-icons/fa";
import { getAnonymousUserDisplay } from "../../../../utils/anonymousUser";
import { useCounselorTranslation } from "../../../../i18n/LanguageContext";

export default function SessionsTab({
  sessionAppointments,
  sessionSelectedDate,
  setSessionSelectedDate,
  clearSessionDateFilter,
  handleInitiateVideoCall,
  handleInitiateVoiceCall,
  handleOpenAppointmentChat,
  loading = false,
}) {
  const { t, lang } = useCounselorTranslation();
  const [sessionFilter, setSessionFilter] = React.useState("all");
  const [selectedSession, setSelectedSession] = React.useState(null);

  // ✅ Helper function with fallback
  const translate = (key, fallback) => {
    try {
      const result = t(key);
      return result && result !== key ? result : fallback;
    } catch {
      return fallback;
    }
  };

  const getAppointmentDisplay = (appointment) =>
    getAnonymousUserDisplay({
      ...appointment,
      ...(appointment?.user || appointment?.patient || appointment?.client || {}),
    });

  // ✅ Date change handler
  const handleDateChange = (e) => {
    const date = e.target.value;
    setSessionSelectedDate(date);
  };

  // ✅ Clear filter handler - Reset to today
  const handleClearFilter = () => {
    if (clearSessionDateFilter) {
      clearSessionDateFilter();
    } else {
      const today = new Date().toISOString().split('T')[0];
      setSessionSelectedDate(today);
    }
  };

  // ✅ Format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(lang || 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // ✅ Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(lang || 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ✅ Check if appointment is today
  const isToday = (dateString) => {
    const date = new Date(dateString);
    return date.toDateString() === new Date().toDateString();
  };

  // ✅ Check if appointment is upcoming
  const isUpcoming = (dateString) => {
    const date = new Date(dateString);
    return date > new Date();
  };

  // ✅ Get today's date for display
  const getTodayDate = () => {
    const today = new Date();
    return today.toLocaleDateString(lang || 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleViewTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const localDate = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];
    setSessionSelectedDate(localDate);
  };

  const visibleSessions = React.useMemo(() => {
    return sessionAppointments.filter((appointment) => {
      if (sessionFilter === "today") return isToday(appointment.date);
      if (sessionFilter === "upcoming") return isUpcoming(appointment.date) && !isToday(appointment.date);
      if (sessionFilter === "past") return !isUpcoming(appointment.date) && !isToday(appointment.date);
      return true;
    });
  }, [sessionAppointments, sessionFilter]);

  const sessionCounts = React.useMemo(() => ({
    all: sessionAppointments.length,
    today: sessionAppointments.filter((appointment) => isToday(appointment.date)).length,
    upcoming: sessionAppointments.filter((appointment) => isUpcoming(appointment.date) && !isToday(appointment.date)).length,
    past: sessionAppointments.filter((appointment) => !isUpcoming(appointment.date) && !isToday(appointment.date)).length,
  }), [sessionAppointments]);

  const daySummary = React.useMemo(() => {
    const now = new Date();
    const completed = visibleSessions.filter((appointment) =>
      ["completed", "done"].includes(String(appointment.status || "").toLowerCase())
    ).length;
    const inProgress = visibleSessions.filter((appointment) => {
      const status = String(appointment.status || "").toLowerCase();
      if (["in-progress", "in_progress", "ongoing"].includes(status)) return true;
      const start = new Date(appointment.date);
      const duration = Number(appointment.duration || 45);
      const end = new Date(start.getTime() + duration * 60000);
      return now >= start && now <= end && !["completed", "cancelled", "rejected"].includes(status);
    }).length;
    return {
      total: visibleSessions.length,
      completed,
      inProgress,
      remaining: Math.max(0, visibleSessions.length - completed - inProgress),
    };
  }, [visibleSessions]);

  return (
    <div className="couns-tab-content-stitch couns-sessions-page" aria-busy={loading}>
      <header className="couns-sessions-page-title">
        <h1>{t("counselling_sessions_overview")}</h1>
      </header>

      <div className="stitch-session-layout">
        {/* Header with Date Filter */}
        <div className="stitch-session-header">
          <div className="stitch-session-header-left">
            <div className="stitch-session-heading-row">
              <h2>{translate('sessions', 'Sessions')}</h2>
              <span className="stitch-session-count">
                {sessionAppointments.length} {translate('confirmed', 'Confirmed')}
              </span>
            </div>
            <div className="stitch-session-header-meta">
              <span>{translate('showing_for', 'Showing for')}:</span>
              <strong>{sessionSelectedDate ? formatDateForDisplay(sessionSelectedDate) : getTodayDate()}</strong>
            </div>
          </div>
          <div className="stitch-date-filter">
            <FaCalendarAlt />
            <input
              type="date"
              className="stitch-date-input"
              value={sessionSelectedDate || ""}
              onChange={handleDateChange}
              title={t("sessions.filterByDate")}
            />
          </div>
        </div>

        {sessionAppointments.length > 0 && (
          <div className="stitch-apt-filter-scroll stitch-session-filter-row">
          <div className="stitch-apt-filter-tabs">
            {[
              ["all", translate("all", "All")],
              ["today", translate("today", "Today")],
              ["upcoming", translate("upcoming", "Upcoming")],
              ["past", translate("past", "Past")],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`stitch-apt-filter-tab ${sessionFilter === key ? "active" : ""}`}
                onClick={() => setSessionFilter(key)}
              >
                <span>{label}</span>
                <b>{sessionCounts[key]}</b>
              </button>
            ))}
          </div>
          </div>
        )}

        {/* Sessions Grid */}
        <div className={`stitch-session-grid ${visibleSessions.length ? "has-sessions" : ""}`}>
          {visibleSessions.length === 0 ? (
            <div className="stitch-empty-state-couns">
              <div className="stitch-empty-session-icon" aria-hidden="true">
                <FaVideoSlash />
              </div>
              <h3>{isToday(sessionSelectedDate || new Date()) ? t("sessions.noSessionsToday") : t("sessions.noSessionsDay")}</h3>
              <p>{t("sessions.emptyDescription")}</p>
              <div className="stitch-empty-session-actions">
                <button type="button" className="primary" onClick={handleClearFilter}>
                  <FaRedoAlt /> {t("sessions.refreshSchedule")}
                </button>
                <button type="button" onClick={handleViewTomorrow}>{t("view_tomorrow")}</button>
              </div>
            </div>
          ) : (
            <>
            <div className="stitch-scheduled-session-list">
            {[...visibleSessions]
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map((apt) => {
                const anonymousUser = getAppointmentDisplay(apt);
                const dateObj = new Date(apt.date);
                const duration = Number(apt.duration || 45);
                const endDate = new Date(dateObj.getTime() + duration * 60000);
                const status = String(apt.status || "").toLowerCase();
                const now = new Date();
                const sessionInProgress =
                  ["in-progress", "in_progress", "ongoing"].includes(status) ||
                  (now >= dateObj && now <= endDate && !["completed", "cancelled", "rejected"].includes(status));

                return (
                  <div key={apt._id} className="stitch-session-card">
                    <div className="stitch-session-timebar">
                      <span><FaClock /> {formatTime(dateObj)} - {formatTime(endDate)}</span>
                      {sessionInProgress && <b>● {t("in_progress")}</b>}
                    </div>
                    <div className="stitch-session-card-body">
                      <div className="stitch-session-avatar">
                        {anonymousUser.avatarUrl ? (
                          <img
                            src={anonymousUser.avatarUrl}
                            alt={anonymousUser.name}
                            className="stitch-session-avatar-img"
                          />
                        ) : (
                          <span>{anonymousUser.avatar}</span>
                        )}
                      </div>
                      <div className="stitch-session-info">
                        <h3>{anonymousUser.name}</h3>
                        <p><FaUser /> {apt.notes || translate('initial_consultation', 'General Consultation')}</p>
                      </div>
                      <button
                        className={`stitch-session-action-btn ${sessionInProgress ? "stitch-session-video-btn" : "stitch-session-details-btn"}`}
                        onClick={() => sessionInProgress ? handleInitiateVideoCall(apt) : setSelectedSession(apt)}
                        title={translate('start_video_call', 'Start Video Call')}
                        aria-label={translate('start_video_call', 'Start Video Call')}
                      >
                        {sessionInProgress && <FaVideo aria-hidden="true" />}
                        <span>{sessionInProgress ? t("sessions.conductSession") : t("sessions.viewDetails")}</span>
                      </button>
                      <button
                        className="stitch-session-action-btn stitch-session-voice-btn"
                        onClick={() =>
                          (handleInitiateVoiceCall || ((appointment) =>
                            handleInitiateVideoCall(appointment, "audio")))(apt)
                        }
                        title={translate('start_voice_call', 'Start Voice Call')}
                        aria-label={translate('start_voice_call', 'Start Voice Call')}
                      >
                        <FaPhoneAlt aria-hidden="true" />
                      </button>
                      <button
                        className="stitch-session-action-btn stitch-session-chat-btn"
                        onClick={() => handleOpenAppointmentChat?.(apt)}
                        title={translate('open_chat', 'Open Chat')}
                        aria-label={translate('open_chat', 'Open Chat')}
                      >
                        <FaComments aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <aside className="stitch-session-day-summary">
              <h3><FaMagic /> {t("day_summary")}</h3>
              <div><span>{t("total_sessions")}</span><b>{daySummary.total}</b></div>
              <div><span>{t("completed")}</span><b>{daySummary.completed}</b></div>
              <div className="in-progress"><span>{t("in_progress")}</span><b>{daySummary.inProgress}</b></div>
              <div><span>{t("remaining")}</span><b>{daySummary.remaining}</b></div>
              <footer><span>{t("system_normal")}</span></footer>
            </aside>
            </>
          )}
        </div>
      </div>

      {selectedSession && (() => {
        const patient = getAppointmentDisplay(selectedSession);
        const startDate = new Date(selectedSession.date);
        const duration = Number(selectedSession.duration || 45);
        const endDate = new Date(startDate.getTime() + duration * 60000);
        const status = String(selectedSession.status || "confirmed").toLowerCase();
        const sessionInProgress = ["in-progress", "in_progress", "ongoing"].includes(status) ||
          (new Date() >= startDate && new Date() <= endDate && !["completed", "cancelled", "rejected"].includes(status));
        return (
          <div className="stitch-session-modal-backdrop" role="presentation" onMouseDown={() => setSelectedSession(null)}>
            <section
              className="stitch-session-details-modal"
              role="dialog"
              aria-modal="true"
              aria-label={t("sessions.sessionDetails")}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <header>
                <div className="stitch-session-modal-avatar">
                  {patient.avatarUrl ? <img src={patient.avatarUrl} alt={patient.name} /> : <span>{patient.avatar}</span>}
                </div>
                <div>
                  <h2>{patient.name}</h2>
                  <p>{selectedSession.gender || t("sessions.patient")} • {selectedSession.age ? `${selectedSession.age} ${t("years")}` : t("sessions.privateProfile")}</p>
                  <span><FaShieldAlt /> {t("returning_patient")}</span>
                </div>
                <button type="button" onClick={() => setSelectedSession(null)} aria-label={t("sessions.closeDetails")}>×</button>
              </header>

              <div className="stitch-session-modal-content">
                <div className="stitch-session-detail-pills">
                  <span className={sessionInProgress ? "progress" : ""}>● {sessionInProgress ? t("in_progress") : t("confirmed")}</span>
                  <span><FaCalendarAlt /> {formatDateForDisplay(selectedSession.date)}</span>
                  <span><FaClock /> {formatTime(startDate)} – {formatTime(endDate)}</span>
                  <span><FaVideo /> {t("video_session")}</span>
                </div>

                <div className="stitch-session-reason-card">
                  <h3><FaBriefcaseMedical /> {t("sessions.reason")}: {selectedSession.reason || selectedSession.title || t("sessions.consultationFollowUp")}</h3>
                  <blockquote>
                    <FaQuoteLeft />
                    <span>{selectedSession.notes || t("sessions.noAdditionalNotes")}</span>
                  </blockquote>
                </div>
              </div>

              <footer>
                <button type="button" onClick={() => {
                  setSelectedSession(null);
                  handleInitiateVideoCall(selectedSession);
                }}>
                  <FaVideo /> {t("sessions.startSession")}
                </button>
              </footer>
            </section>
          </div>
        );
      })()}
    </div>
  );
}
