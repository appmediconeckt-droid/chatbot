import React, { useEffect, useState } from 'react';
import ProfileAvatar from '../common/ProfileAvatar.jsx';
import useProfilePhotoRefresh from '../common/useProfilePhotoRefresh.js';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import axios from '../../axiosConfig.js';
import { persistAuthSession } from '../../authtication/authSession.js';
import { nurseMenuItems } from './nurseRoutes.js';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './NurseLayout.css';

export default function NurseLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  useProfilePhotoRefresh(profile, setProfile);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    const controller = new AbortController();
    axios.get('/api/auth/me', { signal: controller.signal }).then(({ data }) => {
      if (controller.signal.aborted) return;
      const user = data.user;
      if (!user?.role) throw new Error('Your nurse account could not be loaded.');
      const session = persistAuthSession({ user, accessToken: localStorage.getItem('accessToken') || localStorage.getItem('token'), refreshToken: localStorage.getItem('refreshToken') });
      if (user.role !== 'nurse') { navigate(session?.path || '/login', { replace: true }); return; }
      setProfile(user);
    }).catch((err) => {
      if (!controller.signal.aborted) setError(err.response?.data?.message || 'Your nurse account could not be loaded. Please refresh to try again.');
    });
    return () => controller.abort();
  }, [navigate]);
  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await axios.post('/api/auth/logout', { refreshToken: localStorage.getItem('refreshToken') }, { timeout: 10000 });
    } catch (err) {
      if (err.response?.status !== 401) { setError('Logout could not be completed. Please try again.'); setLoggingOut(false); return; }
    }
    for (const key of ['accessToken', 'token', 'refreshToken', 'isAuthenticated', 'userRole', 'userType', 'role', 'userData', 'userId', 'userEmail', 'counselorId', 'counsellorId', 'isVerified']) localStorage.removeItem(key);
    navigate('/login', { replace: true });
  };
  return <div className="nurse-layout">
    <header className="nurse-layout-mobile-header">
      <button type="button" aria-label="Toggle nurse menu" aria-expanded={open} aria-controls="nurse-sidebar" onClick={() => setOpen(!open)}><i className="fa-solid fa-bars" aria-hidden="true" /></button>
      <strong>Nurse Portal</strong>
    </header>
    {open && <button type="button" className="nurse-layout-backdrop" aria-label="Close nurse menu" onClick={() => setOpen(false)} />}
    <aside id="nurse-sidebar" className={`nurse-layout-sidebar ${open ? 'is-open' : ''}`}>
      <NavLink className="nurse-layout-brand" to="/hospital/nurse-dashboard">Humaeli<span>Nurse Portal</span></NavLink>
      <NavLink to="/hospital/nurse-profile" className="nurse-layout-account"><ProfileAvatar photo={profile?.profilePhoto} name={profile?.fullName || 'Nurse'} size={56} /><strong>{profile?.fullName || 'Nurse'}</strong><span>{profile?.clinic_name || 'Nurse account'}</span></NavLink>
      <nav aria-label="Nurse navigation">
        {nurseMenuItems.map((item) => <NavLink key={item.path} to={item.path} end className={({ isActive }) => `nurse-layout-menu-item ${isActive ? 'active' : ''}`}><i className={`fa-solid ${item.icon}`} aria-hidden="true" /><span>{item.text}</span></NavLink>)}
      </nav>
      <button type="button" className="nurse-layout-menu-item nurse-layout-logout" disabled={loggingOut} onClick={logout}><i className="fa-solid fa-right-from-bracket" aria-hidden="true" /><span>{loggingOut ? 'Logging out...' : 'Logout'}</span></button>
    </aside>
    <main className="nurse-layout-content">
      {error && <p className="nurse-layout-error" role="alert">{error}</p>}
      {profile ? <Outlet context={{ profile }} /> : !error && <p role="status">Loading nurse account...</p>}
    </main>
  </div>;
}
