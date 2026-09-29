import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterPatients, dateKey } from '../src/Component/DoctorDashboard/PatientAppointmentDetails/patientFilters.js';
import { patientCardDetails } from '../src/Component/DoctorDashboard/PatientAppointmentDetails/patientRecordDetails.js';
const patients = [
  {name:'Anita',phone:'+91 98765 43210',gender:'female',age:65,bloodGroup:'a+',lastVisitKey:'2026-09-29'},
  {name:'Bala',phone:'555',gender:'Male',age:'N/A',lastVisitKey:'2026-09-28'},
  {name:'Child',phone:'777',gender:'male',age:0,lastVisitKey:'2026-08-29'},
];
test('patient filters normalize gender, blood group and phone without treating missing age as zero',()=>{
  assert.equal(filterPatients(patients,{genderFilter:'Female',bloodGroupFilter:'A+',search:'9876543210'}).length,1);
  assert.deepEqual(filterPatients(patients,{ageFilter:'0-18'}).map(p=>p.name),['Child']);
  assert.deepEqual(filterPatients(patients,{ageFilter:'65+'}).map(p=>p.name),['Anita']);
});
test('visit filters and sorting use canonical dates, not locale-formatted labels',()=>{
  const now=new Date('2026-09-29T07:00:00Z');
  assert.equal(filterPatients(patients,{lastVisitFilter:'Today'},now).length,1);
  assert.equal(filterPatients(patients,{lastVisitFilter:'This Week'},now).length,2);
  assert.deepEqual(filterPatients(patients,{sortBy:'Oldest First'},now).map(p=>p.name),['Child','Bala','Anita']);
  assert.equal(dateKey('2026-09-28T19:00:00Z'),'2026-09-29');
});
test('walk-in and alternate profile field names populate patient cards',()=>{
  const card=patientCardDetails({patient:'123',patient_details:{name:'Anita',blood_group:'A+'},phone_number:'9876543210',date_of_birth:'2000-01-01'},new Date('2026-09-29'));
  assert.equal(card.name,'Anita');assert.equal(card.phone,'9876543210');assert.equal(card.age,26);assert.equal(card.id,'123');
});
