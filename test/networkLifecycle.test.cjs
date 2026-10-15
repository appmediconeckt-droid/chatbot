const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function scheduler() {
  let now = 0, next = 0;
  const jobs = new Map();
  return {
    now: () => now,
    setTimeout(fn, delay) { const id = ++next; jobs.set(id, { fn, at: now + delay }); return id; },
    clearTimeout(id) { jobs.delete(id); },
    tick(ms) { now += ms; for (const [id, job] of [...jobs]) if (job.at <= now) { jobs.delete(id); job.fn(); } },
    count: () => jobs.size,
  };
}

test('heartbeat coalesces focus/visibility, honors API activity and pauses hidden/offline pages', async () => {
  const { createSessionHeartbeat } = await import('../src/services/sessionActivity.js');
  const timers = scheduler();
  let visible = true, online = true, recent = false, calls = 0, finish;
  const task = createSessionHeartbeat({ now: timers.now, timers, eligible: () => visible && online, recentActivity: () => recent, send: () => { calls++; return new Promise(resolve => { finish = resolve; }); } });
  task.start(); timers.tick(150); await Promise.resolve();
  task.run(); task.run(); assert.equal(calls, 1);
  finish(); await new Promise(resolve => setImmediate(resolve));
  timers.tick(60000); await Promise.resolve(); assert.equal(calls, 2);
  finish(); await new Promise(resolve => setImmediate(resolve));
  recent = true; timers.tick(60000); await task.run(); assert.equal(calls, 2);
  recent = false; visible = false; timers.tick(60000); await task.run(); assert.equal(calls, 2);
  visible = true; online = false; await task.run(); assert.equal(calls, 2);
  task.stop(); assert.equal(timers.count(), 0);
});

test('StrictMode cleanup cancels the deferred initial heartbeat', async () => {
  const { createSessionHeartbeat } = await import('../src/services/sessionActivity.js');
  const timers = scheduler(); let calls = 0;
  const task = createSessionHeartbeat({ timers, send: () => { calls++; }, eligible: () => true, recentActivity: () => false });
  task.start(); task.stop(); timers.tick(1000); await Promise.resolve(); assert.equal(calls, 0);
});

test('both API clients share a single token refresh and can retry after a refresh failure', async () => {
  const { shareTokenRefresh } = await import('../src/services/sessionActivity.js');
  let calls = 0, resolve;
  const first = shareTokenRefresh(() => { calls++; return new Promise(done => { resolve = done; }); });
  const second = shareTokenRefresh(() => { calls++; });
  await Promise.resolve(); assert.equal(calls, 1); assert.equal(first, second);
  resolve('new-token'); assert.deepEqual(await Promise.all([first, second]), ['new-token', 'new-token']);
  await assert.rejects(shareTokenRefresh(() => Promise.reject(new Error('offline'))), /offline/);
  assert.equal(await shareTokenRefresh(() => Promise.resolve('retry-token')), 'retry-token');
});

function socketFixture() {
  const timers = scheduler(), sockets = [], visibility = new Map();
  let token = 'token';
  class FakeSocket extends EventEmitter {
    constructor() { super(); this.io = new EventEmitter(); this.active = false; this.connected = false; this.connectCalls = 0; }
    connect() { this.connectCalls++; this.active = true; return this; }
    disconnect() { this.connected = false; this.active = false; return this; }
    finish() { this.connected = true; this.emit('connect'); }
  }
  const source = fs.readFileSync(path.join(__dirname, '../src/services/socketService.js'), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace('export const socketService', 'const socketService').replace('export default socketService;', 'globalThis.service = socketService;');
  const context = vm.createContext({
    API_BASE_URL: 'https://example.test', console: { log() {}, warn() {}, error() {} },
    localStorage: { getItem: () => token },
    document: { visibilityState: 'visible', addEventListener: (name, fn) => visibility.set(name, fn), removeEventListener: name => visibility.delete(name) },
    setTimeout: timers.setTimeout, clearTimeout: timers.clearTimeout,
    io: (_url, options) => { const socket = new FakeSocket(); socket.options = options; sockets.push(socket); return socket; },
  });
  vm.runInContext(source, context);
  return { service: context.service, sockets, timers, visibility, logout: () => { token = null; } };
}

test('concurrent socket consumers share one WebSocket-first connection', async () => {
  const f = socketFixture();
  const first = f.service.connect(), second = f.service.connect();
  assert.equal(f.sockets.length, 1);
  assert.equal(f.service.getSocket(), f.sockets[0]);
  assert.equal(f.sockets[0].options.transports[0], 'websocket');
  assert.equal(f.sockets[0].options.tryAllTransports, true);
  f.sockets[0].finish();
  assert.equal(await first, await second);
  assert.equal(f.sockets[0].connectCalls, 1);
  f.service.disconnect(); assert.equal(f.timers.count(), 0); assert.equal(f.visibility.size, 0);
});

test('timed-out socket attempts remain owned and are reused rather than creating orphan pollers', async () => {
  const f = socketFixture();
  const result = f.service.connect().catch(error => error);
  f.timers.tick(22000); await result;
  await f.service.connect(); await f.service.connect();
  assert.equal(f.sockets.length, 1);
  assert.equal(f.sockets[0].connectCalls, 1);
  f.service.disconnect();
});

test('logout cancels an in-progress connection and prevents anonymous reconnects', async () => {
  const f = socketFixture();
  const pending = f.service.connect().catch(error => error);
  f.service.disconnect(); f.logout();
  assert.equal((await pending).code, 'SOCKET_DISCONNECTED');
  await assert.rejects(f.service.connect(), /No auth token/);
  assert.equal(f.timers.count(), 0); assert.equal(f.sockets.length, 1);
});
