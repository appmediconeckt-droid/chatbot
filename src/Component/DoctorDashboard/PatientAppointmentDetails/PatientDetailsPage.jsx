// ===============================
// PatientDetailsPage.jsx (ReactJS)
// ===============================
import React, { useEffect, useState } from "react";
import { useDoctorUser } from "../doctorApi.js";
import axios from "../../../axiosConfig.js";
import { User, Phone, Calendar, Clock, Heart, Pill, Stethoscope, ChevronLeft, FileText, Download, Users, UserPlus, ClipboardList, TrendingUp } from "lucide-react";
import "./PatientDetailsPage.css";
import { generatePrescriptionPDF } from "./pdfGenerator";
import { API_BASE_URL, getAuthHeaders } from "../doctorApi.js";

const patientData = [
  {
    id: 1,
    name: "Ramesh Kumar",
    age: 45,
    gender: "Male",
    phone: "9876543210",
    bloodGroup: "O+",
    lastVisit: "2026-01-08",
    records: [
      {
        id: 101,
        date: "2026-01-05",
        time: "10:30 AM",
        bp: "120/80",
        pulse: "72",
        temperature: "98.6°F",
        problem: "Fever & Cold",
        diagnosis: "Viral Infection",
        tablets: "Paracetamol 500mg (1-0-1), Cetirizine 10mg (0-0-1)",
        days: "5 Days",
        doctor: "Dr. A. Sharma",
        prescription: "Take medicine after meals. Rest well.",
        followUp: "2026-01-10",
      },
      {
        id: 102,
        date: "2026-01-08",
        time: "11:15 AM",
        bp: "118/78",
        pulse: "68",
        temperature: "98.4°F",
        problem: "Migraine Headache",
        diagnosis: "Tension Headache",
        tablets: "Ibuprofen 400mg (1-0-0), Sumatriptan 50mg (SOS)",
        days: "3 Days",
        doctor: "Dr. A. Sharma",
        prescription: "Avoid screen time. Drink plenty of water.",
        followUp: "2026-01-12",
      },
    ],
  },
  {
    id: 2,
    name: "Sita Patil",
    age: 52,
    gender: "Female",
    phone: "9123456789",
    bloodGroup: "B+",
    lastVisit: "2026-01-07",
    records: [
      {
        id: 201,
        date: "2026-01-07",
        time: "09:45 AM",
        bp: "130/85",
        pulse: "76",
        temperature: "98.8°F",
        problem: "Hypertension",
        diagnosis: "Stage 1 Hypertension",
        tablets: "Amlodipine 5mg (0-0-1), Losartan 50mg (1-0-0)",
        days: "30 Days",
        doctor: "Dr. M. Deshmukh",
        prescription: "Monitor BP daily. Low salt diet.",
        followUp: "2026-02-07",
      },
    ],
  },
  {
    id: 3,
    name: "Amit Verma",
    age: 38,
    gender: "Male",
    phone: "9988776655",
    bloodGroup: "A+",
    lastVisit: "2026-01-09",
    records: [
      {
        id: 301,
        date: "2026-01-09",
        time: "03:20 PM",
        bp: "125/82",
        pulse: "80",
        temperature: "99.1°F",
        problem: "Back Pain",
        diagnosis: "Muscle Spasm",
        tablets: "Diclofenac 50mg (1-0-1), Muscle Relaxant",
        days: "7 Days",
        doctor: "Dr. R. Gupta",
        prescription: "Hot compression. Avoid lifting weights.",
        followUp: "2026-01-16",
      },
    ],
  },
  {
    id: 4,
    name: "Priya Sharma",
    age: 29,
    gender: "Female",
    phone: "8877665544",
    bloodGroup: "AB+",
    lastVisit: "2026-01-06",
    records: [
      {
        id: 401,
        date: "2026-01-06",
        time: "02:15 PM",
        bp: "110/70",
        pulse: "65",
        temperature: "98.9°F",
        problem: "Allergic Rhinitis",
        diagnosis: "Seasonal Allergy",
        tablets: "Levocetirizine 5mg (0-0-1), Nasal Spray",
        days: "10 Days",
        doctor: "Dr. A. Sharma",
        prescription: "Avoid dust and pollen. Use mask outside.",
        followUp: "2026-01-16",
      },
    ],
  },
];

