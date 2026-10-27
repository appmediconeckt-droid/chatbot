export const languagePreferenceKeys = ['receptionistLang', 'doctorLang', 'userLang', 'counselorLang', 'siteLang'];
export function clearSessionPreservingLanguages(storage = localStorage) {
 const saved = languagePreferenceKeys.map(key => [key, storage.getItem(key)]);
 // Demo receipts contain no card details or authentication credentials. Keep
 // their patient-scoped completion state across sign-out in this browser.
 for (let index = 0; index < (storage.length || 0); index++) {
  const key = storage.key(index);
  if (key?.startsWith('demo-card-receipt:')) saved.push([key, storage.getItem(key)]);
 }
 storage.clear();
 saved.forEach(([key, value]) => { if (value) storage.setItem(key, value); });
}
