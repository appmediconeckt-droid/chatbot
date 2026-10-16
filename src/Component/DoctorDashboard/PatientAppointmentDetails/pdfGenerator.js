import axios from "../../../axiosConfig.js";
import { downloadConsultationPrescription } from '../../common/downloadPrescription.js';

// Patient history uses the same branded template as the consultation preview.
export const generatePrescriptionPDF = async (patient, record) => {
  const source = record.prescriptionRecord || record;
  const clinicId = source.clinic_id?._id || source.clinic_id?.id || source.clinic_id || source.clinicId;
  const account = await axios.get('/api/auth/me', { timeout: 15000 });
  const doctorProfile = account.data.user;
  if (!doctorProfile) throw new Error('Doctor profile could not be loaded.');
  let clinic = source.clinic || null;
  if (clinicId) {
    const response = await axios.get(`/api/clinics/${encodeURIComponent(clinicId)}`, { timeout: 15000 });
    clinic = response.data.clinic;
    const owner = clinic?.doctor_id?._id || clinic?.doctor_id?.id || clinic?.doctor_id;
    const doctorId = doctorProfile._id || doctorProfile.id;
    if (!clinic || (doctorId && String(owner) !== String(doctorId))) throw new Error('The appointment clinic does not belong to this doctor.');
  }
  return downloadConsultationPrescription({
    ...source,
    clinic,
    doctorProfile,
    source: 'appointment', verificationStatus: 'completed',
    patient: { ...patient, ...(typeof source.patient === 'object' ? source.patient : {}) },
    appointmentDate: source.appointment_date || source.appointmentDate || record.dateKey || record.date,
    medicine: source.medicine || record.tablets || '',
    advice: source.advice || source.instructions || record.prescription || '',
  }, typeof record.doctor === 'string' ? record.doctor : undefined);
};
