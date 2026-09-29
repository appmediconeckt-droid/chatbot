export const dateKey = value => {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
};
const dayNumber = value => Date.parse(`${value}T00:00:00Z`);
const normalize = value => String(value ?? '').trim().toLowerCase();
export function filterPatients(patients, { search = '', genderFilter = 'All', bloodGroupFilter = 'All', ageFilter = 'All', lastVisitFilter = 'All', sortBy = 'Newest First' }, now = new Date()) {
  const today = dateKey(now), todayNumber = dayNumber(today);
  const todayDate = new Date(todayNumber);
  const monday = todayNumber - ((todayDate.getUTCDay() + 6) % 7) * 86400000;
  const monthStart = dayNumber(`${today.slice(0,7)}-01`);
  return patients.filter(patient => {
    const term = normalize(search), phone = String(patient.phone || '').replace(/\D/g, '');
    if (term && !normalize(patient.name).includes(term) && !normalize(patient.phone).includes(term)
      && !(term.replace(/\D/g, '') && phone.includes(term.replace(/\D/g, '')))) return false;
    if (genderFilter !== 'All' && normalize(patient.gender) !== normalize(genderFilter)) return false;
    if (bloodGroupFilter !== 'All' && normalize(patient.bloodGroup) !== normalize(bloodGroupFilter)) return false;
    if (ageFilter !== 'All') {
      const age = patient.age === '' || patient.age == null ? NaN : Number(patient.age);
      if (!Number.isFinite(age) || age < 0) return false;
      if (ageFilter === '65+' ? age < 65 : (() => { const [min,max] = ageFilter.split('-').map(Number); return age < min || age > max; })()) return false;
    }
    if (lastVisitFilter !== 'All') {
      const visit = dayNumber(patient.lastVisitKey);
      if (!Number.isFinite(visit) || visit > todayNumber) return false;
      const earliest = lastVisitFilter === 'Today' ? todayNumber : lastVisitFilter === 'This Week' ? monday
        : lastVisitFilter === 'This Month' ? monthStart : todayNumber - 90 * 86400000;
      if (visit < earliest) return false;
    }
    return true;
  }).sort((a,b) => {
    if (sortBy === 'Name A-Z') return String(a.name).localeCompare(String(b.name));
    const first = dayNumber(a.lastVisitKey), second = dayNumber(b.lastVisitKey);
    if (!Number.isFinite(first)) return Number.isFinite(second) ? 1 : 0;
    if (!Number.isFinite(second)) return -1;
    return sortBy === 'Oldest First' ? first-second : second-first;
  });
}
