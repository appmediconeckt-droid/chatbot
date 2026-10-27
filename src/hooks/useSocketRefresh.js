import { useEffect, useRef } from "react";
import socketService from "../services/socketService";
import { subscribeRefresh } from "../services/socketRefresh.js";

export const subscribeSocketRefresh = (refresh, events, options) =>
  subscribeRefresh(socketService, refresh, events, options);

export default function useSocketRefresh(refresh, events, enabled = true, { initial = true, refreshKey = "", allowHidden = false, pollWhileConnected = false, fallbackIntervalMs = 15000 } = {}) {
  const latest = useRef(refresh);
  latest.current = refresh;
  const eventKey = JSON.stringify(events);
  useEffect(() => {
    if (!enabled) return;
    return subscribeSocketRefresh(() => latest.current(), JSON.parse(eventKey), { initial, allowHidden, pollWhileConnected, fallbackIntervalMs });
  }, [enabled, eventKey, initial, refreshKey, allowHidden, pollWhileConnected, fallbackIntervalMs]);
}
