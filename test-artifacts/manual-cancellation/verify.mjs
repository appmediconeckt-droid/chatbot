import assert from 'node:assert/strict';
const tabs = await (await fetch('http://127.0.0.1:9360/json/list')).json();
const ws = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let sequence = 0, cancelled = false;
const pending = new Map(), cancellations = [], errors = [];
const call = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
const doctor = { _id: 'doctor-a', fullName: 'Doctor A', role: 'doctor' };
const appointment = () => ({ _id: 'booking-a', counselor: doctor, patient: { _id: 'patient-a' }, date: '2020-01-01T10:00:00Z', appointment_date: '2020-01-01', appointment_time: '10:00:00', status: cancelled ? 'canceled' : 'pending', queue_status: cancelled ? 'canceled' : 'skipped', token_number: 1 });
const socketMock = `const socket={on(){return socket;},off(){return socket;},emit(){},connected:true}; const service={connect:async()=>socket,off(){},emit:async()=>{},isConnected:()=>true}; export default service; export const socketService=service;`;
ws.addEventListener('message', async event => {
  const message = JSON.parse(event.data);
  if (message.id) { const task = pending.get(message.id); pending.delete(message.id); if(message.error) task?.reject(message.error); else task?.resolve(message.result); }
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  if (message.method === 'Page.javascriptDialogOpening') await call('Page.handleJavaScriptDialog', { accept: true });
  if (message.method !== 'Fetch.requestPaused') return;
  const { requestId, request } = message.params; const url = new URL(request.url);
  if (url.pathname.includes('socketService')) { await call('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{name:'Content-Type',value:'text/javascript'}], body: Buffer.from(socketMock).toString('base64') }); return; }
  let body = { success: true, data: [], appointments: [], counsellors: [], notifications: [], requests: [], chats: [] };
  if (url.pathname === '/api/appointments') body = [appointment()];
  if (url.pathname.endsWith('/cancel') && request.method === 'PATCH') { cancellations.push(JSON.parse(request.postData || '{}')); cancelled = true; body = { success: true, message: 'Appointment cancelled', appointment: appointment() }; }
  if (url.pathname === '/api/staff/appointments') body = { success: true, doctor: { id: 'doctor-a', fullName: 'Doctor A' }, clinics: [{id:'clinic-a',clinic_name:'Clinic A'}], appointments: [{ id: 'walkin-a', source: 'walkin', patientName: 'Patient A', phoneNumber: '9876543210', date: '2020-01-01', time: '10:00', token: 2, clinicId: 'clinic-a', status: cancelled ? 'canceled' : 'booked', queueStatus: cancelled ? 'canceled' : 'waiting', timing: {} }], total: 1, page: 1, limit: 10, completed: 0 };
  await call('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:'http://localhost:5173'},{name:'Access-Control-Allow-Credentials',value:'true'},{name:'Access-Control-Allow-Methods',value:'GET,POST,PATCH,OPTIONS'},{name:'Access-Control-Allow-Headers',value:'authorization,content-type'}], body: Buffer.from(JSON.stringify(body)).toString('base64') });
});
const evaluate = async expression => (await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
const waitFor = async expression => { const deadline=Date.now()+25000; while(Date.now()<deadline){if(await evaluate(expression))return;await new Promise(resolve=>setTimeout(resolve,150));}throw new Error(`UI check failed: ${expression}; ${errors.join('; ')}; ${await evaluate('document.body.innerText.slice(0,700)')}`); };
const cancelButton = `[...document.querySelectorAll('button')].find(button=>button.textContent.trim()==='Cancel Appointment')`;
const waitForCancellation = async count => {
  const deadline = Date.now() + 10000;
  while (cancellations.length < count && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 100));
  assert.equal(cancellations.length, count, 'Cancellation request was not sent');
};
await call('Runtime.enable'); await call('Page.enable');
await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await call('Fetch.enable',{patterns:[{urlPattern:'*localhost:5006/*'},{urlPattern:'*socketService*'}]});
await call('Page.navigate',{url:'http://localhost:5173/test-artifacts/manual-cancellation/preview.html'});
await waitFor(`Boolean(${cancelButton})`);
await evaluate(`(${cancelButton}).click()`);
await waitForCancellation(1);
await waitFor(`!(${cancelButton})`);
assert.equal(cancellations[0].source,'online');
console.log('PASS: patient sees Cancel Appointment for a skipped, unstarted doctor booking and can cancel it');
cancelled=false;
await call('Page.navigate',{url:'http://localhost:5173/test-artifacts/manual-cancellation/preview.html?role=receptionist'});
await waitFor(`Boolean(${cancelButton})`);
await evaluate(`(${cancelButton}).click()`);
await waitForCancellation(2);
await waitFor(`!(${cancelButton}) && Boolean(document.querySelector('.rec-table .rec-badge.canceled'))`);
assert.equal(cancellations[1].source,'walkin');
console.log('PASS: receptionist can cancel an assigned-clinic walk-in through the Appointments page');
assert.equal(errors.length,0,errors.join('\n'));
await call('Browser.close'); ws.close();
