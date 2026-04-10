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

export const API_BASE_URL = "https://vsps9v76-5173.inc1.devtunnels.ms/";

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
          { withCredentials: true }
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
  }
);

export default axiosInstance;