export const getPrescriptionProviderLabel = (provider = {}, record = {}) => {
  const role = String(provider.role || "").trim().toLowerCase();
  const accountType = String(provider.accountType || provider.account_type || "").trim().toLowerCase();
  if (role === "doctor" || accountType === "doctor") return "Doctor";
  if (accountType === "consultant" || ["consultant", "counsellor", "counselor", "counsellour"].includes(role)) return "Consultant";
  // Legacy responses have no role: appointment records come from the doctor
  // dashboard, while uploaded prescriptions come from consultant chat.
  return record.source === "appointment" ? "Doctor" : "Consultant";
};
