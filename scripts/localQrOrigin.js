import { networkInterfaces } from 'node:os';

export function validateProductionApiUrl(value) {
 const url = new URL(value);
 const local = /^(localhost|127(?:\.\d+){3}|0\.0\.0\.0|\[?::1\]?|192\.168\.\d+\.\d+|10(?:\.\d+){3}|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)$/i.test(url.hostname) || url.hostname.endsWith('.local');
 if (url.protocol !== 'https:' || local) throw new Error('Production VITE_API_BASE_URL must be the public HTTPS backend URL');
 return url.origin;
}

export function localQrOrigin(port, interfaces = networkInterfaces(), configured = '') {
 if (configured) {
  const url = new URL(configured);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('VITE_QR_PUBLIC_ORIGIN must be an HTTP(S) URL');
  return url.origin;
 }
 const candidates = Object.entries(interfaces).flatMap(([name, addresses]) =>
  addresses.filter(address => address.family === 'IPv4' && !address.internal && !address.address.startsWith('169.254.'))
   .map(address => ({ name, address: address.address })));
 candidates.sort((a, b) => Number(/virtual|vpn|docker|vEthernet/i.test(a.name)) - Number(/virtual|vpn|docker|vEthernet/i.test(b.name))
  || Number(!/wi-?fi|wlan/i.test(a.name)) - Number(!/wi-?fi|wlan/i.test(b.name)));
 return `http://${candidates[0]?.address || 'localhost'}:${port}`;
}

export function localQrPlugin(configured) {
 return {
  name: 'local-qr-origin',
  apply: 'serve',
  configureServer(server) {
   server.middlewares.use('/__local-qr-origin', (_request, response) => {
    const address = server.httpServer?.address();
    const port = typeof address === 'object' && address?.port || server.config.server.port || 5173;
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 'no-store');
    response.end(JSON.stringify({ origin: localQrOrigin(port, undefined, configured) }));
   });
  },
 };
}
