import React, { useEffect, useState } from 'react';
import axios from '../../axiosConfig';
import socketService from '../../services/socketService';
import { VitalsSummary } from '../Receptionist/PatientVitals';

export default function PatientVitalsCard() {
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let disposed = false;
    let pending = false;
    let dirty = false;
    let lastLoaded = 0;
    let socket;
    const controller = new AbortController();
    const load = async (force = false) => {
      if (disposed || document.hidden || navigator.onLine === false) return;
      if (pending) { if (force) dirty = true; return; }
      if (!force && Date.now() - lastLoaded < 30000) return;
      pending = true;
      try {
        const { data } = await axios.get('/api/auth/me/vitals', { signal: controller.signal });
        if (!disposed) { setLatest(data.latest); setError(''); lastLoaded = Date.now(); }
      } catch (err) {
        if (!disposed && !axios.isCancel(err)) setError('Unable to load vitals. Please try again.');
      } finally {
        pending = false;
        if (!disposed) { setLoading(false); if (dirty) { dirty = false; void load(true); } }
      }
    };
    const refresh = () => { void load(); };
    const updated = () => { lastLoaded = 0; void load(true); };
    // Defer initialization so StrictMode's discarded effect sends no request.
    const timer = setTimeout(() => {
      void load();
      socketService.connect().then(connected => {
        if (disposed) return;
        socket = connected;
        socket.on('patientVitalsUpdated', updated);
        socket.on('connect', updated);
      }).catch(() => {});
    }, 150);
    window.addEventListener('focus', refresh);
    window.addEventListener('online', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      disposed = true; clearTimeout(timer); controller.abort();
      socket?.off('patientVitalsUpdated', updated);
      socket?.off('connect', updated);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('online', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);
  return <section className="info-card-modern" aria-label="Latest recorded vitals">
    <div className="card-header"><h2>Latest recorded vitals</h2></div>
    <p>These readings are recorded by your receptionist or doctor during an appointment. Editing your profile does not change them.</p>
    {loading ? <p role="status">Loading vitals...</p> : error ? <p role="alert">{error}</p> : latest ? <VitalsSummary vitals={latest.vitals} /> : <p>No vitals recorded yet. Your readings will appear here after your clinic records them.</p>}
  </section>;
}
