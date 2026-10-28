import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PrescriptionDocument from './PrescriptionDocument.jsx';
import api from '../../axiosConfig.js';
import { loadPrescriptionBookingQr } from './prescriptionBookingQr.js';
import { prescriptionDetails } from './prescriptionDetails.js';
import { embedPrescriptionImages } from './prescriptionExportImages.js';

// Export the same component and stylesheet used by every prescription preview.
export async function downloadConsultationPrescription(record, doctorName) {
  const [{ default: html2pdf }, bookingQrImage] = await Promise.all([
    import('html2pdf.js'),
    loadPrescriptionBookingQr(record, path => api.get(path, { timeout: 15000 })),
  ]);
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;left:-10000px;top:0;width:794px;pointer-events:none;';
  host.innerHTML = renderToStaticMarkup(React.createElement('div', { className: 'prescription-export' },
    React.createElement(PrescriptionDocument, { record, doctorName, bookingQrImage })));
  document.body.appendChild(host);
  let worker;
  try {
    if (document.fonts?.ready) await document.fonts.ready;
    await embedPrescriptionImages(host);
    const name = prescriptionDetails(record, doctorName).patient.replace(/[^a-zA-Z0-9_-]/g, '_') || 'patient';
    worker = html2pdf().set({
      filename: `prescription_${name}.pdf`,
      margin: 0,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 1024, scrollX: 0, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: {
        mode: ['css', 'legacy'],
        avoid: ['.prescription-document-header', '.prescription-patient-row', 'tr', '.prescription-document-footer', '.prescription-contact-footer', '.prescription-brand-footer', '.prescription-tests > p', '.prescription-advice li'],
      },
    }).from(host.firstElementChild);
    await worker.save();
  } finally {
    host.remove();
    // html2pdf normally removes its overlay after capture; also clean up on failure.
    worker?.prop?.overlay?.remove();
  }
}
