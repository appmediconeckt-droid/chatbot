import { usePortalTranslator, PatientLanguageControl, PortalText } from "../common/PortalTranslation";
import React, { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import AppointmentForm from './Walk-in/AppointmentForm.jsx';
import axios from '../../axiosConfig.js';
import { API_BASE_URL } from './doctorApi.js';
import './ClinicQrPages.css';

const address = value => typeof value === 'string' ? value : Object.values(value || {}).filter(v => typeof v === 'string').join(', ');
export function LegacyWalkinPage() {
  const params = new URLSearchParams(useLocation().search);
  const clinicId = params.get('doctorClinicId');
  return clinicId
    ? <Navigate replace to={`/walkin/${encodeURIComponent(clinicId)}`} /> : <AppointmentForm key={params.get('doctorId') || 'walkin'} />;
}
function Timings({ items = [] }) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return items.length ? <ul>{items.map((t, i) => <li key={i}>{t.date || days[t.weekday] || t.weekday}: {t.startTime} – {t.endTime}</li>)}</ul> : <p><PortalText text={"Contact the clinic for timings."} /></p>;
}
function useQrData(path) {
  const [state, setState] = useState({});
  useEffect(() => {
    const controller = new AbortController();
    setState({});
    axios.get(`${API_BASE_URL}/qr/${path}`, { signal: controller.signal }).then(res => {
      if (!controller.signal.aborted) setState({ path, data: res.data.data });
    }).catch(err => {
      if (!controller.signal.aborted) setState({ path, error: err.response?.data?.message || 'Unable to load. Please refresh to try again.' });
    });
    return () => controller.abort();
  }, [path]);
  return state.path === path ? state : {};
}
export function DoctorProfilePage() {
  const translateUi = usePortalTranslator();
  const { doctorId } = useParams();
  const { data, error } = useQrData(`doctors/${encodeURIComponent(doctorId)}/profile`);
  return <main className="clinic-qr-public"><PatientLanguageControl />
    {error ? <p role="alert">{translateUi(error)}</p> : !data ? <p role="status"><PortalText text={"Loading doctor profile…"} /></p> : <>
      <h1>{data.name}</h1><p>{[].concat(data.specialization || []).join(', ')}</p>
      <p>{data.qualification}</p>{data.experience && <p><PortalText text={"Experience: "} />{data.experience}</p>}<p>{data.about}</p>
      <h2><PortalText text={"Available clinics"} /></h2><div className="clinic-qr-grid">{data.clinics.map(c => <article key={c.doctorClinicId}>
        <h3>{c.clinic.name}</h3><p>{address(c.clinic.address)}</p><Timings items={c.timings} />
        <Link className="clinic-qr-action" to={`/walkin/${c.doctorClinicId}`}><PortalText text={"Book Appointment"} /></Link><p><PortalText text={"Today's walk-in queue"} /></p>
      </article>)}</div>{!data.clinics.length && <p><PortalText text={"No clinics available yet."} /></p>}
    </>}
  </main>;
}
export function ClinicWalkinPage() {
  const translateUi = usePortalTranslator();
  const { doctorClinicId } = useParams();
  const { data, error } = useQrData(`walkin/${encodeURIComponent(doctorClinicId)}`);
  if (data) return <AppointmentForm key={doctorClinicId} clinicBooking={data} />;
  return <main className="clinic-qr-public"><PatientLanguageControl />
    {error ? <p role="alert">{translateUi(error)}</p> : <p role="status"><PortalText text="Loading clinic…" /></p>}
  </main>;
}
