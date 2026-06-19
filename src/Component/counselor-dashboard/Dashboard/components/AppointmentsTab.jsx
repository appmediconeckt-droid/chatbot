// import React from "react";
// import {
//   FaCalendarAlt,
//   FaTimes,
//   FaArrowRight,
//   FaBrain,
//   FaVideo,
// } from "react-icons/fa";
// import { getAnonymousUserDisplay } from "../../../../utils/anonymousUser";
// import { useCounselorTranslation } from "../../../../i18n/LanguageContext";

// export default function AppointmentsTab({
//   appointments,
//   selectedDate,
//   setSelectedDate,
//   handleViewAllRequests,
//   handleUpdateAppointmentStatus,
//   handleInitiateVideoCall,
// }) {
//   const { t } = useCounselorTranslation();
//   const getAppointmentDisplay = (appointment) =>
//     getAnonymousUserDisplay({
//       ...appointment,
//       ...(appointment?.user || appointment?.patient || appointment?.client || {}),
//     });

//   return (
//     <div className="couns-tab-content-stitch">
//       <div className="stitch-apt-layout">
//         {/* Left Column: Manage Appointments */}
//         <div className="stitch-apt-left">
//           <div className="stitch-apt-header">
//             <h2>{t('manage_appointments')}</h2>
//             <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
//               <div className="stitch-date-filter">
//                 <FaCalendarAlt style={{ color: "#4648d4", fontSize: "14px" }} />
//                 <input
//                   type="date"
//                   className="stitch-date-input"
//                   value={selectedDate}
//                   onChange={(e) => setSelectedDate(e.target.value)}
//                   title="Filter by date"
//                 />
//                 {selectedDate && (
//                   <button
//                     className="stitch-clear-filter"
//                     onClick={() => setSelectedDate("")}
//                     title="Clear date filter"
//                   >
//                     <FaTimes size={10} />
//                   </button>
//                 )}
//               </div>
//               <button type="button" onClick={handleViewAllRequests}>
//                 {t('view_all_requests')} <FaArrowRight style={{ marginLeft: "4px" }} />
//               </button>
//             </div>
//           </div>

//           <div className="stitch-apt-grid">
//             {appointments.length === 0 ? (
//               <div className="stitch-empty-state-couns">
//                 {t('no_pending_appointments')}
//               </div>
//             ) : (
//               appointments.map((apt) => {
//                 const anonymousUser = getAppointmentDisplay(apt);

//                 return (
//                   <div
//                     key={apt._id}
//                     className="stitch-apt-card"
//                     style={{ position: "relative" }}
//                   >
//                     <div>
//                       <div className="stitch-apt-card-top">
//                         <div className="stitch-apt-avatar">
//                           {anonymousUser.avatarUrl ? (
//                             <img
//                               src={anonymousUser.avatarUrl}
//                               alt={anonymousUser.name}
//                               className="stitch-apt-avatar-img"
//                             />
//                           ) : (
//                             <span>{anonymousUser.avatar}</span>
//                           )}
//                         </div>
//                         <div className="stitch-apt-info">
//                           <h3>{anonymousUser.name}</h3>
//                           <div className="stitch-apt-tag">
//                             <FaBrain />
//                             {t('initial_consultation').toUpperCase()}
//                           </div>
//                         </div>
//                       </div>

//                       <div className={`status-badge-stitch ${apt.status}`}>
//                         {apt.status.toUpperCase()}
//                       </div>

//                       {apt.notes && apt.notes.trim() !== "" && (
//                         <div
//                           style={{
//                             marginTop: "16px",
//                             padding: "12px",
//                             backgroundColor: "#f8fafc",
//                             borderRadius: "8px",
//                             fontSize: "13px",
//                             color: "#475569",
//                             borderLeft: "3px solid #cbd5e1",
//                             fontStyle: "italic",
//                           }}
//                         >
//                           "{apt.notes}"
//                         </div>
//                       )}

//                       <div className="stitch-apt-time">
//                         <span className="stitch-apt-time-label">{t('requested')}</span>
//                         <span className="stitch-apt-time-value">
//                           {new Date(apt.date).toLocaleDateString("en-US", {
//                             weekday: "short",
//                             hour: "2-digit",
//                             minute: "2-digit",
//                           })}
//                         </span>
//                       </div>
//                     </div>

//                     {apt.status === "pending" && (
//                       <div className="stitch-apt-actions">
//                         <button
//                           className="stitch-btn-accept"
//                           onClick={() =>
//                             handleUpdateAppointmentStatus(apt._id, "confirmed")
//                           }
//                         >
//                           {t('accept')}
//                         </button>
//                         <button
//                           className="stitch-btn-reject"
//                           onClick={() =>
//                             handleUpdateAppointmentStatus(apt._id, "canceled")
//                           }
//                         >
//                           {t('reject')}
//                         </button>
//                       </div>
//                     )}
//                   </div>
//                 );
//               })
//             )}
//           </div>
//         </div>

