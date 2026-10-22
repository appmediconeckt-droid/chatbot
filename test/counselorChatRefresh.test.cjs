const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');

const source = (file) => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');

// Execute the real component's hooks and request code without its JSX view.
// Dependency comparison and state updates follow React's Object.is semantics.
function fixture(subscribeRefresh, status = 200) {
  let index = 0;
  let dirty = true;
  let calls = 0;
  let nextEffects = [];
  const slots = [];
  const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const useMemo = (make, deps) => {
    const id = index++;
    if (!slots[id] || !same(slots[id].deps, deps)) slots[id] = { deps, value: make() };
    return slots[id].value;
  };
  const socket = new EventEmitter();
  const language = { counselorLang: 'en', translations: { en: {} }, setCounselorLang() {} };
  const navigate = () => {};
  const context = vm.createContext({
    console: { warn() {}, error() {} },
    LanguageContext: {}, useContext: () => language,
    makeT: (lang) => (key) => `${lang}:${key}`,
    useMemo, useCallback: (callback, deps) => useMemo(() => callback, deps),
    useRef: (value) => useMemo(() => ({ current: value }), []),
    useState: (initial) => {
      const id = index++;
      if (!slots[id]) slots[id] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[id].value, (update) => {
        const value = typeof update === 'function' ? update(slots[id].value) : update;
        if (!Object.is(value, slots[id].value)) { slots[id].value = value; dirty = true; }
      }];
    },
    useEffect: (effect, deps) => {
      const id = index++;
      if (!slots[id] || !same(slots[id].deps, deps)) {
        const cleanup = slots[id]?.cleanup;
        slots[id] = { deps };
        nextEffects.push(() => { cleanup?.(); slots[id].cleanup = effect(); });
      }
    },
    useNavigate: () => navigate,
    localStorage: { getItem: (key) => key === 'token' ? 'test-token' : null },
    API_BASE_URL: 'https://example.test',
    socketService: {
      connect: async () => socket,
      off: (event, listener) => socket.off(event, listener),
      isConnected: () => true,
    },
    subscribeSocketRefresh: (callback, events) => subscribeRefresh(context.socketService, callback, events),
    fetch: async () => {
      calls++;
      return { status, ok: status === 200, json: async () => ({ chats: [] }) };
    },
  });
  const languageSource = source('i18n/LanguageContext.jsx');
  const languageHook = languageSource.slice(languageSource.indexOf('export function useCounselorTranslation()'), languageSource.indexOf('export function useUserApiTranslation()'));
  const refreshHook = source('hooks/useSocketRefresh.js').split('export default function useSocketRefresh')[1];
  const listSource = source('Component/counselor-dashboard/Tab/Messages/Messagesou.jsx');
  const start = listSource.indexOf('\nconst SMSList = (');
  const list = listSource.slice(start, listSource.indexOf('\n  if (error) {', start));
  vm.runInContext(
    languageHook.replace('export function', 'function') +
    '\nfunction useSocketRefresh' + refreshHook +
    '\nconst LAST_OPEN_COUNSELOR_CHAT_KEY = "last-chat";\n' + list +
    '\nreturn { t }; }; globalThis.renderList = SMSList;', context,
  );
  let view;
  return {
    socket, language,
    calls: () => calls,
    t: () => view.t,
    async settle(force = false) {
      if (force) dirty = true;
      for (let n = 0; n < 30; n++) {
        if (dirty) {
          dirty = false; index = 0; nextEffects = [];
          view = context.renderList({ pendingRequests: [], setPendingRequests() {}, fetchPendingRequests() {} });
          nextEffects.forEach((effect) => effect());
        }
        await new Promise((resolve) => setImmediate(resolve));
        if (!dirty) return;
      }
      assert.fail('component did not settle: API response caused a render/fetch loop');
    },
    stop: () => slots.forEach((slot) => slot.cleanup?.()),
  };
}

for (const status of [200, 500]) {
  test(`counselor chat ${status} response and unrelated renders do not repeat the API`, async (t) => {
    const { subscribeRefresh } = await import('../src/services/socketRefresh.js');
    t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
    const previousDocument = globalThis.document;
    globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} };
    const f = fixture(subscribeRefresh, status);
    t.after(() => { f.stop(); globalThis.document = previousDocument; });
    await f.settle();
    const firstT = f.t();
    assert.equal(f.calls(), 1);
    for (let n = 0; n < 5; n++) await f.settle(true);
    assert.equal(f.t(), firstT, 'translation callback must stay stable across state renders');
    t.mock.timers.tick(60_000);
    await f.settle();
    assert.equal(f.calls(), 1, 'an idle connected page must not keep fetching chats');
    f.socket.emit('chat-list-update');
    f.socket.emit('chat-list-update');
    f.socket.emit('chat-list-update');
    t.mock.timers.tick(100);
    await f.settle();
    assert.equal(f.calls(), 2, 'three room notifications should produce one request');
    f.language.counselorLang = 'hi-IN';
    await f.settle(true);
    assert.notEqual(f.t(), firstT, 'changing language must update translations');
    assert.equal(f.calls(), 2, 'language changes should not reload the chat API');
  });
}
