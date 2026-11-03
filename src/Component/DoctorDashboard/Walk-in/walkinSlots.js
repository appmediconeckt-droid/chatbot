import { buildSlotsFromAvailabilityRanges, timeToMinutes } from '../../UserDashboard/Tab/Appointment/appointmentSlotTokens.js';

// Compatibility with servers that still expose the existing availability API.
export function walkinSlotsFromRanges(data, clinicId, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(now).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  const ranges = data.existingRanges || data.ranges || data.data || [];
  const blocks = new Set(ranges.filter(range => Number(range.is_unavailable) === 1 && String(range.availability_date || range.date || '').slice(0, 10) === date).map(range => String(range.clinic_id || '')));
  const unavailable = (data.unavailableDates || []).some(item => {
    if (typeof item === 'string') return item.slice(0, 10) === date;
    return String(item.date || item.unavailable_date || '').slice(0, 10) === date && (!item.clinic_id || String(item.clinic_id) === String(clinicId));
  });
  if (unavailable || blocks.has('') || (clinicId && blocks.has(String(clinicId)))) return { date, slots: [] };
  const applicable = ranges.filter(range => {
    const id = String(range.clinic_id || '');
    const specific = String(range.availability_date || range.date || '').slice(0, 10);
    return Number(range.is_unavailable) !== 1 && !blocks.has(id) && (!clinicId || !id || id === String(clinicId))
      && (specific ? specific === date : range.weekday !== null && range.weekday !== undefined && Number(range.weekday) === weekday);
  });
  const booked = new Set((data.bookedSlots || []).filter(slot => String(slot.date).slice(0, 10) === date).map(slot => timeToMinutes(slot.time)));
  return { date, slots: buildSlotsFromAvailabilityRanges({ ranges: applicable, isToday: true, nowMinutes: Number(parts.hour) * 60 + Number(parts.minute),
    formatMinutes: minutes => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:00`,
  }).map(slot => ({ time: slot.time, duration: slot.duration, booked: booked.has(slot.minutes), available: !slot.disabled && !booked.has(slot.minutes),
    status: booked.has(slot.minutes) ? 'booked' : slot.disabled ? 'expired' : 'available' })) };
}

export async function loadWalkinSlots(api, baseUrl, doctorId, clinicBooking, signal) {
  const path = clinicBooking?.doctorClinicId ? `walkin/${encodeURIComponent(clinicBooking.doctorClinicId)}` : `doctors/${encodeURIComponent(doctorId)}`;
  try {
    const response = await api.get(`${baseUrl}/qr/${path}/slots`, { signal });
    return response.data?.data;
  } catch (error) {
    if (error.response?.status !== 404) throw error;
    const response = await api.get(`${baseUrl}/availability/ranges`, { signal, params: { doctor_id: doctorId } });
    return walkinSlotsFromRanges(response.data, clinicBooking?.clinicId);
  }
}
