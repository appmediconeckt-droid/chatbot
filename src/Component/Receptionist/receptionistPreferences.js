export const defaultPreferences = { defaultClinic: '', compactTables: false };
export const preferenceKey = profile => `receptionist-preferences:${profile._id || profile.id || profile.email}`;
export function readPreferences(profile) {
  try {
    const stored = JSON.parse(localStorage.getItem(preferenceKey(profile)) || '{}');
    return { defaultClinic: typeof stored.defaultClinic === 'string' ? stored.defaultClinic : '', compactTables: stored.compactTables === true };
  } catch { return { ...defaultPreferences }; }
}
