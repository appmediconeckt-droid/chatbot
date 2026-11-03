import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const saved = new Map();
const doctorCopy = JSON.parse(await readFile(new URL('../src/i18n/locales/doctor-copy.json', import.meta.url), 'utf8'));
const sourceCopy = JSON.parse(await readFile(new URL('../src/i18n/locales/doctor-source.json', import.meta.url), 'utf8'));
globalThis.localStorage = { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) };
const bundle = await build({
 stdin: { contents: `export { LanguageProvider } from './src/i18n/LanguageContext.jsx'; export { PortalText, PortalTemplate, PortalElement } from './src/Component/common/PortalTranslation.jsx'; export { PortalLanguageScope } from './src/Component/common/portalLanguageScope.js';`, resolveDir: process.cwd() },
 bundle: true, write: false, format: 'cjs', platform: 'node', external: ['react', 'react-dom'], loader: { '.css': 'empty' },
 plugins: [{ name: 'offline', setup(builder) {
  builder.onResolve({ filter: /translationService$/ }, () => ({ path: 'translator', namespace: 'test' }));
  builder.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const translationService = { translateBatch: async texts => texts };' }));
 } }],
});
const compiled = { exports: {} };
new Function('require', 'module', 'exports', bundle.outputFiles[0].text)(createRequire(import.meta.url), compiled, compiled.exports);
const { LanguageProvider, PortalLanguageScope, PortalText, PortalTemplate, PortalElement } = compiled.exports;
function render(lang, children) {
 saved.set('doctorLang', lang);
 saved.set('userLang', 'en-US');
 return renderToStaticMarkup(React.createElement(LanguageProvider, null, React.createElement(PortalLanguageScope.Provider, { value: 'doctor' }, children)));
}

test('doctor controls use doctor language independently of the patient preference and restore English', () => {
 const control = React.createElement(PortalElement, { as: 'input', placeholder: 'Patient Name', 'aria-label': 'Patient Name' });
 assert.match(render('hi-IN', control), /placeholder="मरीज का नाम"/);
 assert.match(render('hi-IN', control), /aria-label="मरीज का नाम"/);
 assert.match(render('en-US', control), /placeholder="Patient Name"/);
 assert.match(render('hi-IN', control), /placeholder="मरीज का नाम"/);
});

test('translated options keep API values and templates keep dynamic numbers', () => {
 const option = React.createElement(PortalElement, { as: 'option', value: 'Confirmed' }, React.createElement(PortalText, { text: 'Confirmed' }));
 assert.equal(render('hi-IN', option), '<option value="Confirmed">पुष्टि हो गई</option>');
 const template = React.createElement(PortalTemplate, { text: '{0} of {1} required fields filled', values: [3, 8] });
 assert.match(render('hi-IN', template), /8 आवश्यक फ़ील्ड में से 3 भरे गए/);
});

test('every selectable non-English language ships the complete doctor UI catalog with intact placeholders', async () => {
 const context = await readFile(new URL('../src/i18n/LanguageContext.jsx', import.meta.url), 'utf8');
 const languages = [...context.matchAll(/\{ code: '([^']+)'/g)].map(m => m[1]).filter(lang => !lang.startsWith('en'));
 assert.equal(languages.length, 53);
 for (const lang of languages) {
  assert.ok(doctorCopy[lang], lang);
  for (const original of sourceCopy) {
   const translated = doctorCopy[lang][original];
   assert.ok(typeof translated === 'string' && translated.trim(), `${lang}: ${original}`);
   assert.doesNotMatch(translated, /ZXQ\d+QXZ|QUERY LENGTH LIMIT|MYMEMORY WARNING/);
   for (const [token] of original.matchAll(/\{\d+\}/g)) assert.ok(translated.includes(token), `${lang}: ${original} lost ${token}`);
  }
 }
});

test('all 53 language choices render doctor navigation and inputs offline', () => {
 for (const [lang, copy] of Object.entries(doctorCopy)) {
  const controls = React.createElement('div', null,
   React.createElement(PortalText, { text: 'Doctor Portal' }),
   React.createElement(PortalElement, { as: 'input', placeholder: 'Patient Name' }));
  const html = render(lang, controls);
  assert.ok(!html.includes('Doctor Portal'), lang);
  assert.ok(!html.includes('placeholder="Patient Name"'), lang);
  assert.ok(copy['Doctor Portal'], lang);
 }
});

test('Gujarati labels, statuses, validation and restoring English work with patient language unchanged', () => {
 for (const lang of ['gu-IN', 'fr-FR', 'gu-IN', 'en-US', 'gu-IN']) {
  const html = render(lang, React.createElement('div', null,
   React.createElement(PortalText, { text: 'Patient Name' }),
   React.createElement(PortalText, { text: 'Payment Settings' }),
   React.createElement(PortalText, { text: 'Please fill all fields' })));
  if (lang === 'gu-IN') {
   assert.match(html, /[\u0a80-\u0aff]/);
   assert.doesNotMatch(html, /Patient Name|Payment Settings|Please fill all fields/);
  } else if (lang === 'en-US') assert.match(html, /Patient Name/);
 }
});

test('UI fallback requests the explicit English source language', async () => {
 let requested;
 globalThis.__doctorTranslationAxios = {
  post: async () => { throw new Error('Offline backend'); },
  get: async url => { requested = new URL(url); return { data: { responseData: { translatedText: 'अनुवाद' } } }; },
 };
 let source = await readFile(new URL('../src/i18n/translationService.js', import.meta.url), 'utf8');
 source = source.replace("import axios from 'axios';", 'const axios = globalThis.__doctorTranslationAxios;')
  .replace("import { API_BASE_URL } from '../axiosConfig';", "const API_BASE_URL = 'https://example.invalid';");
 const { translationService } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
 assert.equal(await translationService.fetchPublicFallbackTranslation('Patient Name', 'hi-IN', 'en-US'), 'अनुवाद');
 assert.equal(requested.searchParams.get('langpair'), 'en|hi');
 delete globalThis.__doctorTranslationAxios;
});
