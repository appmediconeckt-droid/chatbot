const WEB_SESSION_MARKER = "humaeliWebSession";

// sessionStorage is per-tab, while login credentials in localStorage are shared.
// A new tab (including a QR appointment link) must not clear another tab's login.
// Logout and server-side session validation handle credential invalidation.
export const initializeWebSession = () => {
  if (sessionStorage.getItem(WEB_SESSION_MARKER)) return;

  sessionStorage.setItem(WEB_SESSION_MARKER, String(Date.now()));
};
