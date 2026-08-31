import React, { useCallback, useEffect, useState } from "react";
import { FaCheck, FaEye, FaFilePrescription, FaRedo, FaSpinner, FaTimes, FaUser } from "react-icons/fa";
import axiosInstance, { API_BASE_URL } from "../../../../axiosConfig";
import { logoIcon } from "../../../../assets/brandAssets";
import { getPrescriptionFestivalTheme, PRESCRIPTION_FESTIVAL_THEMES } from "../../../common/prescriptionFestivalThemes";
import "./PrescriptionReviews.css";

const PrescriptionPreview = ({ item, patientPhoto, onClose, onThemeChange, savingTheme }) => {
  const theme = getPrescriptionFestivalTheme(item.festivalTheme);
  const specialization = Array.isArray(item.psychiatrist?.specialization)
    ? item.psychiatrist.specialization.join(", ")
    : item.psychiatrist?.specialization;
  const verified = item.verificationStatus === "verified";

  return (
    <div className="crx-preview-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="crx-preview-modal" role="dialog" aria-modal="true" aria-label="Prescription preview">
        <header>
          <div><FaFilePrescription /><strong>Prescription preview</strong><span>{theme.label} </span></div>
          <button type="button" onClick={onClose} aria-label="Close"><FaTimes /></button>
        </header>
        <div className="crx-theme-gallery-wrap">
          <div className="crx-theme-gallery-heading"><div><strong>Choose prescription theme</strong><span>Scroll and select a festival </span></div>{savingTheme && <FaSpinner className="spinning" />}</div>
          <div className="crx-theme-gallery" role="listbox" aria-label="Festival  themes">
            {PRESCRIPTION_FESTIVAL_THEMES.map((option) => {
              const selected = option.id === theme.id;
              return <button type="button" role="option" aria-selected={selected} className={selected ? "active" : ""} key={option.id} onClick={() => !selected && onThemeChange(option.id)} disabled={savingTheme}><span className="crx-theme-thumb"><img src={option.image} alt="" />{selected && <i><FaCheck /></i>}</span><b>{option.label}</b></button>;
            })}
          </div>
        </div>
        <div className="crx-preview-scroll">
          <article className="crx-prescription-sheet">
            <img className="crx-watermark" src={theme.image} alt="" aria-hidden="true" />
            <header className="crx-document-header">
              <img className="crx-document-logo" src={logoIcon} alt="Humaeli" />
              <div className="crx-doctor-details">
                <h2>{item.psychiatrist?.name || "Psychiatrist"}</h2>
                <p>{specialization || "Psychiatrist"}</p>
                <small>Practitioner ID: {item.psychiatrist?.id}</small>
                <small>Date: {new Date(item.issuedAt).toLocaleDateString("en-IN")}</small>
              </div>
              <div className="crx-document-label">Digital prescription</div>
              <span className={verified ? "verified" : "not-verified"}>Identity: {verified ? "Verified" : "Not Verified"}</span>
            </header>
            <section className="crx-patient">
              <div className="crx-patient-avatar">{patientPhoto ? <img src={patientPhoto} alt={item.patient?.name || "Patient"} /> : <FaUser />}</div>
              <div><small>Patient</small><h3>{item.patient?.name}</h3><p><b>Problem:</b> {item.problem}</p></div>
            </section>
            <h3>Medicines</h3>
            <table><thead><tr><th>#</th><th>Medicine</th><th>Dosage</th><th>Time</th><th>How to take</th><th>Duration</th></tr></thead><tbody>{(item.medicines || []).map((medicine, index) => <tr key={`${medicine.name}-${index}`}><td>{index + 1}</td><td>{medicine.name || medicine.medicine}</td><td>{medicine.dosage}</td><td>{(medicine.timeOfDay || []).join(", ")}</td><td>{medicine.timing}</td><td>{medicine.duration}</td></tr>)}</tbody></table>
            {item.instructions && <section className="crx-instructions"><b>Additional instructions</b><p>{item.instructions}</p></section>}
            <div className="crx-signature">Digitally prescribed by<br /><b>{item.psychiatrist?.name || "Psychiatrist"}</b></div>
            <footer>This prescription was issued through <b>Humaeli</b> · www.humaeli.com · support@humaeli.com</footer>
          </article>
        </div>
      </section>
    </div>
  );
};

