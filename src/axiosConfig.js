import axios from "axios";

const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!envApiBaseUrl) {
  throw new Error(
    "Missing VITE_API_BASE_URL. Set it in your frontend .env file.",
  );
}

export const API_BASE_URL = envApiBaseUrl.replace(/\/+$/, "");

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

    // ✅ ONLY handle 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log("🔥 Interceptor triggered");

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
          {},
          { withCredentials: true },
        );

        const { accessToken, refreshToken } = response.data;

        if (!accessToken) throw new Error("No access token");

        // ✅ Save new token
        localStorage.setItem("accessToken", accessToken);
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }

        // ✅ Update queue
        processQueue(null, accessToken);

        // ✅ Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.log("❌ Refresh failed");

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
