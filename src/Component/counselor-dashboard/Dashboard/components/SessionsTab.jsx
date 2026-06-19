// components/SessionsTab.js
import React from "react";
import {
  FaVideo,
  FaClock,
  FaCalendarAlt,
  FaUser,
  FaTimes,
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
  loading = false,
}) {
  const { t } = useCounselorTranslation();

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

  if (loading) {
    return (
      <div className="couns-tab-content-stitch">
        <CardSkeleton cards={6} />
      </div>
    );
  }

  return (
    <div className="couns-tab-content-stitch">
      <div className="stitch-session-layout">
        {/* Header with Date Filter */}
        <div className="stitch-session-header">
          <div className="stitch-session-header-left">
            <h2>{translate('sessions', 'Sessions')}</h2>
            <span className="stitch-session-count">
              {sessionAppointments.length} {translate('confirmed_sessions', 'Confirmed Sessions')}
            </span>
            <span className="stitch-session-today-badge">
              {translate('showing_for', 'Showing for')}: {getTodayDate()}
            </span>
          </div>
          <div className="stitch-date-filter">
            <FaCalendarAlt style={{ color: "#4648d4", fontSize: "14px" }} />
            <input
              type="date"
              className="stitch-date-input"
              value={sessionSelectedDate || ""}
              onChange={handleDateChange}
              title="Filter by date"
            />
            <button
              className="stitch-clear-filter"
              onClick={handleClearFilter}
              title="Show today's sessions"
            >
              <FaTimes size={10} />
            </button>
          </div>
        </div>

        {/* Sessions Grid */}
        <div className="stitch-session-grid">
          {sessionAppointments.length === 0 ? (
            <div className="stitch-empty-state-couns">
              {sessionSelectedDate 
                ? `${translate('no_sessions_for_date', 'No sessions for')} ${formatDateForDisplay(sessionSelectedDate)}`
                : translate('no_confirmed_sessions', 'No confirmed sessions')}
            </div>
          ) : (
            sessionAppointments
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map((apt) => {
                const anonymousUser = getAppointmentDisplay(apt);
                const isTodaySession = isToday(apt.date);
                const isUpcomingSession = isUpcoming(apt.date);
                const dateObj = new Date(apt.date);

                return (
                  <div key={apt._id} className="stitch-session-card">
                    <div className="stitch-session-card-header">
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
                        <div className="stitch-session-tags">
                          <span className={`stitch-session-status ${isTodaySession ? 'today' : isUpcomingSession ? 'upcoming' : 'past'}`}>
                            {isTodaySession 
                              ? translate('today', 'Today') 
                              : isUpcomingSession 
                                ? translate('upcoming', 'Upcoming') 
                                : translate('past', 'Past')}
                          </span>
                          <span className="stitch-session-type">
                            {translate('initial_consultation', 'Initial Consultation')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="stitch-session-details">
                      <div className="stitch-session-detail-item">
                        <FaCalendarAlt className="stitch-session-detail-icon" />
                        <span>
                          {dateObj.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="stitch-session-detail-item">
                        <FaClock className="stitch-session-detail-icon" />
                        <span>{formatTime(apt.date)}</span>
                      </div>
                      <div className="stitch-session-detail-item">
                        <FaUser className="stitch-session-detail-icon" />
                        <span>
                          {translate('session_duration', 'Duration')}: 45 {translate('minutes', 'minutes')}
                        </span>
                      </div>
                    </div>

                    {apt.notes && apt.notes.trim() !== "" && (
                      <div className="stitch-session-notes">
                        "{apt.notes}"
                      </div>
                    )}

                    <div className="stitch-session-actions">
                      <button
                        className="stitch-btn-start-call"
                        onClick={() => handleInitiateVideoCall(apt)}
                      >
                        <FaVideo />
                        {translate('start_video_call', 'Start Video Call')}
                      </button>
                      <button
                        className="stitch-btn-reschedule"
                        onClick={() => {
                          alert(translate('reschedule', 'Reschedule functionality coming soon!'));
                        }}
                      >
                        <FaClock />
                        {translate('reschedule', 'Reschedule')}
                      </button>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}
