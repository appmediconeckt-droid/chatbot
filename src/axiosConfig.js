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
// axiosConfig.js
import axios from 'axios';

export const API_BASE_URL = 'https://td6lmn5q-5000.inc1.devtunnels.ms';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Request interceptor - add token to headers
axiosInstance.interceptors.request.use(
  (config) => {
    // Skip token for auth endpoints
    if (config.url.includes('/login') || config.url.includes('/refresh-token') || config.url.includes('/signup')) {
      return config;
    }
    
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = (token) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Don't retry refresh token endpoint
    if (originalRequest.url?.includes('/refresh-token')) {
      return Promise.reject(error);
    }
    
    // Check if it's a 401 error and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // If already refreshing, wait for new token
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axiosInstance(originalRequest));
          });
        });
      }
      
      isRefreshing = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        // Call refresh endpoint
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/refresh-token`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );
        
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        if (accessToken) {
          // Store new tokens
          localStorage.setItem('accessToken', accessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }
          
          // Update authorization header
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          
          // Process queued requests
          onRefreshed(accessToken);
          
          // Retry original request
          return axiosInstance(originalRequest);
        } else {
          throw new Error('No access token in response');
        }
        
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError);
        // Clear tokens and redirect to login
        localStorage.clear();
        window.location.href = '/user-signup';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;