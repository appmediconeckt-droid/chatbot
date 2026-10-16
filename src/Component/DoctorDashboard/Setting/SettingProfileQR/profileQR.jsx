import { PortalText } from "../../../common/PortalTranslation";
import React, { useEffect, useState } from "react";
import axios from "../../../../axiosConfig.js";
import { API_BASE_URL, getDoctorUser } from "../../doctorApi.js";
import { publicDoctorProfile } from "./profileQrData.js";
import "./ProfileCard.css";

export default function ProfileCard() {
  const [profile, setProfile] = useState(null);
  const [qrSrc, setQrSrc] = useState("");
  const [profileLink, setProfileLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrError, setQrError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      setQrError(false);
      setProfileLink("");
      try {
        const stored = getDoctorUser() || {};
        const user = stored.user || stored.data?.user || stored;
        const doctorId = user.doctor_id || user.doctorId || user.id || user._id || user.user_id || user.userId;
        if (!doctorId) throw new Error("Doctor ID not found. Please sign in again.");
        const response = await axios.get(`${API_BASE_URL}/auth/me`);
        if (!active) return;
        const details = publicDoctorProfile(response.data?.data || response.data || {}, user);
        if (!details.name) throw new Error("Please complete your doctor profile before generating a QR.");
        setProfile(details);
        const qr = await axios.get(`${API_BASE_URL}/qr/doctors/${doctorId}/codes`);
        if (!active) return;
        setProfileLink(qr.data.data.profileQrUrl);
        setQrSrc(qr.data.data.profileQrCode);
      } catch (err) {
        if (active) setError(err.response?.data?.message || err.message || "Unable to load doctor profile.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [attempt]);

  if (loading) return <p role="status"><PortalText text={"Loading doctor profile QR..."} /></p>;
  if (error) return <div role="alert"><p>{error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)}><PortalText text={"Retry"} /></button></div>;

  return (
    <section className="doctor-profile-qr">
      <header className="doctor-profile-qr-header"><div className="doctor-profile-qr-header-icon"><i className="bi bi-qr-code" aria-hidden="true" /></div><div><h1><PortalText text="Profile QR" /></h1><p><PortalText text="An easy way for patients to find your profile and clinics." /></p></div></header>
      <div className="doctor-profile-qr-card">
        <div className="doctor-profile-qr-info">
          <div className="doctor-profile-qr-brand"><img src="/favicon-96.png" width="32" height="32" alt="" /><span>Humaeli</span></div>
          <span className="doctor-profile-qr-eyebrow"><PortalText text="DOCTOR PROFILE" /></span>
          <h2>{profile.name}</h2>
          {profile.speciality && <p className="doctor-profile-qr-speciality">{profile.speciality}</p>}
          <dl className="doctor-profile-qr-details">
            <div><i className="bi bi-envelope" aria-hidden="true" /><div><dt><PortalText text="Email address" /></dt><dd>{profile.email || <PortalText text="Not provided" />}</dd></div></div>
            <div><i className="bi bi-telephone" aria-hidden="true" /><div><dt><PortalText text="Phone number" /></dt><dd>{profile.phone || <PortalText text="Not provided" />}</dd></div></div>
            {profile.qualification && <div><i className="bi bi-mortarboard" aria-hidden="true" /><div><dt><PortalText text="Qualification" /></dt><dd>{profile.qualification}</dd></div></div>}
            {profile.clinic && <div><i className="bi bi-hospital" aria-hidden="true" /><div><dt><PortalText text="Clinic" /></dt><dd>{profile.clinic}</dd></div></div>}
          </dl>
        </div>
        <div className="doctor-profile-qr-code">
          <span className="doctor-profile-qr-scan-label"><PortalText text="SCAN TO CONNECT" /></span>
          <div className="doctor-profile-qr-image-frame">{qrError ? <p role="alert"><PortalText text={"QR image could not load. "} /><button type="button" onClick={() => setAttempt((value) => value + 1)}><PortalText text={"Retry"} /></button></p> : <img src={qrSrc} alt={`Scan to view ${profile.name}'s profile`} onError={() => setQrError(true)} />}</div>
          <p><PortalText text={"Scan for Doctor Profile"} /></p>
          <small><PortalText text="Open your phone camera and scan the code." /></small>
          <a href={profileLink} target="_blank" rel="noopener noreferrer"><PortalText text={"View profile"} /><i className="bi bi-arrow-up-right" aria-hidden="true" /></a>
        </div>
      </div>
      <div className="doctor-profile-qr-note"><i className="bi bi-info-circle" aria-hidden="true" /><p><strong><PortalText text="One QR, always up to date" /></strong><PortalText text={"Your permanent doctor profile QR shows your latest profile and available clinics. Clinic changes do not require a new profile QR."} /></p></div>
    </section>
  );
}
