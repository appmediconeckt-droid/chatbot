// DoctorCalendar.jsx
import { useEffect, useRef, useState } from "react";
import { useDoctorUser } from "../doctorApi.js";
import axios from "../../../axiosConfig.js";
import "bootstrap/dist/css/bootstrap.min.css";
import "./DoctorCalendar.css";
import { API_BASE_URL, getAuthHeaders } from "../doctorApi.js";


const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const formatDateKey = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const CLINICS_BASE_URL = `${API_BASE_URL}/clinics`;
const AVAILABILITY_BASE_URL = `${API_BASE_URL}/availability`;

const defaultDurations = [5, 10, 15, 20, 30];
const createEmptyTimeRange = () => ({
  start: "",
  end: "",
  duration: 15,
});

const isRealClinicId = (value) => Boolean(value) && !/^\d+$/.test(String(value));

// Sample clinic data - you can extend this
const defaultClinics = [
  { id: 1, name: "Main Hospital", location: "Downtown", color: "#007bff" },
  { id: 2, name: "North Branch", location: "North City", color: "#28a745" },
  { id: 3, name: "South Clinic", location: "South Area", color: "#dc3545" },
  { id: 4, name: "West Center", location: "West District", color: "#ffc107" },
  { id: 5, name: "East Facility", location: "East Side", color: "#6f42c1" },
];

const getStoredAuthUser = () => {
  try {
    return JSON.parse(localStorage.getItem("userData") || "null");
  } catch {
    return null;
  }
};

const getDoctorId = (user = {}) => (
  user.doctor_id ||
  user.doctorId ||
  user.id ||
  user._id ||
  user.user_id ||
  user.userId ||
  ""
);

const unwrapApiArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.clinics)) return payload.clinics;
  if (Array.isArray(payload?.ranges)) return payload.ranges;
  if (Array.isArray(payload?.existingRanges)) return payload.existingRanges;
  if (Array.isArray(payload?.availability)) return payload.availability;
  if (Array.isArray(payload?.availabilities)) return payload.availabilities;
  if (Array.isArray(payload?.availableDates)) return payload.availableDates;
  if (Array.isArray(payload?.data?.clinics)) return payload.data.clinics;
  if (Array.isArray(payload?.data?.ranges)) return payload.data.ranges;
  if (Array.isArray(payload?.data?.existingRanges)) return payload.data.existingRanges;
  if (Array.isArray(payload?.data?.availability)) return payload.data.availability;
  if (Array.isArray(payload?.data?.availabilities)) return payload.data.availabilities;
  if (Array.isArray(payload?.data?.availableDates)) return payload.data.availableDates;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const normalizeClinic = (clinic, index) => ({
  id: clinic._id || clinic.clinic_id || clinic.clinicId || clinic.id || clinic.hospital_id || index,
  name: clinic.clinic_name || clinic.clinicName || clinic.hospital_name || clinic.hospitalName || clinic.name || "Unnamed Clinic",
  location: clinic.location || clinic.address || clinic.clinic_address || clinic.hospital_address || "Address not available",
  doctorId: clinic.doctor_id || clinic.doctorId || clinic.doctor?.id || clinic.doctor?._id || "",
  color: defaultClinics[index % defaultClinics.length]?.color || "#007bff",
});

const weekdayNameMap = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

const normalizeWeekday = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number") return value;
  const raw = String(value).trim().toLowerCase();
  if (weekdayNameMap[raw] !== undefined) return weekdayNameMap[raw];
  const numeric = Number(raw);
  if (Number.isNaN(numeric)) return undefined;
  return numeric >= 1 && numeric <= 7 ? numeric % 7 : numeric;
};

const normalizeDateKey = (value) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return formatDateKey(date.getFullYear(), date.getMonth(), date.getDate());
};

const normalizeTimeValue = (value) => {
  if (!value) return "";
  const raw = String(value);
  if (/^\d{2}:\d{2}/.test(raw)) return raw.slice(0, 5);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return raw;
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const normalizeRange = (range) => ({
  id: range.id || range.range_id || range._id,
  clientId: range.clientId || range.client_id || range.local_id,
  date: normalizeDateKey(range.date || range.available_date || range.availability_date || range.specific_date || range.unavailable_date || ""),
  weekday: normalizeWeekday(range.weekday ?? range.day_of_week ?? range.week_day ?? range.day ?? range.day_name ?? range.dayName),
  start: normalizeTimeValue(range.start || range.start_time || range.startTime || range.from_time || range.fromTime || range.from || range.start_date || range.startDate || ""),
  end: normalizeTimeValue(range.end || range.end_time || range.endTime || range.to_time || range.toTime || range.to || range.end_date || range.endDate || ""),
  duration: Number(range.duration || range.slot_duration || range.slotDuration || 15),
  clinicId: range.clinic_id || range.clinicId || range.hospital_id || range.hospitalId || range.clinic?.id || range.hospital?.id || "",
  clinicName: range.clinic_name || range.clinicName || range.hospital_name || range.hospitalName || range.clinic?.name || range.hospital?.name || "",
  blocked: Boolean(range.blocked || range.is_unavailable || range.unavailable || range.status === "unavailable"),
  reason: range.reason || range.unavailable_reason || range.note || "",
});

const getRecordSlots = (record) => {
  const slots = record.slots || record.time_slots || record.timeSlots || record.ranges || record.timings || record.availability_slots;
  return Array.isArray(slots) && slots.length ? slots : [record];
};

const normalizeSlotRecord = (slot) => {
  if (typeof slot === "string" || typeof slot === "number") {
    return { time: String(slot) };
  }
  return slot || {};
};

const getRecordWeekdays = (record) => {
  const values = record.weekdays || record.week_days || record.available_days || record.days || record.day_names;
  if (Array.isArray(values)) return values.map(normalizeWeekday).filter((item) => item !== undefined);
  const single = normalizeWeekday(record.weekday ?? record.day_of_week ?? record.week_day ?? record.day ?? record.day_name ?? record.dayName);
  return single === undefined ? [] : [single];
};

const expandAvailabilityRecords = (records) => {
  const expanded = [];
  records.forEach((record) => {
    const dates = [
      record.date,
      record.available_date,
      record.availability_date,
      record.specific_date,
      record.unavailable_date,
    ].filter(Boolean);
    const weekdays = getRecordWeekdays(record);
    const slots = getRecordSlots(record);

    if (dates.length) {
      dates.forEach((date) => {
        slots.forEach((slot) => expanded.push({ ...record, ...normalizeSlotRecord(slot), date }));
      });
      return;
    }

    if (weekdays.length) {
      weekdays.forEach((weekday) => {
        slots.forEach((slot) => expanded.push({ ...record, ...normalizeSlotRecord(slot), weekday }));
      });
      return;
    }

    expanded.push(record);
  });
  return expanded;
};

const isUsableTimeRange = (range) => {
  if (!/^\d{2}:\d{2}$/.test(range?.start || "") || !/^\d{2}:\d{2}$/.test(range?.end || "")) return false;
  const [sh, sm] = range.start.split(":").map(Number);
  const [eh, em] = range.end.split(":").map(Number);
  return eh * 60 + em > sh * 60 + sm;
};

const mergeAvailabilityRanges = (...rangeGroups) => {
  const normalizedRanges = rangeGroups
    .flat()
    .filter(Boolean)
    .flatMap((record) => expandAvailabilityRecords([record]))
    .map(normalizeRange);

  // A backend may use one availability record id for a day and return that
  // same id for every time window. Never use that id alone as the identity:
  // morning and evening must remain separate ranges.
  const usableByServerId = new Map();
  normalizedRanges.forEach((range) => {
    if (range.id !== undefined && range.id !== null && isUsableTimeRange(range)) {
      const id = String(range.id);
      usableByServerId.set(id, [...(usableByServerId.get(id) || []), range]);
    }
  });

  const merged = new Map();
  normalizedRanges.forEach((rawRange, index) => {
    let range = rawRange;
    if (!isUsableTimeRange(range) && range.id !== undefined && range.id !== null) {
      const candidates = usableByServerId.get(String(range.id)) || [];
      if (candidates.length === 1) {
        const canonical = candidates[0];
        range = {
          ...range,
          date: range.date || canonical.date,
          weekday: range.weekday ?? canonical.weekday,
          clinicId: range.clinicId || canonical.clinicId,
          clinicName: range.clinicName || canonical.clinicName,
          start: canonical.start,
          end: canonical.end,
          duration: canonical.duration,
        };
      }
    }

    const target = range.date || `weekday:${range.weekday ?? "unknown"}`;
    const key = [
      target,
      range.start,
      range.end,
      Number(range.duration || 15),
      range.blocked,
      range.clinicId || "",
    ].join("|");
    const existing = merged.get(key);
    if (!existing || (!existing.id && range.id)) {
      merged.set(key || range.clientId || `range:${index}`, range);
    }
  });
  return Array.from(merged.values());
};

const rangesOverlap = (left, right) => {
  if (!isUsableTimeRange(left) || !isUsableTimeRange(right)) return false;
  const toMinutes = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };
  return (
    toMinutes(left.start) < toMinutes(right.end) &&
    toMinutes(right.start) < toMinutes(left.end)
  );
};

const getRangeConflict = (candidate, existingRanges = []) => {
  const duplicate = existingRanges.find(
    (range) =>
      normalizeTimeValue(range.start) === normalizeTimeValue(candidate.start) &&
      normalizeTimeValue(range.end) === normalizeTimeValue(candidate.end)
  );
  if (duplicate) return "This exact time range is already available.";

  const overlap = existingRanges.find((range) => rangesOverlap(candidate, range));
  if (overlap) {
    return `This range overlaps the existing ${overlap.start} - ${overlap.end} availability.`;
  }
  return "";
};

const sortAvailabilityRanges = (ranges = []) =>
  [...ranges].sort((left, right) =>
    normalizeTimeValue(left.start).localeCompare(normalizeTimeValue(right.start))
  );

