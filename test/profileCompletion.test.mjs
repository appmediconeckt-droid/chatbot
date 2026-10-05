import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getProfileCompletion } from '../src/utils/profileCompletion.js';

const completeProfessional = () => ({
  role: 'doctor', fullName: 'Test Doctor', email: 'doctor@example.com',
  phoneNumber: '9876543210', phoneCountryCode: '+91',
  profilePhoto: { url: '/photo.jpg' }, dateOfBirth: '1990-01-01', gender: 'female',
  address: { line1: 'Street', city: 'Delhi', state: 'Delhi', pincode: '110001', country: 'India' },
  specialization: ['Psychiatry'], experience: 0, qualification: 'MBBS', aboutMe: 'Doctor bio',
  languages: ['Hindi'], consultationMode: ['online'],
  certifications: [{ name: 'Degree', documentUrl: '/degree.pdf' }],
});

const bundled = await build({ entryPoints: ['src/Component/common/ProfileCompletion.jsx'], bundle: true, write: false, format: 'cjs', platform: 'node', external: ['react'], loader: { '.css': 'empty' } });
const compiled = { exports: {} };
new Function('require', 'module', 'exports', bundled.outputFiles[0].text)(createRequire(import.meta.url), compiled, compiled.exports);
const Progress = compiled.exports.default;

const hookBundle = await build({
  entryPoints: ['src/hooks/useProfileCompletion.js'], bundle: true, write: false,
  format: 'cjs', platform: 'node', external: ['react'],
  plugins: [{ name: 'no-network', setup(builder) {
    builder.onResolve({ filter: /axiosConfig$/ }, () => ({ path: 'api', namespace: 'test' }));
    builder.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export default {};' }));
  } }],
});
const hookModule = { exports: {} };
new Function('require', 'module', 'exports', hookBundle.outputFiles[0].text)(createRequire(import.meta.url), hookModule, hookModule.exports);
function ProfilePreview({ saved, draft }) {
  const preview = hookModule.exports.default(saved, draft, true);
  return React.createElement(Progress, preview);
}

test('missing server completion metadata still renders a complete local draft as 100%', () => {
  const html = renderToStaticMarkup(React.createElement(ProfilePreview, {
    saved: null, draft: { ...completeProfessional(), role: 'counsellor' },
  }));
  assert.match(html, /<strong>100%<\/strong>/);
  assert.doesNotMatch(html, /progressbar|<p|Reload your profile/);
});

test('clearing a required field immediately shows progress even if the saved profile was complete', () => {
  const draft = { ...completeProfessional(), aboutMe: '' };
  const html = renderToStaticMarkup(React.createElement(ProfilePreview, {
    saved: getProfileCompletion(completeProfessional()), draft,
  }));
  assert.match(html, /role="progressbar"/);
  assert.match(html, /About me/);
  assert.doesNotMatch(html, /<strong>100%<\/strong>/);
});

test('progress bar stays visible when API completion metadata is missing', () => {
  const html = renderToStaticMarkup(React.createElement(Progress, { completion: null, loading: true }));
  assert.match(html, /role="progressbar"/);
  assert.match(html, /Profile Completion/);
  assert.match(html, /Loading your profile progress/);
  assert.doesNotMatch(html, /0% complete/);
});

test('doctor profile reaches 100% without Aadhaar, PAN or permanent address', () => {
  const data = completeProfessional();
  const completion = getProfileCompletion(data);
  const html = renderToStaticMarkup(React.createElement(Progress, { completion }));
  assert.match(html, /Profile Completion/);
  assert.match(html, /<strong>100%<\/strong>/);
  assert.doesNotMatch(html, /progressbar|remaining|required fields filled|<p/);
});

test('completed counselor profile hides all details even while editing or preview is unavailable', () => {
  const completion = getProfileCompletion({ ...completeProfessional(), role: 'counsellor' });
  const html = renderToStaticMarkup(React.createElement(Progress, { completion, editing: true, error: true }));
  assert.match(html, /Profile Completion/);
  assert.match(html, /<strong>100%<\/strong>/);
  assert.doesNotMatch(html, /progressbar|<p|Save your changes|Server preview/);
});

test('incomplete profiles keep their progress bar and remaining fields', () => {
  const completion = getProfileCompletion({ ...completeProfessional(), aboutMe: '' });
  const html = renderToStaticMarkup(React.createElement(Progress, { completion }));
  assert.match(html, /role="progressbar"/);
  assert.match(html, /remaining|required fields filled/);
  assert.match(html, /About me/);
});

test('remaining supported fields still count toward completion', () => {
  const full = completeProfessional();
  for (const field of getProfileCompletion(full).fields) {
    const draft = structuredClone(full);
    const [key, nested] = field.key.split('.');
    if (nested) draft[key][nested] = '';
    else draft[key] = '';

    assert.ok(getProfileCompletion(draft).percentage < 100);
  }
  assert.equal(getProfileCompletion(full).percentage, 100);
  assert.ok(!getProfileCompletion(full).fields.some(({ key }) => ['aadhaarNumber', 'panNumber', 'permanentAddress'].includes(key)));
});
