export const normalizeApiList = (payload) => {
  const rows = [];
  const visited = new Set();
  const collectionKeys = new Set([
    "data",
    "appointments",
    "online",
    "online_appointments",
    "onlineAppointments",
    "walkin",
    "walk_in",
    "walk_in_appointments",
    "walkin_appointments",
    "walkInAppointments",
    "walkinAppointments",
    "walkins",
    "followups",
    "followUps",
    "follow_ups",
    "result",
    "results",
  ]);

  const getSourceHint = (key, currentHint) => {
    const normalizedKey = String(key || "").toLowerCase();
    if (normalizedKey.includes("walkin") || normalizedKey.includes("walk_in")) return "walkin";
    if (normalizedKey.includes("online")) return "online";
    return currentHint;
  };

  const collect = (value, sourceHint = "") => {
    if (!value || typeof value !== "object" || visited.has(value)) return;
    visited.add(value);

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item && typeof item === "object") {
          rows.push(sourceHint ? { ...item, __appointmentSource: sourceHint } : item);
        }
      });
      return;
    }

    Object.entries(value).forEach(([key, nestedValue]) => {
      if (collectionKeys.has(key)) {
        collect(nestedValue, getSourceHint(key, sourceHint));
      }
    });
  };

  collect(payload);
  return rows;
};

const pickFirst = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");

