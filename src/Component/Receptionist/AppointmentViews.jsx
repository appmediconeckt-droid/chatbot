import EmergencyReason from '../common/EmergencyReason.jsx';
import React, { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import PatientVitals, { canRecordVitals } from './PatientVitals.jsx';
import PatientAvailabilityControl from './PatientAvailabilityControl.jsx';
import { PortalText, PortalElement } from '../common/PortalTranslation';
import { X, ArrowUpRight } from 'lucide-react';
import { displayTime, statusLabel, clinicName, patientKey } from './receptionistView.js';
import { canCancelAppointment } from '../../utils/appointmentCancellation.js';
export function Badge({ value, emergency = false }) { return <span className={`rec-badge ${emergency ? 'emergency' : value || ''}`}>{emergency ? <PortalText text={"Emergency"} /> : statusLabel(value)}</span>; }
export function DetailFields({ fields }) { return <dl className="rec-detail-grid">{fields.map(([title, value]) => <div key={title}><dt><PortalText text={title} /></dt><dd>{Array.isArray(value) ? value.join(', ') || <PortalText text={"Not provided"} /> : value ?? <PortalText text={"Not provided"} />}</dd></div>)}</dl>; }
export function PatientDialog({ patient, clinics, close, doctorName, onCancelAppointment, cancelBusy }) {
  const context = useOutletContext();
  const ref = useRef(null);
  useEffect(() => { if (patient && !ref.current?.open) ref.current?.showModal(); else if (!patient && ref.current?.open) ref.current.close(); }, [patient]);
  return <dialog ref={ref} className="rec-patient-dialog" onCancel={close} onClose={close}>
    {patient && <><div className="rec-card-heading"><div><p className="rec-eyebrow"><PortalText text={"PATIENT APPOINTMENT"} /></p><h2>{patient.patientName}</h2></div><PortalElement as="button" className="rec-icon-button" aria-label="Close patient details" onClick={() => ref.current.close()}><X size={20} /></PortalElement></div>
    <div className="rec-inline"><Badge value={patient.queueStatus} />{patient.emergency && <Badge emergency />}<span><PortalText text={"Token "} />{patient.token ?? '--'}</span></div>
    {patient.emergency && <EmergencyReason appointment={patient} />}
    <PatientVitals key={patientKey(patient)} patient={patient} editable={context?.profile?.role === 'receptionist'} />
    <DetailFields fields={[
      ['Doctor name', doctorName || 'Doctor name not recorded'], ['Phone', patient.phoneNumber || 'Not recorded'], ['Age', patient.age], ['Gender', patient.gender], ['Clinic / Hospital', clinicName(clinics, patient.clinicId)],
      ['Appointment date', patient.date], ['Appointment time', patient.time || 'Not scheduled'], ['Booking source', patient.source === 'walkin' ? 'Walk-in' : 'Online'], ['Booking status', statusLabel(patient.status)],
      ['Checkup started', displayTime(patient.timing?.startedAt)], ['Checkup completed', displayTime(patient.timing?.endedAt)], ['Symptoms', patient.symptoms || 'Not recorded'], ['Diagnosis', patient.diagnosis || 'Not recorded'], ['Advice', patient.advice || 'Not recorded'],
    ]} />
    <div className="rec-appointment-actions rec-appointment-dialog-actions">
    {onCancelAppointment && canCancelAppointment(patient) && <button className="rec-button" disabled={Boolean(cancelBusy)} onClick={() => onCancelAppointment(patient)}><PortalText text={cancelBusy ? 'Cancelling...' : 'Cancel Appointment'} /></button>}
    <button className="rec-button primary" onClick={() => ref.current.close()}><PortalText text={"Done"} /></button></div></>}
  </dialog>;
}
export function VitalsDialog({ patient, close, onSaved }) {
  const ref = useRef(null);
  const context = useOutletContext();
  useEffect(() => {
    if (patient && !ref.current?.open) ref.current?.showModal();
    else if (!patient && ref.current?.open) ref.current.close();
  }, [patient]);
  return <dialog ref={ref} className="rec-patient-dialog" aria-label="Add or edit patient vitals" onCancel={close} onClose={close}>
    {patient && <><div className="rec-card-heading"><div><h2><PortalText text={patient.vitals ? 'Edit patient vitals' : 'Add patient vitals'} /></h2><strong>{patient.patientName}</strong><p>{patient.phoneNumber || 'Phone not recorded'} / {patient.date} / {patient.time || 'Not scheduled'}</p></div><button type="button" className="rec-icon-button" aria-label="Close vitals" onClick={() => ref.current.close()}><X size={20} /></button></div>
      <PatientVitals key={patientKey(patient)} patient={patient} editable={context?.profile?.role === 'receptionist'} onSaved={onSaved} />
      <div className="rec-appointment-actions rec-appointment-dialog-actions"><button type="button" className="rec-button" onClick={() => ref.current.close()}><PortalText text="Close" /></button></div>
    </>}
  </dialog>;
}
export function AppointmentTable({ rows, clinics, onView, onCancelAppointment, cancelBusy, onVitalsSaved, onAvailabilitySaved }) {
  const [vitalsKey, setVitalsKey] = useState(null);
  const [savedVitals, setSavedVitals] = useState({});
  const context = useOutletContext();
  const isReceptionist = context?.profile?.role === 'receptionist';
  const withSavedVitals = row => {
    const saved = savedVitals[patientKey(row)];
    return saved && !(Date.parse(row.vitals?.recorded_at) > Date.parse(saved.recorded_at)) ? { ...row, vitals: saved } : row;
  };
  const selectedVitalsPatient = rows.find(row => patientKey(row) === vitalsKey);
  return <div className="rec-table-scroll"><table className="rec-table"><thead><tr><th><PortalText text={"Patient"} /></th><th><PortalText text="Phone number" /></th>{isReceptionist && <><th><PortalText text="Vitals" /></th><th><PortalText text="Patient availability" /></th></>}<th><PortalText text={"Token"} /></th><th><PortalText text={"Appointment"} /></th><th><PortalText text={"Clinic / Hospital"} /></th><th><PortalText text={"Booking"} /></th><th><PortalText text={"Queue status"} /></th><th><span className="rec-sr-only"><PortalText text={"Details"} /></span></th></tr></thead><tbody>{rows.map(row => <tr key={patientKey(row)}>
    <td><div className="rec-table-patient"><span className="rec-patient-avatar">{row.patientName.slice(0, 1).toUpperCase()}</span><div><strong>{row.patientName}</strong><small>{row.phoneNumber || <PortalText text={"Phone not recorded"} />}</small>{row.emergency && <Badge emergency />}</div></div></td>
    <td>{row.phoneNumber || <PortalText text="Not recorded" />}</td>
    {isReceptionist && <><td className="rec-vitals-cell"><div className="rec-patient-intake-actions">{canRecordVitals(row) ? <button type="button" className="rec-button primary compact" onClick={() => setVitalsKey(patientKey(row))}><PortalText text={withSavedVitals(row).vitals ? "Edit vitals" : "Add vitals"} /></button> : <span><PortalText text="Read-only" /></span>}</div></td><td className="rec-availability-cell"><PatientAvailabilityControl key={patientKey(row)} patient={row} onSaved={onAvailabilitySaved} /></td></>}
    <td><span className="rec-token">{row.token != null ? `#${row.token}` : '--'}</span></td><td><small>{row.date}</small><strong>{row.time || <PortalText text={"Not scheduled"} />}</strong><small>{row.source === 'walkin' ? <PortalText text={"Walk-in patient"} /> : <PortalText text={"Online booking"} />}</small></td><td>{clinicName(clinics, row.clinicId)}</td><td><Badge value={row.status} /></td><td><Badge value={row.queueStatus} /></td><td><div className="rec-appointment-actions"><button className="rec-button compact" onClick={() => onView(patientKey(row))}><PortalText text={"View "} /><ArrowUpRight size={14} /></button>{onCancelAppointment && canCancelAppointment(row) && <button className="rec-button compact" disabled={Boolean(cancelBusy)} onClick={() => onCancelAppointment(row)}><PortalText text={cancelBusy === patientKey(row) ? "Cancelling..." : "Cancel Appointment"} /></button>}</div></td>
  </tr>)}</tbody></table><VitalsDialog patient={selectedVitalsPatient ? withSavedVitals(selectedVitalsPatient) : null} close={() => setVitalsKey(null)} onSaved={vitals => {
    setSavedVitals(current => ({ ...current, [vitalsKey]: vitals }));
    onVitalsSaved?.(selectedVitalsPatient, vitals);
  }} /></div>;
}
