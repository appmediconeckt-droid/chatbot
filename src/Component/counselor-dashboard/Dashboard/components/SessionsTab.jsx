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
import { CardSkeleton } from "../../../common/Skeletons/Skeletons";

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
  const { t } = useCounselorTranslation();
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
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // ✅ Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
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
    return today.toLocaleDateString('en-US', {
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

  if (loading) {
    return (
      <div className="couns-tab-content-stitch">
        <CardSkeleton cards={6} />
      </div>
    );
  }

  return (
    <div className="couns-tab-content-stitch couns-sessions-page">
      <header className="couns-sessions-page-title">
        <h1>Counselling Sessions Overview</h1>
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
              title="Filter by date"
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
              <h3>{isToday(sessionSelectedDate || new Date()) ? "No sessions today" : "No sessions for this day"}</h3>
              <p>
                Your confirmed sessions for the selected day will appear
                <br />
                here. Enjoy the downtime or check upcoming dates.
              </p>
              <div className="stitch-empty-session-actions">
                <button type="button" className="primary" onClick={handleClearFilter}>
                  <FaRedoAlt /> Refresh Schedule
                </button>
                <button type="button" onClick={handleViewTomorrow}>View Tomorrow</button>
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
                      {sessionInProgress && <b>● IN PROGRESS</b>}
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
                        <span>{sessionInProgress ? "Conduct Session" : "View Details"}</span>
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
              <h3><FaMagic /> Day Summary</h3>
              <div><span>Total Sessions</span><b>{daySummary.total}</b></div>
              <div><span>Completed</span><b>{daySummary.completed}</b></div>
              <div className="in-progress"><span>In Progress</span><b>{daySummary.inProgress}</b></div>
              <div><span>Remaining</span><b>{daySummary.remaining}</b></div>
              <footer><span>System Normal</span></footer>
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
              aria-label="Session details"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <header>
                <div className="stitch-session-modal-avatar">
                  {patient.avatarUrl ? <img src={patient.avatarUrl} alt={patient.name} /> : <span>{patient.avatar}</span>}
                </div>
                <div>
                  <h2>{patient.name}</h2>
                  <p>{selectedSession.gender || "Patient"} • {selectedSession.age ? `${selectedSession.age} Years` : "Private profile"}</p>
                  <span><FaShieldAlt /> Returning Patient</span>
                </div>
                <button type="button" onClick={() => setSelectedSession(null)} aria-label="Close session details">×</button>
              </header>

              <div className="stitch-session-modal-content">
                <div className="stitch-session-detail-pills">
                  <span className={sessionInProgress ? "progress" : ""}>● {sessionInProgress ? "In Progress" : "Confirmed"}</span>
                  <span><FaCalendarAlt /> {formatDateForDisplay(selectedSession.date)}</span>
                  <span><FaClock /> {formatTime(startDate)} – {formatTime(endDate)}</span>
                  <span><FaVideo /> Video Session</span>
                </div>

                <div className="stitch-session-reason-card">
                  <h3><FaBriefcaseMedical /> Reason: {selectedSession.reason || selectedSession.title || "Consultation Follow-up"}</h3>
                  <blockquote>
                    <FaQuoteLeft />
                    <span>{selectedSession.notes || "No additional notes were provided for this session."}</span>
                  </blockquote>
                </div>
              </div>

              <footer>
                <button type="button" onClick={() => {
                  setSelectedSession(null);
                  handleInitiateVideoCall(selectedSession);
                }}>
                  <FaVideo /> Start Session
                </button>
              </footer>
            </section>
          </div>
        );
      })()}
    </div>
  );
}
