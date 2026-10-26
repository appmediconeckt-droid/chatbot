import axios from 'axios';
import { API_BASE_URL } from '../../../../axiosConfig';
import { readAppointmentList, rememberAppointmentList } from './appointmentListCache.js';

const pending = new Map();
export function loadAppointmentList(key, { refresh = false } = {}) {
  if (!key) return Promise.resolve([]);
  if (pending.has(key)) return pending.get(key);
  const cached = readAppointmentList(key);
  if (!refresh && cached) return Promise.resolve(cached);
  const request = axios.get(`${API_BASE_URL}/api/appointments`, {
    headers: { Authorization: `Bearer ${key}` },
  }).then(({ data }) => {
    const rows = Array.isArray(data) ? data : [];
    rememberAppointmentList(key, rows);
    return rows;
  }).finally(() => pending.delete(key));
  pending.set(key, request);
  return request;
}
