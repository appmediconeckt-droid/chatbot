import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../src/Component/common/useProfilePhotoRefresh.js', import.meta.url), 'utf8')
  .replace(/^import .*;\r?\n/gm, '').replace('export default function', 'function');
function setup(user) {
  let profile = { _id: 'staff-a', role: 'receptionist', profilePhoto: { url: '/uploads/old.png' } };
  const listeners = new Map();
  let poll, cleanup;
  const events = { addEventListener: (name, callback) => listeners.set(name, callback), removeEventListener: name => listeners.delete(name) };
  const context = vm.createContext({
    AbortController,
    useEffect: callback => { cleanup = callback(); },
    axios: { get: async () => ({ data: { user } }) },
    window: events, document: { ...events, visibilityState: 'visible' },
    setInterval: callback => { poll = callback; return 1; }, clearInterval: () => { poll = null; },
  });
  vm.runInContext(source, context);
  vm.runInContext('useProfilePhotoRefresh', context)(profile, update => { profile = update(profile); });
  return { listeners, poll: () => poll(), cleanup: () => cleanup(), profile: () => profile };
}
test('returning to the staff portal refreshes the original uploaded photo', async () => {
  const fixture = setup({ _id: 'staff-a', role: 'receptionist', profilePhoto: { url: '/uploads/new.png' } });
  await fixture.listeners.get('focus')();
  assert.equal(fixture.profile().profilePhoto.url, '/uploads/new.png');
  fixture.cleanup();
  assert.equal(fixture.listeners.size, 0);
});
test('an already-open portal picks up a doctor photo update through polling', async () => {
  const fixture = setup({ _id: 'staff-a', role: 'receptionist', profilePhoto: { url: '/uploads/new.png' } });
  await fixture.poll();
  assert.equal(fixture.profile().profilePhoto.url, '/uploads/new.png');
  fixture.cleanup();
});
test('a response for another signed-in account cannot replace the displayed photo', async () => {
  const fixture = setup({ _id: 'staff-b', role: 'receptionist', profilePhoto: { url: '/uploads/other.png' } });
  await fixture.poll();
  assert.equal(fixture.profile().profilePhoto.url, '/uploads/old.png');
  fixture.cleanup();
});
