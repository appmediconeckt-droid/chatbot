import React, { useEffect, useMemo, useState } from "react";
import { useDoctorUser } from "../doctorApi.js";
import axios from "../../../axiosConfig.js";
import {
  CalendarDays,
  CheckCircle,
  Download,
  Filter,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { API_BASE_URL, getAuthHeaders } from "../doctorApi.js";
import "./FollowUp.css";

const FOLLOWUP_BASE_URL = `${API_BASE_URL}/followups`;

function FollowUp() {
  const authUser = useDoctorUser();
  const [followUps, setFollowUps] = useState([]);
  const [appointmentPatients, setAppointmentPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeActionsId, setActiveActionsId] = useState(null);
  const [viewFollowUp, setViewFollowUp] = useState(null);
  const [editFollowUp, setEditFollowUp] = useState(null);
  const [status, setStatus] = useState("idle");
  const [apiError, setApiError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [newPatient, setNewPatient] = useState({
    patientId: "",
    appointmentId: "",
    followUpDate: "",
    followUpTime: "",
    followUpType: "routine",
    notes: "",
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

  const getDoctorName = () => {
    const user = authUser || getStoredAuthUser() || {};
    return user.name || user.full_name || user.doctor_name || "Doctor";
  };

  const unwrapApiArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.followUps)) return payload.followUps;
    if (Array.isArray(payload?.followups)) return payload.followups;
    if (Array.isArray(payload?.data?.followUps)) return payload.data.followUps;
    if (Array.isArray(payload?.data?.followups)) return payload.data.followups;
    if (Array.isArray(payload?.appointments)) return payload.appointments;
    if (Array.isArray(payload?.data?.appointments)) return payload.data.appointments;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
  };

  const getPatient = (record) => record.patient || record.patient_details || {};
  const getDoctor = (record) => record.doctor || record.doctor_details || {};

  const getPatientId = (record) => {
    const patient = getPatient(record);
    return record.patient_id || record.patientId || patient.id || patient._id || "";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const normalizeDateInput = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return String(dateStr).slice(0, 10);
    return date.toISOString().split("T")[0];
  };

  const normalizeStatus = (value) => {
    const statusValue = String(value || "pending").toLowerCase();
    if (statusValue === "completed" || statusValue === "complete") return "completed";
    if (statusValue === "scheduled" || statusValue === "booked") return "scheduled";
    return "pending";
  };

  const normalizeType = (value) => {
    const type = String(value || "routine").toLowerCase();
    if (type === "urgent") return "urgent";
    if (type === "consultation") return "consultation";
    return "routine";
  };

  const buildAppointmentPatients = (appointments) => {
    const patientMap = new Map();

    appointments.forEach((appointment) => {
      const patient = getPatient(appointment);
      const patientId = getPatientId(appointment);
      if (!patientId) return;

      const patientName =
        appointment.patient_name ||
        patient.name ||
        patient.full_name ||
        patient.patient_name ||
        "Unnamed Patient";

      const existing = patientMap.get(String(patientId));
      const appointmentDate = appointment.appointment_date || appointment.date || appointment.created_at || "";
      const patientRecord = {
        id: patientId,
        appointmentId: appointment.id || appointment.appointment_id || appointment._id || "",
        name: patientName,
        age: appointment.age || patient.age || "N/A",
        phone: appointment.phone_number || appointment.phone || patient.phone_number || patient.phone || patient.mobile || "N/A",
        lastVisit: appointmentDate,
        issue: appointment.symptoms || appointment.health_issue || appointment.problem || appointment.reason || appointment.notes || "N/A",
      };

      if (!existing || new Date(appointmentDate) > new Date(existing.lastVisit || 0)) {
        patientMap.set(String(patientId), patientRecord);
      }
    });

    return Array.from(patientMap.values());
  };

  const normalizeFollowUp = (followUp, index) => {
    const patient = getPatient(followUp);
    const doctor = getDoctor(followUp);
    const patientId = getPatientId(followUp);
    const matchedPatient = appointmentPatients.find((item) => String(item.id) === String(patientId));

    return {
      id: followUp.id || followUp.followup_id || followUp.follow_up_id || followUp._id || index,
      doctorId: followUp.doctor_id || followUp.doctorId || doctor.id || doctor._id,
      patientId,
      appointmentId: followUp.appointment_id || followUp.appointmentId || "",
      name:
        followUp.patient_name ||
        patient.name ||
        patient.full_name ||
        matchedPatient?.name ||
        "N/A",
      age: followUp.age || patient.age || matchedPatient?.age || "N/A",
      phone:
        followUp.phone_number ||
        followUp.phone ||
        patient.phone_number ||
        patient.phone ||
        matchedPatient?.phone ||
        "N/A",
      lastVisit: followUp.last_visit || followUp.lastVisit || matchedPatient?.lastVisit || followUp.created_at,
      followUpDate: followUp.follow_up_date || followUp.follow_up_date || followUp.follow_up_date || followUp.date,
      followUpTime: followUp.followup_time || followUp.follow_up_time || followUp.followUpTime || followUp.time || "",
      followUpStatus: normalizeStatus(followUp.status || followUp.followup_status || followUp.followUpStatus),
      followUpType: normalizeType(
        followUp.follow_up_type ||
        followUp.type ||
        followUp.followup_type ||
        followUp.followUpType
      ),
      notes: followUp.notes || followUp.reason || followUp.description || matchedPatient?.issue || "N/A",
      doctor: followUp.doctor_name || doctor.name || doctor.full_name || getDoctorName(),
    };
  };

  const loadAppointmentPatients = async (doctorId, signal) => {
    const response = await axios.get(`${API_BASE_URL}/appointments`, {
      headers: getAuthHeaders(),
      params: { doctor_id: doctorId },
      signal,
    });

    const appointments = unwrapApiArray(response.data).filter((appointment) => {
      const doctor = getDoctor(appointment);
      const appointmentDoctorId = appointment.doctor_id || appointment.doctorId || doctor.id || doctor._id;
      return !appointmentDoctorId || String(appointmentDoctorId) === String(doctorId);
    });

    setAppointmentPatients(buildAppointmentPatients(appointments));
  };

  const loadFollowUps = async (doctorId, signal) => {
    const response = await axios.get(FOLLOWUP_BASE_URL, {
      headers: getAuthHeaders(),
      params: { doctor_id: doctorId },
      signal,
    });

    const rows = unwrapApiArray(response.data)
      .map(normalizeFollowUp)
      .filter((followUp) => !followUp.doctorId || String(followUp.doctorId) === String(doctorId));

    setFollowUps(rows);
  };

  const loadData = async (signal) => {
    const doctorId = getDoctorId();
    if (!doctorId) {
      setApiError("Doctor id not found. Please login again.");
      setStatus("failed");
      return;
    }

    try {
      setStatus("loading");
      setApiError("");
      await loadAppointmentPatients(doctorId, signal);
      await loadFollowUps(doctorId, signal);
      setStatus("succeeded");
    } catch (error) {
      if (axios.isCancel(error)) return;
      setApiError(error.response?.data?.message || error.response?.data?.error || error.message || "Failed to load follow-ups");
      setStatus("failed");
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [authUser]);

  useEffect(() => {
    let result = followUps;

    if (filterStatus !== "all") {
      result = result.filter((patient) => patient.followUpStatus === filterStatus);
    }

    if (filterType !== "all") {
      result = result.filter((patient) => patient.followUpType === filterType);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((patient) =>
        patient.name.toLowerCase().includes(term) ||
        String(patient.phone).includes(term) ||
        patient.doctor.toLowerCase().includes(term)
      );
    }

    setFilteredPatients(result);
  }, [followUps, filterStatus, filterType, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterType, searchTerm]);

  const selectedPatient = useMemo(
    () => appointmentPatients.find((patient) => String(patient.id) === String(newPatient.patientId)),
    [appointmentPatients, newPatient.patientId]
  );

  const handleStatusChange = async (followUpId, newStatus) => {
    const current = followUps.find((patient) => patient.id === followUpId);
    if (!current) return;

    const previous = followUps;
    setFollowUps((prev) =>
      prev.map((patient) =>
        patient.id === followUpId ? { ...patient, followUpStatus: newStatus } : patient
      )
    );

    try {
      await axios.put(
        `${FOLLOWUP_BASE_URL}/${followUpId}`,
        {
          doctor_id: getDoctorId(),
          patient_id: current.patientId,
          appointment_id: current.appointmentId || undefined,
          follow_up_date: normalizeDateInput(current.followUpDate),
          follow_up_time: current.followUpTime || undefined,
          follow_up_type: current.followUpType,
          type: current.followUpType,
          status: newStatus,
          notes: current.notes,
        },
        { headers: getAuthHeaders() }
      );
    } catch (error) {
      setFollowUps(previous);
      alert(error.response?.data?.message || error.response?.data?.error || "Failed to update follow-up status");
    }
  };

  const resetForm = () => {
    setNewPatient({
      patientId: "",
      appointmentId: "",
      followUpDate: "",
      followUpTime: "",
      followUpType: "routine",
      notes: "",
    });
  };

  const handleAddPatient = async () => {
    const doctorId = getDoctorId();

    if (!newPatient.patientId || !newPatient.followUpDate) {
      alert("Please select patient and follow-up date");
      return;
    }

    const payload = {
      doctor_id: doctorId,
      patient_id: newPatient.patientId,
      appointment_id: newPatient.appointmentId || selectedPatient?.appointmentId || undefined,
      follow_up_date: newPatient.followUpDate,
      follow_up_time: newPatient.followUpTime || undefined,
      follow_up_type: newPatient.followUpType,
      type: newPatient.followUpType,
      status: "pending",
      reason: newPatient.notes || selectedPatient?.issue || "",
      notes: newPatient.notes || selectedPatient?.issue || "",
    };

    try {
      setIsSaving(true);
      await axios.post(FOLLOWUP_BASE_URL, payload, { headers: getAuthHeaders() });
      await loadData();
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      alert(error.response?.data?.message || error.response?.data?.error || "Failed to add follow-up");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFollowUp = async (followUpId) => {
    if (!window.confirm("Are you sure you want to delete this follow-up?")) return;

    if (String(followUpId).startsWith("demo-")) {
      setActiveActionsId(null);
      return;
    }

    try {
      await axios.delete(`${FOLLOWUP_BASE_URL}/${followUpId}`, {
        headers: getAuthHeaders(),
        data: { doctor_id: getDoctorId() },
      });
      setFollowUps((prev) => prev.filter((item) => item.id !== followUpId));
      setActiveActionsId(null);
    } catch (error) {
      alert(error.response?.data?.message || error.response?.data?.error || "Failed to delete follow-up");
    }
  };

  const openEditFollowUp = (followUp) => {
    setEditFollowUp({
      ...followUp,
      form: {
        followUpDate: normalizeDateInput(followUp.followUpDate),
        followUpTime: followUp.followUpTime || "",
        followUpType: followUp.followUpType,
        followUpStatus: followUp.followUpStatus,
        notes: followUp.notes === "N/A" ? "" : followUp.notes || "",
      },
    });
    setViewFollowUp(null);
    setActiveActionsId(null);
  };

  const updateEditFollowUp = (field, value) => {
    setEditFollowUp((previous) => ({
      ...previous,
      form: { ...previous.form, [field]: value },
    }));
  };

  const handleUpdateFollowUp = async (event) => {
    event.preventDefault();
    if (!editFollowUp) return;

    const updated = {
      ...editFollowUp,
      followUpDate: editFollowUp.form.followUpDate,
      followUpTime: editFollowUp.form.followUpTime,
      followUpType: editFollowUp.form.followUpType,
      followUpStatus: editFollowUp.form.followUpStatus,
      notes: editFollowUp.form.notes || "N/A",
    };

    if (String(editFollowUp.id).startsWith("demo-")) {
      setEditFollowUp(null);
      return;
    }

    try {
      setIsSaving(true);
      await axios.put(
        `${FOLLOWUP_BASE_URL}/${editFollowUp.id}`,
        {
          doctor_id: getDoctorId(),
          patient_id: editFollowUp.patientId,
          appointment_id: editFollowUp.appointmentId || undefined,
          follow_up_date: updated.followUpDate,
          follow_up_time: updated.followUpTime || undefined,
          follow_up_type: updated.followUpType,
          type: updated.followUpType,
          status: updated.followUpStatus,
          notes: updated.notes,
        },
        { headers: getAuthHeaders() }
      );
      setFollowUps((previous) =>
        previous.map((item) => (item.id === updated.id ? updated : item))
      );
      setEditFollowUp(null);
    } catch (error) {
      alert(error.response?.data?.message || error.response?.data?.error || "Failed to update follow-up");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefreshFollowUps = async () => {
    setActiveActionsId(null);
    await loadData();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPatient((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "patientId"
        ? {
            appointmentId:
              appointmentPatients.find((patient) => String(patient.id) === String(value))?.appointmentId || "",
          }
        : {}),
    }));
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "completed": return "fup-status-badge-completed";
      case "scheduled": return "fup-status-badge-scheduled";
      default: return "fup-status-badge-pending";
    }
  };

  const getTypeClass = (type) => {
    switch (type) {
      case "urgent": return "fup-type-badge-urgent";
      case "consultation": return "fup-type-badge-consultation";
      default: return "fup-type-badge-routine";
    }
  };

  const getUpcomingCount = () => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    return followUps.filter((p) => {
      const followUpDate = new Date(p.followUpDate);
      return followUpDate >= today && followUpDate <= nextWeek && p.followUpStatus !== "completed";
    }).length;
  };

  const getInitials = (name) =>
    String(name || "NA")
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const getDueTodayCount = () => {
    const today = new Date().toDateString();
    return followUps.filter((patient) => {
      const date = new Date(patient.followUpDate);
      return !Number.isNaN(date.getTime()) && date.toDateString() === today;
    }).length;
  };

  const formatFollowUpDateTime = (patient) => {
    const date = formatDate(patient.followUpDate);
    return patient.followUpTime ? `${date}, ${patient.followUpTime}` : date;
  };

  const displayRows = filteredPatients;
  const totalPages = Math.max(1, Math.ceil(displayRows.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const firstRowIndex = displayRows.length ? (safeCurrentPage - 1) * pageSize : 0;
  const paginatedRows = displayRows.slice(firstRowIndex, firstRowIndex + pageSize);
  const lastRowIndex = Math.min(firstRowIndex + pageSize, displayRows.length);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const getVisiblePageNumbers = () => {
    const maxVisible = 5;
    let start = Math.max(1, safeCurrentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  };
  const totalCount = appointmentPatients.length;
  const pendingCount = followUps.filter((p) => p.followUpStatus === "pending").length;
  const todayCount = getDueTodayCount();
  const completedCount = followUps.filter((p) => p.followUpStatus === "completed").length;
  const getPriorityLabel = (type) => (type === "consultation" ? "Medium" : type.charAt(0).toUpperCase() + type.slice(1));

  return (
    <div className="fup-container fup-screen">
      <header className="fup-page-header">
        <div>
          <h1>Patient Follow-up Management</h1>
          <p>Track, schedule, and manage patient follow-ups efficiently.</p>
        </div>

        <div className="fup-header-actions">
          <button className="fup-export-button" type="button">
            <Download size={15} /> Export
          </button>
          <button className="fup-add-button" onClick={() => setShowAddModal(true)} type="button">
            <Plus size={16} /> Add Follow-up
          </button>
        </div>
      </header>

      {apiError && (
        <div className="fup-api-error" role="alert">
          {apiError}
        </div>
      )}

      <section className="fup-stats-cards fup-screenshot-stats">
        <article className="fup-stat-card">
          <div className="fup-stat-top">
            <span className="fup-stat-icon fup-blue"><Users size={18} /></span>
            <span className="fup-trend muted">Live data</span>
          </div>
          <p>Total Patients</p>
          <strong>{totalCount.toLocaleString("en-IN")}</strong>
        </article>

        <article className="fup-stat-card">
          <div className="fup-stat-top">
            <span className="fup-stat-icon fup-orange"><CalendarDays size={18} /></span>
            <span className="fup-trend muted">Live data</span>
          </div>
          <p>Pending Follow-ups</p>
          <strong>{pendingCount.toLocaleString("en-IN")}</strong>
        </article>

        <article className="fup-stat-card">
          <div className="fup-stat-top">
            <span className="fup-stat-icon fup-blue"><CalendarDays size={18} /></span>
            <span className="fup-trend muted">Live data</span>
          </div>
          <p>Due Today</p>
          <strong>{todayCount.toLocaleString("en-IN")}</strong>
        </article>

        <article className="fup-stat-card">
          <div className="fup-stat-top">
            <span className="fup-stat-icon fup-green"><CheckCircle size={18} /></span>
            <span className="fup-trend muted">Live data</span>
          </div>
          <p>Completed</p>
          <strong>{completedCount.toLocaleString("en-IN")}</strong>
        </article>
      </section>

      <section className="fup-list-card">
        <div className="fup-toolbar">
          <label className="fup-search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>

          <div className="fup-toolbar-actions">
            <select className="fup-filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">Doctor</option>
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="consultation">Consultation</option>
            </select>
            <select className="fup-filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">Status</option>
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
            </select>
            <button className="fup-date-button" type="button">
              Date Range <CalendarDays size={15} />
            </button>
            <button className="fup-icon-button" type="button" aria-label="More filters">
              <Filter size={16} />
            </button>
          </div>
        </div>

        <div className="fup-table-scroll">
          <table className="fup-followup-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Age/Gen</th>
                <th>Next Follow-up</th>
                <th>Doctor</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {status === "loading" ? (
                <tr>
                  <td colSpan="7" className="fup-empty-cell">Loading follow-ups...</td>
                </tr>
              ) : paginatedRows.length ? (
                paginatedRows.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <div className="fup-patient-compact">
                        <span>{getInitials(patient.name)}</span>
                        <strong>{patient.name}</strong>
                      </div>
                    </td>
                    <td>{patient.age || "N/A"}, {patient.gender || "M"}</td>
                    <td>
                      <span className="fup-date-inline">
                        <CalendarDays size={14} /> {formatFollowUpDateTime(patient)}
                      </span>
                    </td>
                    <td>{patient.doctor}</td>
                    <td>
                      <span className={`fup-type-badge ${getTypeClass(patient.followUpType)}`}>
                        {getPriorityLabel(patient.followUpType)}
                      </span>
                    </td>
                    <td>
                      <span className={`fup-status-badge ${getStatusClass(patient.followUpStatus)}`}>
                        {patient.followUpStatus.charAt(0).toUpperCase() + patient.followUpStatus.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="fup-row-actions">
                        {activeActionsId === patient.id ? (
                          <>
                            <button type="button" title="Refresh" aria-label="Refresh follow-ups" onClick={handleRefreshFollowUps}>
                              <i className="fa-solid fa-rotate-left"></i>
                            </button>
                            <button type="button" title="Update" aria-label={`Update ${patient.name}`} onClick={() => openEditFollowUp(patient)}>
                              <i className="fa-solid fa-pen"></i>
                            </button>
                            <button type="button" title="View" aria-label={`View ${patient.name}`} onClick={() => { setViewFollowUp(patient); setActiveActionsId(null); }}>
                              <i className="fa-solid fa-eye"></i>
                            </button>
                            <button type="button" className="danger" title="Delete" aria-label={`Delete ${patient.name}`} onClick={() => handleDeleteFollowUp(patient.id)}>
                              <i className="fa-solid fa-trash"></i>
                            </button>
                            <button type="button" title="Close" aria-label="Close actions" onClick={() => setActiveActionsId(null)}>
                              <i className="fa-solid fa-ellipsis-vertical"></i>
                            </button>
                          </>
                        ) : (
                          <button type="button" className="fup-more-btn" title="More actions" aria-label={`More actions for ${patient.name}`} onClick={() => setActiveActionsId(patient.id)}>
                            <i className="fa-solid fa-ellipsis-vertical"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="fup-empty-cell">No follow-ups found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="fup-table-footer">
          <span>
            Showing {displayRows.length ? firstRowIndex + 1 : 0} to {lastRowIndex} of {displayRows.length} entries
          </span>
          <div className="fup-pagination" aria-label="Follow-up table pagination">
            <button
              type="button"
              aria-label="Previous page"
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              ‹
            </button>
            {getVisiblePageNumbers().map((pageNumber) => (
              <button
                type="button"
                key={pageNumber}
                className={pageNumber === safeCurrentPage ? "active" : ""}
                aria-current={pageNumber === safeCurrentPage ? "page" : undefined}
                onClick={() => setCurrentPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              aria-label="Next page"
              disabled={safeCurrentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              ›
            </button>
          </div>
        </footer>
      </section>

      {showAddModal && (
        <div className="fup-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="fup-modal" onClick={(event) => event.stopPropagation()}>
            <div className="fup-modal-header">
              <h2 className="fup-modal-title">Add New Follow-up</h2>
              <button className="fup-modal-close" onClick={() => setShowAddModal(false)} type="button">
                ×
              </button>
            </div>

            <div className="fup-modal-body">
              <div className="fup-form-group">
                <label className="fup-form-label">Patient *</label>
                <select name="patientId" className="fup-form-input" value={newPatient.patientId} onChange={handleInputChange}>
                  <option value="">Select patient</option>
                  {appointmentPatients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} - {patient.phone}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPatient && (
                <div className="fup-form-group">
                  <label className="fup-form-label">Last Appointment Issue</label>
                  <input type="text" className="fup-form-input" value={selectedPatient.issue} disabled />
                </div>
              )}

              <div className="fup-form-row">
                <div className="fup-form-group fup-form-half">
                  <label className="fup-form-label">Follow-up Date *</label>
                  <input type="date" name="followUpDate" className="fup-form-input" value={newPatient.followUpDate} onChange={handleInputChange} />
                </div>

                <div className="fup-form-group fup-form-half">
                  <label className="fup-form-label">Follow-up Time</label>
                  <input type="time" name="followUpTime" className="fup-form-input" value={newPatient.followUpTime} onChange={handleInputChange} />
                </div>
              </div>

              <div className="fup-form-group">
                <label className="fup-form-label">Priority</label>
                <select name="followUpType" className="fup-form-input" value={newPatient.followUpType} onChange={handleInputChange}>
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="consultation">Medium</option>
                </select>
              </div>

              <div className="fup-form-group">
                <label className="fup-form-label">Notes</label>
                <textarea name="notes" className="fup-form-textarea" value={newPatient.notes} onChange={handleInputChange} placeholder="Additional notes..." rows="3"></textarea>
              </div>
            </div>

            <div className="fup-modal-footer">
              <button className="fup-btn-secondary" onClick={() => setShowAddModal(false)} disabled={isSaving} type="button">
                Cancel
              </button>
              <button className="fup-btn-primary" onClick={handleAddPatient} disabled={isSaving} type="button">
                {isSaving ? "Saving..." : "Add Follow-up"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editFollowUp && (
        <div className="fup-modal-overlay" role="dialog" aria-modal="true" onClick={() => setEditFollowUp(null)}>
          <form className="fup-modal" onSubmit={handleUpdateFollowUp} onClick={(event) => event.stopPropagation()}>
            <div className="fup-modal-header">
              <div>
                <h2 className="fup-modal-title">Update Follow-up</h2>
                <p>{editFollowUp.name}</p>
              </div>
              <button className="fup-modal-close" type="button" onClick={() => setEditFollowUp(null)} aria-label="Close">×</button>
            </div>
            <div className="fup-modal-body">
              <div className="fup-form-row">
                <div className="fup-form-group fup-form-half">
                  <label className="fup-form-label">Follow-up Date *</label>
                  <input required type="date" className="fup-form-input" value={editFollowUp.form.followUpDate} onChange={(event) => updateEditFollowUp("followUpDate", event.target.value)} />
                </div>
                <div className="fup-form-group fup-form-half">
                  <label className="fup-form-label">Follow-up Time</label>
                  <input type="time" className="fup-form-input" value={editFollowUp.form.followUpTime} onChange={(event) => updateEditFollowUp("followUpTime", event.target.value)} />
                </div>
              </div>
              <div className="fup-form-row">
                <div className="fup-form-group fup-form-half">
                  <label className="fup-form-label">Priority</label>
                  <select className="fup-form-input" value={editFollowUp.form.followUpType} onChange={(event) => updateEditFollowUp("followUpType", event.target.value)}>
                    <option value="routine">Routine</option>
                    <option value="urgent">Urgent</option>
                    <option value="consultation">Medium</option>
                  </select>
                </div>
                <div className="fup-form-group fup-form-half">
                  <label className="fup-form-label">Status</label>
                  <select className="fup-form-input" value={editFollowUp.form.followUpStatus} onChange={(event) => updateEditFollowUp("followUpStatus", event.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="fup-form-group">
                <label className="fup-form-label">Notes</label>
                <textarea className="fup-form-textarea" rows="3" value={editFollowUp.form.notes} onChange={(event) => updateEditFollowUp("notes", event.target.value)} />
              </div>
            </div>
            <div className="fup-modal-footer">
              <button className="fup-btn-secondary" type="button" onClick={() => setEditFollowUp(null)}>Cancel</button>
              <button className="fup-btn-primary" type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Update Follow-up"}</button>
            </div>
          </form>
        </div>
      )}

      {viewFollowUp && (
        <div className="fup-modal-overlay" role="dialog" aria-modal="true" onClick={() => setViewFollowUp(null)}>
          <div className="fup-modal fup-view-modal" onClick={(event) => event.stopPropagation()}>
            <div className="fup-modal-header">
              <div>
                <h2 className="fup-modal-title">Follow-up Details</h2>
                <p>{viewFollowUp.name}</p>
              </div>
              <button className="fup-modal-close" type="button" onClick={() => setViewFollowUp(null)} aria-label="Close">×</button>
            </div>
            <div className="fup-modal-body fup-detail-grid">
              <div><span>Patient</span><strong>{viewFollowUp.name}</strong></div>
              <div><span>Age / Gender</span><strong>{viewFollowUp.age || "N/A"} / {viewFollowUp.gender || "N/A"}</strong></div>
              <div><span>Next Follow-up</span><strong>{formatFollowUpDateTime(viewFollowUp)}</strong></div>
              <div><span>Doctor</span><strong>{viewFollowUp.doctor}</strong></div>
              <div><span>Priority</span><strong>{getPriorityLabel(viewFollowUp.followUpType)}</strong></div>
              <div><span>Status</span><strong>{viewFollowUp.followUpStatus}</strong></div>
              <div className="wide-field"><span>Notes</span><strong>{viewFollowUp.notes || "N/A"}</strong></div>
            </div>
            <div className="fup-modal-footer">
              <button className="fup-btn-secondary" type="button" onClick={() => setViewFollowUp(null)}>Close</button>
              <button className="fup-btn-primary" type="button" onClick={() => openEditFollowUp(viewFollowUp)}>Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FollowUp;
