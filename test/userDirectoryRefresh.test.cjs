const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('user directory response renders do not restart its role-request batch', async () => {
  const read = (file) => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');
  const translations = read('i18n/LanguageContext.jsx');
  const hook = translations.slice(translations.indexOf('export function useUserTranslation()'), translations.indexOf('// For public pages'));
  const directory = read('Component/UserDashboard/Tab/Counselor/CounselorDirectory.jsx');
  const constants = directory.slice(directory.indexOf('const getInitials'), directory.indexOf('const CounselorTable'));
  const start = directory.indexOf('\n  useEffect(() => {');
  const effect = directory.slice(start, directory.indexOf('\n  }, [t]);', start) + '\n  }, [t]);'.length);
  let index = 0, dirty = true, calls = 0;
  const slots = [];
  let pendingEffects = [];
  const language = { userLang: 'en-US', translations: {}, setUserLang() {} };
  const context = vm.createContext({
    console, LanguageContext: {}, useContext: () => language,
    makeT: (lang) => (key) => `${lang}:${key}`,
    useMemo: (make, deps) => {
      const id = index++;
      if (!slots[id] || deps.some((value, i) => !Object.is(value, slots[id].deps[i]))) slots[id] = { deps, value: make() };
      return slots[id].value;
    },
    useEffect: (run, deps) => {
      const id = index++;
      if (!slots[id] || deps.some((value, i) => !Object.is(value, slots[id].deps[i]))) {
        slots[id]?.cleanup?.();
        slots[id] = { deps };
        pendingEffects.push(() => { slots[id].cleanup = run(); });
      }
    },
    axiosInstance: { get: async () => { calls++; return { data: { users: [] } }; } },
    subscribeSocketRefresh: () => () => {},
    mergeUniqueProfessionals: (...lists) => lists.flat(),
    setIsLoading: () => { dirty = true; },
    setCounselorsData: () => { dirty = true; },
    setError: () => { dirty = true; },
  });
  vm.runInContext(hook.replace('export function', 'function') + constants +
    '\nfunction render() { const {t} = useUserTranslation();' + effect + '\nreturn t; } globalThis.render = render;', context);
  let firstT;
  for (let n = 0; n < 12; n++) {
    if (dirty || n === 5) {
      dirty = false; index = 0; pendingEffects = [];
      const t = context.render();
      if (!firstT) firstT = t;
      else assert.equal(t, firstT, 'state changes must preserve the translation callback');
      pendingEffects.forEach((run) => run());
    }
    await new Promise((resolve) => setImmediate(resolve));
  }
  assert.equal(dirty, false, 'the response must settle without an API/render loop');
  assert.equal(calls, 6, 'one directory plus five role variants should load exactly once');
  slots.forEach((slot) => slot.cleanup?.());
});
