const first = (...values) => values.find(value => value !== null && value !== undefined && value !== "");
const object = value => value && typeof value === "object" ? value : {};

export const ageFromBirthDate = (value, today = new Date()) => {
  if (!value) return undefined;
  const birth = new Date(value);
  if (!Number.isFinite(birth.getTime()) || birth > today) return undefined;
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  if (today.getUTCMonth() < birth.getUTCMonth()
    || (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() < birth.getUTCDate())) age--;
  return age;
};

export const patientCardDetails = (appointment, today = new Date()) => {
  const patient = object(appointment.patient || appointment.patient_data || appointment.user);
  return {
    id: first(patient.id, patient._id, patient.user_id, appointment.patient_id, appointment.patientId,
      typeof appointment.patient === "string" ? appointment.patient : null, appointment.id, appointment._id),
    name: first(patient.fullName, patient.full_name, patient.fullname, patient.name, appointment.patient_name, "Unknown Patient"),
    age: first(ageFromBirthDate(patient.dateOfBirth || patient.date_of_birth || patient.dob, today), patient.age, appointment.patient_age, appointment.age, "N/A"),
    gender: first(patient.gender, patient.patient_gender, appointment.patient_gender, appointment.gender, "N/A"),
    phone: first(patient.phoneNumber, patient.phone, patient.phone_number, patient.patient_phone, appointment.patient_phone, appointment.phone, "N/A"),
    bloodGroup: first(patient.bloodGroup, patient.blood_group, patient.patient_blood_group, appointment.patient_blood_group, appointment.bloodGroup, "N/A"),
  };
};

export const appointmentDoctorName = (appointment, currentDoctor = {}) => {
  const doctor = object(appointment.counselor || appointment.doctor);
  return first(doctor.fullName, doctor.full_name, doctor.name, appointment.doctor_name,
    currentDoctor?.fullName, currentDoctor?.full_name, currentDoctor?.name, "Doctor");
};

export const appointmentVitals = appointment => {
  let vitals = appointment.vitals;
  if (typeof vitals === "string") {
    try { vitals = JSON.parse(vitals); } catch { vitals = {}; }
  }
  vitals = object(vitals);
  return {
    bp: first(appointment.bp, appointment.blood_pressure, vitals.bp, vitals.bloodPressure, vitals.blood_pressure, "N/A"),
    pulse: first(appointment.pulse, appointment.heart_rate, appointment.heartRate, vitals.pulse, vitals.heartRate, vitals.heart_rate, "N/A"),
    temperature: first(appointment.temperature, vitals.temperature, "N/A"),
  };
};
