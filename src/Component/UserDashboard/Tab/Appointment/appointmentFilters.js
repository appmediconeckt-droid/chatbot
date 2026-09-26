import { isUnscheduledEmergency } from "./emergencyBooking.js";

export const filterAppointments = (appointments, status = "All", period = "All", now = Date.now()) => {
  const normalizeStatus = (value) => String(value || "pending").trim().toLowerCase().replace(/^canceled$/, "cancelled");
  const terminal = new Set(["completed", "cancelled", "rejected", "no-show", "no_show"]);
  const timestamp = (apt) => Date.parse(apt.date) || 0;
  return appointments.filter((apt) => {
    const value = normalizeStatus(apt.status);
    if (status !== "All" && value !== normalizeStatus(status)) return false;
    const pendingEmergency = isUnscheduledEmergency(apt) && !terminal.has(value);
    if (period === "Upcoming") return !terminal.has(value) && (pendingEmergency || timestamp(apt) > now);
    if (period === "Past") return terminal.has(value) || (!pendingEmergency && timestamp(apt) <= now);
    return true;
  }).sort((a, b) => (Date.parse(b.createdAt || b.created_at) || timestamp(b)) - (Date.parse(a.createdAt || a.created_at) || timestamp(a)));
};
