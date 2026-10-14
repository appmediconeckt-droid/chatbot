export const getProfessionalId = (professional = {}) =>
  professional._id || professional.id || professional.userId || professional.user_id ||
  professional.doctorId || professional.doctor_id || professional.consultantId ||
  professional.consultant_id || professional.counselorId || professional.counsellorId;

// The live directory is passed first. Fallback responses fill missing fields
// without replacing its authoritative presence or completed profile details.
export const mergeUniqueProfessionals = (...lists) => {
  const unique = new Map();
  lists.flat().forEach(item => {
    const id = getProfessionalId(item);
    if (!id) return;
    const key = String(id);
    unique.set(key, { ...item, ...unique.get(key) });
  });
  return Array.from(unique.values());
};
