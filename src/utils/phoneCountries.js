import { staffPhoneCountries } from './staffPhoneCountries.js';

export const PHONE_COUNTRIES = staffPhoneCountries.map(({ iso, name, dial }) => ({
  code: iso, label: name, dial,
}));

export function phoneCountryLabel(country, selectedCode) {
  return country.code === selectedCode
    ? `${country.dial} ${country.code}`
    : `${country.dial} — ${country.label}`;
}