const DoctorCalendar = () => {
  const authUser = useDoctorUser();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeCalendarTab, setActiveCalendarTab] = useState("specific");
  const [selectedDays, setSelectedDays] = useState([]);
  const [recurringWeekdays, setRecurringWeekdays] = useState([]);
  const [availabilityDateMap, setAvailabilityDateMap] = useState({});
  const [availabilityWeekdayMap, setAvailabilityWeekdayMap] = useState({});
  const [unassignedRanges, setUnassignedRanges] = useState([]);
  const [editingTarget, setEditingTarget] = useState(null);
  const [newRange, setNewRange] = useState({
    start: "",
    end: "",
    duration: 15,
  });
  const [slotPreview, setSlotPreview] = useState([]);
  const [showAddTimeModal, setShowAddTimeModal] = useState(false);
  const [quickRanges, setQuickRanges] = useState({});

  // Clinic states
  const [clinics, setClinics] = useState(defaultClinics);
  const [selectedClinic, setSelectedClinic] = useState(defaultClinics[0]);
  const [showClinicDropdown, setShowClinicDropdown] = useState(false);
  const [apiStatus, setApiStatus] = useState("idle");
  const [apiError, setApiError] = useState("");
  const [unavailableReason, setUnavailableReason] = useState("");
  const [savingUnavailable, setSavingUnavailable] = useState(false);
  const [unavailableError, setUnavailableError] = useState("");
  const currentUser = authUser || getStoredAuthUser() || {};
  const doctorId = getDoctorId(currentUser);
  const availabilityStorageKey = `doctorAvailability:${doctorId || "doctor"}:${selectedClinic?.id || "clinic"}`;
  const selectedClinicIdRef = useRef(selectedClinic?.id);
  selectedClinicIdRef.current = selectedClinic?.id;

  const [additionalTime, setAdditionalTime] = useState({
    start: "",
    end: "",
    duration: 15,
    durationMode: "preset",
    customDuration: "none",
  });
  const [additionalTimeRows, setAdditionalTimeRows] = useState([
    createEmptyTimeRange(),
  ]);

  const updateAdditionalTimeRow = (index, field, value) => {
    setAdditionalTimeRows((rows) =>
      rows.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [field]: field === "duration" ? Number(value) : value,
            }
          : row
      )
    );
  };

  const addAdditionalTimeRow = () => {
    setAdditionalTimeRows((rows) => [...rows, createEmptyTimeRange()]);
  };

  const removeAdditionalTimeRow = (index) => {
    setAdditionalTimeRows((rows) =>
      rows.length === 1 ? rows : rows.filter((_, rowIndex) => rowIndex !== index)
    );
  };

  const loadClinics = async () => {
    if (!doctorId) {
      setApiError("Doctor id not found. Please login again.");
      return;
    }

    try {
      setApiStatus("loading");
      setApiError("");
      const response = await axios.get(CLINICS_BASE_URL, {
        headers: getAuthHeaders(),
        params: { doctor_id: doctorId, role: "doctor" },
      });

      const doctorClinics = unwrapApiArray(response.data)
        .map(normalizeClinic)
        .filter((clinic) => !clinic.doctorId || String(clinic.doctorId) === String(doctorId));

      setClinics(doctorClinics);
      if (doctorClinics.length) {
        setSelectedClinic(doctorClinics[0]);
      }
      setApiStatus("succeeded");
    } catch (error) {
      setApiStatus("failed");
      setApiError(error.response?.data?.message || error.response?.data?.error || "Failed to load clinics");
    }
  };

  const applyAvailabilityRanges = (ranges) => {
    const nextDateMap = {};
    const nextWeekdayMap = {};
    const nextSelectedDays = new Set();
    const nextWeekdays = new Set();
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    const orphanRanges = [];

    expandAvailabilityRecords(ranges).map(normalizeRange).forEach((range) => {
      const belongsToSelectedClinic =
        !range.clinicId ||
        !selectedClinic?.id ||
        String(range.clinicId) === String(selectedClinic.id) ||
        (range.clinicName && selectedClinic?.name && String(range.clinicName).toLowerCase() === String(selectedClinic.name).toLowerCase());
      if (!belongsToSelectedClinic) return;

      if (!range.date && (range.weekday === undefined || range.weekday === null || range.weekday === "")) {
        orphanRanges.push(range);
        return;
      }

      if (range.date) {
        const date = new Date(range.date);
        const dateKey = Number.isNaN(date.getTime())
          ? range.date
          : formatDateKey(date.getFullYear(), date.getMonth(), date.getDate());
        const info = nextDateMap[dateKey] || { ranges: [], blocked: false };
        nextDateMap[dateKey] = {
          ...info,
          blocked: info.blocked || range.blocked,
          ranges: range.blocked ? info.ranges : [...info.ranges, range],
        };

        if (!Number.isNaN(date.getTime()) && date.getMonth() === month && date.getFullYear() === year) {
          nextSelectedDays.add(date.getDate());
        }
      } else if (range.weekday !== undefined && range.weekday !== null && range.weekday !== "") {
        const weekday = normalizeWeekday(range.weekday);
        if (weekday === undefined) return;
        nextWeekdayMap[weekday] = [...(nextWeekdayMap[weekday] || []), range];
        nextWeekdays.add(weekday);
      }
    });

    setAvailabilityDateMap(nextDateMap);
    setAvailabilityWeekdayMap(nextWeekdayMap);
    setUnassignedRanges(orphanRanges);
    setSelectedDays(Array.from(nextSelectedDays).sort((a, b) => a - b));
    setRecurringWeekdays(Array.from(nextWeekdays).sort((a, b) => a - b));
  };

  const applyUnavailableDates = (payload, localDateMap = {}) => {
    const apiUnavailableDates = [
      ...(Array.isArray(payload?.unavailableDates) ? payload.unavailableDates : []),
      ...(Array.isArray(payload?.data?.unavailableDates) ? payload.data.unavailableDates : []),
      ...(Array.isArray(payload?.unavailable_dates) ? payload.unavailable_dates : []),
      ...(Array.isArray(payload?.data?.unavailable_dates) ? payload.data.unavailable_dates : []),
    ];
    const unavailableDates = apiUnavailableDates;

    if (!unavailableDates.length) return;

    setAvailabilityDateMap((prev) => {
      const next = { ...prev };
      unavailableDates.forEach((item) => {
        const dateValue = typeof item === "string" ? item : item.date || item.unavailable_date || item.unavailableDate;
        const dateKey = normalizeDateKey(dateValue);
        if (!dateKey) return;
        const itemClinicId = typeof item === "object"
          ? item.clinic_id || item.clinicId || item.hospital_id || item.hospitalId
          : "";
        const belongsToSelectedClinic = itemClinicId
          ? String(itemClinicId) === String(selectedClinic?.id)
          : true;
        if (!belongsToSelectedClinic) return;
        const info = next[dateKey] || { ranges: [], blocked: false };
        next[dateKey] = {
          ...info,
          blocked: true,
          globalBlocked: Boolean(info.globalBlocked || !itemClinicId),
          reason: typeof item === "object" ? item.reason || item.unavailable_reason || item.note || "" : info.reason || "",
        };
      });
      return next;
    });
  };

  const loadAvailabilityRanges = async () => {
    if (!doctorId || !selectedClinic?.id) return;
    const requestedClinicId = selectedClinic.id;

    try {
      const response = await axios.get(`${AVAILABILITY_BASE_URL}/ranges`, {
        headers: getAuthHeaders(),
        params: { doctor_id: doctorId, clinic_id: selectedClinic.id },
      });
      const localAvailability = getLocalAvailability();
      const apiRanges = unwrapApiArray(response.data);
      const localDateRanges = Object.entries(localAvailability.dateMap || {}).flatMap(([date, info]) =>
        (info?.ranges || []).map((range) => ({ ...range, date }))
      );
      const mergedRanges = mergeAvailabilityRanges(
        apiRanges,
        localAvailability.ranges || [],
        localDateRanges
      );
      applyAvailabilityRanges(mergedRanges);
      applyUnavailableDates(response.data, localAvailability.dateMap || {});
    } catch (error) {
      const localAvailability = getLocalAvailability();
      const localDateRanges = Object.entries(localAvailability.dateMap || {}).flatMap(([date, info]) =>
        (info?.ranges || []).map((range) => ({ ...range, date }))
      );
      applyAvailabilityRanges(
        mergeAvailabilityRanges(localAvailability.ranges || [], localDateRanges)
      );
      setAvailabilityDateMap((prev) => {
        const next = { ...prev };
        Object.entries(localAvailability.dateMap || {}).forEach(([date, info]) => {
          next[date] = {
            ...(next[date] || { ranges: [] }),
            blocked: Boolean(info?.blocked),
            reason: info?.reason || "",
          };
        });
        return next;
      });
      if (String(selectedClinicIdRef.current) !== String(requestedClinicId)) return;
      setApiError(error.response?.data?.message || error.response?.data?.error || "Showing locally saved availability. Backend ranges could not be loaded.");
    }
  };

  const getLocalAvailability = () => {
    try {
      return JSON.parse(localStorage.getItem(availabilityStorageKey) || "{}");
    } catch {
      return {};
    }
  };

  const saveLocalAvailability = (ranges, dateMap = availabilityDateMap) => {
    localStorage.setItem(
      availabilityStorageKey,
      JSON.stringify({
        ranges,
        dateMap,
        savedAt: new Date().toISOString(),
      })
    );
  };

  const getAllLocalRanges = (dateMap = availabilityDateMap, weekdayMap = availabilityWeekdayMap) => {
    const dateRanges = Object.entries(dateMap).flatMap(([date, info]) =>
      (info?.ranges || []).map((range) => ({ ...range, date }))
    );
    const weekdayRanges = Object.entries(weekdayMap).flatMap(([weekday, ranges]) =>
      (ranges || []).map((range) => ({ ...range, weekday: Number(weekday) }))
    );
    return [...dateRanges, ...weekdayRanges];
  };

  useEffect(() => {
    loadClinics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);

  useEffect(() => {
    loadAvailabilityRanges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, selectedClinic?.id, currentDate.getMonth(), currentDate.getFullYear()]);

  // Check if a date is in the past
  const isPastDate = (year, month, day) => {
    const today = new Date();
    const dateToCheck = new Date(year, month, day);

    // Reset hours to compare only dates
    today.setHours(0, 0, 0, 0);
    dateToCheck.setHours(0, 0, 0, 0);

    return dateToCheck < today;
  };

  // Check if a date-time is in the past
  const isPastDateTime = (year, month, day, hour, minute) => {
    const now = new Date();
    const dateTimeToCheck = new Date(year, month, day, hour, minute);
    return dateTimeToCheck < now;
  };

  const getDaysInMonth = (month, year) =>
    new Date(year, month + 1, 0).getDate();

  const changeMonth = (dir) => {
    const nd = new Date(currentDate);
    nd.setMonth(currentDate.getMonth() + dir);
    setCurrentDate(nd);
  };

  const toggleManualDay = (year, month, day) => {
    if (!day) return;

    // Don't allow selection of past dates
    if (isPastDate(year, month, day)) {
      return;
    }

    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.filter((x) => x !== day)
        : [...prev, day].sort((a, b) => a - b)
    );
  };

  const toggleRecurringWeekday = (w) => {
    setRecurringWeekdays((prev) =>
      prev.includes(w)
        ? prev.filter((x) => x !== w)
        : [...prev, w].sort((a, b) => a - b)
    );
  };

  const ensureQuickRangeForKey = (dateKey) => {
    setQuickRanges((prev) => {
      if (prev[dateKey]) return prev;
      return {
        ...prev,
        [dateKey]: {
          start: "",
          end: "",
          durationMode: "preset",
          duration: 15,
          customDuration: "",
        },
      };
    });
  };

  const changeQuickRangeField = (dateKey, field, value) => {
    setQuickRanges((prev) => ({
      ...prev,
      [dateKey]: {
        ...(prev[dateKey] || {}),
        [field]: value,
      },
    }));
  };

  const addQuickRangeToDate = async (year, month, day, dateKey) => {
    const q = quickRanges[dateKey] || {};
    const start = q.start;
    const end = q.end;
    let duration = Number(q.duration || 0);
    if (q.durationMode === "custom") {
      duration = Number(q.customDuration || 0);
    }

    if (!start || !end) {
      return alert("Start and End time required");
    }

    // Check if the time is in the past
    const [sh, sm] = start.split(":").map(Number);
    if (isPastDateTime(year, month, day, sh, sm)) {
      return alert("Cannot add time in the past");
    }

    const [eh, em] = end.split(":").map(Number);
    const sMinutes = sh * 60 + sm;
    const eMinutes = eh * 60 + em;
    if (!(eMinutes > sMinutes))
      return alert("End time must be after Start time");
    if (!(duration > 0)) return alert("Duration must be a positive number");
    const conflict = getRangeConflict(
      { start, end },
      availabilityDateMap[dateKey]?.ranges || []
    );
    if (conflict) return alert(conflict);

    let savedRange;
    try {
      savedRange = await persistRange(
        { start, end, duration },
        { type: "date", key: dateKey }
      );
    } catch (error) {
      if (String(selectedClinicIdRef.current) !== String(requestedClinicId)) return;
      return alert(error.response?.data?.message || error.response?.data?.error || "Failed to save availability range");
    }

    setAvailabilityDateMap((prev) => {
      const prevInfo = prev[dateKey]
        ? { ...prev[dateKey] }
        : { ranges: [], blocked: false };
      const arr = prevInfo.ranges ? [...prevInfo.ranges] : [];
      arr.push(savedRange);
      return {
        ...prev,
        [dateKey]: { ...prevInfo, ranges: sortAvailabilityRanges(arr) },
      };
    });

    setQuickRanges((prev) => ({
      ...prev,
      [dateKey]: {
        start: "",
        end: "",
        durationMode: "preset",
        duration: 15,
        customDuration: "",
      },
    }));
  };

  const addAdditionalTiming = async () => {
    const { start, end, durationMode, customDuration } = additionalTime;
    let duration = Number(additionalTime.duration || 0);

    if (durationMode === "custom") {
      duration = Number(customDuration || 0);
    }

    if (!start || !end) {
      return alert("Start and End time required");
    }
    if (!selectedDays.length) {
      if (recurringWeekdays.length) {
        return addAdditionalTimingToWeekdays();
      }
      return alert("Please select a calendar date or at least one recurring weekday first");
    }

    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const sMinutes = sh * 60 + sm;
    const eMinutes = eh * 60 + em;

    if (!(eMinutes > sMinutes))
      return alert("End time must be after Start time");
    if (!(duration > 0)) return alert("Duration must be a positive number");

    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const newAvailabilityDateMap = { ...availabilityDateMap };

    for (const day of selectedDays) {
      const dateKey = formatDateKey(year, month, day);
      const conflict = getRangeConflict(
        { start, end },
        newAvailabilityDateMap[dateKey]?.ranges || []
      );
      if (conflict) return alert(`${dateKey}: ${conflict}`);
    }

    for (const day of selectedDays) {
      if (isPastDate(year, month, day)) continue;
      if (isPastDateTime(year, month, day, sh, sm)) {
        alert(`Cannot add time in the past for date ${day}`);
        continue;
      }

      const dateKey = formatDateKey(year, month, day);
      try {
        const savedRange = await persistRange(
          { start, end, duration },
          { type: "date", key: dateKey }
        );

        const prevInfo = newAvailabilityDateMap[dateKey]
          ? { ...newAvailabilityDateMap[dateKey] }
          : { ranges: [], blocked: false };
        const arr = prevInfo.ranges ? [...prevInfo.ranges] : [];
        arr.push(savedRange);
        newAvailabilityDateMap[dateKey] = {
          ...prevInfo,
          ranges: sortAvailabilityRanges(arr),
        };
      } catch (error) {
        return alert(error.response?.data?.message || error.response?.data?.error || `Failed to save range for ${dateKey}`);
      }
    }

    setAvailabilityDateMap(newAvailabilityDateMap);
    saveLocalAvailability(getAllLocalRanges(newAvailabilityDateMap, availabilityWeekdayMap), newAvailabilityDateMap);
    setAdditionalTime({
      start: "",
      end: "",
      duration: 15,
      durationMode: "preset",
      customDuration: "",
    });
  };

  const addAdditionalTimingToWeekdays = async () => {
    const { start, end, durationMode, customDuration } = additionalTime;
    let duration = Number(additionalTime.duration || 0);

    if (durationMode === "custom") {
      duration = Number(customDuration || 0);
    }

    if (!start || !end) {
      return alert("Start and End time required");
    }
    if (!recurringWeekdays.length) {
      return alert("Please select at least one recurring weekday first");
    }

    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const sMinutes = sh * 60 + sm;
    const eMinutes = eh * 60 + em;

    if (!(eMinutes > sMinutes))
      return alert("End time must be after Start time");
    if (!(duration > 0)) return alert("Duration must be a positive number");

    const newAvailabilityWeekdayMap = { ...availabilityWeekdayMap };

    for (const weekday of recurringWeekdays) {
      const conflict = getRangeConflict(
        { start, end },
        newAvailabilityWeekdayMap[weekday] || []
      );
      if (conflict) return alert(`${days[weekday]}: ${conflict}`);
    }

    for (const weekday of recurringWeekdays) {
      try {
        const savedRange = await persistRange(
          { start, end, duration },
          { type: "weekday", key: weekday }
        );

        const arr = newAvailabilityWeekdayMap[weekday]
          ? [...newAvailabilityWeekdayMap[weekday]]
          : [];
        arr.push(savedRange);
        newAvailabilityWeekdayMap[weekday] = sortAvailabilityRanges(arr);
      } catch (error) {
        return alert(error.response?.data?.message || error.response?.data?.error || `Failed to save range for weekday ${days[weekday]}`);
      }
    }

    setAvailabilityWeekdayMap(newAvailabilityWeekdayMap);
    saveLocalAvailability(getAllLocalRanges(availabilityDateMap, newAvailabilityWeekdayMap), availabilityDateMap);
    setAdditionalTime({
      start: "",
      end: "",
      duration: 15,
      durationMode: "preset",
      customDuration: "",
    });
  };

  const saveAdditionalTimeRows = async (targetType) => {
    const rows = additionalTimeRows.map((range) => ({
      start: normalizeTimeValue(range.start),
      end: normalizeTimeValue(range.end),
      duration: Number(range.duration || 15),
    }));

    if (rows.some((range) => !range.start || !range.end)) {
      return alert("Please fill Start Time and End Time for every time range.");
    }
    if (rows.some((range) => !isUsableTimeRange(range))) {
      return alert("Every End Time must be after its Start Time.");
    }
    if (rows.some((range) => !(range.duration > 0))) {
      return alert("Every Slot Duration must be a positive number.");
    }

    const sortedRows = sortAvailabilityRanges(rows);
    for (let index = 0; index < sortedRows.length; index += 1) {
      const conflict = getRangeConflict(sortedRows[index], sortedRows.slice(0, index));
      if (conflict) return alert(`Time range ${index + 1}: ${conflict}`);
    }

    if (targetType === "weekday") {
      if (!recurringWeekdays.length) {
        return alert("Please select at least one recurring weekday first.");
      }

      const nextWeekdayMap = { ...availabilityWeekdayMap };
      for (const weekday of recurringWeekdays) {
        const combined = [...(nextWeekdayMap[weekday] || [])];
        for (const range of sortedRows) {
          const conflict = getRangeConflict(range, combined);
          if (conflict) return alert(`${days[weekday]}: ${conflict}`);
          let savedRange;
          try {
            savedRange = await persistRange(range, {
              type: "weekday",
              key: weekday,
            });
          } catch (error) {
            return alert(
              error.response?.data?.message ||
                error.response?.data?.error ||
                `Failed to save ${days[weekday]} availability range.`
            );
          }
          combined.push(savedRange);
        }
        nextWeekdayMap[weekday] = sortAvailabilityRanges(combined);
      }

      setAvailabilityWeekdayMap(nextWeekdayMap);
      saveLocalAvailability(
        getAllLocalRanges(availabilityDateMap, nextWeekdayMap),
        availabilityDateMap
      );
    } else {
      if (!selectedDays.length) {
        return alert("Please select at least one calendar date first.");
      }

      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();
      const nextDateMap = { ...availabilityDateMap };

      for (const day of selectedDays) {
        if (isPastDate(year, month, day)) continue;
        const dateKey = formatDateKey(year, month, day);
        const info = nextDateMap[dateKey]
          ? { ...nextDateMap[dateKey] }
          : { ranges: [], blocked: false };
        const combined = [...(info.ranges || [])];

        for (const range of sortedRows) {
          const [hours, minutes] = range.start.split(":").map(Number);
          if (isPastDateTime(year, month, day, hours, minutes)) {
            return alert(`Cannot add a past time for ${dateKey}.`);
          }
          const conflict = getRangeConflict(range, combined);
          if (conflict) return alert(`${dateKey}: ${conflict}`);
          let savedRange;
          try {
            savedRange = await persistRange(range, {
              type: "date",
              key: dateKey,
            });
          } catch (error) {
            return alert(
              error.response?.data?.message ||
                error.response?.data?.error ||
                `Failed to save ${dateKey} availability range.`
            );
          }
          combined.push(savedRange);
        }

        nextDateMap[dateKey] = {
          ...info,
          blocked: false,
          ranges: sortAvailabilityRanges(combined),
        };
      }

      setAvailabilityDateMap(nextDateMap);
      saveLocalAvailability(
        getAllLocalRanges(nextDateMap, availabilityWeekdayMap),
        nextDateMap
      );
    }

    setAdditionalTimeRows([createEmptyTimeRange()]);
  };

  const renderCalendar = () => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const totalDays = getDaysInMonth(month, year);
    const firstDayIndex = new Date(year, month, 1).getDay();

    let cells = [];
    for (let i = 0; i < firstDayIndex; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);

    return (
      <div className="calendar-grid mt-3">
        {cells.map((day, idx) => {
          const month = currentDate.getMonth();
          const year = currentDate.getFullYear();
          const weekday = day ? new Date(year, month, day).getDay() : null;

          const isManual = day && selectedDays.includes(day);
          const isRecurring = day && recurringWeekdays.includes(weekday);
          const isPast = day ? isPastDate(year, month, day) : false;

          const dateKey = day ? formatDateKey(year, month, day) : null;
          const dateInfo = dateKey ? availabilityDateMap[dateKey] || {} : {};
          const isBlocked = dateInfo.blocked === true;

          const classes = ["calendar-cell"];
          if (isPast) classes.push("past-date");
          if (isBlocked) classes.push("blocked");
          else if (isManual) classes.push("selected-manual");
          else if (isRecurring) classes.push("selected-recurring");

          if (isManual && dateKey && !quickRanges[dateKey] && !isPast) {
            ensureQuickRangeForKey(dateKey);
          }

          return (
            <div
              key={idx}
              className={classes.join(" ")}
              onClick={() => {
                if (!day || isPast) return;
                openEditorForDate(year, month, day);
              }}
              title={
                day
                  ? isPast
                    ? "Cannot edit past dates"
                    : `Click to edit ${day}-${month + 1}-${year}`
                  : ""
              }
              role={day ? "button" : undefined}
              tabIndex={day ? 0 : -1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && day && !isPast)
                  openEditorForDate(year, month, day);
              }}
            >
              <div className="d-flex justify-content-between align-items-start">
                <small className="text-muted day-num">{day || ""}</small>
                {day && (
                  <div className="d-flex gap-2 align-items-center">
                    <button
                      className={`btn btn-sm btn-ghost p-0 m-0 quick-toggle ${isPast ? "disabled" : ""
                        }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isPast) return;
                        toggleManualDay(year, month, day);
                      }}
                      disabled={isPast}
                      aria-label={
                        isPast
                          ? "Cannot select past date"
                          : `Toggle manual selection for day ${day}`
                      }
                      title={
                        isPast ? "Past date" : "Toggle manual selected day"
                      }
                    >
                      <small>{isManual ? "✓" : "○"}</small>
                    </button>

                    <button
                      className={`btn btn-sm btn-outline-secondary p-1 ${isPast ? "disabled" : ""
                        }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isPast) return;
                        openEditorForDate(year, month, day);
                      }}
                      disabled={isPast}
                      title={isPast ? "Cannot edit past dates" : "Open editor"}
                      aria-label={`Open editor for ${dateKey}`}
                    >
                      <small>Edit</small>
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-2 cell-body">
                {day && (
                  <>
                    {isPast ? (
                      <small className="text-muted">Past date</small>
                    ) : (
                      <>
                        <small>
                          {isBlocked ? (
                            <span className="text-danger">Unavailable</span>
                          ) : (
                            <span>
                              {getRangesForDateOrWeek(year, month, day).length}{" "}
                              ranges
                            </span>
                          )}
                        </small>
                        <div className="mt-2 small-legend">
                          {isManual && (
                            <span className="badge badge-pill badge-manual">
                              Manual
                            </span>
                          )}
                          {isRecurring && (
                            <span className="badge badge-pill badge-recurring">
                              Week
                            </span>
                          )}
                          {isBlocked && (
                            <span className="badge badge-pill badge-blocked">
                              Blocked
                            </span>
                          )}
                        </div>

                        {isManual && !isBlocked && dateKey && !isPast && (
                          <div
                            className="quick-inline mt-2 p-2 rounded"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="d-flex gap-1 align-items-center flex-wrap">
                              <div
                                className="form-floating"
                                style={{ minWidth: 110 }}
                              >
                                <input
                                  type="time"
                                  className="form-control form-control-sm"
                                  value={
                                    (quickRanges[dateKey] &&
                                      quickRanges[dateKey].start) ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    changeQuickRangeField(
                                      dateKey,
                                      "start",
                                      e.target.value
                                    )
                                  }
                                  aria-label={`Start time for ${dateKey}`}
                                />
                                <label
                                  style={{ fontSize: "0.7rem", paddingLeft: 6 }}
                                >
                                  Start
                                </label>
                              </div>

                              <div
                                className="form-floating"
                                style={{ minWidth: 110 }}
                              >
                                <input
                                  type="time"
                                  className="form-control form-control-sm"
                                  value={
                                    (quickRanges[dateKey] &&
                                      quickRanges[dateKey].end) ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    changeQuickRangeField(
                                      dateKey,
                                      "end",
                                      e.target.value
                                    )
                                  }
                                  aria-label={`End time for ${dateKey}`}
                                />
                                <label
                                  style={{ fontSize: "0.7rem", paddingLeft: 6 }}
                                >
                                  End
                                </label>
                              </div>

                              <div style={{ minWidth: 120 }}>
                                <label
                                  className="form-label mb-1 small"
                                  style={{ fontSize: "0.75rem" }}
                                >
                                  Duration (min)
                                </label>
                                <div className="d-flex gap-1 align-items-center">
                                  <select
                                    className="form-select form-select-sm"
                                    value={
                                      quickRanges[dateKey] &&
                                        quickRanges[dateKey].durationMode ===
                                        "preset"
                                        ? quickRanges[dateKey].duration
                                        : "custom"
                                    }
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === "custom") {
                                        changeQuickRangeField(
                                          dateKey,
                                          "durationMode",
                                          "custom"
                                        );
                                        changeQuickRangeField(
                                          dateKey,
                                          "customDuration",
                                          ""
                                        );
                                      } else {
                                        changeQuickRangeField(
                                          dateKey,
                                          "durationMode",
                                          "preset"
                                        );
                                        changeQuickRangeField(
                                          dateKey,
                                          "duration",
                                          Number(val)
                                        );
                                      }
                                    }}
                                    aria-label={`Duration selector for ${dateKey}`}
                                  >
                                    {defaultDurations.map((d) => (
                                      <option key={d} value={d}>
                                        {d} min
                                      </option>
                                    ))}
                                    <option value="custom">Custom</option>
                                  </select>

                                  {quickRanges[dateKey] &&
                                    quickRanges[dateKey].durationMode ===
                                    "custom" && (
                                      <input
                                        type="number"
                                        min={1}
                                        className="form-control form-control-sm"
                                        style={{ width: 80 }}
                                        placeholder="mins"
                                        value={
                                          quickRanges[dateKey].customDuration ||
                                          ""
                                        }
                                        onChange={(e) =>
                                          changeQuickRangeField(
                                            dateKey,
                                            "customDuration",
                                            e.target.value
                                          )
                                        }
                                        aria-label={`Custom duration for ${dateKey}`}
                                      />
                                    )}
                                </div>
                              </div>

                              <div>
                                <button
                                  className="btn btn-sm btn-primary"
                                  style={{ backgroundColor: selectedClinic.color, borderColor: selectedClinic.color }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addQuickRangeToDate(
                                      year,
                                      month,
                                      day,
                                      dateKey
                                    );
                                  }}
                                  title={`Add time range to this date at ${selectedClinic.name}`}
                                >
                                  Add Time
                                </button>
                              </div>
                            </div>

                            <div className="mt-2 small text-muted">
                              <small>
                                Quick add: adds date-specific range (overrides weekday ranges for this date).
                              </small>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getRangesForDateOrWeek = (year, month, day) => {
    const dateKey = formatDateKey(year, month, day);
    const dateInfo = availabilityDateMap[dateKey] || {};
    if (dateInfo.blocked) return [];
    const dateRanges = dateInfo.ranges || [];
    if (dateRanges.length) return dateRanges;
    const weekday = new Date(year, month, day).getDay();
    return availabilityWeekdayMap[weekday] || [];
  };

  const openEditorForDate = (year, month, day) => {
    if (isPastDate(year, month, day)) {
      alert("Cannot edit past dates");
      return;
    }
    const dateKey = formatDateKey(year, month, day);
    setEditingTarget({ type: "date", key: dateKey, year, month, day });
    setNewRange({ start: "", end: "", duration: 15 });
    setUnavailableReason(availabilityDateMap[dateKey]?.reason || "");
    setUnavailableError("");
    setSelectedDays([day]);
  };

  const openEditorForWeekday = (weekdayIdx) => {
    setEditingTarget({ type: "weekday", key: weekdayIdx });
    setNewRange({ start: "", end: "", duration: 15 });
  };

  const createRangePayload = (range, target = editingTarget) => ({
    doctor_id: doctorId,
    clinic_id: String(selectedClinic.id),
    ...(target?.type === "date"
      ? { date: target.key }
      : { weekday: Number(target?.key) }),
    start_time: normalizeTimeValue(range.start),
    end_time: normalizeTimeValue(range.end),
    slot_duration: Number(range.duration || 15),
  });

  const persistRange = async (range, target = editingTarget) => {
    if (!isRealClinicId(selectedClinic?.id)) {
      const error = new Error("Please select a clinic loaded from the API before adding availability.");
      setApiError(error.message);
      throw error;
    }

    const clientId = `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const fallbackRange = normalizeRange({
      ...range,
      id: clientId,
      clientId,
      clinic_id: selectedClinic.id,
      ...(target?.type === "date" ? { date: target.key } : { weekday: target?.key }),
    });

    try {
      const response = await axios.post(
        `${AVAILABILITY_BASE_URL}/ranges`,
        createRangePayload(range, target),
        { headers: getAuthHeaders() }
      );
      const created =
        response.data?.range ||
        response.data?.data?.range ||
        response.data?.existingRanges?.[0] ||
        response.data?.data?.existingRanges?.[0] ||
        response.data?.data ||
        response.data ||
        {};
      return normalizeRange({
        ...created,
        id: created.id || created.range_id || created._id || fallbackRange.id,
        clientId: created.clientId || created.client_id || fallbackRange.clientId,
        date: normalizeDateKey(
          created.date || created.available_date || created.availability_date || fallbackRange.date
        ),
        weekday: normalizeWeekday(
          created.weekday ?? created.day_of_week ?? created.week_day ?? fallbackRange.weekday
        ),
        start: normalizeTimeValue(
          created.start || created.start_time || created.startTime || fallbackRange.start
        ),
        end: normalizeTimeValue(
          created.end || created.end_time || created.endTime || fallbackRange.end
        ),
        duration: Number(created.duration || created.slot_duration || fallbackRange.duration || 15),
        clinic_id: selectedClinic.id,
      });
    } catch (error) {
      setApiError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Availability range could not be saved to the backend."
      );
      throw error;
    }
  };

  const saveRange = async () => {
    if (!newRange.start || !newRange.end)
      return alert("Start and End time required");

    // Check if editing a date (not weekday)
    if (editingTarget.type === "date") {
      // Check if the time is in the past
      const [sh, sm] = newRange.start.split(":").map(Number);
      if (
        isPastDateTime(
          editingTarget.year,
          editingTarget.month,
          editingTarget.day,
          sh,
          sm
        )
      ) {
        return alert("Cannot add time in the past");
      }
    }

    const [sh, sm] = newRange.start.split(":").map(Number);
    const [eh, em] = newRange.end.split(":").map(Number);
    const sMinutes = sh * 60 + sm;
    const eMinutes = eh * 60 + em;
    if (!(eMinutes > sMinutes))
      return alert("End time must be after Start time");

    const existingRanges =
      editingTarget.type === "date"
        ? availabilityDateMap[editingTarget.key]?.ranges || []
        : availabilityWeekdayMap[editingTarget.key] || [];
    const conflict = getRangeConflict(newRange, existingRanges);
    if (conflict) return alert(conflict);

    try {
      const savedRange = await persistRange(newRange);

      if (editingTarget.type === "date") {
      setAvailabilityDateMap((prev) => {
        const prevInfo = prev[editingTarget.key]
          ? { ...prev[editingTarget.key] }
          : { ranges: [], blocked: false };
        const arr = prevInfo.ranges ? [...prevInfo.ranges] : [];
        arr.push(savedRange);
        const next = {
          ...prev,
          [editingTarget.key]: {
            ...prevInfo,
            ranges: sortAvailabilityRanges(arr),
            blocked: false,
          },
        };
        saveLocalAvailability(getAllLocalRanges(next, availabilityWeekdayMap), next);
        return next;
      });
    } else {
      const w = editingTarget.key;
      setAvailabilityWeekdayMap((prev) => {
        const arr = prev[w] ? [...prev[w]] : [];
        arr.push(savedRange);
        const next = { ...prev, [w]: sortAvailabilityRanges(arr) };
        saveLocalAvailability(getAllLocalRanges(availabilityDateMap, next), availabilityDateMap);
        return next;
      });
    }
    // Don't clear the form, allow adding multiple ranges
    setNewRange({ start: "", end: "", duration: 15 });
    } catch (error) {
      alert(error.response?.data?.message || error.response?.data?.error || "Failed to save availability range");
    }
  };

  const saveAndClose = () => {
    setEditingTarget(null);
  };

  const removeRange = async (index) => {
    if (!editingTarget) return;

    if (editingTarget.type === "date") {
      // Check if it's a past date
      if (
        isPastDate(editingTarget.year, editingTarget.month, editingTarget.day)
      ) {
        return alert("Cannot modify past dates");
      }

      const info = availabilityDateMap[editingTarget.key] || { ranges: [], blocked: false };
      const range = (info.ranges || [])[index];
      if (range?.id) {
        try {
          await axios.delete(`${AVAILABILITY_BASE_URL}/ranges/${range.id}`, { headers: getAuthHeaders() });
        } catch (error) {
          return alert(error.response?.data?.message || error.response?.data?.error || "Failed to delete range");
        }
      }

      setAvailabilityDateMap((prev) => {
        const info = prev[editingTarget.key] || { ranges: [], blocked: false };
        const arr = (info.ranges || []).filter((_, i) => i !== index);
        return {
          ...prev,
          [editingTarget.key]: { ranges: arr, blocked: info.blocked || false },
        };
      });
    } else {
      const w = editingTarget.key;
      const range = (availabilityWeekdayMap[w] || [])[index];
      if (range?.id) {
        try {
          await axios.delete(`${AVAILABILITY_BASE_URL}/ranges/${range.id}`, { headers: getAuthHeaders() });
        } catch (error) {
          return alert(error.response?.data?.message || error.response?.data?.error || "Failed to delete range");
        }
      }

      setAvailabilityWeekdayMap((prev) => {
        const arr = (prev[w] || []).filter((_, i) => i !== index);
        const next = { ...prev, [w]: arr };
        saveLocalAvailability(getAllLocalRanges(availabilityDateMap, next), availabilityDateMap);
        return next;
      });
    }
  };

  const toggleBlockDate = async (dateKey, year, month, day) => {
    if (isPastDate(year, month, day)) {
      alert("Cannot modify past dates");
      return;
    }

    if (savingUnavailable || !selectedClinic?.id) return;
    const currentlyBlocked = Boolean(availabilityDateMap[dateKey]?.blocked);
    const globalBlocked = Boolean(availabilityDateMap[dateKey]?.globalBlocked);
    setSavingUnavailable(true);
    setUnavailableError("");
    try {
      const data = { doctor_id: doctorId, clinic_id: selectedClinic.id, date: dateKey, ...(globalBlocked ? { scope: "all" } : {}) };
      if (currentlyBlocked) {
        await axios.delete(`${AVAILABILITY_BASE_URL}/unavailable`, { headers: getAuthHeaders(), data });
      } else {
        await axios.post(`${AVAILABILITY_BASE_URL}/unavailable`, data, { headers: getAuthHeaders() });
      }
      setApiError("");
      setAvailabilityDateMap(prev => {
        const info = prev[dateKey] || { ranges: [], blocked: false };
        const next = { ...prev, [dateKey]: { ...info, blocked: !currentlyBlocked, globalBlocked: false, reason: "" } };
        saveLocalAvailability(getAllLocalRanges(next), next);
        return next;
      });
      setSlotPreview([]);
    } catch (error) {
      setUnavailableError(error.response?.data?.message || "Availability could not be saved. Please try again.");
    } finally {
      setSavingUnavailable(false);
    }
  };

  const removeAllRangesForDate = async (dateKey, year, month, day) => {
    if (isPastDate(year, month, day)) {
      alert("Cannot modify past dates");
      return;
    }

    try {
      await axios.delete(`${AVAILABILITY_BASE_URL}/clear-date`, {
        headers: getAuthHeaders(),
        data: { doctor_id: doctorId, clinic_id: selectedClinic.id, date: dateKey },
      });
    } catch (error) {
      return alert(error.response?.data?.message || error.response?.data?.error || "Failed to clear date ranges");
    }

    setAvailabilityDateMap((prev) => {
      const info = prev[dateKey] || {};
      return {
        ...prev,
        [dateKey]: { ranges: [], blocked: info.blocked || false },
      };
    });
  };

  const generateSlotsForRange = (year, month, day, range) => {
    if (!range?.start || !range?.end) return [];
    const [sh, sm] = range.start.split(":").map(Number);
    const [eh, em] = range.end.split(":").map(Number);
    let start = new Date(year, month, day, sh, sm);
    const end = new Date(year, month, day, eh, em);
    const res = [];
    const duration = Number(range.duration || 15);
    while (start.getTime() + duration * 60000 <= end.getTime()) {
      const hh = String(start.getHours()).padStart(2, "0");
      const mm = String(start.getMinutes()).padStart(2, "0");
      const clinic = clinics.find(c => String(c.id) === String(range.clinicId)) || selectedClinic;
      res.push({
        time: `${hh}:${mm}`,
        clinicId: clinic.id,
        clinicName: clinic.name,
        clinicColor: clinic.color
      });
      start = new Date(start.getTime() + duration * 60000);
    }
    return res;
  };

  const buildLocalSlotPreview = () => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const totalDays = getDaysInMonth(month, year);

    const final = [];

    const dateSet = new Set();
    for (let d = 1; d <= totalDays; d++) {
      const dateKey = formatDateKey(year, month, d);
      const weekday = new Date(year, month, d).getDay();
      const isBlocked = Boolean(availabilityDateMap[dateKey]?.blocked);
      const dateRanges = availabilityDateMap[dateKey]?.ranges || [];
      const weeklyRanges = availabilityWeekdayMap[weekday] || [];
      if (isBlocked || dateRanges.length || weeklyRanges.length) {
        dateSet.add(d);
      }
    }

    Array.from(dateSet)
      .sort((a, b) => a - b)
      .forEach((d) => {
        const dateKey = formatDateKey(year, month, d);
        const dateInfo = availabilityDateMap[dateKey] || {};
        if (dateInfo.blocked) {
          final.push({
            date: dateKey,
            slots: [],
            blocked: true,
            reason: dateInfo.reason || "Doctor unavailable",
          });
          return;
        }

        const ranges =
          dateInfo.ranges && dateInfo.ranges.length
            ? dateInfo.ranges
            : availabilityWeekdayMap[new Date(year, month, d).getDay()] || [];

        // Filter ranges to only include slots for the selected clinic
        // The ranges endpoint does not always echo clinic_id. Those records have
        // already been scoped by the request, so keep them for the selected clinic.
        const filteredRanges = ranges.filter(
          (range) => !range.clinicId || String(range.clinicId) === String(selectedClinic.id)
        );

        const slots = [];
        filteredRanges.forEach((r) => {
          slots.push(...generateSlotsForRange(year, month, d, r));
        });

        if (slots.length) {
          final.push({ date: dateKey, slots });
        }
      });

    return final;
  };

  const generateAllSlots = async () => {
    const preview = buildLocalSlotPreview()
      .map((entry) => ({
        ...entry,
        slots: Array.from(
          new Map((entry.slots || []).map((slot) => [slot.time, slot])).values()
        ).sort((a, b) => a.time.localeCompare(b.time)),
      }))
      .filter((entry) => entry.blocked || entry.slots.length > 0)
      .sort((a, b) => a.date.localeCompare(b.date));

    setSlotPreview(preview);
    if (!preview.length) {
      alert(`No valid time ranges found for ${selectedClinic?.name || "the selected hospital"}. Please add Start Time, End Time and Slot Duration first.`);
    }
  };

  const clearAll = async () => {
    if (!window.confirm("Clear selected days, weekdays and availability?"))
      return;

    try {
      await axios.delete(`${AVAILABILITY_BASE_URL}/clear-all`, {
        headers: getAuthHeaders(),
        data: { doctor_id: doctorId, clinic_id: selectedClinic.id },
      });
    } catch (error) {
      return alert(error.response?.data?.message || error.response?.data?.error || "Failed to clear availability");
    }

    setSelectedDays([]);
    setRecurringWeekdays([]);
    setAvailabilityDateMap((current) => Object.fromEntries(
      Object.entries(current).filter(([, value]) => value.blocked).map(([date, value]) => [date, { ...value, ranges: [] }])
    ));
    setAvailabilityWeekdayMap({});
    setSlotPreview([]);
    setEditingTarget(null);
    setQuickRanges({});
    setAdditionalTime({
      start: "",
      end: "",
      duration: 15,
      durationMode: "preset",
      customDuration: "",
    });
    setShowAddTimeModal(false);
  };

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const monthName = currentDate.toLocaleString("en-US", { month: "long" });
  const monthDays = getDaysInMonth(month, year);
  const firstDayIndex = new Date(year, month, 1).getDay();
  const previousMonthDays = getDaysInMonth(month === 0 ? 11 : month - 1, month === 0 ? year - 1 : year);
  const calendarCells = [
    ...Array.from({ length: firstDayIndex }, (_, index) => ({
      day: previousMonthDays - firstDayIndex + index + 1,
      muted: true,
    })),
    ...Array.from({ length: monthDays }, (_, index) => ({
      day: index + 1,
      muted: false,
    })),
  ];
  while (calendarCells.length % 7 !== 0) {
    calendarCells.push({ day: calendarCells.length - firstDayIndex - monthDays + 1, muted: true });
  }
  const visibleCalendarCells = calendarCells;
  const selectedDateLabel = selectedDays.length
    ? `${monthName} ${selectedDays[0]}, ${year}`
    : `${monthName} ${new Date().getDate()}, ${year}`;
  const configuredDatesCount = Object.values(availabilityDateMap).filter((item) => item?.ranges?.length).length;
  const recurringConfiguredCount = Object.values(availabilityWeekdayMap).filter((ranges) => ranges?.length).length;
  const visibleSlotPreview = slotPreview.filter((entry) => {
    const dateInfo = availabilityDateMap[entry.date] || {};
    if (activeCalendarTab === "unavailable") return Boolean(entry.blocked || dateInfo.blocked);
    if (activeCalendarTab === "specific") {
      return !entry.blocked && Boolean(dateInfo.ranges?.length);
    }
    const date = new Date(`${entry.date}T00:00:00`);
    const weekday = Number.isNaN(date.getTime()) ? undefined : date.getDay();
    return (
      !entry.blocked &&
      !dateInfo.ranges?.length &&
      weekday !== undefined &&
      Boolean(availabilityWeekdayMap[weekday]?.length)
    );
  });

  return (
    <div className="doctor-calendar-root calendar-portal">
      <header className="calendar-portal-header">
        <div>
          <h1>Calendar & Availability</h1>
          <p>Recurring & date-specific availability</p>
        </div>
        <div className="calendar-header-actions">
          <div className="calendar-clinic-select">
            <button type="button" onClick={() => setShowClinicDropdown((open) => !open)}>
              <i className="fa-solid fa-square-plus"></i>
              {selectedClinic?.name || "Main Hospital"}
              <i className="fa-solid fa-chevron-down"></i>
            </button>
            {showClinicDropdown && (
              <div className="calendar-clinic-menu">
                {clinics.map((clinic) => (
                  <button
                    type="button"
                    key={clinic.id}
                    className={String(selectedClinic?.id) === String(clinic.id) ? "active" : ""}
                    onClick={() => {
                      setSelectedClinic(clinic);
                      // Never leave the previous clinic's availability visible
                      // while the newly selected clinic is being loaded.
                      setAvailabilityDateMap({});
                      setAvailabilityWeekdayMap({});
                      setSelectedDays([]);
                      setRecurringWeekdays([]);
                      setSlotPreview([]);
                      setEditingTarget(null);
                      setShowClinicDropdown(false);
                    }}
                  >
                    <span style={{ backgroundColor: clinic.color }}></span>
                    <div>
                      <strong>{clinic.name}</strong>
                      <small>{clinic.location}</small>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="button" className="calendar-clear-btn" onClick={clearAll}>Clear All</button>
        </div>
      </header>

      <nav className="calendar-tabs" role="tablist" aria-label="Availability type">
        <button
          type="button"
          role="tab"
          aria-selected={activeCalendarTab === "recurring"}
          className={activeCalendarTab === "recurring" ? "active" : ""}
          onClick={() => setActiveCalendarTab("recurring")}
        >
          Recurring Schedule
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeCalendarTab === "specific"}
          className={activeCalendarTab === "specific" ? "active" : ""}
          onClick={() => setActiveCalendarTab("specific")}
        >
          Specific Dates
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeCalendarTab === "unavailable"}
          className={activeCalendarTab === "unavailable" ? "active" : ""}
          onClick={() => setActiveCalendarTab("unavailable")}
        >
          Exceptions / Unavailable
        </button>
      </nav>

      <p className="calendar-tab-help" role="status">
        {activeCalendarTab === "recurring" && "Select weekdays to create a schedule that repeats every week."}
        {activeCalendarTab === "specific" && "Select a calendar date to add or update slots for that date."}
        {activeCalendarTab === "unavailable" && "Select a calendar date to mark it unavailable or make it available again."}
      </p>

      {apiError && <div className="calendar-api-note">{apiError}</div>}

      <section className="calendar-main-grid">
        <div className="calendar-left-stack">
          <section className="calendar-month-card">
            <div className="calendar-month-header">
              <div className="calendar-month-title">
                <strong>{monthName} {year}</strong>
                <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month">
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <button type="button" onClick={() => changeMonth(1)} aria-label="Next month">
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
              <div className="calendar-legend">
                <span><i className="configured"></i> Configured</span>
                <span><i className="selected"></i> Selected</span>
                <span><i className="empty"></i> Empty</span>
              </div>
            </div>

            <div className="portal-calendar-grid">
              {days.map((day) => (
                <div className="portal-weekday" key={day}>{day.toUpperCase()}</div>
              ))}
              {visibleCalendarCells.map((cell, index) => {
                const dateKey = !cell.muted ? formatDateKey(year, month, cell.day) : "";
                const isSelected = !cell.muted && selectedDays.includes(cell.day);
                const weekday = !cell.muted ? new Date(year, month, cell.day).getDay() : null;
                const dateInfo = !cell.muted ? availabilityDateMap[dateKey] || {} : {};
                const recurringRanges = !cell.muted ? availabilityWeekdayMap[weekday] || [] : [];
                const isBlocked = Boolean(dateInfo.blocked);
                const isRecurring = !cell.muted && (recurringWeekdays.includes(weekday) || recurringRanges.length > 0);
                const specificRangeCount = (dateInfo.ranges || []).length;
                const recurringRangeCount = recurringRanges.length;
                const isConfigured =
                  !cell.muted &&
                  (activeCalendarTab === "specific"
                    ? specificRangeCount > 0
                    : activeCalendarTab === "recurring"
                      ? recurringRangeCount > 0
                      : isBlocked);
                const isPast = !cell.muted && isPastDate(year, month, cell.day);
                const rangeCount =
                  activeCalendarTab === "specific"
                    ? specificRangeCount
                    : activeCalendarTab === "recurring"
                      ? recurringRangeCount
                      : 0;
                const tabSelected =
                  activeCalendarTab === "recurring"
                    ? recurringWeekdays.includes(weekday)
                    : isSelected;

                return (
                  <button
                    type="button"
                    key={`${cell.day}-${index}`}
                    className={[
                      "portal-day-cell",
                      cell.muted ? "muted" : "",
                      tabSelected ? "selected" : "",
                      isConfigured ? "configured" : "",
                      activeCalendarTab === "recurring" && isRecurring ? "recurring" : "",
                      activeCalendarTab === "unavailable" && isBlocked ? "unavailable" : "",
                      isPast ? "past" : "",
                    ].join(" ")}
                    onClick={() => {
                      if (cell.muted || isPast) return;
                      if (activeCalendarTab === "recurring") {
                        toggleRecurringWeekday(weekday);
                        return;
                      }
                      openEditorForDate(year, month, cell.day);
                    }}
                    disabled={cell.muted || isPast}
                  >
                    <span>{cell.day}</span>
                    {activeCalendarTab === "unavailable" && isBlocked && (
                      <em className="unavailable-label">Unavailable</em>
                    )}
                    {activeCalendarTab !== "unavailable" && rangeCount > 0 && (
                      <em>{rangeCount} ranges</em>
                    )}
                    {activeCalendarTab === "recurring" && tabSelected && rangeCount === 0 && (
                      <em>Weekly selected</em>
                    )}
                    {activeCalendarTab === "recurring" && isRecurring && (
                      <small>{selectedClinic?.name}</small>
                    )}
                    {!cell.muted && !tabSelected && !isConfigured && (
                      <small>
                        {activeCalendarTab === "unavailable" ? "Available" : "No timings"}
                      </small>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="calendar-slot-preview">
            <h2>Slot Preview &mdash; {selectedClinic?.name || "Main Hospital"}</h2>
            <div className="slot-preview-box">
              {visibleSlotPreview.length === 0 ? (
                <div className="slot-empty">
                  <i className="fa-regular fa-calendar-minus"></i>
                  <p>No slots generated yet. Configure availability and click <button type="button" onClick={generateAllSlots}>Generate Slots</button> to preview.</p>
                </div>
              ) : (
                <div className="slot-preview-list">
                  {visibleSlotPreview.map((entry, index) => (
                    <article key={`${entry.date}-${index}`}>
                      <strong>{entry.date}</strong>
                      <span>{entry.blocked ? "Unavailable" : `${entry.slots?.length || 0} slots`}</span>
                      {entry.blocked && (
                        <div className="slot-unavailable-message">
                          <i className="fa-solid fa-ban"></i>
                          <small>{entry.reason || "Doctor unavailable"}</small>
                        </div>
                      )}
                      {!entry.blocked && (
                        <div className="slot-time-pills">
                          {entry.slots?.map((slot, slotIndex) => (
                            <small key={`${slot.time}-${slotIndex}`}>{slot.time}</small>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="calendar-side-panel">
          {activeCalendarTab !== "recurring" && (
          <section className="calendar-date-card">
            <div className="side-card-title">
              <div>
                <h3>{activeCalendarTab === "unavailable" ? "Unavailable Dates" : selectedDateLabel}</h3>
                <p>
                  {activeCalendarTab === "unavailable"
                    ? `${Object.values(availabilityDateMap).filter((item) => item?.blocked).length} dates blocked`
                    : `${selectedDays.length || 0} days selected`}
                </p>
              </div>
              <i className="fa-solid fa-ban"></i>
            </div>
            <hr />
            {activeCalendarTab === "unavailable" ? (
              <p className="calendar-empty-note">
                Select a date to stop new bookings at this clinic, or restore its saved timings.
              </p>
            ) : (
              <>
            <h4>Time Ranges</h4>
            {selectedDays.length ? (
              getRangesForDateOrWeek(year, month, selectedDays[0]).length ? (
                getRangesForDateOrWeek(year, month, selectedDays[0]).map((range, index) => (
                  <div className="time-range-row" key={`${range.start}-${index}`}>
                    <i className="fa-regular fa-clock"></i>
                    <span>{range.start || "Start"}</span>
                    <small>&rarr;</small>
                    <span>{range.end || "End"}</span>
                  </div>
                ))
              ) : (
                <p className="calendar-empty-note">No saved ranges for selected date.</p>
              )
            ) : (
              <p className="calendar-empty-note">Click any calendar date to edit availability or mark unavailable.</p>
            )}
            <button type="button" className="add-range-btn" onClick={() => setShowAddTimeModal(true)}>
              <i className="fa-solid fa-plus"></i> Add Another Range
            </button>
            <hr />
            <button type="button" className="apply-selected-btn" onClick={() => setShowAddTimeModal(true)}>
              Apply to Selected Dates
            </button>
              </>
            )}
          </section>
          )}

          {activeCalendarTab === "recurring" && (
          <section className="recurring-rules-card">
            <div className="recurring-title">
              <div>
                <h3>Recurring Rules</h3>
                <p className="weekday-select-label">Select days</p>
              </div>
              <label className="calendar-switch">
                <input type="checkbox" checked readOnly />
                <span></span>
              </label>
            </div>
            <p>Repeat these timings weekly on selected days.</p>
            <div className="weekday-pills">
              {days.map((day, index) => (
                <button
                  type="button"
                  key={day}
                  className={recurringWeekdays.includes(index) ? "active" : ""}
                  onClick={() => toggleRecurringWeekday(index)}
                >
                  {day[0]}
                </button>
              ))}
            </div>
            <button type="button" className="apply-weekdays-btn" onClick={() => setShowAddTimeModal(true)}>
              Apply to weekdays
            </button>
          </section>
          )}
        </aside>
      </section>

      {showAddTimeModal && (
        <div
          className="calendar-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowAddTimeModal(false)}
        >
          <div className="calendar-modal-card calendar-multi-range-card" onClick={(event) => event.stopPropagation()}>
            <div className="calendar-modal-title">
              <div>
                <h3>Add Time Ranges</h3>
                <p>Add separate windows such as morning, afternoon and evening.</p>
              </div>
              <button type="button" onClick={() => setShowAddTimeModal(false)} aria-label="Close">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="calendar-multi-range-list">
              {additionalTimeRows.map((range, index) => (
                <div className="calendar-multi-range-row" key={index}>
                  <div className="calendar-range-number">Range {index + 1}</div>
                  <div className="calendar-modal-grid">
                    <label>
                      Start Time
                      <input
                        type="time"
                        value={range.start}
                        onChange={(event) =>
                          updateAdditionalTimeRow(index, "start", event.target.value)
                        }
                      />
                    </label>
                    <label>
                      End Time
                      <input
                        type="time"
                        value={range.end}
                        onChange={(event) =>
                          updateAdditionalTimeRow(index, "end", event.target.value)
                        }
                      />
                    </label>
                    <label>
                      Slot Duration
                      <select
                        value={range.duration}
                        onChange={(event) =>
                          updateAdditionalTimeRow(index, "duration", event.target.value)
                        }
                      >
                        <option value={10}>10 min</option>
                        <option value={15}>15 min</option>
                        <option value={30}>30 min</option>
                        <option value={45}>45 min</option>
                      </select>
                    </label>
                    <button
                      type="button"
                      className="calendar-remove-range-btn"
                      onClick={() => removeAdditionalTimeRow(index)}
                      disabled={additionalTimeRows.length === 1}
                      aria-label={`Remove time range ${index + 1}`}
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="add-range-btn calendar-add-row-btn"
              onClick={addAdditionalTimeRow}
            >
              <i className="fa-solid fa-plus"></i> Add another time range
            </button>

            <div className="calendar-modal-actions">
              <button type="button" className="save-draft-btn" onClick={() => setShowAddTimeModal(false)}>
                Done
              </button>
              {activeCalendarTab === "recurring" && (
                <button type="button" className="apply-weekdays-btn" onClick={() => saveAdditionalTimeRows("weekday")}>
                  Save all for weekdays
                </button>
              )}
              <button
                type="button"
                className="apply-selected-btn"
                disabled={
                  activeCalendarTab === "recurring"
                    ? recurringWeekdays.length === 0
                    : selectedDays.length === 0
                }
                onClick={() =>
                  activeCalendarTab === "recurring"
                    ? saveAdditionalTimeRows("weekday")
                    : saveAdditionalTimeRows("date")
                }
              >
                {activeCalendarTab === "specific"
                  ? "Save all ranges to dates"
                  : activeCalendarTab === "recurring"
                    ? "Save all ranges to weekdays"
                    : "Save availability ranges"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingTarget?.type === "date" && (
        <div
          className="calendar-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setEditingTarget(null)}
        >
          <div className="calendar-modal-card calendar-unavailable-card" onClick={(event) => event.stopPropagation()}>
            <div className="calendar-modal-title">
              <div>
                <h3>{editingTarget.key}</h3>
                <p>{selectedClinic?.name} availability for this date.</p>
              </div>
              <button type="button" onClick={() => setEditingTarget(null)} aria-label="Close">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="calendar-unavailable-panel">
              <p>Stop new bookings for this date at {selectedClinic?.name}. Your saved timings and existing appointments are kept.</p>
              {availabilityDateMap[editingTarget.key]?.globalBlocked && <p>This date has an all-clinic block. Restoring it removes that block across clinics.</p>}
              {unavailableError && <p role="alert" className="text-danger">{unavailableError}</p>}
              <button
                type="button"
                className={availabilityDateMap[editingTarget.key]?.blocked ? "apply-weekdays-btn" : "calendar-danger-btn"}
                disabled={savingUnavailable || !selectedClinic?.id}
                onClick={() => toggleBlockDate(editingTarget.key, editingTarget.year, editingTarget.month, editingTarget.day)}
              >
                {savingUnavailable ? "Saving..." : availabilityDateMap[editingTarget.key]?.globalBlocked ? "Remove All-Clinic Block" : availabilityDateMap[editingTarget.key]?.blocked ? "Mark Available Again" : "Mark Unavailable for This Date"}
              </button>
              {availabilityDateMap[editingTarget.key]?.blocked && (
                <small className="calendar-unavailable-note">
                  This override applies only to {editingTarget.key}. Weekly availability remains active for other matching days.
                </small>
              )}
            </div>

            {activeCalendarTab === "specific" && (
            <>
            <hr />

            <h4 className="calendar-modal-section-title">Saved Slots</h4>
            <div className="calendar-modal-range-list">
              {(availabilityDateMap[editingTarget.key]?.ranges || []).length ? (
                availabilityDateMap[editingTarget.key].ranges.map((range, index) => (
                  <div className="time-range-row" key={`${range.start}-${range.end}-${index}`}>
                    <i className="fa-regular fa-clock"></i>
                    <span>{range.start}</span>
                    <small>&rarr;</small>
                    <span>{range.end}</span>
                    <button type="button" onClick={() => removeRange(index)} aria-label="Remove range">
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                ))
              ) : (
                <p className="calendar-empty-note">No date-specific slots. Weekly slots may still apply unless this date is unavailable.</p>
              )}
            </div>

            {!availabilityDateMap[editingTarget.key]?.blocked && (
              <>
                <h4 className="calendar-modal-section-title">Add Slot for This Date</h4>
                <div className="calendar-modal-grid">
                  <label>
                    Start Time
                    <input
                      type="time"
                      value={newRange.start}
                      onChange={(event) => setNewRange((prev) => ({ ...prev, start: event.target.value }))}
                    />
                  </label>
                  <label>
                    End Time
                    <input
                      type="time"
                      value={newRange.end}
                      onChange={(event) => setNewRange((prev) => ({ ...prev, end: event.target.value }))}
                    />
                  </label>
                  <label>
                    Slot Duration
                    <select
                      value={newRange.duration}
                      onChange={(event) => setNewRange((prev) => ({ ...prev, duration: Number(event.target.value) }))}
                    >
                      {defaultDurations.map((duration) => (
                        <option value={duration} key={duration}>{duration} min</option>
                      ))}
                    </select>
                  </label>
                </div>
              </>
            )}
            </>
            )}

            <div className="calendar-modal-actions">
              <button type="button" className="save-draft-btn" onClick={() => setEditingTarget(null)}>
                Close
              </button>
              {activeCalendarTab === "specific" && !availabilityDateMap[editingTarget.key]?.blocked && (
                <button
                  type="button"
                  className="apply-selected-btn calendar-save-slot-btn"
                  onClick={saveRange}
                  disabled={!newRange.start || !newRange.end}
                >
                  Save Slot
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="calendar-bottom-bar">
        <div className="calendar-status-meta">
          <span><i className="selected"></i> Selected dates: {selectedDays.length}</span>
          <span><i className="configured"></i> Configured dates: {configuredDatesCount}</span>
          <span><i className="configured"></i> Weekly days: {recurringConfiguredCount}</span>
          <span className="pending"><i></i> Pending changes: {selectedDays.length ? 2 : 0}</span>
        </div>
        <div className="calendar-bottom-actions">
          <button type="button" className="clear-preview-btn" onClick={() => setSlotPreview([])}>Clear Preview</button>
          <button type="button" className="save-draft-btn">Save Draft</button>
          <button type="button" className="generate-slots-btn" onClick={generateAllSlots}>
            <i className="fa-solid fa-bolt"></i> Generate Slots
          </button>
        </div>
      </footer>
    </div>
  );

  return (
    <div className="p-4 doctor-calendar-root">

      <div className="header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-3">
        <div style={{ display: "grid" }}>
          <h2 className="mb-3" >Calendar</h2>
          <small className="text-muted">
            Recurring & date-specific availability — Modern Blue Theme
          </small>
          <div className="mt-1">
            <small className="text-danger">
              <strong>Note:</strong> Past dates cannot be edited or selected.
            </small>
          </div>
        </div>

        <div className="d-flex gap-2 align-items-center">
          {/* Clinic Dropdown */}
          <div className="dropdown" style={{ position: "relative" }}>
            <button
              className="btn btn-outline-primary d-flex align-items-center gap-2"
              onClick={() => setShowClinicDropdown(!showClinicDropdown)}
              style={{
                backgroundColor: selectedClinic.color + "20",
                borderColor: selectedClinic.color,
                color: selectedClinic.color
              }}
              aria-expanded={showClinicDropdown}
              aria-haspopup="true"
            >
              <div
                className="rounded-circle"
                style={{
                  width: "12px",
                  height: "12px",
                  backgroundColor: selectedClinic.color
                }}
              />
              <span>{selectedClinic.name}</span>
              <span className="text-muted small">({selectedClinic.location})</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d={showClinicDropdown ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {showClinicDropdown && (
              <div
                className="dropdown-menu show p-3 shadow-lg"
                style={{
                  position: "absolute",
                  right: 0,
                  minWidth: "300px",
                  zIndex: 1001
                }}
              >
                <h6 className="mb-3">Select Clinic</h6>
                <div className="clinic-list mb-3" style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {clinics.map(clinic => (
                    <div
                      key={clinic.id}
                      className={`clinic-item p-2 mb-1 rounded ${selectedClinic.id === clinic.id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedClinic(clinic);
                        setShowClinicDropdown(false);
                      }}
                      style={{
                        cursor: "pointer",
                        backgroundColor: selectedClinic.id === clinic.id ? clinic.color + "20" : "transparent",
                        border: selectedClinic.id === clinic.id ? `1px solid ${clinic.color}` : "1px solid #dee2e6"
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle"
                            style={{
                              width: "12px",
                              height: "12px",
                              backgroundColor: clinic.color
                            }}
                          />
                          <div>
                            <strong style={{ color: clinic.color }}>{clinic.name}</strong>
                            <div className="small text-muted">{clinic.location}</div>
                          </div>
                        </div>
                        <div>
                          {selectedClinic.id === clinic.id && (
                            <span className="badge" style={{ backgroundColor: clinic.color }}>Selected</span>
                          )}
                          
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-danger" onClick={clearAll}>
              Clear All
            </button>
          </div>
        </div>
      </div>

      {apiStatus === "loading" && (
        <div className="alert alert-info py-2">Loading clinics and availability...</div>
      )}
      {apiError && (
        <div className="alert alert-danger py-2">{apiError}</div>
      )}

      <div className="weekday-bar d-flex justify-content-between gap-2 mb-2">
        {days.map((d, i) => (
          <button
            key={d}
            className={`btn btn-sm weekday-btn ${recurringWeekdays.includes(i) ? "active" : ""
              }`}
            onClick={() => toggleRecurringWeekday(i)}
            onDoubleClick={() => openEditorForWeekday(i)}
            title="Click to toggle recurring weekday. Double-click to edit weekday ranges."
            aria-pressed={recurringWeekdays.includes(i)}
          >
            {d}
          </button>
        ))}
        <button
          className="btn btn-primary gap-2"
          onClick={() => setShowAddTimeModal(true)}
          style={{ backgroundColor: selectedClinic.color, borderColor: selectedClinic.color }}
        >
          <div
            className="rounded-circle d-inline-block me-1"
            style={{
              width: "8px",
              height: "8px",
              backgroundColor: "white"
            }}
          />
          Add Timing to Selected
        </button>
      </div>

      <div
        className="nav-controls btn-group mt-4"
        role="group"
        aria-label="Month navigation"
        style={{ width: "500px", justifyContent: "center", alignItems: "center" }}
      >
        <button
          className="btn btn-outline-primary"
          onClick={() => changeMonth(-1)}
          style={{ boxShadow: "none" }}
          aria-label="Previous month"

        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="ms-2 d-none d-sm-inline">Prev</span>
        </button>
        <div className="month-title text-center px-3 mt-2">
          <strong>
            {currentDate.toLocaleString("default", { month: "long" })}{" "}
            {currentDate.getFullYear()}
          </strong>
        </div>
        <button
          className="btn btn-outline-primary"
          onClick={() => changeMonth(1)}
          style={{ boxShadow: "none" }}
          aria-label="Next month"
        >
          <span className="me-2 d-none d-sm-inline">Next</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="days-row d-md-grid mb-1 mt-5">
        {days.map((d) => (
          <div key={d} className="text-center fw-bold">
            {d}
          </div>
        ))}
      </div>

      {renderCalendar()}

      <div className="mt-4 p-3 bg-light rounded controls-card shadow-sm">
        <div className="d-flex justify-content-between align-items-center flex-column flex-md-row gap-2">
          <div>
            <h6 className="m-0">Quick Actions</h6>
            <small className="text-muted d-block">
              Click a date cell to open the editor. Add ranges, mark
              unavailable, or remove ranges. Or use inline Add Time on selected
              days.
            </small>
            <small className="text-danger">
              <strong>Note:</strong> Past dates are grayed out and cannot be
              edited.
            </small>
          </div>

          <div className="d-flex gap-2">
            <button
              className="btn btn-primary"
              onClick={generateAllSlots}
              style={{ backgroundColor: selectedClinic.color, borderColor: selectedClinic.color }}
            >
              Generate Slots for {selectedClinic.name}
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => setSlotPreview([])}
            >
              Clear Preview
            </button>
          </div>
        </div>
        <div className="mt-2">
          <small className="text-primary">
            <strong>Note:</strong> Generating slots will only show appointments for the currently selected clinic ({selectedClinic.name}).
          </small>
        </div>
      </div>

      <div className="mt-4">
        <h5>
          Slot Preview - {selectedClinic.name}
          <span
            className="badge ms-2"
            style={{
              backgroundColor: selectedClinic.color,
              color: "white",
              fontSize: "0.7em"
            }}
          >
            Current Clinic
          </span>
        </h5>
        {slotPreview.length === 0 ? (
          <p className="text-muted">No slots generated yet for {selectedClinic.name}.</p>
        ) : (
          <div className="row">
            {slotPreview.map((e, i) => (
              <div key={i} className="col-12 col-md-4 mb-2">
                <div className="p-3 border rounded slot-card">
                  <div className="d-flex justify-content-between align-items-start">
                    <strong>{e.date}</strong>
                    {e.blocked ? (
                      <span className="text-danger small">Unavailable</span>
                    ) : (
                      <span className="text-muted small">
                        {e.slots.length} slots for {selectedClinic.name}
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    {e.blocked ? (
                      <em className="text-danger">Date marked unavailable</em>
                    ) : e.slots.length ? (
                      <div className="slot-list">
                        {e.slots.map((slot, idx) => (
                          <span
                            key={idx}
                            className="badge me-1 mb-1"
                            style={{
                              backgroundColor: slot.clinicColor,
                              color: "white"
                            }}
                            title={`Clinic: ${slot.clinicName}`}
                          >
                            {slot.time}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <em className="text-muted">No slots for {selectedClinic.name} on this date</em>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Time Modal */}
      {showAddTimeModal && (
        <div
          className="add-time-modal position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-start p-4"
          style={{ zIndex: 1000, backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          onClick={() => setShowAddTimeModal(false)}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="card shadow-lg"
            style={{ width: "500px", maxWidth: "95%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="card-header text-white"
              style={{ backgroundColor: selectedClinic.color }}
            >
              <h5 className="mb-0 d-flex align-items-center">
                <div
                  className="rounded-circle me-2"
                  style={{
                    width: "12px",
                    height: "12px",
                    backgroundColor: "white"
                  }}
                />
                Add Timing to Selected - {selectedClinic.name}
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  className="form-control"
                  value={additionalTime.start}
                  onChange={(e) =>
                    setAdditionalTime((prev) => ({
                      ...prev,
                      start: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="mb-3">
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  className="form-control"
                  value={additionalTime.end}
                  onChange={(e) =>
                    setAdditionalTime((prev) => ({
                      ...prev,
                      end: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Duration (minutes)</label>
                <div className="d-flex gap-2 align-items-center">
                  <select
                    className="form-select"
                    value={
                      additionalTime.durationMode === "preset"
                        ? additionalTime.duration
                        : "custom"
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "custom") {
                        setAdditionalTime((prev) => ({
                          ...prev,
                          durationMode: "custom",
                          customDuration: "",
                        }));
                      } else {
                        setAdditionalTime((prev) => ({
                          ...prev,
                          durationMode: "preset",
                          duration: Number(val),
                        }));
                      }
                    }}
                  >
                    {defaultDurations.map((d) => (
                      <option key={d} value={d}>
                        {d} min
                      </option>
                    ))}
                    <option value="custom">Custom</option>
                  </select>

                  {additionalTime.durationMode === "custom" && (
                    <input
                      type="number"
                      min={1}
                      className="form-control"
                      style={{ width: 100 }}
                      placeholder="mins"
                      value={additionalTime.customDuration}
                      onChange={(e) =>
                        setAdditionalTime((prev) => ({
                          ...prev,
                          customDuration: e.target.value,
                        }))
                      }
                    />
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex gap-2 align-items-center justify-content-between">
                  <div className="small text-muted">
                    <div>
                      <strong>Selected Clinic:</strong> {selectedClinic.name} ({selectedClinic.location})
                    </div>
                    <div>
                      <strong>Selected Days:</strong>{" "}
                      {selectedDays.length > 0
                        ? selectedDays.join(", ")
                        : "None"}
                    </div>
                    <div>
                      <strong>Recurring Weekdays:</strong>{" "}
                      {recurringWeekdays.length > 0
                        ? recurringWeekdays.map((w) => days[w]).join(", ")
                        : "None"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-grid gap-2">
                <button
                  className="btn btn-primary"
                  onClick={addAdditionalTiming}
                  disabled={
                    !additionalTime.start ||
                    !additionalTime.end ||
                    selectedDays.length === 0
                  }
                  style={{ backgroundColor: selectedClinic.color, borderColor: selectedClinic.color }}
                >
                  Add to Selected Days ({selectedDays.length})
                </button>

                <button
                  className="btn btn-success"
                  onClick={addAdditionalTimingToWeekdays}
                  disabled={
                    !additionalTime.start ||
                    !additionalTime.end ||
                    recurringWeekdays.length === 0
                  }
                  style={{ backgroundColor: selectedClinic.color + "CC", borderColor: selectedClinic.color }}
                >
                  Add to Recurring Weekdays ({recurringWeekdays.length})
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={async () => {
                    if (selectedDays.length > 0) await addAdditionalTiming();
                    if (recurringWeekdays.length > 0) await addAdditionalTimingToWeekdays();
                  }}
                  disabled={
                    !additionalTime.start ||
                    !additionalTime.end ||
                    (selectedDays.length === 0 &&
                      recurringWeekdays.length === 0)
                  }
                  style={{ backgroundColor: selectedClinic.color + "99", borderColor: selectedClinic.color }}
                >
                  Add to Both
                </button>
              </div>
            </div>
            <div className="card-footer d-flex justify-content-between">
              <button
                className="btn btn-outline-secondary"
                onClick={() => {
                  setAdditionalTime({
                    start: "",
                    end: "",
                    duration: 15,
                    durationMode: "preset",
                    customDuration: "",
                  });
                }}
              >
                Clear Timing
              </button>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-success"
                  onClick={async () => {
                    if (selectedDays.length > 0) await addAdditionalTiming();
                    if (recurringWeekdays.length > 0)
                      await addAdditionalTimingToWeekdays();
                  }}
                  disabled={
                    !additionalTime.start ||
                    !additionalTime.end ||
                    (selectedDays.length === 0 &&
                      recurringWeekdays.length === 0)
                  }
                  style={{ backgroundColor: selectedClinic.color, borderColor: selectedClinic.color }}
                >
                  Save
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowAddTimeModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {editingTarget && (
        <div
          className="editor-modal position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-start p-4"
          style={{ zIndex: 999, backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          onClick={() => setEditingTarget(null)}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="card shadow-lg editor-card"
            style={{ width: "720px", maxWidth: "95%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title m-0">
                  Edit{" "}
                  {editingTarget.type === "date"
                    ? `Date: ${editingTarget.key}`
                    : `Weekday: ${days[editingTarget.key]}`}
                </h5>
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-circle"
                    style={{
                      width: "12px",
                      height: "12px",
                      backgroundColor: selectedClinic.color
                    }}
                  />
                  <span className="small">{selectedClinic.name}</span>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setEditingTarget(null)}
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <h6>Existing Ranges</h6>
                <ul className="list-group mb-2">
                  {editingTarget.type === "date"
                    ? (
                      (availabilityDateMap[editingTarget.key] &&
                        availabilityDateMap[editingTarget.key].ranges) ||
                      []
                    ).map((r, idx) => {
                      const clinic = clinics.find(c => String(c.id) === String(r.clinicId)) || selectedClinic;
                      return (
                        <li
                          key={idx}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          <div>
                            <span className="fw-bold">
                              {r.start} → {r.end}
                            </span>{" "}
                            — {r.duration || 15} min
                            <span
                              className="badge ms-2"
                              style={{
                                backgroundColor: clinic.color,
                                color: "white",
                                fontSize: "0.7em"
                              }}
                            >
                              {clinic.name}
                            </span>
                          </div>
                          <div>
                            <button
                              className="btn btn-sm btn-danger me-2"
                              onClick={() => removeRange(idx)}
                            >
                              Remove
                            </button>
                          </div>
                        </li>
                      );
                    })
                    : (availabilityWeekdayMap[editingTarget.key] || []).map(
                      (r, idx) => {
                        const clinic = clinics.find(c => String(c.id) === String(r.clinicId)) || selectedClinic;
                        return (
                          <li
                            key={idx}
                            className="list-group-item d-flex justify-content-between align-items-center"
                          >
                            <div>
                              <span className="fw-bold">
                                {r.start} → {r.end}
                              </span>{" "}
                              — {r.duration || 15} min
                              <span
                                className="badge ms-2"
                                style={{
                                  backgroundColor: clinic.color,
                                  color: "white",
                                  fontSize: "0.7em"
                                }}
                              >
                                {clinic.name}
                              </span>
                            </div>
                            <div>
                              <button
                                className="btn btn-sm btn-danger me-2"
                                onClick={() => removeRange(idx)}
                              >
                                Remove
                              </button>
                            </div>
                          </li>
                        );
                      }
                    )}

                  {editingTarget.type === "date" &&
                    (!availabilityDateMap[editingTarget.key] ||
                      (availabilityDateMap[editingTarget.key].ranges || [])
                        .length === 0) && (
                      <li className="list-group-item">
                        <em>
                          No date-specific ranges (weekday ranges may still
                          apply)
                        </em>
                      </li>
                    )}
                </ul>

                {editingTarget.type === "date" && (
                  <div className="mb-3">
                    <div className="d-flex gap-2 flex-wrap">
                      <button
                        className={`btn ${availabilityDateMap[editingTarget.key] &&
                            availabilityDateMap[editingTarget.key].blocked
                            ? "btn-outline-success"
                            : "btn-outline-danger"
                          }`}
                        onClick={() => {
                          toggleBlockDate(
                            editingTarget.key,
                            editingTarget.year,
                            editingTarget.month,
                            editingTarget.day
                          );
                        }}
                      >
                        {availabilityDateMap[editingTarget.key] &&
                          availabilityDateMap[editingTarget.key].blocked
                          ? "Unmark Unavailable"
                          : "Mark Date Unavailable"}
                      </button>

                      <button
                        className="btn btn-outline-warning"
                        onClick={() => {
                          if (
                            !window.confirm("Remove all ranges for this date?")
                          )
                            return;
                          removeAllRangesForDate(
                            editingTarget.key,
                            editingTarget.year,
                            editingTarget.month,
                            editingTarget.day
                          );
                        }}
                      >
                        Clear Date Ranges
                      </button>
                    </div>
                    <div className="mt-2">
                      <small className="text-muted">
                        If a date is marked unavailable, it will be excluded
                        even if weekday ranges exist. Date-specific ranges take
                        precedence over weekday ranges.
                      </small>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <h6>Add New Range</h6>
                <div className="row g-2 align-items-end">
                  <div className="col-md-4">
                    <label className="form-label">Start (24-hour)</label>
                    <input
                      type="time"
                      className="form-control"
                      value={newRange.start}
                      onChange={(e) =>
                        setNewRange((n) => ({ ...n, start: e.target.value }))
                      }
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">End (24-hour)</label>
                    <input
                      type="time"
                      className="form-control"
                      value={newRange.end}
                      onChange={(e) =>
                        setNewRange((n) => ({ ...n, end: e.target.value }))
                      }
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Slot Duration (min)</label>
                    <input
                      type="number"
                      min={1}
                      className="form-control"
                      value={newRange.duration}
                      onChange={(e) =>
                        setNewRange((n) => ({
                          ...n,
                          duration: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="">
                    <button
                      className="btn btn-primary w-100"
                      onClick={saveRange}
                      disabled={!newRange.start || !newRange.end}
                      style={{ backgroundColor: selectedClinic.color, borderColor: selectedClinic.color }}
                    >
                      Add
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <small className="text-muted">
                    Click Add to add multiple ranges. Click Save & Close
                    when done.
                  </small>
                  {editingTarget.type === "date" && (
                    <div className="mt-1">
                      <small className="text-danger">
                        <strong>Note:</strong> Cannot add past time slots.
                      </small>
                    </div>
                  )}
                </div>
              </div>

              <div className="calendar-editor-actions d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() =>
                    setNewRange({ start: "", end: "", duration: 15 })
                  }
                >
                  Clear Form
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setEditingTarget(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-success"
                  onClick={saveAndClose}
                  style={{ backgroundColor: selectedClinic.color, borderColor: selectedClinic.color }}
                >
                  Save & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorCalendar;
