import { useCallback, useEffect, useMemo, useState } from "react";
import { useDoctorUser } from "../doctorApi.js";
import axios from "../../../axiosConfig.js";
import {
  BedDouble,
  Building2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Hospital,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Stethoscope,
  UsersRound,
} from "lucide-react";
import { API_BASE_URL, getAuthHeaders } from "../doctorApi.js";
import "./ClinicPage.css";

const CLINICS_BASE_URL = `${API_BASE_URL}/clinics`;
const DEFAULT_CLINIC_IMAGE = "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1600&q=80";

const fallbackClinic = {
  id: "fallback-clinic",
  name: "Clinic Profile",
  subtitle: "Healthcare Facility",
  address: "Address not available",
  fullAddress: "Address not available",
  phone: "",
  email: "",
  website: "",
  image: DEFAULT_CLINIC_IMAGE,
  mapUrl: "",
  about: "Clinic information is not available.",
  mission: "Mission information is not available.",
  specialties: [],
  stats: {
    doctors: 0,
    departments: 0,
    patients: 0,
    beds: 0,
    emergency: "24/7",
    rating: "N/A",
  },
};

const getStoredAuthUser = () => {
  try {
    return JSON.parse(localStorage.getItem("userData") || "null");
  } catch {
    return null;
  }
};

const unwrapApiArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.clinics)) return payload.clinics;
  if (Array.isArray(payload?.data?.clinics)) return payload.data.clinics;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload?.appointments)) return payload.appointments;
  if (Array.isArray(payload?.departments)) return payload.departments;
  if (Array.isArray(payload?.data?.users)) return payload.data.users;
  if (Array.isArray(payload?.data?.appointments)) return payload.data.appointments;
  if (Array.isArray(payload?.data?.departments)) return payload.data.departments;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const getDoctorId = (user = {}) => (
  user.doctor_id ||
  user.doctorId ||
  user.id ||
  user._id ||
  user.user_id ||
  user.userId ||
  ""
);

