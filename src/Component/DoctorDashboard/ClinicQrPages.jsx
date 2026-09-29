import React, { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import AppointmentForm from './Walk-in/AppointmentForm.jsx';
import axios from '../../axiosConfig.js';
import { API_BASE_URL } from './doctorApi.js';
import './ClinicQrPages.css';

const address = value => typeof value === 'string' ? value : Object.values(value || {}).filter(v => typeof v === 'string').join(', ');
export function LegacyWalkinPage() {
  const params = new URLSearchParams(useLocation().search);
  return params.get('source') === 'qr' && params.get('doctorId')
    ? <Navigate replace to={`/doctor/${encodeURIComponent(params.get('doctorId'))}`} /> : <AppointmentForm />;
}
function Timings({ items = [] }) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return items.length ? <ul>{items.map((t, i) => <li key={i}>{t.date || days[t.weekday] || t.weekday}: {t.startTime} – {t.endTime}</li>)}</ul> : <p>Contact the clinic for timings.</p>;
}
function useQrData(path) {
  const [state, setState] = useState({});
  useEffect(() => {
    const controller = new AbortController();
    setState({});
    axios.get(`${API_BASE_URL}/qr/${path}`, { signal: controller.signal }).then(res => setState({ data: res.data.data })).catch(err => {
      if (!controller.signal.aborted) setState({ error: err.response?.data?.message || 'Unable to load. Please refresh to try again.' });
    });
    return () => controller.abort();
  }, [path]);
  return state;
}
export function DoctorProfilePage() {
  const { doctorId } = useParams();
  const { data, error } = useQrData(`doctors/${encodeURIComponent(doctorId)}/profile`);
  return <main className="clinic-qr-public">
    {error ? <p role="alert">{error}</p> : !data ? <p role="status">Loading doctor profile…</p> : <>
      <h1>{data.name}</h1><p>{[].concat(data.specialization || []).join(', ')}</p>
      <p>{data.qualification}</p>{data.experience && <p>Experience: {data.experience}</p>}<p>{data.about}</p>
      <h2>Available clinics</h2><div className="clinic-qr-grid">{data.clinics.map(c => <article key={c.doctorClinicId}>
        <h3>{c.clinic.name}</h3><p>{address(c.clinic.address)}</p><Timings items={c.timings} />
        <Link className="clinic-qr-action" to={`/walkin/${c.doctorClinicId}`}>Book Appointment</Link><p>Today's walk-in queue</p>
      </article>)}</div>{!data.clinics.length && <p>No clinics available yet.</p>}
    </>}
  </main>;
}
export function ClinicWalkinPage() {
  const { doctorClinicId } = useParams();
  const { data, error } = useQrData(`walkin/${encodeURIComponent(doctorClinicId)}`);
  const [form, setForm] = useState({ patientName: '', phoneNumber: '', symptoms: '' });
  const [booking, setBooking] = useState({});
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  useEffect(() => { setBooking({}); setRequestId(crypto.randomUUID()); }, [doctorClinicId]);
  const submit = async event => {
    event.preventDefault();
    if (booking.busy) return;
    setBooking({ busy: true });
    try {
      const response = await axios.post(`${API_BASE_URL}/qr/walkin/${encodeURIComponent(doctorClinicId)}`, { ...form, requestId });
      setBooking({ result: response.data.data });
    } catch (err) { setBooking({ error: err.response?.data?.message || 'Unable to confirm. Please retry.' }); }
  };
  return <main className="clinic-qr-public">
    {error ? <p role="alert">{error}</p> : !data ? <p role="status">Loading clinic…</p> : <>
      <h1>Clinic Walk-in</h1><h2>{data.doctor.name}</h2><h3>{data.clinic.name}</h3><p>{address(data.clinic.address)}</p>
      {data.clinic.room && <p>Room: {data.clinic.room}</p>}
      <p>Your appointment is for today at this clinic.</p>
      {booking.result ? <section role="status"><h2>Your token: {booking.result.tokenNumber}</h2><p>You have joined this clinic's queue. Please keep your token.</p></section> :
        <form onSubmit={submit}>
          <label>Patient name<input required maxLength={150} autoComplete="name" value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} /></label>
          <label>Phone number<input required type="tel" maxLength={25} autoComplete="tel" value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} /></label>
          <label>Symptoms<textarea required maxLength={2000} value={form.symptoms} onChange={e => setForm({ ...form, symptoms: e.target.value })} /></label>
          {booking.error && <p role="alert">{booking.error}</p>}<button disabled={booking.busy}>{booking.busy ? 'Confirming…' : 'Get walk-in token'}</button>
        </form>}
    </>}
  </main>;
}
