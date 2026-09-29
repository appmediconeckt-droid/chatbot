import React, { useEffect, useMemo, useState } from 'react';
import axios from '../../../axiosConfig.js';
import { API_BASE_URL, getAuthHeaders, getDoctorUser } from '../doctorApi.js';
import './QRcode.css';

export default function QRcode() {
  const doctorId = useMemo(() => {
    const stored = getDoctorUser() || {};
    const user = stored.user || stored.data?.user || stored;
    return user.doctor_id || user.doctorId || user.id || user._id || user.user_id || user.userId;
  }, []);
  const [clinics, setClinics] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [room, setRoom] = useState('');
  const [savingRoom, setSavingRoom] = useState(false);
  const [roomNotice, setRoomNotice] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setNotice('');
    if (!doctorId) { setError('Doctor ID not found. Please sign in again.'); setLoading(false); return; }
    axios.get(`${API_BASE_URL}/qr/doctors/${encodeURIComponent(doctorId)}/clinics`, {
      headers: getAuthHeaders(), signal: controller.signal,
    }).then(response => {
      if (controller.signal.aborted) return;
      const items = response.data?.data?.clinics || [];
      setClinics(items);
      setSelectedId(current => items.some(c => c.doctorClinicId === current) ? current : items[0]?.doctorClinicId || '');
    }).catch(err => {
      if (!controller.signal.aborted) { setClinics([]); setError(err.response?.data?.message || 'Unable to load clinics. Please retry.'); }
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [doctorId, refresh]);
  const selected = clinics.find(c => c.doctorClinicId === selectedId);
  useEffect(() => { setRoom(selected?.clinic.room || ''); setRoomNotice(''); }, [selectedId, selected?.clinic.room]);
  const ledUrl = selected ? `${API_BASE_URL.replace(/\/api\/?$/, '')}${selected.ledPath}` : '';
  const saveRoom = async event => {
    event.preventDefault();
    if (!selected || savingRoom) return;
    const targetId = selected.doctorClinicId;
    setSavingRoom(true); setRoomNotice('');
    try {
      const response = await axios.patch(`${API_BASE_URL}/qr/walkin/${encodeURIComponent(targetId)}/room`,
        { roomNumber: room }, { headers: getAuthHeaders() });
      setClinics(items => items.map(c => c.doctorClinicId === targetId ? { ...c, clinic: { ...c.clinic, room: response.data.data.roomNumber } } : c));
      setNotice('Room saved. The connected LED will update automatically.');
    } catch (err) { setRoomNotice(err.response?.data?.message || 'Unable to save room. Please retry.'); }
    finally { setSavingRoom(false); }
  };
  const shareQr = async () => {
    try {
      const blob = await (await fetch(selected.walkinQrCode)).blob();
      const file = new File([blob], `clinic-${selected.doctorClinicId}-qr.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ title: selected.clinic.name, files: [file] });
      else setNotice('Use Download QR to save the image and share it.');
    } catch (err) { if (err.name !== 'AbortError') setNotice('Unable to share. Please download the QR image.'); }
  };
  const copy = async (url, label) => {
    try { await navigator.clipboard.writeText(url); setNotice(`${label} copied.`); }
    catch { setNotice('Copy unavailable. Open the link and copy it from the address bar.'); }
  };
  return <div className="doctor-qr-page">
    <header className="doctor-qr-header"><h1>Clinic QR Code</h1><p>Select a clinic to view its appointment QR and live LED display.</p></header>
    <div className="doctor-qr-clinic-selector">
      <label htmlFor="qr-clinic">Clinic</label>
      <select id="qr-clinic" value={selectedId} disabled={loading || savingRoom || !clinics.length} onChange={event => { setSelectedId(event.target.value); setNotice(''); }}>
        {!clinics.length && <option value="">Select clinic</option>}
        {clinics.map(c => <option key={c.doctorClinicId} value={c.doctorClinicId}>{c.clinic.name}</option>)}
      </select>
      <button type="button" disabled={loading || savingRoom} onClick={() => setRefresh(n => n + 1)}>Refresh</button>
    </div>
    {loading && <p role="status">Fetching clinics...</p>}
    {error && <p role="alert">{error}</p>}
    {!loading && !error && !clinics.length && <p>Add a clinic in Clinic Settings to view its QR.</p>}
    {!loading && !error && selected && <div className="doctor-qr-layout">
      <section className="doctor-qr-card">
        <h2>{selected.clinic.name}</h2><p>{selected.doctor.name}</p>
        {selected.clinic.room && <p><strong>Room {selected.clinic.room}</strong></p>}
        <div className="doctor-qr-frame"><img src={selected.walkinQrCode} alt={`Appointment QR for ${selected.clinic.name}`} /></div>
        <p>Scan to join today's queue at {selected.clinic.name}.</p>
      </section>
      <aside className="doctor-qr-side">
        <section className="doctor-qr-panel"><h3>QR Management</h3>
          <p><a href={selected.walkinQrCode} download={`clinic-${selected.doctorClinicId}-qr.png`}>Download QR</a></p>
          <div className="doctor-qr-actions"><button type="button" onClick={shareQr}>Share QR</button>
            <button type="button" onClick={() => window.print()}>Print QR</button></div>
        </section>
        <section className="doctor-qr-panel"><h3>Clinic LED Display</h3><p>Shows this doctor's current and waiting tokens at {selected.clinic.name}.</p>
          <form onSubmit={saveRoom} className="doctor-qr-room-form">
            <label htmlFor="qr-room">Doctor room number at this clinic</label>
            <input id="qr-room" required maxLength={100} placeholder="e.g. 101 or OPD-2" value={room} disabled={savingRoom} onChange={event => setRoom(event.target.value)} />
            <button disabled={savingRoom}>{savingRoom ? 'Saving...' : 'Save room number'}</button>
            {roomNotice && <p role="alert">{roomNotice}</p>}
          </form>
          <ol><li>Connect the outside LED to this laptop with HDMI.</li>
            <li>Press Win + P and choose Extend.</li>
            <li>Open the LED window below. With that window focused, press Win + Shift + Left/Right Arrow to move it to the outside LED.</li>
            <li>Press F11 for full screen. Keep your doctor dashboard on the laptop.</li></ol>
          <button type="button" onClick={() => window.open(ledUrl, '_blank', 'popup,width=1280,height=720,noopener,noreferrer')}>Open separate LED window</button>
          <input aria-label="LED screen link" readOnly value={ledUrl} onFocus={event => event.target.select()} className="doctor-qr-led-url" />
          <button type="button" onClick={() => copy(ledUrl, 'LED link')}>Copy LED link</button>
          <p><a href={ledUrl} target="_blank" rel="noreferrer">Preview on this device</a></p>
          <p>The LED refreshes every 3 seconds. Keep the laptop awake and connected to the internet. If the window is blocked, allow pop-ups or open the preview in a separate browser window.</p>
        </section>
        {notice && <p role="status">{notice}</p>}
      </aside>
    </div>}
  </div>;
}
