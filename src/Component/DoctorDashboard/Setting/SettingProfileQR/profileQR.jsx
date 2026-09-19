import React, { useEffect, useState } from "react";
import axios from "../../../../axiosConfig.js";
import { API_BASE_URL, getDoctorUser } from "../../doctorApi.js";
import { createProfileLink, publicDoctorProfile } from "./profileQrData.js";
import "./ProfileCard.css";

export default function ProfileCard() {
  const [profile, setProfile] = useState(null);
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
        const response = await axios.get(`${API_BASE_URL}/auth/doctor-profile/${encodeURIComponent(doctorId)}`);
        if (!active) return;
        const details = publicDoctorProfile(response.data?.data || response.data || {}, user);
        if (!details.name) throw new Error("Please complete your doctor profile before generating a QR.");
        setProfile(details);
        setProfileLink(createProfileLink(details, import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin));
      } catch (err) {
        if (active) setError(err.response?.data?.message || err.message || "Unable to load doctor profile.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [attempt]);

  if (loading) return <p role="status">Loading doctor profile QR...</p>;
  if (error) return <div role="alert"><p>{error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)}>Retry</button></div>;

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&ecc=M&margin=16&data=${encodeURIComponent(profileLink)}`;
  return (
    <section className="doctor-profile-qr">
      <div className="doctor-profile-qr-card">
        <div className="doctor-profile-qr-info">
          <img src="/favicon-96.png" width="64" height="64" alt="Humaeli" />
          <h2>{profile.name}</h2>
          {profile.speciality && <p>{profile.speciality}</p>}
          <p><strong>Email:</strong> {profile.email || "Not provided"}</p>
          <p><strong>Phone:</strong> {profile.phone || "Not provided"}</p>
          {profile.qualification && <p><strong>Qualification:</strong> {profile.qualification}</p>}
          {profile.clinic && <p><strong>Clinic:</strong> {profile.clinic}</p>}
        </div>
        <div className="doctor-profile-qr-code">
          {qrError ? <p role="alert">QR image could not load. <button type="button" onClick={() => setAttempt((value) => value + 1)}>Retry</button></p> : <img src={qrSrc} alt={`Scan to view ${profile.name}'s profile`} onError={() => setQrError(true)} />}
          <p>Scan for Doctor Profile</p>
          <a href={profileLink} target="_blank" rel="noopener noreferrer">View profile</a>
        </div>
      </div>
      <p className="doctor-profile-qr-note">Scan to view contact and professional details without signing in. This QR contains your current profile details; generate a new QR after updating your profile.</p>
    </section>
  );
}
