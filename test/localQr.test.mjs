import test from 'node:test';
import assert from 'node:assert/strict';
import QRCode from 'qrcode';
import { localQrOrigin, validateProductionApiUrl } from '../scripts/localQrOrigin.js';
import { localizeQr, resolveQrOrigin } from '../src/utils/localQr.js';

const clinic = { doctorClinicId: 'clinic link', walkinQrUrl: 'https://humaeli.com/walkin/clinic%20link', walkinQrCode: 'live-image' };

test('local QR image actually encodes the LAN walk-in URL instead of the live URL', async () => {
 const request = async () => ({ ok: true, json: async () => ({ origin: 'http://192.168.0.138:5173' }) });
 const result = await localizeQr(clinic, { development: true, origin: 'http://localhost:5173', request });
 assert.equal(result.walkinQrUrl, 'http://192.168.0.138:5173/walkin/clinic%20link');
 assert.equal(result.walkinQrCode, await QRCode.toDataURL(result.walkinQrUrl, { margin: 4, scale: 6 }));
 assert.equal(clinic.walkinQrCode, 'live-image');
});

test('production preserves backend QR codes and never calls the development endpoint', async () => {
 const result = await localizeQr(clinic, { development: false, configured: 'http://192.168.0.138:5173', origin: 'https://humaeli.com', request: () => { throw new Error('Unexpected network request'); } });
 assert.equal(result, clinic);
});

test('production build configuration requires the HTTPS backend rather than a local development address', () => {
 assert.equal(validateProductionApiUrl('https://backend.example/api'), 'https://backend.example');
 for (const value of ['http://backend.example', 'https://localhost:5006', 'https://192.168.0.138:5006', 'https://127.0.0.1:5006', 'https://[::1]:5006']) {
  assert.throws(() => validateProductionApiUrl(value), /public HTTPS/);
 }
});

test('opening the app through a network address preserves its actual port and origin', async () => {
 const result = await localizeQr(clinic, { development: true, origin: 'http://10.0.0.8:5174', request: () => { throw new Error('Unexpected request'); } });
 assert.equal(result.walkinQrUrl, 'http://10.0.0.8:5174/walkin/clinic%20link');
});

test('profile QR and explicit tunnel origin point to the local frontend too', async () => {
 const result = await localizeQr({ doctorId: 'doctor-1', profileQrUrl: 'https://humaeli.com/doctor/doctor-1' }, {
  development: true, origin: 'http://localhost:5173', configured: 'https://test.example/path',
 });
 assert.equal(result.profileQrUrl, 'https://test.example/doctor/doctor-1');
 assert.match(result.profileQrCode, /^data:image\/png;base64,/);
});

test('network discovery prefers Wi-Fi over virtual adapters and uses the running Vite port', () => {
 const interfaces = {
  'vEthernet': [{ family: 'IPv4', internal: false, address: '172.20.0.1' }],
  'WiFi': [{ family: 'IPv4', internal: false, address: '192.168.0.138' }],
  'Loopback': [{ family: 'IPv4', internal: true, address: '127.0.0.1' }],
 };
 assert.equal(localQrOrigin(5174, interfaces), 'http://192.168.0.138:5174');
 assert.equal(localQrOrigin(5173, {}, 'https://tunnel.example/test'), 'https://tunnel.example');
});

test('a missing LAN connection does not silently generate an unscannable localhost QR', async () => {
 await assert.rejects(resolveQrOrigin({ development: true, origin: 'http://localhost:5173', request: async () => ({ ok: true, json: async () => ({ origin: 'http://localhost:5173' }) }) }), /Wi-Fi/);
});
