import { clearSessionPreservingLanguages } from '../src/i18n/languagePreferences.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const english = JSON.parse(await readFile(new URL('../src/i18n/locales/en-US.json', import.meta.url), 'utf8'));
let source = await readFile(new URL('../src/i18n/portalCopy.js', import.meta.url), 'utf8');
for (const [name, file] of [['english', 'en-US'], ['receptionistHindi', 'receptionist-hi-IN'], ['doctorHindi', 'doctor-hi-IN']]) {
 const data = JSON.parse(await readFile(new URL(`../src/i18n/locales/${file}.json`, import.meta.url), 'utf8'));
 source = source.replace(`import ${name} from './locales/${file}.json';`, `const ${name}=${JSON.stringify(data)};`);
}
source = source.replace("import doctorCopy from './locales/doctor-copy.json';", `const doctorCopy=${await readFile(new URL('../src/i18n/locales/doctor-copy.json', import.meta.url), 'utf8')};`);
const { lookupPortalCopy, formatPortalTemplate } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const hi = JSON.parse(await readFile(new URL('../src/i18n/locales/hi-IN.json', import.meta.url), 'utf8'));
const mr = JSON.parse(await readFile(new URL('../src/i18n/locales/mr-IN.json', import.meta.url), 'utf8'));
test('doctor-specific Hindi and Marathi navigation works without translation API', () => {
 assert.notEqual(lookupPortalCopy('Doctor Portal', 'hi-IN', hi), 'Doctor Portal');
 assert.notEqual(lookupPortalCopy('Patient Details', 'mr-IN', mr), 'Patient Details');
});

test('doctor forms, payments, queue, staff and patient records have offline Hindi copy', () => {
 for (const text of ['Save & Complete', 'Clinic checkup fee (', 'Add Medicine', 'Payment Settings', 'Available balance', 'Create New Staff Member', 'Patients Medical Records', 'Current Token', 'Mark All as Read', 'Start Time', 'Confirmed']) {
  const value = lookupPortalCopy(text, 'hi-IN', hi);
  assert.ok(value && /[\u0900-\u097f]/.test(value), text);
  assert.equal(lookupPortalCopy(text, 'en-US', english), text);
 }
});
test('patient appointment UI reuses matching existing locale keys', () => {
 assert.notEqual(lookupPortalCopy('Book Appointment', 'hi-IN', hi), 'Book Appointment');
});
test('English and English regional variants restore the original UI copy', () => {
 for (const lang of ['en-US','en-IN','en-GB']) assert.equal(lookupPortalCopy('Doctor Portal', lang, {}), 'Doctor Portal');
});
test('unknown UI labels request translation rather than unrelated semantic substitutions', () => {
 assert.equal(lookupPortalCopy('Unrecognized label', 'hi-IN', hi), null);
 assert.equal(lookupPortalCopy('Unrecognized label', 'ar-SA', {}), null);
});

test('dynamic labels preserve values and translated placeholder order', () => {
 assert.equal(formatPortalTemplate('{1} / {0}', '{0} of {1}', [2,10]), '10 / 2');
 assert.equal(formatPortalTemplate('Provider lost tokens', '{0} years', [30]), '30 years');
 const confirmation = lookupPortalCopy('Delete Sneha?', 'gu-IN', {});
 assert.ok(confirmation && /[\u0a80-\u0aff]/.test(confirmation));
 assert.ok(confirmation.includes('Sneha'));
});

test('sign-out removes authentication while preserving independent language choices', () => {
 const data = new Map([['receptionistLang','hi-IN'],['doctorLang','mr-IN'],['userLang','hi-IN'],['accessToken','secret'],['userData','private']]);
 const storage = {getItem:key=>data.get(key), setItem:(key,value)=>data.set(key,value), clear:()=>data.clear()};
 clearSessionPreservingLanguages(storage);
 assert.equal(data.get('doctorLang'),'mr-IN');
 assert.equal(data.get('receptionistLang'),'hi-IN');
 assert.equal(data.get('userLang'),'hi-IN');
 assert.equal(data.has('accessToken'),false);
 assert.equal(data.has('userData'),false);
});
