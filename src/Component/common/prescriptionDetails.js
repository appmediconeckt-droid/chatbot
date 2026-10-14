import { consultationData } from './consultationData.js';

export const prescriptionDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const prescriptionDoctorName = (record = {}, doctorName) => {
  const candidates = [doctorName, record.psychiatrist?.name, record.psychiatrist?.fullName,
    record.doctor?.name, record.doctor?.fullName, record.doctorName, record.doctor_name,
    record.psychiatristSnapshot?.name, record.counselor?.fullName];
  return candidates.find(value => typeof value === 'string' && value.trim() && !/^doctor$/i.test(value.trim()))?.trim() || 'Doctor name not recorded';
};

export const prescriptionDetails = (input, doctorName) => {
  const record = consultationData(input);
  return ({
  patient: record.patient?.name || record.patient?.fullName || record.name || "Patient",
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

