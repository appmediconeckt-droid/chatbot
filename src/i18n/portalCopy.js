import english from './locales/en-US.json';
import receptionistHindi from './locales/receptionist-hi-IN.json';
import doctorHindi from './locales/doctor-hi-IN.json';
import doctorCopy from './locales/doctor-copy.json';
const normalize = text => String(text || '').trim().replace(/\s+/g, ' ').toLowerCase();
const englishKeys = new Map();
for (const [key, value] of Object.entries(english)) {
 if (typeof value === 'string') {
  const normalized = normalize(value);
  const keys = englishKeys.get(normalized) || [];
  englishKeys.set(normalized, [...keys, key]);
 }
}
export const portalCopy = {
 ...doctorCopy,
 'hi-IN': {
  ...doctorCopy['hi-IN'],
  ...receptionistHindi,
  ...doctorHindi,
  'Doctor Portal': '\u0921\u0949\u0915\u094d\u091f\u0930 \u092a\u094b\u0930\u094d\u091f\u0932',
  'DOCTOR PANEL': '\u0921\u0949\u0915\u094d\u091f\u0930 \u092a\u0948\u0928\u0932',
  'Patient Details': '\u092e\u0930\u0940\u091c \u0915\u093e \u0935\u093f\u0935\u0930\u0923',
  'Follow Up': '\u092b\u0949\u0932\u094b \u0905\u092a',
  'QR Code': '\u0915\u094d\u092f\u0942\u0906\u0930 \u0915\u094b\u0921',
  'User Management': '\u0938\u094d\u091f\u093e\u092b \u092a\u094d\u0930\u092c\u0902\u0927\u0928',
  'Clinic Page': '\u0915\u094d\u0932\u093f\u0928\u093f\u0915',
  'Clinic Walk-in': '\u0915\u094d\u0932\u093f\u0928\u093f\u0915 \u0935\u0949\u0915-\u0907\u0928',
  'Available clinics': '\u0909\u092a\u0932\u092c\u094d\u0927 \u0915\u094d\u0932\u093f\u0928\u093f\u0915',
 },
 'mr-IN': {
  ...doctorCopy['mr-IN'],
  'Doctor Portal': '\u0921\u0949\u0915\u094d\u091f\u0930 \u092a\u094b\u0930\u094d\u091f\u0932',
  'DOCTOR PANEL': '\u0921\u0949\u0915\u094d\u091f\u0930 \u092a\u0945\u0928\u0932',
  'Patient Details': '\u0930\u0941\u0917\u094d\u0923\u093e\u091a\u0940 \u092e\u093e\u0939\u093f\u0924\u0940',
  'Follow Up': '\u092b\u0949\u0932\u094b \u0905\u092a',
  'QR Code': '\u0915\u094d\u092f\u0942\u0906\u0930 \u0915\u094b\u0921',
  'User Management': '\u0915\u0930\u094d\u092e\u091a\u093e\u0930\u0940 \u0935\u094d\u092f\u0935\u0938\u094d\u0925\u093e\u092a\u0928',
  'Clinic Page': '\u0915\u094d\u0932\u093f\u0928\u093f\u0915',
 },
};
// Case/whitespace variants of the same label share the reviewed override.
// Otherwise a generated "Patient name" entry could shadow "Patient Name".
const reviewedHindi = new Map(Object.entries(doctorHindi).map(([text, value]) => [normalize(text), value]));
for (const text of Object.keys(portalCopy['hi-IN'])) {
 const reviewed = reviewedHindi.get(normalize(text));
 if (reviewed) portalCopy['hi-IN'][text] = reviewed;
}
const normalizedPortalCopy = Object.fromEntries(Object.entries(portalCopy).map(([lang, copy]) => [
 lang, new Map(Object.entries(copy).map(([text, value]) => [normalize(text), value])),
]));
const templateCopies = new Map();
function lookupTemplateCopy(text, lang) {
 if (!templateCopies.has(lang)) {
  const templates = Object.entries(portalCopy[lang] || {}).flatMap(([original, localized]) => {
   const tokens = [...original.matchAll(/\{(\d+)\}/g)];
   if (!tokens.length || original.replace(/\{\d+\}/g, '').replace(/[^a-z]/gi, '').length < 4) return [];
   if (!tokens.every(([token]) => localized.includes(token))) return [];
   const parts = original.split(/\{\d+\}/g).map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
   return [{ pattern: new RegExp(`^${parts.join('(.*?)')}$`, 'i'), tokens, localized }];
  });
  templateCopies.set(lang, templates);
 }
 for (const { pattern, tokens, localized } of templateCopies.get(lang)) {
  const match = pattern.exec(String(text).trim().replace(/\s+/g, ' '));
  if (!match) continue;
  const values = Object.fromEntries(tokens.map(([, index], position) => [index, match[position + 1]]));
  return localized.replace(/\{(\d+)\}/g, (_, index) => values[index]);
 }
 return null;
}
export function lookupPortalCopy(text, lang, messages = {}) {
 if (!text || lang.startsWith('en')) return text;
 const explicit = normalizedPortalCopy[lang]?.get(normalize(text));
 if (explicit) return explicit;
 for (const key of englishKeys.get(normalize(text)) || []) {
  const value = messages[key];
  if (typeof value === 'string' && value && normalize(value) !== normalize(text)) return value;
 }
 return lookupTemplateCopy(text, lang);
}

export function formatPortalTemplate(localized, original, values) {
 const safe = values.every((_, index) => localized.includes(`{${index}}`)) ? localized : original;
 return safe.replace(/\{(\d+)\}/g, (_, index) => String(values[Number(index)]));
}
