const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');
const { Metadata } = require('libphonenumber-js/core');
const metadata = require('libphonenumber-js/metadata.mobile.json');
const root = path.join(__dirname, '..');

function declarations(file) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const ast = parser.parse(source, { sourceType: 'module', plugins: ['jsx'] });
  const found = {};
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier' && node.init) found[node.id.name] = source.slice(node.init.start, node.init.end);
    if (node.type === 'FunctionDeclaration') found[node.id.name] = source.slice(node.start, node.end);
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    }
  }
  visit(ast);
  return found;
}
const profile = declarations('src/Component/PatientProfile/PatientProfile.jsx');
const { PHONE_COUNTRIES: countries } = require('../src/utils/phoneCountries.js');
const splitPhone = new Function('PHONE_COUNTRIES', 'parsePhoneNumberFromString', `return (${profile.splitPhoneNumber})`)(countries, require('libphonenumber-js').parsePhoneNumberFromString);
const completionSource = fs.readFileSync(path.join(root, 'src/utils/profileCompletion.js'), 'utf8')
  .replace(/^import .*;\r?\n/gm, '').replace(/export /g, '');
const phoneLengths = new Function('Metadata', 'phoneMetadata', `${completionSource}; return getLocalPhoneLengths;`)(Metadata, metadata);

test('address labels stay distinct instead of resolving every field to Location', () => {
  const context = declarations('src/i18n/LanguageContext.jsx');
  const makeT = new Function(`const TRANSLATION_KEY_ALIASES=${context.TRANSLATION_KEY_ALIASES}; const getSemanticAliases=${context.getSemanticAliases}; const normalizeConsultantTerminology=${context.normalizeConsultantTerminology}; ${context.makeT}; return makeT;`)();
  const translations = Object.fromEntries(['en-US', 'hi-IN'].map(locale => [locale, JSON.parse(fs.readFileSync(path.join(root, `src/i18n/locales/${locale}.json`), 'utf8'))]));
  for (const lang of ['en-US', 'hi-IN']) {
    const t = makeT(lang, translations);
    const labels = ['city', 'state', 'pincode', 'country'].map(t);
    assert.equal(new Set(labels).size, 4);
    assert.ok(labels.every(label => label !== t('location')));
  }
});

test('emergency international phone restores the selected country without duplicating its code', () => {
  assert.deepEqual(splitPhone('+44 7700 900123'), { countryCode: 'GB', localNumber: '7700900123' });
  assert.deepEqual(splitPhone('9876543210'), { countryCode: 'IN', localNumber: '9876543210' });
});

test('profile save includes emergency country code, allows empty contact, and rejects short numbers', async () => {
  for (const [phone, expected] of [['7700900123', '+447700900123'], ['', ''], ['123', null]]) {
    let submitted;
    const form = { phoneCountry: 'IN', phone: '9876543210', emergencyPhoneCountry: 'GB', emergencyContact: { name: 'Contact', relation: 'Family', phone }, address: {}, dateOfBirth: '' };
    const dependencies = {
      PHONE_COUNTRIES: countries, editFormData: form, getLocalPhoneLengths: phoneLengths,
      showNotificationMessage() {}, setIsSaving() {}, FormData,
      calculateAge: () => '', getCompletePhoneNumber: () => '+919876543210',
      profileImageFile: null, profileImage: null, profileImageRemoved: false,
      updatePatientProfile: async data => { submitted = data; return { data: { success: false } }; },
    };
    await new Function(...Object.keys(dependencies), `return (${profile.handleSaveProfile})`)(...Object.values(dependencies))();
    if (expected === null) assert.equal(submitted, undefined);
    else assert.equal(JSON.parse(submitted.get('emergencyContact')).phone, expected);
  }
});

test('changing address country saves emergency phone with the new dialing code', async () => {
  const { applyPatientAddressChange } = require('../src/utils/patientAddressChange.js');
  for (const [country, digits, expected] of [
    ['United Kingdom', '7700900123', '+447700900123'],
    ['United Arab Emirates', '501234567', '+971501234567'],
    ['India', '9876543210', '+919876543210'],
  ]) {
    let submitted;
    const form = applyPatientAddressChange({ phoneCountry: 'IN', phone: digits, emergencyPhoneCountry: 'IN',
      emergencyContact: { name: 'Family', relation: 'Parent', phone: digits }, address: {}, dateOfBirth: '' }, { country, state: '', city: '' });
    const dependencies = {
      PHONE_COUNTRIES: countries, editFormData: form, getLocalPhoneLengths: phoneLengths,
      showNotificationMessage() {}, setIsSaving() {}, FormData,
      calculateAge: () => '', getCompletePhoneNumber: () => expected,
      profileImageFile: null, profileImage: null, profileImageRemoved: false,
      updatePatientProfile: async data => { submitted = data; return { data: { success: false } }; },
    };
    await new Function(...Object.keys(dependencies), `return (${profile.handleSaveProfile})`)(...Object.values(dependencies))();
    assert.ok(submitted, `${country} form should submit`);
    assert.equal(JSON.parse(submitted.get('emergencyContact')).phone, expected);
  }
});
