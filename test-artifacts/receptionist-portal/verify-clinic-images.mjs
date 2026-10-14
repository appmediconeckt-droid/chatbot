import { readFile, writeFile } from 'node:fs/promises';
const tabs = await (await fetch('http://127.0.0.1:9342/json/list')).json();
const ws = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let sequence = 0;
const pending = new Map();
const errors = [];
const requests = [];
const fixtureImage = await readFile('public/favicon-96.png');
let imageChanged=false;
const clinicFixtures=[{_id:'clinic-one',doctor_id:'doctor-fixture',clinic_name:'First Clinic',location:'Pune',phone_number:'9876543210',clinic_photo:'/uploads/clinic-photo-fixture-one.png'},{_id:'clinic-two',doctor_id:'doctor-fixture',clinic_name:'Second Clinic',location:'Mumbai',phone_number:'9876543210',clinic_photo:'https://res.cloudinary.com/fixture/image/upload/clinic-photo-fixture-two.png'}];
const call = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
let profile = { id: 'staff-fixture', fullName: 'Viju Wagh', role: 'receptionist', email: 'reception@example.test', phoneNumber: '9876543210', assignedDoctor: 'doctor-fixture', assignedDoctorName: 'Dr. Meera Shah', clinic_name: 'City Care Clinic', department: 'Administration', shift: 'Morning', shiftTime: '09:00 - 17:00' };
const clinics = [{ id: 'clinic-fixture', clinic_name: 'City Care Clinic', location: 'Pune, Maharashtra', phone_number: '0201234567' }];
const prescribedMedicine = {name:'Recorded medicine',dosage:'10 mg',timeOfDay:['Night'],timing:'After meals',duration:'5 days'};
const appointments = Array.from({ length: 14 }, (_, i) => ({ id: `appointment-${i}`, source: i % 2 ? 'walkin' : 'online', clinicId: 'clinic-fixture', patientName: ['Ananya Patil', 'Rahul Deshmukh', 'Neha Joshi', 'Amit Kulkarni'][i % 4], phoneNumber: `98765432${String(i).padStart(2,'0')}`, token: i + 1, time: `10:${String(i * 4).padStart(2,'0')}`, date: today, status: i > 11 ? 'completed' : 'confirmed', queueStatus: i === 0 ? 'in_progress' : i > 11 ? 'completed' : 'waiting', symptoms: 'Routine consultation', diagnosis: 'Recorded by doctor', advice: 'Follow up as advised', timing: { startedAt: i === 0 ? new Date().toISOString() : null, endedAt: null, pauses: [] } }));
let ledToken = 1;
let passwordStatus = 401;
let directoryPatientDeleted = false;
const displayClinics = [{ doctorClinicId: 'led-clinic-one', clinicId: 'clinic-fixture', doctor: { name: 'Dr. Meera Shah' }, clinic: { id: 'clinic-fixture', name: 'City Care Clinic', room: '101' } }, { doctorClinicId: 'led-clinic-two', clinicId: 'clinic-two', doctor: { name: 'Dr. Meera Shah' }, clinic: { id: 'clinic-two', name: 'Evening Care Clinic', room: '202' } }];
const historyRecords = appointments.map((row,i)=>({id:`history-${i}`,source:i%2?'walkin':'online',patient:{id:'patient-fixture',name:row.patientName,phoneNumber:row.phoneNumber,gender:'female'},doctor:{id:'doctor-fixture',name:'Dr. Meera Shah'},clinicId:'clinic-fixture',checkedDate:today,checkedAt:new Date().toISOString(),token:row.token,diagnosis:'Recorded diagnosis',hasPrescription:true,prescription:{id:`appointment:history-${i}`,source:'appointment',visitSource:i%2?'walkin':'online',issuedAt:today,patient:{id:'patient-fixture',name:row.patientName,gender:'female'},psychiatrist:{id:'doctor-fixture',name:'Dr. Meera Shah',role:'doctor'},problem:'Routine consultation',diagnosis:'Recorded diagnosis',medicines:[prescribedMedicine],advice:'Recorded advice',recommendedTests:[{testName:'Recorded test'}],followUpDate:'2026-10-20'}}));
const directoryPatientRows = Array.from({length:12},(_,i)=>({_id:`directory-visit-${i}`,patient:{_id:`directory-patient-${i}`,fullName:`Directory Patient ${i}`,phoneNumber:'9876543210',age:30,gender:'female',isActive:true},counselor:{_id:'doctor-fixture',fullName:'Dr. Meera Shah'},appointment_date:today,status:'completed',medicines:[prescribedMedicine],diagnosis:'Recorded diagnosis',advice:'Recorded advice'}));
for(let i=1;i<12;i++) directoryPatientRows.push({...directoryPatientRows[0],_id:`extra-visit-${i}`});
directoryPatientRows.push({_id:'orphan-visit',patient:null,patient_name:'Deleted account snapshot',counselor:{_id:'doctor-fixture',fullName:'Dr. Meera Shah'},appointment_date:today,status:'completed'});
historyRecords[0].doctor = {id:'doctor-fixture'};
const payload = { success: true, doctor: { fullName: 'Dr. Meera Shah', email: 'doctor@example.test', phoneNumber: '9876543210', qualification: 'MBBS, MD', specialization: ['General Medicine'], experience: 12, languages: ['English', 'Hindi', 'Marathi'], consultationMode: ['online', 'offline'], location: 'Pune', aboutMe: 'Comprehensive, patient-focused care for every visit.' }, clinics, date: today, appointments, currentPatients: [appointments[0]], waiting: appointments.slice(1,12), summary: { total: 14, waiting: 11, ongoing: 1, completed: 2 }, updatedAt: new Date().toISOString(), timing: null };
ws.addEventListener('message', async event => {
 const message = JSON.parse(event.data);
 if (message.id) { const task = pending.get(message.id); pending.delete(message.id); if (message.error) task.reject(message.error); else task.resolve(message.result); }
 if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text + ': ' + (message.params.exceptionDetails.exception?.description || ''));
 if (message.method === 'Fetch.requestPaused') {
  const { requestId, request } = message.params;
  const url = new URL(request.url); requests.push(url.pathname + url.search);
  if (url.pathname.includes('clinic-photo-fixture')) {
   await call('Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'image/png'},{name:'Cross-Origin-Resource-Policy',value:'cross-origin'}],body:fixtureImage.toString('base64')}); return;
  }
  let body = { success: true };
  if(url.pathname==='/api/clinics') body={success:true,clinics:clinicFixtures};
  if(url.pathname==='/api/clinics/clinic-two' && request.method==='PATCH') {
   imageChanged=true;clinicFixtures[1].clinic_photo='https://res.cloudinary.com/fixture/image/upload/clinic-photo-fixture-updated.png';body={success:true,clinic:clinicFixtures[1]};
  }
  if (url.pathname.endsWith('/translate/text')) {
    const value = JSON.parse(request.postData || '{}');
    body = { translatedText: value.text?.split(/(ZXQ\d+QXZ)/).map(part => /^ZXQ/.test(part) ? part : `[${value.to}] ${part}`).join('') };
  }
  if (url.pathname === '/api/qr/doctors/doctor-fixture/profile') body = {success:true,data:{name:'Dr. Meera Shah',qualification:'MBBS',clinics:[{doctorClinicId:'led-clinic-one',clinic:{name:'City Care Clinic',address:'Pune'},timings:[]}]}};
  if (url.pathname === '/api/qr/walkin/led-clinic-one') body = {success:true,data:{doctor:{name:'Dr. Meera Shah'},clinic:{name:'City Care Clinic',address:'Pune',room:'101'}}};
  if (url.pathname === '/api/staff/patient-history') {
    let records=historyRecords.filter(row=>(!url.searchParams.get('search') || row.patient.name.toLowerCase().includes(url.searchParams.get('search').toLowerCase())) && (!url.searchParams.get('source') || url.searchParams.get('source')==='all' || row.source===url.searchParams.get('source')));
    const page=Number(url.searchParams.get('page')||1);
    body={success:true,records:records.slice((page-1)*10,page*10),total:records.length,page,clinics,doctor:{id:'doctor-fixture',name:'Dr. Meera Shah'},summary:{visits:records.length,patients:4,prescriptions:records.length},updatedAt:new Date().toISOString()};
  }
  if (url.pathname === '/api/prescriptions/my') body={success:true,prescriptions:historyRecords.slice(0,2).map(row=>row.prescription)};
  if (url.pathname === '/api/appointments') body=historyRecords.filter(row=>row.source==='online').map(row=>({_id:row.id,patient:{_id:'patient-fixture',fullName:row.patient.name,phoneNumber:row.patient.phoneNumber,gender:'female'},counselor:{_id:'doctor-fixture',fullName:'Dr. Meera Shah'},appointment_date:today,status:'completed',medicines:[prescribedMedicine],diagnosis:row.diagnosis,advice:'Recorded advice'}));
  if (url.pathname === '/api/walkin-appointments') body={success:true,data:historyRecords.filter(row=>row.source==='walkin').map(row=>({id:row.id,patient_id:'patient-fixture',patient_name:row.patient.name,phone_number:row.patient.phoneNumber,doctor_id:'doctor-fixture',appointment_date:today,appointment_status:'completed',medicines:[prescribedMedicine],diagnosis:row.diagnosis,advice:'Recorded advice'}))};
  if (url.pathname === '/api/appointments' && url.searchParams.get('patient_directory')==='true') body=directoryPatientRows.filter(row=>!directoryPatientDeleted || row.patient?._id!=='directory-patient-0');
  if (url.pathname === '/api/walkin-appointments' && url.searchParams.get('patient_directory')==='true') body={success:true,data:[{id:'unregistered-visit',patient_id:null,patient_name:'Unregistered walk-in visitor',phone_number:'9876543210',age:25,gender:'male',doctor_id:'doctor-fixture',appointment_date:today,appointment_status:'completed',medicines:[prescribedMedicine]}]};
  if (url.pathname === '/api/auth/me') body = { success: true, user: profile };
  if (url.pathname === '/api/staff/receptionist/dashboard') body = { ...payload, date: url.searchParams.get('date') || today, timing: url.searchParams.get('clinic_id') ? { breakInfo: { headline: 'No delay reported' }, estimatedWaitMinutes: 15 } : null };
  if (url.pathname === '/api/qr/doctors/doctor-fixture/clinics') body = { success: true, data: { clinics: displayClinics } };
  if (/^\/api\/qr\/walkin\/led-clinic-(one|two)\/queue$/.test(url.pathname)) body = { success: true, current: { token: ledToken, status: 'in_progress' }, nextTokens: [2,3], waitingCount: 11, completedCount: 2, roomId: url.pathname.includes('two') ? '202' : '101', doctor: { name: 'Dr. Meera Shah' }, breakInfo: { headline: 'No delay reported' }, estimatedWaitMinutes: 15 };
  if (url.pathname === '/api/auth/changePassword') body = passwordStatus === 200 ? {success:true,message:'Password changed successfully. Please log in again.'} : {success:false,message:'Old password is incorrect'};
  await call('Fetch.fulfillRequest', { requestId, responseCode: request.method !== 'OPTIONS' && url.pathname === '/api/auth/changePassword' ? passwordStatus : 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: 'http://localhost:5173' }, { name: 'Access-Control-Allow-Credentials', value: 'true' }, { name: 'Access-Control-Allow-Headers', value: 'authorization, content-type' }, { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PATCH, DELETE, OPTIONS' }], body: Buffer.from(JSON.stringify(body)).toString('base64') });
 }
});
await call('Page.enable'); await call('Runtime.enable');
await call('Fetch.enable', { patterns: [{ urlPattern: '*api/*' },{urlPattern:'*clinic-photo-fixture*'}] });
profile = {...profile,id:'doctor-fixture',role:'doctor',accountType:'doctor',fullName:'Dr. Meera Shah',profileCompleted:true};
const seed = await call('Page.addScriptToEvaluateOnNewDocument', {source:`localStorage.clear();localStorage.setItem('doctorLang','en-US');localStorage.setItem('accessToken','fixture-token');localStorage.setItem('token','fixture-token');localStorage.setItem('isAuthenticated','true');localStorage.setItem('userRole','doctor');localStorage.setItem('userData',${JSON.stringify(JSON.stringify(profile))});`});
const evaluate = async expression => { const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails)); return result.result.value; };
const waitFor = async expression => { for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await new Promise(resolve => setTimeout(resolve, 200)); } console.log(JSON.stringify({url: await evaluate('location.href'), body: await evaluate('document.body.innerText.slice(0,2000)'), errors, requests})); throw new Error(`Timed out: ${expression}`); };
const assert = (value, message) => { if (!value) throw new Error(message); };
await call('Network.enable');
await call('Network.setBypassServiceWorker', { bypass: true });


