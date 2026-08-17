import axios from "axios";

const envApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  "https://chatbot-backend-production-82fb.up.railway.app";
// const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://m429gbrg-5002.inc1.devtunnels.ms/";
if (!envApiBaseUrl) {
  throw new Error(
    "Missing VITE_API_BASE_URL. Set it in your frontend .env file.",
  );
}

export const VITE_API_BASE_URL = envApiBaseUrl.replace(/\/+$/, "");

export const API_BASE_URL = VITE_API_BASE_URL;

const axiosInstance = axios.create({
  baseURL: VITE_API_BASE_URL,
  withCredentials: true, // ✅ MUST
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

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

    // ✅ Exclude auth endpoints from refresh logic
    if (
      requestUrl.includes("/api/auth/login") ||
      requestUrl.includes("/api/auth/refresh-token") ||
      requestUrl.includes("/api/auth/verify-login-otp") ||
      requestUrl.includes("/api/auth/verifyOtp") ||
      requestUrl.includes("/api/auth/logout-other-devices") ||
      requestUrl.includes("/api/auth/generateOtp") ||
      requestUrl.includes("/api/auth/resendOtp")
    ) {
      return Promise.reject(error);
    }

    // ✅ ONLY handle 401
    if (error.response?.status === 401 && !originalRequest._retry) {
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
        const storedRefreshToken = localStorage.getItem("refreshToken");

        const response = await axios.post(
          `${VITE_API_BASE_URL}/api/auth/refresh-token`,
          { refreshToken: storedRefreshToken },
          { withCredentials: true },
        );

        const newToken = response.data.accessToken || response.data.token;
        const newRefreshToken = response.data.refreshToken;

        if (!newToken) throw new Error("No access token returned from refresh");

        // ✅ Save new token
        localStorage.setItem("accessToken", newToken);
        localStorage.setItem("token", newToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        // ✅ Update queue
        processQueue(null, newToken);

        // ✅ Retry original request
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        localStorage.removeItem("accessToken");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        sessionStorage.clear();

        if (typeof window !== "undefined") {
          window.location.replace("/role-selector");
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
