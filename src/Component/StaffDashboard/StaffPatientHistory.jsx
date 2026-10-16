import { PortalText, PortalElement } from '../common/PortalTranslation';
import React, { useEffect, useRef, useState } from 'react';
import { FileText, Search, RefreshCw, X, Download, Users, CalendarCheck, Stethoscope } from 'lucide-react';
import axios from '../../axiosConfig.js';
import PrescriptionDocument from '../common/PrescriptionDocument.jsx';
import { prescriptionDoctorName } from '../common/prescriptionDetails.js';
import { downloadConsultationPrescription } from '../common/downloadPrescription.js';
import { displayTime, statusLabel, clinicName } from '../Receptionist/receptionistView.js';
import '../Receptionist/ReceptionistPortal.css';
import './StaffPatientHistory.css';

const dateLabel = value => value ? new Date(`${value.slice(0, 10)}T00:00:00+05:30`).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' }) : 'Not recorded';
export default function StaffPatientHistory() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ from: '', to: '', clinic_id: '', source: 'all', search: '' });
  const [query, setQuery] = useState(filters);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [selected, setSelected] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const dialog = useRef(null);
  const openingRequest = useRef(null);
  const [openingId, setOpeningId] = useState('');
  useEffect(() => () => openingRequest.current?.abort(), []);
  useEffect(() => {
    const controller = new AbortController();
    openingRequest.current?.abort(); setOpeningId('');
    setLoading(true); setError(''); setSelected(null);
    axios.get('/api/staff/patient-history', { params: { ...query, page, limit: 10 }, signal: controller.signal }).then(({ data: response }) => {
      if (!controller.signal.aborted) setData(response);
    }).catch(err => { if (!controller.signal.aborted) { setError(err.response?.data?.message || 'Patient history could not be loaded. Please retry.'); setData(null); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, page, refresh]);
  useEffect(() => {
    if (selected && !dialog.current?.open) dialog.current?.showModal();
    if (!selected && dialog.current?.open) dialog.current.close();
  }, [selected]);
  const apply = event => {
    event.preventDefault();
    if (filters.from && filters.to && filters.from > filters.to) { setError('Start date must be before end date.'); return; }
    setQuery({ ...filters }); setPage(1);
  };
  const clear = () => { const next = { from: '', to: '', clinic_id: '', source: 'all', search: '' }; setFilters(next); setQuery(next); setPage(1); };
  const doctorFor = record => prescriptionDoctorName(record?.prescription || {}, record?.doctor?.name || record?.doctor?.fullName || data?.doctor?.name || data?.doctor?.fullName);
  const download = async () => {
    setDownloading(true); setDownloadError('');
    try { await downloadConsultationPrescription(selected.prescription, doctorFor(selected)); }
    catch { setDownloadError('Prescription PDF could not be downloaded. Please retry.'); }
    finally { setDownloading(false); }
  };
  const open = async record => {
    openingRequest.current?.abort();
    const controller = new AbortController(); openingRequest.current = controller;
    setOpeningId(record.id); setDownloadError(''); setError('');
    try {
      const { data: fresh } = await axios.get('/api/staff/patient-history', { params: { ...query, page, limit: 10 }, signal: controller.signal, timeout: 15000 });
      if (controller.signal.aborted) return;
      const prescription = fresh.records.find(row => row.id === record.id);
      if (!prescription) throw new Error('This visit has changed. Refresh history and open it again.');
      setData(fresh); setSelected(prescription);
    } catch (err) { if (!controller.signal.aborted) setError(err.response?.data?.message || err.message || 'Prescription could not be loaded. Please retry.'); }
    finally { if (!controller.signal.aborted) setOpeningId(''); }
  };
  const pages = Math.max(1, Math.ceil((data?.total || 0) / 10));
  return <div className="rec-portal rec-history-page">
    <div className="rec-card rec-history-intro"><div className="rec-card-heading"><div><h2><PortalText text={"Patients & prescriptions"} /></h2><p><PortalText text={"Doctor-wise completed checkups, visit dates and prescribed treatment."} /></p></div><button className="rec-button" disabled={loading} onClick={() => setRefresh(value => value + 1)}><RefreshCw size={16} /><PortalText text={"Refresh history"} /></button></div>{data && <div className="rec-inline"><Stethoscope size={18} /><strong>{data.doctor.name}</strong><span className="rec-count"><PortalText text={"Updated "} />{displayTime(data.updatedAt)}</span></div>}</div>
    {data && <div className="rec-stats rec-history-stats">{[['Patients', data.summary.patients, Users], ['Completed visits', data.summary.visits, CalendarCheck], ['Treatment records', data.summary.prescriptions, FileText]].map(stat => { const [label, value, Icon] = stat; return <article className="rec-stat" key={label}><span className="rec-stat-icon teal"><Icon size={21} /></span><div><p><PortalText text={label} /></p><strong>{value}</strong></div></article>; })}</div>}
    <section className="rec-card"><form className="rec-filters rec-history-filters" onSubmit={apply}><label className="rec-search"><span className="rec-sr-only"><PortalText text={"Search patient, phone or token"} /></span><Search size={18} /><PortalElement as="input" placeholder="Search patient, phone or token" value={filters.search} onChange={event => setFilters(current => ({ ...current, search: event.target.value }))} /></label><label><PortalText text={"Checked from"} /><input type="date" value={filters.from} onChange={event => setFilters(current => ({ ...current, from: event.target.value }))} /></label><label><PortalText text={"Checked to"} /><input type="date" value={filters.to} onChange={event => setFilters(current => ({ ...current, to: event.target.value }))} /></label><label><PortalText text={"Clinic"} /><select value={filters.clinic_id} onChange={event => setFilters(current => ({ ...current, clinic_id: event.target.value }))}><PortalElement as="option" value="">All clinics</PortalElement>{data?.clinics.map(row => <option key={row._id || row.id} value={row._id || row.id}>{row.clinic_name}</option>)}</select></label><label><PortalText text={"Record type"} /><select value={filters.source} onChange={event => setFilters(current => ({ ...current, source: event.target.value }))}>{[['all', 'All records'], ['online', 'Online visits'], ['walkin', 'Walk-in visits'], ['prescription', 'Chat prescriptions']].map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label><button className="rec-button primary" type="submit" disabled={loading}><PortalText text={"Apply filters"} /></button><button className="rec-button" type="button" onClick={clear}><PortalText text={"Reset"} /></button></form>
      {error && <p className="rec-alert" role="alert">{error}</p>}{loading ? <p className="rec-loading" role="status"><PortalText text={"Loading patient history..."} /></p> : data && <>
        {data.separatePrescriptionsExcluded && <p className="rec-settings-note"><PortalText text={"Chat prescriptions are not linked to a clinic. Select All clinics to include them."} /></p>}
        {data.records.length ? <div className="rec-table-scroll"><table className="rec-table"><thead><tr><th><PortalText text={"Patient"} /></th><th><PortalText text={"Prescribing doctor"} /></th><th><PortalText text={"Checked / issued date"} /></th><th><PortalText text={"Record"} /></th><th><PortalText text={"Clinic"} /></th><th><PortalText text={"Diagnosis"} /></th><th><PortalText text={"Prescription"} /></th></tr></thead><tbody>{data.records.map(row => <tr key={row.id}><td><strong>{row.patient.name}</strong><small>{row.patient.phoneNumber || <PortalText text={"Phone not recorded"} />}</small></td><td><strong>{doctorFor(row)}</strong></td><td><strong>{dateLabel(row.checkedDate)}</strong><small>{row.checkedAt ? displayTime(row.checkedAt) : row.appointmentTime || <PortalText text={"Time not recorded"} />}</small></td><td><span className="rec-badge completed">{row.source === 'prescription' ? <PortalText text={"Chat prescription"} /> : `${statusLabel(row.source)} checkup`}</span>{row.token != null && <small><PortalText text={"Token #"} />{row.token}</small>}</td><td>{row.source === 'prescription' ? <PortalText text={"Chat consultation"} /> : clinicName(data.clinics, row.clinicId)}</td><td className="rec-history-diagnosis">{row.diagnosis || row.prescription.problem || <PortalText text={"Not recorded"} />}</td><td><button className="rec-button compact" disabled={Boolean(openingId)} onClick={() => open(row)}><FileText size={14} />{openingId === row.id ? <PortalText text="Opening..." /> : row.hasPrescription ? <PortalText text={"View prescription"} /> : <PortalText text={"Visit details"} />}</button>{!row.hasPrescription && <small><PortalText text={"Prescription not recorded"} /></small>}</td></tr>)}</tbody></table></div> : <div className="rec-empty"><Users size={30} /><h3><PortalText text={"No completed visits or prescriptions found"} /></h3><p><PortalText text={"Change your filters or refresh after your doctor completes a consultation."} /></p></div>}
        <div className="rec-pagination"><span>{data.total}<PortalText text={" records"} /></span><div><button className="rec-button compact" disabled={page <= 1} onClick={() => setPage(value => value - 1)}><PortalText text={"Previous"} /></button><span><PortalText text={"Page "} />{page}<PortalText text={" of "} />{pages}</span><button className="rec-button compact" disabled={page >= pages} onClick={() => setPage(value => value + 1)}><PortalText text={"Next"} /></button></div></div>
      </>}
    </section>
    <dialog ref={dialog} className="rec-patient-dialog rec-history-dialog" aria-label="Prescription preview" onCancel={() => setSelected(null)} onClose={() => setSelected(null)}>{selected && <>
      <div className="rec-history-dialog-toolbar"><PortalElement as="button" type="button" className="rec-icon-button" aria-label="Close prescription" onClick={() => dialog.current.close()}><X size={20} /></PortalElement></div>
      <PrescriptionDocument record={selected.prescription} doctorName={doctorFor(selected)} />
      {!selected.hasPrescription && <p className="rec-settings-note"><PortalText text={"No prescription has been recorded for this visit."} /></p>}
      {selected.symptoms && <div className="rec-history-visit-details"><p className="rec-history-symptoms"><strong><PortalText text={"Symptoms:"} /></strong> {selected.symptoms}</p></div>}
      {downloadError && <p className="rec-alert" role="alert">{downloadError}</p>}
      <div className="rec-history-actions"><button className="rec-button" onClick={() => dialog.current.close()}><PortalText text={"Close"} /></button>{selected.hasPrescription && <button className="rec-button primary" disabled={downloading} onClick={download}><Download size={16} />{downloading ? <PortalText text={"Downloading..."} /> : <PortalText text={"Download prescription PDF"} />}</button>}</div>
    </>}</dialog>
  </div>;
}
