export function getRemoteConsultationMode(appointment) {
  const mode = String(appointment?.consultationMode || appointment?.consultation_mode || appointment?.mode || '').toLowerCase();
  if (mode.includes('video')) return 'video';
  if (mode.includes('voice') || mode.includes('phone') || mode.includes('audio')) return 'voice';
  return '';
}

export function appointmentCallNavigation(appointment) {
  const type = getRemoteConsultationMode(appointment);
  const patient = appointment?.patient;
  const target = appointment?.patientId || appointment?.patient_id || patient?._id || patient?.id || (typeof patient === 'string' ? patient : '');
  if (!type || !target) return null;
  return { pathname: '/doctor-consultation', state: { callTargetId: String(target), autoStartCallType: type, appointment } };
}

export function appointmentCallPatient(patient) {
  const id = patient?.user_id || patient?.userId || patient?.id || patient?._id;
  if (!id) return null;
  return {
    id: String(id), receiverId: String(id),
    name: patient.full_name || patient.fullName || patient.name || 'Patient',
    profilePhoto: patient.profilePhoto || patient.avatarUrl || patient.avatar,
    age: patient.age || 'NA', gender: patient.gender || 'NA',
    condition: patient.condition || patient.diagnosis || 'No condition',
    status: patient.status || 'Stable', phone: patient.phone || patient.phoneNumber || '',
    bloodGroup: patient.blood_group || patient.bloodGroup || '',
    previewTitle: patient.condition || patient.diagnosis || 'Appointment patient',
    lastMessage: '', messageTime: '', unread: 0,
  };
}
