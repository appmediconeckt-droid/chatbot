export const languagePreferenceKeys = ['receptionistLang', 'doctorLang', 'userLang', 'counselorLang', 'siteLang'];
export function clearSessionPreservingLanguages(storage = localStorage) {
 const saved = languagePreferenceKeys.map(key => [key, storage.getItem(key)]);
 storage.clear();
 saved.forEach(([key, value]) => { if (value) storage.setItem(key, value); });
}
