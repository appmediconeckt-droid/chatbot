import { PortalTemplate, PortalText, PortalElement } from "../../common/PortalTranslation";
import { medicineTiming, medicineDuration } from "../../common/prescriptionDetails.js";
import PatientProfileImage from "../../common/PatientProfileImage";
import { filterPatients, dateKey } from "./patientFilters.js";
// ===============================
// PatientDetailsPage.jsx (ReactJS)
// ===============================
import React, { useEffect, useRef, useState } from "react";
import { useDoctorUser } from "../doctorApi.js";
import axios from "../../../axiosConfig.js";
import { User, Phone, Calendar, Clock, Heart, Pill, Stethoscope, ChevronLeft, RefreshCw, FileText, Download, Users, UserPlus, ClipboardList, TrendingUp, X } from "lucide-react";
import "./PatientDetailsPage.css";
import PatientPagination from "./PatientPagination.jsx";
import { patientCardDetails, appointmentDoctorName, appointmentVitals, isPatientDirectoryRecord } from "./patientRecordDetails.js";
import { VitalsSummary } from '../../Receptionist/PatientVitals.jsx';
import DoctorVitalsButton from '../DoctorVitalsButton.jsx';
import { generatePrescriptionPDF } from "./pdfGenerator";
import { API_BASE_URL, getAuthHeaders } from "../doctorApi.js";

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
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pageSize = 10;

  // ===== Filter & Sort States =====
  const [genderFilter, setGenderFilter] = useState("All");
  const [bloodGroupFilter, setBloodGroupFilter] = useState("All");
  const [ageFilter, setAgeFilter] = useState("All");
  const [lastVisitFilter, setLastVisitFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest First");

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
    } catch {
      return null;
    }
  };

  const extractDoctorId = (user) => {
    if (!user) return "";
    return user.doctor_id || user.doctorId || user.id || user._id || user.user_id || user.userId || "";
  };

  const storedDoctor = authUser || getStoredAuthUser();
  const doctorId = extractDoctorId(storedDoctor?.user || storedDoctor?.data?.user || storedDoctor);

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
      const timing = medicineTiming(medicine) || "Timing not specified";
      const durationText = medicineDuration(medicine);
      const duration = durationText ? ` - ${durationText}` : "";
      return `${medicine.name || "Medicine"}${medicine.dosage ? ` - ${medicine.dosage}` : ""} (${timing})${duration}`;
    }).join("\n");
  };

  const getMedicineDuration = (appointment) => {
    const medicines = parseMedicines(appointment.medicines);
    const durations = medicines.map(medicineDuration).filter(Boolean);
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
      prescriptionRecord: { ...appointment, doctorProfile: authUser || getStoredAuthUser() },
      timestamp: Date.parse(createdAt) || 0,
      dateKey: dateKey(createdAt),
      date: formatDate(createdAt),
      time: formatTime(appointmentTime),
      ...appointmentVitals(appointment),
      vitals: appointment.vitals,
      problem: getProblem(appointment),
      diagnosis: appointment.diagnosis || "N/A",
      tablets: formatMedicines(appointment),
      days: getMedicineDuration(appointment),
      doctor: appointmentDoctorName(appointment, authUser || getStoredAuthUser()),
      prescription: appointment.prescription || appointment.advice || appointment.additional_notes || appointment.additionalNotes || appointment.notes || "N/A",
      followUp: hasFollowUp(appointment)
        ? formatDate(appointment.follow_up_date || appointment.followUpDate || appointment.follow_up || appointment.followUp)
        : "Not required",
    };
  };

  const buildPatientsFromAppointments = (appointments) => {
    const byPatient = new Map();

    [...appointments].sort((a,b) => Date.parse(b.appointment_date || b.date || b.createdAt || 0) - Date.parse(a.appointment_date || a.date || a.createdAt || 0)).forEach((appointment) => {
      if (!isPatientDirectoryRecord(appointment)) return;
      const patient = patientCardDetails(appointment);
      const patientId = String(patient.id || `record-${appointment.id || appointment._id}`);
      const record = normalizeRecord(appointment);
      const existing = byPatient.get(patientId);

      const patientDetails = existing || {
        ...patient,
        profilePhoto: appointment.patient?.profilePhoto || appointment.patient?.avatarUrl || appointment.patient?.avatar || appointment.user?.profilePhoto,
        lastVisit: record.date,
        records: [],
      };

      if (existing) {
        for (const field of ['name', 'age', 'gender', 'phone', 'bloodGroup']) {
          if (['N/A', 'Unknown Patient', '', undefined, null].includes(patientDetails[field]) && !['N/A', 'Unknown Patient', '', undefined, null].includes(patient[field])) patientDetails[field] = patient[field];
        }
      }
      patientDetails.records.push(record);
      patientDetails.records.sort((a, b) => b.timestamp - a.timestamp);
      patientDetails.lastVisit = patientDetails.records[0]?.date || record.date;
      patientDetails.lastVisitKey = patientDetails.records[0]?.dateKey || record.dateKey;
      byPatient.set(patientId, patientDetails);
    });

    return Array.from(byPatient.values());
  };

  const patientBuilder = useRef(buildPatientsFromAppointments);
  patientBuilder.current = buildPatientsFromAppointments;

  useEffect(() => {
    const controller = new AbortController();
    let timer;
    let inFlight = false;
    setStatus("loading");
    const loadPatients = async () => {
      if (inFlight || controller.signal.aborted) return;
      clearTimeout(timer);
      if (!doctorId) {
        setStatus("failed"); setError("Doctor ID not found. Please login again."); setPatients([]); return;
      }
      inFlight = true; setRefreshing(true);
      try {
        setError("");
        const responses = await Promise.allSettled(['/appointments', '/walkin-appointments'].map(path => axios.get(`${API_BASE_URL}${path}`, {
          headers: getAuthHeaders(), params: { doctor_id: doctorId, patient_directory: 'true' }, signal: controller.signal, timeout: 15000,
        })));
        if (controller.signal.aborted) return;
        if (responses.every(result => result.status === 'rejected')) throw responses[0].reason;
        if (responses.some(result => result.status === 'rejected')) setError('Some visit records could not load. Refresh to try again.');
        const appointments = responses.flatMap((result, index) => result.status === 'fulfilled' ? unwrapApiArray(result.value.data).map(record => ({ ...record, appointment_type: record.appointment_type || (index === 0 ? 'online' : 'walkin') })) : []).filter((appointment) => {
          const appointmentDoctorId = appointment.doctor_id || appointment.doctorId || appointment.doctor?.id || appointment.doctor?._id || appointment.counselor?._id || appointment.counselor?.id;
          return !appointmentDoctorId || String(typeof appointmentDoctorId === "object" ? appointmentDoctorId._id || appointmentDoctorId.id : appointmentDoctorId) === String(doctorId);
        });
        setPatients(patientBuilder.current(appointments)); setStatus("succeeded");
      } catch (error) {
        if (controller.signal.aborted) return;
        setStatus("failed"); setError(error.response?.data?.message || error.response?.data?.error || error.message || "Failed to load patient details"); setPatients([]);
      } finally {
        inFlight = false;
        if (!controller.signal.aborted) { setRefreshing(false); timer = setTimeout(loadPatients, 15000); }
      }
    };
    const onFocus = () => { if (document.visibilityState !== 'hidden') loadPatients(); };
    loadPatients();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => { controller.abort(); clearTimeout(timer); window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onFocus); };
  }, [doctorId, refreshKey]);

  useEffect(() => {
    if (!selectedPatient) return;
    const updated = patients.find(patient => patient.id === selectedPatient.id);
    if (!updated) { setSelectedPatient(null); setSelectedRecord(null); setShowPatientList(true); return; }
    setSelectedPatient(updated);
    setSelectedRecord(previous => previous ? updated.records.find(record => record.id === previous.id) || null : null);
  }, [patients, selectedPatient]);

  const filteredPatients = filterPatients(patients, { search, genderFilter, bloodGroupFilter, ageFilter, lastVisitFilter, sortBy });

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

  // Reset pagination when search OR any filter changes
  useEffect(() => {
    setPatientPage(1);
  }, [search, genderFilter, bloodGroupFilter, ageFilter, lastVisitFilter, sortBy]);

  useEffect(() => {
    if (patientPage > patientTotalPages) setPatientPage(patientTotalPages);
  }, [patientPage, patientTotalPages]);

  useEffect(() => {
    if (recordPage > recordTotalPages) setRecordPage(recordTotalPages);
  }, [recordPage, recordTotalPages]);

  const todaysAppointments = patients.reduce(
    (count, patient) => count + patient.records.filter((record) => record.dateKey === dateKey(new Date())).length,
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
      lastVisitKey: newPatient.lastVisit,
      records: [
        {
          id: `record-${Date.now()}`,
          date: visitDate,
          dateKey: newPatient.lastVisit,
          timestamp: Date.parse(newPatient.lastVisit),
          time: "N/A",
          bp: "N/A",
          pulse: "N/A",
          temperature: "N/A",
          problem: "New patient registration",
          diagnosis: "N/A",
          tablets: "N/A",
          days: "N/A",
          doctor: newPatient.doctor || appointmentDoctorName({}, authUser || getStoredAuthUser()),
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

  // ===== Clear all filters =====
  const clearAllFilters = () => {
    setSearch("");
    setGenderFilter("All");
    setBloodGroupFilter("All");
    setAgeFilter("All");
    setLastVisitFilter("All");
    setSortBy("Newest First");
  };

  const hasActiveFilters =
    search !== "" ||
    genderFilter !== "All" ||
    bloodGroupFilter !== "All" ||
    ageFilter !== "All" ||
    lastVisitFilter !== "All" ||
    sortBy !== "Newest First";

  return (
    <div className="pd-container">
      {showPatientList && (
        <>
          <div className="pd-overview-header">
            <div>
              <h2 className="pd-title"><PortalText text={"Patients Medical Records"} /></h2>
              <p className="pd-subtitle"><PortalText text={"Comprehensive patient history and visit details"} /></p>
            </div>
            <div className="pd-header-actions"><button type="button" className="pd-refresh-btn" disabled={refreshing} onClick={() => setRefreshKey(value => value + 1)}><RefreshCw size={16} />{refreshing ? <PortalText text={"Refreshing..."} /> : <PortalText text={"Refresh"} />}</button><button type="button" className="pd-add-patient-btn" onClick={() => setShowAddPatientModal(true)}><UserPlus size={16} /><PortalText text={"Add Patient"} /></button></div>
          </div>

          <div className="pd-stats-strip">
            <div className="pd-stat-tile active">
              <div className="pd-stat-icon teal"><Users size={22} /></div>
              <span className="pd-stat-trend"><TrendingUp size={12} /> 12%</span>
              <small><PortalText text={"Total Patients"} /></small>
              <strong>{patients.length || 0}</strong>
            </div>
            <div className="pd-stat-tile">
              <div className="pd-stat-icon blue"><UserPlus size={22} /></div>
              <small><PortalText text={"New Admissions"} /></small>
              <strong>{patients.filter((patient) => patient.records.length === 1).length}</strong>
            </div>
            <div className="pd-stat-tile">
              <div className="pd-stat-icon red"><ClipboardList size={22} /></div>
              <small><PortalText text={"Pending Reports"} /></small>
              <strong>{pendingReports}</strong>
            </div>
            <div className="pd-stat-tile">
              <div className="pd-stat-icon slate"><Calendar size={22} /></div>
              <small><PortalText text={"Today's Appts"} /></small>
              <strong>{todaysAppointments}</strong>
            </div>
          </div>
        </>
      )}

      {error && status !== "failed" && <p className="pd-directory-error" role="alert">{error}</p>}
      <div className="pd-main-layout">
        {/* Patient List Section - Only shown when no patient selected */}
        {showPatientList && (
          <div className="pd-patient-list-section">
            <div className="pd-directory-header">
              <h3 className="pd-section-title"><PortalText text={"Patients Directory"} /></h3>
              <div className="pd-directory-search">
                <PortalElement as="input"
                  type="text"
                  placeholder="Search patient"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* ===== Working Filter Row ===== */}
            <div className="pd-directory-tools">
              <div className="pd-filter-row">
                <PortalElement as="select"
                  className="pd-filter-select"
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  aria-label="Filter by gender"
                >
                  <PortalElement as="option" value="All">Gender: All</PortalElement>
                  <PortalElement as="option" value="Male">Male</PortalElement>
                  <PortalElement as="option" value="Female">Female</PortalElement>
                  <PortalElement as="option" value="Other">Other</PortalElement>
                </PortalElement>

                <PortalElement as="select"
                  className="pd-filter-select"
                  value={bloodGroupFilter}
                  onChange={(e) => setBloodGroupFilter(e.target.value)}
                  aria-label="Filter by blood group"
                >
                  <PortalElement as="option" value="All">Blood Group: All</PortalElement>
                  <PortalElement as="option" value="O+">O+</PortalElement>
                  <PortalElement as="option" value="O-">O-</PortalElement>
                  <PortalElement as="option" value="A+">A+</PortalElement>
                  <PortalElement as="option" value="A-">A-</PortalElement>
                  <PortalElement as="option" value="B+">B+</PortalElement>
                  <PortalElement as="option" value="B-">B-</PortalElement>
                  <PortalElement as="option" value="AB+">AB+</PortalElement>
                  <PortalElement as="option" value="AB-">AB-</PortalElement>
                </PortalElement>

                <PortalElement as="select"
                  className="pd-filter-select"
                  value={ageFilter}
                  onChange={(e) => setAgeFilter(e.target.value)}
                  aria-label="Filter by age"
                >
                  <PortalElement as="option" value="All">Age: All</PortalElement>
                  <PortalElement as="option" value="0-18">0 - 18</PortalElement>
                  <PortalElement as="option" value="19-35">19 - 35</PortalElement>
                  <PortalElement as="option" value="36-50">36 - 50</PortalElement>
                  <PortalElement as="option" value="51-64">51 - 65</PortalElement>
                  <PortalElement as="option" value="65+">65+</PortalElement>
                </PortalElement>

                <PortalElement as="select"
                  className="pd-filter-select"
                  value={lastVisitFilter}
                  onChange={(e) => setLastVisitFilter(e.target.value)}
                  aria-label="Filter by last visit"
                >
                  <PortalElement as="option" value="All">Last Visit: All</PortalElement>
                  <PortalElement as="option" value="Today">Today</PortalElement>
                  <PortalElement as="option" value="This Week">This Week</PortalElement>
                  <PortalElement as="option" value="This Month">This Month</PortalElement>
                  <PortalElement as="option" value="Last 3 Months">Last 3 Months</PortalElement>
                </PortalElement>

                {hasActiveFilters && (
                  <PortalElement as="button"
                    type="button"
                    className="pd-clear-filters-btn"
                    onClick={clearAllFilters}
                    title="Clear all filters"
                  >
                    <X size={14} /><PortalText text={" Clear"} /></PortalElement>
                )}
              </div>

              <label className="pd-sort-control"><PortalText text={"Sort by:"} /><select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <PortalElement as="option" value={"Newest First"}>Newest First</PortalElement>
                  <PortalElement as="option" value={"Oldest First"}>Oldest First</PortalElement>
                  <PortalElement as="option" value={"Name A-Z"}>Name A-Z</PortalElement>
                </select>
              </label>
            </div>

            {error && status === "succeeded" && <p role="status">{error}</p>}
            {/* ===== Active Filter Summary ===== */}
            {hasActiveFilters && status === "succeeded" && (
              <div className="pd-filter-summary">
                <span><PortalText text={"Showing "} /><strong>{filteredPatients.length}</strong><PortalText text={" of"} />{" "}
                  <strong>{patients.length}</strong><PortalText text={" patients"} /></span>
              </div>
            )}

            {status === "loading" ? (
              <div className="pd-empty-state">
                <FileText size={48} />
                <p><PortalText text={"Loading patients..."} /></p>
              </div>
            ) : status === "failed" ? (
              <div className="pd-empty-state">
                <FileText size={48} />
                <p>{error}</p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="pd-empty-state">
                <FileText size={48} />
                <p>
                  {hasActiveFilters
                    ? <PortalText text={"No patients match your filters. Try clearing them."} />
                    : <PortalText text={"No patients found for this doctor"} />}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="pd-clear-filters-btn"
                    onClick={clearAllFilters}
                    style={{ marginTop: 12 }}
                  >
                    <X size={14} /><PortalText text={" Clear Filters"} /></button>
                )}
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
                          {<PatientProfileImage patient={patient} fallback={patient.name.charAt(0)} />}
                        </div>
                        <div className="pd-patient-info">
                          <h4 className="pd-patient-name">{patient.name}</h4>
                          <div className="pd-patient-meta">
                            <span className="pd-patient-age"><span>{patient.age === "N/A" ? <PortalText text={"Age not provided"} /> : <PortalTemplate text={"{0} years"} values={[patient.age]} />}</span><span>{patient.gender === "N/A" ? <PortalText text={"Gender not provided"} /> : patient.gender}</span></span>
                            {patient.bloodGroup && patient.bloodGroup !== "N/A" && (
                              <PortalElement as="span" className="pd-patient-blood" title="Blood group">{patient.bloodGroup}</PortalElement>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="pd-patient-contact">
                        <Phone size={14} />
                        <span>{patient.phone}</span>
                      </div>
                      <div className="pd-patient-footer">
                        <div className="pd-patient-doctor">
                          <span><PortalText text={"Last visit: "} />{patient.lastVisit}</span><span><PortalText text={"Doctor"} /></span>
                          <strong>{patient.records[0]?.doctor || appointmentDoctorName({}, authUser || getStoredAuthUser())}</strong>
                        </div>
                        <span className="pd-record-count">
                          {patient.records.length} {patient.records.length === 1 ? <PortalText text={"Visit"} /> : <PortalText text={"Visits"} />}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <PatientPagination page={safePatientPage} totalPages={patientTotalPages} total={filteredPatients.length} first={patientFirstIndex} last={patientLastIndex} label="patients" onChange={setPatientPage} />
              </>
            )}
          </div>
        )}

        {/* Selected Patient's Records Section */}
        {selectedPatient && !selectedRecord && (
          <div className="pd-records-section">
            <div className="pd-records-header">
              <button className="pd-back-btn" onClick={handleBackToPatients}>
                <ChevronLeft size={18} /><PortalText text={" Back to Patients"} /></button>
              <div className="pd-selected-patient-info">
                <div className="pd-patient-avatar-large">
                  {<PatientProfileImage patient={selectedPatient} fallback={selectedPatient.name.charAt(0)} />}
                </div>
                <div>
                  <h3 className="pd-patient-name-large">{selectedPatient.name}</h3>
                  <div className="pd-patient-details">
                    <span className="pd-age-gender"><User size={14} /><span>{selectedPatient.age === "N/A" ? <PortalText text={"Age not provided"} /> : <PortalTemplate text={"{0} years"} values={[selectedPatient.age]} />}</span><span>{selectedPatient.gender === "N/A" ? <PortalText text={"Gender not provided"} /> : selectedPatient.gender}</span></span>
                    <span><Phone size={14} /> {selectedPatient.phone}</span>
                    <span><Heart size={14} /><PortalText text={" Blood Group: "} />{selectedPatient.bloodGroup}</span>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="pd-section-title">
              <Calendar size={20} /><PortalText text={" Visit History ("} />{selectedPatient.records.length}<PortalText text={" appointments)"} /></h3>

            {selectedPatient.records.length === 0 ? (
              <div className="pd-empty-state">
                <FileText size={48} />
                <p><PortalText text={"No visit records found for this patient"} /></p>
              </div>
            ) : (
              <div className="pd-records-table-container">
                <table className="pd-records-table">
                  <thead>
                    <tr>
                      <th><PortalText text={"Date"} /></th>
                      <th><PortalText text={"Time"} /></th>
                      <th><PortalText text={"Problem"} /></th>
                      <th><PortalText text={"Doctor"} /></th>
                      <th><PortalText text={"Follow-up"} /></th>
                      <th><PortalText text={"Action"} /></th>
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
                            <FileText size={14} /><PortalText text={" View Details"} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <PatientPagination page={safeRecordPage} totalPages={recordTotalPages} total={selectedRecords.length} first={recordFirstIndex} last={recordLastIndex} label="visits" onChange={setRecordPage} />
              </div>
            )}
          </div>
        )}

        {/* Record Details Section */}
        {selectedRecord && (
          <div className="pd-record-detail-section">
            <div className="pd-detail-header">
              <button className="pd-back-btn" onClick={handleBackToRecords}>
                <ChevronLeft size={18} /><PortalText text={" Back to Visits"} /></button>
              <h3 className="pd-section-title">
                <FileText size={20} /><PortalText text={" Visit Details"} /></h3>
            </div>

            <div className="pd-detail-card">
              <div className="pd-detail-patient-banner">
                <div className="pd-detail-avatar">{<PatientProfileImage patient={selectedPatient} fallback={selectedPatient.name.charAt(0)} />}</div>
                <div>
                  <h4 className="pd-detail-patient-name">{selectedPatient.name}</h4>
                  <div className="pd-detail-patient-meta">
                    <span className="pd-age-gender"><span>{selectedPatient.age === "N/A" ? <PortalText text={"Age not provided"} /> : <PortalTemplate text={"{0} years"} values={[selectedPatient.age]} />}</span><span>{selectedPatient.gender === "N/A" ? <PortalText text={"Gender not provided"} /> : selectedPatient.gender}</span></span>
                    
                    <span>{selectedPatient.bloodGroup}</span>
                    
                    <span>{selectedPatient.phone}</span>
                  </div>
                </div>
              </div>

              <div className="pd-detail-grid">
                <div className="pd-detail-column">
                  <h5 className="pd-detail-column-title"><PortalText text={"Visit Information"} /></h5>
                  <div className="pd-detail-item">
                    <span className="pd-detail-label"><PortalText text={"Date"} /></span>
                    <span className="pd-detail-value">
                      <Calendar size={14} /> {selectedRecord.date}
                    </span>
                  </div>
                  <div className="pd-detail-item">
                    <span className="pd-detail-label"><PortalText text={"Time"} /></span>
                    <span className="pd-detail-value">
                      <Clock size={14} /> {selectedRecord.time}
                    </span>
                  </div>
                  <div className="pd-detail-item">
                    <span className="pd-detail-label"><PortalText text={"Consulting Doctor"} /></span>
                    <span className="pd-detail-value pd-doctor-highlight">
                      <Stethoscope size={14} /> {selectedRecord.doctor}
                    </span>
                  </div>
                  <div className="pd-detail-item">
                    <span className="pd-detail-label"><PortalText text={"Follow-up Date"} /></span>
                    <span className="pd-detail-value pd-followup-highlight">
                      {selectedRecord.followUp}
                    </span>
                  </div>
                </div>

                <div className="pd-detail-column">
                  <h5 className="pd-detail-column-title"><PortalText text={"Vital Signs"} /></h5>
                  <DoctorVitalsButton key={`${selectedRecord.prescriptionRecord?.appointment_type}:${selectedRecord.id}`} appointment={selectedRecord} onSaved={(vitals) => {
                    const update = (record) => record.id === selectedRecord.id && record.prescriptionRecord?.appointment_type === selectedRecord.prescriptionRecord?.appointment_type
                      ? { ...record, vitals, prescriptionRecord: { ...record.prescriptionRecord, vitals } } : record;
                    setSelectedRecord((current) => current ? update(current) : current);
                    setPatients((current) => current.map((patient) => ({ ...patient, records: patient.records.map(update) })));
                  }} />
                  {selectedRecord.vitals && <VitalsSummary vitals={selectedRecord.vitals} />}
                  {!selectedRecord.vitals && <div className="pd-vitals-grid">
                    <div className="pd-vital-card">
                      <div className="pd-vital-icon bp-icon">
                        <Heart size={18} />
                      </div>
                      <div>
                        <div className="pd-vital-label"><PortalText text={"Blood Pressure"} /></div>
                        <div className="pd-vital-value">{selectedRecord.bp}<PortalText text={" mmHg"} /></div>
                      </div>
                    </div>
                    <div className="pd-vital-card">
                      <div className="pd-vital-icon pulse-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                        </svg>
                      </div>
                      <div>
                        <div className="pd-vital-label"><PortalText text={"Pulse Rate"} /></div>
                        <div className="pd-vital-value">{selectedRecord.pulse}<PortalText text={" bpm"} /></div>
                      </div>
                    </div>
                    <div className="pd-vital-card">
                      <div className="pd-vital-icon temp-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
                        </svg>
                      </div>
                      <div>
                        <div className="pd-vital-label"><PortalText text={"Temperature"} /></div>
                        <div className="pd-vital-value">{selectedRecord.temperature}</div>
                      </div>
                    </div>
                  </div>}
                </div>

                <div className="pd-detail-column">
                  <h5 className="pd-detail-column-title"><PortalText text={"Medical Information"} /></h5>
                  <div className="pd-detail-item">
                    <span className="pd-detail-label"><PortalText text={"Presenting Problem"} /></span>
                    <span className="pd-detail-value pd-problem-value">{selectedRecord.problem}</span>
                  </div>
                  <div className="pd-detail-item">
                    <span className="pd-detail-label"><PortalText text={"Diagnosis"} /></span>
                    <span className="pd-detail-value">{selectedRecord.diagnosis}</span>
                  </div>
                </div>

                <div className="pd-detail-column pd-prescription-column">
                  <h5 className="pd-detail-column-title">
                    <Pill size={18} /><PortalText text={" Prescription"} /></h5>
                  <div className="pd-prescription-box">
                    <div className="pd-medication-list">
                      <div className="pd-medication-item">
                        <div className="pd-medication-name"><PortalText text={"Medication"} /></div>
                        <div className="pd-medication-details">{selectedRecord.tablets}</div>
                      </div>
                      <div className="pd-medication-item">
                        <div className="pd-medication-name"><PortalText text={"Duration"} /></div>
                        <div className="pd-medication-details">{selectedRecord.days}</div>
                      </div>
                    </div>
                    <div className="pd-instructions">
                      <h6><PortalText text={"Doctor's Instructions:"} /></h6>
                      <p>{selectedRecord.prescription}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pd-detail-actions">
                <button
                  className="pd-btn-primary"
                  onClick={handleDownloadPrescription}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <span className="pd-spinner"></span><PortalText text={"Downloading..."} /></>
                  ) : (
                    <>
                      <Download size={16} /><PortalText text={"Download Prescription"} /></>
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
                <h3><PortalText text={"Add Patient"} /></h3>
                <p><PortalText text={"Create a patient profile for the doctor portal."} /></p>
              </div>
              <PortalElement as="button" type="button" onClick={() => setShowAddPatientModal(false)} aria-label="Close">
                <i className="fa-solid fa-xmark"></i>
              </PortalElement>
            </div>

            <div className="pd-add-form-grid">
              <label><PortalText text={"Patient Name"} /><PortalElement as="input" required value={newPatient.name} onChange={(event) => updateNewPatient("name", event.target.value)} placeholder="Robert Chen" />
              </label>
              <label><PortalText text={"Phone No"} /><input value={newPatient.phone} onChange={(event) => updateNewPatient("phone", event.target.value)} placeholder="+1 (555) 019-2834" />
              </label>
              <label><PortalText text={"Age"} /><input type="number" min="0" value={newPatient.age} onChange={(event) => updateNewPatient("age", event.target.value)} placeholder="54" />
              </label>
              <label><PortalText text={"Gender"} /><select value={newPatient.gender} onChange={(event) => updateNewPatient("gender", event.target.value)}>
                  <PortalElement as="option" value={"Male"}>Male</PortalElement>
                  <PortalElement as="option" value={"Female"}>Female</PortalElement>
                  <PortalElement as="option" value={"Other"}>Other</PortalElement>
                </select>
              </label>
              <label><PortalText text={"Blood Group"} /><select value={newPatient.bloodGroup} onChange={(event) => updateNewPatient("bloodGroup", event.target.value)}>
                  <PortalElement as="option" value="">Select blood group</PortalElement>
                  <PortalElement as="option" value={"O+"}>O+</PortalElement>
                  <PortalElement as="option" value={"O-"}>O-</PortalElement>
                  <PortalElement as="option" value={"A+"}>A+</PortalElement>
                  <PortalElement as="option" value={"A-"}>A-</PortalElement>
                  <PortalElement as="option" value={"B+"}>B+</PortalElement>
                  <PortalElement as="option" value={"B-"}>B-</PortalElement>
                  <PortalElement as="option" value={"AB+"}>AB+</PortalElement>
                  <PortalElement as="option" value={"AB-"}>AB-</PortalElement>
                </select>
              </label>
              <label><PortalText text={"Doctor"} /><PortalElement as="input" value={newPatient.doctor} onChange={(event) => updateNewPatient("doctor", event.target.value)} placeholder="Doctor name" />
              </label>
              <label className="pd-wide-field"><PortalText text={"Last Visit"} /><input type="date" value={newPatient.lastVisit} onChange={(event) => updateNewPatient("lastVisit", event.target.value)} />
              </label>
            </div>

            <div className="pd-modal-actions">
              <button type="button" className="pd-modal-cancel" onClick={() => setShowAddPatientModal(false)}><PortalText text={"Cancel"} /></button>
              <button type="submit" className="pd-modal-save"><PortalText text={"Add Patient"} /></button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
