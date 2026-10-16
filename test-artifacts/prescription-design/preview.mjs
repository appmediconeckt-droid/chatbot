import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
const folder = 'test-artifacts/prescription-design';
const record = { id: 'RX-20261016-001', issuedAt: '2026-10-16', token: 12,
  doctor: { fullName: 'Dr. Example Physician', qualification: 'MBBS, MD (General Medicine)', specialization: ['Consultant Physician'], registrationNumber: 'DEMO-12345', phoneNumber: '+91 90000 00000', email: 'doctor@example.test' },
  clinic: { clinic_name: 'Example Medical Clinic', address: 'Sample address, New Delhi' },
  patient: { name: 'Sample Patient', id: 'PT-001', age: 25, gender: 'Female', phoneNumber: '+91 90000 00001' },
  vitals: { weight: 56 }, allergies: 'None reported in this example', issue: 'Recorded symptoms', diagnosis: 'Recorded diagnosis',
  medicines: Array.from({length: 4}, (_, i) => ({ name: `Recorded medicine ${i + 1}`, strength: 'As prescribed', dosage: 'Recorded dose', timing: 'As advised by doctor', duration: 'Recorded duration' })),
  advice: 'Follow the instructions provided during your consultation.\nContact your treating doctor if symptoms persist.', followUpDate: '2026-10-23',
};
await build({ stdin: { contents: `import React from 'react'; import {renderToStaticMarkup} from 'react-dom/server'; import PrescriptionDocument from './src/Component/common/PrescriptionDocument.jsx'; export const html=renderToStaticMarkup(React.createElement(PrescriptionDocument,{record:${JSON.stringify(record)}}));`, resolveDir:process.cwd() }, outfile:`${folder}/render.mjs`, bundle:true, platform:'node', format:'esm', packages:'external', loader:{'.css':'empty','.png':'dataurl','.svg':'dataurl'} });
const {html}=await import('./render.mjs');
const css=await readFile('src/Component/common/PrescriptionDocument.css','utf8');
await writeFile(`${folder}/index.html`,`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#e9efed;padding:24px;box-sizing:border-box}.prescription-document{max-width:860px;margin:auto}*{box-sizing:border-box}@media(max-width:650px){body{padding:8px}}${css}</style></head><body>${html}</body></html>`);
console.log('Prescription component preview created');
