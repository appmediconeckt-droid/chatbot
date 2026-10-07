import { prescriptionDetails, medicineDuration, medicineTiming } from "./prescriptionDetails.js";

// Text-based PDF keeps long prescriptions searchable and paginates without clipping.
export async function downloadConsultationPrescription(record, doctorName) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const data = prescriptionDetails(record, doctorName);
  const pdf = new jsPDF();
  let y = 22;
  const write = (text, size = 11, bold = false) => {
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(String(text || "-"), 174);
    for (const line of lines) {
      if (y > 275) { pdf.addPage(); y = 22; }
      pdf.text(line, 18, y);
      y += size * .48;
    }
    y += 4;
  };
  const section = (title, content) => {
    if (!content) return;
    if (y > 255) { pdf.addPage(); y = 22; }
    pdf.setTextColor(30, 58, 138); write(title, 12, true);
    pdf.setTextColor(36, 50, 71); write(content);
    y += 3;
  };
  pdf.setTextColor(30, 58, 138); write("Prescription", 24, true);
  pdf.setTextColor(36, 50, 71);
  write(`${data.doctor} | ${data.date}`);
  write(`Patient: ${data.patient}`, 12, true);
  write(`Gender: ${data.gender} | Consultation for: ${data.issue}`);
  section("Diagnosis", data.diagnosis);
  if (data.medicines.length) {
    autoTable(pdf, { startY: y, margin: { left: 18, right: 18, top: 20, bottom: 20 }, head: [["Medicine", "Dosage", "Timing", "Duration"]], body: data.medicines.map(m => [m.name || m.medicine || "-", m.dosage || "-", medicineTiming(m) || "-", medicineDuration(m) || "-"]), styles: { fontSize: 10, cellPadding: 4, overflow: "linebreak" }, headStyles: { fillColor: [30, 58, 138] } });
    y = pdf.lastAutoTable.finalY + 12;
  } else section("Prescribed medicines", data.medicine || "No medicines prescribed.");
  section("Advice & instructions", data.advice);
  if (data.notes !== data.advice) section("Additional notes", data.notes);
  data.tests.forEach(test => section(`Recommended test: ${test.testName || test.name || "Test"}`, [test.completeBy && `Complete by: ${test.completeBy}`, test.reason, test.instructions].filter(Boolean).join("\n") || "As advised"));
  section("Follow-up", data.followUp || (data.followUpRequired ? "Required" : "No follow-up scheduled"));
  section("Issued by", data.doctor);
  const name = data.patient.replace(/[^a-zA-Z0-9_-]/g, "_") || "patient";
  pdf.save(`prescription_${name}.pdf`);
}
