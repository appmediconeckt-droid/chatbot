// Keep the last response in memory for fast menu navigation. Never persist
// appointment details, and never reuse them for another login session.
let sessionKey = null;
let records = null;
export function readAppointmentList(key) {
  return key && sessionKey === key ? records : null;
}
export function rememberAppointmentList(key, rows) {
  sessionKey = key;
  records = rows;
}
