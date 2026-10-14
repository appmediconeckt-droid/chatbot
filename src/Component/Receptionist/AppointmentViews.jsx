import React, { useEffect, useRef } from 'react';
import { PortalText, PortalElement } from '../common/PortalTranslation';
import { X, ArrowUpRight } from 'lucide-react';
import { displayTime, statusLabel, clinicName, patientKey } from './receptionistView.js';
import { canCancelAppointment } from '../../utils/appointmentCancellation.js';
export function Badge({ value, emergency = false }) { return <span className={`rec-badge ${emergency ? 'emergency' : value || ''}`}>{emergency ? <PortalText text={"Emergency"} /> : statusLabel(value)}</span>; }
export function DetailFields({ fields }) { return <dl className="rec-detail-grid">{fields.map(([title, value]) => <div key={title}><dt><PortalText text={title} /></dt><dd>{Array.isArray(value) ? value.join(', ') || <PortalText text={"Not provided"} /> : value ?? <PortalText text={"Not provided"} />}</dd></div>)}</dl>; }
export function PatientDialog({ patient, clinics, close, doctorName, onCancelAppointment, cancelBusy }) {
  const ref = useRef(null);
  useEffect(() => { if (patient && !ref.current?.open) ref.current?.showModal(); else if (!patient && ref.current?.open) ref.current.close(); }, [patient]);
  return <dialog ref={ref} className="rec-patient-dialog" onCancel={close} onClose={close}>
    {patient && <><div className="rec-card-heading"><div><p className="rec-eyebrow"><PortalText text={"PATIENT APPOINTMENT"} /></p><h2>{patient.patientName}</h2></div><PortalElement as="button" className="rec-icon-button" aria-label="Close patient details" onClick={() => ref.current.close()}><X size={20} /></PortalElement></div>
    <div className="rec-inline"><Badge value={patient.queueStatus} />{patient.emergency && <Badge emergency />}<span><PortalText text={"Token "} />{patient.token ?? '--'}</span></div>
    <DetailFields fields={[
      ['Doctor name', doctorName || 'Doctor name not recorded'], ['Phone', patient.phoneNumber || 'Not recorded'], ['Age', patient.age], ['Gender', patient.gender], ['Clinic / Hospital', clinicName(clinics, patient.clinicId)],
      ['Appointment date', patient.date], ['Appointment time', patient.time || 'Not scheduled'], ['Booking source', patient.source === 'walkin' ? 'Walk-in' : 'Online'], ['Booking status', statusLabel(patient.status)],
      ['Checkup started', displayTime(patient.timing?.startedAt)], ['Checkup completed', displayTime(patient.timing?.endedAt)], ['Symptoms', patient.symptoms || 'Not recorded'], ['Diagnosis', patient.diagnosis || 'Not recorded'], ['Advice', patient.advice || 'Not recorded'],
    ]} />
    {patient.vitals && <div className="rec-vitals"><h3><PortalText text={"Recorded vitals"} /></h3><p>{typeof patient.vitals === 'object' ? Object.entries(patient.vitals).map(([key, value]) => `${statusLabel(key)}: ${String(value)}`).join(' | ') : String(patient.vitals)}</p></div>}
    {onCancelAppointment && canCancelAppointment(patient) && <button className="rec-button" disabled={Boolean(cancelBusy)} onClick={() => onCancelAppointment(patient)}><PortalText text={cancelBusy ? 'Cancelling...' : 'Cancel Appointment'} /></button>}
    <button className="rec-button primary" onClick={() => ref.current.close()}><PortalText text={"Done"} /></button></>}
  </dialog>;
}
export function AppointmentTable({ rows, clinics, onView, onCancelAppointment, cancelBusy }) {
  return <div className="rec-table-scroll"><table className="rec-table"><thead><tr><th><PortalText text={"Patient"} /></th><th><PortalText text={"Token"} /></th><th><PortalText text={"Appointment"} /></th><th><PortalText text={"Clinic / Hospital"} /></th><th><PortalText text={"Booking"} /></th><th><PortalText text={"Queue status"} /></th><th><span className="rec-sr-only"><PortalText text={"Details"} /></span></th></tr></thead><tbody>{rows.map(row => <tr key={patientKey(row)}>
    <td><div className="rec-table-patient"><span className="rec-patient-avatar">{row.patientName.slice(0, 1).toUpperCase()}</span><div><strong>{row.patientName}</strong><small>{row.phoneNumber || <PortalText text={"Phone not recorded"} />}</small>{row.emergency && <Badge emergency />}</div></div></td>
    <td><span className="rec-token">{row.token != null ? `#${row.token}` : '--'}</span></td><td><small>{row.date}</small><strong>{row.time || <PortalText text={"Not scheduled"} />}</strong><small>{row.source === 'walkin' ? <PortalText text={"Walk-in patient"} /> : <PortalText text={"Online booking"} />}</small></td><td>{clinicName(clinics, row.clinicId)}</td><td><Badge value={row.status} /></td><td><Badge value={row.queueStatus} /></td><td><button className="rec-button compact" onClick={() => onView(patientKey(row))}><PortalText text={"View "} /><ArrowUpRight size={14} /></button>{onCancelAppointment && canCancelAppointment(row) && <button className="rec-button compact" disabled={Boolean(cancelBusy)} onClick={() => onCancelAppointment(row)}><PortalText text={cancelBusy === patientKey(row) ? "Cancelling..." : "Cancel Appointment"} /></button>}</td>
  </tr>)}</tbody></table></div>;
}
