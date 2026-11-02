export async function renderPrescriptionPages(pdf, pages, capture) {
  for (const [index, page] of Array.from(pages).entries()) {
    const canvas = await capture(page, {
      scale: 2, useCORS: true, backgroundColor: '#ffffff',
      windowWidth: 1024, scrollX: 0, scrollY: 0,
    });
    if (index) pdf.addPage();
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.98), 'JPEG', 0, 0,
      pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
    canvas.width = 0;
    canvas.height = 0;
  }
}
