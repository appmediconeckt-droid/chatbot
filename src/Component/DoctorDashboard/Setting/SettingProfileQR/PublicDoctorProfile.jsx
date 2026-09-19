import React from "react";
import { useLocation } from "react-router-dom";
import { profileFields, readProfileLink } from "./profileQrData.js";
import "./ProfileCard.css";

export default function PublicDoctorProfile() {
  const { hash } = useLocation();
  let profile;
  try { profile = readProfileLink(hash); } catch {
    return <main className="doctor-public-profile"><h1>Doctor profile unavailable</h1><p role="alert">This QR link is invalid or incomplete. Please scan the doctor's latest Profile QR.</p></main>;
  }
  return <main className="doctor-public-profile">
    <header><img src="/favicon-96.png" alt="Humaeli" width="72" height="72" /><h1>{profile.name || "Doctor Profile"}</h1><p>{profile.speciality}</p></header>
    <dl>{Object.entries(profileFields).filter(([key]) => profile[key] && key !== "name").map(([key, [label]]) => <div key={key}><dt>{label}</dt><dd>{profile[key]}</dd></div>)}</dl>
    <p className="doctor-profile-qr-note">Details shared by the doctor when this QR was generated.</p>
  </main>;
}
