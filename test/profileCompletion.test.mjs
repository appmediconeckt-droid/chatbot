import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getProfileCompletion } from '../src/utils/profileCompletion.js';
import { getProfileCompletion as backendCompletion } from '../../chatbot-backend/src/utils/profileCompletion.js';
import { completeProfessional } from '../../chatbot-backend/test/fixtures/profileCompletion.js';

const bundled = await build({ entryPoints: ['src/Component/common/ProfileCompletion.jsx'], bundle: true, write: false, format: 'cjs', platform: 'node', external: ['react'], loader: { '.css': 'empty' } });
const compiled = { exports: {} };
new Function('require', 'module', 'exports', bundled.outputFiles[0].text)(createRequire(import.meta.url), compiled, compiled.exports);
const Progress = compiled.exports.default;

test('progress bar stays visible when API completion metadata is missing', () => {
  const html = renderToStaticMarkup(React.createElement(Progress, { completion: null, loading: true }));
  assert.match(html, /role="progressbar"/);
  assert.match(html, /Profile Completion/);
  assert.match(html, /Loading your profile progress/);
  assert.doesNotMatch(html, /0% complete/);
});

test('existing profile fields produce a visible complete and remaining percentage', () => {
  const data = { ...completeProfessional(), panNumber: '', permanentAddress: '' };
  const completion = getProfileCompletion(data);
  const html = renderToStaticMarkup(React.createElement(Progress, { completion }));
  assert.match(html, /90% complete/);
  assert.match(html, /10% remaining/);
  assert.match(html, /width:90%/);
  assert.match(html, /19 of 21 required fields filled/);
});

test('local fallback matches backend completion when every required field is cleared', () => {
  const full = completeProfessional();
  for (const field of backendCompletion(full).fields) {
    const draft = structuredClone(full);
    const [key, nested] = field.key.split('.');
    if (nested) draft[key][nested] = '';
    else draft[key] = '';
    assert.deepEqual(getProfileCompletion(draft), backendCompletion(draft));
    assert.ok(getProfileCompletion(draft).percentage < 100);
  }
  assert.deepEqual(getProfileCompletion(full), backendCompletion(full));
});
