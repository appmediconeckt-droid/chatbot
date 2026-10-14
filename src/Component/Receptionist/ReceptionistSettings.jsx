import { PortalText, PortalElement } from '../common/PortalTranslation';
import React, { useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { UserRound, ShieldCheck, LockKeyhole, Eye, EyeOff, Check, SlidersHorizontal, LogOut, Monitor } from 'lucide-react';
import axios from '../../axiosConfig.js';
import { preferenceKey } from './receptionistPreferences.js';

const passwordRules = [
  ['At least 8 characters', value => value.length >= 8],
  ['Uppercase letter', value => /[A-Z]/.test(value)],
  ['Lowercase letter', value => /[a-z]/.test(value)],
  ['A number', value => /\d/.test(value)],
  ['A special character', value => /[^A-Za-z0-9]/.test(value)],
];
export default function ReceptionistSettings() {
  const { profile, clinics, preferences, savePreferences, logout, loggingOut } = useOutletContext();
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmation: '' });
  const [visible, setVisible] = useState({});
  const [busy, setBusy] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [draft, setDraft] = useState(() => ({ ...preferences }));
  const [notice, setNotice] = useState('');
  const [preferenceError, setPreferenceError] = useState('');
  const updatePassword = (key, value) => { setPasswords(current => ({ ...current, [key]: value })); setPasswordError(''); };
  const changePassword = async event => {
    event.preventDefault();
    if (busy) return;
    setPasswordError('');
    if (!passwordRules.every(([, valid]) => valid(passwords.newPassword))) { setPasswordError('Your new password must meet all five requirements below.'); return; }
    if (passwords.newPassword !== passwords.confirmation) { setPasswordError('New password and confirmation do not match.'); return; }
    if (passwords.oldPassword === passwords.newPassword) { setPasswordError('Choose a new password different from your current password.'); return; }
    setBusy(true);
    try {
      await axios.post('/api/auth/changePassword', { oldPassword: passwords.oldPassword, newPassword: passwords.newPassword }, { timeout: 15000 });
      for (const key of ['accessToken', 'token', 'refreshToken', 'isAuthenticated', 'userRole', 'userType', 'role', 'userData', 'userId', 'userEmail', 'counselorId', 'counsellorId', 'isVerified']) localStorage.removeItem(key);
      navigate('/login', { replace: true, state: { email: profile.email, passwordChanged: true } });
    } catch (err) { setPasswordError(err.response?.data?.message || 'Password could not be changed. Please try again.'); }
    finally { setBusy(false); }
  };
  const save = event => {
    event.preventDefault(); setNotice(''); setPreferenceError('');
    if (draft.defaultClinic && !clinics.some(row => String(row._id || row.id) === draft.defaultClinic)) { setPreferenceError('Choose a clinic currently assigned to your doctor.'); return; }
    try {
      localStorage.setItem(preferenceKey(profile), JSON.stringify(draft));
      savePreferences(draft);
      setNotice('Preferences saved. Your clinic selection and table layout have been updated.');
    } catch { setPreferenceError('Preferences could not be saved in this browser. Please check browser storage permissions.'); }
  };
  const dirty = draft.defaultClinic !== preferences.defaultClinic || draft.compactTables !== preferences.compactTables;
  return <div className="rec-settings-grid">
    <div>
      <section className="rec-card"><div className="rec-card-heading"><div className="rec-settings-title"><span className="rec-stat-icon teal"><UserRound size={22} /></span><div><h2><PortalText text={"Account information"} /></h2><p><PortalText text={"Your receptionist account and clinic assignment."} /></p></div></div><Link className="rec-text-button" to="/receptionist/profile"><PortalText text={"View profile"} /></Link></div>
        <dl className="rec-detail-grid rec-settings-account">{[['Full name', profile.fullName], ['Email address', profile.email], ['Phone number', profile.phoneNumber], ['Role', 'Receptionist'], ['Assigned doctor', profile.assignedDoctorName], ['Assigned clinic', profile.clinic_name]].map(([label, value]) => <div key={label}><dt><PortalText text={label} /></dt><dd>{value || <PortalText text={"Not assigned"} />}</dd></div>)}</dl>
        <div className="rec-settings-note"><ShieldCheck size={17} /><p><PortalText text={"Your doctor manages your account details, staff role and clinic assignment."} /></p></div>
      </section>
      <section className="rec-card"><div className="rec-card-heading"><div className="rec-settings-title"><span className="rec-stat-icon blue"><LockKeyhole size={22} /></span><div><h2><PortalText text={"Password & security"} /></h2><p><PortalText text={"Update the password you use to sign in."} /></p></div></div></div>
        <form className="rec-password-form" onSubmit={changePassword}>
          {[['oldPassword', 'Current password', 'current-password'], ['newPassword', 'New password', 'new-password'], ['confirmation', 'Confirm new password', 'new-password']].map(([key, label, autocomplete]) => <div className="rec-password-field" key={key}><label htmlFor={`rec-${key}`}><PortalText text={label} /></label><div className="rec-password-input"><input id={`rec-${key}`} name={key} type={visible[key] ? 'text' : 'password'} autoComplete={autocomplete} required disabled={busy} value={passwords[key]} onChange={event => updatePassword(key, event.target.value)} placeholder={label} aria-describedby={key === 'newPassword' ? 'rec-password-requirements' : undefined} /><button type="button" disabled={busy} aria-label={`${visible[key] ? 'Hide' : 'Show'} ${label.toLowerCase()}`} aria-pressed={Boolean(visible[key])} onClick={() => setVisible(current => ({ ...current, [key]: !current[key] }))}>{visible[key] ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>)}
          <ul id="rec-password-requirements" className="rec-password-rules">{passwordRules.map(([label, valid]) => <li key={label} className={passwords.newPassword && valid(passwords.newPassword) ? 'met' : ''}><Check size={13} />{label}</li>)}</ul>
          {passwordError && <p className="rec-alert" role="alert">{passwordError}</p>}
          <div className="rec-settings-form-footer"><p><ShieldCheck size={15} /><PortalText text={"After saving, sign in again with your new password."} /></p><div><button className="rec-button" type="button" disabled={busy} onClick={() => { setPasswords({ oldPassword: '', newPassword: '', confirmation: '' }); setVisible({}); setPasswordError(''); }}><PortalText text={"Clear"} /></button><button className="rec-button primary" type="submit" disabled={busy}>{busy ? <PortalText text={"Updating..."} /> : <PortalText text={"Update password"} />}</button></div></div>
        </form>
      </section>
    </div>
    <div>
      <section className="rec-card"><div className="rec-card-heading"><div className="rec-settings-title"><span className="rec-stat-icon amber"><SlidersHorizontal size={22} /></span><div><h2><PortalText text={"Portal preferences"} /></h2><p><PortalText text={"Personalize your front desk workspace."} /></p></div></div></div>
        <form onSubmit={save} className="rec-preferences-form"><label htmlFor="rec-default-clinic"><PortalText text={"Default clinic / hospital"} /></label><select id="rec-default-clinic" disabled value={draft.defaultClinic} onChange={event => { setDraft(current => ({ ...current, defaultClinic: event.target.value })); setNotice(''); }}><PortalElement as="option" value="">Assigned clinic / hospital</PortalElement>{clinics.map(row => <option key={row._id || row.id} value={row._id || row.id}>{row.clinic_name}</option>)}</select><p className="rec-settings-hint"><PortalText text={"This clinic is selected automatically when you open the portal."} /></p>
          <label className="rec-settings-toggle" htmlFor="rec-compact-tables"><div><strong><PortalText text={"Compact appointment tables"} /></strong><p><PortalText text={"Show more patients with smaller row spacing."} /></p></div><input id="rec-compact-tables" type="checkbox" checked={draft.compactTables} onChange={event => { setDraft(current => ({ ...current, compactTables: event.target.checked })); setNotice(''); }} /></label>
          <div className="rec-settings-note"><Monitor size={17} /><p><PortalText text={"These preferences are saved for your account in this browser."} /></p></div>
          {notice && <p className="rec-settings-success" role="status"><Check size={16} />{notice}</p>}{preferenceError && <p className="rec-alert" role="alert">{preferenceError}</p>}
          <div className="rec-settings-save"><button className="rec-button" type="button" disabled={!dirty} onClick={() => { setDraft({ ...preferences }); setNotice(''); setPreferenceError(''); }}><PortalText text={"Cancel"} /></button><button className="rec-button primary" type="submit" disabled={!dirty}><PortalText text={"Save preferences"} /></button></div>
        </form>
      </section>
      <section className="rec-card"><div className="rec-card-heading"><div className="rec-settings-title"><span className="rec-stat-icon teal"><ShieldCheck size={22} /></span><div><h2><PortalText text={"Current session"} /></h2><p><PortalText text={"Signed in as "} />{profile.fullName}.</p></div></div></div><p className="rec-settings-hint"><PortalText text={"Logout when your shift ends or before leaving a shared desk."} /></p><button className="rec-button rec-settings-signout" disabled={loggingOut || busy} onClick={logout}><LogOut size={16} />{loggingOut ? <PortalText text={"Logging out..."} /> : <PortalText text={"Logout"} />}</button></section>
    </div>
  </div>;
}
