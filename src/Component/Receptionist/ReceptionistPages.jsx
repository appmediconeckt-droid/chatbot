import StaffAppointments from '../StaffDashboard/StaffAppointments.jsx';
import ProfileAvatar from '../common/ProfileAvatar.jsx';
import { Badge, DetailFields, PatientDialog, AppointmentTable } from './AppointmentViews.jsx';
import { PortalText, PortalElement } from '../common/PortalTranslation';
import { staffIdentity, staffShiftTiming } from '../StaffDashboard/staffProfileDetails.js';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { CalendarDays, Clock3, Stethoscope, CheckCircle2, ArrowUpRight, Search, ListOrdered, Phone, Mail, MapPin, Building2, X, Users, AlertCircle, ExternalLink } from 'lucide-react';
import { indiaToday, displayTime, statusLabel, clinicName, patientKey, filterAppointments, pageRecords } from './receptionistView.js';

function Empty({ title = 'No patients here yet', description = 'Appointments will appear here when they are booked.' }) { return <div className="rec-empty"><Users size={30} /><h3>{title}</h3><p>{description}</p></div>; }
function Loading({ error }) { return <div className="rec-card rec-loading" role="status">{error ? <PortalText text={"Data is unavailable. Use Refresh to try again."} /> : <PortalText text={"Loading appointments for your doctor..."} />}</div>; }
function CurrentCheckups({ data, clinics, onView }) {
  return <>{data.currentPatients.length ? <div className="rec-current-grid">{data.currentPatients.map(row => <article className="rec-current-patient" key={patientKey(row)}><div className="rec-inline"><span className="rec-dot" /><span className="rec-eyebrow">{row.queueStatus === 'called' ? <PortalText text={"PATIENT CALLED"} /> : <PortalText text={"CHECKUP IN PROGRESS"} />}</span>{row.emergency && <Badge emergency />}</div><div className="rec-current-main"><span className="rec-current-token">{row.token ?? '--'}<small><PortalText text={"TOKEN"} /></small></span><div><h3>{row.patientName}</h3><p>{clinicName(clinics, row.clinicId)}</p></div></div><div className="rec-current-footer"><span><Clock3 size={15} />{row.timing?.startedAt ? `Started ${displayTime(row.timing.startedAt)}` : <PortalText text={"Awaiting checkup"} />}{row.timing?.state === 'paused' ? <PortalText text={" / Paused"} /> : ''}</span><button className="rec-text-button" onClick={() => onView(patientKey(row))}><PortalText text={"View details "} /><ArrowUpRight size={15} /></button></div></article>)}</div> : <Empty title="No checkup in progress" description="The patient being examined will appear here when the doctor starts a checkup." />}</>;
}
export function ReceptionistOverview() {
  const { profile, liveData: data, clinics, error } = useOutletContext();
  const [selected, setSelected] = useState(null);
  if (!data) return <Loading error={error} />;
  const stats = [ ['Appointments today', data.summary.total, CalendarDays, 'blue'], ['Waiting patients', data.summary.waiting, Clock3, 'amber'], ['Ongoing checkups', data.summary.ongoing, Stethoscope, 'teal'], ['Completed today', data.summary.completed, CheckCircle2, 'green'] ];
  const patient = data.appointments.find(row => patientKey(row) === selected);
  return <><section className="rec-welcome"><div><p className="rec-eyebrow">{new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p><h2><PortalText text={"Welcome, "} />{profile.fullName.split(' ')[0]}</h2><p><PortalText text={"Keep appointments and the patient queue running smoothly."} /></p></div><Link className="rec-button primary" to="/receptionist/appointments"><PortalText text={"View appointments "} /><ArrowUpRight size={17} /></Link></section>
    <div className="rec-stats">{stats.map(stat => { const [title, value, Icon, color] = stat; return <article className="rec-stat" key={title}><span className={`rec-stat-icon ${color}`}><Icon size={22} /></span><div><p><PortalText text={title} /></p><strong>{value}</strong></div></article>; })}</div>
    <div className="rec-overview-grid"><section className="rec-card"><div className="rec-card-heading"><h2><PortalText text={"Currently with the doctor"} /></h2><span className="rec-live-label"><span className="rec-dot" /><PortalText text={"Today / Live"} /></span></div><CurrentCheckups data={data} clinics={clinics} onView={setSelected} /></section>
    <section className="rec-card"><div className="rec-card-heading"><h2><PortalText text={"Up next"} /></h2><ListOrdered size={20} /></div>{data.waiting[0] ? <div className="rec-next"><span className="rec-next-token">#{data.waiting[0].token ?? '--'}</span><h3>{data.waiting[0].patientName}</h3><p>{clinicName(clinics, data.waiting[0].clinicId)}</p><Badge value={data.waiting[0].queueStatus} /><p>{data.summary.waiting}<PortalText text={" patients waiting"} /></p></div> : <Empty title="Queue is clear" description="No patients are waiting right now." />}<Link className="rec-button full" to="/receptionist/live-queue"><PortalText text={"Open live queue "} /><ArrowUpRight size={16} /></Link></section></div>
    <section className="rec-card"><div className="rec-card-heading"><div><h2><PortalText text={"Today's appointments"} /></h2><p><PortalText text={"A quick look at your doctor's bookings."} /></p></div><Link className="rec-text-button" to="/receptionist/appointments"><PortalText text={"View all "} /><ArrowUpRight size={16} /></Link></div>{data.appointments.length ? <AppointmentTable rows={data.appointments.slice(0, 5)} clinics={clinics} onView={setSelected} /> : <Empty />}</section>
    <PatientDialog patient={patient} clinics={clinics} doctorName={data?.doctor?.fullName || data?.doctor?.name} close={() => setSelected(null)} />
  </>;
}
export function ReceptionistAppointments() {
 const { clinic } = useOutletContext();
 return <StaffAppointments clinicId={clinic} />;
}
export function ReceptionistLiveQueue() {
  const { liveData: data, clinics, clinic, error } = useOutletContext();
  const [selected, setSelected] = useState(null);
  if (!data) return <Loading error={error} />;
  const patient = data.appointments.find(row => patientKey(row) === selected);
  return <><div className="rec-queue-launch"><div><h3><PortalText text={"Display the live queue on your LED"} /></h3><p><PortalText text={"Open your doctor's clinic token screen from the front desk."} /></p></div><Link className="rec-button primary" to="/receptionist/led-display"><ExternalLink size={16} /><PortalText text={"Open LED Display"} /></Link></div><section className="rec-card"><div className="rec-card-heading"><div><h2><PortalText text={"Doctor's live display"} /></h2><p><PortalText text={"Today's current patients, tokens and consultation status."} /></p></div><span className="rec-live-label"><span className="rec-dot" /><PortalText text={"Live / "} />{data.date}</span></div><CurrentCheckups data={data} clinics={clinics} onView={setSelected} />
    {data.timing ? <div className="rec-queue-notice"><Clock3 size={20} /><div><strong>{data.timing.breakInfo?.headline}</strong><p><PortalText text={"Estimated wait: "} />{data.timing.estimatedWaitLabel || (data.timing.estimatedWaitMinutes != null ? `${data.timing.estimatedWaitMinutes} min` : <PortalText text={"Updating estimate"} />)}{data.timing.breakInfo?.expectedStart && ` / Expected start: ${data.timing.breakInfo.expectedStart}`}</p></div></div> : !clinic && <div className="rec-queue-notice"><Building2 size={20} /><p><PortalText text={"Select a clinic above to see its wait estimate and doctor break information."} /></p></div>}</section>
    <section className="rec-card"><div className="rec-card-heading"><div><h2><PortalText text={"Waiting queue "} /><span className="rec-count">{data.waiting.length}</span></h2><p><PortalText text={"Emergency patients appear first, followed by appointment time."} /></p></div></div>{data.waiting.length ? <div className="rec-waiting-list">{data.waiting.map((row, index) => <article className="rec-waiting-row" key={patientKey(row)}><span className="rec-queue-position">{index + 1}</span><span className="rec-token">#{row.token ?? '--'}</span><div className="rec-waiting-name"><strong>{row.patientName}</strong><small>{clinicName(clinics, row.clinicId)} / {row.time || <PortalText text={"Not scheduled"} />}</small></div>{row.emergency && <span className="rec-emergency-icon"><AlertCircle size={17} /><PortalText text={"Emergency"} /></span>}<Badge value={row.queueStatus} /><button className="rec-button compact" onClick={() => setSelected(patientKey(row))}><PortalText text={"View "} /><ArrowUpRight size={14} /></button></article>)}</div> : <Empty title="No patients waiting" description="New arrivals and bookings will appear in the queue here." />}</section>
    <PatientDialog patient={patient} clinics={clinics} doctorName={data?.doctor?.fullName || data?.doctor?.name} close={() => setSelected(null)} />
  </>;
}
export function ReceptionistDoctor() {
  const { liveData: data, clinics, error } = useOutletContext();
  if (!data) return <Loading error={error} />;
  const doctor = data.doctor;
  return <><section className="rec-card"><div className="rec-doctor-heading"><span className="rec-doctor-avatar"><Stethoscope size={36} /></span><div><p className="rec-eyebrow"><PortalText text={"ASSIGNED DOCTOR"} /></p><h2>{doctor.fullName}</h2><p>{doctor.specialization?.join(', ') || <PortalText text={"Specialization not provided"} />}</p></div><span className="rec-badge confirmed"><PortalText text={"Your care team"} /></span></div><DetailFields fields={[
    ['Qualification', doctor.qualification], ['Experience', doctor.experience != null ? `${doctor.experience} years` : null], ['Email address', doctor.email], ['Phone number', doctor.phoneNumber], ['Location', doctor.location], ['Consultation modes', doctor.consultationMode], ['Languages', doctor.languages], ['Education', doctor.education],
  ]} />{(doctor.aboutMe || doctor.bio) && <div className="rec-about"><h3><PortalText text={"About the doctor"} /></h3><p>{doctor.aboutMe || doctor.bio}</p></div>}</section>
    <section><div className="rec-section-heading"><h2><PortalText text={"Clinics & hospitals"} /></h2><span className="rec-count">{clinics.length}<PortalText text={" locations"} /></span></div><div className="rec-clinic-grid">{clinics.map(row => <article className="rec-card rec-clinic-card" key={row._id || row.id}><span className="rec-stat-icon blue"><Building2 size={24} /></span><h3>{row.clinic_name}</h3><p><MapPin size={17} />{row.location || <PortalText text={"Location not provided"} />}</p><p><Phone size={17} />{row.phone_number || <PortalText text={"Phone not provided"} />}</p></article>)}</div>{!clinics.length && <div className="rec-card"><Empty title="No clinics assigned" description="Your doctor can add clinic details from their portal." /></div>}</section>
  </>;
}
export function ReceptionistProfile() {
  const { profile } = useOutletContext();
  return <section className="rec-card"><div className="rec-doctor-heading"><ProfileAvatar photo={profile.profilePhoto} name={profile.fullName} className="rec-doctor-avatar" /><div><p className="rec-eyebrow"><PortalText text={"STAFF ACCOUNT"} /></p><h2>{profile.fullName}</h2><p><PortalText text={"Receptionist / Front desk team"} /></p></div><span className="rec-badge confirmed"><PortalText text={"Active account"} /></span></div><div className="rec-contact-links"><span><Mail size={17} />{profile.email}</span><span><Phone size={17} />{profile.phoneNumber}</span></div><DetailFields fields={[
    ['Assigned doctor', profile.assignedDoctorName], ['Assigned clinic', profile.clinic_name], ['Department', profile.department], ['Staff ID', staffIdentity(profile)], ['Shift', profile.shift], ['Shift timings', staffShiftTiming(profile)],
  ]} /><div className="rec-queue-notice"><Stethoscope size={20} /><p><PortalText text={"Your doctor manages your role, clinic assignment and staff details. Contact them to update these details."} /></p></div></section>;
}
