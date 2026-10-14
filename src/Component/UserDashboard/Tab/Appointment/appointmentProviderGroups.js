export const appointmentProviderKey = appointment => {
  const provider = appointment?.counselor || appointment?.doctor || appointment?.consultant;
  const id = typeof provider === 'string' ? provider : provider?._id || provider?.id;
  const providerId = id || appointment?.counselorId || appointment?.doctor_id || appointment?.consultantId;
  // Missing/deleted providers must not combine unrelated appointments by name.
  return providerId ? `provider:${providerId}` : `appointment:${appointment?._id || appointment?.id}`;
};

const appointmentTime = appointment => {
  const day = String(appointment.appointment_date || '');
  const time = String(appointment.appointment_time || '');
  const scheduled = day && time ? Date.parse(`${day.slice(0, 10)}T${time}+05:30`) : NaN;
  return Number.isFinite(scheduled) ? scheduled : Date.parse(appointment.date) || Date.parse(appointment.createdAt) || 0;
};

export const groupAppointmentsByProvider = appointments => {
  const groups = new Map();
  for (const appointment of appointments) {
    const key = appointmentProviderKey(appointment);
    if (!groups.has(key)) groups.set(key, { key, appointments: [] });
    groups.get(key).appointments.push(appointment);
  }
  return [...groups.values()].map(group => {
    const records = [...group.appointments].sort((a, b) => appointmentTime(b) - appointmentTime(a));
    return { ...group, appointments: records, latest: records[0] };
  }).sort((a, b) => appointmentTime(b.latest) - appointmentTime(a.latest));
};
