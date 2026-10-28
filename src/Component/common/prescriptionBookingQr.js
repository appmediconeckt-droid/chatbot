import { consultationData } from './consultationData.js';

export function prescriptionBookingSource(input = {}) {
  const record = consultationData(input);
  const provider = record.doctorProfile || record.psychiatrist || record.doctor || record.psychiatristSnapshot || {};
  const role = String(provider.role || provider.accountType || '').toLowerCase();
  if (role && role !== 'doctor' && provider.accountType !== 'doctor') return { doctorId: '', image: '' };
  const doctorId = provider._id || provider.id || record.doctorId || record.doctor_id || record.counselor?._id || record.counselor?.id || (typeof record.counselor === 'string' ? record.counselor : '');
  const candidate = provider.profileQrCode || provider.doctorQrCode || record.doctorQrCode || '';
  return { doctorId: String(doctorId || ''), image: typeof candidate === 'string' && /^data:image\/png;base64,/i.test(candidate) ? candidate : '' };
}

const requests = new Map();
export async function loadPrescriptionBookingQr(record, request) {
  const { doctorId, image } = prescriptionBookingSource(record);
  if (image) return image;
  if (!doctorId) return '';
  if (!requests.has(doctorId)) {
    const pending = Promise.resolve().then(() => request(`/api/auth/doctor-qr/${encodeURIComponent(doctorId)}`)).then(response => {
      const data = response.data?.data;
      const qr = data?.profileQrCode || data?.doctorQrCode;
      if (typeof qr !== 'string' || !/^data:image\/png;base64,/i.test(qr)) throw new Error('Appointment booking QR could not be loaded. Please retry.');
      return qr;
    }).catch(error => { requests.delete(doctorId); throw error; });
    requests.set(doctorId, pending);
  }
  return requests.get(doctorId);
}
