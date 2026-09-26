import React, { useEffect, useState } from "react";
import { useDoctorUser } from "../doctorApi.js";
import axios from "../../../axiosConfig.js";
import { API_BASE_URL, getAuthHeaders } from "../doctorApi.js";
import "./Appointment List.css";
import { getAppointmentPatientDetails } from "./patientDetails.js";

export default function AppointmentList() {
  const authUser = useDoctorUser();
  const [appointments, setAppointments] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [hideCompleted, setHideCompleted] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [activeActionsId, setActiveActionsId] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [viewAppointment, setViewAppointment] = useState(null);
  const [editAppointment, setEditAppointment] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [paymentSettings, setPaymentSettings] = useState({ onlinePayment: true, upiBank: false, cash: true });
  const [newAppointment, setNewAppointment] = useState({
    patientName: "",
    phone: "",
    appointmentDate: new Date().toISOString().split("T")[0],
    appointmentTime: "",
    test: "",
    location: "",
    type: "Clinic",
    status: "Pending",
    paymentMethod: "cash",
    paymentAmount: "",
    paymentReference: "",
    paymentStatus: "pending",
  });

  const getStoredAuthUser = () => {
    try {
      return JSON.parse(localStorage.getItem("userData") || "null");
    } catch {
      return null;
    }
  };

  const getDoctorId = () => {
    const user = authUser || getStoredAuthUser() || {};
    return user.doctor_id || user.doctorId || user.id || user._id || user.user_id || user.userId || "";
  };

  const loadPaymentSettings = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(`doctorPaymentSettings:${getDoctorId() || "doctor"}`) || "null");
      const next = { onlinePayment: true, upiBank: false, cash: true, ...(stored || {}) };
      setPaymentSettings(next);
      return next;
    } catch {
      return { onlinePayment: true, upiBank: false, cash: true };
    }
  };

  const getEnabledPaymentMethods = (settings = paymentSettings) => [
    settings.cash && { value: "cash", label: "Cash" },
    settings.upiBank && { value: "upi", label: "UPI / Bank Transfer" },
    settings.onlinePayment && { value: "online", label: "Online Payment" },
  ].filter(Boolean);

  const openNewAppointmentModal = () => {
    const settings = loadPaymentSettings();
    const firstMethod = getEnabledPaymentMethods(settings)[0]?.value || "";
    setNewAppointment((previous) => ({ ...previous, paymentMethod: firstMethod, paymentAmount: "", paymentReference: "", paymentStatus: "pending" }));
    setShowNewModal(true);
  };

  const unwrapApiArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.appointments)) return payload.appointments;
    if (Array.isArray(payload?.data?.appointments)) return payload.data.appointments;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
  };

  const formatDate = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateForInput = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateLabel = (value) => {
    if (!value) return "All Dates";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    const [hours, minutes] = String(value).split(":");
    if (!hours || !minutes) return value;
    const time = new Date();
    time.setHours(Number(hours), Number(minutes), 0, 0);
    return time.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDoctor = (appointment) => appointment.doctor || appointment.doctor_details || {};
  const getClinic = (appointment) => appointment.clinic || appointment.clinic_details || {};

  const normalizeStatus = (value) => {
    const statusValue = String(value || "Pending").toLowerCase();
    if (statusValue === "confirmed" || statusValue === "accepted" || statusValue === "active") return "Confirmed";
    if (statusValue === "completed" || statusValue === "complete") return "Completed";
    if (statusValue === "cancelled" || statusValue === "canceled") return "Cancelled";
    return "Pending";
  };

  const normalizeType = (value) => {
    const mode = String(value || "").toLowerCase();
    if (mode === "offline" || mode === "clinic" || mode === "in-clinic") return "Clinic";
    if (mode === "video" || mode === "video-call") return "Video Call";
    if (mode === "voice" || mode === "voice-call") return "Voice Call";
    if (mode === "online") return "Online";
    return value || "N/A";
  };

  const normalizeAppointment = (appointment, index) => {
    const doctor = getDoctor(appointment);
    const clinic = getClinic(appointment);

    return {
      id: appointment.id || appointment.appointment_id || appointment._id || index,
      doctorId: appointment.doctor_id || appointment.doctorId || doctor.id || doctor._id,
      tokenNumber:
        appointment.token_number ||
        appointment.tokenNumber ||
        appointment.token ||
        appointment.appointment_token ||
        appointment.appointmentToken ||
        "N/A",
      doctorName:
        appointment.doctor_name ||
        doctor.name ||
        doctor.full_name ||
        "N/A",
      clinicName:
        appointment.clinic_name ||
        clinic.name ||
        clinic.clinic_name ||
        "N/A",
      date: formatDate(appointment.appointment_date || appointment.date || appointment.created_at),
      rawDate: formatDateForInput(appointment.appointment_date || appointment.date || appointment.created_at),
      time: formatTime(appointment.appointment_time || appointment.time || appointment.created_at),
      rawTime: appointment.appointment_time || appointment.time || appointment.created_at,
      type: normalizeType(appointment.consultation_mode || appointment.type || appointment.mode),
      status: normalizeStatus(appointment.appointment_status || appointment.status),
      isEmergency: String(appointment.priority || '').toLowerCase() === 'emergency',
      emergencyReason: appointment.emergency_reason || '',
      awaitingEmergency: String(appointment.priority || '').toLowerCase() === 'emergency' && !appointment.appointment_time,
      test:
        appointment.test_name ||
        appointment.reason ||
        appointment.issue ||
        appointment.symptoms ||
        appointment.department ||
        normalizeType(appointment.consultation_mode || appointment.type || appointment.mode),
      ...getAppointmentPatientDetails(appointment),
      paymentMethod: String(appointment.payment_method || appointment.paymentMethod || "").toLowerCase(),
      paymentAmount: appointment.payment_amount || appointment.amount_paid || appointment.consultation_fee || appointment.paymentAmount || "",
      paymentReference: appointment.payment_reference || appointment.transaction_id || appointment.upi_reference || appointment.paymentReference || "",
      paymentStatus: String(appointment.payment_status || appointment.paymentStatus || "pending").toLowerCase(),
    };
  };

  useEffect(() => {
    const controller = new AbortController();

    const loadAppointments = async () => {
      const doctorId = getDoctorId();
      if (!doctorId) {
        setError("Doctor id not found. Please login again.");
        setStatus("failed");
        return;
      }

      try {
        setStatus("loading");
        setError("");
        const response = await axios.get(`${API_BASE_URL}/appointments`, {
          headers: getAuthHeaders(),
          params: { doctor_id: doctorId },
          signal: controller.signal,
        });

        const rows = unwrapApiArray(response.data)
          .map(normalizeAppointment)
          .filter((appointment) => !appointment.doctorId || String(appointment.doctorId) === String(doctorId));

        setAppointments(rows);
        setStatus("succeeded");
      } catch (error) {
        if (axios.isCancel(error)) return;
        setError(error.response?.data?.message || error.response?.data?.error || error.message || "Failed to load appointments");
        setStatus("failed");
      }
    };

    loadAppointments();

    return () => controller.abort();
  }, [authUser, reloadKey]);

  const getUiStatus = (appointmentStatus) => {
    if (appointmentStatus === "Confirmed") {
      return { label: "Confirmed", className: "confirmed", icon: "fa-solid fa-calendar-check" };
    }
    if (appointmentStatus === "Completed") {
      return { label: "Completed", className: "completed", icon: "fa-solid fa-circle-check" };
    }
    if (appointmentStatus === "Cancelled") {
      return { label: "Cancelled", className: "cancelled", icon: "fa-solid fa-circle-xmark" };
    }
    return { label: "Pending", className: "pending", icon: "fa-solid fa-clock" };
  };

  const getTimeRange = (appointment) => {
    if (appointment.awaitingEmergency) return "Emergency — time not assigned";
    if (!appointment.rawTime || appointment.rawTime === "N/A") return appointment.time;
    const date = new Date(appointment.rawTime);
    if (Number.isNaN(date.getTime())) return appointment.time;
    const end = new Date(date.getTime() + 30 * 60000);
    return `${formatTime(date)} - ${formatTime(end)}`;
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesStatus = statusFilter === "All" || appointment.status === statusFilter;
    const matchesCompletedVisibility = !hideCompleted || appointment.status !== "Completed";
    const matchesDate = !selectedDate || !appointment.rawDate || appointment.rawDate === selectedDate;
    const query = searchText.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [appointment.tokenNumber, appointment.patientName, appointment.phone, appointment.test, appointment.location]
        .join(" ")
        .toLowerCase()
        .includes(query);
    return matchesStatus && matchesCompletedVisibility && matchesDate && matchesSearch;
  });
  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const firstRowIndex = filteredAppointments.length ? (safeCurrentPage - 1) * pageSize : 0;
  const paginatedAppointments = filteredAppointments.slice(firstRowIndex, firstRowIndex + pageSize);
  const lastRowIndex = Math.min(firstRowIndex + pageSize, filteredAppointments.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, hideCompleted, searchText, selectedDate]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const allVisibleSelected =
    paginatedAppointments.length > 0 &&
    paginatedAppointments.every((appointment) => selectedRows.includes(appointment.id));

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedRows((prev) => prev.filter((id) => !paginatedAppointments.some((appointment) => appointment.id === id)));
      return;
    }

    setSelectedRows((prev) => Array.from(new Set([...prev, ...paginatedAppointments.map((appointment) => appointment.id)])));
  };

  const toggleRow = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]));
  };

  const updateNewAppointment = (field, value) => {
    setNewAppointment((prev) => ({ ...prev, [field]: value }));
  };

  const getFormTime = (appointment) => {
    if (!appointment?.rawTime || appointment.rawTime === "N/A") return "";
    const date = new Date(appointment.rawTime);
    if (!Number.isNaN(date.getTime())) {
      return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    }
    return String(appointment.rawTime).slice(0, 5);
  };

  const appointmentToForm = (appointment) => ({
    patientName: appointment.patientName === "N/A" ? "" : appointment.patientName,
    phone: appointment.phone === "N/A" ? "" : appointment.phone,
    appointmentDate: appointment.rawDate || new Date().toISOString().split("T")[0],
    appointmentTime: getFormTime(appointment),
    test: appointment.test === "N/A" ? "" : appointment.test,
    location: appointment.location === "N/A" ? "" : appointment.location,
    type: appointment.type === "N/A" ? "Clinic" : appointment.type,
    status: appointment.status || "Confirmed",
    paymentMethod: appointment.paymentMethod || "",
    paymentAmount: appointment.paymentAmount || "",
    paymentReference: appointment.paymentReference || "",
    paymentStatus: appointment.paymentStatus || "pending",
  });

  const buildAppointmentFromForm = (form, existing = {}) => ({
    ...existing,
    id: existing.id || `local-${Date.now()}`,
    doctorId: existing.doctorId || getDoctorId(),
    patientName: form.patientName || "New Patient",
    doctorName: existing.doctorName || "N/A",
    clinicName: existing.clinicName || "N/A",
    phone: form.phone || "N/A",
    date: formatDate(form.appointmentDate),
    rawDate: form.appointmentDate,
    time: formatTime(form.appointmentTime),
    rawTime: `${form.appointmentDate}T${form.appointmentTime || "00:00"}`,
    type: form.type,
    status: form.status,
    test: form.test || form.type,
    location: form.location || "N/A",
    paymentMethod: form.paymentMethod,
    paymentAmount: form.paymentAmount,
    paymentReference: form.paymentReference,
    paymentStatus: form.paymentStatus,
  });

  const handleCreateAppointment = (event) => {
    event.preventDefault();
    if (!newAppointment.paymentMethod) return alert("Enable and select a payment method in Payment Settings first.");
    if (!(Number(newAppointment.paymentAmount) > 0)) return alert("Enter a valid payment amount.");
    if (newAppointment.paymentMethod !== "cash" && !newAppointment.paymentReference.trim()) {
      return alert("Enter the UPI or online transaction reference number.");
    }
    const localAppointment = buildAppointmentFromForm(newAppointment);

    setAppointments((prev) => [localAppointment, ...prev]);
    setSelectedDate(newAppointment.appointmentDate);
    setShowNewModal(false);
    setNewAppointment({
      patientName: "",
      phone: "",
      appointmentDate: new Date().toISOString().split("T")[0],
      appointmentTime: "",
      test: "",
      location: "",
      type: "Clinic",
      status: "Pending",
      paymentMethod: getEnabledPaymentMethods()[0]?.value || "",
      paymentAmount: "",
      paymentReference: "",
      paymentStatus: "pending",
    });
  };

  const openEditAppointment = (appointment) => {
    const settings = loadPaymentSettings();
    const enabledMethods = getEnabledPaymentMethods(settings);
    const form = appointmentToForm(appointment);
    if (!enabledMethods.some((method) => method.value === form.paymentMethod)) {
      form.paymentMethod = enabledMethods[0]?.value || "";
      form.paymentReference = "";
    }
    setEditAppointment({ id: appointment.id, form });
    setViewAppointment(null);
    setActiveActionsId(null);
  };

  const updateEditAppointment = (field, value) => {
    setEditAppointment((prev) => ({ ...prev, form: { ...prev.form, [field]: value } }));
  };

  const handleUpdateAppointment = (event) => {
    event.preventDefault();
    if (!editAppointment.form.paymentMethod) return alert("Select a payment method.");
    if (!(Number(editAppointment.form.paymentAmount) > 0)) return alert("Enter a valid payment amount.");
    if (editAppointment.form.paymentMethod !== "cash" && !editAppointment.form.paymentReference.trim()) {
      return alert("Enter the UPI or online transaction reference number.");
    }
    setAppointments((prev) =>
      prev.map((appointment) =>
        appointment.id === editAppointment.id
          ? buildAppointmentFromForm(editAppointment.form, appointment)
          : appointment
      )
    );
    setSelectedDate(editAppointment.form.appointmentDate);
    setEditAppointment(null);
  };

  const handleDeleteAppointment = async (appointment) => {
    if (!window.confirm(`Delete appointment for ${appointment.patientName}?`)) return;
    setAppointments((prev) => prev.filter((item) => item.id !== appointment.id));
    setSelectedRows((prev) => prev.filter((id) => id !== appointment.id));
    setActiveActionsId(null);

    if (String(appointment.id).startsWith("local-")) return;

    try {
      await axios.delete(`${API_BASE_URL}/appointments/${appointment.id}`, {
        headers: getAuthHeaders(),
      });
    } catch (error) {
      setError(error.response?.data?.message || error.response?.data?.error || "Appointment removed locally. Delete API failed.");
    }
  };

  const handleCallAppointment = (appointment) => {
    const rawPhone = String(appointment?.phone || "").trim();
    if (!rawPhone || rawPhone.toUpperCase() === "N/A") {
      setError(`Phone number is not available for ${appointment?.patientName || "this patient"}.`);
      return;
    }

    const digits = rawPhone.replace(/\D/g, "");
    if (digits.length < 7) {
      setError(`Invalid phone number for ${appointment?.patientName || "this patient"}.`);
      return;
    }

    setError("");
    const dialNumber = rawPhone.startsWith("+") ? `+${digits}` : digits;
    window.location.href = `tel:${dialNumber}`;
  };

  const clearAllFilters = () => {
    setStatusFilter("All");
    setSearchText("");
    setSelectedDate("");
    setHideCompleted(false);
  };

  const activeFilterChips = [
    statusFilter !== "All" && {
      key: "status",
      label: `Status: ${statusFilter}`,
      onClear: () => setStatusFilter("All"),
    },
    selectedDate && {
      key: "date",
      label: `Date: ${formatDateLabel(selectedDate)}`,
      onClear: () => setSelectedDate(""),
    },
    searchText.trim() && {
      key: "search",
      label: `Search: ${searchText.trim()}`,
      onClear: () => setSearchText(""),
    },
    hideCompleted && {
      key: "hide-completed",
      label: "Hide completed",
      onClear: () => setHideCompleted(false),
    },
  ].filter(Boolean);

  return (
    <div className="appointment-page">
      <section className="appointment-header">
        <div>
          <h1>Appointments</h1>
          <p>Showing: <strong>{filteredAppointments.length}</strong> of {appointments.length} appointments</p>
        </div>
      </section>

      <section className="appointment-toolbar" aria-label="Appointment filters">
        <div className="appointment-searchbar">
          <label>
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option>All</option>
              <option>Pending</option>
              <option>Confirmed</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
          </label>

          <label>
            <span>Search</span>
            <div className="appointment-search-input">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="search"
              placeholder="Patient, phone, token, type..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
            </div>
          </label>

          <label className="date-picker-control">
            <span>Date</span>
            <input
              type="date"
              value={selectedDate}
              title={formatDateLabel(selectedDate)}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </label>

          <div className="appointment-date-actions" aria-label="Date shortcuts">
            <button type="button" className="today-link" onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}>Today</button>
          </div>

          <label className="appointment-toggle">
            <input
              type="checkbox"
              checked={hideCompleted}
              onChange={(event) => setHideCompleted(event.target.checked)}
            />
            Hide completed
          </label>

          <button
            type="button"
            className="clear-filters-btn"
            onClick={clearAllFilters}
            disabled={activeFilterChips.length === 0}
          >
            Clear Filters
          </button>
        </div>
      </section>

      {status === "failed" && (
        <div className="appointment-alert" role="alert">
          {error}
        </div>
      )}

      <section className="appointment-filter-row">
        <div className="filter-chips">
          {activeFilterChips.length > 0 ? (
            activeFilterChips.map((chip) => (
              <button type="button" key={chip.key} onClick={chip.onClear}>
                {chip.label} <i className="fa-solid fa-xmark"></i>
              </button>
            ))
          ) : (
            <span className="no-active-filters">No active filters</span>
          )}
        </div>
      </section>

      <section className="appointment-table-shell">
        <table className="appointment-table">
          <thead>
            <tr>
              <th className="check-cell"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} /></th>
              <th>Time <i className="fa-solid fa-arrow-up-short-wide"></i></th>
              <th>Token</th>
              <th>Patient</th>
              <th>Phone No</th>
              <th>Test</th>
              <th>Location</th>
              <th>Status</th>
              <th>Info</th>
              <th className="more-cell"><i className="fa-solid fa-ellipsis-vertical"></i></th>
            </tr>
          </thead>
          <tbody>
            {status === "loading" ? (
              <tr>
                <td colSpan="10" className="appointment-empty">Loading appointments...</td>
              </tr>
            ) : filteredAppointments.length === 0 ? (
              <tr>
                <td colSpan="10" className="appointment-empty">No appointments found</td>
              </tr>
            ) : (
              paginatedAppointments.map((appointment, index) => {
                const statusMeta = getUiStatus(appointment.status);
                const isSelected = selectedRows.includes(appointment.id);
                return (
                  <tr key={appointment.id} className={isSelected ? "selected" : ""}>
                    <td className="check-cell">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleRow(appointment.id)} />
                    </td>
                    <td>{getTimeRange(appointment)}</td>
                    <td>{appointment.tokenNumber}</td>
                    <td>{appointment.patientName}{appointment.isEmergency && <span className="doctor-emergency-badge" title={appointment.emergencyReason}>Emergency</span>}</td>
                    <td>{appointment.phone}</td>
                    <td className="test-cell">{appointment.test}</td>
                    <td className="location-cell">{appointment.location}</td>
                    <td>
                      <span className={`status-pill ${statusMeta.className}`}>
                        <i className={statusMeta.icon}></i>
                        {statusMeta.label}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="call-btn"
                        aria-label={`Call ${appointment.patientName}`}
                        title={`Call ${appointment.phone}`}
                        onClick={() => handleCallAppointment(appointment)}
                      >
                        <i className="fa-solid fa-phone"></i>
                      </button>
                    </td>
                    <td className="more-cell">
                      {activeActionsId === appointment.id ? (
                        <div className="row-actions">
                          <button type="button" title="Refresh" onClick={() => setReloadKey((key) => key + 1)}><i className="fa-solid fa-rotate-left"></i></button>
                          <button type="button" title="Update" onClick={() => openEditAppointment(appointment)}><i className="fa-solid fa-pen"></i></button>
                          <button type="button" title="View" onClick={() => { setViewAppointment(appointment); setActiveActionsId(null); }}><i className="fa-solid fa-eye"></i></button>
                          <button type="button" className="danger" title="Delete" onClick={() => handleDeleteAppointment(appointment)}><i className="fa-solid fa-trash"></i></button>
                          <button type="button" onClick={() => setActiveActionsId(null)} title="Close"><i className="fa-solid fa-ellipsis-vertical"></i></button>
                        </div>
                      ) : (
                        <button type="button" className="more-btn" aria-label="More actions" onClick={() => setActiveActionsId(appointment.id)}>
                          <i className="fa-solid fa-ellipsis-vertical"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      <section className="appointment-pagination">
        <p>Showing <strong>{filteredAppointments.length ? firstRowIndex + 1 : 0}</strong> to <strong>{lastRowIndex}</strong> of <strong>{filteredAppointments.length}</strong> appointments</p>
        <div className="appointment-pagination-buttons">
          <button type="button" aria-label="Previous page" disabled={safeCurrentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>‹</button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button type="button" key={page} className={page === safeCurrentPage ? "active" : ""} onClick={() => setCurrentPage(page)}>{page}</button>
          ))}
          <button type="button" aria-label="Next page" disabled={safeCurrentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>›</button>
        </div>
      </section>

      {showNewModal && (
        <div className="appointment-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setShowNewModal(false)}>
          <form className="appointment-modal" onSubmit={handleCreateAppointment} onClick={(event) => event.stopPropagation()}>
            <div className="appointment-modal-header">
              <div>
                <h2>New Appointment</h2>
                <p>Create appointment details. API connection can be wired after UI approval.</p>
              </div>
              <button type="button" onClick={() => setShowNewModal(false)} aria-label="Close">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="appointment-form-grid">
              <label>
                Patient Name
                <input
                  required
                  value={newAppointment.patientName}
                  onChange={(event) => updateNewAppointment("patientName", event.target.value)}
                  placeholder="Enter patient name"
                />
              </label>
              <label>
                Phone No
                <input
                  value={newAppointment.phone}
                  onChange={(event) => updateNewAppointment("phone", event.target.value)}
                  placeholder="Enter phone number"
                />
              </label>
              <label>
                Appointment Date
                <input
                  type="date"
                  required
                  value={newAppointment.appointmentDate}
                  onChange={(event) => updateNewAppointment("appointmentDate", event.target.value)}
                />
              </label>
              <label>
                Appointment Time
                <input
                  type="time"
                  required
                  value={newAppointment.appointmentTime}
                  onChange={(event) => updateNewAppointment("appointmentTime", event.target.value)}
                />
              </label>
              <label>
                Test / Reason
                <input
                  value={newAppointment.test}
                  onChange={(event) => updateNewAppointment("test", event.target.value)}
                  placeholder="Digestive Disorders"
                />
              </label>
              <label className="wide-field">
                Location
                <input
                  value={newAppointment.location}
                  onChange={(event) => updateNewAppointment("location", event.target.value)}
                  placeholder="Patient location"
                />
              </label>
              <label>
                Type
                <select value={newAppointment.type} onChange={(event) => updateNewAppointment("type", event.target.value)}>
                  <option>Clinic</option>
                  <option>Video Call</option>
                  <option>Voice Call</option>
                  <option>Online</option>
                </select>
              </label>
              <label>
                Status
                <select value={newAppointment.status} onChange={(event) => updateNewAppointment("status", event.target.value)}>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </label>
              <div className="appointment-payment-section wide-field">
                <div className="appointment-payment-heading"><span><i className="fa-solid fa-wallet" /> Payment Details</span><small>Methods enabled in Doctor Settings</small></div>
                {getEnabledPaymentMethods().length ? (
                  <div className="appointment-payment-grid">
                    <label>Payment Method<select value={newAppointment.paymentMethod} onChange={(event) => updateNewAppointment("paymentMethod", event.target.value)}>{getEnabledPaymentMethods().map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}</select></label>
                    <label>{newAppointment.paymentMethod === "cash" ? "Cash Amount" : "Payment Amount"}<input type="number" min="1" step="0.01" required value={newAppointment.paymentAmount} onChange={(event) => updateNewAppointment("paymentAmount", event.target.value)} placeholder="Enter amount" /></label>
                    {newAppointment.paymentMethod !== "cash" && <label>{newAppointment.paymentMethod === "upi" ? "UPI Reference ID" : "Transaction ID"}<input required value={newAppointment.paymentReference} onChange={(event) => updateNewAppointment("paymentReference", event.target.value)} placeholder="Enter payment reference" /></label>}
                    <label>Payment Status<select value={newAppointment.paymentStatus} onChange={(event) => updateNewAppointment("paymentStatus", event.target.value)}><option value="pending">Pending</option><option value="paid">Paid</option><option value="partial">Partially Paid</option></select></label>
                  </div>
                ) : <p className="appointment-payment-empty">No payment method is enabled. Enable one from Settings → Payment.</p>}
              </div>
            </div>

            <div className="appointment-modal-actions">
              <button type="button" className="modal-cancel-btn" onClick={() => setShowNewModal(false)}>Cancel</button>
              <button type="submit" className="modal-save-btn">Create Appointment</button>
            </div>
          </form>
        </div>
      )}

      {editAppointment && (
        <div className="appointment-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setEditAppointment(null)}>
          <form className="appointment-modal" onSubmit={handleUpdateAppointment} onClick={(event) => event.stopPropagation()}>
            <div className="appointment-modal-header">
              <div>
                <h2>Update Appointment</h2>
                <p>Edit appointment details for the selected patient.</p>
              </div>
              <button type="button" onClick={() => setEditAppointment(null)} aria-label="Close">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="appointment-form-grid">
              <label>
                Patient Name
                <input required value={editAppointment.form.patientName} onChange={(event) => updateEditAppointment("patientName", event.target.value)} />
              </label>
              <label>
                Phone No
                <input value={editAppointment.form.phone} onChange={(event) => updateEditAppointment("phone", event.target.value)} />
              </label>
              <label>
                Appointment Date
                <input type="date" required value={editAppointment.form.appointmentDate} onChange={(event) => updateEditAppointment("appointmentDate", event.target.value)} />
              </label>
              <label>
                Appointment Time
                <input type="time" required value={editAppointment.form.appointmentTime} onChange={(event) => updateEditAppointment("appointmentTime", event.target.value)} />
              </label>
              <label>
                Test / Reason
                <input value={editAppointment.form.test} onChange={(event) => updateEditAppointment("test", event.target.value)} />
              </label>
              <label className="wide-field">
                Location
                <input value={editAppointment.form.location} onChange={(event) => updateEditAppointment("location", event.target.value)} />
              </label>
              <label>
                Type
                <select value={editAppointment.form.type} onChange={(event) => updateEditAppointment("type", event.target.value)}>
                  <option>Clinic</option>
                  <option>Video Call</option>
                  <option>Voice Call</option>
                  <option>Online</option>
                </select>
              </label>
              <label>
                Status
                <select value={editAppointment.form.status} onChange={(event) => updateEditAppointment("status", event.target.value)}>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </label>
              <div className="appointment-payment-section wide-field">
                <div className="appointment-payment-heading"><span><i className="fa-solid fa-wallet" /> Payment Details</span><small>Methods enabled in Doctor Settings</small></div>
                <div className="appointment-payment-grid">
                  <label>Payment Method<select value={editAppointment.form.paymentMethod} onChange={(event) => { updateEditAppointment("paymentMethod", event.target.value); updateEditAppointment("paymentReference", ""); }}>{getEnabledPaymentMethods().map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}</select></label>
                  <label>{editAppointment.form.paymentMethod === "cash" ? "Cash Amount" : "Payment Amount"}<input type="number" min="1" step="0.01" required value={editAppointment.form.paymentAmount} onChange={(event) => updateEditAppointment("paymentAmount", event.target.value)} /></label>
                  {editAppointment.form.paymentMethod !== "cash" && <label>{editAppointment.form.paymentMethod === "upi" ? "UPI Reference ID" : "Transaction ID"}<input required value={editAppointment.form.paymentReference} onChange={(event) => updateEditAppointment("paymentReference", event.target.value)} /></label>}
                  <label>Payment Status<select value={editAppointment.form.paymentStatus} onChange={(event) => updateEditAppointment("paymentStatus", event.target.value)}><option value="pending">Pending</option><option value="paid">Paid</option><option value="partial">Partially Paid</option></select></label>
                </div>
              </div>
            </div>

            <div className="appointment-modal-actions">
              <button type="button" className="modal-cancel-btn" onClick={() => setEditAppointment(null)}>Cancel</button>
              <button type="submit" className="modal-save-btn">Update Appointment</button>
            </div>
          </form>
        </div>
      )}

      {viewAppointment && (
        <div className="appointment-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setViewAppointment(null)}>
          <div className="appointment-modal appointment-view-modal" onClick={(event) => event.stopPropagation()}>
            <div className="appointment-modal-header">
              <div>
                <h2>Appointment Details</h2>
                <p>{viewAppointment.patientName}</p>
              </div>
              <button type="button" onClick={() => setViewAppointment(null)} aria-label="Close">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="appointment-detail-grid">
              <div><span>Time</span><strong>{getTimeRange(viewAppointment)}</strong></div>
              <div><span>Token</span><strong>{viewAppointment.tokenNumber}</strong></div>
              <div><span>Patient</span><strong>{viewAppointment.patientName}</strong></div>
              {viewAppointment.isEmergency && <div><span>Emergency reason</span><strong>{viewAppointment.emergencyReason || 'Emergency appointment'}</strong></div>}
              <div><span>Phone No</span><strong>{viewAppointment.phone}</strong></div>
              <div><span>Test</span><strong>{viewAppointment.test}</strong></div>
              <div><span>Status</span><strong>{getUiStatus(viewAppointment.status).label}</strong></div>
              <div><span>Payment Method</span><strong>{viewAppointment.paymentMethod ? viewAppointment.paymentMethod.toUpperCase() : "N/A"}</strong></div>
              <div><span>Amount</span><strong>{viewAppointment.paymentAmount ? `₹${viewAppointment.paymentAmount}` : "N/A"}</strong></div>
              <div><span>Payment Status</span><strong>{viewAppointment.paymentStatus || "N/A"}</strong></div>
              {viewAppointment.paymentReference && <div><span>Payment Reference</span><strong>{viewAppointment.paymentReference}</strong></div>}
              <div className="wide-field"><span>Location</span><strong>{viewAppointment.location}</strong></div>
            </div>

            <div className="appointment-modal-actions">
              <button type="button" className="modal-cancel-btn" onClick={() => setViewAppointment(null)}>Close</button>
              <button type="button" className="modal-save-btn" onClick={() => openEditAppointment(viewAppointment)}>Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
