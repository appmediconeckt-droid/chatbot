import { normalizePhoneNumber, detectPhoneCountryCode } from './profileCompletion.js';

// Display only: keep stored phone values and verification inputs unchanged.
export const formatPhoneWithCountryCode = (value, countryCode = '+91') => {
  const raw = String(value || '').trim();
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (raw.startsWith('+') || raw.startsWith('00')) {
    const international = raw.startsWith('00') ? digits.slice(2) : digits;
    const code = detectPhoneCountryCode(international, countryCode);
    if (international.startsWith(code)) return `+${code} ${international.slice(code.length)}`.trim();
    return `+${international}`;
  }
  const phone = normalizePhoneNumber(raw, countryCode, true);
  return `${phone.countryCode} ${phone.digits}`;
};
