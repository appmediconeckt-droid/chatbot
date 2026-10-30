import React, { useState } from 'react';
import axios from '../../axiosConfig.js';
import { PortalText } from '../common/PortalTranslation';
import './PatientVitals.css';
import { canRecordVitals } from './vitalsAppointments.jsx';
export { canRecordVitals } from './vitalsAppointments.jsx';

const fields = [
  ['blood_group', 'Blood group', 'Select the confirmed blood group'],
  ['blood_pressure', 'Blood pressure (mmHg)', 'Blood pressure monitor: enter systolic/diastolic, e.g. 120/80'],
  ['pulse', 'Pulse (beats/min)', 'Record the measured heart rate', 1, 400, 1],
  ['temperature', 'Temperature (°C)', 'Record the thermometer reading in Celsius', 20, 50, 0.1],
  ['spo2', 'SpO₂ (%)', 'Record the pulse oximeter reading', 0, 100, 0.1],
  ['respiratory_rate', 'Breathing rate (breaths/min)', 'Count breaths over one minute', 1, 150, 1],
  ['weight', 'Weight (kg)', 'Record the weighing scale reading', 0.1, 700, 0.1],
  ['height', 'Height (cm)', 'Record the measured height', 10, 300, 0.1],
  ['pain_score', 'Pain score (0–10)', 'Ask the patient: 0 means no pain; 10 means worst pain', 0, 10, 1],
];
const parse = value => {
  if (typeof value === 'string') { try { return JSON.parse(value) || {}; } catch { return {}; } }
  return value && typeof value === 'object' ? value : {};
};
function canonical(value) {
  const v = parse(value);
  return { ...v, blood_group: v.blood_group ?? v.bloodGroup ?? '', blood_pressure: v.blood_pressure ?? v.bp ?? v.bloodPressure ?? '', pulse: v.pulse ?? v.heartRate ?? v.heart_rate ?? '' };
}
export function VitalsSummary({ vitals }) {
  const values = canonical(vitals);
  return <div className="patient-vitals-summary"><dl>{fields.map(([key, label]) => <div key={key}><dt><PortalText text={label} /></dt><dd>{values[key] ?? 'Not recorded'}{values[key] === '' ? 'Not recorded' : ''}{key === 'temperature' && values.temperature_unit && values.temperature_unit !== 'C' ? ` (${values.temperature_unit})` : ''}</dd></div>)}</dl>
    {values.notes && <p><strong><PortalText text="Measurement notes" />: </strong>{values.notes}</p>}
    {values.recorded_at && <p><PortalText text="Last recorded" />: {new Date(values.recorded_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST{values.recorded_role ? ` (${values.recorded_role})` : ''}</p>}
  </div>;
}
function initialDraft(vitals) {
  const value = canonical(vitals);
  if (value.temperature_unit === 'F' && Number.isFinite(Number(value.temperature))) value.temperature = Math.round((Number(value.temperature) - 32) * 5 / 9 * 10) / 10;
  return Object.fromEntries([...fields.map(([key]) => [key, value[key] ?? '']), ['notes', value.notes || '']]);
}
export default function PatientVitals({ patient, editable, onSaved }) {
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(() => editable && (!patient.id || canRecordVitals(patient)) ? initialDraft(patient.vitals) : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const vitals = saved || patient.vitals;
  const canEdit = editable && (!patient.id || canRecordVitals(patient));
  const start = () => {
    setDraft(initialDraft(vitals));
    setError(''); setSuccess('');
  };
  const save = async event => {
    event.preventDefault();
    if (busy) return;
    if (!patient.id) { setError('Select a patient appointment before saving vitals.'); return; }
    if (!fields.some(([key]) => draft[key] !== '')) { setError('Enter at least one measured vital.'); return; }
    setBusy(true); setError(''); setSuccess('');
    try {
      const { data } = await axios.patch(`/api/staff/appointments/${patient.id}/vitals`, { source: patient.source, vitals: draft });
      setSaved(data.vitals); setDraft(null); setSuccess('Vitals saved for this appointment.');
      onSaved?.(data.vitals);
    } catch (err) { setError(err.response?.data?.message || 'Vitals could not be saved. Please try again.'); }
    finally { setBusy(false); }
  };
  return <section className="patient-vitals"><h3><PortalText text="Patient vitals / Initial measurements" /></h3>
    {!patient.id && <p role="status"><PortalText text="Select a patient appointment above to save these readings." /></p>}
    <p><PortalText text="Record only measurements taken by trained staff or the doctor. Leave unmeasured fields blank. The doctor reviews readings and performs the clinical examination." /></p>
    {draft && canEdit ? <form onSubmit={save}><fieldset disabled={busy}><div className="patient-vitals-inputs">{fields.map(([key, label, hint, min, max, step]) => <label key={key}><span><PortalText text={label} /></span>
      {key === 'blood_group' ? <select value={draft[key]} onChange={event => setDraft(current => ({ ...current, [key]: event.target.value }))}>
        <option value=""><PortalText text="Select blood group" /></option>
        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(group => <option key={group} value={group}>{group}</option>)}
      </select> : <input type={key === 'blood_pressure' ? 'text' : 'number'} min={min} max={max} step={step} maxLength={key === 'blood_pressure' ? 9 : undefined} pattern={key === 'blood_pressure' ? '[0-9]{1,3}/[0-9]{1,3}' : undefined} value={draft[key]} onChange={event => setDraft(current => ({ ...current, [key]: event.target.value }))} />}
      <small><PortalText text={hint} /></small></label>)}</div>
      <label className="patient-vitals-notes"><PortalText text="Measurement notes / Patient-reported concerns" /><textarea rows={3} maxLength={1000} value={draft.notes} onChange={event => setDraft(current => ({ ...current, notes: event.target.value }))} /></label>
      <div className="patient-vitals-actions"><button type="submit" className="rec-button primary" disabled={!patient.id}><PortalText text={busy ? 'Saving...' : 'Save vitals'} /></button>{patient.id && <button type="button" className="rec-button" onClick={() => { setDraft(null); setError(''); }}><PortalText text="Cancel" /></button>}</div>
    </fieldset></form> : <><VitalsSummary vitals={vitals} />{canEdit && <button type="button" className="rec-button primary" onClick={start}><PortalText text={vitals ? 'Edit vitals' : 'Add vitals'} /></button>}</>}
    {editable && !canEdit && <p><PortalText text="Vitals can only be added for today's active appointments. This visit is read-only." /></p>}
    {error && <p role="alert" className="rec-alert">{error}</p>}{success && <p role="status">{success}</p>}
  </section>;
}
