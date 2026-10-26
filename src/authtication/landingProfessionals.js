export function professionalAverage(profile = {}) {
  const value = Number(profile.rating ?? profile.averageRating);
  return Number.isFinite(value) && value >= 0 && value <= 5 ? value : 0;
}

export function isHighlyRatedProfessional(profile) {
  return professionalAverage(profile) > 4.5;
}

export function professionalRoleLabel(profile = {}) {
  return [profile.role, profile.accountType].some(value => String(value || '').trim().toLowerCase() === 'doctor')
    ? 'Doctor' : 'Consultant';
}
