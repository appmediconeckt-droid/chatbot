// Prefer an issued number, then a visit reference using the recorded date and token.
export function prescriptionNumber(record = {}) {
  const saved = record.prescriptionNumber || record.prescription_number;
  if (saved != null && String(saved).trim()) return String(saved).trim();
  const date = String(record.appointment_date || record.appointmentDate || record.date || record.issuedAt || '').slice(0, 10);
  const token = String(record.opdNumber ?? record.token_number ?? record.token ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(date) && /^\d+$/.test(token)) {
    return `RX-${date.replace(/-/g, '')}-${token.padStart(3, '0')}`;
  }
  const value = String(record.id || record._id || record.appointmentId || '').trim();
  if (!value) return '';
  const rawId = value.replace(/^(?:appointment:)?(?:walkin:)?/, '');
  if (!/^[a-f\d]{24}$/i.test(rawId)) return value;
  const walkin = value.includes('walkin:') || record.visitSource === 'walkin' || record.appointment_type === 'walkin';
  const appointment = value.startsWith('appointment:') || record.appointmentId || record.appointment_date || record.appointmentDate || record.counselor;
  const type = walkin ? 'W' : appointment ? 'A' : 'P';
  return `RX-${type}-${rawId.toUpperCase().match(/.{8}/g).join('-')}`;
}
