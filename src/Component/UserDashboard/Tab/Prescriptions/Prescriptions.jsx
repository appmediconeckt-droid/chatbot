import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaArrowLeft, FaCalendarAlt, FaCamera, FaDownload, FaEye, FaFileMedical, FaNotesMedical, FaPrint, FaRedo, FaSpinner, FaTimes, FaUserMd } from "react-icons/fa";
import axiosInstance, { API_BASE_URL } from "../../../../axiosConfig";
import { logoIcon as logoHorizontal } from "../../../../assets/brandAssets";
import { getPrescriptionFestivalTheme } from "../../../common/prescriptionFestivalThemes";
import { useUserTranslation } from "../../../../i18n/LanguageContext";
import "./Prescriptions.css";
import PrescriptionDocument from "../../../common/PrescriptionDocument";
import { downloadConsultationPrescription } from "../../../common/downloadPrescription";
import { getPrescriptionProviderLabel } from "../../../common/prescriptionProviderLabel";
import { getApprovedPrescriptionSignature } from "../../../common/prescriptionSignature";

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
};

const verificationLabel = (status) => status === "verified" ? "Verified" : "Not Verified";

const getDoctorName = (prescription) =>
  prescription.psychiatrist?.name || prescription.doctor?.name || "Doctor";

const getPatientName = (prescription) =>
  prescription.patient?.name || prescription.patient?.fullName || "Patient";

const getRecordTitle = (prescription) =>
  prescription.diagnosis || prescription.problem || "Consultation details";

const getRecordStatus = (prescription) =>
  prescription.source === "appointment" ? "Completed" : verificationLabel(prescription.verificationStatus);

const getMedicineDuration = (medicine) =>
  medicine.duration || [medicine.durationValue, medicine.durationType].filter(Boolean).join(" ");

const getMedicineTiming = (medicine) => {
  const times = Array.isArray(medicine.timeOfDay) && medicine.timeOfDay.length
    ? medicine.timeOfDay
    : Array.isArray(medicine.timings)
      ? medicine.timings
      : [];
  return [times.join(", "), medicine.timing || medicine.when].filter(Boolean).join(" - ");
};

const hasFileActions = (prescription) =>
  prescription.source !== "appointment" && prescription.canViewFile !== false && prescription.id && !String(prescription.id).startsWith("appointment:");

