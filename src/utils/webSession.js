const WEB_SESSION_MARKER = "humaeliWebSession";

const WEB_AUTH_KEYS = [
  "accessToken",
  "token",
  "refreshToken",
  "isAuthenticated",
  "userRole",
  "userType",
  "userEmail",
  "userData",
  "user",
  "userId",
  "counsellorId",
  "counselorId",
  "isVerified",
  "profilePhoto",
  "fullName",
  "name",
];

// sessionStorage survives reloads but is removed when the browser/tab session
// ends. localStorage is still used by the existing web app during one session;
// stale credentials are discarded before React or API clients can use them.
export const initializeWebSession = () => {
  if (sessionStorage.getItem(WEB_SESSION_MARKER)) return;

  WEB_AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
  sessionStorage.setItem(WEB_SESSION_MARKER, String(Date.now()));
};
