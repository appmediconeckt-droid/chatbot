import React, { useState } from 'react';
import { FaBrain, FaEnvelope, FaLock, FaUser, FaPhone, FaIdCard, FaGraduationCap, FaBriefcase, FaMapMarkerAlt, FaCalendarAlt, FaVenusMars, FaUsers } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './CounselorSignup.css';
import logo from '../image/Mediconect Logo-3.png';
import axios from 'axios';


const CounselorSignup = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    // Login Fields
    email: '',
    password: '',

    // Signup Fields
    fullName: '',

    phoneNumber: '',
    age: '',
    gender: '',
    qualification: '',
    specialization: '',
    experience: '',
    location: '',
    consultationMode: [],
    languages: [],
    aboutMe: '',
    profilePhoto: null,
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const consultationModes = ['Online', 'Offline', 'Both'];
  const languageOptions = ['Hindi', 'English', 'Gujarati', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Punjabi'];

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'file') {
      setFormData({ ...formData, [name]: files[0] });
    } else if (type === 'checkbox') {
      if (name === 'consultationMode') {
        let updatedModes = [...formData.consultationMode];
        if (checked) {
          updatedModes.push(value);
        } else {
          updatedModes = updatedModes.filter(mode => mode !== value);
        }
        setFormData({ ...formData, consultationMode: updatedModes });
      } else if (name === 'languages') {
        let updatedLanguages = [...formData.languages];
        if (checked) {
          updatedLanguages.push(value);
        } else {
          updatedLanguages = updatedLanguages.filter(lang => lang !== value);
        }
        setFormData({ ...formData, languages: updatedLanguages });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }

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
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    return newErrors;
  };

  const validateSignup = () => {
    const newErrors = {};

    // Required Fields Validation
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
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
    } else if (formData.age < 18 || formData.age > 100) {
      newErrors.age = 'Age must be between 18 and 100';
    }
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.qualification) newErrors.qualification = 'Qualification is required';
    if (!formData.specialization) newErrors.specialization = 'Specialization is required';
    if (!formData.experience) {
      newErrors.experience = 'Experience is required';
    } else if (formData.experience < 0) {
      newErrors.experience = 'Experience cannot be negative';
    }
    if (!formData.location) newErrors.location = 'Location is required';
    if (formData.consultationMode.length === 0) {
      newErrors.consultationMode = 'Select at least one consultation mode';
    }
    if (formData.languages.length === 0) {
      newErrors.languages = 'Select at least one language';
    }
    if (!formData.aboutMe) newErrors.aboutMe = 'About me is required';

    // Password Validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase and number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };



  const API_BASE_URL = "https://td6lmn5q-5000.inc1.devtunnels.ms/api/auth";