export default function Prescriptions() {
  const { t } = useUserTranslation();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [printingId, setPrintingId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [preview, setPreview] = useState(null);
  const [uploadingPhotoId, setUploadingPhotoId] = useState(null);
  const [activeDoctorKey, setActiveDoctorKey] = useState("");
  const [detailRecordId, setDetailRecordId] = useState("");

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

  const groupedPrescriptions = useMemo(() => {
    const groupsByDoctor = new Map();
    prescriptions.forEach((prescription) => {
      const doctorId = prescription.psychiatrist?.id || prescription.doctorId || getDoctorName(prescription);
      const key = String(doctorId || "doctor");
      const existing = groupsByDoctor.get(key) || {
        key,
        doctor: prescription.psychiatrist || prescription.doctor || { name: getDoctorName(prescription) },
        records: [],
      };
      existing.records.push(prescription);
      groupsByDoctor.set(key, existing);
    });
    return [...groupsByDoctor.values()].map((group) => ({
      ...group,
      records: group.records.sort((left, right) => new Date(right.issuedAt || 0) - new Date(left.issuedAt || 0)),
    }));
  }, [prescriptions]);

  useEffect(() => {
    setActiveDoctorKey((current) => current && groupedPrescriptions.some((group) => group.key === current) ? current : "");
    setDetailRecordId((current) =>
      current && groupedPrescriptions.some((group) => group.records.some((record) => String(record.id) === String(current)))
        ? current
        : "",
    );
  }, [groupedPrescriptions]);

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
    const signatureUrl = getApprovedPrescriptionSignature(prescription, API_BASE_URL);
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
    if (signatureUrl) {
      const signature = document.createElement("img");
      signature.crossOrigin = "anonymous";
      signature.src = signatureUrl;
      signature.alt = "Consultant signature";
      signature.style.cssText = "display:block;width:180px;height:72px;object-fit:contain;margin:0 0 12px auto";
      const signatureBlock = container.querySelector("article > div:last-of-type > div");
      signatureBlock?.prepend(signature);
    }
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
      // Wait for the approved signature to load before capturing the PDF.
      if (signatureUrl) {
        const signature = container.querySelector('img[alt="Consultant signature"]');
        await signature.decode().catch(() => {
          throw new Error("Unable to load consultant signature. Please try again.");
        });
      }
      const blob = await html2pdf().set({ margin: 0, image: { type: "jpeg", quality: .98 }, html2canvas: { scale: 2, useCORS: true, backgroundColor: "#fff" }, jsPDF: { unit: "px", format: [794, 1123], orientation: "portrait" } }).from(container.firstElementChild).outputPdf("blob");
      return URL.createObjectURL(blob);
    } finally { container.remove(); }
  };

  const loadPdfBlobUrl = async (prescription) => {
    if ((prescription.hasPatientPhoto || prescription.verificationStatus !== "verified" || getApprovedPrescriptionSignature(prescription, API_BASE_URL)) && prescription.medicines?.length) {
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
    if (!hasFileActions(prescription)) return;
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
    if (prescription.source === "appointment") {
      try {
        setDownloadingId(prescription.id);
        setActionError("");
        await downloadConsultationPrescription(prescription);
      } catch { setActionError("Unable to download prescription. Please try again."); }
      finally { setDownloadingId(null); }
      return;
    }
    if (!hasFileActions(prescription)) return;
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
    if (!hasFileActions(prescription)) return;
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

  const renderRecordDetails = (prescription) => {
    if (prescription.source === "appointment") return (
      <div className="rx-detail-panel">
        <div className="rx-card-actions rx-detail-actions" style={{ marginBottom: 20 }}>
          <button type="button" className="rx-download-btn" onClick={() => downloadPrescription(prescription)} disabled={downloadingId === prescription.id}>
            {downloadingId === prescription.id ? <FaSpinner className="spinning" /> : <FaDownload />} {downloadingId === prescription.id ? "Downloading..." : "Download Prescription PDF"}
          </button>
        </div>
        <PrescriptionDocument record={prescription} />
      </div>
    );
    const medicines = prescription.medicines || [];
    const recommendedTests = prescription.recommendedTests || prescription.recommended_tests || [];
    const followUpDate = prescription.followUpDate || prescription.follow_up_date;
    const advice = prescription.advice || prescription.instructions;
    const additionalNotes = prescription.additionalNotes || prescription.additional_notes;
    const patientPhone = prescription.patient?.phone || prescription.patient?.mobile || prescription.patient?.phoneNumber;
    const patientEmail = prescription.patient?.email;
    const doctorSpecialization = Array.isArray(prescription.psychiatrist?.specialization)
      ? prescription.psychiatrist.specialization.join(", ")
      : prescription.psychiatrist?.specialization || prescription.psychiatrist?.qualification || "Doctor";
    return (
      <div className="rx-detail-panel">
        <div className="rx-detail-head">
          <span className={`rx-record-type ${prescription.source === "appointment" ? "appointment" : "pdf"}`}>
            {prescription.source === "appointment" ? "Completed by doctor" : "PDF prescription"}
          </span>
          <h3>Patient details</h3>
          <p><FaCalendarAlt /> {formatDate(prescription.issuedAt)}</p>
        </div>

        <div className="rx-detail-summary">
          <div>
            <span>Patient</span>
            <strong>{getPatientName(prescription)}</strong>
            {(patientPhone || patientEmail) && <p>{[patientPhone, patientEmail].filter(Boolean).join(" · ")}</p>}
          </div>
          <div>
            <span>{getPrescriptionProviderLabel(prescription.psychiatrist || prescription.doctor, prescription)}</span>
            <strong>{getDoctorName(prescription)}</strong>
            <p>{doctorSpecialization}</p>
          </div>
          <div>
            <span>Date</span>
            <strong>{formatDate(prescription.issuedAt) || "-"}</strong>
            {prescription.appointmentTime && <p>{prescription.appointmentTime}</p>}
          </div>
          <div>
            <span>Status</span>
            <strong>{getRecordStatus(prescription)}</strong>
            <p>{followUpDate ? `Follow-up ${formatDate(followUpDate)}` : "No follow-up required"}</p>
          </div>
        </div>

        <div className="rx-detail-block rx-problem-block">
          <h4>Problem / Diagnosis</h4>
          <p className="rx-preserve-lines">{getRecordTitle(prescription)}</p>
        </div>

        {medicines.length > 0 && (
          <div className="rx-detail-block">
            <h4>Medicines / Tablets</h4>
            <div className="rx-medicine-table-wrap">
              <table className="rx-medicine-table">
                <thead><tr><th>#</th><th>Medicine</th><th>Dosage</th><th>Timing</th><th>Duration</th></tr></thead>
                <tbody>
                  {medicines.map((medicine, index) => (
                    <tr key={`${prescription.id}-medicine-${index}`}>
                      <td>{index + 1}</td>
                      <td>{medicine.name || medicine.medicine || "Medicine"}</td>
                      <td>{medicine.dosage || "-"}</td>
                      <td>{getMedicineTiming(medicine) || "-"}</td>
                      <td>{getMedicineDuration(medicine) || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {advice && (
          <div className="rx-detail-block">
            <h4>Advice / Instructions</h4>
            <p className="rx-preserve-lines">{advice}</p>
          </div>
        )}

        {additionalNotes && additionalNotes !== advice && (
          <div className="rx-detail-block">
            <h4>Additional Notes</h4>
            <p className="rx-preserve-lines">{additionalNotes}</p>
          </div>
        )}

        {(prescription.followUpRequired || followUpDate) && (
          <div className="rx-followup-box">
            <FaNotesMedical />
            <div><span>Follow-up</span><strong>{followUpDate ? formatDate(followUpDate) : "Required"}</strong></div>
          </div>
        )}

        {recommendedTests.length > 0 && (
          <div className="rx-detail-block">
            <h4>Recommended Tests</h4>
            <div className="rx-tests-grid">
              {recommendedTests.map((test, index) => (
                <div className="rx-test-card" key={`${prescription.id}-test-${index}`}>
                  <strong>{test.testName || test.name || `Test ${index + 1}`}</strong>
                  {test.completeBy && <span>Complete by {formatDate(test.completeBy)}</span>}
                  {test.reason && <p>{test.reason}</p>}
                  {test.instructions && <p>{test.instructions}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {getApprovedPrescriptionSignature(prescription, API_BASE_URL) && (
          <div className="rx-detail-block rx-consultant-signature">
            <h4>Consultant signature</h4>
            <img src={getApprovedPrescriptionSignature(prescription, API_BASE_URL)} alt="Consultant signature" />
            <p>{getDoctorName(prescription)}</p>
          </div>
        )}

        {hasFileActions(prescription) && (
          <div className="rx-card-actions rx-detail-actions">
            <button type="button" className="rx-photo-btn" onClick={() => choosePatientPhoto(prescription)} disabled={uploadingPhotoId === prescription.id}>{uploadingPhotoId === prescription.id ? <FaSpinner className="spinning" /> : <FaCamera />} {prescription.hasPatientPhoto ? (t('change_photo') || 'Change Photo') : (t('add_photo') || 'Add Photo')}</button>
            <button type="button" className="rx-view-btn" onClick={() => viewPrescription(prescription)} disabled={viewingId === prescription.id}>{viewingId === prescription.id ? <FaSpinner className="spinning" /> : <FaEye />} {t('view') || 'View'}</button>
            <button type="button" className="rx-print-btn" onClick={() => printPrescription(prescription)} disabled={printingId === prescription.id || prescription.verificationStatus !== "verified"}>{printingId === prescription.id ? <FaSpinner className="spinning" /> : <FaPrint />} {t('print') || 'Print'}</button>
            <button type="button" className="rx-download-btn" onClick={() => downloadPrescription(prescription)} disabled={downloadingId === prescription.id || prescription.verificationStatus !== "verified"}>
              {downloadingId === prescription.id ? <FaSpinner className="spinning" /> : <FaDownload />} {downloadingId === prescription.id ? (t('downloading') || 'Downloading...') : (t('download') || 'Download')}
            </button>
          </div>
        )}
      </div>
    );
  };

  const activeDoctorGroup = groupedPrescriptions.find((group) => group.key === activeDoctorKey);
  const activeDetailRecord = activeDoctorGroup?.records.find((record) => String(record.id) === String(detailRecordId));

  return (
    <section className="rx-page">
      <header className="rx-page-header">
        <div className="rx-page-heading">
          <span className="rx-page-icon"><FaFileMedical /></span>
          <div><p>{t('health_records') || 'Health records'}</p><h1>{t('my_prescriptions') || 'My Prescriptions'}</h1><span>{t('prescriptions_subtitle') || 'View and download prescriptions issued by your psychiatrist.'}</span></div>
        </div>
        <button type="button" className="rx-refresh-btn" onClick={loadPrescriptions} disabled={loading}><FaRedo className={loading ? "spinning" : ""} /> {t('refresh') || 'Refresh'}</button>
      </header>

      {actionError && <div className="rx-action-error">{actionError}<button type="button" onClick={() => setActionError("")}><FaTimes /></button></div>}

      {loading ? (
        <div className="rx-page-state"><FaSpinner className="spinning" /><p>{t('loading_prescriptions') || 'Loading prescriptions...'}</p></div>
      ) : error ? (
        <div className="rx-page-state rx-error"><FaFileMedical /><p>{error}</p><button onClick={loadPrescriptions}>{t('try_again') || 'Try again'}</button></div>
      ) : prescriptions.length === 0 ? (
        <div className="rx-page-state"><FaFileMedical /><h2>{t('no_prescriptions_yet') || 'No prescriptions yet'}</h2><p>{t('prescriptions_empty_state') || 'Prescriptions sent by your psychiatrist will appear here.'}</p></div>
      ) : !activeDoctorGroup ? (
        <div className="rx-doctor-list">
          {groupedPrescriptions.map((group) => (
            <button
              type="button"
              className="rx-doctor-card rx-doctor-select-card"
              key={group.key}
              onClick={() => {
                setActiveDoctorKey(group.key);
                setDetailRecordId("");
              }}
            >
              <div className="rx-doctor-header">
                <div className="rx-doctor-avatar"><FaUserMd /></div>
                <div>
                  <span>{getPrescriptionProviderLabel(group.doctor, group.records[0])}</span>
                  <h2>{group.doctor?.name || "Doctor"}</h2>
                  <p>{group.records.length} record{group.records.length === 1 ? "" : "s"}</p>
                </div>
              </div>
              <div className="rx-doctor-card-footer">
                <span>Latest: {formatDate(group.records[0]?.issuedAt)}</span>
                <strong>View records</strong>
              </div>
            </button>
          ))}
        </div>
      ) : activeDetailRecord ? (
        <article className="rx-doctor-card rx-detail-page">
          <div className="rx-doctor-header rx-record-browser-header">
            <button type="button" className="rx-back-btn" onClick={() => setDetailRecordId("")}>
              <FaArrowLeft /> Records
            </button>
            <div className="rx-doctor-avatar"><FaUserMd /></div>
            <div>
              <span>{getPrescriptionProviderLabel(activeDetailRecord.psychiatrist || activeDetailRecord.doctor || activeDoctorGroup.doctor, activeDetailRecord)}</span>
              <h2>{activeDoctorGroup.doctor?.name || "Doctor"}</h2>
              <p>{formatDate(activeDetailRecord.issuedAt)} patient record</p>
            </div>
          </div>

          {renderRecordDetails(activeDetailRecord)}
          {activeDetailRecord.verificationStatus === "rejected" && activeDetailRecord.rejectionReason && <p className="rx-rejection">Photo rejected: {activeDetailRecord.rejectionReason}</p>}
        </article>
      ) : (
        <article className="rx-doctor-card rx-record-browser">
          <div className="rx-doctor-header rx-record-browser-header">
            <button type="button" className="rx-back-btn" onClick={() => {
              setActiveDoctorKey("");
              setDetailRecordId("");
            }}>
              <FaArrowLeft /> All providers
            </button>
            <div className="rx-doctor-avatar"><FaUserMd /></div>
            <div>
              <span>{getPrescriptionProviderLabel(activeDoctorGroup.doctor, activeDoctorGroup.records[0])}</span>
              <h2>{activeDoctorGroup.doctor?.name || "Doctor"}</h2>
              <p>{activeDoctorGroup.records.length} record{activeDoctorGroup.records.length === 1 ? "" : "s"}</p>
            </div>
          </div>

          <div className="rx-record-table-section">
            <h3>Date wise records</h3>
            <div className="rx-record-table-wrap">
              <table className="rx-record-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Problem / Diagnosis</th>
                    <th>Status</th>
                    <th>Medicines</th>
                    <th>Follow-up</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDoctorGroup.records.map((prescription) => {
                    const followUpDate = prescription.followUpDate || prescription.follow_up_date;
                    return (
                      <tr key={prescription.id}>
                        <td><span className="rx-table-date">{formatDate(prescription.issuedAt)}</span></td>
                        <td>{getRecordTitle(prescription)}</td>
                        <td><span className={`rx-table-status ${prescription.source === "appointment" ? "completed" : prescription.verificationStatus || "pending"}`}>{getRecordStatus(prescription)}</span></td>
                        <td>{(prescription.medicines || []).length || "-"}</td>
                        <td>{followUpDate ? formatDate(followUpDate) : "Not required"}</td>
                        <td>
                          <button
                            type="button"
                            className="rx-table-view-btn"
                            onClick={() => setDetailRecordId(prescription.id)}
                          >
                            <FaEye /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </article>
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
