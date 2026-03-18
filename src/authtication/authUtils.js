// Store user email
export const setUserEmail = (email) => {
  localStorage.setItem('userEmail', email);
};

// Get user email
export const getUserEmail = () => {
  return localStorage.getItem('userEmail');
};

// Update verification status
export const updateVerificationStatus = (status) => {
  localStorage.setItem('isVerified', status);
};

// Get verification status
export const getVerificationStatus = () => {
  return localStorage.getItem('isVerified') === 'true';
};

// Store access token
export const setAccessToken = (token) => {
  localStorage.setItem('accessToken', token);
};

// Get access token
export const getAccessToken = () => {
  return localStorage.getItem('accessToken');
};

// Clear all auth data (logout)
export const clearAuthData = () => {
  localStorage.removeItem('userEmail');
  localStorage.removeItem('isVerified');
  localStorage.removeItem('accessToken');
};