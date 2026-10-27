import { clearSessionPreservingLanguages } from '../../i18n/languagePreferences';
import { PortalLanguageScope } from '../common/portalLanguageScope';
import { useDoctorTranslation } from '../../i18n/LanguageContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { PortalElement, PortalText } from "../common/PortalTranslation";
import { useEffect, useRef, useState } from "react";
import { FaSignOutAlt, FaTimes } from "react-icons/fa";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { doctorMenuItems } from "./doctorRoutes";
import { getDoctorUser } from "./doctorApi";
import axiosInstance, { API_BASE_URL } from "../../axiosConfig";
import { normalizeProfileImage, profileImageValue } from "../../utils/profileImage";
import { socketService } from "../../services/socketService";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./DoctorLayout.css";
import "./doctorCards.css";
import DoctorIncomingCalls from "./DoctorIncomingCalls";

export default function DoctorLayout() {
  const { lang, setLang, t } = useDoctorTranslation();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const logoutDialog = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const user = getDoctorUser();
  const doctorId = user?.doctor_id || user?.doctorId || user?.id || user?._id || user?.user_id || user?.userId;
  const [serverProfile, setServerProfile] = useState(null);
  const [, refreshProfile] = useState(0);
  let savedProfile = {};
  try {
    savedProfile = JSON.parse(localStorage.getItem(`doctorProfile:${doctorId}`) || "{}");
  } catch { /* Use the signed-in user's details if the profile cache is invalid. */ }
  useEffect(() => {
    let active = true;
    let pending = false;
    const load = async () => {
      if (pending) return;
      pending = true;
      try {
        const { data } = await axiosInstance.get("/api/auth/me");
        if (active) setServerProfile(data?.data?.user || data?.data || data?.user || data?.profile || data);
      } catch { /* Keep the cached profile available when offline. */ }
      finally { pending = false; }
    };
    const update = () => {
      setServerProfile(null);
      refreshProfile(value => value + 1);
      load();
    };
    load();
    const storageUpdate = event => { if (event.key === 'userData' || event.key === `doctorProfile:${doctorId}`) update(); };
    window.addEventListener("profile-updated", update);
    window.addEventListener("storage", storageUpdate);
    return () => {
      active = false;
      window.removeEventListener("profile-updated", update);
      window.removeEventListener("storage", storageUpdate);
    };
  }, [doctorId]);
  const doctorPhoto = normalizeProfileImage(
    serverProfile ? profileImageValue(serverProfile) : savedProfile.photo || profileImageValue(user), API_BASE_URL);
  const doctorName = savedProfile?.name || user?.fullName || user?.full_name || user?.name || "Doctor";
  const doctorEmail = savedProfile?.email || user?.email || user?.email_address;
  const doctorPhone = savedProfile?.mobile || user?.phoneNumber || user?.phone_number || user?.phone || user?.mobile || user?.contact_number || user?.contactNumber;
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (showLogoutConfirm) logoutDialog.current?.showModal();
    else logoutDialog.current?.close();
  }, [showLogoutConfirm]);
  useEffect(() => {
    const close = (event) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await axiosInstance.post("/api/auth/logout", { refreshToken: localStorage.getItem("refreshToken") }, { timeout: 10000 });
    } catch (error) {
      console.error("Doctor logout request failed:", error.message);
    } finally {
      socketService.disconnect();
      clearSessionPreservingLanguages();
      setShowLogoutConfirm(false);
      setLoggingOut(false);
      navigate("/login", { replace: true });
    }
  };
  return (
    <PortalLanguageScope.Provider value="doctor"><div className="doctor-layout" lang={lang} dir={/^(ar|fa|he|ur)(-|$)/.test(lang) ? "rtl" : "ltr"}>
      {open && <PortalElement as="button" className="doctor-nav-backdrop" aria-label="Close navigation" onClick={() => setOpen(false)} />}
      <aside id="doctor-sidebar" className={`doctor-sidebar ${open ? "is-open" : ""}`}>
        <Link to="/doctorprofile" className="doctor-sidebar-profile" aria-label="View my doctor profile">
          <div className="doctor-profile-avatar-wrap">
            <img className="doctor-profile-avatar" key={doctorPhoto} src={doctorPhoto || "/favicon-96.png"} alt={`${doctorName} profile`} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/favicon-96.png"; }} />
            <span className="doctor-profile-status" aria-hidden="true" />
          </div>
          <h3 className="doctor-profile-name" title={doctorName}>{doctorName}</h3>
          {doctorEmail && <p className="doctor-profile-meta doctor-profile-email" title={doctorEmail}><i className="fa-solid fa-envelope" aria-hidden="true" /><span>{doctorEmail}</span></p>}
          {doctorPhone && <p className="doctor-profile-meta" title={doctorPhone}><i className="fa-solid fa-phone" aria-hidden="true" /><span>{doctorPhone}</span></p>}
        </Link>
        <p className="doctor-sidebar-label"><PortalText text={"DOCTOR PANEL"} /></p>
        <PortalElement as="nav" aria-label="Doctor navigation">
          {doctorMenuItems.map(({ path, icon, text }) => <NavLink key={path} to={path} className={({ isActive }) => `doctor-nav-link ${isActive || (path === "/patient-sms" && location.pathname.startsWith("/patient-chat/")) ? "active" : ""}`}><i className={`fa-solid ${icon}`} aria-hidden="true" /><span><PortalText text={text} /></span></NavLink>)}
        </PortalElement>
        <div className="doctor-sidebar-footer"><div className="doctor-sidebar-language"><LanguageSelector lang={lang} setLang={setLang} t={t} /></div>
          <NavLink to="/doctorprofile" className="doctor-nav-link"><i className="fa-solid fa-user-doctor" aria-hidden="true" /><PortalText text={" My Profile"} /></NavLink>
          <NavLink to="/setting" className="doctor-nav-link"><i className="fa-solid fa-gear" aria-hidden="true" /><PortalText text={" Settings"} /></NavLink>
          <button type="button" className="doctor-nav-link doctor-logout-button" onClick={() => setShowLogoutConfirm(true)} disabled={loggingOut} aria-haspopup="dialog">
            <FaSignOutAlt aria-hidden="true" /><span><PortalText text={"Logout"} /></span>
          </button>
        </div>
      </aside>
      <dialog ref={logoutDialog} className="doctor-logout-dialog" aria-labelledby="doctor-logout-title" aria-describedby="doctor-logout-description"
        onCancel={(event) => { event.preventDefault(); if (!loggingOut) setShowLogoutConfirm(false); }}
        onClose={() => setShowLogoutConfirm(false)}
        onClick={(event) => { if (event.target === event.currentTarget && !loggingOut) setShowLogoutConfirm(false); }}>
        <div className="doctor-logout-dialog-content">
          <PortalElement as="button" type="button" className="doctor-logout-close" aria-label="Close logout confirmation" onClick={() => setShowLogoutConfirm(false)} disabled={loggingOut}><FaTimes aria-hidden="true" /></PortalElement>
          <div className="doctor-logout-heading">
          <div className="doctor-logout-warning-wrap"><FaSignOutAlt className="doctor-logout-warning" aria-hidden="true" /></div>
          <div className="doctor-logout-copy">
          <h3 id="doctor-logout-title"><PortalText text={"Confirm Logout"} /></h3>
          <p id="doctor-logout-description"><PortalText text={"Are you sure you want to logout?"} /></p>
          </div>
          </div>
          <div className="doctor-logout-actions">
            <button type="button" className="doctor-logout-cancel" onClick={() => setShowLogoutConfirm(false)} disabled={loggingOut} autoFocus><PortalText text={"Cancel"} /></button>
            <button type="button" className="doctor-logout-confirm" onClick={logout} disabled={loggingOut}>{loggingOut ? <PortalText text={"Logging out..."} /> : <PortalText text={"Logout"} />}</button>
          </div>
        </div>
      </dialog>
      <DoctorIncomingCalls doctorId={doctorId} user={user} />
      <div className="doctor-layout-body">
        <header className="doctor-topbar">
          <PortalElement as="button" className="doctor-menu-toggle" aria-label="Toggle doctor navigation" aria-controls="doctor-sidebar" aria-expanded={open} onClick={() => setOpen(!open)}><i className="fa-solid fa-bars" aria-hidden="true" /></PortalElement>
          <span className="doctor-topbar-title"><PortalText text={"Doctor Portal"} /></span>
          <div className="doctor-topbar-actions"><Link to="/doctor-notifications" aria-label="Notifications"><i className="fa-solid fa-bell" aria-hidden="true" /></Link><Link to="/doctorprofile">{doctorName}</Link></div>
        </header>
        <main className="doctor-page-content" data-card-theme={['/appointmentlist', '/walkinappointment'].includes(location.pathname.replace(/\/$/, '')) ? 'original' : 'shared'}><Outlet /></main>
      </div>
    </div></PortalLanguageScope.Provider>
  );
}
