import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../doctorApi.js";
import "./AppointmentForm.css";

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

export default function AppointmentForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const doctorId = params.get("doctorId") || "";
  const isQrBooking = params.get("source")?.toLowerCase() === "qr";
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appointmentToken, setAppointmentToken] = useState("");
  const [apiError, setApiError] = useState("");

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
    if (!formData.location.trim()) next.location = "Location or address is required";
    if (!formData.gender) next.gender = "Gender is required";
    setErrors(next);
    return !Object.keys(next).length;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
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
      email: formData.email.trim() || undefined,
      status: "booked",
      booking_source: isQrBooking ? "qr" : "direct",
    };
    try {
      setIsSubmitting(true);
      setApiError("");
      const response = await axios.post(WALKIN_URL, payload, {
        headers: { "Content-Type": "application/json" },
        withCredentials: false,
      });
      const created = response.data?.data || response.data?.appointment || response.data || {};
      const token = created.token_number || created.tokenNumber || created.walkin_token || created.queue_token || created.token || created.id || "Booked";
      setAppointmentToken(String(token));
    } catch (error) {
      setApiError(error.response?.data?.message || error.response?.data?.error || error.message || "Unable to book walk-in appointment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setErrors({});
    setAppointmentToken("");
    setApiError("");
  };

  return (
    <main className="qr-appointment-page">
      <header className="qr-appointment-header">
        <button type="button" onClick={() => navigate(-1)}>← Back to Scanner</button>
        <h1>Book Appointment</h1>
        <p>Fill in your details to confirm appointment</p>
      </header>
      <div className="qr-appointment-layout">
        <form className="qr-appointment-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="qr-form-row">
            <Field label="Patient Name *" name="patientName" value={formData.patientName} onChange={updateField} error={errors.patientName} />
            <Field label="Contact Number *" name="contactNumber" value={formData.contactNumber} onChange={updateField} error={errors.contactNumber} type="tel" maxLength={10} />
          </div>
          <Field label="Medical Problem *" name="problem" value={formData.problem} onChange={updateField} error={errors.problem} multiline />
          <div className="qr-form-row">
            <Field label="Date of Birth *" name="dateOfBirth" value={formData.dateOfBirth} onChange={updateField} error={errors.dateOfBirth} type="date" />
            <Field label="Age" name="age" value={formData.age} readOnly placeholder="Auto-calculated" />
          </div>
          <Field label="Location / Address *" name="location" value={formData.location} onChange={updateField} error={errors.location} multiline />
          <div className="qr-form-row">
            <SelectField label="Gender *" name="gender" value={formData.gender} onChange={updateField} error={errors.gender} options={["male", "female", "other", "prefer-not-to-say"]} />
            <Field label="Preferred Time" name="appointmentTime" value={formData.appointmentTime} onChange={updateField} type="time" />
          </div>
          <Field label="Email (Optional)" name="email" value={formData.email} onChange={updateField} type="email" />
          {appointmentToken && <div className="qr-token-success"><h3>Appointment Confirmed!</h3><strong>{appointmentToken}</strong></div>}
          {apiError && <div className="qr-form-error">{apiError}</div>}
          <div className="qr-form-actions"><button type="button" onClick={resetForm}>Reset Form</button><button type="submit" disabled={isSubmitting}>{isSubmitting ? "Processing..." : "Confirm Appointment"}</button></div>
        </form>
        <aside className="qr-appointment-aside"><h3>ⓘ What to expect</h3><ul><li>Fill your details to book your appointment</li><li>Get an instant appointment token</li><li>Estimated wait: 15-30 minutes</li><li>Carry a valid ID and past reports</li></ul></aside>
      </div>
    </main>
  );
}

function Field({ label, name, value, onChange, error, multiline, ...props }) {
  return <label className="qr-form-field">{label}{multiline ? <textarea name={name} value={value} onChange={onChange} {...props} /> : <input name={name} value={value} onChange={onChange} {...props} />}{error && <small>{error}</small>}</label>;
}

function SelectField({ label, name, value, onChange, error, options }) {
  return <label className="qr-form-field">{label}<select name={name} value={value} onChange={onChange}><option value="">Select Gender</option>{options.map((option) => <option key={option} value={option}>{option.replace(/-/g, " ")}</option>)}</select>{error && <small>{error}</small>}</label>;
}
