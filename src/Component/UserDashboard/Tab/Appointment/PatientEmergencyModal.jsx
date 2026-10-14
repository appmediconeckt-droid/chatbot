import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../../axiosConfig';
import { PortalText } from '../../../common/PortalTranslation';

export default function PatientEmergencyModal({ appointment, token, onClose, onSent }) {
  const dialog = useRef(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => { dialog.current?.showModal(); }, []);
  const submit = async (event) => {
    event.preventDefault();
    if (busy || reason.trim().length < 10) return;
    setBusy(true); setError('');
    try {
      const { data } = await axios.patch(`${API_BASE_URL}/api/appointments/${appointment._id}/emergency`,
        { reason: reason.trim(), is_emergency: true },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 20000 });
      setMessage(data.message);
      onSent(appointment._id, reason.trim());
    } catch (err) {
      setError(err.response?.data?.message || 'Request could not be sent. Please try again.');
    } finally { setBusy(false); }
  };
  return <dialog ref={dialog} className="patient-emergency-dialog" aria-labelledby="patient-emergency-title"
    onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <form onSubmit={submit}>
      <h2 id="patient-emergency-title"><PortalText text="Emergency request" /></h2>
      <p>{appointment.counselor?.fullName || appointment.counselor?.name}</p>
      {message ? <p role="status">{message}</p> : <>
        <p><PortalText text="If your health is worsening, send an emergency alert to your doctor for this appointment." /></p>
        <label htmlFor="patient-emergency-reason"><PortalText text="What is happening?" /></label>
        <textarea id="patient-emergency-reason" value={reason} onChange={(event) => setReason(event.target.value)}
          minLength={10} maxLength={1000} rows={4} required disabled={busy} autoFocus />
        <small><PortalText text="Describe the emergency in 10–1000 characters. The clinic will review your request." /></small>
        {error && <p role="alert">{error}</p>}
      </>}
      <div className="patient-emergency-actions">
        <button type="button" onClick={onClose} disabled={busy}><PortalText text={message ? 'Done' : 'Cancel'} /></button>
        {!message && <button type="submit" disabled={busy || reason.trim().length < 10}><PortalText text={busy ? 'Sending...' : 'Send Emergency Request'} /></button>}
      </div>
    </form>
  </dialog>;
}