const getAssetUrl = (value) => {
  if (!value) return "";
  const path = String(value).trim().replace(/\\/g, "/");
  if (path.startsWith("http") || path.startsWith("data:") || path.startsWith("blob:")) return path;
  if (/^(\/9j\/|iVBORw0KGgo|R0lGOD|UklGR)/.test(path)) return `data:image/jpeg;base64,${path}`;
  const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${apiOrigin}/${path.replace(/^\/+/, "")}`;
};

const getAlternateAssetUrl = (value) => {
  if (!value || typeof value !== "string" || !value.trim().startsWith("/uploads/")) return "";
  return `${API_BASE_URL}${value.trim()}`;
};

const getClinicPhotoUrl = (clinic) => {
  const uploadedPhoto = clinic?.raw?.clinic_photo;
  return getAssetUrl(uploadedPhoto) || clinic?.image || DEFAULT_CLINIC_IMAGE;
};

const bufferToDataUrl = (bufferValue) => {
  const bytes = Array.isArray(bufferValue?.data) ? bufferValue.data : bufferValue;
  if (!Array.isArray(bytes)) return "";

  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return `data:image/jpeg;base64,${window.btoa(binary)}`;
};

const parsePhotoValue = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(parsePhotoValue);

  if (typeof value === "object") {
    if (value.type === "Buffer" || Array.isArray(value.data)) {
      return [bufferToDataUrl(value)].filter(Boolean);
    }

    const directPhoto = [
      value.url,
      value.secure_url,
      value.src,
      value.uri,
      value.path,
      value.file,
      value.filename,
      value.image,
      value.clinic_photo,
      value.clinic_image,
    ].filter(Boolean);
    const nestedPhoto = value.data && !Array.isArray(value.data) ? parsePhotoValue(value.data) : [];
    return [...directPhoto, ...nestedPhoto];
  }

  const text = String(value).trim();
  if (!text) return [];

  if ((text.startsWith("[") && text.endsWith("]")) || (text.startsWith("{") && text.endsWith("}"))) {
    try {
      return parsePhotoValue(JSON.parse(text));
    } catch {
      return [text];
    }
  }

  if (text.startsWith("\\x")) {
    try {
      const bytes = text
        .slice(2)
        .match(/.{1,2}/g)
        ?.map((hex) => parseInt(hex, 16));
      return [bufferToDataUrl(bytes)].filter(Boolean);
    } catch {
      return [text];
    }
  }

  return text.includes(",") ? text.split(",").map((item) => item.trim()).filter(Boolean) : [text];
};

const buildMapUrl = (clinic, address) => {
  const existingUrl = clinic.map_url || clinic.mapUrl || clinic.google_map_url || "";
  if (existingUrl) return existingUrl;

  const lat = clinic.latitude || clinic.lat || clinic.location_lat || clinic.location?.lat;
  const lng = clinic.longitude || clinic.lng || clinic.location_lng || clinic.location?.lng;
  if (lat && lng) return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  if (address) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  return "";
};

const normalizeClinic = (clinic, index = 0) => {
  const photos = parsePhotoValue([
    clinic.clinic_photo,
    clinic.clinicPhotoBuffer,
    clinic.clinic_photos,
    clinic.clinicPhoto,
    clinic.clinicPhotos,
    clinic.clinic_photo_url,
    clinic.clinicPhotoUrl,
    clinic.clinic_photo_path,
    clinic.clinicPhotoPath,
    clinic.clinic_image,
    clinic.clinic_image_url,
    clinic.photo,
    clinic.photos,
    clinic.photo_data,
    clinic.photoData,
    clinic.image,
    clinic.images,
    clinic.image_url,
    clinic.image_urls,
    clinic.photo_url,
    clinic.photo_urls,
    clinic.uploaded_photo,
    clinic.uploaded_photos,
    clinic.media,
    clinic.logo,
    clinic.file_path,
    clinic.filePath,
  ].filter(Boolean)).map(getAssetUrl);

  const address = clinic.location || clinic.address || clinic.clinic_address || fallbackClinic.address;
  const rawSpecialties = clinic.specialties || clinic.key_specialties || clinic.departments || clinic.services;
  const specialties = Array.isArray(rawSpecialties)
    ? rawSpecialties
    : String(rawSpecialties || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  return {
    raw: clinic,
    id: clinic.id || clinic.clinic_id || clinic._id || index,
    doctorId: clinic.doctor_id || clinic.doctorId || clinic.doctor?.id || clinic.doctor?._id || "",
    name: clinic.clinic_name || clinic.clinicName || clinic.name || fallbackClinic.name,
    subtitle: clinic.type || clinic.category || fallbackClinic.subtitle,
    address,
    fullAddress: clinic.full_address || clinic.fullAddress || clinic.address || address,
    phone: clinic.phone_number || clinic.phone || clinic.contact_number || fallbackClinic.phone,
    email: clinic.email || clinic.clinic_email || fallbackClinic.email,
    website: clinic.website || clinic.web_url || fallbackClinic.website,
    image: photos[0] || fallbackClinic.image,
    mapUrl: buildMapUrl(clinic, address),
    about: clinic.about || clinic.description || clinic.about_hospital || fallbackClinic.about,
    mission: clinic.mission || clinic.our_mission || fallbackClinic.mission,
    specialties: specialties.length ? specialties : fallbackClinic.specialties,
    stats: {
      doctors: clinic.doctors_count || clinic.doctor_count || clinic.total_doctors || fallbackClinic.stats.doctors,
      departments: clinic.departments_count || clinic.department_count || clinic.total_departments || fallbackClinic.stats.departments,
      patients: clinic.patients_count || clinic.patient_count || clinic.total_patients || fallbackClinic.stats.patients,
      beds: clinic.beds_count || clinic.bed_count || clinic.total_beds || fallbackClinic.stats.beds,
      emergency: clinic.emergency_status || clinic.emergency || fallbackClinic.stats.emergency,
      rating: clinic.rating || clinic.patient_rating || fallbackClinic.stats.rating,
    },
  };
};

export default function ClinicPage() {
  const authUser = useDoctorUser();
  const user = useMemo(() => authUser || getStoredAuthUser() || {}, [authUser]);
  const doctorId = useMemo(() => getDoctorId(user), [user]);
  const userRole = String(user.role || "doctor").toLowerCase();

  const [clinics, setClinics] = useState([]);
  const [activeClinicIndex, setActiveClinicIndex] = useState(0);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [activeTab, setActiveTab] = useState("Overview");
  const [clinicDoctors, setClinicDoctors] = useState([]);
  const [clinicDepartments, setClinicDepartments] = useState([]);
  const [clinicAppointments, setClinicAppointments] = useState([]);
  const [resourceStatus, setResourceStatus] = useState("idle");

  const loadClinic = useCallback(async (signal) => {
    if (!doctorId) {
      setClinics([]);
      setActiveClinicIndex(0);
      setStatus("succeeded");
      return;
    }

    try {
      setStatus("loading");
      setError("");
      const response = await axios.get(CLINICS_BASE_URL, {
        headers: getAuthHeaders(),
        params: { doctor_id: doctorId, role: userRole },
        signal,
      });

      const rows = unwrapApiArray(response.data)
        .map(normalizeClinic)
        .filter((item) => !item.doctorId || String(item.doctorId) === String(doctorId));

      setClinics(rows);
      setActiveClinicIndex(0);
      setStatus("succeeded");
    } catch (err) {
      if (axios.isCancel(err)) return;
      setClinics([]);
      setActiveClinicIndex(0);
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to load clinics. Please refresh and try again.");
      setStatus("failed");
    }
  }, [doctorId, userRole]);

  useEffect(() => {
    const controller = new AbortController();
    loadClinic(controller.signal);
    return () => controller.abort();
  }, [loadClinic]);

  const clinic = clinics[activeClinicIndex] || fallbackClinic;

  useEffect(() => {
    const controller = new AbortController();

    const loadClinicResources = async () => {
      if (!clinic?.id || clinic.id === "fallback-clinic") {
        setClinicDoctors([]);
        setClinicDepartments([]);
        setClinicAppointments([]);
        return;
      }

      setResourceStatus("loading");
      const params = { clinic_id: clinic.id, doctor_id: clinic.doctorId || doctorId };
      const requestConfig = { headers: getAuthHeaders(), params, signal: controller.signal };
      const [doctorResult, appointmentResult] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/auth/me`, requestConfig),
        axios.get(`${API_BASE_URL}/appointments`, requestConfig),
      ]);

      if (controller.signal.aborted) return;

      const matchesClinic = (item) => {
        const itemClinicId =
          item.clinic_id || item.clinicId || item.clinic?.id || item.clinic?._id ||
          item.hospital_id || item.hospitalId;
        return !itemClinicId || String(itemClinicId) === String(clinic.id);
      };

      const doctorRows = doctorResult.status === "fulfilled"
        ? [doctorResult.value.data.user].filter(Boolean)
        : [];
      const appointmentRows = appointmentResult.status === "fulfilled"
        ? unwrapApiArray(appointmentResult.value.data).filter(matchesClinic)
        : [];
      const departmentRows = Array.isArray(clinic.raw?.departments) ? clinic.raw.departments : [];

      setClinicDoctors(doctorRows);
      setClinicAppointments(appointmentRows);
      setClinicDepartments(departmentRows);
      setResourceStatus(doctorResult.status === "rejected" || appointmentResult.status === "rejected" ? "failed" : "succeeded");
    };

    loadClinicResources().catch((resourceError) => {
      if (axios.isCancel(resourceError)) return;
      setClinicDoctors([]);
      setClinicDepartments([]);
      setClinicAppointments([]);
      setResourceStatus("failed");
    });

    return () => controller.abort();
  }, [clinic.id, clinic.doctorId, doctorId]);

  const normalizedDoctors = useMemo(() => clinicDoctors.map((doctor, index) => ({
    id: doctor.id || doctor.user_id || doctor.doctor_id || doctor._id || index,
    name: doctor.fullName || doctor.full_name || doctor.fullname || doctor.name || doctor.doctor_name || "Doctor",
    specialty: (Array.isArray(doctor.specialization) ? doctor.specialization.join(", ") : doctor.specialization) || doctor.speciality || doctor.specialty || doctor.department || "General Physician",
    experience: doctor.experience || doctor.years_of_experience || doctor.experience_years || "N/A",
    rating: doctor.rating || doctor.average_rating || "N/A",
    image: getAssetUrl(doctor.profile_photo || doctor.profilePhoto || doctor.avatar || doctor.image) || DEFAULT_CLINIC_IMAGE,
  })), [clinicDoctors]);

  const departmentNames = useMemo(() => {
    const names = new Set();
    clinicDepartments.forEach((department) => {
      const name = department.department_name || department.name || department.title;
      if (name) names.add(String(name));
    });
    normalizedDoctors.forEach((doctor) => {
      if (doctor.specialty && doctor.specialty !== "General Physician") names.add(String(doctor.specialty));
    });
    clinicAppointments.forEach((appointment) => {
      const name = appointment.department_name || appointment.department || appointment.specialization;
      if (name) names.add(String(name));
    });
    return Array.from(names);
  }, [clinicDepartments, clinicAppointments, normalizedDoctors]);

  const patientCount = useMemo(() => {
    const ids = new Set();
    clinicAppointments.forEach((appointment, index) => {
      const patient = appointment.patient || appointment.patient_details || {};
      const id = appointment.patient_id || appointment.patientId || patient.id || patient._id ||
        appointment.patient_phone || appointment.phone_number || patient.phone || `appointment-${index}`;
      ids.add(String(id));
    });
    return ids.size;
  }, [clinicAppointments]);

  const facilities = useMemo(() => {
    const raw = clinic.raw?.facilities || clinic.raw?.services || clinic.raw?.amenities || [];
    if (Array.isArray(raw)) return raw.map((item) => typeof item === "string" ? item : item.name || item.title).filter(Boolean);
    return String(raw || "").split(",").map((item) => item.trim()).filter(Boolean);
  }, [clinic]);

  const stats = [
    { label: "Doctors", value: normalizedDoctors.length, icon: Stethoscope, tone: "blue" },
    { label: "Departments", value: departmentNames.length, icon: Building2, tone: "indigo" },
    { label: "Patients", value: patientCount, icon: UsersRound, tone: "gold" },
    { label: "Beds", value: clinic.stats.beds, icon: BedDouble, tone: "green" },
    { label: "Emergency", value: clinic.stats.emergency, icon: Hospital, tone: "red" },
  ];

  const changeClinic = (direction) => {
    if (!clinics.length) return;
    setActiveClinicIndex((currentIndex) => (
      (currentIndex + direction + clinics.length) % clinics.length
    ));
    setActiveTab("Overview");
    setDeleteError("");
  };

  const handleDeleteClinic = async () => {
    if (isDeleting || !clinics.length) return;
    if (!window.confirm(`Delete ${clinic.name}? This cannot be undone. Clinics with staff, appointments or saved timings cannot be deleted.`)) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      await axios.delete(`${CLINICS_BASE_URL}/${clinic.id}`, { headers: getAuthHeaders() });
      setClinics((rows) => rows.filter((item) => item.id !== clinic.id));
      setActiveClinicIndex(0);
      setActiveTab("Overview");
    } catch (error) {
      setDeleteError(error.response?.data?.message || "Clinic could not be deleted. Please try again.");
    } finally { setIsDeleting(false); }
  };

  const formatWebsiteUrl = (website = "") => {
    if (!website) return "#";
    return website.startsWith("http") ? website : `https://${website}`;
  };

  if (!clinics.length) return (
    <div className="doctor-clinic-profile-page">
      <h1>Clinics / Hospitals</h1>
      {error && <p role="alert">{error}</p>}
      <p>{status === "loading" || status === "idle" ? "Loading clinics..." : "No clinics or hospitals added. Add one from Clinic Settings."}</p>
    </div>
  );

  return (
    <div className="doctor-clinic-profile-page">
      {error && <div className="doctor-clinic-profile-error">{error}</div>}
      <div className="doctor-clinic-management">
        <label>
          Clinic / Hospital
          <select disabled={isDeleting} value={activeClinicIndex} onChange={(event) => {
            setActiveClinicIndex(Number(event.target.value)); setActiveTab("Overview"); setDeleteError("");
          }}>
            {clinics.map((item, index) => <option key={item.id} value={index}>{item.name} — {item.address}</option>)}
          </select>
        </label>
        <button type="button" className="doctor-clinic-delete" disabled={isDeleting} onClick={handleDeleteClinic}>
          {isDeleting ? "Deleting..." : "Delete Clinic / Hospital"}
        </button>
      </div>
      {deleteError && <p className="doctor-clinic-profile-error" role="alert">{deleteError}</p>}

      <section className="doctor-clinic-hero">
        <img
          src={getClinicPhotoUrl(clinic)}
          alt={clinic.name}
          onError={(event) => {
            const uploadedPhoto = clinic.raw?.clinic_photo;
            const alternateUrl = getAlternateAssetUrl(uploadedPhoto);
            if (alternateUrl && event.currentTarget.src !== alternateUrl) {
              event.currentTarget.src = alternateUrl;
              return;
            }
            event.currentTarget.src = DEFAULT_CLINIC_IMAGE;
          }}
        />
        <div className="doctor-clinic-hero-overlay" />

        <div className="doctor-clinic-hero-content">
          <div className="doctor-clinic-status-row">
            <span className="doctor-clinic-open-badge">Open Now</span>
            <span className="doctor-clinic-type-badge">{clinic.subtitle}</span>
          </div>

          <h1>{clinic.name}</h1>
          <div className="doctor-clinic-hero-meta">
            <span>
              <MapPin size={14} />
              {clinic.address}
            </span>
            <span>
              <Star size={14} fill="currentColor" />
              {clinic.stats.rating !== "N/A" ? `${clinic.stats.rating} Rating` : "No rating available"}
            </span>
          </div>
        </div>

        {clinics.length > 1 && (
          <>
            <button
              type="button"
              className="doctor-clinic-switch-btn doctor-clinic-switch-prev"
              onClick={() => changeClinic(-1)}
              aria-label="Previous clinic"
              disabled={isDeleting}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="doctor-clinic-switch-btn doctor-clinic-switch-next"
              onClick={() => changeClinic(1)}
              aria-label="Next clinic"
              disabled={isDeleting}
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </section>

      <nav className="doctor-clinic-tabs" aria-label="Clinic sections">
        {["Overview", "Doctors", "Departments", "Facilities", "Reviews", "Contact"].map((tab) => (
          <button type="button" className={activeTab === tab ? "is-active" : ""} key={tab} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </nav>

      <div className="doctor-clinic-profile-body">
        {status === "loading" && <div className="doctor-clinic-profile-state">Loading clinic profile...</div>}

        {(activeTab === "Overview") && <section className="doctor-clinic-stats" aria-label="Clinic summary">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <article className="doctor-clinic-stat-card" key={item.label}>
                <span className={`doctor-clinic-stat-icon doctor-clinic-stat-${item.tone}`}>
                  <Icon size={20} />
                </span>
                <strong>{item.value}</strong>
                <p>{item.label}</p>
              </article>
            );
          })}
        </section>}

        {(activeTab === "Overview" || activeTab === "Contact") && <section className="doctor-clinic-info-grid">
          {activeTab === "Overview" && (
          <article className="doctor-clinic-panel doctor-clinic-about">
            <h2>About Hospital</h2>
            <p>{clinic.about}</p>

            <h3>Our Mission</h3>
            <p>{clinic.mission}</p>

            <h3>Key Specialties</h3>
            <div className="doctor-clinic-specialties">
              {clinic.specialties.map((item) => (
                <span key={item}>{item}</span>
              ))}
              {!clinic.specialties.length && <span>No specialties available</span>}
            </div>
          </article>
          )}

          {(activeTab === "Overview" || activeTab === "Contact") && <aside className="doctor-clinic-panel doctor-clinic-contact">
            <h2>Contact Information</h2>
            <div className="doctor-clinic-contact-list">
              <span>
                <MapPin size={15} />
                {clinic.fullAddress}
              </span>
              {clinic.phone && <a href={`tel:${clinic.phone}`}>
                <Phone size={15} />
                {clinic.phone}
              </a>}
              {clinic.email && <a href={`mailto:${clinic.email}`}>
                <Mail size={15} />
                {clinic.email}
              </a>}
              {clinic.website && <a href={formatWebsiteUrl(clinic.website)} target="_blank" rel="noreferrer">
                <ExternalLink size={15} />
                {clinic.website}
              </a>}
            </div>

            <div className="doctor-clinic-hours">
              <h3>Hours</h3>
              <p>
                <span>Emergency</span>
                <strong>24/7 Open</strong>
              </p>
              <p>
                <span>OPD Timings</span>
                <strong>8:00 AM - 8:00 PM</strong>
              </p>
            </div>
          </aside>}
        </section>}

        {(activeTab === "Overview" || activeTab === "Doctors") && <section className="doctor-clinic-specialists-section">
          <div className="doctor-clinic-section-heading">
            <div>
              <h2>Featured Specialists</h2>
              <p>Our team of experienced medical professionals</p>
            </div>
            {activeTab === "Overview" && <button type="button" onClick={() => setActiveTab("Doctors")}>View All Doctors</button>}
          </div>

          <div className="doctor-clinic-doctors">
            {normalizedDoctors.map((doctor) => (
              <article className="doctor-clinic-doctor-card" key={doctor.id}>
                <img src={doctor.image} alt={doctor.name} />
                <div>
                  <h3>{doctor.name}</h3>
                  <p>{doctor.specialty}</p>
                  <div className="doctor-clinic-doctor-meta">
                    <span>
                      <Clock3 size={12} />
                      {doctor.experience === "N/A" ? "Experience N/A" : `${doctor.experience} Exp`}
                    </span>
                    <span>
                      <Star size={12} fill="currentColor" />
                      {doctor.rating}
                    </span>
                    <span>
                      <UsersRound size={12} />
                      {patientCount} Patients
                    </span>
                  </div>
                </div>
              </article>
            ))}
            {resourceStatus !== "loading" && !normalizedDoctors.length && (
              <div className="doctor-clinic-profile-state">No doctors found for this clinic.</div>
            )}
          </div>
        </section>}

        {activeTab === "Departments" && (
          <section className="doctor-clinic-panel doctor-clinic-tab-panel">
            <h2>Departments</h2>
            <div className="doctor-clinic-specialties">
              {departmentNames.map((department) => <span key={department}>{department}</span>)}
              {!departmentNames.length && <p>No departments found for this clinic.</p>}
            </div>
          </section>
        )}

        {activeTab === "Facilities" && (
          <section className="doctor-clinic-panel doctor-clinic-tab-panel">
            <h2>Facilities</h2>
            <div className="doctor-clinic-specialties">
              {facilities.map((facility) => <span key={facility}>{facility}</span>)}
              {!facilities.length && <p>No facility information available.</p>}
            </div>
          </section>
        )}

        {activeTab === "Reviews" && (
          <section className="doctor-clinic-panel doctor-clinic-tab-panel">
            <h2>Reviews</h2>
            <p>{clinic.stats.rating !== "N/A" ? `Current clinic rating: ${clinic.stats.rating}` : "No review data available."}</p>
          </section>
        )}
      </div>

      <span className="doctor-clinic-trust">
        <ShieldCheck size={14} />
        Verified clinic profile
      </span>
    </div>
  );
}
