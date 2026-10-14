import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const tabs = await (await fetch('http://127.0.0.1:9364/json/list')).json();
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
  let body = {success:true,history:Array.from({length:60},(_,i)=>({_id:'call-'+i,with:{_id:'person-'+i,fullName:'Consultant '+i},withType:'counsellor',type:'video',status:'completed',direction:'outgoing',duration:120,timestamp:new Date(Date.now()-i*60000).toISOString()}))};
  if (url.pathname === '/api/appointments') body = appointments();
  if (url.pathname.endsWith('/cancel') && request.method === 'PATCH') { cancellationRequests.push(url.pathname); cancelled=true; body={success:true,appointment:appointments()[0]}; }
  await call('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:'http://localhost:5173'},{name:'Access-Control-Allow-Credentials',value:'true'},{name:'Access-Control-Allow-Methods',value:'GET,POST,PATCH,OPTIONS'},{name:'Access-Control-Allow-Headers',value:'authorization,content-type'}], body: Buffer.from(JSON.stringify(body)).toString('base64') });
});
const evaluate = async expression => (await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
const waitFor = async expression => { const deadline=Date.now()+25000; while(Date.now()<deadline){if(await evaluate(expression))return;await new Promise(resolve=>setTimeout(resolve,150));}throw new Error(`UI check failed: ${expression}; ${errors.join('; ')}; ${await evaluate('document.body.innerText.slice(0,600)')}`); };
const screenshot = async name => { const image = await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}); await writeFile(new URL(name,import.meta.url),Buffer.from(image.data,'base64')); };

await call('Runtime.enable'); await call('Page.enable');
await call('Fetch.enable',{patterns:[{urlPattern:'*localhost:5006/*'},{urlPattern:'*socketService*'}]});
for(const role of ['user','counselor']){
 for(const width of [1440,390]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width===390});
  await call('Page.navigate',{url:'http://localhost:5173/test-artifacts/portal-header-calls/preview.html?role='+role});
  await waitFor('document.querySelectorAll(".pch-call-card").length===60');
  const geometry=await evaluate(`(()=>{const r=document.querySelector('.pch-records'),s=document.querySelector('.pch-compact-list'),h=document.querySelector('.portal-page-header');return {records:[r.clientHeight,r.scrollHeight],sidebar:[s.clientHeight,s.scrollHeight],header:h.getBoundingClientRect().top,bodyHeight:document.documentElement.scrollHeight,viewport:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth};})()`);
  assert(geometry.records[0]>100,JSON.stringify(geometry));
  assert(geometry.records[1]>geometry.records[0],JSON.stringify(geometry));
  assert(geometry.sidebar[1]>geometry.sidebar[0],JSON.stringify(geometry));
  assert(!geometry.overflow,JSON.stringify(geometry));
  assert(geometry.bodyHeight<=geometry.viewport+1,JSON.stringify(geometry));
  await evaluate('document.querySelector(".pch-records").scrollTop=400');
  assert.equal(await evaluate('document.querySelector(".pch-records").scrollTop'),400);
  assert.equal(await evaluate('document.querySelector(".portal-page-header").getBoundingClientRect().top'),geometry.header);
  assert.equal(await evaluate('document.querySelector(".pch-compact-list").scrollTop'),0);
  await screenshot(role+'-'+width+'.png');
  console.log('PASS: '+role+' '+width+'px independent scrolling and fixed header',geometry);
 }
}
assert.equal(errors.length,0,errors.join('\n'));
await call('Browser.close');ws.close();
