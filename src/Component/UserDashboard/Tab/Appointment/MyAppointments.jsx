import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../../axiosConfig";
import { useUserTranslation } from "../../../../i18n/LanguageContext";
import VideoCallModal from "../CallModal/VideoCallModal";
import './MyAppointments.css'; // Import the CSS file for styling
const MyAppointments = () => {
  const { t } = useUserTranslation();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedApt, setSelectedApt] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedCounselorId, setSelectedCounselorId] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);

  const token =
    localStorage.getItem("token") || localStorage.getItem("accessToken");

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    const fetchCounselors = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/auth/counsellors`);
        const list =
          response.data?.counsellors || response.data?.counselors || [];
        setCounselors(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Error fetching counselors:", err);
      }
    };

    fetchCounselors();
  }, []);

  // Filter by tab
  const upcomingApts = appointments.filter(
    (apt) => apt.status !== "completed" && apt.status !== "canceled",
  );
  const pastApts = appointments.filter(
    (apt) => apt.status === "completed" || apt.status === "canceled",
  );
  let displayApts = activeTab === "Upcoming" ? upcomingApts : pastApts;

  // Filter by status
  if (statusFilter === "Pending") {
    displayApts = displayApts.filter((apt) => apt.status === "pending");
  } else if (statusFilter === "Confirmed") {
    displayApts = displayApts.filter((apt) => apt.status === "confirmed");
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-indigo-50 text-indigo-600";
      case "completed":
        return "bg-emerald-50 text-emerald-600";
      case "canceled":
        return "bg-red-50 text-red-500";
      default:
        return "bg-amber-50 text-amber-600";
    }
  };

  const getAvatarSrc = (apt) => {
    if (apt.counselor?.profilePhoto) {
      return typeof apt.counselor.profilePhoto === "string"
        ? apt.counselor.profilePhoto
        : apt.counselor.profilePhoto.url;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.counselor?.fullName || "C")}&background=e0e7ff&color=4648d4&bold=true`;
  };

  const formatAppointmentDateTime = (date) => {
    const appointmentDate = new Date(date);
    if (Number.isNaN(appointmentDate.getTime())) {
      return { date: "Date not available", time: "" };
    }

    return {
      date: appointmentDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: appointmentDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const resetBookingForm = () => {
    setSelectedCounselorId("");
    setBookingDate("");
    setBookingNotes("");
  };

  const handleBookNewClick = () => {
    resetBookingForm();
    setShowBookingModal(true);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();

    if (!selectedCounselorId) {
      alert(t('please_select_counselor'));
      return;
    }

    if (!bookingDate) {
      alert(t('please_select_date_time'));
      return;
    }

    try {
      setBookingLoading(true);
      await axios.post(
        `${API_BASE_URL}/api/appointments`,
        {
          counselorId: selectedCounselorId,
          date: bookingDate,
          notes: bookingNotes,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      alert(t('appointment_booked_success'));
      setShowBookingModal(false);
      resetBookingForm();
      fetchAppointments();
    } catch (error) {
      console.error("Error booking appointment:", error);
      alert(error?.response?.data?.message || "Failed to book appointment");
    } finally {
      setBookingLoading(false);
    }
  };

  const getCounselorId = (apt) =>
    apt?.counselor?._id || apt?.counselor?.id || apt?.counselorId;

  const handleChat = async (apt) => {
    const counselorId = getCounselorId(apt);
    if (!counselorId) return alert("Counselor information is unavailable.");

    try {
      setActionLoading(`chat-${apt._id}`);
      const response = await axios.post(
        `${API_BASE_URL}/api/chat/start`,
        { counselorId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const chatId = response.data?.chat?.id || response.data?.chatId;
      navigate(`/chat/${counselorId}`, {
        state: { chatId, counselor: apt.counselor },
      });
    } catch (error) {
      const existingChatId = error?.response?.data?.chatId;
      if (existingChatId) {
        navigate(`/chat/${counselorId}`, {
          state: { chatId: existingChatId, counselor: apt.counselor },
        });
        return;
      }
      alert(error?.response?.data?.message || "Unable to start chat. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCall = async (apt, mode) => {
    const counselorId = getCounselorId(apt);
    const userId = localStorage.getItem("userId");
    if (!counselorId || !userId) return alert("Call information is unavailable. Please login again.");

    try {
      setActionLoading(`${mode}-${apt._id}`);
      const response = await axios.post(
        `${API_BASE_URL}/api/video/calls/initiate`,
        {
          initiatorId: userId,
          initiatorType: "user",
          receiverId: counselorId,
          receiverType: "counsellor",
          callType: mode === "voice" ? "audio" : "video",
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.data?.success) throw new Error(response.data?.message || "Call request failed");
      const callData = response.data.callData || {};
      setSelectedCall({
        id: callData.id || response.data.callId,
        callId: response.data.callId || callData.callId,
        roomId: response.data.roomId || callData.roomId,
        name: callData.receiver?.displayName || callData.receiver?.fullName || apt.counselor?.fullName || "Counselor",
        type: mode,
        callType: mode,
        status: response.data.status || "pending",
        profilePic: callData.receiver?.profilePhoto || apt.counselor?.profilePhoto?.url || apt.counselor?.profilePhoto || null,
        apiCallData: callData,
        initiator: callData.initiator,
        receiver: callData.receiver,
        currentUserId: userId,
        currentUserType: "user",
      });
      setIsCallModalOpen(true);
    } catch (error) {
      alert(error?.response?.data?.message || `Unable to start ${mode} call. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEndCall = async (callId) => {
    if (!callId) return;
    try {
      await axios.put(
        `${API_BASE_URL}/api/video/calls/${callId}/end`,
        { userId: localStorage.getItem("userId"), endedBy: "user" },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (error) {
      console.warn("Could not end appointment call:", error);
    }
  };

  return (
    <div
      className="flex w-full gap-0 bg-[#f8f9ff] min-h-screen"
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      {/* ── Main Content ── */}
      <main className="flex-1 p-4 sm:p-8 min-w-0">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-[32px] font-[700] leading-[40px] tracking-[-0.02em] text-[#0b1c30]">
              {t('my_appointments')}
            </h1>
            <p className="text-[#464554] text-[16px] mt-1">
              {t('manage_consultations')}
            </p>
          </div>
          {/* Tab Toggle */}
          <div className="bg-[#eff4ff] p-1 rounded-xl flex shrink-0">
            <button
              onClick={() => setActiveTab("Upcoming")}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "Upcoming" ? "bg-white shadow-sm text-[#4648d4]" : "text-[#464554] hover:text-[#0b1c30]"}`}
            >
              {t('upcoming')}
            </button>
            <button
              onClick={() => setActiveTab("Past")}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "Past" ? "bg-white shadow-sm text-[#4648d4]" : "text-[#464554] hover:text-[#0b1c30]"}`}
            >
              {t('past')}
            </button>
          </div>
        </header>

        {/* Status Filter Dropdown */}
        <div className="flex justify-end mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-[#0b1c30] font-medium shadow-sm focus:outline-none"
            style={{ minWidth: 160 }}
          >
            <option value="All">{t('all_statuses')}</option>
            <option value="Pending">{t('pending')}</option>
            <option value="Confirmed">{t('accepted')}</option>
          </select>
        </div>

        {/* Appointment Cards */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4648d4]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 mb-8">
            {displayApts.length === 0 ? (
              <div className="bg-white rounded-xl p-8 sm:p-16 border border-dashed border-slate-200 text-center shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
                <span className="material-symbols-outlined text-slate-300 text-5xl block mb-3">
                  calendar_today
                </span>
                <p className="text-[#464554] text-sm">
                  {t('no_appointments_found').replace('{tab}', activeTab.toLowerCase())}
                </p>
              </div>
            ) : (
              displayApts.map((apt) => {
                const appointmentSchedule = formatAppointmentDateTime(apt.date);

                return (
                  <div
                  key={apt._id}
                  className="bg-white rounded-xl p-5 sm:p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col md:flex-row gap-4 sm:gap-6 items-start hover:shadow-md transition-shadow"
                >
                  {/* Doctor Photo */}
                  <div className="flex-shrink-0">
                    <img
                      alt={apt.counselor?.fullName}
                      src={getAvatarSrc(apt)}
                      className="w-24 h-24 rounded-2xl object-cover ring-4 ring-indigo-50"
                    />
                  </div>

                  {/* Card Body */}
                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${getStatusStyle(apt.status)}`}
                        >
                          {apt.status}
                        </span>
                        <h2 className="text-[22px] font-[600] leading-[30px] text-[#0b1c30] mt-1">
                          Dr. {apt.counselor?.fullName || "Counselor"}
                        </h2>
                        <p className="text-[#464554] text-sm flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">
                            stethoscope
                          </span>
                          {apt.counselor?.specialization ||
                            t('medical_specialist')}
                        </p>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">
                          Appointment Date
                        </div>
                        <div className="text-[#4648d4] font-bold text-lg flex items-center gap-1 sm:justify-end">
                          <span className="material-symbols-outlined text-lg">calendar_today</span>
                          {appointmentSchedule.date}
                        </div>
                        <div className="text-slate-500 text-sm mt-1">
                          {appointmentSchedule.time}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-4">
                      <button
                        className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-[500] hover:bg-slate-50 transition-colors"
                        onClick={() => {
                          setSelectedApt(apt);
                          setShowModal(true);
                        }}
                      >
                        <span className="material-symbols-outlined text-sm">
                          visibility
                        </span>
                        {t('view_details')}
                      </button>
                      <button
                        className="flex items-center gap-2 px-4 py-2 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-[500] hover:bg-emerald-50 transition-colors disabled:opacity-50"
                        onClick={() => handleChat(apt)}
                        disabled={actionLoading === `chat-${apt._id}`}
                      >
                        <span className="material-symbols-outlined text-sm">chat</span>
                        Chat
                      </button>
                      <button
                        className="flex items-center gap-2 px-4 py-2 border border-violet-200 text-violet-700 rounded-lg text-sm font-[500] hover:bg-violet-50 transition-colors disabled:opacity-50"
                        onClick={() => handleCall(apt, "voice")}
                        disabled={actionLoading === `voice-${apt._id}`}
                      >
                        <span className="material-symbols-outlined text-sm">call</span>
                        Voice Call
                      </button>
                      <button
                        className="flex items-center gap-2 px-4 py-2 border border-indigo-200 text-indigo-700 rounded-lg text-sm font-[500] hover:bg-indigo-50 transition-colors disabled:opacity-50"
                        onClick={() => handleCall(apt, "video")}
                        disabled={actionLoading === `video-${apt._id}`}
                      >
                        <span className="material-symbols-outlined text-sm">videocam</span>
                        Video Call
                      </button>
                      {/* Appointment Details Modal */}
                      {showModal && selectedApt && (
                        <div
                          style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: "100vw",
                            height: "100vh",
                            background: "rgba(0,0,0,0.3)",
                            zIndex: 1000,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <div
                            style={{
                              background: "white",
                              borderRadius: "16px",
                              padding: "32px",
                              minWidth: "320px",
                              maxWidth: "90vw",
                              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                              position: "relative",
                            }}
                          >
                            <button
                              onClick={() => setShowModal(false)}
                              style={{
                                position: "absolute",
                                top: 16,
                                right: 16,
                                background: "transparent",
                                border: "none",
                                fontSize: 20,
                                cursor: "pointer",
                                color: "#64748b",
                              }}
                              aria-label="Close"
                            >
                              ×
                            </button>
                            <h2
                              style={{
                                fontSize: 22,
                                fontWeight: 700,
                                marginBottom: 16,
                                color: "#0b1c30",
                              }}
                            >
                              {t('appointment_details')}
                            </h2>
                            <div style={{ marginBottom: 12 }}>
                              <strong>{t('date')}:</strong>{" "}
                              {new Date(selectedApt.date).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </div>
                            <div style={{ marginBottom: 12 }}>
                              <strong>{t('time')}:</strong>{" "}
                              {new Date(selectedApt.date).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </div>
                            <div style={{ marginBottom: 12 }}>
                              <strong>{t('reason')}:</strong>{" "}
                              {selectedApt.notes || "N/A"}
                            </div>
                            {/* Add more fields as needed */}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        <VideoCallModal
          isOpen={isCallModalOpen}
          onClose={() => {
            setIsCallModalOpen(false);
            setSelectedCall(null);
          }}
          callData={selectedCall}
          callMode={selectedCall?.callType || selectedCall?.type}
          currentUser={{ id: localStorage.getItem("userId"), role: "user" }}
          onEndCall={handleEndCall}
        />

        {/* Promo Banner */}
        <section className="relative overflow-hidden rounded-2xl bg-[#4648d4] p-8 text-white">
          <div className="relative z-10 md:w-2/3">
            <h2 className="text-2xl font-[600] mb-2">{t('need_checkup')}</h2>
            <p className="opacity-90 mb-6 text-[16px]">
              {t('checkup_description')}
            </p>
            <button
              onClick={handleBookNewClick}
              className="bg-white text-[#4648d4] px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-slate-50 transition-colors active:scale-95"
            >
              {t('book_new_appointment')}
            </button>
          </div>
          <div className="absolute right-[-10%] top-[-50%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute right-[5%] bottom-[-20%] w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl"></div>
          <span className="material-symbols-outlined absolute right-12 top-1/2 -translate-y-1/2 text-[140px] opacity-10">
            health_and_safety
          </span>
        </section>

        {showBookingModal && (
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4"
            onClick={() => setShowBookingModal(false)}
          >
            <div
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-2xl font-bold text-[#0b1c30]">
                    {t('book_new_appointment_modal')}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {t('choose_counselor_text')}
                  </p>
                </div>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="text-slate-400 hover:text-slate-700 text-2xl leading-none"
                  aria-label="Close booking modal"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleConfirmBooking} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#0b1c30] mb-2">
                    {t('counselor_label')}
                  </label>
                  <select
                    value={selectedCounselorId}
                    onChange={(e) => setSelectedCounselorId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-[#0b1c30] focus:border-[#4648d4] focus:outline-none"
                    required
                  >
                    <option value="">{t('select_counselor')}</option>
                    {counselors.map((counselor) => (
                      <option
                        key={counselor._id || counselor.id}
                        value={counselor._id || counselor.id}
                      >
                        Dr. {counselor.fullName || counselor.name || "Counselor"}
                        {counselor.specialization?.length
                          ? ` - ${Array.isArray(counselor.specialization) ? counselor.specialization.join(", ") : counselor.specialization}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#0b1c30] mb-2">
                    {t('date_and_time')}
                  </label>
                  <input
                    type="datetime-local"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-[#0b1c30] focus:border-[#4648d4] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#0b1c30] mb-2">
                    {t('clinical_notes_reason')}
                  </label>
                  <textarea
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder={t('share_to_discuss')}
                    className="min-h-[110px] w-full rounded-xl border border-slate-200 px-4 py-3 text-[#0b1c30] focus:border-[#4648d4] focus:outline-none"
                    required
                  />
                </div>

                <div className="rounded-xl bg-indigo-50 p-4 text-sm text-[#4648d4]">
                  {t('appointment_confirmation')}
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full rounded-xl bg-[#4648d4] px-5 py-3 font-bold text-white transition-colors hover:bg-[#3839b8] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {bookingLoading ? t('booking_button') : t('confirm_appointment')}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* ── Right Sidebar: Today's Schedule ── */}
      
    </div>
  );
};

export default MyAppointments;
