import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useDoctorUser } from "../doctorApi.js";
import axios from "../../../axiosConfig.js";
import { CheckCircle, Clock, XCircle, Users, Stethoscope, CircleCheck, CircleX, Search, CalendarDays, SlidersHorizontal, Link2 } from "lucide-react";
import { API_BASE_URL, getAuthHeaders } from "../doctorApi.js";
import "./WalkInAppointment.css";

const WALKIN_BASE_URL = `${API_BASE_URL}/walkin-appointments`;

export default function WalkInAppointment() {
  const location = useLocation();
  const authUser = useDoctorUser();
  const [appointments, setAppointments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [status, setStatus] = useState("idle");
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    gender: "",
    problem: "",
    doctor: "",
    department: "",
    priority: "Low",
  });
  const [errors, setErrors] = useState({});

  const getStoredAuthUser = () => {
    try {
      return JSON.parse(localStorage.getItem("userData") || "null");
    } catch (error) {
      return null;
    }
  };

  const extractDoctorId = (user) => {
    if (!user) return "";
    return user.doctor_id || user.doctorId || user.id || user._id || user.user_id || user.userId || "";
  };

  const queryDoctorId = new URLSearchParams(location.search).get("doctorId");
  const isQrForm = location.pathname === "/walkinappointment/form";
  const doctorId = queryDoctorId || extractDoctorId(authUser || getStoredAuthUser());
  const totalPages = Math.max(1, Math.ceil(appointments.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const firstRowIndex = appointments.length ? (safeCurrentPage - 1) * pageSize : 0;
  const paginatedAppointments = appointments.slice(firstRowIndex, firstRowIndex + pageSize);
  const lastRowIndex = Math.min(firstRowIndex + pageSize, appointments.length);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const unwrapApiArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    if (Array.isArray(payload?.appointments)) return payload.appointments;
    if (Array.isArray(payload?.walkins)) return payload.walkins;
    return [];
  };

  const formatAppointmentDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
  };

  const formatAppointmentTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const normalizeAppointment = (item) => {
    const createdAt = item.created_at || item.createdAt || item.date || item.appointment_date;
    return {
      id: item.id || item._id,
      name:
        item.patient_name ||
        item.patientName ||
        item.walkin_patient_name ||
        item.walkinPatientName ||
        item.visitor_name ||
        item.visitorName ||
        item.name ||
        item.full_name ||
        "",
      phone: item.phone_number || item.phone || item.contact_number || "",
      gender: item.gender || "Not specified",
      problem: item.problem || item.symptoms || item.reason || item.description || "",
      type: item.type || "WALK_IN",
      status: (
        item.appointment_status ||
        item.appointmentStatus ||
        item.walkin_status ||
        item.queue_status ||
        item.status ||
        "BOOKED"
      ).toUpperCase().replace(/[\s-]+/g, "_"),
      date: formatAppointmentDate(createdAt),
      time: item.time || item.appointment_time || formatAppointmentTime(createdAt),
      doctor: item.doctor_name || item.doctor?.name || item.doctor || "Not assigned",
      department: item.department || item.dept || "Not assigned",
      priority: item.priority || "Not specified",
      token:
        item.token_number ||
        item.tokenNumber ||
        item.token_no ||
        item.tokenNo ||
        item.walkin_token ||
        item.walkinToken ||
        item.queue_token ||
        item.queueToken ||
        item.appointment_token ||
        item.appointmentToken ||
        item.token ||
        "",
    };
  };

  const loadAppointments = async () => {
    if (!doctorId) {
      setApiError("Doctor ID not found. Please login again.");
      setAppointments([]);
      return;
    }

    try {
      setStatus("loading");
      setApiError("");
      const response = await axios.get(WALKIN_BASE_URL, {
        headers: getAuthHeaders(),
        params: { doctor_id: doctorId },
      });
      setAppointments(unwrapApiArray(response.data).map(normalizeAppointment));
      setStatus("succeeded");
    } catch (error) {
      setApiError(error.response?.data?.message || error.response?.data?.error || error.message || "Failed to load walk-in appointments");
      setAppointments([]);
      setStatus("failed");
    }
  };

  useEffect(() => {
    if (isQrForm) return;
    loadAppointments();
  }, [doctorId, isQrForm]);

  useEffect(() => {
    if (isQrForm) setShowModal(true);
  }, [isQrForm]);

  const openModal = () => {
    setShowModal(true);
    setErrors({});
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      name: "",
      phone: "",
      gender: "",
      problem: "",
      doctor: "",
      department: "",
      priority: "Low",
    });
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ""
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }
    
    if (!formData.problem.trim()) {
      newErrors.problem = "Problem description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitRequest = async () => {
    if (!validateForm()) {
      return;
    }

    if (!doctorId) {
      setApiError("Doctor ID not found. Please login again.");
      return;
    }

    const payload = {
      patient_name: formData.name.trim(),
      phone_number: formData.phone.trim(),
      symptoms: formData.problem.trim(),
      doctor_id: doctorId,
      gender: formData.gender || "Not specified",
      doctor_name: formData.doctor.trim(),
      department: formData.department.trim(),
      priority: formData.priority,
      status: "booked",
    };

    try {
      setSubmitting(true);
      setApiError("");
      const response = await axios.post(WALKIN_BASE_URL, payload, {
        headers: getAuthHeaders(),
      });
      closeModal();
      await loadAppointments();
    } catch (error) {
      setApiError(error.response?.data?.message || error.response?.data?.error || error.message || "Failed to create walk-in appointment");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelAppointment = async (id) => {
    try {
      setApiError("");
      const response = await axios.patch(`${WALKIN_BASE_URL}/${id}`, {
        status: "cancelled",
        doctor_id: doctorId,
      }, {
        headers: getAuthHeaders(),
      });
      const updatedAppointment = response.data?.data || response.data?.appointment || response.data;
      setAppointments(appointments.map(apt =>
        apt.id === id ? normalizeAppointment({ ...apt, ...updatedAppointment, status: "CANCELLED" }) : apt
      ));
    } catch (error) {
      setApiError(error.response?.data?.message || error.response?.data?.error || error.message || "Failed to cancel appointment");
    }
  };

  const deleteAppointment = async (id) => {
    if (window.confirm("Are you sure you want to delete this appointment?")) {
      try {
        setApiError("");
        await axios.delete(`${WALKIN_BASE_URL}/${id}`, {
          headers: getAuthHeaders(),
          data: { doctor_id: doctorId },
        });
        setAppointments(appointments.filter(apt => apt.id !== id));
      } catch (error) {
        setApiError(error.response?.data?.message || error.response?.data?.error || error.message || "Failed to delete appointment");
      }
    }
  };

  const renderStatusBadge = (status) => {
    switch(status) {
      case "BOOKED": return <span className="walkin-status waiting"><i></i> Waiting</span>;
      case "WAITING": return <span className="walkin-status waiting"><i></i> Waiting</span>;
      case "IN_CONSULTATION": return <span className="walkin-status consulting"><Stethoscope size={13} /> In Consultation</span>;
      case "COMPLETED": return <span className="walkin-status completed"><CheckCircle size={13} /> Completed</span>;
      case "CANCELLED": return <span className="walkin-status cancelled"><XCircle size={13} /> Cancelled</span>;
      default: return <span className="walkin-status waiting"><i></i> Waiting</span>;
    }
  };

  const getStatusCount = (status) => {
    return appointments.filter(apt => apt.status === status).length;
  };

  const getToken = (apt) => apt.token || "—";
  const currentToken = appointments.length ? getToken(appointments[0]) : "—";
  const waitingCount = appointments.filter(apt => ["BOOKED", "WAITING"].includes(apt.status)).length;
  const consultationCount = getStatusCount("IN_CONSULTATION");
  const completedCount = getStatusCount("COMPLETED");
  const cancelledCount = getStatusCount("CANCELLED");
  const nextDoctor = appointments.find((appointment) =>
    ["BOOKED", "WAITING", "IN_CONSULTATION"].includes(appointment.status)
  )?.doctor || "—";

  return (
    <div className={`walkin-main walkin-portal ${isQrForm ? "walkin-qr-page" : ""}`}>
      {showModal && (
        <div className="walkin-modal-overlay" onClick={closeModal}>
          <div className="walkin-modal" onClick={(event) => event.stopPropagation()}>
            <div className="walkin-modal-header">
              <div>
                <h3>New Walk-in Appointment</h3>
                <p>Add same-day patient details to the live queue.</p>
              </div>
              <button className="walkin-modal-close" onClick={closeModal} type="button">
                &times;
              </button>
            </div>

            <div className="walkin-modal-body walkin-form-grid">
              <div className="walkin-form-group">
                <label htmlFor="name">Patient Name <span>*</span></label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Michael Johnson" className={errors.name ? "walkin-input-error" : ""} />
                {errors.name && <div className="walkin-error-message">{errors.name}</div>}
              </div>
              <div className="walkin-form-group">
                <label htmlFor="phone">Phone Number <span>*</span></label>
                <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="1234567890" className={errors.phone ? "walkin-input-error" : ""} />
                {errors.phone && <div className="walkin-error-message">{errors.phone}</div>}
              </div>
              <div className="walkin-form-group">
                <label htmlFor="gender">Gender</label>
                <select id="gender" name="gender" value={formData.gender} onChange={handleInputChange}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="walkin-form-group">
                <label htmlFor="doctor">Doctor</label>
                <input id="doctor" name="doctor" value={formData.doctor} onChange={handleInputChange} placeholder="Enter doctor name" />
              </div>
              <div className="walkin-form-group">
                <label htmlFor="department">Department</label>
                <select id="department" name="department" value={formData.department} onChange={handleInputChange}>
                  <option value="">Select Department</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Pediatrics">Pediatrics</option>
                </select>
              </div>
              <div className="walkin-form-group">
                <label htmlFor="priority">Priority</label>
                <select id="priority" name="priority" value={formData.priority} onChange={handleInputChange}>
                  <option value="Low">Low</option>
                  <option value="Med">Med</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="walkin-form-group walkin-wide-field">
                <label htmlFor="problem">Problem/Symptoms <span>*</span></label>
                <textarea id="problem" name="problem" value={formData.problem} onChange={handleInputChange} placeholder="Describe the problem or symptoms" rows="3" className={errors.problem ? "walkin-input-error" : ""} />
                {errors.problem && <div className="walkin-error-message">{errors.problem}</div>}
              </div>
            </div>

            <div className="walkin-modal-footer">
              <button className="walkin-btn-secondary" onClick={closeModal} type="button">Cancel</button>
              <button className="walkin-primary-btn" onClick={submitRequest} disabled={submitting} type="button">
                <CheckCircle size={18} /> {submitting ? "Creating..." : "Create Appointment"}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="walkin-page-header">
        <div>
          <h1>Walk-in Appointments</h1>
          <p>Manage same-day patient appointments and live queue status.</p>
        </div>
      </header>

      {apiError && <div className="walkin-api-error">{apiError}</div>}

      <section className="walkin-summary-grid">
        <article><div className="blue"><Users size={20} /></div><strong>{appointments.length}</strong><span>Total Walk-ins</span></article>
        <article><div className="orange"><Clock size={20} /></div><strong>{waitingCount}</strong><span>Waiting</span></article>
        <article><div className="green"><Stethoscope size={20} /></div><strong>{consultationCount}</strong><span>In Consultation</span></article>
        <article><div className="teal"><CircleCheck size={20} /></div><strong>{completedCount}</strong><span>Completed</span></article>
        <article><div className="red"><CircleX size={20} /></div><strong>{cancelledCount}</strong><span>Cancelled</span></article>
      </section>

      <section className="walkin-live-bar">
        <div className="walkin-live-label"><Link2 size={18} /> Live Queue Status</div>
        <div className="walkin-live-stat"><span>Current Token</span><strong>{currentToken}</strong></div>
        <div className="walkin-live-stat"><span>Avg Wait</span><strong className="orange-text">—</strong></div>
        <div className="walkin-live-stat"><span>Next Doctor Available</span><strong>{nextDoctor}</strong></div>
        <div className="walkin-live-stat"><span>Est. Max Wait</span><strong>—</strong></div>
      </section>

      <section className="walkin-table-card">
        <div className="walkin-table-toolbar">
          <label><Search size={16} /><input placeholder="Search patient name, phone..." /></label>
          <label><CalendarDays size={16} /><input type="date" /></label>
          <select defaultValue=""><option value="">All Doctors</option></select>
          <select defaultValue=""><option value="">All Departments</option></select>
          <select defaultValue=""><option value="">Status: All</option></select>
          <button type="button"><SlidersHorizontal size={16} /> More</button>
        </div>

        <div className="walkin-table-wrapper">
          <table className="walkin-appointment-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Patient</th>
                <th>Time</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {status === "loading" ? (
                <tr><td colSpan="6" className="walkin-empty-row">Loading appointments...</td></tr>
              ) : appointments.length === 0 ? (
                <tr><td colSpan="6" className="walkin-empty-row">No walk-in appointments found</td></tr>
              ) : (
                paginatedAppointments.map((apt) => (
                  <tr key={apt.id}>
                    <td className="walkin-token">{getToken(apt)}</td>
                    <td>
                      <div className="walkin-patient-cell">
                        <span>{apt.name?.split(" ").map((part) => part[0]).slice(0, 2).join("") || "NA"}</span>
                        <div><strong>{apt.name}</strong><small>{apt.phone}</small></div>
                      </div>
                    </td>
                    <td><div className="walkin-time-cell"><strong>{apt.time || "—"}</strong></div></td>
                    <td><span className={`walkin-priority ${String(apt.priority).toLowerCase()}`}>{apt.priority}</span></td>
                    <td>{renderStatusBadge(apt.status)}</td>
                    <td>
                      <div className="walkin-action-buttons">
                        <button
                          onClick={() => cancelAppointment(apt.id)}
                          className="walkin-action-btn walkin-btn-cancel"
                          type="button"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => deleteAppointment(apt.id)}
                          className="walkin-action-btn walkin-btn-delete"
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="walkin-pagination">
          <span>Showing {appointments.length ? firstRowIndex + 1 : 0} to {lastRowIndex} of {appointments.length} entries</span>
          <div>
            <button type="button" aria-label="Previous page" disabled={safeCurrentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>‹</button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button type="button" key={page} className={page === safeCurrentPage ? "active" : ""} onClick={() => setCurrentPage(page)}>{page}</button>
            ))}
            <button type="button" aria-label="Next page" disabled={safeCurrentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>›</button>
          </div>
        </div>
      </section>
    </div>
  );
}
