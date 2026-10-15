const { build } = require('esbuild');
const path = require('node:path');

async function check() {
  const result = await build({
    stdin: { resolveDir: path.join(__dirname, '..'), loader: 'jsx', contents: `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';
      import assert from 'node:assert/strict';
      import { AppointmentTable, VitalsDialog } from './src/Component/Receptionist/AppointmentViews.jsx';
      import { indiaToday } from './src/Component/Receptionist/receptionistView.js';
      import { receptionistMenu } from './src/Component/Receptionist/receptionistRoutes.js';
      const patient = { id: 'visit', source: 'online', patientName: 'Test Patient', date: indiaToday(), phoneNumber: '9876543210', status: 'confirmed', queueStatus: 'waiting', timing: {} };
      function render(element, role = 'receptionist', state) {
        return renderToStaticMarkup(<MemoryRouter initialEntries={[{pathname:'/',state}]}><Routes><Route element={<Outlet context={{profile:{role},clinic:'clinic'}}/>}><Route path="/" element={element}/></Route></Routes></MemoryRouter>);
      }
      assert.ok(!receptionistMenu.some(item => item.path === '/receptionist/vitals' || item.title === 'Add Vitals'));
      const table = render(<AppointmentTable rows={[patient]} clinics={[]} onView={()=>{}}/>);
      assert.match(table, /Add vitals/);
      assert.match(table, /Phone number/);
      assert.match(table, /9876543210/);
      const oldTable = render(<AppointmentTable rows={[{...patient,date:'2000-01-01'}]} clinics={[]} onView={()=>{}}/>);
      assert.doesNotMatch(oldTable, /Add vitals|Edit vitals/);
      const completeTable = render(<AppointmentTable rows={[{...patient,status:'completed'}]} clinics={[]} onView={()=>{}}/>);
      assert.doesNotMatch(completeTable, /Add vitals|Edit vitals/);
      const modal = render(<VitalsDialog patient={patient} close={()=>{}} onSaved={()=>{}}/>);
      assert.match(modal, /<dialog/);
      assert.match(modal, /Test Patient/);
      assert.match(modal, /Add patient vitals/);
      assert.match(modal, /<form/);
      assert.match(modal, /Save vitals/);
      assert.match(modal, /Blood pressure/);
      assert.equal((modal.match(/type="number"/g) || []).length, 7);
      assert.match(modal, /<textarea/);
      const editModal = render(<VitalsDialog patient={{...patient,vitals:{pulse:75,blood_pressure:'120/80'}}} close={()=>{}}/>);
      assert.match(editModal, /Edit patient vitals/);
      assert.match(editModal, /value="75"/);
      assert.ok(editModal.includes('value="120/80"'));
      const completedModal = render(<VitalsDialog patient={{...patient,status:'completed'}} close={()=>{}}/>);
      assert.doesNotMatch(completedModal, /<form/);
      assert.ok(!table.includes('href="/receptionist/vitals"'));
      const otherRole = render(<AppointmentTable rows={[patient]} clinics={[]} onView={()=>{}}/>, 'billing');
      assert.doesNotMatch(otherRole, /Add vitals|Edit vitals/);
      console.log('PASS: separate Add Vitals menu removed; appointment action, add/edit modal inputs, saved reading values, phone column and completed-visit read-only behavior pass.');
    ` },
    bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', loader: { '.css': 'empty' },
    plugins: [{ name: 'test-adapters', setup(builder) {
      builder.onResolve({ filter: /PortalTranslation$/ }, () => ({ path: 'translation', namespace: 'test' }));
      builder.onResolve({ filter: /axiosConfig\.js$/ }, () => ({ path: 'api', namespace: 'test' }));
      builder.onLoad({ filter: /.*/, namespace: 'test' }, args => ({
        contents: args.path === 'translation' ? 'export const PortalText = ({text}) => text; export const PortalElement = () => null;' : 'export default {get: async()=>({data:{appointments:[],total:0}})};', loader: 'js',
      }));
    } }],
  });
  const originalError = console.error;
  // MemoryRouter's layout effects are intentionally inactive in server rendering.
  console.error = () => {};
  try { new Function('require', result.outputFiles[0].text)(require); }
  finally { console.error = originalError; }
}
check().catch(error => { console.error(error); process.exitCode = 1; });
