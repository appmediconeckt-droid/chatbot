import { consultationData } from './consultationData.js';
import { prescriptionNumber } from './prescriptionNumber.js';

export const prescriptionDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const prescriptionDoctorName = (record = {}, doctorName) => {
  const candidates = [doctorName, record.psychiatrist?.name, record.psychiatrist?.fullName,
    record.doctorProfile?.fullName, record.doctorProfile?.name, record.doctor?.name, record.doctor?.fullName, record.doctorName, record.doctor_name,
    record.psychiatristSnapshot?.name, record.counselor?.fullName];
  return candidates.find(value => typeof value === 'string' && value.trim() && !/^doctor$/i.test(value.trim()))?.trim() || 'Doctor name not recorded';
};

export const prescriptionDetails = (input, doctorName) => {
  const record = consultationData(input);
  const provider = record.doctorProfile || record.psychiatrist || record.doctor || record.psychiatristSnapshot || {};
  const patient = record.patient || record.patientSnapshot || {};
  const clinic = record.clinic || (typeof record.clinic_id === 'object' ? record.clinic_id : null) || {};
  const text = value => Array.isArray(value) ? value.filter(Boolean).join(', ') : typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  return ({
  qualification: text(provider.qualification),
  specialization: text(provider.specialization),
  registration: text(provider.registrationNumber || provider.registration_number || provider.medicalRegistrationNumber || provider.licenseNumber),
  clinic: text(clinic.clinic_name || clinic.name || record.clinic_name),
  address: text(clinic.location || clinic.address),
  doctorPhone: text(clinic.phone_number || clinic.phoneNumber || clinic.phone || provider.phoneNumber || provider.phone),
  doctorEmail: text(provider.email),
  prescriptionId: prescriptionNumber(record),
  opd: text(record.opdNumber || record.token_number || record.token),
  patientId: text(patient.id || patient._id || record.patientId),
  age: text(patient.age ?? record.age),
  phone: text(patient.phoneNumber || patient.phone || patient.mobile || record.phoneNumber || record.phone),
  weight: text(record.vitals?.weight ?? patient.weight ?? patient.medicalInfo?.weight ?? record.weight),
  allergies: text(patient.allergies || patient.medicalInfo?.allergies || record.allergies),
  patient: record.patient?.name || record.patient?.fullName || record.patientSnapshot?.name || record.name || "Patient",
  doctor: prescriptionDoctorName(record, doctorName),
  date: prescriptionDate(record.issuedAt || record.appointmentDate || record.date || record.endTime),
  gender: record.patient?.gender || record.gender || "—",
  issue: record.issue || record.problem || "—",
  diagnosis: record.diagnosis || record.problem || "—",
  medicines: Array.isArray(record.medicines) ? record.medicines : [],
  medicine: record.medicine || "",
  advice: record.advice || record.instructions || "",
  notes: record.additionalNotes || record.additional_notes || "",
  tests: record.recommendedTests || record.recommended_tests || [],
  followUp: record.followUpDate || record.follow_up_date,
  followUpRequired: [true, 1, '1', 'true'].includes(record.followUpRequired ?? record.follow_up_required),
  });
};

export const medicineTiming = (medicine) => [
  (medicine.timeOfDay || medicine.timings || []).join(", "), medicine.timing || medicine.when,
].filter(Boolean).join(" · ");
export const medicineDuration = (medicine) => medicine.duration || [medicine.durationValue, medicine.durationType].filter(Boolean).join(" ");

