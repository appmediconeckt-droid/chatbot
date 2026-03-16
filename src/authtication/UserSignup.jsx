import React, { useState } from 'react';
import { FaEnvelope, FaLock, FaUser, FaPhone, FaCalendarAlt, FaVenusMars } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './UserSignup.css';
import logo from '../image/Mediconect Logo-3.png';

const UserSignup = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    // Login Fields
    email: '',
    password: '',
    
    // Signup Fields
    fullName: '',
    username: '',
    phoneNumber: '',
    age: '',
    gender: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
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
    if (!formData.username) newErrors.username = 'anonymous is required';
    
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
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (isLogin) {
      const loginErrors = validateLogin();
      if (Object.keys(loginErrors).length === 0) {
        // Simulate API call
        setTimeout(() => {
          setIsLoading(false);
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('userType', 'user');
          localStorage.setItem('userEmail', formData.email);
          navigate('/user-dashboard');
        }, 1500);
      } else {
        setIsLoading(false);
        setErrors(loginErrors);
      }
    } else {
      const signupErrors = validateSignup();
      if (Object.keys(signupErrors).length === 0) {
        // Simulate API call
        setTimeout(() => {
          setIsLoading(false);
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('userType', 'user');
          localStorage.setItem('userName', formData.fullName);
          localStorage.setItem('userEmail', formData.email);
          navigate('/user-dashboard');
        }, 1500);
      } else {
        setIsLoading(false);
        setErrors(signupErrors);
      }
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setFormData({
      email: '',
      password: '',
      fullName: '',
      username: '',
      phoneNumber: '',
      age: '',
      gender: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="user-wrapper">
      <div className="user-container">
        {/* Left Side - Brand Section */}
        <div className="user-brand-section">
          <div className="user-brand-content">
            <div className="user-logo">
              <span className="user-logo-icon">🧠</span>
              <span className="user-logo-text">MindSpace</span>
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
              <button onClick={toggleMode} className="user-toggle-btn">
                {isLogin ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </div>

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
                  <a href="#" className={`user-forgot-link ${isLoading ? 'user-disabled' : ''}`}>
                    Forgot password?
                  </a>
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
                      anonymous <span className="user-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`user-input ${errors.username ? 'user-input-error' : ''}`}
                      placeholder="Choose a username"
                      disabled={isLoading}
                    />
                    {errors.username && <span className="user-error-text">{errors.username}</span>}
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