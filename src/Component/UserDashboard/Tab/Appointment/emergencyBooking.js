export const isUnscheduledEmergency = (appointment) =>
  String(appointment?.priority || '').toLowerCase() === 'emergency' && !appointment?.appointment_time;

export const canSendEmergency = ({ doctorId, clinicId, reason, booking = false }) =>
  Boolean(doctorId && clinicId && !booking && typeof reason === 'string' && reason.trim().length >= 1 && reason.trim().length <= 1000);

export const emergencyBookingPayload = ({ doctorId, clinicId, reason, location }) => ({
  counselorId: doctorId,
  doctor_id: doctorId,
  clinic_id: clinicId,
  priority: 'emergency',
  emergency_reason: reason ? String(reason).trim() : '',
  patient_location: location?.trim() || null,
  appointment_location: location?.trim() || null,
  consultation_mode: 'in-clinic',
  booking_source: 'online',
  status: 'pending',
});
