import React, { useEffect, useRef, useState } from 'react';
import axios, { API_BASE_URL } from '../../axiosConfig.js';
import { clinicDisplayUrl } from './receptionistDisplay.js';
import { PortalText } from '../common/PortalTranslation';
import { downloadLedReceiverLauncher } from '../common/ledReceiverLauncher.js';

export default function DisplayAudioControl({ displayId, queue }) {
  const [enabled, setEnabled] = useState(null);
  const [localAudio, setLocalAudio] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(true);
  const speaking = useRef(false);
  const supported = typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
  const tokens = JSON.stringify(queue?.nextTokens || []);
  const base = clinicDisplayUrl(API_BASE_URL, displayId).split('/display/clinic/')[0];
  const audioUrl = `${base}/led-control/clinic/${encodeURIComponent(displayId)}/audio`;
  useEffect(() => {
    mounted.current = true;
    const stream = new EventSource(audioUrl);
    stream.onmessage = event => {
      try {
        const state = JSON.parse(event.data);
        if (typeof state.enabled === 'boolean') { setEnabled(state.enabled); setError(''); }
      } catch { /* Ignore incomplete events during reconnects. */ }
    };
    stream.onerror = () => setError('Audio controls are reconnecting.');
    return () => {
      mounted.current = false;
      stream.close();
      if (speaking.current && supported) speechSynthesis.cancel();
    };
  }, [audioUrl, supported]);
  useEffect(() => {
    if (!supported) return;
    if (!enabled || !localAudio) {
      if (speaking.current) speechSynthesis.cancel();
      speaking.current = false;
      return;
    }
    const next = JSON.parse(tokens).filter(token => token != null).slice(0, 2);
    if (!next.length) { speechSynthesis.cancel(); speaking.current = false; return; }
    const utterance = new SpeechSynthesisUtterance(`Next token ${next.length === 1 ? 'number' : 'numbers'} ${next.join(' and ')}. Please be ready for your turn.`);
    utterance.lang = 'en-IN';
    utterance.rate = 0.9;
    utterance.onerror = event => {
      if (['canceled', 'interrupted'].includes(event.error) || !mounted.current) return;
      setLocalAudio(false);
      setError('Click Enable laptop / HDMI audio to allow sound in this browser.');
    };
    speechSynthesis.cancel();
    speaking.current = true;
    speechSynthesis.speak(utterance);
  }, [enabled, localAudio, tokens, supported]);
  const update = async next => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      await axios.patch(audioUrl, { enabled: next });
      if (mounted.current) setEnabled(next);
    } catch {
      if (mounted.current) setError('Audio setting could not be saved. Please retry.');
    } finally { if (mounted.current) setBusy(false); }
  };
  const playOnLaptop = () => {
    if (!supported) return;
    speechSynthesis.speak(new SpeechSynthesisUtterance(' '));
    setLocalAudio(true);
    if (!enabled) void update(true);
  };
  return <div className="rec-queue-notice"><div>
    <strong><PortalText text="Linked LED audio control" /></strong>
    <p><PortalText text="Doctor and receptionist can enable or mute audio on every screen using this display link." /></p>
    <div className="rec-led-actions">
      <button type="button" className="rec-button primary" disabled={busy || enabled === null || enabled} onClick={() => update(true)}><PortalText text="Enable linked screen audio" /></button>
      <button type="button" className="rec-button" disabled={busy || enabled === null || !enabled} onClick={() => update(false)}><PortalText text="Mute linked screens" /></button>
      {queue && supported && <button type="button" className="rec-button" disabled={busy || enabled === null} onClick={() => localAudio ? setLocalAudio(false) : playOnLaptop()}><PortalText text={localAudio ? 'Stop sound on this laptop' : 'Play sound on this laptop / HDMI'} /></button>}
      <button type="button" className="rec-button" onClick={() => downloadLedReceiverLauncher(clinicDisplayUrl(API_BASE_URL, displayId))}><PortalText text="Download Windows LED receiver launcher" /></button>
    </div>
    <p role="status"><PortalText text={enabled === null ? 'Connecting audio controls...' : enabled ? 'Linked screen audio is enabled.' : 'Linked screen audio is muted.'} /></p>
    <p><PortalText text="For a separate Windows laptop or TV PC, run the downloaded launcher on that receiving device. It opens a dedicated Chrome display window with autoplay allowed, so you can control audio from here without clicking that screen." /></p>
    <p><PortalText text="Other browsers may require Allow sound on this screen once. For HDMI, you can also play sound from this laptop and select the TV / HDMI speaker as its sound output." /></p>
    {error && <p role="alert">{error}</p>}
    {!supported && <p><PortalText text="Speech playback is unavailable in this browser. Shared mute controls still work." /></p>}
  </div></div>;
}