await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await call('Page.navigate',{url:'http://localhost:5173/clinicpage'});
await waitFor(`document.querySelector('.doctor-clinic-management select')?.options.length===2`);
await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:seed.identifier});errors.length=0;
assert(await evaluate(`document.querySelector('.doctor-clinic-image-list')===null && document.querySelector('input[type=file]')===null`),'Removed clinic controls are still visible');
await waitFor(`document.querySelector('.doctor-clinic-hero > img').complete && document.querySelector('.doctor-clinic-hero > img').naturalWidth>0`);
assert(await evaluate(`document.querySelector('.doctor-clinic-hero > img').src.includes('/uploads/clinic-photo-fixture-one.png')`),'Saved clinic image missing');
await evaluate(`{const select=document.querySelector('.doctor-clinic-management select');select.value='1';select.dispatchEvent(new Event('change',{bubbles:true}));}`);
await waitFor(`document.querySelector('.doctor-clinic-hero h1').textContent==='Second Clinic'`);
assert(await evaluate(`document.querySelector('.doctor-clinic-hero > img').src.includes('clinic-photo-fixture-two.png')`),'Selected clinic image wrong');
await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
await new Promise(resolve=>setTimeout(resolve,250));
assert(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),'Clinic mobile overflow');
assert(await evaluate(`document.querySelector('.doctor-clinic-specialists-section')===null && document.querySelector('.doctor-clinic-doctor-card')===null`),'Removed clinic doctor section still visible');
assert(errors.length===0,errors.join('; '));
await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true}).then(result=>writeFile('test-artifacts/receptionist-portal/clinic-images-fixed.png',Buffer.from(result.data,'base64')));
console.log(JSON.stringify({success:true,checks:['top clinic cards removed','clinic upload removed','saved local and cloud images','dropdown clinic selection','mobile layout','clinic doctor section removed'],errors}));ws.close();
