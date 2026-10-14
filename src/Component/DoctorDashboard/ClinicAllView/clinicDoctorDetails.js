import { resolveProfileImage } from '../../../utils/profileImage.js';
export function normalizeClinicDoctor(doctor, ownerId, apiOrigin = '') {
 if (!doctor) return null;
 const id = String(doctor._id || doctor.id || doctor.doctor_id || doctor.user_id || '');
 if (!id || id !== String(ownerId || '') || doctor.isActive === false || !['doctor'].includes(String(doctor.role || doctor.accountType || '').toLowerCase())) return null;
 const rawName = String(doctor.fullName || doctor.full_name || doctor.name || doctor.doctor_name || '').trim();
 const generic = !rawName || /^(?:dr\.?\s*)?(?:mediconeckt|mediconnect|humaeli|doctor)$/i.test(rawName.replace(/\s+/g,' '));
 const specialty = doctor.specialization || doctor.speciality || doctor.specialty;
 const experienceValue = doctor.experience ?? doctor.years_of_experience ?? doctor.experience_years;
 const experience = experienceValue === undefined || experienceValue === null || experienceValue === '' ? null : Number(String(experienceValue).replace(/\s*years?$/i,''));
 const rating = Number(doctor.rating ?? doctor.average_rating);
 return { id, name: generic ? null : rawName,
  specialty: Array.isArray(specialty) ? specialty.filter(item => typeof item === 'string').join(', ') : typeof specialty === 'string' ? specialty : '',
  qualification: Array.isArray(doctor.qualification) ? doctor.qualification.join(', ') : typeof doctor.qualification === 'string' ? doctor.qualification : '',
  experience: Number.isFinite(experience) && experience >= 0 ? experience : null,
  rating: Number.isFinite(rating) && rating > 0 && rating <= 5 ? rating : null,
  image: resolveProfileImage(doctor, apiOrigin),
 };
}
