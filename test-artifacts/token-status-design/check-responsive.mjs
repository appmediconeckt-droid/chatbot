import { writeFile } from 'node:fs/promises';
const tabs = await (await fetch('http://127.0.0.1:9338/json/list')).json();
const ws = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let sequence = 0;
const pending = new Map();
ws.addEventListener('message', e => { const message = JSON.parse(e.data); if (message.id) { const p = pending.get(message.id); pending.delete(message.id); if (message.error) p.reject(message.error); else p.resolve(message.result); } });
const call = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
await call('Page.enable');
await call('Page.navigate', { url: 'file:///C:/Users/ArunBAarode/Desktop/updated-code-humaeli/chatbot-frontend/test-artifacts/token-status-design/index.html' });
await new Promise(resolve => setTimeout(resolve, 300));
for (const width of [1698, 390]) {
 await call('Emulation.setDeviceMetricsOverride', { width, height: width === 390 ? 1700 : 980, deviceScaleFactor: 1, mobile: width === 390 });
 await new Promise(resolve => setTimeout(resolve, 100));
 const metrics = await call('Runtime.evaluate', { expression: 'JSON.stringify({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,statCards:document.querySelectorAll(".token-stat").length})', returnByValue: true });
 console.log(metrics.result.value);
 const capture = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
 await writeFile(`test-artifacts/token-status-design/${width === 390 ? 'mobile' : 'desktop'}.png`, Buffer.from(capture.data, 'base64'));
}
ws.close();
