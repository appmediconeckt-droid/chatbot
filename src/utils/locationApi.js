import { staffPhoneCountries } from './staffPhoneCountries.js';

const countryIsoCodes = new Map();
const baseUrl = 'https://countriesnow.space/api/v0.1/countries';
const cache = new Map();

export function loadLocations(field, country = '', state = '') {
  const key = JSON.stringify([field, country, state]);
  if (cache.has(key)) return cache.get(key);
  const path = field === 'country' ? '/iso' : field === 'state' ? '/states' : '/state/cities';
  const request = fetch(`${baseUrl}${path}`, field === 'country' ? {} : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(field === 'state' ? { country } : { country, state }),
  }).then(async response => {
    if (!response.ok) throw new Error('Unable to load locations');
    const result = await response.json();
    if (result.error) throw new Error(result.msg || 'Unable to load locations');
    const items = field === 'state' ? result.data?.states : result.data;
    if (!Array.isArray(items)) throw new Error('Invalid location response');
    if (field === 'country') {
      items.forEach(item => {
        if (item.name && item.Iso2) countryIsoCodes.set(item.name, item.Iso2.toUpperCase());
      });
    }
    return [...new Set(items.map(item => typeof item === 'string' ? item : item.name).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
  }).catch(error => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, request);
  return request;
}

export function phoneCountryForLocation(country) {
  if (!country) return null;
  const iso = countryIsoCodes.get(country);
  return staffPhoneCountries.find(item => item.iso === iso)
    || staffPhoneCountries.find(item => item.name.toLowerCase() === country.toLowerCase())
    || null;
}

export function locationPatch(field, value) {
  if (field === 'country') return { country: value, state: '', city: '' };
  if (field === 'state') return { state: value, city: '' };
  return { city: value };
}
