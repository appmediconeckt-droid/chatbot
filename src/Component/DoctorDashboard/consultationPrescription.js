const pickFirst = (...values) => values.find(value => value !== undefined && value !== null && value !== '');

export const createConsultationForm = () => ({ diagnosis: '', medicine: '', medicines: [createEmptyMedicine()], advice: '', additionalNotes: '', recommendedTests: [], followUpRequired: false, followUpDate: '' });

export function remoteConsultationPayload(form) {
  if (!form?.diagnosis?.trim() || !form?.advice?.trim() || !form.medicines?.length || !form.medicines.every(hasValidMedicine)) throw new Error('Enter diagnosis, advice and complete medicine dosage, timing and duration.');
  const medicines = form.medicines.map(medicine => ({ ...medicine, name: medicine.name.trim(), dosage: medicine.dosage.trim(), timings: [...medicine.timings], durationValue: String(medicine.durationValue).trim() }));
  const tests = (form.recommendedTests || []).filter(test => test.testName?.trim()).map(test => ({ ...test, testName: test.testName.trim(), completeBy: test.completeBy || null }));
  const primary = tests[0] || {};
  return { appointment_status: 'completed', diagnosis: form.diagnosis.trim(), advice: form.advice.trim(), medicine: medicines.map(formatMedicineLine).join('\n'), medicines,
    additional_notes: form.additionalNotes || '', follow_up_required: Boolean(form.followUpRequired), follow_up_date: form.followUpRequired ? form.followUpDate || '' : '',
    testName: primary.testName || null, completeBy: primary.completeBy || null, reason: primary.reason || '', instructions: primary.instructions || '', recommended_tests: tests, recommendedTests: tests };
}

export const MEDICINE_TIMINGS = ["Morning", "Afternoon", "Evening", "Night"];

export const createEmptyMedicine = () => ({
  name: "",
  dosage: "",
  timings: [],
  durationValue: "",
  durationType: "Days",
  instructions: '',
});

export const createEmptyRecommendedTest = () => ({
  testName: "",
  reason: "",
  instructions: "",
  completeBy: "",
});

export const formatMedicineLine = (medicine) => {
  const name = medicine.name?.trim() || "Medicine";
  const dosage = medicine.dosage?.trim() || "Dosage";
  const timing = medicine.timings?.length ? medicine.timings.join(", ") : "Select timing";
  const durationValue = String(medicine.durationValue || '').trim() || "?";
  const durationType = (medicine.durationType || "Days").toLowerCase();
  return `${name} - ${dosage} (${timing}) - ${durationValue} ${durationType}${medicine.instructions?.trim() ? ` - ${medicine.instructions.trim()}` : ''}`;
};

export const hasValidMedicine = (medicine) =>
  Boolean(
    medicine?.name?.trim() &&
    medicine?.dosage?.trim() &&
    medicine?.timings?.length &&
    Number.isInteger(Number(medicine?.durationValue)) && Number(medicine.durationValue) > 0 &&
    ['Days', 'Weeks', 'Months'].includes(medicine?.durationType)
  );

export const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseAppointmentBaseDate = (appointment) => {
  const rawDate = pickFirst(
    appointment?.rawDate,
    appointment?.appointment_date,
    appointment?.appointmentDate,
    appointment?.date,
    appointment?.created_at,
    appointment?.createdAt
  );
  const parsedDate = rawDate ? new Date(rawDate) : new Date();
  return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
};

export const getMedicineDurationDays = (medicine) => {
  const value = Number(medicine?.durationValue || 0);
  if (!value) return 0;

  const type = String(medicine?.durationType || "Days").toLowerCase();
  if (type.startsWith("week")) return value * 7;
  if (type.startsWith("month")) return value * 30;
  return value;
};

export const getFollowUpDateFromMedicines = (medicines, appointment) => {
  const maxDurationDays = Math.max(0, ...(medicines || []).map(getMedicineDurationDays));
  const baseDate = parseAppointmentBaseDate(appointment);
  baseDate.setHours(0, 0, 0, 0);
  baseDate.setDate(baseDate.getDate() + maxDurationDays);
  return toDateInputValue(baseDate);
};

