import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeClinicDoctor } from '../src/Component/DoctorDashboard/ClinicAllView/clinicDoctorDetails.js';
test('clinic doctor must be the active owning doctor, not staff or a different account', () => {
 assert.equal(normalizeClinicDoctor({id:'one',role:'receptionist'},'one'),null);
 assert.equal(normalizeClinicDoctor({id:'two',role:'doctor'},'one'),null);
 assert.equal(normalizeClinicDoctor({id:'one',role:'doctor',isActive:false},'one'),null);
});
test('generic branding is not presented as a doctor name or a fake specialist', () => {
 const doctor=normalizeClinicDoctor({id:'one',role:'doctor',fullName:'Mediconeckt',department:'Operations'},'one');
 assert.equal(doctor.name,null);assert.equal(doctor.specialty,'');assert.equal(doctor.image,'');assert.equal(doctor.experience,null);assert.equal(doctor.rating,null);
});
test('real professional details, zero experience and the actual profile image are preserved', () => {
 const doctor=normalizeClinicDoctor({id:'one',role:'doctor',fullName:'Dr. Meera Shah',qualification:'MBBS',specialization:['Dermatology'],experience:0,rating:4.7,profilePhoto:{url:'/uploads/doctor.png'}},'one','https://backend.test/api');
 assert.equal(doctor.name,'Dr. Meera Shah');assert.equal(doctor.specialty,'Dermatology');assert.equal(doctor.qualification,'MBBS');assert.equal(doctor.experience,0);assert.equal(doctor.rating,4.7);assert.equal(doctor.image,'https://backend.test/uploads/doctor.png');
});
