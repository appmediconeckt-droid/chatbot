import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../axiosConfig';
import { updateVerificationStatus, setUserEmail, getAccessToken } from './authUtils';
import './OTPVerification.css';

const OTPVerification = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60 * 2); // 2 minutes timer
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRefs = useRef([]);

  // Clear timer on unmount
  useEffect(() => {
    let interval;
    if (step === 'otp' && timer > 0 && !canResend) {
      interval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            setCanResend(true);
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer, canResend]);

  // Handle email submission
  const handleSendCode = async (e) => {
    e.preventDefault();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Sending OTP to:', email);
      
      const response = await axios.post(
        `${API_BASE_URL}/auth/generateOtp`,
        { email: email },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      console.log('Generate OTP response:', response.data);

      // Check different response structures
      if (response.data && (response.data.success === true || response.data.status === 'success' || response.data.message)) {
        setSuccess('Verification code sent to your email!');
        setStep('otp');
        setTimer(120);
        setCanResend(false);
        setUserEmail(email);
        
        // Focus first OTP input
        setTimeout(() => {
          if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
          }
        }, 100);
      } else {
        throw new Error(response.data.message || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Send code error:', error);
      
      // Handle different error types
      if (error.code === 'ECONNABORTED') {
        setError('Request timeout. Please check your internet connection.');
      } else if (error.response) {
        // Server responded with error
        setError(error.response.data?.message || 'Server error. Please try again.');
      } else if (error.request) {
        // Request made but no response
        setError('No response from server. Please check your connection.');
      } else {
        setError(error.message || 'Failed to send verification code. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const pastedOtp = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedOtp.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      
      // Focus last filled input
      const lastFilledIndex = Math.min(pastedOtp.length - 1, 5);
      if (inputRefs.current[lastFilledIndex]) {
        inputRefs.current[lastFilledIndex].focus();
      }
    } else if (/^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value !== '' && index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace
      if (inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter complete 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Verifying OTP:', { email, otp: otpString });
      
      const token = getAccessToken();
      
      const response = await axios.post(
        `${API_BASE_URL}/auth/verifyOtp`,
        {
          email: email,
          otp: otpString
        },
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      console.log('Verify OTP response:', response.data);

      // Check different response structures
      if (response.data && (response.data.success === true || response.data.status === 'success')) {
        setSuccess('Login successful!');
        
        // Store auth token if provided
        if (response.data.token || response.data.accessToken) {
          const accessToken = response.data.token || response.data.accessToken;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('isAuthenticated', 'true');
        }
        
        // Store user data if provided
        if (response.data.user) {
          localStorage.setItem('userData', JSON.stringify(response.data.user));
        }
        
        // Update verification status
        updateVerificationStatus(true);
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
          navigate('/user-dashboard');
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      
      if (error.code === 'ECONNABORTED') {
        setError('Request timeout. Please try again.');
      } else if (error.response) {
        // Server responded with error
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error || 'Verification failed';
        
        if (status === 400) {
          setError(message || 'Invalid OTP. Please try again.');
        } else if (status === 401) {
          setError(message || 'OTP has expired. Please request a new one.');
        } else if (status === 404) {
          setError('API endpoint not found. Please check server configuration.');
        } else if (status === 500) {
          setError('Server error. Please try again later.');
        } else {
          setError(message);
        }
      } else if (error.request) {
        setError('No response from server. Please check your internet connection.');
      } else {
        setError(error.message || 'Verification failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Resending OTP to:', email);
      
      const token = getAccessToken();
      
      const response = await axios.post(
        `${API_BASE_URL}/auth/resend-otp`,
        { email: email },
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      console.log('Resend OTP response:', response.data);

      if (response.data && (response.data.success === true || response.data.status === 'success')) {
        setSuccess('OTP resent successfully!');
        setTimer(120);
        setCanResend(false);
        
        // Clear OTP fields
        setOtp(['', '', '', '', '', '']);
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      } else {
        throw new Error(response.data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      
      if (error.code === 'ECONNABORTED') {
        setError('Request timeout. Please try again.');
      } else if (error.response) {
        setError(error.response.data?.message || 'Failed to resend OTP. Please try again.');
      } else if (error.request) {
        setError('No response from server. Please check your connection.');
      } else {
        setError(error.message || 'Failed to resend OTP. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setOtp(['', '', '', '', '', '']);
    setError('');
    setSuccess('');
    setTimer(60);
    setCanResend(false);
  };

  return (
    <div className="otp-container">
      <div className="otp-card">
        <div className="otp-header">
          <h2>{step === 'email' ? 'Login with Email' : 'Verify OTP'}</h2>
          {step === 'otp' && (
            <p className="otp-email-info">Code sent to: {email}</p>
          )}
        </div>

        <div className="otp-form">
          {step === 'email' ? (
            // Email Input Step
            <form onSubmit={handleSendCode}>
              <div className="email-input-group">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="email-input"
                  disabled={isLoading}
                  autoFocus
                  required
                />
              </div>

              {error && <div className="otp-error">{error}</div>}
              {success && <div className="otp-success">{success}</div>}

              <button
                type="submit"
                disabled={isLoading}
                className="otp-verify-btn"
              >
                {isLoading ? 'Sending...' : 'Send Code'}
              </button>
            </form>
          ) : (
            // OTP Verification Step
            <>
              <div className="otp-input-group">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    ref={(el) => (inputRefs.current[index] = el)}
                    className="otp-input"
                    disabled={isLoading}
                    inputMode="numeric"
                    pattern="\d*"
                  />
                ))}
              </div>

              {error && <div className="otp-error">{error}</div>}
              {success && <div className="otp-success">{success}</div>}

              <div className="otp-timer">
                {canResend ? (
                  <button
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="otp-resend-btn"
                  >
                    Resend OTP
                  </button>
                ) : (
                  <p>Resend OTP in {timer} seconds</p>
                )}
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={isLoading || otp.join('').length !== 6}
                className="otp-verify-btn"
              >
                {isLoading ? 'Verifying...' : 'Verify & Login'}
              </button>

              <button
                onClick={handleBackToEmail}
                className="otp-back-btn"
                type="button"
              >
                Change Email
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;