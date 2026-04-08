// // axiosConfig.js
// import axios from 'axios';

// // Base URL for API
// export const API_BASE_URL = 'https://td6lmn5q-5000.inc1.devtunnels.ms';

// // Create axios instance with default config
// const axiosInstance = axios.create({
//   baseURL: API_BASE_URL,
//   timeout: 10000,
//   headers: {
//     'Content-Type': 'application/json',
//   }
// });

// // Request interceptor to add token to headers
// axiosInstance.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('accessToken');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//       console.log('Token added to header:', token.substring(0, 20) + '...');
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Response interceptor to handle token refresh
// axiosInstance.interceptors.response.use(
//   (response) => {
//     return response;
//   },
//   async (error) => {
//     const originalRequest = error.config;

//     // If error is 401 and not already retrying
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;

//       try {
//         const refreshToken = localStorage.getItem('refreshToken');
//         if (!refreshToken) {
//           throw new Error('No refresh token');
//         }

//         // Try to refresh the token
//         const response = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {
//           refreshToken: refreshToken
//         });

//         if (response.data.accessToken) {
//           // Save new tokens
//           localStorage.setItem('accessToken', response.data.accessToken);
//           if (response.data.refreshToken) {
//             localStorage.setItem('refreshToken', response.data.refreshToken);
//           }

//           // Update authorization header
//           originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;

//           // Retry the original request
//           return axiosInstance(originalRequest);
//         }
//       } catch (refreshError) {
//         // Refresh failed - redirect to login
//         localStorage.clear();
//         window.location.href = '/user-signup';
//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export default axiosInstance;

// frontend/src/api/axiosConfig.js
import axios from "axios";

const normalizeBaseUrl = (url) => url?.trim().replace(/\/$/, "");
const viteEnv =
  typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};

const getConfiguredEnvApiBaseUrl = () =>
  normalizeBaseUrl(
    viteEnv.VITE_API_BASE_URL ||
      viteEnv.VITE_BACKEND_URL ||
      viteEnv.VITE_API_URL,
  );

const isLocalhostHost = (hostname) =>
  hostname === "localhost" || hostname === "127.0.0.1";

const isPrivateIPv4Host = (hostname) =>
  /^192\.168\.\d+\.\d+$/i.test(hostname) ||
  /^10\.\d+\.\d+\.\d+$/i.test(hostname) ||
  /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/i.test(hostname);

const isLanLikeHost = (hostname) =>
  isPrivateIPv4Host(hostname) || /\.local$/i.test(hostname);

const inferApiBaseUrl = () => {
  const envBase = getConfiguredEnvApiBaseUrl();

  if (typeof window === "undefined") {
    return {
      url: "http://localhost:5000",
      source: "server-fallback",
    };
  }

  const { protocol, hostname } = window.location;

  if (envBase) {
    try {
      const envUrl = new URL(envBase);
      const envHostIsLocal = isLocalhostHost(envUrl.hostname);
      const clientIsLocal = isLocalhostHost(hostname);

      // If env points to localhost but app runs on another device, ignore env override.
      if (!(envHostIsLocal && !clientIsLocal)) {
        return {
          url: envBase,
          source: "env",
        };
      }
    } catch {
      // Ignore malformed env URL and continue with inference.
    }
  }

  if (isLocalhostHost(hostname)) {
    return {
      url: "http://localhost:5000",
      source: "localhost-fallback",
    };
  }

  const tunnelMatch = hostname.match(/^(.*)-\d+(\.inc\d+\.devtunnels\.ms)$/i);
  if (tunnelMatch) {
    return {
      url: `${protocol}//${tunnelMatch[1]}-5000${tunnelMatch[2]}`,
      source: "devtunnel-fallback",
    };
  }

  if (isLanLikeHost(hostname)) {
    return {
      url: `${protocol}//${hostname}:5000`,
      source: "lan-fallback",
    };
  }

  // Fallback for deployed setups that reverse-proxy /api on same origin.
  return {
    url: window.location.origin,
    source: "origin-fallback",
  };
};

const inferredApiBaseUrl = inferApiBaseUrl();

export const API_BASE_URL = inferredApiBaseUrl.url;
export const API_BASE_URL_SOURCE = inferredApiBaseUrl.source;

if (viteEnv.DEV) {
  console.info(
    `[axiosConfig] API base URL (${API_BASE_URL_SOURCE}): ${API_BASE_URL}`,
  );
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // ✅ MUST
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || "";

    // Login failures should surface directly; do not trigger refresh flow.
    if (
      requestUrl.includes("/api/auth/login") ||
      requestUrl.includes("/api/auth/refresh-token") ||
      requestUrl.includes("/refresh-token")
    ) {
      return Promise.reject(error);
    }

    // ✅ ONLY handle 401
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      console.log("🔥 Interceptor triggered");

      const storedRefreshToken = localStorage.getItem("refreshToken");
      if (!storedRefreshToken) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("🔄 Calling refresh-token API");

        const response = await axios.post(
          `${API_BASE_URL}/api/auth/refresh-token`,
          { refreshToken: storedRefreshToken },
          { withCredentials: true },
        );

        const { accessToken } = response.data;

        if (!accessToken) throw new Error("No access token");

        // ✅ Save new token
        localStorage.setItem("accessToken", accessToken);

        // ✅ Update queue
        processQueue(null, accessToken);

        // ✅ Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.log("❌ Refresh failed");

        processQueue(refreshError, null);

        localStorage.removeItem("accessToken");

        // logout redirect

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
