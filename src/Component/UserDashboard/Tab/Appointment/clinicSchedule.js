const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const formatTime = (value) => {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})/);
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return "";
  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour >= 12 ? "PM" : "AM"}`;
};

export const getClinicSchedule = (ranges, clinicId, unavailableDates = [], today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }), selectedDate = null) => {
  const blocked = new Set(unavailableDates.filter(item => !item?.clinic_id || String(item.clinic_id) === String(clinicId)).map(item => String(item?.date || item?.unavailable_date || item).slice(0, 10)));
  const entries = ranges.flatMap(range => {
    if (range.clinic_id && String(range.clinic_id) !== String(clinicId)) return [];
    if (range.is_unavailable === true || Number(range.is_unavailable) === 1) return [];
    const date = String(range.availability_date || range.date || "").slice(0, 10);
    if (date && (date < today || blocked.has(date))) return [];
    const weekday = date ? new Date(`${date}T00:00:00Z`).getUTCDay()
      : range.weekday != null && range.weekday !== "" ? Number(range.weekday) : null;
    const label = weekdays[weekday];
    const start = formatTime(range.start_time), end = formatTime(range.end_time);
    if (!label || !start || !end) return [];
    return [{ weekday, date, time: `${start} – ${end}` }];
  });
  // Collapse consecutive weekdays, retaining gaps (Mon, Wed rather than Mon–Wed).
  const dayNumbers = [...new Set(entries.map(item => (item.weekday + 6) % 7))].sort((a, b) => a - b);
  const groups = [];
  for (const day of dayNumbers) {
    const last = groups[groups.length - 1];
    if (last && day === last[1] + 1) last[1] = day;
    else groups.push([day, day]);
  }
  const dayLabel = day => weekdays[(day + 1) % 7];
  const selectedWeekday = selectedDate ? new Date(`${selectedDate}T00:00:00Z`).getUTCDay() : null;
  const timingEntries = selectedDate ? entries.filter(item => !blocked.has(selectedDate)
    && (item.date ? item.date === selectedDate : item.weekday === selectedWeekday)) : entries;
  return {
    days: groups.map(([start, end]) => start === end ? dayLabel(start) : `${dayLabel(start)} – ${dayLabel(end)}`).join(", ") || "No availability scheduled",
    timings: [...new Set(timingEntries.map(item => item.time))].join(", ") || "Not scheduled",
  };
};
