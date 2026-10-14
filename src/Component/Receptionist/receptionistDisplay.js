export function clinicDisplayUrl(baseUrl, doctorClinicId) {
  const id = String(doctorClinicId || '');
  if (!/^[a-zA-Z0-9_-]{1,191}$/.test(id)) return '';
  const base = String(baseUrl || '').replace(/\/+$/, '').replace(/\/api$/, '');
  return base ? `${base}/display/clinic/${encodeURIComponent(id)}` : '';
}

export function selectDisplayClinic(clinics, currentId, preferredClinicId) {
  return clinics.find(row => row.doctorClinicId === currentId)?.doctorClinicId ||
    clinics.find(row => String(row.clinicId || row.clinic?.id) === String(preferredClinicId || ''))?.doctorClinicId ||
    clinics[0]?.doctorClinicId || '';
}