export const formatBookedAppointmentTime = (appointment) => {
  const value = pickFirst(
    appointment?.appointment_time,
    appointment?.appointmentTime,
    appointment?.slot_start_time,
    appointment?.slotStartTime,
    appointment?.slot_time,
    appointment?.slotTime,
    appointment?.original_appointment_time,
    appointment?.originalAppointmentTime,
    appointment?.scheduled_time,
    appointment?.scheduledTime,
    appointment?.time
  );
  if (!value) return "";

  const rawTime = String(value).trim();
  const timeMatch = rawTime.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (timeMatch) {
    let hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    const meridiem = timeMatch[3]?.toUpperCase();
    if (minutes > 59 || hours > (meridiem ? 12 : 23) || (meridiem && hours < 1)) return rawTime;
    if (meridiem === "PM" && hours !== 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    return `${String(hours % 12 || 12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
  }

  const date = new Date(rawTime);
  return Number.isNaN(date.getTime())
    ? rawTime
    : date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const getTimeInMinutes = (value) => {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (minutes > 59 || hours > (meridiem ? 12 : 23) || (meridiem && hours < 1)) return null;
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const formatScheduleTime = (value) => {
  const minutes = getTimeInMinutes(value);
  if (minutes == null) return "";
  const hours = Math.floor(minutes / 60);
  return `${String(hours % 12 || 12).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
};

export const getAppointmentSchedule = (appointment, availabilityRanges = []) => {
  const bookedTime = pickFirst(
    appointment?.appointment_time,
    appointment?.appointmentTime,
    appointment?.slot_start_time,
    appointment?.slotStartTime,
    appointment?.slot_time,
    appointment?.slotTime,
    appointment?.original_appointment_time,
    appointment?.originalAppointmentTime,
    appointment?.scheduled_time,
    appointment?.scheduledTime,
    appointment?.time
  );
  const bookedMinutes = getTimeInMinutes(bookedTime);
  const dateValue = pickFirst(
    appointment?.appointment_date,
    appointment?.appointmentDate,
    appointment?.date,
    appointment?.scheduled_date,
    appointment?.scheduledDate
  );
  if (bookedMinutes == null || !dateValue) return null;

  const dateKey = String(dateValue).slice(0, 10);
  const date = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const clinicId = pickFirst(appointment?.clinic_id, appointment?.clinicId, appointment?.clinic?._id, appointment?.clinic?.id);
  const clinicRanges = availabilityRanges.filter((range) => {
    const rangeClinicId = pickFirst(range.clinic_id, range.clinicId, range.hospital_id, range.hospitalId);
    if (clinicId && rangeClinicId && String(clinicId) !== String(rangeClinicId)) return false;
    return !range.blocked && range.is_unavailable !== true && Number(range.is_unavailable) !== 1;
  });
  const dateRanges = clinicRanges.filter((range) =>
    String(pickFirst(range.date, range.available_date, range.availability_date, range.specific_date) || "").slice(0, 10) === dateKey
  );
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  const weekdayRanges = clinicRanges.filter((range) => {
    if (pickFirst(range.date, range.available_date, range.availability_date, range.specific_date)) return false;
    const weekday = pickFirst(range.weekday, range.day_of_week, range.week_day, range.day_name);
    if (weekday === undefined || weekday === null) return false;
    const weekdayNumber = Number(weekday);
    return Number.isInteger(weekdayNumber)
      ? weekdayNumber === date.getDay()
      : String(weekday).toLowerCase().startsWith(dayName.slice(0, 3));
  });
  const applicableRanges = dateRanges.length ? dateRanges : weekdayRanges;

  const scheduledRanges = applicableRanges
    .map((range) => ({
      start: pickFirst(range.start_time, range.start, range.startTime, range.from_time),
      end: pickFirst(range.end_time, range.end, range.endTime, range.to_time),
    }))
    .map((range) => ({
      ...range,
      startMinutes: getTimeInMinutes(range.start),
      endMinutes: getTimeInMinutes(range.end),
      durationMinutes: Number(pickFirst(range.slot_duration, range.slotDuration, range.duration, 0)) || 0,
    }))
    .filter((range) => range.startMinutes != null && range.endMinutes != null && range.endMinutes > range.startMinutes)
    .sort((left, right) => left.startMinutes - right.startMinutes);

  const scheduleIndex = scheduledRanges.findIndex(
    (range) => bookedMinutes >= range.startMinutes && bookedMinutes < range.endMinutes
  );
  if (scheduleIndex < 0) return null;
  const range = scheduledRanges[scheduleIndex];
  return {
    label: `Schedule ${scheduleIndex + 1}`,
    range: `${formatScheduleTime(range.start)} - ${formatScheduleTime(range.end)}`,
    durationMinutes: range.durationMinutes,
  };
};

export const isAppointmentSlotExpired = (appointment, nowMs = Date.now()) => {
  const status = String(pickFirst(appointment?.status, appointment?.appointment_status, "")).toLowerCase();
  const queueStatus = String(
    pickFirst(appointment?.queueStatus, appointment?.queue_status, ""),
  ).toLowerCase().replace(/-/g, "_");
  const consultationStartedAt = pickFirst(
    appointment?.consultationStartedAt,
    appointment?.consultation_started_at,
    appointment?.consultation_timing?.startedAt,
    appointment?.consultation_timing?.started_at,
  );
  if (
    ["in_progress", "completed"].includes(queueStatus) ||
    consultationStartedAt ||
    ["completed", "in-progress", "in_progress"].includes(status)
  ) return false;
  if (["no_show", "no-show"].includes(queueStatus)) return true;
  if (queueStatus === "skipped" || status === "skipped") return false;
  if (!["pending", "confirmed", "booked", "scheduled", "accepted", "active"].includes(status)) return false;
  if (
    String(appointment?.priority || "").toLowerCase() === "emergency" ||
    appointment?.isEmergency
  ) return false;

  const dateValue = pickFirst(
    appointment?.appointment_date,
    appointment?.appointmentDate,
    appointment?.date,
    appointment?.scheduled_date,
    appointment?.scheduledDate
  );
  const dateKey = String(dateValue || "").slice(0, 10);
  const startMinutes = getTimeInMinutes(pickFirst(
    appointment?.appointment_time,
    appointment?.appointmentTime,
    appointment?.slot_start_time,
    appointment?.slotStartTime,
    appointment?.slot_time,
    appointment?.slotTime,
    appointment?.original_appointment_time,
    appointment?.originalAppointmentTime,
    appointment?.scheduled_time,
    appointment?.scheduledTime,
    appointment?.bookedSlotTime,
    appointment?.time
  ));
  const durationMinutes = Number(pickFirst(
    appointment?.slot_duration,
    appointment?.slotDuration,
    appointment?.slot_duration_minutes,
    appointment?.duration_minutes,
    appointment?.slotDurationMinutes,
    appointment?.bookedSchedule?.durationMinutes
  ));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || startMinutes == null || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return false;
  }

  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const slotEnd = date.getTime() + (startMinutes + durationMinutes) * 60000;
  return slotEnd <= nowMs;
};

export const shouldShowStartConsultation = ({
  activeTab,
  appointment,
  slotStartReached,
  pendingIndex,
}) =>
  ((activeTab === "next" && appointment?.status === "skipped") || (activeTab === "pending" &&
  ["pending", "confirmed"].includes(
    String(pickFirst(appointment?.status, appointment?.appointment_status, "")).toLowerCase(),
  ) &&
  (slotStartReached || (pendingIndex >= 0 && pendingIndex < 2))));

export const canStartConsultation = ({
  appointment,
  hasActiveConsultation,
  isOnBreak,
  slotStartReached,
  queueTurnReached = false,
}) =>
  Boolean(appointment) &&
  ["pending", "confirmed", "skipped"].includes(
    String(pickFirst(appointment.status, appointment.appointment_status, "")).toLowerCase(),
  ) &&
  !hasActiveConsultation &&
  !isOnBreak &&
  (appointment.status === "skipped" || slotStartReached || queueTurnReached);

export const isBookedAppointmentStartTimeReached = (appointment, nowMs = Date.now()) => {
  const dateValue = pickFirst(
    appointment?.appointment_date,
    appointment?.appointmentDate,
    appointment?.date,
    appointment?.scheduled_date,
    appointment?.scheduledDate,
  );
  const dateKey = String(dateValue || "").slice(0, 10);
  const timeMinutes = getTimeInMinutes(pickFirst(
    appointment?.appointment_time,
    appointment?.appointmentTime,
    appointment?.slot_start_time,
    appointment?.slotStartTime,
    appointment?.slot_time,
    appointment?.slotTime,
    appointment?.bookedSlotTime,
    appointment?.time,
  ));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || timeMinutes == null) return false;

  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() + timeMinutes * 60000 <= nowMs;
};

export const normalizeAvailabilityRanges = (payload) => {
  const ranges = [];
  const visited = new Set();
  const visit = (value, inherited = {}) => {
    if (!value || typeof value !== "object" || visited.has(value)) return;
    visited.add(value);
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, inherited));
      return;
    }

    const range = { ...inherited, ...value };
    if (
      pickFirst(range.start_time, range.start, range.startTime, range.from_time) &&
      pickFirst(range.end_time, range.end, range.endTime, range.to_time)
    ) {
      ranges.push(range);
    }
    Object.values(value).forEach((nestedValue) => {
      if (nestedValue && typeof nestedValue === "object") visit(nestedValue, range);
    });
  };

  visit(payload);
  const unique = new Map();
  ranges.forEach((range) => {
    const key = [
      pickFirst(range.date, range.available_date, range.availability_date, range.specific_date, ""),
      pickFirst(range.weekday, range.day_of_week, range.week_day, ""),
      pickFirst(range.clinic_id, range.clinicId, range.hospital_id, range.hospitalId, ""),
      pickFirst(range.start_time, range.start, range.startTime, range.from_time, ""),
      pickFirst(range.end_time, range.end, range.endTime, range.to_time, ""),
    ].join("|");
    unique.set(key, range);
  });
  return [...unique.values()];
};

