import ProviderRating from './ProviderRating.jsx';
import { payForAppointment, isOnlinePayment } from '../../../../utils/providerPayments.js';
const appointmentPaymentId = value => String(value?._id || value?.id || value?.appointmentId || value || '');
import { readAppointmentList } from './appointmentListCache.js';
import { loadAppointmentList } from './appointmentListLoader.js';
import useSocketRefresh from "../../../../hooks/useSocketRefresh";
import socketService from "../../../../services/socketService";
import { PortalElement, PortalText } from "../../../common/PortalTranslation";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../../axiosConfig";
import { useUserTranslation } from "../../../../i18n/LanguageContext";
import VideoCallModal from "../CallModal/VideoCallModal";
import RatingModal from "../../../../components/RatingModal";
import PatientEmergencyModal from "./PatientEmergencyModal";
import {
  FaUsers, FaThLarge, FaRegTimesCircle, FaHistory, FaArrowLeft,
  FaBriefcase,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaCommentDots,
  FaEye,
  FaLaptop,
  FaPhoneAlt,
  FaStopwatch,
  FaVideo,
} from "react-icons/fa";
import './MyAppointments.css';
import './MyAppointmentsReference.css';
import AppointmentProviderCard from './AppointmentProviderCard'; // Import the CSS file for styling
import { isUnscheduledEmergency } from './emergencyBooking.js';
import { filterAppointments } from './appointmentFilters.js';
import { canCancelAppointment } from '../../../../utils/appointmentCancellation.js';
import { groupAppointmentsByProvider } from './appointmentProviderGroups.js';
import { getAppointmentDuration } from './appointmentDuration.js';
import ProfileAvatar from '../../../common/ProfileAvatar.jsx';
const MyAppointments = () => {
  const { t, lang } = useUserTranslation();
  const tr = (key, fallback) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  };
  const navigate = useNavigate();
  const sessionCacheKey = localStorage.getItem("token") || localStorage.getItem("accessToken");
  const [appointments, setAppointments] = useState(() => readAppointmentList(sessionCacheKey) || []);
  useEffect(() => {
    const refreshPayment = () => { setAppointments(rows => [...rows]); setPaymentNotice(null); };
    window.addEventListener('storage', refreshPayment);
    return () => { window.removeEventListener('storage', refreshPayment); };
  }, []);
  const [selectedProviderKey, setSelectedProviderKey] = useState(null);
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(() => !readAppointmentList(sessionCacheKey));
  const [bookingLoading, setBookingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedApt, setSelectedApt] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedCounselorId, setSelectedCounselorId] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [paymentNotice, setPaymentNotice] = useState(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [ratingAppointment, setRatingAppointment] = useState(null);
  const [ratingBusy, setRatingBusy] = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [ratingSuccess, setRatingSuccess] = useState(false);
  const [emergencyAppointment, setEmergencyAppointment] = useState(null);

  const [ratingType, setRatingType] = useState("doctor");
  const [clinicRatingLoading, setClinicRatingLoading] = useState(null);
  const [clinicRatingLoadError, setClinicRatingLoadError] = useState(null);
  const openClinicRating = async (appointment) => {
    if (clinicRatingLoading) return;
    setClinicRatingLoadError(null);
    setClinicRatingLoading(appointment._id);
    try {
      let name = appointment.clinic_name || appointment.clinic_id?.clinic_name || appointment.clinic_id?.name;
      if (!name?.trim()) {
        const clinicId = appointment.clinic_id?._id || appointment.clinic_id?.id || appointment.clinic_id;
        if (!clinicId || typeof clinicId === "object") throw new Error("Clinic details are unavailable. Please refresh and try again.");
        const { data } = await axios.get(`${API_BASE_URL}/api/clinics/${encodeURIComponent(clinicId)}`, { timeout: 15000 });
        name = data.clinic?.clinic_name || data.clinic?.name;
      }
      if (!name?.trim()) throw new Error("Clinic name could not be loaded. Please try again.");
      const updated = { ...appointment, clinic_name: name.trim() };
      setAppointments(rows => rows.map(row => row._id === appointment._id ? updated : row));
      setRatingType("clinic"); setRatingAppointment(updated); setRatingError(""); setRatingSuccess(false);
    } catch (error) {
      setClinicRatingLoadError({ id: appointment._id, message: error.response?.data?.message || error.message || "Clinic details could not be loaded. Please try again." });
    } finally { setClinicRatingLoading(null); }
  };
  const submitDoctorRating = async ({ rating, review }) => {
    if (ratingBusy || !ratingAppointment) return;
    setRatingBusy(true);
    setRatingError("");
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/appointments/${ratingAppointment._id}/${ratingType}-rating`,
        { rating, review }, { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 });
      setAppointments((rows) => rows.map((row) => row._id === ratingAppointment._id
        ? { ...row, [`${ratingType}Rating`]: data[`${ratingType}Rating`] } : row));
      setRatingSuccess(true);
      void fetchAppointments();
    } catch (error) {
      setRatingError(error.response?.data?.error || "Rating could not be saved. Please try again.");
      if (error.response?.status === 409) void fetchAppointments();
    } finally {
      setRatingBusy(false);
    }
  };

  const token =
    localStorage.getItem("token") || localStorage.getItem("accessToken");

  const cancelAppointment = async apt => {
    if (actionLoading || !canCancelAppointment(apt)) return;
    if (!window.confirm(tr('confirm_cancel_appointment', 'Cancel this appointment?'))) return;
    setActionLoading(`cancel-${apt._id}`);
    try {
      await axios.patch(`${API_BASE_URL}/api/appointments/${apt._id}/cancel`, { source: 'online' },
        { headers: { Authorization: `Bearer ${token}` } });
      setSelectedApt(current => current?._id === apt._id ? { ...current, status: 'canceled', queue_status: 'canceled' } : current);
      await fetchAppointments();
    } catch (error) {
      alert(error.response?.data?.message || 'Appointment could not be cancelled. Please try again.');
      if (error.response?.status === 409) await fetchAppointments();
    } finally { setActionLoading(null); }
  };

  const fetchAppointments = async () => {
    try {
      const rows = await loadAppointmentList(sessionCacheKey, { refresh: true });
      setAppointments(rows);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  useSocketRefresh(fetchAppointments, ["appointments:updated", "appointmentBooked", "queueUpdated", "notification:new"]);

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

  // Role of the professional this appointment was booked with
  // (Doctor / Consultant). Falls back to the counselors list if the
  // appointment payload does not include `role`.
  const getProfessionalRole = (apt) => {
    const counselorId =
      apt?.counselor?._id || apt?.counselor?.id || apt?.counselorId;
    const fromList = counselors.find(
      (c) => String(c._id || c.id) === String(counselorId),
    )?.role;
    const rawRole = String(
      apt?.counselor?.role || apt?.doctor?.role || apt?.role || fromList || "",
    )
      .trim()
      .toLowerCase();
    const isDoctor = rawRole === "doctor" || apt?.counselor?.accountType === "doctor" || Boolean(apt?.doctor || apt?.doctor_id || apt?.doctorId);
    return {
      isDoctor,
      label: isDoctor
        ? tr("professional_role_doctor", "Doctor")
        : tr("professional_role_consultant", "Consultant"),
    };
  };

  const renderRoleBadge = (apt) => {
    const { isDoctor, label } = getProfessionalRole(apt);
    return (
      <span
        className={`professional-role-badge ${isDoctor ? "professional-role-badge--doctor" : ""}`}
      >
        {label}
      </span>
    );
  };

  // Consultation mode chosen while booking (Video Call / Voice Call / Chat /
  // In-Person...). The backend field name can differ, so check every likely key
  // (also inside nested objects) and never default to "Video Call".
  const MODE_KEYS = [
    "consultationMode",
    "consultation_mode",
    "consultationType",
    "consultation_type",
    "appointmentMode",
    "appointment_mode",
    "appointmentType",
    "appointment_type",
    "modeOfConsultation",
    "sessionType",
    "session_type",
    "callType",
    "mode",
    "type",
  ];
  const MODE_NESTED = ["slot", "booking", "details", "appointmentDetails", "meta"];

  const normalizeModeValue = (value) => {
    if (value === null || value === undefined) return "";
    if (Array.isArray(value)) {
      return value.map(normalizeModeValue).filter(Boolean).join(", ");
    }
    if (typeof value === "object") {
      return normalizeModeValue(
        value.label || value.name || value.mode || value.type || value.value,
      );
    }
    const raw = String(value).trim();
    if (!raw) return "";
    const key = raw.toLowerCase().replace(/[\s_-]+/g, "");
    if (["video", "videocall", "videoconsultation", "videoconsult"].includes(key))
      return tr("video_call", "Video Call");
    if (["voice", "audio", "voicecall", "audiocall", "call", "phone", "phonecall"].includes(key))
      return tr("voice_call", "Voice Call");
    if (["chat", "message", "messaging", "text", "chatconsultation"].includes(key))
      return tr("chat", "Chat");
    if (["inperson", "clinic", "clinicvisit", "offline", "physical", "visit", "onsite"].includes(key))
      return tr("in_person", "In-Person");
    if (key === "online") return tr("online", "Online");
    // Unknown value (e.g. "In-Clinic Visit"): show it as entered
    if (raw.includes("_")) {
      return raw.replace(/_+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return raw;
  };

  const getAppointmentMode = (apt) => {
    const sources = [apt, ...MODE_NESTED.map((k) => apt?.[k])].filter(
      (src) => src && typeof src === "object",
    );
    for (const src of sources) {
      for (const key of MODE_KEYS) {
        const label = normalizeModeValue(src[key]);
        if (label) return label;
      }
    }
    // Backend stores the chosen mode inside notes, e.g.
    // "Consultation: In-Clinic Visit at <clinic>. Location: ..."
    const notesMatch = String(apt?.notes || "").match(
      /Consultation:\s*([^.]*?)(?:\s+at\s+|\.|$)/i,
    );
    if (notesMatch?.[1]) {
      const label = normalizeModeValue(notesMatch[1]);
      if (label) return label;
    }
    return "N/A";
  };

  const ratedDoctor = (apt) => {
    const id = value => String(value?._id || value?.id || value || '');
    const doctor = id(apt.counselor || apt.doctor || apt.counselorId);
    return apt.doctorRating || appointments.find(row => row.doctorRating && id(row.counselor || row.doctor || row.counselorId) === doctor)?.doctorRating;
  };
  const ratedClinic = (apt) => apt.clinicRating || appointments.find(row => row.clinicRating && String(row.clinic_id?._id || row.clinic_id) === String(apt.clinic_id?._id || apt.clinic_id))?.clinicRating;

  const displayApts = filterAppointments(appointments, statusFilter, activeTab);

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
      return { date: t('unavailable'), time: "" };
    }

    return {
      date: appointmentDate.toLocaleDateString(lang, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: appointmentDate.toLocaleTimeString(lang, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const getAppointmentDateKey = (apt) => {
    const source = apt?.appointment_date || apt?.date;
    const parsed = new Date(source);
    if (Number.isNaN(parsed.getTime())) {
      return String(source || "unscheduled").slice(0, 10) || "unscheduled";
    }
    return parsed.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  };

  const getAppointmentToken = (apt) =>
    apt?.token_number ??
    apt?.tokenNumber ??
    apt?.appointment_token ??
    apt?.queue_token ??
    apt?.token ??
    null;

  const providerGroups = groupAppointmentsByProvider(displayApts);
  const selectedProvider = selectedProviderKey
    ? groupAppointmentsByProvider(appointments).find(group => group.key === selectedProviderKey) : null;
  const selectedProviderAppointments = providerGroups.find(group => group.key === selectedProviderKey)?.appointments || [];
  const appointmentDateGroups = selectedProviderAppointments.reduce((groups, apt) => {
    const key = getAppointmentDateKey(apt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(apt);
    return groups;
  }, new Map());

  const groupedDisplayApts = Array.from(appointmentDateGroups.entries()).map(([dateKey, items]) => ({
    dateKey,
    label: items[0] ? formatAppointmentDateTime(items[0].date).date : dateKey,
    items,
  }));

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
    apt?.counselor?._id || apt?.counselor?.id || apt?.counselorId || apt?.doctor?._id || apt?.doctor?.id || apt?.doctor_id || apt?.doctorId;

  const handleChat = async (apt) => {
    const counselorId = getCounselorId(apt);
    if (!counselorId) return alert("Consultant information is unavailable.");
    if (getProfessionalRole(apt).isDoctor) return; // no chat with doctors

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
    if (getProfessionalRole(apt).isDoctor) {
      return;
    }
    const counselorId = getCounselorId(apt);
    const userId = localStorage.getItem("userId");
    if (!counselorId || !userId) return alert("Call information is unavailable. Please login again.");

    try {
      setActionLoading(`${mode}-${apt._id}`);
      const callSocket = await socketService.connect();
      if (!callSocket?.id) throw new Error("Call connection is not ready. Please retry.");
      const response = await axios.post(
        `${API_BASE_URL}/api/video/calls/initiate`,
        {
          initiatorId: userId,
          initiatorType: "user",
          receiverId: counselorId,
          socketId: callSocket.id,
          receiverType: getProfessionalRole(apt).isDoctor ? "doctor" : "counsellor",
          callType: mode === "voice" ? "audio" : "video",
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.data?.success) throw new Error(response.data?.message || "Call request failed");
      if (response.data.notificationOnly) throw new Error(response.data.message || "The recipient is unavailable. Please retry shortly.");
      const callData = response.data.callData || {};
      setSelectedCall({
        id: callData.id || response.data.callId,
        callId: response.data.callId || callData.callId,
        roomId: response.data.roomId || callData.roomId,
        name: callData.receiver?.displayName || callData.receiver?.fullName || apt.counselor?.fullName || "Consultant",
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
      alert(error?.response?.data?.message || error.message || `Unable to start ${mode} call. Please try again.`);
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

  const renderAppointmentDetailsModal = () => {
    if (!showModal || !selectedApt) return null;

    const appointmentSchedule = formatAppointmentDateTime(selectedApt.date);
    const awaitingEmergency = isUnscheduledEmergency(selectedApt);
    if (awaitingEmergency) appointmentSchedule.time = 'Clinic will confirm';
    const counselorName = selectedApt.counselor?.fullName || "Consultant";
    const counselorSpecialization =
      selectedApt.counselor?.specialization || "Mental health counselor";
    const appointmentStatus = selectedApt.status || "pending";
    const appointmentTime = new Date(selectedApt.date);
    const remainingMs = Math.max(0, appointmentTime.getTime() - Date.now());
    const remainingHours = Math.floor(remainingMs / 3600000);
    const remainingMinutes = Math.floor((remainingMs % 3600000) / 60000);
    const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
    const countdown = `${String(remainingHours).padStart(2, "0")}:${String(
      remainingMinutes,
    ).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
    const appointmentMode = getAppointmentMode(selectedApt);
    const appointmentDuration = getAppointmentDuration(selectedApt);

    return createPortal(
      <PortalElement as="div"
        className="appointment-detail-overlay"
        onClick={() => setShowModal(false)}
        role="dialog"
        aria-modal="true"
        aria-label="Appointment details"
      >
        <div
          className="appointment-detail-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <PortalElement as="button"
            type="button"
            className="appointment-detail-close"
            onClick={() => setShowModal(false)}
            aria-label="Close appointment details"
          >
            &times;
          </PortalElement>

          <div className="appointment-detail-title">
            <h2>{t('appointment_details')}</h2>
          <p>{t("view_session_information")}</p>
          </div>

          <div className="appointment-detail-counselor">
            <div className="appointment-detail-avatar-wrap">
              <img
                src={getAvatarSrc(selectedApt)}
                alt={counselorName}
                className="appointment-detail-avatar"
              />
            </div>
            <div className="appointment-detail-heading">
              <h3> {counselorName}</h3>
              {renderRoleBadge(selectedApt)}
              <p>{counselorSpecialization}</p>
              <div>
                <span><FaBriefcase /> {selectedApt.counselor?.experience || 0} {t('years')}</span>
                <ProviderRating provider={selectedApt.counselor} />
              </div>
            </div>
            <span className={`appointment-detail-status ${appointmentStatus}`}>
              <i></i>{t(appointmentStatus)}
            </span>
          </div>

          {selectedApt.priority === 'emergency' && <div className="user-emergency-notice"><strong><PortalText text={"Emergency appointment"} /></strong><p>{selectedApt.emergency_reason}</p></div>}

          {!awaitingEmergency && <div className="appointment-detail-countdown">
            <span className="countdown-icon"><FaClock /></span>
            <div>
                  <small>{t("session_starts_in")}</small>
              <strong>{countdown}</strong>
            </div>
            <div className="countdown-time">
                  <small>{t("today")}</small>
              <strong>{appointmentSchedule.time || "N/A"}</strong>
            </div>
          </div>}

          <div className="appointment-detail-grid">
            <div className="appointment-detail-card">
              <FaCalendarAlt />
              <div>
                <small>{t('date')}</small>
                <strong>{appointmentSchedule.date}</strong>
              </div>
            </div>
            <div className="appointment-detail-card">
              <FaClock />
              <div>
                <small>{t('time')}</small>
                <strong>{appointmentSchedule.time || "N/A"}</strong>
              </div>
            </div>
            <div className="appointment-detail-card mode">
              <FaLaptop />
              <div>
                <small>{t("mode")}</small>
                <strong>{appointmentMode}</strong>
              </div>
            </div>
            <div className="appointment-detail-card duration">
              <FaStopwatch />
              <div>
                <small>{t("duration")}</small>
                <strong>{appointmentDuration != null ? <>{appointmentDuration} {t('minutes')}</> : tr('not_available', 'Not available')}</strong>
              </div>
            </div>
          </div>

          <div className="appointment-detail-actions">
            {!getProfessionalRole(selectedApt).isDoctor && (
            <button
              type="button"
              className="appointment-detail-action join"
              onClick={() => handleCall(selectedApt, "video")}
              disabled={actionLoading === `video-${selectedApt._id}`}
            >
              <FaVideo />
              {actionLoading === `video-${selectedApt._id}` ? tr('loading', 'Loading...') : tr('start_video_call', 'Start Video Call')}
            </button>
            )}
            {canCancelAppointment(selectedApt) && <button type="button" disabled={Boolean(actionLoading)} onClick={() => cancelAppointment(selectedApt)}>
              <PortalText text={actionLoading === `cancel-${selectedApt._id}` ? 'Cancelling...' : 'Cancel Appointment'} />
            </button>}
            {!getProfessionalRole(selectedApt).isDoctor && (
              <button
                type="button"
                className="appointment-detail-action secondary"
                onClick={() => handleChat(selectedApt)}
                disabled={actionLoading === `chat-${selectedApt._id}`}
              >
                <FaCommentDots />
                {actionLoading === `chat-${selectedApt._id}` ? t('loading') : t('chat')}
              </button>
            )}
            {!getProfessionalRole(selectedApt).isDoctor && <button
              type="button"
              className="appointment-detail-action primary"
              onClick={() => handleCall(selectedApt, "voice")}
              disabled={actionLoading === `voice-${selectedApt._id}`}
            >
              <FaPhoneAlt />
              {actionLoading === `voice-${selectedApt._id}` ? t('loading') : t('voice_call')}
            </button>}
          </div>
        </div>
      </PortalElement>,
      document.body,
    );
  };

  return (
    <div
      className="user-appointments-page user-appointments-reference flex w-full gap-0 min-h-screen"
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      {/* ── Main Content ── */}
      <main className="flex-1 p-4 sm:p-8 min-w-0">
        {/* Header */}
        <header className="user-appointments-hero">
          <div>
            <h1>{t('my_appointments')}</h1>
          <p>{t("appointments_subtitle")}</p>
          </div>
          <div className="uap-hero-decoration" aria-hidden="true"><FaCalendarAlt /></div>
        </header>

        <div className="user-appointments-filterbar">
          <div className="user-appointments-status-pills">
            {[
              ["All", t("all"), FaThLarge],
              ["Pending", t("pending"), FaClock],
              ["Confirmed", t("confirmed"), FaCheckCircle],
              ["Completed", t("completed"), FaCalendarAlt],
              ["Cancelled", tr("cancelled", "Cancelled"), FaRegTimesCircle],
            ].map(([filter, label, icon]) => (
              <button
                key={filter}
                type="button"
                data-status={filter} aria-pressed={statusFilter === filter} className={statusFilter === filter ? "active" : ""}
                onClick={() => { setStatusFilter(filter); setActiveTab("All"); }}
              >
                {React.createElement(icon)}{label}
              </button>
            ))}
          </div>
          <div className="user-appointments-tabs p-1 rounded-xl flex shrink-0">
            <button
              onClick={() => setActiveTab("All")}
              className={`user-appointments-tab px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "All" ? "active" : ""}`}
            >
              <FaCalendarAlt />{t('all')}
            </button>
            <button
              onClick={() => setActiveTab("Upcoming")}
              className={`user-appointments-tab px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "Upcoming" ? "active" : ""}`}
            >
              <FaCalendarAlt />{t('upcoming')}
            </button>
            <button
              onClick={() => setActiveTab("Past")}
              className={`user-appointments-tab px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "Past" ? "active" : ""}`}
            >
              <FaHistory />{t('past')}
            </button>
          </div>
        </div>

        {/* Appointment Cards */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="user-appointments-spinner animate-spin rounded-full h-10 w-10 border-b-2"></div>
          </div>
        ) : (
          <>
          {selectedProviderKey && <div className="user-provider-history-header">
            <button type="button" className="user-provider-back-button" onClick={() => setSelectedProviderKey(null)}><FaArrowLeft aria-hidden="true" /><PortalText text="Back to doctors & consultants" /></button>
            {selectedProvider && <div className="user-provider-history-person">
              <ProfileAvatar photo={selectedProvider.latest.counselor?.profilePhoto} name={selectedProvider.latest.counselor?.fullName || selectedProvider.latest.counselor?.name || 'Provider'} size={56} />
              <div><h2>{selectedProvider.latest.counselor?.fullName || selectedProvider.latest.counselor?.name || <PortalText text="Provider unavailable" />}</h2>{renderRoleBadge(selectedProvider.latest)}<p>{selectedProviderAppointments.length} <PortalText text={selectedProviderAppointments.length === 1 ? 'appointment' : 'appointments'} /></p></div>
            </div>}
          </div>}
          {!selectedProviderKey && <div className="user-provider-list-heading"><FaUsers aria-hidden="true" /><div><h2><PortalText text="Doctors & Consultants" /></h2><p><PortalText text="Select a doctor or consultant to view your appointment history." /></p></div></div>}
          <div className="user-appointments-grid">
            {(selectedProviderKey ? selectedProviderAppointments.length === 0 : providerGroups.length === 0) ? (
              <div className="bg-white rounded-xl p-8 sm:p-16 border border-dashed border-slate-200 text-center shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
                <span className="material-symbols-outlined text-slate-300 text-5xl block mb-3"><PortalText text={"calendar_today"} /></span>
                <p className="text-[#464554] text-sm">
                  {t('no_appointments_found').replace('{tab}', activeTab.toLowerCase())}
                </p>
              </div>
            ) : !selectedProviderKey ? (
              <div className="user-appointment-providers">
                {providerGroups.map((provider, index) => <AppointmentProviderCard key={provider.key} group={provider} role={getProfessionalRole(provider.latest)} schedule={formatAppointmentDateTime(provider.latest.date)} t={(key) => tr(key, key)} featured={index === 0} onOpen={(status) => { setSelectedProviderKey(provider.key); if (status) { setStatusFilter(status); setActiveTab("All"); } }} />)}
              </div>
            ) : (
              groupedDisplayApts.map((group) => (
                <section className="user-appointment-date-group" key={group.dateKey}>
                  <div className="user-appointment-date-heading">
                    <span>{group.label}</span>
                    <strong>{group.items.length}<PortalText text={" appointment"} />{group.items.length === 1 ? "" : "s"}</strong>
                  </div>
                  <div className="user-appointment-date-grid">
                    {group.items.map((apt) => {
                const paymentId = appointmentPaymentId(apt);
                const paymentComplete = apt.payment_status === 'paid';
                const appointmentSchedule = formatAppointmentDateTime(apt.date);
                if (isUnscheduledEmergency(apt)) appointmentSchedule.time = 'Clinic will confirm';
                const appointmentToken = getAppointmentToken(apt);

                return (
                  <div
                  key={apt._id}
                  className="user-appointment-card uap-history-card"
                >
                  <div className="user-appointment-profile">
                    <ProfileAvatar photo={apt.counselor?.profilePhoto || apt.counselor?.profileImage} name={apt.counselor?.fullName || apt.counselor?.name || "Consultant"} size={42} className="user-appointment-avatar uap-history-avatar" />
                    <div className="user-appointment-person">
                      <h2 title={apt.counselor?.fullName || apt.counselor?.name || "Consultant"}>
                        {apt.counselor?.fullName || apt.counselor?.name || <PortalText text={"Consultant"} />}
                        {/* <FaCheckCircle aria-label="Verified" /> */}
                      </h2>
                      {renderRoleBadge(apt)}
                      {apt.priority === 'emergency' && <span className="user-emergency-badge"><PortalText text={"Emergency"} /></span>}
                      <p>
                        {Array.isArray(apt.counselor?.specialization)
                          ? apt.counselor.specialization.join(" | ")
                          : apt.counselor?.specialization || t('medical_specialist')}
                      </p>
                    </div>
                    <span className={`user-appointment-status ${apt.status || "pending"}`}>
                      <i></i>{t(apt.status || "pending")}
                    </span>
                    <div className="user-appointment-meta">
                      <span><FaBriefcase /> {apt.counselor?.experience || 0} {t('years')}</span>
                      <ProviderRating provider={apt.counselor} />
                    </div>
                  </div>

                  <div className="user-appointment-schedule">
                    <span className="user-appointment-schedule-item">
                      <FaCalendarAlt aria-hidden="true" />
                      <span><small>{tr("date", "Date")}</small><strong>{appointmentSchedule.date}</strong></span>
                    </span>
                    <span className="user-appointment-schedule-item">
                      <FaClock aria-hidden="true" />
                      <span><small>{tr("time", "Time")}</small><strong>{appointmentSchedule.time || tr("unavailable", "Unavailable")}</strong></span>
                    </span>
                    {appointmentToken != null && (
                      <>
                        <span className="user-appointment-token"><PortalText text={"Token #"} />{appointmentToken}
                        </span>
                      </>
                    )}
                  </div>

                  {getAppointmentMode(apt) !== "N/A" && <div className="uap-history-mode"><FaLaptop aria-hidden="true" /><span>{getAppointmentMode(apt)}</span></div>}

                  {getProfessionalRole(apt).isDoctor && (apt.delay_minutes > 0 && apt.estimatedTime || ['pending', 'confirmed'].includes(apt.status) || apt.cancellationReason === 'PATIENT_LATE') && <div className="user-appointment-live-timing">
                    {apt.delay_minutes > 0 && apt.estimatedTime && <span>{apt.status === 'completed' ? <PortalText text={"Consultation started"} /> : <PortalText text={"Updated estimate"} />}: {new Date(apt.estimatedTime).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}<PortalText text={" · Doctor/queue delay: "} />{apt.delay_minutes}<PortalText text={" min"} /></span>}
                    {['pending', 'confirmed'].includes(apt.status) && <>
                      <span><PortalText text={"Current token: "} />{apt.currentToken ?? '--'}</span>
                      {apt.waiting_minutes != null && <span><PortalText text={"Approximate wait: "} />{apt.waiting_minutes}<PortalText text={" min"} /></span>}
                      {apt.patientArrivalTime || ['waiting', 'in_progress'].includes(apt.queue_status)
                        ? <span><PortalText text={"Checked in · Waiting for your turn"} /></span>
                        : apt.cancelDeadline && <span><PortalText text={"Please arrive before: "} />{new Date(apt.cancelDeadline).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}</span>}
                    </>}
                    {apt.cancellationReason === 'PATIENT_LATE' && <span><PortalText text={"Appointment Cancelled · Patient did not arrive before the adjusted appointment deadline."} /></span>}
                  </div>}

                    {paymentNotice?.id === paymentId && <p role="status">{paymentNotice.message}</p>}
                    {clinicRatingLoadError?.id === apt._id && <p role="alert">{clinicRatingLoadError.message}</p>}
                    <div className="user-appointment-actions">
                      {isOnlinePayment(apt.payment_method) && !paymentComplete && ['pending', 'confirmed', 'accepted', 'booked'].includes(apt.status) && <button type="button" className="user-appointment-action user-appointment-pay" disabled={Boolean(actionLoading)} onClick={async () => {
                        setActionLoading(`pay-${paymentId}`); setPaymentNotice(null);
                        try {
                          const payment = await payForAppointment(paymentId, apt.payment_method);
                          setPaymentNotice({ id: paymentId, message: payment.mode === 'test' ? 'Razorpay test payment verified. No real money was charged.' : 'Payment verified successfully.' });
                          await fetchAppointments();
                        } catch (error) { if (error.code !== 'PAYMENT_CANCELLED') setPaymentNotice({ id: paymentId, message: error.response?.data?.message || error.message || 'Payment could not be completed.' }); }
                        finally { setActionLoading(null); }
                      }}><i className="fa-solid fa-credit-card" aria-hidden="true" /><PortalText text={actionLoading === `pay-${paymentId}` ? 'Processing payment...' : 'Pay Now'} /></button>}
                      {getProfessionalRole(apt).isDoctor && ['pending', 'confirmed', 'accepted', 'booked', 'in-progress'].includes(apt.status)
                        && !['completed', 'canceled', 'cancelled', 'no_show', 'skipped'].includes(apt.queue_status) && (
                        <button type="button" className={`user-appointment-action user-appointment-emergency ${apt.priority === 'emergency' ? 'is-sent' : ''}`}
                          disabled={apt.priority === 'emergency'} onClick={() => setEmergencyAppointment(apt)}>
                          {apt.priority === 'emergency' ? <FaCheckCircle aria-hidden="true" /> : <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />}
                          <PortalText text={apt.priority === 'emergency' ? 'Emergency sent' : 'Emergency'} />
                        </button>
                      )}
                      {getProfessionalRole(apt).isDoctor && apt.status === 'completed' && (
                        <button type="button" className="user-appointment-action secondary"
                          disabled={Boolean(ratedDoctor(apt))}
                          onClick={() => { setRatingType("doctor"); setRatingAppointment(apt); setRatingError(""); setRatingSuccess(false); }}>
                          {ratedDoctor(apt)
                            ? <><FaCheckCircle aria-hidden="true" /><PortalText text={"Rated"} /> ({ratedDoctor(apt).stars}/5)</>
                            : <><span aria-hidden="true">★</span><PortalText text={"Rate Doctor"} /></>}
                        </button>
                      )}
                      {apt.status === 'completed' && apt.clinic_id && (
                        <button type="button" className="user-appointment-action secondary" disabled={Boolean(ratedClinic(apt)) || Boolean(clinicRatingLoading)}
                          onClick={() => openClinicRating(apt)}>
                          <PortalText text={clinicRatingLoading === apt._id ? "Loading Clinic..." : ratedClinic(apt) ? "Clinic Rated" : "Rate Clinic"} />{ratedClinic(apt) ? ` (${ratedClinic(apt).stars}/5)` : ""}
                        </button>
                      )}
                      <button
                        className="user-appointment-action secondary uap-details-action"
                        onClick={() => {
                          setSelectedApt(apt);
                          setShowModal(true);
                        }}
                      >
                        <FaEye aria-hidden="true" />
                        {t('view_details')}
                      </button>
                      {canCancelAppointment(apt) && <button type="button" className="user-appointment-action secondary" disabled={Boolean(actionLoading)} onClick={() => cancelAppointment(apt)}>
                        <PortalText text={actionLoading === `cancel-${apt._id}` ? 'Cancelling...' : 'Cancel Appointment'} />
                      </button>}
                      {!getProfessionalRole(apt).isDoctor && (
                      <PortalElement as="button"
                        className="user-appointment-action icon"
                        onClick={() => handleCall(apt, "video")}
                        disabled={actionLoading === `video-${apt._id}`}
                        title="Video Call"
                        aria-label="Video Call"
                      >
                        <FaVideo aria-hidden="true" />
                      </PortalElement>
                      )}
                      {!getProfessionalRole(apt).isDoctor && (
                      <PortalElement as="button"
                        className="user-appointment-action icon"
                        onClick={() => handleCall(apt, "voice")}
                        disabled={actionLoading === `voice-${apt._id}`}
                        title="Voice Call"
                        aria-label="Voice Call"
                      >
                        <FaPhoneAlt aria-hidden="true" />
                      </PortalElement>
                      )}
                      {!getProfessionalRole(apt).isDoctor && (
                        <PortalElement as="button"
                          className="user-appointment-action icon"
                          onClick={() => handleChat(apt)}
                          disabled={actionLoading === `chat-${apt._id}`}
                          title="Chat"
                          aria-label="Chat"
                        >
                          <FaCommentDots aria-hidden="true" />
                        </PortalElement>
                      )}
                    </div>
                  </div>
                );
                    })}
                  </div>
                </section>
              ))
            )}
          </div>
          </>
        )}

        {renderAppointmentDetailsModal()}
        {emergencyAppointment && createPortal(<PatientEmergencyModal appointment={emergencyAppointment} token={token}
          onClose={() => setEmergencyAppointment(null)} onSent={(id, reason) => {
            setAppointments((rows) => rows.map((row) => row._id === id ? { ...row, priority: 'emergency', emergency_reason: reason } : row));
            void fetchAppointments();
          }} />, document.body)}
        {ratingAppointment && createPortal(<>
          <RatingModal visible key={ratingAppointment._id} professionalType={ratingType}
            counselorName={ratingType === "clinic" ? (ratingAppointment.clinic_name || ratingAppointment.clinic_id?.clinic_name || ratingAppointment.clinic_id?.name || "Clinic") : ratingAppointment.counselor?.fullName || ratingAppointment.counselor?.name || "your doctor"}
            counselorPhoto={ratingType === "clinic" ? null : ratingAppointment.counselor?.profilePhoto}
            submitting={ratingBusy} success={ratingSuccess} error={ratingError}
            onSubmit={submitDoctorRating} onClose={() => { if (!ratingBusy) setRatingAppointment(null); }} />
        </>, document.body)}

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
        <section className="user-appointments-promo relative overflow-hidden rounded-2xl p-8 text-white">
          <div className="relative z-10 md:w-2/3">
            <h2 className="text-2xl font-[600] mb-2">{t('need_checkup')}</h2>
            <p className="opacity-90 mb-6 text-[16px]">
              {t('checkup_description')}
            </p>
            <button
              onClick={handleBookNewClick}
              className="user-appointments-book-button bg-white px-8 py-3 rounded-xl font-bold shadow-lg transition-colors active:scale-95"
            >
              {t('book_new_appointment')}
            </button>
          </div>
          <div className="absolute right-[-10%] top-[-50%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute right-[5%] bottom-[-20%] w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          <span className="material-symbols-outlined absolute right-12 top-1/2 -translate-y-1/2 text-[140px] opacity-10"><PortalText text={"health_and_safety"} /></span>
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
                <PortalElement as="button"
                  onClick={() => setShowBookingModal(false)}
                  className="text-slate-400 hover:text-slate-700 text-2xl leading-none"
                  aria-label="Close booking modal"
                >
                  ×
                </PortalElement>
              </div>

              <form onSubmit={handleConfirmBooking} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#0b1c30] mb-2">
                    {t('counselor_label')}
                  </label>
                  <select
                    value={selectedCounselorId}
                    onChange={(e) => setSelectedCounselorId(e.target.value)}
                    className="user-booking-input w-full rounded-xl border px-4 py-3 text-[#0b1c30] focus:outline-none"
                    required
                  >
                    <option value="">{t('select_counselor')}</option>
                    {counselors.map((counselor) => (
                      <option
                        key={counselor._id || counselor.id}
                        value={counselor._id || counselor.id}
                      >
                        {String(counselor.role || "").toLowerCase() === "doctor" ? <PortalText text={"Dr. "} /> : ""}
                        {counselor.fullName || counselor.name || <PortalText text={"Consultant"} />}
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
                    className="user-booking-input w-full rounded-xl border px-4 py-3 text-[#0b1c30] focus:outline-none"
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
                    className="user-booking-input min-h-[110px] w-full rounded-xl border px-4 py-3 text-[#0b1c30] focus:outline-none"
                    required
                  />
                </div>

                <div className="user-booking-notice rounded-xl p-4 text-sm">
                  {t('appointment_confirmation')}
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="user-booking-submit w-full rounded-xl px-5 py-3 font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
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
