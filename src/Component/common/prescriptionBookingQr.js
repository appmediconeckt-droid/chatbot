import { consultationData } from './consultationData.js';
import { resolveQrOrigin } from '../../utils/localQr.js';

export function prescriptionBookingSource(input = {}) {
  const record = consultationData(input);
  const provider = record.doctorProfile || record.psychiatrist || record.doctor || record.psychiatristSnapshot || {};
  const role = String(provider.role || provider.accountType || '').toLowerCase();
  if (role && role !== 'doctor' && provider.accountType !== 'doctor') return { doctorId: '', image: '' };
  const doctorId = provider._id || provider.id || record.doctorId || record.doctor_id || record.counselor?._id || record.counselor?.id || (typeof record.counselor === 'string' ? record.counselor : '');
  // A bitmap saved in an appointment may encode a different environment's URL.
  // Its contents cannot be verified from the image data URL; never reuse it.
  return { doctorId: String(doctorId || ''), image: '' };
}

const requests = new Map();
export async function loadPrescriptionBookingQr(record, request, options = {}) {
  const { doctorId } = prescriptionBookingSource(record);
  if (!doctorId) return '';
  const development = options.development ?? import.meta.env?.DEV ?? false;
  const origin = options.origin || globalThis.location?.origin || 'https://humaeli.com';
  const localOrigin = await resolveQrOrigin({ origin, development,
    configured: options.configured ?? import.meta.env?.VITE_QR_PUBLIC_ORIGIN,
    request: options.originRequest,
  });
  let targetOrigin = localOrigin || new URL(origin).origin;
  if (!development) {
    const url = new URL(targetOrigin);
    if (url.protocol !== 'https:' || /^(localhost|127(?:\.\d+){3}|\[?::1\]?|0\.0\.0\.0|192\.168\.\d+\.\d+|10(?:\.\d+){3}|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)$/i.test(url.hostname) || url.hostname.endsWith('.local')) targetOrigin = 'https://humaeli.com';
  }
  const key = `${targetOrigin}:${doctorId}`;
  if (!requests.has(key)) {
    const pending = Promise.resolve().then(() => request(`/api/auth/doctor-qr/${encodeURIComponent(doctorId)}`)).then(async response => {
      const data = response.data?.data;
      if (!data || !(data.doctorId || data._id || data.profileQrCode || data.doctorQrCode || data.profileQrUrl)) throw new Error('Appointment booking QR could not be loaded. Please retry.');
      if (data.doctorId && String(data.doctorId) !== doctorId) throw new Error('Appointment booking QR does not match this doctor.');
      const { default: QRCode } = await import('qrcode');
      return QRCode.toDataURL(`${targetOrigin}/doctor/${encodeURIComponent(doctorId)}`, { margin: 4, scale: 6 });
    }).catch(error => { requests.delete(key); throw error; });
    requests.set(key, pending);
  }
  return requests.get(key);
}
