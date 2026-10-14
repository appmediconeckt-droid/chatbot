export const recordId = value => value && typeof value === 'object' ? value._id || value.id || '' : value || '';
export function countFollowUpPatients(followUps) {
  const phoneKey = value => {
    const digits = String(value || '').replace(/\D/g, '');
    return digits.length >= 7 ? (digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits) : '';
  };
  const owners = new Map();
  for (const row of followUps) {
    const id = recordId(row.patientId);
    const phone = phoneKey(row.phone);
    if (id && phone) owners.set(phone, String(id));
  }
  return new Set(followUps.map(row => {
    const id = recordId(row.patientId);
    const phone = phoneKey(row.phone);
    if (id) return `patient:${id}`;
    if (phone) return owners.has(phone) ? `patient:${owners.get(phone)}` : `phone:${phone}`;
    return `visit:${recordId(row.walkinId) || row.id}`;
  })).size;
}
export const followUpPatient = record => [record.patient, record.patient_details, record.patient_id]
  .find(value => value && typeof value === 'object') || {};
export function buildFollowUpPatients(appointments) {
  const patients = new Map();
  for (const appointment of appointments) {
    const patient = followUpPatient(appointment);
    const patientId = recordId(appointment.patient_id || appointment.patientId || appointment.patient || patient);
    const walkinId = appointment.__appointmentSource === 'walkin' ? recordId(appointment._id || appointment.id) : '';
    const id = patientId || (walkinId ? `walkin:${walkinId}` : '');
    if (!id) continue;
    const visit = appointment.appointment_date || appointment.date || appointment.createdAt || appointment.created_at || '';
    const entry = { id, patientId, walkinId,
      appointmentId: walkinId ? '' : recordId(appointment.id || appointment._id),
      name: appointment.patient_name || patient.fullName || patient.name || patient.full_name || 'Unnamed Patient',
      age: appointment.age ?? patient.age ?? 'N/A',
      phone: appointment.phone_number || appointment.phone || patient.phoneNumber || patient.phone_number || patient.phone || 'N/A',
      lastVisit: visit, issue: appointment.symptoms || appointment.diagnosis || appointment.reason || 'General consultation' };
    const existing = patients.get(String(id));
    if (!existing || Date.parse(visit) > Date.parse(existing.lastVisit)) patients.set(String(id), entry);
  }
  return [...patients.values()].sort((a, b) => a.name.localeCompare(b.name));
}
