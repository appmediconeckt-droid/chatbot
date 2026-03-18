// Save authentication data to localStorage
export const saveAuthData = (response) => {
  try {
    // Handle different response structures
    const accessToken = response.data?.accessToken || response.data?.token;
    const refreshToken = response.data?.refreshToken;
    
    // Extract user data from different possible response structures
    let userData = response.data?.user || response.data?.data?.user || response.data;
    
    // Remove sensitive data if needed
    if (userData && userData.password) {
      delete userData.password;
    }
    
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    }
    
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
    
    // Also store email separately for easy access
    if (userData?.email || response.data?.email) {
      localStorage.setItem('userEmail', userData?.email || response.data?.email);
    }
    
    // Store verification status
    const isVerified = userData?.isVerified || response.data?.isVerified || false;
    localStorage.setItem('isVerified', isVerified);
    
    console.log('Auth data saved successfully');
    console.log('User verified status:', isVerified);
  } catch (error) {
    console.error('Error saving auth data:', error);
  }
};

// Clear all authentication data from localStorage
export const clearAuthData = () => {
  try {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isVerified');
    console.log('Auth data cleared successfully');
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

// Check if user is authenticated (has token)
export const isAuthenticated = () => {
  try {
    const token = localStorage.getItem('accessToken');
    return !!token;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

// Check if user is fully verified
export const isVerified = () => {
  try {
    const verified = localStorage.getItem('isVerified') === 'true';
    return verified;
  } catch (error) {
    console.error('Error checking verification status:', error);
    return false;
  }
};

// Get user data from localStorage
export const getUserData = () => {
  try {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Get access token
export const getAccessToken = () => {
  try {
    return localStorage.getItem('accessToken');
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};

// Get refresh token
export const getRefreshToken = () => {
  try {
    return localStorage.getItem('refreshToken');
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

// Get user email
export const getUserEmail = () => {
  try {
    return localStorage.getItem('userEmail');
  } catch (error) {
    console.error('Error getting user email:', error);
    return null;
  }
};

// Update verification status
export const updateVerificationStatus = (status) => {
  try {
    localStorage.setItem('isVerified', status);
    
    // Also update user object if it exists
    const userData = getUserData();
    if (userData) {
      userData.isVerified = status;
      localStorage.setItem('user', JSON.stringify(userData));
    }
    
    console.log('Verification status updated to:', status);
  } catch (error) {
    console.error('Error updating verification status:', error);
  }
};
// Add this function to your existing authUtils.js file

// Get user role from localStorage
export const getUserRole = () => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.role || 'user'; // Default to 'user' if role not found
    }
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

// Rest of your existing authUtils.js code remains the same...