//         {/* Right Column: Schedule & Notes */}
//         <div className="stitch-apt-right">
//           <div className="stitch-schedule-section">
//             <div className="stitch-section-header">
//               <h3>{t('appointments_timeline')}</h3>
//               <span className="stitch-date-badge">
//                 {new Date()
//                   .toLocaleDateString("en-US", {
//                     weekday: "short",
//                     month: "short",
//                     day: "numeric",
//                   })
//                   .toUpperCase()}
//               </span>
//             </div>

//             <div className="stitch-schedule-list">
//               {appointments.filter((apt) => apt.status === "confirmed")
//                 .length === 0 ? (
//                 <div
//                   style={{
//                     padding: "24px",
//                     textAlign: "center",
//                     color: "#64748b",
//                     fontStyle: "italic",
//                     fontSize: "14px",
//                   }}
//                 >
//                   {t('no_confirmed_appointments')}
//                 </div>
//               ) : (
//                 appointments
//                   .filter((apt) => apt.status === "confirmed")
//                   .sort((a, b) => new Date(a.date) - new Date(b.date))
//                   .map((apt, index) => {
//                     const anonymousUser = getAppointmentDisplay(apt);
//                     const dateObj = new Date(apt.date);
//                     const timeParts = dateObj
//                       .toLocaleTimeString("en-US", {
//                         hour: "2-digit",
//                         minute: "2-digit",
//                       })
//                       .split(" ");
//                     const timeStr = timeParts[0];
//                     const ampm = timeParts[1];
//                     const colors = ["blue", "indigo", "gray"];
//                     const color = colors[index % colors.length];
//                     const isToday =
//                       dateObj.toDateString() === new Date().toDateString();

//                     return (
//                       <div key={apt._id} className="stitch-schedule-item">
//                         <div className="stitch-schedule-time">
//                           <div className="stitch-schedule-time-hh">
//                             {timeStr}
//                           </div>
//                           <div className="stitch-schedule-time-ampm">
//                             {ampm}
//                           </div>
//                         </div>
//                         <div className={`stitch-schedule-line ${color}`}></div>
//                         <div className="stitch-schedule-details">
//                           <div className="stitch-schedule-name">
//                             {anonymousUser.name}
//                           </div>
//                           <div className="stitch-schedule-type">
//                             {!isToday && (
//                               <span
//                                 style={{
//                                   fontWeight: "600",
//                                   color: "#4648d4",
//                                   marginRight: "4px",
//                                 }}
//                               >
//                                 {dateObj.toLocaleDateString("en-US", {
//                                   month: "short",
//                                   day: "numeric",
//                                 })}
//                               </span>
//                             )}
//                             {t('initial_consultation')}
//                           </div>
//                         </div>
//                         <div
//                           style={{
//                             cursor: "pointer",
//                             padding: "8px",
//                             display: "flex",
//                             alignItems: "center",
//                             justifyContent: "center",
//                             backgroundColor: "#eef2ff",
//                             color: "#4f46e5",
//                             borderRadius: "50%",
//                             transition: "all 0.2s",
//                           }}
//                           onClick={() => handleInitiateVideoCall(apt)}
//                           title="Start Video Call"
//                           onMouseEnter={(e) => {
//                             e.currentTarget.style.backgroundColor = "#4f46e5";
//                             e.currentTarget.style.color = "white";
//                           }}
//                           onMouseLeave={(e) => {
//                             e.currentTarget.style.backgroundColor = "#eef2ff";
//                             e.currentTarget.style.color = "#4f46e5";
//                           }}
//                         >
//                           <FaVideo
//                             className="stitch-schedule-icon"
//                             style={{ margin: 0, color: "inherit" }}
//                           />
//                         </div>
//                       </div>
//                     );
//                   })
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


import React from "react";
import {
  FaCalendarAlt,
  FaTimes,
  FaArrowRight,
  FaBrain,
  FaVideo,
} from "react-icons/fa";
import { getAnonymousUserDisplay } from "../../../../utils/anonymousUser";
import { useCounselorTranslation } from "../../../../i18n/LanguageContext";
import { CardSkeleton } from "../../../common/Skeletons/Skeletons";

