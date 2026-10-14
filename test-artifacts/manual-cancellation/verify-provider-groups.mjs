import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const tabs = await (await fetch('http://127.0.0.1:9362/json/list')).json();
const ws = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let sequence = 0, cancelled = false;
const pending = new Map(), errors = [], cancellationRequests = [];
const call = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
const doctor = { _id: 'doctor-a', fullName: 'Doctor A', role: 'doctor', specialization: ['General medicine'] };
const consultant = { _id: 'consultant-b', fullName: 'Consultant B', role: 'counsellor', specialization: ['Therapy'] };
const appointments = () => [
  { _id: 'booking-a', counselor: doctor, date: '2026-10-14T09:20:00Z', appointment_date: '2026-10-14', appointment_time: '14:50:00', status: cancelled ? 'canceled' : 'pending', queue_status: cancelled ? 'canceled' : 'skipped', token_number: 1 },
  { _id: 'booking-old', counselor: doctor, date: '2026-10-01T08:00:00Z', appointment_date: '2026-10-01', appointment_time: '13:30:00', status: 'completed', queue_status: 'completed', consultation_started_at: '2026-10-01T08:00:00Z', token_number: 2 },
  { _id: 'consultant-booking', counselor: consultant, date: '2026-10-10T08:00:00Z', appointment_date: '2026-10-10', appointment_time: '13:30:00', status: 'confirmed', queue_status: 'booked' },
];
const socketMock = `const socket={on(){return socket;},off(){return socket;},connected:true};const service={connect:async()=>socket,off(){},emit:async()=>{}};export default service;export const socketService=service;`;
ws.addEventListener('message', async event => {
  const message = JSON.parse(event.data);
  if (message.id) { const task = pending.get(message.id); pending.delete(message.id); if(message.error) task?.reject(message.error); else task?.resolve(message.result); }
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  if (message.method === 'Page.javascriptDialogOpening') await call('Page.handleJavaScriptDialog', { accept: true });
  if (message.method !== 'Fetch.requestPaused') return;
  const { requestId, request } = message.params; const url = new URL(request.url);
  if (url.pathname.includes('socketService')) { await call('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{name:'Content-Type',value:'text/javascript'}], body: Buffer.from(socketMock).toString('base64') }); return; }
  let body = { success: true, data: [], appointments: [], counsellors: [], notifications: [] };
  if (url.pathname === '/api/appointments') body = appointments();
  if (url.pathname.endsWith('/cancel') && request.method === 'PATCH') { cancellationRequests.push(url.pathname); cancelled=true; body={success:true,appointment:appointments()[0]}; }
  await call('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:'http://localhost:5173'},{name:'Access-Control-Allow-Credentials',value:'true'},{name:'Access-Control-Allow-Methods',value:'GET,POST,PATCH,OPTIONS'},{name:'Access-Control-Allow-Headers',value:'authorization,content-type'}], body: Buffer.from(JSON.stringify(body)).toString('base64') });
});
const evaluate = async expression => (await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
const waitFor = async expression => { const deadline=Date.now()+25000; while(Date.now()<deadline){if(await evaluate(expression))return;await new Promise(resolve=>setTimeout(resolve,150));}throw new Error(`UI check failed: ${expression}; ${errors.join('; ')}; ${await evaluate('document.body.innerText.slice(0,600)')}`); };
const screenshot = async name => { const image = await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}); await writeFile(new URL(name,import.meta.url),Buffer.from(image.data,'base64')); };
await call('Runtime.enable'); await call('Page.enable');
await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await call('Fetch.enable',{patterns:[{urlPattern:'*localhost:5006/*'},{urlPattern:'*socketService*'}]});
await call('Page.navigate',{url:'http://localhost:5173/test-artifacts/manual-cancellation/preview.html'});
await waitFor(`document.querySelectorAll('.user-provider-card').length===2`);
assert.equal(await evaluate(`document.querySelectorAll('.user-appointment-card').length`),0);
await screenshot('providers-desktop.png');
console.log('PASS: three appointments render as two provider cards');
await evaluate(`[...document.querySelectorAll('.user-provider-card')].find(card=>card.textContent.includes('Doctor A')).click()`);
await waitFor(`document.querySelectorAll('.user-appointment-card').length===2`);
assert.deepEqual(await evaluate(`[...document.querySelectorAll('.user-appointment-person h2')].map(node=>node.textContent.trim())`),['Doctor A','Doctor A']);
await screenshot('doctor-history-desktop.png');
console.log('PASS: opening the doctor shows both visits and excludes consultant appointments');
await evaluate(`[...document.querySelectorAll('.user-appointments-status-pills button')].find(button=>button.textContent.trim()==='Completed').click()`);
await waitFor(`document.querySelectorAll('.user-appointment-card').length===1`);
assert.equal(await evaluate(`document.querySelector('.user-appointment-status').textContent.trim()`),'Completed');
await evaluate(`[...document.querySelectorAll('.user-appointments-status-pills button')].find(button=>button.textContent.trim()==='All').click()`);
await waitFor(`document.querySelectorAll('.user-appointment-card').length===2`);
await evaluate(`[...document.querySelectorAll('button')].find(button=>button.textContent.trim()==='Cancel Appointment').click()`);
await waitFor(`Boolean(document.querySelector('.user-appointment-status.canceled'))`);
assert.deepEqual(cancellationRequests,['/api/appointments/booking-a/cancel']);
console.log('PASS: status filters and cancellation continue to work inside provider history');
await evaluate(`document.querySelector('.user-provider-history-header button').click()`);
await waitFor(`document.querySelectorAll('.user-provider-card').length===2`);
await evaluate(`[...document.querySelectorAll('.user-provider-card')].find(card=>card.textContent.includes('Consultant B')).click()`);
await waitFor(`document.querySelectorAll('.user-appointment-card').length===1`);
assert.equal(await evaluate(`document.querySelector('.user-appointment-person h2').textContent.trim()`),'Consultant B');
console.log('PASS: back navigation and consultant history show the correct appointments');
await evaluate(`document.querySelector('.user-provider-history-header button').click()`);
await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
await waitFor(`document.querySelectorAll('.user-provider-card').length===2`);
assert.equal(await evaluate(`document.documentElement.scrollWidth <= window.innerWidth`),true);
await screenshot('providers-mobile.png');
console.log('PASS: provider list fits a mobile screen');
assert.equal(errors.length,0,errors.join('\n'));
await call('Browser.close');ws.close();
