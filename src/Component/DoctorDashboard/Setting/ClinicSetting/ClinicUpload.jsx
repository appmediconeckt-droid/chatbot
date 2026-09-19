import React, { useState } from "react";
import { useDoctorUser } from "../../doctorApi.js";
import axios from "../../../../axiosConfig.js";
import { API_BASE_URL, getAuthToken } from "../../doctorApi.js";
import "./ClinicSettings.css";

export default function ClinicSettings() {
  const [clinicName, setClinicName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [photos, setPhotos] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const authUser = useDoctorUser();
  const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('authUser') || 'null') : null;
  const user = authUser || storedUser;
  
  const extractDoctorId = (userObj) => {
    if (!userObj) return '';
    return (
      userObj.id ||
      userObj.user_id ||
      userObj.doctor_id ||
      userObj._id ||
      userObj.userId ||
      userObj.doctorId ||
      userObj.Id ||
      ''
    );
  };
  
  const doctorId = extractDoctorId(user);

  React.useEffect(() => {
    console.log('=== ClinicUpload Debug ===');
    console.log('authUser:', authUser);
    console.log('storedUser:', storedUser);
    console.log('user:', user);
    console.log('doctorId:', doctorId);
    if (user) {
      console.log('User object keys:', Object.keys(user));
      console.log('Full user object:', JSON.stringify(user, null, 2));
    }
    console.log('========================');
  }, [authUser, storedUser, user, doctorId]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => alert("Unable to fetch current location")
    );
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    setPhotos(files);

    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const handleSave = async () => {
    const token = getAuthToken();
    console.log('Form validation:', { clinicName, phone, address, doctorId, token, hasToken: !!token });

    if (!clinicName || !phone || !address || !doctorId) {
      const missingFields = [];
      if (!clinicName) missingFields.push('Clinic Name');
      if (!phone) missingFields.push('Phone');
      if (!address) missingFields.push('Address');
      if (!doctorId) missingFields.push('Doctor ID (not logged in or ID missing)');
      
      const errorMsg = `Missing: ${missingFields.join(', ')}. Doctor ID: "${doctorId}"`;
      setMessage(errorMsg);
      setStatus('failed');
      console.log('Validation failed:', errorMsg);
      return;
    }

    const formData = new FormData();
    formData.append('doctor_id', doctorId);
    formData.append('clinic_name', clinicName);
    formData.append('phone_number', phone);
    formData.append('location', address);

    photos.forEach((photo) => {
      formData.append('clinic_photo', photo);
    });

    try {
      setStatus('loading');
      setMessage('Creating clinic...');

      const response = await axios.post(`${API_BASE_URL}/clinics`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStatus('succeeded');
      setMessage('Clinic created successfully.');
      console.log('Clinic creation response:', response.data);
    } catch (error) {
      setStatus('failed');
      const errorMessage = error.response?.data || error.message || 'Failed to create clinic';
      setMessage(errorMessage);
      console.error('Clinic creation error:', error);
    }
  };

  const handleCancel = () => {
    setClinicName("");
    setPhone("");
    setAddress("");
    setLocation({ lat: null, lng: null });
    setPhotos([]);
    setPreviewUrls([]);
    setStatus('idle');
    setMessage('');
  };

  return (
    <div className="clinic-settings">
      <div className="clinic-settings-container">
        <div className="clinic-header">
          <h2>Clinic Settings</h2>
          <p>Manage your clinic information and location</p>
        </div>

        <div className="clinic-form">
          {/* Clinic Name */}
          <div className="form-group">
            <label className="form-label">
              <span className="required-star">*</span> Clinic Name
            </label>
            <input
              type="text"
              className="form-input"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="Enter clinic name"
            />
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label className="form-label">
              <span className="required-star">*</span> Phone Number
            </label>
            <input
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
              maxLength={10}
            />
          </div>

          {/* Location Section */}
          <div className="form-section">
            <div className="section-header">
              <h3>📍 Location Details</h3>
              <span className="required-badge">Required</span>
            </div>
            
            <div className="form-group">
              <label className="form-label">
                <span className="required-star">*</span> Full Address
              </label>
              <textarea
                className="form-textarea"
                placeholder="Enter complete clinic address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows="3"
              />
            </div>

            <button className="btn-location" onClick={getCurrentLocation}>
              📍 Get Current Location
            </button>

            {location.lat && (
              <div className="location-coordinates">
                <div className="coord-box">
                  <span className="coord-label">Latitude:</span>
                  <span className="coord-value">{location.lat}</span>
                </div>
                <div className="coord-box">
                  <span className="coord-label">Longitude:</span>
                  <span className="coord-value">{location.lng}</span>
                </div>
              </div>
            )}
          </div>

          {/* Upload Photos */}
          <div className="form-section">
            <div className="section-header">
              <h3>📸 Clinic Photos</h3>
              <span className="optional-badge">Optional</span>
            </div>
            
            <div className="upload-area">
              <label className="upload-label">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="upload-input"
                />
                <div className="upload-content">
                  <span className="upload-icon">📷</span>
                  <p>Click or drag to upload clinic photos</p>
                  <small>Supports JPG, PNG, GIF (Max 5MB each)</small>
                </div>
              </label>
            </div>
          </div>

          {/* Photo Preview */}
          {previewUrls.length > 0 && (
            <div className="photo-preview-section">
              <h4>Photo Preview ({previewUrls.length})</h4>
              <div className="preview-grid">
                {previewUrls.map((src, i) => (
                  <div className="preview-card" key={i}>
                    <img src={src} alt={`preview-${i}`} />
                    <div className="preview-info">
                      <span>Photo {i + 1}</span>
                      <button 
                        className="remove-photo"
                        onClick={() => {
                          const newPhotos = photos.filter((_, index) => index !== i);
                          const newUrls = previewUrls.filter((_, index) => index !== i);
                          setPhotos(newPhotos);
                          setPreviewUrls(newUrls);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`alert-message alert-${status}`}>
              {status === 'loading' && <span className="alert-icon">⏳</span>}
              {status === 'succeeded' && <span className="alert-icon">✅</span>}
              {status === 'failed' && <span className="alert-icon">❌</span>}
              <span>{message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="btn-cancel" onClick={handleCancel}>
              Cancel
            </button>
            <button className="btn-save" onClick={handleSave}>
              {status === 'loading' ? 'Saving...' : 'Save Clinic'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}