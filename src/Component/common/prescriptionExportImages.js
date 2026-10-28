// Embed image pixels before html2pdf clones the template. Asset URLs alone can
// load in the preview but fail to paint in the separate canvas document.
export async function embedPrescriptionImages(root) {
  const document = root.ownerDocument;
  const Image = document.defaultView.Image;
  const embedded = new Map();
  await Promise.all(Array.from(root.querySelectorAll('img'), async element => {
    const source = element.currentSrc || element.src;
    if (!embedded.has(source)) {
      embedded.set(source, new Promise((resolve, reject) => {
        const image = new Image();
        const timer = setTimeout(() => fail(), 15000);
        const fail = () => {
          clearTimeout(timer);
          reject(new Error('Prescription image could not be loaded for the PDF. Please try again.'));
        };
        image.crossOrigin = 'anonymous';
        image.onload = async () => {
          try {
            await image.decode();
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const context = canvas.getContext('2d');
            if (!context || !canvas.width || !canvas.height) throw new Error('Image unavailable');
            context.drawImage(image, 0, 0);
            const data = canvas.toDataURL('image/png');
            if (!data.startsWith('data:image/png')) throw new Error('Image could not be embedded');
            clearTimeout(timer);
            resolve(data);
          } catch { fail(); }
        };
        image.onerror = fail;
        image.src = source;
      }));
    }
    element.removeAttribute('srcset');
    element.removeAttribute('sizes');
    element.loading = 'eager';
    element.src = await embedded.get(source);
    await element.decode();
  }));
}
