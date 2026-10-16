import prescriptionFooterMark from "./prescriptionFooterMark.svg";
import { getApprovedPrescriptionSignature } from "./prescriptionSignature.js";
import brandLogo from "../../assets/humaeli-logo-stacked-tagline.png";
import { logoIcon } from "../../assets/brandAssets.js";
import { prescriptionDetails, medicineDuration, medicineTiming, prescriptionDate } from "./prescriptionDetails.js";

// Text-based PDF keeps long prescriptions searchable and paginates without clipping.
export async function downloadConsultationPrescription(record, doctorName) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const data = prescriptionDetails(record, doctorName);
  const loadImage = src => new Promise((resolve, reject) => {
    const image = new Image(); image.crossOrigin = 'anonymous'; image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Prescription logo could not be loaded. Please try again.'));
    image.src = src;
  });
  const [brand, icon, footerMark] = await Promise.all([loadImage(brandLogo), loadImage(logoIcon), loadImage(prescriptionFooterMark)]);
  const footerCanvas = document.createElement('canvas');
  footerCanvas.width = 96; footerCanvas.height = 96;
  footerCanvas.getContext('2d').drawImage(footerMark, 0, 0, 96, 96);
  const footerMarkPng = footerCanvas.toDataURL('image/png');
  const signatureUrl = getApprovedPrescriptionSignature(record);
  const signature = signatureUrl ? await loadImage(signatureUrl) : null;
  const pdf = new jsPDF();
  const ink = [21, 60, 64], line = [185, 205, 204];
  const drawCalendar = (x, top, size = 7) => {
    pdf.setDrawColor(49, 91, 97); pdf.setLineWidth(.45);
    pdf.roundedRect(x, top + 1, size, size - 1, .6, .6);
    pdf.line(x, top + 3, x + size, top + 3);
    pdf.line(x + 1.8, top, x + 1.8, top + 2);
    pdf.line(x + size - 1.8, top, x + size - 1.8, top + 2);
    pdf.setFillColor(49, 91, 97);
    for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++) pdf.rect(x + 1.3 + col * 1.8, top + 4 + row * 1.4, .6, .6, 'F');
  };
  const drawClipboard = (x, top) => {
    pdf.setDrawColor(49, 91, 97); pdf.setLineWidth(.45);
    pdf.roundedRect(x, top + 1, 6, 8, .6, .6);
    pdf.setFillColor(243, 246, 245); pdf.roundedRect(x + 1.5, top, 3, 2, .5, .5, 'FD');
    for (let row = 0; row < 3; row++) pdf.line(x + 1.4, top + 3.6 + row * 1.6, x + 4.6, top + 3.6 + row * 1.6);
  };
  let y = 22;
  const write = (text, size = 11, bold = false) => {
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(String(text || "-"), 174);
    for (const line of lines) {
      if (y > 262) { pdf.addPage(); y = 22; }
      pdf.text(line, 18, y);
      y += size * .48;
    }
    y += 2;
  };
  const section = (title, content) => {
    if (!content) return;
    if (y > 245) { pdf.addPage(); y = 22; }
    pdf.setTextColor(...ink); write(title, 12, true);
    pdf.setTextColor(...ink); write(content);
    y += 2;
  };
  const block = (value, x, top, width, size = 10, bold = false, centered = false) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal'); pdf.setFontSize(size); pdf.setTextColor(...ink);
    const lines = pdf.splitTextToSize(String(value || '-'), width);
    pdf.text(lines, centered ? x + width / 2 : x, top, { align: centered ? 'center' : 'left' }); return top + lines.length * size * .4;
  };
  pdf.addImage(brand, 'PNG', 14, 14, 39, 39);
  pdf.setFont('times', 'bold'); pdf.setFontSize(19); pdf.setTextColor(...ink);
  const doctorLines = pdf.splitTextToSize(data.doctor, 87);
  pdf.text(doctorLines, 62, 20);
  let doctorY = 22 + doctorLines.length * 7;
  for (const value of [data.qualification, data.specialization, data.registration && `Reg. No.: ${data.registration}`, data.clinic, data.address, data.doctorPhone, data.doctorEmail].filter(Boolean)) {
    doctorY = block(value, 62, doctorY, 87) + 2;
  }
  let referenceY = 20;
  for (const [label, value] of [['Date', data.date], ['OPD / Token No.', data.opd], ['Prescription No.', data.prescriptionId]]) {
    if (!value) continue;
    referenceY = block(label, 158, referenceY, 38, 10, true) + 1;
    referenceY = block(value, 158, referenceY, 38, 10) + 5;
  }
  y = Math.max(65, doctorY + 5, referenceY);
  pdf.setDrawColor(...line); pdf.line(56, 14, 56, y - 6); pdf.line(153, 14, 153, y - 6); pdf.line(14, y, 196, y);
  autoTable(pdf, {
    startY: y + 7, margin: { left: 14, right: 14, top: 20, bottom: 30 }, theme: 'plain',
    body: [
      ['Patient name', data.patient, 'Patient ID', data.patientId || '-'],
      ['Age / Gender', [data.age && `${data.age} years`, data.gender].filter(Boolean).join(' / '), 'Weight', data.weight ? `${data.weight}${/kg/i.test(data.weight) ? '' : ' kg'}` : '-'],
      ['Contact No.', data.phone || '-', 'Allergies', data.allergies || 'Not recorded'],
    ], styles: { fillColor: [241, 245, 244], textColor: ink, fontSize: 10.5, cellPadding: 3.5, overflow: 'linebreak' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 30 }, 1: { cellWidth: 61 }, 2: { fontStyle: 'bold', cellWidth: 26 } },
  });
  y = pdf.lastAutoTable.finalY + 10;
  if (y > 245) { pdf.addPage(); y = 22; }
  pdf.setFont('times', 'bold'); pdf.setFontSize(23); pdf.text('Rx', 14, y); pdf.text('Prescription', 29, y);
  pdf.setDrawColor(...line); pdf.line(82, y - 2, 147, y - 2);
  block('FOR A HEALTHIER YOU', 152, y - 1, 43, 7); y += 9;
  if (data.medicines.length) {
    autoTable(pdf, { startY: y, margin: { left: 14, right: 14, top: 20, bottom: 30 },
      head: [['S. No.', 'Medicine name', 'Strength', 'Dosage', 'Duration', 'Instructions']],
      body: data.medicines.map((m, index) => [index + 1, m.name || m.medicine || '-', m.strength || '-', m.dosage || '-', medicineDuration(m) || '-', [medicineTiming(m), m.instructions].filter(Boolean).join(' / ') || '-']),
      theme: 'grid', rowPageBreak: 'avoid', styles: { fontSize: 10, cellPadding: 3, overflow: 'linebreak', textColor: ink, lineColor: line, lineWidth: .2 },
      headStyles: { fillColor: [223, 233, 230], textColor: ink },
      columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 40 }, 2: { cellWidth: 22 }, 3: { cellWidth: 26 }, 4: { cellWidth: 25 } },
    });
    y = pdf.lastAutoTable.finalY + 7;
  } else section("Prescribed medicines", data.medicine || "No medicines prescribed.");
  autoTable(pdf, { startY: y, margin: { left: 14, right: 14, top: 20, bottom: 30 }, theme: 'plain',
    body: [[`Consultation for: ${data.issue}`, `Diagnosis: ${data.diagnosis}`]],
    styles: { textColor: ink, fontSize: 9.5, cellPadding: 2, overflow: 'linebreak' },
  });
  y = pdf.lastAutoTable.finalY + 6;
  if (data.advice) {
    if (y > 245) { pdf.addPage(); y = 22; }
    autoTable(pdf, { startY: y, margin: { left: 14, right: 14, top: 20, bottom: 30 }, theme: 'plain',
      head: [['Advice & Instructions']], body: [[data.advice.split(/\n+/).filter(Boolean).map(value => '- ' + value.replace(/^\s*[-*\u2022]\s*/, '')).join('\n')]],
      styles: { fillColor: [243, 246, 245], textColor: ink, fontSize: 11, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fontStyle: 'bold', fontSize: 13, cellPadding: { top: 5, bottom: 3, left: 15, right: 3 } },
      bodyStyles: { cellPadding: { top: 2, bottom: 5, left: 15, right: 5 } },
      didDrawCell: cell => { if (cell.section === 'head') drawClipboard(cell.cell.x + 4, cell.cell.y + 3); },
    });
    y = pdf.lastAutoTable.finalY + 10;
  }
  if (data.notes !== data.advice) section("Additional notes", data.notes);
  data.tests.forEach(test => section(`Recommended test: ${test.testName || test.name || "Test"}`, [test.completeBy && `Complete by: ${prescriptionDate(test.completeBy)}`, test.reason, test.instructions].filter(Boolean).join("\n") || "As advised"));
  if (y > 226) { pdf.addPage(); y = 22; }
  drawCalendar(17, y + 2);
  block('Next Follow-up:', 28, y + 5, 70, 11, true);
  block((data.followUp && prescriptionDate(data.followUp)) || (data.followUpRequired ? 'Required' : 'No follow-up scheduled'), 28, y + 12, 70, 10);
  if (signature) {
    const ratio = signature.naturalWidth / signature.naturalHeight;
    const width = Math.min(39, 13 * ratio), height = width / ratio;
    const canvas = document.createElement('canvas');
    canvas.width = signature.naturalWidth; canvas.height = signature.naturalHeight;
    canvas.getContext('2d').drawImage(signature, 0, 0);
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 139 + (39 - width) / 2, y + 1 + (13 - height), width, height);
  }
  let signY = block(data.doctor, 120, y + 19, 76, 12, true, true);
  if (data.qualification) signY = block(data.qualification, 120, signY + 2, 76, 10, false, true);
  if (data.registration) block(`Reg. No.: ${data.registration}`, 120, signY + 2, 76, 10, false, true);
  for (let page = 1; page <= pdf.getNumberOfPages(); page++) {
    pdf.setPage(page);
    pdf.saveGraphicsState(); pdf.setGState(new pdf.GState({ opacity: .045 }));
    pdf.addImage(icon, 'PNG', 125, 172, 72, 72); pdf.restoreGraphicsState();
    pdf.setDrawColor(...line); pdf.line(14, 275, 196, 275);
    block('This prescription is provided by', 14, 283, 65, 8);
    pdf.addImage(footerMarkPng, 'PNG', 83, 277.5, 8, 8);
    block('HUMAELI', 94, 284, 40, 13, true);
    block('Talk. Connect. Feel Supported.', 139, 283, 57, 8);
    pdf.setFillColor(133, 170, 163); pdf.rect(0, 294, 210, 3, 'F');
  }
  const name = data.patient.replace(/[^a-zA-Z0-9_-]/g, "_") || "patient";
  pdf.save(`prescription_${name}.pdf`);
}
