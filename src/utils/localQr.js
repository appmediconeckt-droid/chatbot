const loopback = hostname => ['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname);

export async function resolveQrOrigin({ origin, development, configured = '', request = fetch }) {
 if (!development) return null;
 if (configured) return new URL(configured).origin;
 if (!loopback(new URL(origin).hostname)) return origin;
 const response = await request('/__local-qr-origin', { cache: 'no-store' });
 if (!response.ok) throw new Error('Unable to detect the local QR address. Open the app using its Network URL.');
 const data = await response.json();
 const url = new URL(data.origin);
 if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid local QR address');
 if (loopback(url.hostname)) throw new Error('Connect this computer to Wi-Fi, then refresh the QR to scan it from your phone.');
 return url.origin;
}

export async function localizeQr(record, { development = import.meta.env?.DEV, origin = globalThis.location?.origin, configured = import.meta.env?.VITE_QR_PUBLIC_ORIGIN, request } = {}) {
 const localOrigin = await resolveQrOrigin({ origin, development, configured, request });
 if (!localOrigin) return record;
 const { default: QRCode } = await import('qrcode');
 const next = { ...record };
 for (const [urlKey, imageKey, path, id] of [
  ['walkinQrUrl', 'walkinQrCode', 'walkin', record.doctorClinicId],
  ['profileQrUrl', 'profileQrCode', 'doctor', record.doctorId],
 ]) {
  if (!id || !record[urlKey]) continue;
  const url = `${localOrigin}/${path}/${encodeURIComponent(String(id))}`;
  next[urlKey] = url;
  next[imageKey] = await QRCode.toDataURL(url, { margin: 4, scale: 6 });
 }
 return next;
}
