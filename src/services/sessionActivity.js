let lastActivity = null;
export const recordSessionActivity = (now = Date.now()) => { lastActivity = now; };
export const hasRecentSessionActivity = (now = Date.now(), interval = 60000) => lastActivity !== null && now - lastActivity < interval;

let refreshRequest;
export function shareTokenRefresh(request) {
  if (!refreshRequest) refreshRequest = Promise.resolve().then(request).finally(() => { refreshRequest = null; });
  return refreshRequest;
}

export function createSessionHeartbeat({ send, eligible, recentActivity, onError = () => {}, now = Date.now, timers = globalThis, interval = 60000 }) {
  let stopped = false, pending, lastAttempt = null, timer;
  const controller = new AbortController();
  const run = () => {
    if (stopped || !eligible() || recentActivity() || (lastAttempt !== null && now() - lastAttempt < interval)) return Promise.resolve();
    if (pending) return pending;
    lastAttempt = now();
    pending = Promise.resolve().then(() => send(controller.signal)).catch(error => {
      if (!stopped) onError(error);
    }).finally(() => { pending = null; });
    return pending;
  };
  return {
    run,
    start() {
      if (timer || stopped) return;
      // Cancel the initial StrictMode mount before it can issue a request.
      timer = timers.setTimeout(function tick() {
        run();
        if (!stopped) timer = timers.setTimeout(tick, interval);
      }, 150);
    },
    stop() { stopped = true; timers.clearTimeout(timer); controller.abort(); },
  };
}
