import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PrescriptionDocument from './PrescriptionDocument.jsx';
import api from '../../axiosConfig.js';
import { loadPrescriptionBookingQr } from './prescriptionBookingQr.js';
import { prescriptionDetails } from './prescriptionDetails.js';
import { embedPrescriptionImages } from './prescriptionExportImages.js';
import { paginatePrescription } from './paginatePrescription.js';
import { renderPrescriptionPages } from './renderPrescriptionPages.js';

// Export the same component and stylesheet used by every prescription preview.
export async function downloadConsultationPrescription(record, doctorName) {
  const [{ default: html2canvas }, { jsPDF }, bookingQrImage] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
    loadPrescriptionBookingQr(record, path => api.get(path, { timeout: 15000 })),
  ]);
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;left:-10000px;top:0;width:794px;pointer-events:none;';
  host.innerHTML = renderToStaticMarkup(React.createElement('div', { className: 'prescription-export' },
    React.createElement(PrescriptionDocument, { record, doctorName, bookingQrImage })));
  document.body.appendChild(host);
  try {
    if (document.fonts?.ready) await document.fonts.ready;
    await embedPrescriptionImages(host);
    paginatePrescription(host.firstElementChild);
    const name = prescriptionDetails(record, doctorName).patient.replace(/[^a-zA-Z0-9_-]/g, '_') || 'patient';
    // Each measured paper becomes exactly one PDF page. Running html2pdf's
    // automatic breaks again inserted spacer pages between these paper nodes.
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pages = host.querySelectorAll('.prescription-paper-page');
    await renderPrescriptionPages(pdf, pages, html2canvas);
    pdf.save(`prescription_${name}.pdf`);
  } finally {
    host.remove();
  }
}