export const getAppointmentSource = (appointment) => {
  const rawType = String(pickFirst(
    appointment?.__appointmentSource,
    appointment?.appointment_source,
    appointment?.appointmentSource,
    appointment?.source,
    appointment?.record_type,
    appointment?.recordType,
    appointment?.appointment_type,
    appointment?.appointmentType,
    appointment?.booking_type,
    appointment?.bookingType,
    appointment?.consultation_mode,
    appointment?.consultationMode,
    appointment?.type,
    ""
  )).toLowerCase();
  const hasWalkInIdentity = Boolean(
    appointment?.walkin_appointment_id ||
    appointment?.walkinAppointmentId ||
    appointment?.walkin_id ||
    appointment?.walkinId
  );

  return rawType.includes("walk") || hasWalkInIdentity ? "walkin" : "online";
};

export const getAppointmentApiId = (appointment) => pickFirst(
  appointment?._id,
  appointment?.apiId,
  appointment?.id,
  appointment?.appointment_id,
  appointment?.appointmentId,
  appointment?.walkin_appointment_id,
  appointment?.walkinAppointmentId,
  appointment?.walkin_id,
  appointment?.walkinId,
);

// Booking category can differ from the API/table storing the record.
export const getAppointmentBookingType = (appointment) => {
  const bookingSource = String(appointment.booking_source || appointment.bookingSource || appointment.source || "").trim().toLowerCase();
  return bookingSource === "qr" ? "walkin" : getAppointmentSource(appointment);
};

