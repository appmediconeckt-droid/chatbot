import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const tabs = await (await fetch('http://127.0.0.1:9358/json/list')).json();
const ws = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let sequence = 0, firstOnline = true;
const pending = new Map(), errors = [], apiRequests = [];
const call = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params }));
});
const professionals = () => [
  { _id: 'consultant-a', fullName: 'Online Consultant', role: 'counsellor', qualification: 'MD', specialization: ['Therapy'], isActive: true, profileCompleted: true, isOnline: firstOnline, socketOnline: firstOnline, hasActiveSession: firstOnline, presenceStatus: firstOnline ? 'online' : 'offline' },
  { _id: 'consultant-b', fullName: 'Offline Consultant', role: 'counsellor', qualification: 'MD', specialization: ['Therapy'], isActive: true, profileCompleted: true, isOnline: !firstOnline, socketOnline: !firstOnline, hasActiveSession: !firstOnline, presenceStatus: !firstOnline ? 'online' : 'offline' },
];
const socketMock = `const handlers = new Map(); const socket = { connected: true, on(event, callback) { if (!handlers.has(event)) handlers.set(event, new Set()); handlers.get(event).add(callback); return socket; }, off(event, callback) { handlers.get(event)?.delete(callback); return socket; }, emit() {} }; window.emitTestPresence = payload => handlers.get('presence-update')?.forEach(callback => callback(payload)); const service = { connect: async () => socket, off: (event, callback) => socket.off(event, callback), emit: async () => {}, isConnected: () => true, disconnect() {} }; export const socketService = service; export default service;`;
ws.addEventListener('message', async event => {
  const message = JSON.parse(event.data);
  if (message.id) { const task = pending.get(message.id); pending.delete(message.id); if (message.error) task?.reject(message.error); else task?.resolve(message.result); }
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  if (message.method !== 'Fetch.requestPaused') return;
  const { requestId, request } = message.params;
  const url = new URL(request.url);
  apiRequests.push(`${request.method} ${url.pathname}`);
  if (url.pathname.includes('socketService')) {
    await call('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/javascript' }], body: Buffer.from(socketMock).toString('base64') }); return;
  }
  let body = { success: true, data: [], chats: [], requests: [], messages: [], pending: [], notifications: [] };
  if (url.pathname === '/api/auth/counsellors') body = { success: true, counsellors: professionals() };
  if (url.pathname === '/api/auth/users') body = { success: true, users: professionals().map(user => ({ id: user._id, fullName: user.fullName, role: user.role, isActive: true, specialization: user.specialization, lastSeen: '2026-10-14T00:00:00Z' })) };
  if (url.pathname === '/api/auth/me') body = { success: true, user: { _id: 'test-patient', fullName: 'Test Patient', role: 'user' } };
  await call('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: 'http://localhost:5173' }, { name: 'Access-Control-Allow-Credentials', value: 'true' }, { name: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,OPTIONS' }, { name: 'Access-Control-Allow-Headers', value: 'authorization,content-type,x-requested-with,accept' }], body: Buffer.from(JSON.stringify(body)).toString('base64') });
});
const evaluate = async expression => (await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
const waitFor = async expression => {
  const deadline = Date.now() + 25000;
  while (Date.now() < deadline) { if (await evaluate(expression)) return; await new Promise(resolve => setTimeout(resolve, 150)); }
  throw new Error(`Browser condition failed: ${expression}; errors: ${errors.join('; ')}; API: ${apiRequests.join(', ')}; page: ${await evaluate('document.body.innerText.slice(0,500)')}`);
};
const stateExpression = `Object.fromEntries([...document.querySelectorAll('.counselor-card-unique')].map(card => [card.querySelector('.counselor-name-unique').textContent.trim(), card.querySelector('.status-dot-unique').classList.contains('online')]))`;
await call('Runtime.enable');
await call('Page.enable');
await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await call('Fetch.enable', { patterns: [{ urlPattern: '*localhost:5006/*' }, { urlPattern: '*socketService*' }] });
await call('Page.navigate', { url: 'http://localhost:5173/test-artifacts/consultant-presence-browser/preview.html' });
await waitFor(`document.querySelectorAll('.counselor-card-unique').length === 2`);
assert.deepEqual(await evaluate(stateExpression), { 'Online Consultant': true, 'Offline Consultant': false });
console.log('PASS: actual Consultant menu shows Online and Offline correctly despite fallback user lists');
await evaluate(`window.emitTestPresence({userId:'consultant-a',isOnline:false}); window.emitTestPresence({userId:'consultant-b',isOnline:true});`);
await waitFor(`(${stateExpression})['Online Consultant'] === false && (${stateExpression})['Offline Consultant'] === true`);
console.log('PASS: socket transitions update both online and offline badges');
firstOnline = false;
await evaluate(`document.dispatchEvent(new Event('visibilitychange'));`);
await new Promise(resolve => setTimeout(resolve, 800));
assert.deepEqual(await evaluate(stateExpression), { 'Online Consultant': false, 'Offline Consultant': true });
console.log('PASS: directory refresh retains the latest live presence');
const screenshot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
await writeFile(new URL('./verified.png', import.meta.url), Buffer.from(screenshot.data, 'base64'));
assert.equal(errors.length, 0, errors.join('\n'));
await call('Browser.close');
ws.close();
