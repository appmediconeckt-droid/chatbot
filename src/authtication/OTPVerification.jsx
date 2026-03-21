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
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const inputRefs = useRef([]);

  // ✅ TIMER (2 MIN)
  useEffect(() => {
    let interval;

    if (step === 'otp' && timer > 0 && !canResend) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [step, timer, canResend]);

  // ✅ FORMAT TIMER MM:SS
  const formatTime = (time) => {
    const min = Math.floor(time / 60);
    const sec = time % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // ✅ SEND OTP
  const handleSendCode = async (e) => {
    e.preventDefault();

    if (!email) return setError('Enter valid email');

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/generateOtp`, {
        email
      });

      if (res.data.success) {
        setStep('otp');
        setTimer(120);
        setCanResend(false);
        setUserEmail(email);
        setSuccess('OTP sent successfully');

        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ OTP INPUT
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ✅ VERIFY OTP
  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) return setError('Enter complete OTP');

    setIsLoading(true);
    setError('');

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/verifyOtp`, {
        email,
        otp: otpString
      });

      if (res.data.success) {
        localStorage.setItem('accessToken', res.data.token);
        updateVerificationStatus(true);

        setSuccess('Login successful');

        setTimeout(() => navigate('/user-dashboard'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ 🔥 RESEND OTP (FIXED API)
  const handleResendOtp = async () => {
    if (!canResend) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await axios.post(
        `${API_BASE_URL}/auth/resendOtp`,
        { email }
      );

      if (res.data.success) {
        setSuccess('OTP resent successfully');
        setTimer(120);
        setCanResend(false);

        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Resend failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="otp-container">
      <div className="otp-card">

        <h2>{step === 'email' ? 'Login with Email' : 'Verify OTP'}</h2>

        {step === 'email' ? (
          <form onSubmit={handleSendCode}>
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {error && <p className="otp-error">{error}</p>}
            {success && <p className="otp-success">{success}</p>}

            <button disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <>
            <div className="otp-input-group">
              {otp.map((d, i) => (
                <input
                  key={i}
                  value={d}
                  maxLength="1"
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  ref={(el) => (inputRefs.current[i] = el)}
                />
              ))}
            </div>

            {error && <p className="otp-error">{error}</p>}
            {success && <p className="otp-success">{success}</p>}

            {/* ✅ TIMER */}
            <div>
              {canResend ? (
                <button onClick={handleResendOtp}>
                  Resend OTP
                </button>
              ) : (
                <p>Resend in {formatTime(timer)}</p>
              )}
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={otp.join('').length !== 6}
            >
              Verify OTP
            </button>
          </>
        )}

      </div>
    </div>
  );
};

export default OTPVerification;