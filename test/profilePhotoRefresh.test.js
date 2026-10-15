import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../src/Component/common/useProfilePhotoRefresh.js', import.meta.url), 'utf8')
  .replace(/^import .*;\r?\n/gm, '').replace('export default function', 'function');
function setup(user) {
  let profile = { _id: 'staff-a', role: 'receptionist', profilePhoto: { url: '/uploads/old.png' } };
  const listeners = new Map();
  let cleanup, now = 0, requests = 0;
  const events = { addEventListener: (name, callback) => listeners.set(name, callback), removeEventListener: name => listeners.delete(name) };
  const context = vm.createContext({
    AbortController,
    useEffect: callback => { cleanup = callback(); },
    axios: { get: async () => { requests++; return { data: { user } }; } },
    navigator: { onLine: true },
    Date: class extends Date { static now() { return now; } },
    window: events, document: { ...events, visibilityState: 'visible' },
    setInterval: () => { throw new Error('Profile photo must not be polled'); },
  });
  vm.runInContext(source, context);
  vm.runInContext('useProfilePhotoRefresh', context)(profile, update => { profile = update(profile); });
  return { listeners, advance: ms => { now += ms; }, requests: () => requests, cleanup: () => cleanup(), profile: () => profile };
}
test('returning to the staff portal refreshes the original uploaded photo', async () => {
  const fixture = setup({ _id: 'staff-a', role: 'receptionist', profilePhoto: { url: '/uploads/new.png' } });
  fixture.advance(60000);
  await fixture.listeners.get('focus')();
  assert.equal(fixture.profile().profilePhoto.url, '/uploads/new.png');
  fixture.cleanup();
  assert.equal(fixture.listeners.size, 0);
});
test('an explicit profile update refreshes immediately without periodic polling', async () => {
  const fixture = setup({ _id: 'staff-a', role: 'receptionist', profilePhoto: { url: '/uploads/new.png' } });
  await fixture.listeners.get('profile-updated')();
  assert.equal(fixture.profile().profilePhoto.url, '/uploads/new.png');
  fixture.cleanup();
});
test('a response for another signed-in account cannot replace the displayed photo', async () => {
  const fixture = setup({ _id: 'staff-b', role: 'receptionist', profilePhoto: { url: '/uploads/other.png' } });
  await fixture.listeners.get('profile-updated')();
  assert.equal(fixture.profile().profilePhoto.url, '/uploads/old.png');
  fixture.cleanup();
});

test('focus and visibility events are throttled and unrelated storage updates do not fetch profiles', async () => {
 const fixture = setup({ _id: 'staff-a', role: 'receptionist', profilePhoto: {url:'/uploads/new.png'} });
 fixture.advance(60000);
 await fixture.listeners.get('focus')();
 await fixture.listeners.get('visibilitychange')();
 await fixture.listeners.get('storage')({key:'accessToken'});
 assert.equal(fixture.requests(), 1);
 fixture.cleanup();
});
