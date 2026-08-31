import React, { useCallback, useEffect, useState } from "react";
import { FaCamera, FaDownload, FaEye, FaFileMedical, FaPrint, FaRedo, FaSpinner, FaTimes, FaUserMd } from "react-icons/fa";
import axiosInstance, { API_BASE_URL } from "../../../../axiosConfig";
import { logoIcon as logoHorizontal } from "../../../../assets/brandAssets";
import { getPrescriptionFestivalTheme } from "../../../common/prescriptionFestivalThemes";
import "./Prescriptions.css";

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
};

const formatSize = (bytes) => {
  const size = Number(bytes);
  if (!size) return "PDF document";
  return size < 1024 * 1024 ? `${Math.ceil(size / 1024)} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const verificationLabel = (status) => status === "verified" ? "Verified" : "Not Verified";

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [printingId, setPrintingId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [preview, setPreview] = useState(null);
  const [uploadingPhotoId, setUploadingPhotoId] = useState(null);

  const loadPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axiosInstance.get(`${API_BASE_URL}/api/prescriptions/my`);
      const records = response.data?.prescriptions || [];
      setPrescriptions((current) => {
        current.forEach((item) => item.localFileUrl && URL.revokeObjectURL(item.localFileUrl));
        return records;
      });
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to load prescriptions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPrescriptions(); }, [loadPrescriptions]);

  useEffect(() => () => {
    prescriptions.forEach((item) => item.localFileUrl && URL.revokeObjectURL(item.localFileUrl));
  }, [prescriptions]);

  const escapePdfText = (value) => String(value || "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

  const regeneratePrescriptionPdf = async (prescription) => {
    const { default: html2pdf } = await import("html2pdf.js");
    const medicines = prescription.medicines || [];
    const rows = medicines.map((medicine, index) => `<tr><td>${index + 1}</td><td><b>${escapePdfText(medicine.name || medicine.medicine)}</b></td><td>${escapePdfText(medicine.dosage)}</td><td>${escapePdfText((medicine.timeOfDay || []).join(", "))}</td><td>${escapePdfText(medicine.timing)}</td><td>${escapePdfText(medicine.duration || "—")}</td></tr>`).join("");
    const patientName = prescription.patient?.name || "Patient";
    const psychiatristName = prescription.psychiatrist?.name || "Psychiatrist";
    const specialization = Array.isArray(prescription.psychiatrist?.specialization)
      ? prescription.psychiatrist.specialization.join(", ")
      : prescription.psychiatrist?.specialization || "Psychiatrist";
    const isVerified = prescription.verificationStatus === "verified";
    const festivalTheme = getPrescriptionFestivalTheme(prescription.festivalTheme);
    let patientPhoto = prescription.patient?.photo || "";
    if (prescription.hasPatientPhoto) {
      try {
        const photoResponse = await axiosInstance.get(`${API_BASE_URL}/api/prescriptions/${prescription.id}/photo`, { responseType: "blob" });
        patientPhoto = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(photoResponse.data);
        });
      } catch { /* Keep profile-photo fallback when a custom photo cannot load. */ }
    }
    const container = document.createElement("div");
    container.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;z-index:-1";
    container.innerHTML = `<article style="width:794px;min-height:1123px;padding:54px 58px;box-sizing:border-box;background:#fff;color:#172033;font-family:Arial,sans-serif;position:relative"><style>.regen-rx th,.regen-rx td{padding:11px 8px;text-align:left;border-bottom:1px solid #dbe4ef;vertical-align:top}.regen-rx tbody tr:nth-child(even){background:#f8fafc}</style><header style="display:flex;justify-content:space-between;gap:28px;padding-bottom:25px;border-bottom:3px solid #2563eb"><div><img src="${logoHorizontal}" style="width:76px;height:76px;object-fit:contain"><div style="margin-top:8px;color:#2563eb;font-size:12px;font-weight:700;letter-spacing:1.5px">DIGITAL PRESCRIPTION</div></div><div style="text-align:right"><h1 style="margin:0 0 8px;font-size:25px">${escapePdfText(psychiatristName)}</h1><div style="font-size:14px;color:#475569">${escapePdfText(specialization)}</div><div style="margin-top:8px;font-size:12px;color:#64748b">Practitioner ID: ${escapePdfText(prescription.psychiatrist?.id)}</div><div style="margin-top:4px;font-size:12px;color:#64748b">Date: ${formatDate(prescription.issuedAt)}</div></div></header><section style="display:flex;align-items:center;gap:18px;margin:28px 0;padding:18px;border-radius:12px;background:#f1f5f9">${patientPhoto ? `<img src="${patientPhoto}" style="width:68px;height:68px;border-radius:50%;object-fit:cover;border:3px solid #fff">` : `<div style="width:68px;height:68px;border-radius:50%;display:grid;place-items:center;background:#dbeafe;color:#1d4ed8;font-size:28px;font-weight:700">${escapePdfText(patientName.charAt(0).toUpperCase())}</div>`}<div><div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px">Patient</div><h2 style="margin:4px 0 7px;font-size:21px">${escapePdfText(patientName)}</h2><div style="font-size:14px"><b>Problem:</b> ${escapePdfText(prescription.problem)}</div></div></section><h3 style="margin:0 0 12px;font-size:17px">Medicines</h3><table class="regen-rx" style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:#1d4ed8;color:#fff"><th>#</th><th>Medicine</th><th>Dosage</th><th>Time</th><th>How to take</th><th>Duration</th></tr></thead><tbody>${rows}</tbody></table>${prescription.instructions ? `<section style="margin-top:25px;padding:17px;border-left:4px solid #2563eb;background:#eff6ff"><b>Additional instructions</b><p style="margin:8px 0 0;line-height:1.6;font-size:13px;white-space:pre-wrap">${escapePdfText(prescription.instructions)}</p></section>` : ""}<div style="margin-top:38px;text-align:right"><div style="display:inline-block;min-width:220px;padding-top:10px;border-top:1px solid #94a3b8;font-size:12px;color:#475569">Digitally prescribed by<br><b style="color:#172033">${escapePdfText(psychiatristName)}</b></div></div><footer style="position:absolute;left:58px;right:58px;bottom:42px;padding-top:15px;border-top:1px solid #dbe4ef;text-align:center;color:#64748b;font-size:11px">This prescription was issued through <b style="color:#2563eb">Humaeli</b> · www.humaeli.com · support@humaeli.com</footer></article>`;
    const verificationBadge = document.createElement("div");
    verificationBadge.textContent = `Identity: ${verificationLabel(prescription.verificationStatus)}`;
    verificationBadge.style.cssText = `display:inline-block;margin-top:10px;padding:6px 10px;border-radius:999px;color:${isVerified ? "#166534" : "#b42318"};background:${isVerified ? "#dcfce7" : "#fee2e2"};font-size:11px;font-weight:800;letter-spacing:.7px;text-transform:uppercase`;
    container.querySelector("article > header > div:first-child")?.appendChild(verificationBadge);
    const prescriptionPage = container.querySelector("article");
    if (prescriptionPage) {
      prescriptionPage.style.backgroundImage = `linear-gradient(rgba(255,255,255,.78),rgba(255,255,255,.78)),url("${festivalTheme.image}")`;
      prescriptionPage.style.backgroundRepeat = "no-repeat";
      prescriptionPage.style.backgroundPosition = "center";
      prescriptionPage.style.backgroundSize = "100% 100%";
    }
    document.body.appendChild(container);
    try {
      const blob = await html2pdf().set({ margin: 0, image: { type: "jpeg", quality: .98 }, html2canvas: { scale: 2, useCORS: true, backgroundColor: "#fff" }, jsPDF: { unit: "px", format: [794, 1123], orientation: "portrait" } }).from(container.firstElementChild).outputPdf("blob");
      return URL.createObjectURL(blob);
    } finally { container.remove(); }
  };

  const loadPdfBlobUrl = async (prescription) => {
    if ((prescription.hasPatientPhoto || prescription.verificationStatus !== "verified") && prescription.medicines?.length) {
      return regeneratePrescriptionPdf(prescription);
    }
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/api/prescriptions/${prescription.id}/file`, { responseType: "blob" });
      const blob = response.data;
      return URL.createObjectURL(blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" }));
    } catch (fileError) {
      if (fileError.response?.status === 404 && prescription.medicines?.length) {
        return regeneratePrescriptionPdf(prescription);
      }
      throw fileError;
    }
  };

  const choosePatientPhoto = (prescription) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > 3 * 1024 * 1024) {
        setActionError("Patient photo must be smaller than 3 MB.");
        return;
      }
      try {
        setUploadingPhotoId(prescription.id);
        setActionError("");
        const formData = new FormData();
        formData.append("photo", file);
        await axiosInstance.post(`${API_BASE_URL}/api/prescriptions/${prescription.id}/photo`, formData);
        setPrescriptions((current) => current.map((item) => item.id === prescription.id ? {
          ...item,
          hasPatientPhoto: true,
          verificationStatus: "pending",
          rejectionReason: "",
        } : item));
      } catch (uploadError) {
        setActionError(uploadError.response?.data?.error || "Unable to upload patient photo");
      } finally {
        setUploadingPhotoId(null);
      }
    };
    input.click();
  };

  const closePreview = () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  const viewPrescription = async (prescription) => {
    if (!prescription.hasPatientPhoto) {
      setActionError("Please upload your photo first to view this prescription.");
      return;
    }
    try {
      setViewingId(prescription.id);
      setActionError("");
      const url = await loadPdfBlobUrl(prescription);
      setPreview({ url, name: prescription.fileName || "Prescription.pdf" });
    } catch (viewError) {
      setActionError(viewError.message || "Unable to open prescription");
    } finally {
      setViewingId(null);
    }
  };

  const downloadPrescription = async (prescription) => {
    try {
      setDownloadingId(prescription.id);
      const blobUrl = await loadPdfBlobUrl(prescription);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = prescription.fileName || "Prescription.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      setActionError("Unable to download prescription. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const printPrescription = async (prescription) => {
    const printWindow = window.open("", "_blank");
    try {
      if (!printWindow) throw new Error("Allow pop-ups to print the prescription");
      printWindow.document.title = "Preparing prescription...";
      printWindow.document.body.innerHTML = '<p style="font-family:Arial;padding:24px">Preparing prescription for printing...</p>';
      setPrintingId(prescription.id);
      setActionError("");
      const url = await loadPdfBlobUrl(prescription);
      printWindow.addEventListener("load", () => {
        window.setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          window.setTimeout(() => URL.revokeObjectURL(url), 30000);
        }, 700);
      }, { once: true });
      printWindow.location.replace(url);
    } catch (printError) {
      printWindow?.close();
      setActionError(printError.message || "Unable to print prescription");
    } finally {
      setPrintingId(null);
    }
  };

  return (
    <section className="rx-page">
      <header className="rx-page-header">
        <div className="rx-page-heading">
          <span className="rx-page-icon"><FaFileMedical /></span>
          <div><p>Health records</p><h1>My Prescriptions</h1><span>View and download prescriptions issued by your psychiatrist.</span></div>
        </div>
        <button type="button" className="rx-refresh-btn" onClick={loadPrescriptions} disabled={loading}><FaRedo className={loading ? "spinning" : ""} /> Refresh</button>
      </header>

      {actionError && <div className="rx-action-error">{actionError}<button type="button" onClick={() => setActionError("")}><FaTimes /></button></div>}

      {loading ? (
        <div className="rx-page-state"><FaSpinner className="spinning" /><p>Loading prescriptions...</p></div>
      ) : error ? (
        <div className="rx-page-state rx-error"><FaFileMedical /><p>{error}</p><button onClick={loadPrescriptions}>Try again</button></div>
      ) : prescriptions.length === 0 ? (
        <div className="rx-page-state"><FaFileMedical /><h2>No prescriptions yet</h2><p>Prescriptions sent by your psychiatrist will appear here.</p></div>
      ) : (
        <div className="rx-list">
          {prescriptions.map((prescription) => (
            <article className="rx-card" key={prescription.id}>
              <div className="rx-card-file"><FaFileMedical /><span>PDF</span></div>
              <div className="rx-card-body">
                <div className="rx-card-top"><div><span className={`rx-verification ${prescription.verificationStatus || "photo_required"}`}>{String(prescription.verificationStatus || "photo_required").replace("_", " ")}</span><h2>{prescription.problem}</h2><p><FaUserMd /> {prescription.psychiatrist?.name}</p></div><time>{formatDate(prescription.issuedAt)}</time></div>
                <div className="rx-card-meta"><span>{prescription.fileName}</span><i>•</i><span>{formatSize(prescription.fileSize)}</span></div>
                {prescription.verificationStatus === "rejected" && prescription.rejectionReason && <p className="rx-rejection">Photo rejected: {prescription.rejectionReason}</p>}
              </div>
              <div className="rx-card-actions">
                <button type="button" className="rx-photo-btn" onClick={() => choosePatientPhoto(prescription)} disabled={uploadingPhotoId === prescription.id}>{uploadingPhotoId === prescription.id ? <FaSpinner className="spinning" /> : <FaCamera />} {prescription.hasPatientPhoto ? "Change Photo" : "Add Photo"}</button>
                <button type="button" className="rx-view-btn" onClick={() => viewPrescription(prescription)} disabled={viewingId === prescription.id}>{viewingId === prescription.id ? <FaSpinner className="spinning" /> : <FaEye />} View</button>
                <button type="button" className="rx-print-btn" onClick={() => printPrescription(prescription)} disabled={printingId === prescription.id || prescription.verificationStatus !== "verified"} title={prescription.verificationStatus !== "verified" ? "Print will be available after the psychiatrist approves your photo" : "Print prescription"}>{printingId === prescription.id ? <FaSpinner className="spinning" /> : <FaPrint />} Print</button>
                <button type="button" className="rx-download-btn" onClick={() => downloadPrescription(prescription)} disabled={downloadingId === prescription.id || prescription.verificationStatus !== "verified"} title={prescription.verificationStatus !== "verified" ? "Download will be available after the psychiatrist approves your photo" : "Download prescription"}>
                  {downloadingId === prescription.id ? <FaSpinner className="spinning" /> : <FaDownload />} {downloadingId === prescription.id ? "Downloading..." : "Download"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {preview && (
        <div className="rx-preview-overlay" onMouseDown={(event) => event.target === event.currentTarget && closePreview()}>
          <section className="rx-preview-modal" role="dialog" aria-modal="true" aria-label="Prescription preview">
            <header><div><FaFileMedical /><span>{preview.name}</span></div><button type="button" onClick={closePreview} aria-label="Close prescription preview"><FaTimes /></button></header>
            <iframe src={preview.url} title={preview.name} />
          </section>
        </div>
      )}
    </section>
  );
}
