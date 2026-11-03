import { usePortalTranslator, PatientLanguageControl, PortalText, PortalElement } from "../../common/PortalTranslation";
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../doctorApi.js";
import "./AppointmentForm.css";
import { loadWalkinSlots } from './walkinSlots.js';

const WALKIN_URL = `${API_BASE_URL}/walkin-appointments`;

const emptyForm = {
  patientName: "",
  contactNumber: "",
  problem: "",
  dateOfBirth: "",
  age: "",
  location: "",
  gender: "",
  appointmentTime: "",
  email: "",
};

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return "";
  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  const today = new Date();
  if (Number.isNaN(birthDate.getTime()) || birthDate > today) return "";
  let age = today.getFullYear() - birthDate.getFullYear();
  if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) age -= 1;
  return String(age);
};

export default function AppointmentForm({ clinicBooking = null }) {
  const translateUi = usePortalTranslator();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const doctorId = clinicBooking?.doctorId || params.get("doctorId") || "";
  const isQrBooking = Boolean(clinicBooking) || params.get("source")?.toLowerCase() === "qr";
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appointmentToken, setAppointmentToken] = useState("");
  const [apiError, setApiError] = useState("");
  const [doctor, setDoctor] = useState(null);
  const visit = useRef(null);
  const requestId = useRef(null);
  const submitting = useRef(false);
  const [slotState, setSlotState] = useState({ loading: true, slots: [], date: '', error: '' });
  const [slotRefresh, setSlotRefresh] = useState(0);
  const slotScope = clinicBooking?.doctorClinicId || '';

  useEffect(() => {
    if (!doctorId) { setSlotState({ loading: false, slots: [], date: '', error: 'Doctor information is missing. Please scan the doctor QR code again.' }); return; }
    let active = true;
    let pending = false;
    const controller = new AbortController();
    setSlotState({ loading: true, slots: [], date: '', error: '' });
    setFormData(current => ({ ...current, appointmentTime: '' }));
    const load = async () => {
      if (pending) return;
      pending = true;
      try {
        const data = await loadWalkinSlots(axios, API_BASE_URL, doctorId, clinicBooking, controller.signal);
        if (!active) return;
        if (!Array.isArray(data?.slots) || !data.date) throw new Error('Unable to load availability. Please retry.');
        setSlotState({ loading: false, slots: data.slots, date: data.date, error: '' });
        setFormData(current => current.appointmentTime && !data.slots.some(slot => slot.time === current.appointmentTime && slot.available)
          ? { ...current, appointmentTime: '' } : current);
      } catch (error) {
        if (active) setSlotState(current => ({ ...current, loading: false, error: error.response?.data?.message || 'Unable to load availability. Please retry.' }));
      } finally { pending = false; }
    };
    load();
    const timer = setInterval(load, 15000);
    window.addEventListener('focus', load);
    return () => { active = false; controller.abort(); clearInterval(timer); window.removeEventListener('focus', load); };
  }, [doctorId, slotScope, clinicBooking, slotRefresh]);

  useEffect(() => {
    if (!doctorId || clinicBooking) return;
    let active = true;
    setDoctor(null);
    if (visit.current?.doctorId !== doctorId) {
      visit.current = { doctorId, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` };
    }
    axios.get(`${API_BASE_URL}/auth/doctor-qr/${doctorId}`).then(({ data }) => {
      if (!active) return;
      setDoctor(data.data?.doctor || null);
    }).catch((error) => console.error("Unable to load doctor profile", error));
    return () => { active = false; };
  }, [doctorId, clinicBooking]);

  useEffect(() => {
    if (!doctor || !visit.current) return;
    axios.post(`${API_BASE_URL}/auth/doctor-qr/${doctorId}/visits`, {
      visitId: visit.current.id,
      source: isQrBooking ? "qr" : "direct",
    }).catch((error) => console.error("Unable to record QR visit", error));
  }, [doctor, doctorId, isQrBooking]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value, ...(name === "dateOfBirth" ? { age: calculateAge(value) } : {}) }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setApiError("");
  };

  const validate = () => {
    const next = {};
    if (!formData.patientName.trim()) next.patientName = "Patient name is required";
    if (!/^\d{10}$/.test(formData.contactNumber)) next.contactNumber = "Enter valid 10-digit number";
    if (!formData.problem.trim()) next.problem = "Please describe the problem";
    if (!formData.dateOfBirth) next.dateOfBirth = "Date of birth is required";
    else if (calculateAge(formData.dateOfBirth) === "") next.dateOfBirth = "Please provide a valid date_of_birth";
    if (!formData.location.trim()) next.location = "Location or address is required";
    if (!formData.gender) next.gender = "Gender is required";
    if (slotState.loading || slotState.error || !slotState.slots.some(slot => slot.time === formData.appointmentTime && slot.available)) next.appointmentTime = 'Please choose an available slot.';
    setErrors(next);
    return !Object.keys(next).length;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting.current || appointmentToken) return;
    if (!validate()) return;
    if (!doctorId) return setApiError("Doctor information is missing. Please scan the doctor QR code again.");
    const payload = {
      patient_name: formData.patientName.trim(),
      phone_number: formData.contactNumber.trim(),
      symptoms: formData.problem.trim(),
      doctor_id: doctorId,
      date_of_birth: formData.dateOfBirth,
      age: formData.age ? Number(formData.age) : undefined,
      location: formData.location.trim(),
      gender: formData.gender,
      appointment_time: formData.appointmentTime || undefined,
      appointment_date: slotState.date,
      email: formData.email.trim() || undefined,
      status: "booked",
      booking_source: isQrBooking ? "qr" : "direct",
    };
    try {
      submitting.current = true;
      setIsSubmitting(true);
      setApiError("");
      if (clinicBooking && !requestId.current) requestId.current = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const endpoint = clinicBooking
        ? `${API_BASE_URL}/qr/walkin/${encodeURIComponent(clinicBooking.doctorClinicId)}`
        : WALKIN_URL;
      const bookingPayload = clinicBooking ? {
        patientName: payload.patient_name, phoneNumber: payload.phone_number,
        symptoms: payload.symptoms, dateOfBirth: payload.date_of_birth,
        age: payload.age, location: payload.location, gender: payload.gender,
        appointmentTime: payload.appointment_time, appointmentDate: slotState.date, email: payload.email,
        requestId: requestId.current,
      } : payload;
      const response = await axios.post(endpoint, bookingPayload, {
        headers: { "Content-Type": "application/json" },
        withCredentials: false,
      });
      const created = response.data?.data || response.data?.appointment || response.data || {};
      const token = created.token_number || created.tokenNumber || created.walkin_token || created.queue_token || created.token || created.id || "Booked";
      setAppointmentToken(String(token));
      setSlotState(current => ({ ...current, slots: current.slots.map(slot => slot.time === payload.appointment_time
        ? { ...slot, booked: true, available: false, status: 'booked' } : slot) }));
    } catch (error) {
      setApiError(error.response?.data?.message || error.response?.data?.error || error.message || "Unable to book walk-in appointment");
      if ([409, 422].includes(error.response?.status)) setSlotRefresh(value => value + 1);
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    if (submitting.current) return;
    requestId.current = null;
    setFormData(emptyForm);
    setErrors({});
    setAppointmentToken("");
    setApiError("");
    setSlotRefresh(value => value + 1);
  };

  return (
    <main className="qr-appointment-page"><PatientLanguageControl />
      <header className="qr-appointment-header">
        <button type="button" onClick={() => navigate(-1)}><PortalText text={"← Back to Scanner"} /></button>
        <h1><PortalText text={"Book Appointment"} /></h1>
        {doctor && <p><strong>{doctor.full_name}</strong> · {Array.isArray(doctor.specialization) ? doctor.specialization.join(", ") : doctor.specialization}</p>}
        {clinicBooking && <><p><strong>{clinicBooking.doctor.name}</strong> · {clinicBooking.clinic.name}</p>
          <p><PortalText text="Your appointment is for today at this clinic." /></p></>}
        <p><PortalText text={"Fill in your details to confirm appointment"} /></p>
      </header>
      <div className="qr-appointment-layout">
        <form className="qr-appointment-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="qr-form-row">
            <Field label="Patient Name *" name="patientName" value={formData.patientName} onChange={updateField} error={errors.patientName} maxLength={150} />
            <Field label="Contact Number *" name="contactNumber" value={formData.contactNumber} onChange={updateField} error={errors.contactNumber} type="tel" maxLength={10} />
          </div>
          <Field label="Medical Problem *" name="problem" value={formData.problem} onChange={updateField} error={errors.problem} multiline maxLength={2000} />
          <div className="qr-form-row">
            <Field label="Date of Birth *" name="dateOfBirth" value={formData.dateOfBirth} onChange={updateField} error={errors.dateOfBirth} type="date" />
            <PortalElement as={Field} label="Age" name="age" value={formData.age} readOnly placeholder="Auto-calculated" />
          </div>
          <Field label="Location / Address *" name="location" value={formData.location} onChange={updateField} error={errors.location} multiline maxLength={1000} />
          <div className="qr-form-row">
            <SelectField label="Gender *" name="gender" value={formData.gender} onChange={updateField} error={errors.gender} options={["male", "female", "other", "prefer-not-to-say"]} />
          </div>
          <fieldset className="qr-slot-picker" disabled={isSubmitting || Boolean(appointmentToken)}>
            <legend><PortalText text="Available Slots" /> *</legend>
            {slotState.date && <p>{slotState.date}</p>}
            {slotState.loading && <p role="status"><PortalText text="Loading availability..." /></p>}
            {slotState.error && <p role="alert">{translateUi(slotState.error)}</p>}
            {!slotState.loading && !slotState.error && !slotState.slots.length && <p><PortalText text="No available slots for this date." /></p>}
            <div className="qr-slot-grid" role="group" aria-label={translateUi('Available Slots')}>
              {slotState.slots.map(slot => <button key={slot.time} type="button"
                className={`qr-slot ${slot.status}${formData.appointmentTime === slot.time ? ' selected' : ''}`}
                disabled={!slot.available || Boolean(slotState.error) || slotState.loading}
                aria-pressed={formData.appointmentTime === slot.time}
                onClick={() => updateField({ target: { name: 'appointmentTime', value: slot.time } })}>
                <span>{slot.time.slice(0, 5)}</span>
                <small><PortalText text={slot.booked ? 'Booked' : slot.available ? 'Available' : 'Unavailable'} /></small>
              </button>)}
            </div>
            {errors.appointmentTime && <p role="alert" className="qr-form-error">{translateUi(errors.appointmentTime)}</p>}
            <button type="button" className="qr-slots-refresh" onClick={() => setSlotRefresh(value => value + 1)}><PortalText text="Refresh" /></button>
          </fieldset>
          <Field label="Email (Optional)" name="email" value={formData.email} onChange={updateField} type="email" maxLength={254} />
          {appointmentToken && <div className="qr-token-success"><h3><PortalText text={"Appointment Confirmed!"} /></h3><strong>{appointmentToken}</strong></div>}
          {apiError && <div className="qr-form-error">{translateUi(apiError)}</div>}
          <div className="qr-form-actions"><button type="button" onClick={resetForm} disabled={isSubmitting}><PortalText text={"Reset Form"} /></button><button type="submit" disabled={isSubmitting || Boolean(appointmentToken) || slotState.loading || Boolean(slotState.error) || !formData.appointmentTime}>{isSubmitting ? <PortalText text={"Processing..."} /> : <PortalText text={"Confirm Appointment"} />}</button></div>
        </form>
        <aside className="qr-appointment-aside"><h3><PortalText text={"ⓘ What to expect"} /></h3><ul><li><PortalText text={"Fill your details to book your appointment"} /></li><li><PortalText text={"Get an instant appointment token"} /></li><li><PortalText text={"Estimated wait: 15-30 minutes"} /></li><li><PortalText text={"Carry a valid ID and past reports"} /></li></ul></aside>
      </div>
    </main>
  );
}

function Field({ label, name, value, onChange, error, multiline, ...props }) {
  const translateUi = usePortalTranslator();
  return <label className="qr-form-field"><PortalText text={label} />{multiline ? <textarea name={name} value={value} onChange={onChange} {...props} /> : <input name={name} value={value} onChange={onChange} {...props} />}{error && <small>{translateUi(error)}</small>}</label>;
}

function SelectField({ label, name, value, onChange, error, options }) {
  const translateUi = usePortalTranslator();
  return <label className="qr-form-field"><PortalText text={label} /><select name={name} value={value} onChange={onChange}><PortalElement as="option" value=""><PortalText text={"Select Gender"} /></PortalElement>{options.map((option) => <option key={option} value={option}><PortalText text={option.replace(/-/g, " ")} /></option>)}</select>{error && <small>{translateUi(error)}</small>}</label>;
}
