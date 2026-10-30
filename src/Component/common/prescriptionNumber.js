// Encode the complete stored ID; trimming its last digits could duplicate numbers.
export function prescriptionNumber(record = {}) {
  const saved = record.prescriptionNumber || record.prescription_number;
  if (saved != null && String(saved).trim()) return String(saved).trim();
  const value = String(record.id || record._id || record.appointmentId || '').trim();
  if (!value) return '';
  const rawId = value.replace(/^(?:appointment:)?(?:walkin:)?/, '');
  if (!/^[a-f\d]{24}$/i.test(rawId)) return value;
  const walkin = value.includes('walkin:') || record.visitSource === 'walkin' || record.appointment_type === 'walkin' || record.appointment_status;
  const appointment = value.startsWith('appointment:') || record.appointmentId || record.appointment_date || record.appointmentDate || record.counselor;
  const type = walkin ? 'W' : appointment ? 'A' : 'P';
  return `RX-${type}-${BigInt(`0x${rawId}`).toString(36).toUpperCase()}`;
}
