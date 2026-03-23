import React, { useState } from 'react';
import { FaEnvelope, FaLock, FaUser, FaPhone, FaCalendarAlt, FaVenusMars } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UserSignup.css';
import logo from '../image/Mediconect Logo-3.png';
import { useEffect } from "react";

const UserSignup = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    // Login Fields
    email: '',
    password: '',
    
    // Signup Fields
    fullName: '',
    anonymous: '',
    phoneNumber: '',
    age: '',
    gender: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showVerifyButton, setShowVerifyButton] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // API Base URLs
  const API_BASE_URL = 'https://td6lmn5q-5000.inc1.devtunnels.ms/';
  const LOGIN_URL = `${API_BASE_URL}api/auth/login`;
  const REGISTER_URL = `${API_BASE_URL}api/auth/register/user `;

  useEffect(() => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (token) {
      navigate("/user-dashboard"); // already logged in → redirect
    }
  }, [navigate]);

  // Function to show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    // Clear API error when user starts typing
    if (apiError) {
      setApiError('');
    }
  };

  const validateLogin = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    return newErrors;
  };

  const validateSignup = () => {
    const newErrors = {};
    
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.anonymous) newErrors.anonymous = 'Anonymous name is required';
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be 10 digits';
    }
    
    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else if (formData.age < 13 || formData.age > 120) {
      newErrors.age = 'Age must be between 13 and 120';
    }
    
    if (!formData.gender) newErrors.gender = 'Gender is required';
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 3) {
      newErrors.password = 'Password must be at least 3 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    return newErrors;
  };
 
  const handleLogin = async () => {
    try {
      const response = await axios.post(LOGIN_URL, {
        email: formData.email,
        password: formData.password
      });

      console.log("Login response:", response.data);

      // Normalize token/refreshToken from different possible payload shapes
      const token =
        response.data?.token ||
        response.data?.accessToken ||
        response.data?.data?.token ||
        response.data?.data?.accessToken;

      const refreshToken =
        response.data?.refreshToken ||
        response.data?.data?.refreshToken;

      // ✅ CASE 1: USER ALREADY LOGGED IN (backend message)
      if (response.data?.message === "User already logged in") {
        setApiError("User already logged in");
        setShowVerifyButton(true);
        return; // ❌ STOP → no redirect
      }

      // ✅ CASE 2: SUCCESS LOGIN (TOKEN PROVIDED)
      if (token) {
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userType", "user");
        localStorage.setItem("userEmail", formData.email);

        // Support both legacy and new token key naming
        localStorage.setItem("token", token);
        localStorage.setItem("accessToken", token);

        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }

        if (response.data.user) {
          localStorage.setItem("userData", JSON.stringify(response.data.user));
        }

        showNotification('Login successful! Redirecting to dashboard...', 'success');
        
        // ✅ DELAY REDIRECT TO SHOW NOTIFICATION
        setTimeout(() => {
          navigate("/user-dashboard");
        }, 1500);
        return;
      }

      // ✅ CASE 3: LOGIN SUCCESS MESSAGE (NO TOKEN)
      if (response.data?.message?.toLowerCase().includes("success")) {
        // Guard against treating "already logged in" as success.
        if (response.data.message !== "User already logged in") {
          showNotification('Login successful! Redirecting to dashboard...', 'success');
          setTimeout(() => {
            navigate("/user-dashboard");
          }, 1500);
          return;
        }
      }

      // ❌ CASE 4: OTHER ERROR
      if (response.data?.message) {
        setApiError(response.data.message);
        showNotification(response.data.message, 'error');
        return;
      }

      setApiError("Login failed");
      showNotification("Login failed", 'error');

    } catch (error) {
      console.error("Login error:", error);

      let errorMessage = "Something went wrong";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = "Invalid email or password";
      } else if (error.request) {
        errorMessage = "Network error. Please check your connection.";
      }
      
      setApiError(errorMessage);
      showNotification(errorMessage, 'error');
    }
  };

  const handleSignup = async () => {
    try {
      // Prepare signup data according to API requirements
      const signupData = {
        fullName: formData.fullName,
        email: formData.email,
        anonymous: formData.anonymous,
        phoneNum: formData.phoneNumber,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        age: parseInt(formData.age),
        gender: formData.gender,
        role: "user"
      };

      console.log('Signup data:', signupData);

      const response = await axios.post(REGISTER_URL, signupData);

      console.log('Signup response:', response.data);

      if (response.data && (response.data.message?.includes('success') || response.data.success)) {
        // Show success notification
        showNotification('Account created successfully! Please login to continue.', 'success');
        
        // Clear form data
        setFormData({
          email: '',
          password: '',
          fullName: '',
          anonymous: '',
          phoneNumber: '',
          age: '',
          gender: '',
          confirmPassword: ''
        });
        
        // Clear any existing errors
        setErrors({});
        setApiError('');
        
        // Switch to login mode after a short delay
        setTimeout(() => {
          setIsLogin(true);
          // Show additional notification to inform user to login
          showNotification('Please login with your credentials', 'info');
        }, 2000);
      } else {
        // Handle case where signup was successful but response format is unexpected
        showNotification('Account created successfully! Please login to continue.', 'success');
        setTimeout(() => {
          setIsLogin(true);
        }, 2000);
      }
    } catch (error) {
      console.error('Signup error:', error);
      
      // Handle different error scenarios
      if (error.response) {
        // Server responded with error status
        if (error.response.status === 400) {
          // Handle validation errors
          if (error.response.data.errors) {
            // If server returns field-specific errors
            const serverErrors = {};
            Object.keys(error.response.data.errors).forEach(key => {
              serverErrors[key] = error.response.data.errors[key][0];
            });
            setErrors(serverErrors);
            showNotification('Please check the form for errors', 'error');
          } else if (error.response.data.message) {
            setApiError(error.response.data.message);
            showNotification(error.response.data.message, 'error');
          } else {
            setApiError('Registration failed. Please check your information.');
            showNotification('Registration failed. Please check your information.', 'error');
          }
        } else if (error.response.status === 409) {
          setApiError('User with this email already exists');
          showNotification('User with this email already exists', 'error');
        } else {
          setApiError('Registration failed. Please try again.');
          showNotification('Registration failed. Please try again.', 'error');
        }
      } else if (error.request) {
        // Request was made but no response
        setApiError('Network error. Please check your connection.');
        showNotification('Network error. Please check your connection.', 'error');
      } else {
        // Something else happened
        setApiError('An error occurred. Please try again.');
        showNotification('An error occurred. Please try again.', 'error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setApiError('');
    
    if (isLogin) {
      const loginErrors = validateLogin();
      if (Object.keys(loginErrors).length === 0) {
        await handleLogin();
      } else {
        setErrors(loginErrors);
        showNotification('Please fill in all required fields', 'error');
      }
    } else {
      const signupErrors = validateSignup();
      if (Object.keys(signupErrors).length === 0) {
        await handleSignup();
      } else {
        setErrors(signupErrors);
        showNotification('Please fill in all required fields correctly', 'error');
      }
    }
    
    setIsLoading(false);
  };

  const handleVerify = async () => {
    try {
      setIsVerifying(true);
      setVerifySuccess(false);
      
      // Send verification email API call
      const verifyResponse = await axios.post(
        `${API_BASE_URL}/send-verification-email`,
        { email: formData.email }
      );
      
      console.log("Verification email response:", verifyResponse.data);
      
      if (verifyResponse.data?.success || verifyResponse.data?.message) {
        setVerifySuccess(true);
        showNotification('Verification email sent successfully! Check your inbox.', 'success');
        // Show success message for 3 seconds
        setTimeout(() => {
          setVerifySuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Verification error:", error);
      const errorMessage = error.response?.data?.message || 'Failed to send verification email. Please try again.';
      setApiError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setApiError('');
    setShowVerifyButton(false);
    setVerifySuccess(false);
    setFormData({
      email: '',
      password: '',
      fullName: '',
      anonymous: '',
      phoneNumber: '',
      age: '',
      gender: '',
      confirmPassword: ''
    });
    // Clear notification when toggling mode
    setNotification({ show: false, message: '', type: '' });
  };

  return (
    <div className="user-wrapper">
      {/* Notification Component */}
      {notification.show && (
        <div className={`user-notification user-notification-${notification.type}`}>
          <div className="user-notification-content">
            <span className="user-notification-icon">
              {notification.type === 'success' && '✓'}
              {notification.type === 'error' && '⚠️'}
              {notification.type === 'info' && 'ℹ️'}
            </span>
            <span className="user-notification-message">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="user-container">
        {/* Left Side - Brand Section */}
        <div className="user-brand-section">
          <div className="user-brand-content">
            <div className="user-logo">
              <img src={logo} alt="Mediconnect Logo" className="user-logo-image" />
              <span className="user-logo-text">Mediconnect</span>
            </div>
            <h1 className="user-brand-title">
              {isLogin ? 'Welcome Back!' : 'Begin Your Journey'}
            </h1>
            <p className="user-brand-subtitle">
              {isLogin 
                ? 'Connect with professional counselors and start your healing journey.' 
                : 'Join thousands of people who have found peace and clarity.'}
            </p>
            
            <div className="user-features">
              <div className="user-feature-item">
                <div className="user-feature-icon">✓</div>
                <span>24/7 Confidential Support</span>
              </div>
              <div className="user-feature-item">
                <div className="user-feature-icon">✓</div>
                <span>Expert Mental Health Professionals</span>
              </div>
              <div className="user-feature-item">
                <div className="user-feature-icon">✓</div>
                <span>Safe & Anonymous Sessions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form Section */}
        <div className="user-form-section">
          <div className="user-form-header">
            <h2>{isLogin ? 'Login to Account' : 'Create Account'}</h2>
            <p>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button onClick={toggleMode} className="user-toggle-btn" disabled={isLoading}>
                {isLogin ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </div>

          {apiError && (
            <div className="user-api-error">
              <span className="user-error-icon">⚠️</span>
              {apiError}
            </div>
          )}

          {showVerifyButton && (
            <div className="user-verify-section">
              {verifySuccess ? (
                <div className="user-verify-success">
                  <span className="user-verify-icon">✓</span>
                  <p>Verification email sent successfully! Check your inbox.</p>
                </div>
              ) : (
                <>
                  <p className="user-verify-message">
                    Your account is already logged in on another device.
                  </p>
                  <button 
                    onClick={handleVerify} 
                    className="user-verify-btn" 
                    disabled={isVerifying || isLoading}
                  >
                    {isVerifying ? (
                      <>
                        <span className="user-spinner-small"></span>
                        Sending...
                      </>
                    ) : (
                      '📧 Verify Mail'
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="user-form">
            {isLogin ? (
              /* Login Form */
              <>
                <div className="user-form-group">
                  <label className="user-label">
                    <FaEnvelope className="user-field-icon" />
                    Email Address <span className="user-required">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`user-input ${errors.email ? 'user-input-error' : ''}`}
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                  {errors.email && <span className="user-error-text">{errors.email}</span>}
                </div>

                <div className="user-form-group">
                  <label className="user-label">
                    <FaLock className="user-field-icon" />
                    Password <span className="user-required">*</span>
                  </label>
                  <div className="user-password-input">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`user-input ${errors.password ? 'user-input-error' : ''}`}
                      placeholder="Enter your password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="user-password-toggle"
                      disabled={isLoading}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {errors.password && <span className="user-error-text">{errors.password}</span>}
                </div>

                <div className="user-form-options">
                  <label className="user-checkbox">
                    <input type="checkbox" disabled={isLoading} /> Remember me
                  </label>
                  <Link to="/otp-verification">
                    <button className="user-forgot-link" disabled={isLoading}>
                      Forgot Password?
                    </button>
                  </Link>
                </div>
              </>
            ) : (
              /* Signup Form */
              <>
                <div className="user-form-grid">
                  <div className="user-form-group">
                    <label className="user-label">
                      <FaUser className="user-field-icon" />
                      Full Name <span className="user-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`user-input ${errors.fullName ? 'user-input-error' : ''}`}
                      placeholder="Enter your full name"
                      disabled={isLoading}
                    />
                    {errors.fullName && <span className="user-error-text">{errors.fullName}</span>}
                  </div>

                  <div className="user-form-group">
                    <label className="user-label">
                      <FaUser className="user-field-icon" />
                      Anonymous Name <span className="user-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="anonymous"
                      value={formData.anonymous}
                      onChange={handleChange}
                      className={`user-input ${errors.anonymous ? 'user-input-error' : ''}`}
                      placeholder="Choose an anonymous name"
                      disabled={isLoading}
                    />
                    {errors.anonymous && <span className="user-error-text">{errors.anonymous}</span>}
                  </div>

                  <div className="user-form-group">
                    <label className="user-label">
                      <FaEnvelope className="user-field-icon" />
                      Email <span className="user-required">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`user-input ${errors.email ? 'user-input-error' : ''}`}
                      placeholder="Enter your email"
                      disabled={isLoading}
                    />
                    {errors.email && <span className="user-error-text">{errors.email}</span>}
                  </div>

                  <div className="user-form-group">
                    <label className="user-label">
                      <FaPhone className="user-field-icon" />
                      Phone Number <span className="user-required">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className={`user-input ${errors.phoneNumber ? 'user-input-error' : ''}`}
                      placeholder="10 digit mobile number"
                      maxLength="10"
                      disabled={isLoading}
                    />
                    {errors.phoneNumber && <span className="user-error-text">{errors.phoneNumber}</span>}
                  </div>

                  <div className="user-form-group">
                    <label className="user-label">
                      <FaCalendarAlt className="user-field-icon" />
                      Age <span className="user-required">*</span>
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      className={`user-input ${errors.age ? 'user-input-error' : ''}`}
                      placeholder="Your age"
                      min="13"
                      max="120"
                      disabled={isLoading}
                    />
                    {errors.age && <span className="user-error-text">{errors.age}</span>}
                  </div>

                  <div className="user-form-group">
                    <label className="user-label">
                      <FaVenusMars className="user-field-icon" />
                      Gender <span className="user-required">*</span>
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className={`user-select ${errors.gender ? 'user-input-error' : ''}`}
                      disabled={isLoading}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                    {errors.gender && <span className="user-error-text">{errors.gender}</span>}
                  </div>
                </div>

                <div className="user-form-group">
                  <label className="user-label">
                    <FaLock className="user-field-icon" />
                    Password <span className="user-required">*</span>
                  </label>
                  <div className="user-password-input">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`user-input ${errors.password ? 'user-input-error' : ''}`}
                      placeholder="Create a password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="user-password-toggle"
                      disabled={isLoading}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {errors.password && <span className="user-error-text">{errors.password}</span>}
                </div>

                <div className="user-form-group">
                  <label className="user-label">
                    <FaLock className="user-field-icon" />
                    Confirm Password <span className="user-required">*</span>
                  </label>
                  <div className="user-password-input">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`user-input ${errors.confirmPassword ? 'user-input-error' : ''}`}
                      placeholder="Confirm your password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="user-password-toggle"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {errors.confirmPassword && <span className="user-error-text">{errors.confirmPassword}</span>}
                </div>
              </>
            )}

            <button 
              type="submit" 
              className={`user-submit-btn ${isLoading ? 'user-btn-loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="user-spinner"></span>
                  {isLogin ? 'Logging in...' : 'Creating Account...'}
                </>
              ) : (
                isLogin ? 'Login' : 'Create Account'
              )}
            </button>

            {!isLogin && (
              <p className="user-terms">
                By signing up, you agree to our{' '}
                <a href="#" className={isLoading ? 'user-disabled' : ''}>Terms of Service</a> and{' '}
                <a href="#" className={isLoading ? 'user-disabled' : ''}>Privacy Policy</a>
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserSignup;