import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const bundle = await build({
 entryPoints: ['src/Component/DoctorDashboard/Walk-in/AppointmentForm.jsx'],
 bundle: true, write: false, platform: 'node', format: 'cjs', external: ['react'], loader: { '.css': 'empty' },
 plugins: [{ name: 'booking-adapters', setup(builder) {
  builder.onResolve({ filter: /^(axios|react-router-dom)$|\/doctorApi\.js$|\/PortalTranslation$/ }, args => ({ path: args.path, namespace: 'test' }));
  builder.onLoad({ filter: /.*/, namespace: 'test' }, args => ({ contents:
   args.path === 'axios' ? 'export default globalThis.__qrBookingApi;' :
   args.path === 'react-router-dom' ? 'export const useLocation = () => ({search:globalThis.__qrBookingSearch || ""}); export const useNavigate = () => () => {};' :
   args.path.endsWith('doctorApi.js') ? 'export const API_BASE_URL = "https://example.invalid/api";' :
   `import React from 'react'; export const PortalText = ({text}) => text; export const PortalElement = ({as:Tag,children,...props}) => React.createElement(Tag,props,children); export const PatientLanguageControl = () => null; export const usePortalTranslator = () => text => text;`, loader: 'js' }));
 } }],
});
const clinicBooking = { doctorClinicId: 'link-1', doctorId: 'doctor-1', doctor: { name: 'Dr Test' }, clinic: { name: 'Clinic One' } };
const effectCleanups = [];
test.afterEach(() => { while (effectCleanups.length) effectCleanups.pop()(); });
const availableSlots = { date: '2099-09-22', slots: [
 { time: '10:00:00', available: false, booked: true, status: 'booked' },
 { time: '10:15:00', available: true, booked: false, status: 'available' },
] };
function load(react, api, search = '') {
 globalThis.__qrBookingApi = api;
 globalThis.__qrBookingSearch = search;
 const module = { exports: {} }, require = createRequire(import.meta.url);
 new Function('require', 'module', 'exports', bundle.outputFiles[0].text)(name => name === 'react' ? react : require(name), module, module.exports);
 return module.exports.default;
}
function harness(api, search) {
 const slots = [], effects = []; let cursor = 0;
 globalThis.window = { addEventListener() {}, removeEventListener() {} };
 const hooks = {
  createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
  useState: initial => {
   const index = cursor++;
   if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
   return [slots[index], next => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }];
  },
  useRef: initial => { const index = cursor++; return slots[index] ||= { current: initial }; },
  useEffect: (effect, dependencies) => {
   const index = cursor++;
   if (!slots[index] || dependencies.some((value, i) => value !== slots[index][i])) {
    slots[index] = dependencies;
    effects.push(effect);
   }
  },
 };
 const Form = load(hooks, { get: async url => ({ data: { data: url.endsWith('/slots') ? availableSlots : {} } }), ...api }, search);
 const render = props => { cursor = 0; return Form(props); };
 render.flush = async () => {
  while (effects.length) { const cleanup = effects.shift()(); if (cleanup) effectCleanups.push(cleanup); }
  for (let i = 0; i < 5; i++) await Promise.resolve();
 };
 return render;
}
function find(node, predicate) {
 if (!node || typeof node !== 'object') return null;
 if (predicate(node)) return node;
 for (const child of (node.props?.children || []).flat(Infinity)) { const result = find(child, predicate); if (result) return result; }
 return null;
}
const details = { patientName: 'Test Patient', contactNumber: '9876543210', problem: 'Checkup', dateOfBirth: '1990-01-01', location: 'Indore', gender: 'female', email: 'patient@example.com' };
function fill(render, props) {
 for (const [name, value] of Object.entries(details)) find(render(props), node => node.props?.name === name).props.onChange({ target: { name, value } });
 find(render(props), node => node.type === 'button' && node.props.className?.startsWith('qr-slot available')).props.onClick();
 return find(render(props), node => node.type === 'form').props.onSubmit;
}

test('clinic QR shows the full existing walk-in intake form and its locked clinic', () => {
 const Form = load(React, {});
 const html = renderToStaticMarkup(React.createElement(Form, { clinicBooking }));
 for (const field of ['patientName', 'contactNumber', 'problem', 'dateOfBirth', 'age', 'location', 'gender', 'email']) assert.ok(html.includes(`name="${field}"`), field);
 assert.doesNotMatch(html, /type="time"/);
 assert.match(html, /Available Slots/);
 assert.match(html, /Dr Test.*Clinic One/);
 assert.match(html, /Confirm Appointment/);
});

test('QR submission preserves clinic endpoint, details, retry id and blocks duplicate success', async () => {
 const calls = [];
 const render = harness({ post: async (url, payload) => {
  calls.push({ url, payload });
  if (calls.length === 1) throw new Error('Temporary failure');
  return { data: { data: { tokenNumber: 12 } } };
 } });
 const props = { clinicBooking };
 render(props); await render.flush();
 await fill(render, props)({ preventDefault() {} });
 await find(render(props), node => node.type === 'form').props.onSubmit({ preventDefault() {} });
 assert.equal(calls.length, 2);
 assert.equal(calls[0].url, 'https://example.invalid/api/qr/walkin/link-1');
 assert.equal(calls[0].payload.requestId, calls[1].payload.requestId);
 assert.equal(calls[1].payload.dateOfBirth, details.dateOfBirth);
 assert.equal(calls[1].payload.phoneNumber, details.contactNumber);
 assert.equal(calls[1].payload.location, details.location);
 assert.equal(calls[1].payload.email, details.email);
 assert.equal(calls[1].payload.appointmentTime, '10:15:00');
 assert.equal(calls[1].payload.doctor_id, undefined);
 assert.ok(find(render(props), node => node.type === 'button' && node.props.className?.startsWith('qr-slot booked') && node.props.children?.some(child => child?.props?.children?.includes('10:15'))));
 await find(render(props), node => node.type === 'form').props.onSubmit({ preventDefault() {} });
 assert.equal(calls.length, 2);
});

test('legacy doctor QR continues to use the walk-in booking API', async () => {
 let call;
 const render = harness({ post: async (url, payload) => { call = { url, payload }; return { data: { tokenNumber: 4 } }; } }, '?doctorId=doctor-legacy&source=qr');
 render({}); await render.flush();
 await fill(render, {})({ preventDefault() {} });
 assert.equal(call.url, 'https://example.invalid/api/walkin-appointments');
 assert.equal(call.payload.doctor_id, 'doctor-legacy');
 assert.equal(call.payload.booking_source, 'qr');
});

test('booked slots show Booked, stay disabled and selecting a slot is mandatory', async () => {
 let submitted = false;
 const render = harness({ post: async () => { submitted = true; } });
 const props = { clinicBooking };
 render(props); await render.flush();
 const tree = render(props);
 const booked = find(tree, node => node.type === 'button' && node.props.className?.startsWith('qr-slot booked'));
 assert.equal(booked.props.disabled, true);
 assert.ok(find(booked, node => node.props?.text === 'Booked'));
 for (const [name, value] of Object.entries(details)) find(render(props), node => node.props?.name === name).props.onChange({ target: { name, value } });
 await find(render(props), node => node.type === 'form').props.onSubmit({ preventDefault() {} });
 assert.equal(submitted, false);
 assert.ok(find(render(props), node => node.props?.role === 'alert'));
});
