import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function serviceWith(axios) {
 globalThis.__translationAxios = axios;
 globalThis.localStorage = { getItem: () => null, setItem: () => {} };
 const source = (await readFile(new URL('../src/i18n/translationService.js', import.meta.url), 'utf8'))
  .replace("import axios from 'axios';", 'const axios = globalThis.__translationAxios;')
  .replace("import { API_BASE_URL } from '../axiosConfig';", "const API_BASE_URL = 'https://example.invalid/api';");
 return (await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}#${Math.random()}`)).translationService;
}

test('real batch endpoint preserves array order, individual cache entries and progress indexes', async () => {
 const calls = [], updates = [];
 const service = await serviceWith({ post: async (url, payload) => {
  calls.push({ url, payload });
  return { data: { translatedTexts: ['દર્દીનું નામ', 'પુષ્ટિ થઈ'] } };
 } });
 const texts = ['Patient Name', 'Confirmed'];
 assert.deepEqual(await service.translateBatch(texts, 'gu-IN', 'en-US', rows => updates.push(...rows)), ['દર્દીનું નામ', 'પુષ્ટિ થઈ']);
 assert.equal(calls[0].url, 'https://example.invalid/api/translate/batch');
 assert.deepEqual(calls[0].payload.texts, texts);
 assert.deepEqual(updates.map(row => row.index), [0, 1]);
 assert.equal(await service.translate('Patient Name', 'gu-IN', 'en-US'), 'દર્દીનું નામ');
 assert.equal(calls.length, 1);
});

test('unchanged English batch output retries individual strings instead of silently succeeding', async () => {
 const calls = [];
 const service = await serviceWith({ post: async (url, payload) => {
  calls.push(url);
  return { data: url.endsWith('/batch') ? { translatedTexts: payload.texts } : { translatedText: 'દર્દીનું નામ' } };
 } });
 assert.deepEqual(await service.translateBatch(['Patient Name'], 'gu-IN', 'en'), ['દર્દીનું નામ']);
 assert.equal(calls.length, 2);
 assert.ok(calls[1].endsWith('/text'));
});

test('provider errors and broken placeholders are never cached as successful UI translations', async () => {
 const service = await serviceWith({
  post: async () => ({ data: { translatedText: 'QUERY LENGTH LIMIT EXCEEDED' } }),
  get: async () => ({ data: { responseData: { translatedText: 'MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS' } } }),
 });
 assert.equal(await service.translate('Patient Name', 'gu-IN', 'en'), 'Patient Name');
 assert.equal(service.cache.size, 0);
 assert.equal(Boolean(service.validTranslation('{0} patients', 'દર્દીઓ')), false);
 assert.equal(Boolean(service.validTranslation('{0} patients', '{0} દર્દીઓ')), true);
});

test('Traditional and Simplified Chinese remain distinct targets and cache keys', async () => {
 const service = await serviceWith({});
 assert.equal(service.getShortLang('zh-TW'), 'zh-TW');
 assert.equal(service.getShortLang('zh-CN'), 'zh-CN');
 assert.notEqual(service.getCacheKey('Patient', 'zh-TW'), service.getCacheKey('Patient', 'zh-CN'));
});