export default function PrescriptionReviews() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState(null);
  const [photoUrls, setPhotoUrls] = useState({});
  const [photoErrors, setPhotoErrors] = useState({});
  const [previewItem, setPreviewItem] = useState(null);
  const [savingThemeId, setSavingThemeId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const response = await axiosInstance.get(`${API_BASE_URL}/api/prescriptions/review`);
      setItems(response.data?.prescriptions || []);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to load prescriptions");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    let active = true;
    const pending = items.filter((item) =>
      (item.hasPatientPhoto || ["pending", "verified", "rejected"].includes(item.verificationStatus)) &&
      !photoUrls[item.id] && !photoErrors[item.id]
    );
    Promise.all(pending.map(async (item) => {
      try {
        const response = await axiosInstance.get(`${API_BASE_URL}/api/prescriptions/${item.id}/photo?t=${Date.now()}`, { responseType: "blob" });
        if (!String(response.headers?.["content-type"] || "").startsWith("image/")) throw new Error("Invalid photo response");
        return { id: item.id, url: URL.createObjectURL(response.data) };
      } catch (photoError) {
        return { id: item.id, error: photoError.response?.status ? `Photo could not be loaded (${photoError.response.status})` : "Photo could not be loaded" };
      }
    })).then((results) => {
      if (!active) {
        results.forEach((result) => result.url && URL.revokeObjectURL(result.url));
        return;
      }
      const loaded = Object.fromEntries(results.filter((result) => result.url).map((result) => [result.id, result.url]));
      const failed = Object.fromEntries(results.filter((result) => result.error).map((result) => [result.id, result.error]));
      if (Object.keys(loaded).length) setPhotoUrls((current) => ({ ...current, ...loaded }));
      if (Object.keys(failed).length) setPhotoErrors((current) => ({ ...current, ...failed }));
    });
    return () => { active = false; };
  }, [items, photoUrls, photoErrors]);

  const retryPhoto = (id) => {
    setPhotoErrors((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const review = async (item, action) => {
    let reason = "";
    if (action === "reject") {
      reason = window.prompt("Why is this patient photo being rejected?")?.trim() || "";
      if (!reason) return;
    }
    try {
      setWorkingId(item.id); setError("");
      await axiosInstance.patch(`${API_BASE_URL}/api/prescriptions/${item.id}/verification`, { action, reason });
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, verificationStatus: action === "approve" ? "verified" : "rejected", rejectionReason: reason } : entry));
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to review photo");
    } finally { setWorkingId(null); }
  };

  const updateFestivalTheme = async (item, festivalTheme) => {
    try {
      setSavingThemeId(item.id); setError("");
      await axiosInstance.patch(`${API_BASE_URL}/api/prescriptions/${item.id}/festival-theme`, { festivalTheme });
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, festivalTheme } : entry));
      setPreviewItem((current) => current?.id === item.id ? { ...current, festivalTheme } : current);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to save festival watermark");
    } finally { setSavingThemeId(null); }
  };

  return <section className="crx-page">
    <header><div><span>Clinical records</span><h1>Prescriptions</h1><p>Review patient photos before releasing final prescriptions.</p></div><button onClick={load} disabled={loading}><FaRedo className={loading ? "spinning" : ""}/> Refresh</button></header>
    {error && <div className="crx-error">{error}</div>}
    {loading ? <div className="crx-state"><FaSpinner className="spinning"/> Loading prescriptions...</div> : items.length === 0 ? <div className="crx-state"><FaFilePrescription/> No prescriptions issued yet.</div> : <div className="crx-grid">
      {items.map((item) => <article className="crx-card" key={item.id}>
        <div className={`crx-photo ${photoErrors[item.id] ? "failed" : ""}`}>
          {photoUrls[item.id] ? <img src={photoUrls[item.id]} alt={`Patient for ${item.problem}`}/> : photoErrors[item.id] ? <button type="button" onClick={() => retryPhoto(item.id)} title="Retry loading photo"><FaRedo/><span>{photoErrors[item.id]}<br/>Retry</span></button> : item.hasPatientPhoto || item.verificationStatus === "pending" ? <FaSpinner className="spinning"/> : <FaUser/>}
        </div>
        <div className="crx-copy"><div className={`crx-status ${item.verificationStatus}`}>{String(item.verificationStatus || "photo_required").replace("_", " ")}</div><h2>{item.patient?.name || "Anonymous patient"}</h2><p><b>Problem:</b> {item.problem}</p><small>{new Date(item.issuedAt).toLocaleDateString("en-IN")} · {item.medicines?.length || 0} medicine(s)</small>{item.rejectionReason && <em>{item.rejectionReason}</em>}</div>
        <div className="crx-actions"><button className="view" onClick={() => setPreviewItem(item)}><FaEye/> View</button><button className="approve" onClick={() => review(item,"approve")} disabled={!item.hasPatientPhoto || workingId === item.id || item.verificationStatus === "verified"}><FaCheck/> Approve</button><button className="reject" onClick={() => review(item,"reject")} disabled={!item.hasPatientPhoto || workingId === item.id}><FaTimes/> Reject</button></div>
      </article>)}
    </div>}
    {previewItem && <PrescriptionPreview item={previewItem} patientPhoto={photoUrls[previewItem.id]} onClose={() => setPreviewItem(null)} onThemeChange={(festivalTheme) => updateFestivalTheme(previewItem, festivalTheme)} savingTheme={savingThemeId === previewItem.id} />}
  </section>;
}
