// Reconcile on mount, reconnect and relevant events, rather than polling a
// healthy socket. Keep a slow recovery path when the connection is unavailable.
export function subscribeRefresh(socketService, refresh, events = [], { initial = true, filterEvent = () => true } = {}) {
  let disposed = false;
  let pending = false;
  let rerun = false;
  let socket;
  let eventTimer;
  const listeners = events.map((event) => [event, (payload) => {
    if (filterEvent(event, payload)) schedule();
  }]);
  const initiallyConnected = socketService.isConnected();
  const run = async () => {
    if (disposed || document.visibilityState === "hidden") return;
    if (pending) { rerun = true; return; }
    pending = true;
    try { await refresh(); }
    catch (error) { console.warn("Socket refresh failed:", error); }
    finally {
      pending = false;
      if (rerun && !disposed) { rerun = false; schedule(); }
    }
  };
  const schedule = () => {
    clearTimeout(eventTimer);
    eventTimer = setTimeout(run, 100);
  };
  const onVisible = () => {
    if (document.visibilityState === "visible") schedule();
  };
  if (initial) void run();
  const attach = (connected) => {
    if (disposed || !connected || socket === connected) return;
    socket = connected;
    socket.on("connect", schedule);
    listeners.forEach(([event, listener]) => socket.on(event, listener));
    if (!initiallyConnected) schedule();
  };
  const connect = () => socketService.connect().then(attach).catch(() => {
    // A connection timeout can reject while the shared socket keeps retrying.
    // Attach to that socket so its eventual reconnect does not lose listeners.
    attach(socketService.getSocket?.());
  });
  void connect();
  const fallback = setInterval(() => {
    if (!socket) void connect();
    if (!socketService.isConnected()) void run();
  }, 15_000);
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    disposed = true;
    clearTimeout(eventTimer);
    clearInterval(fallback);
    document.removeEventListener("visibilitychange", onVisible);
    socket?.off("connect", schedule);
    listeners.forEach(([event, listener]) => socket?.off(event, listener));
  };
}