export default function AppointmentsTab({
 appointments,
  selectedDate,
  setSelectedDate,
  clearDateFilter, // ✅ Add this prop
  handleViewAllRequests,
  handleUpdateAppointmentStatus,
  handleInitiateVideoCall,
  loading = false,
}) {
  const { t } = useCounselorTranslation();
  const getAppointmentDisplay = (appointment) =>
    getAnonymousUserDisplay({
      ...appointment,
      ...(appointment?.user || appointment?.patient || appointment?.client || {}),
    });


    const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
  };

  // ✅ Clear filter handler
  const handleClearFilter = () => {
    if (clearDateFilter) {
      clearDateFilter();
    } else {
      setSelectedDate("");
    }
  };

  // ✅ FILTERING LOGIC - Sirf tab filter karein jab selectedDate set ho
  const filteredAppointments = React.useMemo(() => {
    if (!selectedDate) {
      return appointments; // ✅ By default saare appointments show karein
    }
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.date).toISOString().split('T')[0];
      return aptDate === selectedDate;
    });
  }, [appointments, selectedDate]);

  // ✅ Confirmed appointments bhi filter karein based on selectedDate
  const filteredConfirmedAppointments = React.useMemo(() => {
    if (!selectedDate) {
      return appointments.filter((apt) => apt.status === "confirmed");
    }
    return filteredAppointments.filter((apt) => apt.status === "confirmed");
  }, [appointments, filteredAppointments, selectedDate]);

  // ✅ Date ko format karein display ke liye
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
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
      <div className="stitch-apt-layout">
        {/* Left Column: Manage Appointments */}
        <div className="stitch-apt-left">
          <div className="stitch-apt-header">
            <h2>{t('manage_appointments')}</h2>
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
                  >
                    <FaTimes size={10} />
                  </button>
                )}
              </div>
              <button type="button" onClick={handleViewAllRequests}>
                {t('view_all_requests')} <FaArrowRight style={{ marginLeft: "4px" }} />
              </button>
            </div>
          </div>

          <div className="stitch-apt-grid">
            {appointments.length === 0 ? (
              <div className="stitch-empty-state-couns">
                {selectedDate 
                  ? `${t('no_appointments_for_date')} ${formatDateForDisplay(selectedDate)}`
                  : t('no_pending_appointments')}
              </div>
            ) : (
              appointments.map((apt) => {
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
                            {t('initial_consultation').toUpperCase()}
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
                        <span className="stitch-apt-time-label">{t('requested')}</span>
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
                        >
                          {t('accept')}
                        </button>
                        <button
                          className="stitch-btn-reject"
                          onClick={() =>
                            handleUpdateAppointmentStatus(apt._id, "canceled")
                          }
                        >
                          {t('reject')}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Schedule & Notes */}
        <div className="stitch-apt-right">
          <div className="stitch-schedule-section">
            <div className="stitch-section-header">
              <h3>{t('appointments_timeline')}</h3>
              <span className="stitch-date-badge">
                {new Date()
                  .toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })
                  .toUpperCase()}
              </span>
            </div>

            <div className="stitch-schedule-list">
              {appointments.filter((apt) => apt.status === "confirmed")
                .length === 0 ? (
                <div
                  style={{
                    padding: "24px",
                    textAlign: "center",
                    color: "#64748b",
                    fontStyle: "italic",
                    fontSize: "14px",
                  }}
                >
                  {selectedDate
                    ? `${t('no_confirmed_appointments_for_date')} ${formatDateForDisplay(selectedDate)}`
                    : t('no_confirmed_appointments')}
                </div>
              ) : (
                appointments
                  .filter((apt) => apt.status === "confirmed")
                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                  .map((apt, index) => {
                    const anonymousUser = getAppointmentDisplay(apt);
                    const dateObj = new Date(apt.date);
                    const timeParts = dateObj
                      .toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      .split(" ");
                    const timeStr = timeParts[0];
                    const ampm = timeParts[1];
                    const colors = ["blue", "indigo", "gray"];
                    const color = colors[index % colors.length];
                    const isToday =
                      dateObj.toDateString() === new Date().toDateString();

                    return (
                      <div key={apt._id} className="stitch-schedule-item">
                        <div className="stitch-schedule-time">
                          <div className="stitch-schedule-time-hh">
                            {timeStr}
                          </div>
                          <div className="stitch-schedule-time-ampm">
                            {ampm}
                          </div>
                        </div>
                        <div className={`stitch-schedule-line ${color}`}></div>
                        <div className="stitch-schedule-details">
                          <div className="stitch-schedule-name">
                            {anonymousUser.name}
                          </div>
                          <div className="stitch-schedule-type">
                            {!isToday && (
                              <span
                                style={{
                                  fontWeight: "600",
                                  color: "#4648d4",
                                  marginRight: "4px",
                                }}
                              >
                                {dateObj.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            )}
                            {t('initial_consultation')}
                          </div>
                        </div>
                        <div
                          style={{
                            cursor: "pointer",
                            padding: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#eef2ff",
                            color: "#4f46e5",
                            borderRadius: "50%",
                            transition: "all 0.2s",
                          }}
                          onClick={() => handleInitiateVideoCall(apt)}
                          title="Start Video Call"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#4f46e5";
                            e.currentTarget.style.color = "white";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#eef2ff";
                            e.currentTarget.style.color = "#4f46e5";
                          }}
                        >
                          <FaVideo
                            className="stitch-schedule-icon"
                            style={{ margin: 0, color: "inherit" }}
                          />
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}