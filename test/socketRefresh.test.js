import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { subscribeRefresh } from '../src/services/socketRefresh.js';

test('refreshes on events without polling a healthy socket, and cleans up', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  const previousDocument = globalThis.document;
  const visibility = new EventEmitter();
  globalThis.document = {
    visibilityState: 'visible',
    addEventListener: (...args) => visibility.on(...args),
    removeEventListener: (...args) => visibility.off(...args),
  };
  t.after(() => { globalThis.document = previousDocument; });
  const socket = new EventEmitter();
  let connected = true;
  const service = { connect: async () => socket, isConnected: () => connected };
  let calls = 0;
  const stop = subscribeRefresh(service, async () => { calls++; }, ['update']);
  await Promise.resolve();
  assert.equal(calls, 1);
  t.mock.timers.tick(60_000);
  assert.equal(calls, 1, 'normal sidebar idle time must not make API requests');
  socket.emit('update');
  socket.emit('update');
  t.mock.timers.tick(100);
  await Promise.resolve();
  assert.equal(calls, 2, 'a burst of duplicate events produces one refresh');
  socket.emit('connect');
  t.mock.timers.tick(100);
  await Promise.resolve();
  assert.equal(calls, 3, 'reconnect reconciles missed updates');
  connected = false;
  t.mock.timers.tick(15_000);
  await Promise.resolve();
  assert.equal(calls, 4, 'disconnected sockets retain recovery reads');
  document.visibilityState = 'hidden';
  t.mock.timers.tick(15_000);
  assert.equal(calls, 4, 'hidden browser tabs do not poll');
  document.visibilityState = 'visible';
  visibility.emit('visibilitychange');
  t.mock.timers.tick(100);
  await Promise.resolve();
  assert.equal(calls, 5);
  stop();
  socket.emit('update');
  t.mock.timers.tick(60_000);
  assert.equal(calls, 5, 'unmounted tabs stop all refreshes');
  assert.equal(socket.listenerCount('update'), 0);
  assert.equal(socket.listenerCount('connect'), 0);
  assert.equal(visibility.listenerCount('visibilitychange'), 0);
});

test('serializes slow requests and reconciles an event received during a request', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  const previousDocument = globalThis.document;
  globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} };
  t.after(() => { globalThis.document = previousDocument; });
  const socket = new EventEmitter();
  let resolve;
  let calls = 0;
  const stop = subscribeRefresh(
    { connect: async () => socket, isConnected: () => true },
    () => { calls++; return new Promise((done) => { resolve = done; }); },
    ['update'],
  );
  await Promise.resolve();
  socket.emit('update');
  t.mock.timers.tick(100);
  assert.equal(calls, 1, 'requests must not overlap');
  resolve();
  await Promise.resolve();
  t.mock.timers.tick(100);
  assert.equal(calls, 2, 'an event during a slow request must not be lost');
  stop();
  resolve();
  await Promise.resolve();
});

test('unmount before socket connection finishes leaves no listeners or requests', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  const previousDocument = globalThis.document;
  globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} };
  t.after(() => { globalThis.document = previousDocument; });
  const socket = new EventEmitter();
  let finishConnection;
  let calls = 0;
  const stop = subscribeRefresh(
    {
      connect: () => new Promise((resolve) => { finishConnection = resolve; }),
      isConnected: () => false,
    },
    async () => { calls++; },
    ['update'],
    { initial: false },
  );
  stop();
  finishConnection(socket);
  await Promise.resolve();
  socket.emit('update');
  t.mock.timers.tick(60_000);
  assert.equal(calls, 0);
  assert.equal(socket.listenerCount('update'), 0);
  assert.equal(socket.listenerCount('connect'), 0);
});

test('booking updates ignore other doctors and reconcile a newly established connection', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  const previousDocument = globalThis.document;
  globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} };
  const socket = new EventEmitter();
  let connected = false, calls = 0;
  const stop = subscribeRefresh(
    { connect: async () => { connected = true; return socket; }, isConnected: () => connected },
    async () => { calls++; },
    ['availability:updated'],
    { initial: false, filterEvent: (_event, payload) => payload?.doctorId === 'selected-doctor' },
  );
  t.after(() => { stop(); globalThis.document = previousDocument; });
  await Promise.resolve();
  t.mock.timers.tick(100);
  await Promise.resolve();
  assert.equal(calls, 1, 'connection recovery must load changes missed while connecting');
  socket.emit('availability:updated', { doctorId: 'another-doctor' });
  t.mock.timers.tick(100);
  assert.equal(calls, 1);
  socket.emit('availability:updated', { doctorId: 'selected-doctor' });
  t.mock.timers.tick(100);
  await Promise.resolve();
  assert.equal(calls, 2);
});

test('a timed-out initial connection still receives events after the shared socket recovers', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  const previousDocument = globalThis.document;
  globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} };
  const socket = new EventEmitter();
  let connected = false, calls = 0;
  const stop = subscribeRefresh({
    connect: async () => { throw new Error('connection timed out'); },
    getSocket: () => socket,
    isConnected: () => connected,
  }, async () => { calls++; }, ['prescriptions:updated']);
  t.after(() => { stop(); globalThis.document = previousDocument; });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(socket.listenerCount('prescriptions:updated'), 1);
  connected = true;
  socket.emit('connect');
  t.mock.timers.tick(100);
  await Promise.resolve();
  const afterReconnect = calls;
  socket.emit('prescriptions:updated');
  t.mock.timers.tick(100);
  await Promise.resolve();
  assert.equal(calls, afterReconnect + 1);
});
