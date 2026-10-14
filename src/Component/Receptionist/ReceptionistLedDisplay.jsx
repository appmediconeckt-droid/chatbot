import { PortalText, PortalElement } from '../common/PortalTranslation';
import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Monitor, ExternalLink, Copy, RefreshCw, ListOrdered, Building2, Clock3 } from 'lucide-react';
import axios, { API_BASE_URL } from '../../axiosConfig.js';
import { clinicDisplayUrl, selectDisplayClinic } from './receptionistDisplay.js';
import { displayTime, statusLabel } from './receptionistView.js';

export default function ReceptionistLedDisplay() {
  const { profile, clinic } = useOutletContext();
  const doctorId = String(profile.assignedDoctor?._id || profile.assignedDoctor?.id || profile.assignedDoctor || '');
  const [displays, setDisplays] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [queue, setQueue] = useState(null);
  const [queueError, setQueueError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setNotice(''); setQueue(null);
    if (!doctorId) { setDisplays([]); setError('Your doctor assignment is missing. Contact your doctor.'); setLoading(false); return () => controller.abort(); }
    axios.get(`/api/qr/doctors/${encodeURIComponent(doctorId)}/clinics`, { signal: controller.signal }).then(({ data }) => {
      if (controller.signal.aborted) return;
      const rows = (data.data?.clinics || []).filter(row => clinicDisplayUrl(API_BASE_URL, row.doctorClinicId));
      setDisplays(rows);
      setSelectedId(current => selectDisplayClinic(rows, current, clinic || profile.clinic_id));
    }).catch(err => {
      if (!controller.signal.aborted) { setDisplays([]); setSelectedId(''); setError(err.response?.data?.message || 'Unable to load LED displays. Please retry.'); }
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [doctorId, clinic, profile.clinic_id, refresh]);
  useEffect(() => {
    if (!selectedId || loading) return;
    const controller = new AbortController();
    let timer;
    setQueue(null); setQueueError('');
    const load = async () => {
      try {
        const { data } = await axios.get(`/api/qr/walkin/${encodeURIComponent(selectedId)}/queue`, { signal: controller.signal });
        if (!controller.signal.aborted) { setQueue({ ...data, fetchedAt: new Date().toISOString() }); setQueueError(''); }
      } catch (err) {
        if (!controller.signal.aborted) {
          setQueueError(err.response?.data?.message || 'Live display data could not be refreshed.');
          if ([401, 403, 404, 410].includes(err.response?.status)) setQueue(null);
        }
      } finally { if (!controller.signal.aborted) timer = setTimeout(load, 3000); }
    };
    load();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [selectedId, loading, refresh]);
  const selected = displays.find(row => row.doctorClinicId === selectedId);
  const url = !loading && selected ? clinicDisplayUrl(API_BASE_URL, selectedId) : '';
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(url); setNotice('LED display link copied. Open it on your connected TV or display.'); }
    catch { setNotice('Copy is unavailable. Select the display link below and copy it manually.'); }
  };
  return <>
    <section className="rec-card"><div className="rec-card-heading"><div><h2><PortalText text={"Clinic LED Display"} /></h2><p><PortalText text={"Open the same live token screen used by your doctor."} /></p></div><Link className="rec-text-button" to="/receptionist/live-queue"><ListOrdered size={16} /><PortalText text={"Live Queue"} /></Link></div>
      <div className="rec-filters rec-led-selector"><label><PortalText text={"Display clinic / hospital"} /><select value={selectedId} disabled={loading || !displays.length} onChange={event => { setSelectedId(event.target.value); setQueue(null); setNotice(''); }}>{!displays.length && <PortalElement as="option" value="">Select a clinic</PortalElement>}{displays.map(row => <option key={row.doctorClinicId} value={row.doctorClinicId}>{row.clinic.name}{row.clinic.room ? ` - Room ${row.clinic.room}` : ''}</option>)}</select></label><button className="rec-button" disabled={loading} onClick={() => setRefresh(value => value + 1)}><RefreshCw size={16} /><PortalText text={"Reload displays"} /></button></div>
      {loading && <p className="rec-loading" role="status"><PortalText text={"Loading your doctor's displays..."} /></p>}
      {error && <p className="rec-alert" role="alert">{error}</p>}
      {!loading && !error && !displays.length && <div className="rec-empty"><Monitor size={32} /><h3><PortalText text={"No clinic display available"} /></h3><p><PortalText text={"Ask your doctor to add an active clinic or hospital. Its LED display will appear here."} /></p></div>}
      {url && <><div className="rec-led-actions"><a className="rec-button primary" href={url} target="_blank" rel="noopener noreferrer"><Monitor size={17} /><PortalText text={"Open LED screen"} /></a><button className="rec-button" onClick={() => window.open(url, '_blank', 'popup,width=1280,height=720,noopener,noreferrer')}><ExternalLink size={16} /><PortalText text={"Open separate LED window"} /></button><button className="rec-button" onClick={copyLink}><Copy size={16} /><PortalText text={"Copy LED link"} /></button></div><label className="rec-led-link-label"><PortalText text={"LED screen link"} /><PortalElement as="input" className="rec-led-link" aria-label="LED screen link" value={url} readOnly onFocus={event => event.target.select()} /></label><p className="rec-led-caption"><PortalText text={"The display updates every 3 seconds with current and next tokens, waiting count, room and doctor status."} /></p></>}
      {notice && <p className="rec-queue-notice" role="status">{notice}</p>}
    </section>
    {url && <div className="rec-overview-grid"><section className="rec-card rec-led-preview"><div className="rec-card-heading"><div><h2><PortalText text={"Live display preview"} /></h2><p><Building2 size={14} /> {selected.clinic.name}{queue?.roomId || selected.clinic.room ? ` / Room ${queue?.roomId || selected.clinic.room}` : ''}</p></div><span className="rec-live-label"><span className={`rec-dot ${queueError ? 'warning' : ''}`} />{queue ? `Updated ${displayTime(queue.fetchedAt)}` : <PortalText text={"Connecting"} />}</span></div>
      {queueError && <p className="rec-alert" role="alert">{queueError}{queue && <PortalText text={" Showing the last successful update."} />}</p>}
      {!queue && !queueError && <p className="rec-loading" role="status"><PortalText text={"Loading live tokens..."} /></p>}
      {queue && <><div className="rec-led-current"><p className="rec-eyebrow"><PortalText text={"CURRENT TOKEN"} /></p><strong>{queue.current?.token ?? '--'}</strong><p>{queue.current ? statusLabel(queue.current.status) : <PortalText text={"No patient currently called"} />}</p><h3>{queue.doctor?.name || selected.doctor?.name || profile.assignedDoctorName}</h3></div><div className="rec-led-next"><div><span><PortalText text={"Next tokens"} /></span><strong>{queue.nextTokens?.length ? queue.nextTokens.map(token => `#${token}`).join(' / ') : <PortalText text={"Queue is clear"} />}</strong></div><div><span><PortalText text={"Waiting"} /></span><strong>{queue.waitingCount ?? 0}</strong></div><div><span><PortalText text={"Completed"} /></span><strong>{queue.completedCount ?? 0}</strong></div></div><div className="rec-queue-notice"><Clock3 size={18} /><div><strong>{queue.breakInfo?.headline || statusLabel(queue.doctorStatus || 'Live queue')}</strong><p><PortalText text={"Estimated wait: "} />{queue.estimatedWaitLabel || (queue.estimatedWaitMinutes != null ? `${queue.estimatedWaitMinutes} min` : <PortalText text={"Updating estimate"} />)}</p></div></div></>}
    </section><section className="rec-card"><div className="rec-card-heading"><h2><PortalText text={"Show it on your LED / TV"} /></h2><Monitor size={20} /></div><ol className="rec-led-instructions"><li><PortalText text={"Connect the LED or TV to your laptop with HDMI."} /></li><li><PortalText text={"Press "} /><strong><PortalText text={"Win + P"} /></strong><PortalText text={" and select "} /><strong><PortalText text={"Extend"} /></strong>.</li><li><PortalText text={"Open a separate LED window. Press "} /><strong><PortalText text={"Win + Shift + Left / Right Arrow"} /></strong><PortalText text={" to move it to the LED."} /></li><li><PortalText text={"Press "} /><strong>F11</strong><PortalText text={" or use the display's "} /><strong><PortalText text={"Full screen"} /></strong><PortalText text={" button."} /></li></ol><p className="rec-led-caption"><PortalText text={"Keep this portal on your laptop and the token screen on the LED. Keep the laptop awake and connected to the internet. You can also open the copied link directly in a TV browser."} /></p></section></div>}
  </>;
}
