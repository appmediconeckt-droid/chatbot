import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PatientVitals, { canRecordVitals } from '../Receptionist/PatientVitals.jsx';
import { PortalText } from '../common/PortalTranslation';
import { doctorVitalsAppointment } from './doctorVitalsAppointment.js';
import './DoctorVitalsButton.css';

export default function DoctorVitalsButton({ appointment, onSaved }) {
  const dialog = useRef(null);
  const [opened, setOpened] = useState(false);
  const patient = doctorVitalsAppointment(appointment);
  if (!patient.id) return null;
  const editable = canRecordVitals(patient);
  return <>
    <button type="button" className="btn btn-outline-primary btn-sm doctor-vitals-button" onClick={(event) => {
      event.stopPropagation(); setOpened(true); dialog.current.showModal();
    }}><PortalText text={editable ? (patient.vitals ? 'Edit vitals' : 'Add vitals') : 'View vitals'} /></button>
    {createPortal(<dialog ref={dialog} className="doctor-vitals-dialog" aria-label="Patient vitals" onClick={(event) => event.stopPropagation()} onClose={() => setOpened(false)}>
      <div className="doctor-vitals-dialog-heading"><div><h2><PortalText text="Patient vitals" /></h2><p>{patient.patientName}</p></div>
        <button type="button" className="btn btn-outline-secondary btn-sm" aria-label="Close vitals" onClick={() => dialog.current.close()}><PortalText text="Close" /></button></div>
      {opened && <>
        {!editable && <p role="status"><PortalText text="Vitals can only be added for today's active appointments. This visit is read-only." /></p>}
        <PatientVitals key={`${patient.source}:${patient.id}`} patient={patient} editable={editable} onSaved={onSaved} />
      </>}
    </dialog>, document.body)}
  </>;
}
