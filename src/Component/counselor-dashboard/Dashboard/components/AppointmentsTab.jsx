import React from "react";
import { FaArrowRight, FaBrain, FaCalendarAlt, FaTimes } from "react-icons/fa";
import { getAnonymousUserDisplay } from "../../../../utils/anonymousUser";
import { useCounselorTranslation } from "../../../../i18n/LanguageContext";
import { CardSkeleton } from "../../../common/Skeletons/Skeletons";

export default function AppointmentsTab({
  appointments = [],
  selectedDate,
  setSelectedDate,
  clearDateFilter,
  handleViewAllRequests,
  handleUpdateAppointmentStatus,
  loading = false,
}) {
  const { t } = useCounselorTranslation();

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
    if (!selectedDate) {
      return appointments;
    }

    return appointments.filter((apt) => {
      const aptDate = new Date(apt.date).toISOString().split("T")[0];
      return aptDate === selectedDate;
    });
  }, [appointments, selectedDate]);

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";

    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
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
      <div className="stitch-apt-layout stitch-apt-layout-cards-only">
        <div className="stitch-apt-left">
          <div className="stitch-apt-header">
            <h2>{t("manage_appointments")}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="stitch-date-filter">
                <FaCalendarAlt style={{ color: "#4648d4", fontSize: "14px" }} />
                <input
                  type="date"
                  className="stitch-date-input"
                  value={selectedDate || ""}
                  onChange={handleDateChange}
                  title="Filter by date"
                />
                {selectedDate && (
                  <button
                    className="stitch-clear-filter"
                    onClick={handleClearFilter}
                    title="Clear date filter"
                    type="button"
                  >
                    <FaTimes size={10} />
                  </button>
                )}
              </div>
              <button type="button" onClick={handleViewAllRequests}>
                {t("view_all_requests")} <FaArrowRight style={{ marginLeft: "4px" }} />
              </button>
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

                      <div className={`status-badge-stitch ${apt.status}`}>
                        {apt.status.toUpperCase()}
                      </div>

                      {apt.notes && apt.notes.trim() !== "" && (
                        <div
                          style={{
                            marginTop: "16px",
                            padding: "12px",
                            backgroundColor: "#f8fafc",
                            borderRadius: "8px",
                            fontSize: "13px",
                            color: "#475569",
                            borderLeft: "3px solid #cbd5e1",
                            fontStyle: "italic",
                          }}
                        >
                          "{apt.notes}"
                        </div>
                      )}

                      <div className="stitch-apt-time">
                        <span className="stitch-apt-time-label">{t("requested")}</span>
                        <span className="stitch-apt-time-value">
                          {new Date(apt.date).toLocaleDateString("en-US", {
                            weekday: "short",
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
