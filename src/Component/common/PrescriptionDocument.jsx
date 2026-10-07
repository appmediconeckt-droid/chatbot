import React from "react";
import { logoIcon } from "../../assets/brandAssets";
import "./PrescriptionDocument.css";

import { prescriptionDate, prescriptionDetails, medicineTiming, medicineDuration } from "./prescriptionDetails";

export default function PrescriptionDocument({ record, doctorName }) {
  const data = prescriptionDetails(record, doctorName);
  return <article className="prescription-document">
    <header className="prescription-document-header">
      <div className="prescription-brand"><img src={logoIcon} alt="Humaeli" /><div><span>CONSULTATION RECORD</span><h2>Prescription</h2></div></div>
      <div className="prescription-issuer"><strong>{data.doctor}</strong><span>{data.date}</span></div>
    </header>
    <section className="prescription-patient"><div><span>Patient name</span><strong>{data.patient}</strong></div><div><span>Gender</span><strong>{data.gender}</strong></div><div><span>Consultation for</span><strong>{data.issue}</strong></div></section>
    <section className="prescription-section"><h3>Diagnosis</h3><p>{data.diagnosis}</p></section>
    <section className="prescription-section"><h3><span className="prescription-rx">℞</span> Prescribed medicines</h3>
      {data.medicines.length ? <div className="prescription-table-wrap"><table><thead><tr><th>Medicine</th><th>Dosage</th><th>Timing</th><th>Duration</th></tr></thead><tbody>{data.medicines.map((medicine, index) => <tr key={index}><td><strong>{medicine.name || medicine.medicine || "—"}</strong></td><td>{medicine.dosage || "—"}</td><td>{medicineTiming(medicine) || "—"}</td><td>{medicineDuration(medicine) || "—"}</td></tr>)}</tbody></table></div> : <p>{data.medicine || "No medicines prescribed."}</p>}
    </section>
    {data.advice && <section className="prescription-section"><h3>Advice & instructions</h3><p>{data.advice}</p></section>}
    {data.notes && data.notes !== data.advice && <section className="prescription-section"><h3>Additional notes</h3><p>{data.notes}</p></section>}
    {data.tests.length > 0 && <section className="prescription-section"><h3>Recommended tests</h3>{data.tests.map((test, index) => <p key={index}><strong>{test.testName || test.name}</strong>{test.completeBy && ` · By ${prescriptionDate(test.completeBy)}`}{test.reason && `\n${test.reason}`}{test.instructions && `\n${test.instructions}`}</p>)}</section>}
    <footer className="prescription-document-footer"><div><span>Follow-up</span><strong>{data.followUp ? prescriptionDate(data.followUp) : data.followUpRequired ? "Required" : "No follow-up scheduled"}</strong></div><div><span>Issued by</span><strong>{data.doctor}</strong></div></footer>
  </article>;
}
