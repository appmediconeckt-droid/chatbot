// services/socketService.js
// Singleton Socket.IO client for the web chat feature.
// One shared socket per browser session — components subscribe/unsubscribe
// to events without creating duplicate connections.

import { io } from 'socket.io-client';
import { API_BASE_URL } from '../axiosConfig';

const CONNECTION_TIMEOUT_MS = 20_000;
// Presence must survive temporary network changes. A valid login token stays
// authenticated, so keep retrying until the user explicitly logs out.
const MAX_RECONNECT_ATTEMPTS = Infinity;
const FATAL_AUTH_CODES = new Set(['AUTH_TOKEN_EXPIRED', 'AUTH_TOKEN_INVALID', 'AUTH_TOKEN_MISSING', 'AUTH_USER_INACTIVE', 'AUTH_SESSION_INACTIVE']);

class SocketService {
  constructor() {
    this._socket = null;
    this._connectionPromise = null;
    this._reconnectAttempts = 0;
    this._visibilityHandler = null;
    this._cancelConnection = null;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  async connect() {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token) throw new Error('[SocketService] No auth token — cannot connect');
    if (this._socket?.connected) return this._socket;
    if (this._connectionPromise) return this._connectionPromise;
    if (this._socket) {
      // Reuse the socket so mounted screens keep their event listeners.
      this._socket.auth = { token: localStorage.getItem('accessToken') || localStorage.getItem('token') };
      if (!this._socket.active) this._socket.connect();
      return this._socket;
    }

    this._connectionPromise = this._establish();
    return this._connectionPromise;
  }

  getSocket() {
    return this._socket;
  }

  isConnected() {
    return this._socket?.connected === true;
  }

  disconnect() {
    this._cancelConnection?.();
    this._teardownVisibility();
    if (this._socket) {
      this._socket.removeAllListeners();
      this._socket.disconnect();
      this._socket = null;
    }
    this._connectionPromise = null;
    this._reconnectAttempts = 0;
  }

  async emit(event, data) {
    const socket = await this.connect();
    socket.emit(event, data);
  }

  // Register a named listener — returns a cleanup function for easy removal.
  async on(event, handler) {
    const socket = await this.connect();
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }

  off(event, handler) {
    if (this._socket) {
      this._socket.off(event, handler);
    }
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  async _establish() {
    try {
      const token =
        localStorage.getItem('accessToken') || localStorage.getItem('token');

      if (!token) {
        this._connectionPromise = null;
        throw new Error('[SocketService] No auth token — cannot connect');
      }

      console.log('[SocketService] Connecting to', API_BASE_URL);

      if (this._socket) {
        this._socket.removeAllListeners();
        this._socket.disconnect();
        this._socket = null;
      }

      const socket = io(API_BASE_URL, {
        // Keep one persistent WebSocket; polling is only a network fallback.
        transports: ['websocket', 'polling'],
        tryAllTransports: true,
        withCredentials: true,
        auth: { token },
        reconnection: true,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 30000,
        timeout: CONNECTION_TIMEOUT_MS,
        path: '/socket.io/',
        forceNew: false,
        autoConnect: false,
      });
      // Own the socket immediately, including failures and timeouts. Otherwise
      // an abandoned Manager can keep polling while another socket is created.
      this._socket = socket;
      this._setupPersistentListeners(socket);
      this._setupVisibility(socket);

      // Read the latest access token before each reconnect attempt. This lets
      // the same socket session recover cleanly after an Axios token refresh.
      socket.io.on('reconnect_attempt', () => {
        socket.auth = {
          token: localStorage.getItem('accessToken') || localStorage.getItem('token'),
        };
      });

      return new Promise((resolve, reject) => {
        const cleanup = () => {
          clearTimeout(timer);
          socket.off('connect', onConnect);
          socket.off('connect_error', onError);
          this._cancelConnection = null;
        };

        const timer = setTimeout(() => {
          cleanup();
          this._connectionPromise = null;
          reject(new Error('[SocketService] Connection timed out'));
        }, CONNECTION_TIMEOUT_MS + 2000);

        const onConnect = () => {
          cleanup();
          this._reconnectAttempts = 0;
          this._connectionPromise = null;
          console.log('[SocketService] Connected ✓ id:', socket.id);
          resolve(socket);
        };

        const onError = (err) => {
          this._reconnectAttempts++;
          const code = err?.data?.code || err?.message || 'UNKNOWN';
          console.error(
            `[SocketService] connect_error (attempt ${this._reconnectAttempts}) code=${code}:`,
            err?.message || err,
          );
          // Fatal auth errors — don't keep retrying, let caller handle re-login
          if (FATAL_AUTH_CODES.has(code)) {
            cleanup();
            this._connectionPromise = null;
            socket.disconnect();
            const fatal = new Error(`[SocketService] Auth failed: ${code}`);
            fatal.code = code;
            reject(fatal);
            return;
          }
          if (this._reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            cleanup();
            this._connectionPromise = null;
            reject(err);
          }
        };

        socket.once('connect', onConnect);
        socket.on('connect_error', onError);
        socket.once('error', (err) => {
          cleanup();
          this._connectionPromise = null;
          reject(err);
        });
        this._cancelConnection = () => {
          cleanup();
          reject(Object.assign(new Error('[SocketService] Connection cancelled'), { code: 'SOCKET_DISCONNECTED' }));
        };
        socket.connect();
      });
    } catch (err) {
      this._connectionPromise = null;
      throw err;
    }
  }

  _setupPersistentListeners(socket) {
    socket.on('connect_error', error => {
      if (FATAL_AUTH_CODES.has(error?.data?.code || error?.message)) socket.disconnect();
    });
    socket.on('disconnect', (reason) => {
      console.warn('[SocketService] Disconnected:', reason);
    });
    socket.io.on('reconnect', (attempt) => {
      console.log('[SocketService] Reconnected after', attempt, 'attempt(s)');
      this._reconnectAttempts = 0;
    });
    socket.io.on('reconnect_error', (err) => {
      console.error('[SocketService] Reconnect error:', err?.message);
    });
    socket.io.on('reconnect_failed', () => {
      console.error('[SocketService] All reconnect attempts failed');
    });
  }

  // Reconnect when the browser tab becomes visible again (equivalent of AppState on mobile).
  _setupVisibility(socket) {
    this._teardownVisibility();
    this._visibilityHandler = () => {
      if (document.visibilityState === 'visible' && !socket.connected && !socket.active && (localStorage.getItem('accessToken') || localStorage.getItem('token'))) {
        console.log('[SocketService] Tab visible — reconnecting socket…');
        socket.auth = { token: localStorage.getItem('accessToken') || localStorage.getItem('token') };
        socket.connect();
      }
    };
    document.addEventListener('visibilitychange', this._visibilityHandler);
  }

  _teardownVisibility() {
    if (this._visibilityHandler) {
      document.removeEventListener('visibilitychange', this._visibilityHandler);
      this._visibilityHandler = null;
    }
  }
}

export const socketService = new SocketService();
export default socketService;
