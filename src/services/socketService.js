// services/socketService.js
// Singleton Socket.IO client for the web chat feature.
// One shared socket per browser session — components subscribe/unsubscribe
// to events without creating duplicate connections.

import { io } from 'socket.io-client';
import { API_BASE_URL } from '../axiosConfig';

const CONNECTION_TIMEOUT_MS = 20_000;
const MAX_RECONNECT_ATTEMPTS = 5;

class SocketService {
  constructor() {
    this._socket = null;
    this._connectionPromise = null;
    this._reconnectAttempts = 0;
    this._visibilityHandler = null;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  async connect() {
    if (this._socket?.connected) return this._socket;
    if (this._connectionPromise) return this._connectionPromise;

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
        transports: ['polling'],
        auth: { token },
        reconnection: true,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: CONNECTION_TIMEOUT_MS,
        path: '/socket.io/',
        forceNew: false,
        autoConnect: true,
      });

      return new Promise((resolve, reject) => {
        const cleanup = () => {
          clearTimeout(timer);
          socket.off('connect', onConnect);
          socket.off('connect_error', onError);
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
          this._socket = socket;
          console.log('[SocketService] Connected ✓ id:', socket.id);
          this._setupPersistentListeners(socket);
          this._setupVisibility(socket);
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
          if (code === 'AUTH_TOKEN_EXPIRED' || code === 'AUTH_TOKEN_INVALID' || code === 'AUTH_TOKEN_MISSING' || code === 'AUTH_USER_INACTIVE') {
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
      });
    } catch (err) {
      this._connectionPromise = null;
      throw err;
    }
  }

  _setupPersistentListeners(socket) {
    socket.on('disconnect', (reason) => {
      console.warn('[SocketService] Disconnected:', reason);
    });
    socket.on('reconnect', (attempt) => {
      console.log('[SocketService] Reconnected after', attempt, 'attempt(s)');
      this._reconnectAttempts = 0;
    });
    socket.on('reconnect_error', (err) => {
      console.error('[SocketService] Reconnect error:', err?.message);
    });
    socket.on('reconnect_failed', () => {
      console.error('[SocketService] All reconnect attempts failed');
    });
  }

  // Reconnect when the browser tab becomes visible again (equivalent of AppState on mobile).
  _setupVisibility(socket) {
    this._teardownVisibility();
    this._visibilityHandler = () => {
      if (document.visibilityState === 'visible' && !socket.connected) {
        console.log('[SocketService] Tab visible — reconnecting socket…');
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
