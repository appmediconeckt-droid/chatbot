import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import logo from '../image/Mediconect Logo-3.png';

const Login = () => {
  // State for login credentials
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // State for loading
  const [isLoading, setIsLoading] = useState(false);
  
  // State for error messages
  const [errorMessage, setErrorMessage] = useState('');
  
  // State for success message
  const [successMessage, setSuccessMessage] = useState('');
  
  // State for show/hide password
  const [showPassword, setShowPassword] = useState(false);
  
  // Navigation hook
  const navigate = useNavigate();

  // Handle user ID change
  const handleUserIdChange = (e) => {
    setUserId(e.target.value);
    setErrorMessage('');
  };

  // Handle password change
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setErrorMessage('');
  };

  // Handle login form submission
  const handleLogin = async () => {
    if (!validateUserId()) {
      return;
    }
    
    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }
    
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    
    // Simulate API verification
    setTimeout(() => {
      setIsLoading(false);
      
      // Updated user credentials - only user ID and password
      const validUsers = [
        { userId: 'arun', password: 'arun123', role: 'admin' },
      
      ];
      
      // Check if credentials match any valid user
      const validUser = validUsers.find(
        user => user.userId === userId && user.password === password
      );
      
      if (validUser) {
        setSuccessMessage('Login successful! Redirecting...');
        
        if (rememberMe) {
          localStorage.setItem('rememberedUserId', userId);
        } else {
          localStorage.removeItem('rememberedUserId');
        }
        
        // Store user session
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userId', userId);
        sessionStorage.setItem('userRole', validUser.role);
        
        setTimeout(() => {
          navigate('/user-dashboard');
        }, 1500);
      } else {
        setErrorMessage('Invalid User ID or Password');
      }
    }, 1500);
  };

  // Validate user ID
  const validateUserId = () => {
    if (!userId) {
      setErrorMessage('Please enter your User ID');
      return false;
    }
    
    // User ID should be alphanumeric with underscores, min 3 characters
    const isValidUserId = /^[a-zA-Z0-9_]{3,20}$/.test(userId);
    
    if (!isValidUserId) {
      setErrorMessage('User ID must be 3-20 characters (letters, numbers, underscore only)');
      return false;
    }
    
    return true;
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && userId && password) {
      handleLogin();
    }
  };

  // Check for remembered user ID on component mount
  useEffect(() => {
    const rememberedUserId = localStorage.getItem('rememberedUserId');
    if (rememberedUserId) {
      setUserId(rememberedUserId);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-card-wrapper">
          <div className="auth-header-section">
            <div className="app-logo-circle">
              <img src={logo} alt="Mediconect Logo" />
            </div>
            <h1 className="app-title-text">Welcome Back</h1>
            <p className="app-subtitle-text">
              Login with your User ID and Password
            </p>
          </div>

          <div className="login-form-container">
            {/* Login Form */}
            <div className="login-form">
              {/* User ID Input */}
              <div className="input-field-group">
                <label htmlFor="user-id" className="input-label-text">
                  User ID
                </label>
                <div className="input-wrapper">
                  <i className="fas fa-user input-icon"></i>
                  <input
                    type="text"
                    id="user-id"
                    className="login-input"
                    value={userId}
                    onChange={handleUserIdChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter your User ID"
                    autoFocus
                    autoComplete="username"
                  />
                </div>
                <span className="input-hint">Use: letters, numbers, underscore (3-20 characters)</span>
              </div>

              {/* Password Input */}
              <div className="input-field-group">
                <label htmlFor="password" className="input-label-text">
                  Password
                </label>
                <div className="input-wrapper">
                  <i className="fas fa-lock input-icon"></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="login-input"
                    value={password}
                    onChange={handlePasswordChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={togglePasswordVisibility}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                <span className="input-hint">Minimum 6 characters</span>
              </div>

              {/* Login Options */}
              <div className="login-options">
                <label className="remember-me-checkbox">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkbox-text">Remember me</span>
                </label>
                <a href="#" className="forgot-password-link" onClick={(e) => e.preventDefault()}>
                  Forgot Password?
                </a>
              </div>

              {/* Login Button */}
              <button
                className="login-button"
                onClick={handleLogin}
                disabled={isLoading || !userId || !password}
              >
                {isLoading ? (
                  <span className="button-loading-spinner">
                    <i className="fas fa-spinner fa-spin"></i> Logging in...
                  </span>
                ) : (
                  'Login'
                )}
              </button>
            </div>
            
            {/* Messages */}
            {errorMessage && (
              <div className="error-message-box">
                <i className="fas fa-exclamation-circle error-icon"></i>
                <span className="error-message-text">{errorMessage}</span>
              </div>
            )}
            
            {successMessage && (
              <div className="success-message-box">
                <i className="fas fa-check-circle success-icon"></i>
                <span className="success-message-text">{successMessage}</span>
              </div>
            )}
          </div>

          <div className="login-footer">
             Don't have an account? 
            <Link to="/role-selector" className="create-account-link">
             <span className="create-account-text"> Sign Up</span>
            </Link>
            <p className="footer-text">
              By continuing, you agree to our 
              <a href="#" className="footer-link" onClick={(e) => e.preventDefault()}> Terms</a> and 
              <a href="#" className="footer-link" onClick={(e) => e.preventDefault()}> Privacy Policy</a>
            </p>
          </div>
        </div>
        
        {/* Demo credentials - Updated with only User ID */}
        
      </div>
    </div>
  );
};

export default Login;