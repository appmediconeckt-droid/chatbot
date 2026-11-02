import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLocations, phoneCountryForLocation } from '../src/utils/locationApi.js';
import { PHONE_COUNTRIES, phoneCountryLabel } from '../src/utils/phoneCountries.js';

test('phone dropdown shows the selected dialing code before the country name', () => {
  for (const [code, dial] of [['IN', '+91'], ['GB', '+44'], ['US', '+1'], ['GU', '+1'], ['AX', '+358']]) {
    const country = PHONE_COUNTRIES.find(item => item.code === code);
    assert.ok(country, `${code} must be selectable in the phone dropdown`);
    assert.equal(phoneCountryLabel(country, code), `${dial} ${code}`);
    assert.ok(phoneCountryLabel(country, 'other').startsWith(`${dial} — `));
  }
  for (const country of PHONE_COUNTRIES) {
    assert.equal(phoneCountryForLocation(country.label)?.iso, country.code);
    assert.equal(phoneCountryForLocation(country.label)?.dial, country.dial);
  }
});

test('selected API country uses ISO mapping even when its name differs from phone metadata', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ data: [
      { name: 'United States of America', Iso2: 'US' },
      { name: 'Korea (South)', Iso2: 'KR' },
      { name: 'United Kingdom', Iso2: 'GB' },
      { name: 'Canada', Iso2: 'CA' },
    ] }),
  });
  try {
    await loadLocations('country');
    for (const [name, iso, dial] of [
      ['United States of America', 'US', '+1'],
      ['Korea (South)', 'KR', '+82'],
      ['United Kingdom', 'GB', '+44'],
      ['Canada', 'CA', '+1'],
      ['India', 'IN', '+91'],
    ]) {
      const country = phoneCountryForLocation(name);
      assert.equal(country.iso, iso);
      assert.equal(country.dial, dial);
    }
    assert.equal(phoneCountryForLocation(''), null);
    assert.equal(phoneCountryForLocation('Unknown country'), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
