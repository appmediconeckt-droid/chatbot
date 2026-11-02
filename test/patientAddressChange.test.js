import test from 'node:test';
import assert from 'node:assert/strict';
import { applyPatientAddressChange } from '../src/utils/patientAddressChange.js';
import { PHONE_COUNTRIES } from '../src/utils/phoneCountries.js';

test('address country changes synchronize personal and emergency phone codes', () => {
  const original = {
    address: { country: 'India', state: 'Delhi', city: 'New Delhi' },
    phoneCountry: 'IN', phone: '9876543210', emergencyPhoneCountry: 'IN',
    emergencyContact: { name: 'Family', relation: 'Parent', phone: '9876543211' },
  };
  let form = original;
  for (const [country, iso, dial] of [
    ['United Kingdom', 'GB', '+44'], ['United Arab Emirates', 'AE', '+971'], ['India', 'IN', '+91'],
  ]) {
    form = applyPatientAddressChange(form, { country, state: '', city: '' });
    assert.equal(form.phoneCountry, iso);
    assert.equal(form.emergencyPhoneCountry, iso);
    assert.equal(PHONE_COUNTRIES.find(item => item.code === form.emergencyPhoneCountry).dial, dial);
    assert.equal(form.emergencyContact.name, 'Family');
    assert.equal(form.emergencyContact.relation, 'Parent');
    assert.equal(form.address.state, '');
    assert.equal(form.address.city, '');
  }
  assert.equal(original.emergencyPhoneCountry, 'IN');
  assert.equal(original.emergencyContact.phone, '9876543211');
});

test('state changes leave emergency phone selection unchanged', () => {
  const form = { address: { country: 'India' }, emergencyPhoneCountry: 'GB', emergencyContact: { phone: '7700900123' } };
  const updated = applyPatientAddressChange(form, { state: 'Delhi', city: '' });
  assert.equal(updated.emergencyPhoneCountry, 'GB');
  assert.deepEqual(updated.emergencyContact, form.emergencyContact);
});
