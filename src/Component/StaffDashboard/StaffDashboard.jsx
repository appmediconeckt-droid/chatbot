import StaffAppointments from './StaffAppointments.jsx';
import ProfileAvatar from '../common/ProfileAvatar.jsx';
import useProfilePhotoRefresh from '../common/useProfilePhotoRefresh.js';
import { staffIdentity, staffShiftTiming } from './staffProfileDetails.js';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../axiosConfig.js';
import { persistAuthSession } from '../../authtication/authSession.js';
import { isStaffRole, staffRoleLabels } from '../../authtication/staffRoles.js';
import './StaffDashboard.css';
import StaffPatientHistory from './StaffPatientHistory.jsx';

const roleFields = {
  nurse: [ ['nursingLicense', 'Nursing license'], ['assignedWard', 'Assigned ward']],
  assistant: [['assistantId', 'Assistant ID'], ['supervisor', 'Supervisor']],
  lab_technician: [['technicianId', 'Technician ID'], ['labType', 'Lab type']],
  housekeeping: [ ['assignedArea', 'Assigned area'], ['housekeepingSupervisor', 'Supervisor']],
  supervisor: [['supervisorId', 'Supervisor ID'], ['teamSize', 'Team size'], ['responsibilities', 'Responsibilities']],
  department_manager: [['managerId', 'Manager ID'], ['employeesUnder', 'Employees managed'], ['budgetResponsibility', 'Budget responsibility']],
  billing: [['billingId', 'Billing ID'], ['softwareExpertise', 'Software expertise']],
};
const clearSession = () => {
  for (const key of ['accessToken', 'token', 'refreshToken', 'isAuthenticated', 'userRole', 'userType', 'role', 'userData', 'userId', 'userEmail', 'counselorId', 'counsellorId', 'isVerified']) {
    localStorage.removeItem(key);
  }
};

export default function StaffDashboard({ initialSection = 'profile', embedded = false } = {}) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  useProfilePhotoRefresh(profile, setProfile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [section, setSection] = useState(initialSection);
  useEffect(() => { setSection(initialSection); }, [initialSection]);
  const [busy, setBusy] = useState(false);
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmation: '' });

  useEffect(() => {
    const controller = new AbortController();
    axios.get('/api/auth/me', { signal: controller.signal }).then(({ data }) => {
      const user = data.user;
      if (!user?.role) throw new Error('Your staff profile could not be loaded.');
      // The server remains authoritative after a doctor changes a staff role.
      const session = persistAuthSession({ user, accessToken: localStorage.getItem('accessToken') || localStorage.getItem('token'), refreshToken: localStorage.getItem('refreshToken') });
      if (!isStaffRole(user.role) || (!embedded && ['nurse', 'receptionist'].includes(user.role))) {
        navigate(session?.path || '/login', { replace: true });
        return;
      }
      setProfile(user);
    }).catch((err) => {
      if (!controller.signal.aborted) setError(err.response?.data?.message || err.message || 'Your profile could not be loaded.');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [navigate, embedded]);

  const logout = async () => {
    setBusy(true);
    setError('');
    try {
      await axios.post('/api/auth/logout', { refreshToken: localStorage.getItem('refreshToken') });
      clearSession();
      navigate('/login', { replace: true });
    } catch (err) {
      if (err.response?.status === 401) {
        clearSession();
        navigate('/login', { replace: true });
      } else setError('Logout could not be completed. Please try again.');
    } finally { setBusy(false); }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setError('');
    if (passwords.newPassword !== passwords.confirmation) {
      setError('New passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await axios.post('/api/auth/changePassword', {
        oldPassword: passwords.oldPassword, newPassword: passwords.newPassword,
      });
      clearSession();
      navigate('/login', { replace: true, state: { email: profile.email, passwordChanged: true } });
    } catch (err) {
      setError(err.response?.data?.message || 'Password could not be changed. Please try again.');
    } finally { setBusy(false); }
  };

  const roleLabel = staffRoleLabels[profile?.role] || 'Staff';
  const details = profile ? [
    ['fullName', 'Full name'], ['email', 'Email'], ['phoneNumber', 'Phone number'],
    ['assignedDoctorName', 'Assigned doctor'], ['clinic_name', 'Clinic / Hospital'],
    ['department', 'Department'], ['staffId', 'Staff ID'], ['shift', 'Shift'], ['shiftTime', 'Shift timings'],
    ...(roleFields[profile.role] || []),
  ] : [];

  return <div className="staff-dashboard">
    {!embedded && <header className="staff-dashboard-header">
      <div><span>Humaeli</span><h1>{roleLabel} Dashboard</h1></div>
      <div className="staff-dashboard-account">
        {profile && <><ProfileAvatar photo={profile.profilePhoto} name={profile.fullName} size={44} className="staff-dashboard-avatar" /><strong>{profile.fullName}</strong></>}
        <button type="button" disabled={busy} onClick={logout}>Logout</button>
      </div>
    </header>}
    <main>
      {!embedded && <nav aria-label="Staff account">
        <button type="button" aria-current={section === 'profile' ? 'page' : undefined} onClick={() => { setSection('profile'); setError(''); }}>My Profile</button>
        <button type="button" aria-current={section === 'appointments' ? 'page' : undefined} onClick={() => setSection('appointments')}>Appointments</button>
        <button type="button" aria-current={section === 'patients' ? 'page' : undefined} onClick={() => setSection('patients')}>Patients & Prescriptions</button>
        <button type="button" aria-current={section === 'settings' ? 'page' : undefined} onClick={() => { setSection('settings'); setError(''); }}>Settings</button>
      </nav>}
      {error && <p className="staff-dashboard-error" role="alert">{error}</p>}
      {loading ? <p role="status">Loading your staff account...</p> : profile && (
        section === 'appointments' ? <StaffAppointments /> : section === 'patients' ? <StaffPatientHistory /> : section === 'profile' ? <section className="staff-dashboard-panel">
          <div className="staff-dashboard-profile-heading">
            <ProfileAvatar photo={profile.profilePhoto} name={profile.fullName} size={88} className="staff-dashboard-avatar" />
            <div><h2>Welcome, {profile.fullName}</h2><p className="staff-dashboard-role">{roleLabel}</p></div>
          </div>
          <dl>{details.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{key === 'staffId' ? staffIdentity(profile) : key === 'shiftTime' ? staffShiftTiming(profile) : profile[key] || 'Not assigned'}</dd></div>)}</dl>
          <p>Your doctor manages your role, clinic assignment and professional details.</p>
        </section> : <section className="staff-dashboard-panel">
          <h2>Change password</h2>
          <p>After changing your password, sign in again with your new password.</p>
          <form onSubmit={changePassword}>
            {[['oldPassword', 'Current password', 'current-password'], ['newPassword', 'New password', 'new-password'], ['confirmation', 'Confirm new password', 'new-password']].map(([key, label, autocomplete]) => <label key={key}>{label}<input type="password" required autoComplete={autocomplete} value={passwords[key]} onChange={(event) => setPasswords((current) => ({ ...current, [key]: event.target.value }))} /></label>)}
            <p>Use at least 8 characters with uppercase, lowercase, a number and a special character.</p>
            <button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Change password'}</button>
          </form>
        </section>
      )}
    </main>
  </div>;
}
