import React from "react";
import { ClipboardList, CalendarDays, Leaf, Stethoscope, Building2, MapPin, Phone, Mail } from "lucide-react";
import prescriptionFooterMark from "./prescriptionFooterMark.svg";
import brandLogo from "../../assets/humaeli-logo-stacked-tagline.png";
import { logoIcon } from "../../assets/brandAssets";
import { getApprovedPrescriptionSignature } from "./prescriptionSignature.js";
import "./PrescriptionDocument.css";
import { prescriptionDate, prescriptionDetails, medicineTiming, medicineDuration } from "./prescriptionDetails";

export default function PrescriptionDocument({ record, doctorName }) {
  const data = prescriptionDetails(record, doctorName);
  const signature = getApprovedPrescriptionSignature(record);
  const adviceLines = data.advice.split(/\n+/).map(line => line.replace(/^\s*[-*\u2022]\s*/, '').trim()).filter(Boolean);
  const detail = (label, value) => <div><span>{label}</span><strong>{value || '-' }</strong></div>;
  return <article className="prescription-document">
    <img className="prescription-watermark" src={logoIcon} alt="" aria-hidden="true" />
    <header className="prescription-document-header">
      <div className="prescription-brand"><img src={brandLogo} alt="Humaeli - Talk. Connect. Feel Supported." /></div>
      <div className="prescription-issuer"><h2>{data.doctor}</h2>{data.qualification && <p>{data.qualification}</p>}{data.specialization && <p>{data.specialization}</p>}<div className="prescription-doctor-contact">{data.registration && <p><Stethoscope aria-hidden="true" /><span>Reg. No.: {data.registration}</span></p>}{data.clinic && <p><Building2 aria-hidden="true" /><span>{data.clinic}</span></p>}{data.address && <p><MapPin aria-hidden="true" /><span>{data.address}</span></p>}{data.doctorPhone && <p><Phone aria-hidden="true" /><span>{data.doctorPhone}</span></p>}{data.doctorEmail && <p><Mail aria-hidden="true" /><span>{data.doctorEmail}</span></p>}</div></div>
      <div className="prescription-reference">{detail('Date', data.date)}{data.opd && detail('OPD / Token No.', data.opd)}{data.prescriptionId && detail('Prescription No.', data.prescriptionId)}</div>
    </header>
    <section className="prescription-patient" aria-label="Patient details"><div className="prescription-patient-column">{detail('Patient name', data.patient)}{detail('Age / Gender', [data.age && `${data.age} years`, data.gender !== '\u2014' && data.gender].filter(Boolean).join(' / '))}{detail('Contact No.', data.phone)}</div><div className="prescription-patient-column">{detail('Patient ID', data.patientId)}{detail('Weight', data.weight && `${data.weight}${/kg/i.test(data.weight) ? '' : ' kg'}`)}{detail('Allergies', data.allergies || 'Not recorded')}</div></section>
    <div className="prescription-title"><h3><span className="prescription-rx">&#8478;</span> Prescription</h3><span className="prescription-title-line" /><span className="prescription-motto">FOR A HEALTHIER YOU</span><Leaf className="prescription-title-leaf" aria-hidden="true" /></div>
    <section className="prescription-section" aria-label="Prescribed medicines">
      {data.medicines.length ? <div className="prescription-table-wrap"><table><thead><tr><th>S. No.</th><th>Medicine name</th><th>Strength</th><th>Dosage</th><th>Duration</th><th>Instructions</th></tr></thead><tbody>{data.medicines.map((medicine, index) => <tr key={index}><td>{index + 1}</td><td><strong>{medicine.name || medicine.medicine || '-' }</strong></td><td>{medicine.strength || '-' }</td><td>{medicine.dosage || '-' }</td><td>{medicineDuration(medicine) || '-' }</td><td>{[medicineTiming(medicine), medicine.instructions].filter(Boolean).join(' / ') || '-' }</td></tr>)}</tbody></table></div> : <p>{data.medicine || 'No medicines prescribed.'}</p>}
    </section>
    <section className="prescription-section prescription-clinical"><p><strong>Consultation for: </strong>{data.issue}</p><p><strong>Diagnosis: </strong>{data.diagnosis}</p></section>
    {data.advice && <section className="prescription-section prescription-advice"><ClipboardList className="prescription-section-icon" aria-hidden="true" /><div><h3>Advice &amp; Instructions</h3>{adviceLines.length > 1 ? <ul>{adviceLines.map((line, index) => <li key={index}>{line}</li>)}</ul> : <p>{data.advice}</p>}</div></section>}
    {data.notes && data.notes !== data.advice && <section className="prescription-section"><h3>Additional notes</h3><p>{data.notes}</p></section>}
    {data.tests.length > 0 && <section className="prescription-section"><h3>Recommended tests</h3>{data.tests.map((test, index) => <p key={index}><strong>{test.testName || test.name}</strong>{test.completeBy && ` / By ${prescriptionDate(test.completeBy)}`}{test.reason && `\n${test.reason}`}{test.instructions && `\n${test.instructions}`}</p>)}</section>}
    <footer className="prescription-document-footer"><div className="prescription-followup"><CalendarDays className="prescription-section-icon" aria-hidden="true" /><div><span>Next Follow-up:</span><strong>{data.followUp ? prescriptionDate(data.followUp) : data.followUpRequired ? 'Required' : 'No follow-up scheduled'}</strong></div></div><div className="prescription-signoff"><div className="prescription-signature-space">{signature && <img src={signature} alt="Doctor signature" />}</div><strong>{data.doctor}</strong>{data.qualification && <p>{data.qualification}</p>}{data.registration && <p>Reg. No.: {data.registration}</p>}</div></footer>
    <div className="prescription-brand-footer"><span>This prescription is provided by</span><div><img src={prescriptionFooterMark} alt="" aria-hidden="true" /><strong>HUMAELI</strong></div><span>Talk. Connect. Feel Supported.</span></div>
  </article>;
}
