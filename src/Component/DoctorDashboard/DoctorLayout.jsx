import { useEffect, useRef, useState } from "react";
import { FaSignOutAlt, FaExclamationTriangle } from "react-icons/fa";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { doctorMenuItems } from "./doctorRoutes";
import { getDoctorUser } from "./doctorApi";
import axiosInstance from "../../axiosConfig";
import { socketService } from "../../services/socketService";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./DoctorLayout.css";

export default function DoctorLayout() {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const logoutDialog = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const user = getDoctorUser();
  const doctorId = user?.doctor_id || user?.doctorId || user?.id || user?._id || user?.user_id || user?.userId;
  let savedProfile = {};
  try {
    savedProfile = JSON.parse(localStorage.getItem(`doctorProfile:${doctorId}`) || "{}");
  } catch { /* Use the signed-in user's details if the profile cache is invalid. */ }
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
      localStorage.clear();
      setShowLogoutConfirm(false);
      setLoggingOut(false);
      navigate("/login", { replace: true });
    }
  };
  return (
    <div className="doctor-layout">
      {open && <button className="doctor-nav-backdrop" aria-label="Close navigation" onClick={() => setOpen(false)} />}
      <aside id="doctor-sidebar" className={`doctor-sidebar ${open ? "is-open" : ""}`}>
        <Link to="/doctorprofile" className="doctor-sidebar-profile" aria-label="View my doctor profile">
          <div className="doctor-profile-avatar-wrap">
            <img className="doctor-profile-avatar" src="/favicon-96.png" alt="Humaeli" />
            <span className="doctor-profile-status" aria-hidden="true" />
          </div>
          <h3 className="doctor-profile-name" title={doctorName}>{doctorName}</h3>
          {doctorEmail && <p className="doctor-profile-meta doctor-profile-email" title={doctorEmail}><i className="fa-solid fa-envelope" aria-hidden="true" /><span>{doctorEmail}</span></p>}
          {doctorPhone && <p className="doctor-profile-meta" title={doctorPhone}><i className="fa-solid fa-phone" aria-hidden="true" /><span>{doctorPhone}</span></p>}
        </Link>
        <p className="doctor-sidebar-label">DOCTOR PANEL</p>
        <nav aria-label="Doctor navigation">
          {doctorMenuItems.map(({ path, icon, text }) => <NavLink key={path} to={path} className={({ isActive }) => `doctor-nav-link ${isActive || (path === "/patient-sms" && location.pathname.startsWith("/patient-chat/")) ? "active" : ""}`}><i className={`fa-solid ${icon}`} aria-hidden="true" /><span>{text}</span></NavLink>)}
        </nav>
        <div className="doctor-sidebar-footer">
          <NavLink to="/doctorprofile" className="doctor-nav-link"><i className="fa-solid fa-user-doctor" aria-hidden="true" /> My Profile</NavLink>
          <NavLink to="/setting" className="doctor-nav-link"><i className="fa-solid fa-gear" aria-hidden="true" /> Settings</NavLink>
          <button type="button" className="doctor-nav-link doctor-logout-button" onClick={() => setShowLogoutConfirm(true)} disabled={loggingOut} aria-haspopup="dialog">
            <FaSignOutAlt aria-hidden="true" /><span>Logout</span>
          </button>
        </div>
      </aside>
      <dialog ref={logoutDialog} className="doctor-logout-dialog" aria-labelledby="doctor-logout-title" aria-describedby="doctor-logout-description"
        onCancel={(event) => { event.preventDefault(); if (!loggingOut) setShowLogoutConfirm(false); }}
        onClose={() => setShowLogoutConfirm(false)}
        onClick={(event) => { if (event.target === event.currentTarget && !loggingOut) setShowLogoutConfirm(false); }}>
        <div className="doctor-logout-dialog-content">
          <FaExclamationTriangle className="doctor-logout-warning" aria-hidden="true" />
          <h3 id="doctor-logout-title">Confirm Logout</h3>
          <p id="doctor-logout-description">Are you sure you want to logout?</p>
          <div className="doctor-logout-actions">
            <button type="button" className="doctor-logout-cancel" onClick={() => setShowLogoutConfirm(false)} disabled={loggingOut} autoFocus>Cancel</button>
            <button type="button" className="doctor-logout-confirm" onClick={logout} disabled={loggingOut}>{loggingOut ? 'Logging out...' : 'Logout'}</button>
          </div>
        </div>
      </dialog>
      <div className="doctor-layout-body">
        <header className="doctor-topbar">
          <button className="doctor-menu-toggle" aria-label="Toggle doctor navigation" aria-controls="doctor-sidebar" aria-expanded={open} onClick={() => setOpen(!open)}><i className="fa-solid fa-bars" aria-hidden="true" /></button>
          <span className="doctor-topbar-title">Doctor Portal</span>
          <div className="doctor-topbar-actions"><Link to="/doctor-notifications" aria-label="Notifications"><i className="fa-solid fa-bell" aria-hidden="true" /></Link><Link to="/doctorprofile">{doctorName}</Link></div>
        </header>
        <main className="doctor-page-content"><Outlet /></main>
      </div>
    </div>
  );
}
