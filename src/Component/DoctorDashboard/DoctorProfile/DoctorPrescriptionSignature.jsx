import React, { useEffect, useRef, useState } from 'react';
import { PenLine, Upload, Check } from 'lucide-react';
import axios, { API_BASE_URL } from '../../../axiosConfig.js';
import { normalizeProfileImage } from '../../../utils/profileImage.js';
import { PortalText } from '../../common/PortalTranslation';
import './DoctorPrescriptionSignature.css';

export default function DoctorPrescriptionSignature({ profile, loading, onSaved }) {
  const [mode, setMode] = useState('upload');
  const [hasInk, setHasInk] = useState(false);
  const canvas = useRef(null);
  const strokes = useRef({ pointerId: null, last: null, distance: 0, bounds: null });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [validPreview, setValidPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const input = useRef(null);
  const userId = profile?._id || profile?.id;
  const savedUrl = normalizeProfileImage(profile?.prescriptionSignature || profile?.prescriptionSignatureUrl, API_BASE_URL);
  useEffect(() => {
    if (!file) { setPreview(''); setValidPreview(false); return; }
    const url = URL.createObjectURL(file);
    setPreview(url); setValidPreview(false);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const clear = () => { setFile(null); setError(''); setNotice(''); if (input.current) input.current.value = ''; };
  const choose = event => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setError(''); setNotice('');
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(selected.type) || selected.size > 5 * 1024 * 1024 || !selected.size) {
      setFile(null); event.target.value = ''; setError('Choose a PNG, JPG or WebP image up to 5 MB.'); return;
    }
    setFile(selected);
  };
  const disabled = loading || saving || !userId;
  const switchMode = next => { setMode(next); setError(''); setNotice(''); };
  const clearDrawing = () => {
    canvas.current?.getContext('2d').clearRect(0, 0, 900, 240);
    strokes.current = { pointerId: null, last: null, distance: 0, bounds: null };
    setHasInk(false); setError(''); setNotice('');
  };
  const point = event => {
    const rect = canvas.current.getBoundingClientRect();
    return { x: Math.max(0, Math.min(900, (event.clientX - rect.left) * 900 / rect.width)), y: Math.max(0, Math.min(240, (event.clientY - rect.top) * 240 / rect.height)) };
  };
  const beginStroke = event => {
    if (disabled || event.isPrimary === false || event.button !== 0) return;
    event.preventDefault();
    const next = point(event);
    strokes.current.pointerId = event.pointerId; strokes.current.last = next;
    canvas.current.setPointerCapture(event.pointerId);
    setError(''); setNotice('');
  };
  const continueStroke = event => {
    const current = strokes.current;
    if (disabled || current.pointerId !== event.pointerId || !current.last) return;
    event.preventDefault();
    const next = point(event), previous = current.last;
    const context = canvas.current.getContext('2d');
    context.strokeStyle = '#173342'; context.lineWidth = 3; context.lineCap = 'round'; context.lineJoin = 'round';
    context.beginPath(); context.moveTo(previous.x, previous.y); context.lineTo(next.x, next.y); context.stroke();
    current.distance += Math.hypot(next.x - previous.x, next.y - previous.y);
    const bounds = current.bounds || { left: previous.x, right: previous.x, top: previous.y, bottom: previous.y };
    current.bounds = { left: Math.min(bounds.left, previous.x, next.x), right: Math.max(bounds.right, previous.x, next.x), top: Math.min(bounds.top, previous.y, next.y), bottom: Math.max(bounds.bottom, previous.y, next.y) };
    current.last = next;
    if (current.distance >= 8) setHasInk(true);
  };
  const endStroke = event => {
    if (strokes.current.pointerId !== event.pointerId) return;
    strokes.current.pointerId = null; strokes.current.last = null;
    if (canvas.current.hasPointerCapture(event.pointerId)) canvas.current.releasePointerCapture(event.pointerId);
  };
  const drawingFile = async () => {
    const bounds = strokes.current.bounds;
    if (!bounds || !hasInk) throw new Error('Draw your signature before saving.');
    const left = Math.max(0, Math.floor(bounds.left) - 12), top = Math.max(0, Math.floor(bounds.top) - 12);
    const cropped = document.createElement('canvas');
    cropped.width = Math.min(900, Math.ceil(bounds.right) + 12) - left;
    cropped.height = Math.min(240, Math.ceil(bounds.bottom) + 12) - top;
    cropped.getContext('2d').drawImage(canvas.current, left, top, cropped.width, cropped.height, 0, 0, cropped.width, cropped.height);
    const blob = await new Promise(resolve => cropped.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Signature could not be prepared. Please try again.');
    return new File([blob], 'doctor-signature.png', { type: 'image/png' });
  };
  const save = async event => {
    event.preventDefault();
    if (disabled || (mode === 'draw' ? !hasInk : !file || !validPreview)) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const signatureFile = mode === 'draw' ? await drawingFile() : file;
      const body = new FormData(); body.append('prescriptionSignature', signatureFile);
      const { data } = await axios.patch(`/api/auth/update/${encodeURIComponent(userId)}`, body, { timeout: 30000 });
      if (!data.success || !data.user?.prescriptionSignature?.url) throw new Error('Signature could not be saved. Please try again.');
      const updated = { ...profile, ...data.user };
      onSaved(updated);
      try {
        const cached = JSON.parse(localStorage.getItem('userData') || '{}');
        localStorage.setItem('userData', JSON.stringify({ ...cached, prescriptionSignature: data.user.prescriptionSignature, prescriptionSignatureUrl: data.user.prescriptionSignature.url }));
      } catch { /* The saved signature is available from the profile API even when browser storage is unavailable. */ }
      setFile(null); if (input.current) input.current.value = '';
      clearDrawing(); setMode('upload');
      setNotice('Signature saved. It will appear on your appointment prescriptions and downloaded PDFs.');
    } catch (err) { setError(err.response?.data?.message || err.message || 'Unable to save your signature. Please try again.'); }
    finally { setSaving(false); }
  };
  return <section className="doctor-signature-card" aria-labelledby="doctor-signature-title">
    <div className="doctor-signature-heading"><span><PenLine size={23} aria-hidden="true" /></span><div><h3 id="doctor-signature-title"><PortalText text="Prescription Signature" /></h3><p><PortalText text="Draw or upload your signature once to use it on your prescriptions." /></p></div></div>
    <form onSubmit={save} aria-busy={saving}>
      <div className="doctor-signature-modes" role="group" aria-label="Signature method"><button type="button" aria-pressed={mode === 'upload'} disabled={saving} onClick={() => switchMode('upload')}><Upload size={16} aria-hidden="true" /><PortalText text="Upload Image" /></button><button type="button" aria-pressed={mode === 'draw'} disabled={saving} onClick={() => switchMode('draw')}><PenLine size={16} aria-hidden="true" /><PortalText text="Draw Signature" /></button></div>
      <div className="doctor-signature-drawing" hidden={mode !== 'draw'}>
        <p id="doctor-signature-draw-help"><PortalText text="Sign below using your mouse, finger or stylus." /></p>
        <div className="doctor-signature-pad"><canvas ref={canvas} width={900} height={240} aria-label="Draw your signature here" aria-describedby="doctor-signature-draw-help" aria-disabled={disabled} onPointerDown={beginStroke} onPointerMove={continueStroke} onPointerUp={endStroke} onPointerCancel={endStroke} onLostPointerCapture={endStroke} /><span aria-hidden="true"><PortalText text="Sign here" /></span></div>
        <button type="button" className="doctor-signature-clear" disabled={disabled || !hasInk} onClick={clearDrawing}><PortalText text="Clear Signature" /></button>
      </div>
      <div className="doctor-signature-content" hidden={mode !== 'upload'}><div className="doctor-signature-preview">
        {preview || savedUrl ? <img src={preview || savedUrl} alt={file ? 'Selected signature preview' : 'Saved doctor signature'} onLoad={() => { if (file) setValidPreview(true); }} onError={() => { if (file) { setValidPreview(false); setError('This image could not be opened. Choose another signature image.'); } else setError('Saved signature preview could not be loaded.'); }} /> : <span><PenLine size={30} aria-hidden="true" /><PortalText text={loading ? 'Loading signature...' : 'No signature saved yet'} /></span>}
      </div><div className="doctor-signature-controls"><label htmlFor="doctor-prescription-signature"><PortalText text={savedUrl ? 'Replace signature image' : 'Upload signature image'} /></label><input ref={input} id="doctor-prescription-signature" name="prescriptionSignature" type="file" accept="image/png,image/jpeg,image/webp" disabled={loading || saving || !userId} onChange={choose} aria-describedby="doctor-signature-help" /><p id="doctor-signature-help"><PortalText text="PNG, JPG or WebP, up to 5 MB. Use a clear signature on a white or transparent background." /></p></div></div>
      {error && <p className="doctor-signature-error" role="alert">{error}</p>}
      {notice && <p className="doctor-signature-success" role="status"><Check size={17} aria-hidden="true" />{notice}</p>}
      <div className="doctor-signature-actions">{mode === 'upload' && file && <button type="button" disabled={saving} onClick={clear}><PortalText text="Cancel" /></button>}<button className="doctor-signature-save" type="submit" disabled={disabled || (mode === 'draw' ? !hasInk : !file || !validPreview)}><Check size={16} aria-hidden="true" /><PortalText text={saving ? 'Saving signature...' : 'Save Signature'} /></button></div>
    </form>
  </section>;
}
