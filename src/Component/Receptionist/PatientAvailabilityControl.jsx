import React, { useState } from 'react';
import axios from '../../axiosConfig.js';
import { PortalText } from '../common/PortalTranslation';
import { canUpdatePatientAvailability } from './patientAvailability.js';

export default function PatientAvailabilityControl({ patient, onSaved }) {
  const [saved, setSaved] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const availability = saved && Date.parse(saved.updatedAt) > (Date.parse(patient.availability?.updatedAt) || 0)
    ? saved : patient.availability || {};
  const canUpdate = canUpdatePatientAvailability(patient);
  const update = async status => {
    if (busy || !canUpdate) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const { data } = await axios.patch(`/api/staff/appointments/${encodeURIComponent(patient.id)}/availability`, { source: patient.source, availability: status });
      setSaved(data.availability);
      const message = status === 'unavailable' ? 'Doctor notified: patient unavailable. The doctor can move this patient to Next.'
        : data.availability.returnedAt ? 'Doctor notified: patient returned and has priority after the current consultation.' : 'Doctor notified: patient available.';
      setNotice(message);
      onSaved?.(patient, data.availability, message);
    } catch (err) { setError(err.response?.data?.message || 'Patient availability could not be updated. Please try again.'); }
    finally { setBusy(false); }
  };
  if (!canUpdate) return <span className="rec-availability-inactive">&mdash;</span>;
  return <div className="rec-patient-availability">
    <div className="rec-patient-availability-buttons" role="group" aria-label="Patient availability" aria-busy={busy}>
      {['available', 'unavailable'].map(status => <button key={status} type="button" className={`rec-availability-option ${status}`} aria-pressed={availability.status === status} disabled={busy || availability.status === status} onClick={() => update(status)}><span className="rec-availability-dot" /><PortalText text={status === 'available' ? 'Available' : 'Unavailable'} /></button>)}
    </div>
    {(busy || notice || availability.returnedAt) && <small role="status" title={notice || undefined}><PortalText text={busy ? 'Saving...' : availability.returnedAt ? 'Returned - priority next' : 'Doctor notified'} /></small>}
    {error && <small className="rec-alert" role="alert">{error}</small>}
  </div>;
}