// CounselorSignup.jsx - Fixed storage keys
// Only showing the login handler part - keep everything else the same
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    if (isLogin) {
      const loginErrors = validateLogin();
      if (Object.keys(loginErrors).length > 0) {
        setErrors(loginErrors);
        setIsLoading(false);
        return;
      }

      const response = await axios.post(`${API_BASE_URL}/login`, {
        email: formData.email,
        password: formData.password,
      });

      console.log("Login Response:", response.data);

      if (response.data.success) {
        // Store tokens with consistent keys
        localStorage.setItem("accessToken", response.data.accessToken);
        localStorage.setItem("refreshToken", response.data.refreshToken);
        localStorage.setItem("userData", JSON.stringify(response.data.user));
        localStorage.setItem("userRole", response.data.user.role);
        localStorage.setItem("userEmail", formData.email);
        localStorage.setItem("isAuthenticated", "true");
        
        // Also store for backward compatibility
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
        }
        
        navigate("/counselor-dashboard");
      } else {
        alert(response.data.message || "Login failed");
      }
    } else {
      // Signup logic remains the same...
      const signupErrors = validateSignup();
      if (Object.keys(signupErrors).length > 0) {
        setErrors(signupErrors);
        setIsLoading(false);
        return;
      }

      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phoneNum: formData.phoneNumber.trim(),
        age: Number(formData.age),
        gender: formData.gender.toLowerCase(),
        qualification: formData.qualification.trim(),
        specialization: formData.specialization.trim(),
        experience: Number(formData.experience),
        location: formData.location.trim(),
        consultationMode: formData.consultationMode.map(m => m.toLowerCase()),
        languages: formData.languages,
        aboutMe: formData.aboutMe.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword
      };

      const response = await axios.post(`${API_BASE_URL}/register/counsellor`, payload);

      console.log("Signup Response:", response.data);

      if (response.data.success) {
        alert("Counsellor registered successfully! Please login.");
        setIsLogin(true);
        setFormData({
          email: '',
          password: '',
          fullName: '',
          phoneNumber: '',
          age: '',
          gender: '',
          qualification: '',
          specialization: '',
          experience: '',
          location: '',
          consultationMode: [],
          languages: [],
          aboutMe: '',
          profilePhoto: null,
          confirmPassword: ''
        });
      } else {
        alert(response.data.message || "Registration failed");
      }
    }
  } catch (error) {
    console.error("API Error:", error);
    const errorMessage = error.response?.data?.message || "Something went wrong";
    alert(errorMessage);
  } finally {
    setIsLoading(false);
  }
};
  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setIsLoading(true);

  //   try {
  //     if (isLogin) {
  //       // ================= LOGIN API =================
  //       const loginErrors = validateLogin();
  //       if (Object.keys(loginErrors).length > 0) {
  //         setErrors(loginErrors);
  //         setIsLoading(false);
  //         return;
  //       }

  //       const response = await axios.post(`${API_BASE_URL}/login`, {
  //         email: formData.email,
  //         password: formData.password,
  //       });

  //       console.log("Login Response:", response.data);

  //       if (response.data.success) {
  //         localStorage.setItem("isAuthenticated", "true");
  //         localStorage.setItem("userEmail", formData.email);
  //         localStorage.setItem("token", response.data.token); // if backend sends token

  //         navigate("/counselor-dashboard");
  //       }

  //     } else {
  //       // ================= SIGNUP API =================
  //       const signupErrors = validateSignup();
  //       if (Object.keys(signupErrors).length > 0) {
  //         setErrors(signupErrors);
  //         setIsLoading(false);
  //         return;
  //       }

  //       const payload = {
  //         fullName: formData.fullName.trim(),
  //         email: formData.email.trim(),
  //         phoneNumber: formData.phoneNumber.trim(),
  //         age: Number(formData.age),
  //         gender: formData.gender, // "Male"
  //         qualification: formData.qualification.trim(),
  //         specialization: formData.specialization.trim(),
  //         experience: Number(formData.experience),
  //         location: formData.location.trim(),
  //         consultationMode: formData.consultationMode,
  //         languages: formData.languages,
  //         aboutMe: formData.aboutMe.trim(),
  //         password: formData.password,
  //         confirmPassword: formData.confirmPassword
  //       };

  //       const response = await axios.post(`${API_BASE_URL}/register/counsellor`, payload);

  //       console.log("Signup Response:", response.data);

  //       if (response.data.success) {
  //         localStorage.setItem("isAuthenticated", "true");
  //         localStorage.setItem("userName", formData.fullName);
  //         localStorage.setItem("userEmail", formData.email);

  //         navigate("/counselor-dashboard");
  //       }
  //     }

  //   } catch (error) {
  //     console.error("API Error:", error);

  //     if (error.response && error.response.data) {
  //       alert(error.response.data.message || "Something went wrong");
  //     } else {
  //       alert("Server error. Try again later.");
  //     }

  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setFormData({
      email: '',
      password: '',
      fullName: '',

      phoneNumber: '',
      age: '',
      gender: '',
      qualification: '',
      specialization: '',
      experience: '',
      location: '',
      consultationMode: [],
      languages: [],
      aboutMe: '',
      profilePhoto: null,
      confirmPassword: ''
    });
  };

  return (
    <div className="menthy-wrapper">
      <div className="menthy-container">
        {/* Left Side - Brand Section */}
        <div className="menthy-brand-section">
          <div className="menthy-brand-content">
            <div className="menthy-logo ">
              <img src={logo} height={50} alt="Mediconect Logo" className="menthy-logo-icon" />

              <span className="menthy-logo-text">Counselors</span>
            </div>
            <h1 className="menthy-brand-title">
              {isLogin ? 'Welcome Back!' : 'Join Our Community'}
            </h1>
            <p className="menthy-brand-subtitle">
              {isLogin
                ? 'Connect with expert counselors and find the support you need.'
                : 'Start your journey as a certified mental health counselor.'}
            </p>

            <div className="menthy-features">
              <div className="menthy-feature-item">
                <div className="menthy-feature-icon">✓</div>
                <span>Expert Counselors</span>
              </div>
              <div className="menthy-feature-item">
                <div className="menthy-feature-icon">✓</div>
                <span>24/7 Support</span>
              </div>
              <div className="menthy-feature-item">
                <div className="menthy-feature-icon">✓</div>
                <span>Confidential Sessions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form Section (scrolls internally) */}
        <div className="menthy-form-section">
          <div className="menthy-form-header">
            <h2>{isLogin ? 'Login to Account' : 'Create Account'}</h2>
            <p>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button onClick={toggleMode} className="menthy-toggle-btn">
                {isLogin ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="menthy-form">
            {isLogin ? (
              /* Login Form Fields */
              <>
                <div className="menthy-form-group">
                  <label className="menthy-label">
                    <FaEnvelope className="menthy-field-icon" />
                    Email Address <span className="menthy-required">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`menthy-input ${errors.email ? 'menthy-input-error' : ''}`}
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                  {errors.email && <span className="menthy-error-text">{errors.email}</span>}
                </div>

                <div className="menthy-form-group">
                  <label className="menthy-label">
                    <FaLock className="menthy-field-icon" />
                    Password <span className="menthy-required">*</span>
                  </label>
                  <div className="menthy-password-input">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`menthy-input ${errors.password ? 'menthy-input-error' : ''}`}
                      placeholder="Enter your password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="menthy-password-toggle"
                      disabled={isLoading}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {errors.password && <span className="menthy-error-text">{errors.password}</span>}
                </div>

                <div className="menthy-form-options">
                  <label className="menthy-checkbox">
                    <input type="checkbox" disabled={isLoading} /> Remember me
                  </label>
                  <a href="#" className={`menthy-forgot-link ${isLoading ? 'menthy-disabled' : ''}`}>Forgot password?</a>
                </div>
              </>
            ) : (
              /* Signup Form Fields */
              <>
                <div className="menthy-form-grid">
                  {/* Personal Information */}
                  <div className="menthy-form-group">
                    <label className="menthy-label">
                      <FaUser className="menthy-field-icon" />
                      Full Name <span className="menthy-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`menthy-input ${errors.fullName ? 'menthy-input-error' : ''}`}
                      placeholder="Enter your full name"
                      disabled={isLoading}
                    />
                    {errors.fullName && <span className="menthy-error-text">{errors.fullName}</span>}
                  </div>



                  <div className="menthy-form-group">
                    <label className="menthy-label">
                      <FaEnvelope className="menthy-field-icon" />
                      Email <span className="menthy-required">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`menthy-input ${errors.email ? 'menthy-input-error' : ''}`}
                      placeholder="Enter your email"
                      disabled={isLoading}
                    />
                    {errors.email && <span className="menthy-error-text">{errors.email}</span>}
                  </div>

                  <div className="menthy-form-group">
                    <label className="menthy-label">
                      <FaPhone className="menthy-field-icon" />
                      Phone Number <span className="menthy-required">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className={`menthy-input ${errors.phoneNumber ? 'menthy-input-error' : ''}`}
                      placeholder="10 digit mobile number"
                      maxLength="10"
                      disabled={isLoading}
                    />
                    {errors.phoneNumber && <span className="menthy-error-text">{errors.phoneNumber}</span>}
                  </div>

                  <div className="menthy-form-group">
                    <label className="menthy-label">
                      <FaCalendarAlt className="menthy-field-icon" />
                      Age <span className="menthy-required">*</span>
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      className={`menthy-input ${errors.age ? 'menthy-input-error' : ''}`}
                      placeholder="Your age"
                      min="18"
                      max="100"
                      disabled={isLoading}
                    />
                    {errors.age && <span className="menthy-error-text">{errors.age}</span>}
                  </div>

                  <div className="menthy-form-group">
                    <label className="menthy-label">
                      <FaVenusMars className="menthy-field-icon" />
                      Gender <span className="menthy-required">*</span>
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className={`menthy-select ${errors.gender ? 'menthy-input-error' : ''}`}
                      disabled={isLoading}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.gender && <span className="menthy-error-text">{errors.gender}</span>}
                  </div>

                  <div className="menthy-form-group">
                    <label className="menthy-label">
                      <FaGraduationCap className="menthy-field-icon" />
                      Qualification <span className="menthy-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleChange}
                      className={`menthy-input ${errors.qualification ? 'menthy-input-error' : ''}`}
                      placeholder="e.g., M.Sc Psychology"
                      disabled={isLoading}
                    />
                    {errors.qualification && <span className="menthy-error-text">{errors.qualification}</span>}
                  </div>

                  <div className="menthy-form-group">
                    <label className="menthy-label">
                      <FaIdCard className="menthy-field-icon" />
                      Specialization <span className="menthy-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className={`menthy-input ${errors.specialization ? 'menthy-input-error' : ''}`}
                      placeholder="e.g., Clinical Psychology"
                      disabled={isLoading}
                    />
                    {errors.specialization && <span className="menthy-error-text">{errors.specialization}</span>}
                  </div>

                  <div className="menthy-form-group">
                    <label className="menthy-label">
                      <FaBriefcase className="menthy-field-icon" />
                      Experience (Years) <span className="menthy-required">*</span>
                    </label>
                    <input
                      type="number"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      className={`menthy-input ${errors.experience ? 'menthy-input-error' : ''}`}
                      placeholder="Years of experience"
                      min="0"
                      step="0.5"
                      disabled={isLoading}
                    />
                    {errors.experience && <span className="menthy-error-text">{errors.experience}</span>}
                  </div>

                  <div className="menthy-form-group">
                    <label className="menthy-label">
                      <FaMapMarkerAlt className="menthy-field-icon" />
                      Location <span className="menthy-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className={`menthy-input ${errors.location ? 'menthy-input-error' : ''}`}
                      placeholder="City, State"
                      disabled={isLoading}
                    />
                    {errors.location && <span className="menthy-error-text">{errors.location}</span>}
                  </div>
                </div>

                {/* Consultation Mode */}
                <div className="menthy-form-group">
                  <label className="menthy-label">
                    <FaUsers className="menthy-field-icon" />
                    Consultation Mode <span className="menthy-required">*</span>
                  </label>
                  <div className="menthy-checkbox-group">
                    {consultationModes.map(mode => (
                      <label key={mode} className="menthy-checkbox-label">
                        <input
                          type="checkbox"
                          name="consultationMode"
                          value={mode}
                          checked={formData.consultationMode.includes(mode)}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                        {mode}
                      </label>
                    ))}
                  </div>
                  {errors.consultationMode && <span className="menthy-error-text">{errors.consultationMode}</span>}
                </div>

                {/* Languages */}
                <div className="menthy-form-group">
                  <label className="menthy-label">Languages <span className="menthy-required">*</span></label>
                  <div className="menthy-checkbox-group">
                    {languageOptions.map(lang => (
                      <label key={lang} className="menthy-checkbox-label">
                        <input
                          type="checkbox"
                          name="languages"
                          value={lang}
                          checked={formData.languages.includes(lang)}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                        {lang}
                      </label>
                    ))}
                  </div>
                  {errors.languages && <span className="menthy-error-text">{errors.languages}</span>}
                </div>

                {/* About Me */}
                <div className="menthy-form-group">
                  <label className="menthy-label">About Me <span className="menthy-required">*</span></label>
                  <textarea
                    name="aboutMe"
                    value={formData.aboutMe}
                    onChange={handleChange}
                    className={`menthy-textarea ${errors.aboutMe ? 'menthy-input-error' : ''}`}
                    placeholder="Tell us about yourself, your approach, and expertise..."
                    rows="4"
                    disabled={isLoading}
                  />
                  {errors.aboutMe && <span className="menthy-error-text">{errors.aboutMe}</span>}
                </div>

                {/* Profile Photo */}
                <div className="menthy-form-group">
                  <label className="menthy-label">Profile Photo</label>
                  <input
                    type="file"
                    name="profilePhoto"
                    onChange={handleChange}
                    accept="image/*"
                    className="menthy-file-input"
                    disabled={isLoading}
                  />
                </div>

                {/* Password Fields */}
                <div className="menthy-form-group">
                  <label className="menthy-label">
                    <FaLock className="menthy-field-icon" />
                    Password <span className="menthy-required">*</span>
                  </label>
                  <div className="menthy-password-input">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`menthy-input ${errors.password ? 'menthy-input-error' : ''}`}
                      placeholder="Create a password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="menthy-password-toggle"
                      disabled={isLoading}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {errors.password && <span className="menthy-error-text">{errors.password}</span>}
                </div>

                <div className="menthy-form-group">
                  <label className="menthy-label">
                    <FaLock className="menthy-field-icon" />
                    Confirm Password <span className="menthy-required">*</span>
                  </label>
                  <div className="menthy-password-input">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`menthy-input ${errors.confirmPassword ? 'menthy-input-error' : ''}`}
                      placeholder="Confirm your password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="menthy-password-toggle"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {errors.confirmPassword && <span className="menthy-error-text">{errors.confirmPassword}</span>}
                </div>
              </>
            )}

            <button
              type="submit"
              className={`menthy-submit-btn ${isLoading ? 'menthy-btn-loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="menthy-spinner"></span>
                  {isLogin ? 'Logging in...' : 'Creating Account...'}
                </>
              ) : (
                isLogin ? 'Login' : 'Create Account'
              )}
            </button>

            {!isLogin && (
              <p className="menthy-terms">
                By signing up, you agree to our{' '}
                <a href="#" className={isLoading ? 'menthy-disabled' : ''}>Terms of Service</a> and{' '}
                <a href="#" className={isLoading ? 'menthy-disabled' : ''}>Privacy Policy</a>
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CounselorSignup;