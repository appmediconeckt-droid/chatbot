import axios from "axios";
import { API_BASE_URL } from "./src/axiosConfig";

// ✅ REQUEST INTERCEPTOR
axios.interceptors.request.use(
  (config) => {
    // You can also set baseURL here globally if you want
    config.baseURL = API_BASE_URL;

    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ✅ RESPONSE INTERCEPTOR
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
};

axios.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || "";

    // Do not run refresh flow for login/refresh endpoints.
    // Do not run refresh flow for login/refresh endpoints.
    if (
      requestUrl.includes("/api/auth/login") ||
      requestUrl.includes("/api/auth/refresh-token") ||
      requestUrl.includes("/refresh-token")
    ) {
      // Special handling for the one‑device conflict response (409)
      if (
        error.response &&
        error.response.status === 409 &&
        error.response.data.needLogout
      ) {
        // Propagate a custom error flag so UI can react (e.g., show modal)
        error.isOneDeviceConflict = true;
        let parsedEmail = "";
        try {
          if (typeof originalRequest?.data === "string") {
            parsedEmail = JSON.parse(originalRequest.data)?.email || "";
          } else {
            parsedEmail = originalRequest?.data?.email || "";
          }
        } catch {
          parsedEmail = "";
        }
        error.conflictEmail = parsedEmail;
      }
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
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
            return axios(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/refresh-token`,
          { refreshToken: storedRefreshToken },
          { withCredentials: true },
        );

        const newToken = response.data.accessToken;
        const newRefreshToken = response.data.refreshToken;
        localStorage.setItem("accessToken", newToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axios(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        sessionStorage.clear();
        if (typeof window !== "undefined") {
          window.location.replace("/role-selector");
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
