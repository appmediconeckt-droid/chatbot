export const formatSlotMinutes = (minutes) => {
  const hour24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hour24 % 12 || 12).padStart(2, "0")}:${String(mins).padStart(2, "0")} ${hour24 >= 12 ? "PM" : "AM"}`;
};

export const timeToMinutes = (value) => {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || minute > 59) return null;
  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    if (meridiem === "PM" && hour !== 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;
  } else if (hour > 23) {
    return null;
  }
  return hour * 60 + minute;
};

const dateTimePartsInZone = (value, timeZone = "Asia/Kolkata") => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
};

export const appointmentRecordToSlot = (record, { timeZone = "Asia/Kolkata" } = {}) => {
  if (!record) return null;

  const directDate = String(record.appointment_date || record.dateOnly || record.appointmentDate || "").slice(0, 10);
  const directMinutes = timeToMinutes(record.time || record.appointment_time || record.appointmentTime || record.slot_start_time);
  if (/^\d{4}-\d{2}-\d{2}$/.test(directDate) && directMinutes != null) {
    return { date: directDate, minutes: directMinutes };
  }

  const dateTimeSlot = dateTimePartsInZone(record.date || record.start || record.start_time, timeZone);
  if (dateTimeSlot) return dateTimeSlot;

  return null;
};

export const isActiveAppointmentRecord = (record) => {
  const status = String(record?.appointment_status || record?.status || record?.queue_status || "").toLowerCase();
  return !["canceled", "cancelled", "rejected", "reject", "completed", "complete"].includes(status);
};

export const withScheduleTokens = (slots) =>
  [...slots]
    .sort((a, b) => a.minutes - b.minutes)
    .map((slot, index) => ({
      ...slot,
      tokenNumber: slot.tokenNumber ?? index + 1,
      slotIndex: slot.slotIndex ?? index,
    }));

export const buildSlotsFromAvailabilityRanges = ({
  ranges,
  isToday = false,
  nowMinutes = 0,
  formatMinutes = formatSlotMinutes,
}) => {
  const slots = new Map();

  [...ranges]
    .sort((left, right) => {
      const leftStart = timeToMinutes(left.start_time || left.start || left.startTime) ?? 0;
      const rightStart = timeToMinutes(right.start_time || right.start || right.startTime) ?? 0;
      return leftStart - rightStart;
    })
    .forEach((range, rangeIndex) => {
      const start = timeToMinutes(range.start_time || range.start || range.startTime);
      const end = timeToMinutes(range.end_time || range.end || range.endTime);
      const duration = Math.max(1, Number(range.slot_duration || range.duration || 15));
      if (start == null || end == null || end <= start) return;

      let rangeToken = 1;
      const rangeLabel = `${formatMinutes(start)} - ${formatMinutes(end)}`;
      for (let cursor = start; cursor + duration <= end; cursor += duration, rangeToken += 1) {
        const isSlotPast = isToday && cursor <= nowMinutes;
        if (slots.has(cursor)) continue;
        slots.set(cursor, {
          time: formatMinutes(cursor),
          minutes: cursor,
          duration,
          tokenNumber: rangeToken,
          slotIndex: rangeToken - 1,
          rangeIndex,
          rangeLabel,
          rangeStart: start,
          rangeEnd: end,
          disabled: isSlotPast,
          isPast: isSlotPast,
        });
      }
    });

  return withScheduleTokens(slots.values());
};

export const getScheduleTokenForTime = (slots, selectedTime) =>
  slots.find((slot) => slot.time === selectedTime)?.tokenNumber || null;
