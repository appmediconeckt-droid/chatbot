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

// Online and walk-in tables can use the same numeric ID. Deduplicate only
// within a source, including when /appointments already embeds walk-ins.
export const mergeAppointmentLists = (...lists) => {
  const records = new Map();
  const withoutId = [];
  for (const appointment of lists.flat()) {
    const id = pickFirst(appointment.id, appointment._id, appointment.appointment_id,
      appointment.appointmentId, appointment.walkin_appointment_id,
      appointment.walkinAppointmentId, appointment.walkin_id, appointment.walkinId);
    if (id === undefined) {
      withoutId.push(appointment);
      continue;
    }
    records.set(`${getAppointmentSource(appointment)}:${id}`, appointment);
  }
  return [...records.values(), ...withoutId];
};

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
