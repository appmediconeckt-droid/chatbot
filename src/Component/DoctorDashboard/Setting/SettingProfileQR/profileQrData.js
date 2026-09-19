export const profileFields = {
  name: ["Name", "full_name", "fullName", "name"],
  email: ["Email", "email", "email_address"],
  phone: ["Phone", "contact_number", "phoneNumber", "phone_number", "phone", "mobile", "contactNumber"],
  speciality: ["Speciality", "speciality", "specialization", "primary_specialties"],
  qualification: ["Qualification", "qualification", "medical_degree"],
  experience: ["Experience", "experience", "years_of_experience"],
  languages: ["Languages", "languages", "known_languages"],
  position: ["Position", "position"],
  certification: ["Board certification", "board_certification"],
  about: ["About", "about_doctor", "about", "bio"],
  expertise: ["Expertise", "expertise"],
  awards: ["Awards", "awards"],
  research: ["Research", "research_focus"],
  degree: ["Medical degree", "medical_degree"],
  residency: ["Residency", "residency"],
  fellowship: ["Fellowship", "fellowship"],
  training: ["Special training", "special_training"],
  clinic: ["Clinic / Hospital", "clinic_name", "primary_hospital", "hospital_name"],
  address: ["Clinic address", "clinic_address", "hospital_address"],
  hospitals: ["Hospital affiliations", "all_hospitals"],
  conditions: ["Conditions treated", "all_conditions"],
  location: ["Practice location", "doctor_location"],
  hours: ["Consultation hours", "consultation_hours"],
  online: ["Online consultation", "online_consultation"],
  newPatients: ["Accepts new patients", "accepts_new_patients"],
  initialFee: ["Initial consultation fee", "initial_consultation_fee"],
  followUpFee: ["Follow-up fee", "follow_up_visit_fee"],
  onlineFee: ["Online consultation fee", "online_consultation_fee"],
  insurance: ["Accepted insurance", "accepted_insurances"],
  insuranceNote: ["Insurance information", "insurance_note"],
};

const displayValue = (value) => {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.filter((part) => ["string", "number"].includes(typeof part)).join(", ");
  return ["string", "number"].includes(typeof value) ? String(value).trim() : "";
};

// Only patient-facing fields belong in the shareable QR, never the raw account.
export const publicDoctorProfile = (data = {}, fallback = {}) => {
  const source = data.user || data.profile || data.doctor || data;
  return Object.fromEntries(Object.entries(profileFields).map(([key, [, ...aliases]]) => {
    const values = [...aliases.map((alias) => source[alias]), ...aliases.map((alias) => fallback[alias])];
    return [key, values.map(displayValue).find(Boolean) || ""];
  }).filter(([, value]) => value));
};

export const createProfileLink = (profile, origin) => {
  const safe = Object.fromEntries(Object.keys(profileFields).filter((key) => typeof profile[key] === "string" && profile[key]).map((key) => [key, profile[key]]));
  const bytes = new TextEncoder().encode(JSON.stringify(safe));
  const encoded = btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""));
  const url = new URL("/doctor-profile-qr", origin);
  url.hash = encoded;
  // Keep the link within QR byte capacity at medium error correction.
  if (new TextEncoder().encode(url.href).length > 2200) throw new Error("Your profile is too long for this QR. Shorten the About or other long profile descriptions and try again.");
  return url.href;
};

export const readProfileLink = (hash) => {
  if (!hash || hash.length > 3000) throw new Error("Invalid doctor profile QR");
  const data = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(atob(hash.replace(/^#/, "")), (char) => char.charCodeAt(0))));
  if (!data || typeof data !== "object" || !Object.keys(profileFields).some((key) => typeof data[key] === "string" && data[key])) throw new Error("Invalid doctor profile QR");
  return Object.fromEntries(Object.keys(profileFields).filter((key) => typeof data[key] === "string" && data[key]).map((key) => [key, data[key]]));
};