export default function PatientDetailsPage() {
  const authUser = useDoctorUser();
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showPatientList, setShowPatientList] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [patientPage, setPatientPage] = useState(1);
  const [recordPage, setRecordPage] = useState(1);
  const pageSize = 10;
  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    gender: "Male",
    phone: "",
    bloodGroup: "",
    doctor: "",
    lastVisit: new Date().toISOString().split("T")[0],
  });

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

  const doctorId = extractDoctorId(authUser || getStoredAuthUser());

  const unwrapApiArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    if (Array.isArray(payload?.appointments)) return payload.appointments;
    return [];
  };

  const formatDate = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
  };

  const formatTime = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getPatientFromAppointment = (appointment) => {
    return appointment.patient || appointment.patient_data || appointment.user || {};
  };

  const getPatientId = (appointment) => {
    const patient = getPatientFromAppointment(appointment);
    return appointment.patient_id || appointment.patientId || patient.id || patient._id || patient.user_id || appointment.id;
  };

  const getProblem = (appointment) => {
    return appointment.problem ||
      appointment.symptoms ||
      appointment.reason ||
      appointment.issue ||
      appointment.health_issue ||
      appointment.healthIssue ||
      appointment.description ||
      appointment.consultation_reason ||
      "General consultation";
  };

  const parseMedicines = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value !== "string" || !value.trim()) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const formatMedicines = (appointment) => {
    if (appointment.medicine && String(appointment.medicine).trim()) {
      return String(appointment.medicine).trim();
    }
    const medicines = parseMedicines(appointment.medicines);
    if (!medicines.length) return appointment.tablets || appointment.medication || "N/A";
    return medicines.map((medicine) => {
      const timing = Array.isArray(medicine.timings) && medicine.timings.length
        ? medicine.timings.join(", ")
        : "Timing not specified";
      const duration = medicine.durationValue
        ? ` - ${medicine.durationValue} ${medicine.durationType || "days"}`
        : "";
      return `${medicine.name || "Medicine"}${medicine.dosage ? ` - ${medicine.dosage}` : ""} (${timing})${duration}`;
    }).join("\n");
  };

  const getMedicineDuration = (appointment) => {
    const medicines = parseMedicines(appointment.medicines);
    const durations = medicines
      .filter((medicine) => medicine.durationValue)
      .map((medicine) => `${medicine.durationValue} ${medicine.durationType || "Days"}`);
    return durations.length ? durations.join(", ") : appointment.days || appointment.duration || "N/A";
  };

  const hasFollowUp = (appointment) => {
    const value = appointment.follow_up_required ?? appointment.followUpRequired;
    return value === true || value === 1 || value === "1" || String(value).toLowerCase() === "true" || Boolean(appointment.follow_up_date || appointment.followUpDate);
  };

  const normalizeRecord = (appointment) => {
    const createdAt = appointment.appointment_date || appointment.date || appointment.created_at || appointment.createdAt;
    const appointmentTime = appointment.appointment_time || appointment.time || createdAt;
    return {
      id: appointment.id || appointment._id,
      date: formatDate(createdAt),
      time: formatTime(appointmentTime),
      bp: appointment.bp || appointment.blood_pressure || "N/A",
      pulse: appointment.pulse || appointment.heart_rate || appointment.heartRate || "N/A",
      temperature: appointment.temperature || "N/A",
      problem: getProblem(appointment),
      diagnosis: appointment.diagnosis || "N/A",
      tablets: formatMedicines(appointment),
      days: getMedicineDuration(appointment),
      doctor: appointment.doctor_name || appointment.doctor?.name || authUser?.full_name || authUser?.name || "Doctor",
      prescription: appointment.prescription || appointment.advice || appointment.additional_notes || appointment.additionalNotes || appointment.notes || "N/A",
      followUp: hasFollowUp(appointment)
        ? formatDate(appointment.follow_up_date || appointment.followUpDate || appointment.follow_up || appointment.followUp)
        : "Not required",
    };
  };

  const buildPatientsFromAppointments = (appointments) => {
    const byPatient = new Map();

    appointments.forEach((appointment) => {
      const patient = getPatientFromAppointment(appointment);
      const patientId = getPatientId(appointment);
      const record = normalizeRecord(appointment);
      const existing = byPatient.get(patientId);

      const patientDetails = existing || {
        id: patientId,
        name: patient.full_name || patient.fullname || patient.name || appointment.patient_name || appointment.name || "Unknown Patient",
        age: patient.age || appointment.patient_age || appointment.age || "N/A",
        gender: patient.patient_gender || appointment.patient_gender || "N/A",
        phone: patient.patient_phone || patient.patient_phone || appointment.patient_phone || appointment.patient_phone || "N/A",
        bloodGroup: patient.patient_blood_group || patient.patient_blood_group || appointment.patient_blood_group || "N/A",
        lastVisit: record.date,
        records: [],
      };

      patientDetails.records.push(record);
      patientDetails.records.sort((a, b) => new Date(b.date) - new Date(a.date));
      patientDetails.lastVisit = patientDetails.records[0]?.date || record.date;
      byPatient.set(patientId, patientDetails);
    });

    return Array.from(byPatient.values());
  };

  useEffect(() => {
    const loadPatients = async () => {
      if (!doctorId) {
        setStatus("failed");
        setError("Doctor ID not found. Please login again.");
        setPatients([]);
        return;
      }

      try {
        setStatus("loading");
        setError("");
        const response = await axios.get(`${API_BASE_URL}/appointments`, {
          headers: getAuthHeaders(),
          params: { doctor_id: doctorId },
        });
        const appointments = unwrapApiArray(response.data).filter((appointment) => {
          const appointmentDoctorId = appointment.doctor_id || appointment.doctorId || appointment.doctor?.id || appointment.doctor?._id;
          return !appointmentDoctorId || String(appointmentDoctorId) === String(doctorId);
        });
        setPatients(buildPatientsFromAppointments(appointments));
        setStatus("succeeded");
      } catch (error) {
        setStatus("failed");
        setError(error.response?.data?.message || error.response?.data?.error || error.message || "Failed to load patient details");
        setPatients([]);
      }
    };

    loadPatients();
  }, [doctorId]);

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      String(p.phone).includes(search)
  );
  const patientTotalPages = Math.max(1, Math.ceil(filteredPatients.length / pageSize));
  const safePatientPage = Math.min(patientPage, patientTotalPages);
  const patientFirstIndex = filteredPatients.length ? (safePatientPage - 1) * pageSize : 0;
  const paginatedPatients = filteredPatients.slice(patientFirstIndex, patientFirstIndex + pageSize);
  const patientLastIndex = Math.min(patientFirstIndex + pageSize, filteredPatients.length);
  const selectedRecords = selectedPatient?.records || [];
  const recordTotalPages = Math.max(1, Math.ceil(selectedRecords.length / pageSize));
  const safeRecordPage = Math.min(recordPage, recordTotalPages);
  const recordFirstIndex = selectedRecords.length ? (safeRecordPage - 1) * pageSize : 0;
  const paginatedRecords = selectedRecords.slice(recordFirstIndex, recordFirstIndex + pageSize);
  const recordLastIndex = Math.min(recordFirstIndex + pageSize, selectedRecords.length);

  useEffect(() => {
    setPatientPage(1);
  }, [search]);

  useEffect(() => {
    if (patientPage > patientTotalPages) setPatientPage(patientTotalPages);
  }, [patientPage, patientTotalPages]);

  useEffect(() => {
    if (recordPage > recordTotalPages) setRecordPage(recordTotalPages);
  }, [recordPage, recordTotalPages]);
  const todayLabel = new Date().toLocaleDateString();
  const todaysAppointments = patients.reduce(
    (count, patient) => count + patient.records.filter((record) => record.date === todayLabel).length,
    0
  );
  const pendingReports = patients.reduce(
    (count, patient) => count + patient.records.filter((record) => record.diagnosis === "N/A").length,
    0
  );

  const handlePatientClick = (patient) => {
    setSelectedPatient(patient);
    setSelectedRecord(null);
    setShowPatientList(false);
    setRecordPage(1);
  };

  const handleBackToPatients = () => {
    setShowPatientList(true);
    setSelectedPatient(null);
    setSelectedRecord(null);
  };

  const handleBackToRecords = () => {
    setSelectedRecord(null);
  };

  const handleDownloadPrescription = async () => {
    if (!selectedPatient || !selectedRecord) return;
    
    setIsDownloading(true);
    try {
      await generatePrescriptionPDF(selectedPatient, selectedRecord);
    } catch (error) {
      console.error("Error downloading prescription:", error);
      alert("Failed to download prescription. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const updateNewPatient = (field, value) => {
    setNewPatient((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddPatient = (event) => {
    event.preventDefault();
    const visitDate = formatDate(newPatient.lastVisit);
    const patient = {
      id: `local-${Date.now()}`,
      name: newPatient.name || "New Patient",
      age: newPatient.age || "N/A",
      gender: newPatient.gender || "N/A",
      phone: newPatient.phone || "N/A",
      bloodGroup: newPatient.bloodGroup || "N/A",
      lastVisit: visitDate,
      records: [
        {
          id: `record-${Date.now()}`,
          date: visitDate,
          time: "N/A",
          bp: "N/A",
          pulse: "N/A",
          temperature: "N/A",
          problem: "New patient registration",
          diagnosis: "N/A",
          tablets: "N/A",
          days: "N/A",
          doctor: newPatient.doctor || authUser?.full_name || authUser?.name || "Doctor",
          prescription: "N/A",
          followUp: "N/A",
        },
      ],
    };

    setPatients((prev) => [patient, ...prev]);
    setShowAddPatientModal(false);
    setNewPatient({
      name: "",
      age: "",
      gender: "Male",
      phone: "",
      bloodGroup: "",
      doctor: "",
      lastVisit: new Date().toISOString().split("T")[0],
    });
  };

  return (
    <div className="pd-container">
      {showPatientList && (
        <>
          <div className="pd-overview-header">
            <div>
              <h2 className="pd-title">Patients Medical Records</h2>
              <p className="pd-subtitle">Comprehensive patient history and visit details</p>
            </div>
            <button type="button" className="pd-add-patient-btn" onClick={() => setShowAddPatientModal(true)}>+ Add Patient</button>
          </div>

          <div className="pd-stats-strip">
            <div className="pd-stat-tile active">
              <div className="pd-stat-icon teal"><Users size={22} /></div>
              <span className="pd-stat-trend"><TrendingUp size={12} /> 12%</span>
              <small>Total Patients</small>
              <strong>{patients.length || 0}</strong>
            </div>
            <div className="pd-stat-tile">
              <div className="pd-stat-icon blue"><UserPlus size={22} /></div>
              <small>New Admissions</small>
              <strong>{patients.filter((patient) => patient.records.length === 1).length}</strong>
            </div>
            <div className="pd-stat-tile">
              <div className="pd-stat-icon red"><ClipboardList size={22} /></div>
              <small>Pending Reports</small>
              <strong>{pendingReports}</strong>
            </div>
            <div className="pd-stat-tile">
              <div className="pd-stat-icon slate"><Calendar size={22} /></div>
              <small>Today's Appts</small>
              <strong>{todaysAppointments}</strong>
            </div>
          </div>
        </>
      )}

      <div className="pd-main-layout">
        {/* Patient List Section - Only shown when no patient selected */}
        {showPatientList && (
          <div className="pd-patient-list-section">
            <div className="pd-directory-header">
              <h3 className="pd-section-title">Patients Directory</h3>
              <div className="pd-directory-search">
                <input
                  type="text"
                  placeholder="Search patient"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="pd-directory-tools">
              <div className="pd-filter-row">
                <button type="button">Gender</button>
                <button type="button">Blood Group</button>
                <button type="button">Age <i className="fa-solid fa-chevron-down"></i></button>
                <button type="button">Last Visit <i className="fa-solid fa-chevron-down"></i></button>
              </div>
              <label className="pd-sort-control">
                Sort by:
                <select defaultValue="Newest First">
                  <option>Newest First</option>
                  <option>Oldest First</option>
                  <option>Name A-Z</option>
                </select>
              </label>
            </div>
            {status === "loading" ? (
              <div className="pd-empty-state">
                <FileText size={48} />
                <p>Loading patients...</p>
              </div>
            ) : status === "failed" ? (
              <div className="pd-empty-state">
                <FileText size={48} />
                <p>{error}</p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="pd-empty-state">
                <FileText size={48} />
                <p>No patients found for this doctor</p>
              </div>
            ) : (
              <>
              <div className="pd-patient-grid">
                {paginatedPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="pd-patient-card"
                  onClick={() => handlePatientClick(patient)}
                >
                  <div className="pd-patient-header">
                    <div className="pd-patient-avatar">
                      {patient.name.charAt(0)}
                    </div>
                    <div className="pd-patient-info">
                      <h4 className="pd-patient-name">{patient.name}</h4>
                      <div className="pd-patient-meta">
                        <span className="pd-patient-age">{patient.age} yrs • {patient.gender}</span>
                        <span className="pd-patient-blood">{patient.bloodGroup}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pd-patient-contact">
                    <Phone size={14} />
                    <span>{patient.phone}</span>
                  </div>
                  <div className="pd-patient-footer">
                    <span className="pd-last-visit">
                      Last visit: {patient.lastVisit}
                    </span>
                    <span className="pd-record-count">
                      {patient.records.length} {patient.records.length === 1 ? 'Visit' : 'Visits'}
                    </span>
                  </div>
                </div>
                ))}
              </div>
              <div className="pd-pagination">
                <span>Showing {filteredPatients.length ? patientFirstIndex + 1 : 0} to {patientLastIndex} of {filteredPatients.length} patients</span>
                <div>
                  <button type="button" aria-label="Previous page" disabled={safePatientPage === 1} onClick={() => setPatientPage((page) => Math.max(1, page - 1))}>‹</button>
                  {Array.from({ length: patientTotalPages }, (_, index) => index + 1).map((page) => (
                    <button type="button" key={page} className={page === safePatientPage ? "active" : ""} onClick={() => setPatientPage(page)}>{page}</button>
                  ))}
                  <button type="button" aria-label="Next page" disabled={safePatientPage === patientTotalPages} onClick={() => setPatientPage((page) => Math.min(patientTotalPages, page + 1))}>›</button>
                </div>
              </div>
              </>
            )}
          </div>
        )}

        {/* Selected Patient's Records Section */}
        {selectedPatient && !selectedRecord && (
          <div className="pd-records-section">
            <div className="pd-records-header">
              <button className="pd-back-btn" onClick={handleBackToPatients}>
                <ChevronLeft size={18} /> Back to Patients
              </button>
              <div className="pd-selected-patient-info">
                <div className="pd-patient-avatar-large">
                  {selectedPatient.name.charAt(0)}
                </div>
                <div>
                  <h3 className="pd-patient-name-large">{selectedPatient.name}</h3>
                  <div className="pd-patient-details">
                    <span><User size={14} /> {selectedPatient.age} yrs • {selectedPatient.gender}</span>
                    <span><Phone size={14} /> {selectedPatient.phone}</span>
                    <span><Heart size={14} /> Blood Group: {selectedPatient.bloodGroup}</span>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="pd-section-title">
              <Calendar size={20} /> Visit History ({selectedPatient.records.length} appointments)
            </h3>
            
            {selectedPatient.records.length === 0 ? (
              <div className="pd-empty-state">
                <FileText size={48} />
                <p>No visit records found for this patient</p>
              </div>
            ) : (
              <div className="pd-records-table-container">
                <table className="pd-records-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Problem</th>
                      <th>Doctor</th>
                      <th>Follow-up</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRecords.map((record) => (
                      <tr key={record.id} className="pd-record-row">
                        <td>
                          <div className="pd-date-cell">
                            <Calendar size={14} />
                            {record.date}
                          </div>
                        </td>
                        <td>
                          <div className="pd-time-cell">
                            <Clock size={14} />
                            {record.time}
                          </div>
                        </td>
                        <td className="pd-problem-cell">
                          <div className="pd-problem-tag">{record.problem}</div>
                        </td>
                        <td className="pd-doctor-cell">{record.doctor}</td>
                        <td>
                          <div className="pd-followup-badge">{record.followUp}</div>
                        </td>
                        <td>
                          <button
                            className="pd-view-detail-btn"
                            onClick={() => setSelectedRecord(record)}
                          >
                            <FileText size={14} /> View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="pd-pagination">
                  <span>Showing {selectedRecords.length ? recordFirstIndex + 1 : 0} to {recordLastIndex} of {selectedRecords.length} visits</span>
                  <div>
                    <button type="button" aria-label="Previous page" disabled={safeRecordPage === 1} onClick={() => setRecordPage((page) => Math.max(1, page - 1))}>‹</button>
                    {Array.from({ length: recordTotalPages }, (_, index) => index + 1).map((page) => (
                      <button type="button" key={page} className={page === safeRecordPage ? "active" : ""} onClick={() => setRecordPage(page)}>{page}</button>
                    ))}
                    <button type="button" aria-label="Next page" disabled={safeRecordPage === recordTotalPages} onClick={() => setRecordPage((page) => Math.min(recordTotalPages, page + 1))}>›</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Record Details Section */}
        {selectedRecord && (
          <div className="pd-record-detail-section">
            <div className="pd-detail-header">
              <button className="pd-back-btn" onClick={handleBackToRecords}>
                <ChevronLeft size={18} /> Back to Visits
              </button>
              <h3 className="pd-section-title">
                <FileText size={20} /> Visit Details
              </h3>
            </div>

            <div className="pd-detail-card">
              {/* Patient Info Banner */}
              <div className="pd-detail-patient-banner">
                <div className="pd-detail-avatar">{selectedPatient.name.charAt(0)}</div>
                <div>
                  <h4 className="pd-detail-patient-name">{selectedPatient.name}</h4>
                  <div className="pd-detail-patient-meta">
                    <span>{selectedPatient.age} yrs • {selectedPatient.gender}</span>
                    <span>•</span>
                    <span>{selectedPatient.bloodGroup}</span>
                    <span>•</span>
                    <span>{selectedPatient.phone}</span>
                  </div>
                </div>
              </div>

              {/* Visit Details Grid */}
              <div className="pd-detail-grid">
                <div className="pd-detail-column">
                  <h5 className="pd-detail-column-title">Visit Information</h5>
                  <div className="pd-detail-item">
                    <span className="pd-detail-label">Date</span>
                    <span className="pd-detail-value">
                      <Calendar size={14} /> {selectedRecord.date}
                    </span>
                  </div>
                  <div className="pd-detail-item">
                    <span className="pd-detail-label">Time</span>
                    <span className="pd-detail-value">
                      <Clock size={14} /> {selectedRecord.time}
                    </span>
                  </div>
                  <div className="pd-detail-item">
                    <span className="pd-detail-label">Consulting Doctor</span>
                    <span className="pd-detail-value pd-doctor-highlight">
                      <Stethoscope size={14} /> {selectedRecord.doctor}
                    </span>
                  </div>
                  <div className="pd-detail-item">
                    <span className="pd-detail-label">Follow-up Date</span>
                    <span className="pd-detail-value pd-followup-highlight">
                      {selectedRecord.followUp}
                    </span>
                  </div>
                </div>

                <div className="pd-detail-column">
                  <h5 className="pd-detail-column-title">Vital Signs</h5>
                  <div className="pd-vitals-grid">
                    <div className="pd-vital-card">
                      <div className="pd-vital-icon bp-icon">
                        <Heart size={18} />
                      </div>
                      <div>
                        <div className="pd-vital-label">Blood Pressure</div>
                        <div className="pd-vital-value">{selectedRecord.bp} mmHg</div>
                      </div>
                    </div>
                    <div className="pd-vital-card">
                      <div className="pd-vital-icon pulse-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                        </svg>
                      </div>
                      <div>
                        <div className="pd-vital-label">Pulse Rate</div>
                        <div className="pd-vital-value">{selectedRecord.pulse} bpm</div>
                      </div>
                    </div>
                    <div className="pd-vital-card">
                      <div className="pd-vital-icon temp-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
                        </svg>
                      </div>
                      <div>
                        <div className="pd-vital-label">Temperature</div>
                        <div className="pd-vital-value">{selectedRecord.temperature}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pd-detail-column">
                  <h5 className="pd-detail-column-title">Medical Information</h5>
                  <div className="pd-detail-item">
                    <span className="pd-detail-label">Presenting Problem</span>
                    <span className="pd-detail-value pd-problem-value">{selectedRecord.problem}</span>
                  </div>
                  <div className="pd-detail-item">
                    <span className="pd-detail-label">Diagnosis</span>
                    <span className="pd-detail-value">{selectedRecord.diagnosis}</span>
                  </div>
                </div>

                <div className="pd-detail-column pd-prescription-column">
                  <h5 className="pd-detail-column-title">
                    <Pill size={18} /> Prescription
                  </h5>
                  <div className="pd-prescription-box">
                    <div className="pd-medication-list">
                      <div className="pd-medication-item">
                        <div className="pd-medication-name">Medication</div>
                        <div className="pd-medication-details">{selectedRecord.tablets}</div>
                      </div>
                      <div className="pd-medication-item">
                        <div className="pd-medication-name">Duration</div>
                        <div className="pd-medication-details">{selectedRecord.days}</div>
                      </div>
                    </div>
                    <div className="pd-instructions">
                      <h6>Doctor's Instructions:</h6>
                      <p>{selectedRecord.prescription}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pd-detail-actions">
                <button 
                  className="pd-btn-primary"
                  onClick={handleDownloadPrescription}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <span className="pd-spinner"></span>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Download Prescription
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showAddPatientModal && (
        <div className="pd-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setShowAddPatientModal(false)}>
          <form className="pd-add-patient-modal" onSubmit={handleAddPatient} onClick={(event) => event.stopPropagation()}>
            <div className="pd-modal-header">
              <div>
                <h3>Add Patient</h3>
                <p>Create a patient profile for the doctor portal.</p>
              </div>
              <button type="button" onClick={() => setShowAddPatientModal(false)} aria-label="Close">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="pd-add-form-grid">
              <label>
                Patient Name
                <input required value={newPatient.name} onChange={(event) => updateNewPatient("name", event.target.value)} placeholder="Robert Chen" />
              </label>
              <label>
                Phone No
                <input value={newPatient.phone} onChange={(event) => updateNewPatient("phone", event.target.value)} placeholder="+1 (555) 019-2834" />
              </label>
              <label>
                Age
                <input type="number" min="0" value={newPatient.age} onChange={(event) => updateNewPatient("age", event.target.value)} placeholder="54" />
              </label>
              <label>
                Gender
                <select value={newPatient.gender} onChange={(event) => updateNewPatient("gender", event.target.value)}>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                Blood Group
                <select value={newPatient.bloodGroup} onChange={(event) => updateNewPatient("bloodGroup", event.target.value)}>
                  <option value="">Select blood group</option>
                  <option>O+</option>
                  <option>O-</option>
                  <option>A+</option>
                  <option>A-</option>
                  <option>B+</option>
                  <option>B-</option>
                  <option>AB+</option>
                  <option>AB-</option>
                </select>
              </label>
              <label>
                Doctor
                <input value={newPatient.doctor} onChange={(event) => updateNewPatient("doctor", event.target.value)} placeholder="Dr. Sarah Jenkins" />
              </label>
              <label className="pd-wide-field">
                Last Visit
                <input type="date" value={newPatient.lastVisit} onChange={(event) => updateNewPatient("lastVisit", event.target.value)} />
              </label>
            </div>

            <div className="pd-modal-actions">
              <button type="button" className="pd-modal-cancel" onClick={() => setShowAddPatientModal(false)}>Cancel</button>
              <button type="submit" className="pd-modal-save">Add Patient</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