export const getAppointmentStatusUrl = (baseUrl, appointment) => {
  const source = getAppointmentSource(appointment);
  const id = getAppointmentApiId(appointment);
  if (id === undefined) throw new Error("Cannot update an appointment without its API id.");

  const endpoint = source === "walkin" ? "walkin-appointments" : "appointments";
  const statusPath = source === "walkin" ? "" : "/status";
  return `${baseUrl.replace(/\/+$/, "")}/${endpoint}/${encodeURIComponent(String(id))}${statusPath}`;
};

// Online and walk-in tables can use the same numeric ID. Deduplicate only
// within a source, including when /appointments already embeds walk-ins.
export const mergeAppointmentLists = (...lists) => {
  const records = new Map();
  const withoutId = [];
  for (const appointment of lists.flat()) {
    const id = getAppointmentApiId(appointment);
    if (id === undefined) {
      withoutId.push(appointment);
      continue;
    }
    records.set(`${getAppointmentSource(appointment)}:${id}`, appointment);
  }
  return [...records.values(), ...withoutId];
};

export const getCancelledAppointmentHistory = (appointments, nowMs = Date.now()) =>
  mergeAppointmentLists(appointments).flatMap((appointment) => {
    const status = String(appointment.status || appointment.appointment_status || "").toLowerCase().replace(/-/g, "_");
    const queueStatus = String(appointment.queueStatus || appointment.queue_status || "").toLowerCase().replace(/-/g, "_");
    if (["completed", "in_progress"].includes(status) || ["completed", "in_progress"].includes(queueStatus)) return [];
    const noShow = status === "no_show" || queueStatus === "no_show" || appointment.isNoShow;
    const cancelled = ["cancelled", "canceled"].includes(status) || ["cancelled", "canceled"].includes(queueStatus);
    const expired = !cancelled && isAppointmentSlotExpired(appointment, nowMs);
    if (!cancelled && !noShow && !expired) return [];
    return [{ ...appointment, status: "cancelled", isNoShow: Boolean(noShow || expired) }];
  });

export const loadDoctorAppointmentFeed = async (client, baseUrl, doctorId, headers) => {
  const options = { headers, params: { doctor_id: doctorId } };
  const [online, walkins, completed] = await Promise.all([
    client.get(`${baseUrl}/appointments`, options),
    client.get(`${baseUrl}/walkin-appointments`, options),
    client.get(`${baseUrl}/appointments`, {
      headers, params: { doctor_id: doctorId, appointment_status: "completed" },
    }),
  ]);
  return mergeAppointmentLists(
    normalizeApiList(online.data),
    normalizeApiList(completed.data),
    normalizeApiList(walkins.data).map((item) => ({ ...item, __appointmentSource: "walkin" })),
  );
};
