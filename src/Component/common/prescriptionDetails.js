export const prescriptionDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const prescriptionDetails = (record, doctorName) => ({
  patient: record.patient?.name || record.patient?.fullName || record.name || "Patient",
  doctor: doctorName || record.psychiatrist?.name || record.doctor?.name || "Doctor",
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
  followUpRequired: record.followUpRequired || record.follow_up_required,
});

export const medicineTiming = (medicine) => [
  (medicine.timeOfDay || medicine.timings || []).join(", "), medicine.timing || medicine.when,
].filter(Boolean).join(" · ");
export const medicineDuration = (medicine) => medicine.duration || [medicine.durationValue, medicine.durationType].filter(Boolean).join(" ");

