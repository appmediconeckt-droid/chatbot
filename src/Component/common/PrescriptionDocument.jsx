import React, { useEffect, useState } from "react";
import { ClipboardList, CalendarDays, Stethoscope } from "lucide-react";
import api from '../../axiosConfig.js';
import { loadPrescriptionBookingQr, prescriptionBookingSource } from './prescriptionBookingQr.js';
import brandLogo from "../../assets/humaeli-logo-stacked-tagline.png";
import { logoIcon } from "../../assets/brandAssets";
import { getApprovedPrescriptionSignature } from "./prescriptionSignature.js";
import "./PrescriptionDocument.css";
import { prescriptionDate, prescriptionDetails, medicineTiming, medicineDuration } from "./prescriptionDetails";

export default function PrescriptionDocument({ record, doctorName, bookingQrImage }) {
  const data = prescriptionDetails(record, doctorName);
  const signature = getApprovedPrescriptionSignature(record);
  const source = prescriptionBookingSource(record);
  const [qr, setQr] = useState({ key: '', image: '', error: false });
  const qrKey = `${source.doctorId}:${source.image}`;
  useEffect(() => {
    if (bookingQrImage !== undefined) return;
    let active = true;
    loadPrescriptionBookingQr(record, path => api.get(path, { timeout: 15000 }))
      .then(image => { if (active) setQr({ key: qrKey, image, error: false }); })
      .catch(() => { if (active) setQr({ key: qrKey, image: '', error: true }); });
    return () => { active = false; };
  }, [qrKey, bookingQrImage]);
  const qrImage = bookingQrImage ?? (source.image || (qr.key === qrKey ? qr.image : ''));
  const adviceLines = data.advice.split(/\n+/).map(line => line.replace(/^\s*[-*\u2022]\s*/, '').trim()).filter(Boolean);
  const detail = (label, value) => <div><span>{label}</span><strong>{value || '-' }</strong></div>;
  return <article className="prescription-document">
    <img className="prescription-watermark" src={logoIcon} alt="" aria-hidden="true" />
    <header className="prescription-document-header">
      <div className="prescription-brand"><img src={brandLogo} alt="Humaeli - Talk. Connect. Feel Supported." />{data.clinic && <strong>{data.clinic}</strong>}</div>
      <div className="prescription-issuer"><span className="prescription-issuer-label">Consulting doctor</span><h2>{data.doctor}</h2>{data.qualification && <p className="prescription-qualification">{data.qualification}</p>}{data.specialization && <p className="prescription-specialization">{data.specialization}</p>}<div className="prescription-doctor-contact">{data.registration && <p><Stethoscope aria-hidden="true" /><span>Reg. No.: {data.registration}</span></p>}</div></div>
      <div className="prescription-booking-qr">{qrImage ? <><img src={qrImage} alt="Doctor appointment booking QR" /><span>Scan to book<br />an appointment</span></> : (source.doctorId || qr.error) ? <span>{qr.key === qrKey && qr.error ? 'Booking QR unavailable' : 'Loading booking QR...'}</span> : null}</div>
    </header>
    <section className="prescription-patient" aria-label="Patient and visit details">
      <div className="prescription-patient-row">{detail('Patient name', data.patient)}{detail('Date', data.date)}</div>
      <div className="prescription-patient-row">{detail('Patient ID', data.patientId)}{detail('OPD / Token No.', data.opd)}</div>
      <div className="prescription-patient-row">{detail('Age / Gender', [data.age && `${data.age} years`, data.gender !== '\u2014' && data.gender].filter(Boolean).join(' / '))}{detail('Prescription No.', data.prescriptionId)}</div>
      <div className="prescription-patient-row">{detail('Contact No.', data.phone)}{detail('Weight', data.weight && `${data.weight}${/kg/i.test(data.weight) ? '' : ' kg'}`)}</div>
      <div className="prescription-patient-row prescription-patient-row-wide">{detail('Allergies', data.allergies || 'Not recorded')}</div>
    </section>
    <div className="prescription-title"><h3>Consultation Prescription</h3></div>
    <section className="prescription-section prescription-clinical"><p><strong>Consultation for: </strong>{data.issue}</p><p><strong>Diagnosis: </strong>{data.diagnosis}</p></section>
    <section className="prescription-section prescription-medicines" aria-label="Prescribed medicines">
      <h3>Prescribed Medicines</h3>
      {data.medicines.length ? <div className="prescription-table-wrap"><table><thead><tr><th>S. No.</th><th>Medicine name</th><th>Strength</th><th>Dosage</th><th>Duration</th><th>Instructions</th></tr></thead><tbody>{data.medicines.map((medicine, index) => <tr key={index}><td>{index + 1}</td><td><strong>{medicine.name || medicine.medicine || '-' }</strong></td><td>{medicine.strength || '-' }</td><td>{medicine.dosage || '-' }</td><td>{medicineDuration(medicine) || '-' }</td><td>{[medicineTiming(medicine), medicine.instructions].filter(Boolean).join(' / ') || '-' }</td></tr>)}</tbody></table></div> : <p>{data.medicine || 'No medicines prescribed.'}</p>}
    </section>
    {data.advice && <section className="prescription-section prescription-advice"><ClipboardList className="prescription-section-icon" aria-hidden="true" /><div><h3>Advice &amp; Instructions</h3>{adviceLines.length > 1 ? <ul>{adviceLines.map((line, index) => <li key={index}>{line}</li>)}</ul> : <p>{data.advice}</p>}</div></section>}
    {data.notes && data.notes !== data.advice && <section className="prescription-section prescription-notes"><h3>Additional notes</h3><p>{data.notes}</p></section>}
    {data.tests.length > 0 && <section className="prescription-section prescription-tests"><h3>Recommended tests</h3>{data.tests.map((test, index) => <p key={index}><strong>{test.testName || test.name}</strong>{test.completeBy && ` / By ${prescriptionDate(test.completeBy)}`}{test.reason && `\n${test.reason}`}{test.instructions && `\n${test.instructions}`}</p>)}</section>}
    <footer className="prescription-document-footer"><div className="prescription-followup"><CalendarDays className="prescription-section-icon" aria-hidden="true" /><div><span>Next Follow-up:</span><strong>{data.followUp ? prescriptionDate(data.followUp) : data.followUpRequired ? 'Required' : 'No follow-up scheduled'}</strong></div></div><div className="prescription-signoff"><div className="prescription-signature-space">{signature && <img src={signature} alt="Doctor signature" />}</div><strong>{data.doctor}</strong>{data.qualification && <p>{data.qualification}</p>}{data.registration && <p>Reg. No.: {data.registration}</p>}</div></footer>
    {(data.address || data.doctorPhone || data.doctorEmail) && <div className="prescription-contact-footer">{data.address && <p>{data.address}</p>}<p>{[data.doctorPhone, data.doctorEmail].filter(Boolean).join(' | ')}</p></div>}
    <div className="prescription-brand-footer"><span>This prescription is provided by</span><div><img src={logoIcon} alt="" aria-hidden="true" /><strong>HUMAELI</strong></div><span>Talk. Connect. Feel Supported.</span></div>
  </article>;
}
