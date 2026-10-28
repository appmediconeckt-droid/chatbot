import { PortalElement, PortalText } from '../common/PortalTranslation';
import { usePortalLanguage } from '../../i18n/LanguageContext';
import { PortalLanguageScope } from '../common/portalLanguageScope';
import { LanguageSelector } from '../common/LanguageSelector';
import React, { useEffect, useRef, useState } from 'react';
import ProfileAvatar from '../common/ProfileAvatar.jsx';
import useProfilePhotoRefresh from '../common/useProfilePhotoRefresh.js';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, ListOrdered, Stethoscope, UserRound, Settings, LogOut, Menu, X, RefreshCw, Building2, ChevronDown, ShieldCheck, Monitor, FileText } from 'lucide-react';
import axios from '../../axiosConfig.js';
import { persistAuthSession } from '../../authtication/authSession.js';
import { receptionistMenu } from './receptionistRoutes.js';
import { indiaToday, displayTime } from './receptionistView.js';
import { defaultPreferences, readPreferences } from './receptionistPreferences.js';
import './ReceptionistPortal.css';
import { logoIcon } from '../../assets/brandAssets.js';

const icons = { dashboard: LayoutDashboard, appointments: CalendarDays, queue: ListOrdered, display: Monitor, patients: FileText, doctor: Stethoscope, profile: UserRound, settings: Settings };
export default function ReceptionistLayout() {
  const { lang, setLang, t } = usePortalLanguage("receptionist");
  const navigate = useNavigate();
  const location = useLocation();
  const needsLiveDashboard = ['/receptionist/dashboard', '/receptionist/live-queue'].includes(location.pathname);
  const needsDashboard = needsLiveDashboard || location.pathname === '/receptionist/doctor';
  const [profile, setProfile] = useState(null);
  useProfilePhotoRefresh(profile, setProfile);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const appliedPreferences = useRef(false);
  const [accountError, setAccountError] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [clinic, setClinic] = useState('');
  const [clinics, setClinics] = useState([]);
  const [date, setDate] = useState(indiaToday);
  const [data, setData] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    const close = event => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    axios.get('/api/auth/me', { signal: controller.signal }).then(({ data: result }) => {
      if (controller.signal.aborted) return;
      const user = result.user;
      if (!user?.role) throw new Error('Your account could not be loaded.');
      const session = persistAuthSession({ user, accessToken: localStorage.getItem('accessToken') || localStorage.getItem('token'), refreshToken: localStorage.getItem('refreshToken') });
      if (user.role !== 'receptionist') { navigate(session?.path || '/login', { replace: true }); return; }
      const assignedClinic = String(user.clinic_id?._id || user.clinic_id?.id || user.clinic_id || '');
      setClinic(assignedClinic);
      setPreferences({ ...readPreferences(user), defaultClinic: assignedClinic });
      setProfile(user);
    }).catch(err => { if (!controller.signal.aborted) setAccountError(err.response?.data?.message || err.message); });
    return () => controller.abort();
  }, [navigate]);
  useEffect(() => {
    if (!profile || !needsDashboard) return;
    const controller = new AbortController();
    let timer;
    setData(null); setLiveData(null);
    const load = async () => {
      if (document.visibilityState === 'hidden' || navigator.onLine === false) { timer = setTimeout(load, 10000); return; }
      setRefreshing(true);
      try {
        const currentDate = indiaToday();
        const request = selectedDate => axios.get('/api/staff/receptionist/dashboard', { params: { date: selectedDate, clinic_id: clinic }, signal: controller.signal });
        const [bookings, live] = await Promise.all([request(date), date === currentDate ? Promise.resolve(null) : request(currentDate)]);
        if (controller.signal.aborted) return;
        setData(bookings.data); setLiveData(live?.data || bookings.data);
        const clinicRows = bookings.data.clinics || [];
        setClinics(clinicRows); setError('');
        const assignedClinic = String(clinicRows[0]?._id || clinicRows[0]?.id || '');
        if (assignedClinic && clinic !== assignedClinic) setClinic(assignedClinic);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.response?.data?.message || 'Unable to refresh data. Showing the last successful update, if available.');
          if ([401, 403, 404].includes(err.response?.status)) { setData(null); setLiveData(null); }
        }
      } finally {
        if (!controller.signal.aborted) { setRefreshing(false); if (needsLiveDashboard) timer = setTimeout(load, 10000); }
      }
    };
    load();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [profile?._id, profile?.id, date, clinic, refresh, needsDashboard, needsLiveDashboard]);
  useEffect(() => {
    if (!liveData || appliedPreferences.current) return;
    appliedPreferences.current = true;
    if (preferences.defaultClinic && clinics.some(row => String(row._id || row.id) === preferences.defaultClinic)) setClinic(preferences.defaultClinic);
  }, [liveData, clinics, preferences]);
  const savePreferences = next => {
    setPreferences(next);
    setClinic(String(profile?.clinic_id?._id || profile?.clinic_id?.id || profile?.clinic_id || ''));
  };
  const logout = async () => {
    setBusy(true);
    try { await axios.post('/api/auth/logout', { refreshToken: localStorage.getItem('refreshToken') }, { timeout: 10000 }); }
    catch (err) { if (err.response?.status !== 401) { setAccountError('Logout failed. Please try again.'); setBusy(false); return; } }
    for (const key of ['accessToken', 'token', 'refreshToken', 'isAuthenticated', 'userRole', 'userType', 'role', 'userData', 'userId', 'userEmail', 'counselorId', 'counsellorId', 'isVerified']) localStorage.removeItem(key);
    navigate('/login', { replace: true });
  };
  const page = receptionistMenu.find(item => item.path === location.pathname) || receptionistMenu[0];
  const initials = (profile?.fullName || 'Receptionist').split(' ').filter(Boolean).map(part => part[0]).slice(0, 2).join('');
  return <PortalLanguageScope.Provider value="receptionist"><div lang={lang} dir={/^(ar|fa|he|ur)(-|$)/.test(lang) ? "rtl" : "ltr"} className={`rec-portal ${preferences.compactTables ? 'rec-compact-tables' : ''}`}>
    {open && <PortalElement as="button" className="rec-backdrop" aria-label="Close navigation" onClick={() => setOpen(false)} />}
    <aside id="receptionist-sidebar" className={`rec-sidebar ${open ? 'is-open' : ''}`}>
      <NavLink to="/receptionist/dashboard" className="rec-brand"><img className="rec-brand-logo" src={logoIcon} width="56" height="56" alt="Humaeli logo" /><div>Humaeli<small><PortalText text={"RECEPTIONIST PORTAL"} /></small></div></NavLink>
      <PortalElement as="button" className="rec-sidebar-close rec-icon-button" aria-label="Close navigation" onClick={() => setOpen(false)}><X size={20} /></PortalElement>
      <div className="rec-sidebar-account"><ProfileAvatar photo={profile?.profilePhoto} name={profile?.fullName} fallback={initials} className="rec-avatar" /><strong>{profile?.fullName || <PortalText text={"Receptionist"} />}<small><PortalText text={"Front desk team"} /></small></strong></div>
      <p className="rec-nav-label"><PortalText text={"WORKSPACE"} /></p>
      <PortalElement as="nav" aria-label="Receptionist navigation">{receptionistMenu.map(item => { const Icon = icons[item.icon]; return <NavLink end key={item.path} to={item.path} className={({ isActive }) => `rec-nav-item ${isActive ? 'active' : ''}`}><Icon size={19} /><span><PortalText text={item.title} /></span></NavLink>; })}</PortalElement>
      <div className="rec-sidebar-bottom"><div className="rec-sidebar-language"><LanguageSelector lang={lang} setLang={setLang} t={t} /></div><div className="rec-access-note"><ShieldCheck size={18} /><span><PortalText text={"Connected to your"} /><br /><strong><PortalText text={"assigned doctor"} /></strong></span></div><button className="rec-nav-item rec-logout" disabled={busy} onClick={logout}><LogOut size={19} />{busy ? <PortalText text={"Logging out..."} /> : <PortalText text={"Logout"} />}</button></div>
    </aside>
    <div className="rec-body">
      <header className="rec-topbar"><PortalElement as="button" className="rec-menu-toggle rec-icon-button" aria-label="Open navigation" aria-controls="receptionist-sidebar" aria-expanded={open} onClick={() => setOpen(true)}><Menu size={22} /></PortalElement><div className="rec-breadcrumb"><PortalText text={"Receptionist "} /><span>/</span> <strong><PortalText text={page.title} /></strong></div><div className="rec-topbar-user"><ProfileAvatar photo={profile?.profilePhoto} name={profile?.fullName} fallback={initials} className="rec-avatar small" /><span>{profile?.fullName || <PortalText text={"Receptionist"} />}<small><PortalText text={"Front desk"} /></small></span></div></header>
      <main className="rec-content">
        <div className="rec-page-heading"><div><p className="rec-eyebrow"><PortalText text={"FRONT DESK WORKSPACE"} /></p><h1><PortalText text={page.title} /></h1><p><PortalText text={page.description} /></p></div><div className="rec-page-actions">{needsDashboard && <><span className="rec-sync"><span className={`rec-dot ${error ? 'warning' : ''}`} />{refreshing ? <PortalText text={"Updating..."} /> : liveData ? `Updated ${displayTime(liveData.updatedAt)}` : <PortalText text={"Connecting"} />}</span><button className="rec-button" disabled={refreshing || !profile} onClick={() => setRefresh(value => value + 1)}><RefreshCw size={16} className={refreshing ? 'rec-spin' : ''} /><PortalText text={"Refresh"} /></button></>}</div></div>
        {accountError && <div className="rec-alert" role="alert">{accountError}</div>}
        {error && <div className="rec-alert" role="alert">{error} {data && <PortalText text={"The displayed data may be out of date."} />}</div>}
        {profile && <div className="rec-context-bar"><div><label className="rec-clinic-filter" htmlFor="receptionist-clinic"><PortalText text={"Clinic / Hospital"} /><span className="rec-clinic-select"><Building2 size={17} aria-hidden="true" /><PortalElement as="select" id="receptionist-clinic" aria-label="Select clinic or hospital" value={clinic} disabled onChange={event => setClinic(event.target.value)}><option value="">{!liveData && !clinics.length && !error ? <PortalText text={"Loading clinics..."} /> : <PortalText text={"Assigned clinic / hospital"} />}</option>{clinics.filter(row => row._id || row.id).map(row => <option key={String(row._id || row.id)} value={String(row._id || row.id)}>{row.clinic_name || row.name || <PortalText text={"Unnamed clinic"} />}{row.location ? ` - ${row.location}` : ''}</option>)}</PortalElement><ChevronDown size={16} aria-hidden="true" /></span></label></div><small><PortalText text={"Live queue refreshes every 10 seconds"} /></small></div>}
        {profile ? <Outlet context={{ profile, setProfile, data, liveData, date, setDate, clinic, clinics, error, preferences, savePreferences, logout, loggingOut: busy, refreshQueue: () => setRefresh(value => value + 1) }} /> : !accountError && <div className="rec-card rec-loading" role="status"><PortalText text={"Loading your receptionist account..."} /></div>}
      </main>
    </div>
  </div></PortalLanguageScope.Provider>;
}
